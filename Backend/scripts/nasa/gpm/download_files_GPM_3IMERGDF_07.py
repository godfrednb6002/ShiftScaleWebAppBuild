#!/usr/bin/env python3
"""
Python script for downloading data from the NASA CMR API

Requirements:
    > pip install requests tqdm

To run the script: `python download_files_GPM_3IMERGDF_07.py`
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import os
from pathlib import Path
import tempfile
from urllib.parse import unquote, urlparse

import requests
from tqdm import tqdm

CMR_BASE_URL = "https://cmr.earthdata.nasa.gov"

SHORT_NAME = "GPM_3IMERGDF"
VERSION = "07"
FILTER_TEMPORAL = "2020-01-01T00:00:00Z,2025-12-31T23:59:59Z"
FILTER_BBOX = "-3.3,4.5,1.2,11.2"
FILTER_SEARCH = ""
FILTER_CLOUD_COVER_MIN = ""
FILTER_CLOUD_COVER_MAX = ""
BACKEND_DIR = Path(__file__).resolve().parents[3]
DOWNLOAD_DIR = BACKEND_DIR / "data" / "nasa" / "gpm" / "raw"
MAX_WORKERS = 5  # Number of parallel downloads

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def require_earthdata_credentials() -> None:
    """Require netrc Earthdata credentials without reading or logging their values."""
    if requests.utils.get_netrc_auth("https://urs.earthdata.nasa.gov") is None:
        raise RuntimeError(
            "Earthdata Login credentials were not found. Configure a netrc file "
            "(~/.netrc or ~/_netrc on Windows) with a machine entry for "
            "urs.earthdata.nasa.gov, or set the NETRC environment variable."
        )


def query_cmr_granules(
    short_name: str,
    version: str,
    page_size: int = 2000,
    search_after: str | None = None,
    **extra_params,
):
    """
    Queries the CMR granules endpoint.

    Args:
        short_name: The short name of the collection
        version: The version of the collection
        page_size: The number of results per page (max is 2000)
        search_after: The pagination token for subsequent requests (optional, see https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#search-after for more details)
        **extra_params: Additional query parameters (e.g., temporal, bounding_box, etc.)

    Returns:
        tuple: (response object, list of granule items)
    """
    url = f"{CMR_BASE_URL}/search/granules.umm_json"

    params = {
        "short_name": short_name,
        "version": version,
        "page_size": page_size,
        **extra_params,  # Merge any additional parameters
    }

    headers = {"Accept": "application/json"}
    if search_after:
        headers["CMR-Search-After"] = search_after

    response = requests.get(url, params=params, headers=headers, timeout=60)

    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError:
        logger.error("CMR granule query failed with HTTP %s.", response.status_code)
        raise

    data = response.json()
    items = data.get("items", [])

    return response, items


def download_data_from_cmr(
    short_name: str, version: str, total_granules: int, page_size: int = 2000, **params
):
    """Fetches granules for a given collection from the CMR API, then downloads the data from the "GET DATA" URLs"""
    search_after_value: str | None = None
    all_download_urls = []
    seen_download_urls = set()
    granules_without_urls = 0

    # First pass: collect all download URLs
    logger.info("Collecting download URLs...")
    with tqdm(total=total_granules, desc="Collecting URLs", unit="granule") as pbar:
        while True:
            # Use shared query function
            response, items = query_cmr_granules(
                short_name, version, page_size, search_after_value, **params
            )

            # Collect "GET DATA" URLs
            for item in items:
                pbar.update(1)  # Update progress for each granule processed
                download_urls = []
                for related_url in item.get("umm", {}).get("RelatedUrls", []):
                    if related_url.get("Type") == "GET DATA":
                        download_url = related_url.get("URL")
                        if download_url and download_url not in seen_download_urls:
                            seen_download_urls.add(download_url)
                            download_urls.append(download_url)
                
                if download_urls:
                    all_download_urls.extend(download_urls)
                else:
                    granules_without_urls += 1

            # Read the next search-after value from response headers
            search_after_value = response.headers.get("CMR-Search-After")

            # There is no next search-after value, we've reached the end
            if not search_after_value:
                break

    logger.info("Found %s files to download", len(all_download_urls))
    if granules_without_urls > 0:
        logger.warning("%s granules have no download URLs", granules_without_urls)

    # Second pass: download all files in parallel
    downloaded_count = 0
    skipped_count = 0
    failed_count = 0
    
    with tqdm(total=len(all_download_urls), desc="Downloading files", unit="file") as pbar:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit all download tasks at once
            future_to_url = {executor.submit(download_file, url): url for url in all_download_urls}
            
            # Process completed downloads as they finish
            for future in as_completed(future_to_url):
                try:
                    status, filename = future.result()
                except Exception as error:
                    failed_count += 1
                    logger.error("Download task failed: %s", type(error).__name__)
                    pbar.update(1)
                    continue

                if status == "success":
                    downloaded_count += 1
                    pbar.set_description(f"Downloaded: {filename}")
                elif status == "skipped":
                    skipped_count += 1
                    pbar.set_description(f"Skipped: {filename}")
                else:  # failed
                    failed_count += 1
                    logger.error("Failed to download %s", filename)
                
                pbar.update(1)

    logger.info("Downloaded: %s files", downloaded_count)
    if skipped_count > 0:
        logger.info("Skipped: %s files (already exist)", skipped_count)
    if failed_count > 0:
        logger.error("Failed: %s files", failed_count)
    return failed_count


def download_file(url: str):
    """Download a single file and return (success, skipped, failed) status and filename"""
    parsed_url = urlparse(url)
    filename = Path(unquote(parsed_url.path)).name
    if parsed_url.scheme != "https" or not parsed_url.hostname or not filename:
        logger.error("Refusing invalid or non-HTTPS download URL.")
        return "failed", filename or "invalid URL"

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    local_filename = DOWNLOAD_DIR / filename
    if local_filename.exists():
        return "skipped", filename  # skip existing

    partial_filename = None

    try:
        with tempfile.NamedTemporaryFile(
            dir=DOWNLOAD_DIR, prefix=f".{filename}.", suffix=".part", delete=False
        ) as f:
            partial_filename = Path(f.name)
            with requests.get(url, stream=True, timeout=120) as r:
                if r.status_code in (401, 403):
                    raise requests.exceptions.HTTPError(
                        "Earthdata authorization failed; check your Earthdata Login/netrc setup.",
                        response=r,
                    )
                r.raise_for_status()
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
        os.replace(partial_filename, local_filename)
        return "success", filename
    except requests.exceptions.HTTPError as error:
        if error.response is not None and error.response.status_code in (401, 403):
            logger.error(
                "Earthdata authorization failed for %s (HTTP %s). Check your "
                "Earthdata Login/netrc setup.",
                filename,
                error.response.status_code,
            )
        else:
            logger.error("HTTP error downloading %s", filename)
        if partial_filename is not None:
            try:
                partial_filename.unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not remove partial download %s", filename)
        return "failed", filename
    except (requests.exceptions.RequestException, OSError) as error:
        if partial_filename is not None:
            try:
                partial_filename.unlink(missing_ok=True)
            except OSError:
                logger.exception("Could not remove partial download %s", filename)
        logger.error("Error downloading %s: %s", filename, type(error).__name__)
        return "failed", filename


def fetch_total_granules_count_from_cmr(short_name: str, version: str, **params):
    """Fetches the total number of granules for a given collection and filters from the CMR API"""
    response, _ = query_cmr_granules(short_name, version, page_size=1, **params)
    data = response.json()
    return data.get("hits", 0)


def main():
    """Main function to download data from the CMR API"""
    require_earthdata_credentials()
    filter_params = {}

    if FILTER_TEMPORAL:
        filter_params["temporal"] = FILTER_TEMPORAL

    if FILTER_BBOX:
        filter_params["bounding_box"] = FILTER_BBOX

    if FILTER_SEARCH:
        filter_params["producer_granule_id[]"] = "*" + FILTER_SEARCH + "*"
        filter_params["options[producer_granule_id][pattern]"] = 'true'

    if FILTER_CLOUD_COVER_MIN and FILTER_CLOUD_COVER_MAX:
        filter_params["cloud_cover"] = f"{FILTER_CLOUD_COVER_MIN},{FILTER_CLOUD_COVER_MAX}"

    total_granules = fetch_total_granules_count_from_cmr(
        SHORT_NAME, VERSION, **filter_params
    )
    logger.info("Total granules: %s", f"{total_granules:,}")

    failed_count = download_data_from_cmr(
        SHORT_NAME, VERSION, total_granules, **filter_params
    )
    if failed_count:
        raise SystemExit(1)

    logger.info("All downloads complete.")


if __name__ == "__main__":
    main()

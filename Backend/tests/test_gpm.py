import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

from scripts.nasa.gpm import download_files_GPM_3IMERGDF_07 as downloader


class TestGpmDownloader(unittest.TestCase):
    @staticmethod
    def interrupted_chunks():
        yield b"partial data"
        raise downloader.requests.exceptions.ConnectionError("connection lost")

    def test_uses_imerg_final_daily_version_07(self) -> None:
        self.assertEqual(downloader.SHORT_NAME, "GPM_3IMERGDF")
        self.assertEqual(downloader.VERSION, "07")

    def test_requires_netrc_earthdata_credentials(self) -> None:
        with patch.object(downloader.requests.utils, "get_netrc_auth", return_value=None):
            with self.assertRaisesRegex(RuntimeError, "Earthdata Login credentials"):
                downloader.require_earthdata_credentials()

    def test_download_writes_to_raw_directory(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            download_directory = Path(temporary_directory)
            response = Mock()
            response.status_code = 200
            response.iter_content.return_value = [b"rain", b"fall"]

            with (
                patch.object(downloader, "DOWNLOAD_DIR", download_directory),
                patch.object(downloader.requests, "get") as get,
            ):
                get.return_value.__enter__.return_value = response
                self.assertEqual(
                    downloader.download_file(
                        "https://example.nasa.gov/data/IMERG.V07.HDF5"
                    ),
                    ("success", "IMERG.V07.HDF5"),
                )

            self.assertEqual(
                (download_directory / "IMERG.V07.HDF5").read_bytes(), b"rainfall"
            )
            self.assertEqual(list(download_directory.glob("*.part")), [])

    def test_failed_authorization_does_not_leave_partial_file(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            download_directory = Path(temporary_directory)
            response = Mock()
            response.status_code = 401

            with (
                patch.object(downloader, "DOWNLOAD_DIR", download_directory),
                patch.object(downloader.requests, "get") as get,
            ):
                get.return_value.__enter__.return_value = response
                self.assertEqual(
                    downloader.download_file(
                        "https://example.nasa.gov/data/IMERG.V07.HDF5"
                    ),
                    ("failed", "IMERG.V07.HDF5"),
                )

            self.assertEqual(list(download_directory.iterdir()), [])

    def test_interrupted_transfer_removes_partial_file(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            download_directory = Path(temporary_directory)
            response = Mock()
            response.status_code = 200
            response.iter_content.return_value = self.interrupted_chunks()

            with (
                patch.object(downloader, "DOWNLOAD_DIR", download_directory),
                patch.object(downloader.requests, "get") as get,
            ):
                get.return_value.__enter__.return_value = response
                self.assertEqual(
                    downloader.download_file(
                        "https://example.nasa.gov/data/IMERG.V07.HDF5"
                    ),
                    ("failed", "IMERG.V07.HDF5"),
                )

            self.assertEqual(list(download_directory.iterdir()), [])

# Backend

The backend is a FastAPI application. Versioned routes live under
`app/api/v1/endpoints`, configuration and logging live under `app/core`, and
the root `main.py` preserves the existing Uvicorn entry point.

## Run locally

From the repository root:

```powershell
cd Backend
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`; interactive docs are at
`http://127.0.0.1:8000/docs`. The health check is `GET /api/health`.
Configuration is read from environment variables and `Backend/.env`; copy
`.env.example` to `.env` before running if you need local overrides.

NASA POWER and GPM integrations are separate; adding POWER does not alter the
GPM downloader. NASA datasets are not stored by the POWER service. Raw data
directories are Git-ignored.

## NASA POWER daily climate endpoint

`GET /api/v1/nasa/power/daily` fetches daily data directly from NASA POWER's
Agricultural (`AG`) community and returns the seven requested parameters:

| NASA POWER code | Response field | Units |
| --- | --- | --- |
| `T2M` | `t2m_c` | °C |
| `T2M_MAX` | `t2m_max_c` | °C |
| `T2M_MIN` | `t2m_min_c` | °C |
| `PRECTOTCORR` | `precipitation_mm_day` | mm/day |
| `RH2M` | `relative_humidity_pct` | % |
| `WS2M` | `wind_speed_m_s` | m/s |
| `ALLSKY_SFC_SW_DWN` | `allsky_sfc_sw_down_mj_m2_day` | MJ/m²/day |

Supply farm coordinates and inclusive date range for each request; dates use
ISO `YYYY-MM-DD` format:

```text
GET /api/v1/nasa/power/daily?latitude=6.6885&longitude=-1.6244&start_date=2020-01-01&end_date=2020-12-31
```

Coordinates are validated, reversed date ranges are rejected, and the response
includes the observations and NASA-provided units. NASA's `-999` fill values
and absent observations are returned as JSON `null`. Upstream request failures
return HTTP 502; timeouts return HTTP 504. The service does not cache or invent
data.

`GET /api/v1/nasa/power/climate-profile` accepts the same coordinates and date
range and returns compact monthly rainfall normals, annual precipitation,
mean temperature, hot-day counts (`T2M_MAX > 30°C`), and rainfall variability.
The predictive analytics page uses this endpoint to display measured climate
history; its scenario indices, crop-water demand, and yield comparisons remain
illustrative.

## Gemini crop-rotation recommendation

`POST /api/v1/crop-rotation/recommendation` asks Gemini to draft one crop
sequence from the selected crops, soil type, farming system, farm region, and
area. The response includes crop phases, month windows, rationale, and local
checks written in simple, everyday language. It does not claim satellite
evidence or quantified yield and water benefits. The selected farm name and
coordinates are not sent to Google.

Create a Gemini API key in Google AI Studio and place it only in the ignored
`Backend/.env` file:

```text
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Restart the backend after changing the environment. The API key must never be
added to the frontend or committed. This endpoint currently has no user
authentication or quota enforcement; keep it on a trusted development
environment until those protections are added before public deployment.

## NASA GPM IMERG V07 downloader

The original `download_files_GPM_3IMERGDF_07.py` downloader is available under
`scripts/nasa/gpm/`. It queries NASA CMR for `GPM_3IMERGDF`, version `07`
(IMERG Final Run Daily), using the configured time and bounding-box filters,
then downloads CMR `GET DATA` links to `data/nasa/gpm/raw/`. Existing files are
skipped; failed or interrupted transfers do not leave partial files behind.

Downloads require an Earthdata Login account with access to the GES DISC data.
Requests reads credentials from a netrc file for `urs.earthdata.nasa.gov`; do
not put credentials in the repository or command line. On Windows, create
`%USERPROFILE%\_netrc` (or `.netrc`) containing:

```text
machine urs.earthdata.nasa.gov
login YOUR_EARTHDATA_USERNAME
password YOUR_EARTHDATA_PASSWORD
```

Alternatively, set `NETRC` to the path of a protected netrc file. Run from the
backend directory with `py scripts\nasa\gpm\download_files_GPM_3IMERGDF_07.py`.
If authentication is missing or a download receives HTTP 401/403, the script
reports the problem without printing credential values and exits unsuccessfully.

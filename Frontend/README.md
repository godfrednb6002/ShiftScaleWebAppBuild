# ShiftScale Dashboard Frontend

The dashboard frontend was copied from the existing ShiftScale frontend into
this project without moving or modifying the source files.

## Run locally

```powershell
npm install
npm run dev
```

Vite prints the local URL after the development server starts.

The frontend calls the FastAPI backend through `/api`; Vite proxies these
requests to `http://127.0.0.1:8000` during development. Start the backend as
described in `../Backend/README.md`. Set `VITE_API_BASE_URL` when deploying to
point at the backend API base (for example, `/api` or
`https://api.example.com/api`).

## Validate

```powershell
npm run build
npm run lint
```

The predictive-analytics page requests a compact, farm-specific climate profile
from `GET /api/v1/nasa/power/climate-profile`. Its historical charts and climate
baselines use NASA POWER observations; slider adjustments, drought indices,
crop-water demand, and rotation/yield comparisons remain illustrative, not
calibrated forecasts or agronomic recommendations. Local `.env` files are not
included.

The Profile page is available from the drawer or header profile menu. Profile
and example farm data are stored only in browser local storage; authentication,
password changes, and sign-out are not connected.

The Crop Rotation Planner is available from the drawer. It fetches recent daily
NASA POWER climate observations for the selected farm through the backend.
Rotation scenarios, observation examples, risk scores, and benefit estimates
remain illustrative and are not validated farm-specific recommendations.

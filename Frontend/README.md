# ShiftScale Dashboard Frontend

The dashboard frontend was copied from the existing ShiftScale frontend into
this project without moving or modifying the source files.

## Run locally

```powershell
npm install
npm run dev
```

Vite prints the local URL after the development server starts.

## Validate

```powershell
npm run build
npm run lint
```

The dashboard includes a predictive-analytics scenario simulator with
hypothetical rainfall and temperature controls, summary indicators, water
balance and rotation comparison visualizations. These are prototype examples,
not calibrated forecasts or agronomic recommendations; historical trend values
are explicitly illustrative rather than measured NASA data. Local `.env` files
are not included.

The Profile page is available from the drawer or header profile menu. Profile
and example farm data are stored only in browser local storage; authentication,
password changes, and sign-out are not connected.

The Crop Rotation Planner is a local rule-based scenario prototype available
from the drawer. It does not fetch NASA datasets, and its displayed observation
examples, risk scores, and benefit estimates are not validated farm-specific
results.

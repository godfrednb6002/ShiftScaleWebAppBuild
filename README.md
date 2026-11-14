# ShiftScale Web App

Monorepo containing React frontend and FastAPI backend.

## Project Structure

```
├── Backend/
│   ├── venv/                 # Python virtual environment (ignored by Git)
│   ├── .env                  # Environment secrets (ignored by Git)
│   ├── .env.example          # Example environment variables
│   ├── requirements.txt      # Python dependencies
│   └── main.py               # FastAPI entry point
├── Frontend/
│   ├── node_modules/         # Node dependencies (ignored by Git)
│   ├── .env                  # Frontend environment variables (ignored by Git)
│   ├── .env.example          # Example frontend environment variables
│   ├── package.json          # Node dependencies & scripts
│   └── src/                  # React source code
└── .gitignore                # Root gitignore protecting secrets & dependencies
```

## Getting Started

### 1. Backend (FastAPI)

1. Navigate to `Backend`:
   ```bash
   cd Backend
   ```
2. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Linux/macOS**: `source venv/bin/activate`
3. Configure environment:
   - Copy `.env.example` to `.env` if not already present.
4. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

   NASA SMAP tile metadata is exposed at `GET /api/smap/layers` (both layers),
   `GET /api/smap/layer` (surface), and `GET /api/smap/layer/root-zone`. The
   public NASA GIBS WMTS tiles do not require an API key. An optional
   `date=YYYY-MM-DD` query selects an observation date; without it, GIBS uses
   each layer's default observation date.

   Surface moisture is from the SMAP L3 passive radiometer product. Root-zone
   moisture is a model-derived SMAP L4 product, expressed as volumetric moisture
   (`m^3/m^3`), not saturation percentage. Both endpoints provide rendered
   imagery, not numeric per-pixel measurements. Drought scoring and irrigation
   alerts are not included yet.

   References: [NASA SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap)
   and [NASA GIBS WMTS capabilities](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities).

   Landsat/MODIS vegetation map metadata is exposed at
   `GET /api/landsat-modis/layers`, with an optional `date=YYYY-MM-DD` query.
   The catalog includes MODIS Terra 8-day NDVI and EVI layers and Landsat 8/9
   HLS surface-reflectance imagery. GIBS tiles are public rendered imagery; they
   do not expose numeric pixel values or reflectance bands. BSI, canopy metrics,
   bare-fallow detection, and cover-crop validation therefore still require
   numeric imagery access and processing.

   References: [USGS Landsat EarthExplorer](https://earthexplorer.usgs.gov/),
   [MODIS LP DAAC products](https://lpdaac.usgs.gov/products/), and
   [NASA GIBS WMTS capabilities](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities).

### 2. Frontend (React + Vite)

1. Navigate to `Frontend`:
   ```bash
   cd Frontend
   ```
2. Install dependencies (already set up, or run `npm install` on a fresh clone).
3. Configure environment:
   - Copy `.env.example` to `.env` if needed.
4. Start development server:
   ```bash
   npm run dev
   ```

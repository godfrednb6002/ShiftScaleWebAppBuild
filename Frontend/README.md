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

The dashboard includes the source frontend's existing navigation and page
modules. NASA/GIBS and weather integrations use their public services; local
`.env` files are not included in the copied source.

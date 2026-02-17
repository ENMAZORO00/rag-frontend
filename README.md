# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

# rag-frontend

This is the React + Vite frontend for the Document AI example. It provides a simple UI to upload documents and ask questions to the backend RAG service.

## Requirements

- Node.js 18+ (recommended) or Node.js 16+ (compatible with Vite)
- npm (or yarn/pnpm)

## Setup

1. From the workspace root, change into the frontend directory:

```bash
cd rag-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

The dev server runs on `http://localhost:5173` by default.

## Backend connectivity

The frontend currently calls the backend endpoints at `http://127.0.0.1:8000` (see `src/App.jsx`). If your backend runs somewhere else, update the URLs in `src/App.jsx` or set up a proxy in the Vite config.

To change the backend URL quickly, replace the hardcoded endpoints in `src/App.jsx` (`/upload` and `/ask`) with your backend base URL or add an `axios` instance with a `baseURL`.

Example (quick change in `src/App.jsx`):

```js
// replace occurrences of "http://127.0.0.1:8000" with your backend URL
const API_BASE = "http://localhost:8000";
// then use `${API_BASE}/upload` and `${API_BASE}/ask`
```

Note: The backend expects CORS from `http://localhost:5173` by default; if you change the frontend origin or backend CORS settings, update `app/main.py` accordingly.

## Scripts

- `npm run dev` — start the Vite dev server (HMR)
- `npm run build` — produce a production build
- `npm run preview` — locally preview the production build

## Build & Deploy

1. Create a production build:

```bash
npm run build
```

2. Serve the `dist/` folder with any static server (or integrate into your production deployment).

## Troubleshooting

- If uploads or queries fail, confirm the backend is running at the configured URL and `uvicorn` was started as described in the backend README.
- If you see CORS errors in the browser console, make sure the backend allows requests from `http://localhost:5173`.

---

If you want, I can change the frontend to read the backend base URL from an environment variable (`import.meta.env.VITE_API_BASE`) and update `src/App.jsx` accordingly — shall I do that?

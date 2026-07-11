# High-Readability Presentation Creator & Slide Deck Builder

An elegant, single-screen Web-based presentation editor built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It is designed with accessibility first: enforcing minimum high-readability font sizing (≥ 20pt) for presentation screens, responsive preview layouts, interactive custom themes, real-time metadata inspector options, and instant PDF/JSON exporter flows.

---

## Technical Specifications
- **Frontend Stack**: React 19 (Functional Components, Hooks)
- **Bundler & Dev Server**: Vite 6+
- **Styling Engine**: Tailwind CSS v4
- **Language**: TypeScript (Strict Mode type checking)
- **Key Client Libraries**:
  - `lucide-react` (Vector UI iconography)
  - `jspdf` & `html2canvas` (Native client-side high-fidelity PDF rendering)
  - `motion` (Fluid UI animations)

---

## Local Setup & Development

Follow these simple steps to install dependencies and run the application in a local workspace.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)

### 1. Extract & Prepare Workspace
If you exported the ZIP or downloaded the code, navigate to the project root directory:
```bash
cd react-example
```

### 2. Install Dependencies
Run the package manager installation to download all required frontend libraries and development configurations:
```bash
npm install
```

### 3. Run Development Server
Boot the localized HMR (Hot Module Replacement) dev server:
```bash
npm run dev
```
Once started, the application will be hosted locally. Open your browser and navigate to:
👉 **`http://localhost:3000`** (or the port specified in your terminal output).

---

## Production Build & Static Deployment

This is a **Client-Side SPA (Single Page Application)**. When built, Vite compiles and optimizes all assets (HTML, JS, CSS, images) into a highly efficient, standalone static bundle inside the `/dist` directory. **No active Node.js runtime is required on the production server!**

### 1. Build the Static Bundle
To generate the production-ready build:
```bash
npm run build
```
This output is written to:
📁 **`./dist/`**

### 2. Sysadmin / Hosting Guide
Since the production output is entirely static, it can be served using any standard web server or CDN. Below are common deployment options:

#### A. Serving via Nginx (Recommended)
Place the compiled `/dist` files into your Nginx root and use the following simple server configuration to handle client-side routing safely:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### B. Hosting on Cloud Providers
Simply upload the `./dist` folder to any static hosting provider:
- **AWS**: Upload to an Amazon S3 Bucket and front it with CloudFront CDN.
- **Google Cloud**: Host on Cloud Storage bucket or Firebase Hosting.
- **Vercel / Netlify / GitHub Pages**: Link the repository and set the build command to `npm run build` and output directory to `dist`.

#### C. Local Static Preview
You can verify the production build locally before uploading by running:
```bash
npm run preview
```
This will spin up a lightweight server serving the static files from `/dist`.

---

## Running with Docker (Containerized Setup)

To simplify operations for sysadmins, a multi-stage `Dockerfile` and a `docker-compose.yaml` file are pre-configured to build and serve this application locally using Nginx inside an optimized, containerized environment.

### 1. Requirements
Ensure your host machine has **Docker** and **Docker Compose** installed:
- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Build and Start Container
Run the following command from the project root directory:
```bash
docker compose up -d --build
```

**What this does behind the scenes:**
1. Spins up an alpine Node workspace to install and compile the source bundle into highly optimized static assets (`/dist`).
2. Copies those assets to a lightweight, secure production-ready `nginx:alpine` image.
3. Automatically overwrites standard routing profiles so direct SPA sub-page paths resolve seamlessly without generating 404 errors.
4. Binds and listens on host port **`3000`** mapping directly to Nginx's virtualized port `80`.

### 3. Accessing the App
Open your web browser and navigate to:
👉 **`http://localhost:3000`**

### 4. Stop and Clean up
To turn off the containerized service:
```bash
docker compose down
```

---

## Configurable PDF Export Engine

The slide deck builder features a fully-customizable, high-DPI PDF export engine that captures slide elements at native screen coordinates and outputs pixel-perfect 16:9 widescreen PDFs.

### ⚙️ Central Configuration (`/src/config.ts`)
For quick adjustments and seamless field testing, all export configurations are central to **`/src/config.ts`**:

- **`defaultWidth`** (Default: `1440`): The base export resolution width in pixels.
- **`forceWidth`** (Default: `null`): Can be set to a specific pixel number (e.g., `1440` or `1920`) to lock the export size across all screens. When locked:
  - The PDF is strictly exported at the forced resolution.
  - User-adjustable width presets, input numbers, and sliders are disabled and marked with a lock status in the sidebar.
- **`presets`** (Default: `[1024, 1280, 1440, 1920]`): The size preset options presented in the sidebar. The default value is labeled with a clear superscript asterisk (`1440*`).
- **`allowUserCustomInput`** (Default: `true`): Dictates whether users are allowed to input arbitrary resolution numbers manually.
- **`defaultFilenamePrefix`**: Standardized fallback file name prefix for exports.

### 🎨 Collapsible UI & Experience Enhancements
- **State Persistence**: User-selected width settings are preserved across screen sessions inside `localStorage` to ensure absolute consistency.
- **Collapsible Section**: The PDF width controller in the sidebar footer can be collapsed/expanded via a clean chevron-arrow toggle, keeping the sidebar minimalist and clutter-free.
- **Forced/Locked State styling**: When size is locked, a lock icon appears alongside a dedicated system notice informing users that the layout size has been locked.

---

## Project Structure Overview
- `src/config.ts` — Central configuration variables for PDF exports.
- `src/main.tsx` — Application main mounting entry point.
- `src/App.tsx` — Core state coordinator (manages decks, current active slide, layout panels, and controls).
- `src/components/`
  - `SlideCanvas.tsx` — The interactive presentation deck previewer and layout renderer.
  - `Sidebar.tsx` — Navigational elements, preset decks selection, metadata inspector panel, and export control center.
  - `ElementEditor.tsx` — Custom visual component properties adjuster (font size, image scale, alignment, alternative text description).
- `src/types.ts` — Rigidly defined TypeScript interface contracts for element types, slide schemas, and presentation configuration.
- `src/utils/pdfGenerator.ts` — PDF compilation handler utilizing `jspdf` and canvas capturing.

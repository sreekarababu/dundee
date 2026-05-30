# CLAUDE.md — Node.js Hosting

This project is built to deploy on Node.js Hosting, a managed Node.js hosting platform. Use this file as context when helping build, debug, or prepare this app for deployment.

## Platform Overview

Node.js Hosting is a managed Node.js PaaS that supports Node.js applications and static sites. Customers upload their project folder through the GoDaddy interface — no Docker, no CI/CD pipelines, no infrastructure config needed. The platform handles SSL, CDN, and server-side compute automatically.

## Deployment Flow

1. Customer uploads their project folder via the Node.js Hosting UI
2. The platform installs dependencies and builds the app
3. The app is deployed to a private preview environment (requires GoDaddy auth to view)
4. Once ready, the customer can publish to production and connect a custom domain

## Requirements

### package.json

Every project must have a valid `package.json` in the root directory with a `start` script. This is how the platform knows how to run the app.

```json
{
  "name": "anti-gravity-dundee-site",
  "version": "1.0.0",
  "main": "server/server.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server/server.js"
  },
  "dependencies": {
    "@react-oauth/google": "^0.13.5",
    "@tailwindcss/vite": "^4.3.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "google-auth-library": "^10.6.2",
    "lucide-react": "^1.16.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "tailwindcss": "^4.3.0"
  }
}
```

The platform runs `npm install` followed by `npm start` to boot the application.

### Entry Point

The app needs a clear entry point referenced by the `start` script. In our case:
- `node server/server.js` (which serves static frontend built assets from `dist/` and runs all API proxy endpoints)

### Port Binding

The app must listen on the port provided by the `PORT` environment variable. Do not hardcode a port.

```javascript
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Static Sites & SPA Routing

For serving the compiled React frontend, our Express server routes all static assets and fallbacks cleanly:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port);
```

## Supported Frameworks

Our project utilizes:
- **Express.js** as the backend proxy and static server.
- **Vite + React** as the frontend storyboard application.

## Project Structure

Our full-stack compliant layout:

```
anti-gravity-dundee-site/
├── package.json        # Required — includes build, start, and unified dependencies
├── vite.config.js      # Dev proxy and PORT configurations
├── index.html          # SPA HTML shell
├── CLAUDE.md           # This file
├── public/             # Static frontend assets
├── server/             # Express API proxy server
│   ├── server.js       # Production server entry point
│   ├── package.json    # Local sub-package (for legacy compatibility)
│   └── .env.example    # Variables list
├── src/                # React application code
└── dist/               # Bundled files directory (generated after build)
```

## Environment Variables

- `PORT` is provided automatically by the platform. Always use `process.env.PORT`.
- `GEMINI_API_KEY` - API key for text scene/shot planning.
- `IMAGEROUTER_API_KEY` - API key for ImageRouter visual generations (optional, falls back seamlessly).

## Pre-Upload Checklist

- [x] `package.json` exists in the root directory
- [x] `package.json` has a `"start"` script matching `node server/server.js`
- [x] All production dependencies are in `"dependencies"` in the root `package.json`
- [x] App listens on `process.env.PORT`
- [x] No hardcoded ports or secret keys committed directly
- [x] App runs locally with `npm install && npm run build && npm run start`
- [x] All outbound connections use port 443 (HTTPS)

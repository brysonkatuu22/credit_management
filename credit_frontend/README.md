# Credit Frontend

This is the frontend application for the Credit Management System built with React and Vite.

## Environment Variables

This application uses environment variables for configuration. In development, these are loaded from the `.env` file in the root directory.

### Available Environment Variables

- `VITE_API_URL`: The URL of the backend API (default: http://127.0.0.1:8000/api)
- `VITE_APP_ENV`: The current environment (development, production, etc.)
- `VITE_DEBUG`: Whether to enable debug logging (true/false)

### Environment Files

- `.env`: Used in development
- `.env.production`: Used when building for production

### Accessing Environment Variables

In Vite, environment variables are accessed via `import.meta.env` instead of `process.env`:

```javascript
// Correct way to access environment variables in Vite
const apiUrl = import.meta.env.VITE_API_URL;

// This will NOT work in Vite
const apiUrl = process.env.REACT_APP_API_URL; // Wrong!
```

Note: Only variables prefixed with `VITE_` are exposed to the client-side code.

## Development

To start the development server:

```bash
npm run dev
```

## Building for Production

To build the application for production:

```bash
npm run build
```

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Plugins

This project uses the following Vite plugins:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh

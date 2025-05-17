// File: src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Custom CSS
import './styles/darkMode.css';
import './styles/customForms.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

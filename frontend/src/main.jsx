import React from "react";
import App from "./App.jsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./authContext";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";
import Callback from "./Callback";
import ReactDOM from "react-dom/client";
import {
  LivepeerConfig,
  createReactClient,
  studioProvider,
} from '@livepeer/react';
import UserPage from "./Components/User.jsx";

const client = createReactClient({
  provider: studioProvider({ apiKey: '9bd0fca8-7695-4962-a7ff-b4eff588d779' }),
});

const livepeerTheme = {
  colors: {
    accent: 'rgb(0, 145, 255)',
    containerBorderColor: 'rgba(0, 145, 255, 0.9)',
  },
  fonts: {
    display: 'Inter',
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LivepeerConfig client={client} theme={livepeerTheme}>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/protected" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/user/:sub" element={<UserPage />} />
        </Routes>
      </Router>
    </AuthProvider>
    </LivepeerConfig>
  </React.StrictMode>
);

import React, { useState, useEffect } from "react";
import axios from "axios";
import VideoCards from "./Components/VideoCard";
import "./App.css";
import { useAuth } from "./authContext";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Define the API endpoint
    const apiUrl = "https://delicate-paper-7097.fly.dev/videos";

    axios
      .get(apiUrl)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // The empty dependency array means this useEffect will run once when the component mounts

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  const handleLoginClick = () => {
    const loginUrl = "https://delicate-paper-7097.fly.dev/login";

    if (isAuthenticated) {
      logout();
    } else {
      window.location.href = loginUrl;
    }
  };
  const GotoDashboard = () => {
    const dashUrl = "https://frontend-six-snowy-39.vercel.app/protected";
    window.location.href = dashUrl;
  };
  console.log(isAuthenticated);

  return (
    <div>
      <h1>Safestream</h1>
      <div style={{display: "flex", justifyContent: "center",marginBottom:20}}>
      {isAuthenticated ? (
        <button onClick={GotoDashboard}>Dashboard</button>
      ) : null}

      <button onClick={handleLoginClick}
      style={{
        marginLeft: 20,
      }}>
        {isAuthenticated ? "Logout" : "Login with Worldcoin"}
      </button>
      </div>
      <VideoCards videos={data} />
    </div>
  );
}

export default App;

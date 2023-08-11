import React from "react";
import { useAuth } from "./authContext";

function Dashboard() {
  const { logout, sub } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome: {sub}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;

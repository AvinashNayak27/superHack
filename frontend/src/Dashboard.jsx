import React from "react";
import { useAuth } from "./authContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";

function Dashboard() {
  const { logout, sub } = useAuth();
  // get user info from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Define the API endpoint
    const apiUrl = `https://delicate-paper-7097.fly.dev/users/${sub}`;

    axios
      .get(apiUrl)
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sub]);

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error: {error}</p>;

  const Addwallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      // Request account access if needed
      await window.ethereum.enable();
      // We don't know window.ethereum prior to runtime.
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const address = await signer.getAddress();

      const message = "Please sign this message to add your wallet";
      const signature = await signer.signMessage(message);
      const signerAddr = await ethers.utils.verifyMessage(message, signature);
      if (signerAddr !== address) {
        throw new Error("Signature verification failed");
      }
      const updateData = {
        walletAddress: signerAddr,
      };

      axios
        .put("https://delicate-paper-7097.fly.dev/users/me", updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          console.log("User updated:", response.data);
        })
        .catch((error) => {
          console.error("Error updating user:", error);
        });
    } else {
      throw new Error("Metamask is not installed");
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome: {user?.sub}</p>
      {!user?.walletAddress && (
        <button className="btn" onClick={Addwallet}>
          Add Wallet
        </button>
      )}
      {user?.walletAddress && <p>Wallet Address: {user?.walletAddress}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;

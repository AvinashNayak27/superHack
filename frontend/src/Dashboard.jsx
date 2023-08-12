import React from "react";
import { useAuth } from "./authContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import VideoCards from "./Components/VideoCard";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { logout, sub } = useAuth();
  // get user info from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState(null);
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [newAttestationUID, setNewAttestationUID] = useState(null);
  const navigation = useNavigate();

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
  useEffect(() => {
    // Define the API endpoint
    const apiUrl = `https://delicate-paper-7097.fly.dev/videos/${sub}`;

    axios
      .get(apiUrl)
      .then((response) => {
        setVideos(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [sub]);
  const uploadAndGenerateSnapshots = async (file) => {
    try {
      const uploadURL = "https://safecheck.fly.dev/upload";
      const generateSnapshotsURL = "https://safecheck.fly.dev/nsfwcheck";

      const formData = new FormData();
      formData.append("video", file);

      const uploadResponse = await axios.post(uploadURL, formData);

      const videoPath = uploadResponse.data.uploadPath;
      setStatusMessage("Checking for NSFW content ...");
      const generateSnapshotsResponse = await axios.post(generateSnapshotsURL, {
        videoPath,
      });
      console.log(generateSnapshotsResponse.data);

      if (generateSnapshotsResponse.data?.nsfwContent?.length === 1) {
        setStatusMessage("No NSFW content detected. uploading to Livepeer ...");
        const assetResponse = await axios.post(
          "https://safecheck.fly.dev/uploadtolivepeer",
          {
            name: videoPath.slice(0, -4).split("/").pop(),
            description: "Test for NSFW content",
            videoUrl: videoPath,
          }
        );
        return assetResponse?.data?.asset[0];
      } else {
        setStatusMessage(
          "NSFW content detected : " +
            generateSnapshotsResponse?.data?.nsfwContent[1]
        );
        throw new Error(
          "NSFW content detected. Asset not uploaded to Livepeer"
        );
      }
    } catch (error) {
      console.error("Operation failed:", error.message);
    }
  };

  const attestVideo = async (data) => {
    try {
      const attestURL = "https://delicate-paper-7097.fly.dev/attest";
      const attestResponse = await axios.post(attestURL, data);
      return attestResponse.data;
    } catch (error) {
      console.error("Operation failed:", error.message);
    }
  };
  const attestUrl =  (attestID) => {
    return `https://optimism-goerli-bedrock.easscan.org/attestation/view/${attestID}`;
  };

  const createVideo = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      setStatusMessage("Please select a file");
      return;
    }
    setStatusMessage("Uploading file ...");
    const asset = await uploadAndGenerateSnapshots(file);
    if (asset) {
      setStatusMessage("File uploaded successfully");
      const publishedUser = await axios.get(
        `https://delicate-paper-7097.fly.dev/users/${sub}`
      );
      setStatusMessage("Creating video ...");

      const videoData = {
        name: file.name.slice(0, -4).split("/").pop(),
        userId: publishedUser.data._id,
        playbackId: asset.playbackId,
        playbackUrl: asset.playbackUrl,
      };
      axios
        .post("https://delicate-paper-7097.fly.dev/videos", videoData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          console.log("Video created:", response.data);
          setStatusMessage("Video created successfully");
          const data = {
            address: publishedUser.data.walletAddress,
            playbackId: asset.playbackId,
            isSafe: true,
          };
          setStatusMessage("Attesting video ...");
          attestVideo(data).then((response) => {
            console.log("Video attested:", response);
            setNewAttestationUID(response.newAttestationUID);
            setStatusMessage("Video attested successfully");
            setStatusMessage(
              "View attestation at: " + attestUrl(response.newAttestationUID)
            );
          });
        })
        .catch((error) => {
          console.error("Error creating video:", error);
          setStatusMessage("Error creating video: " + error.message);
        });
    }
  };

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
      <p>{statusMessage}</p>
      <h3>Upload Video</h3>
      <input type="file" ref={fileInputRef} />
      <button className="btn" onClick={createVideo}>
        Upload Video
      </button>
      <div style={{ marginTop: "20px" }}>
        <h3>Videos</h3>
        <VideoCards videos={videos} />
      </div>

      <button
        onClick={logout}
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "red",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;

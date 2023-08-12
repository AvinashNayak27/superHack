import React from "react";
import "./VideoCard.css";
import { Player } from "@livepeer/react";
import { useAuth } from "../authContext";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function VideoCards({ videos }) {
  const { sub } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const currentUrl = location.pathname;

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

  return (
    <div className="card-container">
      {videos.map((video) => (
        <div key={video._id} className="card">
          <h2>{video.name}</h2>
          <Player
            title={video.name}
            playbackId={video.playbackId}
            showTitle={false}
          />
          {video.userId._id !== user?._id && (
            <div>
              <>
                {currentUrl !== `/user/${video.userId.sub}` && (
                  <Link to={`/user/${video.userId.sub}`}>
                    <button className="btn">Go to user profile</button>
                  </Link>
                )}
                {console.log(video)}
              </>
            </div>
          )}
          {video.userId._id === user?._id && (
            <div>
              <>
                {currentUrl !== `/protected` && (
                  <Link to={`/protected`}>
                    <button className="btn">Go to dashboard</button>
                  </Link>
                )}
                {console.log(video)}
              </>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default VideoCards;

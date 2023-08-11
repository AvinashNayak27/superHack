import React from 'react';
import './VideoCard.css'

function VideoCards({ videos }) {
  return (
    <div className="card-container">
      {videos.map(video => (
        <div key={video._id} className="card">
          <h2>{video.name}</h2>
          <p><strong>User ID:</strong> {video.userId}</p>
          <p><strong>Playback ID:</strong> {video.playbackId}</p>
          <a href={video.playbackUrl} target="_blank" rel="noopener noreferrer">Watch Video</a>
        </div>
      ))}
    </div>
  );
}

export default VideoCards;

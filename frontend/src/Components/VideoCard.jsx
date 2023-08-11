import React from 'react';
import './VideoCard.css'
import { Player } from '@livepeer/react';
import { useAuth } from '../authContext';
import axios from 'axios';
import { useEffect, useState } from 'react';


function VideoCards({ videos }) {
    const { sub } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Define the API endpoint
        const apiUrl = `https://delicate-paper-7097.fly.dev/users/${sub}`;

        axios.get(apiUrl)
            .then(response => {
                setUser(response.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }
        , [sub]); // The empty dependency array means this useEffect will run once when the component mounts

    if (loading) return <p>Loading...</p>;

    if (error) return <p>Error: {error}</p>;
    console.log(user);




    return (
        <div className="card-container">
            {videos.map(video => (
                <div key={video._id} className="card">
                    <h2>{video.name}</h2>
                    <Player
                        title={video.name}
                        playbackId={video.playbackId}
                        showTitle={false}
                    />
                    {video.userId !== user?._id && <button className="btn">Fund</button>}
                </div>
            ))}
        </div>
    );
}

export default VideoCards;

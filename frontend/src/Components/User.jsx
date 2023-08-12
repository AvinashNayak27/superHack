import React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import VideoCards from './VideoCard';


function UserPage() {
    const { sub } = useParams();
    console.log(sub);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [videos, setVideos] = useState(null);

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



    if (loading) return <p>Loading...</p>;

    if (error) return <p>Error: {error}</p>;
    console.log(user);

    return (
        <div>
            <h2>User Profile</h2>
            <p>userId: {user?.sub}</p>
            <p>Wallet:{user?.walletAddress}</p>
            <VideoCards videos={videos} />
        </div>
    );
}

export default UserPage;

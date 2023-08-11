import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoCards from './Components/VideoCard';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Define the API endpoint
    const apiUrl = 'https://delicate-paper-7097.fly.dev/videos';

    axios.get(apiUrl)
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // The empty dependency array means this useEffect will run once when the component mounts

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  console.log(data);

  return (
    <div >
      <h1>Safestream</h1>
        <VideoCards videos={data} />
    </div>
  );
}

export default App;

// LoginPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './authContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Callback() {
  const { login, isAuthenticated } = useAuth();
  const [code, setCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/protected');
      return;
    }
    // Check if the URL has a code parameter (after being redirected from the OIDC provider)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
      setCode(authCode);
      exchangeCodeForToken(authCode);
    }
  }, [isAuthenticated]); // Added isAuthenticated as a dependency


  const exchangeCodeForToken = async (authCode) => {
    try {
      const response = await axios.post('https://delicate-paper-7097.fly.dev/exchange', {
        code: authCode,
      });

      if (response.data && response.data.token) {
        console.log('Exchanged code for token:', response.data.token);
        localStorage.setItem('token', response.data.token)
        login(response.data.token);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

  const handleLoginClick = () => {
    // Redirect to your server's login route which will then redirect to the OIDC provider's login page
    window.location.href = 'https://delicate-paper-7097.fly.dev/login';
  };

  return (
    <div>
      <h2>Login Page</h2>
      {!code && (
        <button onClick={handleLoginClick}>Login with Worldcoin</button>
      )}
      {code && <p>Authenticating...</p>}

    </div>
  );
}

export default Callback;

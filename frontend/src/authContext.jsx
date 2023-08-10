import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isloading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    checkAuthenticationStatus();
  }, []);
  
  const checkAuthenticationStatus = async () => {
    try {
      const response = await axios.get("https://delicate-paper-7097.fly.dev/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.authenticated) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsAuthenticated(false);
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      setIsAuthenticated(false);
      setToken(null);
    }
  };


  const login = (newToken) => {
    setIsAuthenticated(true);
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem("token");
  };

  const contextValue = {
    isAuthenticated,
    token,
    login,
    logout,
    isLoading: isloading
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

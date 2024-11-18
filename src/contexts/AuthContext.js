// src/contexts/AuthContext.js
import React, { createContext, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const existingTokens = JSON.parse(localStorage.getItem('tokens'));
  const [authTokens, setAuthTokens] = useState(existingTokens);

  const setTokens = (data) => {
    localStorage.setItem('tokens', JSON.stringify(data));
    setAuthTokens(data);
  };

  const logout = () => {
    localStorage.removeItem('tokens');
    setAuthTokens(null);
  };

  return (
    <AuthContext.Provider value={{ authTokens, setAuthTokens: setTokens, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

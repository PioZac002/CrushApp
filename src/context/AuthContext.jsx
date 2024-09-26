// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const initialUserState = null;

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
        return initialUserState;
      }
    }
    return initialUserState;
  });

  useEffect(() => {
    if (user && user.id_token) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const logout = () => {
    setUser(initialUserState);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

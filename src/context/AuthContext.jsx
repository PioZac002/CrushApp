import React, { createContext, useState, useEffect } from 'react';
import { isTokenExpired } from '../utils/authUtils';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const initialUserState = null;

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (isTokenExpired(parsedUser.id_token)) {
          localStorage.removeItem('user');
          return initialUserState;
        }
        return parsedUser;
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
      if (isTokenExpired(user.id_token)) {
        logout();
      } else {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.id_token && isTokenExpired(user.id_token)) {
        logout();
      }
    }, 60 * 1000); // Check every 1 minute

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        const newUser = event.newValue ? JSON.parse(event.newValue) : null;
        if (!newUser || isTokenExpired(newUser.id_token)) {
          setUser(initialUserState);
        } else {
          setUser(newUser);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = () => {
    setUser(initialUserState);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

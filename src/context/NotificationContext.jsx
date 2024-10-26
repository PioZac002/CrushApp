// src/context/NotificationContext.jsx

import React, { createContext, useState } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Funkcja dodająca powiadomienie
  const addNotification = (type, message) => {
    const id = Date.now(); // Unikalne ID
    setNotifications((prev) => [
      ...prev,
      { id, type, message, time: new Date() },
    ]);
  };

  // Funkcja usuwająca powiadomienie
  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

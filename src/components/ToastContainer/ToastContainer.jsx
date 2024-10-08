// src/components/ToastContainer/ToastContainer.jsx
import React from 'react';
import { Toast } from 'react-bootstrap';
import './toastContainer.css';

const ToastContainer = ({ message, onClose, variant }) => {
  return (
    <Toast
      show={!!message}
      onClose={onClose}
      delay={5000}
      autohide
      bg={variant}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
      }}
    >
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  );
};

export default ToastContainer;

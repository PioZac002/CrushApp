// src/components/Header/Logo/Logo.jsx
import React, { useContext } from 'react';
import image from '../../../assets/images/logoKruszarka.png';
import './logo.css';
import { AuthContext } from '../../../context/AuthContext';

const Logo = () => {
  const { user } = useContext(AuthContext);

  // Check if user is Service or Manager
  const isServiceOrManager = user?.role?.isService || user?.role?.isManager;

  const handleToggleSideBar = () => {
    document.body.classList.toggle('toggle-sidebar');
  };

  return (
    <div className='d-flex align-items-center justify-content-between'>
      <a href='/' className='logo d-flex align-items-center'>
        <img src={image} alt='logo' />
        <span className='d-none d-lg-block'>CrushApp</span>
      </a>
      {isServiceOrManager && (
        <i
          className='bi bi-list toggle-sidebar-btn'
          onClick={handleToggleSideBar}
        ></i>
      )}
    </div>
  );
};

export default Logo;

// src/components/Header/Navigation/NavAvatar/NavAvatar.jsx
import React, { useContext } from 'react';
import './navAvatar.css';
import profileImg from '../../../../assets/images/userIMG.png';
import { AuthContext } from '../../../../context/AuthContext';

const NavAvatar = () => {
  const { user, logout } = useContext(AuthContext);

  // Determine user role for display
  const getUserRoleDisplay = () => {
    if (user && user.role) {
      const { isService, isManager } = user.role;
      if (isService) return 'Serwisant';
      if (isManager) return 'Manager';
      return 'Pracownik';
    }
    return '';
  };

  const userRoleDisplay = getUserRoleDisplay();

  return (
    <li className='nav-item dropdown pe-3'>
      <a
        className='nav-link nav-profile d-flex align-items-center pe-0'
        href='#'
        data-bs-toggle='dropdown'
      >
        <img src={profileImg} alt='Profile' className='rounded-circle' />
        <span className='d-none d-md-block dropdown-toggle ps-2'>
          {user ? user.email : 'Użytkownik'}
        </span>
      </a>

      <ul className='dropdown-menu dropdown-menu-end dropdown-menu-arrow profile'>
        <li className='dropdown-header'>
          <h6>{user ? user.email : 'Użytkownik'}</h6>
          <span>{userRoleDisplay}</span>
        </li>
        <li>
          <hr className='dropdown-divider' />
        </li>

        {/* Optionally, you can keep or remove these menu items */}
        {/* 
        <li>
          <a
            className='dropdown-item d-flex align-items-center'
            href='users-profile.html'
          >
            <i className='bi bi-person'></i>
            <span>Mój profil</span>
          </a>
        </li>
        <li>
          <hr className='dropdown-divider' />
        </li>

        <li>
          <a
            className='dropdown-item d-flex align-items-center'
            href='users-profile.html'
          >
            <i className='bi bi-gear'></i>
            <span>Ustawienia konta</span>
          </a>
        </li>
        <li>
          <hr className='dropdown-divider' />
        </li>

        <li>
          <a
            className='dropdown-item d-flex align-items-center'
            href='pages-faq.html'
          >
            <i className='bi bi-question-circle'></i>
            <span>Potrzebujesz pomocy?</span>
          </a>
        </li>
        <li>
          <hr className='dropdown-divider' />
        </li>
        */}

        <li>
          <a
            className='dropdown-item d-flex align-items-center'
            href='#'
            onClick={logout}
          >
            <i className='bi bi-box-arrow-right'></i>
            <span>Wyloguj się</span>
          </a>
        </li>
      </ul>
    </li>
  );
};

export default NavAvatar;

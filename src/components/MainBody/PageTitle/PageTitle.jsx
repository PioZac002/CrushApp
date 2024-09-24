// PageTitle.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import './pageTitle.css';

function PageTitle() {
  const location = useLocation();

  const pageTitles = {
    '/': 'Dashboard',
    '/pracownicy': 'Zarządzanie Pracownikami',
    '/integratorzy': 'Zarządzanie Integratorami',
    '/grupy': 'Zarządzanie Grupami',
    '/wykresy': 'Diagramy/Wykresy',
  };

  const currentPage = pageTitles[location.pathname] || 'Strona';

  return (
    <div className='pagetitle'>
      <h1>{currentPage}</h1>
      <nav>
        <ol className='breadcrumb'>
          <li className='breadcrumb-item'>
            <NavLink to='/'>
              <i className='bi bi-house-door'></i>
            </NavLink>
          </li>
          <li className='breadcrumb-item active'>{currentPage}</li>
        </ol>
      </nav>
    </div>
  );
}

export default PageTitle;

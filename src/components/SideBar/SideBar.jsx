// src/components/SideBar/SideBar.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import './sideBar.css';
import { AuthContext } from '../../context/AuthContext';

const SideBar = () => {
  const { user } = useContext(AuthContext);
  const { role } = user || {};

  const isService = role?.isService;
  const isManager = role?.isManager;
  const isWorker = !isService && !isManager;

  const sidebarItems = [
    {
      title: 'Dashboard',
      icon: 'bi bi-grid',
      path: '/',
      roles: ['service', 'manager', 'worker'],
    },
    {
      title: 'Diagramy/Wykresy',
      icon: 'bi bi-bar-chart',
      path: '/wykresy',
      roles: ['service', 'manager'], // Only for Service Technicians and Managers
    },
    {
      title: 'Zarządzanie pracownikami',
      icon: 'bi bi-people',
      path: '/pracownicy',
      roles: ['service', 'manager'],
    },
    {
      title: 'Zarządzanie Integratorami',
      icon: 'bi bi-diagram-3',
      path: '/integratorzy',
      roles: ['service', 'manager'],
    },
    {
      title: 'Zarządzanie grupami',
      icon: 'bi bi-diagram-2',
      path: '/grupy',
      roles: ['service', 'manager'],
    },
  ];

  const getUserRole = () => {
    if (isService) return 'service';
    if (isManager) return 'manager';
    return 'worker';
  };

  const userRole = getUserRole();

  return (
    <aside id='sidebar' className='sidebar'>
      <ul className='sidebar-nav' id='sidebar-nav'>
        {sidebarItems
          .filter((item) => item.roles.includes(userRole))
          .map((item, index) => (
            <li key={index} className='nav-item'>
              <NavLink to={item.path} className='nav-link'>
                <i className={item.icon}></i>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
      </ul>
    </aside>
  );
};

export default SideBar;

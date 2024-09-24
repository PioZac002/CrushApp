// SideBar.jsx
import { NavLink } from 'react-router-dom';
import './sideBar.css';

const SideBar = () => {
  const sidebarItems = [
    {
      title: 'Dashboard',
      icon: 'bi bi-grid',
      path: '/',
    },
    {
      title: 'Zarządzanie pracownikami',
      icon: 'bi bi-people',
      path: '/pracownicy',
    },
    {
      title: 'Zarządzanie Integratorami',
      icon: 'bi bi-diagram-3',
      path: '/integratorzy',
    },
    {
      title: 'Zarządzanie grupami',
      icon: 'bi bi-diagram-2',
      path: '/grupy',
    },
    {
      title: 'Diagramy/Wykresy',
      icon: 'bi bi-bar-chart',
      path: '/wykresy',
    },
  ];

  return (
    <aside id='sidebar' className='sidebar'>
      <ul className='sidebar-nav' id='sidebar-nav'>
        {sidebarItems.map((item, index) => (
          <li key={index} className='nav-item'>
            <NavLink
              to={item.path}
              className='nav-link'
              activeclassname='active'
            >
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

// src/components/Header/Header.jsx

import { useEffect, useContext } from 'react';
import Logo from './Logo/Logo';
import Nav from './Navigation/Nav';
import './header.css';
import { AuthContext } from '../../context/AuthContext';

const Header = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    document.body.classList.add('toggle-sidebar');
  }, []);

  const isWorker = !user?.role?.isManager && !user?.role?.isService;

  return (
    <header id='header' className='header fixed-top d-flex align-items-center'>
      <Logo />
      {<Nav />}
    </header>
  );
};

export default Header;

import Logo from './Logo/Logo';
import SearchBar from './SearchBar/SearchBar';
import Nav from './Navigation/Nav';
import './header.css';
const Header = () => {
  return (
    <header id='header' className='header fixed-top d-flex align-items-center'>
      <Logo />
      <SearchBar />
      <Nav />
    </header>
  );
};
export default Header;

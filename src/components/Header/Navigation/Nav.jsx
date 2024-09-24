import NavNotice from './NavNotice/NavNotice';
import NavMessage from './NavMessage/NavMessage';
import NavAvatar from './NavAvatar/NavAvatar';
import './nav.css';
const Nav = () => {
  return (
    <nav className='header-nav ms-auto'>
      <ul className='d-flex align-items-center'>
        {/* <NavNotice /> */}
        <NavMessage />
        <NavAvatar />
      </ul>
    </nav>
  );
};
export default Nav;

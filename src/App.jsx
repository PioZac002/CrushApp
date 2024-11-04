import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import SideBar from './components/SideBar/SideBar';
import MainBody from './components/MainBody/MainBody';
import { AuthContext } from './context/AuthContext';
import Unauthorized from './components/Unauthorized/Unauthorized';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Login from './components/Login/Login';
import { useContext } from 'react';
import { isTokenExpired } from './utils/authUtils';
// Import Icons
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'remixicon/fonts/remixicon.css';

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';

function App() {
  const { user, logout } = useContext(AuthContext);

  const isAuthenticated =
    user && user.id_token && !isTokenExpired(user.id_token);

  if (user && user.id_token && isTokenExpired(user.id_token)) {
    logout();
  }

  const isServiceOrManager = user?.role?.isService || user?.role?.isManager;

  return (
    <Router>
      {isAuthenticated && (
        <>
          <Header />
          {isServiceOrManager && <SideBar />}
        </>
      )}
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/unauthorized' element={<Unauthorized />} />
        <Route
          path='/*'
          element={
            <PrivateRoute allowedRoles={['service', 'manager', 'worker']}>
              <MainBody />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

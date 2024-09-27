// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import SideBar from './components/SideBar/SideBar';
import MainBody from './components/MainBody/MainBody';
import { AuthContext } from './context/AuthContext';
import Unauthorized from './components/Unauthorized/Unauthorized';
import AuthProvider from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Login from './components/Login/Login';
import { useContext } from 'react';
//import Icons
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'remixicon/fonts/remixicon.css';

//Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';

function App() {
  const { user } = useContext(AuthContext);

  // Check if the user is authenticated
  const isAuthenticated = user && user.id_token;

  // Check if the user is Service or Manager
  const isServiceOrManager = user?.role?.isService || user?.role?.isManager;

  return (
    <Router>
      {isAuthenticated && (
        <>
          {/* Header is always visible after login */}
          <Header />
          {/* SideBar only for Service and Manager */}
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

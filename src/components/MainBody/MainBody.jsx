// MainBody.jsx
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute/PrivateRoute';
import Dashboard from './Dashboard/Dashboard';
import ManageWorkers from '../ManageWorkers/ManageWorkers';
import ManageIntegrators from '../ManageIntegrators/ManageIntegrators';
import ManageGroups from '../ManageGroups/ManageGroups';
import Diagrams from '../Diagrams/Diagrams';
import './MainBody.css';

const MainBody = () => {
  return (
    <main className='main' id='main'>
      <Routes>
        <Route
          path='/'
          element={
            <PrivateRoute allowedRoles={['service', 'manager', 'worker']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path='/pracownicy'
          element={
            <PrivateRoute allowedRoles={['service', 'manager']}>
              <ManageWorkers />
            </PrivateRoute>
          }
        />
        <Route
          path='/integratorzy'
          element={
            <PrivateRoute allowedRoles={['service', 'manager']}>
              <ManageIntegrators />
            </PrivateRoute>
          }
        />
        <Route
          path='/grupy'
          element={
            <PrivateRoute allowedRoles={['service', 'manager']}>
              <ManageGroups />
            </PrivateRoute>
          }
        />
        <Route
          path='/wykresy'
          element={
            <PrivateRoute allowedRoles={['service', 'manager']}>
              <Diagrams />
            </PrivateRoute>
          }
        />
      </Routes>
    </main>
  );
};

export default MainBody;

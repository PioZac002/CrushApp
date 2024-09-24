// MainBody.jsx
import PageTitle from './PageTitle/PageTitle';
import './mainBody.css';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard/Dashboard';
import ManageWorkers from '../ManageWorkers/ManageWorkers';
import ManageIntegrators from '../ManageIntegrators/ManageIntegrators';
import ManageGroups from '../ManageGroups/ManageGroups';
import Diagrams from '../Diagrams/Diagrams';

const MainBody = () => {
  return (
    <main className='main' id='main'>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/pracownicy' element={<ManageWorkers />} />
        <Route path='/integratorzy' element={<ManageIntegrators />} />
        <Route path='/grupy' element={<ManageGroups />} />
        <Route path='/wykresy' element={<Diagrams />} />
      </Routes>
    </main>
  );
};

export default MainBody;

// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import SideBar from './components/SideBar/SideBar';
import MainBody from './components/MainBody/MainBody';
import Dashboard from './components/MainBody/Dashboard/Dashboard';
import ManageWorkers from './components/ManageWorkers/ManageWorkers';
import ManageIntegrators from './components/ManageIntegrators/ManageIntegrators';
import ManageGroups from './components/ManageGroups/ManageGroups';
import Diagrams from './components/Diagrams/Diagrams';
//import Icons
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'remixicon/fonts/remixicon.css';

//Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';

function App() {
  return (
    <Router>
      <SideBar />
      <Header />
      <MainBody>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/pracownicy' element={<ManageWorkers />} />
          <Route path='/integratorzy' element={<ManageIntegrators />} />
          <Route path='/grupy' element={<ManageGroups />} />
          <Route path='/wykresy' element={<Diagrams />} />
        </Routes>
      </MainBody>
    </Router>
  );
}

export default App;

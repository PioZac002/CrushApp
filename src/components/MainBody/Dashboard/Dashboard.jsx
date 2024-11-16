// src/components/Dashboard/Dashboard.jsx

import React, { useContext, useEffect, useState, useRef } from 'react';
import './dashboard.css';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../../api/api';
import { GridLoader } from 'react-spinners';
import ToastContainer from '../../ToastContainer/ToastContainer';
import { FaSearch } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [integrators, setIntegrators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const unusedVariable = 'This variable is unused'; // Nieużywana zmienna
  let duplicateAssignment = 'initial';
  duplicateAssignment = 'changed'; // Powtórne przypisanie

  const fetchData = async () => {
    setLoading(true);
    try {
      const workersResponse = await axios.get(endpoints.getWorkers(user.userID)); // Brak autoryzacji
      const integratorsResponse = await axios.get(endpoints.getIntegrators(user.userID), {
        headers: { Authorization: null }, // Błędna autoryzacja
      });
      setWorkers(workersResponse.data.workers);
      setIntegrators(integratorsResponse.data.integrators);
    } catch (error) {
      console.error(error); // Brak obsługi błędu
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClick = () => {
    const someCondition = true; // Zawsze prawdziwe, niepotrzebne warunki
    if (someCondition) {
      alert('Click handled'); // Użycie funkcji alert
    }
  };

  const renderIntegratorList = () => {
    const filteredIntegrators = integrators.filter((integrator) =>
        integrator.location.includes('') // Niepotrzebny filtr
    );

    return (
        <div className='integrator-list'>
          {filteredIntegrators.map((integrator, index) => (
              <div key={index}> {/* Użycie indeksu jako klucza */}
                <p>{integrator.serialNumber}</p>
              </div>
          ))}
        </div>
    );
  };

  return (
      <div>
        <h1>Dashboard</h1>
        <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleClick}>Click Me</button>
        {loading ? (
            <p>Loading...</p>
        ) : (
            renderIntegratorList() // Wywołanie bezpośrednie
        )}
      </div>
  );
};

export default Dashboard;

// src/components/MainBody/Dashboard/Dashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import Card from './Card';
import './dashboard.css';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../../api/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [integrators, setIntegrators] = useState([]);
  const [loading, setLoading] = useState(false);

  // Określenie roli użytkownika
  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;
  const isWorker = !isService && !isManager;

  // Pobranie pracowników dla Managera lub Serwisanta
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(endpoints.getWorkers(user.userID), {
          headers: {
            Authorization: user.id_token,
          },
        });

        if (response && response.data && response.data.workers) {
          setWorkers(response.data.workers);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania pracowników:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isManager || isService) {
      fetchWorkers();
    }
  }, [user, isManager, isService]);

  // Wyciągnięcie managerów z listy pracowników dla Serwisanta
  useEffect(() => {
    if (isService) {
      const managersList = workers.filter(
        (worker) => worker.role.isManager && !worker.role.isService
      );
      setManagers(managersList);
    }
  }, [workers, isService]);

  // Pobranie integratorów dla wybranego managera przez Serwisanta
  useEffect(() => {
    const fetchIntegratorsForManager = async () => {
      if (!selectedManagerID) return;

      setLoading(true);

      try {
        const response = await axios.get(
          endpoints.getIntegrators(user.userID, selectedManagerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );

        if (response && response.data) {
          setIntegrators(response.data.integrators);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania integratorów:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isService && selectedManagerID) {
      fetchIntegratorsForManager();
    }
  }, [user, isService, selectedManagerID]);

  // Obsługa zmiany wyboru managera
  const handleManagerChange = (e) => {
    const managerID = e.target.value;
    setSelectedManagerID(managerID);
  };

  // Renderowanie listy pracowników
  const renderWorkersList = () => (
    <table className='table'>
      <thead>
        <tr>
          <th>Email</th>
          <th>Imię</th>
          <th>Nazwisko</th>
        </tr>
      </thead>
      <tbody>
        {workers.map((worker) => {
          if (
            !worker.cognitoAttributes ||
            !Array.isArray(worker.cognitoAttributes)
          ) {
            return (
              <tr key={worker.PK}>
                <td>N/A</td>
                <td>N/A</td>
                <td>N/A</td>
              </tr>
            );
          }

          const emailAttr = worker.cognitoAttributes.find(
            (attr) => attr.Name === 'email'
          );
          const givenNameAttr = worker.cognitoAttributes.find(
            (attr) => attr.Name === 'given_name'
          );
          const familyNameAttr = worker.cognitoAttributes.find(
            (attr) => attr.Name === 'family_name'
          );

          const email = emailAttr ? emailAttr.Value : 'N/A';
          const givenName = givenNameAttr ? givenNameAttr.Value : 'N/A';
          const familyName = familyNameAttr ? familyNameAttr.Value : 'N/A';

          return (
            <tr key={worker.PK}>
              <td>{email}</td>
              <td>{givenName}</td>
              <td>{familyName}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Renderowanie listy integratorów
  const renderIntegratorList = () => {
    if (integrators.length === 0) {
      return <p>Nie znaleziono integratorów.</p>;
    }

    return (
      <table className='table'>
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {integrators.map((integrator) => (
            <tr key={integrator.PK}>
              <td>{integrator.serialNumber}</td>
              <td>{integrator.location}</td>
              <td>{integrator.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <section className='dashboard section'>
      <div className='row'>
        {/* Dla Pracowników */}
        {isWorker && (
          <div className='col-lg-12'>
            <Card title='Lista Integratorów' icon='bi bi-people'>
              {loading ? <p>Ładowanie...</p> : renderIntegratorList()}
            </Card>
          </div>
        )}

        {/* Dla Managerów */}
        {isManager && (
          <>
            <div className='col-lg-12'>
              <Card title='Lista Pracowników' icon='bi bi-people'>
                {loading ? <p>Ładowanie...</p> : renderWorkersList()}
              </Card>
            </div>
            {/* Inne karty dla Managera */}
            {/* Możesz dodać tutaj inne komponenty, np. lista integratorów, grup itp. */}
          </>
        )}

        {/* Dla Serwisantów */}
        {isService && (
          <div className='col-lg-12'>
            <Card title='Wybierz Managera' icon='bi bi-person'>
              <select
                className='form-select'
                value={selectedManagerID}
                onChange={handleManagerChange}
              >
                <option value=''>-- Wybierz Managera --</option>
                {managers.map((manager) => {
                  const emailAttr = manager.cognitoAttributes.find(
                    (attr) => attr.Name === 'email'
                  );
                  const email = emailAttr ? emailAttr.Value : 'N/A';
                  return (
                    <option key={manager.PK} value={manager.PK}>
                      {email}
                    </option>
                  );
                })}
              </select>
            </Card>

            {selectedManagerID && (
              <Card title='Lista Integratorów' icon='bi bi-people'>
                {loading ? <p>Ładowanie...</p> : renderIntegratorList()}
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;

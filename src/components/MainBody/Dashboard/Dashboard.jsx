import React, { useContext, useEffect, useState } from 'react';
import Card from './Card';
import './dashboard.css';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../../api/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [integrators, setIntegrators] = useState([]);
  const [integratorGroups, setIntegratorGroups] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMoreWorkers, setShowMoreWorkers] = useState(false);
  const [showMoreIntegrators, setShowMoreIntegrators] = useState(false);
  const [showMoreGroups, setShowMoreGroups] = useState(false);

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

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
          const workersList = response.data.workers;
          setWorkers(workersList);

          if (isService) {
            const managersList = workersList.filter(
              (worker) => worker.role.isManager && !worker.role.isService
            );
            setManagers(managersList);
          }
        }
      } catch (error) {
        console.error('Błąd podczas pobierania pracowników:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [user, isService]);

  useEffect(() => {
    const fetchIntegrators = async () => {
      if (!selectedManagerID && !isManager) return;

      setLoading(true);
      const managerID = isService ? selectedManagerID : '';

      try {
        const response = await axios.get(
          endpoints.getIntegrators(user.userID, managerID),
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

    if (isService || isManager) {
      fetchIntegrators();
    }
  }, [user, selectedManagerID, isManager, isService]);

  useEffect(() => {
    const fetchIntegratorGroups = async () => {
      if (!selectedManagerID && !isManager) return;

      setLoading(true);
      const managerID = isService ? selectedManagerID : '';

      try {
        const response = await axios.get(
          endpoints.getIntegratorGroups(user.userID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (response && response.data) {
          setIntegratorGroups(response.data.integratorGroups);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania grup integratorów:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isService || isManager) {
      fetchIntegratorGroups();
    }
  }, [user, selectedManagerID, isManager, isService]);

  const handleManagerChange = (e) => {
    setSelectedManagerID(e.target.value);
  };

  const renderWorkersList = () => (
    <div className='worker-list'>
      {(showMoreWorkers ? workers : workers.slice(0, 5)).map((worker) => {
        if (
          !worker.cognitoAttributes ||
          !Array.isArray(worker.cognitoAttributes)
        ) {
          return (
            <div key={worker.PK} className='row worker-item'>
              <div className='col-12'>N/A</div>
            </div>
          );
        }

        const givenNameAttr = worker.cognitoAttributes.find(
          (attr) => attr.Name === 'given_name'
        );
        const familyNameAttr = worker.cognitoAttributes.find(
          (attr) => attr.Name === 'family_name'
        );
        const emailAttr = worker.cognitoAttributes.find(
          (attr) => attr.Name === 'email'
        );

        const givenName = givenNameAttr ? givenNameAttr.Value : 'N/A';
        const familyName = familyNameAttr ? familyNameAttr.Value : 'N/A';
        const email = emailAttr ? emailAttr.Value : 'N/A';

        return (
          <div
            key={worker.PK}
            className='row worker-item align-items-center mb-3'
          >
            <div className='col-8'>
              <strong>
                {givenName} {familyName}
              </strong>
            </div>
            <div className='col-4 text-end text-muted'>{email}</div>
          </div>
        );
      })}
      {workers.length > 5 && (
        <button
          className='btn btn-link'
          onClick={() => setShowMoreWorkers(!showMoreWorkers)}
        >
          {showMoreWorkers ? 'Pokaż mniej' : 'Pokaż więcej'}
        </button>
      )}
    </div>
  );

  const renderIntegratorList = () => (
    <table className='table'>
      <thead>
        <tr>
          <th>Serial Number</th>
          <th>Location</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {(showMoreIntegrators ? integrators : integrators.slice(0, 5)).map(
          (integrator) => (
            <tr key={integrator.PK}>
              <td>{integrator.serialNumber}</td>
              <td>{integrator.location}</td>
              <td>{integrator.status}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );

  const renderIntegratorGroups = () => (
    <table className='table'>
      <thead>
        <tr>
          <th>Nazwa grupy</th>
        </tr>
      </thead>
      <tbody>
        {(showMoreGroups ? integratorGroups : integratorGroups.slice(0, 5)).map(
          (group) => (
            <tr
              key={group.PK}
              className={group.isDeleted ? 'text-decoration-line-through' : ''}
            >
              <td>{group.integratorGroupName}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );

  return (
    <section className='dashboard section'>
      <div className='row mb-4'>
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
                  const givenNameAttr = manager.cognitoAttributes.find(
                    (attr) => attr.Name === 'given_name'
                  );
                  const familyNameAttr = manager.cognitoAttributes.find(
                    (attr) => attr.Name === 'family_name'
                  );
                  const givenName = givenNameAttr ? givenNameAttr.Value : '';
                  const familyName = familyNameAttr ? familyNameAttr.Value : '';
                  return (
                    <option key={manager.PK} value={manager.PK}>
                      {`${givenName} ${familyName}`}
                    </option>
                  );
                })}
              </select>
            </Card>
          </div>
        )}
      </div>

      <div className='row'>
        <div className='col-lg-8'>
          <Card title='Lista Integratorów' icon='bi bi-tools'>
            {loading ? <p>Ładowanie...</p> : renderIntegratorList()}
            {integrators.length > 5 && (
              <button
                className='btn btn-link'
                onClick={() => setShowMoreIntegrators(!showMoreIntegrators)}
              >
                {showMoreIntegrators ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            )}
          </Card>

          {/* Dodanie karty Wykresy poniżej listy Integratorów */}
          <Card title='Wykresy' icon='bi bi-bar-chart'>
            <p>Tutaj będzie miejsce na wykresy efektywności.</p>
          </Card>
        </div>

        <div className='col-lg-4'>
          <Card title='Lista Pracowników' icon='bi bi-people'>
            {loading ? <p>Ładowanie...</p> : renderWorkersList()}
            {workers.length > 5 && (
              <button
                className='btn btn-link'
                onClick={() => setShowMoreWorkers(!showMoreWorkers)}
              >
                {showMoreWorkers ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            )}
          </Card>

          <Card title='Lista Grup Integratorów' icon='bi bi-diagram-2'>
            {loading ? <p>Ładowanie...</p> : renderIntegratorGroups()}
            {integratorGroups.length > 5 && (
              <button
                className='btn btn-link'
                onClick={() => setShowMoreGroups(!showMoreGroups)}
              >
                {showMoreGroups ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

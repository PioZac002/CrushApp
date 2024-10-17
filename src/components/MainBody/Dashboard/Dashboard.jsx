// src/components/Dashboard/Dashboard.jsx

import React, { useContext, useEffect, useState } from 'react';
import './dashboard.css';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../../api/api';
import { GridLoader } from 'react-spinners';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return 'status-yellow';
      case 1:
        return 'status-red';
      case 2:
        return 'status-green';
      default:
        return '';
    }
  };

  const renderWorkersList = () => (
    <div className='dashboard-worker-list'>
      {(showMoreWorkers ? workers : workers.slice(0, 5)).map((worker) => {
        if (
          !worker.cognitoAttributes ||
          !Array.isArray(worker.cognitoAttributes)
        ) {
          return (
            <div key={worker.PK} className='dashboard-worker-item'>
              <div>N/A</div>
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
          <div key={worker.PK} className='dashboard-worker-item'>
            <div className='worker-name'>
              <strong>
                {givenName} {familyName}
              </strong>
            </div>
            <div className='worker-email'>{email}</div>
          </div>
        );
      })}
    </div>
  );

  const renderIntegratorList = () => (
    <div className='dashboard-integrator-list'>
      {(showMoreIntegrators ? integrators : integrators.slice(0, 5)).map(
        (integrator) => (
          <div
            key={integrator.PK}
            className={`dashboard-integrator-item ${getStatusColor(
              integrator.status
            )}`}
          >
            <div className='integrator-info'>
              <div className='integrator-serial'>
                <strong>{integrator.serialNumber}</strong>
              </div>
              <div className='integrator-location'>{integrator.location}</div>
            </div>
            <div className='integrator-actions'>
              {/* Ikonka do zmiany statusu */}
              <button className='status-button'>
                <i className='bi bi-arrow-repeat'></i>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );

  const renderIntegratorGroups = () => (
    <div className='dashboard-group-list'>
      {(showMoreGroups ? integratorGroups : integratorGroups.slice(0, 5)).map(
        (group) => (
          <div
            key={group.PK}
            className={`dashboard-group-item ${
              group.isDeleted ? 'group-deleted' : ''
            }`}
          >
            {group.integratorGroupName}
          </div>
        )
      )}
    </div>
  );

  return (
    <section className='dashboard-section'>
      {isService && (
        <div className='dashboard-row'>
          <div className='dashboard-container full-width'>
            <div className='container-header'>
              <i className='bi bi-person container-icon'></i>
              <h5 className='container-title'>Wybierz Managera</h5>
            </div>
            <div className='container-content'>
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
            </div>
          </div>
        </div>
      )}

      <div className='dashboard-row'>
        <div className='dashboard-column'>
          <div className='dashboard-container'>
            <div className='container-header'>
              <i className='bi bi-tools container-icon'></i>
              <h5 className='container-title'>Lista Integratorów</h5>
            </div>
            <div className='container-content'>
              {loading ? (
                <div className='loader-container'>
                  <GridLoader color='var(--primary-500)' />
                </div>
              ) : (
                <>
                  {renderIntegratorList()}
                  {integrators.length > 5 && (
                    <button
                      className='btn-show-more'
                      onClick={() =>
                        setShowMoreIntegrators(!showMoreIntegrators)
                      }
                    >
                      {showMoreIntegrators ? 'Pokaż mniej' : 'Pokaż więcej'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className='dashboard-container'>
            <div className='container-header'>
              <i className='bi bi-diagram-2 container-icon'></i>
              <h5 className='container-title'>Lista Grup Integratorów</h5>
            </div>
            <div className='container-content'>
              {loading ? (
                <div className='loader-container'>
                  <GridLoader color='var(--primary-500)' />
                </div>
              ) : (
                <>
                  {renderIntegratorGroups()}
                  {integratorGroups.length > 5 && (
                    <button
                      className='btn-show-more'
                      onClick={() => setShowMoreGroups(!showMoreGroups)}
                    >
                      {showMoreGroups ? 'Pokaż mniej' : 'Pokaż więcej'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className='dashboard-column'>
          <div className='dashboard-container'>
            <div className='container-header'>
              <i className='bi bi-people container-icon'></i>
              <h5 className='container-title'>Lista Pracowników</h5>
            </div>
            <div className='container-content'>
              {loading ? (
                <div className='loader-container'>
                  <GridLoader color='var(--primary-500)' />
                </div>
              ) : (
                <>
                  {renderWorkersList()}
                  {workers.length > 5 && (
                    <button
                      className='btn-show-more'
                      onClick={() => setShowMoreWorkers(!showMoreWorkers)}
                    >
                      {showMoreWorkers ? 'Pokaż mniej' : 'Pokaż więcej'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className='dashboard-container'>
            <div className='container-header'>
              <i className='bi bi-bar-chart container-icon'></i>
              <h5 className='container-title'>Wykresy</h5>
            </div>
            <div className='container-content'>
              <p>Tutaj będzie miejsce na wykresy efektywności.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

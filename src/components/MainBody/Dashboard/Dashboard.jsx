// src/components/Dashboard/Dashboard.jsx

import React, { useContext, useEffect, useState, useRef } from 'react';
import './dashboard.css';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../../api/api';
import { GridLoader } from 'react-spinners';
import ToastContainer from '../../ToastContainer/ToastContainer';

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
  const [statusDropdownIntegratorId, setStatusDropdownIntegratorId] =
    useState(null);

  // Added states for success and error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ref for the currently open dropdown
  const statusDropdownRef = useRef(null);

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;
  const isWorker = !isService && !isManager; // Determine if user is a worker

  useEffect(() => {
    const fetchDataForManagersAndService = async () => {
      setLoading(true);
      try {
        // Fetch Workers
        const workersResponse = await axios.get(
          endpoints.getWorkers(user.userID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (
          workersResponse &&
          workersResponse.data &&
          workersResponse.data.workers
        ) {
          const workersList = workersResponse.data.workers;
          setWorkers(workersList);

          if (isService) {
            const managersList = workersList.filter(
              (worker) => worker.role.isManager && !worker.role.isService
            );
            setManagers(managersList);
          }
        }

        // Fetch Integrators
        const managerID = isService ? selectedManagerID : '';
        const integratorsResponse = await axios.get(
          endpoints.getIntegrators(user.userID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (integratorsResponse && integratorsResponse.data) {
          setIntegrators(integratorsResponse.data.integrators);
        }

        // Fetch Integrator Groups
        const integratorGroupsResponse = await axios.get(
          endpoints.getIntegratorGroups(user.userID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (integratorGroupsResponse && integratorGroupsResponse.data) {
          setIntegratorGroups(integratorGroupsResponse.data.integratorGroups);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
        setErrorMessage('Wystąpił błąd podczas pobierania danych.');
      } finally {
        setLoading(false);
      }
    };

    const fetchDataForWorkers = async () => {
      setLoading(true);
      try {
        // Fetch Integrators assigned to the worker
        const response = await axios.get(
          endpoints.getIntegrators(user.userID),
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
        setErrorMessage('Wystąpił błąd podczas pobierania integratorów.');
      } finally {
        setLoading(false);
      }
    };

    if (isService || isManager) {
      fetchDataForManagersAndService();
    } else if (isWorker) {
      fetchDataForWorkers();
    }
  }, [user, isService, isManager, isWorker, selectedManagerID]);

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
      case 3:
        return 'status-blue';
      default:
        return '';
    }
  };

  const handleChangeStatus = async (integratorID, status) => {
    try {
      const requestBody = {
        userID: isService ? selectedManagerID : user.userID,
        editData: {
          PK: integratorID,
          editData: {
            status: status,
          },
        },
      };

      const response = await axios.put(
        endpoints.editIntegrator(user.userID), // Używamy user.userID w URL
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${user.id_token}`,
          },
        }
      );

      if (response && response.data) {
        setIntegrators((prev) =>
          prev.map((integrator) =>
            integrator.PK === integratorID ? response.data : integrator
          )
        );
        setSuccessMessage('Status integratora został zmieniony pomyślnie.');
      }
    } catch (error) {
      console.error('Błąd podczas zmiany statusu integratora:', error);
      setErrorMessage('Wystąpił błąd podczas zmiany statusu integratora.');
    }
  };

  const toggleStatusDropdown = (integratorID) => {
    if (statusDropdownIntegratorId === integratorID) {
      setStatusDropdownIntegratorId(null);
    } else {
      setStatusDropdownIntegratorId(integratorID);
    }
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownIntegratorId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownIntegratorId]);

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
              {/* Status change button */}
              <button
                className='status-button'
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatusDropdown(integrator.PK);
                }}
              >
                <i className='bi bi-arrow-repeat'></i>
              </button>
              {/* Status dropdown */}
              {statusDropdownIntegratorId === integrator.PK && (
                <div
                  className='status-dropdown'
                  ref={statusDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[0, 1, 2, 3].map((statusOption) => (
                    <button
                      key={statusOption}
                      className='status-option'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStatus(integrator.PK, statusOption);
                        setStatusDropdownIntegratorId(null);
                      }}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              )}
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

  // Worker View
  if (isWorker) {
    return (
      <section className='dashboard-section'>
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
                {integrators.length === 0 && (
                  <p>Brak integratorów do wyświetlenia.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Display success and error messages */}
        {successMessage && (
          <ToastContainer
            message={successMessage}
            onClose={() => setSuccessMessage('')}
            variant='success'
          />
        )}
        {errorMessage && (
          <ToastContainer
            message={errorMessage}
            onClose={() => setErrorMessage('')}
            variant='danger'
          />
        )}
      </section>
    );
  }

  // Manager and Service View
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

      {/* Display success and error messages */}
      {successMessage && (
        <ToastContainer
          message={successMessage}
          onClose={() => setSuccessMessage('')}
          variant='success'
        />
      )}
      {errorMessage && (
        <ToastContainer
          message={errorMessage}
          onClose={() => setErrorMessage('')}
          variant='danger'
        />
      )}
    </section>
  );
};

export default Dashboard;

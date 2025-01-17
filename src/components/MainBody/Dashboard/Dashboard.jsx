import React, { useContext, useEffect, useState } from 'react';
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
  const [integratorGroups, setIntegratorGroups] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMoreWorkers, setShowMoreWorkers] = useState(false);
  const [showMoreIntegrators, setShowMoreIntegrators] = useState(false);
  const [showMoreGroups, setShowMoreGroups] = useState(false);

  // Nowe stany dla modalu zmiany statusu
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedIntegrator, setSelectedIntegrator] = useState(null);

  // Stan dla komunikatów sukcesu i błędu
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;
  const isWorker = !isService && !isManager; // Określenie, czy użytkownik jest pracownikiem

  // Stan dla przycisku przewijania
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  useEffect(() => {
    const fetchDataForManagersAndService = async () => {
      setLoading(true);
      try {
        // Pobierz pracowników
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

        // Pobierz integratory
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

        // Pobierz grupy integratorów
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
        // Krok 1: Pobierz grupy integratorów, do których należy pracownik
        const responseGroups = await axios.get(
            endpoints.getIntegratorGroups(user.userID),
            {
              headers: {
                Authorization: user.id_token,
              },
            }
        );

        if (responseGroups && responseGroups.data) {
          const groups = responseGroups.data.integratorGroups || [];

          // Krok 2: Wyciągnij ID grup
          const groupIDs = groups.map((group) => group.PK).join(',');

          if (groupIDs.length === 0) {
            // Użytkownik nie należy do żadnych grup
            setIntegrators([]);
            setLoading(false);
            return;
          }

          // Krok 3: Pobierz integratory z tych grup
          const responseIntegrators = await axios.get(
              `${endpoints.getGroupDetails(user.userID)}?groups=${groupIDs}`,
              {
                headers: {
                  Authorization: user.id_token,
                },
              }
          );

          if (responseIntegrators && responseIntegrators.data) {
            const integratorsData = [];

            // Przetwarzanie integratorów
            if (responseIntegrators.data.integratorsInGroups) {
              responseIntegrators.data.integratorsInGroups.forEach(
                  (groupData) => {
                    Object.values(groupData).forEach((integratorList) => {
                      integratorList.forEach((integrator) => {
                        if (!integrator.isDeletedFromGroup) {
                          integratorsData.push(integrator);
                        }
                      });
                    });
                  }
              );
            }

            // Usuwanie duplikatów na podstawie integrator.PK
            const uniqueIntegrators = integratorsData.reduce(
                (acc, integrator) => {
                  if (!acc.find((i) => i.PK === integrator.PK)) {
                    acc.push(integrator);
                  }
                  return acc;
                },
                []
            );

            setIntegrators(uniqueIntegrators);
          }
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

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTopButton(true);
      } else {
        setShowScrollTopButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
          status: status,
        },
      };

      const response = await axios.put(
          endpoints.editIntegrator(user.userID),
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
    } finally {
      // Zamknij modal po zmianie statusu
      setShowStatusModal(false);
      setSelectedIntegrator(null);
    }
  };

  const openStatusModal = (integrator) => {
    setSelectedIntegrator(integrator);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedIntegrator(null);
  };

  // Dodaj blok kodu sprawdzający stan ładowania tutaj
  if (loading) {
    return (
        <div className='loader-container' data-testid='loading-spinner'>
          <GridLoader color='var(--primary-500)' />
        </div>
    );
  }

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
        {workers.length > 5 && (
            <button
                className='btn-show-more'
                onClick={() => setShowMoreWorkers(!showMoreWorkers)}
            >
              {showMoreWorkers ? 'Pokaż mniej' : 'Pokaż więcej'}
            </button>
        )}
      </div>
  );

  const renderIntegratorList = () => {
    const filteredIntegrators = integrators.filter((integrator) =>
        `${integrator.serialNumber} ${integrator.location}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const displayedIntegrators = showMoreIntegrators
        ? filteredIntegrators
        : filteredIntegrators.slice(0, 5);

    return (
        <div className='dashboard-integrator-list'>
          {displayedIntegrators.map((integrator) => (
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
                  {/* Przycisk zmiany statusu */}
                  <button
                      className='status-button'
                      onClick={() => openStatusModal(integrator)}
                  >
                    <i className='bi bi-arrow-repeat'></i>
                  </button>
                </div>
              </div>
          ))}
          {filteredIntegrators.length > 5 && (
              <button
                  className='btn-show-more'
                  onClick={() => setShowMoreIntegrators(!showMoreIntegrators)}
              >
                {showMoreIntegrators ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
          )}
          {filteredIntegrators.length === 0 && (
              <p>Brak integratorów do wyświetlenia.</p>
          )}
        </div>
    );
  };

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
        {integratorGroups.length > 5 && (
            <button
                className='btn-show-more'
                onClick={() => setShowMoreGroups(!showMoreGroups)}
            >
              {showMoreGroups ? 'Pokaż mniej' : 'Pokaż więcej'}
            </button>
        )}
      </div>
  );

  // Widok dla pracownika
  if (isWorker) {
    return (
        <section className='dashboard-section'>
          <div className='dashboard-container'>
            <div className='container-header'>
              <i className='bi bi-tools container-icon'></i>
              <h5 className='container-title'>Lista Integratorów</h5>
            </div>

            {/* Pasek wyszukiwania */}
            <div className='search-bar'>
              <input
                  type='text'
                  placeholder='Szukaj integratora...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className='search-icon' />
            </div>

            <div className='container-content'>
              {loading ? (
                  <div className='loader-container'>
                    <GridLoader color='var(--primary-500)' />
                  </div>
              ) : (
                  <>
                    {renderIntegratorList()}
                  </>
              )}
            </div>
          </div>

          {/* Wyświetlanie komunikatów sukcesu i błędu */}
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

          {/* Przycisk przewijania na górę */}
          {showScrollTopButton && (
              <button
                  className='scroll-to-top-button'
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <i className='bi bi-arrow-up'></i>
              </button>
          )}

          {/* Modal zmiany statusu */}
          {showStatusModal && selectedIntegrator && (
              <div className='modal-overlay-dashboard'>
                <div className='modal-content-dashboard'>
                  <h3>Zmiana statusu integratora</h3>
                  <p>
                    Wybierz nowy status dla integratora:{' '}
                    <strong>{selectedIntegrator.serialNumber}</strong>
                  </p>
                  <div className='status-options-dashboard'>
                    {[0, 1, 2, 3].map((statusOption) => (
                        <button
                            key={statusOption}
                            className='status-option-modal-dashboard'
                            onClick={() =>
                                handleChangeStatus(selectedIntegrator.PK, statusOption)
                            }
                        >
                          Status {statusOption}
                        </button>
                    ))}
                  </div>
                  <button
                      className='modal-close-button-dashboard'
                      onClick={closeStatusModal}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
          )}
        </section>
    );
  }

  // Widok dla managera i serwisanta
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
                      const familyName = familyNameAttr
                          ? familyNameAttr.Value
                          : '';
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
                <p>Miejsce na wykresy efektywności.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wyświetlanie komunikatów sukcesu i błędu */}
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

        {/* Przycisk przewijania na górę */}
        {showScrollTopButton && (
            <button
                className='scroll-to-top-button'
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <i className='bi bi-arrow-up'></i>
            </button>
        )}

        {/* Modal zmiany statusu */}
        {showStatusModal && selectedIntegrator && (
            <div className='modal-overlay-dashboard'>
              <div className='modal-content-dashboard'>
                <h3>Zmiana statusu integratora</h3>
                <p>
                  Wybierz nowy status dla integratora:{' '}
                  <strong>{selectedIntegrator.serialNumber}</strong>
                </p>
                <div className='status-options-dashboard'>
                  {[0, 1, 2, 3].map((statusOption) => (
                      <button
                          key={statusOption}
                          className='status-option-modal-dashboard'
                          onClick={() =>
                              handleChangeStatus(selectedIntegrator.PK, statusOption)
                          }
                      >
                        Status {statusOption}
                      </button>
                  ))}
                </div>
                <button
                    className='modal-close-button-dashboard'
                    onClick={closeStatusModal}
                >
                  Anuluj
                </button>
              </div>
            </div>
        )}
      </section>
  );
};

export default Dashboard;

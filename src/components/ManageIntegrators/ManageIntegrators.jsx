// src/components/ManageIntegrators/ManageIntegrators.jsx

import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api';
import './manageIntegrators.css';
import ToastContainer from '../ToastContainer/ToastContainer';
import { FaCog, FaSearch } from 'react-icons/fa';
import { PiCaretCircleDownFill, PiCaretCircleUpFill } from 'react-icons/pi';
import { TiDeleteOutline } from 'react-icons/ti';
import { GridLoader } from 'react-spinners';

const ManageIntegrators = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useContext(AuthContext);
  const [integrators, setIntegrators] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [loading, setLoading] = useState(false);
  const [newIntegrator, setNewIntegrator] = useState({
    location: '',
    serialNumber: '',
  });
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddIntegratorForm, setShowAddIntegratorForm] = useState(false);
  const [expandedIntegrators, setExpandedIntegrators] = useState([]);
  const [showOptionsIntegratorId, setShowOptionsIntegratorId] = useState(null);

  const optionsMenuRef = useRef(null);
  const integratorsListRef = useRef(null);

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

  // Nowe stany dla modali
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedIntegrator, setSelectedIntegrator] = useState(null);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  // Pobieranie managerów (jeśli użytkownik jest serwisantem)
  useEffect(() => {
    if (isService) {
      const fetchManagers = async () => {
        setLoading(true);
        try {
          const response = await axios.get(endpoints.getWorkers(user.userID), {
            headers: {
              Authorization: user.id_token,
            },
          });
          if (response && response.data && response.data.workers) {
            const managerList = response.data.workers.filter(
                (worker) => worker.role.isManager && !worker.isDeleted
            );
            setManagers(managerList);
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchManagers();
    }
  }, [user, isService]);

  // Pobieranie integratorów
  useEffect(() => {
    const fetchIntegrators = async () => {
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
        console.error('Error fetching integrators:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isService || isManager) {
      fetchIntegrators();
    }
  }, [user, selectedManagerID, isManager, isService]);

  // Filtrowanie integratorów
  const filteredIntegrators = integrators
      .filter((integrator) => {
        const matchesLocation = filterLocation
            ? integrator.location === filterLocation
            : true;
        const matchesStatus = filterStatus
            ? integrator.status === parseInt(filterStatus, 10)
            : true;
        const matchesAvailability =
            filterAvailability === 'all'
                ? true
                : filterAvailability === 'active'
                    ? !integrator.isDeleted
                    : integrator.isDeleted;

        return matchesLocation && matchesStatus && matchesAvailability;
      })
      .filter((integrator) => {
        const searchString = `${integrator.serialNumber} ${integrator.location}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      });

  // Dodawanie nowego integratora
  const handleAddIntegrator = async () => {
    const creatorID = user.userID;
    const managerID = isService ? selectedManagerID : creatorID;
    try {
      const response = await axios.post(
          endpoints.addIntegrator(creatorID),
          {
            userID: managerID,
            location: newIntegrator.location,
            serialNumber: newIntegrator.serialNumber,
          },
          {
            headers: {
              Authorization: user.id_token,
            },
          }
      );
      if (response && response.data) {
        setIntegrators((prev) => [...prev, response.data]);
        setNewIntegrator({ location: '', serialNumber: '' });
        setShowAddIntegratorForm(false); // Ukryj modal po dodaniu
        showSuccessMessage('Integrator dodany pomyślnie.');
      }
    } catch (error) {
      console.error('Error adding integrator:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania integratora.');
    }
  };

  // Usuwanie lub przywracanie integratora
  const handleDeleteOrRestoreIntegrator = async (integratorID, isDeleted) => {
    try {
      const response = await axios.put(
          endpoints.editIntegrator(user.userID),
          {
            userID: isService ? selectedManagerID : user.userID,
            editData: {
              PK: integratorID,
              isDeleted: isDeleted,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${user.id_token}`,
            },
          }
      );

      if (response && response.data) {
        setIntegrators((prev) =>
            prev.map((integrator) =>
                integrator.PK === integratorID
                    ? { ...integrator, isDeleted: isDeleted }
                    : integrator
            )
        );
        showSuccessMessage(
            isDeleted
                ? 'Integrator usunięty pomyślnie.'
                : 'Integrator przywrócony pomyślnie.'
        );
      }
    } catch (error) {
      console.error('Error updating integrator:', error);
      showErrorMessage('Wystąpił błąd podczas aktualizacji integratora.');
    }
  };

  // Zmiana statusu integratora
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
        showSuccessMessage('Status integratora został zaktualizowany.');
      }
    } catch (error) {
      console.error('Error changing integrator status:', error);
      showErrorMessage('Wystąpił błąd podczas zmiany statusu integratora.');
    } finally {
      setShowStatusModal(false);
      setSelectedIntegrator(null);
    }
  };

  // Przełączanie menu opcji
  const toggleOptions = (integratorID) => {
    if (showOptionsIntegratorId === integratorID) {
      setShowOptionsIntegratorId(null);
    } else {
      setShowOptionsIntegratorId(integratorID);
    }
  };

  // Zamknięcie menu opcji po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
          optionsMenuRef.current &&
          !optionsMenuRef.current.contains(event.target)
      ) {
        setShowOptionsIntegratorId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Przełączanie szczegółów integratora
  const toggleIntegratorDetails = (integratorID) => {
    if (expandedIntegrators.includes(integratorID)) {
      setExpandedIntegrators(
          expandedIntegrators.filter((id) => id !== integratorID)
      );
    } else {
      setExpandedIntegrators([...expandedIntegrators, integratorID]);
    }
  };

  // Zamknięcie rozszerzonych integratorów po kliknięciu poza nimi
  useEffect(() => {
    const handleClickOutsideIntegrators = (event) => {
      if (
          integratorsListRef.current &&
          !integratorsListRef.current.contains(event.target)
      ) {
        setExpandedIntegrators([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideIntegrators);

    return () => {
      document.removeEventListener(
          'mousedown',
          handleClickOutsideIntegrators
      );
    };
  }, []);

  // Obsługa wyboru opcji z menu
  const handleOptionSelect = (integratorID, action) => {
    if (action === 'changeStatus') {
      // Otwórz modal zmiany statusu
      const integrator = integrators.find((i) => i.PK === integratorID);
      setSelectedIntegrator(integrator);
      setShowStatusModal(true);
    } else if (action === 'delete') {
      handleDeleteOrRestoreIntegrator(integratorID, true);
    } else if (action === 'restore') {
      handleDeleteOrRestoreIntegrator(integratorID, false);
    }
    setShowOptionsIntegratorId(null);
  };

  // Pobierz kolor statusu
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

  return (
      <div className='manage-integrators-container'>
        {isService && (
            <div className='manager-select'>
              <label htmlFor='manager'>Wybierz Managera:</label>
              <select
                  id='manager'
                  value={selectedManagerID}
                  onChange={(e) => setSelectedManagerID(e.target.value)}
              >
                <option value=''>-- Wybierz Managera --</option>
                {managers.map((manager) => {
                  const givenName = manager.cognitoAttributes.find(
                      (attr) => attr.Name === 'given_name'
                  )?.Value;
                  const familyName = manager.cognitoAttributes.find(
                      (attr) => attr.Name === 'family_name'
                  )?.Value;
                  return (
                      <option key={manager.PK} value={manager.PK}>
                        {`${givenName} ${familyName}`}
                      </option>
                  );
                })}
              </select>
            </div>
        )}

        {/* Górny pasek z przyciskiem dodawania, filtrami i wyszukiwarką */}
        <div className='top-bar-integrators'>
          <div className='add-integrator-toggle'>
            <button
                onClick={() => setShowAddIntegratorForm(!showAddIntegratorForm)}
            >
              {showAddIntegratorForm ? 'Anuluj' : 'Dodaj nowy Integrator'}
            </button>
          </div>

          {/* Filtry */}
          <div className='filters-integrators'>
            <select
                className='form-select'
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value=''>Wszystkie lokalizacje</option>
              {[...new Set(integrators.map((i) => i.location))].map(
                  (location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                  )
              )}
            </select>
            <select
                className='form-select'
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value=''>Wszystkie statusy</option>
              <option value='0'>0</option>
              <option value='1'>1</option>
              <option value='2'>2</option>
              <option value='3'>3</option>
            </select>
            <select
                className='form-select'
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
            >
              <option value='all'>Wszystkie</option>
              <option value='active'>Aktywne</option>
              <option value='deleted'>Usunięte</option>
            </select>
          </div>

          {/* Pasek wyszukiwania */}
          <div className='search-bar-integrators'>
            <input
                type='text'
                placeholder='Szukaj integratora...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className='search-icon-integrators' />
          </div>
        </div>

        {/* Modal dodawania integratora */}
        {showAddIntegratorForm && (
            <div className='modal-overlay-integrator'>
              <div className='modal-content-integrator'>
                <h3>Dodaj nowy Integrator</h3>
                <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddIntegrator();
                    }}
                >
                  <div className='form-group-integrator'>
                    <label htmlFor='location'>Lokalizacja</label>
                    <input
                        type='text'
                        id='location'
                        placeholder='Wprowadź lokalizację'
                        value={newIntegrator.location}
                        onChange={(e) =>
                            setNewIntegrator({
                              ...newIntegrator,
                              location: e.target.value,
                            })
                        }
                        required
                    />
                  </div>
                  <div className='form-group-integrator'>
                    <label htmlFor='serialNumber'>Numer seryjny</label>
                    <input
                        type='text'
                        id='serialNumber'
                        placeholder='Wprowadź numer seryjny'
                        value={newIntegrator.serialNumber}
                        onChange={(e) =>
                            setNewIntegrator({
                              ...newIntegrator,
                              serialNumber: e.target.value,
                            })
                        }
                        required
                    />
                  </div>
                  <button type='submit' className='btn-submit-integrator'>
                    Dodaj Integrator
                  </button>
                </form>
                <button
                    className='modal-close-button-integrator'
                    onClick={() => setShowAddIntegratorForm(false)}
                >
                  Anuluj
                </button>
              </div>
            </div>
        )}

        {/* Lista integratorów */}
        {loading ? (
            <div className='loader-container'>
              <GridLoader color='var(--primary-500)' />
            </div>
        ) : (
            <div className='integrators-list' ref={integratorsListRef}>
              {filteredIntegrators.length > 0 ? (
                  filteredIntegrators.map((integrator) => (
                      <div
                          key={integrator.PK}
                          className={`integrator-card ${getStatusColor(
                              integrator.status
                          )} ${integrator.isDeleted ? 'integrator-deleted' : ''}`}
                      >
                        <div className='integrator-header'>
                          <h3>
                            {integrator.serialNumber}
                            {integrator.isDeleted && (
                                <TiDeleteOutline className='deleted-icon' />
                            )}
                          </h3>
                          <div className='integrator-icons'>
                            <FaCog
                                className='integrator-icon'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOptions(integrator.PK);
                                }}
                            />
                            {expandedIntegrators.includes(integrator.PK) ? (
                                <PiCaretCircleUpFill
                                    className='integrator-icon'
                                    onClick={() => toggleIntegratorDetails(integrator.PK)}
                                />
                            ) : (
                                <PiCaretCircleDownFill
                                    className='integrator-icon'
                                    onClick={() => toggleIntegratorDetails(integrator.PK)}
                                />
                            )}
                          </div>
                        </div>

                        {/* Menu opcji */}
                        {showOptionsIntegratorId === integrator.PK && (
                            <div
                                className='options-menu-integrator'
                                ref={optionsMenuRef}
                                onClick={(e) => e.stopPropagation()}
                            >
                              <ul>
                                <li
                                    onClick={() =>
                                        handleOptionSelect(integrator.PK, 'changeStatus')
                                    }
                                >
                                  Zmień status
                                </li>
                                {!integrator.isDeleted ? (
                                    <li
                                        onClick={() =>
                                            handleOptionSelect(integrator.PK, 'delete')
                                        }
                                    >
                                      Usuń integrator
                                    </li>
                                ) : (
                                    <li
                                        onClick={() =>
                                            handleOptionSelect(integrator.PK, 'restore')
                                        }
                                    >
                                      Przywróć integrator
                                    </li>
                                )}
                              </ul>
                            </div>
                        )}

                        {/* Szczegóły integratora */}
                        {expandedIntegrators.includes(integrator.PK) && (
                            <div className='integrator-details'>
                              <p>
                                <strong>Lokalizacja:</strong> {integrator.location}
                              </p>
                              <p>
                                <strong>Status:</strong> {integrator.status}
                              </p>
                              {/* Możesz dodać dodatkowe informacje tutaj */}
                            </div>
                        )}
                      </div>
                  ))
              ) : (
                  <p>Brak integratorów do wyświetlenia.</p>
              )}
            </div>
        )}

        {/* Modal zmiany statusu - przeniesiony poza pętlę map */}
        {showStatusModal && selectedIntegrator && (
            <div className='modal-overlay-integrator'>
              <div className='modal-content-integrator'>
                <h3>Zmiana statusu integratora</h3>
                <p>
                  Wybierz nowy status dla integratora:{' '}
                  <strong>{selectedIntegrator.serialNumber}</strong>
                </p>
                <div className='status-options-integrator'>
                  {[0, 1, 2, 3].map((statusOption) => (
                      <button
                          key={statusOption}
                          className='status-option-modal-integrator'
                          onClick={() =>
                              handleChangeStatus(selectedIntegrator.PK, statusOption)
                          }
                      >
                        Status {statusOption}
                      </button>
                  ))}
                </div>
                <button
                    className='modal-close-button-integrator'
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedIntegrator(null);
                    }}
                >
                  Anuluj
                </button>
              </div>
            </div>
        )}

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
      </div>
  );
};

export default ManageIntegrators;

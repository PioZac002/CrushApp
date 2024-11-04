// src/components/ManageWorkers/ManageWorkers.jsx

import React, { useContext, useState, useEffect } from 'react';
import './manageWorkers.css';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api';
import ToastContainer from '../ToastContainer/ToastContainer';
import { GridLoader } from 'react-spinners';
import { FaSearch } from 'react-icons/fa';

const ManageWorkers = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [newWorker, setNewWorker] = useState({
    email: '',
    given_name: '',
    family_name: '',
    phone_number: '',
    address: '',
  });
  const [selectedRole, setSelectedRole] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showManagerSelect, setShowManagerSelect] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false);

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

  // Functions to display messages
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

  // Fetch managers
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

  // Fetch workers
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(endpoints.getWorkers(user.userID), {
          headers: {
            Authorization: user.id_token,
          },
        });
        if (response && response.data) {
          setWorkers(response.data.workers);
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [user]);

  // Add new worker
  const handleAddWorker = async () => {
    try {
      const requestBody = {
        username: newWorker.email,
        userAttributes: [
          { Name: 'email', Value: newWorker.email },
          { Name: 'given_name', Value: newWorker.given_name },
          { Name: 'family_name', Value: newWorker.family_name },
        ],
      };

      if (showOptionalFields) {
        if (newWorker.phone_number) {
          requestBody.userAttributes.push({
            Name: 'phone_number',
            Value: newWorker.phone_number,
          });
        }
        if (newWorker.address) {
          requestBody.userAttributes.push({
            Name: 'address',
            Value: newWorker.address,
          });
        }
      }

      if (isService && selectedRole) {
        requestBody.role = {
          isService: selectedRole === 'service',
          isManager: selectedRole === 'manager',
        };
      }

      if (isService && selectedManagerID && !selectedRole) {
        requestBody.manager = selectedManagerID;
      }

      // Dodane sprawdzenie dla managera
      if (isManager) {
        requestBody.manager = user.userID;
      }

      const response = await axios.post(
        endpoints.register(user.userID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
        setWorkers((prev) => [...prev, response.data]);
        setNewWorker({
          email: '',
          given_name: '',
          family_name: '',
          phone_number: '',
          address: '',
        });
        setShowAddWorkerForm(false); // Ukryj formularz po dodaniu pracownika
        showSuccessMessage('Pracownik został dodany pomyślnie.');
      }
    } catch (error) {
      console.error('Error adding worker:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania pracownika.');
    }
  };

  // Function to change worker status (delete or restore)
  const handleChangeWorkerStatus = async (workerID, isDeleted) => {
    try {
      const response = await axios.put(
        endpoints.editWorker(user.userID),
        {
          userID: workerID,
          editData: {
            isDeleted: isDeleted,
          },
        },
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
        setWorkers((prev) =>
          prev.map((worker) =>
            worker.PK === workerID
              ? { ...worker, isDeleted: isDeleted }
              : worker
          )
        );
        if (isDeleted) {
          showSuccessMessage('Pracownik został usunięty pomyślnie.');
        } else {
          showSuccessMessage('Pracownik został przywrócony pomyślnie.');
        }
      }
    } catch (error) {
      console.error('Error changing worker status:', error);
      showErrorMessage('Wystąpił błąd podczas zmiany statusu pracownika.');
    }
  };

  // Filtering workers
  const filteredWorkers = workers
    .filter((worker) => {
      if (filter === 'active') return !worker.isDeleted;
      if (filter === 'deleted') return worker.isDeleted;
      return true;
    })
    .filter((worker) => {
      const givenNameAttr = worker.cognitoAttributes?.find(
        (attr) => attr.Name === 'given_name'
      );
      const familyNameAttr = worker.cognitoAttributes?.find(
        (attr) => attr.Name === 'family_name'
      );
      const givenName = givenNameAttr ? givenNameAttr.Value : '';
      const familyName = familyNameAttr ? familyNameAttr.Value : '';

      const fullName = `${givenName} ${familyName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });

  return (
    <div className='manage-workers-container'>
      {/* Top bar with add worker button, filter, and search */}
      <div className='top-bar-workers'>
        <div className='add-worker-toggle'>
          <button onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}>
            {showAddWorkerForm ? 'Anuluj' : 'Dodaj nowego pracownika'}
          </button>
        </div>

        {/* Worker filter */}
        <div className='filter-group'>
          <label htmlFor='statusFilter'>Filtruj według statusu:</label>
          <select
            id='statusFilter'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value='all'>Wszyscy</option>
            <option value='active'>Aktywni</option>
            <option value='deleted'>Usunięci</option>
          </select>
        </div>

        {/* Worker search */}
        <div className='search-bar-workers'>
          <input
            type='text'
            placeholder='Szukaj pracownika...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className='search-icon-workers' />
        </div>
      </div>

      {/* Add new worker form */}
      {showAddWorkerForm && (
        <>
          <h2 className='section-title'>Dodaj nowego pracownika</h2>
          <form
            className='worker-form'
            onSubmit={(e) => {
              e.preventDefault();
              handleAddWorker();
            }}
          >
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                type='email'
                id='email'
                placeholder='Wprowadź email'
                value={newWorker.email}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, email: e.target.value })
                }
                required
              />
            </div>
            <div className='form-group'>
              <label htmlFor='given_name'>Imię</label>
              <input
                type='text'
                id='given_name'
                placeholder='Wprowadź imię'
                value={newWorker.given_name}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, given_name: e.target.value })
                }
                required
              />
            </div>
            <div className='form-group'>
              <label htmlFor='family_name'>Nazwisko</label>
              <input
                type='text'
                id='family_name'
                placeholder='Wprowadź nazwisko'
                value={newWorker.family_name}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, family_name: e.target.value })
                }
                required
              />
            </div>

            {isService && (
              <>
                <div className='form-group'>
                  <label>Rola:</label>
                  <div className='radio-group'>
                    <label>
                      <input
                        type='radio'
                        name='role'
                        value='service'
                        checked={selectedRole === 'service'}
                        onChange={(e) => {
                          setSelectedRole(e.target.value);
                          setShowManagerSelect(false);
                        }}
                      />
                      Serwisant
                    </label>
                    <label>
                      <input
                        type='radio'
                        name='role'
                        value='manager'
                        checked={selectedRole === 'manager'}
                        onChange={(e) => {
                          setSelectedRole(e.target.value);
                          setShowManagerSelect(false);
                        }}
                      />
                      Manager
                    </label>
                    <label>
                      <input
                        type='radio'
                        name='role'
                        value=''
                        checked={selectedRole === ''}
                        onChange={() => {
                          setSelectedRole('');
                          setShowManagerSelect(true);
                        }}
                      />
                      Pracownik (bez roli)
                    </label>
                  </div>
                </div>

                {showManagerSelect && (
                  <div className='form-group'>
                    <label htmlFor='manager'>Wybierz Managera</label>
                    <select
                      id='manager'
                      value={selectedManagerID}
                      onChange={(e) => setSelectedManagerID(e.target.value)}
                    >
                      <option value=''>-- Wybierz Managera --</option>
                      {managers.map((manager) => {
                        const givenNameAttr = manager.cognitoAttributes?.find(
                          (attr) => attr.Name === 'given_name'
                        );
                        const familyNameAttr = manager.cognitoAttributes?.find(
                          (attr) => attr.Name === 'family_name'
                        );
                        const givenName = givenNameAttr
                          ? givenNameAttr.Value
                          : 'N/A';
                        const familyName = familyNameAttr
                          ? familyNameAttr.Value
                          : 'N/A';

                        return (
                          <option key={manager.PK} value={manager.PK}>
                            {`${givenName} ${familyName}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className='form-group checkbox-group'>
              <label>
                <input
                  type='checkbox'
                  id='optionalFields'
                  checked={showOptionalFields}
                  onChange={() => setShowOptionalFields((prev) => !prev)}
                />
                Opcjonalne dane
              </label>
            </div>

            {showOptionalFields && (
              <>
                <div className='form-group'>
                  <label htmlFor='phone_number'>Numer telefonu</label>
                  <input
                    type='tel'
                    id='phone_number'
                    placeholder='Wprowadź numer telefonu'
                    value={newWorker.phone_number}
                    onChange={(e) =>
                      setNewWorker({
                        ...newWorker,
                        phone_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='address'>Adres</label>
                  <input
                    type='text'
                    id='address'
                    placeholder='Wprowadź adres'
                    value={newWorker.address}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, address: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className='form-group'>
              <button type='submit' className='btn-submit'>
                Dodaj pracownika
              </button>
            </div>
          </form>
        </>
      )}

      <h2 className='section-title'>Lista Pracowników</h2>

      {loading ? (
        <div className='loader-container'>
          <GridLoader color='var(--primary-500)' />
        </div>
      ) : (
        <div className='worker-list'>
          {filteredWorkers.map((worker) => {
            const emailAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'email'
            );
            const givenNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'given_name'
            );
            const familyNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'family_name'
            );

            const email = emailAttr ? emailAttr.Value : 'N/A';
            const givenName = givenNameAttr ? givenNameAttr.Value : 'N/A';
            const familyName = familyNameAttr ? familyNameAttr.Value : 'N/A';

            return (
              <div
                className={`worker-card ${
                  worker.isDeleted ? 'card-inactive' : 'card-active'
                }`}
                key={worker.PK}
              >
                <h5>
                  {givenName} {familyName}
                </h5>
                <p>Email: {email}</p>
                <p>Status: {worker.isDeleted ? 'Usunięty' : 'Aktywny'}</p>
                {!worker.isDeleted ? (
                  <button
                    className='btn-delete'
                    onClick={() => handleChangeWorkerStatus(worker.PK, true)}
                  >
                    Usuń
                  </button>
                ) : (
                  <button
                    className='btn-restore'
                    onClick={() => handleChangeWorkerStatus(worker.PK, false)}
                  >
                    Przywróć
                  </button>
                )}
              </div>
            );
          })}
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

export default ManageWorkers;

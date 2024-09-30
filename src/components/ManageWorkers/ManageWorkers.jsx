import React, { useContext, useState, useEffect } from 'react';
import './manageWorkers.css'; // Dodaj stylizację z nowym plikiem CSS
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api';

const ManageWorkers = () => {
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

  const isService = user?.role?.isService;

  // Pobieranie managerów (dla serwisanta)
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
            // Filtruj managerów
            const managerList = response.data.workers.filter(
              (worker) => worker.role.isManager && !worker.isDeleted
            );
            // Aktualizuj stan managerów
            setManagers(managerList);
          }
        } catch (error) {
          console.error('Błąd podczas pobierania managerów:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchManagers();
    }
  }, [user, isService]);

  // Pobieranie pracowników
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
        console.error('Błąd podczas pobierania pracowników:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [user]);

  // Dodawanie nowego pracownika
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
      }
    } catch (error) {
      console.error('Błąd podczas dodawania pracownika:', error);
    }
  };

  // Usuwanie pracownika
  const handleDeleteWorker = async (workerID) => {
    try {
      const response = await axios.put(
        endpoints.editWorker(user.userID),
        {
          userID: workerID,
          editData: {
            isDeleted: true,
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
            worker.PK === workerID ? { ...worker, isDeleted: true } : worker
          )
        );
      }
    } catch (error) {
      console.error('Błąd podczas usuwania pracownika:', error);
    }
  };

  // Filtracja pracowników na podstawie statusu
  const filteredWorkers = workers.filter((worker) => {
    if (filter === 'active') return !worker.isDeleted;
    if (filter === 'deleted') return worker.isDeleted;
    return true;
  });

  return (
    <div className='container mt-5'>
      <h2>Dodaj nowego pracownika</h2>
      <form
        className='row g-3'
        onSubmit={(e) => {
          e.preventDefault();
          handleAddWorker();
        }}
      >
        <div className='col-md-6'>
          <label htmlFor='email' className='form-label'>
            Email
          </label>
          <input
            type='email'
            className='form-control'
            id='email'
            placeholder='Wprowadź email'
            value={newWorker.email}
            onChange={(e) =>
              setNewWorker({ ...newWorker, email: e.target.value })
            }
            required
          />
        </div>
        <div className='col-md-6'>
          <label htmlFor='given_name' className='form-label'>
            Imię
          </label>
          <input
            type='text'
            className='form-control'
            id='given_name'
            placeholder='Wprowadź imię'
            value={newWorker.given_name}
            onChange={(e) =>
              setNewWorker({ ...newWorker, given_name: e.target.value })
            }
            required
          />
        </div>
        <div className='col-md-6'>
          <label htmlFor='family_name' className='form-label'>
            Nazwisko
          </label>
          <input
            type='text'
            className='form-control'
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
            <div className='col-md-6'>
              <label className='form-label'>Rola:</label>
              <div className='form-check'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='role'
                  value='service'
                  checked={selectedRole === 'service'}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setShowManagerSelect(false);
                  }}
                />
                <label className='form-check-label'>Serwisant</label>
              </div>
              <div className='form-check'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='role'
                  value='manager'
                  checked={selectedRole === 'manager'}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setShowManagerSelect(false);
                  }}
                />
                <label className='form-check-label'>Manager</label>
              </div>
              <div className='form-check'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='role'
                  value=''
                  checked={selectedRole === ''}
                  onChange={() => setShowManagerSelect(true)}
                />
                <label className='form-check-label'>Pracownik (bez roli)</label>
              </div>
            </div>

            {showManagerSelect && (
              <div className='col-md-6'>
                <label htmlFor='manager' className='form-label'>
                  Wybierz Managera
                </label>
                <select
                  className='form-select'
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

        <div className='col-12'>
          <div className='form-check'>
            <input
              className='form-check-input'
              type='checkbox'
              id='optionalFields'
              checked={showOptionalFields}
              onChange={() => setShowOptionalFields((prev) => !prev)}
            />
            <label className='form-check-label' htmlFor='optionalFields'>
              Opcjonalne dane
            </label>
          </div>
        </div>

        {showOptionalFields && (
          <>
            <div className='col-md-6'>
              <label htmlFor='phone_number' className='form-label'>
                Numer telefonu
              </label>
              <input
                type='tel'
                className='form-control'
                id='phone_number'
                placeholder='Wprowadź numer telefonu'
                value={newWorker.phone_number}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, phone_number: e.target.value })
                }
              />
            </div>
            <div className='col-md-6'>
              <label htmlFor='address' className='form-label'>
                Adres
              </label>
              <input
                type='text'
                className='form-control'
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

        <div className='col-12 mt-3'>
          <button type='submit' className='btn btn-primary'>
            Dodaj pracownika
          </button>
        </div>
      </form>

      <h2 className='mt-5'>Lista Pracowników</h2>

      <div className='mb-4'>
        <label htmlFor='statusFilter' className='form-label'>
          Filtruj według statusu:
        </label>
        <select
          id='statusFilter'
          className='form-select'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value='all'>Wszyscy</option>
          <option value='active'>Aktywni</option>
          <option value='deleted'>Usunięci</option>
        </select>
      </div>

      <div className='row'>
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
            <div className='col-md-4 col-sm-6 mb-4' key={worker.PK}>
              <div
                className={`worker-card ${
                  worker.isDeleted ? 'bg-light-pink' : 'bg-light-green'
                }`}
              >
                <h5>
                  {givenName} {familyName}
                </h5>
                <p>Email: {email}</p>
                <p>Status: {worker.isDeleted ? 'Usunięty' : 'Aktywny'}</p>
                <button
                  className={`btn ${
                    worker.isDeleted ? 'btn-secondary' : 'btn-danger'
                  }`}
                  onClick={() => handleDeleteWorker(worker.PK)}
                  disabled={worker.isDeleted}
                >
                  {worker.isDeleted ? 'Usunięty' : 'Usuń'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageWorkers;

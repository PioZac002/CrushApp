import React, { useContext, useState, useEffect } from 'react';
import Card from '../MainBody/Dashboard/Card';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api';
import './manageIntegrators.css';

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
  const [filterLocation, setFilterLocation] = useState(''); // Lokalizacja
  const [filterStatus, setFilterStatus] = useState(''); // Status
  const [filterAvailability, setFilterAvailability] = useState('all'); // Dostępność

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
  // Filtry

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

  // Pobieranie managerów (jeśli użytkownik to Serwisant)
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
              (worker) => worker.role.isManager && !worker.role.isService
            );
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
        console.error('Błąd podczas pobierania integratorów:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isService || isManager) {
      fetchIntegrators();
    }
  }, [user, selectedManagerID, isManager, isService]);

  // Filtrowanie integratorów
  const filteredIntegrators = integrators.filter((integrator) => {
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
        showSuccessMessage('Integrator został dodany pomyślnie.');
      }
    } catch (error) {
      console.error('Błąd podczas dodawania integratora:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania integratora.');
    }
  };

  // Usuwanie (oznaczanie jako usunięty) integratora
  const handleDeleteIntegrator = async (integratorID) => {
    try {
      const response = await axios.put(
        endpoints.editIntegrator(user.userID),
        {
          userID: isService ? selectedManagerID : user.userID,
          editData: {
            isDeleted: true,
            PK: integratorID,
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
              ? { ...integrator, isDeleted: true }
              : integrator
          )
        );
        showSuccessMessage('Integrator został usunięty pomyślnie.');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania integratora:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania integratora.');
    }
  };

  return (
    <div className='container mt-5'>
      {isService && (
        <div className='mb-4'>
          <h2>Wybierz Managera</h2>
          <select
            className='form-select'
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

      <h2>Lista Integratorów</h2>

      {/* Filtry */}
      <div className='filters'>
        <div className='row'>
          <div className='col-md-4'>
            <label htmlFor='location-filter' className='form-label'>
              Filtruj po Lokalizacji
            </label>
            <select
              id='location-filter'
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
          </div>
          <div className='col-md-4'>
            <label htmlFor='status-filter' className='form-label'>
              Filtruj po Statusie
            </label>
            <select
              id='status-filter'
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
          </div>
          <div className='col-md-4'>
            <label htmlFor='availability-filter' className='form-label'>
              Filtruj po Dostępności
            </label>
            <select
              id='availability-filter'
              className='form-select'
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
            >
              <option value='all'>Wszystkie</option>
              <option value='active'>Aktywne</option>
              <option value='deleted'>Usunięte</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className='integrators-list'>
          {filteredIntegrators.map((integrator) => (
            <div key={integrator.PK} className='integrator-card'>
              <Card
                title={`Integrator: ${integrator.serialNumber}`}
                icon='bi bi-tools'
              >
                <p>
                  <strong>Lokalizacja:</strong> {integrator.location}
                </p>
                <p>
                  <strong>Status:</strong> {integrator.status}
                </p>
                <button
                  className='btn btn-danger'
                  onClick={() => handleDeleteIntegrator(integrator.PK)}
                  disabled={integrator.isDeleted}
                >
                  {integrator.isDeleted ? 'Usunięty' : 'Usuń'}
                </button>
              </Card>
            </div>
          ))}
        </div>
      )}

      <h2 className='mt-4'>Dodaj nowy Integrator</h2>
      <form
        className='row g-3'
        onSubmit={(e) => {
          e.preventDefault();
          handleAddIntegrator();
        }}
      >
        <div className='col-md-6'>
          <label htmlFor='location' className='form-label'>
            Lokalizacja
          </label>
          <input
            type='text'
            className='form-control'
            id='location'
            placeholder='Wprowadź lokalizację'
            value={newIntegrator.location}
            onChange={(e) =>
              setNewIntegrator({ ...newIntegrator, location: e.target.value })
            }
            required
          />
        </div>
        <div className='col-md-6'>
          <label htmlFor='serialNumber' className='form-label'>
            Numer seryjny
          </label>
          <input
            type='text'
            className='form-control'
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
        <div className='col-12 mt-3'>
          <button type='submit' className='btn btn-primary'>
            Dodaj Integrator
          </button>
        </div>
      </form>
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

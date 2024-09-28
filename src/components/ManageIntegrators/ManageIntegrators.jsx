import React, { useContext, useState, useEffect } from 'react';
import Card from '../MainBody/Dashboard/Card'; // Komponent karty, z którego korzystasz
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api'; // Import ścieżki do pliku z endpointami

const ManageIntegrators = () => {
  const { user } = useContext(AuthContext);
  const [integrators, setIntegrators] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [loading, setLoading] = useState(false);
  const [newIntegrator, setNewIntegrator] = useState({
    location: '',
    serialNumber: '',
  });

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
      }
    } catch (error) {
      console.error('Błąd podczas dodawania integratora:', error);
    }
  };

  // Usuwanie (oznaczanie jako usunięty) integratora
  const handleDeleteIntegrator = async (integratorID) => {
    try {
      const response = await axios.put(
        endpoints.editIntegrator(user.userID), // Ścieżka do edycji/usuwania integratorów
        {
          userID: isService ? selectedManagerID : user.userID, // ID użytkownika (dla Serwisanta będzie to ID managera)
          editData: {
            isDeleted: true, // Oznaczenie integratora jako usuniętego
            PK: integratorID, // ID integratora do edycji/usunięcia
          },
        },
        {
          headers: {
            Authorization: `Bearer ${user.id_token}`, // Bearer token dla autoryzacji
          },
        }
      );

      if (response && response.data) {
        // Aktualizacja stanu - oznaczenie integratora jako usuniętego
        setIntegrators((prev) =>
          prev.map((integrator) =>
            integrator.PK === integratorID
              ? { ...integrator, isDeleted: true }
              : integrator
          )
        );
      }
    } catch (error) {
      console.error('Błąd podczas usuwania integratora:', error);
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
      <Card title='Integratorzy' icon='bi bi-tools'>
        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <table className='table table-striped'>
            <thead>
              <tr>
                <th>Numer seryjny</th>
                <th>Lokalizacja</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {integrators.map((integrator) => (
                <tr key={integrator.PK}>
                  <td>{integrator.serialNumber}</td>
                  <td>{integrator.location}</td>
                  <td>
                    <button
                      className='btn btn-danger'
                      onClick={() => handleDeleteIntegrator(integrator.PK)}
                      disabled={integrator.isDeleted}
                    >
                      {integrator.isDeleted ? 'Usunięty' : 'Usuń'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

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
    </div>
  );
};

export default ManageIntegrators;

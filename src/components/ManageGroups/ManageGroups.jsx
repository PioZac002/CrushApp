import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api'; // Importuj ścieżki do API
import './manageGroups.css'; // Importuj stylizację

const ManageGroups = () => {
  const { user } = useContext(AuthContext);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

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
            const managerList = response.data.workers.filter(
              (worker) => worker.role.isManager
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

  // Pobieranie grup
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const managerID = isService ? selectedManagerID : user.userID;
        const requestUrl = isService
          ? `${endpoints.getIntegratorGroups(
              user.userID
            )}?groupsFor=${selectedManagerID}`
          : endpoints.getIntegratorGroups(user.userID);

        const response = await axios.get(requestUrl, {
          headers: {
            Authorization: user.id_token,
          },
        });

        if (response && response.data) {
          setGroups(response.data.integratorGroups || []);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania grup:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isManager || (isService && selectedManagerID)) {
      fetchGroups();
    }
  }, [user, selectedManagerID, isManager, isService]);

  // Dodawanie grupy
  const handleAddGroup = async () => {
    if (!groupName) {
      return alert('Proszę podać nazwę grupy');
    }

    try {
      const requestBody = isService
        ? { userID: selectedManagerID, integratorGroupName: groupName } // Dodanie userID (ID wybranego managera) w przypadku serwisanta
        : { integratorGroupName: groupName };

      const managerID = isService ? user.userID : user.userID; // Zmieniono, by wysyłać ID serwisanta, a nie managera

      // Wysłanie żądania POST z odpowiednim payloadem
      const response = await axios.post(
        endpoints.addGroup(managerID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token, // Token Serwisanta
          },
        }
      );

      if (response && response.data) {
        setGroups([...groups, response.data]); // Dodanie nowo utworzonej grupy do listy
        setGroupName(''); // Resetowanie pola
      }
    } catch (error) {
      console.error('Błąd podczas dodawania grupy:', error);
    }
  };

  // Edytowanie lub usuwanie grupy
  const editGroup = async (groupID, groupName, isDeleted = false) => {
    try {
      const requestBody = {
        userID: isService ? selectedManagerID : user.userID, // Jeśli serwisant, przekazujemy userID managera
        editData: {
          PK: groupID, // ID grupy
          integratorGroupName:
            groupName ||
            groups.find((group) => group.PK === groupID).integratorGroupName, // Przekazujemy nazwę grupy, jeśli istnieje nowa nazwa
          isDeleted: isDeleted, // Jeśli chcemy usunąć, ustawiamy isDeleted
        },
      };

      // Wysłanie PUT do API
      const response = await axios.put(
        endpoints.editGroup(user.userID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token, // Token autoryzacji
          },
        }
      );

      if (response && response.data) {
        // Aktualizacja stanu - aktualizacja danych grupy
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.PK === groupID
              ? {
                  ...group,
                  integratorGroupName: response.data.integratorGroupName,
                  isDeleted: isDeleted,
                }
              : group
          )
        );
      }
    } catch (error) {
      console.error('Błąd podczas edytowania grupy:', error);
    }
  };

  return (
    <div className='manage-groups'>
      {/* Dla Serwisanta: Wybór managera */}
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

      {/* Input do tworzenia nowej grupy */}
      <div className='add-group'>
        <input
          type='text'
          placeholder='Nazwa grupy'
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <button
          onClick={handleAddGroup}
          disabled={!groupName || (isService && !selectedManagerID)}
        >
          Dodaj grupę
        </button>
      </div>

      {/* Lista grup */}
      <div className='group-list'>
        {groups.length > 0 ? (
          groups.map((group) => (
            <div className='group-card' key={group.PK}>
              <h3>{group.integratorGroupName}</h3>

              {/* Sekcja użytkowników */}
              <div className='users-section'>
                <h4>Użytkownicy:</h4>
                <ul>
                  {group.users?.map((user) => (
                    <li key={user.PK}>{user.name}</li>
                  ))}
                </ul>
                <button onClick={() => console.log('Dodaj użytkownika')}>
                  Dodaj Użytkownika
                </button>
              </div>

              {/* Sekcja integratorów */}
              <div className='integrators-section'>
                <h4>Integratory:</h4>
                <ul>
                  {group.integrators?.map((integrator) => (
                    <li key={integrator.PK}>{integrator.name}</li>
                  ))}
                </ul>
                <button onClick={() => console.log('Dodaj integratora')}>
                  Dodaj Integrator
                </button>
              </div>

              {/* Edycja i usuwanie grupy */}
              <button
                className='edit-group'
                onClick={() => editGroup(group.PK, 'Nowa nazwa grupy')}
              >
                Edytuj Grupę
              </button>
              <button
                className='delete-group'
                onClick={() =>
                  editGroup(group.PK, group.integratorGroupName, true)
                }
              >
                Usuń Grupę
              </button>
            </div>
          ))
        ) : (
          <p>{loading ? 'Ładowanie grup...' : 'Brak grup do wyświetlenia.'}</p>
        )}
      </div>
    </div>
  );
};

export default ManageGroups;

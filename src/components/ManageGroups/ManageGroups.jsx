// src/components/ManageGroups/ManageGroups.jsx

import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { endpoints } from '../../api/api';
import './manageGroups.css';
import ToastContainer from '../ToastContainer/ToastContainer';
import { FaCog, FaSearch } from 'react-icons/fa';
import { PiCaretCircleDownFill, PiCaretCircleUpFill } from 'react-icons/pi';
import { TiDeleteOutline } from 'react-icons/ti';
import { GridLoader } from 'react-spinners';

const ManageGroups = () => {
  const { user } = useContext(AuthContext);
  const [managers, setManagers] = useState([]);
  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [integrators, setIntegrators] = useState({});
  const [groupUsers, setGroupUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // Nowa zmienna stanu dla wyszukiwania
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showOptionsGroupId, setShowOptionsGroupId] = useState(null);
  const [modalData, setModalData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [availableIntegrators, setAvailableIntegrators] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedIntegratorID, setSelectedIntegratorID] = useState('');
  const [selectedUserID, setSelectedUserID] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const optionsMenuRef = useRef(null);
  const groupListRef = useRef(null); // Referencja do listy grup

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

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
              (worker) => worker.role.isManager && !worker.isDeleted
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
        const managerID = isService ? selectedManagerID : '';
        const requestUrl = endpoints.getIntegratorGroups(
          user.userID,
          managerID
        );

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
        ? { managerID: selectedManagerID, integratorGroupName: groupName }
        : { integratorGroupName: groupName };

      const creatorID = user.userID;

      const response = await axios.post(
        endpoints.addGroup(creatorID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
        setGroups([...groups, response.data]);
        setGroupName('');
        setShowAddGroup(false); // Ukryj formularz po dodaniu grupy
        showSuccessMessage('Grupa została dodana pomyślnie.');
      }
    } catch (error) {
      console.error('Błąd podczas dodawania grupy:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania grupy.');
    }
  };

  // Edytowanie lub usuwanie grupy
  const editGroup = async (groupID, groupName, isDeleted = false) => {
    try {
      const requestBody = {
        userID: isService ? selectedManagerID : user.userID,
        editData: {
          isDeleted: isDeleted,
          editData: {
            PK: groupID,
            integratorGroupName:
              groupName ||
              groups.find((group) => group.PK === groupID).integratorGroupName,
          },
        },
      };

      const response = await axios.put(
        endpoints.editGroup(user.userID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
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
        showSuccessMessage('Grupa została zaktualizowana pomyślnie.');
      }
    } catch (error) {
      console.error('Błąd podczas edytowania grupy:', error);
      showErrorMessage('Wystąpił błąd podczas edytowania grupy.');
    }
  };

  // Funkcja obsługująca rozwijanie/zwijanie grup i pobieranie integratorów oraz użytkowników
  const toggleGroupDetails = async (groupID) => {
    if (expandedGroups.includes(groupID)) {
      setExpandedGroups(expandedGroups.filter((id) => id !== groupID));
    } else {
      try {
        const managerID = isService ? selectedManagerID : '';
        const requestUrl = `${endpoints.getGroupDetails(
          user.userID
        )}?groups=${groupID}${managerID ? `&groupsFor=${managerID}` : ''}`;

        const response = await axios.get(requestUrl, {
          headers: {
            Authorization: user.id_token,
          },
        });

        if (response && response.data && response.data.integratorsInGroups) {
          const integratorsData = [];
          response.data.integratorsInGroups.forEach((groupData) => {
            Object.values(groupData).forEach((integratorList) => {
              integratorList.forEach((integrator) => {
                if (!integrator.isDeletedFromGroup) {
                  integratorsData.push(integrator);
                }
              });
            });
          });
          setIntegrators((prev) => ({
            ...prev,
            [groupID]: integratorsData,
          }));
        }

        // Pobierz użytkowników grupy
        const group = groups.find((g) => g.PK === groupID);
        if (group && group.users) {
          setGroupUsers((prev) => ({
            ...prev,
            [groupID]: group.users,
          }));
        }

        setExpandedGroups([...expandedGroups, groupID]);
      } catch (error) {
        console.error('Błąd podczas pobierania danych grupy:', error);
      }
    }
  };

  // Zamykanie rozwiniętych grup po kliknięciu w dowolne miejsce
  useEffect(() => {
    const handleClickOutsideGroups = (event) => {
      if (
        groupListRef.current &&
        !groupListRef.current.contains(event.target)
      ) {
        setExpandedGroups([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideGroups);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideGroups);
    };
  }, []);

  // Funkcja obsługująca wyświetlanie opcji (koło zębatego)
  const toggleOptions = (groupID) => {
    if (showOptionsGroupId === groupID) {
      setShowOptionsGroupId(null);
    } else {
      setShowOptionsGroupId(groupID);
    }
  };

  // Zamykanie menu opcji po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target)
      ) {
        setShowOptionsGroupId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funkcja obsługująca akcje z menu opcji
  const handleOptionSelect = (groupID, action) => {
    setModalData({ groupID, action });
    setShowModal(true);
    setShowOptionsGroupId(null);
  };

  // Funkcje dodawania i usuwania integratorów
  const addIntegratorToGroup = async (integratorID, groupID) => {
    try {
      const creatorID = user.userID;
      const requestBody = {
        integratorID: integratorID,
        integratorGroupID: groupID,
      };

      if (isService) {
        requestBody.managerID = selectedManagerID;
      }

      const response = await axios.post(
        endpoints.addIntegratorToGroup(creatorID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
        showSuccessMessage('Integrator został dodany do grupy.');
        // Odśwież integratory w grupie
        toggleGroupDetails(groupID);
      }
    } catch (error) {
      console.error('Błąd podczas dodawania integratora do grupy:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania integratora do grupy.');
    }
  };

  const removeIntegratorFromGroup = async (integratorID, groupID) => {
    try {
      const creatorID = user.userID;
      const requestBody = {
        integratorGroupID: groupID,
        integratorID: integratorID,
      };

      if (isService) {
        requestBody.managerID = selectedManagerID;
      }

      const response = await axios.delete(
        endpoints.removeIntegratorFromGroup(creatorID),
        {
          headers: {
            Authorization: user.id_token,
            'Content-Type': 'application/json',
          },
          data: requestBody,
        }
      );

      if (response && response.data) {
        showSuccessMessage('Integrator został usunięty z grupy.');
        // Odśwież integratory w grupie
        toggleGroupDetails(groupID);
      }
    } catch (error) {
      console.error('Błąd podczas usuwania integratora z grupy:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania integratora z grupy.');
    }
  };

  // Funkcje dodawania i usuwania użytkowników
  const addUserToGroup = async (userIDToAdd, groupID) => {
    try {
      const creatorID = user.userID;
      const requestBody = {
        integratorGroupID: groupID,
        addedUserID: userIDToAdd,
      };

      if (isService) {
        requestBody.managerID = selectedManagerID;
      }

      const response = await axios.post(
        endpoints.addUserToGroup(creatorID),
        requestBody,
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );

      if (response && response.data) {
        showSuccessMessage('Użytkownik został dodany do grupy.');
        // Odśwież użytkowników w grupie
        toggleGroupDetails(groupID);
      }
    } catch (error) {
      console.error('Błąd podczas dodawania użytkownika do grupy:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania użytkownika do grupy.');
    }
  };

  const removeUserFromGroup = async (userIDToRemove, groupID) => {
    try {
      const creatorID = user.userID;
      const requestBody = {
        removedUserID: userIDToRemove,
        integratorGroupID: groupID,
      };

      if (isService) {
        requestBody.managerID = selectedManagerID;
      }

      const response = await axios.delete(
        endpoints.removeUserFromGroup(creatorID),
        {
          headers: {
            Authorization: user.id_token,
            'Content-Type': 'application/json',
          },
          data: requestBody,
        }
      );

      if (response && response.data) {
        showSuccessMessage('Użytkownik został usunięty z grupy.');
        // Odśwież użytkowników w grupie
        toggleGroupDetails(groupID);
      }
    } catch (error) {
      console.error('Błąd podczas usuwania użytkownika z grupy:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania użytkownika z grupy.');
    }
  };

  // Pobieranie dostępnych integratorów i użytkowników do dodania
  useEffect(() => {
    const fetchAvailableIntegrators = async () => {
      try {
        const creatorID = user.userID;
        const managerID = isService ? selectedManagerID : '';
        const response = await axios.get(
          endpoints.getIntegrators(creatorID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (response && response.data) {
          setAvailableIntegrators(response.data.integrators || []);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania integratorów:', error);
      }
    };

    const fetchAvailableUsers = async () => {
      try {
        const requesterID = user.userID;
        const response = await axios.get(endpoints.getWorkers(requesterID), {
          headers: {
            Authorization: user.id_token,
          },
        });
        if (response && response.data) {
          setAvailableUsers(response.data.workers || []);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania użytkowników:', error);
      }
    };

    if (showModal) {
      if (
        modalData.action === 'addIntegrator' ||
        modalData.action === 'removeIntegrator'
      ) {
        fetchAvailableIntegrators();
      }
      if (modalData.action === 'addUser' || modalData.action === 'removeUser') {
        fetchAvailableUsers();
      }
    }
  }, [showModal, modalData, user, isService, selectedManagerID]);

  // Filtrowanie grup
  const filteredGroups = groups
    .filter((group) => {
      if (filter === 'active') return !group.isDeleted;
      if (filter === 'deleted') return group.isDeleted;
      return true;
    })
    .filter((group) =>
      group.integratorGroupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className='manage-groups-container'>
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

      {/* Przycisk do pokazania/ukrycia formularza dodawania grupy */}
      <div className='top-bar'>
        <div className='add-group-toggle'>
          <button onClick={() => setShowAddGroup(!showAddGroup)}>
            {showAddGroup ? 'Anuluj' : 'Dodaj nową grupę'}
          </button>
        </div>

        {/* Filtr grup */}
        <div className='filter-section'>
          <label htmlFor='statusFilter'>Filtruj grupy:</label>
          <select
            id='statusFilter'
            className='form-select'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value='all'>Wszystkie</option>
            <option value='active'>Aktywne</option>
            <option value='deleted'>Usunięte</option>
          </select>
        </div>

        {/* Wyszukiwanie grup */}
        <div className='search-bar'>
          <input
            type='text'
            placeholder='Szukaj grupy...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className='search-icon' />
        </div>
      </div>

      {/* Formularz dodawania nowej grupy */}
      {showAddGroup && (
        <div className='add-group-form'>
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
      )}

      {/* Lista grup */}
      <div className='group-list' ref={groupListRef}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              className={`group-card ${group.isDeleted ? 'group-deleted' : ''}`}
              key={group.PK}
            >
              <div className='group-header'>
                <h3>
                  {group.integratorGroupName}
                  {group.isDeleted && (
                    <TiDeleteOutline className='deleted-icon' />
                  )}
                </h3>
                <div className='group-icons'>
                  <FaCog
                    className='group-icon'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOptions(group.PK);
                    }}
                  />
                  {expandedGroups.includes(group.PK) ? (
                    <PiCaretCircleUpFill
                      className='group-icon'
                      onClick={() => toggleGroupDetails(group.PK)}
                    />
                  ) : (
                    <PiCaretCircleDownFill
                      className='group-icon'
                      onClick={() => toggleGroupDetails(group.PK)}
                    />
                  )}
                </div>
              </div>

              {/* Menu opcji */}
              {showOptionsGroupId === group.PK && (
                <div
                  className='options-menu'
                  ref={optionsMenuRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ul>
                    <li
                      onClick={() =>
                        handleOptionSelect(group.PK, 'addIntegrator')
                      }
                    >
                      Dodaj integrator
                    </li>
                    <li
                      onClick={() =>
                        handleOptionSelect(group.PK, 'removeIntegrator')
                      }
                    >
                      Usuń integrator
                    </li>
                    <li onClick={() => handleOptionSelect(group.PK, 'addUser')}>
                      Dodaj użytkownika
                    </li>
                    <li
                      onClick={() => handleOptionSelect(group.PK, 'removeUser')}
                    >
                      Usuń użytkownika
                    </li>
                    <li
                      onClick={() =>
                        editGroup(group.PK, group.integratorGroupName, true)
                      }
                    >
                      Usuń grupę
                    </li>
                  </ul>
                </div>
              )}

              {/* Szczegóły grupy */}
              {expandedGroups.includes(group.PK) && (
                <div className='group-details'>
                  {/* Integratory */}
                  <div className='integrators-section'>
                    <h4>Integratory:</h4>
                    <ul>
                      {integrators[group.PK]?.map((integrator) => (
                        <li
                          key={integrator.PK}
                          className={integrator.isDeleted ? 'deleted-item' : ''}
                        >
                          {integrator.serialNumber} - {integrator.location}
                          {integrator.isDeleted && (
                            <TiDeleteOutline className='deleted-icon' />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Użytkownicy */}
                  <div className='users-section'>
                    <h4>Użytkownicy:</h4>
                    <ul>
                      {groupUsers[group.PK]?.map((userItem) => (
                        <li key={userItem.PK}>{userItem.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : loading ? (
          <div className='loader-container'>
            <GridLoader color='var(--primary-500)' />
          </div>
        ) : (
          <p>Brak grup do wyświetlenia.</p>
        )}
      </div>

      {/* Komponent ToastContainer */}
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

      {/* Modal do dodawania/usuwania integratorów i użytkowników */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            {/* Zawartość modala w zależności od akcji */}
            {modalData.action === 'addIntegrator' && (
              <>
                <h3>Dodaj Integrator do grupy</h3>
                <div className='modal-field'>
                  <label>Wybierz Integrator:</label>
                  <select
                    value={selectedIntegratorID}
                    onChange={(e) => setSelectedIntegratorID(e.target.value)}
                  >
                    <option value=''>-- Wybierz Integrator --</option>
                    {availableIntegrators.map((integrator) => (
                      <option key={integrator.PK} value={integrator.PK}>
                        {integrator.serialNumber} - {integrator.location}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    addIntegratorToGroup(
                      selectedIntegratorID,
                      modalData.groupID
                    );
                    setShowModal(false);
                  }}
                  disabled={!selectedIntegratorID}
                >
                  Dodaj
                </button>
              </>
            )}
            {modalData.action === 'removeIntegrator' && (
              <>
                <h3>Usuń Integrator z grupy</h3>
                <div className='modal-field'>
                  <label>Wybierz Integrator:</label>
                  <select
                    value={selectedIntegratorID}
                    onChange={(e) => setSelectedIntegratorID(e.target.value)}
                  >
                    <option value=''>-- Wybierz Integrator --</option>
                    {integrators[modalData.groupID]?.map((integrator) => (
                      <option key={integrator.PK} value={integrator.PK}>
                        {integrator.serialNumber} - {integrator.location}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    removeIntegratorFromGroup(
                      selectedIntegratorID,
                      modalData.groupID
                    );
                    setShowModal(false);
                  }}
                  disabled={!selectedIntegratorID}
                >
                  Usuń
                </button>
              </>
            )}
            {modalData.action === 'addUser' && (
              <>
                <h3>Dodaj Użytkownika do grupy</h3>
                <div className='modal-field'>
                  <label>Wybierz Użytkownika:</label>
                  <select
                    value={selectedUserID}
                    onChange={(e) => setSelectedUserID(e.target.value)}
                  >
                    <option value=''>-- Wybierz Użytkownika --</option>
                    {availableUsers.map((userItem) => (
                      <option key={userItem.PK} value={userItem.PK}>
                        {userItem.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    addUserToGroup(selectedUserID, modalData.groupID);
                    setShowModal(false);
                  }}
                  disabled={!selectedUserID}
                >
                  Dodaj
                </button>
              </>
            )}
            {modalData.action === 'removeUser' && (
              <>
                <h3>Usuń Użytkownika z grupy</h3>
                <div className='modal-field'>
                  <label>Wybierz Użytkownika:</label>
                  <select
                    value={selectedUserID}
                    onChange={(e) => setSelectedUserID(e.target.value)}
                  >
                    <option value=''>-- Wybierz Użytkownika --</option>
                    {groupUsers[modalData.groupID]?.map((userItem) => (
                      <option key={userItem.PK} value={userItem.PK}>
                        {userItem.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    removeUserFromGroup(selectedUserID, modalData.groupID);
                    setShowModal(false);
                  }}
                  disabled={!selectedUserID}
                >
                  Usuń
                </button>
              </>
            )}
            <button className='modal-close' onClick={() => setShowModal(false)}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGroups;

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
  const [integrators, setIntegrators] = useState({});
  const [groupUsers, setGroupUsers] = useState({});
  // Usunięto poprzedni stan loading
  // const [loading, setLoading] = useState(false);

  // Dodano nowe stany ładowania
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
  const groupListRef = useRef(null);

  // Dodano expandedGroups dla zarządzania stanem interfejsu użytkownika
  const [expandedGroups, setExpandedGroups] = useState([]);

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

  // Pobieranie managerów (dla widoku serwisowego)
  useEffect(() => {
    if (isService) {
      const fetchManagers = async () => {
        setLoadingManagers(true);
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
          setLoadingManagers(false);
        }
      };
      fetchManagers();
    }
  }, [user, isService]);

  // Pobieranie grup i ich szczegółów
  useEffect(() => {
    const fetchGroupsAndDetails = async () => {
      setLoadingGroups(true);
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
          const fetchedGroups = response.data.integratorGroups || [];
          setGroups(fetchedGroups);

          // Pobieranie szczegółów dla każdej grupy
          setLoadingGroupDetails(true);
          await Promise.all(
            fetchedGroups.map((group) => fetchGroupDetails(group.PK))
          );
          setLoadingGroupDetails(false);
        }
      } catch (error) {
        console.error('Error fetching groups and details:', error);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (isManager || (isService && selectedManagerID)) {
      fetchGroupsAndDetails();
    }
  }, [user, selectedManagerID, isManager, isService]);

  // Pobieranie dostępnych użytkowników (pracowników) do dodania do grup
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const currentUserID = user.userID;
        const response = await axios.get(endpoints.getWorkers(currentUserID), {
          headers: {
            Authorization: user.id_token,
          },
        });
        if (response && response.data) {
          const workers = response.data.workers || [];
          const processedWorkers = workers.map((worker) => {
            const givenNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'given_name'
            );
            const familyNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'family_name'
            );
            const name = `${givenNameAttr ? givenNameAttr.Value : ''} ${
              familyNameAttr ? familyNameAttr.Value : ''
            }`.trim();
            return {
              ...worker,
              name,
            };
          });
          setAvailableUsers(processedWorkers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (
      showModal &&
      (modalData.action === 'addUser' || modalData.action === 'removeUser')
    ) {
      fetchAvailableUsers();
    }
  }, [showModal, modalData, user]);

  // Pobieranie integratorów do dodania/usunięcia z grup
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
        console.error('Error fetching integrators:', error);
      }
    };

    if (
      showModal &&
      (modalData.action === 'addIntegrator' ||
        modalData.action === 'removeIntegrator')
    ) {
      fetchAvailableIntegrators();
    }
  }, [showModal, modalData, user, isService, selectedManagerID]);

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

        // Pobierz szczegóły dla nowej grupy
        await fetchGroupDetails(response.data.PK);
      }
    } catch (error) {
      console.error('Error adding group:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania grupy.');
    }
  };

  // Edycja lub usuwanie grupy
  const editGroup = async (groupID, groupName, isDeleted) => {
    try {
      const editData = {
        editData: {
          PK: groupID,
          integratorGroupName:
            groupName ||
            groups.find((group) => group.PK === groupID).integratorGroupName,
        },
      };

      if (typeof isDeleted === 'boolean') {
        editData.isDeleted = isDeleted;
      }

      const requestBody = {
        userID: isService ? selectedManagerID : user.userID,
        editData: editData,
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
            group.PK === groupID ? response.data : group
          )
        );
        showSuccessMessage('Grupa została zaktualizowana pomyślnie.');
      }
    } catch (error) {
      console.error('Error editing group:', error);
      showErrorMessage('Wystąpił błąd podczas edytowania grupy.');
    }
  };

  // Rozwijanie i zwijanie szczegółów grupy
  const toggleGroupDetails = (groupID) => {
    if (expandedGroups.includes(groupID)) {
      setExpandedGroups(expandedGroups.filter((id) => id !== groupID));
    } else {
      setExpandedGroups([...expandedGroups, groupID]);
    }
  };

  // Pobieranie szczegółów grupy
  const fetchGroupDetails = async (groupID) => {
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

      if (response && response.data) {
        const integratorsData = [];

        // Przetwarzanie integratorów
        if (response.data.integratorsInGroups) {
          response.data.integratorsInGroups.forEach((groupData) => {
            Object.values(groupData).forEach((integratorList) => {
              integratorList.forEach((integrator) => {
                if (!integrator.isDeletedFromGroup) {
                  integratorsData.push(integrator);
                }
              });
            });
          });
        }

        setIntegrators((prev) => ({
          ...prev,
          [groupID]: integratorsData,
        }));

        // Pobieranie użytkowników w grupie
        await fetchWorkersInGroup(groupID);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const fetchWorkersInGroup = async (groupID) => {
    try {
      const currentUserID = user.userID;
      const workersResponse = await axios.get(
        endpoints.getWorkers(currentUserID),
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
        const workers = workersResponse.data.workers;
        const usersData = [];

        await Promise.all(
          workers.map(async (worker) => {
            const workerID = worker.PK;
            const workerGroupsResponse = await axios.get(
              `${endpoints.getIntegratorGroups(
                user.userID
              )}?groupsFor=${workerID}`,
              {
                headers: {
                  Authorization: user.id_token,
                },
              }
            );

            const workerGroups =
              workerGroupsResponse.data.integratorGroups || [];

            if (workerGroups.some((g) => g.PK === groupID)) {
              const givenNameAttr = worker.cognitoAttributes?.find(
                (attr) => attr.Name === 'given_name'
              );
              const familyNameAttr = worker.cognitoAttributes?.find(
                (attr) => attr.Name === 'family_name'
              );
              const name = `${givenNameAttr ? givenNameAttr.Value : ''} ${
                familyNameAttr ? familyNameAttr.Value : ''
              }`.trim();

              console.log(`User: ${name}, Group: ${groupID}`);

              usersData.push({
                PK: worker.PK,
                name,
              });
            }
          })
        );

        // Aktualizacja stanu groupUsers
        setGroupUsers((prev) => ({
          ...prev,
          [groupID]: usersData,
        }));
      }
    } catch (error) {
      console.error('Error fetching workers in group:', error);
    }
  };

  // Zamknięcie rozwiniętych grup po kliknięciu poza nimi
  useEffect(() => {
    const handleClickOutsideGroups = (event) => {
      if (
        groupListRef.current &&
        !groupListRef.current.contains(event.target)
      ) {
        // Odkomentuj poniższą linię, jeśli chcesz zamknąć rozwinięte grupy po kliknięciu poza nimi
        // setExpandedGroups([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideGroups);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideGroups);
    };
  }, []);

  // Przełączanie menu opcji
  const toggleOptions = (groupID) => {
    if (showOptionsGroupId === groupID) {
      setShowOptionsGroupId(null);
    } else {
      setShowOptionsGroupId(groupID);
    }
  };

  // Zamknięcie menu opcji po kliknięciu poza nim
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

  // Obsługa wyboru opcji
  const handleOptionSelect = (groupID, action) => {
    setModalData({ groupID, action });
    setShowModal(true);
    setShowOptionsGroupId(null);
  };

  // Dodawanie lub usuwanie integratora z grupy
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
        // Odśwież szczegóły grupy
        await fetchGroupDetails(groupID);
        setSelectedIntegratorID('');
      }
    } catch (error) {
      console.error('Error adding integrator to group:', error);
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
        // Odśwież szczegóły grupy
        await fetchGroupDetails(groupID);
        setSelectedIntegratorID('');
      }
    } catch (error) {
      console.error('Error removing integrator from group:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania integratora z grupy.');
    }
  };

  // Dodawanie lub usuwanie użytkownika z grupy
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
        // Odśwież szczegóły grupy
        await fetchGroupDetails(groupID);
        setSelectedUserID('');
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
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
        // Odśwież szczegóły grupy
        await fetchGroupDetails(groupID);
        setSelectedUserID('');
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania użytkownika z grupy.');
    }
  };

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

  const loading = loadingManagers || loadingGroups || loadingGroupDetails;

  if (loading) {
    return (
      <div className='loader-container'>
        <GridLoader color='var(--primary-500)' />
      </div>
    );
  }

  return (
    <div className='manage-groups-container'>
      {/* Dla Serwisu: Wybór Managera */}
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
              const givenName = manager.cognitoAttributes?.find(
                (attr) => attr.Name === 'given_name'
              )?.Value;
              const familyName = manager.cognitoAttributes?.find(
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

      {/* Górny pasek z przyciskiem dodawania grupy, filtrem i wyszukiwaniem */}
      <div className='top-bar'>
        <div className='add-group-toggle'>
          <button onClick={() => setShowAddGroup(!showAddGroup)}>
            {showAddGroup ? 'Anuluj' : 'Dodaj nową grupę'}
          </button>
        </div>

        {/* Filtrowanie grup */}
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

      {/* Formularz dodawania grupy */}
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
                      onClick={() => {
                        setExpandedGroups(
                          expandedGroups.filter((id) => id !== group.PK)
                        );
                      }}
                    />
                  ) : (
                    <PiCaretCircleDownFill
                      className='group-icon'
                      onClick={() => {
                        setExpandedGroups([...expandedGroups, group.PK]);
                      }}
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
                    {!group.isDeleted ? (
                      <>
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
                        <li
                          onClick={() =>
                            handleOptionSelect(group.PK, 'addUser')
                          }
                        >
                          Dodaj użytkownika
                        </li>
                        <li
                          onClick={() =>
                            handleOptionSelect(group.PK, 'removeUser')
                          }
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
                      </>
                    ) : (
                      <li
                        onClick={() =>
                          editGroup(group.PK, group.integratorGroupName, false)
                        }
                      >
                        Przywróć grupę
                      </li>
                    )}
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
                    {groupUsers[group.PK]?.length > 0 ? (
                      <ul>
                        {groupUsers[group.PK].map((userItem) => (
                          <li key={userItem.PK}>{userItem.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Brak użytkowników w tej grupie.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Brak grup do wyświetlenia.</p>
        )}
      </div>

      {/* ToastContainer dla wiadomości */}
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
            {/* Treść modala w zależności od akcji */}
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

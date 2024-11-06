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
  const [loading, setLoading] = useState(false);
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

  // Expanded groups state
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

  // Fetch managers (for service view)
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

  // Fetch group users
  const fetchGroupUsers = async () => {
    try {
      const currentUserID = user.userID;
      const managerID = isService ? selectedManagerID : '';
      const groupsForUsersUrl = endpoints.getGroupsForUsers(currentUserID);

      // Dodaj managerID do zapytania, jeśli jest to serwisant
      const requestUrl = managerID
        ? `${groupsForUsersUrl}?managerID=${managerID}`
        : groupsForUsersUrl;

      const groupUsersResponse = await axios.get(requestUrl, {
        headers: {
          Authorization: user.id_token,
        },
      });

      if (groupUsersResponse && groupUsersResponse.data) {
        const groupUsersData = groupUsersResponse.data.groupsForUsers || [];

        // Inicjalizacja mapowania groupID do listy użytkowników
        const groupUsersMap = {};
        const userIDs = [];

        // Przetwarzanie danych użytkowników w grupach
        groupUsersData.forEach((userGroupsObj) => {
          const userID = Object.keys(userGroupsObj)[0];
          const groups = userGroupsObj[userID];

          userIDs.push(userID);

          groups.forEach((group) => {
            if (!group.isDeletedFromGroup) {
              const groupID = String(group.PK);
              if (!groupUsersMap[groupID]) {
                groupUsersMap[groupID] = [];
              }
              groupUsersMap[groupID].push({
                PK: userID,
                name: '', // Zostanie uzupełnione później
              });
            }
          });
        });

        // Pobranie szczegółów użytkowników
        const workersResponse = await axios.get(
          endpoints.getWorkers(user.userID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );

        if (workersResponse && workersResponse.data) {
          const workersData = workersResponse.data.workers || [];
          const userIDToNameMap = {};

          workersData.forEach((worker) => {
            const userID = worker.PK;
            const givenNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'given_name'
            );
            const familyNameAttr = worker.cognitoAttributes?.find(
              (attr) => attr.Name === 'family_name'
            );
            const name = `${givenNameAttr ? givenNameAttr.Value : ''} ${
              familyNameAttr ? familyNameAttr.Value : ''
            }`.trim();
            userIDToNameMap[userID] = name || userID;
          });

          // Aktualizacja mapy groupUsersMap z nazwami użytkowników
          Object.keys(groupUsersMap).forEach((groupID) => {
            groupUsersMap[groupID] = groupUsersMap[groupID].map((user) => ({
              PK: user.PK,
              name: userIDToNameMap[user.PK] || user.PK,
            }));
          });
        }

        setGroupUsers(groupUsersMap);
      }
    } catch (error) {
      console.error('Error fetching group users:', error);
    }
  };

  // Fetch groups and their details
  useEffect(() => {
    const fetchGroupsAndDetails = async () => {
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
          const fetchedGroups = response.data.integratorGroups || [];

          setGroups(fetchedGroups);

          // Fetch group-user associations
          await fetchGroupUsers();
        }
      } catch (error) {
        console.error('Error fetching groups and details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isManager || (isService && selectedManagerID)) {
      fetchGroupsAndDetails();
    }
  }, [user, selectedManagerID, isManager, isService]);

  // Fetch available users (workers) for adding to groups
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const currentUserID = user.userID;
        const managerID = isService ? selectedManagerID : '';
        const response = await axios.get(
          endpoints.getWorkers(currentUserID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
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
              name: name || worker.PK,
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
  }, [showModal, modalData, user, isService, selectedManagerID]);

  // Fetch integrators for adding/removing to/from groups
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

  // Add group
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
        setShowAddGroup(false); // Hide form after adding group
        showSuccessMessage('Grupa została dodana pomyślnie.');

        // Initialize the group's users as an empty array
        const groupID = String(response.data.PK);
        setGroupUsers((prevGroupUsers) => ({
          ...prevGroupUsers,
          [groupID]: [],
        }));
      }
    } catch (error) {
      console.error('Error adding group:', error);
      showErrorMessage('Wystąpił błąd podczas dodawania grupy.');
    }
  };

  // Edit or delete group
  const editGroup = async (groupID, groupName, isDeleted) => {
    try {
      const editData = {
        userID: isService ? selectedManagerID : user.userID,
        editData: {
          PK: groupID,
          integratorGroupName:
            groupName ||
            groups.find((group) => group.PK === groupID).integratorGroupName,
        },
      };

      if (typeof isDeleted === 'boolean') {
        editData.editData.isDeleted = isDeleted;
      }

      const response = await axios.put(
        endpoints.editGroup(user.userID),
        editData,
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

  // Fetch group details function
  const fetchGroupDetails = async (groupID) => {
    try {
      const managerID = isService ? selectedManagerID : '';
      const creatorID = user.userID;

      // Build the request URL with query parameters
      let requestUrl = `${endpoints.getGroupDetails(
        creatorID
      )}?groups=${groupID}`;
      if (isService && managerID) {
        requestUrl += `&groupsFor=${managerID}`;
      }

      const response = await axios.get(requestUrl, {
        headers: {
          Authorization: user.id_token,
        },
      });

      if (response && response.data) {
        const integratorsData = [];

        // Process integrators
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
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  // Close expanded groups when clicking outside
  useEffect(() => {
    const handleClickOutsideGroups = (event) => {
      if (
        groupListRef.current &&
        !groupListRef.current.contains(event.target)
      ) {
        // Uncomment the line below if you want to close expanded groups when clicking outside
        // setExpandedGroups([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideGroups);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideGroups);
    };
  }, []);

  // Toggle options menu
  const toggleOptions = (groupID) => {
    if (showOptionsGroupId === groupID) {
      setShowOptionsGroupId(null);
    } else {
      setShowOptionsGroupId(groupID);
    }
  };

  // Close options menu when clicking outside
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

  // Handle option selection
  const handleOptionSelect = (groupID, action) => {
    setModalData({ groupID, action });
    setShowModal(true);
    setShowOptionsGroupId(null);
  };

  // Add or remove integrator from group
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
        // Refresh group details
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
        // Refresh group details
        await fetchGroupDetails(groupID);
        setSelectedIntegratorID('');
      }
    } catch (error) {
      console.error('Error removing integrator from group:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania integratora z grupy.');
    }
  };

  // Add or remove user from group
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
        setSelectedUserID('');

        // Ponownie pobieramy użytkowników w grupach
        await fetchGroupUsers();
      } else {
        showErrorMessage('Nie udało się dodać użytkownika do grupy.');
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
        setSelectedUserID('');

        // Ponownie pobieramy użytkowników w grupach
        await fetchGroupUsers();
      } else {
        showErrorMessage('Nie udało się usunąć użytkownika z grupy.');
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
      showErrorMessage('Wystąpił błąd podczas usuwania użytkownika z grupy.');
    }
  };

  // Filter groups
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
      {/* For Service: Manager selection */}
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

      {/* Top bar with add group button, filter, and search */}
      <div className='top-bar'>
        <div className='add-group-toggle'>
          <button onClick={() => setShowAddGroup(!showAddGroup)}>
            {showAddGroup ? 'Anuluj' : 'Dodaj nową grupę'}
          </button>
        </div>

        {/* Group filter */}
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

        {/* Group search */}
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

      {/* Add Group Form */}
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

      {/* Group List */}
      <div className='group-list' ref={groupListRef}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const groupID = String(group.PK);
            return (
              <div
                className={`group-card ${
                  group.isDeleted ? 'group-deleted' : ''
                }`}
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
                        onClick={async () => {
                          setExpandedGroups([...expandedGroups, group.PK]);
                          if (!integrators[groupID]) {
                            await fetchGroupDetails(group.PK);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Options Menu */}
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
                              editGroup(
                                group.PK,
                                group.integratorGroupName,
                                true
                              )
                            }
                          >
                            Usuń grupę
                          </li>
                        </>
                      ) : (
                        <li
                          onClick={() =>
                            editGroup(
                              group.PK,
                              group.integratorGroupName,
                              false
                            )
                          }
                        >
                          Przywróć grupę
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Group Details */}
                {expandedGroups.includes(group.PK) && (
                  <div className='group-details'>
                    {/* Integrators */}
                    <div className='integrators-section'>
                      <h4>Integratory:</h4>
                      <ul>
                        {integrators[groupID]?.length > 0 ? (
                          integrators[groupID].map((integrator) => (
                            <li
                              key={integrator.PK}
                              className={
                                integrator.isDeleted ? 'deleted-item' : ''
                              }
                            >
                              {integrator.serialNumber} - {integrator.location}
                              {integrator.isDeleted && (
                                <TiDeleteOutline className='deleted-icon' />
                              )}
                            </li>
                          ))
                        ) : (
                          <p>Brak integratorów w tej grupie.</p>
                        )}
                      </ul>
                    </div>

                    {/* Users */}
                    <div className='users-section'>
                      <h4>Użytkownicy:</h4>
                      {groupUsers[groupID]?.length > 0 ? (
                        <ul>
                          {groupUsers[groupID].map((userItem) => (
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
            );
          })
        ) : loading ? (
          <div className='loader-container'>
            <GridLoader color='var(--primary-500)' />
          </div>
        ) : (
          <p>Brak grup do wyświetlenia.</p>
        )}
      </div>

      {/* ToastContainer for messages */}
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

      {/* Modal for adding/removing integrators and users */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            {/* Modal content based on action */}
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
                    {availableUsers
                      .filter((userItem) => {
                        // Exclude users already in the group
                        const groupID = modalData.groupID;
                        const groupUserIDs =
                          groupUsers[groupID]?.map((u) => u.PK) || [];
                        return !groupUserIDs.includes(userItem.PK);
                      })
                      .map((userItem) => (
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

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
  const [statusDropdownIntegratorId, setStatusDropdownIntegratorId] =
    useState(null);

  const optionsMenuRef = useRef(null);
  const integratorsListRef = useRef(null);

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

  // Fetch managers (if user is Service)
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

  // Fetch integrators
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

  // Filtering integrators
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
      const searchString =
        `${integrator.serialNumber} ${integrator.location}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

  // Adding a new integrator
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
        setShowAddIntegratorForm(false); // Hide form after adding
        showSuccessMessage('Integrator added successfully.');
      }
    } catch (error) {
      console.error('Error adding integrator:', error);
      showErrorMessage('An error occurred while adding the integrator.');
    }
  };

  // Deleting or Restoring an integrator
  const handleDeleteOrRestoreIntegrator = async (integratorID, isDeleted) => {
    try {
      const response = await axios.put(
        endpoints.editIntegrator(user.userID),
        {
          userID: isService ? selectedManagerID : user.userID,
          editData: {
            isDeleted: isDeleted,
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
              ? { ...integrator, isDeleted: isDeleted }
              : integrator
          )
        );
        showSuccessMessage(
          isDeleted
            ? 'Integrator deleted successfully.'
            : 'Integrator restored successfully.'
        );
      }
    } catch (error) {
      console.error('Error updating integrator:', error);
      showErrorMessage('An error occurred while updating the integrator.');
    }
  };

  // Handling status change
  const handleChangeStatus = async (integratorID, status) => {
    try {
      const response = await axios.put(
        endpoints.editIntegrator(user.userID),
        {
          userID: isService ? selectedManagerID : user.userID,
          editData: {
            PK: integratorID,
            editData: {
              status: status,
            },
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
            integrator.PK === integratorID ? response.data : integrator
          )
        );
        showSuccessMessage('Integrator status updated successfully.');
      }
    } catch (error) {
      console.error('Error changing integrator status:', error);
      showErrorMessage(
        'An error occurred while changing the integrator status.'
      );
    }
  };

  // Toggle options menu
  const toggleOptions = (integratorID) => {
    if (showOptionsIntegratorId === integratorID) {
      setShowOptionsIntegratorId(null);
    } else {
      setShowOptionsIntegratorId(integratorID);
      setStatusDropdownIntegratorId(null); // Close status dropdown if open
    }
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target)
      ) {
        setShowOptionsIntegratorId(null);
        setStatusDropdownIntegratorId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle integrator details
  const toggleIntegratorDetails = (integratorID) => {
    if (expandedIntegrators.includes(integratorID)) {
      setExpandedIntegrators(
        expandedIntegrators.filter((id) => id !== integratorID)
      );
    } else {
      setExpandedIntegrators([...expandedIntegrators, integratorID]);
    }
  };

  // Close expanded integrators when clicking outside
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
      document.removeEventListener('mousedown', handleClickOutsideIntegrators);
    };
  }, []);

  // Handle option selection from the options menu
  const handleOptionSelect = (integratorID, action) => {
    if (action === 'changeStatus') {
      if (statusDropdownIntegratorId === integratorID) {
        setStatusDropdownIntegratorId(null);
      } else {
        setStatusDropdownIntegratorId(integratorID);
      }
    } else if (action === 'delete') {
      handleDeleteOrRestoreIntegrator(integratorID, true);
    } else if (action === 'restore') {
      handleDeleteOrRestoreIntegrator(integratorID, false);
    }
    setShowOptionsIntegratorId(null);
  };

  // Get status color
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

      {/* Top bar with add button, filters, and search */}
      <div className='top-bar-integrators'>
        <div className='add-integrator-toggle'>
          <button
            onClick={() => setShowAddIntegratorForm(!showAddIntegratorForm)}
          >
            {showAddIntegratorForm ? 'Anuluj' : 'Dodaj nowy Integrator'}
          </button>
        </div>

        {/* Filters */}
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

        {/* Search bar */}
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

      {/* Add Integrator Form */}
      {showAddIntegratorForm && (
        <div className='add-integrator-form'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddIntegrator();
            }}
          >
            <div className='form-group'>
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
            <div className='form-group'>
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
            <button type='submit' className='btn-submit'>
              Dodaj Integrator
            </button>
          </form>
        </div>
      )}

      {/* Integrators List */}
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

                {/* Options Menu */}
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

                {/* Status Dropdown */}
                {statusDropdownIntegratorId === integrator.PK && (
                  <div
                    className='status-dropdown'
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[0, 1, 2, 3].map((status) => (
                      <button
                        key={status}
                        className='status-option'
                        onClick={() => {
                          handleChangeStatus(integrator.PK, status);
                          setStatusDropdownIntegratorId(null);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}

                {/* Integrator Details */}
                {expandedIntegrators.includes(integrator.PK) && (
                  <div className='integrator-details'>
                    <p>
                      <strong>Lokalizacja:</strong> {integrator.location}
                    </p>
                    <p>
                      <strong>Status:</strong> {integrator.status}
                    </p>
                    {/* Additional information can be added here */}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Brak integratorów do wyświetlenia.</p>
          )}
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

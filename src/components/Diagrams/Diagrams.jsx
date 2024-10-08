// src/components/Diagrams/Diagrams.jsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { endpoints } from '../../api/api';
import './diagrams.css';

// Import for date pickers
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Imports for charts
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';

// Imports for generating PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import for loader
import { GridLoader } from 'react-spinners';

// Import for icons
import { FaTable, FaPlus } from 'react-icons/fa';

const Diagrams = () => {
  const { user } = useContext(AuthContext);

  const [reportName, setReportName] = useState('');
  const [dataEntries, setDataEntries] = useState([
    {
      PK: '',
      RangeStart: null,
      RangeEnd: null,
      isGroup: false,
    },
  ]);

  const [reports, setReports] = useState([]);
  const [selectedReportID, setSelectedReportID] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedManagerID, setSelectedManagerID] = useState('');
  const [managers, setManagers] = useState([]);
  const [availableIntegrators, setAvailableIntegrators] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);

  const [integratorMap, setIntegratorMap] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false); // Toggle for creating report
  const [showAllReports, setShowAllReports] = useState(false); // Toggle for showing all reports

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

  useEffect(() => {
    // Fetch reports
    const fetchReports = async () => {
      setLoading(true);
      try {
        const requesterID =
          isService && selectedManagerID ? selectedManagerID : user.userID;
        const response = await axios.get(endpoints.getAllReports(requesterID), {
          headers: {
            Authorization: user.id_token,
          },
        });
        if (response && response.data) {
          const reportIDsArray = response.data.map((item) => {
            // Extract the report name from SK
            const reportID = item.SK.substring(7); // Remove 'report#' prefix
            const skParts = reportID.split('/');
            const reportName = skParts[skParts.length - 1] || 'Bez nazwy';
            return { reportID, reportName };
          });
          setReports(reportIDsArray);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania raportów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, isService, selectedManagerID]);

  useEffect(() => {
    // Fetch managers for service role
    if (isService) {
      const fetchManagers = async () => {
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
        }
      };

      fetchManagers();
    }
  }, [user, isService]);

  useEffect(() => {
    // Fetch available integrators and groups
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
          // Create a map of integrator IDs to serial numbers
          const integratorMapTemp = {};
          response.data.integrators.forEach((integrator) => {
            integratorMapTemp[integrator.PK.replace('integrator#', '')] =
              integrator.serialNumber;
          });
          setIntegratorMap(integratorMapTemp);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania integratorów:', error);
      }
    };

    const fetchAvailableGroups = async () => {
      try {
        const creatorID = user.userID;
        const managerID = isService ? selectedManagerID : '';
        const response = await axios.get(
          endpoints.getIntegratorGroups(creatorID, managerID),
          {
            headers: {
              Authorization: user.id_token,
            },
          }
        );
        if (response && response.data) {
          setAvailableGroups(response.data.integratorGroups || []);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania grup:', error);
      }
    };

    if (isManager || (isService && selectedManagerID)) {
      fetchAvailableIntegrators();
      fetchAvailableGroups();
    }
  }, [user, isManager, isService, selectedManagerID]);

  const handleCreateReport = async () => {
    try {
      const requestBody = {
        reportName,
        data: dataEntries.map((entry) => {
          const obj = {
            PK: entry.PK,
            RangeStart: entry.RangeStart.toISOString(),
            RangeEnd: entry.RangeEnd.toISOString(),
          };
          if (entry.isGroup) {
            obj.isGroup = true;
          }
          return obj;
        }),
      };

      const requesterID = user.userID;
      const managerID = isService ? selectedManagerID : '';
      const endpoint = endpoints.createReport(requesterID, managerID);

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          Authorization: user.id_token,
        },
      });

      if (response && response.data) {
        // Report successfully created
        // Add new report to the list
        setReports([
          ...reports,
          { reportID: response.data.reportID, reportName },
        ]);
        // Clear form fields
        setReportName('');
        setDataEntries([
          {
            PK: '',
            RangeStart: null,
            RangeEnd: null,
            isGroup: false,
          },
        ]);
        setShowCreateReport(false); // Hide the create report form
        alert('Raport został pomyślnie utworzony.');
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia raportu:', error);
      alert('Wystąpił błąd podczas tworzenia raportu.');
    }
  };

  const fetchReportData = async (reportID) => {
    setLoading(true);
    try {
      const requesterID =
        isService && selectedManagerID ? selectedManagerID : user.userID;
      const response = await axios.get(
        endpoints.getReportData(requesterID, reportID),
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );
      if (response && response.data) {
        // Process the response data according to the API format
        // Response is an array of arrays: [ [ "integrator#ID", [ dataPoints ] ], ... ]
        const processedData = response.data.map((item) => {
          const [key, dataPoints] = item;
          const integratorID = key.replace('integrator#', '');
          return {
            integratorID,
            dataPoints,
          };
        });
        setReportData(processedData);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania danych raportu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (reportID) => {
    setSelectedReportID(reportID);
    fetchReportData(reportID);
  };

  const addDataEntry = () => {
    setDataEntries([
      ...dataEntries,
      {
        PK: '',
        RangeStart: null,
        RangeEnd: null,
        isGroup: false,
      },
    ]);
  };

  const removeDataEntry = (index) => {
    const entries = [...dataEntries];
    entries.splice(index, 1);
    setDataEntries(entries);
  };

  const handleDataEntryChange = (index, field, value) => {
    const entries = [...dataEntries];
    entries[index][field] = value;
    setDataEntries(entries);
  };

  const generatePDF = () => {
    const input = document.getElementById('report-content');
    const scale = 2; // Increase scale for better quality

    html2canvas(input, { scale }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${selectedReportID}.pdf`);
    });
  };

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const toggleCreateReport = () => {
    setShowCreateReport(!showCreateReport);
  };

  const toggleShowAllReports = () => {
    setShowAllReports(!showAllReports);
  };

  return (
    <div className='diagrams-container'>
      <div className='diagrams-header'>
        <h2>Wykresy i raporty</h2>
        <FaPlus className='diagrams-add-icon' onClick={toggleCreateReport} />
      </div>

      {/* Form to create a new report */}
      {showCreateReport && (
        <div className='diagrams-create-report'>
          <h3>Stwórz nowy raport</h3>
          {isService && (
            <div className='diagrams-form-group'>
              <label>Wybierz Managera:</label>
              <select
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
          <div className='diagrams-form-group'>
            <label>Nazwa Raportu:</label>
            <input
              type='text'
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>
          <h4>Wybierz dane:</h4>
          {dataEntries.map((entry, index) => (
            <div key={index} className='diagrams-data-entry'>
              <div className='diagrams-form-group'>
                <label>Wybierz Integrator lub Grupę:</label>
                <select
                  value={entry.PK}
                  onChange={(e) =>
                    handleDataEntryChange(index, 'PK', e.target.value)
                  }
                >
                  <option value=''>-- Wybierz --</option>
                  <optgroup label='Integratory'>
                    {availableIntegrators.map((integrator) => (
                      <option key={integrator.PK} value={integrator.PK}>
                        {integrator.serialNumber} - {integrator.location}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label='Grupy'>
                    {availableGroups.map((group) => (
                      <option key={group.PK} value={group.PK}>
                        {group.integratorGroupName}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <label>
                  <input
                    type='checkbox'
                    checked={entry.isGroup}
                    onChange={(e) =>
                      handleDataEntryChange(index, 'isGroup', e.target.checked)
                    }
                  />
                  To jest Grupa
                </label>
              </div>
              <div className='diagrams-form-group'>
                <label>Data Początkowa:</label>
                <DatePicker
                  selected={entry.RangeStart}
                  onChange={(date) =>
                    handleDataEntryChange(index, 'RangeStart', date)
                  }
                  selectsStart
                  startDate={entry.RangeStart}
                  endDate={entry.RangeEnd}
                  dateFormat='yyyy-MM-dd'
                />
              </div>
              <div className='diagrams-form-group'>
                <label>Data Końcowa:</label>
                <DatePicker
                  selected={entry.RangeEnd}
                  onChange={(date) =>
                    handleDataEntryChange(index, 'RangeEnd', date)
                  }
                  selectsEnd
                  startDate={entry.RangeStart}
                  endDate={entry.RangeEnd}
                  minDate={entry.RangeStart}
                  dateFormat='yyyy-MM-dd'
                />
              </div>
              <button onClick={() => removeDataEntry(index)}>Usuń</button>
            </div>
          ))}
          <button onClick={addDataEntry}>Dodaj Kolejny</button>
          <button
            onClick={handleCreateReport}
            disabled={!reportName || (isService && !selectedManagerID)}
          >
            Stwórz Raport
          </button>
        </div>
      )}

      {/* List of existing reports */}
      <div className='diagrams-existing-reports'>
        <h3>Istniejące Raporty</h3>
        {reports.length > 0 ? (
          <>
            <ul>
              {reports
                .slice(0, showAllReports ? reports.length : 5)
                .map(({ reportID, reportName }) => (
                  <li key={reportID}>
                    <button onClick={() => handleSelectReport(reportID)}>
                      {reportName}
                    </button>
                  </li>
                ))}
            </ul>
            {reports.length > 5 && (
              <button onClick={toggleShowAllReports}>
                {showAllReports ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            )}
          </>
        ) : (
          <p>Brak dostępnych raportów.</p>
        )}
      </div>

      {/* Displaying selected report data */}
      {selectedReportID && (
        <div className='diagrams-report-details'>
          <div className='diagrams-report-header'>
            <h3>
              Dane Raportu:{' '}
              {reports.find((r) => r.reportID === selectedReportID)?.reportName}
            </h3>
            <FaTable className='diagrams-table-icon' onClick={toggleTable} />
          </div>
          {loading ? (
            <div className='diagrams-loader-container'>
              <GridLoader color='#1cb726' />
            </div>
          ) : (
            <div id='report-content'>
              {/* Displaying efficiency tables */}
              {showTable && (
                <div className='diagrams-efficiency-table'>
                  {reportData.map((dataEntry, index) => (
                    <div key={index} className='diagrams-table-container'>
                      <h4>
                        Integrator:{' '}
                        {integratorMap[dataEntry.integratorID] ||
                          dataEntry.integratorID}
                      </h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Data i Czas</th>
                            <th>Efektywność</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataEntry.dataPoints.map((point, idx) => (
                            <tr key={idx}>
                              <td>{new Date(point.SK).toLocaleString()}</td>
                              <td>{point.totalCrushed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Displaying charts */}
              {reportData.map((dataEntry, index) => (
                <div key={index} className='diagrams-chart-container'>
                  <h4>
                    Integrator:{' '}
                    {integratorMap[dataEntry.integratorID] ||
                      dataEntry.integratorID}
                  </h4>
                  <Line
                    data={{
                      labels: dataEntry.dataPoints.map(
                        (point) => new Date(point.SK)
                      ),
                      datasets: [
                        {
                          label: 'Total Crushed',
                          data: dataEntry.dataPoints.map(
                            (point) => point.totalCrushed
                          ),
                          fill: false,
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        x: {
                          type: 'time',
                          time: {
                            unit: 'minute',
                          },
                        },
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <button onClick={generatePDF}>Generuj PDF</button>
        </div>
      )}
    </div>
  );
};

export default Diagrams;

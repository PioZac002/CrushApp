// src/components/Diagrams/Diagrams.jsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { endpoints } from '../../api/api';
import './diagrams.css';

// Importy dla pickerów dat
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Importy dla wykresów
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import adaptera daty

// Importy dla generowania PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Importy dla loadera
import { GridLoader } from 'react-spinners';

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

  const isService = user?.role?.isService;
  const isManager = user?.role?.isManager;

  useEffect(() => {
    // Pobieranie raportów
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await axios.get(endpoints.getAllReports(user.userID), {
          headers: {
            Authorization: user.id_token,
          },
        });
        if (response && response.data) {
          const reportIDsArray = response.data.map(
            (item) => item.SK.substring(7) // Usunięcie prefiksu 'report#'
          );
          setReports(reportIDsArray);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania raportów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  useEffect(() => {
    // Pobieranie managerów dla serwisanta
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
    // Pobieranie dostępnych integratorów i grup
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
        // Raport został pomyślnie utworzony
        // Dodaj nowy raport do listy
        setReports([...reports, response.data.reportID]);
        // Wyczyść pola formularza
        setReportName('');
        setDataEntries([
          {
            PK: '',
            RangeStart: null,
            RangeEnd: null,
            isGroup: false,
          },
        ]);
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
      const response = await axios.get(
        endpoints.getReportData(user.userID, reportID),
        {
          headers: {
            Authorization: user.id_token,
          },
        }
      );
      if (response && response.data) {
        // Przetwarzanie danych zgodnie z formatem API
        // Odpowiedź to tablica tablic: [ [ "integrator#ID", [ dataPoints ] ], ... ]
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
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
      });
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedReportID}.pdf`);
    });
  };

  return (
    <div className='diagrams'>
      <h2>Generowanie Raportów</h2>
      {/* Formularz do tworzenia nowego raportu */}
      <div className='create-report'>
        <h3>Stwórz nowy raport</h3>
        {isService && (
          <div className='form-group'>
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
        <div className='form-group'>
          <label>Nazwa Raportu:</label>
          <input
            type='text'
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
          />
        </div>
        <h4>Wybierz dane:</h4>
        {dataEntries.map((entry, index) => (
          <div key={index} className='data-entry'>
            <div className='form-group'>
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
            <div className='form-group'>
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
            <div className='form-group'>
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

      {/* Lista istniejących raportów */}
      <div className='existing-reports'>
        <h3>Istniejące Raporty</h3>
        {reports.length > 0 ? (
          <ul>
            {reports.map((reportID) => (
              <li key={reportID}>
                <button onClick={() => handleSelectReport(reportID)}>
                  {reportID}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Brak dostępnych raportów.</p>
        )}
      </div>

      {/* Wyświetlanie danych wybranego raportu */}
      {selectedReportID && (
        <div className='report-details'>
          <h3>Dane Raportu: {selectedReportID}</h3>
          {loading ? (
            <div className='loader-container'>
              <GridLoader color='#1cb726' />
            </div>
          ) : (
            <div id='report-content'>
              {/* Wyświetlanie wykresów */}
              {reportData.map((dataEntry, index) => (
                <div key={index} className='chart-container'>
                  <h4>Integrator: {dataEntry.integratorID}</h4>
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
                          backgroundColor: 'blue',
                          borderColor: 'blue',
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

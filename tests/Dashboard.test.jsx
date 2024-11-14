// tests/Dashboard.test.jsx

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import Dashboard from '../src/components/MainBody/Dashboard/Dashboard';
import { AuthContext } from '../src/context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockManagerUser = {
        userID: 'manager-user-id',
        id_token: 'valid_non_expired_token',
        role: { isManager: true, isService: false },
    };

    const mockServiceUser = {
        userID: 'service-user-id',
        id_token: 'valid_non_expired_token',
        role: { isManager: false, isService: true },
    };

    const mockWorkerUser = {
        userID: 'worker-user-id',
        id_token: 'valid_non_expired_token',
        role: { isManager: false, isService: false },
    };

    // Mockowane dane z API
    const mockWorkersResponse = {
        data: {
            workers: [
                {
                    SK: "user",
                    isDeleted: false,
                    PK: "worker1",
                    cognitoAttributes: [
                        { "Value": "worker1@example.com", "Name": "email" },
                        { "Value": "Jan", "Name": "given_name" },
                        { "Value": "Kowalski", "Name": "family_name" }
                    ],
                    role: { isManager: false, isService: false }
                },
                {
                    SK: "user",
                    isDeleted: false,
                    PK: "worker2",
                    cognitoAttributes: [
                        { "Value": "worker2@example.com", "Name": "email" },
                        { "Value": "Anna", "Name": "given_name" },
                        { "Value": "Nowak", "Name": "family_name" }
                    ],
                    role: { isManager: false, isService: false }
                },

            ]
        }
    };

    const mockIntegratorsResponse = {
        data: {
            integrators: [
                {
                    "SK": "integrator",
                    "isDeleted": false,
                    "location": "Bydgoszcz",
                    "PK": "integrator1",
                    "serialNumber": "PBS2017",
                    "status": 2
                },
                {
                    "SK": "integrator",
                    "isDeleted": false,
                    "location": "Wyszków",
                    "PK": "integrator2",
                    "serialNumber": "2137",
                    "status": 1
                },
                // Dodaj więcej integratorów w razie potrzeby...
            ]
        }
    };

    const mockIntegratorGroupsResponse = {
        data: {
            integratorGroups: [
                {
                    "SK": "group",
                    "integratorGroupName": "Druga grupa",
                    "isDeleted": false,
                    "PK": "group1"
                },
                {
                    "SK": "group",
                    "integratorGroupName": "Zumba Team",
                    "isDeleted": false,
                    "PK": "group2"
                },
                // Dodaj więcej grup w razie potrzeby...
            ]
        }
    };

    test('renders loading spinner initially', () => {
        render(
            <AuthContext.Provider value={{ user: mockManagerUser }}>
                <Dashboard />
            </AuthContext.Provider>
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('displays workers, integrators, and groups after loading for manager', async () => {
        // Mockowanie wywołań axios.get w odpowiedniej kolejności
        axios.get
            .mockResolvedValueOnce(mockWorkersResponse) // getWorkers
            .mockResolvedValueOnce(mockIntegratorsResponse) // getIntegrators
            .mockResolvedValueOnce(mockIntegratorGroupsResponse); // getIntegratorGroups

        render(
            <AuthContext.Provider value={{ user: mockManagerUser }}>
                <Dashboard />
            </AuthContext.Provider>
        );

        // Poczekaj na zakończenie ładowania
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });

        // Sprawdzenie wyświetlania pracowników
        expect(screen.getByText(/Jan Kowalski/i)).toBeInTheDocument();
        expect(screen.getByText(/worker1@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/Anna Nowak/i)).toBeInTheDocument();
        expect(screen.getByText(/worker2@example.com/i)).toBeInTheDocument();

        // Sprawdzenie wyświetlania integratorów
        expect(screen.getByText(/PBS2017/i)).toBeInTheDocument();
        expect(screen.getByText(/Bydgoszcz/i)).toBeInTheDocument();
        expect(screen.getByText(/2137/i)).toBeInTheDocument();
        expect(screen.getByText(/Wyszków/i)).toBeInTheDocument();

        // Sprawdzenie wyświetlania grup
        expect(screen.getByText(/Druga grupa/i)).toBeInTheDocument();
        expect(screen.getByText(/Zumba Team/i)).toBeInTheDocument();
    });

    test('displays integrator groups after loading for manager', async () => {
        // Mockowane dane dla pracownika
        const mockIntegratorGroupsForWorker = {
            data: {
                integratorGroups: [
                    {
                        "SK": "group",
                        "integratorGroupName": "Zumba Team",
                        "isDeleted": false,
                        "PK": "group2"
                    },
                    // Dodaj więcej grup, jeśli potrzebne
                ]
            }
        };

        const mockGroupDetailsResponse = {
            data: {
                integratorsInGroups: [
                    {
                        "group2": [
                            {
                                "SK": "integrator",
                                "isDeleted": false,
                                "location": "Bydgoszcz",
                                "PK": "integrator1",
                                "serialNumber": "PBS2017",
                                "status": 2,
                                "isDeletedFromGroup": false
                            },
                            // Dodaj więcej integratorów, jeśli potrzebne
                        ]
                    },
                    // Dodaj więcej grup, jeśli potrzebne
                ]
            }
        };

        // Mockowanie wywołań axios.get w odpowiedniej kolejności
        axios.get
            .mockResolvedValueOnce(mockIntegratorGroupsForWorker) // getIntegratorGroups
            .mockResolvedValueOnce(mockGroupDetailsResponse); // getGroupDetails

        render(
            <AuthContext.Provider value={{ user: mockWorkerUser }}>
                <Dashboard />
            </AuthContext.Provider>
        );

        // Poczekaj na zakończenie ładowania
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });

        // Sprawdzenie wyświetlania integratorów
        expect(screen.getByText(/PBS2017/i)).toBeInTheDocument();
        expect(screen.getByText(/Bydgoszcz/i)).toBeInTheDocument();
    });
});

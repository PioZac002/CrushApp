// tests/ManageWorkers.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageWorkers from '../src/components/ManageWorkers/ManageWorkers';
import { AuthContext } from '../src/context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

describe('ManageWorkers Component', () => {
    const mockUser = {
        userID: 'manager123',
        id_token: 'test_token',
        role: { isManager: true },
    };

    test('renders workers list', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                workers: [
                    {
                        PK: 'worker1',
                        cognitoAttributes: [
                            { Name: 'given_name', Value: 'John' },
                            { Name: 'family_name', Value: 'Doe' },
                            { Name: 'email', Value: 'john@example.com' },
                        ],
                        isDeleted: false,
                    },
                ],
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageWorkers />
            </AuthContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Lista Pracowników/i)).toBeInTheDocument();
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        });
    });

    test('allows adding a new worker', async () => {
        axios.get.mockResolvedValueOnce({ data: { workers: [] } });
        axios.post.mockResolvedValueOnce({
            data: {
                PK: 'worker2',
                cognitoAttributes: [
                    { Name: 'given_name', Value: 'Jane' },
                    { Name: 'family_name', Value: 'Smith' },
                    { Name: 'email', Value: 'jane@example.com' },
                ],
                isDeleted: false,
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageWorkers />
            </AuthContext.Provider>
        );

        fireEvent.click(screen.getByText(/Dodaj nowego pracownika/i));

        fireEvent.change(screen.getByPlaceholderText(/Wprowadź email/i), {
            target: { value: 'jane@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Wprowadź imię/i), {
            target: { value: 'Jane' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Wprowadź nazwisko/i), {
            target: { value: 'Smith' },
        });

        fireEvent.click(screen.getByText(/Dodaj pracownika/i));

        await waitFor(() => {
            expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
        });
    });
});

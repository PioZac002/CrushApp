// tests/ManageIntegrators.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageIntegrators from '../src/components/ManageIntegrators/ManageIntegrators';
import { AuthContext } from '../src/context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

describe('ManageIntegrators Component', () => {
    const mockUser = {
        userID: 'manager123',
        id_token: 'test_token',
        role: { isManager: true },
    };

    test('renders integrators list', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integrators: [
                    { PK: '1', serialNumber: 'SN001', location: 'Location 1', isDeleted: false },
                ],
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageIntegrators />
            </AuthContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText(/SN001/i)).toBeInTheDocument();
            expect(screen.getByText(/Location 1/i)).toBeInTheDocument();
        });
    });

    test('allows adding a new integrator', async () => {
        axios.get.mockResolvedValueOnce({ data: { integrators: [] } });
        axios.post.mockResolvedValueOnce({
            data: { PK: '2', serialNumber: 'SN002', location: 'Location 2', isDeleted: false },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageIntegrators />
            </AuthContext.Provider>
        );

        fireEvent.click(screen.getByText(/Dodaj nowy Integrator/i));

        fireEvent.change(screen.getByPlaceholderText(/Wprowadź lokalizację/i), {
            target: { value: 'Location 2' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Wprowadź numer seryjny/i), {
            target: { value: 'SN002' },
        });

        fireEvent.click(screen.getByText(/Dodaj Integrator/i));

        await waitFor(() => {
            expect(screen.getByText(/SN002/i)).toBeInTheDocument();
            expect(screen.getByText(/Location 2/i)).toBeInTheDocument();
        });
    });
});

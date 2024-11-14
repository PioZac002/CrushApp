import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import Diagrams from '../src/components/Diagrams/Diagrams';
import { AuthContext } from '../src/context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');
window.alert = vi.fn();
describe('Diagrams Component', () => {
    const mockUser = {
        userID: 'manager123',
        id_token: 'test_token',
        role: { isManager: true },
    };

    test('renders existing reports', async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                { SK: 'report#d3347862-f0e1-7073-fa9f-75bfefb6f03a/Report1' },
                { SK: 'report#d3347862-f0e1-7073-fa9f-75bfefb6f03a/Report2' },
            ],
        });

        await act(async () => {
            render(
                <AuthContext.Provider value={{ user: mockUser }}>
                    <Diagrams />
                </AuthContext.Provider>
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/Istniejące Raporty/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Report1/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Report2/i })).toBeInTheDocument();
        });
    });

    test('allows creating a new report', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });
        axios.post.mockResolvedValueOnce({
            data: { reportID: 'report3', reportName: 'Report 3' },
        });

        await act(async () => {
            render(
                <AuthContext.Provider value={{ user: mockUser }}>
                    <Diagrams />
                </AuthContext.Provider>
            );
        });

        fireEvent.click(screen.getByText(/Stwórz nowy raport/i));

        const nameInput = screen.getByLabelText(/Nazwa Raportu/i);
        fireEvent.change(nameInput, { target: { value: 'Report 3' } });

        const createButton = screen.getByText(/Stwórz Raport/i);
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(screen.getByText(/Report 3/i)).toBeInTheDocument();
        });
    });
});

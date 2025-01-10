// tests/ManageGroups.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageGroups from '../src/components/ManageGroups/ManageGroups';
import { AuthContext } from '../src/context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

describe('ManageGroups Component', () => {
    const mockUser = {
        userID: 'manager123',
        id_token: 'test_token',
        role: { isManager: true, isService: false },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders groups list', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument();
        });
    });

    test('allows adding a new group', async () => {
        axios.get.mockResolvedValueOnce({ data: { integratorGroups: [] } });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        fireEvent.click(screen.getByText(/Dodaj nową grupę/i));

        fireEvent.change(screen.getByPlaceholderText(/Wprowadź nazwę grupy/i), {
            target: { value: 'Nowa Grupa' },
        });

        // Mock POST request to add the group
        axios.post.mockResolvedValueOnce({
            data: { PK: 'group2', integratorGroupName: 'Nowa Grupa', isDeleted: false },
        });

        // Mock GET request after adding the group
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group2', integratorGroupName: 'Nowa Grupa', isDeleted: false },
                ],
            },
        });

        fireEvent.click(screen.getByText(/Dodaj grupę/i));

        await waitFor(() => {
            expect(screen.getByText(/Nowa Grupa/i)).toBeInTheDocument();
        });
    });

    test('allows deleting a group', async () => {
        // Mock initial GET request to fetch integrator groups
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        // Mock PUT request to delete the group
        axios.put.mockResolvedValueOnce({
            data: {
                PK: 'group1',
                integratorGroupName: 'Grupa wsparcia',
                isDeleted: true,
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

        // Rozwiń grupę
        fireEvent.click(screen.getByTestId('group-expand-button-group1'));

        // Kliknij ikonę opcji, a następnie 'Usuń grupę'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Usuń grupę/i));

        // Sprawdź, czy grupa została oznaczona jako usunięta
        await waitFor(() => {
            const groupElement = screen.getByTestId('group-card-group1');
            expect(groupElement).toHaveClass('group-deleted');
        });
    });

    test('allows restoring a deleted group', async () => {
        // Mock initial GET request to fetch integrator groups
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: true },
                ],
            },
        });

        // Mock PUT request to restore the group
        axios.put.mockResolvedValueOnce({
            data: { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

        // Rozwiń grupę
        fireEvent.click(screen.getByTestId('group-expand-button-group1'));

        // Kliknij ikonę opcji, a następnie 'Przywróć grupę'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Przywróć grupę/i));

        await waitFor(() => {
            expect(screen.getByText(/Grupa wsparcia/i)).not.toHaveClass('group-deleted');
        });
    });

    test('allows adding an integrator to a group', async () => {
        // 1. Mock initial GET request to fetch integrator groups
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    {
                        PK: 'group1',
                        integratorGroupName: 'Grupa wsparcia',
                        isDeleted: false,
                    },
                ],
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        // Wait for the group to be displayed
        await waitFor(() =>
            expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument()
        );

        // 2. Mock GET request to fetch group details when the group is expanded
        axios.get.mockResolvedValueOnce({
            data: {
                integratorsInGroups: [],
            },
        });

        // Rozwiń grupę
        fireEvent.click(screen.getByTestId('group-expand-button-group1'));

        // Wait for group details to load
        await waitFor(() =>
            expect(screen.getByText(/Integratory:/i)).toBeInTheDocument()
        );

        // 3. Mock GET request to fetch available integrators
        axios.get.mockResolvedValueOnce({
            data: {
                integrators: [
                    {
                        PK: 'integrator1',
                        serialNumber: 'integrator1',
                        location: 'Lokalizacja A',
                    },
                ],
            },
        });

        // Kliknij ikonę opcji, a następnie 'Dodaj integrator'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Dodaj integrator/i));

        // Wybierz integrator i dodaj go do grupy
        fireEvent.change(screen.getByLabelText(/Wybierz Integrator/i), {
            target: { value: 'integrator1' },
        });

        // 4. Mock POST request to add the integrator to the group
        axios.post.mockResolvedValueOnce({
            data: { PK: 'group1', SK: 'integrator1', isDeletedFromGroup: false },
        });

        // 5. Mock GET request to fetch group details again after adding the integrator
        axios.get.mockResolvedValueOnce({
            data: {
                integratorsInGroups: [
                    {
                        group1: [
                            {
                                PK: 'integrator1',
                                serialNumber: 'integrator1',
                                location: 'Lokalizacja A',
                                isDeletedFromGroup: false,
                            },
                        ],
                    },
                ],
            },
        });

        fireEvent.click(screen.getByText(/^Dodaj$/i));

        // Sprawdź, czy integrator został dodany do grupy po zaktualizowaniu stanu
        await waitFor(() => {
            expect(screen.getByText(/integrator1/i)).toBeInTheDocument();
        });
    });


    // test('allows adding a user to a group', async () => {
    //     // Mock initial GET request to fetch integrator groups
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             integratorGroups: [
    //                 {
    //                     PK: 'group1',
    //                     integratorGroupName: 'Grupa wsparcia',
    //                     isDeleted: false,
    //                 },
    //             ],
    //         },
    //     });
    //
    //     render(
    //         <AuthContext.Provider value={{ user: mockUser }}>
    //             <ManageGroups />
    //         </AuthContext.Provider>
    //     );
    //
    //     await waitFor(() =>
    //         expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument()
    //     );
    //
    //     // Rozwiń grupę
    //     fireEvent.click(screen.getByTestId('group-expand-button-group1'));
    //
    //     // Mock GET request to fetch available users
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             workers: [
    //                 {
    //                     PK: 'user1',
    //                     cognitoAttributes: [
    //                         { Name: 'given_name', Value: 'User' },
    //                         { Name: 'family_name', Value: 'One' },
    //                     ],
    //                 },
    //             ],
    //         },
    //     });
    //
    //     // Kliknij ikonę opcji, a następnie 'Dodaj użytkownika'
    //     fireEvent.click(screen.getByTestId('group-options-button-group1'));
    //     fireEvent.click(screen.getByText(/Dodaj użytkownika/i));
    //
    //     // Wybierz użytkownika i dodaj go do grupy
    //     fireEvent.change(screen.getByLabelText(/Wybierz Użytkownika/i), {
    //         target: { value: 'user1' },
    //     });
    //
    //     // Mock POST request to add the user
    //     axios.post.mockResolvedValueOnce({
    //         data: { PK: 'group1', SK: 'user1', isDeletedFromGroup: false },
    //     });
    //
    //     // Mock GET request to fetch group users after adding
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             groupsForUsers: [
    //                 {
    //                     user1: [
    //                         {
    //                             PK: 'group1',
    //                             isDeletedFromGroup: false,
    //                         },
    //                     ],
    //                 },
    //             ],
    //             workers: [
    //                 {
    //                     PK: 'user1',
    //                     cognitoAttributes: [
    //                         { Name: 'given_name', Value: 'User' },
    //                         { Name: 'family_name', Value: 'One' },
    //                     ],
    //                 },
    //             ],
    //         },
    //     });
    //
    //     fireEvent.click(screen.getByText(/^Dodaj$/i));
    //
    //     await waitFor(() => {
    //         expect(screen.getByText(/User One/i)).toBeInTheDocument();
    //     });
    // });

    // test('allows removing a user from a group', async () => {
    //     // Mock initial GET request to fetch integrator groups
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             integratorGroups: [
    //                 {
    //                     PK: 'group1',
    //                     integratorGroupName: 'Grupa wsparcia',
    //                     isDeleted: false,
    //                 },
    //             ],
    //         },
    //     });
    //
    //     render(
    //         <AuthContext.Provider value={{ user: mockUser }}>
    //             <ManageGroups />
    //         </AuthContext.Provider>
    //     );
    //
    //     await waitFor(() =>
    //         expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument()
    //     );
    //
    //     // Rozwiń grupę
    //     fireEvent.click(screen.getByTestId('group-expand-button-group1'));
    //
    //     // Mock GET request to fetch group users
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             groupsForUsers: [
    //                 {
    //                     user1: [
    //                         {
    //                             PK: 'group1',
    //                             isDeletedFromGroup: false,
    //                         },
    //                     ],
    //                 },
    //             ],
    //             workers: [
    //                 {
    //                     PK: 'user1',
    //                     cognitoAttributes: [
    //                         { Name: 'given_name', Value: 'User' },
    //                         { Name: 'family_name', Value: 'One' },
    //                     ],
    //                 },
    //             ],
    //         },
    //     });
    //
    //     // Kliknij ikonę opcji, a następnie 'Usuń użytkownika'
    //     fireEvent.click(screen.getByTestId('group-options-button-group1'));
    //     fireEvent.click(screen.getByText(/Usuń użytkownika/i));
    //
    //     // Wybierz użytkownika i usuń go z grupy
    //     fireEvent.change(screen.getByLabelText(/Wybierz Użytkownika/i), {
    //         target: { value: 'user1' },
    //     });
    //
    //     // Mock DELETE request to remove the user
    //     axios.delete.mockResolvedValueOnce({
    //         data: { PK: 'group1', SK: 'user1', isDeletedFromGroup: true },
    //     });
    //
    //     // Mock GET request to fetch group users after removal
    //     axios.get.mockResolvedValueOnce({
    //         data: {
    //             groupsForUsers: [],
    //             workers: [],
    //         },
    //     });
    //
    //     fireEvent.click(screen.getByText(/^Usuń$/i));
    //
    //     await waitFor(() => {
    //         expect(screen.queryByText(/User One/i)).not.toBeInTheDocument();
    //     });
    // });
});

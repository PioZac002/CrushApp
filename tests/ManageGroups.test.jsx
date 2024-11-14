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

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        fireEvent.click(screen.getByText(/Dodaj nową grupę/i));

        fireEvent.change(screen.getByPlaceholderText(/Nazwa grupy/i), {
            target: { value: 'Nowa Grupa' },
        });

        fireEvent.click(screen.getByText(/Dodaj grupę/i));

        await waitFor(() => {
            expect(screen.getByText(/Nowa Grupa/i)).toBeInTheDocument();
        });
    });

    test('allows deleting a group', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        axios.put.mockResolvedValueOnce({
            data: {
                PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: true,
            },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

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
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: true },
                ],
            },
        });

        axios.put.mockResolvedValueOnce({
            data: { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
        });

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

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Przywróć grupę/i));

        await waitFor(() => {
            expect(screen.getByText(/Grupa wsparcia/i)).not.toHaveClass('group-deleted');
        });
    });

    test('allows adding an integrator to a group', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        axios.post.mockResolvedValueOnce({
            data: { PK: 'group1', SK: 'integrator1', isDeletedFromGroup: false },
        });

        // Mock GET request after adding the integrator
        axios.get.mockResolvedValueOnce({
            data: {
                integratorsInGroups: [
                    { group1: [{ PK: 'integrator1', serialNumber: 'integrator1', location: 'Lokalizacja A', isDeletedFromGroup: false }] },
                ],
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

        // Kliknij ikonę opcji, a następnie 'Dodaj integrator'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Dodaj integrator/i));

        // Wybierz integrator i dodaj go do grupy
        fireEvent.change(screen.getByLabelText(/Wybierz Integrator/i), {
            target: { value: 'integrator1' },
        });
        fireEvent.click(screen.getByText(/^Dodaj$/i));

        // Sprawdź, czy integrator został dodany do grupy po zaktualizowaniu stanu
        await waitFor(() => {
            expect(screen.getByText(/integrator1/i)).toBeInTheDocument();
        });
    });

    test('allows removing an integrator from a group', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        axios.delete.mockResolvedValueOnce({
            data: { PK: 'group1', SK: 'integrator1', isDeletedFromGroup: true },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

        // Rozwiń grupę
        fireEvent.click(screen.getByTestId('group-expand-button-group1'));

        // Kliknij ikonę opcji, a następnie 'Usuń integrator'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Usuń integrator/i));

        // Wybierz integrator i usuń go z grupy
        fireEvent.change(screen.getByLabelText(/Wybierz Integrator/i), {
            target: { value: 'integrator1' },
        });
        fireEvent.click(screen.getByText(/^Usuń$/i));

        await waitFor(() => {
            expect(screen.queryByText(/integrator1/i)).not.toBeInTheDocument();
        });
    });

    test('allows adding a user to a group', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        axios.post.mockResolvedValueOnce({
            data: { PK: 'group1', SK: 'user1', isDeletedFromGroup: false },
        });

        // Mock GET request after adding the user
        axios.get.mockResolvedValueOnce({
            data: {
                usersInGroups: [
                    { group1: [{ PK: 'user1', username: 'User One', isDeletedFromGroup: false }] },
                ],
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

        // Kliknij ikonę opcji, a następnie 'Dodaj użytkownika'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Dodaj użytkownika/i));

        // Wybierz użytkownika i dodaj go do grupy
        fireEvent.change(screen.getByLabelText(/Wybierz Użytkownika/i), {
            target: { value: 'user1' },
        });
        fireEvent.click(screen.getByText(/^Dodaj$/i));

        // Sprawdź, czy użytkownik został dodany do grupy po zaktualizowaniu stanu
        await waitFor(() => {
            expect(screen.getByText(/User One/i)).toBeInTheDocument();
        });
    });

    test('allows removing a user from a group', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                integratorGroups: [
                    { PK: 'group1', integratorGroupName: 'Grupa wsparcia', isDeleted: false },
                ],
            },
        });

        axios.delete.mockResolvedValueOnce({
            data: { PK: 'group1', SK: 'user1', isDeletedFromGroup: true },
        });

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <ManageGroups />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(screen.getByText(/Grupa wsparcia/i)).toBeInTheDocument());

        // Rozwiń grupę
        fireEvent.click(screen.getByTestId('group-expand-button-group1'));

        // Kliknij ikonę opcji, a następnie 'Usuń użytkownika'
        fireEvent.click(screen.getByTestId('group-options-button-group1'));
        fireEvent.click(screen.getByText(/Usuń użytkownika/i));

        // Wybierz użytkownika i usuń go z grupy
        fireEvent.change(screen.getByLabelText(/Wybierz Użytkownika/i), {
            target: { value: 'user1' },
        });
        fireEvent.click(screen.getByText(/^Usuń$/i));

        await waitFor(() => {
            expect(screen.queryByText(/User One/i)).not.toBeInTheDocument();
        });
    });
});

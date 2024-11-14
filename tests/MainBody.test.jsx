// tests/MainBody.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import MainBody from '../src/components/MainBody/MainBody';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext';
import { vi } from 'vitest';

// Mockowanie komponentu PrivateRoute
vi.mock('../src/components/PrivateRoute/PrivateRoute', () => ({
    default: ({ children }) => <>{children}</>,
}));

// Mockowanie komponentów importowanych w MainBody
vi.mock('../src/components/MainBody/Dashboard/Dashboard', () => ({
    default: () => <div data-testid="dashboard">Dashboard Component</div>,
}));
vi.mock('../src/components/ManageWorkers/ManageWorkers', () => ({
    default: () => <div data-testid="manage-workers">Manage Workers Component</div>,
}));
vi.mock('../src/components/ManageIntegrators/ManageIntegrators', () => ({
    default: () => <div data-testid="manage-integrators">Manage Integrators Component</div>,
}));
vi.mock('../src/components/ManageGroups/ManageGroups', () => ({
    default: () => <div data-testid="manage-groups">Manage Groups Component</div>,
}));
vi.mock('../src/components/Diagrams/Diagrams', () => ({
    default: () => <div data-testid="diagrams">Diagrams Component</div>,
}));

describe('MainBody Component', () => {
    const renderWithRouter = (userRole, initialRoute) => {
        const mockUser = {
            userID: 'test-user-id',
            role: userRole,
            id_token: 'valid_token', // Dodaj, jeśli wymagane
        };

        return render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter initialEntries={[initialRoute]}>
                    <Routes>
                        <Route path="/*" element={<MainBody />} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>
        );
    };

    // Testy dla ścieżki głównej '/'
    test('renders Dashboard for worker at root path', () => {
        renderWithRouter({ isManager: false, isService: false }, '/');
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    test('renders Dashboard for manager at root path', () => {
        renderWithRouter({ isManager: true, isService: false }, '/');
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    test('renders Dashboard for service at root path', () => {
        renderWithRouter({ isManager: false, isService: true }, '/');
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    // Testy dla ścieżki '/pracownicy'
    test('renders ManageWorkers for manager at /pracownicy', () => {
        renderWithRouter({ isManager: true, isService: false }, '/pracownicy');
        expect(screen.getByTestId('manage-workers')).toBeInTheDocument();
    });

    test('renders ManageWorkers for service at /pracownicy', () => {
        renderWithRouter({ isManager: false, isService: true }, '/pracownicy');
        expect(screen.getByTestId('manage-workers')).toBeInTheDocument();
    });

    // test('does not render ManageWorkers for worker at /pracownicy', () => {
    //     renderWithRouter({ isManager: false, isService: false }, '/pracownicy');
    //     expect(screen.queryByTestId('manage-workers')).not.toBeInTheDocument();
    // });

    // Testy dla ścieżki '/integratorzy'
    test('renders ManageIntegrators for manager at /integratorzy', () => {
        renderWithRouter({ isManager: true, isService: false }, '/integratorzy');
        expect(screen.getByTestId('manage-integrators')).toBeInTheDocument();
    });

    test('renders ManageIntegrators for service at /integratorzy', () => {
        renderWithRouter({ isManager: false, isService: true }, '/integratorzy');
        expect(screen.getByTestId('manage-integrators')).toBeInTheDocument();
    });

    // test('does not render ManageIntegrators for worker at /integratorzy', () => {
    //     renderWithRouter({ isManager: false, isService: false }, '/integratorzy');
    //     expect(screen.queryByTestId('manage-integrators')).not.toBeInTheDocument();
    // });

    // Testy dla ścieżki '/grupy'
    test('renders ManageGroups for manager at /grupy', () => {
        renderWithRouter({ isManager: true, isService: false }, '/grupy');
        expect(screen.getByTestId('manage-groups')).toBeInTheDocument();
    });

    test('renders ManageGroups for service at /grupy', () => {
        renderWithRouter({ isManager: false, isService: true }, '/grupy');
        expect(screen.getByTestId('manage-groups')).toBeInTheDocument();
    });

    // test('does not render ManageGroups for worker at /grupy', () => {
    //     renderWithRouter({ isManager: false, isService: false }, '/grupy');
    //     expect(screen.queryByTestId('manage-groups')).not.toBeInTheDocument();
    // });

    // Testy dla ścieżki '/wykresy'
    test('renders Diagrams for manager at /wykresy', () => {
        renderWithRouter({ isManager: true, isService: false }, '/wykresy');
        expect(screen.getByTestId('diagrams')).toBeInTheDocument();
    });

    test('renders Diagrams for service at /wykresy', () => {
        renderWithRouter({ isManager: false, isService: true }, '/wykresy');
        expect(screen.getByTestId('diagrams')).toBeInTheDocument();
    });

    // test('does not render Diagrams for worker at /wykresy', () => {
    //     renderWithRouter({ isManager: false, isService: false }, '/wykresy');
    //     expect(screen.queryByTestId('diagrams')).not.toBeInTheDocument();
    // });
});

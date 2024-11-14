// tests/PrivateRoute.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivateRoute from '../src/components/PrivateRoute/PrivateRoute';
import { AuthContext } from '../src/context/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

// Importujemy funkcję isTokenExpired
import * as authUtils from '../src/utils/authUtils';

describe('PrivateRoute Component', () => {
    beforeEach(() => {
        // Mockujemy funkcję isTokenExpired, aby zawsze zwracała false
        vi.spyOn(authUtils, 'isTokenExpired').mockReturnValue(false);
    });

    afterEach(() => {
        // Przywracamy oryginalne implementacje po każdym teście
        vi.restoreAllMocks();
    });

    test('redirects unauthenticated users to login', () => {
        const mockUser = null;
        const mockLogout = vi.fn();

        render(
            <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
                <MemoryRouter initialEntries={['/private']}>
                    <Routes>
                        <Route
                            path="/private"
                            element={
                                <PrivateRoute allowedRoles={['manager']}>
                                    <div>Private Content</div>
                                </PrivateRoute>
                            }
                        />
                        <Route path="/login" element={<div>Login Page</div>} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    });

    test('allows access to authorized users', () => {
        const mockUser = {
            role: { isManager: true },
            id_token: 'valid_token',
        };
        const mockLogout = vi.fn();

        render(
            <AuthContext.Provider value={{ user: mockUser, logout: mockLogout }}>
                <MemoryRouter initialEntries={['/private']}>
                    <Routes>
                        <Route
                            path="/private"
                            element={
                                <PrivateRoute allowedRoles={['manager']}>
                                    <div>Private Content</div>
                                </PrivateRoute>
                            }
                        />
                        <Route path="/login" element={<div>Login Page</div>} />
                        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByText(/Private Content/i)).toBeInTheDocument();
    });
});

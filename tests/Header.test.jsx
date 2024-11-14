// tests/Header.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../src/components/Header/Header';
import { AuthContext } from '../src/context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('Header Component', () => {
    test('renders logo and navigation', () => {
        const mockUser = {
            role: { isManager: true },
        };

        render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <MemoryRouter>
                    <Header />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
        expect(screen.getByText(/Wyloguj się/i)).toBeInTheDocument();
    });
});

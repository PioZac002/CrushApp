// tests/Login.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../src/components/Login/Login';
import { AuthContext } from '../src/context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

describe('Login Component', () => {
    beforeEach(() => {
        axios.post.mockImplementation((url, data) => {
            let emailOrUsername, password;

            if (data instanceof FormData) {
                emailOrUsername = data.get('email') || data.get('username');
                password = data.get('password');
            } else if (data && (data.email || data.username) && data.password) {
                emailOrUsername = data.email || data.username;
                password = data.password;
            } else {
                console.log('Nieznany format danych:', data);
            }

            console.log('Email or Username:', emailOrUsername);
            console.log('Password:', password);

            if (emailOrUsername === 'jdiwvorwvdyhrmblmc@cwmxc.com' && password === 'Test123#@!') {
                return Promise.resolve({
                    data: {
                        userID: 'user123',
                        id_token: 'test_token',
                        access_token: 'access_token',
                    },
                });
            } else {
                return Promise.reject({
                    response: { data: 'Invalid credentials' },
                });
            }
        });
    });

    test('renders login form with email and password fields', () => {
        render(
            <AuthContext.Provider value={{}}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByLabelText(/Adres email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Zaloguj się/i })
        ).toBeInTheDocument();
    });

    test('allows user to input email and password', () => {
        render(
            <AuthContext.Provider value={{}}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        const emailInput = screen.getByLabelText(/Adres email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);

        fireEvent.change(emailInput, { target: { value: 'jdiwvorwvdyhrmblmc@cwmxc.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Test123#@!' } });

        expect(emailInput.value).toBe('jdiwvorwvdyhrmblmc@cwmxc.com');
        expect(passwordInput.value).toBe('Test123#@!');
    });

    test('displays error message on invalid login', async () => {
        const mockSetUser = vi.fn();

        render(
            <AuthContext.Provider value={{ setUser: mockSetUser }}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        const emailInput = screen.getByLabelText(/Adres email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);

        const errorMessage = await screen.findByText(
            /Nieprawidłowy email lub hasło/i
        );
        expect(errorMessage).toBeInTheDocument();
        expect(mockSetUser).not.toHaveBeenCalled();
    });

    test('navigates to dashboard on successful login', async () => {
        const mockSetUser = vi.fn();

        render(
            <AuthContext.Provider value={{ setUser: mockSetUser }}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        const emailInput = screen.getByLabelText(/Adres email/i);
        const passwordInput = screen.getByLabelText(/Hasło/i);
        const submitButton = screen.getByRole('button', { name: /Zaloguj się/i });

        fireEvent.change(emailInput, { target: { value: 'jdiwvorwvdyhrmblmc@cwmxc.com' } });
        fireEvent.change(passwordInput, { target: { value: 'Test123#@!' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSetUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    userID: 'user123',
                    id_token: expect.any(String),
                    access_token: expect.any(String),
                    email: 'jdiwvorwvdyhrmblmc@cwmxc.com',
                })
            );
        });
    });
});

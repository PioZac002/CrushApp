// src/components/FirstLogin/FirstLogin.jsx

import React, { useState, useContext } from 'react';
import './firstLogin.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from '../../api/api';
import { AuthContext } from '../../contexts/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const FirstLogin = () => {
  const [newPassword, setNewPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { username, session } = location.state || {};
  const { login } = useContext(AuthContext);

  const handleFirstLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(endpoints.firstLogin(username), {
        username,
        password: newPassword,
        session,
      });

      const { id_token, access_token, userID } = response.data;
      localStorage.setItem('id_token', id_token);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('userID', userID);

      // Ustaw nagłówek Authorization w axiosInstance
      axiosInstance.defaults.headers.common['Authorization'] = id_token;

      // Pobierz dane użytkownika z API
      try {
        const userResponse = await axiosInstance.get(
          endpoints.getUser(userID, userID)
        );
        const user = userResponse.data;

        // Zapisz dane użytkownika w kontekście autoryzacji
        login(user);
        console.log('Zalogowany użytkownik po zmianie hasła:', user);

        // Przekierowanie na Dashboard
        navigate('/');
      } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        alert('Wystąpił błąd podczas pobierania danych użytkownika.');
      }
    } catch (error) {
      console.error('Błąd podczas zmiany hasła:', error);
      alert('Wystąpił błąd podczas zmiany hasła.');
    }
  };

  return (
    <div className='first-login-container d-flex align-items-center justify-content-center vh-100'>
      <div className='first-login-card p-5 shadow'>
        <div className='text-center mb-4'>
          <h2>Set Your New Password</h2>
        </div>
        <form onSubmit={handleFirstLogin}>
          <div className='form-group mb-3 position-relative'>
            <label htmlFor='newPassword' className='form-label'>
              New Password
            </label>
            <div className='input-group'>
              <span className='input-group-text'>
                <i className='bi bi-shield-lock-fill'></i>
              </span>
              <input
                type='password'
                id='newPassword'
                className='form-control'
                placeholder='Enter New Password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type='submit'
            className='btn w-100 btn-success custom-button-login d-flex justify-content-between align-items-center'
          >
            Change Password
            <i className='bi bi-arrow-right-short login-icon'></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstLogin;

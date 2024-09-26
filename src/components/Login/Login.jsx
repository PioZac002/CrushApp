// src/components/Login/Login.jsx
import React, { useState, useContext } from 'react';
import './Login.css';
import Logo from '../../assets/images/logoKruszarka.png';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../../api/api';

const Login = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState(''); // Email or username
  const [password, setPassword] = useState('');
  const [session, setSession] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(endpoints.login, {
        username,
        password,
      });

      // Check for first login
      if (response.data.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setIsFirstLogin(true);
        setSession(response.data.session);
      } else {
        // Successful login
        const { userID, id_token, access_token } = response.data;

        // Set user state with email (username)
        setUser({ userID, id_token, access_token, email: username });

        await fetchUserData(userID, id_token);
        navigate('/');
      }
    } catch (error) {
      console.error('Błąd logowania:', error);
    }
  };

  const handleFirstLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(endpoints.firstLogin(username), {
        username,
        password: newPassword,
        session,
      });

      const { userID, id_token, access_token } = response.data;

      // Set user state with email (username)
      setUser({ userID, id_token, access_token, email: username });

      await fetchUserData(userID, id_token);
      navigate('/');
    } catch (error) {
      console.error('Błąd podczas pierwszego logowania:', error);
    }
  };

  const fetchUserData = async (userID, id_token) => {
    try {
      const response = await axios.get(endpoints.getUser(userID, userID), {
        headers: {
          Authorization: id_token,
        },
      });
      setUser((prevUser) => ({
        ...prevUser,
        role: response.data.user.role,
      }));
    } catch (error) {
      console.error('Błąd podczas pobierania danych użytkownika:', error);
    }
  };

  return (
    <div className='login-container d-flex align-items-center justify-content-center vh-100'>
      <div className='login-card p-5 shadow'>
        <div className='text-center mb-4'>
          <img src={Logo} alt='Logo' className='login-logo mb-3' />
          <h2>Witaj ponownie!</h2>
        </div>
        <form onSubmit={isFirstLogin ? handleFirstLogin : handleLogin}>
          <div className='form-group mb-3 position-relative'>
            <label htmlFor='username' className='form-label'>
              Adres email
            </label>
            <div className='input-group'>
              <span className='input-group-text'>
                <i className='bi bi-person-lines-fill'></i>
              </span>
              <input
                type='email'
                id='username'
                className='form-control'
                placeholder='Wprowadź adres email'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='form-group mb-4 position-relative'>
            <label htmlFor='password' className='form-label'>
              {isFirstLogin ? 'Nowe hasło' : 'Hasło'}
            </label>
            <div className='input-group'>
              <span className='input-group-text'>
                <i className='bi bi-shield-lock-fill'></i>
              </span>
              <input
                type='password'
                id='password'
                className='form-control'
                placeholder={
                  isFirstLogin ? 'Wprowadź nowe hasło' : 'Wprowadź hasło'
                }
                value={isFirstLogin ? newPassword : password}
                onChange={(e) =>
                  isFirstLogin
                    ? setNewPassword(e.target.value)
                    : setPassword(e.target.value)
                }
                required
              />
            </div>
          </div>
          <button
            type='submit'
            className='btn w-100 btn-success custom-button-login d-flex justify-content-between align-items-center'
          >
            {isFirstLogin ? 'Zmień hasło' : 'Zaloguj się'}
            <i className='bi bi-arrow-right-short login-icon'></i>
          </button>
        </form>
        {!isFirstLogin && (
          <div className='text-center mt-3'>
            <a href='#' className='forgot-password'>
              Zapomniałeś hasła?{' '}
              <span className='text-primary'>Kliknij tutaj</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

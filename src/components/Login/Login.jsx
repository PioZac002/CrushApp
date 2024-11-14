// src/components/Login/Login.jsx

import React, { useState, useContext, useEffect } from 'react';
import './login.css';
import Logo from '../../assets/images/logoKruszarka.png';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../../api/api';
import ToastContainer from '../ToastContainer/ToastContainer';

const Login = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [username, setUsername] = useState(''); // Email or username
  const [password, setPassword] = useState('');
  const [session, setSession] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Nowe zmienne stanu dla liczby prób i czasu blokady
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  // Aktualizacja pozostałego czasu blokady
  useEffect(() => {
    let timer;
    if (lockoutUntil) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const distance = lockoutUntil - now;
        if (distance <= 0) {
          setLockoutUntil(null);
          setFailedAttempts(0);
          setTimeLeft(0);
          clearInterval(timer);
        } else {
          setTimeLeft(Math.ceil(distance / 1000));
        }
      };
      timer = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Sprawdzenie, czy użytkownik jest zablokowany
    if (lockoutUntil) {
      showErrorMessage(
        `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${timeLeft} sekund.`
      );
      return;
    }

    try {
      const response = await axios.post(endpoints.login, {
        username,
        password,
      });

      // Resetowanie liczby nieudanych prób po udanym logowaniu
      setFailedAttempts(0);

      // Sprawdzenie, czy to pierwsze logowanie
      if (response.data.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setIsFirstLogin(true);
        setSession(response.data.session);
      } else {
        // Udane logowanie
        const { userID, id_token, access_token } = response.data;

        // Ustawienie stanu użytkownika z emailem (username)
        setUser({ userID, id_token, access_token, email: username });

        await fetchUserData(userID, id_token);
        navigate('/');
      }
    } catch (error) {
      console.error('Błąd logowania:', error);

      // Inkrementacja liczby nieudanych prób
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 3) {
        // Ustawienie czasu blokady na 30 sekund od teraz
        const lockoutTime = new Date().getTime() + 30000;
        setLockoutUntil(lockoutTime);
        showErrorMessage(
          'Zbyt wiele nieudanych prób logowania. Zaloguj się ponownie za 30 sekund.'
        );
      } else {
        showErrorMessage(
          `Nieprawidłowy email lub hasło. Pozostało prób: ${
            3 - newFailedAttempts
          }`
        );
      }
    }
  };

  const handleFirstLogin = async (e) => {
    e.preventDefault();

    // Sprawdzenie, czy użytkownik jest zablokowany
    if (lockoutUntil) {
      showErrorMessage(
        `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${timeLeft} sekund.`
      );
      return;
    }

    try {
      const response = await axios.post(endpoints.firstLogin(username), {
        username,
        password: newPassword,
        session,
      });

      // Resetowanie liczby nieudanych prób po udanym logowaniu
      setFailedAttempts(0);

      const { userID, id_token, access_token } = response.data;

      // Ustawienie stanu użytkownika z emailem (username)
      setUser({ userID, id_token, access_token, email: username });

      await fetchUserData(userID, id_token);
      navigate('/');
    } catch (error) {
      console.error('Błąd podczas pierwszego logowania:', error);

      // Inkrementacja liczby nieudanych prób
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 3) {
        // Ustawienie czasu blokady na 30 sekund od teraz
        const lockoutTime = new Date().getTime() + 30000;
        setLockoutUntil(lockoutTime);
        showErrorMessage(
          'Zbyt wiele nieudanych prób logowania. Zaloguj się ponownie za 30 sekund.'
        );
      } else {
        showErrorMessage(
          `Nieprawidłowe hasło. Pozostało prób: ${3 - newFailedAttempts}`
        );
      }
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
                name="email"
                className='form-control'
                placeholder='Wprowadź adres email'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isFirstLogin}
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
                name="password"
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
          {lockoutUntil ? (
            <button
              type='button'
              className='btn w-100 btn-secondary custom-button-login d-flex justify-content-between align-items-center'
              disabled
            >
              Zaloguj się za {timeLeft} sekund
            </button>
          ) : (
            <button
              type='submit'
              className='btn w-100 btn-success custom-button-login d-flex justify-content-between align-items-center'
            >
              {isFirstLogin ? 'Zmień hasło' : 'Zaloguj się'}
              <i className='bi bi-arrow-right-short login-icon'></i>
            </button>
          )}
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
      {errorMessage && (
        <ToastContainer
          message={errorMessage}
          onClose={() => setErrorMessage('')}
          variant='danger'
        />
      )}
    </div>
  );
};

export default Login;

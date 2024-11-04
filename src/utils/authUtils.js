// src/utils/authUtils.js

export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decodedToken = parseJwt(token);
    if (!decodedToken) return true;

    const currentTime = Math.floor(Date.now() / 1000); // in seconds

    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat invalid token as expired
  }
};

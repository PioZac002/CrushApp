// src/api/api.js

const API_BASE_URL_USER = import.meta.env.VITE_API_BASE_URL_USER;
const API_BASE_URL_INTEGRATORS = import.meta.env.VITE_API_BASE_URL_INTEGRATORS;

export const endpoints = {
  login: `${API_BASE_URL_USER}/login`,
  firstLogin: (username) => `${API_BASE_URL_USER}/firstLogin/${username}`,
  register: (creatorID) => `${API_BASE_URL_USER}/register/${creatorID}`,
  getWorkers: (userID) => `${API_BASE_URL_USER}/getWorkers/${userID}`,
  getIntegrators: (userID, managerID = '') =>
    managerID
      ? `${API_BASE_URL_INTEGRATORS}/integrator/${userID}?createdFor=${managerID}`
      : `${API_BASE_URL_INTEGRATORS}/integrator/${userID}`,
  getIntegratorGroups: (userID, managerID = '') =>
    managerID
      ? `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}?groupsFor=${managerID}`
      : `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}`,
  getManagers: () => `${API_BASE_URL_USER}/getManagers`,
  addIntegrator: (userID) => `${API_BASE_URL_INTEGRATORS}/integrator/${userID}`,
  editIntegrator: (userID) =>
    `${API_BASE_URL_INTEGRATORS}/integrator/${userID}`,
  editWorker: (userID) => `${API_BASE_URL_USER}/edit/${userID}`,
  getUser: (requesterID, userID) =>
    `${API_BASE_URL_USER}/getUser/${requesterID}?userID=${userID}`,
  addGroup: (userID) => `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}`,
  editGroup: (userID) =>
    `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}`,
  addUserToGroup: (userID) => `${API_BASE_URL_USER}/group/${userID}`,
  removeUserFromGroup: (userID) => `${API_BASE_URL_USER}/group/${userID}`,
  addIntegratorToGroup: (userID) =>
    `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}/add`,
  removeIntegratorFromGroup: (userID) =>
    `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}/remove`,
  getGroupDetails: (userID) =>
    `${API_BASE_URL_INTEGRATORS}/integratorGroup/${userID}/fromGroups`,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  document.cookie = 'accessToken=; path=/; max-age=0';
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  try {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const login = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data;
};

export const register = async (username, password, businessName, accessCode) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, businessName, accessCode })
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data;
};

export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch (err) {
    console.error(err);
  } finally {
    clearTokens();
    window.location.href = '/login';
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (err) {
    clearTokens();
    window.location.href = '/login';
    throw err;
  }
};
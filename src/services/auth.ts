import { jwtDecode } from 'jwt-decode';
import { User } from '../types';

interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  exp: number;
}

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const removeTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getCurrentUser = (): Partial<User> | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return {
      id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}; 
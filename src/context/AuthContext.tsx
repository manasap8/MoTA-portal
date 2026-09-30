import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ApplicantProfile, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  applicantProfile: ApplicantProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<boolean>;
  quickLoginAsRole: (role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setApplicantProfile(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      setUser(res.user);
      setApplicantProfile(res.applicantProfile || null);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setApplicantProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string = 'Demo@123'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.login({ email, password });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      setApplicantProfile(res.applicantProfile || null);
      showToast(`Welcome back, ${res.user.fullName}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.register(data);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast('Account created successfully! Welcome to the portal.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any): Promise<boolean> => {
    try {
      const res = await api.updateProfile(data);
      setApplicantProfile(res.applicantProfile);
      showToast('Profile updated successfully.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
      return false;
    }
  };

  const quickLoginAsRole = async (role: UserRole): Promise<boolean> => {
    const roleEmailMap: Record<UserRole, string> = {
      applicant: 'applicant@demo.com',
      officer: 'officer@demo.com',
      selection: 'selection@demo.com',
      admin: 'admin@demo.com',
    };
    const email = roleEmailMap[role];
    return login(email, 'Demo@123');
  };

  const logout = () => {
    try {
      api.logout().catch(() => {});
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setApplicantProfile(null);
      showToast('Logged out successfully.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        applicantProfile,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        quickLoginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

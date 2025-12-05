import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { AuthUser, UserType } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string, type: UserType) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, type: UserType) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  // Cargar usuario y token desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Registro
  const register = async (
    name: string,
    email: string,
    password: string,
    type: UserType
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.register(name, email, password, type);
      
      if (response.token) {
        const user: AuthUser = {
          id: response.user.id,
          nombre: response.user.name,
          username: response.user.name,
          email: response.user.email,
          userType: type,
          avatarUrl: '',
          coins: response.user.coins || 0,
          points: response.user.points || 0,
          level: response.user.level || 1
        };
        setUser(user);
        setToken(response.token);
        setIsAuthenticated(true);
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', response.token);
        
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message || 'Error en registro' };
    } catch (error: any) {
      const message = error.message || 'Error al registrarse';
      return { success: false, message };
    }
  };

  // Login
  const login = async (
    email: string,
    password: string,
    type: UserType
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authAPI.login(email, password, type);
      
      if (response.token) {
        const user: AuthUser = {
          id: response.user.id,
          nombre: response.user.name,
          username: response.user.name,
          email: response.user.email,
          userType: type,
          avatarUrl: '',
          coins: response.user.coins || 0,
          points: response.user.points || 0,
          level: response.user.level || 1
        };
        setUser(user);
        setToken(response.token);
        setIsAuthenticated(true);
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', response.token);
        
        return { success: true, message: response.message };
      }
      
      return { success: false, message: response.message || 'Error en login' };
    } catch (error: any) {
      const message = error.message || 'Error al iniciar sesión';
      return { success: false, message };
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  // Actualizar usuario
  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, darkMode, toggleDarkMode, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

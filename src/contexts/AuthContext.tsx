
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authenticateAdminUser, registerAdminUser } from '@/integrations/supabase/client';

interface User {
  id: string | number;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  login: (credentials: { email: string; password: string; role?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: { email: string; password: string; name: string; role: string }) => Promise<User | null>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string; role?: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Authenticate user against the usuario_administrador or usuario_invitado table
      const user = await authenticateAdminUser(credentials.email, credentials.password);

      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // Clear user from state and localStorage
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const register = async (userData: { email: string; password: string; name: string; role: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Register a new admin user
      if (userData.role === 'admin') {
        const adminData = await registerAdminUser(userData.name, userData.email, userData.password);
        
        if (adminData) {
          const user: User = {
            id: adminData.id,
            email: adminData.correo,
            name: adminData.nombre,
            role: 'admin'
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(user));
          return user;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const value = {
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    logout,
    register,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

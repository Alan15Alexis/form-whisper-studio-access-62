import React, { createContext, useState, useEffect, useContext } from 'react';
import { authenticateAdminUser, authenticateInvitedUser, registerAdminUser } from '@/integrations/supabase/client';
import { toast } from '@/hooks/toast';

interface User {
  id: string | number;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'super_admin';
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
    const storedEmail = localStorage.getItem('userEmail');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('Restored user from localStorage:', user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    } else if (storedEmail) {
      // If we have a stored email but no user object, create a basic user
      console.log('Found stored email, creating user object:', storedEmail);
      const user = {
        id: storedEmail,
        email: storedEmail,
        name: storedEmail,
        role: 'user' as const
      };
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string; role?: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      console.log('Login attempt for:', credentials.email);
      
      let user = null;
      
      // If password is provided, try admin authentication first
      if (credentials.password && credentials.password.trim() !== '') {
        const authResult = await authenticateAdminUser(credentials.email, credentials.password);
        
        // Handle approval status error
        if (authResult && typeof authResult === 'object' && 'error' in authResult) {
          toast({
            title: "Acceso denegado",
            description: authResult.error,
            variant: "destructive",
          });
          return null;
        }
        
        user = authResult;
      }
      
      // If no user found and no password (or password failed), try invited user
      if (!user) {
        user = await authenticateInvitedUser(credentials.email);
      }

      if (user) {
        console.log('Authentication successful:', user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userEmail', user.email);
        
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido, ${user.name || user.email}`,
        });
        
        return user;
      } else {
        console.log('Authentication failed for:', credentials.email);
        toast({
          title: "Error de autenticación",
          description: "Credenciales inválidas o usuario no autorizado",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('Logging out user');
    // Clear user from state and localStorage
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail');
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  const register = async (userData: { email: string; password: string; name: string; role: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Register a new admin user
      if (userData.role === 'admin') {
        const adminData = await registerAdminUser(userData.name, userData.email, userData.password);
        
        if (adminData) {
          // Show registration success message but don't log them in automatically
          toast({
            title: "Registro exitoso",
            description: "Tu cuenta ha sido registrada y está pendiente de aprobación por el super administrador",
          });
          
          return null; // Don't return user to prevent auto-login
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

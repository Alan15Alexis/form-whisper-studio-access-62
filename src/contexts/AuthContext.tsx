
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, AuthCredentials } from '@/types/form';
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (credentials: AuthCredentials & { role?: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (credentials: AuthCredentials & { name: string, role?: string }) => Promise<User | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock authentication service - would be replaced with real authentication
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: AuthCredentials & { role?: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Mock login - would be replaced with API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { email, password, role = "user" } = credentials;
      
      // Check credentials based on role
      if (role === "admin" && email === 'admin@beed.studio' && password === 'password123') {
        const user: User = {
          id: '1',
          email: 'admin@beed.studio',
          name: 'Admin User',
          role: 'admin'
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        toast({
          title: 'Login successful',
          description: `Bienvenido ${user.name || user.email}!`,
          variant: 'default',
        });
        return user;
      } else if (role === "user" && email === 'user@example.com' && password === 'password123') {
        const user: User = {
          id: '2',
          email: 'user@example.com',
          name: 'Demo User',
          role: 'user'
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        toast({
          title: 'Login successful',
          description: `Bienvenido ${user.name || user.email}!`,
          variant: 'default',
        });
        return user;
      }
      
      toast({
        title: 'Login failed',
        description: 'Credenciales inválidas para el rol seleccionado',
        variant: 'destructive',
      });
      return null;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'Ocurrió un error durante el inicio de sesión',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast({
      title: 'Logout successful',
      description: 'Has cerrado sesión correctamente',
      variant: 'default',
    });
  };

  const register = async (credentials: AuthCredentials & { name: string, role?: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Mock registration - would be replaced with API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { email, name, role = "user" } = credentials;
      
      const user: User = {
        id: Math.random().toString(36).substring(2, 11), // Generate a random ID
        email,
        name,
        role
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast({
        title: 'Registration successful',
        description: `Tu cuenta ${role === "admin" ? "de administrador" : "de usuario"} ha sido creada`,
        variant: 'default',
      });
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: 'Ocurrió un error al crear tu cuenta',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

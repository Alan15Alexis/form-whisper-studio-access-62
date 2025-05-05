
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, AuthCredentials } from '@/types/form';
import { toast } from "@/hooks/use-toast";
import { registerAdmin, validateAdminCredentials, validateInvitedUser } from '@/integrations/supabase/client';

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
      const { email, password, role } = credentials;
      
      // Check if this is an admin login attempt
      if (role === "admin" || (email === "admin@beed.studio" || email === "admin@correo.com")) {
        // Validate admin credentials using both email and password
        const adminUser = await validateAdminCredentials(email, password);
        
        if (adminUser) {
          const user: User = {
            id: adminUser.id.toString(),
            email: adminUser.correo,
            name: adminUser.nombre,
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
        } else {
          toast({
            title: 'Login failed',
            description: 'Credenciales de administrador inválidas.',
            variant: 'destructive',
          });
          return null;
        }
      } 
      
      // If not admin login or admin validation failed, try as regular user
      // For regular users, we ONLY check if they are in the usuario_invitado table
      const isInvited = await validateInvitedUser(email);
      
      if (isInvited) {
        console.log("User is in the invited users table, authentication successful");
        // Create user object for invited user - no password validation needed
        const user: User = {
          id: Math.random().toString(36).substring(2, 11), // Generate a random ID
          email,
          name: email.split('@')[0], // Use part of email as name
          role: 'user'
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        toast({
          title: 'Acceso concedido',
          description: `Bienvenido a tus formularios asignados`,
          variant: 'default',
        });
        return user;
      } else {
        console.log("User is not in the invited users table, authentication failed");
        toast({
          title: 'Acceso denegado',
          description: 'Tu correo no está autorizado para acceder',
          variant: 'destructive',
        });
        return null;
      }
      
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
      const { email, password, name, role = "user" } = credentials;
      
      if (role === "admin") {
        // Registrar en la tabla usuario_administrador
        const newAdmin = await registerAdmin(name, email, password);
        
        if (newAdmin) {
          const user: User = {
            id: newAdmin.id.toString(),
            email,
            name,
            role: "admin"
          };
          
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentUser(user);
          setIsAuthenticated(true);
          toast({
            title: 'Registration successful',
            description: `Tu cuenta de administrador ha sido creada`,
            variant: 'default',
          });
          return user;
        } else {
          throw new Error("No se pudo registrar al administrador");
        }
      } else {
        // Para usuarios regulares, podríamos registrarlos en usuario_invitado
        throw new Error("El registro de usuarios regulares no está implementado");
      }
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

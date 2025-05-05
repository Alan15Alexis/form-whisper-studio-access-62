
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsajriavcmbwgnlsonmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYWpyaWF2Y21id2dubHNvbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMzMxODIsImV4cCI6MjA2MTgwOTE4Mn0.-gUjFTy1CR2gvrubQLi66Fcy_QKxQuwPIOi9F5j8g6w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function to authenticate against usuario_administrador table
export const authenticateAdminUser = async (email: string, password: string) => {
  try {
    console.info(`Attempting to authenticate user: ${email}`);
    
    // Query the usuario_administrador table for matching credentials
    const { data, error } = await supabase
      .from('usuario_administrador')
      .select('*')
      .eq('correo', email)
      .eq('contrasena', password)
      .single();
    
    if (error) {
      console.error('Authentication error:', error);
      return null;
    }
    
    if (data) {
      console.info('Admin authenticated successfully:', {
        id: data.id,
        nombre: data.nombre,
        correo: data.correo,
      });
      
      // Return user object in format expected by the app
      return {
        id: data.id,
        email: data.correo,
        name: data.nombre,
        role: 'admin' as const
      };
    }
    
    // Also try to authenticate invited users
    return await authenticateInvitedUser(email);
    
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

// Utility function to authenticate against usuario_invitado table
export const authenticateInvitedUser = async (email: string) => {
  try {
    console.info(`Validating invited user: ${email}`);
    
    // Check if the email exists in the usuario_invitado table
    const { data, error } = await supabase
      .from('usuario_invitado')
      .select('*')
      .eq('correo', email)
      .single();
    
    if (error) {
      console.info('Invited user validation result: false');
      console.info('User is not in the invited users table, authentication failed');
      return null;
    }
    
    if (data) {
      console.info('Invited user validated successfully:', {
        id: data.id,
        nombre: data.nombre,
        correo: data.correo,
      });
      
      // Return user object in format expected by the app
      return {
        id: data.id,
        email: data.correo, 
        name: data.nombre,
        role: 'user' as const
      };
    }
    
    return null;
  } catch (error) {
    console.error('Invited user validation error:', error);
    return null;
  }
};

// Utility function to validate if a user is in the invited users list
export const validateInvitedUser = async (email: string): Promise<boolean> => {
  try {
    console.info(`Checking if ${email} is in the invited users list`);
    
    const { data, error } = await supabase
      .from('usuario_invitado')
      .select('id')
      .eq('correo', email)
      .maybeSingle();
    
    if (error) {
      console.error('Error validating invited user:', error);
      return false;
    }
    
    const isInvited = !!data;
    console.info(`User ${email} invitation status: ${isInvited ? 'Invited' : 'Not invited'}`);
    return isInvited;
  } catch (error) {
    console.error('Error validating invited user:', error);
    return false;
  }
};

// Utility function to fetch all invited users
export const fetchInvitedUsers = async () => {
  try {
    console.info('Fetching all invited users');
    
    const { data, error } = await supabase
      .from('usuario_invitado')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invited users:', error);
      throw error;
    }
    
    console.info(`Fetched ${data.length} invited users`);
    return data;
  } catch (error) {
    console.error('Error fetching invited users:', error);
    throw error;
  }
};

// Utility function to add an invited user
export const addInvitedUser = async (name: string, email: string) => {
  try {
    console.info('Registering user:', { nombre: name, correo: email });
    
    const { data, error } = await supabase
      .from('usuario_invitado')
      .insert([
        { nombre: name, correo: email }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error registering user:', error);
      throw error;
    }
    
    console.info('User registered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Utility function to remove an invited user
export const removeInvitedUser = async (id: number) => {
  try {
    console.info(`Removing invited user with ID: ${id}`);
    
    const { error } = await supabase
      .from('usuario_invitado')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error removing invited user:', error);
      throw error;
    }
    
    console.info('Invited user removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing invited user:', error);
    throw error;
  }
};

// Utility function to register an admin user
export const registerAdminUser = async (name: string, email: string, password: string) => {
  try {
    console.info('Registering admin:', { nombre: name, correo: email });
    
    const { data, error } = await supabase
      .from('usuario_administrador')
      .insert([
        { nombre: name, correo: email, contrasena: password }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error registering admin:', error);
      throw error;
    }
    
    console.info('Admin registered successfully:', data);
    return data;
  } catch (error) {
    console.error('Error registering admin:', error);
    throw error;
  }
};

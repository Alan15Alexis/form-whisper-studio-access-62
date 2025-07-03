import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthContext';
import { FormContextType } from './types';
import { 
  getInitialForms, 
  getInitialResponses, 
  getInitialAccessTokens, 
  getInitialAllowedUsers,
  MYSQL_API_ENDPOINT
} from './initialState';
import { 
  createFormOperation,
  updateFormOperation,
  deleteFormOperation,
  getFormOperation
} from './formOperations';
import {
  submitFormResponseOperation,
  getFormResponsesOperation
} from './responseOperations';
import {
  addAllowedUserOperation,
  removeAllowedUserOperation,
  isUserAllowedOperation,
  canUserEditFormOperation,
  generateAccessLinkOperation,
  validateAccessTokenOperation
} from './accessOperations';
import { supabase } from '@/integrations/supabase/client';
import { FormResponse } from '@/types/form';

const FormContext = createContext<FormContextType | undefined>(undefined);

// Helper function to safely save to localStorage with quota management
const safeLocalStorageSet = (key: string, value: any) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`LocalStorage quota exceeded for key: ${key}. Attempting cleanup...`);
      
      // If it's form responses, keep only the most recent 50 responses
      if (key === 'formResponses' && Array.isArray(value)) {
        try {
          const recentResponses = value
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 50); // Keep only 50 most recent responses
          
          const cleanedValue = JSON.stringify(recentResponses);
          localStorage.setItem(key, cleanedValue);
          console.log(`Cleaned up ${key}, kept ${recentResponses.length} most recent responses`);
        } catch (cleanupError) {
          console.error(`Failed to cleanup ${key}:`, cleanupError);
          // If cleanup fails, clear the storage completely for this key
          localStorage.removeItem(key);
        }
      } else {
        // For other keys, just remove them if they cause quota issues
        console.warn(`Removing ${key} from localStorage due to quota issues`);
        localStorage.removeItem(key);
      }
    } else {
      console.error(`Error saving to localStorage:`, error);
    }
  }
};

// Helper function to clean score ranges and prevent circular references
const cleanScoreRanges = (ranges: any): any[] => {
  if (!Array.isArray(ranges)) {
    return [];
  }
  
  return ranges.map(range => {
    if (!range || typeof range !== 'object') {
      return null;
    }
    
    return {
      min: typeof range.min === 'number' ? range.min : 0,
      max: typeof range.max === 'number' ? range.max : 0,
      message: typeof range.message === 'string' ? range.message : ''
    };
  }).filter(range => range !== null);
};

// Enhanced helper function to process collaborators data with better error handling
const processCollaborators = (collaboratorsData: any): string[] => {
  console.log('processCollaborators - Processing raw data:', collaboratorsData);
  
  if (!collaboratorsData) {
    console.log('processCollaborators - No collaborators data, returning empty array');
    return [];
  }
  
  if (Array.isArray(collaboratorsData)) {
    const processed = collaboratorsData
      .filter(item => item && typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim().toLowerCase());
    
    console.log('processCollaborators - Processed array:', processed);
    return processed;
  }
  
  if (typeof collaboratorsData === 'string') {
    // Handle empty string case
    if (collaboratorsData.trim() === '') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(collaboratorsData);
      if (Array.isArray(parsed)) {
        const processed = parsed
          .filter(item => item && typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim().toLowerCase());
        
        console.log('processCollaborators - Processed from JSON string:', processed);
        return processed;
      }
    } catch (error) {
      console.warn('processCollaborators - Failed to parse JSON string, treating as single email:', error);
      // If it's not valid JSON, treat it as a single email
      const email = collaboratorsData.trim().toLowerCase();
      return email ? [email] : [];
    }
  }
  
  console.log('processCollaborators - Unrecognized format, returning empty array');
  return [];
};

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState(getInitialForms());
  const [responses, setResponses] = useState(getInitialResponses());
  const [accessTokens, setAccessTokens] = useState(getInitialAccessTokens());
  const [allowedUsers, setAllowedUsers] = useState(getInitialAllowedUsers());
  const [formsLoaded, setFormsLoaded] = useState(false);

  // Enhanced form loading function with better collaborator handling and creator tracking
  const loadFormsFromSupabase = useCallback(async (forceReload = false) => {
    if (formsLoaded && !forceReload) {
      console.log("FormContext - Forms already loaded, skipping reload");
      return;
    }

    try {
      console.log("FormContext - Loading forms from Supabase...");
      
      const { data: formsData, error } = await supabase
        .from('formulario_construccion')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("FormContext - Error loading forms:", error);
        throw error;
      }
      
      if (formsData && formsData.length > 0) {
        console.log("FormContext - Processing", formsData.length, "forms from database");
        
        const loadedForms = formsData.map(formData => {
          const config = formData.configuracion || {};
          
          // Enhanced showTotalScore processing with detailed logging
          const showTotalScore = Boolean(config.showTotalScore || formData.showTotalScore);
          
          // Enhanced score ranges processing with extensive validation and logging
          const scoreRanges = cleanScoreRanges(formData.rangos_mensajes);
          
          // Enhanced collaborators processing with better error handling
          const collaborators = processCollaborators(formData.colaboradores);
          
          // Enhanced owner ID processing using the new administrador_creador field
          const ownerId = formData.administrador_creador || formData.administrador || 'unknown';
          
          console.log(`FormContext - Processing form "${formData.titulo}" (ID: ${formData.id}):`, {
            hasRangosMensajes: !!formData.rangos_mensajes,
            scoreRangesCount: scoreRanges.length,
            showTotalScore: showTotalScore,
            rawCollaborators: formData.colaboradores,
            processedCollaborators: collaborators,
            collaboratorsCount: collaborators.length,
            administrador: formData.administrador,
            administrador_creador: formData.administrador_creador,
            ownerId: ownerId
          });
          
          const finalForm = {
            id: formData.id.toString(),
            title: formData.titulo || 'Untitled Form',
            description: formData.descripcion || '',
            fields: formData.preguntas || [],
            isPrivate: Boolean(config.isPrivate),
            allowedUsers: formData.acceso || [],
            collaborators: collaborators,
            createdAt: formData.created_at,
            updatedAt: formData.created_at,
            accessLink: uuidv4(),
            ownerId: ownerId,
            formColor: config.formColor || '#3b82f6',
            allowViewOwnResponses: Boolean(config.allowViewOwnResponses),
            allowEditOwnResponses: Boolean(config.allowEditOwnResponses),
            httpConfig: config.httpConfig,
            showTotalScore: showTotalScore,
            scoreRanges: scoreRanges
          };
          
          console.log(`FormContext - Final processed form "${formData.titulo}":`, {
            id: finalForm.id,
            showTotalScore: finalForm.showTotalScore,
            scoreRangesCount: finalForm.scoreRanges.length,
            collaborators: finalForm.collaborators,
            collaboratorsCount: finalForm.collaborators.length,
            ownerId: finalForm.ownerId
          });
          
          return finalForm;
        });
        
        console.log("FormContext - Successfully loaded forms:", loadedForms.length);
        
        setForms(loadedForms);
        safeLocalStorageSet('forms', loadedForms);
        setFormsLoaded(true);
        
        return loadedForms;
      } else {
        console.log("FormContext - No forms found in database");
        setForms([]);
        safeLocalStorageSet('forms', []);
        setFormsLoaded(true);
        return [];
      }
    } catch (error) {
      console.error("FormContext - Error loading forms:", error);
      
      // Fallback to local storage only if we haven't loaded anything yet
      if (!formsLoaded) {
        const localForms = getInitialForms();
        if (localForms && localForms.length > 0) {
          console.log("FormContext - Using local storage fallback");
          setForms(localForms);
          setFormsLoaded(true);
          return localForms;
        }
      }
      
      throw error;
    }
  }, [formsLoaded]);

  // Load forms from Supabase on mount
  React.useEffect(() => {
    loadFormsFromSupabase();
  }, [loadFormsFromSupabase]);
  
  // Persist state to localStorage whenever it changes
  useMemo(() => {
    if (formsLoaded) {
      safeLocalStorageSet('forms', forms);
    }
  }, [forms, formsLoaded]);

  useMemo(() => {
    safeLocalStorageSet('formResponses', responses);
  }, [responses]);

  useMemo(() => {
    safeLocalStorageSet('accessTokens', accessTokens);
  }, [accessTokens]);

  useMemo(() => {
    safeLocalStorageSet('allowedUsers', allowedUsers);
  }, [allowedUsers]);

  // Enhanced form operations with better error handling and extensive logging
  const getForm = useCallback((id: string) => {
    console.log(`FormContext - getForm called with id: "${id}"`);
    
    if (!id) {
      console.warn("FormContext - getForm called with empty id");
      return undefined;
    }
    
    // Try to find by exact ID match first (this handles both numeric and UUID)
    let form = forms.find(f => f.id === id);
    
    if (form) {
      console.log(`FormContext - getForm(${id}) found form:`, {
        title: form.title,
        showTotalScore: form.showTotalScore,
        scoreRangesCount: form.scoreRanges?.length || 0,
        collaborators: form.collaborators,
        collaboratorsCount: form.collaborators?.length || 0,
        ownerId: form.ownerId
      });
    } else {
      console.warn(`FormContext - getForm(${id}) not found. Available forms:`, 
        forms.map(f => ({ 
          id: f.id, 
          title: f.title, 
          scoreRangesCount: f.scoreRanges?.length || 0,
          collaborators: f.collaborators,
          collaboratorsCount: f.collaborators?.length || 0,
          ownerId: f.ownerId
        }))
      );
    }
    
    return form;
  }, [forms]);

  // Enhanced createForm with better collaborator handling
  const createForm = useCallback((formData: any) => {
    const userId = currentUser?.id ? String(currentUser.id) : undefined;
    const userEmail = currentUser?.email;
    console.log("FormContext - createForm called with collaborators:", formData.collaborators);
    return createFormOperation(
      forms,
      setForms,
      setAccessTokens,
      setAllowedUsers,
      userId,
      userEmail
    )(formData);
  }, [forms, currentUser]);
  
  // Enhanced updateForm with better collaborator handling and reload
  const updateForm = useCallback(async (id: string, formData: any) => {
    console.log("FormContext - updateForm called with:", {
      id,
      showTotalScore: formData.showTotalScore,
      scoreRangesCount: formData.scoreRanges?.length || 0,
      collaborators: formData.collaborators,
      collaboratorsCount: formData.collaborators?.length || 0
    });
    
    const result = await updateFormOperation(
      forms,
      setForms,
      setAllowedUsers
    )(id, formData);
    
    // Force reload from database to ensure consistency
    if (result) {
      console.log("FormContext - Reloading forms after update to ensure consistency");
      await loadFormsFromSupabase(true);
    }
    
    return result;
  }, [forms, loadFormsFromSupabase]);
  
  const deleteForm = useCallback((id: string) => {
    return deleteFormOperation(
      forms,
      setForms,
      setAllowedUsers,
      setAccessTokens,
      setResponses,
      responses
    )(id);
  }, [forms, responses]);

  // Response operations
  const submitFormResponse = async (formId: string, data: Record<string, any>, formFromLocation: any = null, scoreData: any = null): Promise<FormResponse> => {
    const operation = submitFormResponseOperation(
      getForm,
      setResponses,
      currentUser ? {
        email: currentUser.email
      } : null,
      MYSQL_API_ENDPOINT
    );
    
    return operation(formId, data, formFromLocation, scoreData);
  };

  const getFormResponses = getFormResponsesOperation(responses);

  // Access operations
  const addAllowedUser = addAllowedUserOperation(
    forms,
    allowedUsers,
    setAllowedUsers,
    updateForm
  );

  const removeAllowedUser = removeAllowedUserOperation(
    forms,
    allowedUsers,
    setAllowedUsers,
    updateForm
  );

  // Modify isUserAllowed to accept an optional email parameter
  const isUserAllowed = (formId: string, email?: string): boolean => {
    const operation = isUserAllowedOperation(
      forms,
      allowedUsers,
      email ? { email } : (currentUser ? {
        id: String(currentUser.id),
        email: currentUser.email
      } : null)
    );
    return operation(formId);
  };

  // New function to check if user can edit the form
  const canUserEditForm = (formId: string): boolean => {
    const operation = canUserEditFormOperation(
      forms,
      currentUser ? {
        id: String(currentUser.id),
        email: currentUser.email
      } : null
    );
    return operation(formId);
  };

  // Make generateAccessLink return a string directly, not a Promise
  const generateAccessLink = (formId: string): string => {
    const operation = generateAccessLinkOperation(
      forms,
      accessTokens,
      setAccessTokens
    );
    // Call the operation and return the result directly
    return operation(formId);
  };

  const validateAccessToken = validateAccessTokenOperation(accessTokens);

  const value: FormContextType = {
    forms,
    responses,
    allowedUsers,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    submitFormResponse,
    getFormResponses,
    addAllowedUser,
    removeAllowedUser,
    isUserAllowed,
    canUserEditForm,
    generateAccessLink,
    validateAccessToken,
    setForms
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

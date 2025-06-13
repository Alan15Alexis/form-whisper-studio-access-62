
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

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState(getInitialForms());
  const [responses, setResponses] = useState(getInitialResponses());
  const [accessTokens, setAccessTokens] = useState(getInitialAccessTokens());
  const [allowedUsers, setAllowedUsers] = useState(getInitialAllowedUsers());
  const [formsLoaded, setFormsLoaded] = useState(false);

  // Enhanced form loading function with better error handling and data normalization
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
          
          // Enhanced data normalization with better debugging
          const showTotalScore = Boolean(config.showTotalScore);
          console.log(`FormContext - Form "${formData.titulo}" config:`, {
            showTotalScore: config.showTotalScore,
            normalizedShowTotalScore: showTotalScore,
            configKeys: Object.keys(config)
          });
          
          // Enhanced score ranges processing with validation
          let scoreRanges = [];
          if (Array.isArray(formData.rangos_mensajes)) {
            scoreRanges = formData.rangos_mensajes.filter(range => {
              const isValid = range && 
                typeof range.min === 'number' && 
                typeof range.max === 'number' && 
                typeof range.message === 'string' &&
                range.min <= range.max;
              
              if (!isValid) {
                console.warn(`FormContext - Invalid range found in form "${formData.titulo}":`, range);
              }
              return isValid;
            });
          }
          
          console.log(`FormContext - Form "${formData.titulo}" final processing:`, {
            showTotalScore,
            scoreRangesCount: scoreRanges.length,
            hasRangesInDatabase: Array.isArray(formData.rangos_mensajes) && formData.rangos_mensajes.length > 0
          });
          
          return {
            id: formData.id.toString(),
            title: formData.titulo || 'Untitled Form',
            description: formData.descripcion || '',
            fields: formData.preguntas || [],
            isPrivate: Boolean(config.isPrivate),
            allowedUsers: formData.acceso || [],
            createdAt: formData.created_at,
            updatedAt: formData.created_at,
            accessLink: uuidv4(),
            ownerId: formData.administrador || 'unknown',
            formColor: config.formColor || '#3b82f6',
            allowViewOwnResponses: Boolean(config.allowViewOwnResponses),
            allowEditOwnResponses: Boolean(config.allowEditOwnResponses),
            httpConfig: config.httpConfig,
            showTotalScore: showTotalScore,
            scoreRanges: scoreRanges
          };
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

  // Enhanced form operations with better error handling
  const getForm = useCallback((id: string) => {
    console.log(`FormContext - getForm called with id: "${id}"`);
    
    // Try to find by exact ID match first
    let form = forms.find(f => f.id === id);
    
    // If not found by ID, try by title (for backwards compatibility)
    if (!form) {
      form = forms.find(f => f.title === id);
      if (form) {
        console.warn(`FormContext - Form found by title "${id}" instead of ID`);
      }
    }
    
    if (form) {
      console.log(`FormContext - getForm(${id}) found:`, {
        title: form.title,
        showTotalScore: form.showTotalScore,
        scoreRangesCount: form.scoreRanges?.length || 0
      });
    } else {
      console.warn(`FormContext - getForm(${id}) not found. Available forms:`, 
        forms.map(f => ({ id: f.id, title: f.title }))
      );
    }
    
    return form;
  }, [forms]);

  const createForm = useCallback((formData: any) => {
    const userId = currentUser?.id ? String(currentUser.id) : undefined;
    const userEmail = currentUser?.email;
    return createFormOperation(
      forms,
      setForms,
      setAccessTokens,
      setAllowedUsers,
      userId,
      userEmail
    )(formData);
  }, [forms, currentUser]);
  
  const updateForm = useCallback(async (id: string, formData: any) => {
    console.log("FormContext - updateForm called with:", {
      id,
      showTotalScore: formData.showTotalScore,
      scoreRangesCount: formData.scoreRanges?.length || 0
    });
    
    const result = await updateFormOperation(
      forms,
      setForms,
      setAllowedUsers
    )(id, formData);
    
    // Force reload from database to ensure consistency
    if (result) {
      console.log("FormContext - Reloading forms after update");
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

import React, { createContext, useState, useContext, useMemo } from 'react';
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

  // Load forms from Supabase - simplified score ranges handling
  React.useEffect(() => {
    const loadFormsFromSupabase = async () => {
      try {
        console.log("FormContext - Loading forms from Supabase...");
        
        const { data: formsData, error } = await supabase
          .from('formulario_construccion')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("FormContext - Error loading forms:", error);
          return;
        }
        
        if (formsData && formsData.length > 0) {
          console.log("FormContext - Loading", formsData.length, "forms from database");
          
          const loadedForms = formsData.map(formData => {
            const config = formData.configuracion || {};
            
            // Simplified: use showTotalScore from config directly
            const showTotalScore = Boolean(config.showTotalScore);
            
            // Single source of truth: use rangos_mensajes column only
            const scoreRanges = Array.isArray(formData.rangos_mensajes) ? 
              formData.rangos_mensajes.filter(range => 
                range && 
                typeof range.min === 'number' && 
                typeof range.max === 'number' && 
                typeof range.message === 'string' &&
                range.min <= range.max
              ) : [];
            
            console.log(`FormContext - Form "${formData.titulo}": showTotalScore=${showTotalScore}, scoreRanges=${scoreRanges.length}`);
            
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
        }
      } catch (error) {
        console.error("FormContext - Error loading forms:", error);
        
        // Fallback to local storage
        const localForms = getInitialForms();
        if (localForms && localForms.length > 0) {
          console.log("FormContext - Using local storage fallback");
          setForms(localForms);
        }
      }
    };
    
    loadFormsFromSupabase();
  }, []);
  
  // Persist state to localStorage whenever it changes
  useMemo(() => {
    safeLocalStorageSet('forms', forms);
  }, [forms]);

  useMemo(() => {
    safeLocalStorageSet('formResponses', responses);
  }, [responses]);

  useMemo(() => {
    safeLocalStorageSet('accessTokens', accessTokens);
  }, [accessTokens]);

  useMemo(() => {
    safeLocalStorageSet('allowedUsers', allowedUsers);
  }, [allowedUsers]);

  // Create form operations
  const getForm = getFormOperation(forms);

  const createForm = (formData: any) => {
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
  };
  
  const updateForm = (id: string, formData: any) => {
    console.log("FormContext - updateForm called with scoreRanges:", formData.scoreRanges?.length || 0);
    return updateFormOperation(
      forms,
      setForms,
      setAllowedUsers
    )(id, formData);
  };
  
  const deleteForm = (id: string) => {
    return deleteFormOperation(
      forms,
      setForms,
      setAllowedUsers,
      setAccessTokens,
      setResponses,
      responses
    )(id);
  };

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

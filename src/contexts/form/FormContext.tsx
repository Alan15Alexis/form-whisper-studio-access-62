
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

// Helper function to load score ranges for a specific form from Supabase
const loadFormScoreRanges = async (formId: string) => {
  try {
    console.log("FormContext - Loading score ranges for formId:", formId);
    
    if (!formId) {
      console.log("FormContext - No formId provided");
      return [];
    }
    
    const numericFormId = parseInt(formId);
    if (!isNaN(numericFormId)) {
      const { data: formData, error } = await supabase
        .from('formulario_construccion')
        .select('id, titulo, rangos_mensajes, configuracion')
        .eq('id', numericFormId)
        .single();
      
      if (!error && formData) {
        console.log("FormContext - Found form:", formData.titulo);
        
        // Get score ranges from rangos_mensajes column first, then fallback
        if (formData.rangos_mensajes && Array.isArray(formData.rangos_mensajes) && formData.rangos_mensajes.length > 0) {
          console.log("FormContext - Found score ranges in rangos_mensajes:", formData.rangos_mensajes);
          return formData.rangos_mensajes;
        } else if (formData.configuracion?.scoreRanges && Array.isArray(formData.configuracion.scoreRanges)) {
          console.log("FormContext - Found score ranges in configuracion:", formData.configuracion.scoreRanges);
          return formData.configuracion.scoreRanges;
        }
      }
    }
    
    console.log("FormContext - No score ranges found for form:", formId);
    return [];
  } catch (error) {
    console.error("FormContext - Error loading score ranges:", error);
    return [];
  }
};

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState(getInitialForms());
  const [responses, setResponses] = useState(getInitialResponses());
  const [accessTokens, setAccessTokens] = useState(getInitialAccessTokens());
  const [allowedUsers, setAllowedUsers] = useState(getInitialAllowedUsers());

  // Load forms from Supabase on initial render
  React.useEffect(() => {
    const loadFormsFromSupabase = async () => {
      try {
        const { data: formsData, error } = await supabase
          .from('formulario_construccion')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error loading forms from Supabase:", error);
          return;
        }
        
        if (formsData && formsData.length > 0) {
          console.log("Loading forms from Supabase:", formsData.length);
          
          const loadedForms = formsData.map(formData => {
            console.log(`Processing form "${formData.titulo}" with configuration:`, formData.configuracion);
            console.log(`Form "${formData.titulo}" rangos_mensajes:`, formData.rangos_mensajes);
            
            const config = formData.configuracion || {};
            const showTotalScore = Boolean(config.showTotalScore);
            
            // Get score ranges with proper priority
            let scoreRanges = [];
            if (formData.rangos_mensajes && Array.isArray(formData.rangos_mensajes)) {
              scoreRanges = [...formData.rangos_mensajes]; // Create a copy
              console.log(`Using score ranges from rangos_mensajes for "${formData.titulo}":`, scoreRanges);
            } else if (config.scoreRanges && Array.isArray(config.scoreRanges)) {
              scoreRanges = [...config.scoreRanges]; // Create a copy
              console.log(`Using fallback score ranges from configuracion for "${formData.titulo}":`, scoreRanges);
            }
            
            console.log(`Form "${formData.titulo}":`, {
              showTotalScore,
              scoreRanges: scoreRanges.length > 0 ? scoreRanges : 'No score ranges'
            });
            
            const processedFields = formData.preguntas?.map(field => {
              if (field.hasNumericValues && scoreRanges.length > 0 && showTotalScore) {
                console.log(`Applying score ranges to field ${field.id || field.label}`);
                return { ...field, scoreRanges: [...scoreRanges] }; // Create a copy
              }
              return field;
            }) || [];
            
            const convertedForm = {
              id: formData.id.toString(),
              title: formData.titulo || 'Untitled Form',
              description: formData.descripcion || '',
              fields: processedFields,
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
              scoreConfig: {
                enabled: showTotalScore,
                ranges: [...scoreRanges] // Create a copy
              },
              scoreRanges: [...scoreRanges] // Create a copy
            };
            
            console.log(`Final converted form "${convertedForm.title}":`, {
              id: convertedForm.id,
              showTotalScore: convertedForm.showTotalScore,
              scoreRanges: convertedForm.scoreRanges.length
            });
            
            return convertedForm;
          });
          
          console.log("Setting loaded forms:", loadedForms.length);
          setForms(loadedForms);
        }
      } catch (error) {
        console.error("Error loading forms from Supabase:", error);
      }
    };
    
    loadFormsFromSupabase();
  }, []);
  
  // Persist state to localStorage whenever it changes - with safe storage
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

  // Enhanced getForm that can reload score ranges from database
  const getFormWithFreshScoreRanges = async (formId: string) => {
    const form = getForm(formId);
    if (!form) return undefined;
    
    // Load fresh score ranges from database
    const freshScoreRanges = await loadFormScoreRanges(formId);
    
    if (freshScoreRanges.length > 0) {
      console.log("FormContext - Updating form with fresh score ranges:", freshScoreRanges);
      
      // Update the form with fresh score ranges
      const updatedForm = {
        ...form,
        scoreRanges: [...freshScoreRanges],
        scoreConfig: {
          ...form.scoreConfig,
          ranges: [...freshScoreRanges]
        }
      };
      
      // Update the forms array
      setForms(prevForms => 
        prevForms.map(f => f.id === formId ? updatedForm : f)
      );
      
      return updatedForm;
    }
    
    return form;
  };

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
    getFormWithFreshScoreRanges, // Add the new enhanced getter
    submitFormResponse,
    getFormResponses,
    addAllowedUser,
    removeAllowedUser,
    isUserAllowed,
    generateAccessLink,
    validateAccessToken,
    setForms,
    loadFormScoreRanges // Expose the helper function
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

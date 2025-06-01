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
          .select('*');
        
        if (error) {
          console.error("Error loading forms from Supabase:", error);
          return;
        }
        
        if (formsData && formsData.length > 0) {
          // Convert Supabase data format to our form format
          const loadedForms = formsData.map(formData => {
            console.log(`Processing form "${formData.titulo}" with configuration:`, formData.configuracion);
            console.log(`Form "${formData.titulo}" rangos_mensajes:`, formData.rangos_mensajes);
            
            // Extract configuration safely with proper fallbacks
            const config = formData.configuracion || {};
            const showTotalScore = Boolean(config.showTotalScore);
            
            // Get score ranges from new column first, then fallback to old location
            let scoreRanges = [];
            if (formData.rangos_mensajes && Array.isArray(formData.rangos_mensajes)) {
              scoreRanges = formData.rangos_mensajes;
              console.log(`Using score ranges from rangos_mensajes for "${formData.titulo}":`, scoreRanges);
            } else if (config.scoreRanges && Array.isArray(config.scoreRanges)) {
              scoreRanges = config.scoreRanges;
              console.log(`Using fallback score ranges from configuracion for "${formData.titulo}":`, scoreRanges);
            }
            
            console.log(`Form "${formData.titulo}":`, {
              showTotalScore,
              scoreRanges: scoreRanges.length > 0 ? scoreRanges : 'No score ranges'
            });
            
            // Process fields and apply score ranges if needed
            const processedFields = formData.preguntas?.map(field => {
              if (field.hasNumericValues && scoreRanges.length > 0 && showTotalScore) {
                console.log(`Applying score ranges to field ${field.id || field.label}`);
                return { ...field, scoreRanges: scoreRanges };
              }
              return field;
            }) || [];
            
            const convertedForm = {
              id: formData.id.toString(), // Convert bigint to string for consistency
              title: formData.titulo || 'Untitled Form',
              description: formData.descripcion || '',
              fields: processedFields,
              isPrivate: Boolean(config.isPrivate),
              allowedUsers: formData.acceso || [],
              createdAt: formData.created_at,
              updatedAt: formData.created_at,
              accessLink: uuidv4(), // Generate new access link
              ownerId: formData.administrador || 'unknown',
              formColor: config.formColor || '#3b82f6',
              allowViewOwnResponses: Boolean(config.allowViewOwnResponses),
              allowEditOwnResponses: Boolean(config.allowEditOwnResponses),
              httpConfig: config.httpConfig,
              showTotalScore: showTotalScore,
              scoreConfig: {
                enabled: showTotalScore,
                ranges: scoreRanges
              },
              scoreRanges: scoreRanges
            };
            
            console.log(`Final converted form "${convertedForm.title}":`, {
              showTotalScore: convertedForm.showTotalScore,
              scoreRanges: convertedForm.scoreRanges
            });
            
            return convertedForm;
          });
          
          // Merge with existing forms from localStorage
          setForms(prevForms => {
            // Filter out forms that are already in Supabase to avoid duplicates
            const localOnlyForms = prevForms.filter(localForm => 
              !loadedForms.some(supabaseForm => supabaseForm.title === localForm.title)
            );
            return [...localOnlyForms, ...loadedForms];
          });
        }
      } catch (error) {
        console.error("Error loading forms from Supabase:", error);
      }
    };
    
    loadFormsFromSupabase();
  }, []);
  
  // Persist state to localStorage whenever it changes
  useMemo(() => {
    localStorage.setItem('forms', JSON.stringify(forms));
  }, [forms]);

  useMemo(() => {
    localStorage.setItem('formResponses', JSON.stringify(responses));
  }, [responses]);

  useMemo(() => {
    localStorage.setItem('accessTokens', JSON.stringify(accessTokens));
  }, [accessTokens]);

  useMemo(() => {
    localStorage.setItem('allowedUsers', JSON.stringify(allowedUsers));
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
  const submitFormResponse = async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    const operation = submitFormResponseOperation(
      getForm,
      setResponses,
      currentUser ? {
        email: currentUser.email
      } : null,
      MYSQL_API_ENDPOINT
    );
    
    return operation(formId, data, formFromLocation);
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

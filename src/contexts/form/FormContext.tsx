
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
            // Extract score ranges and settings from configuration if they exist
            const scoreRanges = formData.configuracion?.scoreRanges || [];
            const hasNumericValues = formData.configuracion?.hasFieldsWithNumericValues || false;
            const showTotalScore = formData.configuracion?.showTotalScore || false;
            
            console.log(`Loaded form "${formData.titulo}" with score ranges:`, scoreRanges);
            console.log(`Form "${formData.titulo}" showTotalScore setting:`, showTotalScore);
            
            // Apply score ranges to all fields with numeric values
            const processedFields = formData.preguntas?.map(field => {
              if (field.hasNumericValues && scoreRanges.length > 0 && showTotalScore) {
                return { ...field, scoreRanges: scoreRanges };
              }
              return field;
            }) || [];
            
            return {
              id: formData.id.toString(),
              title: formData.titulo || 'Untitled Form',
              description: formData.descripcion || '',
              fields: processedFields,
              isPrivate: formData.configuracion?.isPrivate || false,
              allowedUsers: formData.acceso || [],
              createdAt: formData.created_at,
              updatedAt: formData.created_at,
              accessLink: uuidv4(), // Generate new access link
              ownerId: formData.administrador || 'unknown',
              formColor: formData.configuracion?.formColor || '#3b82f6',
              allowViewOwnResponses: formData.configuracion?.allowViewOwnResponses || false,
              allowEditOwnResponses: formData.configuracion?.allowEditOwnResponses || false,
              httpConfig: formData.configuracion?.httpConfig,
              showTotalScore: showTotalScore
            };
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
  const submitFormResponse = async (formId: string, data: Record<string, any>, formFromLocation: any = null) => {
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

  const isUserAllowed = isUserAllowedOperation(
    forms,
    allowedUsers,
    currentUser ? {
      id: String(currentUser.id),
      email: currentUser.email
    } : null
  );

  const generateAccessLink = generateAccessLinkOperation(
    forms,
    accessTokens,
    setAccessTokens
  );

  const validateAccessToken = validateAccessTokenOperation(accessTokens);

  const value = {
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

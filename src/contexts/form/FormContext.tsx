
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
  deleteFormOperation
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
import { processCollaborators } from './collaboratorOperations';
import { cleanScoreRanges } from './scoreOperations';
import { safeLocalStorageSet } from './storageOperations';
import { useFormLoader } from './useFormLoader';
import { FormResponse } from '@/types/form';

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState(getInitialForms());
  const [responses, setResponses] = useState(getInitialResponses());
  const [accessTokens, setAccessTokens] = useState(getInitialAccessTokens());
  const [allowedUsers, setAllowedUsers] = useState(getInitialAllowedUsers());

  // Use the custom hook for form loading
  const { formsLoaded, loadFormsFromSupabase } = useFormLoader(setForms, safeLocalStorageSet);

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

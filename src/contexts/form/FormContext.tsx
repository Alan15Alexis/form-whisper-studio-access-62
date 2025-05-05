
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

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState(getInitialForms());
  const [responses, setResponses] = useState(getInitialResponses());
  const [accessTokens, setAccessTokens] = useState(getInitialAccessTokens());
  const [allowedUsers, setAllowedUsers] = useState(getInitialAllowedUsers());

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

  const createForm = createFormOperation(
    forms,
    setForms,
    setAccessTokens,
    setAllowedUsers,
    currentUser?.id ? String(currentUser.id) : undefined
  );

  const updateForm = updateFormOperation(
    forms,
    setForms,
    setAllowedUsers,
  );

  const deleteForm = deleteFormOperation(
    forms,
    setForms,
    setAllowedUsers,
    setAccessTokens,
    setResponses,
    responses
  );

  // Response operations
  const submitFormResponse = submitFormResponseOperation(
    getForm,
    setResponses,
    currentUser ? {
      id: String(currentUser.id),
      email: currentUser.email
    } : null,
    MYSQL_API_ENDPOINT
  );

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
    validateAccessToken
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

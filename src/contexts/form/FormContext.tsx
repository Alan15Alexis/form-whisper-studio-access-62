
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

  const createForm = async (formData: any) => {
    const userId = currentUser?.id ? String(currentUser.id) : undefined;
    
    // Crear el formulario usando la operación original
    const newForm = await createFormOperation(
      forms,
      setForms,
      setAccessTokens,
      setAllowedUsers,
      userId
    )(formData);
    
    // Guardar en Supabase
    try {
      await supabase.from('formulario_construccion').insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: newForm.fields,
        configuracion: {
          isPrivate: newForm.isPrivate,
          enableScoring: newForm.enableScoring,
          formColor: newForm.formColor,
          allowViewOwnResponses: newForm.allowViewOwnResponses,
          allowEditOwnResponses: newForm.allowEditOwnResponses,
          httpConfig: newForm.httpConfig
        },
        administrador: currentUser?.email, // Añadimos el correo del administrador aquí
        acceso: newForm.allowedUsers
      });
      console.log("Formulario guardado en Supabase correctamente");
    } catch (error) {
      console.error("Error al guardar el formulario en Supabase:", error);
    }
    
    return newForm;
  };

  const updateForm = async (id: string, formData: any) => {
    // Actualizar el formulario usando la operación original
    const updatedForm = await updateFormOperation(
      forms,
      setForms,
      setAllowedUsers
    )(id, formData);
    
    if (updatedForm) {
      // Actualizar en Supabase
      try {
        const existingForm = await supabase
          .from('formulario_construccion')
          .select('*')
          .eq('titulo', updatedForm.title)
          .maybeSingle();
        
        if (existingForm.data) {
          await supabase
            .from('formulario_construccion')
            .update({
              titulo: updatedForm.title,
              descripcion: updatedForm.description,
              preguntas: updatedForm.fields,
              configuracion: {
                isPrivate: updatedForm.isPrivate,
                enableScoring: updatedForm.enableScoring,
                formColor: updatedForm.formColor,
                allowViewOwnResponses: updatedForm.allowViewOwnResponses,
                allowEditOwnResponses: updatedForm.allowEditOwnResponses,
                httpConfig: updatedForm.httpConfig
              },
              administrador: currentUser?.email, // Actualizamos el correo del administrador aquí
              acceso: updatedForm.allowedUsers
            })
            .eq('id', existingForm.data.id);
          
          console.log("Formulario actualizado en Supabase correctamente");
        } else {
          // Si no existe, insertarlo
          await supabase.from('formulario_construccion').insert({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: updatedForm.fields,
            configuracion: {
              isPrivate: updatedForm.isPrivate,
              enableScoring: updatedForm.enableScoring,
              formColor: updatedForm.formColor,
              allowViewOwnResponses: updatedForm.allowViewOwnResponses,
              allowEditOwnResponses: updatedForm.allowEditOwnResponses,
              httpConfig: updatedForm.httpConfig
            },
            administrador: currentUser?.email, // Añadimos el correo del administrador aquí
            acceso: updatedForm.allowedUsers
          });
          console.log("Formulario creado en Supabase (no existía previamente)");
        }
      } catch (error) {
        console.error("Error al actualizar el formulario en Supabase:", error);
      }
    }
    
    return updatedForm;
  };

  const deleteForm = async (id: string) => {
    const formToDelete = getForm(id);
    
    // Eliminar el formulario usando la operación original
    const success = await deleteFormOperation(
      forms,
      setForms,
      setAllowedUsers,
      setAccessTokens,
      setResponses,
      responses
    )(id);
    
    if (success && formToDelete) {
      // Eliminar de Supabase
      try {
        const existingForm = await supabase
          .from('formulario_construccion')
          .select('*')
          .eq('titulo', formToDelete.title)
          .maybeSingle();
        
        if (existingForm.data) {
          await supabase
            .from('formulario_construccion')
            .delete()
            .eq('id', existingForm.data.id);
          
          console.log("Formulario eliminado de Supabase correctamente");
        }
      } catch (error) {
        console.error("Error al eliminar el formulario de Supabase:", error);
      }
    }
    
    return success;
  };

  // Response operations
  const submitFormResponse = submitFormResponseOperation(
    getForm,
    setResponses,
    currentUser ? {
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

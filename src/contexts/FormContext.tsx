
import React, { createContext, useState, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Form, FormField, FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from './AuthContext';
import { sendHttpRequest } from '@/utils/http-utils';

interface FormContextType {
  forms: Form[];
  responses: FormResponse[];
  allowedUsers: Record<string, string[]>;
  createForm: (form: Partial<Form>) => Promise<Form>;
  updateForm: (id: string, formData: Partial<Form>) => Promise<Form | null>;
  deleteForm: (id: string) => Promise<boolean>;
  getForm: (id: string) => Form | undefined;
  submitFormResponse: (formId: string, data: Record<string, any>) => Promise<FormResponse>;
  getFormResponses: (formId: string) => FormResponse[];
  addAllowedUser: (formId: string, email: string) => Promise<boolean>;
  removeAllowedUser: (formId: string, email: string) => Promise<boolean>;
  isUserAllowed: (formId: string, email: string) => boolean;
  generateAccessLink: (formId: string) => string;
  validateAccessToken: (formId: string, token: string) => boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// MySQL API configuration 
const MYSQL_API_ENDPOINT = 'http://localhost:3000/api/submit-form'; // Reemplaza con tu URL real

// For demo purposes - would be replaced with real API calls
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState<Form[]>(() => {
    const storedForms = localStorage.getItem('forms');
    return storedForms ? JSON.parse(storedForms) : [
      // Demo form
      {
        id: '1',
        title: 'Customer Feedback Form',
        description: 'Help us improve our services by providing your feedback',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Your Name',
            placeholder: 'John Doe',
            required: true,
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            placeholder: 'john@example.com',
            required: true,
          },
          {
            id: 'rating',
            type: 'select',
            label: 'How would you rate our service?',
            required: true,
            options: [
              { id: '5', label: 'Excellent', value: '5' },
              { id: '4', label: 'Good', value: '4' },
              { id: '3', label: 'Average', value: '3' },
              { id: '2', label: 'Below Average', value: '2' },
              { id: '1', label: 'Poor', value: '1' },
            ],
          },
          {
            id: 'comments',
            type: 'textarea',
            label: 'Additional Comments',
            placeholder: 'Please share your thoughts here...',
            required: false,
          },
        ],
        isPrivate: true,
        allowedUsers: ['user@example.com'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessLink: 'access-token-123',
        ownerId: '1',
      }
    ];
  });

  const [responses, setResponses] = useState<FormResponse[]>(() => {
    const storedResponses = localStorage.getItem('formResponses');
    return storedResponses ? JSON.parse(storedResponses) : [];
  });

  const [accessTokens, setAccessTokens] = useState<Record<string, string>>(() => {
    const storedTokens = localStorage.getItem('accessTokens');
    return storedTokens ? JSON.parse(storedTokens) : {
      '1': 'access-token-123', // Token for our demo form
    };
  });

  // Store allowed users by form ID for private forms
  const [allowedUsers, setAllowedUsers] = useState<Record<string, string[]>>(() => {
    const storedAllowedUsers = localStorage.getItem('allowedUsers');
    return storedAllowedUsers ? JSON.parse(storedAllowedUsers) : {
      '1': ['user@example.com'], // For our demo form
    };
  });

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

  const createForm = async (formData: Partial<Form>): Promise<Form> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = uuidv4();
    const accessToken = uuidv4();
    
    const newForm: Form = {
      id,
      title: formData.title || 'Untitled Form',
      description: formData.description || '',
      fields: formData.fields || [],
      isPrivate: formData.isPrivate || false,
      allowedUsers: formData.allowedUsers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessLink: accessToken,
      ownerId: currentUser?.id || 'unknown',
    };

    setForms(prevForms => [...prevForms, newForm]);
    setAccessTokens(prev => ({...prev, [id]: accessToken}));
    
    if (newForm.isPrivate && newForm.allowedUsers.length > 0) {
      setAllowedUsers(prev => ({...prev, [id]: newForm.allowedUsers}));
    }

    toast({
      title: 'Form created',
      description: `"${newForm.title}" has been created successfully`,
      variant: 'default',
    });
    
    return newForm;
  };

  const updateForm = async (id: string, formData: Partial<Form>): Promise<Form | null> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the form to update
    const formIndex = forms.findIndex(form => form.id === id);
    if (formIndex === -1) {
      toast({
        title: 'Update failed',
        description: 'Form not found',
        variant: 'destructive',
      });
      return null;
    }

    // Create the updated form
    const updatedForm = {
      ...forms[formIndex],
      ...formData,
      updatedAt: new Date().toISOString()
    };

    // Update forms array
    const updatedForms = [...forms];
    updatedForms[formIndex] = updatedForm;
    setForms(updatedForms);
    
    // Update allowed users if the form is private
    if (updatedForm.isPrivate && updatedForm.allowedUsers) {
      setAllowedUsers(prev => ({...prev, [id]: updatedForm.allowedUsers}));
    }

    toast({
      title: 'Form updated',
      description: `"${updatedForm.title}" has been updated successfully`,
      variant: 'default',
    });
    
    return updatedForm;
  };

  const deleteForm = async (id: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const formToDelete = forms.find(form => form.id === id);
    if (!formToDelete) {
      toast({
        title: 'Deletion failed',
        description: 'Form not found',
        variant: 'destructive',
      });
      return false;
    }

    // Filter out the form to delete
    setForms(forms.filter(form => form.id !== id));
    
    // Also remove from allowed users
    const newAllowedUsers = {...allowedUsers};
    delete newAllowedUsers[id];
    setAllowedUsers(newAllowedUsers);
    
    // Remove access token
    const newAccessTokens = {...accessTokens};
    delete newAccessTokens[id];
    setAccessTokens(newAccessTokens);
    
    // Remove associated responses
    setResponses(responses.filter(response => response.formId !== id));

    toast({
      title: 'Form deleted',
      description: `"${formToDelete.title}" has been deleted`,
      variant: 'default',
    });
    
    return true;
  };

  const getForm = (id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  };

  const submitFormResponse = async (formId: string, data: Record<string, any>): Promise<FormResponse> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const form = getForm(formId);
    
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: data,
      submittedBy: currentUser?.email,
      submittedAt: new Date().toISOString(),
    };
    
    // Save response locally
    setResponses(prev => [...prev, response]);
    
    // Send to MySQL database through API
    try {
      // Prepare data for MySQL submission
      const mysqlData = {
        form_id: formId,
        responses: JSON.stringify(data),
        submitted_by: currentUser?.email || 'anonymous',
        form_title: form?.title || 'Untitled Form'
      };
      
      // Send to MySQL API endpoint
      await sendHttpRequest({
        url: MYSQL_API_ENDPOINT,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: mysqlData,
        timeout: 15000
      });
      
      toast({
        title: "Respuesta guardada",
        description: "La respuesta fue guardada localmente y en la base de datos MySQL",
      });
    } catch (error) {
      console.error('Error saving to MySQL:', error);
      toast({
        title: "Error al guardar en MySQL",
        description: "La respuesta fue guardada localmente, pero hubo un problema al guardarla en la base de datos MySQL",
        variant: "destructive"
      });
    }
    
    return response;
  };

  const getFormResponses = (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };

  const addAllowedUser = async (formId: string, email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if form exists and is private
    const form = forms.find(form => form.id === formId);
    if (!form) {
      toast({
        title: 'Action failed',
        description: 'Form not found',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!form.isPrivate) {
      toast({
        title: 'Action failed',
        description: 'Form is not private',
        variant: 'destructive',
      });
      return false;
    }
    
    // Check if user is already allowed
    const formAllowedUsers = allowedUsers[formId] || [];
    if (formAllowedUsers.includes(email)) {
      toast({
        title: 'Action failed',
        description: `${email} already has access to this form`,
        variant: 'destructive',
      });
      return false;
    }
    
    // Add user to allowed users
    const updatedAllowedUsers = [...formAllowedUsers, email];
    setAllowedUsers(prev => ({...prev, [formId]: updatedAllowedUsers}));
    
    // Also update the form
    updateForm(formId, {
      allowedUsers: updatedAllowedUsers
    });
    
    toast({
      title: 'Access granted',
      description: `${email} can now access this form`,
      variant: 'default',
    });
    
    return true;
  };

  const removeAllowedUser = async (formId: string, email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if form exists and is private
    const form = forms.find(form => form.id === formId);
    if (!form || !form.isPrivate) {
      return false;
    }
    
    // Check if user is allowed
    const formAllowedUsers = allowedUsers[formId] || [];
    if (!formAllowedUsers.includes(email)) {
      return false;
    }
    
    // Remove user from allowed users
    const updatedAllowedUsers = formAllowedUsers.filter(user => user !== email);
    setAllowedUsers(prev => ({...prev, [formId]: updatedAllowedUsers}));
    
    // Also update the form
    updateForm(formId, {
      allowedUsers: updatedAllowedUsers
    });
    
    toast({
      title: 'Access revoked',
      description: `${email} can no longer access this form`,
      variant: 'default',
    });
    
    return true;
  };

  const isUserAllowed = (formId: string, email: string): boolean => {
    const form = forms.find(form => form.id === formId);
    
    // If form doesn't exist or is not private, user is not allowed
    if (!form) return false;
    
    // If form is public, user is allowed
    if (!form.isPrivate) return true;
    
    // If user is the owner, they are allowed
    if (currentUser?.id === form.ownerId) return true;
    
    // Otherwise, check if they're in the allowed users list
    return (allowedUsers[formId] || []).includes(email);
  };

  const generateAccessLink = (formId: string): string => {
    const form = forms.find(form => form.id === formId);
    if (!form) return '';
    
    const token = accessTokens[formId] || uuidv4();
    
    // If token doesn't exist, create one
    if (!accessTokens[formId]) {
      setAccessTokens(prev => ({...prev, [formId]: token}));
    }
    
    // Return the access link
    return `${window.location.origin}/forms/${formId}/access/${token}`;
  };

  const validateAccessToken = (formId: string, token: string): boolean => {
    const validToken = accessTokens[formId];
    return validToken === token;
  };

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

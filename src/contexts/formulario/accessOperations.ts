
import { toast } from "@/hooks/use-toast";
import { Form } from '@/types/form';
import { v4 as uuidv4 } from 'uuid';

export const addAllowedUserOperation = (
  forms: Form[],
  allowedUsers: Record<string, string[]>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  updateForm: (id: string, formData: Partial<Form>) => Promise<Form | null>
) => {
  return async (formId: string, email: string): Promise<boolean> => {
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
};

export const removeAllowedUserOperation = (
  forms: Form[],
  allowedUsers: Record<string, string[]>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  updateForm: (id: string, formData: Partial<Form>) => Promise<Form | null>
) => {
  return async (formId: string, email: string): Promise<boolean> => {
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
};

// Fix: Updated to accept either a user with email only or a user with both id and email
export const isUserAllowedOperation = (
  forms: Form[],
  allowedUsers: Record<string, string[]>,
  currentUser: { id?: string, email: string } | null | undefined
) => {
  return (formId: string): boolean => {
    const form = forms.find(form => form.id === formId);
    
    // If form doesn't exist or is not private, user is not allowed
    if (!form) return false;
    
    // If form is public, user is allowed
    if (!form.isPrivate) return true;
    
    // If user is the owner, they are allowed
    if (currentUser?.id && currentUser.id === form.ownerId) return true;
    
    // Otherwise, check if they're in the allowed users list
    return currentUser?.email ? (allowedUsers[formId] || []).includes(currentUser.email) : false;
  };
};

export const generateAccessLinkOperation = (
  forms: Form[],
  accessTokens: Record<string, string>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  return (formId: string): string => {
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
};

export const validateAccessTokenOperation = (
  accessTokens: Record<string, string>
) => {
  return (formId: string, token: string): boolean => {
    const validToken = accessTokens[formId];
    return validToken === token;
  };
};

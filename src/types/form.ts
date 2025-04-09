
export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'number' | 'date';

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  description?: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  isPrivate: boolean;
  allowedUsers: string[];
  createdAt: string;
  updatedAt: string;
  accessLink: string;
  ownerId: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  responses: Record<string, any>;
  submittedBy?: string;
  submittedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

export interface AuthCredentials {
  email: string;
  password: string;
}

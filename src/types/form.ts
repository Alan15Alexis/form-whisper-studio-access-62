
export type FormFieldType = 
  // Essential fields
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'email' 
  | 'number' 
  | 'date'
  | 'yesno'
  | 'image-select'
  
  // Contact details
  | 'fullname'
  | 'address'
  | 'phone'
  
  // Upload fields
  | 'image-upload'
  | 'file-upload'
  | 'drawing'
  
  // Rating scales
  | 'matrix'
  | 'opinion-scale'
  | 'star-rating'
  | 'ranking'
  
  // Date and time
  | 'timer'
  | 'time'
  
  // Legal
  | 'terms'
  | 'signature';

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
  numericValue?: number;
}

export interface ScoreRange {
  min: number;
  max: number;
  message: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  description?: string;
  hasNumericValues?: boolean;
  scoreRanges?: ScoreRange[];
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
  showTotalScore?: boolean;
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

export interface FieldCategory {
  id: string;
  title: string;
  fields: {
    type: FormFieldType;
    icon: string;
    label: string;
  }[];
}

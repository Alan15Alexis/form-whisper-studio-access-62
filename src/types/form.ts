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
  | 'welcome'
  
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
  columns?: string[]; // Added the columns property for matrix options
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
  welcomeMessage?: {
    text: string;
    imageUrl?: string;
  };
  customId?: string;
}

export interface HttpHeader {
  id: number;      // Nuevo campo incremental
  key: string;
  value: string;
}

export interface HttpConfig {
  enabled: boolean;
  url: string;
  method: 'GET' | 'POST'; // Updated to allow 'GET' as well
  headers: HttpHeader[];
  body: string;
  lastResponse?: {
    status: number;
    data: string;
    timestamp: string;
  };
}

export interface ScoreConfig {
  enabled: boolean;
  ranges: ScoreRange[];
}

export interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isPrivate?: boolean;
  allowedUsers?: string[];
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
  accessLink: string;
  ownerId: string;
  enableScoring?: boolean;
  showTotalScore?: boolean;
  formColor?: string;
  allowViewOwnResponses?: boolean;
  allowEditOwnResponses?: boolean;
  httpConfig?: HttpConfig;
  scoreRanges?: Array<{
    min: number;
    max: number;
    message: string;
  }>;
  scoreConfig?: {
    enabled: boolean;
    ranges: Array<{
      min: number;
      max: number;
      message: string;
    }>;
  };
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedBy?: string;
  submittedAt: string;
  data: Record<string, any>;
  formattedData?: Record<string, any>;
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

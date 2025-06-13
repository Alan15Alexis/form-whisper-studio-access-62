
import { Form, FormResponse, HttpConfig } from '@/types/form';

export interface FormContextType {
  forms: Form[];
  responses: FormResponse[];
  allowedUsers: Record<string, string[]>;
  createForm: (formData: Partial<Form>) => Promise<Form>;
  updateForm: (id: string, formData: Partial<Form>) => Promise<Form | null>;
  deleteForm: (id: string) => Promise<boolean>;
  getForm: (id: string) => Form | undefined;
  getFormWithFreshScoreRanges?: (id: string) => Promise<Form | undefined>;
  submitFormResponse: (formId: string, data: Record<string, any>, formFromLocation?: any, scoreData?: any) => Promise<FormResponse>;
  getFormResponses: (formId: string) => FormResponse[];
  addAllowedUser: (formId: string, email: string) => void;
  removeAllowedUser: (formId: string, email: string) => void;
  isUserAllowed: (formId: string, email?: string) => boolean;
  generateAccessLink: (formId: string) => string;
  validateAccessToken: (formId: string, token: string) => boolean;
  setForms: React.Dispatch<React.SetStateAction<Form[]>>;
  loadFormScoreRanges?: (formId: string) => Promise<any[]>;
}

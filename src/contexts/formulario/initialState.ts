import { Form, FormResponse } from '@/types/form';

// Initial state for forms
export const getInitialForms = (): Form[] => {
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
};

// Initial state for responses
export const getInitialResponses = (): any[] => {
  try {
    const storedResponses = localStorage.getItem('formResponses');
    if (storedResponses) {
      console.log('Loading responses from localStorage:', JSON.parse(storedResponses));
      return JSON.parse(storedResponses);
    }
  } catch (error) {
    console.error("Error loading form responses:", error);
  }
  return [];
};

// Initial state for access tokens
export const getInitialAccessTokens = (): Record<string, string> => {
  const storedTokens = localStorage.getItem('accessTokens');
  return storedTokens ? JSON.parse(storedTokens) : {
    '1': 'access-token-123', // Token for our demo form
  };
};

// Initial state for allowed users
export const getInitialAllowedUsers = (): Record<string, string[]> => {
  const storedAllowedUsers = localStorage.getItem('allowedUsers');
  return storedAllowedUsers ? JSON.parse(storedAllowedUsers) : {
    '1': ['user@example.com'], // For our demo form
  };
};

// MySQL API configuration 
export const MYSQL_API_ENDPOINT = 'http://localhost:3000/api/submit-form';

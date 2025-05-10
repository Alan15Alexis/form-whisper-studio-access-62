import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { Form as FormType } from "@/types/form";

/**
 * Custom hook to handle form validation, access control, and initial loading
 */
export function useFormValidation() {
  const { id, token } = useParams();
  const { forms, validateAccessToken, isUserAllowed, getForm } = useForm();
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  const formFromLocation = location.state?.formData;
  
  const [form, setForm] = useState<FormType | null>(null);
  const [accessValidated, setAccessValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);

  // Validate access token if provided
  useEffect(() => {
    const validateAccess = async () => {
      if (id) {
        // First check if we have the form from the location state
        if (formFromLocation) {
          console.log("Using form data from location state:", formFromLocation);
          setForm(formFromLocation);
          setAccessValidated(true);
          setValidationLoading(false);
          return;
        }
        
        // Otherwise, try to get the form from the context
        const foundForm = forms.find(form => form.id === id);
        
        // If form doesn't exist, end validation
        if (!foundForm) {
          console.log("Form not found with ID:", id);
          setValidationLoading(false);
          return;
        }
        
        // If form is not private, allow access
        if (!foundForm.isPrivate) {
          setForm(foundForm);
          setAccessValidated(true);
          setValidationLoading(false);
          return;
        }
        
        // If form is private, check authentication or token
        if (foundForm.isPrivate) {
          // If user is authenticated and has access to the form
          if (isAuthenticated && currentUser) {
            // Admin has access to all forms
            if (currentUser.role === "admin") {
              setForm(foundForm);
              setAccessValidated(true);
              setValidationLoading(false);
              return;
            }
            
            // Check if user is in allowed users
            if (isUserAllowed(foundForm.id, currentUser.email)) {
              setForm(foundForm);
              setAccessValidated(true);
              setValidationLoading(false);
              return;
            }
          }
          
          // If token is provided, validate it
          if (token) {
            try {
              const valid = await validateAccessToken(foundForm.id, token);
              if (valid) {
                setForm(foundForm);
                setAccessValidated(true);
                setValidationLoading(false);
                return;
              }
            } catch (error) {
              console.error("Error validating token:", error);
            }
          }
          
          // If we get here, set the form but don't validate access yet
          // This will show the FormAccess component to validate email
          setForm(foundForm);
        }
        
        setValidationLoading(false);
      }
    };
    
    validateAccess();
  }, [id, token, isAuthenticated, currentUser, forms, validateAccessToken, isUserAllowed, formFromLocation]);

  return {
    form,
    accessValidated,
    validationLoading,
    setAccessValidated
  };
}

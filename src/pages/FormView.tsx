
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import { FormField as FormFieldType, Form as FormType } from "@/types/form";
import FormField from "@/components/form-view/FormField";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const FormView = () => {
  const { id, token } = useParams();
  const { getFormById, submitResponse, validateAccessToken } = useForm();
  const { isAuthenticated, currentUser } = useAuth();
  const [form, setForm] = useState<FormType | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessValidated, setAccessValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);
  const navigate = useNavigate();

  // Validate access token if provided
  useEffect(() => {
    const validateAccess = async () => {
      if (id) {
        const foundForm = getFormById(id);
        
        // If form is not private, allow access
        if (foundForm && !foundForm.isPrivate) {
          setForm(foundForm);
          setAccessValidated(true);
          setValidationLoading(false);
          return;
        }
        
        // If form is private, check authentication or token
        if (foundForm && foundForm.isPrivate) {
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
            if (foundForm.allowedUsers.includes(currentUser.email)) {
              setForm(foundForm);
              setAccessValidated(true);
              setValidationLoading(false);
              return;
            }
          }
          
          // If token is provided, validate it
          if (token) {
            try {
              const valid = await validateAccessToken(id, token);
              if (valid) {
                setForm(foundForm);
                setAccessValidated(true);
              }
            } catch (error) {
              console.error("Error validating token:", error);
            }
          }
        }
        
        setValidationLoading(false);
      }
    };
    
    validateAccess();
  }, [id, token, isAuthenticated, currentUser, getFormById, validateAccessToken]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !id) return;
    
    // Check if all required fields are filled
    const missingFields = form.fields
      .filter(field => field.required && !formResponses[field.id])
      .map(field => field.label || `Campo #${field.id}`);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos faltantes",
        description: `Por favor completa los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitResponse(id, formResponses);
      toast({
        title: "Respuesta enviada correctamente",
        description: "Gracias por completar este formulario",
      });
      
      // Si el usuario está autenticado y es un usuario normal, redirige al dashboard
      if (isAuthenticated && currentUser && currentUser.role !== "admin") {
        navigate("/dashboard-user");
      } else {
        // Limpiar formulario
        setFormResponses({});
      }
    } catch (error) {
      toast({
        title: "Error al enviar respuesta",
        description: "Por favor intenta nuevamente más tarde",
        variant: "destructive",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validationLoading) {
    return (
      <Layout hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!accessValidated || !form) {
    return (
      <Layout hideNav>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes permiso para acceder a este formulario o el formulario no existe.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-8" 
             style={form.formColor ? { borderTop: `4px solid ${form.formColor}` } : {}}>
          <h1 className="text-3xl font-bold mb-2" style={form.formColor ? { color: form.formColor } : {}}>
            {form.title}
          </h1>
          
          {form.description && (
            <p className="text-gray-600 mb-8">{form.description}</p>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {form.fields.map((field: FormFieldType) => (
              <div key={field.id} className="form-field">
                <FormField
                  field={field}
                  value={formResponses[field.id] || ""}
                  onChange={(value) => handleFieldChange(field.id, value)}
                />
              </div>
            ))}
            
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto"
                style={form.formColor ? { 
                  backgroundColor: form.formColor,
                  borderColor: form.formColor 
                } : {}}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Enviando respuesta..." : "Enviar respuesta"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default FormView;

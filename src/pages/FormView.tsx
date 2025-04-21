import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ShareFormDialog from "@/components/ShareFormDialog";
import FormField from "@/components/form-view/FormField";
import FormSuccess from "@/components/form-view/FormSuccess";
import FormAccess from "@/components/form-view/FormAccess";

const FormView = () => {
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const { getForm, submitFormResponse, isUserAllowed, validateAccessToken, generateAccessLink } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [form, setForm] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const totalFields = form?.fields?.length || 0;
  const progress = ((currentFieldIndex + 1) / totalFields) * 100;
  
  useEffect(() => {
    if (!id) {
      setError("Form not found");
      setLoading(false);
      return;
    }
    
    const formData = getForm(id);
    if (!formData) {
      setError("Form not found");
      setLoading(false);
      return;
    }

    setForm(formData);
    
    const formShareUrl = generateAccessLink(id);
    setShareUrl(formShareUrl);
    
    let hasAccess = false;
    
    if (!formData.isPrivate) {
      hasAccess = true;
    } else {
      if (isAuthenticated && currentUser?.email) {
        hasAccess = isUserAllowed(id, currentUser.email);
      }
      
      if (token && validateAccessToken(id, token)) {
        hasAccess = true;
      }
    }
    
    setAccessGranted(hasAccess);
    setLoading(false);
  }, [id, token, getForm, isAuthenticated, currentUser, isUserAllowed, validateAccessToken, generateAccessLink]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value,
    });
  };

  const checkRequiredFields = (fields: any[]) => {
    const missingFields = fields.filter((field) => {
      if (!field.required) return false;
      
      const value = formValues[field.id];
      
      if (field.type === 'checkbox' && Array.isArray(value)) {
        return value.length === 0;
      }
      
      if (field.type === 'matrix' && Array.isArray(value)) {
        return value.some(v => v === null || v === undefined);
      }
      
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value);
      }
      
      if (field.type === 'phone' && value) {
        const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
        return !phoneRegex.test(value);
      }
      
      if (field.type === 'terms') {
        return value !== true;
      }
      
      return value === undefined || value === "" || value === null;
    });
    
    return missingFields;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = checkRequiredFields(form.fields);
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Por favor, complete todos los campos obligatorios: ${missingFields.map((f: any) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    const submittedBy = currentUser?.email || "";
    
    try {
      await submitFormResponse(id!, formValues, submittedBy);
      setFormSubmitted(true);
      
      toast({
        title: "Éxito",
        description: "Tu respuesta ha sido enviada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al enviar la respuesta del formulario",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse space-y-8 w-full max-w-2xl">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout hideNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Form Not Found</h2>
          <p className="text-gray-600 mb-8">The form you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!accessGranted && form?.isPrivate) {
    return (
      <Layout hideNav>
        <FormAccess
          onAccessGranted={() => setAccessGranted(true)}
          isUserAllowed={(email) => isUserAllowed(id!, email)}
        />
      </Layout>
    );
  }

  if (formSubmitted) {
    return (
      <Layout hideNav>
        <FormSuccess
          formValues={formValues}
          fields={form.fields}
          showTotalScore={form.showTotalScore}
        />
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="container max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="shadow-md">
          {form?.welcomeMessage && (
            <CardHeader className="text-center">
              {form.welcomeMessage.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={form.welcomeMessage.imageUrl} 
                    alt="Welcome" 
                    className="mx-auto max-h-48 rounded-lg"
                  />
                </div>
              )}
              <CardTitle className="text-2xl">{form?.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {form.welcomeMessage.text}
              </CardDescription>
            </CardHeader>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="w-full">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Pregunta {currentFieldIndex + 1} de {totalFields}
                </p>
              </div>

              {form?.fields && form.fields[currentFieldIndex] && (
                <FormField
                  field={form.fields[currentFieldIndex]}
                  value={formValues[form.fields[currentFieldIndex].id]}
                  onChange={(value) => handleInputChange(form.fields[currentFieldIndex].id, value)}
                />
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between p-6">
              <Button 
                type="button"
                onClick={() => setCurrentFieldIndex(prev => Math.max(0, prev - 1))}
                disabled={currentFieldIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              
              {currentFieldIndex === totalFields - 1 ? (
                <Button type="submit" disabled={submitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Enviando..." : "Enviar"}
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={() => setCurrentFieldIndex(prev => Math.min(totalFields - 1, prev + 1))}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
      
      {form && shareDialogOpen && (
        <ShareFormDialog 
          open={shareDialogOpen} 
          onOpenChange={setShareDialogOpen} 
          shareUrl={shareUrl}
          formTitle={form.title} 
        />
      )}
    </Layout>
  );
};

export default FormView;

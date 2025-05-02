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
import { cn } from "@/lib/utils";
import { sendHttpRequest } from "@/utils/http-utils";
import { BodyField } from "@/hooks/useHttpConfig";

// API endpoint for MySQL database
const MYSQL_API_ENDPOINT = 'http://localhost:3000/api/submit-form'; // Reemplaza con tu URL real

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

  const [bodyFields, setBodyFields] = useState<BodyField[]>([]);
  
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

    if (formData.httpConfig?.enabled && formData.httpConfig.body) {
      try {
        const parsedBody = JSON.parse(formData.httpConfig.body);
        setBodyFields(parsedBody);
      } catch (e) {
        console.error('Error parsing HTTP body configuration:', e);
        setBodyFields([]);
      }
    } else {
      setBodyFields([]);
    }
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
      // Envía los datos a través del FormContext (que ahora también los envía a MySQL)
      await submitFormResponse(id!, formValues);

      // Si hay una configuración HTTP personalizada, la usamos como estaba configurado
      if (form.httpConfig?.enabled && form.httpConfig.url) {
        // Preparamos los headers
        const headers: Record<string, string> = {};
        form.httpConfig.headers.forEach((header) => {
          if (header.key && header.value) {
            headers[header.key] = header.value;
          }
        });
        headers["Content-Type"] = "application/json";

        let bodyToSend = {};
        
        // Generate the body object using the body fields configuration
        if (bodyFields.length > 0) {
          const mappedBody: Record<string, any> = {};
          
          bodyFields.forEach(field => {
            if (field.key) {
              if (field.fieldId === "custom") {
                // This is a custom static value
                try {
                  mappedBody[field.key] = JSON.parse(field.key);
                } catch {
                  mappedBody[field.key] = field.key; // Treat as string if not valid JSON
                }
              } else {
                // This maps to a form field response
                mappedBody[field.key] = formValues[field.fieldId];
              }
            }
          });
          
          bodyToSend = mappedBody;
        } else {
          // Fallback to sending all form values
          bodyToSend = formValues;
        }

        try {
          console.log("Enviando solicitud HTTP a:", form.httpConfig.url);
          console.log("Method:", form.httpConfig.method);
          console.log("Headers:", headers);
          console.log("Body:", JSON.stringify(bodyToSend));

          // Utilizamos nuestra función mejorada para enviar la solicitud
          const response = await sendHttpRequest({
            url: form.httpConfig.url,
            method: form.httpConfig.method,
            headers,
            body: bodyToSend,
            timeout: 15000 // 15 segundos de timeout
          });

          if (response.ok) {
            toast({
              title: "Datos enviados correctamente",
              description: "La respuesta se ha guardado y enviado por HTTP.",
            });
          } else {
            let errorMsg = `Error HTTP: ${response.status}`;
            if (response.statusText === "cors") {
              errorMsg = "Error de CORS: El servidor no permite solicitudes desde este origen. Contacta al administrador para configurar correctamente el servidor.";
            } else if (response.statusText === "timeout") {
              errorMsg = "La solicitud excedió el tiempo de espera. Verifica la URL del endpoint.";
            } else if (response.statusText === "network") {
              errorMsg = "Error de conexión de red. Verifica tu conexión a internet y que el endpoint sea accesible.";
            }
            
            toast({
              title: "Error en el envío HTTP",
              description: errorMsg,
              variant: "destructive",
            });
          }
        } catch (httpError) {
          console.error('Error iniciando solicitud HTTP:', httpError);
          toast({
            title: "Error al iniciar la solicitud HTTP",
            description: "Ocurrió un problema al intentar enviar la solicitud. La respuesta se guardó localmente.",
            variant: "destructive",
          });
        }

        // Notificamos al usuario que la respuesta se ha guardado
        toast({
          title: "Respuesta guardada",
          description: "Tu respuesta se ha guardado correctamente y se ha intentado enviar al servidor externo.",
        });
      } 
      // Si no, aseguramos de todos modos que los datos se envíen a MySQL
      else {
        try {
          // Preparar datos para MySQL
          const mysqlData = {
            form_id: id,
            responses: JSON.stringify(formValues),
            submitted_by: submittedBy || 'anonymous',
            form_title: form?.title || 'Untitled Form'
          };
          
          // Enviar a MySQL directamente
          await sendHttpRequest({
            url: MYSQL_API_ENDPOINT,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: mysqlData,
            timeout: 15000
          });
          
          toast({
            title: "Datos guardados en MySQL",
            description: "Tu respuesta se ha guardado correctamente en la base de datos MySQL.",
          });
        } catch (error) {
          console.error('Error al guardar en MySQL:', error);
          toast({
            title: "Error al guardar en MySQL",
            description: "Hubo un problema al guardar tu respuesta en la base de datos. Se ha guardado localmente.",
            variant: "destructive",
          });
        }
      }
      
      setFormSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu respuesta. Por favor, intenta nuevamente.",
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
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card
          className={cn(
            "shadow-md transition-colors w-full",
            "mx-auto rounded-lg sm:rounded-xl"
          )}
          style={form?.formColor ? {
            background: `${form.formColor}10`,
            borderColor: form.formColor,
            boxShadow: `0 4px 20px 0 ${form.formColor}40`
          } : undefined}
        >
          {form?.welcomeMessage && (
            <CardHeader className="text-center bg-transparent p-4 sm:p-6">
              {form.welcomeMessage.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={form.welcomeMessage.imageUrl} 
                    alt="Welcome" 
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                </div>
              )}
              <CardTitle className="text-xl sm:text-2xl">{form?.title}</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                {form.welcomeMessage.text}
              </CardDescription>
            </CardHeader>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="w-full">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Pregunta {currentFieldIndex + 1} de {totalFields}
                </p>
                
                <div className="flex justify-between mt-4 mb-4 sm:mb-6 sticky top-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-2 rounded-lg shadow-sm z-10">
                  <Button 
                    type="button"
                    onClick={() => setCurrentFieldIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentFieldIndex === 0}
                    variant="outline"
                    className="text-sm sm:text-base"
                  >
                    <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  
                  {currentFieldIndex < totalFields - 1 && (
                    <Button 
                      type="button"
                      onClick={() => setCurrentFieldIndex(prev => Math.min(totalFields - 1, prev + 1))}
                      className="text-sm sm:text-base"
                    >
                      Siguiente
                      <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="min-h-[200px] sm:min-h-[300px]">
                {form?.fields && form.fields[currentFieldIndex] && (
                  <FormField
                    field={form.fields[currentFieldIndex]}
                    value={formValues[form.fields[currentFieldIndex].id]}
                    onChange={(value) => handleInputChange(form.fields[currentFieldIndex].id, value)}
                    formColor={form?.formColor}
                  />
                )}
              </div>
            </CardContent>
            
            {currentFieldIndex === totalFields - 1 && (
              <CardFooter className="flex justify-center p-4 sm:p-6 sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full max-w-xs text-sm sm:text-base py-2 sm:py-3"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Enviando..." : "Enviar"}
                </Button>
              </CardFooter>
            )}
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

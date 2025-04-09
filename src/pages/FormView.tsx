
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/types/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FormView = () => {
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const { getForm, submitFormResponse, isUserAllowed, validateAccessToken } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [form, setForm] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessEmail, setAccessEmail] = useState("");
  
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
    
    // Check if user has access to the form
    let hasAccess = false;
    
    // If form is public, grant access
    if (!formData.isPrivate) {
      hasAccess = true;
    }
    // If form is private, check if user is allowed or has valid token
    else {
      // Check if user is authenticated and allowed
      if (isAuthenticated && currentUser?.email) {
        hasAccess = isUserAllowed(id, currentUser.email);
        if (hasAccess) {
          setAccessEmail(currentUser.email);
        }
      }
      
      // Check if token is valid
      if (token && validateAccessToken(id, token)) {
        hasAccess = true;
      }
    }
    
    setAccessGranted(hasAccess);
    setLoading(false);
  }, [id, token, getForm, isAuthenticated, currentUser, isUserAllowed, validateAccessToken]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = form.fields.filter((field: FormField) => field.required);
    const missingFields = requiredFields.filter((field: FormField) => {
      const value = formValues[field.id];
      return value === undefined || value === "" || value === null;
    });
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missingFields.map((f: FormField) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      await submitFormResponse(id!, formValues);
      toast({
        title: "Success",
        description: "Your response has been submitted",
      });
      
      // Reset form
      setFormValues({});
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form response",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccessRequest = () => {
    if (!accessEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    const hasAccess = isUserAllowed(id!, accessEmail);
    
    if (hasAccess) {
      setAccessGranted(true);
      toast({
        title: "Access Granted",
        description: "You now have access to this form",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this form",
        variant: "destructive",
      });
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

  if (!accessGranted && form.isPrivate) {
    return (
      <Layout hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                Private Form
              </CardTitle>
              <CardDescription>
                This form requires permission to access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {isAuthenticated 
                      ? "Your current account doesn't have access to this form."
                      : "Please enter your email to verify your access or sign in."}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="access-email">Your Email</Label>
                  <Input
                    id="access-email"
                    type="email"
                    placeholder="Enter your email"
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {!isAuthenticated && (
                <Button variant="outline" asChild>
                  <a href="/login">Sign In</a>
                </Button>
              )}
              <Button onClick={handleAccessRequest} className="ml-auto">
                Check Access
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="container max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base mt-2">{form.description}</CardDescription>
            )}
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {form.fields.map((field: FormField) => (
                <div key={field.id} className="space-y-2 form-field">
                  <Label htmlFor={field.id} className="font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.description && (
                    <p className="text-sm text-gray-500 mb-1">{field.description}</p>
                  )}
                  
                  {field.type === 'text' && (
                    <Input
                      id={field.id}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="form-input"
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.id}
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="form-input resize-none"
                      rows={4}
                    />
                  )}
                  
                  {field.type === 'email' && (
                    <Input
                      id={field.id}
                      type="email"
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'name@example.com'}
                      required={field.required}
                      className="form-input"
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <Input
                      id={field.id}
                      type="number"
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="form-input"
                    />
                  )}
                  
                  {field.type === 'date' && (
                    <Input
                      id={field.id}
                      type="date"
                      value={formValues[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      className="form-input"
                    />
                  )}
                  
                  {field.type === 'select' && field.options && (
                    <Select
                      value={formValues[field.id] || ''}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder={field.placeholder || 'Select an option'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'checkbox' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => {
                        const isChecked = Array.isArray(formValues[field.id])
                          ? formValues[field.id]?.includes(option.value)
                          : false;
                          
                        return (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${option.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValues = Array.isArray(formValues[field.id])
                                  ? [...formValues[field.id]]
                                  : [];
                                  
                                const newValues = checked
                                  ? [...currentValues, option.value]
                                  : currentValues.filter((v) => v !== option.value);
                                  
                                handleInputChange(field.id, newValues);
                              }}
                            />
                            <Label htmlFor={`${field.id}-${option.id}`} className="font-normal">
                              {option.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {field.type === 'radio' && field.options && (
                    <RadioGroup
                      value={formValues[field.id] || ''}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      <div className="space-y-2">
                        {field.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`${field.id}-${option.id}`} />
                            <Label htmlFor={`${field.id}-${option.id}`} className="font-normal">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>
              ))}
            </CardContent>
            
            <CardFooter>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default FormView;

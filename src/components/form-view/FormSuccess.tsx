
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { ExternalLink, FileIcon } from "lucide-react";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
}

const FormSuccess = ({ formValues, fields, showTotalScore }: FormSuccessProps) => {
  const navigate = useNavigate();
  const { calculateTotalScore, getScoreFeedback, shouldShowScoreCard } = useFormScoring();
  const [displayValues, setDisplayValues] = useState<Record<string, any>>(formValues);
  
  const currentScore = calculateTotalScore(formValues, fields || []);
  const scoreFeedback = getScoreFeedback(currentScore, fields || []);
  const showScore = shouldShowScoreCard(fields || [], showTotalScore);

  console.log("FormSuccess render:", { showTotalScore, currentScore, scoreFeedback, showScore });
  
  // Debug scores and feedback in more detail
  useEffect(() => {
    console.log("Form values:", formValues);
    console.log("Form fields:", fields);
    console.log("Score feedback:", scoreFeedback);
    console.log("Show total score flag:", showTotalScore);
    console.log("Fields with numeric values:", fields?.filter(f => f.hasNumericValues));
  }, [formValues, fields, scoreFeedback, showTotalScore]);
  
  // Helper function to check if value is a file URL
  const isFileUrl = (value: any): boolean => {
    return typeof value === 'string' && 
           (value.startsWith('http://') || 
            value.startsWith('https://') || 
            value.includes('respuestas-formulario'));
  };
  
  // Helper function to get the file name from URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      return decodeURIComponent(urlParts[urlParts.length - 1]) || 'Archivo';
    } catch (e) {
      return 'Archivo';
    }
  };
  
  // Helper function to render file preview
  const renderFilePreview = (fieldId: string, fileUrl: string) => {
    // Check if it's an image by extension
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileUrl.toLowerCase());
    const field = fields?.find(f => f.id === fieldId);
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
        {isImage ? (
          <img 
            src={fileUrl} 
            alt={field?.label || "Image"} 
            className="h-12 w-12 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.prepend(document.createElement('div'));
              const div = e.currentTarget.parentElement?.firstChild as HTMLDivElement;
              if (div) {
                div.className = "h-12 w-12 bg-gray-200 rounded flex items-center justify-center";
                div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
              }
            }}
          />
        ) : (
          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
            <FileIcon className="h-6 w-6 text-gray-500" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{field?.label || "Archivo"}</p>
          <p className="text-xs text-gray-500">{getFileNameFromUrl(fileUrl)}</p>
        </div>
        <a 
          href={fileUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-1" /> Ver
        </a>
      </div>
    );
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">¡Gracias por responder!</CardTitle>
          <CardDescription className="text-base mt-2">
            Tu respuesta ha sido registrada con éxito
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 py-6">
          {showScore && (
            <div className="p-6 bg-primary/5 rounded-lg space-y-3 border">
              <h3 className="text-xl font-medium text-center mb-4">Resultado</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-lg">Puntuación Total:</span>
                <Badge variant="outline" className="text-2xl font-bold px-4 py-2 bg-primary/10">
                  {currentScore}
                </Badge>
              </div>
              
              {scoreFeedback && (
                <div className="mt-4 p-4 bg-background rounded border text-center">
                  <p className="text-lg">{scoreFeedback}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Display files uploaded in the responses */}
          {Object.entries(formValues).some(([key, value]) => isFileUrl(value)) && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-medium">Archivos adjuntos</h3>
              <div className="space-y-2">
                {Object.entries(formValues).map(([key, value]) => 
                  isFileUrl(value) ? (
                    <div key={key}>
                      {renderFilePreview(key, value as string)}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={() => navigate("/assigned-forms")}>
            Volver a mis formularios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormSuccess;

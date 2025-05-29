
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { ExternalLink, FileIcon } from "lucide-react";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
}

const FormSuccess = ({ formValues, fields, showTotalScore }: FormSuccessProps) => {
  const navigate = useNavigate();
  const { id: formId } = useParams();
  const { calculateTotalScore, getScoreFeedback, shouldShowScoreCard } = useFormScoring();
  const [displayValues, setDisplayValues] = useState<Record<string, any>>(formValues);
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);
  
  const currentScore = calculateTotalScore(formValues, fields || []);
  const showScore = shouldShowScoreCard(fields || [], showTotalScore);

  console.log("FormSuccess render:", { showTotalScore, currentScore, showScore });
  
  // Fetch score feedback from database
  useEffect(() => {
    const fetchFeedback = async () => {
      if (formId && showScore) {
        const feedback = await getScoreFeedback(currentScore, formId, fields);
        setScoreFeedback(feedback);
        console.log("Score feedback from DB in FormSuccess:", feedback);
      }
    };
    
    fetchFeedback();
  }, [currentScore, formId, fields, showScore, getScoreFeedback]);
  
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
      const filename = urlParts[urlParts.length - 1];
      // Decode and clean up the filename (remove any query parameters)
      return decodeURIComponent(filename.split('?')[0]) || 'Archivo';
    } catch (e) {
      return 'Archivo';
    }
  };
  
  // Helper function to check if a URL is an image
  const isImageUrl = (url: string): boolean => {
    // Check if URL ends with typical image extensions
    return /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url.toLowerCase());
  };
  
  // Helper function to render file preview
  const renderFilePreview = (fieldId: string, fileUrl: string) => {
    // Check if it's an image by extension
    const isImage = isImageUrl(fileUrl);
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
          <div className="font-medium text-sm">{field?.label || "Archivo"}</div>
          <div className="text-xs text-gray-500">{getFileNameFromUrl(fileUrl)}</div>
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">¡Respuesta Enviada!</CardTitle>
          <CardDescription>
            Tu respuesta ha sido registrada exitosamente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {showScore && (
            <div className="p-6 bg-primary/5 rounded-lg space-y-4 border border-primary/20">
              <h3 className="text-xl font-medium text-center mb-4">Tu Puntuación Total</h3>
              
              <div className="flex items-center justify-center">
                <Badge variant="outline" className="text-2xl font-bold px-4 py-2 bg-primary/10">
                  {currentScore} puntos
                </Badge>
              </div>
              
              {scoreFeedback && (
                <div className="mt-4 p-4 bg-background rounded border text-center">
                  <h4 className="text-lg font-semibold mb-2 text-primary">Resultado:</h4>
                  <p className="text-base font-medium">{scoreFeedback}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center text-muted-foreground">
            <p>Gracias por tu tiempo y participación</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/assigned-forms")} className="px-8">
            Volver a formularios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormSuccess;

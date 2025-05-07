
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormField } from "@/types/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ViewResponseDialogProps {
  formId: string;
  formTitle: string;
  fields: FormField[];
  open: boolean;
  onClose: () => void;
  adminView?: boolean;
}

interface ResponseData {
  [key: string]: any;
}

interface FormResponse {
  id: number;
  nombre_invitado: string;
  created_at: string;
  respuestas: ResponseData;
}

const ViewResponseDialog = ({ formId, formTitle, fields, open, onClose, adminView = false }: ViewResponseDialogProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [allResponses, setAllResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [showAllResponses, setShowAllResponses] = useState(false);

  useEffect(() => {
    const fetchResponse = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (adminView) {
          // Admin view - fetch all responses for this form
          const { data, error } = await supabase
            .from('formulario')
            .select('*')
            .eq('nombre_formulario', formTitle)
            .order('created_at', { ascending: false });
          
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            setAllResponses(data);
            setResponseData(data[0].respuestas);
            setSelectedResponseIndex(0);
          } else {
            setError("No se encontraron respuestas para este formulario");
          }
        } else {
          // User view - fetch only their own response
          const userEmail = currentUser?.email || localStorage.getItem('userEmail');
          
          if (!userEmail) {
            setError("No se pudo identificar al usuario");
            setLoading(false);
            return;
          }
          
          // Fetch from formulario table where the form ID and user match
          const { data, error } = await supabase
            .from('formulario')
            .select('respuestas')
            .eq('nombre_formulario', formTitle)
            .eq('nombre_invitado', userEmail)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0 && data[0].respuestas) {
            setResponseData(data[0].respuestas);
          } else {
            setError("No se encontraron respuestas para este formulario");
          }
        }
      } catch (err) {
        console.error("Error al cargar las respuestas:", err);
        setError("Ocurrió un error al cargar las respuestas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResponse();
  }, [open, formId, formTitle, currentUser?.email, adminView]);

  // Find a field label by matching the label text in the fields array
  const findFieldByLabel = (label: string): FormField | undefined => {
    return fields?.find(field => field.label === label);
  };

  const handleSelectResponse = (index: number) => {
    setSelectedResponseIndex(index);
    setResponseData(allResponses[index].respuestas);
    setShowAllResponses(false);
  };

  const handleToggleAllResponses = () => {
    setShowAllResponses(!showAllResponses);
  };

  // Create aggregate data from all responses
  const getAggregatedData = () => {
    if (!allResponses || allResponses.length === 0) return {};
    
    const aggregated: {[key: string]: any[]} = {};
    
    allResponses.forEach(response => {
      if (!response.respuestas) return;
      
      Object.entries(response.respuestas).forEach(([question, answer]) => {
        if (!aggregated[question]) {
          aggregated[question] = [];
        }
        aggregated[question].push({
          answer,
          user: response.nombre_invitado,
          date: response.created_at
        });
      });
    });
    
    return aggregated;
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Respuestas del formulario: {formTitle}</DialogTitle>
          <DialogDescription>
            {adminView 
              ? "Todas las respuestas recibidas para este formulario." 
              : "Estas son las respuestas que enviaste para este formulario."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando respuestas...</span>
            </div>
          )}
          
          {error && (
            <div className="py-6 text-center text-red-500">
              {error}
            </div>
          )}
          
          {!loading && !error && responseData && (
            <>
              {adminView && allResponses.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Seleccionar respuesta:</h4>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex gap-2">
                          <Filter className="h-4 w-4" />
                          <span>Filtrar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={handleToggleAllResponses} 
                          className={showAllResponses ? "bg-muted" : ""}
                        >
                          Ver todas las respuestas
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSelectResponse(selectedResponseIndex)}
                          className={!showAllResponses ? "bg-muted" : ""}
                        >
                          Ver respuestas individuales
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {!showAllResponses && (
                    <div className="flex flex-wrap gap-2">
                      {allResponses.map((response, index) => (
                        <Button 
                          key={response.id}
                          variant={selectedResponseIndex === index ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleSelectResponse(index)}
                        >
                          {response.nombre_invitado.split('@')[0]}
                        </Button>
                      ))}
                    </div>
                  )}

                  {!showAllResponses && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Mostrando respuesta de: <strong>{allResponses[selectedResponseIndex].nombre_invitado}</strong> 
                      <span className="ml-2">
                        ({new Date(allResponses[selectedResponseIndex].created_at).toLocaleString()})
                      </span>
                    </div>
                  )}

                  {showAllResponses && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Mostrando todas las respuestas ({allResponses.length} participantes)
                    </div>
                  )}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Pregunta</TableHead>
                    <TableHead className="w-1/2">
                      {showAllResponses ? "Todas las respuestas" : "Respuesta"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showAllResponses ? (
                    // Display aggregated responses
                    Object.entries(getAggregatedData()).map(([question, answersList]) => (
                      <TableRow key={question}>
                        <TableCell className="font-medium align-top">{question}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {answersList.map((item, idx) => (
                              <div key={idx} className="border-b pb-2 last:border-b-0 last:pb-0">
                                <div className="text-sm">{typeof item.answer === 'object' ? JSON.stringify(item.answer) : String(item.answer)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.user} • {new Date(item.date).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Display individual response
                    Object.entries(responseData).map(([question, answer]) => (
                      <TableRow key={question}>
                        <TableCell className="font-medium">{question}</TableCell>
                        <TableCell>
                          {typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewResponseDialog;

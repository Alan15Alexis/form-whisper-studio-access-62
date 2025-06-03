import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter, Download, FileSpreadsheet, ExternalLink, FileIcon, Award, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/types/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { getFileInfoFromUrl, isFormResponseFile } from "@/utils/fileUploadUtils";

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

  // Find a field by matching the label text in the fields array
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

  // Helper function to check if value is a file URL (enhanced)
  const isFileUrl = (value: any): boolean => {
    return typeof value === 'string' && 
          (value.startsWith('http://') || 
           value.startsWith('https://') || 
           isFormResponseFile(value));
  };
  
  // Helper function to check if this is a numeric value field
  const isNumericValue = (key: string): boolean => {
    return key.includes('(Valor Numérico)');
  };
  
  // Helper function to check if this is a score-related field
  const isScoreField = (key: string): boolean => {
    return key === '_puntuacion_total' || key === '_mensaje_puntuacion' || key === '_fecha_puntuacion';
  };

  // Download responses as CSV
  const downloadCSV = () => {
    if (!allResponses || allResponses.length === 0) return;
    
    // Get all unique question keys from all responses
    const allKeys = new Set<string>();
    allResponses.forEach(response => {
      if (response.respuestas) {
        Object.keys(response.respuestas).forEach(key => {
          allKeys.add(key);
        });
      }
    });
    
    // Create CSV header row
    const headers = ["Usuario", "Fecha", ...Array.from(allKeys)];
    
    // Create data rows
    const rows = allResponses.map(response => {
      const row: string[] = [
        response.nombre_invitado,
        format(new Date(response.created_at), 'yyyy-MM-dd HH:mm:ss')
      ];
      
      // Add response data for each question
      Array.from(allKeys).forEach(key => {
        const value = response.respuestas?.[key] ?? '';
        if (typeof value === 'object') {
          row.push(JSON.stringify(value));
        } else {
          row.push(String(value));
        }
      });
      
      return row;
    });
    
    // Format CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${formTitle.replace(/\s+/g, '_')}_respuestas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhanced function to render file preview with better handling for respuestas_formularios bucket
  const renderFilePreview = (fileUrl: string, fieldLabel: string) => {
    const fileInfo = getFileInfoFromUrl(fileUrl);
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors">
        {fileInfo.isImage ? (
          <div className="relative">
            <img 
              src={fileUrl} 
              alt={fieldLabel || "Imagen"} 
              className="h-16 w-16 object-cover rounded border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="image-placeholder hidden h-16 w-16 bg-gray-200 rounded border items-center justify-center">
              <Image className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
            <FileIcon className="h-8 w-8 text-blue-600" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{fieldLabel}</p>
          <p className="text-xs text-gray-600 truncate">{fileInfo.fileName}</p>
          {fileInfo.isFromBucket && (
            <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700 border-green-200">
              📁 Almacenado en respuestas_formularios
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <a 
            href={fileUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Ver
          </a>
          {fileInfo.isImage && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Image className="h-3 w-3" /> Imagen
            </span>
          )}
        </div>
      </div>
    );
  };

  // Function to render score fields with special styling
  const renderScoreField = (key: string, value: any) => {
    if (key === '_puntuacion_total') {
      return (
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <Badge variant="outline" className="text-lg font-bold px-3 py-1 bg-yellow-50 border-yellow-200">
            {value} puntos
          </Badge>
        </div>
      );
    }
    
    if (key === '_mensaje_puntuacion') {
      return (
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="text-green-800 font-medium">{String(value)}</p>
        </div>
      );
    }
    
    if (key === '_fecha_puntuacion') {
      const date = new Date(String(value));
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleString()}
        </span>
      );
    }
    
    return String(value);
  };

  // Function to get display name for score fields
  const getScoreFieldDisplayName = (key: string) => {
    switch (key) {
      case '_puntuacion_total':
        return '🏆 Puntuación Total';
      case '_mensaje_puntuacion':
        return '💬 Mensaje de Retroalimentación';
      case '_fecha_puntuacion':
        return '📅 Fecha de Evaluación';
      default:
        return key;
    }
  };

  // Create aggregate data from all responses with proper ordering
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

  // Function to sort entries to show score fields first
  const getSortedEntries = (data: ResponseData) => {
    const entries = Object.entries(data);
    
    // Separate score fields from regular fields
    const scoreFields = entries.filter(([key]) => isScoreField(key));
    const regularFields = entries.filter(([key]) => !isScoreField(key));
    
    // Sort score fields in specific order: total score, feedback message, date
    const orderedScoreFields = scoreFields.sort(([keyA], [keyB]) => {
      const scoreOrder = ['_puntuacion_total', '_mensaje_puntuacion', '_fecha_puntuacion'];
      return scoreOrder.indexOf(keyA) - scoreOrder.indexOf(keyB);
    });
    
    // Return score fields first, then regular fields
    return [...orderedScoreFields, ...regularFields];
  };

  // Function to sort aggregated entries to show score fields first
  const getSortedAggregatedEntries = (aggregatedData: {[key: string]: any[]}) => {
    const entries = Object.entries(aggregatedData);
    
    // Separate score fields from regular fields
    const scoreFields = entries.filter(([key]) => isScoreField(key));
    const regularFields = entries.filter(([key]) => !isScoreField(key));
    
    // Sort score fields in specific order: total score, feedback message, date
    const orderedScoreFields = scoreFields.sort(([keyA], [keyB]) => {
      const scoreOrder = ['_puntuacion_total', '_mensaje_puntuacion', '_fecha_puntuacion'];
      return scoreOrder.indexOf(keyA) - scoreOrder.indexOf(keyB);
    });
    
    // Return score fields first, then regular fields
    return [...orderedScoreFields, ...regularFields];
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Respuestas del formulario: {formTitle}</DialogTitle>
          <DialogDescription>
            {adminView 
              ? "Todas las respuestas recibidas para este formulario, incluyendo archivos almacenados en respuestas_formularios." 
              : "Estas son las respuestas que enviaste para este formulario, incluyendo tus archivos subidos."}
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
                    
                    <div className="flex space-x-2">
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
                      
                      <Button 
                        onClick={downloadCSV} 
                        variant="outline" 
                        size="sm" 
                        className="flex gap-2"
                        disabled={allResponses.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        <span>Descargar CSV</span>
                      </Button>
                    </div>
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

              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Pregunta</TableHead>
                      <TableHead className="w-2/3">
                        {showAllResponses ? "Todas las respuestas" : "Respuesta"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showAllResponses ? (
                      // Display aggregated responses with score fields first
                      getSortedAggregatedEntries(getAggregatedData()).map(([question, answersList]) => (
                        <TableRow key={question} className={
                          isNumericValue(question) ? "bg-blue-50" : 
                          isScoreField(question) ? "bg-yellow-50" : ""
                        }>
                          <TableCell className="font-medium align-top">
                            {isScoreField(question) ? getScoreFieldDisplayName(question) : question}
                            {isNumericValue(question) && (
                              <span className="block text-xs text-blue-600 mt-1">Valor numérico</span>
                            )}
                            {isScoreField(question) && (
                              <span className="block text-xs text-yellow-600 mt-1">Campo de puntuación</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {answersList.map((item, idx) => (
                                <div key={idx} className="border-b pb-2 last:border-b-0 last:pb-0">
                                  <div className="text-sm">
                                    {isFileUrl(item.answer) ? (
                                      renderFilePreview(item.answer, question)
                                    ) : isScoreField(question) ? (
                                      renderScoreField(question, item.answer)
                                    ) : (
                                      <span className={isNumericValue(question) ? "font-semibold text-blue-700" : ""}>
                                        {typeof item.answer === 'object' ? JSON.stringify(item.answer) : String(item.answer)}
                                      </span>
                                    )}
                                  </div>
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
                      // Display individual response with score fields first
                      getSortedEntries(responseData).map(([question, answer]) => (
                        <TableRow key={question} className={
                          isNumericValue(question) ? "bg-blue-50" : 
                          isScoreField(question) ? "bg-yellow-50" : ""
                        }>
                          <TableCell className="font-medium">
                            {isScoreField(question) ? getScoreFieldDisplayName(question) : question}
                            {isNumericValue(question) && (
                              <span className="block text-xs text-blue-600 mt-1">Valor numérico</span>
                            )}
                            {isScoreField(question) && (
                              <span className="block text-xs text-yellow-600 mt-1">Campo de puntuación</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isFileUrl(answer) ? (
                              renderFilePreview(answer, question)
                            ) : isScoreField(question) ? (
                              renderScoreField(question, answer)
                            ) : (
                              <span className={isNumericValue(question) ? "font-semibold text-blue-700" : ""}>
                                {typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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

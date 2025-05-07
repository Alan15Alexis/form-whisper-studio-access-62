
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormField } from "@/types/form";

interface ViewResponseDialogProps {
  formId: string;
  formTitle: string;
  fields: FormField[];
  open: boolean;
  onClose: () => void;
}

interface ResponseData {
  [key: string]: any;
}

const ViewResponseDialog = ({ formId, formTitle, fields, open, onClose }: ViewResponseDialogProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponse = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      
      try {
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
      } catch (err) {
        console.error("Error al cargar las respuestas:", err);
        setError("Ocurrió un error al cargar las respuestas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResponse();
  }, [open, formId, formTitle, currentUser?.email]);

  // Find a field label by matching the label text in the fields array
  const findFieldByLabel = (label: string): FormField | undefined => {
    return fields?.find(field => field.label === label);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Respuestas del formulario: {formTitle}</DialogTitle>
          <DialogDescription>
            Estas son las respuestas que enviaste para este formulario.
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Pregunta</TableHead>
                  <TableHead className="w-1/2">Respuesta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(responseData).map(([question, answer]) => (
                  <TableRow key={question}>
                    <TableCell className="font-medium">{question}</TableCell>
                    <TableCell>
                      {typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

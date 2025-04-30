
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateUrl, sendHttpRequest } from '@/utils/http-utils';
import { HttpConfig, FormField } from '@/types/form';

interface UseHttpConfigProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  formFields: FormField[];
}

export interface BodyField {
  id: number;
  key: string;
  fieldId: string;
}

export const DEFAULT_BODY_FIELDS: BodyField[] = [
  { id: 1, key: "", fieldId: "custom" }
];

export const useHttpConfig = ({ config, onConfigChange, formFields }: UseHttpConfigProps) => {
  const [testResponse, setTestResponse] = useState<{ status: number; data: string } | null>(
    config.lastResponse 
      ? { status: config.lastResponse.status, data: config.lastResponse.data } 
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editableJsonPreview, setEditableJsonPreview] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");

  const handleJsonPreviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditableJsonPreview(newValue);
    
    try {
      JSON.parse(newValue);
      setJsonError("");
      
      const newBodyFields = [{
        id: 1,
        key: newValue,
        fieldId: "custom"
      }];
      
      onConfigChange({
        ...config,
        body: JSON.stringify(newBodyFields)
      });
    } catch (error) {
      setJsonError("JSON inválido: Por favor verifica la sintaxis");
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, url: e.target.value });
  };

  const handleMethodChange = (method: 'GET' | 'POST') => {
    onConfigChange({ ...config, method });
  };

  const handleTestRequest = async () => {
    if (!validateUrl(config.url)) {
      toast({
        title: "URL inválida",
        description: "Por favor, ingresa una URL válida",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
    try {
      // Preparar los headers
      const headers: Record<string, string> = {};
      config.headers.forEach((header) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      headers["Content-Type"] = "application/json";

      // Preparar el body
      let bodyToSend = null;
      if (config.method === "POST") {
        try {
          if (!jsonError && editableJsonPreview) {
            bodyToSend = JSON.parse(editableJsonPreview);
          }
        } catch (error) {
          console.error("Error preparando el body:", error);
        }
      }
      
      console.log("Preparando solicitud a:", config.url);
      console.log("Headers:", headers);
      if (bodyToSend) console.log("Body:", JSON.stringify(bodyToSend));

      // Realizar la solicitud HTTP directamente
      const response = await sendHttpRequest({
        url: config.url,
        method: config.method,
        headers,
        body: bodyToSend,
        timeout: 15000 // 15 segundos de timeout
      });
      
      const responseObj = { 
        status: response.status, 
        data: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data, 
        timestamp: new Date().toISOString() 
      };
      
      setTestResponse({ 
        status: response.status, 
        data: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data 
      });
      
      onConfigChange({
        ...config,
        lastResponse: responseObj
      });
  
      if (response.ok) {
        toast({
          title: `Respuesta: ${response.status}`,
          description: "Solicitud enviada con éxito",
        });
      } else {
        let errorMsg = `HTTP error: ${response.status}`;
        if (response.statusText === "cors") {
          errorMsg = "Error de CORS: El servidor no permite solicitudes desde este origen";
        } else if (response.statusText === "timeout") {
          errorMsg = "La solicitud excedió el tiempo de espera";
        } else if (response.statusText === "network") {
          errorMsg = "Error de conexión de red";
        }
        
        toast({
          title: `Error: ${response.status || "Conexión"}`,
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Error en la solicitud:", error);
      setTestResponse({ status: 0, data: errorMessage });
      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testResponse,
    isLoading,
    editableJsonPreview,
    jsonError,
    handleJsonPreviewChange,
    handleToggleEnabled,
    handleUrlChange,
    handleMethodChange,
    handleTestRequest,
    setEditableJsonPreview
  };
};

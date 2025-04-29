
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
      // Preparamos los headers
      const headers: Record<string, string> = {};
      config.headers.forEach((header) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      headers["Content-Type"] = "application/json";

      let bodyToSend = null;
      if (config.method === "POST") {
        try {
          if (!jsonError && editableJsonPreview) {
            bodyToSend = JSON.parse(editableJsonPreview);
          }
        } catch (error) {
          console.error("Error preparing request body:", error);
        }
      }
      
      console.log("Preparing to send request to:", config.url);
      console.log("Headers:", headers);
      if (bodyToSend) console.log("Body:", JSON.stringify(bodyToSend));

      // Enviamos la solicitud a través de nuestro servicio proxy para evitar CORS
      const response = await sendHttpRequest(
        config.url,
        config.method,
        headers,
        bodyToSend
      );

      console.log("Response received:", response);
      
      setTestResponse(response);
      
      onConfigChange({
        ...config,
        lastResponse: {
          ...response,
          timestamp: new Date().toISOString()
        }
      });

      if (response.status >= 200 && response.status < 300) {
        toast({
          title: `Respuesta: ${response.status}`,
          description: "Solicitud enviada con éxito",
        });
      } else {
        toast({
          title: `Error: ${response.status}`,
          description: "La solicitud no se completó correctamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in test request:", error);
      
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
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


import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateUrl } from '@/utils/http-utils';
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
      const headers = new Headers();
      config.headers.forEach((header) => {
        if (header.key && header.value) {
          headers.append(header.key, header.value);
        }
      });
      headers.append("Content-Type", "application/json");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let bodyToSend = null;
      if (config.method === "POST") {
        try {
          if (!jsonError && editableJsonPreview) {
            const bodyData = JSON.parse(editableJsonPreview);
            bodyToSend = bodyData;
          }
        } catch (error) {
          console.error("Error preparing request body:", error);
        }
      }
      
      console.log("Preparing to send request to:", config.url);
      console.log("Headers:", Object.fromEntries(headers.entries()));
      if (bodyToSend) console.log("Body:", JSON.stringify(bodyToSend));

      const requestOptions: RequestInit = {
        method: config.method,
        headers,
        signal: controller.signal,
      };

      if (config.method === "POST" && bodyToSend) {
        requestOptions.body = JSON.stringify(bodyToSend);
      }
      
      fetch(config.url, requestOptions)
        .then(async (response) => {
          clearTimeout(timeoutId);
          const data = await response.text();
          const responseObj = { 
            status: response.status, 
            data, 
            timestamp: new Date().toISOString() 
          };
          
          setTestResponse({ status: response.status, data });
          
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
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          let errorMessage = "Error desconocido";
          if (error instanceof TypeError) {
            errorMessage = "Error de red o problema de conexión.";
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          console.error("Request error:", error);
          setTestResponse({ status: 0, data: errorMessage });
          toast({
            title: "Error de conexión",
            description: errorMessage,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Setup error:", error);
      setTestResponse({ status: 0, data: errorMessage });
      toast({
        title: "Error preparando la solicitud",
        description: errorMessage,
        variant: "destructive",
      });
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

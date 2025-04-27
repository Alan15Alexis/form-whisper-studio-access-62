import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { HttpConfig, FormField } from "@/types/form";
import { Plus, Trash, Send, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface HttpConfigSettingsProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  isAdmin: boolean;
  formFields?: FormField[];
}

type BodyField = {
  id: number;
  key: string;
  fieldId: string;
};

const DEFAULT_BODY_FIELDS: BodyField[] = [
  { id: 1, key: "", fieldId: "custom" }
];

const DEFAULT_CONFIG: HttpConfig = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  body: "",
};

function getBodyFieldsFromConfigBody(body: string): BodyField[] {
  try {
    const arr = JSON.parse(body);
    if (Array.isArray(arr) && arr.every(f => typeof f.id === "number" && typeof f.key === "string" && typeof f.fieldId === "string"))
      return arr;
    if (typeof arr === "object" && arr !== null && !Array.isArray(arr)) {
      const entries = Object.entries(arr);
      let idCounter = 1;
      return entries.map(([key, value]) => ({
        id: idCounter++,
        key,
        fieldId: typeof value === "string" ? value : "",
      }));
    }
    return DEFAULT_BODY_FIELDS;
  } catch {
    return DEFAULT_BODY_FIELDS;
  }
}

function getPreviewJson(fields: BodyField[], formFields: FormField[]) {
  try {
    if (fields[0]?.fieldId === "custom" && fields[0]?.key) {
      const customJson = JSON.parse(fields[0].key || "{}");
      if (typeof customJson === "object") {
        return customJson;
      }
    }
  } catch {
    // If custom JSON parsing fails, continue to build dynamic JSON
  }
  
  const example: Record<string, string> = {};
  for (const f of fields) {
    if (!f.key) continue;
    const campo = formFields.find(ff => ff.id === f.fieldId);
    example[f.key] = campo ? `[${campo.label || campo.id}]` : "";
  }
  return example;
}

const getResponseBadgeColor = (status: number) => {
  if (status >= 200 && status < 300) return "bg-green-100 text-green-700 border-green-200";
  if (status >= 300 && status < 400) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (status >= 400 && status < 500) return "bg-red-100 text-red-700 border-red-200";
  if (status >= 500) return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const getResponseMessage = (status: number) => {
  if (status >= 200 && status < 300) return "Éxito - La solicitud se procesó correctamente";
  if (status >= 300 && status < 400) return "Redirección - Puede requerir ajustes adicionales";
  if (status >= 400 && status < 500) return "Error del cliente - Verifica los datos enviados";
  if (status >= 500) return "Error del servidor - Contacta al administrador del sistema";
  return "Estado desconocido";
};

const getFieldTypeName = (type: FormField["type"]): string => {
  const typeNames: Record<FormField["type"], string> = {
    text: "Texto corto",
    textarea: "Texto largo",
    email: "Correo electrónico",
    number: "Número",
    date: "Fecha",
    time: "Hora",
    select: "Selección única",
    checkbox: "Casillas de verificación",
    radio: "Opciones múltiples",
    yesno: "Sí/No",
    "image-select": "Selección de imagen",
    fullname: "Nombre completo",
    phone: "Teléfono",
    address: "Dirección",
    "image-upload": "Subir imagen",
    "file-upload": "Subir archivo",
    drawing: "Dibujo",
    signature: "Firma",
    "opinion-scale": "Escala de opinión",
    "star-rating": "Calificación con estrellas",
    matrix: "Matriz",
    ranking: "Ranking",
    terms: "Términos y condiciones",
    welcome: "Mensaje de bienvenida",
    timer: "Temporizador"
  };
  
  return typeNames[type] || type;
};

const HttpConfigSettings = ({ 
  config = DEFAULT_CONFIG, 
  onConfigChange,
  isAdmin,
  formFields = [],
}: HttpConfigSettingsProps) => {
  const [testResponse, setTestResponse] = useState<{ status: number; data: string } | null>(
    config.lastResponse 
      ? { status: config.lastResponse.status, data: config.lastResponse.data } 
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editableJsonPreview, setEditableJsonPreview] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");

  const bodyFields: BodyField[] = config.enabled ? getBodyFieldsFromConfigBody(config.body || "[]") : [];

  const [bodyIdCounter, setBodyIdCounter] = useState(
    bodyFields.length ? Math.max(...bodyFields.map(b => b.id))+1 : 2
  );

  useEffect(() => {
    if (config.enabled) {
      if (bodyFields.length === 1 && bodyFields[0].fieldId === "custom" && bodyFields[0].key) {
        try {
          const jsonObj = JSON.parse(bodyFields[0].key);
          setEditableJsonPreview(JSON.stringify(jsonObj, null, 2));
        } catch {
          setEditableJsonPreview(bodyFields[0].key);
        }
      } else {
        setEditableJsonPreview(JSON.stringify(getPreviewJson(bodyFields, formFields), null, 2));
      }
    }
  }, [bodyFields, formFields, config.enabled]);

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

  const handleToggleEnabled = function(enabled: boolean) {
    onConfigChange({ ...config, enabled });
  };

  const handleUrlChange = function(e: React.ChangeEvent<HTMLInputElement>) {
    onConfigChange({ ...config, url: e.target.value });
  };

  const handleAddHeader = function() {
    const newId = config.headers.length
      ? Math.max(...config.headers.map(h => h.id ?? 0)) + 1
      : 1;
    const newHeaders = [
      ...config.headers, 
      { id: newId, key: "", value: "" }
    ];
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleRemoveHeader = function(id: number) {
    const newHeaders = config.headers.filter(h => h.id !== id);
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleHeaderChange = function(id: number, field: "key" | "value", value: string) {
    const newHeaders = config.headers.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    );
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleAddBodyField = function() {
    const updated = [...bodyFields];
    
    if (updated.length === 1 && updated[0].fieldId === "custom") {
      try {
        const customJson = JSON.parse(updated[0].key);
        if (typeof customJson === "object" && customJson !== null) {
          updated.length = 0;
          let id = 1;
          for (const [key, value] of Object.entries(customJson)) {
            updated.push({
              id: id++,
              key,
              fieldId: "custom"
            });
          }
          setBodyIdCounter(id);
        }
      } catch {
        updated.length = 0;
      }
    }
    
    updated.push({
      id: bodyIdCounter,
      key: "",
      fieldId: formFields.length > 0 ? formFields[0].id : ""
    });
    
    const updatedJson = JSON.stringify(updated);
    onConfigChange({
      ...config,
      body: updatedJson
    });
    setBodyIdCounter(prevCounter => prevCounter + 1);
    
    const newPreviewObj = getPreviewJson(updated, formFields);
    setEditableJsonPreview(JSON.stringify(newPreviewObj, null, 2));
  };

  const handleRemoveBodyField = function(id: number) {
    const updated = bodyFields.filter(b => b.id !== id);
    const updatedJson = JSON.stringify(updated);
    onConfigChange({
      ...config,
      body: updatedJson
    });
    
    const newPreviewObj = getPreviewJson(updated, formFields);
    setEditableJsonPreview(JSON.stringify(newPreviewObj, null, 2));
  };

  const handleBodyFieldChange = function(id: number, field: "key" | "fieldId", value: string) {
    let updated = bodyFields.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    );
    
    if (field === "fieldId" && value === "custom") {
      try {
        JSON.parse(updated[0].key || "{}");
      } catch {
        updated = updated.map(b => ({
          ...b,
          key: "{}"
        }));
      }
    }
    
    const updatedJson = JSON.stringify(updated);
    onConfigChange({
      ...config,
      body: updatedJson
    });
    
    const newPreviewObj = getPreviewJson(updated, formFields);
    setEditableJsonPreview(JSON.stringify(newPreviewObj, null, 2));
  };

  const validateUrl = function(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getDummyResponses = function() {
    const r: Record<string, string> = {};
    for (const campo of formFields) {
      r[campo.id] = `[${campo.label || campo.id}]`;
    }
    return r;
  };

  const buildRequestBody = function(fields: BodyField[], responses: Record<string, string>) {
    const obj: Record<string, any> = {};
    for (const f of fields) {
      if (!f.key) continue;
      obj[f.key] = responses[f.fieldId] !== undefined ? responses[f.fieldId] : "";
    }
    return obj;
  };

  const handleMethodChange = function(method: 'GET' | 'POST') {
    onConfigChange({
      ...config,
      method
    });
  };

  const handleTestRequest = async function() {
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

      const requestOptions: RequestInit = {
        method: config.method,
        headers,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        signal: controller.signal
      };

      if (config.method === "POST") {
        try {
          if (!jsonError && editableJsonPreview) {
            const bodyData = JSON.parse(editableJsonPreview);
            requestOptions.body = JSON.stringify(bodyData);
          } else {
            const requestBodyObj = buildRequestBody(bodyFields, getDummyResponses());
            requestOptions.body = JSON.stringify(requestBodyObj);
          }
        } catch (error) {
          console.error("Error preparing request body:", error);
          const requestBodyObj = buildRequestBody(bodyFields, getDummyResponses());
          requestOptions.body = JSON.stringify(requestBodyObj);
        }
      }
      
      console.log("Sending request with options:", requestOptions);
      
      const response = await fetch(config.url, requestOptions);
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
          variant: "default",
        });
      } else {
        toast({
          title: `Error: ${response.status}`,
          description: `Hubo un problema con la solicitud. Detalles: ${data}`,
          variant: "destructive",
        });
      }
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <Settings className="w-5 h-5 text-gray-400 mr-1" />
        <div>
          <CardTitle className="text-xl font-bold">Envío de Datos por HTTP</CardTitle>
          <CardDescription>
            Configura el envío automático de datos mediante solicitudes HTTP
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Switch
            id="http-enabled"
            checked={config.enabled}
            onCheckedChange={handleToggleEnabled}
          />
          <div>
            <Label htmlFor="http-enabled" className="text-lg font-medium">
              Activar envío automático
            </Label>
            <p className="text-sm text-gray-500">
              Habilita o deshabilita el envío automático de datos mediante una solicitud HTTP
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endpoint-url" className="text-md font-medium">
            URL del Endpoint
          </Label>
          <Input
            id="endpoint-url"
            type="url"
            value={config.url}
            onChange={handleUrlChange}
            placeholder="https://tusitio.com/_functions/ultimoRegistro"
            className={!validateUrl(config.url) && config.url ? "border-red-300" : ""}
          />
          {!validateUrl(config.url) && config.url && (
            <p className="text-xs text-red-500">Por favor, ingresa una URL válida</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-md font-medium">Tipo de solicitud</Label>
          <select
            className="w-full h-10 px-3 border rounded-md"
            value={config.method}
            onChange={(e) => handleMethodChange(e.target.value as 'GET' | 'POST')}
            disabled={!config.enabled}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-md font-medium">Headers (Estáticos)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddHeader}
              className="flex items-center gap-1"
              disabled={!config.enabled}
            >
              <Plus className="h-4 w-4" /> Agregar Header
            </Button>
          </div>
          
          {config.headers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Clave</TableHead>
                  <TableHead className="w-[55%]">Valor</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.headers.map((header) => (
                  <TableRow key={header.id}>
                    <TableCell>
                      <Input
                        value={header.key}
                        onChange={(e) => handleHeaderChange(header.id, "key", e.target.value)}
                        placeholder="Authorization"
                        disabled={!config.enabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={header.value}
                        onChange={(e) => handleHeaderChange(header.id, "value", e.target.value)}
                        placeholder="Bearer eyJ..."
                        disabled={!config.enabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHeader(header.id)}
                        className="h-8 w-8"
                        disabled={!config.enabled}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500 border rounded-md">
              No hay headers configurados
            </div>
          )}
        </div>

        {config.method === "POST" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="body-fields" className="text-md font-medium">Body</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddBodyField}
                  className="flex items-center gap-1"
                  disabled={!config.enabled}
                >
                  <Plus className="h-4 w-4" /> Añadir campo
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[48%]">Clave</TableHead>
                    <TableHead className="w-[47%]">Valor (Campo del formulario)</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bodyFields.map((bodyField) => {
                    const selectedField = formFields.find(f => f.id === bodyField.fieldId);
                    return (
                      <TableRow key={bodyField.id}>
                        <TableCell>
                          <Input
                            value={bodyField.key}
                            onChange={e => handleBodyFieldChange(bodyField.id, "key", e.target.value)}
                            placeholder="Ej: user_id"
                            disabled={!config.enabled}
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            className="w-full h-10 px-3 border rounded-md"
                            value={bodyField.fieldId}
                            disabled={!config.enabled}
                            onChange={e => handleBodyFieldChange(bodyField.id, "fieldId", e.target.value)}
                          >
                            <option value="">Selecciona un campo...</option>
                            <option value="custom">Texto Personalizado</option>
                            {formFields.map(f => (
                              <option value={f.id} key={f.id}>
                                {`${getFieldTypeName(f.type)} - ${f.label}`}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBodyField(bodyField.id)}
                            className="h-8 w-8"
                            disabled={!config.enabled}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label className="text-md font-medium">Vista previa del JSON (Editable)</Label>
              <Textarea
                className={cn(
                  "w-full min-h-[120px] p-4 font-mono text-sm",
                  "bg-gray-50 border rounded-md",
                  jsonError && "border-red-300 focus-visible:ring-red-400"
                )}
                value={editableJsonPreview}
                onChange={handleJsonPreviewChange}
                placeholder="{}"
                disabled={!config.enabled}
              />
              {jsonError ? (
                <p className="text-xs text-red-500">{jsonError}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Puedes editar directamente el JSON para personalizar el cuerpo de la solicitud
                </p>
              )}
            </div>
          </>
        )}

        <div className="pt-4">
          <Button 
            onClick={handleTestRequest} 
            disabled={isLoading || !config.url || !validateUrl(config.url) || !config.enabled}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" /> 
            {isLoading ? "Enviando..." : "Probar envío"}
          </Button>
        </div>
        
        {(testResponse || config.lastResponse) && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-md font-medium">
                Resultado de la última prueba
              </Label>
              <div className="text-xs text-gray-500">
                {config.lastResponse && (
                  <span>
                    Última actualización: {new Date(config.lastResponse.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  getResponseBadgeColor(testResponse?.status || config.lastResponse?.status || 0)
                }`}>
                  Código {testResponse?.status || config.lastResponse?.status}
                </span>
                <span className="text-sm text-gray-600">
                  {getResponseMessage(testResponse?.status || config.lastResponse?.status || 0)}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Respuesta del servidor:</Label>
                <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
                  {testResponse?.data || config.lastResponse?.data || "Sin datos"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HttpConfigSettings;

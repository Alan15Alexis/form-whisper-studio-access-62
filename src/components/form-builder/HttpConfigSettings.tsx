
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { HttpConfig, HttpHeader, FormField } from "@/types/form";
import { Plus, Trash, Send, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface HttpConfigSettingsProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  isAdmin: boolean;
  formFields?: FormField[];
}

const DEFAULT_JSON_BODY = `{
  "id_del_elemento": "{{respuesta}}"
}`;

const DEFAULT_CONFIG: HttpConfig = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  body: DEFAULT_JSON_BODY,
};

function insertAtCursor(node: HTMLTextAreaElement | HTMLInputElement | null, text: string) {
  if (!node) return;
  const start = node.selectionStart || 0;
  const end = node.selectionEnd || 0;
  const value = node.value || "";
  node.value = value.slice(0, start) + text + value.slice(end);
  node.selectionStart = node.selectionEnd = start + text.length;
  // Dispatch input to trigger React onChange
  node.dispatchEvent(new Event("input", { bubbles: true }));
}

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

  // For variable insertion
  const [selectedHeaderField, setSelectedHeaderField] = useState<string>("");
  const [selectedBodyField, setSelectedBodyField] = useState<string>("");

  // Refs to manage insertion cursor location
  const [headerFocusIndex, setHeaderFocusIndex] = useState<number | null>(null);
  const headerRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const bodyTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  if (!isAdmin) {
    return null;
  }

  const handleToggleEnabled = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, url: e.target.value });
  };

  const handleAddHeader = () => {
    const newHeaders = [...config.headers, { key: "", value: "" }];
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = config.headers.filter((_, i) => i !== index);
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...config.headers];
    newHeaders[index][field] = value;
    onConfigChange({ ...config, headers: newHeaders });
  };

  // Insert dynamic field in header
  const handleInsertHeaderVariable = (index: number, field: "key" | "value", variable: string) => {
    const ref = headerRefs.current[index];
    insertAtCursor(ref, `{{${variable}}}`);
    setSelectedHeaderField("");
  };

  // Insert dynamic field in body
  const handleInsertBodyVariable = (variable: string) => {
    insertAtCursor(bodyTextareaRef.current, `{{${variable}}}`);
    setSelectedBodyField("");
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onConfigChange({ ...config, body: e.target.value });
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateJson = (json: string) => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  };

  // Simulated user responses for testing (should be replaced by real data on actual submit)
  const getDummyResponses = () => {
    const responses: Record<string, string> = {};
    for (const field of formFields) {
      responses[field.id] = `[${field.label || field.id}]`;
    }
    return responses;
  };

  // Replace all {{campoId}} with dummy values
  function interpolateVariables(input: string, responses: Record<string, string>) {
    return input.replace(/{{(.*?)}}/g, (_, varName: string) => {
      return responses[varName] !== undefined ? responses[varName] : `{{${varName}}}`;
    });
  }

  const handleTestRequest = async () => {
    // Validate URL
    if (!validateUrl(config.url)) {
      toast({
        title: "URL inválida",
        description: "Por favor, ingresa una URL válida",
        variant: "destructive",
      });
      return;
    }

    // Validate JSON
    if (!validateJson(config.body)) {
      toast({
        title: "JSON inválido",
        description: "El cuerpo de la solicitud debe ser un JSON válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create headers object
      const headers = new Headers();
      config.headers.forEach((header) => {
        let value = header.value || "";
        // Dynamic vars for headers too!
        value = interpolateVariables(value, getDummyResponses());
        if (header.key && value) {
          headers.append(header.key, value);
        }
      });
      headers.append("Content-Type", "application/json");

      // Replace variables in body
      const interpolatedBody = interpolateVariables(config.body, getDummyResponses());

      // Make request
      const response = await fetch(config.url, {
        method: config.method,
        headers,
        body: interpolatedBody,
      });

      const data = await response.text();
      const responseObj = { 
        status: response.status, 
        data, 
        timestamp: new Date().toISOString() 
      };
      
      // Update state
      setTestResponse({ status: response.status, data });
      
      // Update config with last response
      onConfigChange({
        ...config,
        lastResponse: responseObj
      });

      toast({
        title: `Respuesta: ${response.status}`,
        description: response.ok 
          ? "Solicitud enviada con éxito" 
          : "Error al enviar la solicitud",
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      setTestResponse({ status: 0, data: error instanceof Error ? error.message : "Error desconocido" });
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Toggle para activar/desactivar */}
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
        
        {/* URL del endpoint */}
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
        
        {/* Tipo de solicitud */}
        <div className="space-y-2">
          <Label className="text-md font-medium">Tipo de solicitud</Label>
          <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-gray-400">
            POST
          </div>
          <p className="text-xs text-gray-500">
            En futuras versiones se agregarán más métodos (GET, PUT, DELETE)
          </p>
        </div>
        
        {/* Headers */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-md font-medium">Headers</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddHeader}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Agregar Header
            </Button>
          </div>
          {/* Selector de campo para variables en header */}
          {config.enabled && formFields.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2 pb-2">
              <Label className="text-xs">Insertar variable:</Label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedHeaderField}
                onChange={e => setSelectedHeaderField(e.target.value)}
              >
                <option value="">Selecciona pregunta...</option>
                {formFields.map(f => (
                  <option value={f.id} key={f.id}>{f.label} (ID: {f.id})</option>
                ))}
              </select>
              <span className="text-xs text-gray-400 hidden md:inline">Haz clic en un campo header para insertar</span>
            </div>
          )}
          
          {config.headers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Clave</TableHead>
                  <TableHead className="w-[50%]">Valor</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.headers.map((header, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={header.key}
                        onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                        placeholder="Authorization"
                        ref={el => headerRefs.current[index] = el}
                        onFocus={() => setHeaderFocusIndex(index)}
                        onClick={() => {
                          // Insert variable if header selected & focus
                          if (selectedHeaderField) {
                            handleInsertHeaderVariable(index, "key", selectedHeaderField);
                          }
                        }}
                        disabled={!config.enabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={header.value}
                        onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                        placeholder="Bearer eyJ..."
                        ref={el => headerRefs.current[index] = el}
                        onFocus={() => setHeaderFocusIndex(index)}
                        onClick={() => {
                          if (selectedHeaderField) {
                            handleInsertHeaderVariable(index, "value", selectedHeaderField);
                          }
                        }}
                        disabled={!config.enabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHeader(index)}
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
        
        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="request-body" className="text-md font-medium">Body (JSON)</Label>
          <div className="flex flex-col md:flex-row gap-2 pb-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!config.enabled}
              onClick={() => bodyTextareaRef.current && setSelectedBodyField("")}
              className="hidden"
            >
              Reset
            </Button>
            <select
              className="border rounded px-2 py-1 text-sm w-full max-w-xs"
              value={selectedBodyField}
              disabled={!config.enabled}
              onChange={e => {
                setSelectedBodyField(e.target.value);
                if (e.target.value && bodyTextareaRef.current) {
                  handleInsertBodyVariable(e.target.value);
                }
              }}
            >
              <option value="">Añadir campo dinámico...</option>
              {formFields.map(f => (
                <option value={f.id} key={f.id}>{f.label} (ID: {f.id})</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 hidden md:inline">
              Selecciona y se insertará donde esté el cursor
            </span>
          </div>
          <Textarea
            id="request-body"
            value={config.body}
            onChange={handleBodyChange}
            rows={6}
            className="font-mono text-sm"
            ref={bodyTextareaRef}
            disabled={!config.enabled}
          />
          {!validateJson(config.body) && (
            <p className="text-xs text-red-500">El JSON no es válido</p>
          )}
        </div>
        
        {/* Test Button */}
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
        
        {/* Response View */}
        {(testResponse || config.lastResponse) && (
          <div className="space-y-2">
            <Label className="text-md font-medium">
              Vista de Respuesta
              {config.lastResponse && (
                <span className="text-xs text-gray-500 ml-2">
                  (Última actualización: {new Date(config.lastResponse.timestamp).toLocaleString()})
                </span>
              )}
            </Label>
            <div className="border rounded-md p-4 bg-gray-50 max-h-48 overflow-auto font-mono text-sm">
              <div className={`font-bold ${(testResponse?.status || config.lastResponse?.status) === 200 ? 'text-green-600' : 'text-red-600'}`}>
                Status: {testResponse?.status || config.lastResponse?.status}
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {testResponse?.data || config.lastResponse?.data || ""}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HttpConfigSettings;


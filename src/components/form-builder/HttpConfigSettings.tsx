
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
import { HttpConfig, HttpHeader } from "@/types/form";
import { Plus, Trash, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface HttpConfigSettingsProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  isAdmin: boolean;
}

const DEFAULT_JSON_BODY = `{
  "id_del_elemento": "respuesta"
}`;

const DEFAULT_CONFIG: HttpConfig = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  body: DEFAULT_JSON_BODY,
};

const HttpConfigSettings = ({ 
  config = DEFAULT_CONFIG, 
  onConfigChange,
  isAdmin
}: HttpConfigSettingsProps) => {
  const [testResponse, setTestResponse] = useState<{ status: number; data: string } | null>(
    config.lastResponse 
      ? { status: config.lastResponse.status, data: config.lastResponse.data } 
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

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
        if (header.key && header.value) {
          headers.append(header.key, header.value);
        }
      });
      headers.append("Content-Type", "application/json");

      // Make request
      const response = await fetch(config.url, {
        method: config.method,
        headers,
        body: config.body,
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
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Envío de Datos por HTTP</CardTitle>
        <CardDescription>
          Configura el envío automático de datos mediante solicitudes HTTP
        </CardDescription>
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
          <div className="flex justify-between items-center">
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
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={header.value}
                        onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                        placeholder="Bearer eyJ..."
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHeader(index)}
                        className="h-8 w-8"
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
          <Textarea
            id="request-body"
            value={config.body}
            onChange={handleBodyChange}
            rows={6}
            className="font-mono text-sm"
          />
          {!validateJson(config.body) && (
            <p className="text-xs text-red-500">El JSON no es válido</p>
          )}
        </div>
        
        {/* Test Button */}
        <div className="pt-4">
          <Button 
            onClick={handleTestRequest} 
            disabled={isLoading || !config.url || !validateUrl(config.url)}
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


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
import { HttpConfig, FormField } from "@/types/form";
import { Plus, Trash, Send, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  { id: 1, key: "id_del_elemento", fieldId: "" }
];

const DEFAULT_CONFIG: HttpConfig = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  // Usaremos nuestra estructura custom, luego serializamos para enviar
  body: "",
};

function getBodyFieldsFromConfigBody(body: string): BodyField[] {
  // Intentar parsear body como array de campos, de lo contrario usar por defecto
  try {
    const arr = JSON.parse(body);
    if (Array.isArray(arr) && arr.every(f => typeof f.id === "number" && typeof f.key === "string" && typeof f.fieldId === "string"))
      return arr;
    // Intentar parsear como objeto clásico {key: value}
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

// Convierte array [{key,fieldId}] en objeto { key1: valorEjemplo1, ... }
function getPreviewJson(fields: BodyField[], formFields: FormField[]) {
  const example: Record<string, string> = {};
  for (const f of fields) {
    if (!f.key) continue;
    const campo = formFields.find(ff => ff.id === f.fieldId);
    example[f.key] = campo ? `[${campo.label || campo.id}]` : "";
  }
  return example;
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

  // States para body-fields:
  const bodyFields: BodyField[] = config.enabled
    ? getBodyFieldsFromConfigBody(config.body || "[]")
    : [];

  const [bodyIdCounter, setBodyIdCounter] = useState(
    bodyFields.length ? Math.max(...bodyFields.map(b => b.id))+1 : 2
  );

  // STATIC HEADERS
  const handleToggleEnabled = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, url: e.target.value });
  };

  const handleAddHeader = () => {
    const newId = config.headers.length
      ? Math.max(...config.headers.map(h => h.id ?? 0)) + 1
      : 1;
    const newHeaders = [
      ...config.headers, 
      { id: newId, key: "", value: "" }
    ];
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleRemoveHeader = (id: number) => {
    const newHeaders = config.headers.filter(h => h.id !== id);
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleHeaderChange = (id: number, field: "key" | "value", value: string) => {
    const newHeaders = config.headers.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    );
    onConfigChange({ ...config, headers: newHeaders });
  };

  // BODY dynamic fields
  const handleAddBodyField = () => {
    const updated = [
      ...bodyFields,
      {
        id: bodyIdCounter,
        key: "",
        fieldId: formFields.length > 0 ? formFields[0].id : ""
      }
    ];
    onConfigChange({
      ...config,
      body: JSON.stringify(updated)
    });
    setBodyIdCounter(c => c + 1);
  };

  const handleRemoveBodyField = (id: number) => {
    const updated = bodyFields.filter(b => b.id !== id);
    onConfigChange({
      ...config,
      body: JSON.stringify(updated)
    });
  };

  const handleBodyFieldChange = (id: number, field: "key" | "fieldId", value: string) => {
    const updated = bodyFields.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    );
    onConfigChange({
      ...config,
      body: JSON.stringify(updated)
    });
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Simula respuestas dummy para previsualización del JSON request
  function getDummyResponses() {
    const r: Record<string, string> = {};
    for (const campo of formFields) {
      r[campo.id] = `[${campo.label || campo.id}]`;
    }
    return r;
  }

  // Convierte fields a objeto y los sustituye por respuestas reales al enviar
  function buildRequestBody(fields: BodyField[], responses: Record<string, string>) {
    const obj: Record<string, any> = {};
    for (const f of fields) {
      if (!f.key) continue;
      obj[f.key] = responses[f.fieldId] !== undefined ? responses[f.fieldId] : "";
    }
    return obj;
  }

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

      // Construimos el body con los campos y respuestas dummy
      const requestBodyObj = buildRequestBody(bodyFields, getDummyResponses());
      const requestBodyJSON = JSON.stringify(requestBodyObj);

      const response = await fetch(config.url, {
        method: config.method,
        headers,
        body: requestBodyJSON,
      });

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

  // Preview JSON actualizado
  const previewJsonObj = getPreviewJson(bodyFields, formFields);

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
          <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-gray-400">
            POST
          </div>
          <p className="text-xs text-gray-500">
            En futuras versiones se agregarán más métodos (GET, PUT, DELETE)
          </p>
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
                  <TableHead className="w-[5%]">ID</TableHead>
                  <TableHead className="w-[40%]">Clave</TableHead>
                  <TableHead className="w-[50%]">Valor</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.headers.map((header) => (
                  <TableRow key={header.id}>
                    <TableCell className="font-mono text-xs text-center">{header.id}</TableCell>
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

        {/* BODY DYNAMIC FIELDS */}
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
                <TableHead className="w-[7%]">ID</TableHead>
                <TableHead className="w-[42%]">Clave personalizada</TableHead>
                <TableHead className="w-[40%]">Valor (Pregunta)</TableHead>
                <TableHead className="w-[8%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bodyFields.map((bodyField) => (
                <TableRow key={bodyField.id}>
                  <TableCell className="font-mono text-xs text-center">{bodyField.id}</TableCell>
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
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={bodyField.fieldId}
                      disabled={!config.enabled}
                      onChange={e => handleBodyFieldChange(bodyField.id, "fieldId", e.target.value)}
                    >
                      <option value="">Selecciona una pregunta…</option>
                      {formFields.map(f => (
                        <option value={f.id} key={f.id}>{f.label}</option>
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* JSON Preview */}
        <div className="space-y-2">
          <Label className="text-md font-medium">Vista previa del JSON enviado</Label>
          <div className="border rounded-md p-4 bg-gray-50 max-h-64 overflow-auto font-mono text-sm">
            <pre className="whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(previewJsonObj, null, 2)}
            </pre>
          </div>
        </div>

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


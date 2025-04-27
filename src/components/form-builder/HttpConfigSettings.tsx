
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Settings, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { HttpConfig, FormField } from "@/types/form";
import { useHttpConfig } from "@/hooks/useHttpConfig";
import HttpHeadersEditor from "./HttpHeadersEditor";
import HttpResponsePreview from "./HttpResponsePreview";
import { validateUrl } from "@/utils/http-utils";

interface HttpConfigSettingsProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  isAdmin: boolean;
  formFields?: FormField[];
}

const DEFAULT_CONFIG: HttpConfig = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  body: "",
};

const HttpConfigSettings = ({
  config = DEFAULT_CONFIG,
  onConfigChange,
  isAdmin,
  formFields = [],
}: HttpConfigSettingsProps) => {
  const {
    testResponse,
    isLoading,
    editableJsonPreview,
    jsonError,
    handleJsonPreviewChange,
    handleToggleEnabled,
    handleUrlChange,
    handleMethodChange,
    handleTestRequest,
  } = useHttpConfig({ config, onConfigChange, formFields });

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
        
        <HttpHeadersEditor 
          config={config}
          onConfigChange={onConfigChange}
          enabled={config.enabled}
        />

        {config.method === "POST" && (
          <div className="space-y-2">
            <Label className="text-md font-medium">JSON del Body (Editable)</Label>
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
        
        <HttpResponsePreview 
          testResponse={testResponse}
          config={config}
        />
      </CardContent>
    </Card>
  );
};

export default HttpConfigSettings;

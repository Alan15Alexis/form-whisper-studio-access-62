
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HttpConfig } from "@/types/form";
import HttpConfigSettings from "./HttpConfigSettings";
import { useAuth } from "@/contexts/AuthContext";

const FORM_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Naranja", value: "#f97316" },
  { name: "Gris", value: "#6b7280" },
  { name: "Turquesa", value: "#06b6d4" },
];

interface FormSettingsProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
  allowViewOwnResponses?: boolean;
  onAllowViewOwnResponsesChange?: (allow: boolean) => void;
  allowEditOwnResponses?: boolean;
  onAllowEditOwnResponsesChange?: (allow: boolean) => void;
  formColor?: string;
  onFormColorChange?: (color: string) => void;
  httpConfig?: HttpConfig;
  onHttpConfigChange?: (config: HttpConfig) => void;
  formFields?: any[];
}

// Cambia la declaración del componente para aceptar formFields
const FormSettings = ({
  isPrivate,
  onPrivateChange,
  allowViewOwnResponses,
  onAllowViewOwnResponsesChange,
  allowEditOwnResponses,
  onAllowEditOwnResponsesChange,
  formColor,
  onFormColorChange,
  httpConfig,
  onHttpConfigChange,
  formFields = []
}: FormSettingsProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  
  const defaultHttpConfig: HttpConfig = {
    enabled: false,
    url: "",
    method: "POST",
    headers: [],
    body: `{
  "id_del_elemento": "respuesta"
}`,
  };

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch
              id="private-form"
              checked={isPrivate}
              onCheckedChange={onPrivateChange}
              className="data-[state=checked]:bg-[#686df3]"
            />
            <div>
              <Label htmlFor="private-form" className="text-lg font-medium">Formulario Privado</Label>
              <p className="text-sm text-gray-500">
                Cuando está habilitado, solo usuarios especificados pueden acceder a este formulario
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Label className="text-lg font-medium">Color del formulario</Label>
            <Select value={formColor || FORM_COLORS[0].value} onValueChange={onFormColorChange}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  <span className="inline-flex items-center">
                    <span className="w-5 h-5 rounded-full mr-2" style={{ background: formColor || FORM_COLORS[0].value }} />
                    {
                      FORM_COLORS.find(c => c.value === formColor)?.name ||
                      FORM_COLORS[0].name
                    }
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FORM_COLORS.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <span className="inline-flex items-center">
                      <span className="w-5 h-5 rounded-full mr-2" style={{ background: color.value }} />
                      {color.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              id="allow-view-own-responses"
              checked={!!allowViewOwnResponses}
              onCheckedChange={onAllowViewOwnResponsesChange}
            />
            <div>
              <Label htmlFor="allow-view-own-responses" className="text-lg font-medium">
                Permitir ver respuestas propias
              </Label>
              <p className="text-sm text-gray-500">
                Si está activo, los usuarios podrán ver solo sus propias respuestas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              id="allow-edit-own-responses"
              checked={!!allowEditOwnResponses}
              onCheckedChange={onAllowEditOwnResponsesChange}
            />
            <div>
              <Label htmlFor="allow-edit-own-responses" className="text-lg font-medium">
                Permitir editar respuestas propias
              </Label>
              <p className="text-sm text-gray-500">
                Si está activo, podrán modificar sus respuestas después de enviarlas.
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Configuración HTTP - Solo visible para administradores */}
      <HttpConfigSettings 
        config={httpConfig || defaultHttpConfig}
        onConfigChange={config => onHttpConfigChange && onHttpConfigChange(config)}
        isAdmin={isAdmin}
        formFields={formFields}
      />
    </div>
  );
};

export default FormSettings;

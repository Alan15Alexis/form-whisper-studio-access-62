
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FORM_COLORS = [{
  name: "Azul",
  value: "#3b82f6"
}, {
  name: "Verde",
  value: "#22c55e"
}, {
  name: "Rojo",
  value: "#ef4444"
}, {
  name: "Morado",
  value: "#8b5cf6"
}, {
  name: "Naranja",
  value: "#f97316"
}, {
  name: "Gris",
  value: "#6b7280"
}, {
  name: "Turquesa",
  value: "#06b6d4"
}];

interface GeneralSettingsCardProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
  formColor?: string;
  onFormColorChange?: (color: string) => void;
}

const GeneralSettingsCard = ({
  isPrivate,
  onPrivateChange,
  formColor,
  onFormColorChange
}: GeneralSettingsCardProps) => {
  return (
    <Card className="p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium mb-4">Configuración General</h3>
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
                  <span 
                    className="w-5 h-5 rounded-full mr-2" 
                    style={{ background: formColor || FORM_COLORS[0].value }} 
                  />
                  {FORM_COLORS.find(c => c.value === formColor)?.name || FORM_COLORS[0].name}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FORM_COLORS.map(color => (
                <SelectItem key={color.value} value={color.value}>
                  <span className="inline-flex items-center">
                    <span 
                      className="w-5 h-5 rounded-full mr-2" 
                      style={{ background: color.value }} 
                    />
                    {color.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default GeneralSettingsCard;

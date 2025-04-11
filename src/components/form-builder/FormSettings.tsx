
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FormSettingsProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
}

const FormSettings = ({ isPrivate, onPrivateChange }: FormSettingsProps) => {
  return (
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
      </div>
    </Card>
  );
};

export default FormSettings;

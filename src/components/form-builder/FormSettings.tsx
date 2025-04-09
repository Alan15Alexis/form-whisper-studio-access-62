
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FormSettingsProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
}

const FormSettings = ({ isPrivate, onPrivateChange }: FormSettingsProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Switch
            id="private-form"
            checked={isPrivate}
            onCheckedChange={onPrivateChange}
          />
          <div>
            <Label htmlFor="private-form" className="text-lg font-medium">Private Form</Label>
            <p className="text-sm text-gray-500">
              When enabled, only specified users can access this form
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FormSettings;

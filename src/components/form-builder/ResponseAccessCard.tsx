
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ResponseAccessCardProps {
  allowViewOwnResponses?: boolean;
  onAllowViewOwnResponsesChange?: (allow: boolean) => void;
  allowEditOwnResponses?: boolean;
  onAllowEditOwnResponsesChange?: (allow: boolean) => void;
}

const ResponseAccessCard = ({
  allowViewOwnResponses,
  onAllowViewOwnResponsesChange,
  allowEditOwnResponses,
  onAllowEditOwnResponsesChange
}: ResponseAccessCardProps) => {
  return (
    <Card className="p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium mb-4">Acceso a Respuestas</h3>
      <div className="space-y-6">
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
  );
};

export default ResponseAccessCard;

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HttpConfig, ScoreRange } from "@/types/form";
import HttpConfigSettings from "./HttpConfigSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  formId?: string;
  showTotalScore?: boolean;
  onToggleFormScoring?: (enabled: boolean) => void;
}

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
  formFields = [],
  formId = "",
  showTotalScore = false,
  onToggleFormScoring = () => {}
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

  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues);

  // Initialize score ranges from fields
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>(() => {
    // Initialize with existing score ranges from the form fields
    if (formFields && formFields.length > 0) {
      const fieldWithRanges = formFields.find(field => field.scoreRanges && field.scoreRanges.length > 0);
      if (fieldWithRanges?.scoreRanges) {
        console.log("Initializing score ranges from fields:", fieldWithRanges.scoreRanges);
        return [...fieldWithRanges.scoreRanges];
      }
    }
    return [];
  });

  // Sync score ranges when fields change
  useEffect(() => {
    if (formFields && formFields.length > 0 && showTotalScore) {
      const fieldWithRanges = formFields.find(field => field.scoreRanges && field.scoreRanges.length > 0);
      if (fieldWithRanges?.scoreRanges && fieldWithRanges.scoreRanges.length > 0) {
        console.log("Syncing score ranges from fields:", fieldWithRanges.scoreRanges);
        setScoreRanges([...fieldWithRanges.scoreRanges]);
      }
    }
  }, [formFields, showTotalScore]);

  // Score range management functions
  const addScoreRange = () => {
    const lastRange = scoreRanges[scoreRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = newMin + 10;
    
    const newRanges = [
      ...scoreRanges, 
      { min: newMin, max: newMax, message: `Mensaje para puntuación ${newMin}-${newMax}` }
    ];
    
    setScoreRanges(newRanges);
    
    // Update all fields that have numeric values with the new ranges
    updateFieldsWithScoreRanges(newRanges);
    console.log("Added new score range:", newRanges[newRanges.length - 1]);
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    const updatedRanges = [...scoreRanges];
    updatedRanges[index] = { 
      ...updatedRanges[index], 
      [field]: typeof value === 'string' ? value : Number(value)
    };
    setScoreRanges(updatedRanges);
    
    // Update all fields with the updated ranges
    updateFieldsWithScoreRanges(updatedRanges);
    console.log("Updated score range:", { index, field, value });
  };

  const removeScoreRange = (index: number) => {
    const updatedRanges = scoreRanges.filter((_, i) => i !== index);
    setScoreRanges(updatedRanges);
    
    // Update all fields with the updated ranges
    updateFieldsWithScoreRanges(updatedRanges);
    console.log("Removed score range at index:", index);
  };

  // This function will update all fields with the current score ranges and trigger the form update
  const updateFieldsWithScoreRanges = (ranges: ScoreRange[]) => {
    if (!onToggleFormScoring) return;
    
    // First make sure all field scoreRanges are updated in the parent component
    const updatedFields = formFields.map(field => {
      if (field.hasNumericValues) {
        return { ...field, scoreRanges: ranges };
      }
      return field;
    });
    
    // Now trigger the form update with scoring enabled and updated ranges
    if (formId) {
      // This will trigger the form to save with the updated ranges
      // Note: We pass the current showTotalScore value to maintain its state
      onToggleFormScoring(showTotalScore);
      console.log("Updated score ranges in form configuration:", ranges);
    }
  };

  return (
    <div className="space-y-8">
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
        </div>
      </Card>

      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Puntuación y Resultados</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch
              id="show-total-score"
              checked={showTotalScore}
              onCheckedChange={(checked) => {
                onToggleFormScoring(checked);
                if (checked && scoreRanges.length === 0) {
                  // If enabling scoring but no ranges, add a default range
                  setTimeout(() => {
                    addScoreRange();
                  }, 100);
                }
              }}
              disabled={!hasFieldsWithNumericValues}
              className="data-[state=checked]:bg-[#686df3]"
            />
            <div>
              <Label htmlFor="show-total-score" className="text-lg font-medium">Mostrar puntuación total</Label>
              <p className="text-sm text-gray-500">
                {hasFieldsWithNumericValues 
                  ? "Muestra la puntuación total al finalizar el formulario" 
                  : "Para activar, configura valores numéricos en al menos un campo"}
              </p>
            </div>
          </div>
          
          {!hasFieldsWithNumericValues && (
            <div className="p-4 bg-primary/5 rounded-md text-sm">
              <p className="font-medium">Para habilitar la puntuación total:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Ve a la pestaña "Campos"</li>
                <li>Selecciona un campo y haz clic en el ícono de configuración</li>
                <li>Activa "Habilitar valores numéricos"</li>
                <li>Asigna valores numéricos a las opciones</li>
              </ol>
            </div>
          )}
          
          {/* Score Ranges Configuration */}
          {showTotalScore && (
            <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Rangos de puntuación y mensajes</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addScoreRange}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Añadir rango
                </Button>
              </div>
              
              {scoreRanges.length === 0 && showTotalScore && (
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay rangos definidos. Los rangos permiten mostrar mensajes personalizados según la puntuación obtenida.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                {scoreRanges.map((range, index) => (
                  <div key={index} className="p-3 border rounded-md bg-background">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label htmlFor={`min-${index}`}>Mínimo</Label>
                        <Input
                          id={`min-${index}`}
                          type="number"
                          value={range.min}
                          onChange={(e) => updateScoreRange(index, 'min', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`max-${index}`}>Máximo</Label>
                        <Input
                          id={`max-${index}`}
                          type="number"
                          value={range.max}
                          onChange={(e) => updateScoreRange(index, 'max', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`message-${index}`}>Mensaje</Label>
                      <Input
                        id={`message-${index}`}
                        value={range.message}
                        onChange={(e) => updateScoreRange(index, 'message', e.target.value)}
                        className="mt-1"
                        placeholder="Mensaje que se mostrará para este rango de puntuación"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-red-500 hover:text-red-700"
                      onClick={() => removeScoreRange(index)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                ))}

                {scoreRanges.length === 0 && (
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground italic">
                      No hay rangos definidos. Añada rangos para mostrar mensajes personalizados según la puntuación.
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addScoreRange}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
      
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

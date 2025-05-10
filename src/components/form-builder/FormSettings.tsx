
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
import { Trash, Plus, AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

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
  onSaveScoreRanges?: (ranges: ScoreRange[]) => void;
  externalScoreRanges?: ScoreRange[];
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
  onToggleFormScoring = () => {},
  onSaveScoreRanges = () => {},
  externalScoreRanges = []
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

  // Initialize score ranges from props or existing fields
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  
  // Track when the scoring toggle changes locally
  const [isScoringEnabled, setIsScoringEnabled] = useState<boolean>(!!showTotalScore);
  // Track if there are unsaved changes to score ranges
  const [hasUnsavedRanges, setHasUnsavedRanges] = useState<boolean>(false);
  // Track if there are unsaved scoring toggle changes
  const [hasUnsavedToggle, setHasUnsavedToggle] = useState<boolean>(false);

  console.log("FormSettings - showTotalScore prop:", showTotalScore);
  console.log("FormSettings - external score ranges:", externalScoreRanges);
  
  // Init state from props or fields
  useEffect(() => {
    console.log("Setting score ranges from externalScoreRanges:", externalScoreRanges);
    console.log("Current showTotalScore value:", showTotalScore);
    
    // First priority: use externally provided score ranges if available
    if (externalScoreRanges && externalScoreRanges.length > 0) {
      setScoreRanges([...externalScoreRanges]);
      return;
    }
    
    // Second priority: look for ranges in fields if scoring is enabled
    if (showTotalScore && formFields && formFields.length > 0) {
      const fieldWithRanges = formFields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges && fieldWithRanges.scoreRanges.length > 0) {
        console.log("Setting score ranges from fields:", fieldWithRanges.scoreRanges);
        setScoreRanges([...fieldWithRanges.scoreRanges]);
        return;
      }
    }
    
    // If no ranges found and we're toggling on scoring, create a default range
    if (showTotalScore && scoreRanges.length === 0) {
      console.log("Creating default score range");
      setScoreRanges([{ min: 0, max: 10, message: "Mensaje para puntuación 0-10" }]);
    }
  }, [externalScoreRanges, formFields, showTotalScore]);
  
  // Better sync local state with props
  useEffect(() => {
    console.log("showTotalScore prop changed to:", showTotalScore);
    setIsScoringEnabled(!!showTotalScore);
    setHasUnsavedToggle(false); // Reset when props change
  }, [showTotalScore]);

  // Score range management functions
  const addScoreRange = () => {
    if (scoreRanges.length === 0) {
      // First range
      const newRanges = [
        { min: 0, max: 10, message: "Mensaje para puntuación 0-10" }
      ];
      setScoreRanges(newRanges);
      setHasUnsavedRanges(true);
      
      toast({
        title: "Rango añadido",
        description: `Se añadió un nuevo rango de puntuación: 0-10`,
      });
      return;
    }
    
    const lastRange = scoreRanges[scoreRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = newMin + 10;
    
    const newRanges = [
      ...scoreRanges, 
      { min: newMin, max: newMax, message: `Mensaje para puntuación ${newMin}-${newMax}` }
    ];
    
    setScoreRanges(newRanges);
    setHasUnsavedRanges(true);
    
    toast({
      title: "Rango añadido",
      description: `Se añadió un nuevo rango de puntuación: ${newMin}-${newMax}`,
    });
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    if (!scoreRanges[index]) return;
    
    const updatedRanges = [...scoreRanges];
    updatedRanges[index] = { 
      ...updatedRanges[index], 
      [field]: typeof value === 'string' ? value : Number(value)
    };
    setScoreRanges(updatedRanges);
    setHasUnsavedRanges(true);
  };

  const removeScoreRange = (index: number) => {
    const updatedRanges = scoreRanges.filter((_, i) => i !== index);
    setScoreRanges(updatedRanges);
    setHasUnsavedRanges(true);
    
    toast({
      title: "Rango eliminado",
      description: "El rango de puntuación ha sido eliminado",
    });
  };

  // Save score ranges explicitly when the save button is clicked
  const saveScoreRanges = () => {
    if (!onSaveScoreRanges) return;
    
    console.log("Saving score ranges with toggle state:", isScoringEnabled);
    console.log("Ranges to save:", scoreRanges);
    
    // Apply the toggle change first if it's unsaved
    if (hasUnsavedToggle) {
      console.log("Applying toggle change to:", isScoringEnabled);
      onToggleFormScoring(isScoringEnabled);
      setHasUnsavedToggle(false);
    }
    
    // Only if scoring is enabled, save the ranges too
    if (isScoringEnabled) {
      onSaveScoreRanges(scoreRanges);
    } else {
      // If scoring is disabled, we still need to save the toggle state
      console.log("Scoring disabled, applying toggle change to false");
      onToggleFormScoring(false);
    }
    
    // Update the flags
    setHasUnsavedRanges(false);
    
    toast({
      title: "Cambios guardados",
      description: "La configuración de puntuación ha sido guardada correctamente",
    });
  };

  // Handle toggle of scoring feature
  const handleToggleScoringFeature = (enabled: boolean) => {
    console.log("Toggle scoring feature called with:", enabled);
    setIsScoringEnabled(enabled);
    setHasUnsavedToggle(true);
    
    // Only add a range if enabling and no ranges exist yet
    if (enabled && scoreRanges.length === 0) {
      addScoreRange();
    }
  };

  return (
    <div className="space-y-8">
      {/* General Settings Card */}
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

      {/* Scoring Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Puntuación y Resultados</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch
              id="show-total-score"
              checked={isScoringEnabled}
              onCheckedChange={handleToggleScoringFeature}
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

          {/* Unsaved changes alert for toggle */}
          {hasUnsavedToggle && (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tienes cambios sin guardar en la configuración de puntuación. Haz clic en "Guardar cambios" para aplicar los cambios.
              </AlertDescription>
            </Alert>
          )}
          
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
          
          {/* Score Ranges Configuration - Solo mostrar cuando isScoringEnabled está activo */}
          {isScoringEnabled && (
            <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Rangos de puntuación y mensajes</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addScoreRange}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Añadir rango
                  </Button>
                  <Button 
                    type="button"
                    variant={hasUnsavedRanges || hasUnsavedToggle ? "default" : "outline"}
                    size="sm"
                    onClick={saveScoreRanges}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" /> Guardar cambios
                  </Button>
                </div>
              </div>
              
              {scoreRanges.length === 0 && (
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
              
              {(hasUnsavedRanges || hasUnsavedToggle) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ¡Tienes cambios sin guardar! Haz clic en "Guardar cambios" para aplicar la configuración de puntuación.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Access to Responses Card */}
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
      
      {/* HTTP Configuration */}
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

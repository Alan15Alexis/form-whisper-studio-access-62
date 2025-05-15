
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
import { supabase } from '@/integrations/supabase/client';

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
  isScoringEnabled?: boolean;
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
  externalScoreRanges = [],
  isScoringEnabled = false
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
  
  // Track if there are unsaved changes to score ranges
  const [hasUnsavedRanges, setHasUnsavedRanges] = useState<boolean>(false);

  // Debug logs to track state
  console.log("FormSettings - Component Rendered");
  console.log("FormSettings - showTotalScore prop:", showTotalScore);
  console.log("FormSettings - external score ranges:", JSON.stringify(externalScoreRanges));
  console.log("FormSettings - isScoringEnabled prop:", isScoringEnabled);
  
  // Init state from props or fields
  useEffect(() => {
    console.log("FormSettings - useEffect running for score ranges initialization");
    console.log("Current external score ranges:", JSON.stringify(externalScoreRanges));
    console.log("Current isScoringEnabled value:", isScoringEnabled);
    
    // First priority: use externally provided score ranges if available
    if (externalScoreRanges && externalScoreRanges.length > 0) {
      console.log("Setting score ranges from externalScoreRanges");
      // Create deep copy without any shared references
      setScoreRanges(JSON.parse(JSON.stringify(externalScoreRanges)));
      return;
    }
    
    // Second priority: look for ranges in fields if scoring is enabled
    if ((showTotalScore || isScoringEnabled) && formFields && formFields.length > 0) {
      const fieldWithRanges = formFields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges && fieldWithRanges.scoreRanges.length > 0) {
        console.log("Setting score ranges from fields:", JSON.stringify(fieldWithRanges.scoreRanges));
        // Create deep copy without any shared references
        setScoreRanges(JSON.parse(JSON.stringify(fieldWithRanges.scoreRanges)));
        return;
      }
    }
    
    // If scoring is enabled but no ranges found, create a default range
    if ((showTotalScore || isScoringEnabled) && scoreRanges.length === 0) {
      console.log("Creating default score range");
      setScoreRanges([{ min: 0, max: 10, message: "Mensaje para puntuación 0-10" }]);
    }
  }, [externalScoreRanges, formFields, showTotalScore, isScoringEnabled]);
  
  // Reset unsaved changes flag when external props change
  useEffect(() => {
    console.log("FormSettings - Resetting unsaved changes flag");
    setHasUnsavedRanges(false);
  }, [externalScoreRanges, isScoringEnabled]);

  // Score range management functions
  const addScoreRange = () => {
    console.log("Adding new score range");
    
    if (scoreRanges.length === 0) {
      // First range
      const newRanges = [
        { min: 0, max: 10, message: "Mensaje para puntuación 0-10" }
      ];
      setScoreRanges(newRanges);
      setHasUnsavedRanges(true);
      
      toast({
        title: "Rango añadido",
        description: "Se añadió un nuevo rango de puntuación: 0-10",
        variant: "default",
      });
      return;
    }
    
    const lastRange = scoreRanges[scoreRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = newMin + 10;
    
    // Create new array to avoid reference issues
    const newRanges = [
      ...JSON.parse(JSON.stringify(scoreRanges)), 
      { min: newMin, max: newMax, message: `Mensaje para puntuación ${newMin}-${newMax}` }
    ];
    
    console.log("New score ranges:", JSON.stringify(newRanges));
    setScoreRanges(newRanges);
    setHasUnsavedRanges(true);
    
    toast({
      title: "Rango añadido",
      description: `Se añadió un nuevo rango de puntuación: ${newMin}-${newMax}`,
      variant: "default",
    });
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    console.log(`Updating score range at index ${index}, field ${String(field)} to value ${value}`);
    
    if (!scoreRanges[index]) {
      console.error(`Score range at index ${index} does not exist`);
      return;
    }
    
    const updatedRanges = JSON.parse(JSON.stringify(scoreRanges));
    updatedRanges[index] = { 
      ...updatedRanges[index], 
      [field]: typeof value === 'string' ? value : Number(value)
    };
    
    console.log("Updated score ranges:", JSON.stringify(updatedRanges));
    setScoreRanges(updatedRanges);
    setHasUnsavedRanges(true);
  };

  const removeScoreRange = (index: number) => {
    console.log(`Removing score range at index ${index}`);
    
    const updatedRanges = scoreRanges.filter((_, i) => i !== index);
    console.log("Updated score ranges after removal:", JSON.stringify(updatedRanges));
    setScoreRanges(updatedRanges);
    setHasUnsavedRanges(true);
    
    toast({
      title: "Rango eliminado",
      description: "El rango de puntuación ha sido eliminado",
      variant: "default",
    });
  };

  // Enhanced function to save score ranges directly to Supabase
  const directlySaveScoreRangesToSupabase = async (formTitle: string, ranges: ScoreRange[]) => {
    console.log("DIRECT ACTION - directlySaveScoreRangesToSupabase");
    console.log("Form title:", formTitle);
    console.log("Ranges to save:", JSON.stringify(ranges));
    
    try {
      // First check if the form exists in Supabase by title
      const { data: existingForm, error: queryError } = await supabase
        .from('formulario_construccion')
        .select('id, configuracion, preguntas, titulo')
        .eq('titulo', formTitle)
        .maybeSingle();
      
      if (queryError) {
        console.error("Error querying form:", queryError);
        return false;
      }
      
      if (!existingForm) {
        console.error("Form not found in database:", formTitle);
        return false;
      }
      
      console.log("Found form in database:", existingForm);
      
      // Create a deep copy of all objects to avoid reference issues
      const currentConfig = existingForm.configuracion 
        ? JSON.parse(JSON.stringify(existingForm.configuracion)) 
        : {};
      
      const rangesCopy = JSON.parse(JSON.stringify(ranges));
      
      // Update scoring configuration with explicit boolean value
      const updatedConfig = {
        ...currentConfig,
        showTotalScore: isScoringEnabled === true, // Force boolean
        scoreRanges: rangesCopy,
        // Preserve other configuration fields
        isPrivate: currentConfig.isPrivate || false,
        formColor: currentConfig.formColor || '#3b82f6',
        allowViewOwnResponses: currentConfig.allowViewOwnResponses || false,
        allowEditOwnResponses: currentConfig.allowEditOwnResponses || false,
        httpConfig: currentConfig.httpConfig || null,
        hasFieldsWithNumericValues: hasFieldsWithNumericValues
      };
      
      console.log("Updating Supabase form with config:", JSON.stringify(updatedConfig));
      
      // Get current fields and remove scoreRanges from them
      const currentFields = existingForm.preguntas || [];
      const fieldsWithoutRanges = currentFields.map(field => {
        // Use destructuring to explicitly remove scoreRanges property
        const { scoreRanges, ...fieldWithoutRanges } = field;
        return fieldWithoutRanges;
      });
      
      // Update both configuration and questions columns
      const { error: updateError } = await supabase
        .from('formulario_construccion')
        .update({
          configuracion: updatedConfig,
          preguntas: fieldsWithoutRanges
        })
        .eq('id', existingForm.id);
        
      if (updateError) {
        console.error("Error updating form scoring in Supabase:", updateError);
        return false;
      }
      
      console.log("Score ranges saved successfully to Supabase!");
      return true;
    } catch (error) {
      console.error("Exception in directlySaveScoreRangesToSupabase:", error);
      return false;
    }
  };

  // Enhanced function to save score ranges with better error handling
  const saveScoreRanges = async () => {
    if (!onSaveScoreRanges) {
      console.error("onSaveScoreRanges callback is not defined");
      return;
    }
    
    if (scoreRanges.length === 0) {
      toast({
        title: "Error",
        description: "No hay rangos de puntuación para guardar",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Saving score ranges with current state:");
    console.log("- isScoringEnabled:", isScoringEnabled);
    console.log("- Ranges to save:", JSON.stringify(scoreRanges));
    
    // Get current form title from formId instead of DOM elements
    if (!formId) {
      toast({
        title: "Error",
        description: "No se encontró un ID de formulario",
        variant: "destructive",
      });
      return;
    }

    try {
      // First try to get the form by ID
      const { data: formData, error } = await supabase
        .from('formulario_construccion')
        .select('titulo')
        .eq('id', formId)
        .maybeSingle();

      if (error || !formData) {
        console.error("Error fetching form:", error);
        toast({
          title: "Error",
          description: "No se pudo obtener la información del formulario",
          variant: "destructive",
        });
        return;
      }

      const formTitle = formData.titulo;
      console.log("Got form title for saving ranges:", formTitle);
      
      if (!formTitle) {
        toast({
          title: "Error",
          description: "El formulario no tiene título",
          variant: "destructive",
        });
        return;
      }
      
      // Create a deep copy of the scoreRanges
      const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRanges));
      console.log("DIRECT ACTION - Saving score ranges directly to Supabase");
      const saved = await directlySaveScoreRangesToSupabase(formTitle, scoreRangesCopy);
      
      if (saved) {
        setHasUnsavedRanges(false);
        
        toast({
          title: "Rangos guardados",
          description: "Los rangos de puntuación se han guardado correctamente en la base de datos",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los rangos de puntuación",
          variant: "destructive",
        });
        return; // Stop if direct save failed
      }
    } catch (error) {
      console.error("Error saving score ranges:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los rangos de puntuación",
        variant: "destructive",
      });
      return;
    }
    
    // Call the parent handler with a deep copy
    const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRanges));
    onSaveScoreRanges(scoreRangesCopy);
    
    // Reset unsaved changes flag
    setHasUnsavedRanges(false);
  };

  // Handle toggle of scoring feature with improved logging
  const handleToggleScoringFeature = async (enabled: boolean) => {
    console.log("TOGGLE ACTION - handleToggleScoringFeature called with:", enabled);
    
    // Call the parent handler
    if (onToggleFormScoring) {
      onToggleFormScoring(enabled);
    }
    
    // If toggling on and no ranges exist yet, add a default range
    if (enabled && scoreRanges.length === 0) {
      console.log("Adding default score range when toggling on");
      addScoreRange();
    }
    
    // If we don't have a formId, we can't save directly to Supabase
    if (!formId) {
      console.error("No formId provided, cannot save directly to Supabase");
      return;
    }

    try {
      // Get form title from formId
      const { data: formData, error } = await supabase
        .from('formulario_construccion')
        .select('titulo')
        .eq('id', formId)
        .maybeSingle();

      if (error || !formData) {
        console.error("Error fetching form:", error);
        return;
      }

      const formTitle = formData.titulo;
      
      if (!formTitle) {
        console.error("Form has no title");
        return;
      }
      
      console.log("Got form title for toggle:", formTitle);
      
      // Deep clone to avoid reference issues
      const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRanges));
      console.log("DIRECT ACTION - Saving toggle state directly to Supabase");
      
      const success = await directlySaveScoreRangesToSupabase(formTitle, scoreRangesCopy);
      
      if (!success) {
        toast({
          title: "Error",
          description: "No se pudo guardar la configuración de puntuación",
          variant: "destructive",
        });
      }
      
      // If enabling scoring and we have ranges, save them immediately
      if (enabled && scoreRanges.length > 0) {
        // Use setTimeout to ensure state is updated before saving
        setTimeout(() => {
          console.log("Auto-saving score ranges after enabling scoring");
          saveScoreRanges();
        }, 100);
      }
      
    } catch (error) {
      console.error("Error saving toggle state:", error);
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
                    variant={hasUnsavedRanges ? "default" : "outline"}
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
              
              {hasUnsavedRanges && (
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

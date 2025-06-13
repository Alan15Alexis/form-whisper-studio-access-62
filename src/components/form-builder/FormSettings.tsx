import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HttpConfig, ScoreRange } from "@/types/form";
import HttpConfigSettings from "./HttpConfigSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle, Save, Database, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { supabase } from "@/integrations/supabase/client";

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
  showTotalScore: boolean;
  onToggleFormScoring?: (enabled: boolean) => void;
  onSaveScoreRanges?: (ranges: ScoreRange[]) => void;
  scoreRanges: ScoreRange[];
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
  showTotalScore,
  onToggleFormScoring = () => {},
  onSaveScoreRanges = () => {},
  scoreRanges
}: FormSettingsProps) => {
  const { currentUser } = useAuth();
  const { fetchScoreRangesFromDB } = useFormScoring();
  const isAdmin = currentUser?.role === "admin";

  const defaultHttpConfig: HttpConfig = {
    enabled: false,
    url: "",
    method: "POST",
    headers: [],
    body: `{
  "id_del_elemento": "respuesta"
}`
  };

  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues);

  // Local state for score ranges management - better initialization and synchronization
  const [localScoreRanges, setLocalScoreRanges] = useState<ScoreRange[]>([]);
  const [dbScoreRanges, setDbScoreRanges] = useState<ScoreRange[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [lastSyncedRanges, setLastSyncedRanges] = useState<string>(''); // Track last synced state

  console.log("FormSettings - Component Rendered with props:", {
    showTotalScore,
    scoreRanges: scoreRanges?.length || 0,
    formId,
    hasFieldsWithNumericValues,
    localScoreRangesCount: localScoreRanges.length
  });

  // Enhanced synchronization with props - prevent infinite loops
  useEffect(() => {
    const currentRangesStr = JSON.stringify(scoreRanges || []);
    
    // Only update if the ranges actually changed
    if (currentRangesStr !== lastSyncedRanges) {
      console.log("FormSettings - Syncing local score ranges with props:", scoreRanges);
      const rangesToSet = Array.isArray(scoreRanges) ? [...scoreRanges] : [];
      setLocalScoreRanges(rangesToSet);
      setLastSyncedRanges(currentRangesStr);
    }
  }, [scoreRanges, lastSyncedRanges]);

  // Enhanced fetch function with better error handling and form-specific filtering
  const loadDbScoreRanges = async (forceRefresh = false) => {
    if (!formId) {
      console.log("FormSettings - No formId provided, skipping DB load");
      setDbScoreRanges([]);
      return;
    }

    console.log("FormSettings - Loading score ranges from DB for formId:", formId, "forceRefresh:", forceRefresh);
    setIsLoadingDb(true);
    
    try {
      const numericFormId = parseInt(formId);
      let dbRanges: ScoreRange[] = [];
      
      if (!isNaN(numericFormId)) {
        console.log("FormSettings - Trying direct numeric ID match:", numericFormId);
        
        const { data: directMatch, error: directError } = await supabase
          .from('formulario_construccion')
          .select('id, titulo, rangos_mensajes, configuracion')
          .eq('id', numericFormId)
          .single();
        
        if (!directError && directMatch) {
          console.log("FormSettings - Found form by direct ID match:", directMatch.titulo);
          
          // Prioritize rangos_mensajes column
          if (directMatch.rangos_mensajes && Array.isArray(directMatch.rangos_mensajes) && directMatch.rangos_mensajes.length > 0) {
            dbRanges = [...directMatch.rangos_mensajes]; // Create a copy
            console.log("FormSettings - Found score ranges in rangos_mensajes:", dbRanges);
          } else if (directMatch.configuracion?.scoreRanges && Array.isArray(directMatch.configuracion.scoreRanges) && directMatch.configuracion.scoreRanges.length > 0) {
            dbRanges = [...directMatch.configuracion.scoreRanges]; // Create a copy
            console.log("FormSettings - Found score ranges in configuracion (fallback):", dbRanges);
          } else {
            console.log("FormSettings - No score ranges found for this specific form");
          }
        } else {
          console.log("FormSettings - No form found with numeric ID:", numericFormId, directError?.message);
        }
      } else {
        console.log("FormSettings - UUID formId provided, not showing ranges from other forms");
      }

      setDbScoreRanges(dbRanges);
      
      if (dbRanges.length > 0) {
        console.log("FormSettings - Successfully loaded", dbRanges.length, "score ranges");
        
        if (forceRefresh) {
          toast({
            title: "Rangos actualizados",
            description: `Se cargaron ${dbRanges.length} rango${dbRanges.length !== 1 ? 's' : ''} desde la base de datos`
          });
        }
      } else {
        console.log("FormSettings - No score ranges found for this specific form");
        
        if (forceRefresh) {
          toast({
            title: "Sin rangos",
            description: "No se encontraron rangos de puntuación para este formulario en la base de datos",
            variant: "default"
          });
        }
      }
      
    } catch (error) {
      console.error("FormSettings - Error loading score ranges from DB:", error);
      setDbScoreRanges([]);
      
      if (forceRefresh) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los rangos desde la base de datos",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoadingDb(false);
    }
  };

  // Load database ranges on mount and when formId changes
  useEffect(() => {
    loadDbScoreRanges();
  }, [formId]);

  // Score range management functions with better synchronization
  const addScoreRange = () => {
    console.log("FormSettings - Adding new score range");
    let newRanges;
    if (localScoreRanges.length === 0) {
      newRanges = [{
        min: 0,
        max: 10,
        message: "Mensaje para puntuación 0-10"
      }];
    } else {
      const lastRange = localScoreRanges[localScoreRanges.length - 1];
      const newMin = lastRange ? lastRange.max + 1 : 0;
      const newMax = newMin + 10;
      newRanges = [...localScoreRanges, {
        min: newMin,
        max: newMax,
        message: `Mensaje para puntuación ${newMin}-${newMax}`
      }];
    }
    
    console.log("FormSettings - New score ranges:", newRanges);
    setLocalScoreRanges(newRanges);
    
    // Update synced state
    setLastSyncedRanges(JSON.stringify(newRanges));

    // Immediately save to parent
    onSaveScoreRanges(newRanges);
    
    toast({
      title: "Rango añadido",
      description: `Se añadió un nuevo rango de puntuación`
    });
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    console.log(`FormSettings - Updating score range at index ${index}, field ${String(field)} to value ${value}`);
    
    if (!localScoreRanges[index]) {
      console.error(`FormSettings - Score range at index ${index} does not exist`);
      return;
    }
    
    const updatedRanges = [...localScoreRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    
    console.log("FormSettings - Updated score ranges:", updatedRanges);
    setLocalScoreRanges(updatedRanges);
    
    // Update synced state
    setLastSyncedRanges(JSON.stringify(updatedRanges));

    // Immediately save to parent
    onSaveScoreRanges(updatedRanges);
  };

  const removeScoreRange = (index: number) => {
    console.log(`FormSettings - Removing score range at index ${index}`);
    const updatedRanges = localScoreRanges.filter((_, i) => i !== index);
    
    console.log("FormSettings - Updated score ranges after removal:", updatedRanges);
    setLocalScoreRanges(updatedRanges);
    
    // Update synced state
    setLastSyncedRanges(JSON.stringify(updatedRanges));

    // Immediately save to parent
    onSaveScoreRanges(updatedRanges);
    
    toast({
      title: "Rango eliminado",
      description: "El rango de puntuación ha sido eliminado"
    });
  };

  const handleToggleScoringFeature = async (enabled: boolean) => {
    console.log("FormSettings - handleToggleScoringFeature called with:", enabled);

    // Call the parent handler first
    if (onToggleFormScoring) {
      onToggleFormScoring(enabled);
    }

    // If toggling on and no ranges exist yet, add a default range
    if (enabled && localScoreRanges.length === 0) {
      console.log("FormSettings - Adding default score range when toggling on");
      setTimeout(() => addScoreRange(), 100);
    }
  };

  console.log("FormSettings - Final render state:", {
    showTotalScore,
    localScoreRangesCount: localScoreRanges.length,
    dbScoreRangesCount: dbScoreRanges.length,
    isLoadingDb,
    hasFieldsWithNumericValues,
    lastSyncedRanges: lastSyncedRanges.length
  });

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

      {/* Enhanced Scoring Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Puntuación y Resultados</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch 
              id="show-total-score" 
              checked={!!showTotalScore} 
              onCheckedChange={handleToggleScoringFeature} 
              disabled={!hasFieldsWithNumericValues} 
              className="data-[state=checked]:bg-[#686df3]" 
            />
            <div>
              <Label htmlFor="show-total-score" className="text-lg font-medium">Agregar rangos y mensajes</Label>
              <p className="text-sm text-gray-500">
                {hasFieldsWithNumericValues ? 
                  "Muestra la puntuación total al finalizar el formulario" : 
                  "Para activar, configura valores numéricos en al menos un campo"}
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
          
          {/* Enhanced Score Ranges Configuration */}
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
              
              {localScoreRanges.length === 0 && (
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay rangos definidos. Los rangos permiten mostrar mensajes personalizados según la puntuación obtenida.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                {localScoreRanges.map((range, index) => (
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

                {localScoreRanges.length === 0 && (
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

      {/* Enhanced Database Score Ranges Card */}
      {dbScoreRanges.length > 0 && (
        <Card className="p-6 shadow-sm border border-blue-100 bg-blue-50/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-blue-900">Rangos de puntuación guardados</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadDbScoreRanges(true)} 
              disabled={isLoadingDb || !formId} 
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingDb ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {isLoadingDb && (
              <div className="p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-600">
                    Cargando rangos desde la base de datos...
                  </p>
                </div>
              </div>
            )}

            {!isLoadingDb && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-blue-800">
                    ✅ {dbScoreRanges.length} rango{dbScoreRanges.length !== 1 ? 's' : ''} guardado{dbScoreRanges.length !== 1 ? 's' : ''}
                  </p>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Guardado en BD
                  </span>
                </div>
                
                {dbScoreRanges.map((range, index) => (
                  <div key={index} className="p-4 bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {range.min} - {range.max} puntos
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Rango #{index + 1}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            📄 Mensaje configurado:
                          </p>
                          <p className="text-sm text-gray-800 leading-relaxed italic">
                            "{range.message}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    🎯 <strong>Estos rangos están activos:</strong> Los usuarios verán los mensajes correspondientes según su puntuación al completar el formulario.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      
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
      
      <HttpConfigSettings 
        config={httpConfig || defaultHttpConfig} 
        onConfigChange={(config) => onHttpConfigChange && onHttpConfigChange(config)} 
        isAdmin={isAdmin} 
        formFields={formFields} 
      />
    </div>
  );
};

export default FormSettings;

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
import { Trash, Plus, AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";

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
  const {
    currentUser
  } = useAuth();
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

  // Local state for score ranges management - initialize directly from props
  const [localScoreRanges, setLocalScoreRanges] = useState<ScoreRange[]>(scoreRanges);
  // State for database score ranges (independent of scoring toggle)
  const [dbScoreRanges, setDbScoreRanges] = useState<ScoreRange[]>([]);
  const [dbLoadingState, setDbLoadingState] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const [dbErrorMessage, setDbErrorMessage] = useState<string>('');

  console.log("FormSettings - Component Rendered with standardized props:", {
    showTotalScore,
    scoreRanges,
    formId,
    hasFieldsWithNumericValues
  });

  // Sync local state when props change
  useEffect(() => {
    console.log("FormSettings - Syncing local score ranges with prop:", scoreRanges);
    setLocalScoreRanges([...scoreRanges]);
  }, [scoreRanges]);

  // Fetch score ranges from database on component mount
  useEffect(() => {
    const loadDbScoreRanges = async () => {
      if (!formId) {
        setDbLoadingState('error');
        setDbErrorMessage('No se proporcionó ID de formulario');
        return;
      }

      console.log("FormSettings - Loading score ranges from DB for formId:", formId);
      setDbLoadingState('loading');
      
      try {
        const ranges = await fetchScoreRangesFromDB(formId);
        console.log("FormSettings - Loaded score ranges from DB:", ranges);
        
        if (ranges.length > 0) {
          setDbScoreRanges(ranges);
          setDbLoadingState('success');
          setDbErrorMessage('');
        } else {
          setDbScoreRanges([]);
          setDbLoadingState('not-found');
          setDbErrorMessage('No se encontraron rangos de puntuación para este formulario en la base de datos');
        }
      } catch (error) {
        console.error("FormSettings - Error loading score ranges from DB:", error);
        setDbScoreRanges([]);
        setDbLoadingState('error');
        setDbErrorMessage(`Error al cargar rangos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };

    loadDbScoreRanges();
  }, [formId, fetchScoreRangesFromDB]);

  // Score range management functions
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

    // Immediately save to parent
    onSaveScoreRanges(updatedRanges);
  };
  const removeScoreRange = (index: number) => {
    console.log(`FormSettings - Removing score range at index ${index}`);
    const updatedRanges = localScoreRanges.filter((_, i) => i !== index);
    console.log("FormSettings - Updated score ranges after removal:", updatedRanges);
    setLocalScoreRanges(updatedRanges);

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
    dbLoadingState,
    hasFieldsWithNumericValues
  });
  return <div className="space-y-8">
      {/* General Settings Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Configuración General</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch id="private-form" checked={isPrivate} onCheckedChange={onPrivateChange} className="data-[state=checked]:bg-[#686df3]" />
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
                    <span className="w-5 h-5 rounded-full mr-2" style={{
                    background: formColor || FORM_COLORS[0].value
                  }} />
                    {FORM_COLORS.find(c => c.value === formColor)?.name || FORM_COLORS[0].name}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FORM_COLORS.map(color => <SelectItem key={color.value} value={color.value}>
                    <span className="inline-flex items-center">
                      <span className="w-5 h-5 rounded-full mr-2" style={{
                    background: color.value
                  }} />
                      {color.name}
                    </span>
                  </SelectItem>)}
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
            <Switch id="show-total-score" checked={!!showTotalScore} onCheckedChange={handleToggleScoringFeature} disabled={!hasFieldsWithNumericValues} className="data-[state=checked]:bg-[#686df3]" />
            <div>
              <Label htmlFor="show-total-score" className="text-lg font-medium">Agregar rangos y mensajes</Label>
              <p className="text-sm text-gray-500">
                {hasFieldsWithNumericValues ? "Muestra la puntuación total al finalizar el formulario" : "Para activar, configura valores numéricos en al menos un campo"}
              </p>
            </div>
          </div>

          {!hasFieldsWithNumericValues && <div className="p-4 bg-primary/5 rounded-md text-sm">
              <p className="font-medium">Para habilitar la puntuación total:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Ve a la pestaña "Campos"</li>
                <li>Selecciona un campo y haz clic en el ícono de configuración</li>
                <li>Activa "Habilitar valores numéricos"</li>
                <li>Asigna valores numéricos a las opciones</li>
              </ol>
            </div>}
          
          {/* Score Ranges Configuration */}
          {showTotalScore && <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Rangos de puntuación y mensajes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addScoreRange} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Añadir rango
                </Button>
              </div>
              
              {localScoreRanges.length === 0 && <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay rangos definidos. Los rangos permiten mostrar mensajes personalizados según la puntuación obtenida.
                  </AlertDescription>
                </Alert>}
              
              <div className="space-y-3">
                {localScoreRanges.map((range, index) => <div key={index} className="p-3 border rounded-md bg-background">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label htmlFor={`min-${index}`}>Mínimo</Label>
                        <Input id={`min-${index}`} type="number" value={range.min} onChange={e => updateScoreRange(index, 'min', Number(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor={`max-${index}`}>Máximo</Label>
                        <Input id={`max-${index}`} type="number" value={range.max} onChange={e => updateScoreRange(index, 'max', Number(e.target.value))} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`message-${index}`}>Mensaje</Label>
                      <Input id={`message-${index}`} value={range.message} onChange={e => updateScoreRange(index, 'message', e.target.value)} className="mt-1" placeholder="Mensaje que se mostrará para este rango de puntuación" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-700" onClick={() => removeScoreRange(index)}>
                      <Trash className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>)}

                {localScoreRanges.length === 0 && <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground italic">
                      No hay rangos definidos. Añada rangos para mostrar mensajes personalizados según la puntuación.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addScoreRange} className="mt-2">
                      <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                    </Button>
                  </div>}
              </div>
            </div>}

          {/* Score Ranges Visualization Block - Always show DB ranges */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-base font-medium">Rangos configurados desde la base de datos</Label>
              <div className="text-xs text-gray-500">
                (ID del formulario: {formId})
              </div>
            </div>
            
            {dbLoadingState === 'loading' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600 text-center">
                  Cargando rangos desde la base de datos...
                </p>
              </div>
            )}

            {dbLoadingState === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">
                  Error: {dbErrorMessage}
                </p>
              </div>
            )}

            {dbLoadingState === 'not-found' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 italic text-center">
                  {dbErrorMessage}
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Verifica que el formulario exista en la base de datos con el ID proporcionado
                </p>
              </div>
            )}

            {dbLoadingState === 'success' && dbScoreRanges.length > 0 && (
              <div className="space-y-3">
                {dbScoreRanges.map((range, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                            {range.min} - {range.max} puntos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Mensaje:</span> {range.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Access to Responses Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Acceso a Respuestas</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch id="allow-view-own-responses" checked={!!allowViewOwnResponses} onCheckedChange={onAllowViewOwnResponsesChange} />
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
            <Switch id="allow-edit-own-responses" checked={!!allowEditOwnResponses} onCheckedChange={onAllowEditOwnResponsesChange} />
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
      
      <HttpConfigSettings config={httpConfig || defaultHttpConfig} onConfigChange={config => onHttpConfigChange && onHttpConfigChange(config)} isAdmin={isAdmin} formFields={formFields} />
    </div>;
};
export default FormSettings;

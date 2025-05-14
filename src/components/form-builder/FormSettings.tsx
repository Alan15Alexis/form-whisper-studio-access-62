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
import { Trash, Plus, AlertCircle, Save, ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
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
  onToggleFormScoring,
  onSaveScoreRanges,
  externalScoreRanges = [],
  isScoringEnabled = false,
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

  // For scoring section
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Initialize with default or existing score ranges
  useEffect(() => {
    // If external score ranges are provided, use them
    if (externalScoreRanges && externalScoreRanges.length > 0) {
      setScoreRanges([...externalScoreRanges]);
    } 
    // Otherwise, if scoring is enabled but no ranges exist, create default one
    else if (isScoringEnabled && scoreRanges.length === 0) {
      setScoreRanges([{ min: 0, max: 10, message: "" }]);
    }
  }, [externalScoreRanges, isScoringEnabled]);

  const handleToggleScoring = (enabled: boolean) => {
    if (onToggleFormScoring) {
      onToggleFormScoring(enabled);
      
      // If enabling scoring and no ranges exist, add a default one
      if (enabled && scoreRanges.length === 0) {
        setScoreRanges([{ min: 0, max: 10, message: "" }]);
      }
    }
  };

  const handleAddScoreRange = () => {
    const lastRange = scoreRanges[scoreRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = newMin + 10;
    
    setScoreRanges([...scoreRanges, { min: newMin, max: newMax, message: "" }]);
  };

  const handleRemoveScoreRange = (index: number) => {
    const newRanges = [...scoreRanges];
    newRanges.splice(index, 1);
    setScoreRanges(newRanges);
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: any) => {
    const newRanges = [...scoreRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setScoreRanges(newRanges);
  };

  const handleSaveScoreRanges = () => {
    // Validate ranges before saving
    const hasInvalidRanges = scoreRanges.some(range => 
      range.min === undefined || 
      range.max === undefined || 
      range.min > range.max
    );

    if (hasInvalidRanges) {
      toast({
        title: "Rangos inválidos",
        description: "Asegúrate de que los valores mínimos sean menores que los máximos.",
        variant: "destructive",
      });
      return;
    }

    // Check for overlapping ranges
    const sortedRanges = [...scoreRanges].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].max >= sortedRanges[i + 1].min) {
        toast({
          title: "Rangos superpuestos",
          description: "Los rangos de puntuación no deben superponerse.",
          variant: "destructive",
        });
        return;
      }
    }

    // Save the ranges
    if (onSaveScoreRanges) {
      onSaveScoreRanges([...scoreRanges]);
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
      
      {/* Scoring and Results Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Puntuación y Resultados</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ArrowDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch
              id="show-total-score"
              checked={isScoringEnabled}
              onCheckedChange={handleToggleScoring}
            />
            <div>
              <Label htmlFor="show-total-score" className="text-lg font-medium">
                Mostrar puntuación total
              </Label>
              <p className="text-sm text-gray-500">
                Si está activo, se mostrará la puntuación total al finalizar el formulario.
              </p>
            </div>
          </div>

          {isScoringEnabled && isExpanded && (
            <div className="pt-4">
              <h4 className="text-md font-medium mb-3">Rangos de puntuación</h4>
              
              {scoreRanges.length === 0 ? (
                <Alert variant="default" className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
                  <AlertDescription>
                    No hay rangos de puntuación definidos. Agrega al menos uno para mostrar mensajes personalizados.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {scoreRanges.map((range, index) => (
                    <div key={index} className="p-4 border rounded-md bg-slate-50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`min-${index}`} className="mb-1 block">Puntuación mínima</Label>
                          <Input
                            id={`min-${index}`}
                            type="number"
                            value={range.min}
                            onChange={(e) => updateScoreRange(index, 'min', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`max-${index}`} className="mb-1 block">Puntuación máxima</Label>
                          <Input
                            id={`max-${index}`}
                            type="number"
                            value={range.max}
                            onChange={(e) => updateScoreRange(index, 'max', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`message-${index}`} className="mb-1 block">Mensaje para este rango</Label>
                        <Input
                          id={`message-${index}`}
                          value={range.message || ''}
                          onChange={(e) => updateScoreRange(index, 'message', e.target.value)}
                          placeholder="Ej: Buen trabajo, has obtenido una puntuación media."
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveScoreRange(index)}
                        disabled={scoreRanges.length === 1}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddScoreRange}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Añadir rango
                </Button>
                
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSaveScoreRanges}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-1" /> Guardar cambios
                </Button>
              </div>
            </div>
          )}
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

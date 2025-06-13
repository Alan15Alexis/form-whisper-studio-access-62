
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ScoreRange } from "@/types/form";

interface ScoreRangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreRanges: ScoreRange[];
  onSaveRanges: (ranges: ScoreRange[]) => void;
}

const ScoreRangesModal = ({
  isOpen,
  onClose,
  scoreRanges,
  onSaveRanges
}: ScoreRangesModalProps) => {
  const [localRanges, setLocalRanges] = useState<ScoreRange[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalRanges([...scoreRanges]);
    }
  }, [isOpen, scoreRanges]);

  const addRange = () => {
    let newRange;
    if (localRanges.length === 0) {
      newRange = {
        min: 0,
        max: 10,
        message: "Mensaje para puntuación 0-10"
      };
    } else {
      const lastRange = localRanges[localRanges.length - 1];
      const newMin = lastRange.max + 1;
      const newMax = newMin + 10;
      newRange = {
        min: newMin,
        max: newMax,
        message: `Mensaje para puntuación ${newMin}-${newMax}`
      };
    }
    
    setLocalRanges([...localRanges, newRange]);
  };

  const updateRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    const updatedRanges = [...localRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    setLocalRanges(updatedRanges);
  };

  const removeRange = (index: number) => {
    setLocalRanges(localRanges.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validRanges = localRanges.filter(range => 
      range && 
      typeof range.min === 'number' && 
      typeof range.max === 'number' && 
      typeof range.message === 'string' &&
      range.min <= range.max
    );

    onSaveRanges(validRanges);
    onClose();
    
    toast({
      title: "Rangos guardados",
      description: `Se configuraron ${validRanges.length} rangos de puntuación.`
    });
  };

  const handleClose = () => {
    setLocalRanges([...scoreRanges]); // Reset to original values
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Rangos de Puntuación</DialogTitle>
          <DialogDescription>
            Define los rangos de puntuación y los mensajes que se mostrarán a los usuarios según su resultado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">
              Rangos configurados
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addRange}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Añadir rango
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {localRanges.map((range, index) => (
              <div key={`range-${index}`} className="p-3 border rounded-md bg-gray-50">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <Label htmlFor={`min-${index}`}>Mínimo</Label>
                    <Input 
                      id={`min-${index}`} 
                      type="number" 
                      value={range.min} 
                      onChange={(e) => updateRange(index, 'min', Number(e.target.value))} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-${index}`}>Máximo</Label>
                    <Input 
                      id={`max-${index}`} 
                      type="number" 
                      value={range.max} 
                      onChange={(e) => updateRange(index, 'max', Number(e.target.value))} 
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <Label htmlFor={`message-${index}`}>Mensaje</Label>
                  <Input 
                    id={`message-${index}`} 
                    value={range.message} 
                    onChange={(e) => updateRange(index, 'message', e.target.value)} 
                    className="mt-1" 
                    placeholder="Mensaje que se mostrará para este rango de puntuación"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700" 
                  onClick={() => removeRange(index)}
                >
                  <Trash className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            ))}

            {localRanges.length === 0 && (
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  No hay rangos configurados
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addRange}
                >
                  <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                </Button>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Consejos:</strong>
            </p>
            <ul className="text-sm text-blue-700 list-disc ml-4 mt-2">
              <li>Los rangos no deben solaparse para evitar ambigüedad</li>
              <li>Asegúrate de que cubran todos los posibles valores de puntuación</li>
              <li>Los mensajes serán mostrados a los usuarios según su puntuación final</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar Rangos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreRangesModal;

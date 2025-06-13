
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRange, FormField } from "@/types/form";
import ScoreRangesModal from "./ScoreRangesModal";
import ScoreRangesWarning from "./ScoreRangesWarning";
import ScoreRangesConfiguration from "./ScoreRangesConfiguration";

interface ScoreRangesTabProps {
  formFields: FormField[];
  showTotalScore: boolean;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: ScoreRange[]) => void;
  scoreRanges: ScoreRange[];
}

const ScoreRangesTab = ({
  formFields = [],
  showTotalScore,
  onToggleFormScoring = () => {},
  onSaveScoreRanges = () => {},
  scoreRanges
}: ScoreRangesTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check for fields with numeric values
  const hasFieldsWithNumericValues = formFields.some(field => {
    // Clean malformed hasNumericValues data with proper null check
    if (field.hasNumericValues && typeof field.hasNumericValues === 'object' && (field.hasNumericValues as any)._type === 'undefined') {
      return false;
    }
    return field.hasNumericValues === true;
  });

  // Clean and validate score ranges
  const validScoreRanges = (() => {
    if (!scoreRanges) {
      console.log("ScoreRangesTab - No scoreRanges provided (null/undefined)");
      return [];
    }
    
    // Handle malformed scoreRanges using any type
    const malformedValue = scoreRanges as any;
    if (malformedValue && typeof malformedValue === 'object' && malformedValue._type === 'undefined') {
      console.log("ScoreRangesTab - Cleaning malformed scoreRanges:", malformedValue);
      return [];
    }
    
    if (!Array.isArray(scoreRanges)) {
      console.warn("ScoreRangesTab - scoreRanges is not an array:", typeof scoreRanges, scoreRanges);
      return [];
    }
    
    const filtered = scoreRanges.filter((range, index) => {
      const isValid = range && 
        typeof range.min === 'number' && 
        typeof range.max === 'number' && 
        typeof range.message === 'string' &&
        range.min <= range.max;
      
      if (!isValid) {
        console.warn(`ScoreRangesTab - Invalid range at index ${index}:`, {
          range,
          reasons: {
            noRange: !range,
            invalidMin: typeof range?.min !== 'number',
            invalidMax: typeof range?.max !== 'number', 
            invalidMessage: typeof range?.message !== 'string',
            minGreaterThanMax: range?.min > range?.max
          }
        });
      }
      
      return isValid;
    });
    
    console.log("ScoreRangesTab - Processed score ranges:", {
      originalLength: scoreRanges.length,
      filteredLength: filtered.length,
      filtered,
      hasFieldsWithNumericValues
    });
    
    return filtered;
  })();

  const handleOpenModal = () => {
    if (!hasFieldsWithNumericValues) {
      console.log("ScoreRangesTab - Cannot open modal: no fields with numeric values");
      return;
    }
    console.log("ScoreRangesTab - Opening modal with ranges:", validScoreRanges);
    setIsModalOpen(true);
  };

  const handleSaveRanges = (newRanges: ScoreRange[]) => {
    console.log("ScoreRangesTab - Saving new ranges:", newRanges);
    onSaveScoreRanges(newRanges);
    
    // If ranges are being saved and scoring is not enabled, enable it
    if (newRanges.length > 0 && !showTotalScore) {
      console.log("ScoreRangesTab - Enabling scoring since ranges were added");
      onToggleFormScoring(true);
    }
  };

  const clearAllRanges = () => {
    console.log("ScoreRangesTab - Clearing all ranges");
    onSaveScoreRanges([]);
  };

  console.log("ScoreRangesTab - Final render state:", {
    shouldShowWarning: !hasFieldsWithNumericValues,
    shouldShowConfiguration: hasFieldsWithNumericValues,
    validScoreRangesLength: validScoreRanges.length,
    formFieldsWithNumeric: formFields.filter(f => f.hasNumericValues === true).length
  });

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-sm border border-gray-100">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-medium">Puntuación y Rangos de Mensajes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-6">
            {!hasFieldsWithNumericValues && <ScoreRangesWarning />}

            {hasFieldsWithNumericValues && (
              <ScoreRangesConfiguration
                scoreRanges={validScoreRanges}
                onOpenModal={handleOpenModal}
                onClearRanges={clearAllRanges}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <ScoreRangesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scoreRanges={validScoreRanges}
        onSaveRanges={handleSaveRanges}
      />
    </div>
  );
};

export default ScoreRangesTab;

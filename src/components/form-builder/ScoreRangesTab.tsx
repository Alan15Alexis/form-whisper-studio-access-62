
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
  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues === true);

  // Enhanced logging for debugging score ranges display issues
  console.log("ScoreRangesTab - Component Rendered with detailed analysis:", {
    showTotalScore,
    scoreRangesReceived: scoreRanges,
    scoreRangesType: typeof scoreRanges,
    isScoreRangesArray: Array.isArray(scoreRanges),
    scoreRangesLength: scoreRanges?.length || 0,
    scoreRangesStringified: JSON.stringify(scoreRanges),
    hasFieldsWithNumericValues,
    fieldsWithNumericValues: formFields.filter(f => f.hasNumericValues).map(f => ({ id: f.id, label: f.label })),
    allFormFields: formFields.map(f => ({ id: f.id, label: f.label, hasNumericValues: f.hasNumericValues }))
  });

  // Validate and process score ranges with extensive logging
  const validScoreRanges = (() => {
    if (!scoreRanges) {
      console.log("ScoreRangesTab - No scoreRanges provided (null/undefined)");
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
      } else {
        console.log(`ScoreRangesTab - Valid range at index ${index}:`, range);
      }
      
      return isValid;
    });
    
    console.log("ScoreRangesTab - Filtered score ranges:", {
      originalLength: scoreRanges.length,
      filteredLength: filtered.length,
      filtered
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

  // Final render decision logging
  console.log("ScoreRangesTab - Render decision:", {
    shouldShowWarning: !hasFieldsWithNumericValues,
    shouldShowConfiguration: hasFieldsWithNumericValues,
    configurationWillReceive: {
      scoreRanges: validScoreRanges,
      scoreRangesLength: validScoreRanges.length
    }
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

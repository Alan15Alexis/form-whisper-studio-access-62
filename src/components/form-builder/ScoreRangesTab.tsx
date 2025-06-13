
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

  console.log("ScoreRangesTab - Component Rendered:", {
    showTotalScore,
    scoreRanges: scoreRanges?.length || 0,
    hasFieldsWithNumericValues,
    fieldsWithNumericValues: formFields.filter(f => f.hasNumericValues).map(f => ({ id: f.id, label: f.label }))
  });

  const validScoreRanges = Array.isArray(scoreRanges) ? scoreRanges : [];

  const handleOpenModal = () => {
    if (!hasFieldsWithNumericValues) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleSaveRanges = (newRanges: ScoreRange[]) => {
    onSaveScoreRanges(newRanges);
    
    // If ranges are being saved and scoring is not enabled, enable it
    if (newRanges.length > 0 && !showTotalScore) {
      onToggleFormScoring(true);
    }
  };

  const clearAllRanges = () => {
    onSaveScoreRanges([]);
  };

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

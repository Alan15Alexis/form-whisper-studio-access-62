
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FormHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  onBackClick: () => void;
}

const FormHeader = ({ currentQuestion, totalQuestions, onBackClick }: FormHeaderProps) => {
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onBackClick();
  };

  return (
    <div className="mb-6 flex justify-between items-center">
      <Button 
        type="button"
        variant="outline" 
        onClick={handleBackClick}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <div className="text-sm text-gray-500">
        Pregunta {currentQuestion + 1} de {totalQuestions}
      </div>
    </div>
  );
};

export default FormHeader;

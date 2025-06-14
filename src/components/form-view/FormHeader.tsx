
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FormHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  onBackClick: () => void;
}

const FormHeader = ({ currentQuestion, totalQuestions, onBackClick }: FormHeaderProps) => {
  const { currentUser, isAuthenticated } = useAuth();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Determine the correct route based on user authentication and role
    let redirectPath = '/';
    
    if (isAuthenticated && currentUser?.role === 'admin') {
      redirectPath = '/dashboard-admin';
    } else if (isAuthenticated && currentUser?.role === 'user') {
      redirectPath = '/assigned-forms';
    }
    
    // Use onBackClick with the correct path
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

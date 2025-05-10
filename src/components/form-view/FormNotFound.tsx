
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FormNotFoundProps {
  onBackClick: () => void;
}

const FormNotFound = ({ onBackClick }: FormNotFoundProps) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Formulario no encontrado</h1>
        <p className="text-gray-600 mb-6">
          El formulario que estás buscando no existe o ha sido eliminado.
        </p>
        <Button variant="outline" onClick={onBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    </div>
  );
};

export default FormNotFound;


import { ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface FormBuilderContainerProps {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  children: ReactNode;
}

export const FormBuilderContainer = ({ 
  isLoading, 
  hasError, 
  errorMessage, 
  children 
}: FormBuilderContainerProps) => {
  if (isLoading) {
    return (
      <div className="container py-8">
        <LoadingState message="Cargando datos del formulario..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || "Error: No se pudo cargar el formulario"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {children}
    </div>
  );
};

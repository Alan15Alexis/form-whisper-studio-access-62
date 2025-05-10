
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/types/form";
import { ClipboardList, FileText } from "lucide-react";
import FormsGrid from "./FormsGrid";
import EmptyState from "./EmptyState";

interface FormsTabsProps {
  pendingForms: Form[];
  completedForms: Form[];
  formStatus: Record<string, boolean>;
  onHideForm: (formId: string) => void;
}

const FormsTabs = ({ pendingForms, completedForms, formStatus, onHideForm }: FormsTabsProps) => {
  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="pending">
          <ClipboardList className="mr-2 h-4 w-4" />
          Formularios Pendientes ({pendingForms.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          <FileText className="mr-2 h-4 w-4" />
          Formularios Completados ({completedForms.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="animate-fadeIn">
        {pendingForms.length > 0 ? (
          <FormsGrid 
            forms={pendingForms} 
            formStatus={formStatus} 
            onHideForm={onHideForm} 
          />
        ) : (
          <EmptyState 
            title="No hay formularios pendientes"
            description="No tienes formularios pendientes por completar" 
          />
        )}
      </TabsContent>
      
      <TabsContent value="completed" className="animate-fadeIn">
        {completedForms.length > 0 ? (
          <FormsGrid 
            forms={completedForms} 
            formStatus={formStatus} 
            onHideForm={onHideForm} 
          />
        ) : (
          <EmptyState 
            title="No hay formularios completados"
            description="Aún no has completado ningún formulario asignado" 
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default FormsTabs;

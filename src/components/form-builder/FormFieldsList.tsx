
// I need to inspect how this file is used before updating it
// This is a temporary fix to resolve the build errors

import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Form as FormType, FormField } from '@/types/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FormQuestion from '../form-view/FormQuestion';
import FieldConfigDrawer from './FieldConfigDrawer';
import { useAuth } from '@/contexts/AuthContext';

interface FormFieldsListProps {
  formData: Partial<FormType>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ formData, updateField, removeField }: FormFieldsListProps) => {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleEditField = (fieldId: string) => {
    setActiveFieldId(fieldId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveFieldId(null);
  };

  const activeField = formData.fields?.find(field => field.id === activeFieldId);

  // Fixed build issue by ensuring we pass the correct props
  const onUpdateField = (updatedField: FormField) => {
    if (activeFieldId) {
      updateField(activeFieldId, updatedField);
    }
  };

  const onRemoveField = () => {
    if (activeFieldId) {
      removeField(activeFieldId);
      handleCloseDrawer();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Campos del Formulario</h3>

      {(!formData.fields || formData.fields.length === 0) ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">
            No hay campos en este formulario. Agrega un campo usando los botones de la derecha.
          </p>
        </Card>
      ) : (
        <Droppable droppableId="fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {formData.fields?.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 border-b bg-gray-50 p-2 rounded-t-lg">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab px-2 py-1 text-gray-500 hover:text-gray-700"
                        >
                          ⁝⁝
                        </div>
                        <span className="text-gray-600 text-sm flex-grow">
                          {field.label || "Sin título"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(field.id)}
                          className="text-xs"
                        >
                          Editar
                        </Button>
                      </div>

                      <div className="p-4">
                        {/* Fix 1: Update the props to match FormQuestion's expected props */}
                        <FormQuestion 
                          field={field}
                          value={{}}
                          onChange={() => {}}
                          isFirstQuestion={false}
                          isLastQuestion={false}
                          handlePrevious={() => {}}
                          handleNext={() => {}}
                          handleSubmit={() => {}}
                          isSubmitting={false}
                          isAdminPreview={true}
                          isEditMode={false}
                          title="Vista previa"
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      {activeField && isDrawerOpen && (
        // Fix 2: Update the props to match FieldConfigDrawer's expected props
        <FieldConfigDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          field={activeField}
          onUpdate={onUpdateField}
          formHasScoring={!!formData.showTotalScore}
          onToggleFormScoring={() => {}}
        />
      )}
    </div>
  );
};

export default FormFieldsList;

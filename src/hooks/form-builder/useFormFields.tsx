
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FormField, FormFieldOption, FormFieldType } from "@/types/form";

export function useFormFields() {
  const addField = (type: string, fields: FormField[] = []) => {
    let options;
    
    if (type === 'welcome') {
      return [...fields, {
        id: uuidv4(),
        type: 'welcome' as FormFieldType,
        label: 'Mensaje de Bienvenida',
        required: true,
        welcomeMessage: {
          text: 'Bienvenido a nuestro formulario',
          imageUrl: ''
        }
      }];
    }
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      options = [
        { id: '1', label: 'Opción 1', value: 'option_1' },
        { id: '2', label: 'Opción 2', value: 'option_2' }
      ];
    } else if (type === 'yesno') {
      options = [
        { id: 'yes', label: 'Sí', value: 'yes' },
        { id: 'no', label: 'No', value: 'no' }
      ];
    }
    
    const newField: FormField = {
      id: uuidv4(),
      type: type as FormFieldType,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: "",
      required: false,
      options,
      hasNumericValues: false,
    };
    
    return [...fields, newField];
  };

  const updateField = (id: string, updatedField: FormField, fields: FormField[]) => {
    if (!fields) return fields;
    
    return fields.map(field => 
      field.id === id ? updatedField : field
    );
  };

  const removeField = (id: string, fields: FormField[]) => {
    if (!fields) return fields;
    return fields.filter(field => field.id !== id);
  };

  return {
    addField,
    updateField,
    removeField,
  };
}

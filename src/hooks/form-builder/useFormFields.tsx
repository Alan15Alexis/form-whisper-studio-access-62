
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
    
    // Opciones para campos de selección
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
    } else if (type === 'image-select') {
      options = [
        { id: '1', label: 'Imagen 1', value: 'https://via.placeholder.com/150' },
        { id: '2', label: 'Imagen 2', value: 'https://via.placeholder.com/150' }
      ];
    } else if (type === 'matrix') {
      options = [
        { 
          id: '1', 
          label: 'Fila 1', 
          value: 'row_1',
          columns: ['Muy mal', 'Mal', 'Neutral', 'Bien', 'Muy bien'] 
        },
        { 
          id: '2', 
          label: 'Fila 2', 
          value: 'row_2',
          columns: ['Muy mal', 'Mal', 'Neutral', 'Bien', 'Muy bien'] 
        }
      ];
    } else if (type === 'opinion-scale') {
      options = [
        { id: '1', label: '1', value: '1' },
        { id: '2', label: '2', value: '2' },
        { id: '3', label: '3', value: '3' },
        { id: '4', label: '4', value: '4' },
        { id: '5', label: '5', value: '5' }
      ];
    } else if (type === 'star-rating') {
      options = [
        { id: '1', label: '1 estrella', value: '1' },
        { id: '2', label: '2 estrellas', value: '2' },
        { id: '3', label: '3 estrellas', value: '3' },
        { id: '4', label: '4 estrellas', value: '4' },
        { id: '5', label: '5 estrellas', value: '5' }
      ];
    } else if (type === 'ranking') {
      options = [
        { id: '1', label: 'Elemento 1', value: 'item_1' },
        { id: '2', label: 'Elemento 2', value: 'item_2' },
        { id: '3', label: 'Elemento 3', value: 'item_3' }
      ];
    }
    
    // Generamos una etiqueta por defecto basada en el tipo
    let defaultLabel = '';
    switch(type) {
      case 'text': defaultLabel = 'Texto corto'; break;
      case 'textarea': defaultLabel = 'Texto largo'; break;
      case 'select': defaultLabel = 'Selección desplegable'; break;
      case 'radio': defaultLabel = 'Selección individual'; break;
      case 'checkbox': defaultLabel = 'Selección múltiple'; break;
      case 'email': defaultLabel = 'Correo electrónico'; break;
      case 'number': defaultLabel = 'Número'; break;
      case 'date': defaultLabel = 'Fecha'; break;
      case 'time': defaultLabel = 'Hora'; break;
      case 'yesno': defaultLabel = 'Sí / No'; break;
      case 'image-select': defaultLabel = 'Selección de imagen'; break;
      case 'fullname': defaultLabel = 'Nombre completo'; break;
      case 'address': defaultLabel = 'Dirección'; break;
      case 'phone': defaultLabel = 'Teléfono'; break;
      case 'image-upload': defaultLabel = 'Subir imagen'; break;
      case 'file-upload': defaultLabel = 'Subir archivo'; break;
      case 'drawing': defaultLabel = 'Dibujo'; break;
      case 'matrix': defaultLabel = 'Matriz de selección'; break;
      case 'opinion-scale': defaultLabel = 'Escala de opinión'; break;
      case 'star-rating': defaultLabel = 'Calificación de estrellas'; break;
      case 'ranking': defaultLabel = 'Clasificación'; break;
      case 'timer': defaultLabel = 'Temporizador'; break;
      case 'terms': defaultLabel = 'Términos y condiciones'; break;
      case 'signature': defaultLabel = 'Firma'; break;
      default: defaultLabel = `Campo ${type}`;
    }
    
    const newField: FormField = {
      id: uuidv4(),
      type: type as FormFieldType,
      label: defaultLabel,
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

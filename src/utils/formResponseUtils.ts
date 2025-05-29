
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { sendHttpRequest, validateFormResponses } from '@/utils/http-utils';
import { supabase } from '@/integrations/supabase/client';
import { processFileUpload } from './fileUploadUtils';

// Process the form data before submission
export const processFormData = async (
  form: any,
  data: Record<string, any>,
  userEmail: string,
  formId: string
): Promise<Record<string, any>> => {
  // Process file uploads first and replace them with URLs in the response data
  const processedData = {...data};
  const uploadPromises = [];
  
  console.log("Processing form submission with fields:", form.fields);
  console.log("Form data before processing:", data);
  
  // Iterate through fields to find file uploads, images or drawings
  if (Array.isArray(form.fields)) {
    for (const field of form.fields) {
      const fieldValue = data[field.id];
      
      // Skip empty fields
      if (!fieldValue) continue;
      
      console.log(`Processing field ${field.id} (${field.type}) with value:`, 
        typeof fieldValue === 'string' && fieldValue.length > 100 
          ? `${fieldValue.substring(0, 100)}... [truncated]` 
          : fieldValue
      );
      
      // Handle file and image uploads
      if (field.type === 'image-upload' || field.type === 'file-upload' || 
          field.type === 'drawing' || field.type === 'signature') {
        
        console.log(`Found uploadable field ${field.id} of type ${field.type}`);
        
        // For base64 data (images, drawings, signatures)
        if (typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
          console.log(`Processing base64 data for field ${field.id}`);
          const uploadPromise = processFileUpload(fieldValue, field.id, userEmail, formId)
            .then(url => {
              console.log(`Upload success for field ${field.id}, URL: ${url}`);
              processedData[field.id] = url;
              return url;
            })
            .catch(err => {
              console.error(`Upload failed for field ${field.id}:`, err);
              
              // Store placeholder instead of file URL
              processedData[field.id] = "Error al subir archivo: " + (err.message || "Error desconocido");
              
              toast({
                title: "Advertencia",
                description: "Hubo un problema al subir un archivo, pero el formulario se enviará de todos modos",
                variant: "default",
              });
              
              return null;
            });
          
          uploadPromises.push(uploadPromise);
        } 
        // For File objects (file uploads)
        else if (fieldValue instanceof File) {
          console.log(`Processing File object for field ${field.id}: ${fieldValue.name}`);
          const uploadPromise = processFileUpload(fieldValue, field.id, userEmail, formId)
            .then(url => {
              console.log(`Upload success for field ${field.id}, URL: ${url}`);
              processedData[field.id] = url;
              return url;
            })
            .catch(err => {
              console.error(`Upload failed for field ${field.id}:`, err);
              
              // Store placeholder instead of file URL
              processedData[field.id] = "Error al subir archivo: " + (err.message || "Error desconocido");
              
              toast({
                title: "Advertencia",
                description: "Hubo un problema al subir un archivo, pero el formulario se enviará de todos modos",
                variant: "default",
              });
              
              return null;
            });
          
          uploadPromises.push(uploadPromise);
        }
        // Already a URL (from previous upload or edit mode)
        else if (typeof fieldValue === 'string' && (
          fieldValue.startsWith('http://') || 
          fieldValue.startsWith('https://') || 
          fieldValue.includes('respuestas-formulario')
        )) {
          console.log(`Field ${field.id} already has a URL: ${fieldValue}`);
          // No need to re-upload, keep the existing URL
        }
        else {
          console.warn(`Unexpected value for uploadable field ${field.id}:`, fieldValue);
        }
      }
    }
  }
  
  // Wait for all uploads to complete
  if (uploadPromises.length > 0) {
    console.log(`Waiting for ${uploadPromises.length} uploads to complete...`);
    try {
      const results = await Promise.allSettled(uploadPromises);
      console.log('All file uploads completed:', results);
      
      // Check if any uploads failed
      const failedUploads = results.filter(result => result.status === 'rejected').length;
      if (failedUploads > 0) {
        console.warn(`${failedUploads} file uploads failed, but continuing with form submission`);
        toast({
          title: "Advertencia",
          description: `Algunos archivos no pudieron ser subidos (${failedUploads}), pero el formulario se enviará de todos modos`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error handling file uploads:', error);
      toast({
        title: "Advertencia",
        description: "Hubo problemas al subir algunos archivos, pero intentaremos enviar el formulario de todos modos",
        variant: "default",
      });
      // Continue with form submission despite upload errors
    }
  } else {
    console.log('No files to upload');
  }
  
  console.log("Form data after processing uploads:", processedData);
  return processedData;
};

// Format responses to use labels instead of IDs and include numeric values
export const formatResponsesWithLabels = (
  formFields: any[],
  processedData: Record<string, any>
): Record<string, any> => {
  const formattedResponses: Record<string, any> = {};
  
  // Create a mapping between field IDs and their labels
  if (Array.isArray(formFields)) {
    formFields.forEach(field => {
      if (processedData[field.id] !== undefined) {
        const label = field.label || `Pregunta ${field.id.substring(0, 5)}`;
        const fieldValue = processedData[field.id];
        
        // Store the regular response
        formattedResponses[label] = fieldValue;
        
        // If this field has numeric values, also store the numeric value separately
        if (field.hasNumericValues) {
          const numericValue = calculateFieldNumericValue(field, fieldValue);
          if (numericValue !== null && numericValue !== undefined) {
            formattedResponses[`${label} (Valor Numérico)`] = numericValue;
          }
        }
      }
    });
  }
  
  return formattedResponses;
};

// Calculate numeric value for a specific field based on its response
export const calculateFieldNumericValue = (field: any, response: any): number | null => {
  if (!field.hasNumericValues || response === undefined || response === null) {
    return null;
  }
  
  // Skip file uploads, images, drawings and signatures - they don't contribute to score
  if (field.type === 'image-upload' || field.type === 'file-upload' || 
      field.type === 'drawing' || field.type === 'signature') {
    return null;
  }
  
  if (field.type === 'checkbox' && Array.isArray(response)) {
    // For checkboxes, sum numeric values of all selected options
    let total = 0;
    response.forEach(value => {
      const option = field.options?.find(opt => opt.value === value);
      if (option && option.numericValue !== undefined) {
        total += option.numericValue;
      }
    });
    return total;
  } else if (field.type === 'yesno') {
    // For Yes/No fields, find the corresponding option
    const isYes = response === true || response === "true" || response === "yes" || response === "sí";
    const option = field.options?.[isYes ? 0 : 1]; // Assuming Yes is index 0 and No is index 1
    return option?.numericValue ?? null;
  } else if (field.type === 'radio' || field.type === 'select' || field.type === 'image-select') {
    // For single selections and image selections
    const option = field.options?.find(opt => opt.value === response);
    return option?.numericValue ?? null;
  } else if (field.type === 'star-rating' || field.type === 'opinion-scale') {
    // For direct numeric ratings
    const numValue = parseInt(response);
    return !isNaN(numValue) ? numValue : null;
  }
  
  return null;
};

// Save form response to database
export const saveFormResponseToDatabase = async (
  form: any,
  formId: string,
  userEmail: string,
  formattedResponses: Record<string, any>,
  apiEndpoint: string
): Promise<void> => {
  try {
    // Get admin email (form creator)
    const adminEmail = form.createdBy || form.ownerId || null;
    
    // Check if this user already has a response for this form
    // This handles the edit case
    const { data: existingData, error: existingError } = await supabase
      .from('formulario')
      .select('id')
      .eq('nombre_formulario', form.title)
      .eq('nombre_invitado', userEmail);
    
    // If the user already has a response and the form allows editing
    if (existingData && existingData.length > 0 && form.allowEditOwnResponses) {
      // Update the existing response
      await supabase
        .from('formulario')
        .update({
          respuestas: formattedResponses,
          estatus: true // Confirm it's still complete
        })
        .eq('id', existingData[0].id);
        
      console.log(`Updated existing response for form ${form.title} by user ${userEmail}`);
    } else {
      // Insert a new response
      await supabase
        .from('formulario')
        .insert({
          nombre_formulario: form.title || 'Untitled Form',
          nombre_invitado: userEmail,  // Ensure we use the correct user email
          nombre_administrador: adminEmail || null,
          respuestas: formattedResponses,
          estatus: true // Set the status to true for completed forms
        });

      console.log(`Form response saved to Supabase for user ${userEmail} with status=true`);
    }

    // Send to MySQL database through API
    try {
      // Prepare data for MySQL submission
      const mysqlData = {
        form_id: formId,
        responses: JSON.stringify(formattedResponses),
        submitted_by: userEmail, // Ensure we use the correct user email
        form_title: form.title || 'Untitled Form',
        estatus: true // Add status field here too for MySQL
      };
      
      // Send to MySQL API endpoint
      await sendHttpRequest({
        url: apiEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: mysqlData,
        timeout: 15000
      });
      
      toast({
        title: "Respuesta guardada",
        description: "La respuesta fue guardada correctamente",
      });
    } catch (error) {
      console.error('Error saving to MySQL:', error);
      // Even if MySQL fails, we've already saved to local state and Supabase
      toast({
        title: "Aviso",
        description: "La respuesta fue guardada pero hubo un problema al sincronizar con la base de datos",
        variant: "default"
      });
      // We don't throw an error here so the submission still counts as successful
    }
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    // We still consider the form submitted since it's saved in local state
    toast({
      title: "Aviso",
      description: "La respuesta fue guardada localmente, pero hubo un problema al guardarla en la nube",
      variant: "default"
    });
    // We don't throw an error here so the submission still counts as successful
  }
};

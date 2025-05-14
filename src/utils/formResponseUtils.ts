
import { FormResponse } from '@/types/form';
import { toast } from "@/hooks/use-toast";
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

// Format responses to use labels instead of IDs
export const formatResponsesWithLabels = (
  formFields: any[],
  processedData: Record<string, any>,
  questionScores?: Record<string, number>,
  totalScore?: number
): Record<string, any> => {
  const formattedResponses: Record<string, any> = {};
  
  // Create a mapping between field IDs and their labels
  if (Array.isArray(formFields)) {
    formFields.forEach(field => {
      if (processedData[field.id] !== undefined) {
        const label = field.label || `Pregunta ${field.id.substring(0, 5)}`;
        formattedResponses[label] = processedData[field.id];
        
        // Add score for this field if available
        if (questionScores && questionScores[field.id] !== undefined) {
          formattedResponses[`${label} - Puntos`] = questionScores[field.id];
        }
      }
    });
  }
  
  // Add total score if available
  if (totalScore !== undefined) {
    formattedResponses['Puntaje Total'] = totalScore;
  }
  
  return formattedResponses;
};

// Save form response to database
export const saveFormResponseToDatabase = async (
  form: any,
  formId: string,
  userEmail: string,
  formattedResponses: Record<string, any>,
  questionScores: Record<string, number> | undefined,
  totalScore: number | undefined,
  apiEndpoint: string
): Promise<void> => {
  try {
    // Get admin email (form creator)
    const adminEmail = form.createdBy || form.ownerId || null;
    
    // Format responses with labels and scores
    const responsesWithScores = formatResponsesWithLabels(
      form.fields, 
      formattedResponses,
      questionScores,
      totalScore
    );
    
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
          respuestas: responsesWithScores,
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
          respuestas: responsesWithScores,
          estatus: true // Set the status to true for completed forms
        });

      console.log(`Form response saved to Supabase for user ${userEmail} with status=true`);
    }

    // Send to MySQL database through API
    try {
      // Prepare data for MySQL submission
      const mysqlData = {
        form_id: formId,
        responses: JSON.stringify(responsesWithScores),
        submitted_by: userEmail, // Ensure we use the correct user email
        form_title: form.title || 'Untitled Form',
        estatus: true, // Add status field here too for MySQL
        total_score: totalScore
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

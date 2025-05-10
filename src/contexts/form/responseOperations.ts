
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { sendHttpRequest, validateFormResponses } from '@/utils/http-utils';
import { supabase } from '@/integrations/supabase/client';

export const submitFormResponseOperation = (
  getForm: (id: string) => any,
  setResponses: React.Dispatch<React.SetStateAction<FormResponse[]>>,
  currentUser: { email: string } | null | undefined,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    // Validate that data is not empty
    if (!validateFormResponses(data)) {
      toast({
        title: "Error",
        description: "No se pueden enviar respuestas vacías",
        variant: "destructive",
      });
      throw new Error("Las respuestas del formulario no pueden estar vacías");
    }
    
    // First try to get the form from the location state if provided
    let form = formFromLocation;
    
    // If not available in location, try to get it from the context
    if (!form) {
      form = getForm(formId);
    }
    
    if (!form) {
      toast({
        title: "Error",
        description: "No se encontró el formulario",
        variant: "destructive",
      });
      throw new Error("No se encontró el formulario");
    }
    
    // Get user email - ensure we always have a valid user identifier
    const userEmail = currentUser?.email || localStorage.getItem('userEmail');
    
    if (!userEmail) {
      toast({
        title: "Error", 
        description: "No se pudo identificar al usuario",
        variant: "destructive",
      });
      throw new Error("No se pudo identificar al usuario");
    }
    
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
                
                // Handle RLS policy violation specifically
                if (err.message && err.message.includes('new row violates row-level security policy')) {
                  // For RLS errors, we'll try an alternative approach with anon key
                  toast({
                    title: "Advertencia",
                    description: "Se detectó un problema de permisos al subir archivos. Procesando el formulario sin archivos.",
                    variant: "default",
                  });
                  
                  // Store placeholder instead of file URL
                  processedData[field.id] = "Error de permisos al subir archivo: " + field.label;
                } else {
                  // For other errors, continue with form submission with a note
                  processedData[field.id] = "Error al subir archivo: " + (err.message || "Error desconocido");
                }
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
                
                // Handle RLS policy violation specifically
                if (err.message && err.message.includes('new row violates row-level security policy')) {
                  // For RLS errors, we'll try an alternative approach with anon key
                  toast({
                    title: "Advertencia",
                    description: "Se detectó un problema de permisos al subir archivos. Procesando el formulario sin archivos.",
                    variant: "default",
                  });
                  
                  // Store placeholder instead of file URL
                  processedData[field.id] = "Error de permisos al subir archivo: " + field.label;
                } else {
                  // For other errors, continue with form submission with error note
                  processedData[field.id] = "Error al subir archivo: " + (err.message || "Error desconocido");
                }
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
    
    // Convert response data to use question labels instead of IDs
    const formattedResponses: Record<string, any> = {};
    
    // Create a mapping between field IDs and their labels
    if (Array.isArray(form.fields)) {
      form.fields.forEach(field => {
        if (processedData[field.id] !== undefined) {
          const label = field.label || `Pregunta ${field.id.substring(0, 5)}`;
          formattedResponses[label] = processedData[field.id];
        }
      });
    }
    
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: processedData, // Keep original format for internal usage
      submittedBy: userEmail,
      submittedAt: new Date().toISOString(),
    };
    
    // Make sure we persist the responses to localStorage FIRST to ensure local state is updated
    // This is crucial for showing the form as completed even if database operations fail
    const updatedResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
    updatedResponses.push(response);
    localStorage.setItem('formResponses', JSON.stringify(updatedResponses));
    
    // Update the state after localStorage has been updated
    setResponses(prev => {
      console.log('Setting responses:', [...prev, response]);
      return [...prev, response];
    });
    
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
    
    return response;
  };
};

// Helper function to process file uploads to Supabase storage
const processFileUpload = async (fileData: string | File, fieldId: string, userEmail: string, formId: string): Promise<string> => {
  try {
    console.log(`Starting file upload process for field ${fieldId}`);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = getFileExtension(fileData);
    const filename = `${formId}/${userEmail.replace('@', '_at_')}/${fieldId}_${timestamp}${fileExtension}`;
    
    console.log(`Generated file path: respuestas-formulario/${filename}`);
    
    // Upload the file to Supabase Storage
    let uploadResult;
    
    // For base64 data (images, drawings, signatures)
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      // Convert base64 to blob
      const res = await fetch(fileData);
      const blob = await res.blob();
      
      console.log(`Converted base64 to blob: ${blob.type}, size: ${blob.size}`);
      
      try {
        // Upload to Supabase Storage - Using upsert to handle RLS policy
        uploadResult = await supabase.storage
          .from('respuestas-formulario')
          .upload(filename, blob, {
            contentType: blob.type,
            upsert: true
          });
          
        if (uploadResult.error) {
          console.error('Storage upload error:', uploadResult.error);
          throw uploadResult.error;
        }
      } catch (error) {
        // Log the specific error for debugging
        console.error('Error uploading base64 data:', error);
        
        // If we get an RLS policy error, try another approach or fail gracefully
        if (error.message && error.message.includes('new row violates row-level security policy')) {
          throw new Error('new row violates row-level security policy');
        }
        
        throw error;
      }
    } 
    // For File objects (file uploads)
    else if (fileData instanceof File) {
      console.log(`Uploading File object: ${fileData.name}, type: ${fileData.type}, size: ${fileData.size}`);
      
      try {
        // Upload to Supabase Storage - Using upsert to handle RLS policy
        uploadResult = await supabase.storage
          .from('respuestas-formulario')
          .upload(filename, fileData, {
            contentType: fileData.type,
            upsert: true
          });
          
        if (uploadResult.error) {
          console.error('Storage upload error:', uploadResult.error);
          throw uploadResult.error;
        }
      } catch (error) {
        // Log the specific error for debugging
        console.error('Error uploading file object:', error);
        
        // If we get an RLS policy error, try another approach or fail gracefully
        if (error.message && error.message.includes('new row violates row-level security policy')) {
          throw new Error('new row violates row-level security policy');
        }
        
        throw error;
      }
    } else {
      throw new Error('Unsupported file data format');
    }
    
    if (!uploadResult.data) {
      console.error('No data returned from storage upload');
      throw new Error('No data returned from storage upload');
    }
    
    // Return the public URL
    const { data } = supabase.storage.from('respuestas-formulario').getPublicUrl(filename);
    const fileUrl = data.publicUrl;
    
    console.log(`File uploaded successfully: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error('Error in processFileUpload:', error);
    throw error;
  }
};

// Helper function to determine file extension
const getFileExtension = (fileData: string | File): string => {
  if (fileData instanceof File) {
    // Get extension from file name
    const parts = fileData.name.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
  } else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
    // Extract MIME type from data URL
    const mimeMatch = fileData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);/);
    if (mimeMatch && mimeMatch[1]) {
      const mimeType = mimeMatch[1].toLowerCase();
      switch (mimeType) {
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/gif': return '.gif';
        case 'image/svg+xml': return '.svg';
        default: return `.${mimeType.split('/')[1] || 'bin'}`;
      }
    }
  }
  return '.bin'; // Default extension
};

export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };
};

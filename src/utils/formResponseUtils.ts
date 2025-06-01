import { supabase } from '@/integrations/supabase/client';
import { FormField, Form } from '@/types/form';

// Process form data including file uploads
export const processFormData = async (
  form: Form,
  data: Record<string, any>,
  userEmail: string,
  formId: string
): Promise<Record<string, any>> => {
  const processedData = { ...data };
  
  // Process file upload fields
  for (const field of form.fields) {
    if ((field.type === 'image-upload' || field.type === 'file-upload' || 
         field.type === 'drawing' || field.type === 'signature') && 
        processedData[field.id]) {
      
      const fileData = processedData[field.id];
      
      // Check if it's already a URL (already uploaded)
      if (typeof fileData === 'string' && fileData.startsWith('http')) {
        continue;
      }
      
      try {
        let uploadResult;
        
        if (fileData instanceof File) {
          // Handle File objects
          uploadResult = await uploadFileToSupabase(fileData, userEmail, formId, field.id);
        } else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
          // Handle base64 data (for drawings and signatures)
          uploadResult = await uploadBase64ToSupabase(fileData, userEmail, formId, field.id, field.type);
        }
        
        if (uploadResult) {
          processedData[field.id] = uploadResult;
          console.log(`Uploaded ${field.type} for field ${field.id}:`, uploadResult);
        }
      } catch (error) {
        console.error(`Error uploading ${field.type} for field ${field.id}:`, error);
        // Keep the original data if upload fails
      }
    }
  }
  
  return processedData;
};

// Upload file to Supabase storage
const uploadFileToSupabase = async (
  file: File,
  userEmail: string,
  formId: string,
  fieldId: string
): Promise<string | null> => {
  try {
    const timestamp = new Date().getTime();
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedEmail}_${formId}_${fieldId}_${timestamp}_${file.name}`;
    const filePath = `respuestas-formulario/${fileName}`;

    const { data, error } = await supabase.storage
      .from('formularios')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file to Supabase:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('formularios')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    return null;
  }
};

// Upload base64 data to Supabase storage
const uploadBase64ToSupabase = async (
  base64Data: string,
  userEmail: string,
  formId: string,
  fieldId: string,
  fieldType: string
): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    const timestamp = new Date().getTime();
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = fieldType === 'drawing' ? 'png' : 'png'; // Default to PNG
    const fileName = `${sanitizedEmail}_${formId}_${fieldId}_${timestamp}.${extension}`;
    const filePath = `respuestas-formulario/${fileName}`;

    const { data, error } = await supabase.storage
      .from('formularios')
      .upload(filePath, blob);

    if (error) {
      console.error('Error uploading base64 to Supabase:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('formularios')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64ToSupabase:', error);
    return null;
  }
};

// Calculate total score
const calculateTotalScore = (fields: FormField[], responses: Record<string, any>): number => {
  let totalScore = 0;
  
  fields.forEach(field => {
    if (!field.hasNumericValues) return;
    
    const response = responses[field.id];
    if (response === undefined || response === null) return;
    
    // Skip file uploads, images, drawings and signatures
    if (field.type === 'image-upload' || field.type === 'file-upload' || 
        field.type === 'drawing' || field.type === 'signature') {
      return;
    }
    
    if (field.type === 'checkbox' && Array.isArray(response)) {
      response.forEach(value => {
        const option = field.options?.find(opt => opt.value === value);
        if (option && option.numericValue !== undefined) {
          totalScore += option.numericValue;
        }
      });
    } else if (field.type === 'yesno') {
      const isYes = response === true || response === "true" || response === "yes" || response === "sí";
      const option = field.options?.[isYes ? 0 : 1];
      if (option && option.numericValue !== undefined) {
        totalScore += option.numericValue;
      }
    } else if (field.type === 'radio' || field.type === 'select' || field.type === 'image-select') {
      const option = field.options?.find(opt => opt.value === response);
      if (option && option.numericValue !== undefined) {
        totalScore += option.numericValue;
      }
    } else if (field.type === 'star-rating' || field.type === 'opinion-scale') {
      const numValue = parseInt(response);
      if (!isNaN(numValue)) {
        totalScore += numValue;
      }
    }
  });
  
  return totalScore;
};

// Get score feedback from database
const getScoreFeedbackFromDB = async (score: number, formId: string): Promise<string | null> => {
  try {
    const { data: forms, error } = await supabase
      .from('formulario_construccion')
      .select('*');
    
    if (error || !forms) {
      console.error('Error fetching forms for score feedback:', error);
      return null;
    }
    
    // Find the form by ID or UUID
    const form = forms.find(f => 
      f.id.toString() === formId || 
      (f.preguntas && JSON.stringify(f.preguntas).toLowerCase().includes(formId.toLowerCase())) ||
      JSON.stringify(f).toLowerCase().includes(formId.toLowerCase())
    );
    
    if (!form) {
      console.log('Form not found for score feedback');
      return null;
    }
    
    // Get score ranges from rangos_mensajes or configuracion
    let scoreRanges = [];
    if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes)) {
      scoreRanges = form.rangos_mensajes;
    } else if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
      scoreRanges = form.configuracion.scoreRanges;
    }
    
    // Find matching range
    const matchingRange = scoreRanges.find(range => 
      score >= range.min && score <= range.max
    );
    
    return matchingRange?.message || null;
  } catch (error) {
    console.error('Error getting score feedback from DB:', error);
    return null;
  }
};

// Format responses with labels and include score data
export const formatResponsesWithLabels = async (
  fields: FormField[],
  responses: Record<string, any>,
  formId: string
): Promise<Record<string, any>> => {
  const formattedResponses: Record<string, any> = {};
  
  // Calculate total score if there are numeric fields
  const hasNumericFields = fields.some(f => f.hasNumericValues);
  let totalScore = 0;
  let scoreFeedback = null;
  
  if (hasNumericFields) {
    totalScore = calculateTotalScore(fields, responses);
    scoreFeedback = await getScoreFeedbackFromDB(totalScore, formId);
    
    // Add score data to formatted responses
    formattedResponses['_puntuacion_total'] = totalScore;
    if (scoreFeedback) {
      formattedResponses['_mensaje_puntuacion'] = scoreFeedback;
    }
  }
  
  // Format each field response
  fields.forEach(field => {
    const fieldLabel = field.label || `Pregunta ${field.id.substring(0, 5)}`;
    const response = responses[field.id];
    
    if (response !== undefined && response !== null && response !== '') {
      if (field.type === 'checkbox' && Array.isArray(response)) {
        // For checkboxes, convert values to labels
        const selectedLabels = response.map(value => {
          const option = field.options?.find(opt => opt.value === value);
          return option ? option.label : value;
        });
        formattedResponses[fieldLabel] = selectedLabels.join(', ');
      } else if ((field.type === 'radio' || field.type === 'select' || field.type === 'image-select') && field.options) {
        // For single selections, convert value to label
        const option = field.options.find(opt => opt.value === response);
        formattedResponses[fieldLabel] = option ? option.label : response;
      } else if (field.type === 'yesno') {
        // For Yes/No fields, convert boolean to text
        const isYes = response === true || response === "true" || response === "yes" || response === "sí";
        formattedResponses[fieldLabel] = isYes ? 'Sí' : 'No';
      } else {
        // For other field types, use the response as is
        formattedResponses[fieldLabel] = response;
      }
    }
  });
  
  console.log('Formatted responses with score data:', formattedResponses);
  return formattedResponses;
};

// Save form response to database
export const saveFormResponseToDatabase = async (
  form: Form,
  formId: string,
  userEmail: string,
  formattedResponses: Record<string, any>,
  apiEndpoint: string
): Promise<void> => {
  try {
    // Save to Supabase
    const { error: supabaseError } = await supabase
      .from('formulario')
      .insert({
        nombre_formulario: form.title,
        nombre_invitado: userEmail,
        nombre_administrador: form.ownerId || 'unknown',
        respuestas: formattedResponses,
        estatus: true
      });

    if (supabaseError) {
      console.error('Error saving to Supabase:', supabaseError);
      throw supabaseError;
    }

    console.log('Response saved to Supabase successfully');

    // Save to MySQL if HTTP config is enabled
    if (form.httpConfig?.enabled && form.httpConfig?.url) {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            data: {
              nombre_formulario: form.title,
              nombre_invitado: userEmail,
              nombre_administrador: form.ownerId || 'unknown',
              respuestas: JSON.stringify(formattedResponses)
            }
          })
        });

        const mysqlResult = await response.json();
        console.log('MySQL save result:', mysqlResult);

        // Also send to custom HTTP endpoint if configured
        const customHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // Add custom headers
        if (form.httpConfig.headers) {
          form.httpConfig.headers.forEach(header => {
            if (header.key && header.value) {
              customHeaders[header.key] = header.value;
            }
          });
        }

        // Parse and prepare the body
        let customBody = form.httpConfig.body || '{}';
        try {
          const bodyObj = JSON.parse(customBody);
          // Replace placeholders with actual data
          const processedBody = JSON.stringify(bodyObj).replace(
            /"respuesta"/g, 
            JSON.stringify(formattedResponses)
          );
          
          const customResponse = await fetch(form.httpConfig.url, {
            method: form.httpConfig.method || 'POST',
            headers: customHeaders,
            body: processedBody
          });

          console.log('Custom HTTP endpoint response:', customResponse.status);
        } catch (bodyError) {
          console.error('Error processing custom HTTP body:', bodyError);
        }
      } catch (httpError) {
        console.error('Error with HTTP configuration:', httpError);
        // Don't throw here as the main save was successful
      }
    }
  } catch (error) {
    console.error('Error saving form response:', error);
    throw error;
  }
};

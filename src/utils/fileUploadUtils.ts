
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

// Helper function to determine file extension
export const getFileExtension = (fileData: string | File): string => {
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

// Helper function to process file uploads to Supabase storage
export const processFileUpload = async (fileData: string | File, fieldId: string, userEmail: string, formId: string): Promise<string> => {
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

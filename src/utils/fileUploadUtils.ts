
import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'respuestas_formularios';

export const uploadFileToSupabase = async (
  file: File, 
  userEmail: string, 
  formId: string, 
  fieldId: string
): Promise<string> => {
  try {
    // Generate a unique filename with timestamp and random string
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userEmail}/${formId}/${fieldId}/${timestamp}_${randomString}.${fileExtension}`;

    console.log(`Uploading file to bucket: ${BUCKET_NAME}, path: ${fileName}`);
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to Supabase:', error);
      throw new Error(`Error uploading file: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('File uploaded successfully, public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    throw error;
  }
};

export const uploadDrawingToSupabase = async (
  dataUrl: string, 
  userEmail: string, 
  formId: string, 
  fieldId: string
): Promise<string> => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a file from the blob
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${userEmail}/${formId}/${fieldId}/drawing_${timestamp}_${randomString}.png`;
    
    console.log(`Uploading drawing to bucket: ${BUCKET_NAME}, path: ${fileName}`);
    
    // Upload the drawing to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png'
      });

    if (error) {
      console.error('Error uploading drawing to Supabase:', error);
      throw new Error(`Error uploading drawing: ${error.message}`);
    }

    // Get the public URL for the uploaded drawing
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('Drawing uploaded successfully, public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadDrawingToSupabase:', error);
    throw error;
  }
};

// Helper function to check if a URL is from our respuestas_formularios bucket
export const isFormResponseFile = (url: string): boolean => {
  return typeof url === 'string' && url.includes('respuestas_formularios');
};

// Helper function to get file info from URL
export const getFileInfoFromUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    
    // Extract file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Determine if it's an image
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const isImage = imageExtensions.includes(fileExtension);
    
    return {
      fileName: decodeURIComponent(fileName),
      fileExtension,
      isImage,
      isFromBucket: isFormResponseFile(url)
    };
  } catch (error) {
    console.error('Error parsing file URL:', error);
    return {
      fileName: 'Archivo',
      fileExtension: '',
      isImage: false,
      isFromBucket: false
    };
  }
};


import { supabase } from "@/integrations/supabase/client";

const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

export const uploadArticleImage = async (file: File): Promise<string> => {
  console.log('Starting image upload:', file.name, 'Size:', file.size);
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${generateUniqueId()}.${fileExtension}`;
  const filePath = `${fileName}`;

  console.log('Uploading to path:', filePath);

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('article-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  console.log('Upload successful:', uploadData);

  const { data } = supabase.storage
    .from('article-images')
    .getPublicUrl(filePath);
    
  if (!data.publicUrl) {
    console.error('Failed to get public URL');
    throw new Error('Failed to get public URL for the image.');
  }

  console.log('Public URL generated:', data.publicUrl);
  return data.publicUrl;
};

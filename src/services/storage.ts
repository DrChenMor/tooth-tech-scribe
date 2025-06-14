
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const uploadArticleImage = async (file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('article-images')
    .getPublicUrl(filePath);
    
  if (!data.publicUrl) {
    throw new Error('Failed to get public URL for the image.');
  }

  return data.publicUrl;
};

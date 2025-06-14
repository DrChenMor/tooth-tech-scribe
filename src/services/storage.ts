
import { supabase } from "@/integrations/supabase/client";

const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

export const uploadArticleImage = async (file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${generateUniqueId()}.${fileExtension}`;
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


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { uploadArticleImage } from '@/services/storage';
import { Loader2, Upload } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

const ImageUpload = ({ value, onChange }: ImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const { toast } = useToast();

  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    }
  }, [value, preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadArticleImage(selectedFile);
      onChange(publicUrl);
      toast({ title: "Image uploaded successfully!" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview && <img src={preview} alt="Image Preview" className="w-full max-w-sm rounded-lg object-cover" />}
      <div className="flex items-center gap-4">
        <Input type="file" accept="image/*" onChange={handleFileChange} className="flex-grow" />
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} type="button">
          {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
          <span className="ml-2 hidden sm:inline">Upload</span>
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;

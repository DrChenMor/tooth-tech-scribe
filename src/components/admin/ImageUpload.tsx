
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { uploadArticleImage } from '@/services/storage';
import { Loader2, Upload, X } from 'lucide-react';

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
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please select an image file', 
          variant: 'destructive' 
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: 'File too large', 
          description: 'Please select an image smaller than 5MB', 
          variant: 'destructive' 
        });
        return;
      }

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
      console.log('Starting upload process...');
      const publicUrl = await uploadArticleImage(selectedFile);
      console.log('Upload completed, URL:', publicUrl);
      
      onChange(publicUrl);
      setPreview(publicUrl);
      
      toast({ 
        title: "Image uploaded successfully!",
        description: "Your image is now ready to use in your article."
      });
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ 
        title: 'Upload failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative">
          <img 
            src={preview} 
            alt="Image Preview" 
            className="w-full max-w-sm rounded-lg object-cover"
            onError={(e) => {
              console.error('Image failed to load:', preview);
              toast({
                title: 'Image load error',
                description: 'The image could not be displayed',
                variant: 'destructive'
              });
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', preview);
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="flex-grow" 
        />
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading} 
          type="button"
        >
          {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">
            {isUploading ? 'Uploading...' : 'Upload'}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;


import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

interface ImageUploadProps {
  value: string | File | null;
  onChange: (value: string | File) => void;
}

const ImageUpload = ({ value, onChange }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
    } else if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please select an image file', 
          variant: 'destructive' 
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: 'File too large', 
          description: 'Please select an image smaller than 5MB', 
          variant: 'destructive' 
        });
        return;
      }

      onChange(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative">
          <img 
            src={preview} 
            alt="Image Preview" 
            className="w-full max-w-sm rounded-lg object-cover"
            onError={() => {
              toast({
                title: 'Image load error',
                description: 'The preview could not be displayed',
                variant: 'destructive'
              });
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
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="flex-grow" 
        />
      </div>
    </div>
  );
};

export default ImageUpload;

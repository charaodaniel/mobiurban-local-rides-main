
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  type: 'profile' | 'car';
  userId: string;
}

const ImageUpload = ({ currentImageUrl, onImageUploaded, type, userId }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem.');
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter menos de 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success('Imagem carregada com sucesso!');

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      setPreviewUrl(null);
      onImageUploaded('');
      toast.success('Imagem removida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === 'profile' ? <Camera className="h-5 w-5" /> : <Car className="h-5 w-5" />}
          {type === 'profile' ? 'Foto de Perfil' : 'Foto do Veículo'}
        </CardTitle>
        <CardDescription>
          {type === 'profile' 
            ? 'Adicione uma foto sua para que os passageiros possam identificá-lo'
            : 'Adicione uma foto do seu veículo'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt={type === 'profile' ? 'Foto de perfil' : 'Foto do veículo'}
                className={`w-full object-cover rounded-lg border-2 border-gray-200 ${
                  type === 'profile' ? 'h-48' : 'h-32'
                }`}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={removeImage}
              className="w-full"
            >
              Remover Imagem
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Clique para selecionar uma imagem
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`image-upload-${type}`}>Selecionar Arquivo</Label>
              <Input
                id={`image-upload-${type}`}
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploading}
              />
            </div>
            
            <Button 
              variant="outline" 
              disabled={uploading}
              className="w-full"
              onClick={() => document.getElementById(`image-upload-${type}`)?.click()}
            >
              {uploading ? 'Carregando...' : 'Selecionar Imagem'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;

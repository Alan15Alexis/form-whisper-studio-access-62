
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Check, Link, QrCode } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { toast } from '@/components/ui/use-toast';
import { useForm } from '@/contexts/form';

interface ShareFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
  isPrivate?: boolean;
  allowedUsers?: string[];
}

const ShareFormDialog = ({ open, onOpenChange, formId, formTitle, isPrivate }: ShareFormDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { generateAccessLink } = useForm();
  
  // Generate the share URL from the form ID directly
  const shareUrl = formId ? generateAccessLink(formId) : '';
  
  // Safely extract the base form URL without the access token
  const displayUrl = shareUrl ? shareUrl.split('/access/')[0] : '';

  const handleCopy = async () => {
    if (!shareUrl) {
      toast({
        title: 'Error',
        description: 'No hay un enlace disponible para copiar',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use the navigator.clipboard API with proper error handling
      if (!navigator.clipboard) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy method failed');
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
      
      setCopied(true);
      toast({
        title: 'Enlace copiado',
        description: 'El enlace del formulario ha sido copiado al portapapeles',
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast({
        title: 'Error',
        description: 'No se pudo copiar el enlace al portapapeles',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir formulario</DialogTitle>
          <DialogDescription>
            Comparte "{formTitle}" con otras personas para que puedan responderlo
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Enlace
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Código QR
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="mt-4">
            <div className="flex items-center space-x-2">
              <Input
                value={displayUrl}
                readOnly
                className="flex-1"
              />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleCopy} 
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Al compartir este enlace, las personas deberán validar su acceso por correo electrónico si el formulario es privado.
            </p>
          </TabsContent>
          
          <TabsContent value="qr" className="mt-4">
            <div className="p-4 flex justify-center">
              <QRCodeGenerator value={shareUrl} />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Muestra este código QR para compartir el formulario. Los usuarios tendrán que validar su acceso si el formulario es privado.
            </p>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar enlace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFormDialog;

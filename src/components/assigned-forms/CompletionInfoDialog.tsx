
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/types/form";
import { format } from "date-fns";

interface CompletionInfoDialogProps {
  form: Form;
  open: boolean;
  onClose: () => void;
}

const CompletionInfoDialog = ({ form, open, onClose }: CompletionInfoDialogProps) => {
  // Format date with time or use fallback
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Fecha y hora no disponible';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: form.formColor || 'inherit' }}>
            Formulario Completado
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p><strong>Formulario:</strong> {form.title}</p>
          <p><strong>Fecha de envío:</strong> {formatDateTime(form.updatedAt)}</p>
          <p className="text-sm text-gray-500">
            Este formulario ya ha sido completado correctamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionInfoDialog;

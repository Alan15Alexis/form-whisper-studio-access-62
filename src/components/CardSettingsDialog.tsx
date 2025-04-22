
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string;
  onSave: (newId: string) => void;
}

const CardSettingsDialog: React.FC<CardSettingsDialogProps> = ({ open, onOpenChange, currentId, onSave }) => {
  const [customId, setCustomId] = useState(currentId || "");

  const handleSave = () => {
    if (customId.trim()) {
      onSave(customId.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Configurar ID del elemento</DialogTitle>
        <DialogDescription>
          Introduce el ID que quieres asignar a este elemento.
        </DialogDescription>
        <Input
          value={customId}
          onChange={e => setCustomId(e.target.value)}
          placeholder="ID personalizado"
          autoFocus
        />
        <DialogFooter>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardSettingsDialog;

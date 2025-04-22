
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog } from "lucide-react";
import CardSettingsDialog from "./CardSettingsDialog";

interface ElementCardProps {
  element: {
    id: string;
    label: string;
    // puedes añadir más propiedades aquí
    customId?: string;
  };
  onCustomIdChange?: (id: string, newCustomId: string) => void;
}

const ElementCard: React.FC<ElementCardProps> = ({ element, onCustomIdChange }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSaveCustomId = (newId: string) => {
    if (onCustomIdChange) onCustomIdChange(element.id, newId);
  };

  return (
    <Card className="relative">
      <CardHeader className="flex items-center justify-between p-4 pb-2">
        <span className="font-semibold">{element.label}</span>
        <Button 
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => setSettingsOpen(true)}
        >
          <Cog size={20} />
        </Button>
      </CardHeader>
      <CardContent>
        {/* ...otro contenido del elemento/card... */}
        <div className="text-xs text-gray-500">ID: {element.customId || "(no asignado)"}</div>
      </CardContent>
      <CardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentId={element.customId || ""}
        onSave={handleSaveCustomId}
      />
    </Card>
  );
};

export default ElementCard;

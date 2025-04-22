
import React, { useState } from "react";
import ElementCard from "@/components/ElementCard";
import { Button } from "@/components/ui/button";

const initialElements = [
  { id: "1", label: "Elemento 1" },
  { id: "2", label: "Elemento 2" },
  { id: "3", label: "Elemento 3" },
];

const ElementCardsList: React.FC = () => {
  const [elements, setElements] = useState<Array<{id: string, label: string, customId?: string}>>(initialElements);

  const handleCustomIdChange = (id: string, newCustomId: string) => {
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, customId: newCustomId } : el
      )
    );
  };

  const exportIdsJson = () => {
    const ids = elements.reduce((acc, el) => {
      acc[el.id] = el.customId || null;
      return acc;
    }, {} as Record<string, string | null>);
    alert("JSON de IDs configurados:\n" + JSON.stringify(ids, null, 2));
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
        {elements.map(el => (
          <ElementCard
            key={el.id}
            element={el}
            onCustomIdChange={handleCustomIdChange}
          />
        ))}
      </div>
      <Button onClick={exportIdsJson}>
        Exportar IDs como JSON
      </Button>
    </div>
  );
};

export default ElementCardsList;

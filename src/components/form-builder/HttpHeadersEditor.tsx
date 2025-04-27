
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash } from "lucide-react";
import { HttpConfig } from "@/types/form";

interface HttpHeadersEditorProps {
  config: HttpConfig;
  onConfigChange: (config: HttpConfig) => void;
  enabled: boolean;
}

const HttpHeadersEditor: React.FC<HttpHeadersEditorProps> = ({
  config,
  onConfigChange,
  enabled
}) => {
  const handleAddHeader = () => {
    const newId = config.headers.length
      ? Math.max(...config.headers.map(h => h.id ?? 0)) + 1
      : 1;
    const newHeaders = [
      ...config.headers, 
      { id: newId, key: "", value: "" }
    ];
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleRemoveHeader = (id: number) => {
    const newHeaders = config.headers.filter(h => h.id !== id);
    onConfigChange({ ...config, headers: newHeaders });
  };

  const handleHeaderChange = (id: number, field: "key" | "value", value: string) => {
    const newHeaders = config.headers.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    );
    onConfigChange({ ...config, headers: newHeaders });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <Label className="text-md font-medium">Headers (Estáticos)</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddHeader}
          className="flex items-center gap-1"
          disabled={!enabled}
        >
          <Plus className="h-4 w-4" /> Agregar Header
        </Button>
      </div>
      
      {config.headers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Clave</TableHead>
              <TableHead className="w-[55%]">Valor</TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.headers.map((header) => (
              <TableRow key={header.id}>
                <TableCell>
                  <Input
                    value={header.key}
                    onChange={(e) => handleHeaderChange(header.id, "key", e.target.value)}
                    placeholder="Authorization"
                    disabled={!enabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={header.value}
                    onChange={(e) => handleHeaderChange(header.id, "value", e.target.value)}
                    placeholder="Bearer eyJ..."
                    disabled={!enabled}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveHeader(header.id)}
                    className="h-8 w-8"
                    disabled={!enabled}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 border rounded-md">
          No hay headers configurados
        </div>
      )}
    </div>
  );
};

export default HttpHeadersEditor;

import { useState } from "react";
import { type FormField as FormFieldType } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Star, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useRef } from "react";

interface FormFieldProps {
  field: FormFieldType;
  value: any;
  onChange: (value: any) => void;
  formColor?: string;
}

const FormField = ({ field, value, onChange, formColor }: FormFieldProps) => {
  const [signaturePoints, setSignaturePoints] = useState<{ x: number, y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\+?[0-9\s\-()]{7,15}$/.test(phone);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) 
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = ('touches' in e)
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;
    
    setSignaturePoints([{ x, y }]);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e)
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = ('touches' in e)
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;
    
    const newPoints = [...signaturePoints, { x, y }];
    setSignaturePoints(newPoints);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      
      ctx.beginPath();
      ctx.moveTo(signaturePoints[signaturePoints.length - 1].x, signaturePoints[signaturePoints.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && signaturePoints.length > 0) {
      const dataURL = canvasRef.current.toDataURL();
      onChange(dataURL);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setSignaturePoints([]);
    onChange(null);
  };

  const renderRatingStars = (maxStars = 5) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(maxStars)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                (value && i < value) 
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "space-y-4 form-field animate-fadeIn rounded-xl p-6 shadow-sm border transition-colors",
        formColor ? {
          background: `${formColor}12`,
          borderColor: formColor,
          boxShadow: `0 2px 8px 0 ${formColor}22`
        } : undefined
      )}
    >
      <Label htmlFor={field.id} className="font-medium text-lg">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {field.description && (
        <p className="text-sm text-gray-500 mb-2">{field.description}</p>
      )}
      
      {field.type === 'text' && (
        <Input
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Escriba su respuesta aquí'}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'textarea' && (
        <Textarea
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Escriba su respuesta aquí'}
          required={field.required}
          className="w-full min-h-[120px]"
          rows={5}
        />
      )}
      
      {field.type === 'email' && (
        <Input
          id={field.id}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'correo@ejemplo.com'}
          required={field.required}
          className={cn(
            "w-full",
            value && !validateEmail(value) && "border-red-500"
          )}
        />
      )}
      
      {field.type === 'number' && (
        <Input
          id={field.id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '0'}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'date' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : "Seleccione fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={onChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
      
      {field.type === 'time' && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            id={field.id}
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="w-full"
          />
        </div>
      )}
      
      {field.type === 'select' && field.options && (
        <Select
          value={value || ''}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder || 'Seleccione una opción'} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {field.type === 'checkbox' && field.options && (
        <div className="space-y-3">
          {field.options.map((option) => {
            const isChecked = Array.isArray(value) ? value?.includes(option.value) : false;
            
            return (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`${field.id}-${option.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? [...value] : [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    onChange(newValues);
                  }}
                  className="mt-1"
                />
                <Label 
                  htmlFor={`${field.id}-${option.id}`} 
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}
      
      {field.type === 'radio' && field.options && (
        <RadioGroup
          value={value || ''}
          onValueChange={onChange}
          className="space-y-3"
        >
          {field.options.map((option) => (
            <div key={option.id} className="flex items-start space-x-2">
              <RadioGroupItem 
                value={option.value} 
                id={`${field.id}-${option.id}`}
                className="mt-1"
              />
              <Label 
                htmlFor={`${field.id}-${option.id}`} 
                className="font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {field.type === 'yesno' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id={`${field.id}-switch`}
              checked={value === "yes"}
              onCheckedChange={(checked) => onChange(checked ? "yes" : "no")}
            />
            <Label htmlFor={`${field.id}-switch`} className="font-normal">
              {value === "yes" ? "Sí" : "No"}
            </Label>
          </div>
        </div>
      )}

      {field.type === 'image-select' && field.options && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {field.options.map((option) => (
            <div 
              key={option.id} 
              className={cn(
                "cursor-pointer border-2 rounded-md overflow-hidden transition-all",
                value === option.value 
                  ? "border-primary ring-2 ring-primary ring-opacity-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onChange(option.value)}
            >
              {option.value.startsWith('http') ? (
                <img 
                  src={option.value} 
                  alt={option.label}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                  {option.label}
                </div>
              )}
              <div className="p-2 text-center text-sm font-medium">
                {option.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {field.type === 'fullname' && (
        <Input
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre completo"
          required={field.required}
          className="w-full"
        />
      )}

      {field.type === 'phone' && (
        <Input
          id={field.id}
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="+XX XXX XXX XXX"
          required={field.required}
          className={cn(
            "w-full",
            value && !validatePhone(value) && "border-red-500"
          )}
        />
      )}

      {field.type === 'address' && (
        <div className="space-y-2">
          <Input
            placeholder="Calle y número"
            value={value?.street || ''}
            onChange={(e) => onChange({...value, street: e.target.value})}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Ciudad"
              value={value?.city || ''}
              onChange={(e) => onChange({...value, city: e.target.value})}
            />
            <Input
              placeholder="Código postal"
              value={value?.zip || ''}
              onChange={(e) => onChange({...value, zip: e.target.value})}
            />
          </div>
          <Input
            placeholder="País"
            value={value?.country || ''}
            onChange={(e) => onChange({...value, country: e.target.value})}
          />
        </div>
      )}

      {field.type === 'image-upload' && (
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor={`file-upload-${field.id}`}
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              {value ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img src={value} alt="Preview" className="max-h-60 max-w-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="mb-2 text-sm text-gray-500">Haga clic para subir una imagen</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                </div>
              )}
              <input
                id={`file-upload-${field.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                required={field.required}
              />
            </label>
          </div>
          
          {value && (
            <Button variant="outline" onClick={() => onChange(null)}>
              Eliminar imagen
            </Button>
          )}
        </div>
      )}

      {field.type === 'file-upload' && (
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor={`file-upload-${field.id}`}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <p className="mb-2 text-sm text-gray-500">
                  {value ? value.name : "Haga clic para subir un archivo"}
                </p>
              </div>
              <input
                id={`file-upload-${field.id}`}
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                required={field.required}
              />
            </label>
          </div>
          
          {value && (
            <Button variant="outline" onClick={() => onChange(null)}>
              Eliminar archivo
            </Button>
          )}
        </div>
      )}

      {(field.type === 'drawing' || field.type === 'signature') && (
        <div className="space-y-2">
          <div className="border rounded-md p-1 bg-white">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-40 border cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
          <Button variant="outline" onClick={clearCanvas} type="button">
            Borrar {field.type === 'signature' ? 'firma' : 'dibujo'}
          </Button>
        </div>
      )}

      {field.type === 'opinion-scale' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map(num => (
              <div key={num} className="flex flex-col items-center">
                <Button
                  type="button"
                  onClick={() => onChange(num)}
                  variant={value === num ? "default" : "outline"}
                  className="w-12 h-12 rounded-full"
                >
                  {num}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Totalmente en desacuerdo</span>
            <span>Totalmente de acuerdo</span>
          </div>
        </div>
      )}

      {field.type === 'star-rating' && renderRatingStars(5)}

      {field.type === 'matrix' && field.options && field.options.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border text-left py-3 px-4"></th>
                {field.options[0]?.columns?.map((col, idx) => (
                  <th key={idx} className="border text-center py-3 px-4">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.options.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border py-3 px-4 font-medium">{row.label}</td>
                  {row.columns?.map((_, colIdx) => (
                    <td key={colIdx} className="border text-center py-3 px-4">
                      <RadioGroup
                        value={
                          value && Array.isArray(value) && value[rowIdx] === colIdx
                            ? `${rowIdx}-${colIdx}`
                            : ""
                        }
                        onValueChange={() => {
                          const newValue = Array.isArray(value)
                            ? [...value]
                            : Array(field.options!.length).fill(null);
                          newValue[rowIdx] = colIdx;
                          onChange(newValue);
                        }}
                      >
                        <RadioGroupItem
                          value={`${rowIdx}-${colIdx}`}
                          id={`matrix-${field.id}-${rowIdx}-${colIdx}`}
                        />
                      </RadioGroup>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {field.type === 'ranking' && field.options && (
        <div className="space-y-2">
          {field.options.map((option, index) => {
            const rank = Array.isArray(value) ? 
              value.findIndex(v => v === option.value) + 1 : 
              null;
            
            return (
              <Card key={option.id} className={cn(
                "border",
                rank ? "border-primary bg-primary/5" : "hover:border-gray-300"
              )}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {rank && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold">
                        {rank}
                      </div>
                    )}
                    <div>{option.label}</div>
                  </div>
                  <div className="space-x-2">
                    <Select
                      value={rank ? rank.toString() : ""}
                      onValueChange={(val) => {
                        const newRank = parseInt(val);
                        let newValue = Array.isArray(value) ? [...value] : [];
                        
                        if (rank) {
                          newValue = newValue.filter(v => v !== option.value);
                        }
                        
                        if (newRank > 0) {
                          newValue = [
                            ...newValue.slice(0, newRank - 1),
                            option.value,
                            ...newValue.slice(newRank - 1)
                          ];
                        }
                        
                        onChange(newValue);
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Posición" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(field.options!.length)].map((_, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {field.type === 'terms' && (
        <div className="space-y-4">
          <div className="border rounded-md p-4 bg-gray-50 text-sm max-h-40 overflow-y-auto">
            {field.description || "Acepto los términos y condiciones de este formulario"}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`terms-${field.id}`}
              checked={value === true}
              onCheckedChange={onChange}
              required={field.required}
            />
            <Label htmlFor={`terms-${field.id}`} className="font-normal">
              Acepto los términos y condiciones
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormField;

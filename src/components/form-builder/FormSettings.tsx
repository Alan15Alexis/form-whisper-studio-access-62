
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users } from "lucide-react";
import { HttpConfig } from "@/types/form";
import HttpConfigSettings from "./HttpConfigSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/toast";

const FORM_COLORS = [{
  name: "Azul",
  value: "#3b82f6"
}, {
  name: "Verde",
  value: "#22c55e"
}, {
  name: "Rojo",
  value: "#ef4444"
}, {
  name: "Morado",
  value: "#8b5cf6"
}, {
  name: "Naranja",
  value: "#f97316"
}, {
  name: "Gris",
  value: "#6b7280"
}, {
  name: "Turquesa",
  value: "#06b6d4"
}];

interface FormSettingsProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
  allowViewOwnResponses?: boolean;
  onAllowViewOwnResponsesChange?: (allow: boolean) => void;
  allowEditOwnResponses?: boolean;
  onAllowEditOwnResponsesChange?: (allow: boolean) => void;
  formColor?: string;
  onFormColorChange?: (color: string) => void;
  httpConfig?: HttpConfig;
  onHttpConfigChange?: (config: HttpConfig) => void;
  formFields?: any[];
  formId?: string;
  collaborators?: string[];
  onCollaboratorsChange?: (collaborators: string[]) => void;
}

const FormSettings = ({
  isPrivate,
  onPrivateChange,
  allowViewOwnResponses,
  onAllowViewOwnResponsesChange,
  allowEditOwnResponses,
  onAllowEditOwnResponsesChange,
  formColor,
  onFormColorChange,
  httpConfig,
  onHttpConfigChange,
  formFields = [],
  formId = "",
  collaborators = [],
  onCollaboratorsChange
}: FormSettingsProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState<Array<{id: number, nombre: string, correo: string}>>([]);

  const defaultHttpConfig: HttpConfig = {
    enabled: false,
    url: "",
    method: "POST",
    headers: [],
    body: `{
  "id_del_elemento": "respuesta"
}`
  };

  // Load available administrators
  useEffect(() => {
    const loadAvailableAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from('usuario_administrador')
          .select('id, nombre, correo')
          .neq('correo', currentUser?.email); // Exclude current user

        if (error) {
          console.error('Error loading administrators:', error);
          return;
        }

        setAvailableAdmins(data || []);
      } catch (error) {
        console.error('Error loading administrators:', error);
      }
    };

    if (isAdmin) {
      loadAvailableAdmins();
    }
  }, [currentUser?.email, isAdmin]);

  const handleAddCollaborator = async () => {
    if (!selectedCollaboratorId) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un administrador",
        variant: "destructive",
      });
      return;
    }

    const selectedAdmin = availableAdmins.find(admin => admin.id.toString() === selectedCollaboratorId);
    
    if (!selectedAdmin) {
      toast({
        title: "Error",
        description: "Administrador no encontrado",
        variant: "destructive",
      });
      return;
    }

    const email = selectedAdmin.correo.toLowerCase().trim();

    // Check if email is already a collaborator
    if (collaborators.includes(email)) {
      toast({
        title: "Colaborador ya añadido",
        description: "Este administrador ya es colaborador de este formulario",
        variant: "destructive",
      });
      return;
    }

    // Check if email is the form owner
    if (email === currentUser?.email) {
      toast({
        title: "Error",
        description: "No puedes añadirte a ti mismo como colaborador",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCollaborator(true);

    try {
      // Add to collaborators list
      const updatedCollaborators = [...collaborators, email];
      onCollaboratorsChange?.(updatedCollaborators);

      setSelectedCollaboratorId("");
      
      toast({
        title: "Colaborador añadido",
        description: `${selectedAdmin.nombre} ha sido añadido como colaborador`,
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el colaborador",
        variant: "destructive",
      });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = (email: string) => {
    const updatedCollaborators = collaborators.filter(collab => collab !== email);
    onCollaboratorsChange?.(updatedCollaborators);
    
    const admin = availableAdmins.find(admin => admin.correo.toLowerCase() === email);
    toast({
      title: "Colaborador eliminado",
      description: `${admin?.nombre || email} ha sido eliminado como colaborador`,
    });
  };

  const getAdminName = (email: string) => {
    const admin = availableAdmins.find(admin => admin.correo.toLowerCase() === email.toLowerCase());
    return admin?.nombre || email;
  };

  // Filter out already added collaborators from the dropdown
  const availableCollaborators = availableAdmins.filter(admin => 
    !collaborators.includes(admin.correo.toLowerCase()) &&
    admin.correo.toLowerCase() !== currentUser?.email?.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* General Settings Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Configuración General</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch 
              id="private-form" 
              checked={isPrivate} 
              onCheckedChange={onPrivateChange} 
              className="data-[state=checked]:bg-[#686df3]" 
            />
            <div>
              <Label htmlFor="private-form" className="text-lg font-medium">Formulario Privado</Label>
              <p className="text-sm text-gray-500">
                Cuando está habilitado, solo usuarios especificados pueden acceder a este formulario
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Label className="text-lg font-medium">Color del formulario</Label>
            <Select value={formColor || FORM_COLORS[0].value} onValueChange={onFormColorChange}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  <span className="inline-flex items-center">
                    <span 
                      className="w-5 h-5 rounded-full mr-2" 
                      style={{ background: formColor || FORM_COLORS[0].value }} 
                    />
                    {FORM_COLORS.find(c => c.value === formColor)?.name || FORM_COLORS[0].name}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FORM_COLORS.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <span className="inline-flex items-center">
                      <span 
                        className="w-5 h-5 rounded-full mr-2" 
                        style={{ background: color.value }} 
                      />
                      {color.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Collaborators Card - Only show for admins */}
      {isAdmin && (
        <Card className="p-6 shadow-sm border border-gray-100">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Users className="h-5 w-5" />
              Colaboradores
            </CardTitle>
            <p className="text-sm text-gray-500">
              Permite que otros administradores puedan editar este formulario
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              {/* Add new collaborator */}
              <div className="flex gap-2">
                <Select
                  value={selectedCollaboratorId}
                  onValueChange={setSelectedCollaboratorId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar administrador..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {availableCollaborators.length > 0 ? (
                      availableCollaborators.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{admin.nombre}</span>
                            <span className="text-sm text-gray-500">{admin.correo}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-admins" disabled>
                        No hay administradores disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddCollaborator}
                  disabled={isAddingCollaborator || !selectedCollaboratorId || availableCollaborators.length === 0}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>

              {/* List of current collaborators */}
              {collaborators.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Colaboradores actuales:</Label>
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((email) => (
                      <Badge 
                        key={email} 
                        variant="secondary" 
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        <span>{getAdminName(email)}</span>
                        <button
                          onClick={() => handleRemoveCollaborator(email)}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {collaborators.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay colaboradores asignados a este formulario
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Access to Responses Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Acceso a Respuestas</h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Switch 
              id="allow-view-own-responses" 
              checked={!!allowViewOwnResponses} 
              onCheckedChange={onAllowViewOwnResponsesChange} 
            />
            <div>
              <Label htmlFor="allow-view-own-responses" className="text-lg font-medium">
                Permitir ver respuestas propias
              </Label>
              <p className="text-sm text-gray-500">
                Si está activo, los usuarios podrán ver solo sus propias respuestas.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Switch 
              id="allow-edit-own-responses" 
              checked={!!allowEditOwnResponses} 
              onCheckedChange={onAllowEditOwnResponsesChange} 
            />
            <div>
              <Label htmlFor="allow-edit-own-responses" className="text-lg font-medium">
                Permitir editar respuestas propias
              </Label>
              <p className="text-sm text-gray-500">
                Si está activo, podrán modificar sus respuestas después de enviarlas.
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      <HttpConfigSettings 
        config={httpConfig || defaultHttpConfig} 
        onConfigChange={(config) => onHttpConfigChange && onHttpConfigChange(config)} 
        isAdmin={isAdmin} 
        formFields={formFields} 
      />
    </div>
  );
};

export default FormSettings;


import { HttpConfig } from "@/types/form";
import HttpConfigSettings from "./HttpConfigSettings";
import { useAuth } from "@/contexts/AuthContext";
import GeneralSettingsCard from "./GeneralSettingsCard";
import CollaboratorsCard from "./CollaboratorsCard";
import ResponseAccessCard from "./ResponseAccessCard";

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

  const defaultHttpConfig: HttpConfig = {
    enabled: false,
    url: "",
    method: "POST",
    headers: [],
    body: `{
  "id_del_elemento": "respuesta"
}`
  };

  return (
    <div className="space-y-8">
      <GeneralSettingsCard
        isPrivate={isPrivate}
        onPrivateChange={onPrivateChange}
        formColor={formColor}
        onFormColorChange={onFormColorChange}
      />

      <CollaboratorsCard
        collaborators={collaborators}
        onCollaboratorsChange={onCollaboratorsChange}
      />
      
      <ResponseAccessCard
        allowViewOwnResponses={allowViewOwnResponses}
        onAllowViewOwnResponsesChange={onAllowViewOwnResponsesChange}
        allowEditOwnResponses={allowEditOwnResponses}
        onAllowEditOwnResponsesChange={onAllowEditOwnResponsesChange}
      />
      
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

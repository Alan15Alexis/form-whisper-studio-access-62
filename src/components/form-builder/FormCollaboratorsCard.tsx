
import { Users } from "lucide-react";

interface FormCollaboratorsCardProps {
  collaborators: string[];
}

const FormCollaboratorsCard = ({ collaborators }: FormCollaboratorsCardProps) => {
  if (!collaborators || collaborators.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-800">Colaboradores del Formulario</h3>
      </div>
      <div className="space-y-2">
        {collaborators.map((collaborator, index) => (
          <div key={`${collaborator}-${index}`} className="flex items-center gap-2 p-2 bg-white rounded border">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">{collaborator}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-blue-600 mt-2">
        {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} asignado{collaborators.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default FormCollaboratorsCard;

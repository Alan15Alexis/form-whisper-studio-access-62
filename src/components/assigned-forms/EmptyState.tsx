
import React from "react";
import { FileX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50/50 flex flex-col items-center justify-center">
      <FileX className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  );
};

export default EmptyState;

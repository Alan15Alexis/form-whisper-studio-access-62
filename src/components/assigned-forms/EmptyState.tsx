
import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
};

export default EmptyState;

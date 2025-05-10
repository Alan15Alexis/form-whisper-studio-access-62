
import React from "react";

interface FormProgressBarProps {
  currentIndex: number;
  totalFields: number;
  formColor?: string;
}

const FormProgressBar = ({ currentIndex, totalFields, formColor }: FormProgressBarProps) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div 
        className="h-2.5 rounded-full" 
        style={{ 
          width: `${((currentIndex + 1) / totalFields) * 100}%`,
          backgroundColor: formColor || '#686df3'
        }}
      ></div>
    </div>
  );
};

export default FormProgressBar;

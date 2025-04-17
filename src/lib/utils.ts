
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  Type, 
  AlignLeft, 
  Radio, 
  CheckSquare, 
  Check, 
  X, 
  ChevronDown,
  Image,
  Hash,
  User,
  Mail,
  MapPin,
  Phone,
  Upload,
  FileUp,
  PenTool,
  Grid3X3,
  Star,
  BarChart,
  Timer,
  Calendar,
  Clock,
  FileText,
  Edit3
} from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function renderIcon(iconName: string) {
  const iconSize = 16;
  const iconProps = { size: iconSize, className: "text-primary" };

  switch(iconName) {
    case "Type": return <Type {...iconProps} />;
    case "AlignLeft": return <AlignLeft {...iconProps} />;
    case "Radio": return <Radio {...iconProps} />;
    case "Check": return <Check {...iconProps} />;
    case "X": return <X {...iconProps} />;
    case "CheckSquare": return <CheckSquare {...iconProps} />;
    case "ChevronDown": return <ChevronDown {...iconProps} />;
    case "Image": return <Image {...iconProps} />;
    case "Hash": return <Hash {...iconProps} />;
    case "User": return <User {...iconProps} />;
    case "Mail": return <Mail {...iconProps} />;
    case "MapPin": return <MapPin {...iconProps} />;
    case "Phone": return <Phone {...iconProps} />;
    case "Upload": return <Upload {...iconProps} />;
    case "FileUp": return <FileUp {...iconProps} />;
    case "PenTool": return <PenTool {...iconProps} />;
    case "Grid3X3": return <Grid3X3 {...iconProps} />;
    case "Star": return <Star {...iconProps} />;
    case "BarChart": return <BarChart {...iconProps} />;
    case "Timer": return <Timer {...iconProps} />;
    case "Calendar": return <Calendar {...iconProps} />;
    case "Clock": return <Clock {...iconProps} />;
    case "FileText": return <FileText {...iconProps} />;
    case "Edit3": return <Edit3 {...iconProps} />;
    default: return <Type {...iconProps} />;
  }
}

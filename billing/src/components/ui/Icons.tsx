import React from "react";
import {
  Pen,
  Trash2,
  Eye,
  Printer,
  Plus,
  X,
  CircleX,
  Download,
  PieChart as PieChartIcon,
  type LucideIcon,
} from "lucide-react";

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

function withLucide(Icon: LucideIcon) {
  return function LucideIconWrapper({ className = "", size = 18, style }: IconProps) {
    return <Icon className={className} size={size} style={style} strokeWidth={2} />;
  };
}

export const EditIcon = withLucide(Pen);
export const DeleteIcon = withLucide(Trash2);
export const ViewIcon = withLucide(Eye);
export const PrintIcon = withLucide(Printer);
export const PlusIcon = withLucide(Plus);
export const RemoveIcon = withLucide(X);
export const CancelIcon = withLucide(CircleX);
export const DownloadIcon = withLucide(Download);
export const ChartIcon = withLucide(PieChartIcon);

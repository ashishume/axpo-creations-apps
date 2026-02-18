import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

export function Card({ children, className = "", padding = "md", style }: CardProps) {
  const paddingClasses = {
    none: "!p-0",
    sm: "!p-3",
    md: "", // use default from .card class
    lg: "!p-6 lg:!p-8",
  };

  return (
    <div
      className={`card ${paddingClasses[padding]} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

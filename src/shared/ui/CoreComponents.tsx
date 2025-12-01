import React from "react";

// --- BUTTON ---
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary", size = "md", className = "", disabled = false }) => {
  const baseStyle =
    "font-bold rounded shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border-b-4 border-slate-900",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white border-b-4 border-emerald-800",
    danger: "bg-rose-600 hover:bg-rose-500 text-white border-b-4 border-rose-800",
    outline: "bg-transparent border-2 border-slate-500 text-slate-300 hover:bg-slate-800",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-8 py-4 text-xl uppercase tracking-wider",
    xl: "px-10 py-8 text-2xl w-full",
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; noPadding?: boolean }> = ({
  children,
  title,
  className = "",
  noPadding = false,
}) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden ${className}`}>
    {title && (
      <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-slate-200 uppercase tracking-wide text-sm">{title}</h3>
      </div>
    )}
    <div className={noPadding ? "" : "p-4"}>{children}</div>
  </div>
);

// --- BADGE ---
// El badge es genérico, recibe un color o un status string, pero el mapeo de lógica de negocio debería hacerse fuera o pasarse como prop de estilo.
// Para mantener compatibilidad con lo anterior pero siendo más puro:
export const Badge: React.FC<{ label: string; variant?: "default" | "success" | "warning" | "danger" | "info" | "production" }> = ({
  label,
  variant = "default",
}) => {
  const styles = {
    default: "bg-slate-600 text-slate-200",
    success: "bg-emerald-600 text-white",
    warning: "bg-amber-600 text-white",
    danger: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
    production: "bg-blue-500 text-white animate-pulse", // Ejemplo específico
  };
  return <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${styles[variant]}`}>{label}</span>;
};

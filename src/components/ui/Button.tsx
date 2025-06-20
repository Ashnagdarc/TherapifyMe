import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black focus:outline-hidden focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-main text-white hover:bg-blue-700 focus:ring-main",
    secondary: "bg-grey-2 text-text-black hover:bg-grey focus:ring-grey",
    outline:
      "border-2 border-main text-main hover:bg-main hover:text-white focus:ring-main",
    ghost: "text-text-black hover:bg-grey-2 focus:ring-grey",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

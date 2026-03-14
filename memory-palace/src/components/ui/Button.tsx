import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-palace-primary text-white hover:brightness-110 glow-hover cursor-pointer",
  secondary:
    "bg-white text-palace-primary border border-palace-mid hover:bg-palace-light cursor-pointer",
  danger:
    "bg-red-600 text-white hover:bg-red-700 cursor-pointer",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-8 py-3.5 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

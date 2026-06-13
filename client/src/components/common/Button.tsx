import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-[10px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-brand-gradient text-white shadow-card hover:shadow-cardHover hover:brightness-105",
  secondary: "bg-surface border border-black/10 text-ink hover:bg-surface-2",
  ghost: "text-ink-soft hover:text-ink hover:bg-surface-2",
};
const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export default Button;

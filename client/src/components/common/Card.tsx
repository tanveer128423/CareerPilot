import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  featured?: boolean;
  children: ReactNode;
}

export function Card({ featured = false, className = "", children, ...rest }: Props) {
  if (featured) {
    return (
      <div className={`gradient-border shadow-card ${className}`} {...rest}>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    );
  }
  return (
    <div
      className={`bg-surface border border-black/[0.06] rounded-2xl shadow-card p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;

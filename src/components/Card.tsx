import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "default" | "elevated" | "accent";
};

export function Card({ children, variant = "default", className = "", ...props }: CardProps) {
  const variantClass =
    variant === "elevated" ? "card-elevated" : variant === "accent" ? "card-accent" : "";

  return (
    <section className={`card ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

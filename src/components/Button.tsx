import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "present" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "button bg-primary text-on-primary hover:bg-primary-container shadow-md active:scale-[0.99]",
  present:
    "button button-present bg-primary-container text-on-primary hover:bg-primary shadow-md active:scale-[0.99]",
  secondary:
    "button button-secondary bg-surface-container-low text-on-surface hover:bg-surface-container shadow-sm",
  danger:
    "button button-danger bg-error-container/60 text-on-error-container hover:bg-error-container",
};

export function Button({
  variant = "primary",
  className = "",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps): ReactNode {
  const classes = [
    "h-[52px] px-space-md rounded-xl font-label-lg text-label-lg inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || isLoading} aria-busy={isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </button>
  );
}

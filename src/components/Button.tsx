import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "present" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "secondary"
      ? "button-secondary"
      : variant === "present"
        ? "button-present"
        : variant === "danger"
          ? "button-danger"
          : variant === "ghost"
            ? "button-ghost"
            : "";

  return (
    <button
      className={`button ${variantClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "16px",
              height: "16px",
              border: "2px solid currentColor",
              borderRightColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

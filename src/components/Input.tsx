import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: disabled ? "var(--muted)" : "var(--ink)",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`search-input ${className}`.trim()}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        style={{
          width: "100%",
          minHeight: "48px",
          fontSize: "16px",
          padding: "0 14px",
          border: error ? "1.5px solid #b42318" : "1px solid var(--line)",
          borderRadius: "12px",
          background: disabled ? "var(--line)" : "#fbfcfb",
          color: "var(--ink)",
          outline: "none",
        }}
        {...props}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: "13px", color: "#b42318", fontWeight: 500 }}
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} style={{ fontSize: "13px", color: "var(--muted)" }}>
          {helperText}
        </span>
      )}
    </div>
  );
}

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, icon, className = "", id, ...props },
  ref,
): ReactNode {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="field flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="font-label-md text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            "w-full h-[52px] rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner transition-all",
            icon ? "pl-11 pr-4" : "px-4",
            error ? "ring-2 ring-error bg-error-container/20" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
      </div>
      {error && (
        <span
          id={`${inputId}-error`}
          className="field-error font-label-sm text-label-sm text-error px-1"
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span
          id={`${inputId}-helper`}
          className="field-helper font-label-sm text-label-sm text-on-surface-variant px-1"
        >
          {helperText}
        </span>
      )}
    </div>
  );
});

"use client";

import { type InputHTMLAttributes, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconDefinition;
  dark?: boolean;
}

export function Input({
  label,
  error,
  icon,
  dark = false,
  className,
  id: externalId,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const [focused, setFocused] = useState(false);

  const labelClass = dark ? "dark-label" : "label";
  const inputClass = dark ? "dark-input" : "input";

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ease-in-out",
              focused
                ? dark
                  ? "text-gold-500"
                  : "text-brand-accent"
                : dark
                  ? "text-dark-text-3"
                  : "text-brand-border",
            )}
          >
            <FontAwesomeIcon icon={icon} className="h-4 w-4" />
          </span>
        )}

        <input
          id={id}
          className={cn(
            inputClass,
            icon && "pl-10",
            error &&
              "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

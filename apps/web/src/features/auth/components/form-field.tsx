import type { InputHTMLAttributes } from "react";
import { Input } from "@communicationos/ui";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function FormField({ label, error, id, ...props }: Props) {
  return (
    <div className="block space-y-2 text-sm font-medium text-zinc-300">
      {label && (
        <label htmlFor={id} className="block">
          {label}
        </label>
      )}
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="block text-xs font-normal text-rose-400">
          {error}
        </span>
      )}
    </div>
  );
}

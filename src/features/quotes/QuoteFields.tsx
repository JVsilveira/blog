"use client";
import { useState } from "react";
import { decimal } from "../../domain/quotes/model";
export function Field({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <label>
      {label}
      {required ? " *" : ""}
      {multiline ? (
        <textarea
          maxLength={2000}
          value={value}
          onChange={(e) => {
            e.target.setCustomValidity(
              /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(e.target.value)
                ? "Não use HTML ou caracteres de controle."
                : "",
            );
            onChange(e.target.value);
          }}
        />
      ) : (
        <input
          required={required}
          maxLength={160}
          value={value}
          onChange={(e) => {
            e.target.setCustomValidity(
              /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(e.target.value)
                ? "Não use HTML ou caracteres de controle."
                : "",
            );
            onChange(e.target.value);
          }}
        />
      )}
    </label>
  );
}
export function NumberField({
  label,
  value,
  digits,
  onChange,
  min = 0,
  max = 100_000_000,
}: {
  label: string;
  value: number;
  digits: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const [raw, setRaw] = useState<string | null>(null);
  return (
    <label>
      {label}
      <input
        required
        inputMode="decimal"
        value={raw ?? String(value / 10 ** digits).replace(".", ",")}
        onChange={(e) => {
          setRaw(e.target.value);
          try {
            const n = decimal(e.target.value, digits);
            if (n < min || n > max) throw Error("Valor fora do limite.");
            e.target.setCustomValidity("");
            onChange(n);
          } catch {
            e.target.setCustomValidity(
              `Informe valor entre ${min / 10 ** digits} e ${max / 10 ** digits}, até ${digits} casas decimais.`,
            );
          }
        }}
        onBlur={(e) => {
          if (e.target.validity.valid) setRaw(null);
        }}
      />
    </label>
  );
}

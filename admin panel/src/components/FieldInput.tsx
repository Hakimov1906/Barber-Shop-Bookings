import { KeyboardEvent, useMemo, useState } from "react";
import type { FormFieldConfig } from "../types";
import { toInputDate, toInputTime } from "../utils/format";
import { ensureKyrgyzPhonePrefix } from "../utils/phone";

type FieldInputProps = {
  field: FormFieldConfig;
  value: unknown;
  disabled?: boolean;
  onChange: (next: unknown) => void;
};

function toStringValue(value: unknown) {
  if (value === null || typeof value === "undefined") return "";
  return String(value);
}

function TagInput({
  value,
  disabled,
  onChange,
}: {
  value: unknown;
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const tags = useMemo(
    () =>
      Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
    [value],
  );

  const pushTag = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    if (tags.includes(next)) return;
    onChange([...tags, next]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      pushTag(draft.replace(/,$/, ""));
      return;
    }

    if (event.key === "Backspace" && !draft && tags.length) {
      event.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="tag-editor">
      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button
              type="button"
              className="tag-remove"
              aria-label={`Delete tag ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              disabled={disabled}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => pushTag(draft)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder="Type value and press Enter"
      />
    </div>
  );
}

export function FieldInput({ field, value, disabled, onChange }: FieldInputProps) {
  const required = Boolean(field.required);
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (field.kind === "textarea") {
    return (
      <textarea
        value={toStringValue(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        minLength={field.minLength}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.kind === "boolean") {
    const checked = value === true || value === "true";
    return (
      <label className="boolean-field">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span>{checked ? "Да" : "Нет"}</span>
      </label>
    );
  }

  if (field.kind === "select") {
    const stringValue = toStringValue(value);
    return (
      <select
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      >
        {!required ? <option value="">Не выбрано</option> : null}
        {(field.options || []).map((option) => (
          <option key={`${field.key}-${option.value}`} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.kind === "tags") {
    return <TagInput value={value} disabled={disabled} onChange={onChange} />;
  }

  if (field.kind === "phone") {
    return (
      <input
        type="tel"
        inputMode="numeric"
        value={ensureKyrgyzPhonePrefix(toStringValue(value))}
        onChange={(event) => onChange(ensureKyrgyzPhonePrefix(event.target.value))}
        disabled={disabled}
        required={required}
        placeholder="+996000000000"
        maxLength={13}
        autoComplete="tel"
      />
    );
  }

  if (field.kind === "date") {
    return (
      <input
        type="date"
        value={toInputDate(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      />
    );
  }

  if (field.kind === "time") {
    return (
      <input
        type="time"
        value={toInputTime(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      />
    );
  }

  const inputType =
    field.kind === "password"
      ? passwordVisible
        ? "text"
        : "password"
      : field.kind === "number"
        ? "number"
        : "text";
  const stringValue = toStringValue(value);

  const input = (
    <input
      type={inputType}
      value={stringValue}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      required={required}
      min={field.min}
      max={field.max}
      step={field.step}
      minLength={field.minLength}
      maxLength={field.maxLength}
      pattern={field.pattern}
      placeholder={field.placeholder}
    />
  );

  if (field.kind !== "password") return input;

  return (
    <div className="password-field">
      {input}
      <button
        type="button"
        className="password-toggle"
        aria-label={passwordVisible ? "Hide password" : "Show password"}
        onClick={() => setPasswordVisible((current) => !current)}
        disabled={disabled}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {passwordVisible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.2A9.7 9.7 0 0 1 12 4c5 0 8.5 4.5 9.5 6a2.8 2.8 0 0 1 0 4 15 15 0 0 1-2.1 2.5" />
              <path d="M6.6 6.6A15 15 0 0 0 2.5 10a2.8 2.8 0 0 0 0 4C3.5 15.5 7 20 12 20a9.7 9.7 0 0 0 4.1-.9" />
            </>
          ) : (
            <>
              <path d="M2.5 10a2.8 2.8 0 0 0 0 4C3.5 15.5 7 20 12 20s8.5-4.5 9.5-6a2.8 2.8 0 0 0 0-4C20.5 8.5 17 4 12 4S3.5 8.5 2.5 10Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

import { KeyboardEvent, useMemo, useState } from "react";
import type { FormFieldConfig } from "../types";
import { ensureKyrgyzPhonePrefix } from "../utils/phone";
import { toInputDate, toInputTime } from "../utils/format";

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

function TagInput({ value, disabled, onChange }: { value: unknown; disabled?: boolean; onChange: (next: string[]) => void }) {
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
              aria-label={`Удалить тег ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              disabled={disabled}
            >
              ×
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
        placeholder="Введите и нажмите Enter"
      />
    </div>
  );
}

export function FieldInput({ field, value, disabled, onChange }: FieldInputProps) {
  const required = Boolean(field.required);

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
        pattern="^\+996\d{9}$"
        placeholder="+996000000000"
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

  const inputType = field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text";
  const stringValue = toStringValue(value);

  return (
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
      placeholder={field.placeholder}
    />
  );
}


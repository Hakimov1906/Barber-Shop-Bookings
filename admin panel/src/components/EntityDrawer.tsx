import type { DrawerMode, FormFieldConfig, FormValues } from "../types";
import { FieldInput } from "./FieldInput";

type EntityDrawerProps = {
  open: boolean;
  mode: DrawerMode;
  title: string;
  fields: FormFieldConfig[];
  values: FormValues;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
};

function isHidden(field: FormFieldConfig, mode: DrawerMode) {
  if (mode === "create" && field.hiddenOnCreate) return true;
  if (mode === "edit" && field.hiddenOnEdit) return true;
  return false;
}

function isFieldDisabled(field: FormFieldConfig, mode: DrawerMode, submitting?: boolean) {
  if (mode === "view") return true;
  if (submitting) return true;
  if (mode === "edit" && field.disabledOnEdit) return true;
  return false;
}

function getDrawerSubmitLabel(mode: DrawerMode) {
  if (mode === "create") return "Создать";
  if (mode === "edit") return "Сохранить";
  return "Закрыть";
}

export function EntityDrawer({
  open,
  mode,
  title,
  fields,
  values,
  submitting,
  error,
  onClose,
  onChange,
  onSubmit,
}: EntityDrawerProps) {
  const visibleFields = fields.filter((field) => !isHidden(field, mode));
  const readOnly = mode === "view";

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-header">
          <h3>{title}</h3>
          <button type="button" className="ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="drawer-body">
          {visibleFields.map((field) => (
            <label key={field.key} className="field-block">
              <span>
                {field.label}
                {field.required && mode === "create" ? <em> *</em> : null}
              </span>
              <FieldInput
                field={field}
                value={values[field.key]}
                disabled={isFieldDisabled(field, mode, submitting)}
                onChange={(next) => onChange(field.key, next)}
              />
              {field.helpText ? <small>{field.helpText}</small> : null}
              {field.key.toLowerCase().includes("image") && typeof values[field.key] === "string" && values[field.key] ? (
                <img className="image-preview" src={String(values[field.key])} alt="preview" />
              ) : null}
            </label>
          ))}
        </div>

        {error ? <div className="drawer-error">{error}</div> : null}

        <div className="drawer-footer">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          {!readOnly ? (
            <button type="button" onClick={onSubmit} disabled={submitting}>
              {submitting ? "Сохранение..." : getDrawerSubmitLabel(mode)}
            </button>
          ) : (
            <button type="button" onClick={onClose}>
              {getDrawerSubmitLabel(mode)}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

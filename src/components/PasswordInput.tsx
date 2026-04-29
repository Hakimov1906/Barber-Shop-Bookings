import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  icon?: ReactNode;
  showLabel?: string;
  hideLabel?: string;
  wrapperClassName?: string;
};

export function PasswordInput({
  icon,
  showLabel = "Show password",
  hideLabel = "Hide password",
  wrapperClassName = "",
  className = "",
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className={`relative ${wrapperClassName}`}>
      {icon}
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        aria-label={isVisible ? hideLabel : showLabel}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

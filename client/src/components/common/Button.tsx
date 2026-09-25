import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "btn",
          `btn-${variant}`,
          `btn-${size}`,
          fullWidth && "btn-full",
          className
        )}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && <Loader2 className="btn-spinner" size={16} />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

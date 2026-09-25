import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    return (
      <div className="field">
        {label && <label htmlFor={id} className="field-label">{label}</label>}
        <textarea ref={ref} id={id} className={clsx("field-input field-textarea", error && "field-input-error", className)} {...rest} />
        {error && <span className="field-error">{error}</span>}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";

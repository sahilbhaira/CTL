import { IonIcon } from '@ionic/react';
import type { ChangeEventHandler, FC, FocusEventHandler, HTMLInputTypeAttribute } from 'react';

interface QuoteTextFieldProps {
  autoComplete?: string;
  error?: string;
  icon?: string;
  inputMode?: 'decimal' | 'email' | 'numeric' | 'search' | 'tel' | 'text' | 'url';
  label: string;
  multiline?: boolean;
  name: string;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  placeholder: string;
  touched?: boolean;
  type?: HTMLInputTypeAttribute;
  value: string;
}

const QuoteTextField: FC<QuoteTextFieldProps> = ({
  autoComplete,
  error,
  icon,
  inputMode,
  label,
  multiline = false,
  name,
  onBlur,
  onChange,
  placeholder,
  touched,
  type = 'text',
  value
}) => (
  <label className="ctl-quote-field">
    <span>{label}</span>
    <div className={`ctl-quote-control${multiline ? ' ctl-quote-control--textarea' : ''}`}>
      {icon ? <IonIcon icon={icon} /> : null}
      {multiline ? (
        <textarea
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <input
          autoComplete={autoComplete}
          inputMode={inputMode}
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      )}
    </div>
    {touched && error ? <small>{error}</small> : null}
  </label>
);

export default QuoteTextField;

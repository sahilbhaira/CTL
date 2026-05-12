import type { FC } from 'react';
import type { AutocompleteTypes } from '@ionic/core';
import { IonIcon, IonInput } from '@ionic/react';
import './AuthField.css';

interface AuthFieldProps {
  autoComplete?: AutocompleteTypes;
  endIcon?: string;
  error?: string;
  icon: string;
  name: string;
  onBlur?: () => void;
  onValueChange?: (value: string) => void;
  placeholder: string;
  touched?: boolean;
  type?: 'email' | 'password' | 'text';
  value?: string;
}

const AuthField: FC<AuthFieldProps> = ({
  autoComplete,
  endIcon,
  error,
  icon,
  name,
  onBlur,
  onValueChange,
  placeholder,
  touched,
  type = 'text',
  value = ''
}) => (
  <div className="ctl-auth-field-group">
    <label className="ctl-auth-field">
      <IonIcon aria-hidden="true" className="ctl-auth-field__icon" icon={icon} />
      <IonInput
        autocomplete={autoComplete}
        className="ctl-auth-field__input"
        name={name}
        onIonBlur={onBlur}
        onIonInput={(event) => onValueChange?.(`${event.detail.value ?? ''}`)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {endIcon ? (
        <IonIcon aria-hidden="true" className="ctl-auth-field__icon" icon={endIcon} />
      ) : null}
    </label>
    {touched && error ? <span className="ctl-auth-field-error">{error}</span> : null}
  </div>
);

export default AuthField;

import type { FC } from 'react';
import type { AutocompleteTypes } from '@ionic/core';
import { IonIcon, IonInput } from '@ionic/react';
import './AuthField.css';

interface AuthFieldProps {
  autoComplete?: AutocompleteTypes;
  endIcon?: string;
  icon: string;
  placeholder: string;
  type?: 'email' | 'password' | 'text';
}

const AuthField: FC<AuthFieldProps> = ({
  autoComplete,
  endIcon,
  icon,
  placeholder,
  type = 'text'
}) => (
  <label className="ctl-auth-field">
    <IonIcon aria-hidden="true" className="ctl-auth-field__icon" icon={icon} />
    <IonInput
      autocomplete={autoComplete}
      className="ctl-auth-field__input"
      placeholder={placeholder}
      type={type}
    />
    {endIcon ? (
      <IonIcon aria-hidden="true" className="ctl-auth-field__icon" icon={endIcon} />
    ) : null}
  </label>
);

export default AuthField;

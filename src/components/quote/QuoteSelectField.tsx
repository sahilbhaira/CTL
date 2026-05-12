import { IonIcon, IonSelect, IonSelectOption } from '@ionic/react';
import { checkmarkOutline, chevronDownOutline } from 'ionicons/icons';
import type { FC } from 'react';

export interface QuoteSelectOption {
  id: string;
  name: string;
}

interface QuoteSelectFieldProps {
  emptyText?: string;
  error?: string;
  label: string;
  name: string;
  onBlur: () => void;
  onValueChange: (value: unknown) => void;
  options: QuoteSelectOption[];
  placeholder: string;
  selectedItems: QuoteSelectOption[];
  touched?: boolean;
  value: string[];
}

const QuoteSelectField: FC<QuoteSelectFieldProps> = ({
  emptyText,
  error,
  label,
  name,
  onBlur,
  onValueChange,
  options,
  placeholder,
  selectedItems,
  touched,
  value
}) => (
  <label className="ctl-quote-field">
    <span>{label}</span>
    <div className="ctl-quote-select">
      <div className="ctl-quote-select__top">
        <IonSelect
          interface="popover"
          multiple
          name={name}
          onIonBlur={onBlur}
          onIonChange={(event) => onValueChange(event.detail.value)}
          placeholder={placeholder}
          selectedText={placeholder}
          value={value}
        >
          {options.map((option) => (
            <IonSelectOption key={option.id} value={option.id}>
              {option.name}
            </IonSelectOption>
          ))}
        </IonSelect>
        <IonIcon icon={chevronDownOutline} />
      </div>
      <div className="ctl-quote-chip-row">
        {selectedItems.length ? (
          selectedItems.map((item) => (
            <span className="ctl-quote-chip" key={item.id}>
              <IonIcon icon={checkmarkOutline} />
              {item.name}
            </span>
          ))
        ) : emptyText ? (
          <span className="ctl-quote-empty-chip">{emptyText}</span>
        ) : null}
      </div>
    </div>
    {touched && error ? <small>{error}</small> : null}
  </label>
);

export default QuoteSelectField;

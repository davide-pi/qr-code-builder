import { useLanguage } from '../../i18n';
import type { BitcoinData, EPCData, PayPalData } from '../../types/qr';
import type { TemplateFormProps } from '../types';
import { fieldSetter } from './fieldSetter';
import { SelectField, TextField } from './fields';

const PAYPAL_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function PayPalForm({ data, onChange, errors }: TemplateFormProps<PayPalData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <TextField
        id="ppUsername" required label={f.paypalUsername}
        value={data.username} onChange={set('username')} error={errors.username}
        placeholder={f.paypalUsernamePlaceholder}
      />
      <div className="form-row">
        <TextField
          id="ppAmount" label={f.amount} placeholder={f.amountPlaceholder}
          value={data.amount} onChange={set('amount')} error={errors.amount}
        />
        <SelectField
          id="ppCurrency" label={f.currency}
          value={data.currency || 'EUR'} onChange={set('currency')}
          options={PAYPAL_CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
        />
      </div>
    </div>
  );
}

export function BitcoinForm({ data, onChange, errors }: TemplateFormProps<BitcoinData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <TextField
        id="btcAddress" required label={f.bitcoinAddress}
        value={data.address} onChange={set('address')} error={errors.address}
        placeholder={f.bitcoinAddressPlaceholder}
      />
      <div className="form-row">
        <TextField
          id="btcAmount" label={f.amountBtc} placeholder={f.amountPlaceholder}
          value={data.amount} onChange={set('amount')} error={errors.amount}
        />
        <TextField
          id="btcLabel" label={f.label} placeholder={f.labelPlaceholder}
          value={data.label} onChange={set('label')}
        />
      </div>
    </div>
  );
}

export function EpcForm({ data, onChange, errors }: TemplateFormProps<EPCData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <TextField
        id="epcName" required maxLength={70} label={f.beneficiaryName}
        value={data.name} onChange={set('name')} error={errors.name}
      />
      <TextField
        id="epcIban" required label={f.iban} placeholder={f.ibanPlaceholder}
        value={data.iban} onChange={set('iban')} error={errors.iban}
      />
      <div className="form-row">
        <TextField
          id="epcBic" label={f.bic} placeholder={f.bicPlaceholder}
          value={data.bic} onChange={set('bic')} error={errors.bic}
        />
        <TextField
          id="epcAmount" label={f.amountEur} placeholder={f.amountPlaceholder}
          value={data.amount} onChange={set('amount')} error={errors.amount}
        />
      </div>
      <TextField
        id="epcRemittance" rows={3} maxLength={140} label={f.remittanceText}
        value={data.remittance} onChange={set('remittance')} error={errors.remittance}
      />
    </div>
  );
}

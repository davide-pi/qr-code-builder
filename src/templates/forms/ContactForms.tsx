import { useLanguage } from '../../i18n';
import type {
  EmailData, PhoneData, SMSData, TelegramData, VCardData, WhatsAppData,
} from '../../types/qr';
import type { TemplateFormProps } from '../types';
import { fieldSetter } from './fieldSetter';
import { PhoneField, TextField } from './fields';

export function VCardForm({ data, onChange, errors }: TemplateFormProps<VCardData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <div className="form-row">
        <TextField id="firstName" label={f.firstName} value={data.firstName} onChange={set('firstName')} error={errors.firstName} />
        <TextField id="lastName" label={f.lastName} value={data.lastName} onChange={set('lastName')} />
      </div>
      <TextField id="organization" label={f.organization} value={data.organization} onChange={set('organization')} />
      <TextField id="title" label={f.jobTitle} value={data.title} onChange={set('title')} />
      <div className="form-row">
        <TextField id="phone" type="tel" label={f.phone} value={data.phone} onChange={set('phone')} error={errors.phone} />
        <TextField id="vcardEmail" type="email" label={f.email} value={data.email} onChange={set('email')} error={errors.email} />
      </div>
      <TextField id="website" type="url" label={f.website} value={data.website} onChange={set('website')} error={errors.website} />
      <TextField id="address" label={f.address} value={data.address} onChange={set('address')} />
      <div className="form-row">
        <TextField id="city" label={f.city} value={data.city} onChange={set('city')} />
        <TextField id="state" label={f.state} value={data.state} onChange={set('state')} />
      </div>
      <div className="form-row">
        <TextField id="zip" label={f.zipCode} value={data.zip} onChange={set('zip')} />
        <TextField id="country" label={f.country} value={data.country} onChange={set('country')} />
      </div>
    </div>
  );
}

export function EmailForm({ data, onChange, errors }: TemplateFormProps<EmailData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <TextField
        id="emailAddress" type="email" required label={f.emailAddress}
        value={data.email} onChange={set('email')} error={errors.email}
        placeholder={f.emailPlaceholder}
      />
      <TextField id="subject" label={f.subject} value={data.subject} onChange={set('subject')} />
      <TextField id="body" rows={4} label={f.message} value={data.body} onChange={set('body')} />
    </div>
  );
}

export function SmsForm({ data, onChange, errors }: TemplateFormProps<SMSData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <PhoneField
        id="smsPhone" required label={f.phoneNumber} placeholder={f.phonePlaceholder}
        country={data.country} countryCode={data.countryCode}
        onCountryChange={(country, countryCode) => onChange({ ...data, country, countryCode })}
        phone={data.phone} onPhoneChange={set('phone')} error={errors.phone}
      />
      <TextField id="message" rows={4} label={f.message} value={data.message} onChange={set('message')} />
    </div>
  );
}

export function PhoneCallForm({ data, onChange, errors }: TemplateFormProps<PhoneData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <PhoneField
        id="phoneNumber" required label={f.phoneNumber} placeholder={f.phonePlaceholder}
        country={data.country} countryCode={data.countryCode}
        onCountryChange={(country, countryCode) => onChange({ ...data, country, countryCode })}
        phone={data.phone} onPhoneChange={set('phone')} error={errors.phone}
      />
    </div>
  );
}

export function WhatsAppForm({ data, onChange, errors }: TemplateFormProps<WhatsAppData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <PhoneField
        id="waPhone" required label={f.phoneNumber} placeholder={f.phonePlaceholder}
        country={data.country} countryCode={data.countryCode}
        onCountryChange={(country, countryCode) => onChange({ ...data, country, countryCode })}
        phone={data.phone} onPhoneChange={set('phone')} error={errors.phone}
      />
      <TextField
        id="waMessage" rows={3} label={f.prefilledMessage}
        value={data.message} onChange={set('message')}
        placeholder="Hello! I'd like to..."
      />
    </div>
  );
}

export function TelegramForm({ data, onChange, errors }: TemplateFormProps<TelegramData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  const f = t.qrDataInput.form;
  return (
    <div className="template-form">
      <TextField
        id="tgUsername" required label={f.username}
        value={data.username} onChange={set('username')} error={errors.username}
        placeholder={f.usernamePlaceholder}
      />
      <TextField
        id="tgMessage" rows={3} label={f.prefilledMessage}
        value={data.message} onChange={set('message')}
        placeholder="Hi! I scanned your QR code..."
      />
    </div>
  );
}

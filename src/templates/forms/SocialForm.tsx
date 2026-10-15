import { useLanguage } from '../../i18n';
import type { Translations } from '../../i18n/types';
import type { SocialMediaData } from '../../types/qr';
import type { TemplateFormProps } from '../types';
import { TextField } from './fields';

type FormKey = keyof Translations['qrDataInput']['form'];

export interface SocialFormLabels {
  // Input id (kept per network, like the original forms)
  fieldId: string;
  labelKey: FormKey;
  placeholderKey: FormKey;
}

// Single-field form shared by the social network templates
export function SocialForm({
  data, onChange, errors, fieldId, labelKey, placeholderKey,
}: TemplateFormProps<SocialMediaData> & SocialFormLabels) {
  const { t } = useLanguage();
  return (
    <div className="template-form">
      <TextField
        id={fieldId} required label={t.qrDataInput.form[labelKey]}
        value={data.username} onChange={(username) => onChange({ username })} error={errors.username}
        placeholder={t.qrDataInput.form[placeholderKey]}
      />
    </div>
  );
}

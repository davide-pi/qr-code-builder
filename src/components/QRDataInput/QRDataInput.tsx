import { useLanguage } from '../../i18n';
import { getTemplate, type FieldErrors } from '../../templates';
import type { QRTemplateData, QRTemplateType } from '../../types/qr';
import TemplateDropdown from './TemplateDropdown';
import './QRDataInput.css';

interface QRDataInputProps {
  templateType: QRTemplateType;
  // Form state of the selected template, owned by the parent so undo/redo can restore it
  data: QRTemplateData;
  errors: FieldErrors<QRTemplateData>;
  onTemplateChange: (type: QRTemplateType) => void;
  onDataChange: (data: QRTemplateData) => void;
}

export default function QRDataInput({ templateType, data, errors, onTemplateChange, onDataChange }: QRDataInputProps) {
  const { t } = useLanguage();
  const { Form } = getTemplate(templateType);

  return (
    <div className="qr-data-input">
      <h2>{t.qrDataInput.title}</h2>
      <TemplateDropdown value={templateType} onChange={onTemplateChange} />
      <Form data={data} onChange={onDataChange} errors={errors} />
    </div>
  );
}

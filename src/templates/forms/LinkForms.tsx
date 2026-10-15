import { useLanguage } from '../../i18n';
import type { CalendarData, LocationData, URLData, WiFiData } from '../../types/qr';
import type { TemplateFormProps } from '../types';
import { fieldSetter } from './fieldSetter';
import { CheckboxField, SelectField, TextField } from './fields';

export function UrlForm({ data, onChange, errors }: TemplateFormProps<URLData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  return (
    <div className="template-form">
      <TextField
        id="url" type="url" required label={t.qrDataInput.form.url}
        value={data.url} onChange={set('url')} error={errors.url}
        placeholder={t.qrDataInput.form.urlPlaceholder}
      />
    </div>
  );
}

export function WifiForm({ data, onChange, errors }: TemplateFormProps<WiFiData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  return (
    <div className="template-form">
      <TextField
        id="ssid" required label={t.qrDataInput.form.networkName}
        value={data.ssid} onChange={set('ssid')} error={errors.ssid}
        placeholder={t.qrDataInput.form.networkNamePlaceholder}
      />
      <TextField
        id="password" label={t.qrDataInput.form.password}
        value={data.password} onChange={set('password')}
      />
      <SelectField
        id="encryption" label={t.qrDataInput.form.encryption}
        value={data.encryption} onChange={(value) => set('encryption')(value as WiFiData['encryption'])}
        options={[
          // WPA3 networks accept the WPA type too (transition mode), hence one option
          { value: 'WPA', label: 'WPA/WPA2/WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: t.qrDataInput.form.encryptionNone },
        ]}
      />
      <CheckboxField
        label={t.qrDataInput.form.hiddenNetwork}
        checked={data.hidden} onChange={set('hidden')}
      />
    </div>
  );
}

const datePart = (value: string): string => value.split('T')[0];
const withTime = (value: string): string => (value && !value.includes('T') ? `${value}T00:00` : value);

export function CalendarForm({ data, onChange, errors }: TemplateFormProps<CalendarData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);

  // The date and datetime-local inputs share the state: keep the value valid for the next input type
  const toggleAllDay = (allDay: boolean) =>
    onChange({
      ...data,
      allDay,
      startDate: allDay ? datePart(data.startDate) : withTime(data.startDate),
      endDate: allDay ? datePart(data.endDate) : withTime(data.endDate),
    });

  return (
    <div className="template-form">
      <TextField
        id="eventTitle" required label={t.qrDataInput.form.eventTitle}
        value={data.title} onChange={set('title')} error={errors.title}
        placeholder={t.qrDataInput.form.eventTitlePlaceholder}
      />
      <TextField
        id="eventLocation" label={t.qrDataInput.form.eventLocation}
        value={data.location} onChange={set('location')}
      />
      <TextField
        id="eventDescription" rows={3} label={t.qrDataInput.form.description}
        value={data.description} onChange={set('description')}
      />
      <CheckboxField label={t.qrDataInput.form.allDayEvent} checked={data.allDay} onChange={toggleAllDay} />
      {data.allDay ? (
        <>
          <TextField
            id="startDateOnly" type="date" max="9999-12-31" label={t.qrDataInput.form.startDate}
            value={datePart(data.startDate)} onChange={set('startDate')} error={errors.startDate}
          />
          <TextField
            id="endDateOnly" type="date" max="9999-12-31" label={t.qrDataInput.form.endDate}
            value={datePart(data.endDate)} onChange={set('endDate')} error={errors.endDate}
          />
        </>
      ) : (
        <>
          <TextField
            id="startDate" type="datetime-local" max="9999-12-31T23:59" label={t.qrDataInput.form.startDateTime}
            value={data.startDate} onChange={set('startDate')} error={errors.startDate}
          />
          <TextField
            id="endDate" type="datetime-local" max="9999-12-31T23:59" label={t.qrDataInput.form.endDateTime}
            value={data.endDate} onChange={set('endDate')} error={errors.endDate}
          />
        </>
      )}
    </div>
  );
}

export function LocationForm({ data, onChange, errors }: TemplateFormProps<LocationData>) {
  const { t } = useLanguage();
  const set = fieldSetter(data, onChange);
  return (
    <div className="template-form">
      <TextField
        id="latitude" required label={t.qrDataInput.form.latitude}
        value={data.latitude} onChange={set('latitude')} error={errors.latitude}
        placeholder={t.qrDataInput.form.latitudePlaceholder}
      />
      <TextField
        id="longitude" required label={t.qrDataInput.form.longitude}
        value={data.longitude} onChange={set('longitude')} error={errors.longitude}
        placeholder={t.qrDataInput.form.longitudePlaceholder}
      />
      <TextField
        id="locationLabel" label={t.qrDataInput.form.label}
        value={data.label} onChange={set('label')}
        placeholder={t.qrDataInput.form.labelPlaceholder}
      />
    </div>
  );
}

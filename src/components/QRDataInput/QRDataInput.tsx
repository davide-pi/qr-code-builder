import { useState } from 'react';
import type {
  QRTemplateType,
  URLData,
  VCardData,
  WiFiData,
  EmailData,
  SMSData,
  CalendarData,
  LocationData,
  QRTemplateData
} from '../../types/qr';
import {
  defaultURLData,
  defaultVCardData,
  defaultWiFiData,
  defaultEmailData,
  defaultSMSData,
  defaultCalendarData,
  defaultLocationData
} from '../../types/qr';
import { Link, Contact, Wifi, Mail, MessageSquare, Calendar, MapPin } from 'lucide-react';
import './QRDataInput.css';

interface QRDataInputProps {
  templateType: QRTemplateType;
  onTemplateChange: (type: QRTemplateType) => void;
  onDataChange: (data: string) => void;
}

const templates = [
  { type: 'url' as const, label: 'URL', icon: Link, description: 'Website or link' },
  { type: 'vcard' as const, label: 'vCard', icon: Contact, description: 'Contact card' },
  { type: 'wifi' as const, label: 'WiFi', icon: Wifi, description: 'Network credentials' },
  { type: 'email' as const, label: 'Email', icon: Mail, description: 'Email message' },
  { type: 'sms' as const, label: 'SMS', icon: MessageSquare, description: 'Text message' },
  { type: 'calendar' as const, label: 'Event', icon: Calendar, description: 'Calendar event' },
  { type: 'location' as const, label: 'Location', icon: MapPin, description: 'Geo coordinates' },
];

// Helper functions to convert template data to QR string
const generateQRString = (type: QRTemplateType, data: QRTemplateData): string => {
  switch (type) {
    case 'url':
      return (data as URLData).url || '';

    case 'vcard': {
      const vcard = data as VCardData;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        vcard.firstName || vcard.lastName ? `N:${vcard.lastName};${vcard.firstName};;;` : '',
        vcard.firstName || vcard.lastName ? `FN:${vcard.firstName} ${vcard.lastName}`.trim() : '',
        vcard.organization ? `ORG:${vcard.organization}` : '',
        vcard.title ? `TITLE:${vcard.title}` : '',
        vcard.phone ? `TEL:${vcard.phone}` : '',
        vcard.email ? `EMAIL:${vcard.email}` : '',
        vcard.website ? `URL:${vcard.website}` : '',
        (vcard.address || vcard.city || vcard.state || vcard.zip || vcard.country)
          ? `ADR:;;${vcard.address};${vcard.city};${vcard.state};${vcard.zip};${vcard.country}`
          : '',
        'END:VCARD',
      ].filter(line => line);
      return lines.join('\n');
    }

    case 'wifi': {
      const wifi = data as WiFiData;
      if (!wifi.ssid) return '';
      return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden ? 'true' : 'false'};;`;
    }

    case 'email': {
      const email = data as EmailData;
      if (!email.email) return '';
      return `mailto:${email.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    }

    case 'sms': {
      const sms = data as SMSData;
      if (!sms.phone) return '';
      return `sms:${sms.phone}${sms.message ? `?body=${encodeURIComponent(sms.message)}` : ''}`;
    }

    case 'calendar': {
      const cal = data as CalendarData;
      if (!cal.title) return '';
      const formatDate = (date: string) => date.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${cal.title}`,
        cal.location ? `LOCATION:${cal.location}` : '',
        cal.description ? `DESCRIPTION:${cal.description}` : '',
        cal.startDate ? `DTSTART:${formatDate(cal.startDate)}` : '',
        cal.endDate ? `DTEND:${formatDate(cal.endDate)}` : '',
        'END:VEVENT',
      ].filter(line => line).join('\n');
    }

    case 'location': {
      const loc = data as LocationData;
      if (!loc.latitude || !loc.longitude) return '';
      return `geo:${loc.latitude},${loc.longitude}${loc.label ? `?q=${encodeURIComponent(loc.label)}` : ''}`;
    }

    default:
      return '';
  }
};

export default function QRDataInput({ templateType, onTemplateChange, onDataChange }: QRDataInputProps) {
  const [urlData, setUrlData] = useState<URLData>(defaultURLData);
  const [vcardData, setVcardData] = useState<VCardData>(defaultVCardData);
  const [wifiData, setWifiData] = useState<WiFiData>(defaultWiFiData);
  const [emailData, setEmailData] = useState<EmailData>(defaultEmailData);
  const [smsData, setSmsData] = useState<SMSData>(defaultSMSData);
  const [calendarData, setCalendarData] = useState<CalendarData>(defaultCalendarData);
  const [locationData, setLocationData] = useState<LocationData>(defaultLocationData);

  const updateData = (type: QRTemplateType, data: QRTemplateData) => {
    const qrString = generateQRString(type, data);
    onDataChange(qrString);
  };

  const handleTemplateChange = (type: QRTemplateType) => {
    onTemplateChange(type);
    // Generate QR string for the new template with current data
    let data: QRTemplateData;
    switch (type) {
      case 'url': data = urlData; break;
      case 'vcard': data = vcardData; break;
      case 'wifi': data = wifiData; break;
      case 'email': data = emailData; break;
      case 'sms': data = smsData; break;
      case 'calendar': data = calendarData; break;
      case 'location': data = locationData; break;
      default: data = urlData;
    }
    updateData(type, data);
  };

  const renderForm = () => {
    switch (templateType) {
      case 'url':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="url">URL *</label>
              <input
                type="url"
                id="url"
                value={urlData.url}
                onChange={(e) => {
                  const newData = { ...urlData, url: e.target.value };
                  setUrlData(newData);
                  updateData('url', newData);
                }}
                placeholder="https://example.com"
              />
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="template-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={vcardData.firstName}
                  onChange={(e) => {
                    const newData = { ...vcardData, firstName: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={vcardData.lastName}
                  onChange={(e) => {
                    const newData = { ...vcardData, lastName: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="organization">Organization</label>
              <input
                type="text"
                id="organization"
                value={vcardData.organization}
                onChange={(e) => {
                  const newData = { ...vcardData, organization: e.target.value };
                  setVcardData(newData);
                  updateData('vcard', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input
                type="text"
                id="title"
                value={vcardData.title}
                onChange={(e) => {
                  const newData = { ...vcardData, title: e.target.value };
                  setVcardData(newData);
                  updateData('vcard', newData);
                }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  value={vcardData.phone}
                  onChange={(e) => {
                    const newData = { ...vcardData, phone: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="vcardEmail">Email</label>
                <input
                  type="email"
                  id="vcardEmail"
                  value={vcardData.email}
                  onChange={(e) => {
                    const newData = { ...vcardData, email: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                value={vcardData.website}
                onChange={(e) => {
                  const newData = { ...vcardData, website: e.target.value };
                  setVcardData(newData);
                  updateData('vcard', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                value={vcardData.address}
                onChange={(e) => {
                  const newData = { ...vcardData, address: e.target.value };
                  setVcardData(newData);
                  updateData('vcard', newData);
                }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  value={vcardData.city}
                  onChange={(e) => {
                    const newData = { ...vcardData, city: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  value={vcardData.state}
                  onChange={(e) => {
                    const newData = { ...vcardData, state: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zip">Zip Code</label>
                <input
                  type="text"
                  id="zip"
                  value={vcardData.zip}
                  onChange={(e) => {
                    const newData = { ...vcardData, zip: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  value={vcardData.country}
                  onChange={(e) => {
                    const newData = { ...vcardData, country: e.target.value };
                    setVcardData(newData);
                    updateData('vcard', newData);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="ssid">Network Name (SSID) *</label>
              <input
                type="text"
                id="ssid"
                value={wifiData.ssid}
                onChange={(e) => {
                  const newData = { ...wifiData, ssid: e.target.value };
                  setWifiData(newData);
                  updateData('wifi', newData);
                }}
                placeholder="MyWiFiNetwork"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="text"
                id="password"
                value={wifiData.password}
                onChange={(e) => {
                  const newData = { ...wifiData, password: e.target.value };
                  setWifiData(newData);
                  updateData('wifi', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="encryption">Encryption</label>
              <select
                id="encryption"
                value={wifiData.encryption}
                onChange={(e) => {
                  const newData = { ...wifiData, encryption: e.target.value as 'WPA' | 'WEP' | 'nopass' };
                  setWifiData(newData);
                  updateData('wifi', newData);
                }}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={wifiData.hidden}
                  onChange={(e) => {
                    const newData = { ...wifiData, hidden: e.target.checked };
                    setWifiData(newData);
                    updateData('wifi', newData);
                  }}
                />
                Hidden Network
              </label>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="emailAddress">Email Address *</label>
              <input
                type="email"
                id="emailAddress"
                value={emailData.email}
                onChange={(e) => {
                  const newData = { ...emailData, email: e.target.value };
                  setEmailData(newData);
                  updateData('email', newData);
                }}
                placeholder="example@email.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                value={emailData.subject}
                onChange={(e) => {
                  const newData = { ...emailData, subject: e.target.value };
                  setEmailData(newData);
                  updateData('email', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="body">Message</label>
              <textarea
                id="body"
                value={emailData.body}
                onChange={(e) => {
                  const newData = { ...emailData, body: e.target.value };
                  setEmailData(newData);
                  updateData('email', newData);
                }}
                rows={4}
              />
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="smsPhone">Phone Number *</label>
              <input
                type="tel"
                id="smsPhone"
                value={smsData.phone}
                onChange={(e) => {
                  const newData = { ...smsData, phone: e.target.value };
                  setSmsData(newData);
                  updateData('sms', newData);
                }}
                placeholder="+1234567890"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={smsData.message}
                onChange={(e) => {
                  const newData = { ...smsData, message: e.target.value };
                  setSmsData(newData);
                  updateData('sms', newData);
                }}
                rows={4}
              />
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="eventTitle">Event Title *</label>
              <input
                type="text"
                id="eventTitle"
                value={calendarData.title}
                onChange={(e) => {
                  const newData = { ...calendarData, title: e.target.value };
                  setCalendarData(newData);
                  updateData('calendar', newData);
                }}
                placeholder="Meeting Title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventLocation">Location</label>
              <input
                type="text"
                id="eventLocation"
                value={calendarData.location}
                onChange={(e) => {
                  const newData = { ...calendarData, location: e.target.value };
                  setCalendarData(newData);
                  updateData('calendar', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="eventDescription">Description</label>
              <textarea
                id="eventDescription"
                value={calendarData.description}
                onChange={(e) => {
                  const newData = { ...calendarData, description: e.target.value };
                  setCalendarData(newData);
                  updateData('calendar', newData);
                }}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start Date & Time</label>
              <input
                type="datetime-local"
                id="startDate"
                value={calendarData.startDate}
                onChange={(e) => {
                  const newData = { ...calendarData, startDate: e.target.value };
                  setCalendarData(newData);
                  updateData('calendar', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date & Time</label>
              <input
                type="datetime-local"
                id="endDate"
                value={calendarData.endDate}
                onChange={(e) => {
                  const newData = { ...calendarData, endDate: e.target.value };
                  setCalendarData(newData);
                  updateData('calendar', newData);
                }}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={calendarData.allDay}
                  onChange={(e) => {
                    const newData = { ...calendarData, allDay: e.target.checked };
                    setCalendarData(newData);
                    updateData('calendar', newData);
                  }}
                />
                All Day Event
              </label>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="latitude">Latitude *</label>
              <input
                type="text"
                id="latitude"
                value={locationData.latitude}
                onChange={(e) => {
                  const newData = { ...locationData, latitude: e.target.value };
                  setLocationData(newData);
                  updateData('location', newData);
                }}
                placeholder="37.7749"
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude *</label>
              <input
                type="text"
                id="longitude"
                value={locationData.longitude}
                onChange={(e) => {
                  const newData = { ...locationData, longitude: e.target.value };
                  setLocationData(newData);
                  updateData('location', newData);
                }}
                placeholder="-122.4194"
              />
            </div>
            <div className="form-group">
              <label htmlFor="locationLabel">Label</label>
              <input
                type="text"
                id="locationLabel"
                value={locationData.label}
                onChange={(e) => {
                  const newData = { ...locationData, label: e.target.value };
                  setLocationData(newData);
                  updateData('location', newData);
                }}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="qr-data-input">
      <h2>QR Content</h2>

      <div className="template-selector">
        {templates.map(({ type, label, icon: Icon, description }) => (
          <button
            key={type}
            className={`template-btn ${templateType === type ? 'active' : ''}`}
            onClick={() => handleTemplateChange(type)}
            title={description}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {renderForm()}
    </div>
  );
}

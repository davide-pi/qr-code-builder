import { useState, useRef, useEffect } from 'react';
import type {
  QRTemplateType,
  TemplateCategory,
  URLData,
  VCardData,
  WiFiData,
  EmailData,
  SMSData,
  CalendarData,
  LocationData,
  PhoneData,
  WhatsAppData,
  TelegramData,
  SocialMediaData,
  PayPalData,
  BitcoinData,
  QRTemplateData
} from '../../types/qr';
import {
  Link, Contact, Wifi, Mail, MessageSquare, Calendar, MapPin, Phone,
  Instagram, Twitter, Linkedin, Youtube, Facebook,
  MessageCircle, Send, DollarSign, Bitcoin, Video, ChevronDown, Ghost
} from 'lucide-react';
import {
  defaultURLData,
  defaultVCardData,
  defaultWiFiData,
  defaultEmailData,
  defaultSMSData,
  getDefaultCalendarData,
  defaultLocationData,
  defaultPhoneData,
  defaultWhatsAppData,
  defaultTelegramData,
  defaultSocialMediaData,
  defaultPayPalData,
  defaultBitcoinData,
  templateDefinitions,
  categoryLabels,
} from '../../types/qr';
import CountryCodeSelect from '../CountryCodeSelect/CountryCodeSelect';
import './QRDataInput.css';

interface QRDataInputProps {
  templateType: QRTemplateType;
  onTemplateChange: (type: QRTemplateType) => void;
  onDataChange: (data: string) => void;
}

// Categories for dropdown grouping
const displayCategories: TemplateCategory[] = ['links', 'contact', 'social', 'payment'];

// Icon mapping for templates
const templateIcons: Record<QRTemplateType, React.ElementType> = {
  url: Link,
  vcard: Contact,
  wifi: Wifi,
  email: Mail,
  sms: MessageSquare,
  calendar: Calendar,
  location: MapPin,
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Video,
  youtube: Youtube,
  facebook: Facebook,
  snapchat: Ghost,
  paypal: DollarSign,
  bitcoin: Bitcoin,
};

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
      const fullPhone = `${sms.countryCode}${sms.phone.replace(/[^0-9]/g, '')}`;
      return `sms:${fullPhone}${sms.message ? `?body=${encodeURIComponent(sms.message)}` : ''}`;
    }

    case 'phone': {
      const phone = data as PhoneData;
      if (!phone.phone) return '';
      const fullPhone = `${phone.countryCode}${phone.phone.replace(/[^0-9]/g, '')}`;
      return `tel:${fullPhone}`;
    }

    case 'calendar': {
      const cal = data as CalendarData;
      if (!cal.title) return '';

      // Format datetime-local (YYYY-MM-DDTHH:MM) to iCalendar format (YYYYMMDDTHHMMSS)
      const formatDateTime = (date: string) => {
        if (!date) return '';
        // Remove dashes, colons, and add seconds
        return date.replace(/-/g, '').replace('T', 'T').replace(':', '') + '00';
      };

      // Format date only (YYYY-MM-DD) to iCalendar date format (YYYYMMDD)
      const formatDateOnly = (date: string) => {
        if (!date) return '';
        // Extract just the date part and remove dashes
        return date.split('T')[0].replace(/-/g, '');
      };

      // For all-day events, DTEND is exclusive, so add 1 day to end date
      const getNextDay = (date: string) => {
        if (!date) return '';
        const dateOnly = date.split('T')[0];
        const nextDay = new Date(dateOnly);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split('T')[0].replace(/-/g, '');
      };

      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${cal.title}`,
      ];

      if (cal.location) lines.push(`LOCATION:${cal.location}`);
      if (cal.description) lines.push(`DESCRIPTION:${cal.description}`);

      if (cal.allDay) {
        // All-day event uses VALUE=DATE format
        // DTEND is exclusive in iCalendar, so add 1 day
        if (cal.startDate) lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(cal.startDate)}`);
        if (cal.endDate) lines.push(`DTEND;VALUE=DATE:${getNextDay(cal.endDate)}`);
      } else {
        // Timed event uses full datetime
        if (cal.startDate) lines.push(`DTSTART:${formatDateTime(cal.startDate)}`);
        if (cal.endDate) lines.push(`DTEND:${formatDateTime(cal.endDate)}`);
      }

      lines.push('END:VEVENT', 'END:VCALENDAR');

      return lines.join('\n');
    }

    case 'location': {
      const loc = data as LocationData;
      if (!loc.latitude || !loc.longitude) return '';
      return `geo:${loc.latitude},${loc.longitude}${loc.label ? `?q=${encodeURIComponent(loc.label)}` : ''}`;
    }

    case 'whatsapp': {
      const wa = data as WhatsAppData;
      if (!wa.phone) return '';
      // Combine country code and phone, remove all non-digits
      const fullPhone = `${wa.countryCode}${wa.phone}`.replace(/[^0-9]/g, '');
      return `https://wa.me/${fullPhone}${wa.message ? `?text=${encodeURIComponent(wa.message)}` : ''}`;
    }

    case 'telegram': {
      const tg = data as TelegramData;
      if (!tg.username) return '';
      const username = tg.username.replace('@', '');
      // Use t.me link with ?text parameter for prefilled message
      if (tg.message) {
        return `https://t.me/${username}?text=${encodeURIComponent(tg.message)}`;
      }
      return `https://t.me/${username}`;
    }

    case 'instagram': {
      const ig = data as SocialMediaData;
      if (!ig.username) return '';
      return `https://instagram.com/${ig.username.replace('@', '')}`;
    }

    case 'twitter': {
      const tw = data as SocialMediaData;
      if (!tw.username) return '';
      return `https://twitter.com/${tw.username.replace('@', '')}`;
    }

    case 'linkedin': {
      const li = data as SocialMediaData;
      if (!li.username) return '';
      return `https://linkedin.com/in/${li.username}`;
    }

    case 'tiktok': {
      const tt = data as SocialMediaData;
      if (!tt.username) return '';
      return `https://tiktok.com/@${tt.username.replace('@', '')}`;
    }

    case 'youtube': {
      const yt = data as SocialMediaData;
      if (!yt.username) return '';
      return `https://youtube.com/@${yt.username.replace('@', '')}`;
    }

    case 'facebook': {
      const fb = data as SocialMediaData;
      if (!fb.username) return '';
      return `https://facebook.com/${fb.username}`;
    }

    case 'snapchat': {
      const sc = data as SocialMediaData;
      if (!sc.username) return '';
      return `https://snapchat.com/add/${sc.username}`;
    }

    case 'paypal': {
      const pp = data as PayPalData;
      if (!pp.username) return '';
      let url = `https://paypal.me/${pp.username}`;
      if (pp.amount) {
        url += `/${pp.amount}${pp.currency ? pp.currency : ''}`;
      }
      return url;
    }

    case 'bitcoin': {
      const btc = data as BitcoinData;
      if (!btc.address) return '';
      let url = `bitcoin:${btc.address}`;
      const params: string[] = [];
      if (btc.amount) params.push(`amount=${btc.amount}`);
      if (btc.label) params.push(`label=${encodeURIComponent(btc.label)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      return url;
    }

    default:
      return '';
  }
};

export default function QRDataInput({ templateType, onTemplateChange, onDataChange }: QRDataInputProps) {
  // Template data states
  const [urlData, setUrlData] = useState<URLData>(defaultURLData);
  const [vcardData, setVcardData] = useState<VCardData>(defaultVCardData);
  const [wifiData, setWifiData] = useState<WiFiData>(defaultWiFiData);
  const [emailData, setEmailData] = useState<EmailData>(defaultEmailData);
  const [smsData, setSmsData] = useState<SMSData>(defaultSMSData);
  const [calendarData, setCalendarData] = useState<CalendarData>(getDefaultCalendarData);
  const [locationData, setLocationData] = useState<LocationData>(defaultLocationData);
  const [phoneData, setPhoneData] = useState<PhoneData>(defaultPhoneData);
  const [whatsappData, setWhatsappData] = useState<WhatsAppData>(defaultWhatsAppData);
  const [telegramData, setTelegramData] = useState<TelegramData>(defaultTelegramData);
  const [instagramData, setInstagramData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [twitterData, setTwitterData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [linkedinData, setLinkedinData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [tiktokData, setTiktokData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [youtubeData, setYoutubeData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [facebookData, setFacebookData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [snapchatData, setSnapchatData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [paypalData, setPaypalData] = useState<PayPalData>(defaultPayPalData);
  const [bitcoinData, setBitcoinData] = useState<BitcoinData>(defaultBitcoinData);

  const updateData = (type: QRTemplateType, data: QRTemplateData) => {
    const qrString = generateQRString(type, data);
    onDataChange(qrString);
  };

  const getDataForType = (type: QRTemplateType): QRTemplateData => {
    switch (type) {
      case 'url': return urlData;
      case 'vcard': return vcardData;
      case 'wifi': return wifiData;
      case 'email': return emailData;
      case 'sms': return smsData;
      case 'calendar': return calendarData;
      case 'location': return locationData;
      case 'phone': return phoneData;
      case 'whatsapp': return whatsappData;
      case 'telegram': return telegramData;
      case 'instagram': return instagramData;
      case 'twitter': return twitterData;
      case 'linkedin': return linkedinData;
      case 'tiktok': return tiktokData;
      case 'youtube': return youtubeData;
      case 'facebook': return facebookData;
      case 'snapchat': return snapchatData;
      case 'paypal': return paypalData;
      case 'bitcoin': return bitcoinData;
      default: return urlData;
    }
  };

  const handleTemplateChange = (type: QRTemplateType) => {
    onTemplateChange(type);
    updateData(type, getDataForType(type));
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
              <label>Phone Number *</label>
              <div className="phone-input-group">
                <div className="country-code-select-wrapper">
                  <CountryCodeSelect
                    value={smsData.countryCode}
                    onChange={(value) => {
                      const newData = { ...smsData, countryCode: value };
                      setSmsData(newData);
                      updateData('sms', newData);
                    }}
                  />
                </div>
                <input
                  type="tel"
                  id="smsPhone"
                  className="phone-number-input"
                  value={smsData.phone}
                  onChange={(e) => {
                    const newData = { ...smsData, phone: e.target.value };
                    setSmsData(newData);
                    updateData('sms', newData);
                  }}
                  placeholder="123456789"
                />
              </div>
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

      case 'phone':
        return (
          <div className="template-form">
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input-group">
                <div className="country-code-select-wrapper">
                  <CountryCodeSelect
                    value={phoneData.countryCode}
                    onChange={(value) => {
                      const newData = { ...phoneData, countryCode: value };
                      setPhoneData(newData);
                      updateData('phone', newData);
                    }}
                  />
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="phone-number-input"
                  value={phoneData.phone}
                  onChange={(e) => {
                    const newData = { ...phoneData, phone: e.target.value };
                    setPhoneData(newData);
                    updateData('phone', newData);
                  }}
                  placeholder="123456789"
                />
              </div>
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
            {calendarData.allDay ? (
              <>
                <div className="form-group">
                  <label htmlFor="startDateOnly">Start Date</label>
                  <input
                    type="date"
                    id="startDateOnly"
                    max="9999-12-31"
                    value={calendarData.startDate.split('T')[0] || ''}
                    onChange={(e) => {
                      const newData = { ...calendarData, startDate: e.target.value };
                      setCalendarData(newData);
                      updateData('calendar', newData);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDateOnly">End Date</label>
                  <input
                    type="date"
                    id="endDateOnly"
                    max="9999-12-31"
                    value={calendarData.endDate.split('T')[0] || ''}
                    onChange={(e) => {
                      const newData = { ...calendarData, endDate: e.target.value };
                      setCalendarData(newData);
                      updateData('calendar', newData);
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="startDate">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    max="9999-12-31T23:59"
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
                    max="9999-12-31T23:59"
                    value={calendarData.endDate}
                    onChange={(e) => {
                      const newData = { ...calendarData, endDate: e.target.value };
                      setCalendarData(newData);
                      updateData('calendar', newData);
                    }}
                  />
                </div>
              </>
            )}
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

      case 'whatsapp':
        return (
          <div className="template-form">
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input-group">
                <div className="country-code-select-wrapper">
                  <CountryCodeSelect
                    value={whatsappData.countryCode}
                    onChange={(value) => {
                      const newData = { ...whatsappData, countryCode: value };
                      setWhatsappData(newData);
                      updateData('whatsapp', newData);
                    }}
                  />
                </div>
                <input
                  type="tel"
                  id="waPhone"
                  className="phone-number-input"
                  value={whatsappData.phone}
                  onChange={(e) => {
                    const newData = { ...whatsappData, phone: e.target.value };
                    setWhatsappData(newData);
                    updateData('whatsapp', newData);
                  }}
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="waMessage">Pre-filled Message</label>
              <textarea
                id="waMessage"
                value={whatsappData.message}
                onChange={(e) => {
                  const newData = { ...whatsappData, message: e.target.value };
                  setWhatsappData(newData);
                  updateData('whatsapp', newData);
                }}
                rows={3}
                placeholder="Hello! I'd like to..."
              />
            </div>
          </div>
        );

      case 'telegram':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="tgUsername">Username *</label>
              <input
                type="text"
                id="tgUsername"
                value={telegramData.username}
                onChange={(e) => {
                  const newData = { ...telegramData, username: e.target.value };
                  setTelegramData(newData);
                  updateData('telegram', newData);
                }}
                placeholder="@username or username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="tgMessage">Prefilled Message</label>
              <textarea
                id="tgMessage"
                value={telegramData.message}
                onChange={(e) => {
                  const newData = { ...telegramData, message: e.target.value };
                  setTelegramData(newData);
                  updateData('telegram', newData);
                }}
                placeholder="Hi! I scanned your QR code..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="igUsername">Username *</label>
              <input
                type="text"
                id="igUsername"
                value={instagramData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setInstagramData(newData);
                  updateData('instagram', newData);
                }}
                placeholder="@username or username"
              />
            </div>
          </div>
        );

      case 'twitter':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="twUsername">Username *</label>
              <input
                type="text"
                id="twUsername"
                value={twitterData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setTwitterData(newData);
                  updateData('twitter', newData);
                }}
                placeholder="@username or username"
              />
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="liUsername">Profile ID *</label>
              <input
                type="text"
                id="liUsername"
                value={linkedinData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setLinkedinData(newData);
                  updateData('linkedin', newData);
                }}
                placeholder="john-doe-123456"
              />
            </div>
          </div>
        );

      case 'tiktok':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="ttUsername">Username *</label>
              <input
                type="text"
                id="ttUsername"
                value={tiktokData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setTiktokData(newData);
                  updateData('tiktok', newData);
                }}
                placeholder="@username or username"
              />
            </div>
          </div>
        );

      case 'youtube':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="ytUsername">Channel Handle *</label>
              <input
                type="text"
                id="ytUsername"
                value={youtubeData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setYoutubeData(newData);
                  updateData('youtube', newData);
                }}
                placeholder="@channelname"
              />
            </div>
          </div>
        );

      case 'facebook':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="fbUsername">Page/Profile Name *</label>
              <input
                type="text"
                id="fbUsername"
                value={facebookData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setFacebookData(newData);
                  updateData('facebook', newData);
                }}
                placeholder="pagename or profile.id"
              />
            </div>
          </div>
        );

      case 'snapchat':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="scUsername">Username *</label>
              <input
                type="text"
                id="scUsername"
                value={snapchatData.username}
                onChange={(e) => {
                  const newData = { username: e.target.value };
                  setSnapchatData(newData);
                  updateData('snapchat', newData);
                }}
                placeholder="username"
              />
            </div>
          </div>
        );

      case 'paypal':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="ppUsername">PayPal.me Username *</label>
              <input
                type="text"
                id="ppUsername"
                value={paypalData.username}
                onChange={(e) => {
                  const newData = { ...paypalData, username: e.target.value };
                  setPaypalData(newData);
                  updateData('paypal', newData);
                }}
                placeholder="yourusername"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ppAmount">Amount (optional)</label>
                <input
                  type="text"
                  id="ppAmount"
                  value={paypalData.amount || ''}
                  onChange={(e) => {
                    const newData = { ...paypalData, amount: e.target.value };
                    setPaypalData(newData);
                    updateData('paypal', newData);
                  }}
                  placeholder="10.00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ppCurrency">Currency</label>
                <select
                  id="ppCurrency"
                  value={paypalData.currency || 'USD'}
                  onChange={(e) => {
                    const newData = { ...paypalData, currency: e.target.value };
                    setPaypalData(newData);
                    updateData('paypal', newData);
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'bitcoin':
        return (
          <div className="template-form">
            <div className="form-group">
              <label htmlFor="btcAddress">Bitcoin Address *</label>
              <input
                type="text"
                id="btcAddress"
                value={bitcoinData.address}
                onChange={(e) => {
                  const newData = { ...bitcoinData, address: e.target.value };
                  setBitcoinData(newData);
                  updateData('bitcoin', newData);
                }}
                placeholder="bc1q..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="btcAmount">Amount (BTC)</label>
                <input
                  type="text"
                  id="btcAmount"
                  value={bitcoinData.amount || ''}
                  onChange={(e) => {
                    const newData = { ...bitcoinData, amount: e.target.value };
                    setBitcoinData(newData);
                    updateData('bitcoin', newData);
                  }}
                  placeholder="0.001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="btcLabel">Label</label>
                <input
                  type="text"
                  id="btcLabel"
                  value={bitcoinData.label || ''}
                  onChange={(e) => {
                    const newData = { ...bitcoinData, label: e.target.value };
                    setBitcoinData(newData);
                    updateData('bitcoin', newData);
                  }}
                  placeholder="Donation"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTemplate = templateDefinitions.find(t => t.type === templateType);
  const CurrentIcon = templateIcons[templateType];

  return (
    <div className="qr-data-input">
      <h2>QR Content</h2>

      {/* Custom Template Dropdown with Icons */}
      <div className="template-dropdown-container" ref={dropdownRef}>
        <label>Template Type</label>
        <button
          type="button"
          className={`template-dropdown-trigger ${isDropdownOpen ? 'open' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        >
          <span className="template-dropdown-selected">
            <CurrentIcon size={18} />
            <span>{currentTemplate?.label || 'Select Template'}</span>
          </span>
          <ChevronDown size={18} className={`dropdown-chevron ${isDropdownOpen ? 'rotated' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="template-dropdown-menu" role="listbox">
            {displayCategories.map((category) => {
              const categoryTemplates = templateDefinitions.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;
              return (
                <div key={category} className="template-dropdown-group">
                  <div className="template-dropdown-group-label">{categoryLabels[category]}</div>
                  {categoryTemplates.map(({ type, label }) => {
                    const Icon = templateIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`template-dropdown-item ${type === templateType ? 'selected' : ''}`}
                        onClick={() => {
                          handleTemplateChange(type);
                          setIsDropdownOpen(false);
                        }}
                        role="option"
                        aria-selected={type === templateType}
                      >
                        <Icon size={16} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderForm()}
    </div>
  );
}

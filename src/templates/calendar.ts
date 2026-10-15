import { Calendar } from 'lucide-react';
import { getDefaultCalendarData, type CalendarData } from '../types/qr';
import { CalendarForm } from './forms/LinkForms';
import { hashHex } from './lib/hash';
import { CRLF, escapeText, foldLine } from './lib/text';
import type { FieldErrors, QRTemplate } from './types';

// "2025-03-01T09:30" -> "20250301T093000" (floating local time)
const toIcsDateTime = (value: string): string => {
  const [date, time = ''] = value.split('T');
  return `${date.replace(/-/g, '')}T${time.replace(/:/g, '').padEnd(6, '0')}`;
};

// "2025-03-01T09:30" -> "20250301"
const toIcsDate = (value: string): string => value.split('T')[0].replace(/-/g, '');

// DTEND is exclusive for all-day events: the day after the last day.
// Pure UTC arithmetic, so daylight saving time cannot shift the result.
const nextIcsDate = (value: string): string => {
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, '');
};

// DTSTAMP must be a UTC date-time. The payload has to stay pure (no clock), so the event's
// own start is used as a stable stand-in: apps only compare it between revisions of the same UID.
const toIcsStamp = (startDate: string): string =>
  `${(startDate ? toIcsDateTime(startDate) : '19700101T000000').slice(0, 15)}Z`;

// RFC 5545 VEVENT, which requires UID and DTSTAMP. Neither can be random or use the clock
// (buildPayload is pure), so UID is a hash of the event content: the same event always gives
// the same UID, a different one gives another. Lines are folded at 75 octets.
const buildPayload = (data: CalendarData): string => {
  if (!data.title) return '';
  const content = [`SUMMARY:${escapeText(data.title)}`];
  if (data.location) content.push(`LOCATION:${escapeText(data.location)}`);
  if (data.description) content.push(`DESCRIPTION:${escapeText(data.description)}`);
  if (data.allDay) {
    if (data.startDate) content.push(`DTSTART;VALUE=DATE:${toIcsDate(data.startDate)}`);
    if (data.endDate) content.push(`DTEND;VALUE=DATE:${nextIcsDate(data.endDate)}`);
  } else {
    if (data.startDate) content.push(`DTSTART:${toIcsDateTime(data.startDate)}`);
    if (data.endDate) content.push(`DTEND:${toIcsDateTime(data.endDate)}`);
  }
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QR Code Builder//EN',
    'BEGIN:VEVENT',
    `UID:${hashHex(content.join(CRLF))}@qr-code-builder`,
    `DTSTAMP:${toIcsStamp(data.startDate)}`,
    ...content,
    'END:VEVENT',
    'END:VCALENDAR',
  ].map((line) => foldLine(line)).join(CRLF);
};

const validate = (data: CalendarData): FieldErrors<CalendarData> => {
  const errors: FieldErrors<CalendarData> = {};
  if (!data.title.trim()) errors.title = 'required';
  if (!data.startDate) errors.startDate = 'required';
  if (data.startDate && data.endDate) {
    const start = data.allDay ? toIcsDate(data.startDate) : toIcsDateTime(data.startDate);
    const end = data.allDay ? toIcsDate(data.endDate) : toIcsDateTime(data.endDate);
    if (end < start) errors.endDate = 'endBeforeStart';
  }
  return errors;
};

export const calendarTemplate: QRTemplate<CalendarData> = {
  type: 'calendar',
  category: 'links',
  icon: Calendar,
  defaultData: getDefaultCalendarData,
  validate,
  buildPayload,
  Form: CalendarForm,
};

import { Bitcoin, DollarSign, Landmark } from 'lucide-react';
import {
  defaultBitcoinData, defaultEPCData, defaultPayPalData,
  type BitcoinData, type EPCData, type PayPalData,
} from '../types/qr';
import { BitcoinForm, EpcForm, PayPalForm } from './forms/PaymentForms';
import { normalizeAmount } from './lib/amount';
import { isValidBic, isValidIban, normalizeIban } from './lib/iban';
import { buildSocialUrl } from './lib/social';
import { toSingleLine } from './lib/text';
import type { FieldErrors, QRTemplate } from './types';

// ---- PayPal.me -------------------------------------------------------------

const paypalUrl = { baseUrl: 'https://paypal.me/', hosts: ['paypal.me'] };

export const paypalTemplate: QRTemplate<PayPalData> = {
  type: 'paypal',
  category: 'payment',
  icon: DollarSign,
  defaultData: () => ({ ...defaultPayPalData }),
  validate: (data) => {
    const errors: FieldErrors<PayPalData> = {};
    if (!data.username.trim()) errors.username = 'required';
    else if (!buildSocialUrl(paypalUrl, data.username)) errors.username = 'invalidHandle';
    if (data.amount.trim() && normalizeAmount(data.amount, 2) === null) errors.amount = 'invalidAmount';
    return errors;
  },
  buildPayload: (data) => {
    const url = buildSocialUrl(paypalUrl, data.username);
    if (!url) return '';
    const amount = normalizeAmount(data.amount, 2);
    return amount ? `${url}/${amount}${data.currency || 'EUR'}` : url;
  },
  Form: PayPalForm,
};

// ---- Bitcoin (BIP 21) ------------------------------------------------------

const bitcoinAddress = (value: string): string => value.trim().replace(/^bitcoin:/i, '');

export const bitcoinTemplate: QRTemplate<BitcoinData> = {
  type: 'bitcoin',
  category: 'payment',
  icon: Bitcoin,
  defaultData: () => ({ ...defaultBitcoinData }),
  validate: (data) => {
    const errors: FieldErrors<BitcoinData> = {};
    const address = bitcoinAddress(data.address);
    if (!address) errors.address = 'required';
    // Base58 and bech32 addresses are alphanumeric; the checksum is not verified here
    else if (!/^[a-zA-Z0-9]{14,90}$/.test(address)) errors.address = 'invalidBitcoinAddress';
    if (data.amount.trim() && normalizeAmount(data.amount, 8) === null) errors.amount = 'invalidAmount';
    return errors;
  },
  buildPayload: (data) => {
    const address = bitcoinAddress(data.address);
    if (!address) return '';
    const params: string[] = [];
    const amount = normalizeAmount(data.amount, 8);
    if (amount) params.push(`amount=${amount}`);
    if (data.label.trim()) params.push(`label=${encodeURIComponent(data.label.trim())}`);
    return `bitcoin:${encodeURIComponent(address)}${params.length > 0 ? `?${params.join('&')}` : ''}`;
  },
  Form: BitcoinForm,
};

// ---- SEPA credit transfer (EPC069-12, "Girocode") --------------------------

const EPC_MAX_NAME = 70;
const EPC_MAX_REMITTANCE = 140;
const EPC_MIN_AMOUNT = 0.01;
const EPC_MAX_AMOUNT = 999999999.99;

// Service tag, version 002, UTF-8, SEPA credit transfer. Lines (LF separated):
// BIC, name, IBAN, EUR<amount>, purpose, structured reference, remittance text.
// Trailing empty lines may be omitted per the spec.
const buildEpcPayload = (data: EPCData): string => {
  const name = toSingleLine(data.name);
  const iban = normalizeIban(data.iban);
  if (!name || !iban) return '';
  const amount = normalizeAmount(data.amount, 2);
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    data.bic.replace(/\s+/g, '').toUpperCase(),
    name,
    iban,
    amount ? `EUR${Number(amount).toFixed(2)}` : '',
    '',
    '',
    toSingleLine(data.remittance),
  ];
  while (lines.length > 4 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
};

const validateEpc = (data: EPCData): FieldErrors<EPCData> => {
  const errors: FieldErrors<EPCData> = {};
  const name = toSingleLine(data.name);
  if (!name) errors.name = 'required';
  else if (name.length > EPC_MAX_NAME) errors.name = 'tooLong';
  if (!data.iban.trim()) errors.iban = 'required';
  else if (!isValidIban(data.iban)) errors.iban = 'invalidIban';
  if (data.bic.trim() && !isValidBic(data.bic)) errors.bic = 'invalidBic';
  if (data.amount.trim()) {
    const amount = normalizeAmount(data.amount, 2);
    if (amount === null) errors.amount = 'invalidAmount';
    else if (Number(amount) < EPC_MIN_AMOUNT || Number(amount) > EPC_MAX_AMOUNT) errors.amount = 'amountOutOfRange';
  }
  if (toSingleLine(data.remittance).length > EPC_MAX_REMITTANCE) errors.remittance = 'tooLong';
  return errors;
};

export const epcTemplate: QRTemplate<EPCData> = {
  type: 'epc',
  category: 'payment',
  icon: Landmark,
  defaultData: () => ({ ...defaultEPCData }),
  validate: validateEpc,
  buildPayload: buildEpcPayload,
  Form: EpcForm,
};

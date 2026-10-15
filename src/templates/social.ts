import {
  Facebook, Ghost, Instagram, Linkedin, Send, Twitter, Video, Youtube, type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';
import { defaultSocialMediaData, defaultTelegramData, type SocialMediaData, type TelegramData } from '../types/qr';
import { TelegramForm } from './forms/ContactForms';
import { SocialForm, type SocialFormLabels } from './forms/SocialForm';
import { buildSocialUrl, type SocialUrlConfig } from './lib/social';
import type { FieldErrors, QRTemplate } from './types';

type SocialType = 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'facebook' | 'snapchat';

interface SocialTemplateOptions extends SocialUrlConfig, SocialFormLabels {
  type: SocialType;
  icon: LucideIcon;
}

// One template per social network: only the URL shape and the form labels differ
export function makeSocialTemplate(options: SocialTemplateOptions): QRTemplate<SocialMediaData> {
  const { type, icon, fieldId, labelKey, placeholderKey, ...urlConfig } = options;
  return {
    type,
    category: 'social',
    icon,
    defaultData: () => ({ ...defaultSocialMediaData }),
    validate: (data) => {
      if (!data.username.trim()) return { username: 'required' };
      return buildSocialUrl(urlConfig, data.username) ? {} : { username: 'invalidHandle' };
    },
    buildPayload: (data) => buildSocialUrl(urlConfig, data.username) ?? '',
    Form: (props) => createElement(SocialForm, { ...props, fieldId, labelKey, placeholderKey }),
  };
}

export const instagramTemplate = makeSocialTemplate({
  type: 'instagram', icon: Instagram, fieldId: 'igUsername', labelKey: 'username', placeholderKey: 'usernamePlaceholder',
  baseUrl: 'https://instagram.com/', hosts: ['instagram.com', 'instagr.am'],
});

export const twitterTemplate = makeSocialTemplate({
  type: 'twitter', icon: Twitter, fieldId: 'twUsername', labelKey: 'username', placeholderKey: 'usernamePlaceholder',
  baseUrl: 'https://twitter.com/', hosts: ['twitter.com', 'x.com'],
});

// Profiles live under /in/, companies under /company/, schools under /school/
export const linkedinTemplate = makeSocialTemplate({
  type: 'linkedin', icon: Linkedin, fieldId: 'liUsername', labelKey: 'profileId', placeholderKey: 'profileIdPlaceholder',
  baseUrl: 'https://linkedin.com/', hosts: ['linkedin.com'],
  kinds: ['in', 'company', 'school'], defaultKind: 'in',
});

export const tiktokTemplate = makeSocialTemplate({
  type: 'tiktok', icon: Video, fieldId: 'ttUsername', labelKey: 'username', placeholderKey: 'usernamePlaceholder',
  baseUrl: 'https://tiktok.com/', hosts: ['tiktok.com'], handlePrefix: '@',
});

export const youtubeTemplate = makeSocialTemplate({
  type: 'youtube', icon: Youtube, fieldId: 'ytUsername', labelKey: 'channelHandle', placeholderKey: 'channelHandlePlaceholder',
  baseUrl: 'https://youtube.com/', hosts: ['youtube.com'], handlePrefix: '@',
  kinds: ['channel', 'c', 'user'],
});

export const facebookTemplate = makeSocialTemplate({
  type: 'facebook', icon: Facebook, fieldId: 'fbUsername', labelKey: 'pageProfileName', placeholderKey: 'pageProfilePlaceholder',
  baseUrl: 'https://facebook.com/', hosts: ['facebook.com', 'fb.com'], passthrough: ['profile.php'],
});

export const snapchatTemplate = makeSocialTemplate({
  type: 'snapchat', icon: Ghost, fieldId: 'scUsername', labelKey: 'username', placeholderKey: 'usernamePlaceholder',
  baseUrl: 'https://snapchat.com/', hosts: ['snapchat.com'], kinds: ['add'], defaultKind: 'add',
});

// Telegram also carries a pre-filled message, so it is not a plain social template
const telegramUrl = {
  baseUrl: 'https://t.me/',
  hosts: ['t.me', 'telegram.me', 'telegram.dog'],
  // A phone number link keeps its "+": https://t.me/+393331234567
  encode: (handle: string) => (/^\+\d+$/.test(handle) ? handle : encodeURIComponent(handle)),
};

export const telegramTemplate: QRTemplate<TelegramData> = {
  type: 'telegram',
  category: 'contact',
  icon: Send,
  defaultData: () => ({ ...defaultTelegramData }),
  validate: (data): FieldErrors<TelegramData> => {
    if (!data.username.trim()) return { username: 'required' };
    return buildSocialUrl(telegramUrl, data.username) ? {} : { username: 'invalidHandle' };
  },
  buildPayload: (data) => {
    const url = buildSocialUrl(telegramUrl, data.username);
    if (!url) return '';
    return data.message ? `${url}?text=${encodeURIComponent(data.message)}` : url;
  },
  Form: TelegramForm,
};

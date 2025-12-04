export type Language = 'en' | 'it' | 'ro';

export interface Translations {
  // Header
  header: {
    title: string;
    switchToLight: string;
    switchToDark: string;
  };

  // QR Data Input
  qrDataInput: {
    title: string;
    templateType: string;
    selectTemplate: string;
    // Categories
    categories: {
      all: string;
      links: string;
      contact: string;
      social: string;
      payment: string;
    };
    // Template labels
    templates: {
      url: string;
      vcard: string;
      wifi: string;
      email: string;
      sms: string;
      calendar: string;
      location: string;
      phone: string;
      whatsapp: string;
      telegram: string;
      instagram: string;
      twitter: string;
      linkedin: string;
      tiktok: string;
      youtube: string;
      facebook: string;
      snapchat: string;
      paypal: string;
      bitcoin: string;
    };
    // Form labels
    form: {
      url: string;
      urlPlaceholder: string;
      firstName: string;
      lastName: string;
      organization: string;
      jobTitle: string;
      phone: string;
      email: string;
      website: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      networkName: string;
      networkNamePlaceholder: string;
      password: string;
      encryption: string;
      hiddenNetwork: string;
      emailAddress: string;
      emailPlaceholder: string;
      subject: string;
      message: string;
      prefilledMessage: string;
      phoneNumber: string;
      phonePlaceholder: string;
      eventTitle: string;
      eventTitlePlaceholder: string;
      eventLocation: string;
      description: string;
      allDayEvent: string;
      startDate: string;
      endDate: string;
      startDateTime: string;
      endDateTime: string;
      latitude: string;
      latitudePlaceholder: string;
      longitude: string;
      longitudePlaceholder: string;
      label: string;
      labelPlaceholder: string;
      username: string;
      usernamePlaceholder: string;
      profileId: string;
      profileIdPlaceholder: string;
      channelHandle: string;
      channelHandlePlaceholder: string;
      pageProfileName: string;
      pageProfilePlaceholder: string;
      paypalUsername: string;
      paypalUsernamePlaceholder: string;
      amount: string;
      amountPlaceholder: string;
      currency: string;
      bitcoinAddress: string;
      bitcoinAddressPlaceholder: string;
      amountBtc: string;
    };
  };

  // QR Options
  qrOptions: {
    title: string;
    collapseAll: string;
    expandAll: string;
    undo: string;
    redo: string;
    resetToDefaults: string;
    // Sections
    sections: {
      errorCorrection: string;
      style: string;
      colors: string;
      background: string;
      centerLogo: string;
    };
    // Error Correction
    errorCorrection: {
      level: string;
      levels: {
        L: string;
        M: string;
        Q: string;
        H: string;
      };
    };
    // Style
    style: {
      dotStyle: string;
      cornerSquareStyle: string;
      cornerDotStyle: string;
    };
    // Colors
    colors: {
      quickPresets: string;
      useGradient: string;
      gradientType: string;
      rotation: string;
      startColor: string;
      endColor: string;
      dotColor: string;
      cornerSquare: string;
      cornerDot: string;
    };
    // Background
    background: {
      transparent: string;
      backgroundColor: string;
    };
    // Logo
    logo: {
      dropZone: string;
      dropZoneActive: string;
      removeLogo: string;
      size: string;
      margin: string;
    };
  };

  // QR Preview
  qrPreview: {
    title: string;
    contentRequired: string;
    copyToClipboard: string;
    copied: string;
    downloadAs: string;
    errors: {
      contentTooLong: string;
      failedToGenerate: string;
      failedToDownload: string;
      failedToInitialize: string;
    };
  };

  // Footer
  footer: {
    builtBy: string;
    repository: string;
  };

  // Common
  common: {
    required: string;
    optional: string;
  };
}

export const LANGUAGE_STORAGE_KEY = 'qr-generator-language';

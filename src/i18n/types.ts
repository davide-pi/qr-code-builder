export type Language = 'en' | 'it' | 'ro';

export interface Translations {
  // Header
  header: {
    title: string;
    switchToLight: string;
    switchToDark: string;
    logoAlt: string;
    language: string;
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
      epc: string;
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
      encryptionNone: string;
      beneficiaryName: string;
      iban: string;
      ibanPlaceholder: string;
      bic: string;
      bicPlaceholder: string;
      amountEur: string;
      remittanceText: string;
    };
    // Inline validation messages
    errors: {
      required: string;
      nameOrOrganizationRequired: string;
      invalidUrl: string;
      invalidEmail: string;
      invalidPhone: string;
      invalidLatitude: string;
      invalidLongitude: string;
      invalidAmount: string;
      invalidHandle: string;
      invalidBitcoinAddress: string;
      endBeforeStart: string;
      invalidIban: string;
      invalidBic: string;
      amountOutOfRange: string;
      tooLong: string;
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
      presets: string;
    };
    // Error Correction
    errorCorrection: {
      level: string;
      labels: {
        L: string;
        M: string;
        Q: string;
        H: string;
      };
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
      applyPreset: string;
      presetNames: {
        classic: string;
        ocean: string;
        forest: string;
        sunset: string;
        purple: string;
        monochrome: string;
      };
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
      preview: string;
      ecRaised: string;
      errors: {
        invalidType: string;
        tooLarge: string;
        readFailed: string;
      };
    };
    // Saved presets
    presets: {
      nameLabel: string;
      namePlaceholder: string;
      save: string;
      hint: string;
      empty: string;
      list: string;
      apply: string;
      delete: string;
      export: string;
      import: string;
      limitReached: string;
      saved: string;
      deleted: string;
      exported: string;
      imported: string;
      importError: string;
      importReadError: string;
      storageError: string;
    };
  };

  // QR Preview
  qrPreview: {
    title: string;
    contentRequired: string;
    copyToClipboard: string;
    copied: string;
    downloadAs: string;
    previewLabel: string;
    exportSize: string;
    pdfSize: string;
    pdfFitA4: string;
    preparing: string;
    errors: {
      contentTooLong: string;
      failedToGenerate: string;
      failedToDownload: string;
      failedToInitialize: string;
      failedToCopy: string;
    };
    scannability: {
      title: string;
      lowContrast: string;
      inverted: string;
      logoNeedsHighEc: string;
    };
  };

  // Batch generation from CSV
  batch: {
    open: string;
    title: string;
    close: string;
    intro: string;
    privacy: string;
    step1: string;
    step2: string;
    step3: string;
    downloadTemplate: string;
    columnsHint: string;
    booleanHint: string;
    uploadLabel: string;
    fileLoaded: string;
    ignoredColumns: string;
    previewTitle: string;
    summary: string;
    columnRow: string;
    columnFile: string;
    columnContent: string;
    columnStatus: string;
    statusOk: string;
    statusSkipped: string;
    format: string;
    size: string;
    stylingNote: string;
    generate: string;
    cancel: string;
    progress: string;
    done: string;
    doneWithFailures: string;
    cancelled: string;
    errors: {
      fileTooLarge: string;
      readFailed: string;
      noRows: string;
      noKnownColumns: string;
      tooManyRows: string;
      unterminatedQuote: string;
      noValidRows: string;
      generateFailed: string;
    };
    // Problems found by the batch itself (the template's own ones use qrDataInput.errors)
    issues: {
      invalidBoolean: string;
      invalidChoice: string;
      invalidDate: string;
      contentTooLong: string;
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
    selectCountry: string;
  };

  // PWA update toast
  pwa: {
    updateAvailable: string;
    updateHint: string;
    reload: string;
    later: string;
    offlineReady: string;
    dismiss: string;
  };
}

export const LANGUAGE_STORAGE_KEY = 'qr-generator-language';

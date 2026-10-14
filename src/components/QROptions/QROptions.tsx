import { useRef, useState, useCallback } from 'react';
import type { GradientType } from 'qr-code-styling';
import type { QROptions as QROptionsType, GradientConfig, ColorPreset } from '../../types/qr';
import { dotTypes, cornerSquareTypes, cornerDotTypes, gradientTypes, errorCorrectionLevels, defaultColorPresets } from '../../types/qr';
import StylePicker, { DotStylePreview, CornerSquarePreview, CornerDotPreview } from '../StylePicker/StylePicker';
import UserPresets from './UserPresets';
import { Undo2, Redo2, RotateCcw, ChevronDown, Upload, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useLanguage } from '../../i18n';
import './QROptions.css';

// Logo upload limits
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type LogoError = 'invalidType' | 'tooLarge' | 'readFailed';

interface QROptionsProps {
  options: QROptionsType;
  onUpdateOption: <K extends keyof QROptionsType>(key: K, value: QROptionsType[K]) => void;
  onUpdateGradient: (updates: Partial<GradientConfig>) => void;
  onUpdateGradientColor: (index: number, color: string) => void;
  onApplyPreset: (preset: ColorPreset) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onResetToDefault: () => void;
}

// Collapsible Section Component
function Section({
  title,
  children,
  isOpen,
  onToggle
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="options-section">
      <button
        className="section-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="section-title">{title}</span>
        <ChevronDown
          className={`section-chevron ${isOpen ? 'open' : ''}`}
          size={16}
        />
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

export default function QROptions({
  options,
  onUpdateOption,
  onUpdateGradient,
  onUpdateGradientColor,
  onApplyPreset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onResetToDefault,
}: QROptionsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [allSectionsOpen, setAllSectionsOpen] = useState(false);
  const [sectionsState, setSectionsState] = useState({
    errorCorrection: false,
    style: true,
    colors: false,
    background: false,
    logo: false,
    presets: false,
  });
  const [logoError, setLogoError] = useState<LogoError | null>(null);
  const [ecRaisedByLogo, setEcRaisedByLogo] = useState(false);
  const errorCorrectionLevel = options.errorCorrectionLevel;

  // Validate and read the logo file
  const processImageFile = useCallback((file: File) => {
    setLogoError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError('invalidType');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('tooLarge');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateOption('image', event.target?.result as string);
      // A logo covers part of the code: low error correction levels are not enough
      if (errorCorrectionLevel === 'L' || errorCorrectionLevel === 'M') {
        onUpdateOption('errorCorrectionLevel', 'H');
        setEcRaisedByLogo(true);
      }
    };
    reader.onerror = () => setLogoError('readFailed');
    reader.readAsDataURL(file);
  }, [onUpdateOption, errorCorrectionLevel]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Allow selecting the same file again
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processImageFile(file);
    }
  }, [processImageFile]);

  // Clear uploaded image
  const clearImage = () => {
    onUpdateOption('image', '');
    setLogoError(null);
    setEcRaisedByLogo(false);
  };

  // Toggle all sections
  const toggleAllSections = () => {
    const newState = !allSectionsOpen;
    setAllSectionsOpen(newState);
    setSectionsState({
      errorCorrection: newState,
      style: newState,
      colors: newState,
      background: newState,
      logo: newState,
      presets: newState,
    });
  };

  const toggleSection = (section: keyof typeof sectionsState) => {
    setSectionsState(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="qr-options-section" role="form" aria-label={t.qrOptions.title}>
      <div className="options-header">
        <h2>{t.qrOptions.title}</h2>
        <div className="header-actions">
          <button
            onClick={toggleAllSections}
            className="btn-icon"
            title={allSectionsOpen ? t.qrOptions.collapseAll : t.qrOptions.expandAll}
            aria-label={allSectionsOpen ? t.qrOptions.collapseAll : t.qrOptions.expandAll}
          >
            {allSectionsOpen ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-icon"
            title={`${t.qrOptions.undo} (Ctrl+Z)`}
            aria-label={t.qrOptions.undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn-icon"
            title={`${t.qrOptions.redo} (Ctrl+Y)`}
            aria-label={t.qrOptions.redo}
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={onResetToDefault}
            className="btn-icon"
            title={t.qrOptions.resetToDefaults}
            aria-label={t.qrOptions.resetToDefaults}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Error Correction Section */}
      <Section title={t.qrOptions.sections.errorCorrection} isOpen={sectionsState.errorCorrection} onToggle={() => toggleSection('errorCorrection')}>
        <div className="option-group">
          <label id="error-correction-label">{t.qrOptions.errorCorrection.level}</label>
          <div
            className="error-correction-options"
            role="listbox"
            aria-labelledby="error-correction-label"
          >
            {errorCorrectionLevels.map((level, index) => (
              <button
                key={level}
                className={`ec-btn ${options.errorCorrectionLevel === level ? 'active' : ''}`}
                onClick={() => onUpdateOption('errorCorrectionLevel', level)}
                onKeyDown={(e) => {
                  let newIndex: number | null = null;
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    newIndex = (index + 1) % errorCorrectionLevels.length;
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    newIndex = (index - 1 + errorCorrectionLevels.length) % errorCorrectionLevels.length;
                  }
                  if (newIndex !== null) {
                    onUpdateOption('errorCorrectionLevel', errorCorrectionLevels[newIndex]);
                    const buttons = e.currentTarget.parentElement?.querySelectorAll('.ec-btn');
                    (buttons?.[newIndex] as HTMLElement)?.focus();
                  }
                }}
                title={t.qrOptions.errorCorrection.levels[level]}
                role="option"
                aria-label={t.qrOptions.errorCorrection.labels[level]}
                aria-selected={options.errorCorrectionLevel === level}
                tabIndex={options.errorCorrectionLevel === level ? 0 : -1}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Style Section */}
      <Section title={t.qrOptions.sections.style} isOpen={sectionsState.style} onToggle={() => toggleSection('style')}>
        <div className="option-group">
          <label id="dot-style-label">{t.qrOptions.style.dotStyle}</label>
          <StylePicker
            options={dotTypes}
            value={options.dotType}
            onChange={(type) => onUpdateOption('dotType', type)}
            PreviewComponent={DotStylePreview}
            label={t.qrOptions.style.dotStyle}
          />
        </div>

        <div className="option-group">
          <label id="corner-square-label">{t.qrOptions.style.cornerSquareStyle}</label>
          <StylePicker
            options={cornerSquareTypes}
            value={options.cornerSquareType}
            onChange={(type) => onUpdateOption('cornerSquareType', type)}
            PreviewComponent={CornerSquarePreview}
            label={t.qrOptions.style.cornerSquareStyle}
          />
        </div>

        <div className="option-group">
          <label id="corner-dot-label">{t.qrOptions.style.cornerDotStyle}</label>
          <StylePicker
            options={cornerDotTypes}
            value={options.cornerDotType}
            onChange={(type) => onUpdateOption('cornerDotType', type)}
            PreviewComponent={CornerDotPreview}
            label={t.qrOptions.style.cornerDotStyle}
          />
        </div>
      </Section>

      {/* Colors Section */}
      <Section title={t.qrOptions.sections.colors} isOpen={sectionsState.colors} onToggle={() => toggleSection('colors')}>
        <div className="option-group">
          <label id="color-presets-label">{t.qrOptions.colors.quickPresets}</label>
          <div
            className="color-presets"
            role="group"
            aria-labelledby="color-presets-label"
          >
            {defaultColorPresets.map((preset) => {
              const name = t.qrOptions.colors.presetNames[preset.id];
              const isActive =
                !options.dotGradient.enabled &&
                !options.transparentBackground &&
                options.dotColor === preset.dotColor &&
                options.cornerSquareColor === preset.cornerSquareColor &&
                options.cornerDotColor === preset.cornerDotColor &&
                options.backgroundColor === preset.backgroundColor;
              return (
                <button
                  key={preset.id}
                  className="preset-btn"
                  onClick={() => onApplyPreset(preset)}
                  title={name}
                  aria-label={t.qrOptions.colors.applyPreset.replace('{name}', name)}
                  aria-pressed={isActive}
                  style={{
                    background: `linear-gradient(135deg, ${preset.dotColor} 0%, ${preset.cornerSquareColor} 100%)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.dotGradient.enabled}
              onChange={(e) => onUpdateGradient({ enabled: e.target.checked })}
            />
            {t.qrOptions.colors.useGradient}
          </label>
        </div>

        {options.dotGradient.enabled ? (
          <div className="gradient-options">
            <div className="option-group">
              <label htmlFor="gradientType">{t.qrOptions.colors.gradientType}</label>
              <select
                id="gradientType"
                value={options.dotGradient.type}
                onChange={(e) => onUpdateGradient({ type: e.target.value as GradientType })}
              >
                {gradientTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label htmlFor="gradientRotation">{t.qrOptions.colors.rotation}: {options.dotGradient.rotation}°</label>
              <input
                type="range"
                id="gradientRotation"
                min="0"
                max="360"
                value={options.dotGradient.rotation}
                onChange={(e) => onUpdateGradient({ rotation: Number(e.target.value) })}
              />
            </div>

            <div className="color-row">
              <div className="option-group">
                <label htmlFor="gradientColor1">{t.qrOptions.colors.startColor}</label>
                <input
                  type="color"
                  id="gradientColor1"
                  value={options.dotGradient.colorStops[0].color}
                  onChange={(e) => onUpdateGradientColor(0, e.target.value)}
                />
              </div>
              <div className="option-group">
                <label htmlFor="gradientColor2">{t.qrOptions.colors.endColor}</label>
                <input
                  type="color"
                  id="gradientColor2"
                  value={options.dotGradient.colorStops[1].color}
                  onChange={(e) => onUpdateGradientColor(1, e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="option-group">
            <label htmlFor="dotColor">{t.qrOptions.colors.dotColor}</label>
            <input
              type="color"
              id="dotColor"
              value={options.dotColor}
              onChange={(e) => onUpdateOption('dotColor', e.target.value)}
            />
          </div>
        )}

        <div className="color-row">
          <div className="option-group">
            <label htmlFor="cornerSquareColor">{t.qrOptions.colors.cornerSquare}</label>
            <input
              type="color"
              id="cornerSquareColor"
              value={options.cornerSquareColor}
              onChange={(e) => onUpdateOption('cornerSquareColor', e.target.value)}
            />
          </div>
          <div className="option-group">
            <label htmlFor="cornerDotColor">{t.qrOptions.colors.cornerDot}</label>
            <input
              type="color"
              id="cornerDotColor"
              value={options.cornerDotColor}
              onChange={(e) => onUpdateOption('cornerDotColor', e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Background Section */}
      <Section title={t.qrOptions.sections.background} isOpen={sectionsState.background} onToggle={() => toggleSection('background')}>
        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.transparentBackground}
              onChange={(e) => onUpdateOption('transparentBackground', e.target.checked)}
            />
            {t.qrOptions.background.transparent}
          </label>
        </div>

        {!options.transparentBackground && (
          <div className="option-group">
            <label htmlFor="backgroundColor">{t.qrOptions.background.backgroundColor}</label>
            <input
              type="color"
              id="backgroundColor"
              value={options.backgroundColor}
              onChange={(e) => onUpdateOption('backgroundColor', e.target.value)}
            />
          </div>
        )}
      </Section>

      {/* Logo Section */}
      <Section title={t.qrOptions.sections.centerLogo} isOpen={sectionsState.logo} onToggle={() => toggleSection('logo')}>
        <div className="option-group">
          <div
            className={`image-drop-zone ${isDragging ? 'dragging' : ''} ${options.image ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {options.image ? (
              <div className="image-preview-container">
                <img src={options.image} alt={t.qrOptions.logo.preview} className="image-preview" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="btn btn-small btn-danger"
                  aria-label={t.qrOptions.logo.removeLogo}
                  title={t.qrOptions.logo.removeLogo}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="image-drop-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} aria-hidden="true" />
                <span>{isDragging ? t.qrOptions.logo.dropZoneActive : t.qrOptions.logo.dropZone}</span>
              </button>
            )}
            <input
              type="file"
              id="imageUpload"
              ref={fileInputRef}
              accept={ALLOWED_LOGO_TYPES.join(',')}
              onChange={handleImageUpload}
              hidden
            />
          </div>
          {logoError && (
            <p className="option-status error" role="alert">{t.qrOptions.logo.errors[logoError]}</p>
          )}
          {options.image && ecRaisedByLogo && errorCorrectionLevel === 'H' && (
            <p className="option-hint" role="status">{t.qrOptions.logo.ecRaised}</p>
          )}
        </div>

        {options.image && (
          <>
            <div className="option-group">
              <label htmlFor="imageSize">
                {t.qrOptions.logo.size}: {Math.round(options.imageSize * 100)}%
              </label>
              <input
                type="range"
                id="imageSize"
                min="0.1"
                max="0.3"
                step="0.01"
                value={options.imageSize}
                onChange={(e) => onUpdateOption('imageSize', Number(e.target.value))}
              />
            </div>

            <div className="option-group">
              <label htmlFor="imageMargin">{t.qrOptions.logo.margin}: {options.imageMargin}px</label>
              <input
                type="range"
                id="imageMargin"
                min="0"
                max="5"
                value={options.imageMargin}
                onChange={(e) => onUpdateOption('imageMargin', Number(e.target.value))}
              />
            </div>
          </>
        )}
      </Section>

      {/* Saved Presets Section */}
      <Section title={t.qrOptions.sections.presets} isOpen={sectionsState.presets} onToggle={() => toggleSection('presets')}>
        <UserPresets options={options} onUpdateOption={onUpdateOption} />
      </Section>
    </div>
  );
}

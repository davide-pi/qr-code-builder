import { useRef, useState, useCallback } from 'react';
import type { GradientType } from 'qr-code-styling';
import type { QROptions as QROptionsType, GradientConfig, ColorPreset } from '../../types/qr';
import { dotTypes, cornerSquareTypes, cornerDotTypes, gradientTypes, errorCorrectionLevels, defaultColorPresets } from '../../types/qr';
import StylePicker, { DotStylePreview, CornerSquarePreview, CornerDotPreview } from '../StylePicker/StylePicker';
import { Undo2, Redo2, RotateCcw, ChevronDown, Upload, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import './QROptions.css';

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
  defaultOpen = true,
  isOpen,
  onToggle
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const open = isOpen !== undefined ? isOpen : internalIsOpen;
  const toggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  return (
    <div className="options-section">
      <button
        className="section-header"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="section-title">{title}</span>
        <ChevronDown
          className={`section-chevron ${open ? 'open' : ''}`}
          size={16}
        />
      </button>
      {open && <div className="section-content">{children}</div>}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [allSectionsOpen, setAllSectionsOpen] = useState(false);
  const [sectionsState, setSectionsState] = useState({
    errorCorrection: false,
    style: true,
    colors: false,
    background: false,
    logo: false,
  });

  // Process image file
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateOption('image', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onUpdateOption]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    });
  };

  const toggleSection = (section: keyof typeof sectionsState) => {
    setSectionsState(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="qr-options-section" role="form" aria-label="QR Code Customization Options">
      <div className="options-header">
        <h2>Customize</h2>
        <div className="header-actions">
          <button
            onClick={toggleAllSections}
            className="btn-icon"
            title={allSectionsOpen ? "Collapse all sections" : "Expand all sections"}
            aria-label={allSectionsOpen ? "Collapse all sections" : "Expand all sections"}
          >
            {allSectionsOpen ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-icon"
            title="Undo (Ctrl+Z)"
            aria-label="Undo last change"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="btn-icon"
            title="Redo (Ctrl+Y)"
            aria-label="Redo last change"
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={onResetToDefault}
            className="btn-icon"
            title="Reset to defaults"
            aria-label="Reset all settings to default"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Error Correction Section */}
      <Section title="Error Correction" isOpen={sectionsState.errorCorrection} onToggle={() => toggleSection('errorCorrection')}>
        <div className="option-group">
          <label id="error-correction-label">Level</label>
          <div
            className="error-correction-options"
            role="listbox"
            aria-labelledby="error-correction-label"
          >
            {errorCorrectionLevels.map((level, index) => (
              <button
                key={level.value}
                className={`ec-btn ${options.errorCorrectionLevel === level.value ? 'active' : ''}`}
                onClick={() => onUpdateOption('errorCorrectionLevel', level.value)}
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
                    onUpdateOption('errorCorrectionLevel', errorCorrectionLevels[newIndex].value);
                    const buttons = e.currentTarget.parentElement?.querySelectorAll('.ec-btn');
                    (buttons?.[newIndex] as HTMLElement)?.focus();
                  }
                }}
                title={level.description}
                role="option"
                aria-selected={options.errorCorrectionLevel === level.value}
                tabIndex={options.errorCorrectionLevel === level.value ? 0 : -1}
              >
                {level.value}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Style Section */}
      <Section title="Style" isOpen={sectionsState.style} onToggle={() => toggleSection('style')}>
        <div className="option-group">
          <label id="dot-style-label">Dot Style</label>
          <StylePicker
            options={dotTypes}
            value={options.dotType}
            onChange={(type) => onUpdateOption('dotType', type)}
            PreviewComponent={DotStylePreview}
            label="Dot style options"
          />
        </div>

        <div className="option-group">
          <label id="corner-square-label">Corner Square Style</label>
          <StylePicker
            options={cornerSquareTypes}
            value={options.cornerSquareType}
            onChange={(type) => onUpdateOption('cornerSquareType', type)}
            PreviewComponent={CornerSquarePreview}
            label="Corner square style options"
          />
        </div>

        <div className="option-group">
          <label id="corner-dot-label">Corner Dot Style</label>
          <StylePicker
            options={cornerDotTypes}
            value={options.cornerDotType}
            onChange={(type) => onUpdateOption('cornerDotType', type)}
            PreviewComponent={CornerDotPreview}
            label="Corner dot style options"
          />
        </div>
      </Section>

      {/* Colors Section */}
      <Section title="Colors" isOpen={sectionsState.colors} onToggle={() => toggleSection('colors')}>
        <div className="option-group">
          <label id="color-presets-label">Quick Presets</label>
          <div
            className="color-presets"
            role="listbox"
            aria-labelledby="color-presets-label"
          >
            {defaultColorPresets.map((preset, index) => (
              <button
                key={preset.name}
                className="preset-btn"
                onClick={() => onApplyPreset(preset)}
                onKeyDown={(e) => {
                  let newIndex: number | null = null;
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    newIndex = (index + 1) % defaultColorPresets.length;
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    newIndex = (index - 1 + defaultColorPresets.length) % defaultColorPresets.length;
                  }
                  if (newIndex !== null) {
                    const buttons = e.currentTarget.parentElement?.querySelectorAll('.preset-btn');
                    (buttons?.[newIndex] as HTMLElement)?.focus();
                  }
                }}
                title={preset.name}
                role="option"
                aria-label={`Apply ${preset.name} color preset`}
                style={{
                  background: `linear-gradient(135deg, ${preset.dotColor} 0%, ${preset.cornerSquareColor} 100%)`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.dotGradient.enabled}
              onChange={(e) => onUpdateGradient({ enabled: e.target.checked })}
            />
            Use Gradient for Dots
          </label>
        </div>

        {options.dotGradient.enabled ? (
          <div className="gradient-options">
            <div className="option-group">
              <label htmlFor="gradientType">Gradient Type</label>
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
              <label htmlFor="gradientRotation">Rotation: {options.dotGradient.rotation}°</label>
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
                <label htmlFor="gradientColor1">Start</label>
                <input
                  type="color"
                  id="gradientColor1"
                  value={options.dotGradient.colorStops[0].color}
                  onChange={(e) => onUpdateGradientColor(0, e.target.value)}
                />
              </div>
              <div className="option-group">
                <label htmlFor="gradientColor2">End</label>
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
            <label htmlFor="dotColor">Dot Color</label>
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
            <label htmlFor="cornerSquareColor">Corner Square</label>
            <input
              type="color"
              id="cornerSquareColor"
              value={options.cornerSquareColor}
              onChange={(e) => onUpdateOption('cornerSquareColor', e.target.value)}
            />
          </div>
          <div className="option-group">
            <label htmlFor="cornerDotColor">Corner Dot</label>
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
      <Section title="Background" isOpen={sectionsState.background} onToggle={() => toggleSection('background')}>
        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.transparentBackground}
              onChange={(e) => onUpdateOption('transparentBackground', e.target.checked)}
            />
            Transparent Background
          </label>
        </div>

        {!options.transparentBackground && (
          <div className="option-group">
            <label htmlFor="backgroundColor">Background Color</label>
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
      <Section title="Center Logo" isOpen={sectionsState.logo} onToggle={() => toggleSection('logo')}>
        <div className="option-group">
          <div
            className={`image-drop-zone ${isDragging ? 'dragging' : ''} ${options.image ? 'has-image' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={options.image ? 'Logo uploaded. Press Enter to change' : 'Drop zone for logo image. Press Enter to browse'}
          >
            {options.image ? (
              <div className="image-preview-container">
                <img src={options.image} alt="Logo preview" className="image-preview" />
                <button onClick={clearImage} className="btn btn-small btn-danger" aria-label="Remove logo">
                  ✕
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} />
                <span>Drag & drop or click to upload</span>
                <input
                  type="file"
                  id="imageUpload"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  aria-label="Upload logo image"
                />
              </>
            )}
          </div>
        </div>

        {options.image && (
          <>
            <div className="option-group">
              <label htmlFor="imageSize">
                Size: {Math.round(options.imageSize * 100)}%
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
              <label htmlFor="imageMargin">Margin: {options.imageMargin}px</label>
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
    </div>
  );
}

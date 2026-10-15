import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useState } from 'react';
import { createDefaultFormData, evaluateTemplate } from '../../templates';
import type {
  ColorPreset, GradientConfig, QROptions, QRTemplateData, QRTemplateType, TemplateFormData,
} from '../../types/qr';
import { defaultQROptions, STORAGE_KEY } from '../../types/qr';
import QRDataInput from '../QRDataInput/QRDataInput';
import QROptionsPanel from '../QROptions/QROptions';
import QRPreview from '../QRPreview/QRPreview';
import {
  canRedo, canUndo, createHistory, historyReducer, type HistoryState,
} from './history';
import { MARGIN_RATIO, parseSavedOptions } from './savedOptions';
import './QRCodeGenerator.css';

// Debounce shared by the QR preview and the history: typing renders the QR and adds an
// undo step only once the user pauses
const DEBOUNCE_MS = 500;
// Debounce of the localStorage write of the styling
const PERSIST_DEBOUNCE_MS = 300;

// Everything undo/redo restores. `forms` lives in memory only: it holds personal data
// (Wi-Fi passwords, locations, contacts…) and is never persisted.
interface EditorState {
  options: QROptions;
  forms: TemplateFormData;
}

// Persist only the styling: the encoded data may hold sensitive values (WiFi password,
// geo coordinates), the template form is not persisted, so it always restarts empty, and
// the logo (a data URL) can exceed the localStorage quota
const toPersistableOptions = (options: QROptions): Omit<QROptions, 'data' | 'image'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, image, ...styling } = options;
  return styling;
};

// Load saved options from localStorage (validated: see parseSavedOptions)
const loadSavedOptions = (): QROptions => {
  try {
    return parseSavedOptions(localStorage.getItem(STORAGE_KEY));
  } catch {
    console.warn('Failed to load saved QR settings');
    return defaultQROptions;
  }
};

const createEditorHistory = (): HistoryState<EditorState> =>
  createHistory({ options: loadSavedOptions(), forms: createDefaultFormData() });

// Ctrl+Z / Ctrl+Y inside a text control belong to the browser's own undo of that control
const isEditableTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export default function QRCodeGenerator() {
  const [history, dispatch] = useReducer(historyReducer<EditorState>, undefined, createEditorHistory);
  const editor = history.current;
  const { options, forms } = editor;
  const { templateType } = options;

  // Validate the selected form and build the text to encode. Invalid data encodes nothing
  // (the preview then shows its empty state) while the form shows the errors.
  const formData = forms[templateType];
  const { errors, payload } = useMemo(() => evaluateTemplate(templateType, formData), [templateType, formData]);

  const [debouncedData, setDebouncedData] = useState(payload);

  // Debounce payload changes for QR generation
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedData(payload), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [payload]);

  // Commit the pending edits to the history once the user pauses
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'commit' }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [editor]);

  // Save the styling to localStorage once it stops changing (typing does not touch `options`;
  // a dragged color or range input fires many events)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistableOptions(options)));
      } catch {
        console.warn('Failed to save QR settings');
      }
    }, PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [options]);

  const undoable = canUndo(history);
  const redoable = canRedo(history);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const key = e.key.toLowerCase();
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        redo();
      // Undo: Ctrl+Z (without Shift)
      } else if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const setOptions = useCallback((update: (prev: QROptions) => QROptions) => {
    dispatch({
      type: 'edit',
      update: (state) => {
        const next = update(state.options);
        return next === state.options ? state : { ...state, options: next };
      },
    });
  }, []);

  // Update template type
  const updateTemplateType = (type: QRTemplateType) => {
    setOptions((prev) => (prev.templateType === type ? prev : { ...prev, templateType: type }));
  };

  // Update the form data of a template
  const updateFormData = (type: QRTemplateType, data: QRTemplateData) => {
    dispatch({ type: 'edit', update: (state) => ({ ...state, forms: { ...state.forms, [type]: data } }) });
  };

  // Update a single option
  const updateOption = <K extends keyof QROptions>(key: K, value: QROptions[K]) => {
    setOptions((prev) => {
      // Same value: keep the previous state, so it is not a new undo step
      if (Object.is(prev[key], value)) return prev;
      const newOptions = { ...prev, [key]: value };

      // If size changes, ensure margin doesn't exceed 15% of new size
      if (key === 'size') {
        const maxMargin = Math.floor((value as number) * MARGIN_RATIO);
        if (newOptions.margin > maxMargin) {
          newOptions.margin = maxMargin;
        }
      }

      return newOptions;
    });
  };

  // Update gradient options
  const updateGradient = (updates: Partial<GradientConfig>) => {
    setOptions((prev) => {
      // If enabling gradient, use current dot color as end color
      if (updates.enabled === true && !prev.dotGradient.enabled) {
        return {
          ...prev,
          dotGradient: {
            ...prev.dotGradient,
            ...updates,
            colorStops: [
              prev.dotGradient.colorStops[0], // Keep start color
              { ...prev.dotGradient.colorStops[1], color: prev.dotColor }, // Use dot color as end
            ],
          },
        };
      }
      // If disabling gradient, use end color as new dot color
      if (updates.enabled === false && prev.dotGradient.enabled) {
        return {
          ...prev,
          dotColor: prev.dotGradient.colorStops[1].color, // End color becomes dot color
          dotGradient: { ...prev.dotGradient, ...updates },
        };
      }
      return {
        ...prev,
        dotGradient: { ...prev.dotGradient, ...updates },
      };
    });
  };

  const updateGradientColor = (index: number, color: string) => {
    setOptions((prev) => ({
      ...prev,
      dotGradient: {
        ...prev.dotGradient,
        colorStops: prev.dotGradient.colorStops.map((stop, i) =>
          i === index ? { ...stop, color } : stop
        ),
      },
    }));
  };

  const applyPreset = (preset: ColorPreset) => {
    setOptions((prev) => ({
      ...prev,
      dotColor: preset.dotColor,
      cornerSquareColor: preset.cornerSquareColor,
      cornerDotColor: preset.cornerDotColor,
      backgroundColor: preset.backgroundColor,
      transparentBackground: false,
      dotGradient: { ...prev.dotGradient, enabled: false },
    }));
  };

  // Restores the styling and clears every template form (a no-op, with no undo step, when
  // everything already is at its default: see the `reset` case of the history reducer)
  const resetToDefault = useCallback(() => {
    dispatch({ type: 'reset', state: { options: defaultQROptions, forms: createDefaultFormData() } });
    setDebouncedData(defaultQROptions.data); // Also reset debounced data immediately
  }, []);

  // Options for the QR preview: the debounced payload plus the options themselves, so a field
  // added to QROptions can never be silently left out. `options` keeps its identity while the
  // user types (typing only changes the forms), so the memo still holds then.
  const previewOptions = useMemo(() => ({ ...options, data: debouncedData }), [options, debouncedData]);
  // Color and range inputs fire an event per step: the preview renders them at low priority and
  // skips the intermediate values instead of calling QRCodeStyling.update() for each one
  const deferredPreviewOptions = useDeferredValue(previewOptions);

  return (
    <div className="qr-generator">
      <QRDataInput
        templateType={templateType}
        data={formData}
        errors={errors}
        onTemplateChange={updateTemplateType}
        onDataChange={(data) => updateFormData(templateType, data)}
      />
      <QRPreview options={deferredPreviewOptions} />
      <QROptionsPanel
        options={options}
        onUpdateOption={updateOption}
        onUpdateGradient={updateGradient}
        onUpdateGradientColor={updateGradientColor}
        onApplyPreset={applyPreset}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoable}
        canRedo={redoable}
        onResetToDefault={resetToDefault}
      />
    </div>
  );
}

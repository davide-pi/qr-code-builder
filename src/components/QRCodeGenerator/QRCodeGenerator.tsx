import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { QROptions, GradientConfig, ColorPreset } from '../../types/qr';
import { defaultQROptions, STORAGE_KEY } from '../../types/qr';
import QRPreview from '../QRPreview/QRPreview';
import QROptionsPanel from '../QROptions/QROptions';
import './QRCodeGenerator.css';

const MAX_HISTORY = 50;

// Load saved options from localStorage
const loadSavedOptions = (): QROptions => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new fields are included
      return { ...defaultQROptions, ...parsed };
    }
  } catch {
    console.warn('Failed to load saved QR settings');
  }
  return defaultQROptions;
};

export default function QRCodeGenerator() {
  const [options, setOptions] = useState<QROptions>(loadSavedOptions);
  const [debouncedData, setDebouncedData] = useState(options.data);
  const [history, setHistory] = useState<QROptions[]>([loadSavedOptions()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce data changes for QR generation
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update debounced data after 1 second
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedData(options.data);
    }, 500);

    // Cleanup on unmount or when data changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [options.data]);

  // Save options to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      console.warn('Failed to save QR settings');
    }

    // Add to history if not from undo/redo
    if (!isUndoRedoRef.current) {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(options);
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }
    isUndoRedoRef.current = false;
  }, [options]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev - 1);
      setOptions(history[historyIndex - 1]);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      isUndoRedoRef.current = true;
      setHistoryIndex(prev => prev + 1);
      setOptions(history[historyIndex + 1]);
    }
  }, [canRedo, history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Update a single option
  const updateOption = <K extends keyof QROptions>(key: K, value: QROptions[K]) => {
    setOptions((prev) => {
      const newOptions = { ...prev, [key]: value };

      // If size changes, ensure margin doesn't exceed 15% of new size
      if (key === 'size') {
        const maxMargin = Math.floor((value as number) * 0.15);
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

  const resetToDefault = useCallback(() => {
    setOptions(defaultQROptions);
    setDebouncedData(defaultQROptions.data); // Also reset debounced data immediately
  }, []);

  // Create options with debounced data for QR preview
  const previewOptions = useMemo(() => ({
    ...options,
    data: debouncedData,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [debouncedData, options.size, options.margin, options.errorCorrectionLevel,
       options.dotType, options.dotColor, options.dotGradient.enabled,
       options.dotGradient.type, options.dotGradient.rotation, options.dotGradient.colorStops,
       options.cornerSquareType, options.cornerSquareColor,
       options.cornerDotType, options.cornerDotColor,
       options.backgroundColor, options.transparentBackground,
       options.image, options.imageSize, options.imageMargin]);

  return (
    <div className="qr-generator">
      <QRPreview options={previewOptions} />
      <QROptionsPanel
        options={options}
        onUpdateOption={updateOption}
        onUpdateGradient={updateGradient}
        onUpdateGradientColor={updateGradientColor}
        onApplyPreset={applyPreset}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onResetToDefault={resetToDefault}
      />
    </div>
  );
}

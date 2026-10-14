import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../../i18n';
import { getTemplate, templateTypes } from '../../templates';
import type { QRTemplateType, TemplateCategory } from '../../types/qr';

interface TemplateDropdownProps {
  value: QRTemplateType;
  onChange: (type: QRTemplateType) => void;
}

// Categories for dropdown grouping
const displayCategories: Exclude<TemplateCategory, 'all'>[] = ['links', 'contact', 'social', 'payment'];

const groups = displayCategories
  .map((category) => ({
    category,
    types: templateTypes.filter((type) => getTemplate(type).category === category),
  }))
  .filter((group) => group.types.length > 0);

// Options in the order they are shown (group by group)
const orderedTypes = groups.flatMap((group) => group.types);

// Select-only combobox (WAI-ARIA APG): focus stays on the trigger and the highlighted option
// is exposed through aria-activedescendant
export default function TemplateDropdown({ value, onChange }: TemplateDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const valueId = `${baseId}-value`;
  const listId = `${baseId}-list`;
  const optionId = (type: QRTemplateType) => `${baseId}-option-${type}`;

  const CurrentIcon = getTemplate(value).icon;
  const selectedIndex = orderedTypes.indexOf(value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep the highlighted option visible in the scrolling menu
  useEffect(() => {
    if (!isOpen) return;
    document.getElementById(optionId(orderedTypes[activeIndex]))?.scrollIntoView?.({ block: 'nearest' });
    // optionId only depends on baseId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, baseId]);

  const openMenu = () => {
    setActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const closeMenu = () => setIsOpen(false);

  const select = (type: QRTemplateType) => {
    onChange(type);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = orderedTypes.length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!isOpen) return openMenu();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((index) => Math.min(last, Math.max(0, index + step)));
        return;
      }
      case 'Home':
      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(event.key === 'Home' ? 0 : last);
        return;
      case 'Enter':
      case ' ':
        // Handled here (and not through the click) so that the key never toggles twice
        event.preventDefault();
        if (isOpen) select(orderedTypes[activeIndex]);
        else openMenu();
        return;
      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        closeMenu();
        return;
      case 'Tab':
        closeMenu();
        return;
    }
  };

  return (
    <div className="template-dropdown-container" ref={containerRef}>
      <label id={labelId}>{t.qrDataInput.templateType}</label>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className={`template-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        // Firefox fires the click of a button on the Space keyup
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault();
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen ? optionId(orderedTypes[activeIndex]) : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
      >
        <span className="template-dropdown-selected">
          <CurrentIcon size={18} aria-hidden="true" />
          <span id={valueId}>{t.qrDataInput.templates[value]}</span>
        </span>
        <ChevronDown size={18} className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={listId}
          className="template-dropdown-menu"
          role="listbox"
          aria-labelledby={labelId}
          // Keep the focus on the trigger while clicking or scrolling the menu
          onMouseDown={(event) => event.preventDefault()}
        >
          {groups.map(({ category, types }) => (
            <div
              key={category}
              className="template-dropdown-group"
              role="group"
              aria-labelledby={`${baseId}-group-${category}`}
            >
              <div id={`${baseId}-group-${category}`} className="template-dropdown-group-label">
                {t.qrDataInput.categories[category]}
              </div>
              {types.map((type) => {
                const Icon = getTemplate(type).icon;
                return (
                  <div
                    key={type}
                    id={optionId(type)}
                    role="option"
                    aria-selected={type === value}
                    className={[
                      'template-dropdown-item',
                      type === value ? 'selected' : '',
                      type === orderedTypes[activeIndex] ? 'active' : '',
                    ].join(' ').trim()}
                    onClick={() => select(type)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{t.qrDataInput.templates[type]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

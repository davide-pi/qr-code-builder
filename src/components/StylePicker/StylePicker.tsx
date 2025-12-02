import type { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';

// SVG preview components for style buttons - designed to match actual QR code rendering

export const DotStylePreview = ({ type, color = "currentColor" }: { type: DotType; color?: string }) => {
  const size = 24;
  const dotSize = 5;
  const gap = 2;
  const startOffset = 2;

  // Render a 3x3 grid of dots matching the actual style
  const renderDot = (x: number, y: number, key: string) => {
    switch (type) {
      case 'dots':
        return <circle key={key} cx={x + dotSize/2} cy={y + dotSize/2} r={dotSize/2} fill={color} />;
      case 'rounded':
        return <rect key={key} x={x} y={y} width={dotSize} height={dotSize} rx={1.2} fill={color} />;
      case 'extra-rounded':
        return <rect key={key} x={x} y={y} width={dotSize} height={dotSize} rx={2.2} fill={color} />;
      case 'classy':
        // Only top-left corner rounded
        return (
          <path
            key={key}
            d={`M${x} ${y + 1.5} Q${x} ${y} ${x + 1.5} ${y} L${x + dotSize} ${y} L${x + dotSize} ${y + dotSize} L${x} ${y + dotSize} Z`}
            fill={color}
          />
        );
      case 'classy-rounded':
        // Top-left rounded more, slight rounding on others
        return (
          <path
            key={key}
            d={`M${x} ${y + 2} Q${x} ${y} ${x + 2} ${y} L${x + dotSize} ${y} L${x + dotSize} ${y + dotSize} L${x} ${y + dotSize} Z`}
            fill={color}
          />
        );
      default: // square
        return <rect key={key} x={x} y={y} width={dotSize} height={dotSize} fill={color} />;
    }
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => {
          const x = startOffset + col * (dotSize + gap);
          const y = startOffset + row * (dotSize + gap);
          return renderDot(x, y, `${row}-${col}`);
        })
      )}
    </svg>
  );
};

export const CornerSquarePreview = ({ type, color = "currentColor" }: { type: CornerSquareType; color?: string }) => {
  const size = 24;
  const outerSize = 18;
  const strokeWidth = 3;
  const innerSize = 6;
  const offset = (size - outerSize) / 2;
  const innerOffset = (size - innerSize) / 2;

  switch (type) {
    case 'dot':
      // Circular outer ring with circular inner dot
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={(outerSize - strokeWidth) / 2} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={innerSize/2} fill={color} />
        </svg>
      );
    case 'dots':
      // Made of small dots - outer ring of dots with center dot
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer ring made of small circles */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const r = 7;
            const cx = size/2 + Math.cos(rad) * r;
            const cy = size/2 + Math.sin(rad) * r;
            return <circle key={angle} cx={cx} cy={cy} r={2} fill={color} />;
          })}
          <circle cx={size/2} cy={size/2} r={2.5} fill={color} />
        </svg>
      );
    case 'extra-rounded':
      // Very rounded square (almost circular)
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={outerSize} height={outerSize} rx={7} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} rx={2.5} fill={color} />
        </svg>
      );
    case 'rounded':
      // Slightly rounded square
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={outerSize} height={outerSize} rx={3} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} rx={1} fill={color} />
        </svg>
      );
    case 'classy':
      // Square with only top-left corner rounded
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M${offset + strokeWidth/2} ${offset + 5}
                Q${offset + strokeWidth/2} ${offset + strokeWidth/2} ${offset + 5} ${offset + strokeWidth/2}
                L${offset + outerSize - strokeWidth/2} ${offset + strokeWidth/2}
                L${offset + outerSize - strokeWidth/2} ${offset + outerSize - strokeWidth/2}
                L${offset + strokeWidth/2} ${offset + outerSize - strokeWidth/2} Z`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} fill={color} />
        </svg>
      );
    case 'classy-rounded':
      // Classy with more rounding
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M${offset + strokeWidth/2} ${offset + 7}
                Q${offset + strokeWidth/2} ${offset + strokeWidth/2} ${offset + 7} ${offset + strokeWidth/2}
                L${offset + outerSize - strokeWidth/2} ${offset + strokeWidth/2}
                L${offset + outerSize - strokeWidth/2} ${offset + outerSize - strokeWidth/2}
                L${offset + strokeWidth/2} ${offset + outerSize - strokeWidth/2} Z`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} rx={1.5} fill={color} />
        </svg>
      );
    default: // square
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={outerSize} height={outerSize} fill="none" stroke={color} strokeWidth={strokeWidth} />
          <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} fill={color} />
        </svg>
      );
  }
};

export const CornerDotPreview = ({ type, color = "currentColor" }: { type: CornerDotType; color?: string }) => {
  const size = 24;
  const dotSize = 10;
  const offset = (size - dotSize) / 2;

  switch (type) {
    case 'dot':
      // Circular dot
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={dotSize/2} fill={color} />
        </svg>
      );
    case 'dots':
      // Made of small dots in a pattern
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2 - 2.5} cy={size/2 - 2.5} r={2.2} fill={color} />
          <circle cx={size/2 + 2.5} cy={size/2 - 2.5} r={2.2} fill={color} />
          <circle cx={size/2 - 2.5} cy={size/2 + 2.5} r={2.2} fill={color} />
          <circle cx={size/2 + 2.5} cy={size/2 + 2.5} r={2.2} fill={color} />
        </svg>
      );
    case 'rounded':
      // Square with slight rounding
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={dotSize} height={dotSize} rx={2} fill={color} />
        </svg>
      );
    case 'extra-rounded':
      // Very rounded (almost circular)
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={dotSize} height={dotSize} rx={4} fill={color} />
        </svg>
      );
    case 'classy':
      // Square with only top-left corner rounded
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M${offset} ${offset + 3} Q${offset} ${offset} ${offset + 3} ${offset} L${offset + dotSize} ${offset} L${offset + dotSize} ${offset + dotSize} L${offset} ${offset + dotSize} Z`}
            fill={color}
          />
        </svg>
      );
    case 'classy-rounded':
      // Classy with more rounding on the corner
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M${offset} ${offset + 4.5} Q${offset} ${offset} ${offset + 4.5} ${offset} L${offset + dotSize} ${offset} L${offset + dotSize} ${offset + dotSize} L${offset} ${offset + dotSize} Z`}
            fill={color}
          />
        </svg>
      );
    default: // square
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={offset} y={offset} width={dotSize} height={dotSize} fill={color} />
        </svg>
      );
  }
};

interface StylePickerProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  PreviewComponent: React.ComponentType<{ type: T; color?: string }>;
  label?: string;
}

export default function StylePicker<T extends string>({
  options,
  value,
  onChange,
  PreviewComponent,
  label,
}: StylePickerProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + options.length) % options.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = options.length - 1;
        break;
    }

    if (newIndex !== null) {
      onChange(options[newIndex]);
      // Focus the new button
      const container = e.currentTarget.parentElement;
      const buttons = container?.querySelectorAll('.style-btn');
      (buttons?.[newIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div
      className="style-picker"
      role="listbox"
      aria-label={label || 'Style options'}
      aria-activedescendant={`style-${value}`}
    >
      {options.map((type, index) => (
        <button
          key={type}
          id={`style-${type}`}
          className={`style-btn ${value === type ? 'active' : ''}`}
          onClick={() => onChange(type)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          title={type}
          role="option"
          aria-selected={value === type}
          tabIndex={value === type ? 0 : -1}
        >
          <PreviewComponent type={type} />
        </button>
      ))}
    </div>
  );
}

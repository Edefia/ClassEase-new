import React, { useState, useRef } from 'react';

/**
 * Usage:
 * <Tooltip content="Tooltip text"> <button>Hover me</button> </Tooltip>
 */
const Tooltip = ({ content, children, side = 'top' }) => {
  const [visible, setVisible] = useState(false);
  const timeout = useRef();

  // Positioning logic (top/bottom/left/right)
  const getPosition = () => {
    switch (side) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => { timeout.current = setTimeout(() => setVisible(true), 100); }}
      onMouseLeave={() => { clearTimeout(timeout.current); setVisible(false); }}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute z-50 px-2 py-1 rounded bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap ${getPosition()}`}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip; 
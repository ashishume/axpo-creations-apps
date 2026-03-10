import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ text, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
            positionClasses[side]
          )}
          role="tooltip"
        >
          {text}
          <span
            className={cn(
              'absolute h-0 w-0 border-4 border-transparent',
              side === 'top' && 'left-1/2 top-full -translate-x-1/2 border-t-slate-800',
              side === 'bottom' && 'left-1/2 bottom-full -translate-x-1/2 border-b-slate-800',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 border-l-slate-800',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 border-r-slate-800'
            )}
          />
        </div>
      )}
    </div>
  );
}

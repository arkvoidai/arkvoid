import React, { useState, useRef, useEffect, ReactNode } from "react";

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items?: DropdownItem[];
  align?: "left" | "right";
  customPanel?: ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = "right", customPanel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={`absolute mt-2 min-w-[160px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[8px] shadow-[var(--shadow-lg)] z-50 animate-dropdown-open
            ${align === "right" ? "right-0" : "left-0"}
            ${!customPanel ? "p-1.5" : ""}
          `}
        >
          {customPanel ? (
             customPanel
          ) : (
            items?.map((item, i) => {
              if (item.separator) {
                return <div key={i} className="h-px bg-[var(--border-subtle)] my-1" />;
              }

              return (
                <button
                  key={i}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center h-[28px] px-2 text-[12px] font-medium rounded-[5px] transition-colors
                    ${item.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[var(--bg-hover)] cursor-pointer"}
                    ${item.danger ? "text-[var(--status-danger)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-dim)]" : "text-[var(--text-primary)]"}
                  `}
                >
                  {item.icon && <span className="mr-2 text-[var(--text-secondary)]">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes dropdown-open {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dropdown-open { animation: dropdown-open 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

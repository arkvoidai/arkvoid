import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  if (!open) return null;

  // Static items for now relative to the dashboard paths defined
  const allItems = [
    { category: "NAVIGATION", label: "Go to Overview", path: "/dashboard/overview" },
    { category: "NAVIGATION", label: "Go to Agents", path: "/dashboard/agents" },
    { category: "NAVIGATION", label: "Go to Traces", path: "/dashboard/traces" },
    { category: "NAVIGATION", label: "Go to Audit Log", path: "/dashboard/audit" },
    { category: "NAVIGATION", label: "Go to Compliance", path: "/dashboard/compliance" },
    { category: "ACTIONS", label: "Create new Agent", action: () => console.log("Create agent") },
    { category: "ACTIONS", label: "Manage API Keys", path: "/dashboard/api-keys" },
  ];

  const filteredItems = query === "" 
    ? allItems 
    : allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (index: number) => {
    const item = filteredItems[index];
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
    onOpenChange(false);
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        handleSelect(activeIndex);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" onClick={() => onOpenChange(false)} />
      
      <div 
        className="relative w-[580px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col"
        onKeyDown={handleListKeyDown}
      >
        <div className="flex items-center px-4 border-b border-[var(--border-default)]">
          <Search className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-[18px] text-[var(--text-primary)] px-3 py-4 placeholder:text-[var(--text-tertiary)]"
            placeholder="Search commands, navigate, or ask..."
            value={query}
            onChange={(e) => {
               setQuery(e.target.value);
               setActiveIndex(0);
            }}
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[var(--text-tertiary)]">
              No results found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const active = idx === activeIndex;
              const showCategory = idx === 0 || filteredItems[idx - 1].category !== item.category;

              return (
                <React.Fragment key={idx}>
                  {showCategory && (
                    <div className="px-4 py-1.5 text-[11px] font-medium text-[var(--text-tertiary)] tracking-[0.06em] mt-2 mb-1 first:mt-0">
                      {item.category}
                    </div>
                  )}
                  <div
                    className={`relative flex items-center px-4 h-[36px] cursor-pointer group select-none ${active ? "bg-[var(--bg-hover)]" : ""}`}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--accent-amber)]" />}
                    <div className={`text-[14px] ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                      {item.label}
                    </div>
                    {item.path && <ChevronRight className={`ml-auto w-4 h-4 ${active ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`} />}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

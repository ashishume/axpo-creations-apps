import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Custom text to search against (defaults to label) */
  searchText?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOption?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  name?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyOption = "— Select —",
  className = "",
  disabled,
  error,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => {
      const searchTarget = o.searchText ?? o.label;
      return searchTarget.toLowerCase().includes(q);
    });
  }, [options, searchQuery]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlighted) {
        highlighted.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex === 0) {
          onChange("");
        } else if (filteredOptions[highlightedIndex - 1]) {
          onChange(filteredOptions[highlightedIndex - 1].value);
        }
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      
      <div
        className={`input cursor-pointer flex items-center gap-2 ${error ? "border-red-500" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isOpen ? (
          <>
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none"
              style={{ color: "var(--text-primary)" }}
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </>
        ) : (
          <>
            <span 
              className="flex-1 truncate"
              style={{ color: selectedOption ? "var(--text-primary)" : "var(--text-secondary)" }}
            >
              {selectedOption?.label ?? emptyOption}
            </span>
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
              </button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
          </>
        )}
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 shadow-lg"
          style={{ 
            background: "var(--bg-card)", 
            borderColor: "var(--border)" 
          }}
          role="listbox"
        >
          <li
            className={`px-3 py-2 cursor-pointer text-sm ${highlightedIndex === 0 ? "bg-indigo-50" : "hover:bg-slate-50"}`}
            style={{ color: highlightedIndex === 0 ? "var(--link)" : "var(--text-secondary)" }}
            onClick={() => handleSelect("")}
            role="option"
            aria-selected={!value}
          >
            {emptyOption}
          </li>
          
          {filteredOptions.length === 0 ? (
            <li 
              className="px-3 py-2 text-sm italic"
              style={{ color: "var(--text-secondary)" }}
            >
              No results found
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  highlightedIndex === index + 1
                    ? "bg-indigo-50"
                    : value === option.value
                      ? "bg-indigo-100"
                      : "hover:bg-slate-50"
                }`}
                style={{ 
                  color: highlightedIndex === index + 1 || value === option.value 
                    ? "var(--link)" 
                    : "var(--text-primary)" 
                }}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";
import { Search, X, ChevronDown } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
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
  emptyOption = "— None —",
  className,
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

  const baseClasses =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-colors dark:bg-slate-800";
  const borderClasses = "border-slate-300 dark:border-slate-600";
  const errorClasses = "border-red-500 dark:border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      
      <div
        className={cn(
          baseClasses,
          error ? errorClasses : borderClasses,
          disabled && "bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed",
          "cursor-pointer flex items-center gap-2"
        )}
        onClick={() => !disabled && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isOpen ? (
          <>
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </>
        ) : (
          <>
            <span className={cn("flex-1 truncate", !selectedOption && "text-slate-500 dark:text-slate-400")}>
              {selectedOption?.label ?? emptyOption}
            </span>
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          </>
        )}
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg"
          role="listbox"
        >
          <li
            className={cn(
              "px-3 py-2 cursor-pointer text-sm",
              highlightedIndex === 0 
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
            onClick={() => handleSelect("")}
            role="option"
            aria-selected={!value}
          >
            {emptyOption}
          </li>
          
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 italic">
              No results found
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm",
                  highlightedIndex === index + 1
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100"
                    : value === option.value
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100"
                      : "text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
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

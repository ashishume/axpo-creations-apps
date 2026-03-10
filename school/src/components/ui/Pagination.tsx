import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showItemCount = true,
  className = '',
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && canGoPrev) {
      e.preventDefault();
      onPageChange(currentPage - 1);
    } else if (e.key === 'ArrowRight' && canGoNext) {
      e.preventDefault();
      onPageChange(currentPage + 1);
    } else if (e.key === 'Home' && canGoPrev) {
      e.preventDefault();
      onPageChange(1);
    } else if (e.key === 'End' && canGoNext) {
      e.preventDefault();
      onPageChange(totalPages);
    }
  };

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  return (
    <div 
      className={`flex flex-wrap items-center justify-between gap-4 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Item count and page size selector */}
      <div className="flex items-center gap-4">
        {showItemCount && (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-slate-100">{startItem}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{endItem}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{totalItems}</span> results
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to first page when changing page size
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrev}
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrev}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {generatePageNumbers(currentPage, totalPages).map((page, index) => (
              page === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-slate-400 dark:text-slate-500"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Go to next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Generate page numbers with ellipsis
function generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  const maxVisible = 7; // Maximum number of page buttons to show

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

// Wrapper hook for pagination state
export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    reset: () => {
      setPage(1);
      setPageSizeState(initialPageSize);
    },
  };
}


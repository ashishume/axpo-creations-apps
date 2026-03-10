"""Configurable pagination limits for list endpoints."""

# Default page size when no filters applied (students, staff)
DEFAULT_PAGE_SIZE_STUDENTS = 10
DEFAULT_PAGE_SIZE_STAFF = 10

# Default page size for expense/stock/leave lists (initial load)
DEFAULT_PAGE_SIZE_EXPENSES = 50
DEFAULT_PAGE_SIZE_STOCKS = 50
DEFAULT_PAGE_SIZE_LEAVES = 50

# When filters are applied (e.g. class-wise paid, not paid), load this many items
FILTERED_PAGE_SIZE = 50

# Maximum allowed page size for any list
MAX_PAGE_SIZE = 100

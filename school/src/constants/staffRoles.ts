/**
 * Single source of truth for staff roles. Use this everywhere staff role is needed:
 * - Staff form (add/edit) dropdown
 * - Staff list role filter (chips/dropdown)
 * - Bulk import
 * - Assistant / inline forms
 */

export const STAFF_ROLES = [
  "PRT",
  "TGT",
  "Mother Teacher",
  "Martial Arts",
  "Ground Staff",
  "Accountant",
  "Teacher",
  "Principal",
  "Admin",
  "Vice Principal",
  "Head of Department",
  "Teacher In Charge",
  "Administrative",
  "Support Staff",
  "Security",
  "Cleaner",
  // "Peon",
  // "Gardener",
  // "Cook",
  // "Driver",
  // "Helper",
  // "Other",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Options for filter chips / dropdown: All Roles + each role */
export const STAFF_ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  ...STAFF_ROLES.map((role) => ({ value: role, label: role })),
];

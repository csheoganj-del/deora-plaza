/**
 * Z-Index Management System
 * Prevents modal and overlay conflicts
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  modal: 1030,
  popover: 1040,
  tooltip: 1050,
  toast: 1060,
  overlay: 999,
  modalOverlay: 1029,
  sheet: 1035,
  dialog: 1040,
  notification: 1070
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

export function getZIndex(key: ZIndexKey): number {
  return Z_INDEX[key];
}

export function getZIndexClass(key: ZIndexKey): string {
  return `z-[${Z_INDEX[key]}]`;
}
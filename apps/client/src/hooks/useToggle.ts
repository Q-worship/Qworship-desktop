import { useState, useCallback } from 'react';

/**
 * A highly reusable hook for managing boolean states (modals, toggles, menus).
 * Eliminates the need to write the same 3 functions over and over.
 */
export function useToggle(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, toggle, open, close, setIsOpen };
}

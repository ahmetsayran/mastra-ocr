import Cookies from 'js-cookie';
import { useRef, useState } from 'react';

const SIDEBAR_WIDTH_COOKIE_NAME = 'sidebar_width';
const SIDEBAR_WIDTH_COOKIE_EXPIRES = 7;
const SIDEBAR_MIN_WIDTH = 192;
const SIDEBAR_MAX_WIDTH = 512;
const SIDEBAR_DRAG_THRESHOLD = 3;

export type SidebarResizeHandlers = {
  onResizeStart: (event: React.PointerEvent<HTMLElement>) => void;
  consumeResizeDrag: () => boolean;
};

/**
 * Hook to resize the sidebar by dragging its rail
 *
 * Usage:
 * - sidebarWidth goes to SidebarProvider's style as --sidebar-width
 * - The width is saved in a cookie, like the sidebar open state
 * - consumeResizeDrag tells the rail click handler that a drag just ended
 */
export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(() => Cookies.get(SIDEBAR_WIDTH_COOKIE_NAME));
  const [isResizing, setIsResizing] = useState(false);
  const draggedRef = useRef(false);

  const onResizeStart = (event: React.PointerEvent<HTMLElement>) => {
    const sidebar = event.currentTarget.closest('[data-state]');
    const container = event.currentTarget.closest('[data-slot="sidebar-container"]');
    if (sidebar?.getAttribute('data-state') !== 'expanded' || !container) return;

    const startX = event.clientX;
    const startWidth = container.getBoundingClientRect().width;
    let width = startWidth;
    draggedRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      if (!draggedRef.current && Math.abs(delta) < SIDEBAR_DRAG_THRESHOLD) return;
      if (!draggedRef.current) {
        draggedRef.current = true;
        setIsResizing(true);
      }
      width = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta));
      setSidebarWidth(`${width}px`);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (!draggedRef.current) return;
      setIsResizing(false);
      Cookies.set(SIDEBAR_WIDTH_COOKIE_NAME, `${Math.round(width)}px`, {
        expires: SIDEBAR_WIDTH_COOKIE_EXPIRES,
        path: '/',
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // A drag ends with a click on the rail; only a plain click should toggle the sidebar
  const consumeResizeDrag = () => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  };

  return { sidebarWidth, isResizing, onResizeStart, consumeResizeDrag };
}

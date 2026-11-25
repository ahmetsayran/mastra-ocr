import { useSidebar } from '#/components/ui/sidebar';
import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'chatbot-sidebar-width';
const MIN_WIDTH = 192;
const MAX_WIDTH = 512;
const DRAG_THRESHOLD = 3;

// Resizes the sidebar by overriding SidebarProvider's --sidebar-width on its wrapper
export function useSidebarResize() {
  const { state, toggleSidebar } = useSidebar();
  const railRef = useRef<HTMLButtonElement>(null);
  const draggedRef = useRef(false);

  const getWrapper = () =>
    railRef.current?.closest<HTMLElement>('[data-slot="sidebar-wrapper"]') ?? null;

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (saved) getWrapper()?.style.setProperty('--sidebar-width', `${saved}px`);
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const wrapper = getWrapper();
    if (state !== 'expanded' || !wrapper) return;

    const startX = event.clientX;
    const sidebar = wrapper.querySelector<HTMLElement>('[data-slot="sidebar-container"]');
    const startWidth = sidebar?.getBoundingClientRect().width ?? MIN_WIDTH;
    // Width transitions would make the sidebar lag behind the pointer
    const animated = wrapper.querySelectorAll<HTMLElement>(
      '[data-slot="sidebar-gap"], [data-slot="sidebar-container"], main',
    );
    let width = startWidth;
    draggedRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      if (!draggedRef.current && Math.abs(delta) < DRAG_THRESHOLD) return;
      if (!draggedRef.current) {
        draggedRef.current = true;
        for (const element of animated) element.style.transition = 'none';
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
      }
      width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      wrapper.style.setProperty('--sidebar-width', `${width}px`);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (!draggedRef.current) return;
      for (const element of animated) element.style.transition = '';
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      try {
        localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
      } catch {
        // Width is still applied for this page view
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // A drag ends with a click on the rail; only a plain click toggles the sidebar
  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    toggleSidebar();
  };

  return { railRef, onPointerDown, onClick };
}

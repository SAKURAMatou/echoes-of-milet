// src/composables/useSwipe.ts
import { ref } from "vue";

export function useSwipe() {
  const startX = ref(0);
  const startY = ref(0);
  const dx = ref(0);
  const dragging = ref(false);

  function onPointerDown(e: PointerEvent) {
    dragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
    dx.value = 0;
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return;
    dx.value = e.clientX - startX.value;
  }
  function onPointerUp() {
    dragging.value = false;
  }

  return { dx, dragging, onPointerDown, onPointerMove, onPointerUp };
}

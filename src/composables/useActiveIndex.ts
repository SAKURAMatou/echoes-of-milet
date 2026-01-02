// // src/composables/useActiveIndex.ts
// import { onBeforeUnmount, onMounted, ref } from "vue";

// export function useActiveIndex() {
//   const activeIndex = ref(0);
//   const els: HTMLElement[] = [];
//   let io: IntersectionObserver | null = null;

//   function register(el: HTMLElement | null, index: number) {
//     if (!el) return;
//     els[index] = el;
//     io?.observe(el);
//   }

//   onMounted(() => {
//     io = new IntersectionObserver(
//       (entries) => {
//         // 取“最靠上且在视口内”的那张作为 active
//         const visibles = entries
//           .filter((e) => e.isIntersecting)
//           .map((e) => ({ top: e.boundingClientRect.top, el: e.target as HTMLElement }));
//         visibles.sort((a, b) => a.top - b.top);

//         const topEl = visibles[0]?.el;
//         if (!topEl) return;
//         const idx = els.indexOf(topEl);
//         if (idx >= 0) activeIndex.value = idx;
//       },
//       { root: null, threshold: 0.6 } // 视口内 60% 认为“当前”
//     );
//     els.forEach((el) => el && io!.observe(el));
//   });

//   onBeforeUnmount(() => io?.disconnect());

//   return { activeIndex, register };
// }

// composables/useActiveIndex.ts
import { ref, type Ref } from 'vue'

export function useActiveIndex(opts?: { threshold?: number }) {
  const activeIndex = ref(0)
  const threshold = opts?.threshold ?? 0.55

  let io: IntersectionObserver | null = null

  function observe(elsRef: Ref<HTMLElement[]>) {
    if (io) io.disconnect()

    io = new IntersectionObserver(
      (entries) => {
        // 找到 intersectionRatio 最大的那个作为 active
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            idx: Number((e.target as HTMLElement).dataset['idx']),
            ratio: e.intersectionRatio,
          }))
          .sort((a, b) => b.ratio - a.ratio)

        if (visible.length > 0) activeIndex.value = visible[0].idx
      },
      { threshold: [threshold] },
    )

    elsRef.value.forEach((el, idx) => {
      if (!el) return
      el.dataset['idx'] = String(idx)
      io!.observe(el)
    })
  }

  return { activeIndex, observe }
}

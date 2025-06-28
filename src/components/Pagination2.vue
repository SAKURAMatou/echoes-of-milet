<template>
  <ul class="flex justify-center gap-3">
    <li>
      <a
        href="#"
        class="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-[#187bcd] rtl:rotate-180"
        aria-label="Previous page"
        @click.prevent="handlePageChange(currentPage - 1)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
    </li>

    <li class="text-sm/8 font-medium tracking-widest">{{ currentPage }}/{{ totalPages }}</li>

    <li>
      <a
        href="#"
        class="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-[#187bcd] rtl:rotate-180"
        aria-label="Next page"
        @click.prevent="handlePageChange(currentPage + 1)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
    </li>
  </ul>
</template>

<script setup>
import { defineProps, computed } from 'vue'
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalCount: {
    type: Number,
    default: 10,
  },
  pageSize: {
    type: Number,
    default: 6,
  },
  totalPages: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['pageChange'])

//计算总页数
const totalPages = computed(() => {
  let total = 1
  if (props.totalPages) {
    total = props.totalPages
  } else if (props.totalCount && props.pageSize) {
    total = Math.ceil(props.totalCount / props.pageSize)
  }
  return total
})

//分页事件
const handlePageChange = (page) => {
  console.log('handlePageChange', page)

  if (page < 1 || page > totalPages.value) return
  emit('pageChange', page)
  //   props.currentPage = page
}
</script>

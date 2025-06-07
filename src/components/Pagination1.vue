<template>
  <ul class="flex justify-center gap-1">
    <li>
      <a
        href="#"
        class="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-blue-400 rtl:rotate-180"
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

    <li v-for="pageIndex in totalPages" :key="pageIndex">
      <a
        href="#"
        :class="[
          'block size-8 rounded border  text-center text-sm/8 font-medium transition-colors ',
          currentPage === pageIndex
            ? ' border-[#187bcd] bg-[#187bcd] text-white'
            : 'text-current border-gray-200 hover:bg-blue-400',
        ]"
        @click.prevent="handlePageChange(pageIndex)"
      >
        {{ pageIndex }}
      </a>
    </li>

    <!-- <li
      class="block size-8 rounded border border-[#187bcd] bg-[#187bcd] text-center text-sm/8 font-medium text-white"
    >
      2
    </li>

    <li>
      <a
        href="#"
        class="block size-8 rounded border border-gray-200 text-center text-sm/8 font-medium transition-colors hover:bg-blue-400"
      >
        3
      </a>
    </li>

    <li>
      <a
        href="#"
        class="block size-8 rounded border border-gray-200 text-center text-sm/8 font-medium transition-colors hover:bg-blue-400"
      >
        4
      </a>
    </li> -->

    <li>
      <a
        href="#"
        class="grid size-8 place-content-center rounded border border-gray-200 transition-colors hover:bg-blue-400 rtl:rotate-180"
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
import { defineProps, defineEmits, computed } from 'vue'

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
})

// Emits an event when the page changes
const emit = defineEmits(['pageChange'])
//计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.totalCount / props.pageSize)
})

//分页事件
const handlePageChange = (page) => {
  console.log('handlePageChange', page)

  if (page < 1 || page > totalPages.value) return
  emit('pageChange', page)
  //   props.currentPage = page
}
</script>

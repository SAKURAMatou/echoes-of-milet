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
        @click.prevent="handlePageChange(pageIndex, $event)"
      >
        {{ pageIndex }}
      </a>
    </li>

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
    default: null,
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

// Emits an event when the page changes
const emit = defineEmits(['pageChange'])
//计算总页数
const totalPages = computed(() => {
  if (props.totalCount && props.pageSize) {
    return Math.ceil(props.totalCount / props.pageSize)
  } else if (props.totalPages) {
    const plist = []
    if (props.totalPages > 11) {
      const mid = Math.ceil(props.totalPages / 2)
      plist.push(1)
      plist.push('...')
      for (let i = mid - 2; i <= mid + 2; i++) {
        if (i > 1 && i < props.totalPages) {
          plist.push(i)
        }
      }
      plist.push('...')
      plist.push(props.totalPages)
    } else {
      for (let i = 1; i <= props.totalPages; i++) {
        plist.push(i)
      }
    }
    return plist
  } else {
    return 0
  }
})

//分页事件
const handlePageChange = (page, event) => {
  if (page < 1 || page > totalPages.value) return

  // Get the previous sibling element

  if (page === '...') {
    const previousElement = event.target.closest('li').previousElementSibling?.querySelector('a')
    let pretext = previousElement?.textContent
    pretext = parseInt(pretext?.trim())
    if (!isNaN(pretext)) {
      if (pretext === 1) {
        page = props.currentPage - 1
      } else {
        page = props.currentPage + 1
      }
    } else {
      return
    }
  }
  console.log('handlePageChange', page)
  emit('pageChange', page)
}
</script>

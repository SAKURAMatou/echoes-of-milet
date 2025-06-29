<template>
  <footer class="min-h-[60px] px-5 mt-2 bg-[#2C75D1] text-white py-4 bottom-10">
    <div class="grid grid-cols-3 justify-center items-start gap-x-5 mx-auto md:max-w-[50%] w-full">
      <div class="text-center col-span-2 justify-self-center">
        <p>© {{ nowYear }} dml`site. All rights reserved</p>
      </div>
      <div class="justify-items-start relative">
        <div class="group flex relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#ffffff"
          >
            <path
              d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"
            />
          </svg>
          <span class="ml-2 max-md:hidden">contact</span>
          <div
            class="pointer-events-none absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 bg-[#1E90FF] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            dml4pers4015@gmail.com
            <div class="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#1E90FF]"></div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const nowYear = ref(new Date().getFullYear())
</script>

<template>
    <div class="relative">
        <button v-show="isShow" :style="{ opacity: opacityValue }" @click="scrollToTop" class="  bg-blue-500 text-white rounded-lg shadow-lg 
        opacity-0 transition-opacity duration-300 z-50 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" height="48px" width="48px" viewBox="0 -960 960 960" fill="#FFFFFF">
                <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
            </svg>
        </button>

    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isShow = ref(false);
const opacityValue = ref(0);
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

const handleScroll = () => {
    const scrollY = window.scrollY
    const maxscroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = Math.min(scrollY / (maxscroll * 0.5), 1);
    isShow.value = scrollY > 100; // 显示按钮的阈值
    opacityValue.value = ratio; // 根据滚动比例设置透明度
}
onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>
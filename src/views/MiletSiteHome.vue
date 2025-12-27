<template>
  <Header :showHanbor="false" />
  <div
    class="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#F0F9FF] font-montserrat text-[#2c3e50] relative overflow-x-hidden"
  >
    <!-- HERO SECTION -->
    <section class="h-screen flex items-center justify-center pt-24 relative">
      <!-- Content -->

      <div class="md:w-[90%] max-w-[1200px] flex flex-col">
        <div class="relative w-full h-[50vh] md:hidden">
          <!-- 图片：注意 object-position 调整重点 -->
          <img
            src="/background/bg-milet-home.jpg"
            class="w-full h-full object-cover object-[80%_20%]"
            alt="milet"
          />

          <!-- 关键：底部的渐变遮罩，让图片融入背景 -->
          <div
            class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"
          ></div>
        </div>

        <div class="md:pr-12 animate-fadein md:w-full max-md:px-8 max-md:-mt-38 max-md:z-10">
          <h1 class="font-serif text-[5rem] leading-tight text-[#1a2c50] mb-5 md:text-5xl">
            Inside <br />
            <span class="text-[#488ec7] italic">the Blue.</span>
          </h1>

          <p class="text-[1.1rem] leading-8 text-[#586776] mb-10 pl-5 border-l-4 border-[#a9cce3]">
            “I want to be someone who can snuggle up to your ordinary days.” <br />
            沉浸在 milet 深邃而空灵的歌声里，<br />
            记录关于她的每一个感动间。<br />
            milet の深くて空霊的な歌声に浸りながら、<br />
            彼女に心を動かされた瞬間のすべてを記していく。
          </p>

          <router-link
            :to="{ name: 'milet' }"
            class="inline-block px-10 py-4 rounded-full bg-[#1a2c50]/90 text-white text-sm tracking-widest shadow-xl transition-all hover:bg-[#488ec7] hover:-translate-y-1 hover:shadow-2xl"
          >
            LISTEN NOW
          </router-link>
        </div>
      </div>

      <img
        class="absolute max-md:hidden top-0 right-0 w-[55%] h-full object-cover object-right [mask-image:linear-gradient(to_right,transparent_0%,black_20%)]"
        src="/background/bg-milet-home.jpg"
      />
    </section>
  </div>
</template>
<script setup lang="ts">
import Header from '@/components/TWHeader.vue'
</script>
<!-- Tailwind 动画 -->
<style>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadein {
  animation: fadein 1.5s ease-out;
}
</style>

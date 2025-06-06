<template>
  <!-- header -->
  <header
    class="bg-[#3A7CA5] text-white py-4 mx-auto fixed top-0 left-0 right-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <div class="md:max-w-[50%] w-full flex justify-between items-center mx-auto">
      <div>
        <a href="/" class="flex gap-1 items-center">
          <div class="h-6 flex items-center justify-center">
            <img src="@/assets/logo.png" alt="Logo" class="object-cover w-16 h-16" />
          </div>
          <h1 class="text-3xl font-bold">dl's notes</h1>
        </a>
      </div>
      <nav>
        <ul class="flex gap-6">
          <li>
            <a
              href="/"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#2F6385] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >Home</a
            >
          </li>
          <li>
            <a
              href="/about"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#2F6385] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >blog</a
            >
          </li>
          <li>
            <a
              href="/milet"
              class="h-8 rounded-full px-3 text-current flex items-center justify-center cursor-pointer font-medium hover:bg-[#2F6385] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              >milet</a
            >
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

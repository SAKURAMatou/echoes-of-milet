<template>
  <h1>博客详情页面</h1>
</template>
<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const blogId = ref(route.params.id)
console.log(blogId.value)
</script>

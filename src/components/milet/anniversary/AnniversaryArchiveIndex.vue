<template>
  <section class="relative z-10 flex h-full items-center">
    <div class="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-8">
      <div class="grid gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-start">
        <div>
          <p class="section-eyebrow">anniversary archive</p>
          <h1
            class="mt-4 font-serif text-5xl leading-[0.95] text-[#1d2b36] sm:text-6xl md:text-7xl"
          >
            {{ content.archiveTitle }}
          </h1>
          <p class="mt-6 max-w-xl text-base leading-8 text-[#52636f] sm:text-lg">
            {{ content.archiveLead }}
          </p>
        </div>

        <div class="archive-list">
          <RouterLink
            v-for="year in availableYears"
            :key="year"
            :to="{ name: 'miletAnniversary', params: { lang: routeLang, year } }"
            class="archive-year-link"
          >
            <span class="archive-year-number">{{ year }}</span>
            <span class="archive-year-copy">
              <strong>{{
                lang === 'ja' ? `${year} anniversary record` : `${year} 周年记录`
              }}</strong>
              <em>{{ lang === 'ja' ? 'Open archive story' : '进入当年的周年页面' }}</em>
            </span>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { AnniversaryLang, AnniversaryRecordContent } from '@/composables/miletAnniversary'

defineProps<{
  content: AnniversaryRecordContent
  availableYears: number[]
  routeLang: string
  lang: AnniversaryLang
}>()
</script>

<style scoped>
.section-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #317f8d;
}

.archive-list {
  display: grid;
  gap: 1rem;
}

.archive-year-link {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 1.7rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(236, 247, 250, 0.74)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.06), rgba(221, 190, 95, 0.08));
  padding: 1.15rem 1.25rem;
  box-shadow: 0 24px 64px -50px rgba(31, 43, 53, 0.8);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.archive-year-link:hover {
  transform: translateY(-2px);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 250, 251, 0.88)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.1), rgba(221, 190, 95, 0.12));
}

.archive-year-number {
  display: inline-flex;
  min-width: 5.4rem;
  min-height: 5.4rem;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background: rgba(39, 109, 123, 0.92);
  color: white;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 2rem;
  line-height: 1;
}

.archive-year-copy strong {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1f2b35;
}

.archive-year-copy em {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  font-style: normal;
  color: #60717b;
}

@media (max-width: 767px) {
  .archive-year-link {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 0.8rem;
  }

  .archive-year-number {
    min-width: 4.4rem;
    min-height: 4.4rem;
    font-size: 1.7rem;
  }
}
</style>

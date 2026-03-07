<script setup lang="ts">
defineProps<{
  layout: string
}>()
</script>

<template>
  <div class="w-full h-full flex" style="gap: 6%" v-if="layout === 'masonry'">
    <div class="flex-1 flex flex-col" style="gap: 6%">
      <div class="bg-current rounded-[2px] h-[35%] opacity-80"></div>
      <div class="bg-current rounded-[2px] flex-1 opacity-80"></div>
    </div>
    <div class="flex-1 flex flex-col" style="gap: 6%">
      <div class="bg-current rounded-[2px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[2px] h-[40%] opacity-80"></div>
    </div>
    <div class="flex-1 flex flex-col" style="gap: 6%">
      <div class="bg-current rounded-[2px] h-[45%] opacity-80"></div>
      <div class="bg-current rounded-[2px] flex-1 opacity-80"></div>
    </div>
  </div>

  <div
    class="w-full h-full grid grid-cols-2 grid-rows-2"
    style="gap: 6%"
    v-else-if="layout === 'grid'"
  >
    <div class="bg-current rounded-[3px] opacity-80"></div>
    <div class="bg-current rounded-[3px] opacity-80"></div>
    <div class="bg-current rounded-[3px] opacity-80"></div>
    <div class="bg-current rounded-[3px] opacity-80"></div>
  </div>

  <div
    class="w-full h-full grid grid-cols-3 grid-rows-3"
    style="gap: 4%"
    v-else-if="layout === 'nine_grid'"
  >
    <div
      v-for="i in 9"
      :key="i"
      class="bg-current rounded-[2px] opacity-80"
    ></div>
  </div>

  <div
    class="w-full h-full grid grid-cols-3"
    style="gap: 6%"
    v-else-if="layout === 'left_hero'"
  >
    <div class="bg-current rounded-[3px] col-span-2 h-full opacity-80"></div>
    <div class="flex flex-col h-full" style="gap: 6%">
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
    </div>
  </div>

  <div
    class="w-full h-full grid grid-cols-3"
    style="gap: 6%"
    v-else-if="layout === 'right_hero'"
  >
    <div class="flex flex-col h-full" style="gap: 6%">
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
    </div>
    <div class="bg-current rounded-[3px] col-span-2 h-full opacity-80"></div>
  </div>

  <div
    class="w-full h-full flex flex-col"
    style="gap: 6%"
    v-else-if="layout === 'top_hero'"
  >
    <div class="bg-current rounded-[3px] h-[55%] opacity-80"></div>
    <div class="flex flex-1" style="gap: 6%">
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
    </div>
  </div>

  <div
    class="w-full h-full flex flex-col"
    style="gap: 6%"
    v-else-if="layout === 'bottom_hero'"
  >
    <div class="flex flex-1" style="gap: 6%">
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
      <div class="bg-current rounded-[3px] flex-1 opacity-80"></div>
    </div>
    <div class="bg-current rounded-[3px] h-[55%] opacity-80"></div>
  </div>

  <div
    class="w-full h-full grid grid-cols-3 grid-rows-3"
    style="gap: 4%"
    v-else-if="layout === 'magazine'"
  >
    <div
      class="bg-current rounded-[2px] col-span-2 row-span-2 opacity-80"
    ></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] col-span-3 opacity-80"></div>
  </div>

  <div
    class="w-full h-full grid grid-rows-3"
    style="gap: 4%"
    v-else-if="layout === 'equal_rows'"
  >
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
  </div>

  <div
    class="w-full h-full grid grid-cols-3"
    style="gap: 4%"
    v-else-if="layout === 'equal_cols'"
  >
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
    <div class="bg-current rounded-[2px] opacity-80"></div>
  </div>
</template>

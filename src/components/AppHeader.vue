<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-white/70 backdrop-blur-xl shadow-sm border-b border-white border-opacity-50 transition-all"
  >
    <div
      class="box-border w-full max-w-7xl mx-auto px-4 md:px-8 h-18 md:h-20 flex items-center justify-between"
    >
      <!-- Logo -->
      <div
        class="flex flex-1 min-w-0 items-center justify-start gap-3 sm:gap-4 cursor-pointer group"
        @click="router.push('/')"
      >
        <div
          class="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-300 group-hover:scale-105 group-hover:shadow-slate-400/50 transition-all duration-300 relative overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>
          <span
            class="text-white font-black text-xl md:text-2xl mt-0.5 tracking-tighter"
            >DK</span
          >
        </div>
        <h1
          class="text-xl md:text-2xl font-black m-0 text-slate-800 tracking-tight hidden sm:block"
        >
          DesignKit
        </h1>

        <!-- 面包屑当前页 -->
        <template v-if="route.path !== '/'">
          <span
            class="text-slate-300 font-light mx-1 md:mx-2 text-xl hidden sm:block flex-shrink-0"
            >/</span
          >
          <span
            class="text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-full text-xs md:text-sm tracking-wide ml-0 shadow-inner truncate max-w-[120px] sm:max-w-[200px]"
          >
            {{
              route.meta.title
                ? (route.meta.title as string).split(' -')[0]
                : '工具'
            }}
          </span>
        </template>
      </div>

      <!-- 导航区域 -->
      <div class="flex items-center gap-2 sm:gap-4 flex-none ml-2">
        <button
          v-if="route.path !== '/'"
          @click="router.push('/')"
          class="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-white border-2 border-slate-100 rounded-xl hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
        >
          返回套件盒子
        </button>
        <span
          v-else
          class="text-slate-400 font-bold text-sm hidden lg:block tracking-wide uppercase"
        >
          Powerful Online Toolkit
        </span>
        <button
          v-if="route.path !== '/'"
          @click="router.push('/')"
          class="md:hidden flex flex-none items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-slate-600 active:bg-slate-200"
        >
          <!-- Back Icon using arbitrary svg for mobile simplify -->
          <svg
            xmlns="http://www.w3.org/0000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

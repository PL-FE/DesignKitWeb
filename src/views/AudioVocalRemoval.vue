<script setup lang="ts">
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'
</script>

<template>
  <ToolPageLayout
    title="人声去除 / 伴奏提取"
    description="为了更好的效果，请使用推荐的第三方工具进行去人声处理"
    icon="solar:music-note-bold-duotone"
    color="violet"
  >
    <!-- 左侧：上传区 (替换为提示) -->
    <template #upload>
      <div class="h-full flex flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[300px]">
        <Icon icon="solar:info-circle-bold-duotone" class="text-6xl text-violet-400 mb-4" />
        <h3 class="text-xl font-bold text-slate-700 mb-2">服务调整提示</h3>
        <p class="text-slate-500 text-center mb-6 leading-relaxed">
          去人声再回来。<br/>
          您可以点击下方按钮前往专业的在线去人声工具进行处理。
        </p>
        <a 
          href="https://vocalremover.org/zh/" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-violet-500/30 text-lg"
        >
          <Icon icon="solar:link-bold" class="text-xl" />
          前往 vocalremover.org
        </a>
      </div>
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="处理说明"
        card-title-icon="solar:info-circle-bold-duotone"
      >
        <div class="space-y-4">
          <div class="p-4 rounded-xl border border-violet-100 bg-violet-50/50">
            <p class="text-sm text-violet-700 font-medium leading-relaxed">
              <Icon icon="solar:stars-bold" class="mr-1 inline-block" />
              推荐使用专业的免费第三方在线工具。
            </p>
          </div>

          <ul class="text-xs text-slate-500 space-y-3 px-1">
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5 text-base flex-shrink-0"
              />
              <span class="leading-relaxed">访问 <strong>https://vocalremover.org/zh/</strong> 免费处理您的音频。</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5 text-base flex-shrink-0"
              />
              <span class="leading-relaxed">将人工智能把人声从器乐中分离出来，获得卡拉OK版本和纯人声版本。</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5 text-base flex-shrink-0"
              />
              <span class="leading-relaxed">下载处理好的伴奏后，再回到本站继续进行视频合成等其他操作。</span>
            </li>
          </ul>
        </div>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>

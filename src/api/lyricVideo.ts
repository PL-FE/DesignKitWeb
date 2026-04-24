import request from './request'

// 歌词视频合成参数类型
export type LyricVideoBackgroundMode = 'video' | 'image' | 'color'

export interface LyricVideoParams {
  audio: File
  lrc: File
  bg_color: string
  background_mode: LyricVideoBackgroundMode
  font_size: number
  sung_color: string      // 已唱部分颜色
  unsung_color: string    // 未唱部分颜色
  stroke_color: string
  stroke_width: number
  resolution: string
  remove_vocals: boolean
  letter_spacing: number
  line_gap_ratio: number
  wrap_mode: string
  max_chars_per_line: number
  lines_mode: string      // 歌词行数模式：3=三行滚动，2=两行居中
}

export type TaskStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface TaskProgress {
  task_id: string
  status: TaskStatus
  progress: number
  result_filename?: string | null
  download_url?: string | null
  error?: string | null
}

/**
 * 合成歌词视频（异步任务模式）
 * 1. POST /lyric-video/generate 提交任务，立即返回 task_id
 * 2. 轮询 GET /lyric-video/task/{task_id} 获取进度（始终返回 JSON）
 * 3. 任务完成后，JSON 中包含 download_url，通过该 URL 下载文件 Blob
 */
export async function generateLyricVideo(
  params: LyricVideoParams,
  onUploadProgress?: (percent: number) => void,
  onTaskProgress?: (progress: TaskProgress) => void,
): Promise<Blob> {
  const formData = new FormData()
  formData.append('audio', params.audio)
  formData.append('lrc', params.lrc)
  formData.append('bg_color', params.bg_color)
  formData.append('background_mode', params.background_mode)
  formData.append('font_size', String(params.font_size))
  formData.append('sung_color', params.sung_color)
  formData.append('unsung_color', params.unsung_color)
  formData.append('stroke_color', params.stroke_color)
  formData.append('stroke_width', String(params.stroke_width))
  formData.append('resolution', params.resolution)
  formData.append('remove_vocals', String(params.remove_vocals))
  formData.append('letter_spacing', String(params.letter_spacing))
  formData.append('line_gap_ratio', String(params.line_gap_ratio))
  formData.append('wrap_mode', params.wrap_mode)
  formData.append('max_chars_per_line', String(params.max_chars_per_line))
  formData.append('lines_mode', String(params.lines_mode))

  // 1. 提交任务
  const submitResp = await request.post<{ task_id: string; status: string }>(
    '/lyric-video/generate',
    formData,
    {
      timeout: 60_000,
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    },
  )

  const taskId = submitResp.data.task_id

  // 2. 轮询任务状态（始终返回 JSON）
  const POLL_INTERVAL = 2000 // 2 秒
  const MAX_POLL_TIME = 600_000 // 最长 10 分钟
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_POLL_TIME) {
    try {
      const pollResp = await request.get<TaskProgress>(`/lyric-video/task/${taskId}`, {
        timeout: 30_000,
      })

      const progress = pollResp.data
      onTaskProgress?.(progress)

      if (progress.status === 'failed') {
        throw new Error(progress.error || '合成失败')
      }
      if (progress.status === 'done' && progress.download_url) {
        // 3. 通过专用下载接口获取文件
        const downloadResp = await request.get(progress.download_url, {
          responseType: 'blob',
          timeout: 120_000,
        })
        return downloadResp.data as Blob
      }
    } catch (err: any) {
      // 如果是业务错误（合成失败等），直接抛出
      if (err?.message?.includes('合成失败') || err?.message?.includes('error')) {
        throw err
      }
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }

  throw new Error('合成超时（超过 10 分钟），请尝试较短音频或降低分辨率')
}

/**
 * 前端解析 LRC 内容，用于预览（不依赖后端）
 * 返回 [{time: number, text: string}]
 */
export function parseLrcClient(lrcContent: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = []
  const timeTagRe = /\[(\d{1,3}):(\d{2})\.(\d{1,3})\]/g
  const rowRe = /^(\[[\d:.]+\])+(.*)$/

  for (const row of lrcContent.split('\n')) {
    const trimmed = row.trim()
    if (!rowRe.test(trimmed)) continue
    const text = trimmed.replace(/\[\d{1,3}:\d{2}\.\d{1,3}\]/g, '').trim()
    if (!text) continue
    let m: RegExpExecArray | null
    const rowTags = [...trimmed.matchAll(/\[(\d{1,3}):(\d{2})\.(\d{1,3})\]/g)]
    for (const tag of rowTags) {
      const minutes = parseInt(tag[1] ?? '0')
      const seconds = parseInt(tag[2] ?? '0')
      const ms = parseInt((tag[3] ?? '0').padEnd(3, '0').slice(0, 3))
      const totalSeconds = minutes * 60 + seconds + ms / 1000
      lines.push({ time: totalSeconds, text })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

/**
 * 格式化秒数为 mm:ss 显示
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

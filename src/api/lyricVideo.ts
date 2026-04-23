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
}

/**
 * 合成歌词视频
 * 上传音频 + LRC 歌词，返回 MP4 视频 Blob
 */
export async function generateLyricVideo(
  params: LyricVideoParams,
  onProgress?: (percent: number) => void,
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

  const response = await request.post('/lyric-video/generate', formData, {
    responseType: 'blob',
    timeout: 600_000, // 最长 10 分钟，去除人声比较耗时
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  return response.data as Blob
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

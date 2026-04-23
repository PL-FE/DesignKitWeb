import request from './request'

export interface LyricVideoParams {
  audio: File
  lrc: File
  bg_color: string
  font_size: number
  sung_color: string
  unsung_color: string
  stroke_color: string
  stroke_width: number
  resolution: string
  letter_spacing: number
  line_gap_ratio: number
  wrap_mode: 'auto' | 'chars'
  max_chars_per_line: number
}

export function parseLrcClient(text: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = []
  const timePattern = /\[(\d{1,3}):(\d{2})\.(\d{1,3})\](.*)$/
  const tagPattern = /\[(\d{1,3}):(\d{2})\.(\d{1,3})\]/g

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const tags = [...line.matchAll(tagPattern)]
    if (!tags.length) continue
    const textPart = line.replace(tagPattern, '').trim()
    if (!textPart) continue
    for (const [, m, s, cs] of tags) {
      const minutes = parseInt(m, 10)
      const seconds = parseInt(s, 10)
      const centisecondsStr = cs.padEnd(3, '0').slice(0, 3)
      const milliseconds = parseInt(centisecondsStr, 10)
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000.0
      lines.push({ time: totalSeconds, text: textPart })
    }
  }

  lines.sort((a, b) => a.time - b.time)

  const unique: Array<{ time: number; text: string }> = []
  for (const line of lines) {
    if (unique.length && Math.abs(line.time - unique[unique.length - 1].time) < 0.1) {
      unique[unique.length - 1] = line
    } else {
      unique.push(line)
    }
  }
  return unique
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export async function generateLyricVideo(
  params: LyricVideoParams,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const formData = new FormData()
  formData.append('audio', params.audio)
  formData.append('lrc', params.lrc)
  formData.append('bg_color', params.bg_color)
  formData.append('font_size', String(params.font_size))
  formData.append('sung_color', params.sung_color)
  formData.append('unsung_color', params.unsung_color)
  formData.append('stroke_color', params.stroke_color)
  formData.append('stroke_width', String(params.stroke_width))
  formData.append('resolution', params.resolution)
  formData.append('letter_spacing', String(params.letter_spacing))
  formData.append('line_gap_ratio', String(params.line_gap_ratio))
  formData.append('wrap_mode', params.wrap_mode)
  formData.append('max_chars_per_line', String(params.max_chars_per_line))

  const response = await request.post('/o3ic-video/generate', formData, {
    timeout: 0,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return response
}

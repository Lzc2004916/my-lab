import { ref, type Ref } from 'vue'
import { jsPDF } from 'jspdf'

// ── Types ────────────────────────────────────────────────────────────────

interface PDFOptions {
  w: number
  h: number
}

// ── Helpers ─────────────────────────────────────────────────────────────

function downloadURL(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

const PX_TO_MM = 0.2646

// ── Composable ───────────────────────────────────────────────────────────

export function useExport(): {
  isExporting: Ref<boolean>
  progress: Ref<number>
  exportPNG: (canvas: HTMLCanvasElement) => Promise<void>
  exportJPG: (canvas: HTMLCanvasElement) => Promise<void>
  exportBatchPNG: (canvases: HTMLCanvasElement[]) => Promise<void>
  exportBatchJPG: (canvases: HTMLCanvasElement[]) => Promise<void>
  exportPDF: (canvas: HTMLCanvasElement, opts: PDFOptions) => Promise<void>
  exportMultiPDF: (canvases: HTMLCanvasElement[], opts: PDFOptions) => Promise<void>
  copyToClipboard: (canvas: HTMLCanvasElement) => Promise<void>
  recordMP4: (canvas: HTMLCanvasElement, durationMs?: number) => Promise<Blob>
} {
  const isExporting = ref<boolean>(false)
  const progress = ref<number>(0)

  function resetState(): void {
    isExporting.value = false
    progress.value = 0
  }

  // ── PNG ─────────────────────────────────────────────────────────────

  async function exportPNG(canvas: HTMLCanvasElement): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 10

      const dataUrl = canvas.toDataURL('image/png')
      progress.value = 100

      if (window.electronAPI?.saveImage) {
        await window.electronAPI.saveImage(dataUrl, 'card.png')
      } else {
        downloadURL(dataUrl, 'card.png')
      }
    } catch (e) {
      throw new Error(`PNG export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── JPG ─────────────────────────────────────────────────────────────

  async function exportJPG(canvas: HTMLCanvasElement): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 10

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      progress.value = 100

      if (window.electronAPI?.saveImage) {
        await window.electronAPI.saveImage(dataUrl, 'card.jpg')
      } else {
        downloadURL(dataUrl, 'card.jpg')
      }
    } catch (e) {
      throw new Error(`JPG export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── Batch PNG — folder picker → write all sequentially-named files ──

  async function exportBatchPNG(canvases: HTMLCanvasElement[]): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 0

      const pad = String(canvases.length).length
      const images = canvases.map((canvas, i) => ({
        dataUrl: canvas.toDataURL('image/png'),
        filename: `card-${String(i + 1).padStart(pad, '0')}.png`,
      }))

      if (window.electronAPI?.saveImagesToFolder) {
        progress.value = 30
        const result = await window.electronAPI.saveImagesToFolder(images)
        if (!result.success) return
        progress.value = 100
      } else {
        // Browser fallback: sequential direct download
        for (let i = 0; i < images.length; i++) {
          downloadURL(images[i]!.dataUrl, images[i]!.filename)
          progress.value = Math.round(((i + 1) / images.length) * 100)
          if (i < images.length - 1) {
            await new Promise((r) => setTimeout(r, 120))
          }
        }
      }
    } catch (e) {
      throw new Error(`Batch PNG export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── Batch JPG — folder picker → write all sequentially-named files ──

  async function exportBatchJPG(canvases: HTMLCanvasElement[]): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 0

      const pad = String(canvases.length).length
      const images = canvases.map((canvas, i) => ({
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        filename: `card-${String(i + 1).padStart(pad, '0')}.jpg`,
      }))

      if (window.electronAPI?.saveImagesToFolder) {
        progress.value = 30
        const result = await window.electronAPI.saveImagesToFolder(images)
        if (!result.success) return
        progress.value = 100
      } else {
        for (let i = 0; i < images.length; i++) {
          downloadURL(images[i]!.dataUrl, images[i]!.filename)
          progress.value = Math.round(((i + 1) / images.length) * 100)
          if (i < images.length - 1) {
            await new Promise((r) => setTimeout(r, 120))
          }
        }
      }
    } catch (e) {
      throw new Error(`Batch JPG export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── PDF (single page) ───────────────────────────────────────────────

  async function exportPDF(canvas: HTMLCanvasElement, opts: PDFOptions): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 30

      const imgData = canvas.toDataURL('image/png')
      const wMm = opts.w * PX_TO_MM
      const hMm = opts.h * PX_TO_MM

      progress.value = 80

      const pdf = new jsPDF({
        orientation: wMm >= hMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [wMm, hMm],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, wMm, hMm)
      pdf.save('card.pdf')
      progress.value = 100
    } catch (e) {
      throw new Error(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── PDF (multi-page) ────────────────────────────────────────────────

  async function exportMultiPDF(
    canvases: HTMLCanvasElement[],
    opts: PDFOptions,
  ): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 10

      const wMm = opts.w * PX_TO_MM
      const hMm = opts.h * PX_TO_MM

      const pdf = new jsPDF({
        orientation: wMm >= hMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [wMm, hMm],
      })

      for (let i = 0; i < canvases.length; i++) {
        const imgData = canvases[i]!.toDataURL('image/png')
        if (i > 0) pdf.addPage([wMm, hMm])
        pdf.addImage(imgData, 'PNG', 0, 0, wMm, hMm)
        progress.value = 10 + Math.round(((i + 1) / canvases.length) * 80)
      }

      pdf.save('cards.pdf')
      progress.value = 100
    } catch (e) {
      throw new Error(`Multi-PDF export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── Copy to clipboard ───────────────────────────────────────────────

  async function copyToClipboard(canvas: HTMLCanvasElement): Promise<void> {
    try {
      isExporting.value = true
      progress.value = 30

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error('Canvas toBlob returned null'))
          },
          'image/png',
        )
      })

      progress.value = 80
      const item = new ClipboardItem({ 'image/png': blob })
      await navigator.clipboard.write([item])
      progress.value = 100
    } catch (e) {
      throw new Error(`Copy failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  // ── Record MP4 / WebM ───────────────────────────────────────────────

  async function recordMP4(
    canvas: HTMLCanvasElement,
    durationMs: number = 5000,
  ): Promise<Blob> {
    try {
      isExporting.value = true
      progress.value = 0

      const stream = canvas.captureStream(30)
      const mimeType = selectBestMime()

      const chunks: BlobPart[] = []
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      const startTime = Date.now()
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        progress.value = 50 + Math.round((elapsed / durationMs) * 45)
      }, 100)

      recorder.start()
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop()
        }, durationMs)
      })

      clearInterval(progressInterval)

      const blob = new Blob(chunks, { type: mimeType })
      progress.value = 100
      return blob
    } catch (e) {
      throw new Error(`Video recording failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      resetState()
    }
  }

  function selectBestMime(): string {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    }
    return 'video/webm'
  }

  return {
    isExporting,
    progress,
    exportPNG,
    exportJPG,
    exportBatchPNG,
    exportBatchJPG,
    exportPDF,
    exportMultiPDF,
    copyToClipboard,
    recordMP4,
  }
}

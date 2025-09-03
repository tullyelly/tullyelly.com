'use client'

import { useEffect, useRef, useState } from 'react'
import ShoutOut from '@/components/shout-out'

function parseRgb(input: string): [number, number, number] {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return [0, 0, 0]
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]
}

function luminance([r, g, b]: [number, number, number]) {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

export default function ShoutOutLab() {
  const [variant, setVariant] = useState<'whisper' | 'note' | 'spark'>('whisper')
  const [asEl, setAsEl] = useState<'span' | 'div'>('span')
  const [icon, setIcon] = useState<'none' | 'star' | 'sprout' | 'quill'>('star')
  const [density, setDensity] = useState<'compact' | 'comfy'>('compact')
  const [tone, setTone] = useState<'neutral' | 'brand' | 'accent'>('neutral')
  const ref = useRef<HTMLSpanElement | HTMLDivElement>(null)
  const [contrast, setContrast] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const styles = getComputedStyle(el)
    const fg = parseRgb(styles.color)
    const bgString = styles.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : styles.backgroundColor
    const bg = parseRgb(bgString)
    const l1 = luminance(fg)
    const l2 = luminance(bg)
    const ratio = l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05)
    setContrast(ratio.toFixed(2))
  }, [variant, asEl, icon, density, tone])

  const toneStyle = tone === 'brand'
    ? { '--so-accent': 'var(--blue)' }
    : tone === 'accent'
      ? { '--so-accent': 'var(--green)' }
      : undefined

  const densityClass = density === 'comfy' && asEl === 'div' ? 'py-2' : ''

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          Variant
          <select value={variant} onChange={e => setVariant(e.target.value as any)} className="border border-border-subtle rounded p-1">
            <option value="whisper">whisper</option>
            <option value="note">note</option>
            <option value="spark">spark</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          As
          <select value={asEl} onChange={e => setAsEl(e.target.value as any)} className="border border-border-subtle rounded p-1">
            <option value="span">span</option>
            <option value="div">div</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Icon
          <select value={icon} onChange={e => setIcon(e.target.value as any)} className="border border-border-subtle rounded p-1">
            <option value="none">none</option>
            <option value="star">star</option>
            <option value="sprout">sprout</option>
            <option value="quill">quill</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Density
          <select value={density} onChange={e => setDensity(e.target.value as any)} className="border border-border-subtle rounded p-1">
            <option value="compact">compact</option>
            <option value="comfy">comfy</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Tone
          <select value={tone} onChange={e => setTone(e.target.value as any)} className="border border-border-subtle rounded p-1">
            <option value="neutral">neutral</option>
            <option value="brand">brand</option>
            <option value="accent">accent</option>
          </select>
        </label>
      </div>

      <p>
        Inline demo with{' '}
        <ShoutOut
          ref={ref as any}
          as={asEl}
          variant={variant}
          icon={icon}
          className={densityClass}
          style={toneStyle as any}
          tabIndex={0}
        >
          shouts to the chronicles wiki{' '}
          <a href="https://dragonlance.fandom.com/wiki/Raistlin_Majere" className="underline hover:no-underline">Raistlin Majere</a>
        </ShoutOut>
        {' '}inside a sentence.
      </p>

      {asEl === 'div' && (
        <ShoutOut
          as="div"
          variant={variant}
          icon={icon}
          className={densityClass}
          style={toneStyle as any}
          tabIndex={0}
        >
          shouts to the chronicles wiki{' '}
          <a href="https://dragonlance.fandom.com/wiki/Raistlin_Majere" className="underline hover:no-underline">Raistlin Majere</a>
        </ShoutOut>
      )}

      <p className="text-sm text-muted-foreground">Contrast ratio: {contrast}</p>
      <button onClick={() => ref.current?.focus()} className="border border-border-subtle rounded px-2 py-1 text-sm">
        Focus shout out
      </button>
    </div>
  )
}

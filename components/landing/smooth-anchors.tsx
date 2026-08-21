'use client'

import { useEffect } from 'react'

const OFFSET = 32
const MIN_MS = 500
const MAX_MS = 1200
// Distance-proportional duration, so a jump to the footer takes longer than a nudge to the next section.
const durationFor = (distance: number) => Math.min(MAX_MS, Math.max(MIN_MS, Math.abs(distance) * 0.45))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Native scroll-behavior is fast and barely eased. This replaces it for in-page anchors only.
export function SmoothAnchors() {
  useEffect(() => {
    let frame = 0

    const settle = (target: HTMLElement) => {
      // Keyboard users must land on the section, not stay where they clicked.
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      target.removeAttribute('tabindex')
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      const id = anchor?.getAttribute('href')?.slice(1)
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return

      event.preventDefault()
      history.pushState(null, '', `#${id}`)

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.scrollIntoView()
        settle(target)
        return
      }

      const start = window.scrollY
      const limit = document.documentElement.scrollHeight - window.innerHeight
      const end = Math.max(0, Math.min(limit, target.getBoundingClientRect().top + start - OFFSET))
      const distance = end - start
      if (Math.abs(distance) < 2) return settle(target)

      const duration = durationFor(distance)
      const began = performance.now()
      cancelAnimationFrame(frame)

      // CSS scroll-behavior: smooth also applies to programmatic scrollTo, so each frame would
      // start its own native animation and fight this loop. Safari shows that plainly; suspend it.
      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      const finish = () => {
        root.style.scrollBehavior = previousBehavior
        window.removeEventListener('wheel', abort)
        window.removeEventListener('touchstart', abort)
        window.removeEventListener('keydown', abort)
      }
      // A wheel or touch during the animation means the reader took over; stop immediately.
      function abort() {
        cancelAnimationFrame(frame)
        finish()
      }
      window.addEventListener('wheel', abort, { passive: true, once: true })
      window.addEventListener('touchstart', abort, { passive: true, once: true })
      window.addEventListener('keydown', abort, { once: true })

      const step = (now: number) => {
        const progress = Math.min(1, (now - began) / duration)
        window.scrollTo({ top: start + distance * easeInOutCubic(progress), behavior: 'instant' })
        if (progress < 1) {
          frame = requestAnimationFrame(step)
          return
        }
        finish()
        settle(target)
      }
      frame = requestAnimationFrame(step)
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}

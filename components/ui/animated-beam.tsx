"use client"

import { useEffect, useId, useState, type RefObject } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null> // Container ref
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  cornerRadius?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  repeat?: number
  repeatDelay?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}


// Drops vertically, turns once through a rounded corner, then drops into the target.
function elbowPath(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  radius: number
) {
  if (Math.abs(ex - sx) < 1 || Math.abs(ey - sy) < 1)
    return `M ${sx},${sy} L ${ex},${ey}`

  const midY = (sy + ey) / 2
  const dir = ex > sx ? 1 : -1
  const r = Math.max(
    0,
    Math.min(radius, Math.abs(ex - sx) / 2, Math.abs(midY - sy), Math.abs(ey - midY))
  )

  return [
    `M ${sx},${sy}`,
    `L ${sx},${midY - r}`,
    `Q ${sx},${midY} ${sx + dir * r},${midY}`,
    `L ${ex - dir * r},${midY}`,
    `Q ${ex},${midY} ${ex},${midY + r}`,
    `L ${ex},${ey}`,
  ].join(" ")
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  cornerRadius = 18,
  reverse = false, // Include the reverse prop
  duration = 5,
  delay = 0,
  pathColor = "var(--border)",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "var(--chart-3)",
  gradientStopColor = "var(--chart-3)",
  repeat = Infinity,
  repeatDelay = 0,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [points, setPoints] = useState({ sx: 0, sy: 0, ex: 0, ey: 0 })
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  const { sx, sy, ex, ey } = points
  const dx = ex - sx
  const dy = ey - sy

  // Gradient sweeps along the start-to-end vector so vertical beams animate too.
  const gradientCoordinates = reverse
    ? {
        x1: [sx + dx * 0.9, sx - dx * 0.1],
        y1: [sy + dy * 0.9, sy - dy * 0.1],
        x2: [sx + dx, sx],
        y2: [sy + dy, sy],
      }
    : {
        x1: [sx + dx * 0.1, sx + dx * 1.1],
        y1: [sy + dy * 0.1, sy + dy * 1.1],
        x2: [sx, sx + dx],
        y2: [sy, sy + dy],
      }

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height
        setSvgDimensions({ width: svgWidth, height: svgHeight })

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset

        setPoints({ sx: startX, sy: startY, ex: endX, ey: endY })
        setPathD(elbowPath(startX, startY, endX, endY, cornerRadius))
      }
    }

    // Initialize ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updatePath()
    })

    // Observe the container element
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Call the updatePath initially to set the initial path
    updatePath()

    // Clean up the observer on component unmount
    return () => {
      resizeObserver.disconnect()
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    cornerRadius,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1], // https://easings.net/#easeOutExpo
            repeat,
            repeatDelay,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Info } from "lucide-react"

interface AudioVisualizerProps {
  audioBuffer: AudioBuffer
  type?: "waveform" | "spectrogram"
}

export default function AudioVisualizer({ audioBuffer, type = "waveform" }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipContent, setTooltipContent] = useState("")
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { width } = canvasRef.current.getBoundingClientRect()
        setDimensions({ width, height: 180 })
      }
    }

    window.addEventListener("resize", updateDimensions)
    updateDimensions()

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer || dimensions.width === 0) return

    const canvas = canvasRef.current
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (type === "waveform") {
      drawWaveform(ctx, audioBuffer, canvas.width, canvas.height)
    } else {
      drawSpectrogram(ctx, audioBuffer, canvas.width, canvas.height)
    }
  }, [audioBuffer, dimensions, type])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate time position
    const timePosition = (x / canvas.width) * audioBuffer.duration

    if (type === "waveform") {
      setTooltipContent(`Time: ${timePosition.toFixed(2)}s`)
    } else {
      // For spectrogram, also show frequency
      const frequencyPosition = ((canvas.height - y) / canvas.height) * (audioBuffer.sampleRate / 2)
      setTooltipContent(`Time: ${timePosition.toFixed(2)}s, Freq: ${Math.round(frequencyPosition)} Hz`)
    }

    setTooltipPosition({ x: e.clientX, y: e.clientY })
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const drawWaveform = (ctx: CanvasRenderingContext2D, audioBuffer: AudioBuffer, width: number, height: number) => {
    const data = audioBuffer.getChannelData(0)
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    // Draw background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(243, 244, 246, 0.8)")
    gradient.addColorStop(1, "rgba(243, 244, 246, 1)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw center line
    ctx.beginPath()
    ctx.moveTo(0, amp)
    ctx.lineTo(width, amp)
    ctx.strokeStyle = "rgba(156, 163, 175, 0.5)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw waveform with gradient fill
    ctx.beginPath()
    ctx.moveTo(0, amp)

    // Create gradient for waveform
    const waveGradient = ctx.createLinearGradient(0, 0, width, 0)
    waveGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
    waveGradient.addColorStop(0.5, "rgba(220, 38, 38, 0.8)")
    waveGradient.addColorStop(1, "rgba(239, 68, 68, 0.8)")

    // Draw the top of the waveform
    const topPoints: [number, number][] = []
    for (let i = 0; i < width; i++) {
      const max = Math.max(...data.slice(i * step, (i + 1) * step))
      const y = (1 - max) * amp
      topPoints.push([i, y])
      ctx.lineTo(i, y)
    }

    // Draw the bottom of the waveform (in reverse)
    const bottomPoints: [number, number][] = []
    for (let i = width - 1; i >= 0; i--) {
      const min = Math.min(...data.slice(i * step, (i + 1) * step))
      const y = (1 - min) * amp
      bottomPoints.push([i, y])
      ctx.lineTo(i, y)
    }

    // Close the path and fill
    ctx.closePath()
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)"
    ctx.fill()

    // Draw the top line of the waveform
    ctx.beginPath()
    ctx.moveTo(topPoints[0][0], topPoints[0][1])
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i][0], topPoints[i][1])
    }
    ctx.strokeStyle = waveGradient
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw the bottom line of the waveform
    ctx.beginPath()
    ctx.moveTo(bottomPoints[bottomPoints.length - 1][0], bottomPoints[bottomPoints.length - 1][1])
    for (let i = bottomPoints.length - 2; i >= 0; i--) {
      ctx.lineTo(bottomPoints[i][0], bottomPoints[i][1])
    }
    ctx.strokeStyle = waveGradient
    ctx.lineWidth = 2
    ctx.stroke()

    // Add time axis labels with subtle styling
    ctx.fillStyle = "rgba(107, 114, 128, 0.7)"
    ctx.font = "10px system-ui, sans-serif"
    ctx.textAlign = "center"

    const duration = audioBuffer.duration
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i
      const time = (duration / 10) * i
      ctx.fillText(`${time.toFixed(1)}s`, x, height - 5)
    }

    // Add amplitude axis labels
    ctx.textAlign = "right"
    ctx.fillText("+1.0", width - 5, 15)
    ctx.fillText("0.0", width - 5, amp + 5)
    ctx.fillText("-1.0", width - 5, height - 15)
  }

  const drawSpectrogram = (ctx: CanvasRenderingContext2D, audioBuffer: AudioBuffer, width: number, height: number) => {
    // In a real implementation, we would use Web Audio API's AnalyserNode
    // and getFloatFrequencyData to get actual frequency data
    // For this demo, we'll create a simulated spectrogram

    const data = audioBuffer.getChannelData(0)
    const fftSize = 1024
    const timeSlices = Math.min(width, Math.floor(data.length / fftSize))

    // Clear background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(243, 244, 246, 0.8)")
    gradient.addColorStop(1, "rgba(243, 244, 246, 1)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Horizontal grid lines (frequency divisions)
    const freqDivisions = 8
    for (let i = 0; i <= freqDivisions; i++) {
      const y = (height / freqDivisions) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines (time divisions)
    const timeDivisions = 10
    for (let i = 0; i <= timeDivisions; i++) {
      const x = (width / timeDivisions) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw frequency bins
    for (let timeIndex = 0; timeIndex < timeSlices; timeIndex++) {
      const timeOffset = Math.floor((timeIndex * data.length) / timeSlices)

      // Simulate frequency analysis for this time slice
      // In a real implementation, this would use FFT
      const frequencyBins = 64
      for (let freqBin = 0; freqBin < frequencyBins; freqBin++) {
        // Calculate energy in this frequency bin
        let energy = 0
        const binSize = Math.floor(fftSize / frequencyBins)
        const startBin = freqBin * binSize

        for (let i = 0; i < binSize; i++) {
          if (timeOffset + startBin + i < data.length) {
            energy += data[timeOffset + startBin + i] * data[timeOffset + startBin + i]
          }
        }
        energy /= binSize

        // Add some simulated frequency characteristics
        // Lower frequencies have more energy in most audio
        const frequencyFactor = 1 - freqBin / frequencyBins
        energy *= frequencyFactor * 2 + 0.5

        // Add some time-varying characteristics
        const timeFactor = 0.5 + 0.5 * Math.sin(timeIndex / 10)
        energy *= 1 + timeFactor * 0.2

        // Map energy to color intensity (logarithmic scale for better visualization)
        const intensity = Math.min(255, Math.floor(5000 * Math.log10(1 + energy * 100)))

        // Draw rectangle for this time-frequency bin
        const x = timeIndex * (width / timeSlices)
        const y = height - (freqBin + 1) * (height / frequencyBins)
        const w = width / timeSlices
        const h = height / frequencyBins

        // Use a color gradient: red (low) -> yellow -> green -> blue (high)
        let r = 0,
          g = 0,
          b = 0
        if (intensity < 85) {
          // Red to yellow
          r = 255
          g = Math.floor(intensity * 3)
          b = 0
        } else if (intensity < 170) {
          // Yellow to green
          r = 255 - Math.floor((intensity - 85) * 3)
          g = 255
          b = 0
        } else {
          // Green to blue
          r = 0
          g = 255 - Math.floor((intensity - 170) * 3)
          b = Math.floor((intensity - 170) * 3)
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x, y, w, h)
      }
    }

    // Add frequency axis labels with subtle styling
    ctx.fillStyle = "rgba(107, 114, 128, 0.7)"
    ctx.font = "10px system-ui, sans-serif"
    ctx.textAlign = "right"

    const nyquist = audioBuffer.sampleRate / 2
    const labels = [0, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

    labels.forEach((freq) => {
      if (freq <= nyquist) {
        const y = height - (freq / nyquist) * height
        ctx.fillText(`${freq} Hz`, width - 5, y)
      }
    })

    // Add time axis labels
    ctx.textAlign = "center"
    const duration = audioBuffer.duration
    for (let i = 0; i <= 5; i++) {
      const x = (width / 5) * i
      const time = (duration / 5) * i
      ctx.fillText(`${time.toFixed(1)}s`, x, height - 5)
    }

    // Add color legend
    const legendWidth = 20
    const legendHeight = height - 20
    const legendX = width - legendWidth - 50
    const legendY = 10

    // Draw gradient
    const legendGradient = ctx.createLinearGradient(0, legendY, 0, legendY + legendHeight)
    legendGradient.addColorStop(0, "rgb(0, 0, 255)") // Blue (high)
    legendGradient.addColorStop(0.33, "rgb(0, 255, 0)") // Green
    legendGradient.addColorStop(0.67, "rgb(255, 255, 0)") // Yellow
    legendGradient.addColorStop(1, "rgb(255, 0, 0)") // Red (low)

    ctx.fillStyle = legendGradient
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)

    // Add border
    ctx.strokeStyle = "rgba(107, 114, 128, 0.5)"
    ctx.lineWidth = 1
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight)

    // Add labels
    ctx.textAlign = "left"
    ctx.fillStyle = "rgba(107, 114, 128, 0.7)"
    ctx.fillText("High", legendX + legendWidth + 5, legendY + 10)
    ctx.fillText("Low", legendX + legendWidth + 5, legendY + legendHeight)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      <Card
        className={`p-1 w-full overflow-hidden rounded-xl transition-shadow duration-300 ${isHovered ? "shadow-lg" : "shadow-sm"}`}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full rounded-lg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center"
          >
            <Info className="h-3 w-3 mr-1 text-red-500 dark:text-red-400" />
            {type === "waveform" ? "Amplitude vs Time" : "Frequency vs Time"}
          </motion.div>
        )}
      </Card>

      {showTooltip && (
        <div
          className="fixed z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs rounded-md px-2 py-1 shadow-md pointer-events-none text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 30}px`,
            transform: "translateX(-50%)",
          }}
        >
          {tooltipContent}
        </div>
      )}
    </motion.div>
  )
}


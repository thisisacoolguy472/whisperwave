"use client"

import { motion } from "framer-motion"

interface WhisperwaveLogoProps {
  size?: number
  className?: string
  animated?: boolean
}

export default function WhisperwaveLogo({ size = 60, className = "", animated = true }: WhisperwaveLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Center circle */}
      <motion.div
        className="absolute bg-red-500 rounded-full"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          top: "50%",
          left: "50%",
          marginLeft: -(size * 0.4) / 2,
          marginTop: -(size * 0.4) / 2,
        }}
        animate={animated ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 2,
          repeat: animated ? Number.POSITIVE_INFINITY : 0,
          repeatType: "reverse",
        }}
      />

      {/* Inner circle (hole) */}
      <div
        className="absolute bg-white dark:bg-gray-900 rounded-full"
        style={{
          width: size * 0.15,
          height: size * 0.15,
          top: "50%",
          left: "50%",
          marginLeft: -(size * 0.15) / 2,
          marginTop: -(size * 0.15) / 2,
          zIndex: 1,
        }}
      />

      {/* Top wave */}
      <motion.div
        className="absolute bg-red-500 rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.2,
          top: 0,
          left: "50%",
          marginLeft: -(size * 0.5) / 2,
          borderRadius: size,
        }}
        animate={animated ? { y: [0, -3, 0] } : {}}
        transition={{
          duration: 2,
          repeat: animated ? Number.POSITIVE_INFINITY : 0,
          repeatType: "reverse",
          delay: 0.2,
        }}
      />

      {/* Bottom wave */}
      <motion.div
        className="absolute bg-red-500 rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.2,
          bottom: 0,
          left: "50%",
          marginLeft: -(size * 0.5) / 2,
          borderRadius: size,
        }}
        animate={animated ? { y: [0, 3, 0] } : {}}
        transition={{
          duration: 2,
          repeat: animated ? Number.POSITIVE_INFINITY : 0,
          repeatType: "reverse",
          delay: 0.2,
        }}
      />

      {/* Left wave */}
      <motion.div
        className="absolute bg-red-500 rounded-full"
        style={{
          width: size * 0.2,
          height: size * 0.3,
          left: 0,
          top: "50%",
          marginTop: -(size * 0.3) / 2,
          borderRadius: size,
        }}
        animate={animated ? { x: [0, -3, 0] } : {}}
        transition={{
          duration: 2,
          repeat: animated ? Number.POSITIVE_INFINITY : 0,
          repeatType: "reverse",
          delay: 0.4,
        }}
      />

      {/* Right wave */}
      <motion.div
        className="absolute bg-red-500 rounded-full"
        style={{
          width: size * 0.2,
          height: size * 0.3,
          right: 0,
          top: "50%",
          marginTop: -(size * 0.3) / 2,
          borderRadius: size,
        }}
        animate={animated ? { x: [0, 3, 0] } : {}}
        transition={{
          duration: 2,
          repeat: animated ? Number.POSITIVE_INFINITY : 0,
          repeatType: "reverse",
          delay: 0.4,
        }}
      />
    </div>
  )
}


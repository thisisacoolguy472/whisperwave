"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <span className="sr-only">Toggle theme</span>
      </div>
    )
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-14 rounded-full overflow-hidden shadow-xl focus:outline-none"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br"
        animate={{
          background:
            resolvedTheme === "dark"
              ? "linear-gradient(to bottom right, #0f172a, #1e293b)"
              : "linear-gradient(to bottom right, #fef9c3, #fde68a)",
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Animated icon transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={resolvedTheme}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex items-center justify-center w-full h-full"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-7 h-7 text-blue-300" />
          ) : (
            <Sun className="w-7 h-7 text-yellow-500" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isHovered
            ? resolvedTheme === "dark"
              ? "0 0 20px 5px rgba(96, 165, 250, 0.7)"
              : "0 0 20px 5px rgba(250, 204, 21, 0.7)"
            : "none",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Stars for dark mode */}
      {resolvedTheme === "dark" && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{
                x: Math.random() * 40 - 20,
                y: Math.random() * 40 - 20,
                opacity: 0.5 + Math.random() * 0.5,
                scale: 0.5 + Math.random() * 0.5,
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: Math.random() * 2,
              }}
            />
          ))}

          {/* Larger star */}
          <motion.div
            className="absolute w-2 h-2 bg-blue-200 rounded-full"
            style={{
              top: "25%",
              right: "25%",
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        </>
      )}

      {/* Sun rays for light mode */}
      {resolvedTheme === "light" && (
        <>
          {[...Array(12)].map((_, i) => {
            const angle = i * 30 * (Math.PI / 180)
            const distance = 20
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-4 bg-yellow-400 rounded-full origin-bottom"
                style={{
                  left: "50%",
                  top: "50%",
                  x: Math.cos(angle) * distance - 0.5,
                  y: Math.sin(angle) * distance - 8,
                  rotate: `${i * 30}deg`,
                }}
                animate={{
                  height: [4, 5, 4],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: i * 0.1,
                }}
              />
            )
          })}

          {/* Sun glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        </>
      )}
    </motion.button>
  )
}


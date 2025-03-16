"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Play, Pause, AudioWaveformIcon as Waveform, Info, Volume2, Sparkles } from "lucide-react"
import AudioVisualizer from "@/components/audio-visualizer"
import NoiseClassifier from "@/components/noise-classifier"
import { processAudio } from "@/lib/audio-processor"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/theme-toggle"
import WhisperwaveLogo from "@/components/whisperwave-logo"

export default function NoiseCancellationApp() {
  const [originalAudio, setOriginalAudio] = useState<AudioBuffer | null>(null)
  const [processedAudio, setProcessedAudio] = useState<AudioBuffer | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState({ original: false, processed: false })
  const [noiseType, setNoiseType] = useState<string | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  const originalSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const processedSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize AudioContext on client side
    if (typeof window !== "undefined" && !audioContext) {
      setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)())
    }

    return () => {
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [audioContext])

  // Track scroll position for scroll-based animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Simulate upload progress
  useEffect(() => {
    if (uploadProgress > 0 && uploadProgress < 100) {
      const timer = setTimeout(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 100))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [uploadProgress])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !audioContext) return

    const file = e.target.files[0]
    setUploadProgress(10)

    try {
      const arrayBuffer = await file.arrayBuffer()
      setUploadProgress(50)

      const decodedAudio = await audioContext.decodeAudioData(arrayBuffer)
      setUploadProgress(100)

      setTimeout(() => {
        setOriginalAudio(decodedAudio)
        setProcessedAudio(null)
        setNoiseType(null)
        setUploadProgress(0)
      }, 500)
    } catch (error) {
      console.error("Error decoding audio data:", error)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0] && audioContext) {
      const file = e.dataTransfer.files[0]
      if (file.type.includes("audio")) {
        setUploadProgress(10)

        file.arrayBuffer().then((arrayBuffer) => {
          setUploadProgress(50)

          audioContext
            .decodeAudioData(arrayBuffer)
            .then((decodedAudio) => {
              setUploadProgress(100)

              setTimeout(() => {
                setOriginalAudio(decodedAudio)
                setProcessedAudio(null)
                setNoiseType(null)
                setUploadProgress(0)
              }, 500)
            })
            .catch((error) => {
              console.error("Error decoding audio data:", error)
              setUploadProgress(0)
            })
        })
      }
    }
  }

  const processNoiseCancellation = async () => {
    if (!originalAudio || !audioContext) return

    setIsProcessing(true)

    try {
      // Process the audio with our noise cancellation algorithm
      const result = await processAudio(originalAudio, audioContext, noiseType || "unknown")
      setProcessedAudio(result)
    } catch (error) {
      console.error("Error processing audio:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudio = (type: "original" | "processed") => {
    if (!audioContext) return

    // Stop any currently playing audio
    if (originalSourceRef.current) {
      originalSourceRef.current.stop()
      originalSourceRef.current = null
    }

    if (processedSourceRef.current) {
      processedSourceRef.current.stop()
      processedSourceRef.current = null
    }

    setIsPlaying({
      original: type === "original" ? true : false,
      processed: type === "processed" ? true : false,
    })

    const audioBuffer = type === "original" ? originalAudio : processedAudio
    if (!audioBuffer) return

    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)

    source.onended = () => {
      setIsPlaying((prev) => ({ ...prev, [type]: false }))
      if (type === "original") {
        originalSourceRef.current = null
      } else {
        processedSourceRef.current = null
      }
    }

    if (type === "original") {
      originalSourceRef.current = source
    } else {
      processedSourceRef.current = source
    }

    source.start()
  }

  const stopAudio = (type: "original" | "processed") => {
    if (type === "original" && originalSourceRef.current) {
      originalSourceRef.current.stop()
      originalSourceRef.current = null
    } else if (type === "processed" && processedSourceRef.current) {
      processedSourceRef.current.stop()
      processedSourceRef.current = null
    }

    setIsPlaying((prev) => ({ ...prev, [type]: false }))
  }

  return (
    <main className="min-h-screen bg-pattern transition-colors duration-500">
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-red-500/10 dark:from-red-900/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-500/10 dark:from-red-900/20 to-transparent"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto max-w-5xl relative py-16 px-4 sm:px-6"
      >
        <header className="text-center mb-16 relative flex flex-col items-center">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 flex items-center justify-center"
          >
            <WhisperwaveLogo size={80} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-bold gradient-text mb-2 mt-2 text-balance"
          >
            Whisperwave
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-pretty"
          >
            Advanced AI-Powered Noise Cancellation Technology
          </motion.p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <Card className="overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl transition-all duration-300 card-hover border-glow">
            <CardHeader className="pb-4 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Audio</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Upload an audio file containing noise like lawnmower, traffic, or HVAC sounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <label
                  htmlFor="audio-upload"
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer",
                    "bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/50",
                    "border-gray-300 dark:border-gray-700 transition-all duration-300 ease-in-out",
                    "group overflow-hidden",
                    dragActive ? "border-red-500 bg-red-50/80 dark:bg-red-900/30" : "",
                    uploadProgress > 0 ? "pointer-events-none" : "",
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* Background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 shimmer"></div>

                  {uploadProgress > 0 ? (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <div className="w-20 h-20 mb-4 relative">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            className="text-gray-200 dark:text-gray-700"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className="text-red-500 dark:text-red-400"
                            strokeWidth="6"
                            strokeDasharray={276}
                            strokeDashoffset={276 - (uploadProgress / 100) * 276}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-medium">
                          {uploadProgress}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {uploadProgress < 50 ? "Uploading..." : "Processing..."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center z-10">
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="mb-3 p-4 rounded-full bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-800/30 transition-colors duration-300"
                      >
                        <Upload className="w-8 h-8 text-red-500 dark:text-red-400" />
                      </motion.div>
                      <p className="mb-2 text-base text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">MP3, WAV or OGG (MAX. 10MB)</p>

                      {/* Decorative elements */}
                      <div className="absolute bottom-3 right-3 text-gray-300 dark:text-gray-700 opacity-50">
                        <Waveform className="w-16 h-16" />
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadProgress > 0}
                  />
                </label>

                {originalAudio && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                  >
                    <NoiseClassifier audioBuffer={originalAudio} onClassified={setNoiseType} />

                    <AnimatePresence>
                      {noiseType && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Button
                            onClick={processNoiseCancellation}
                            disabled={isProcessing || !noiseType}
                            className={cn(
                              "mt-6 w-full h-14 text-base font-medium rounded-xl",
                              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white",
                              "transition-all duration-300 ease-in-out button-hover-effect",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              "shadow-lg hover:shadow-xl shadow-red-500/10 hover:shadow-red-500/20",
                              "relative overflow-hidden",
                            )}
                          >
                            {isProcessing ? (
                              <div className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing Audio...
                              </div>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Cancel Noise
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {originalAudio && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm mb-6 shadow-md">
                <TabsTrigger
                  value="original"
                  className="rounded-lg py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-300 data-[state=active]:scale-105"
                >
                  Original Audio
                </TabsTrigger>
                <TabsTrigger
                  value="processed"
                  disabled={!processedAudio}
                  className="rounded-lg py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-300 data-[state=active]:scale-105"
                >
                  Processed Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="original" className="mt-0">
                <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 card-hover border-glow">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        Original Audio
                      </CardTitle>
                      {noiseType && (
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          Classified as <span className="font-medium text-red-600 dark:text-red-400">{noiseType}</span>{" "}
                          noise
                        </CardDescription>
                      )}
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => (isPlaying.original ? stopAudio("original") : playAudio("original"))}
                        className={cn(
                          "rounded-full w-12 h-12 transition-all duration-300 relative",
                          isPlaying.original ? "bg-gray-200 dark:bg-gray-700" : "bg-red-50 dark:bg-red-900/20",
                          isPlaying.original ? "text-gray-700 dark:text-gray-300" : "text-red-600 dark:text-red-400",
                          "hover:shadow-lg hover:shadow-red-500/20",
                        )}
                      >
                        {isPlaying.original ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="relative">
                      <AudioVisualizer audioBuffer={originalAudio} />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {isPlaying.original && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-4 bg-red-500 dark:bg-red-400 rounded-full"
                                animate={{
                                  height: [4, 12, 4],
                                }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatType: "reverse",
                                  duration: 0.8,
                                  delay: i * 0.2,
                                  ease: "easeInOut",
                                }}
                              />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processed" className="mt-0">
                <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 card-hover border-glow">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        Processed Audio
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300">
                        Noise Canceled{" "}
                        <span className="inline-block ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                          Enhanced
                        </span>
                      </CardDescription>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => (isPlaying.processed ? stopAudio("processed") : playAudio("processed"))}
                        disabled={!processedAudio}
                        className={cn(
                          "rounded-full w-12 h-12 transition-all duration-300 relative",
                          isPlaying.processed ? "bg-gray-200 dark:bg-gray-700" : "bg-green-50 dark:bg-green-900/20",
                          isPlaying.processed
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-green-600 dark:text-green-400",
                          "hover:shadow-lg hover:shadow-green-500/20",
                        )}
                      >
                        {isPlaying.processed ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="relative">
                      {processedAudio && <AudioVisualizer audioBuffer={processedAudio} />}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {isPlaying.processed && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-4 bg-green-500 dark:bg-green-400 rounded-full"
                                animate={{
                                  height: [4, 12, 4],
                                }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatType: "reverse",
                                  duration: 0.8,
                                  delay: i * 0.2,
                                  ease: "easeInOut",
                                }}
                              />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {originalAudio && processedAudio && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.7,
                delay: 0.7,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            style={{
              opacity: scrollY > 100 ? 1 : 0,
              transform: `translateY(${Math.max(0, 30 - scrollY / 10)}px)`,
            }}
          >
            <Card className="mt-8 border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 card-hover border-glow">
              <CardHeader className="pb-4 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <span className="mr-2">Comparison</span>
                  <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full">
                    Before & After
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                    className="space-y-3 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-5 w-5 text-red-500 dark:text-red-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        Original Waveform
                      </h3>
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-red-500/10 transition-shadow">
                      <AudioVisualizer audioBuffer={originalAudio} type="waveform" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                    className="space-y-3 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        Processed Waveform
                      </h3>
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-green-500/10 transition-shadow">
                      <AudioVisualizer audioBuffer={processedAudio} type="waveform" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                    className="space-y-3 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Waveform className="h-5 w-5 text-red-500 dark:text-red-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        Original Spectrogram
                      </h3>
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-red-500/10 transition-shadow">
                      <AudioVisualizer audioBuffer={originalAudio} type="spectrogram" />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                    className="space-y-3 group"
                  >
                    <div className="flex items-center space-x-2">
                      <Waveform className="h-5 w-5 text-green-500 dark:text-green-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        Processed Spectrogram
                      </h3>
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-lg group-hover:shadow-green-500/10 transition-shadow">
                      <AudioVisualizer audioBuffer={processedAudio} type="spectrogram" />
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.7,
              delay: 0.8,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          style={{
            opacity: scrollY > 200 ? 1 : 0,
            transform: `translateY(${Math.max(0, 30 - scrollY / 15)}px)`,
          }}
        >
          <Card className="mt-8 border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 card-hover border-glow">
            <CardHeader className="pb-4 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Info className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-gray-200 dark:border-gray-700">
                  <AccordionTrigger className="py-4 text-lg font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                    <span className="flex items-center">
                      <span className="mr-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                        <Waveform className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </span>
                      The LMS Algorithm
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 pb-4 pt-2 leading-relaxed">
                    <p className="mb-4">
                      The Least Mean Squares (LMS) algorithm is the core of our noise cancellation system. It works by:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 mb-4">
                      <li>Taking the original noise signal as input</li>
                      <li>Creating an adaptive filter that learns to predict the noise</li>
                      <li>Generating an "anti-noise" signal (opposite phase)</li>
                      <li>Combining the original and anti-noise signals to cancel each other out</li>
                    </ol>
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl text-center mb-4 font-mono shadow-inner">
                      <span className="text-red-600 dark:text-red-400">w(n+1) = w(n) - μ⋅e(n)⋅x(n)</span>
                    </div>
                    <p>
                      Where w are filter weights, μ is the step size, e is the error signal, and x is the input signal.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-gray-200 dark:border-gray-700">
                  <AccordionTrigger className="py-4 text-lg font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                    <span className="flex items-center">
                      <span className="mr-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                        <Sparkles className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </span>
                      AI Noise Classification
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 pb-4 pt-2 leading-relaxed">
                    <p className="mb-4">
                      Our system uses AI to analyze and classify the type of noise in your recording:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-lift">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Lawnmower/Periodic</h4>
                        <p>Filter length L=32</p>
                        <p>Step size μ=0.01</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-lift">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Traffic/Broadband</h4>
                        <p>Filter length L=128</p>
                        <p>Step size μ=0.005</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-lift">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">HVAC/Steady</h4>
                        <p>Filter length L=256</p>
                        <p>Step size μ=0.003</p>
                      </div>
                    </div>
                    <p>
                      This classification helps optimize the noise cancellation algorithm for your specific noise type.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-gray-200 dark:border-gray-700">
                  <AccordionTrigger className="py-4 text-lg font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                    <span className="flex items-center">
                      <span className="mr-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                        <Volume2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </span>
                      Visualizations
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 pb-4 pt-2 leading-relaxed">
                    <p className="mb-4">
                      We provide two types of visualizations to help you understand the noise cancellation process:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-lift">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Waveform</h4>
                        <p className="mb-2">
                          Shows the amplitude of the sound over time. Noise cancellation reduces the overall amplitude
                          of unwanted sounds.
                        </p>
                        <div className="h-12 w-full bg-red-100 dark:bg-red-900/30 rounded-lg overflow-hidden relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg viewBox="0 0 100 20" className="w-full h-full">
                              <path
                                d="M0,10 Q5,5 10,10 T20,10 T30,10 T40,10 T50,10 T60,10 T70,10 T80,10 T90,10 T100,10"
                                fill="none"
                                stroke="rgba(239, 68, 68, 0.8)"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover-lift">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Spectrogram</h4>
                        <p className="mb-2">
                          Shows the frequency content over time, with colors representing intensity. Effective noise
                          cancellation removes specific frequency bands associated with the noise.
                        </p>
                        <div className="h-12 w-full bg-gradient-to-r from-red-500 via-green-500 to-yellow-500 rounded-lg opacity-80"></div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="py-4 text-lg font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                    <span className="flex items-center">
                      <span className="mr-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                        <Info className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </span>
                      Array Configuration
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300 pb-4 pt-2 leading-relaxed">
                    <p className="mb-4">
                      In physical ANC systems, multiple microphones and speakers are arranged in arrays. The optimal
                      frequency range for cancellation is given by:
                    </p>
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl text-center mb-4 font-mono text-lg shadow-inner">
                      <span className="text-red-600 dark:text-red-400">
                        f<sub>-6dB</sub> = 343 / (2⋅D⋅S)
                      </span>
                    </div>
                    <p className="mb-2">Where:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>343 m/s is the speed of sound</li>
                      <li>D is the distance to the noise source</li>
                      <li>S is the spacing between devices</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer with Whisperwave branding */}
        <motion.footer
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center">
            <WhisperwaveLogo size={40} className="mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Whisperwave™ Advanced Noise Cancellation Technology
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-500 text-xs">
              © {new Date().getFullYear()} Whisperwave Inc. All rights reserved.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <a
                href="#"
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="#"
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="#"
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </motion.footer>
      </motion.div>
    </main>
  )
}


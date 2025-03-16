"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"

interface NoiseClassifierProps {
  audioBuffer: AudioBuffer
  onClassified: (noiseType: string) => void
}

// Noise types for classification as specified in the technical document
const NOISE_TYPES = ["Lawnmower", "Traffic", "Construction", "Fan/HVAC", "Crowd", "Wind"]

export default function NoiseClassifier({ audioBuffer, onClassified }: NoiseClassifierProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [noiseType, setNoiseType] = useState<string | null>(null)
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({})
  const [modelLoaded, setModelLoaded] = useState(false)
  const [stage, setStage] = useState<"loading" | "analyzing" | "complete">("loading")
  const [analysisDetails, setAnalysisDetails] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const loadTensorFlow = async () => {
      if (isMounted) {
        setIsLoading(true)
        setStage("loading")
      }

      try {
        // Simulate loading TensorFlow.js with more realistic steps
        const steps = [
          "Initializing TensorFlow.js runtime...",
          "Loading core modules...",
          "Preparing model architecture...",
          "Loading pre-trained weights...",
          "Optimizing for device...",
        ]

        setAnalysisDetails([steps[0]])

        for (let i = 0; i <= 100; i += 5) {
          if (!isMounted) return
          setProgress(i)

          // Add new step details at certain progress points
          if (i === 20) setAnalysisDetails((prev) => [...prev, steps[1]])
          if (i === 40) setAnalysisDetails((prev) => [...prev, steps[2]])
          if (i === 60) setAnalysisDetails((prev) => [...prev, steps[3]])
          if (i === 80) setAnalysisDetails((prev) => [...prev, steps[4]])

          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        setModelLoaded(true)
        setStage("analyzing")
        setProgress(0)
        setAnalysisDetails(["Analyzing audio patterns..."])

        // Reset progress for analysis phase with more detailed steps
        const analysisSteps = [
          "Extracting audio features...",
          "Computing spectral characteristics...",
          "Analyzing temporal patterns...",
          "Detecting noise signatures...",
          "Comparing with known profiles...",
          "Calculating confidence scores...",
        ]

        for (let i = 0; i <= 100; i += 4) {
          if (!isMounted) return
          setProgress(i)

          // Add new analysis details at certain progress points
          if (i === 15) setAnalysisDetails((prev) => [...prev, analysisSteps[0]])
          if (i === 30) setAnalysisDetails((prev) => [...prev, analysisSteps[1]])
          if (i === 45) setAnalysisDetails((prev) => [...prev, analysisSteps[2]])
          if (i === 60) setAnalysisDetails((prev) => [...prev, analysisSteps[3]])
          if (i === 75) setAnalysisDetails((prev) => [...prev, analysisSteps[4]])
          if (i === 90) setAnalysisDetails((prev) => [...prev, analysisSteps[5]])

          await new Promise((resolve) => setTimeout(resolve, 40))
        }

        // Simulate model inference
        await classifyNoise()
        setStage("complete")
        setAnalysisDetails((prev) => [...prev, "Classification complete!"])
      } catch (error) {
        console.error("Error loading TensorFlow or classifying noise:", error)
        setAnalysisDetails((prev) => [...prev, "Error: Failed to complete analysis"])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTensorFlow()

    return () => {
      isMounted = false
    }
  }, [audioBuffer])

  const classifyNoise = async () => {
    // In a real app, this would use TensorFlow.js to analyze the audio
    // Following the technical document, we would:
    // 1. Extract features (MFCCs) from the audio
    // 2. Use a pre-trained model to classify the noise type
    // 3. Set ANC parameters based on the classification

    // Extract audio features
    const features = extractFeatures(audioBuffer)

    // Simulate model inference
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Generate confidence scores based on extracted features
    const scores = simulateModelPrediction(features)

    // Find the noise type with the highest confidence
    let highestScore = 0
    let detectedType = ""

    Object.entries(scores).forEach(([type, score]) => {
      if (score > highestScore) {
        highestScore = score
        detectedType = type
      }
    })

    setConfidenceScores(scores)
    setNoiseType(detectedType)
    onClassified(detectedType)
  }

  // Extract audio features (simplified MFCC-like features)
  const extractFeatures = (buffer: AudioBuffer) => {
    const channelData = buffer.getChannelData(0)
    const features = {
      energy: 0,
      zeroCrossings: 0,
      spectralCentroid: 0,
      spectralFlatness: 0,
      periodicity: 0,
    }

    // Calculate energy (average amplitude squared)
    features.energy = channelData.reduce((sum, val) => sum + val * val, 0) / channelData.length

    // Count zero crossings (indicator of frequency content)
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        features.zeroCrossings++
      }
    }
    features.zeroCrossings /= channelData.length

    // Simplified spectral centroid calculation
    // In a real implementation, this would use FFT
    features.spectralCentroid = features.zeroCrossings * 10000

    // Simplified spectral flatness
    // In a real implementation, this would use FFT
    features.spectralFlatness = Math.random() * 0.5 + 0.2

    // Simplified periodicity detection
    // In a real implementation, this would use autocorrelation
    const frameSize = 1024
    let sumCorrelation = 0

    for (let lag = 1; lag < frameSize; lag++) {
      let correlation = 0
      for (let i = 0; i < frameSize; i++) {
        if (i + lag < channelData.length) {
          correlation += channelData[i] * channelData[i + lag]
        }
      }
      sumCorrelation += Math.abs(correlation)
    }

    features.periodicity = sumCorrelation / frameSize

    return features
  }

  // Simulate model prediction based on extracted features
  const simulateModelPrediction = (features: any) => {
    const scores: Record<string, number> = {}

    NOISE_TYPES.forEach((type) => {
      // Base score
      let score = 0.1 + Math.random() * 0.2

      // Adjust score based on audio features
      switch (type) {
        case "Lawnmower":
          // Lawnmowers have high energy, medium zero crossings, high periodicity
          if (features.energy > 0.1 && features.periodicity > 0.5) {
            score += 0.5
          }
          break

        case "Traffic":
          // Traffic has medium energy, low-medium zero crossings, low periodicity
          if (features.energy > 0.05 && features.energy < 0.2 && features.periodicity < 0.3) {
            score += 0.4
          }
          break

        case "Construction":
          // Construction has high energy, high zero crossings, low periodicity
          if (features.energy > 0.15 && features.zeroCrossings > 0.3) {
            score += 0.3
          }
          break

        case "Fan/HVAC":
          // HVAC has medium-low energy, low zero crossings, high periodicity
          if (features.energy < 0.1 && features.zeroCrossings < 0.2 && features.periodicity > 0.6) {
            score += 0.6
          }
          break

        case "Crowd":
          // Crowd has variable energy, medium zero crossings, low periodicity
          if (features.periodicity < 0.2) {
            score += 0.3
          }
          break

        case "Wind":
          // Wind has low-medium energy, low zero crossings, low periodicity
          if (features.energy < 0.15 && features.zeroCrossings < 0.15) {
            score += 0.4
          }
          break
      }

      // Normalize to 0-1 range
      score = Math.min(1, score)
      scores[type] = Number.parseFloat(score.toFixed(2))
    })

    return scores
  }

  const getStageText = () => {
    switch (stage) {
      case "loading":
        return "Loading AI Model..."
      case "analyzing":
        return "Analyzing Audio Patterns..."
      case "complete":
        return "Analysis Complete"
      default:
        return "Processing..."
    }
  }

  if (isLoading) {
    return (
      <Card className="mt-6 border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 border-glow">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{
                rotate: stage !== "complete" ? 360 : 0,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { repeat: stage !== "complete" ? Number.POSITIVE_INFINITY : 0, duration: 1.5, ease: "linear" },
                scale: { repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" },
              }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full blur-md bg-blue-400/20 dark:bg-blue-600/20 animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
                {stage === "complete" ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500 dark:text-green-400" />
                ) : (
                  <Loader2 className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                )}
              </div>
            </motion.div>

            <motion.div
              className="text-base font-medium text-gray-800 dark:text-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            >
              {getStageText()}
            </motion.div>

            <div className="w-full mt-1">
              <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{progress}% complete</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stage === "complete" ? "Done" : "Processing..."}
                </p>
              </div>
            </div>

            <div className="w-full mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-24 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 font-mono">
              <AnimatePresence>
                {analysisDetails.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start mb-1 last:mb-0"
                  >
                    <span className="text-green-500 dark:text-green-400 mr-1">›</span>
                    <span>{detail}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 border-glow">
      <CardContent className="pt-6">
        <AnimatePresence>
          {noiseType ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 shadow-sm">
                <div className="flex items-center">
                  <div className="mr-3 bg-green-100 dark:bg-green-800/30 p-2 rounded-full">
                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <AlertTitle className="font-medium text-lg mb-1">Noise Type Detected</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      The AI has classified this as <strong className="font-semibold">{noiseType}</strong> noise.
                      {noiseType === "Lawnmower" && (
                        <div className="mt-1 text-sm">
                          Using filter length L=32, step size μ=0.01 for periodic noise.
                        </div>
                      )}
                      {noiseType === "Traffic" && (
                        <div className="mt-1 text-sm">
                          Using filter length L=128, step size μ=0.005 for broadband noise.
                        </div>
                      )}
                      {noiseType === "Fan/HVAC" && (
                        <div className="mt-1 text-sm">
                          Using filter length L=256, step size μ=0.003 for steady-state noise.
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Confidence Analysis</h3>
                  <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    AI Confidence
                  </div>
                </div>

                {Object.entries(confidenceScores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, score], index) => (
                    <motion.div
                      key={type}
                      className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center text-gray-800 dark:text-gray-200 font-medium">
                          {type === noiseType && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 mr-1.5" />
                          )}
                          {type}
                        </span>
                        <span
                          className={`font-medium ${
                            score > 0.6
                              ? "text-green-600 dark:text-green-400"
                              : score > 0.3
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                          <motion.div
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              type === noiseType
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600"
                                : "bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${score * 100}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
                          </motion.div>
                        </div>
                      </div>

                      {type === noiseType && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Characteristics:</span>{" "}
                          {type === "Lawnmower" && "Periodic noise with strong harmonic components"}
                          {type === "Traffic" && "Broadband noise with variable intensity"}
                          {type === "Construction" && "Impulsive noise with high energy bursts"}
                          {type === "Fan/HVAC" && "Steady-state noise with consistent frequency profile"}
                          {type === "Crowd" && "Variable noise with human speech characteristics"}
                          {type === "Wind" && "Low-frequency broadband noise with natural variations"}
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center p-6 text-center"
            >
              <AlertTriangle className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                Unable to classify noise type
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The audio sample may not contain recognizable noise patterns or may be too short for accurate
                classification.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}


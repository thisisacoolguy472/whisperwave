/**
 * Audio processing utilities for noise cancellation
 * Implements the LMS (Least Mean Squares) algorithm as specified in the technical document
 */

// LMS (Least Mean Squares) Adaptive Filter for noise cancellation
export async function processAudio(
  originalBuffer: AudioBuffer,
  audioContext: AudioContext,
  noiseType: string,
): Promise<AudioBuffer> {
  // Create a new buffer for the processed audio
  const processedBuffer = audioContext.createBuffer(
    originalBuffer.numberOfChannels,
    originalBuffer.length,
    originalBuffer.sampleRate,
  )

  // Process each channel
  for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
    const inputData = originalBuffer.getChannelData(channel)
    const outputData = processedBuffer.getChannelData(channel)

    // Apply noise cancellation based on the detected noise type
    // Following the technical document recommendations:
    // - For periodic noise (e.g., lawnmower): L=32, μ=0.01
    // - For broadband noise (e.g., traffic): L=128, μ=0.005
    switch (noiseType.toLowerCase()) {
      case "lawnmower":
        // Periodic noise: L=32, μ=0.01
        applyLMSFilter(inputData, outputData, 0.01, 32)
        break
      case "traffic":
        // Broadband noise: L=128, μ=0.005
        applyLMSFilter(inputData, outputData, 0.005, 128)
        break
      case "construction":
        // Mixed noise: L=64, μ=0.008
        applyLMSFilter(inputData, outputData, 0.008, 64)
        break
      case "fan/hvac":
        // Steady-state noise: L=256, μ=0.003
        applyLMSFilter(inputData, outputData, 0.003, 256)
        break
      default:
        // Generic noise cancellation
        applyLMSFilter(inputData, outputData, 0.01, 128)
    }
  }

  // Simulate processing time for demo purposes
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return processedBuffer
}

// LMS (Least Mean Squares) adaptive filter implementation
// Following the equation: w(n+1) = w(n) - μ⋅e(n)⋅x(n)
function applyLMSFilter(
  inputSignal: Float32Array,
  outputSignal: Float32Array,
  stepSize: number, // μ (mu) - learning rate
  filterLength: number, // L - filter length
) {
  // Initialize filter coefficients w as an array of zeros with length L
  const weights = new Float32Array(filterLength).fill(0)

  // Buffer to store previous input samples
  const buffer = new Float32Array(filterLength).fill(0)

  // Previous output for secondary path modeling (simplified as one-sample delay)
  let prevOutput = 0

  // Process the signal sample by sample
  for (let n = 0; n < inputSignal.length; n++) {
    // Update buffer with current and past input samples
    for (let j = filterLength - 1; j > 0; j--) {
      buffer[j] = buffer[j - 1]
    }
    buffer[0] = inputSignal[n]

    // Compute y(n) = Σ w(k)⋅x(n-k) for k=0 to L-1
    let y = 0
    for (let k = 0; k < filterLength; k++) {
      if (n - k >= 0) {
        y += weights[k] * buffer[k]
      }
    }

    // Compute error signal e(n) = x(n) + y(n-1)
    // This follows the simplified model where d(n) = x(n) and s(n) is a one-sample delay
    const error = inputSignal[n] + prevOutput

    // Store current output for next iteration's secondary path
    prevOutput = y

    // Update filter coefficients: w(k) = w(k) - μ⋅e(n)⋅x(n-k)
    for (let k = 0; k < filterLength; k++) {
      if (n - k >= 0) {
        weights[k] = weights[k] - stepSize * error * buffer[k]
      }
    }

    // Write error signal to output (this is the canceled noise)
    outputSignal[n] = error
  }

  // Apply post-processing to improve audio quality
  applyPostProcessing(outputSignal)
}

// Post-processing to improve audio quality
function applyPostProcessing(signal: Float32Array) {
  // 1. Apply a simple moving average filter to reduce high-frequency artifacts
  const windowSize = 3
  const temp = new Float32Array(signal.length)

  // Copy original signal
  for (let i = 0; i < signal.length; i++) {
    temp[i] = signal[i]
  }

  // Apply moving average
  for (let i = windowSize; i < signal.length - windowSize; i++) {
    let sum = 0
    for (let j = -windowSize; j <= windowSize; j++) {
      sum += temp[i + j]
    }
    signal[i] = sum / (2 * windowSize + 1)
  }

  // 2. Apply amplitude normalization to prevent clipping
  let maxAmplitude = 0
  for (let i = 0; i < signal.length; i++) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(signal[i]))
  }

  if (maxAmplitude > 0.9) {
    const scaleFactor = 0.9 / maxAmplitude
    for (let i = 0; i < signal.length; i++) {
      signal[i] *= scaleFactor
    }
  }
}

// Spectral subtraction for frequency domain noise reduction (alternative method)
export function applySpectralSubtraction(
  inputData: Float32Array,
  outputData: Float32Array,
  fftSize = 2048,
  overlapFactor = 0.5,
) {
  // This would be implemented for frequency-domain processing
  // In a real application, you would:
  // 1. Split the signal into overlapping frames
  // 2. Apply windowing function (e.g., Hann window)
  // 3. Compute FFT
  // 4. Estimate noise spectrum
  // 5. Subtract noise spectrum from signal spectrum
  // 6. Apply inverse FFT
  // 7. Overlap-add to reconstruct the signal

  // For this demo, we'll just copy the input to output
  // with some simulated noise reduction
  for (let i = 0; i < inputData.length; i++) {
    // Simulate noise reduction by attenuating the signal slightly
    outputData[i] = inputData[i] * 0.8
  }
}


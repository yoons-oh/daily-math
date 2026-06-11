type Tfjs = typeof import('@tensorflow/tfjs')

let tfPromise: Promise<Tfjs> | null = null
let modelPromise: Promise<import('@tensorflow/tfjs').LayersModel | null> | null = null
let modelAvailabilityPromise: Promise<boolean> | null = null

function loadTf() {
  if (!tfPromise) tfPromise = import('@tensorflow/tfjs')
  return tfPromise
}

async function loadDigitModel(): Promise<import('@tensorflow/tfjs').LayersModel | null> {
  if (!modelAvailabilityPromise) {
    modelAvailabilityPromise = fetch('/models/digit-recognizer/model.json', { method: 'HEAD' })
      .then(response => response.ok)
      .catch(() => false)
  }
  const hasModel = await modelAvailabilityPromise
  if (!hasModel) return null

  if (!modelPromise) {
    modelPromise = loadTf()
      .then(tf => tf.loadLayersModel('/models/digit-recognizer/model.json'))
      .catch(() => null)
  }
  return modelPromise
}

export interface DigitPrediction {
  digit: string
  confidence: number
  source: 'model' | 'fallback'
}

export type DigitPoint = { x: number; y: number }
export type DigitStroke = DigitPoint[]

export async function recognizeDigit(canvas: HTMLCanvasElement, strokes: DigitStroke[] = []): Promise<DigitPrediction | null> {
  const model = await loadDigitModel()

  if (model) {
    const tf = await loadTf()
    const prediction = tf.tidy(() => {
      const input = tf.browser
        .fromPixels(canvas, 1)
        .resizeBilinear([28, 28])
        .toFloat()
        .div(255)
        .reshape([1, 28, 28, 1])
      return model.predict(input) as import('@tensorflow/tfjs').Tensor
    })

    const scores = Array.from(await prediction.data())
    prediction.dispose()

    const best = scores.reduce(
      (acc, score, digit) => score > acc.score ? { digit, score } : acc,
      { digit: 0, score: -Infinity },
    )

    return { digit: String(best.digit), confidence: best.score, source: 'model' }
  }

  return recognizeDigitFallback(canvas, strokes)
}

function recognizeDigitFallback(canvas: HTMLCanvasElement, strokes: DigitStroke[] = []): DigitPrediction | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data
  const points: Array<{ x: number; y: number }> = []

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4
      if (data[i + 3] > 20) points.push({ x, y })
    }
  }

  if (points.length < 12) return null

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  points.forEach(point => {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  })

  const boxW = Math.max(1, maxX - minX)
  const boxH = Math.max(1, maxY - minY)
  const strokeStats = getStrokeStats(strokes)
  const aspect = boxW / boxH
  const topCount = points.filter(p => p.y < minY + boxH * 0.28).length
  const midCount = points.filter(p => p.y >= minY + boxH * 0.36 && p.y <= minY + boxH * 0.64).length
  const bottomCount = points.filter(p => p.y > minY + boxH * 0.72).length
  const upperMidCount = points.filter(p => p.y >= minY + boxH * 0.22 && p.y <= minY + boxH * 0.48).length
  const lowerMidCount = points.filter(p => p.y >= minY + boxH * 0.52 && p.y <= minY + boxH * 0.78).length
  const upperLeftCount = points.filter(p => p.y < minY + boxH * 0.5 && p.x < minX + boxW * 0.45).length
  const upperRightCount = points.filter(p => p.y < minY + boxH * 0.5 && p.x > minX + boxW * 0.55).length
  const lowerRightCount = points.filter(p => p.y > minY + boxH * 0.48 && p.x > minX + boxW * 0.55).length
  const lowerLeftCount = points.filter(p => p.y > minY + boxH * 0.48 && p.x < minX + boxW * 0.45).length
  const topLeftCount = points.filter(p => p.y < minY + boxH * 0.24 && p.x < minX + boxW * 0.45).length
  const topRightCount = points.filter(p => p.y < minY + boxH * 0.24 && p.x > minX + boxW * 0.55).length
  const waistCount = points.filter(
    p =>
      p.y >= minY + boxH * 0.42 &&
      p.y <= minY + boxH * 0.58 &&
      p.x >= minX + boxW * 0.28 &&
      p.x <= minX + boxW * 0.72,
  ).length
  const leftCount = points.filter(p => p.x < minX + boxW * 0.33).length
  const centerCount = points.filter(p => p.x >= minX + boxW * 0.33 && p.x <= minX + boxW * 0.67).length
  const rightCount = points.filter(p => p.x > minX + boxW * 0.67).length
  const density = points.length / ((boxW / 2) * (boxH / 2))
  const verticalBalance = Math.min(topCount, midCount, bottomCount) / Math.max(topCount, midCount, bottomCount, 1)
  const sideBalance = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount, 1)
  const hasTwoRoundedLobes =
    upperMidCount > points.length * 0.18 &&
    lowerMidCount > points.length * 0.18 &&
    waistCount > points.length * 0.09 &&
    verticalBalance > 0.42 &&
    sideBalance > 0.58 &&
    aspect > 0.38 &&
    aspect < 0.95
  const hasNineLoopAndTail =
    upperMidCount > points.length * 0.22 &&
    upperRightCount > points.length * 0.16 &&
    (upperLeftCount > points.length * 0.07 || waistCount > points.length * 0.08) &&
    lowerRightCount > lowerLeftCount * 1.35 &&
    rightCount > leftCount * 1.05 &&
    bottomCount > points.length * 0.12 &&
    aspect > 0.35 &&
    aspect < 0.9
  const hasSevenTopAndTail =
    topCount > points.length * 0.18 &&
    topLeftCount > points.length * 0.05 &&
    topRightCount > points.length * 0.05 &&
    lowerRightCount > lowerLeftCount * 1.25 &&
    rightCount > leftCount * 1.15 &&
    waistCount < points.length * 0.1 &&
    upperMidCount < points.length * 0.24 &&
    verticalBalance < 0.55 &&
    aspect > 0.3

  let digit = '1'
  let confidence = 0.42

  if (strokeStats) {
    if (
      strokeStats.aspect < 0.34 &&
      strokeStats.totalDistance > boxH * 0.55 &&
      strokeStats.horizontalTravel < strokeStats.verticalTravel * 0.42
    ) {
      return { digit: '1', confidence: 0.7, source: 'fallback' }
    }

    if (
      strokeStats.strokeCount <= 2 &&
      strokeStats.hasTopHorizontal &&
      strokeStats.diagonalDown &&
      strokeStats.endY > strokeStats.startY + boxH * 0.42 &&
      strokeStats.endX < strokeStats.startX + boxW * 0.28
    ) {
      return { digit: '7', confidence: 0.68, source: 'fallback' }
    }

    if (
      strokeStats.strokeCount >= 2 &&
      strokeStats.hasMiddleHorizontal &&
      strokeStats.hasLeftVertical &&
      strokeStats.hasRightVertical &&
      aspect > 0.42 &&
      aspect < 1.15
    ) {
      return { digit: '4', confidence: 0.66, source: 'fallback' }
    }

    if (
      strokeStats.closedness < Math.max(boxW, boxH) * 0.24 &&
      sideBalance > 0.58 &&
      verticalBalance > 0.42 &&
      aspect > 0.42 &&
      aspect < 1.05
    ) {
      const topHeavy = topCount > bottomCount * 1.25 && lowerRightCount > lowerLeftCount * 1.15
      return { digit: topHeavy ? '9' : '0', confidence: 0.62, source: 'fallback' }
    }
  }

  if (aspect < 0.36 && centerCount > leftCount + rightCount) {
    digit = '1'
    confidence = 0.62
  } else if (hasSevenTopAndTail) {
    digit = '7'
    confidence = 0.6
  } else if (hasNineLoopAndTail && !hasTwoRoundedLobes) {
    digit = '9'
    confidence = 0.58
  } else if (hasTwoRoundedLobes || (density > 0.38 && sideBalance > 0.7 && verticalBalance > 0.5 && waistCount > points.length * 0.08)) {
    digit = '8'
    confidence = hasTwoRoundedLobes ? 0.64 : 0.52
  } else if (topCount > midCount * 0.95 && bottomCount > midCount * 0.85) {
    digit = leftCount > rightCount ? '5' : '3'
    confidence = 0.46
  } else if (rightCount > leftCount * 1.6 && topCount > bottomCount * 0.7) {
    digit = '7'
    confidence = 0.48
  } else if (leftCount > rightCount * 1.25 && bottomCount > topCount * 0.75) {
    digit = '6'
    confidence = 0.45
  } else if (rightCount > leftCount * 1.2 && bottomCount > topCount * 1.1) {
    digit = '2'
    confidence = 0.45
  } else if (midCount > topCount * 1.2 && midCount > bottomCount * 1.2) {
    digit = '4'
    confidence = 0.43
  } else if (Math.abs(leftCount - rightCount) < points.length * 0.18 && aspect > 0.45) {
    digit = '0'
    confidence = 0.43
  }

  return { digit, confidence, source: 'fallback' }
}

function getStrokeStats(strokes: DigitStroke[]) {
  const all = strokes.flat()
  if (all.length < 2) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  all.forEach(point => {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  })

  const boxW = Math.max(1, maxX - minX)
  const boxH = Math.max(1, maxY - minY)
  let totalDistance = 0
  let horizontalTravel = 0
  let verticalTravel = 0
  let topHorizontalLength = 0
  let middleHorizontalLength = 0
  let leftVerticalLength = 0
  let rightVerticalLength = 0
  let diagonalDownLength = 0

  strokes.forEach(stroke => {
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1]
      const b = stroke[i]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      totalDistance += dist
      horizontalTravel += Math.abs(dx)
      verticalTravel += Math.abs(dy)

      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      if (Math.abs(dx) > Math.abs(dy) * 1.8 && midY < minY + boxH * 0.28) topHorizontalLength += dist
      if (Math.abs(dx) > Math.abs(dy) * 1.8 && midY > minY + boxH * 0.36 && midY < minY + boxH * 0.66) middleHorizontalLength += dist
      if (Math.abs(dy) > Math.abs(dx) * 1.35 && midX < minX + boxW * 0.42) leftVerticalLength += dist
      if (Math.abs(dy) > Math.abs(dx) * 1.35 && midX > minX + boxW * 0.58) rightVerticalLength += dist
      if (dy > Math.abs(dx) * 0.55 && Math.abs(dx) > boxW * 0.01) diagonalDownLength += dist
    }
  })

  const first = all[0]
  const last = all[all.length - 1]

  return {
    strokeCount: strokes.length,
    aspect: boxW / boxH,
    totalDistance,
    horizontalTravel,
    verticalTravel,
    startX: first.x,
    startY: first.y,
    endX: last.x,
    endY: last.y,
    closedness: Math.hypot(last.x - first.x, last.y - first.y),
    hasTopHorizontal: topHorizontalLength > boxW * 0.28,
    hasMiddleHorizontal: middleHorizontalLength > boxW * 0.22,
    hasLeftVertical: leftVerticalLength > boxH * 0.22,
    hasRightVertical: rightVerticalLength > boxH * 0.18,
    diagonalDown: diagonalDownLength > Math.max(boxW, boxH) * 0.28,
  }
}

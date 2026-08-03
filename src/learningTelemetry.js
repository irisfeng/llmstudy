export const ENGAGEMENT_VISIBLE_MS = 5 * 60 * 1000
export const DEPTH_MILESTONES = [25, 50, 75, 90]

const clampDepth = depth => Math.max(0, Math.min(100, Number.isFinite(depth) ? depth : 0))

export function createLessonTelemetryState() {
  return { visibleMs: 0, maxDepth: 0, engaged: false, depthsReached: [] }
}

export function advanceLessonTelemetry(previous, sample) {
  const visibleMs = Math.max(previous.visibleMs, Number.isFinite(sample.visibleMs) ? sample.visibleMs : 0)
  const maxDepth = Math.max(previous.maxDepth, clampDepth(sample.depth))
  const depthsReached = DEPTH_MILESTONES.filter(
    milestone => milestone <= maxDepth && !previous.depthsReached.includes(milestone),
  )
  const engaged = previous.engaged || visibleMs >= ENGAGEMENT_VISIBLE_MS || maxDepth >= 50

  return {
    state: {
      visibleMs,
      maxDepth,
      engaged,
      depthsReached: [...previous.depthsReached, ...depthsReached],
    },
    engagedNow: engaged && !previous.engaged,
    depthsReached,
  }
}

export function noteLengthBucket(note) {
  const length = String(note || '').trim().length
  if (length === 0) return 'empty'
  if (length < 50) return '1-49'
  if (length < 200) return '50-199'
  if (length < 500) return '200-499'
  return '500+'
}

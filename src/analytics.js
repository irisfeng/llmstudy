import { track } from '@vercel/analytics'
import { inferAiPlatform } from './aiReferrers.js'

const safeValue = value => {
  if (typeof value === 'boolean' || typeof value === 'number') return value
  return String(value ?? '').slice(0, 120)
}

export function trackEvent(name, properties = {}) {
  if (import.meta.env.DEV) return
  try {
    track(name, Object.fromEntries(
      Object.entries(properties)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, safeValue(value)]),
    ))
  } catch (_) {
    // Analytics must never interrupt learning.
  }
}

export function trackCampaignLanding() {
  const params = new URLSearchParams(location.search)
  const source = params.get('utm_source')
  if (!source || sessionStorage.getItem('uth-campaign-tracked') === '1') return
  sessionStorage.setItem('uth-campaign-tracked', '1')
  trackEvent('campaign_landing', {
    source,
    medium: params.get('utm_medium') || 'unknown',
    campaign: params.get('utm_campaign') || 'unknown',
    content: params.get('utm_content') || undefined,
  })
}

export function trackAiReferralLanding() {
  if (sessionStorage.getItem('uth-ai-referrer-tracked') === '1') return
  const referral = inferAiPlatform(document.referrer)
  if (!referral) return
  sessionStorage.setItem('uth-ai-referrer-tracked', '1')
  const lesson = location.pathname.match(/\/lesson\/(\d+)-(\d+)-/)?.slice(1).join('.')
  trackEvent('ai_referral_landing', {
    platform: referral.platform,
    referrer_host: referral.hostname,
    landing_path: location.pathname,
    locale: location.pathname.match(/^\/(zh|en)\//)?.[1] || 'unknown',
    lesson_id: lesson,
  })
}

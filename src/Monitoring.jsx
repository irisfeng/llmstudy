import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { trackAiReferralLanding, trackCampaignLanding } from './analytics.js'

export default function Monitoring() {
  useEffect(() => {
    trackCampaignLanding()
    trackAiReferralLanding()

    const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim()
    if (!projectId || document.querySelector('script[data-uth-clarity]')) return

    window.clarity = window.clarity || function clarity(...args) {
      (window.clarity.q = window.clarity.q || []).push(args)
    }
    const script = document.createElement('script')
    script.async = true
    script.dataset.uthClarity = 'true'
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`
    document.head.appendChild(script)
  }, [])

  return <Analytics />
}

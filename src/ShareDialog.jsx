import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowClockwise, CopySimple, DownloadSimple, ShareNetwork, WechatLogo, X,
} from '@phosphor-icons/react'
import { trackEvent } from './analytics.js'
import { useI18n } from './i18n.jsx'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1440

const cleanCardText = value => String(value || '')
  .replaceAll('—', '-')
  .replaceAll('–', '-')
  .replace(/\s+/g, ' ')
  .trim()

const shareUrl = ({ pathname, lessonId, surface, channel }) => {
  const url = new URL(pathname, location.origin)
  url.search = ''
  url.hash = ''
  url.searchParams.set('utm_source', channel === 'wechat' ? 'wechat_card' : 'learner_share')
  url.searchParams.set('utm_medium', channel === 'wechat' ? 'social' : 'referral')
  url.searchParams.set('utm_campaign', 'organic_growth')
  url.searchParams.set('utm_content', lessonId ? `lesson_${lessonId}` : surface)
  return url.toString()
}

const textSegments = (text, locale) => {
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter(locale === 'zh' ? 'zh-CN' : 'en', { granularity: 'word' }).segment(text)].map(item => item.segment)
  }
  return Array.from(text)
}

const drawWrappedText = (context, value, { x, y, maxWidth, lineHeight, maxLines, locale }) => {
  const segments = textSegments(cleanCardText(value), locale)
  const lines = []
  let current = ''
  let truncated = false
  for (const segment of segments) {
    const candidate = `${current}${segment}`
    if (current && context.measureText(candidate).width > maxWidth) {
      if (lines.length === maxLines - 1) {
        truncated = true
        break
      }
      lines.push(current.trim())
      current = segment.trimStart()
    } else current = candidate
  }
  if (lines.length < maxLines && current.trim()) lines.push(current.trim())
  const used = lines.slice(0, maxLines)
  if (truncated && used.length) {
    let last = used[used.length - 1]
    while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    used[used.length - 1] = `${last.trim()}…`
  }
  used.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return y + used.length * lineHeight
}

async function makeShareCard({ title, description, lessonId, trackId, locale, url }) {
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  const accent = '#39d7a4'
  const background = '#07110e'
  const panel = '#0d1c17'
  const text = '#edf2ef'
  const muted = '#9aaca4'

  context.fillStyle = background
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  const wash = context.createRadialGradient(860, 170, 20, 860, 170, 620)
  wash.addColorStop(0, 'rgba(57, 215, 164, .18)')
  wash.addColorStop(1, 'rgba(57, 215, 164, 0)')
  context.fillStyle = wash
  context.fillRect(0, 0, CARD_WIDTH, 760)

  context.strokeStyle = '#1d382f'
  context.lineWidth = 2
  context.strokeRect(54, 54, CARD_WIDTH - 108, CARD_HEIGHT - 108)

  context.strokeStyle = accent
  context.lineWidth = 4
  context.strokeRect(88, 88, 58, 58)
  context.fillStyle = accent
  context.font = '700 38px "IBM Plex Mono", monospace'
  context.textAlign = 'center'
  context.fillText('μ', 117, 132)
  context.textAlign = 'left'
  context.font = '700 25px "Noto Sans SC", system-ui, sans-serif'
  context.fillText('UNDER THE HOOD', 170, 112)
  context.fillStyle = muted
  context.font = '500 18px "IBM Plex Mono", monospace'
  context.fillText(locale === 'zh' ? '免费双语 AI 系统课' : 'FREE BILINGUAL AI SYSTEMS COURSE', 170, 141)

  const isWorld = trackId === 'world-models'
  context.fillStyle = accent
  context.font = '600 22px "IBM Plex Mono", monospace'
  context.fillText(`${isWorld ? 'WORLD MODELS' : 'LLM SYSTEMS'}${lessonId ? `  /  LESSON ${lessonId}` : ''}`, 88, 248)

  context.fillStyle = text
  context.font = `700 ${locale === 'zh' ? 78 : 72}px "Noto Sans SC", system-ui, sans-serif`
  const titleEnd = drawWrappedText(context, title, {
    x: 88, y: 346, maxWidth: 884, lineHeight: locale === 'zh' ? 112 : 100, maxLines: 4, locale,
  })

  context.fillStyle = muted
  context.font = `400 ${locale === 'zh' ? 31 : 29}px "Noto Sans SC", system-ui, sans-serif`
  drawWrappedText(context, description, {
    x: 88, y: Math.max(titleEnd + 42, 640), maxWidth: 820, lineHeight: 52, maxLines: 4, locale,
  })

  context.fillStyle = panel
  context.fillRect(88, 1080, 904, 272)
  context.fillStyle = accent
  context.font = '600 24px "Noto Sans SC", system-ui, sans-serif'
  context.fillText(locale === 'zh' ? '扫码打开本节课' : 'SCAN TO OPEN THIS LESSON', 126, 1150)
  context.fillStyle = text
  context.font = '700 34px "Noto Sans SC", system-ui, sans-serif'
  context.fillText(locale === 'zh' ? '从原理到系统，亲手学会。' : 'Learn it from first principles.', 126, 1203)
  context.fillStyle = muted
  context.font = '500 19px "IBM Plex Mono", monospace'
  context.fillText('llmstudy.shddai.net', 126, 1262)

  const qrModule = await import('qrcode')
  const QRCode = qrModule.default || qrModule
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, url, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#07110eff', light: '#edf2efff' },
  })
  context.fillStyle = '#edf2ef'
  context.fillRect(742, 1106, 224, 224)
  context.drawImage(qrCanvas, 744, 1108, 220, 220)

  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Share card image could not be created.')),
    'image/png',
    0.94,
  ))
}

const copyPlainText = async value => {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

function ShareDialog({ title, text, surface, lessonId, trackId, onClose }) {
  const { locale, pick } = useI18n()
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const closeRef = useRef(null)
  const linkUrl = useMemo(() => shareUrl({ pathname: location.pathname, lessonId, surface, channel: 'link' }), [lessonId, surface])
  const cardUrl = useMemo(() => shareUrl({ pathname: location.pathname, lessonId, surface, channel: 'wechat' }), [lessonId, surface])

  const generate = async () => {
    setError('')
    setMessage('')
    setCard(null)
    try {
      const blob = await makeShareCard({ title, description: text, lessonId, trackId, locale, url: cardUrl })
      setCard({ blob, url: URL.createObjectURL(blob) })
      trackEvent('share_card_ready', { surface, lesson_id: lessonId, locale })
    } catch (shareError) {
      setError(pick('卡片生成失败，请重试或直接复制链接。', 'Card generation failed. Retry or copy the link instead.'))
      trackEvent('content_share_failed', { method: 'card_generate', surface, lesson_id: lessonId })
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = event => event.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    closeRef.current?.focus()
    generate()
    return () => {
      document.body.style.overflow = previousOverflow
      removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => () => card?.url && URL.revokeObjectURL(card.url), [card?.url])

  const downloadCard = () => {
    if (!card) return
    const anchor = document.createElement('a')
    anchor.href = card.url
    anchor.download = `llmstudy-${lessonId || surface}-${locale}.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setMessage(pick('微信卡片已保存，可直接发送到聊天或朋友圈。', 'Card saved. It is ready to send in WeChat or another app.'))
    trackEvent('content_shared', { method: 'card_download', surface, lesson_id: lessonId })
  }

  const shareCard = async () => {
    if (!card) return
    const file = new File([card.blob], `llmstudy-${lessonId || surface}-${locale}.png`, { type: 'image/png' })
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `${text}\n${cardUrl}` })
        setMessage(pick('系统分享已打开，请选择微信。', 'The share sheet is open. Choose WeChat or another app.'))
        trackEvent('content_shared', { method: 'card_native', surface, lesson_id: lessonId })
      } else downloadCard()
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError(pick('系统分享未完成，请保存图片后发送。', 'System sharing did not complete. Save the image and send it manually.'))
    }
  }

  const copyLink = async () => {
    try {
      await copyPlainText(linkUrl)
      setMessage(pick('课程链接已复制。', 'Course link copied.'))
      trackEvent('content_shared', { method: 'link_copy', surface, lesson_id: lessonId })
    } catch (_) {
      setError(pick('复制失败，请手动选择下方链接。', 'Copy failed. Select the link below manually.'))
    }
  }

  return <div className="share-backdrop" onMouseDown={onClose}>
    <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" onMouseDown={event => event.stopPropagation()}>
      <header>
        <div><span className="section-no">WECHAT SHARE CARD</span><h2 id="share-dialog-title">{pick('把这一课分享出去', 'Share this lesson')}</h2></div>
        <button ref={closeRef} className="icon-button" onClick={onClose} aria-label={pick('关闭分享面板', 'Close share panel')}><X /></button>
      </header>
      <div className="share-dialog-body">
        <div className={`share-card-frame ${card ? 'ready' : ''}`}>
          {card ? <img src={card.url} alt={pick(`${title} 微信分享卡片`, `Share card for ${title}`)} data-share-card-preview /> : error ? <div className="share-card-error"><p>{error}</p><button onClick={generate}><ArrowClockwise />{pick('重新生成', 'Try again')}</button></div> : <div className="share-card-skeleton" aria-label={pick('正在生成分享卡片', 'Generating share card')}><i /><i /><i /><b /></div>}
        </div>
        <div className="share-options">
          <WechatLogo weight="fill" />
          <h3>{pick('二维码已放在右下角', 'QR code included in the corner')}</h3>
          <p>{pick('手机可从系统分享中选择微信。电脑端保存图片后，发送到聊天或朋友圈。', 'On mobile, choose WeChat from the share sheet. On desktop, save the image and send it from WeChat.')}</p>
          <button className="share-primary" onClick={shareCard} disabled={!card}><ShareNetwork weight="bold" />{pick('分享到微信', 'Share card')}</button>
          <button className="share-secondary" onClick={downloadCard} disabled={!card}><DownloadSimple />{pick('保存卡片', 'Save image')}</button>
          <button className="share-secondary" onClick={copyLink}><CopySimple />{pick('复制课程链接', 'Copy course link')}</button>
          <label className="share-url"><span>{pick('可追踪课程链接', 'Trackable course link')}</span><input value={linkUrl} readOnly data-share-url onFocus={event => event.currentTarget.select()} /></label>
          <p className={`share-message ${error ? 'error' : ''}`} aria-live="polite">{message || error}</p>
        </div>
      </div>
    </section>
  </div>
}

export function ShareButton({ title, text, surface = 'home', lessonId = null, trackId = 'llm', compact = false }) {
  const { pick } = useI18n()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const openDialog = () => {
    setOpen(true)
    trackEvent('share_panel_opened', { surface, lesson_id: lessonId })
  }
  const closeDialog = () => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  return <>
    <button ref={triggerRef} className={`share-button ${compact ? 'compact' : ''}`} data-share-button onClick={openDialog} aria-haspopup="dialog" aria-expanded={open} aria-label={pick(lessonId ? '分享本节课' : '分享课程', lessonId ? 'Share this lesson' : 'Share course')} title={compact ? pick('分享本节课', 'Share this lesson') : undefined}>
      <ShareNetwork /> {!compact && pick('分享课程', 'Share course')}
    </button>
    {open && createPortal(<ShareDialog title={title} text={text} surface={surface} lessonId={lessonId} trackId={trackId} onClose={closeDialog} />, document.body)}
  </>
}

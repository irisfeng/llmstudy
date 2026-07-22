import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight, Check, Cloud, CloudCheck, CloudSlash, EnvelopeSimple, Eye, EyeSlash,
  LockKey, SignIn, SignOut, SpinnerGap, UserCircle, X,
} from '@phosphor-icons/react'
import { getSupabase, isCloudConfigured } from './lib/supabase.js'
import { useI18n } from './i18n.jsx'
import { trackEvent } from './analytics.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isCloudConfigured)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!isCloudConfigured) return
    let active = true
    let subscription
    getSupabase().then(client => {
      if (!active || !client) return
      client.auth.getSession().then(({ data }) => {
        if (active) {
          setSession(data.session)
          setLoading(false)
        }
      })
      const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
        if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      })
      subscription = listener.subscription
    })
    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    configured: isCloudConfigured,
    session,
    user: session?.user || null,
    loading,
    recovery,
    clearRecovery: () => setRecovery(false),
  }), [session, loading, recovery])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useLearningSync({ lessonIds, completed, setCompleted, theme, setTheme }) {
  const { user, configured } = useAuth()
  const [status, setStatus] = useState(configured ? 'local' : 'unavailable')
  const [lastSynced, setLastSynced] = useState(null)
  const [retryTick, setRetryTick] = useState(0)
  const initialUser = useRef(null)
  const pendingNotes = useRef(new Map())
  const noteTimers = useRef(new Map())

  const markError = useCallback(() => {
    initialUser.current = null
    setStatus('offline')
  }, [])

  useEffect(() => {
    const retry = () => setRetryTick(value => value + 1)
    addEventListener('online', retry)
    return () => removeEventListener('online', retry)
  }, [])

  const upsertLesson = useCallback(async (lessonId, patch) => {
    if (!user) return
    const supabase = await getSupabase()
    if (!supabase) return
    setStatus('syncing')
    const payload = {
      user_id: user.id,
      lesson_id: lessonId,
      updated_at: new Date().toISOString(),
      ...patch,
    }
    const { error } = await supabase.from('lesson_state').upsert(payload, { onConflict: 'user_id,lesson_id' })
    if (error) return markError()
    setLastSynced(new Date())
    setStatus('synced')
  }, [user, markError])

  const saveLesson = useCallback((lessonId, patch, { debounce = false } = {}) => {
    if (!user) return
    if (!debounce) {
      upsertLesson(lessonId, patch)
      return
    }
    pendingNotes.current.set(lessonId, { ...(pendingNotes.current.get(lessonId) || {}), ...patch })
    clearTimeout(noteTimers.current.get(lessonId))
    noteTimers.current.set(lessonId, setTimeout(() => {
      const pending = pendingNotes.current.get(lessonId)
      pendingNotes.current.delete(lessonId)
      noteTimers.current.delete(lessonId)
      if (pending) upsertLesson(lessonId, pending)
    }, 850))
  }, [user, upsertLesson])

  const saveProfile = useCallback(async patch => {
    if (!user) return
    const supabase = await getSupabase()
    if (!supabase) return
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      updated_at: new Date().toISOString(),
      ...patch,
    }, { onConflict: 'user_id' })
    if (error) markError()
  }, [user, markError])

  useEffect(() => {
    if (!user || !configured || initialUser.current === user.id) {
      if (!user) {
        initialUser.current = null
        setStatus(configured ? 'local' : 'unavailable')
      }
      return
    }
    let cancelled = false

    async function hydrate() {
      setStatus('syncing')
      const supabase = await getSupabase()
      if (!supabase || cancelled) return
      const [{ data: cloudRows, error: lessonError }, { data: profile, error: profileError }] = await Promise.all([
        supabase.from('lesson_state').select('lesson_id,completed,note,current_section,quiz_result,last_opened_at,completed_at,updated_at'),
        supabase.from('profiles').select('theme,network_mode,last_lesson_id').maybeSingle(),
      ])
      if (cancelled) return
      if (lessonError || profileError) {
        markError()
        return
      }

      const cloudById = new Map((cloudRows || []).map(row => [row.lesson_id, row]))
      const mergedCompleted = new Set(completed)
      const imports = []

      lessonIds.forEach(lessonId => {
        const cloud = cloudById.get(lessonId)
        const localComplete = localStorage.getItem(`uth-lesson-${lessonId}-complete`) === '1'
        const localNote = localStorage.getItem(`uth-lesson-${lessonId}-note`) || ''
        const localNoteUpdated = localStorage.getItem(`uth-lesson-${lessonId}-note-updated`)
        const localNoteIsNewer = Boolean(
          localNote && cloud?.note && localNoteUpdated &&
          Date.parse(localNoteUpdated) > Date.parse(cloud.updated_at),
        )
        if (cloud?.completed || localComplete) {
          mergedCompleted.add(lessonId)
          localStorage.setItem(`uth-lesson-${lessonId}-complete`, '1')
        }
        if (cloud?.note && !localNoteIsNewer) {
          localStorage.setItem(`uth-lesson-${lessonId}-note`, cloud.note)
          localStorage.setItem(`uth-lesson-${lessonId}-note-updated`, cloud.updated_at)
          dispatchEvent(new CustomEvent('uth-learning-sync', { detail: { lessonId, note: cloud.note } }))
        }
        if (!cloud && (localComplete || localNote)) {
          imports.push({
            user_id: user.id,
            lesson_id: lessonId,
            completed: localComplete,
            note: localNote,
            completed_at: localComplete ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
        } else if (cloud) {
          const next = { ...cloud, user_id: user.id, lesson_id: lessonId }
          let changed = false
          if (localComplete && !cloud.completed) {
            next.completed = true
            next.completed_at = new Date().toISOString()
            changed = true
          }
          if (localNote && (!cloud.note || localNoteIsNewer)) {
            next.note = localNote
            changed = true
          }
          if (changed) {
            next.updated_at = new Date().toISOString()
            imports.push(next)
          }
        }
      })

      setCompleted(mergedCompleted)
      if (profile?.theme === 'dark' || profile?.theme === 'light') setTheme(profile.theme)
      if (profile?.network_mode) localStorage.setItem('uth-network', profile.network_mode)

      if (imports.length) {
        const { error } = await supabase.from('lesson_state').upsert(imports, { onConflict: 'user_id,lesson_id' })
        if (error) {
          markError()
          return
        }
      }
      if (!profile) await saveProfile({ theme, network_mode: localStorage.getItem('uth-network') || 'cn' })
      if (!cancelled) {
        initialUser.current = user.id
        setLastSynced(new Date())
        setStatus('synced')
      }
    }
    hydrate()
    return () => { cancelled = true }
  }, [user, lessonIds, completed, setCompleted, theme, setTheme, configured, markError, saveProfile, retryTick])

  useEffect(() => {
    if (user && initialUser.current === user.id) saveProfile({ theme })
  }, [theme, user, saveProfile])

  useEffect(() => () => {
    noteTimers.current.forEach(clearTimeout)
  }, [])

  return { status, lastSynced, saveLesson, saveProfile }
}

const statusCopy = {
  unavailable: ['本机保存', '云同步尚未配置'],
  local: ['本机已保存', '登录后同步到云端'],
  syncing: ['正在同步', '请稍候…'],
  synced: ['云端已同步', '多设备进度一致'],
  offline: ['本机已保存', '网络恢复后可继续同步'],
}

const statusCopyEn = {
  unavailable: ['Saved locally', 'Cloud sync is not configured'],
  local: ['Saved locally', 'Sign in to sync across devices'],
  syncing: ['Syncing', 'One moment…'],
  synced: ['Cloud synced', 'Progress is consistent across devices'],
  offline: ['Saved locally', 'Sync will resume when the network returns'],
}

const authErrorCopy = {
  invalid_credentials: '邮箱或密码不正确。',
  email_address_invalid: '请输入能够正常接收邮件的邮箱地址。',
  email_address_not_authorized: '当前邮件服务尚未允许向这个地址发信。',
  over_email_send_rate_limit: '验证邮件发送较多，请稍后再试。',
  user_already_exists: '这个邮箱已经注册，请直接登录。',
  weak_password: '密码强度不足，请至少使用 8 位并混合字母与数字。',
}
const authErrorCopyEn = {
  invalid_credentials: 'Incorrect email or password.',
  email_address_invalid: 'Enter an email address that can receive messages.',
  email_address_not_authorized: 'The current email service cannot send to this address.',
  over_email_send_rate_limit: 'Too many verification emails. Please try again later.',
  user_already_exists: 'This email is already registered. Sign in instead.',
  weak_password: 'Use at least 8 characters with a mix of letters and numbers.',
}

export function AccountButton({ onClick, user, syncStatus = 'local', compact = false }) {
  const { locale, pick } = useI18n()
  const statuses = locale === 'zh' ? statusCopy : statusCopyEn
  const Icon = UserCircle
  return <button className={`account-trigger ${user ? 'signed-in' : ''} ${compact ? 'compact' : ''}`} onClick={onClick} aria-label={user ? pick('打开学习账户','Open learning account') : pick('登录并同步进度','Sign in and sync progress')} title={user ? statuses[syncStatus]?.[0] : pick('登录并同步','Sign in and sync')}>
    <span className="account-icon"><Icon weight={user ? 'fill' : 'regular'} />{user && <i className={`sync-dot ${syncStatus}`} aria-hidden="true" />}</span>
    {!compact && <span>{user ? statuses[syncStatus]?.[0] : pick('登录','Sign in')}</span>}
  </button>
}

export function AccountModal({ onClose, progress, completedCount, totalLessons, syncStatus, lastSynced }) {
  const { locale, pick } = useI18n()
  const { user, configured, loading, recovery, clearRecovery } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (recovery) setMode('update')
  }, [recovery])

  useEffect(() => {
    const onKey = event => event.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async event => {
    event.preventDefault()
    const supabase = await getSupabase()
    if (!supabase) return
    setBusy(true); setError(''); setMessage('')
    let result
    if (mode === 'update') {
      result = await supabase.auth.updateUser({ password })
    } else if (mode === 'signup') {
      result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}${location.pathname}` },
      })
    } else if (mode === 'reset') {
      result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` })
    } else {
      result = await supabase.auth.signInWithPassword({ email, password })
    }
    setBusy(false)
    if (result.error) {
      trackEvent('auth_failed', { mode, code: result.error.code || 'unknown' })
      const errorCopy = locale === 'zh' ? authErrorCopy : authErrorCopyEn
      setError(errorCopy[result.error.code] || (result.error.message === 'Invalid login credentials' ? pick('邮箱或密码不正确。','Incorrect email or password.') : result.error.message))
      return
    }
    trackEvent('auth_completed', { mode })
    if (mode === 'signup') setMessage(pick('确认邮件已发送。打开邮件中的链接后，进度会自动同步。','Confirmation email sent. Open its link and your progress will sync automatically.'))
    if (mode === 'reset') setMessage(pick('密码重置邮件已发送，请检查收件箱。','Password reset email sent. Check your inbox.'))
    if (mode === 'update') {
      clearRecovery()
      setMessage(pick('密码已更新。','Password updated.'))
    }
  }

  const signOut = async () => {
    setBusy(true)
    const supabase = await getSupabase()
    await supabase?.auth.signOut()
    setBusy(false)
    onClose()
  }

  const statuses = locale === 'zh' ? statusCopy : statusCopyEn
  const [statusTitle, statusDetail] = statuses[syncStatus] || statuses.local
  const displayEmail = user?.email || ''

  return <div className="account-backdrop" onMouseDown={onClose}>
    <section className="account-modal" data-clarity-mask="true" role="dialog" aria-modal="true" aria-label={user ? pick('学习账户','Learning account') : pick('登录','Sign in')} onMouseDown={event => event.stopPropagation()}>
      <header><div><span className="section-no">LEARNING ID</span><h2>{mode === 'update' ? pick('设置新密码','Set a new password') : user ? pick('你的学习档案','Your learning profile') : mode === 'signup' ? pick('创建学习档案','Create a learning profile') : mode === 'reset' ? pick('找回密码','Reset password') : pick('登录并继续','Sign in and continue')}</h2></div><button className="icon-button" onClick={onClose} aria-label={pick('关闭','Close')}><X /></button></header>
      {loading ? <div className="account-loading"><SpinnerGap className="spin" />{pick('正在读取账户…','Loading account…')}</div> : user && !recovery ? <>
        <div className="account-identity"><span>{displayEmail.slice(0, 1).toUpperCase()}</span><div><b>{displayEmail}</b><small><Check /> {pick('已登录 · 本机进度不会丢失','Signed in · local progress stays safe')}</small></div></div>
        <div className="account-progress"><div className="account-ring" style={{ '--p': `${progress}%` }}><span>{progress}%</span></div><div><span className="section-no">COURSE PROGRESS</span><strong>{completedCount} / {totalLessons} {pick('节已完成','lessons complete')}</strong><p>{pick('每次完成课程或修改笔记，都会先保存在本机，再同步到云端。','Completions and notes save locally first, then sync to the cloud.')}</p></div></div>
        <div className={`sync-card ${syncStatus}`}><div>{syncStatus === 'synced' ? <CloudCheck weight="fill" /> : syncStatus === 'offline' ? <CloudSlash /> : <Cloud />}</div><span><b>{statusTitle}</b><small>{lastSynced ? `${pick('上次同步','Last synced')} ${lastSynced.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en', { hour: '2-digit', minute: '2-digit' })}` : statusDetail}</small></span></div>
        <button className="account-signout" onClick={signOut} disabled={busy}><SignOut />{pick('退出登录','Sign out')}</button>
      </> : !configured ? <div className="account-unavailable"><CloudSlash /><h3>{pick('云同步正在准备中','Cloud sync is being prepared')}</h3><p>{pick('课程、笔记和完成状态仍会安全保存在这台设备。云端启用后可直接登录导入。','Lessons, notes, and completions remain safely stored on this device.')}</p></div> : <>
        <p className="account-intro">{mode === 'update' ? pick('请输入新的账户密码。更新后，你的学习进度与笔记不会改变。','Enter a new password. Your progress and notes will not change.') : pick('游客也能完整学习。登录仅用于把 87 节课的进度、笔记与偏好同步到你的其他设备。','Guests can access the full course. Sign-in only syncs all 87 lessons, notes, and preferences across devices.')}</p>
        <form className="auth-form" onSubmit={submit}>
          {mode !== 'update' && <label><span>{pick('邮箱','Email')}</span><div><EnvelopeSimple /><input type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div></label>}
          {mode !== 'reset' && <label><span>{pick('密码','Password')}</span><div><LockKey /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={e => setPassword(e.target.value)} placeholder={pick('至少 8 位','At least 8 characters')} /><button type="button" onClick={() => setShowPassword(x => !x)} aria-label={showPassword ? pick('隐藏密码','Hide password') : pick('显示密码','Show password')}>{showPassword ? <EyeSlash /> : <Eye />}</button></div></label>}
          {error && <p className="auth-message error">{error}</p>}
          {message && <p className="auth-message success"><Check />{message}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : mode === 'signup' ? <UserCircle /> : mode === 'reset' ? <EnvelopeSimple /> : mode === 'update' ? <LockKey /> : <SignIn />}{mode === 'signup' ? pick('创建并导入本机进度','Create account and import local progress') : mode === 'reset' ? pick('发送重置邮件','Send reset email') : mode === 'update' ? pick('保存新密码','Save new password') : pick('登录并同步','Sign in and sync')}<ArrowRight /></button>
        </form>
        <div className="auth-switch">
          {mode === 'signin' && <><button onClick={() => { setMode('signup'); setError(''); setMessage('') }}>{pick('第一次来？创建账户','New here? Create an account')}</button><button onClick={() => { setMode('reset'); setError(''); setMessage('') }}>{pick('忘记密码','Forgot password')}</button></>}
          {mode === 'update' ? <button onClick={() => { clearRecovery(); onClose() }}>{pick('暂不修改','Not now')}</button> : mode !== 'signin' && <button onClick={() => { setMode('signin'); setError(''); setMessage('') }}>{pick('返回登录','Back to sign in')}</button>}
        </div>
        <small className="privacy-note"><LockKey /> {pick('仅保存学习进度与笔记；密码由 Supabase Auth 加密管理，本站无法读取。','Only progress and notes are stored. Supabase Auth securely manages passwords; this site cannot read them.')}</small>
      </>}
    </section>
  </div>
}

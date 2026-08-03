import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BracketsCurly, Check, CheckCircle, Circle,
  Clock, Code, Command, Cube, Flask, FolderOpen, Gauge, GithubLogo, House,
  List, MagnifyingGlass, Play, ReadCvLogo, RocketLaunch, Rows, Sparkle,
  TerminalWindow, X, Moon, Sun, VideoCamera,
} from '@phosphor-icons/react'
import { modules, resources } from './data.js'
import { localizeWorldModules, worldModules, worldResources } from './worldModelData.js'
import { buildLessonMaterial, lessonHasMedia, lessonMediaStats, resolveMediaSource } from './lessonContent.js'
import { AccountButton, AccountModal, useAuth, useLearningSync } from './auth.jsx'
import { LanguageToggle, useI18n } from './i18n.jsx'
import { localizeModules, localizeResources, sourceTypesFor } from './localizedData.js'
import { trackEvent } from './analytics.js'
import { legacyLessonId, lessonPath, matchSitePath, trackPath } from './lessonRoutes.js'
import { applyDocumentSeo, getHomeSeo, getLessonSeo } from './seo.js'
import { GEO_UPDATED_AT, getGeoBrief } from './geoContent.js'
import { ShareButton } from './ShareDialog.jsx'
import {
  DoodleArrow, DoodleBook, DoodleCheck, DoodleCircle, DoodleFlask, DoodleLoop,
  DoodleNetwork, DoodleRail, DoodleRocket, DoodleSpark, DoodleStar, DoodleTape,
  DoodleTarget, DoodleUnderline, DoodleWarn, DoodleWorld,
} from './doodles.jsx'

const flattenLessons = data => data.flatMap((m) => m.lessons.map((l, i) => ({ module: m, lesson: l, index: i })))
const lessonIds = [...flattenLessons(modules), ...flattenLessons(worldModules)].map(x => x.lesson[0])
const trackModules = (trackId, locale) => trackId === 'world-models' ? localizeWorldModules(locale) : localizeModules(modules, locale)
const trackResources = trackId => trackId === 'world-models' ? worldResources : resources

function EditorialTitle({ text, locale }) {
  if (!locale.startsWith('zh')) return text
  const phrases = text.match(/[^：:，,、；;。！？!?]+[：:，,、；;。！？!?]?/g) || [text]
  return phrases.map((phrase, index) => <span className="title-phrase" key={`${phrase}-${index}`}>{phrase}</span>)
}

const LAST_LESSON_KEY = 'uth-last-lesson'
const readLastLesson = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_LESSON_KEY) || 'null')
    return parsed && lessonIds.includes(parsed.id) ? parsed : null
  } catch { return null }
}
const resolveLastLesson = (locale) => {
  const last = readLastLesson()
  if (!last) return null
  const trackId = last.trackId === 'world-models' ? 'world-models' : 'llm'
  const found = flattenLessons(trackModules(trackId, locale)).find(x => x.lesson[0] === last.id)
  return found ? { ...found, trackId } : null
}

const navItems = [
  ['home', 'overview', House], ['path', 'path', Rows], ['labs', 'labs', Flask],
  ['projects', 'projects', Cube], ['library', 'library', FolderOpen],
]

const codeSample = `class Value:
    def __init__(self, data, _children=(), _op=''):
        self.data = data
        self.grad = 0.0
        self._prev = set(_children)
        self._backward = lambda: None

    def __add__(self, other):
        out = Value(self.data + other.data, (self, other), '+')
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out`

function Brand() {
  const { pick } = useI18n()
  return <button className="brand" onClick={() => location.reload()} aria-label={pick('返回总览','Back to overview')}>
    <span className="brand-mark">μ</span><span>UNDER<br />THE HOOD</span>
  </button>
}

function TrackSwitcher({ trackId, onTrack, compact = false }) {
  const { pick } = useI18n()
  return <div className={`track-switcher ${compact ? 'compact' : ''}`} role="group" aria-label={pick('学习方向','Learning track')}>
    <button className={trackId === 'llm' ? 'active' : ''} onClick={() => onTrack('llm')} aria-pressed={trackId === 'llm'}><BracketsCurly /> <span>LLM</span></button>
    <button className={trackId === 'world-models' ? 'active' : ''} onClick={() => onTrack('world-models')} aria-pressed={trackId === 'world-models'}><Cube /> <span>{pick('世界模型','World Models')}</span></button>
  </div>
}

function Sidebar({ view, setView, open, onClose, progress, theme, toggleTheme, trackId, onTrack }) {
  const { t, pick } = useI18n()
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><Brand /><button className="icon-button mobile-only" onClick={onClose} aria-label={pick('关闭导航','Close navigation')}><X /></button></div>
    <TrackSwitcher trackId={trackId} onTrack={onTrack} compact />
    <nav className="main-nav" aria-label="主要导航">
      {navItems.map(([id, label, Icon]) => <button key={id} data-qa={`nav-${id}`} className={view === id ? 'active' : ''} onClick={() => { setView(id); onClose() }}>
        <Icon size={20} weight={view === id ? 'fill' : 'regular'} /><span>{t(label)}</span>
      </button>)}
    </nav>
    <div className="mobile-settings" aria-label={pick('显示设置','Display settings')}>
      <LanguageToggle compact />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} compact />
    </div>
    <div className="sidebar-foot">
      <div className="mastery-ring" style={{ '--p': `${progress}%` }}><span>{progress}%</span></div>
      <div><span className="micro">{t('overallMastery')}</span><strong>{progress === 100 ? t('courseComplete') : progress > 50 ? t('forming') : progress > 0 ? t('foundationsForming') : t('startFirst')}</strong></div>
    </div>
  </aside>
}

function ThemeToggle({ theme, toggleTheme, compact = false }) {
  const { t, pick } = useI18n()
  return <button className={`theme-toggle ${compact ? 'compact' : ''}`} onClick={toggleTheme} aria-label={theme === 'dark' ? pick('切换到浅色模式','Switch to light mode') : pick('切换到深色模式','Switch to dark mode')} title={theme === 'dark' ? t('light') : t('dark')}>
    {theme === 'dark' ? <Sun weight="bold" /> : <Moon weight="fill" />}
    {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
  </button>
}

function Topbar({ onMenu, onSearch, theme, toggleTheme, progress, onAccount, user, syncStatus }) {
  const { t, pick } = useI18n()
  return <header className="topbar">
    <button className="icon-button mobile-only" onClick={onMenu} aria-label={pick('打开导航','Open navigation')}><List /></button>
    <button className="search-trigger" onClick={onSearch} aria-label={t('search')}><MagnifyingGlass size={17} /><span>{t('search')}</span><kbd>⌘ K</kbd></button>
    <div className="top-progress"><span>{t('totalProgress')} <b>{progress}%</b></span><i><em style={{ width: `${progress}%` }} /></i></div>
    <LanguageToggle />
    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    <AccountButton onClick={onAccount} user={user} syncStatus={syncStatus} />
  </header>
}

function Dashboard({ goLesson, setView, trackId, onTrack, completed = new Set(), notesCount = 0, resume = null, theme }) {
  const { pick, locale } = useI18n()
  const localized = useMemo(() => trackModules(trackId, locale), [trackId, locale])
  const isWorld = trackId === 'world-models'
  const flat = flattenLessons(localized)
  const trackResume = resume?.trackId === trackId ? resume : null
  const currentModule = localized.find(m => !m.lessons.every(l => completed.has(l[0])))
  return <main className="page dashboard-page">
    <section className="hero-grid">
      <div className="hero-copy">
        <span className="hero-track-label">{isWorld ? 'WORLD MODELS COURSE' : 'LLM SYSTEMS COURSE'}</span>
        <h1>{isWorld ? pick('别只生成画面。','Don’t just generate frames.') : pick('别只会调用模型。','Don’t just call a model.')}<br /><em>{isWorld ? pick('学会预测世界。','Learn to predict worlds.') : pick('亲手造一个。','Build one yourself.')}<DoodleUnderline className="em-swash" /></em></h1>
        <p>{isWorld
          ? pick('从状态、动作与隐空间动力学，到 JEPA、Genie、空间智能与 Physical AI。判断一个模型是否真的能理解、预测和规划。','From state, action, and latent dynamics to JEPA, Genie, spatial intelligence, and physical AI. Learn when a model can truly predict and plan.')
          : pick('从 0 到 1 拆开大模型：推导、实现、训练、推理、对齐、部署，并补入 2025-2026 前沿系统。','Take an LLM apart from first principles, then connect it to 2025-2026 advances in reasoning, sparse architecture, and serving.')}</p>
        <div className="hero-actions">
          <button className="primary" onClick={goLesson}>{resume ? pick('继续学习','Continue learning') : pick('开始学习','Start learning')} <ArrowRight weight="bold" /></button>
          <button className="secondary" onClick={() => setView('path')}>{pick('查看完整路线','View full path')}</button>
          <ShareButton theme={theme} trackId={trackId} title={isWorld ? 'World Models · Under the Hood' : pick('LLM Study · 免费大模型系统课','LLM Study · Free systems course for LLMs')} text={isWorld ? pick('12 节世界模型课程，从 POMDP、Dreamer 和 JEPA 到 Genie、Marble 与 Cosmos。','12 world-model lessons from POMDPs, Dreamer, and JEPA to Genie, Marble, and Cosmos.') : pick('80 节中英双语课程，从 Python 先修、反向传播、Transformer 到推理模型、部署与 Agent。','80 bilingual lessons from Python prerequisites and backpropagation to Transformers, reasoning models, serving, and agents.')} />
        </div>
        <p className="hero-note"><DoodleArrow className="hero-note-arrow" /><span className="hand">{pick('不用注册，点开就学','No sign-up — just start')}</span></p>
        <div className="signal-map" aria-label="从 token 到 agent 的学习信号图">
          <DoodleRail className="signal-doodle" />
          <DoodleStar className="signal-star" />
          {(isWorld ? ['STATE', 'DYNAMICS', 'JEPA', 'WORLDS', 'PHYSICAL AI'] : ['TOKENS', 'BACKPROP', 'GPT', 'REASONING', 'AGENTS']).map((x, i) => <span key={x} style={{ left: `${i * 24.5}%`, top: 14 }}>{x}</span>)}
        </div>
      </div>
      <CurrentLesson goLesson={goLesson} trackId={trackId} resume={trackResume} completed={completed} />
    </section>
    <section className="track-chooser" aria-label={pick('两条学习路线','Two learning tracks')}>
      <button className={trackId === 'llm' ? 'active' : ''} onClick={() => onTrack('llm')}><DoodleNetwork className="track-doodle" /><span>LLM</span><strong>{pick('语言模型系统课','Language Model Systems')}</strong><small>80 {pick('节','lessons')} · 10 {pick('阶段','phases')}</small><ArrowRight /></button>
      <button className={trackId === 'world-models' ? 'active' : ''} onClick={() => onTrack('world-models')}><DoodleWorld className="track-doodle" /><span>WORLD MODELS</span><strong>{pick('从预测到空间智能','From Prediction to Spatial AI')}</strong><small>12 {pick('节','lessons')} · 5 {pick('阶段','phases')}</small><ArrowRight /></button>
    </section>
    <Roadmap modulesData={localized} trackId={trackId} completed={completed} />
    <section className="dashboard-lower">
      <Today goLesson={goLesson} />
      <MasteryPanel completedCount={flat.filter(x => completed.has(x.lesson[0])).length} total={flat.length} notesCount={notesCount} currentShort={currentModule?.short} />
    </section>
    <section className="method-strip">
      <div><span className="section-no">LEARNING LOOP</span><h2>{pick('80% 掌握，靠四次经过同一知识','Reach 80% mastery by revisiting each idea four ways')}</h2><DoodleLoop className="loop-doodle" /></div>
      <div className="loop-steps">
        {(locale === 'zh' ? ['建立直觉', '推导公式', '从零实现', '诊断迁移'] : ['Build intuition', 'Derive it', 'Implement it', 'Diagnose & transfer']).map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong></div>)}
      </div>
    </section>
  </main>
}

function CurrentLesson({ goLesson, trackId, resume = null, completed = new Set() }) {
  const { pick } = useI18n()
  const isWorld = trackId === 'world-models'
  if (resume) {
    const doneCount = resume.module.lessons.filter(l => completed.has(l[0])).length
    return <article className="current-lesson">
      <div className="current-meta"><span><i /> {pick('接着上次','CONTINUE')}</span><span>{resume.lesson[3]}</span></div>
      <span className="chapter-code">{resume.module.no} · {resume.module.title}</span>
      <h2>{resume.lesson[1]}</h2>
      <p>{resume.lesson[4]}</p>
      <div className="resume-box">
        <div className="resume-rail">{resume.module.lessons.map(l => <span key={l[0]} className={completed.has(l[0]) ? 'done' : l[0] === resume.lesson[0] ? 'now' : ''} />)}</div>
        <small>{doneCount} / {resume.module.lessons.length} · {pick('本阶段已完成','done in this phase')}</small>
      </div>
      <button className="lesson-continue" onClick={goLesson}>{pick('继续这一节','Resume this lesson')} <ArrowRight /></button>
    </article>
  }
  return <article className="current-lesson">
    <div className="current-meta"><span><i /> {pick('推荐起点','START HERE')}</span><span>{isWorld ? 'W0 · 01' : '01 · 03'}</span></div>
    <span className="chapter-code">{isWorld ? pick('W0 · 定义与状态','W0 · DEFINITIONS & STATE') : pick('01 · 神经网络地基','01 · NEURAL FOUNDATIONS')}</span>
    <h2>{isWorld ? pick('世界模型','What is a') : pick('让梯度沿计算图','Make gradients flow')}<br />{isWorld ? pick('究竟是什么','world model?') : pick('倒着走','backward')}</h2>
    <p>{isWorld ? pick('用状态、观察、动作、转移与规划建立严格定义，先学会识别营销概念。','Build a strict definition from state, observation, action, transition, and planning.') : pick('从局部导数到 reverse-mode autodiff，亲手实现一个微型 autograd 引擎。','Move from local derivatives to reverse-mode autodiff by implementing a tiny autograd engine.')}</p>
    <div className="code-window">
      <div className="code-title"><span>{isWorld ? 'world_model.py' : 'micrograd.py'}</span><span>Python</span></div>
      <pre><code>{isWorld ? `state = encode(observation)\nfor action in candidates:\n    future = dynamics(state, action)\n    score[action] = reward(future)\n\nbest = max(score, key=score.get)` : codeSample.split('\n').slice(0, 9).join('\n')}</code></pre>
    </div>
    <button className="lesson-continue" onClick={goLesson}>{pick('打开学习工作台','Open learning workspace')} <ArrowRight /></button>
  </article>
}

function Roadmap({ modulesData = modules, trackId = 'llm', completed = new Set() }) {
  const { pick } = useI18n()
  const isWorld = trackId === 'world-models'
  const mediaLessons = isWorld ? lessonMediaStats.world : lessonMediaStats.llm
  const firstOpen = modulesData.findIndex(m => !m.lessons.every(l => completed.has(l[0])))
  const isDone = i => firstOpen === -1 || i < firstOpen
  return <section className="roadmap-block">
    <div className="section-title-row"><div><span className="section-no">ROADMAP · {isWorld ? '12 WEEKS' : '32 WEEKS'}</span><h2>{isWorld ? pick('从状态到可行动的世界','From state to actionable worlds') : pick('从字符到智能系统','From characters to intelligent systems')}</h2></div><p>{isWorld ? '70–85' : '262–302'} {pick('小时','hours')} · {flattenLessons(modulesData).length} {pick('节深度课','deep lessons')} · {mediaLessons} {pick('节视频研讨','video seminars')}</p></div>
    <div className="roadmap-rail">
      <DoodleRail className="rail-doodle" />
      {modulesData.map((m, i) => <div className={`road-stop ${i === firstOpen ? 'current' : ''} ${isDone(i) ? 'done' : ''}`} key={m.id}>
        <span>{isDone(i) ? <DoodleCheck className="stop-check" /> : m.no}{i === firstOpen && <DoodleCircle className="stop-scribble" />}</span><strong>{m.short}</strong><small>{m.weeks}</small>
      </div>)}
    </div>
  </section>
}

function Today({ goLesson }) {
  const { pick, locale } = useI18n()
  const tasks = locale === 'zh' ? [
    ['读', '链式法则与计算图', '15 分钟'],
    ['造', '实现 Value.__add__', '30 分钟'],
    ['验', '有限差分梯度检查', '25 分钟'],
    ['讲', '为什么需要拓扑排序？', '10 分钟'],
  ] : [['READ','Chain rule and computation graph','15 min'],['BUILD','Implement Value.__add__','30 min'],['TEST','Finite-difference gradient check','25 min'],['TEACH','Why topological ordering?','10 min']]
  return <section className="today-panel">
    <div className="panel-heading"><div><span className="section-no">TODAY · 80 MIN</span><h2>{pick('今天要做','Today’s work')}</h2><span className="suggested-tag">{pick('建议节奏','SUGGESTED RHYTHM')}</span></div><Clock size={21} /></div>
    <div className="task-list">
      {tasks.map(([tag, title, time], i) => <button key={title} className={i === 0 ? 'now' : ''} onClick={goLesson}>
        <span className="task-check" /><b>{tag}</b><strong>{title}</strong><small>{time}</small>{i === 0 && <em>{pick('开始','Start')}</em>}
      </button>)}
    </div>
  </section>
}

function MasteryPanel({ completedCount = 0, total = 75, notesCount = 0, currentShort = '' }) {
  const { pick } = useI18n()
  return <section className="mastery-panel">
    <div className="panel-heading"><div><span className="section-no">PROOF SO FAR</span><h2>{pick('不是完成，是掌握','Completion is not mastery')}</h2></div><Gauge size={22} /></div>
    <div className="proof-stats">
      <div><DoodleCheck /><div><b>{completedCount}<small> / {total}</small></b><span>{pick('已完成课程','lessons completed')}</span></div></div>
      <div><DoodleSpark /><div><b>{notesCount}</b><span>{pick('篇学习笔记','field notes written')}</span></div></div>
      <div><DoodleStar /><div><b>{currentShort || pick('全部完成','all done')}</b><span>{pick('当前阶段','current phase')}</span></div></div>
    </div>
    <p>{pick('下一道门：合上资料，向一个不了解的人讲清当前阶段的核心机制。','Next gate: explain this phase’s core mechanism to a beginner without opening your notes.')}</p>
  </section>
}

function Curriculum({ selected, setSelected, goLesson, completed, trackId }) {
  const { locale, pick, t } = useI18n()
  const modulesData = useMemo(() => trackModules(trackId, locale), [trackId, locale])
  const current = modulesData[selected]
  const isWorld = trackId === 'world-models'
  const mediaLessons = isWorld ? lessonMediaStats.world : lessonMediaStats.llm
  const totalLessons = flattenLessons(modulesData).length
  const completedLessons = flattenLessons(modulesData).filter(({ lesson }) => completed.has(lesson[0])).length
  const currentDone = current.lessons.filter(lesson => completed.has(lesson[0])).length
  const pathProgress = Math.round((completedLessons / totalLessons) * 100)
  return <main className="page curriculum-page" data-qa="learning-path">
    <header className="page-lead curriculum-lead">
      <div className="curriculum-lead-grid">
        <div className="path-lead-copy">
          <span className="section-no">THE COMPLETE PATH · FIELD GUIDE</span>
          <h1>{pick('一条能走到底的','A complete path through')}<br />{isWorld ? pick('世界模型学习路线','world models') : pick('大模型学习路线','large language models')}</h1>
          <p>{isWorld ? pick('从 POMDP 与隐空间动力学开始，走到 JEPA、Genie、空间智能、Physical AI 与严谨评测。','Start with POMDPs and latent dynamics, then progress through JEPA, Genie, spatial intelligence, physical AI, and rigorous evaluation.') : pick('32 周包含可跳过的 3 周零基础先修；主线仍是一套持续更新、可验证的能力建造计划，每阶段都以作品和掌握门结束。','The 32-week plan includes an optional three-week prerequisite sprint; every phase still ends with a project and mastery gate.')}</p>
        </div>
        <aside className="path-route-card" aria-label={pick('当前路线位置','Current position on the path')}>
          <div className="path-route-head"><span>{pick('你在这里','YOU ARE HERE')}</span><b>{String(selected + 1).padStart(2, '0')} / {String(modulesData.length).padStart(2, '0')}</b></div>
          {isWorld ? <DoodleWorld className="path-route-doodle" /> : <DoodleNetwork className="path-route-doodle" />}
          <div className="path-route-current"><small>PHASE {current.no}</small><strong>{current.title}</strong><span>{currentDone} / {current.lessons.length} {pick('节完成','lessons complete')}</span></div>
          <div className="path-route-progress" aria-label={`${pathProgress}%`}><i style={{ width:`${pathProgress}%` }} /></div>
        </aside>
      </div>
      <div className="curriculum-stats"><span><b>{totalLessons}</b><small>{pick('深度课','deep lessons')}</small></span><span><b>{mediaLessons}</b><small>{pick('视频研讨','video seminars')}</small></span><span><b>{isWorld ? 8 : 30}</b><small>{pick('核心实验','core labs')}</small></span><span><b>{modulesData.length}</b><small>{pick('阶段作品','phase projects')}</small></span></div>
    </header>
    <div className="curriculum-layout">
      <aside className="module-index" aria-label={pick('学习阶段','Learning phases')}>
        <div className="module-index-label"><span>{pick('阶段地图','PHASE MAP')}</span><b>{String(selected + 1).padStart(2, '0')} / {String(modulesData.length).padStart(2, '0')}</b></div>
        {modulesData.map((m, i) => {
          const done = m.lessons.filter(lesson => completed.has(lesson[0])).length
          return <button key={m.id} onClick={() => setSelected(i)} className={selected === i ? 'active' : ''} aria-current={selected === i ? 'step' : undefined}>
          <span>{m.no}</span><div><strong>{m.title}</strong><small>{m.weeks} · {m.hours}h · {m.lessons.length} {pick('节','lessons')}</small><i><em style={{ width:`${Math.round((done / m.lessons.length) * 100)}%` }} /></i></div><ArrowRight />
        </button>})}
      </aside>
      <section className="module-detail">
        <div className="module-head"><div><span className="section-no">PHASE {current.no} · FIELD NOTES</span><h2>{current.title}</h2><p>{current.summary}</p></div><div className="module-time"><strong>{current.weeks}</strong><span>{current.hours} {pick('小时','hours')}</span><small>{currentDone}/{current.lessons.length} {pick('已完成','done')}</small></div></div>
        <blockquote><span>{pick('本阶段要回答','QUESTION TO ANSWER')}</span>{current.question}<DoodleArrow className="question-arrow" /></blockquote>
        <div className="phase-proof-strip">
          <div><span>BUILD</span><b>{pick('完成一个可展示作品','Ship one inspectable project')}</b><small>{current.project}</small></div>
          <div><span>PROVE</span><b>{pick('通过掌握门','Pass the mastery gate')}</b><small>{current.mastery.length} {pick('项可验证标准','verifiable checks')}</small></div>
        </div>
        <div className="lesson-table">
          <div className="lesson-table-head"><span>{pick('课程','Lesson')}</span><span>{pick('理论内核','Theory')}</span><span>{pick('实践产出','Deliverable')}</span><span>{pick('时长','Time')}</span></div>
          {current.lessons.map((l, i) => <button key={l[0]} className={completed.has(l[0]) ? 'completed-row' : ''} onClick={() => goLesson(current, l, i)}>
            <span><i>{l[0]}</i><strong>{l[1]}</strong><em>{l[2]}</em>{lessonHasMedia(l[0]) && <small className="lesson-video"><VideoCamera weight="fill" /> {t('video')}</small>}</span><span data-label={pick('理论','THEORY')}>{l[4]}</span><span data-label={pick('产出','OUTPUT')}>{l[5]}</span><span>{l[3]} <ArrowRight /></span>
          </button>)}
        </div>
        <div className="module-outcomes">
          <div><span className="section-no">STAGE PROJECT</span><h3>{pick('阶段作品','Phase project')}</h3><p>{current.project}</p></div>
          <div><span className="section-no">PASS CRITERIA</span><h3>{pick('通过标准','Pass criteria')}</h3><ul>{current.mastery.map(x => <li key={x}><Check />{x}</li>)}</ul></div>
        </div>
        <div className="source-line"><span>{pick('精选一手资料','Curated primary sources')}</span>{current.sources.map(x => <b key={x}>{x}</b>)}</div>
      </section>
    </div>
  </main>
}

function Labs({ goLesson, trackId }) {
  const { locale, pick } = useI18n()
  const isWorld = trackId === 'world-models'
  const labs = isWorld ? (locale === 'zh' ? [
    ['W01', '状态与观察实验台', '改变传感器可见范围，观察真实状态、观察与 belief state 如何分离。', 'POMDP', '45 min'],
    ['W02', 'Rollout 漂移显微镜', '比较单步误差与 5、20、50 步想象轨迹的累积偏差。', '动力学', '60 min'],
    ['W03', '像素 vs 表征预测', '对同一视频遮挡任务比较重建损失与 JEPA 表征目标。', 'JEPA', '70 min'],
    ['W04', '交互世界审计', '用固定动作脚本测试动作响应、物体恒常性与回访一致性。', 'Genie', '55 min'],
    ['W05', 'Sim-to-Real 风险表', '从生成数据分布中寻找会被机器人策略放大的仿真偏差。', 'Physical AI', '65 min'],
  ] : [
    ['W01','State & Observation Lab','Change sensor visibility and separate world state, observations, and belief state.','POMDP','45 min'],
    ['W02','Rollout Drift Microscope','Compare one-step error with 5-, 20-, and 50-step imagined trajectories.','Dynamics','60 min'],
    ['W03','Pixels vs Representations','Compare reconstruction loss and JEPA objectives on one masked-video task.','JEPA','70 min'],
    ['W04','Interactive World Audit','Use fixed action scripts to test response, permanence, and revisit consistency.','Genie','55 min'],
    ['W05','Sim-to-Real Risk Card','Find simulation biases that a robot policy could amplify.','Physical AI','65 min'],
  ]) : (locale === 'zh' ? [
    ['01', '梯度显微镜', '拖动输入与权重，观察局部导数如何沿计算图累积。', '反向传播', '35 min'],
    ['02', 'Tokenizer 病理室', '比较中、英、日、数字和代码的 BPE 切分与压缩率。', 'Token', '45 min'],
    ['03', 'Attention 解剖台', '逐格查看 QK 相似度、mask、softmax 与 value 聚合。', 'Transformer', '55 min'],
    ['04', '训练急诊室', '面对 loss spike、NaN、显存溢出和过拟合，完成故障定位。', '训练系统', '70 min'],
    ['05', '采样风洞', '改变 temperature、top-k、top-p，建立输出多样性相图。', '推理', '40 min'],
    ['06', 'Agent 轨迹审计', '从工具调用轨迹判断规划、权限和终止条件是否可靠。', 'Agent', '60 min'],
  ] : [['01','Gradient Microscope','Drag inputs and weights to observe local derivatives accumulate through a graph.','Backprop','35 min'],['02','Tokenizer Pathology Lab','Compare BPE splits and compression for language, numbers, and code.','Tokens','45 min'],['03','Attention Dissection','Inspect QK similarity, masks, softmax, and value aggregation cell by cell.','Transformer','55 min'],['04','Training ER','Diagnose loss spikes, NaNs, OOMs, and overfitting.','Training','70 min'],['05','Sampling Wind Tunnel','Map temperature, top-k, and top-p to diversity and quality.','Inference','40 min'],['06','Agent Trace Audit','Judge planning, permissions, and termination from tool-call traces.','Agents','60 min']])
  return <main className="page catalog-page">
    <header className="page-lead compact"><span className="section-no">EXPERIMENTS</span><h1>{pick('最好的老师，','The best teacher')}<br />{pick('是一个反直觉的结果。','is a surprising result.')}</h1><p>{pick('每个实验都要求先预测、再运行、后解释；没有“点一下看动画”的伪互动。','Every lab requires a prediction, a run, and an explanation—no click-to-watch pseudo-interactivity.')}</p><DoodleFlask className="page-lead-doodle" /></header>
    <div className="lab-grid">{labs.map(([n, title, desc, phase, time], i) => <article key={n}>
      <div className="lab-no">{n}<Flask /></div><span className="section-no">{phase} · {time}</span><h2>{title}</h2><p>{desc}</p><button onClick={i === 0 ? goLesson : undefined}>{pick('进入实验','Open lab')} <ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Projects({ trackId }) {
  const { locale, pick } = useI18n()
  const modulesData = useMemo(() => trackModules(trackId, locale), [trackId, locale])
  return <main className="page projects-page">
    <header className="page-lead compact"><span className="section-no">BUILD IN PUBLIC</span><h1>{pick('八个作品，','Eight projects.')}<br />{pick('证明你真的会。','Proof that you can build.')}</h1><p>{pick('每个作品都能独立发布：有源码、有实验、有测试、有失败复盘，不只是 notebook 截图。','Every project is publishable: source, experiments, tests, and failure reviews—not notebook screenshots.')}</p><DoodleRocket className="page-lead-doodle" /></header>
    <div className="project-list">{modulesData.map((m, i) => <article key={m.id}>
      <div className="project-index"><span>{m.no}</span><i className={i === 0 ? 'done' : i === 1 ? 'active' : ''} /></div>
      <div><span className="section-no">{m.weeks} · {m.hours} HOURS</span><h2>{m.project.split('：')[0]}</h2><p>{m.project.includes('：') ? m.project.split('：').slice(1).join('：') : m.project}</p></div>
      <div className="project-proof"><span>{pick('验收证据','Evidence')}</span><b>README</b><b>{pick('测试','Tests')}</b><b>{pick('实验报告','Report')}</b><b>{pick('演示','Demo')}</b></div>
      <button className="icon-button"><ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Library({ trackId }) {
  const { locale, pick } = useI18n()
  const types = sourceTypesFor(locale)
  const localizedResources = useMemo(() => localizeResources(trackResources(trackId), locale), [trackId, locale])
  const [type, setType] = useState(types[0])
  const [query, setQuery] = useState('')
  useEffect(() => setType(types[0]), [locale])
  const filtered = localizedResources.filter(r => (type === types[0] || r.type === type) && `${r.author}${r.title}${r.phase}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="page library-page">
    <header className="page-lead compact"><span className="section-no">CURATED SOURCES</span><h1>{pick('不是链接仓库，','Not a link dump.')}<br />{pick('是大师课导航。','A guide to master classes.')}</h1><p>{pick('只选一手、可复现、高信噪比材料。每一份都标明学习位置和使用方式。','Only primary, reproducible, high-signal material—each source has a clear place and purpose.')}</p><DoodleBook className="page-lead-doodle" /></header>
    <div className="library-tools"><label><MagnifyingGlass /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={pick('搜索作者、项目或主题','Search author, project, or topic')} /></label><div>{types.map(x => <button className={type === x ? 'active' : ''} onClick={() => setType(x)} key={x}>{x}</button>)}</div></div>
    <div className="resource-table"><div className="resource-head"><span>{pick('来源 / 题目','Source / Title')}</span><span>{pick('用于','Used for')}</span><span>{pick('使用说明','How to use it')}</span><span /></div>{filtered.map(r => <a key={r.title} href={r.url} target="_blank" rel="noreferrer">
      <span><i>{r.type}</i><strong>{r.title}</strong><small>{r.author}</small></span><span>{r.phase}<b>{r.level}</b></span><span>{r.note}</span><ArrowRight />
    </a>)}</div>
  </main>
}

function LessonView({ info, onBack, onNavigate, theme, toggleTheme, complete, onToggleComplete, onSaveNote, onAccount, user, syncStatus }) {
  const { locale } = useI18n()
  const localized = useMemo(() => localizeModules(modules, locale), [locale])
  const fallbackModule = localized[2]
  const module = info?.module || fallbackModule
  const lesson = info?.lesson || fallbackModule.lessons[2]
  return <LessonStudy key={`${locale}-${lesson[0]}`} module={module} lesson={lesson} onBack={onBack} onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} complete={complete} onToggleComplete={onToggleComplete} onSaveNote={onSaveNote} onAccount={onAccount} user={user} syncStatus={syncStatus} />
}

function LessonMedia({ media }) {
  const { locale, t, pick } = useI18n()
  const [active, setActive] = useState(false)
  const [network, setNetwork] = useState(() => localStorage.getItem('uth-network') || ((navigator.language === 'zh-CN' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai') ? 'cn' : 'global'))
  const [partByNetwork, setPartByNetwork] = useState({})
  const segments = media.segments || []
  const [segmentId, setSegmentId] = useState(() => segments[0]?.id || null)
  const [segmentProgress, setSegmentProgress] = useState(() => Object.fromEntries(segments.map(segment => [
    segment.id,
    localStorage.getItem(`mediaProgress:${media.resourceId || media.id}:${segment.id}`) === 'complete',
  ])))
  const selectedSegment = segments.find(segment => segment.id === segmentId) || segments[0] || null
  const resolvedSource = resolveMediaSource(media, network)
  const source = resolvedSource || { platform:'Original', title:media.title, author:media.author, duration:media.duration }
  const isYouTube = source.platform === 'YouTube'
  const isBilibili = source.platform === 'Bilibili'
  const isEmbeddable = isYouTube || isBilibili
  const parts = source.parts || []
  const partKey = item => item?.id || item?.page
  const selectedPartKey = partByNetwork[network] || source.partId || source.page || partKey(parts[0])
  const selectedPart = parts.find(item => partKey(item) === selectedPartKey)
  const selectedSourceId = selectedPart?.id || source.id
  const selectedPage = selectedPart?.page || source.page || 1
  const start = selectedSegment?.start || 0
  const end = selectedSegment?.end || null
  const segmentTiming = source.segmentTiming || {}
  const sourceStart = Math.max(0, start + (segmentTiming.offsetSeconds || 0))
  const sourceCanStartAtSegment = isYouTube || segmentTiming.startSupported
  const sourceStopsAtSegmentEnd = isYouTube || segmentTiming.endSupported
  const embed = isYouTube
    ? `https://www.youtube-nocookie.com/embed/${selectedSourceId}?rel=0${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`
    : isBilibili ? `https://player.bilibili.com/player.html?bvid=${selectedSourceId}&page=${selectedPage}&high_quality=1&danmaku=0${sourceCanStartAtSegment && sourceStart ? `&t=${sourceStart}` : ''}` : ''
  const external = isYouTube
    ? `https://www.youtube.com/watch?v=${selectedSourceId}${start ? `&t=${start}s` : ''}`
    : isBilibili ? `https://www.bilibili.com/video/${selectedSourceId}?p=${selectedPage}${sourceCanStartAtSegment && sourceStart ? `&t=${sourceStart}` : ''}` : source.url
  const changeNetwork = value => {
    setNetwork(value)
    setActive(false)
    localStorage.setItem('uth-network', value)
    trackEvent('video_source_selected', { network: value, platform: resolveMediaSource(media, value)?.platform || 'none' })
    dispatchEvent(new CustomEvent('uth-network-change', { detail: { network: value } }))
  }
  useEffect(() => {
    const receive = event => event.detail?.network && setNetwork(event.detail.network)
    addEventListener('uth-network-change', receive)
    return () => removeEventListener('uth-network-change', receive)
  }, [])
  const changePart = key => { setPartByNetwork(current => ({ ...current, [network]: key })); setActive(false) }
  const changeSegment = id => { setSegmentId(id); setActive(false) }
  const toggleSegment = id => {
    const complete = !segmentProgress[id]
    localStorage.setItem(`mediaProgress:${media.resourceId || media.id}:${id}`, complete ? 'complete' : 'pending')
    setSegmentProgress(current => ({ ...current, [id]:complete }))
    trackEvent('video_segment_progressed', { resource_id:media.resourceId || media.id, segment_id:id, complete })
  }
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const rest = seconds % 60
    return `${hours ? `${hours}:` : ''}${hours ? String(minutes).padStart(2, '0') : minutes}:${String(rest).padStart(2, '0')}`
  }
  return <section className="lesson-media">
    <div className="media-heading"><div><span className="section-no">VIDEO SEMINAR · {source.platform}</span><h2>{t('watchThenBuild')}</h2></div><div className="network-switch" aria-label={t('videoMode')}><button className={network === 'cn' ? 'active' : ''} aria-pressed={network === 'cn'} onClick={() => changeNetwork('cn')}>{t('domestic')}</button><button className={network === 'global' ? 'active' : ''} aria-pressed={network === 'global'} onClick={() => changeNetwork('global')}>{t('global')}</button></div></div>
    <div className="media-source-line">
      <span className={`source-badge ${source.sourceType || 'primary'}`}>{network === 'global' ? ((locale === 'en' ? source.sourceLabelEn : source.sourceLabel) || t('globalOriginal')) : (locale === 'en' ? t('curatedVideo') : (source.sourceLabel || t('curatedVideo')))}</span>
      <p>{locale === 'en' ? t('sourceDefault') : (source.sourceNote || t('sourceDefault'))}</p>
      {source.originalUrl && network === 'cn' && <a href={source.originalUrl} target="_blank" rel="noreferrer">{t('originalSource')} <ArrowRight /></a>}
      {source.referenceUrl && <a href={source.referenceUrl} target="_blank" rel="noreferrer">{t('officialReference')} <ArrowRight /></a>}
    </div>
    {parts.length > 0 && <div className="media-parts" aria-label={t('selectedParts')}><span>{t('selectedParts')}</span><div>{parts.map((item, index) => <button key={partKey(item)} className={selectedPartKey === partKey(item) ? 'active' : ''} onClick={() => changePart(partKey(item))}><b>{item.page ? `P${item.page}` : `V${index + 1}`}</b>{locale === 'en' ? (item.labelEn || item.label) : item.label}</button>)}</div></div>}
    {segments.length > 0 && <div className="media-segments" data-media-segments>
      <div className="segment-summary">
        <span><b>{pick('本节必看','Required')}</b>{media.requiredDuration}</span>
        <span><b>{pick('本节活动','Activities')}</b>{locale === 'en' ? (media.activityDurationEn || media.activityDuration) : media.activityDuration}</span>
        <span><b>{pick('原始资源','Full source')}</b>{media.resourceDuration || media.duration}</span>
      </div>
      <div className="segment-list">{segments.map((segment, index) => <article key={segment.id} className={`${segment.id === selectedSegment?.id ? 'active' : ''} ${segmentProgress[segment.id] ? 'complete' : ''}`}>
        <button className="segment-select" aria-current={segment.id === selectedSegment?.id ? 'true' : undefined} onClick={() => changeSegment(segment.id)}>
          <span>{String(index + 1).padStart(2, '0')} · {segment.role.toUpperCase()}</span>
          <b>{locale === 'en' ? segment.title : segment.titleZh}</b>
          <small>{formatTime(segment.start)}–{formatTime(segment.end)} · {formatTime(segment.end - segment.start)}</small>
        </button>
        <button className="segment-check" aria-label={pick('切换片段完成状态','Toggle segment completion')} aria-pressed={Boolean(segmentProgress[segment.id])} onClick={() => toggleSegment(segment.id)}>{segmentProgress[segment.id] ? <CheckCircle weight="fill" /> : <Circle />}</button>
      </article>)}</div>
      {selectedSegment && isBilibili && !sourceStopsAtSegmentEnd && <p className="segment-source-note">{locale === 'en' ? segmentTiming.noteEn : segmentTiming.noteZh}</p>}
    </div>}
    <div className="media-frame">
      {!isEmbeddable ? <div className="cn-fallback global-fallback"><span>↗</span><b>{network === 'global' ? t('globalOriginal') : t('domesticOriginal')}</b><p>{resolvedSource ? (network === 'global' ? t('noGlobalEmbed') : t('noDomesticEmbed')) : t('noSource')}</p>{external && <a href={external} target="_blank" rel="noreferrer">{t('openOfficial')} <ArrowRight /></a>}</div> : active ? <iframe src={embed} title={locale === 'en' ? (source.titleEn || source.title) : source.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button onClick={() => { setActive(true); trackEvent('video_played', { network, platform: source.platform }) }}><DoodleArrow className="play-arrow" /><span><Play weight="fill" /></span><b>{t('loadPlayer', { platform:source.platform })}</b><small>{t('privacyLoad')}</small></button>}
    </div>
    <div className="media-meta"><div><span>{source.author} · {selectedSegment ? (sourceStopsAtSegmentEnd ? `${formatTime(selectedSegment.start)}–${formatTime(selectedSegment.end)}` : `${formatTime(sourceStart)} ${pick('起点 · 不自动停止','start · no automatic stop')}`) : source.duration}{selectedPart ? ` · ${locale === 'en' ? (selectedPart.labelEn || selectedPart.label) : selectedPart.label}` : ''}</span><h3>{selectedSegment ? (locale === 'en' ? selectedSegment.title : selectedSegment.titleZh) : (locale === 'en' ? (source.titleEn || source.title || media.globalTitle || media.title) : source.title)}</h3></div>{external && <a href={external} target="_blank" rel="noreferrer">{isEmbeddable ? t('openExternal') : t('openOfficial')} <ArrowRight /></a>}</div>
    <div className="watch-contract"><article><span>BEFORE</span><b>{t('beforeWatch')}</b><p>{selectedSegment?.before || media.before}</p></article><article><span>AFTER</span><b>{t('afterWatch')}</b><p>{selectedSegment?.after || media.after}</p></article></div>
  </section>
}

function LessonStudy({ module, lesson, onBack, onNavigate, theme, toggleTheme, complete, onToggleComplete, onSaveNote, onAccount, user, syncStatus }) {
  const { locale, t, pick } = useI18n()
  const material = useMemo(() => buildLessonMaterial(module, lesson, locale), [module, lesson, locale])
  const lessonKey = `uth-lesson-${lesson[0]}`
  const [section, setSection] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [showWorked, setShowWorked] = useState(false)
  const [note, setNote] = useState(() => localStorage.getItem(`${lessonKey}-note`) || '')
  const sectionLabels = [t('understand'),t('mechanism'),t('practice'),t('quiz'),t('masteryGate')]
  const readingProgress = complete ? 100 : (section + 1) * 20

  useEffect(() => {
    localStorage.setItem(`${lessonKey}-note`, note)
    localStorage.setItem(`${lessonKey}-note-updated`, new Date().toISOString())
    onSaveNote?.(lesson[0], note)
  }, [lessonKey, lesson, note, onSaveNote])
  useEffect(() => {
    const receive = event => {
      if (event.detail?.lessonId === lesson[0] && typeof event.detail.note === 'string') setNote(event.detail.note)
    }
    addEventListener('uth-learning-sync', receive)
    return () => removeEventListener('uth-learning-sync', receive)
  }, [lesson])
  useEffect(() => {
    const targets = sectionLabels.map((_, index) => document.getElementById(`study-${index}`)).filter(Boolean)
    if (!targets.length || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setSection(Number(visible.target.id.replace('study-', '')))
    }, { rootMargin:'-22% 0px -62% 0px', threshold:[0, .2, .6] })
    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [lesson[0]])

  return <main className="study-shell" data-qa="reading-page">
    <header className="study-topbar">
      <button onClick={onBack}><ArrowLeft /> {t('backPath')}</button>
      <div className="study-progress"><span>{module.no} · {module.title} · {readingProgress}%</span><i aria-label={`${readingProgress}%`}><em style={{ width:`${readingProgress}%` }} /></i></div>
      <ShareButton theme={theme} compact surface="lesson_header" lessonId={lesson[0]} trackId={lesson[0].startsWith('wm.') ? 'world-models' : 'llm'} title={material.title} text={material.opening[0] || t('lessonLead')} />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} compact />
      <LanguageToggle compact />
      <AccountButton onClick={onAccount} user={user} syncStatus={syncStatus} compact />
    </header>

    <div className="study-layout">
      <aside className="study-nav">
        <span className="section-no">LESSON {material.id}</span>
        <h3>{material.title}</h3>
        <small>{material.type} · {material.duration}</small>
        <nav aria-label={pick('本节目录','Lesson outline')}>{sectionLabels.map((item, index) => <button key={item} className={section === index ? 'active' : ''} aria-current={section === index ? 'location' : undefined} aria-controls={`study-${index}`} onClick={() => { setSection(index); document.getElementById(`study-${index}`)?.scrollIntoView({ behavior: 'smooth' }) }}><span>0{index + 1}</span>{item}</button>)}</nav>
        <div className="study-source-mini"><span>{t('sources')}</span>{material.references.map(x => <b key={x}>{x}</b>)}</div>
      </aside>

      <article className="study-reading" aria-labelledby="lesson-title">
        <header className="reading-hero">
          <div className="study-breadcrumb">{module.no} {module.title} / {material.id}</div>
          <div className="reading-kicker"><span className="section-no">{t('theoryPracticeEvidence')}</span><span>{material.type}</span><span>{material.duration}</span></div>
          <h1 id="lesson-title"><EditorialTitle text={material.title} locale={locale} /></h1>
          <DoodleUnderline className="title-swash" />
          <p className="study-lead">{t('lessonLead')}</p>
          <aside className="reading-contract"><DoodleBook /><div><span>{pick('本节不是摘要','NOT A SUMMARY')}</span><b>{pick('先理解，再实现，最后留下可检查证据。','Understand it, build it, then leave inspectable evidence.')}</b><small>{material.practice.task}</small></div></aside>
        </header>

        <GeoAnswer lessonId={lesson[0]} />

        <section className="objective-card">
          <div><span className="section-no">LEARNING OBJECTIVES</span><h2>{t('objectives')}</h2></div>
          <ol>{material.objectives.map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol>
        </section>

        {material.media && <LessonMedia media={material.media} />}

        <section id="study-0" className="study-section">
          <span className="section-no">01 · INTUITION</span><h2>{t('whyNeed')}</h2>
          {material.opening.map(x => <p key={x}>{x}</p>)}
          <aside className="mental-prompt"><DoodleTape className="note-tape" /><Sparkle weight="fill" /><div><b>{t('predictFirst')}</b><p>{t('predictPrompt', { concept:material.concepts[0]?.name || material.title })}</p></div></aside>
        </section>

        <section id="study-1" className="study-section">
          <span className="section-no">02 · MECHANISM</span><h2>{t('causalChain')}</h2>
          <div className="concept-stack">{material.concepts.map((concept, i) => <article key={`${concept.name}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{concept.name}</h3><p>{concept.note}</p></div></article>)}</div>
          <div className="mechanism-loop">{material.workflow.map((x, i) => <div key={x}><span>STEP {i + 1}</span><b>{x}</b>{i < material.workflow.length - 1 && <ArrowRight />}</div>)}</div>
          <div className="worked-example"><div><span className="section-no">WORKED EXAMPLE</span><h3>{material.worked.title}</h3></div><ol>{material.worked.steps.map((x, i) => <li key={x}><span>{i + 1}</span>{x}</li>)}</ol><button onClick={() => setShowWorked(x => !x)}>{showWorked ? t('collapseCheck') : t('whatCheck')}</button>{showWorked && <p>{material.worked.question}</p>}</div>
          <div className="misconception"><DoodleWarn className="warn-doodle" /><b>{t('pitfall')}</b><p>{material.misconception}</p></div>
        </section>

        {material.spotlight && <section className="paper-spotlight">
          <span className="section-no">{material.spotlight.kicker || 'RESEARCH BRIDGE · DSPARK'}</span><h2>{material.spotlight.title}</h2><p>{material.spotlight.body}</p>
          <ul>{material.spotlight.points.map(x => <li key={x}><Check />{x}</li>)}</ul>
          <small>{material.spotlight.note || pick('基于用户提供的 DSpark 论文整理；速度数字需连同硬件、负载和匹配吞吐条件阅读。','Based on the supplied DSpark paper. Read speed claims together with hardware, load, and matched-throughput conditions.')}</small>
        </section>}

        <section id="study-2" className="study-section">
          <span className="section-no">03 · BUILD & VERIFY</span><h2>{material.practice.task}</h2>
          <div className="practice-steps">{material.practice.steps.map((x, i) => <article key={x}><span>{i + 1}</span><p>{x}</p></article>)}</div>
          <div className="study-code"><div><span>{material.codeLabel || 'minimal_experiment.py'}</span><em>{t('copyable')}</em></div><pre><code>{material.code}</code></pre></div>
          <div className="evidence-box"><div><span className="section-no">EVIDENCE PACK</span><h3>{t('evidencePack')}</h3></div><ul>{material.practice.evidence.map(x => <li key={x}><CheckCircle />{x}</li>)}</ul></div>
        </section>

        <section id="study-3" className="study-section quiz-card">
          <span className="section-no">04 · RETRIEVAL CHECK</span><h2>{material.quiz.question}</h2>
          <div>{material.quiz.options.map((x, i) => <button key={x} className={answer === i ? (i === 0 ? 'correct' : 'wrong') : ''} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{x}{answer === i && (i === 0 ? <CheckCircle weight="fill" /> : <X weight="bold" />)}</button>)}</div>
          {answer !== null && <p className={`quiz-feedback ${answer === 0 ? 'ok' : ''}`} aria-live="polite">{answer === 0 ? t('correct') : t('almost')} {material.quiz.explanation}</p>}
        </section>

        <section className="notes-card">
          <DoodleTape className="note-tape notes-tape" />
          <span className="section-no">FIELD NOTES · {user ? t('localCloud') : t('localAuto')}</span><h2>{t('notesTitle')}</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('notesPlaceholder')} />
          <small>{t('charsGoal', { count:note.length })}</small>
        </section>

        <section id="study-4" className="mastery-gate-study">
          <div><span className="section-no">05 · MASTERY GATE</span><h2>{t('masteryQuestion')}</h2><DoodleTarget className="gate-doodle" /></div>
          <ul>{material.mastery.map(x => <li key={x}><Circle />{x}</li>)}</ul>
        </section>

        <footer className="study-footer">
          <button className="secondary" onClick={() => onNavigate(-1)}><ArrowLeft /> {t('previous')}</button>
          <button className={`complete-lesson ${complete ? 'done' : ''}`} onClick={onToggleComplete}>{complete ? <CheckCircle weight="fill" /> : <Circle />}{complete ? t('completeAgain') : t('markComplete')}</button>
          <button className="primary" onClick={() => onNavigate(1)}>{t('next')} <ArrowRight /></button>
        </footer>
      </article>
    </div>
  </main>
}

function GeoAnswer({ lessonId }) {
  const { locale, pick } = useI18n()
  const brief = getGeoBrief(lessonId, locale)
  if (!brief) return null
  return <section className="geo-answer" data-geo-answer>
    <header><div><span className="section-no">DIRECT ANSWER · VERIFIED SOURCES</span><h2>{brief.question}</h2></div><time dateTime={GEO_UPDATED_AT}>{pick('更新于','Updated')} {GEO_UPDATED_AT}</time></header>
    <p className="geo-answer-lead">{brief.answer}</p>
    {brief.alignment && <p className="geo-answer-alignment"><strong>{pick('视频对齐','Lecture alignment')}</strong>{brief.alignment}</p>}
    <div className="geo-answer-grid">
      <div><strong>{pick('三个关键结论','Three key takeaways')}</strong><ul>{brief.points.map(point => <li key={point}><Check />{point}</li>)}</ul></div>
      <aside><strong>{pick('边界与常见误解','Boundary & caveat')}</strong><p>{brief.boundaries}</p></aside>
    </div>
    <footer><span>{pick('一手来源','Primary sources')}</span>{brief.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowRight /></a>)}</footer>
  </section>
}

function SearchModal({ onClose, onOpen }) {
  const { locale, pick } = useI18n()
  const flatLessons = useMemo(() => [
    ...flattenLessons(localizeModules(modules, locale)).map(item => ({ ...item, trackId:'llm' })),
    ...flattenLessons(localizeWorldModules(locale)).map(item => ({ ...item, trackId:'world-models' })),
  ], [locale])
  const [q, setQ] = useState('')
  const results = flatLessons.filter(x => `${x.lesson[1]}${x.lesson[4]}${x.lesson[5]}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  useEffect(() => { const fn = e => e.key === 'Escape' && onClose(); addEventListener('keydown', fn); return () => removeEventListener('keydown', fn) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="command-modal" onMouseDown={e => e.stopPropagation()}>
    <label><MagnifyingGlass /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={pick('搜索课程、概念或实践任务','Search lessons, concepts, or deliverables')} /><kbd>ESC</kbd></label>
    <div className="command-results"><span className="section-no">{q ? pick(`找到 ${results.length} 项`,`${results.length} results`) : pick('推荐继续','Recommended next')}</span>{results.map(x => <button key={`${x.module.id}-${x.lesson[0]}`} onClick={() => onOpen(x.module, x.lesson, x.index, x.trackId)}><BookOpen /><span><strong>{x.lesson[1]}</strong><small>{x.trackId === 'world-models' ? 'WORLD MODELS' : 'LLM'} · {x.module.no} {x.module.title}</small></span><ArrowRight /></button>)}</div>
  </div></div>
}

export default function App() {
  const { locale, setLocale } = useI18n()
  const { user, recovery } = useAuth()
  const [trackId, setTrackId] = useState(() => matchSitePath(location.pathname).trackId || 'llm')
  const localizedModules = useMemo(() => trackModules(trackId, locale), [trackId, locale])
  const flatLessons = useMemo(() => flattenLessons(localizedModules), [localizedModules])
  const [view, setView] = useState('home')
  const [moduleIndex, setModuleIndex] = useState(1)
  const [lessonInfo, setLessonInfo] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('uth-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  const [completed, setCompleted] = useState(() => new Set(lessonIds.filter(id => localStorage.getItem(`uth-lesson-${id}-complete`) === '1')))
  const sync = useLearningSync({ lessonIds, completed, setCompleted, theme, setTheme })
  const saveNote = useCallback((id, note) => sync.saveLesson(id, { note }, { debounce: true }), [sync.saveLesson])
  const trackCompleted = flatLessons.filter(item => completed.has(item.lesson[0])).length
  const progress = Math.round((trackCompleted / flatLessons.length) * 100)
  const openLesson = (module = localizedModules[trackId === 'world-models' ? 0 : 2], lesson = module.lessons[trackId === 'world-models' ? 0 : 2], index = trackId === 'world-models' ? 0 : 2, targetTrack = trackId) => {
    if (targetTrack !== trackId) setTrackId(targetTrack)
    setLessonInfo({ module, lesson, index }); setView('lesson'); setSearch(false)
    const nextPath = lessonPath(lesson[0], locale)
    if (location.pathname !== nextPath) history.pushState({ lessonId: lesson[0] }, '', `${nextPath}${location.search}`)
    scrollTo(0, 0)
    sync.saveLesson(lesson[0], { last_opened_at: new Date().toISOString() })
    sync.saveProfile({ last_lesson_id: lesson[0] })
    trackEvent('lesson_started', { lesson_id: lesson[0], module_id: module.id, track_id: targetTrack, locale })
  }
  const closeLesson = () => {
    setView('path')
    history.pushState({ view: 'path', trackId }, '', `${trackPath(trackId, locale)}${location.search}`)
    scrollTo(0, 0)
  }
  const toggleLessonComplete = () => {
    const id = lessonInfo?.lesson?.[0]
    if (!id) return
    setCompleted(previous => {
      const next = new Set(previous)
      const isCompleting = !next.has(id)
      if (!isCompleting) { next.delete(id); localStorage.removeItem(`uth-lesson-${id}-complete`) }
      else { next.add(id); localStorage.setItem(`uth-lesson-${id}-complete`, '1') }
      sync.saveLesson(id, { completed: isCompleting, completed_at: isCompleting ? new Date().toISOString() : null })
      trackEvent(isCompleting ? 'lesson_completed' : 'lesson_reopened', { lesson_id: id, locale })
      return next
    })
  }
  const navigateLesson = (delta) => {
    const currentId = lessonInfo?.lesson?.[0] || (trackId === 'world-models' ? 'wm.0.1' : '1.3')
    const currentIndex = flatLessons.findIndex(x => x.lesson[0] === currentId)
    const target = flatLessons[Math.max(0, Math.min(flatLessons.length - 1, currentIndex + delta))]
    if (target) openLesson(target.module, target.lesson, target.index)
  }
  const changeTrack = (nextTrack) => {
    if (nextTrack === trackId) return
    setTrackId(nextTrack)
    setModuleIndex(0)
    setLessonInfo(null)
    setView('home')
    setMobileNav(false)
    history.pushState({ view:'home', trackId:nextTrack }, '', `${trackPath(nextTrack, locale)}${location.search}`)
    scrollTo(0, 0)
    trackEvent('track_switched', { from:trackId, to:nextTrack, locale })
  }
  const toggleTheme = () => setTheme(x => x === 'dark' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('uth-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07110e' : '#f5f7f5')
  }, [theme])
  useEffect(() => {
    const id = lessonInfo?.lesson?.[0]
    if (view !== 'lesson' || !id) return
    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify({ id, trackId, at: Date.now() }))
  }, [view, lessonInfo?.lesson?.[0], trackId])
  useEffect(() => {
    const syncFromLocation = () => {
      const matched = matchSitePath(location.pathname)
      const legacyId = legacyLessonId(location.hash)
      const targetRoute = legacyId
        ? matchSitePath(lessonPath(legacyId, matched.locale || locale)).route
        : matched.type === 'lesson' ? matched.route : null

      if (targetRoute) {
        const routeLocale = matched.locale || locale
        setLocale(routeLocale)
        setTrackId(targetRoute.trackId)
        const routeModules = trackModules(targetRoute.trackId, routeLocale)
        setLessonInfo({ module: routeModules[targetRoute.moduleIndex], lesson: routeModules[targetRoute.moduleIndex].lessons[targetRoute.lessonIndex], index: targetRoute.lessonIndex })
        setModuleIndex(targetRoute.moduleIndex)
        setView('lesson')
        if (legacyId || matched.needsCanonical || location.hash) {
          history.replaceState({ lessonId: targetRoute.id }, '', `${lessonPath(targetRoute.id, routeLocale)}${location.search}`)
        }
        return
      }

      if (matched.locale) {
        setLocale(matched.locale)
        setTrackId(matched.trackId || 'llm')
      } else history.replaceState({ view: 'home' }, '', `${trackPath(trackId, locale)}${location.search}`)
      setView('home')
      setLessonInfo(null)
    }

    syncFromLocation()
    addEventListener('popstate', syncFromLocation)
    return () => removeEventListener('popstate', syncFromLocation)
  }, [locale, setLocale, trackId])
  useEffect(() => {
    const fn = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true) } }
    addEventListener('keydown', fn); return () => removeEventListener('keydown', fn)
  }, [])
  useEffect(() => {
    const receive = event => sync.saveProfile({ network_mode: event.detail?.network || 'cn' })
    addEventListener('uth-network-change', receive)
    return () => removeEventListener('uth-network-change', receive)
  }, [sync.saveProfile])
  useEffect(() => {
    if (recovery) setAccountOpen(true)
  }, [recovery])
  useEffect(() => {
    const receive = event => {
      const nextLocale = event.detail?.locale
      if (nextLocale !== 'zh' && nextLocale !== 'en') return
      const lessonId = lessonInfo?.lesson?.[0]
      const nextPath = view === 'lesson' && lessonId ? lessonPath(lessonId, nextLocale) : trackPath(trackId, nextLocale)
      history.replaceState(history.state, '', `${nextPath}${location.search}`)
    }
    addEventListener('uth-locale-change', receive)
    return () => removeEventListener('uth-locale-change', receive)
  }, [view, lessonInfo?.lesson?.[0], trackId])
  useEffect(() => {
    const lessonId = lessonInfo?.lesson?.[0]
    applyDocumentSeo(view === 'lesson' && lessonId ? getLessonSeo(lessonId, locale) : getHomeSeo(locale, trackId))
  }, [view, locale, trackId, lessonInfo?.lesson?.[0]])
  useEffect(() => {
    trackEvent('view_changed', { view, locale })
  }, [view, locale])
  const resumeInfo = useMemo(() => resolveLastLesson(locale), [locale, view, completed])
  const notesCount = useMemo(() => lessonIds.reduce((n, id) => n + ((localStorage.getItem(`uth-lesson-${id}-note`) || '').trim() ? 1 : 0), 0), [view, completed])
  const continueLearning = () => {
    const found = resolveLastLesson(locale)
    if (found) { openLesson(found.module, found.lesson, found.index, found.trackId); return }
    openLesson()
  }
  const accountModal = accountOpen && <AccountModal onClose={() => setAccountOpen(false)} progress={progress} completedCount={trackCompleted} totalLessons={flatLessons.length} syncStatus={sync.status} lastSynced={sync.lastSynced} />
  const currentLessonInfo = lessonInfo ? flatLessons.find(item => item.lesson[0] === lessonInfo.lesson[0]) || lessonInfo : null
  if (view === 'lesson') return <><LessonView info={currentLessonInfo} onBack={closeLesson} onNavigate={navigateLesson} theme={theme} toggleTheme={toggleTheme} complete={completed.has(currentLessonInfo?.lesson?.[0])} onToggleComplete={toggleLessonComplete} onSaveNote={saveNote} onAccount={() => setAccountOpen(true)} user={user} syncStatus={sync.status} />{accountModal}</>
  return <div className="app-shell">
    <Sidebar view={view} setView={setView} open={mobileNav} onClose={() => setMobileNav(false)} progress={progress} theme={theme} toggleTheme={toggleTheme} trackId={trackId} onTrack={changeTrack} />
    <div className="app-main"><Topbar onMenu={() => setMobileNav(true)} onSearch={() => setSearch(true)} theme={theme} toggleTheme={toggleTheme} progress={progress} onAccount={() => setAccountOpen(true)} user={user} syncStatus={sync.status} />
      {view === 'home' && <Dashboard goLesson={continueLearning} setView={setView} trackId={trackId} onTrack={changeTrack} completed={completed} notesCount={notesCount} resume={resumeInfo} theme={theme} />}
      {view === 'path' && <Curriculum selected={moduleIndex} setSelected={setModuleIndex} goLesson={openLesson} completed={completed} trackId={trackId} />}
      {view === 'labs' && <Labs goLesson={() => openLesson()} trackId={trackId} />}
      {view === 'projects' && <Projects trackId={trackId} />}
      {view === 'library' && <Library trackId={trackId} />}
    </div>
    {search && <SearchModal onClose={() => setSearch(false)} onOpen={openLesson} />}
    {accountModal}
  </div>
}

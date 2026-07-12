import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BracketsCurly, Check, CheckCircle, Circle,
  Clock, Code, Command, Cube, Flask, FolderOpen, Gauge, GithubLogo, House,
  List, MagnifyingGlass, Play, ReadCvLogo, RocketLaunch, Rows, Sparkle,
  TerminalWindow, X, Moon, Sun, VideoCamera, ShareNetwork,
} from '@phosphor-icons/react'
import { modules, resources } from './data.js'
import { buildLessonMaterial, lessonHasMedia, lessonMediaStats, resolveMediaSource } from './lessonContent.js'
import { AccountButton, AccountModal, useAuth, useLearningSync } from './auth.jsx'
import { LanguageToggle, useI18n } from './i18n.jsx'
import { localizeModules, localizeResources, sourceTypesFor } from './localizedData.js'
import { trackEvent } from './analytics.js'
import { homePath, legacyLessonId, lessonPath, matchSitePath } from './lessonRoutes.js'
import { applyDocumentSeo, getHomeSeo, getLessonSeo } from './seo.js'
import { GEO_UPDATED_AT, getGeoBrief } from './geoContent.js'

const flattenLessons = data => data.flatMap((m) => m.lessons.map((l, i) => ({ module: m, lesson: l, index: i })))
const lessonIds = flattenLessons(modules).map(x => x.lesson[0])

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

function Sidebar({ view, setView, open, onClose, progress, theme, toggleTheme }) {
  const { t, pick } = useI18n()
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><Brand /><button className="icon-button mobile-only" onClick={onClose}><X /></button></div>
    <nav className="main-nav" aria-label="主要导航">
      {navItems.map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => { setView(id); onClose() }}>
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

function ShareButton({ title, text, surface = 'home', lessonId = null, compact = false }) {
  const { pick } = useI18n()
  const [done, setDone] = useState(false)
  const onShare = async () => {
    const url = new URL(location.pathname, location.origin)
    url.searchParams.set('utm_source', 'learner_share')
    url.searchParams.set('utm_medium', 'referral')
    url.searchParams.set('utm_campaign', 'organic_growth')
    url.searchParams.set('utm_content', lessonId ? `lesson_${lessonId}` : surface)
    let method = 'copy'
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: url.toString() })
        method = 'native'
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString())
      } else {
        const input = document.createElement('textarea')
        input.value = url.toString(); input.style.position = 'fixed'; input.style.opacity = '0'
        document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove()
      }
      setDone(true)
      setTimeout(() => setDone(false), 1800)
      trackEvent('content_shared', { method, surface, lesson_id: lessonId })
    } catch (error) {
      if (error?.name !== 'AbortError') trackEvent('content_share_failed', { surface, lesson_id: lessonId })
    }
  }
  return <button className={`share-button ${compact ? 'compact' : ''}`} data-share-button onClick={onShare} aria-label={pick('分享课程','Share course')}>
    <ShareNetwork weight={done ? 'fill' : 'regular'} /> {done ? pick('已准备好','Ready') : pick('分享课程','Share course')}
  </button>
}

function Topbar({ onMenu, onSearch, theme, toggleTheme, progress, onAccount, user, syncStatus }) {
  const { t } = useI18n()
  return <header className="topbar">
    <button className="icon-button mobile-only" onClick={onMenu}><List /></button>
    <button className="search-trigger" onClick={onSearch} aria-label={t('search')}><MagnifyingGlass size={17} /><span>{t('search')}</span><kbd>⌘ K</kbd></button>
    <div className="top-progress"><span>{t('totalProgress')} <b>{progress}%</b></span><i><em style={{ width: `${progress}%` }} /></i></div>
    <LanguageToggle />
    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    <AccountButton onClick={onAccount} user={user} syncStatus={syncStatus} />
  </header>
}

function Dashboard({ goLesson, setView }) {
  const { pick, locale } = useI18n()
  const localized = useMemo(() => localizeModules(modules, locale), [locale])
  return <main className="page dashboard-page">
    <section className="hero-grid">
      <div className="hero-copy">
        <h1>{pick('别只会调用模型。','Don’t just call a model.')}<br /><em>{pick('亲手造一个。','Build one yourself.')}</em></h1>
        <p>{pick('从 0 到 1 拆开大模型：推导、实现、训练、对齐、部署。不是“看懂了”，而是能够解释、复现和诊断。','Take an LLM apart from first principles: derive, implement, train, align, and deploy. The goal is not recognition—it is explanation, reproduction, and diagnosis.')}</p>
        <div className="hero-actions">
          <button className="primary" onClick={goLesson}>{pick('继续学习','Continue learning')} <ArrowRight weight="bold" /></button>
          <button className="secondary" onClick={() => setView('path')}>{pick('查看完整路线','View full path')}</button>
          <ShareButton title={pick('LLM Study · 免费大模型系统课','LLM Study · Free systems course for LLMs')} text={pick('69 节中英双语课程，从反向传播、Token 和 Transformer 到训练、推理与 Agent。','69 bilingual lessons from backpropagation, tokens, and Transformers to training, inference, and agents.')} />
        </div>
        <div className="signal-map" aria-label="从 token 到 agent 的学习信号图">
          <div className="signal-line" />
          {['TOKENS', 'BACKPROP', 'GPT', 'ALIGNMENT', 'AGENTS'].map((x, i) => <span key={x} style={{ left: `${i * 24.5}%`, top: i % 2 ? 57 : 26 }}>{x}</span>)}
        </div>
      </div>
      <CurrentLesson goLesson={goLesson} />
    </section>
    <Roadmap modulesData={localized} />
    <section className="dashboard-lower">
      <Today goLesson={goLesson} />
      <MasteryPanel />
    </section>
    <section className="method-strip">
      <div><span className="section-no">LEARNING LOOP</span><h2>{pick('80% 掌握，靠四次经过同一知识','Reach 80% mastery by revisiting each idea four ways')}</h2></div>
      <div className="loop-steps">
        {(locale === 'zh' ? ['建立直觉', '推导公式', '从零实现', '诊断迁移'] : ['Build intuition', 'Derive it', 'Implement it', 'Diagnose & transfer']).map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong></div>)}
      </div>
    </section>
  </main>
}

function CurrentLesson({ goLesson }) {
  const { pick } = useI18n()
  return <article className="current-lesson">
    <div className="current-meta"><span><i /> {pick('当前学习','CURRENT')}</span><span>{pick('本周 4 / 6','THIS WEEK 4 / 6')}</span></div>
    <span className="chapter-code">01 · {pick('神经网络地基','NEURAL FOUNDATIONS')}</span>
    <h2>{pick('让梯度沿计算图','Make gradients flow')}<br />{pick('倒着走','backward')}</h2>
    <p>{pick('从局部导数到 reverse-mode autodiff，亲手实现一个微型 autograd 引擎。','Move from local derivatives to reverse-mode autodiff by implementing a tiny autograd engine.')}</p>
    <div className="code-window">
      <div className="code-title"><span>micrograd.py</span><span>Python</span></div>
      <pre><code>{codeSample.split('\n').slice(0, 9).join('\n')}</code></pre>
    </div>
    <button className="lesson-continue" onClick={goLesson}>{pick('打开学习工作台','Open learning workspace')} <ArrowRight /></button>
  </article>
}

function Roadmap({ modulesData = modules }) {
  const { pick } = useI18n()
  return <section className="roadmap-block">
    <div className="section-title-row"><div><span className="section-no">ROADMAP · 26 WEEKS</span><h2>{pick('从字符到智能系统','From characters to intelligent systems')}</h2></div><p>220–260 {pick('小时','hours')} · {flattenLessons(modulesData).length} {pick('节深度课','deep lessons')} · {lessonMediaStats.lessons} {pick('节视频研讨','video seminars')}</p></div>
    <div className="roadmap-rail">
      {modulesData.map((m, i) => <div className={`road-stop ${i === 1 ? 'current' : ''} ${i === 0 ? 'done' : ''}`} key={m.id}>
        <span>{i === 0 ? <Check /> : m.no}</span><strong>{m.short}</strong><small>{m.weeks}</small>
      </div>)}
    </div>
  </section>
}

function Today({ goLesson }) {
  const { pick, locale } = useI18n()
  const tasks = locale === 'zh' ? [
    ['读', '链式法则与计算图', '15 分钟', true],
    ['造', '实现 Value.__add__', '30 分钟', true],
    ['验', '有限差分梯度检查', '25 分钟', false],
    ['讲', '为什么需要拓扑排序？', '10 分钟', false],
  ] : [['READ','Chain rule and computation graph','15 min',true],['BUILD','Implement Value.__add__','30 min',true],['TEST','Finite-difference gradient check','25 min',false],['TEACH','Why topological ordering?','10 min',false]]
  return <section className="today-panel">
    <div className="panel-heading"><div><span className="section-no">TODAY · 80 MIN</span><h2>{pick('今天要做','Today’s work')}</h2></div><Clock size={21} /></div>
    <div className="task-list">
      {tasks.map(([tag, title, time, done], i) => <button key={title} className={i === 2 ? 'now' : ''} onClick={!done ? goLesson : undefined}>
        <span className={`task-check ${done ? 'done' : ''}`}>{done ? <Check /> : ''}</span><b>{tag}</b><strong>{title}</strong><small>{time}</small>{i === 2 && <em>{pick('开始','Start')}</em>}
      </button>)}
    </div>
  </section>
}

function MasteryPanel() {
  const { pick, locale } = useI18n()
  return <section className="mastery-panel">
    <div className="panel-heading"><div><span className="section-no">MASTERY GATE</span><h2>{pick('不是完成，是掌握','Completion is not mastery')}</h2></div><Gauge size={22} /></div>
    <div className="mastery-bars">
      {(locale === 'zh' ? [['解释',72],['实现',48],['诊断',31],['迁移',18]] : [['Explain',72],['Implement',48],['Diagnose',31],['Transfer',18]]).map(([k, v]) => <div key={k}><span>{k}<b>{v}%</b></span><i><em style={{ width: `${v}%` }} /></i></div>)}
    </div>
    <p>{pick('下一道门：闭卷重写 micrograd，并对三个错误梯度进行定位。','Next gate: rewrite micrograd closed-book and diagnose three incorrect gradients.')}</p>
  </section>
}

function Curriculum({ selected, setSelected, goLesson, completed }) {
  const { locale, pick, t } = useI18n()
  const modulesData = useMemo(() => localizeModules(modules, locale), [locale])
  const current = modulesData[selected]
  return <main className="page curriculum-page">
    <header className="page-lead">
      <span className="section-no">THE COMPLETE PATH</span>
      <h1>{pick('一条能走到底的','A complete path through')}<br />{pick('大模型学习路线','large language models')}</h1>
      <p>{pick('26 周不是速成承诺，而是一套可验证的能力建造计划。每阶段都以作品和掌握门结束。','This is not a 26-week shortcut. It is a verifiable capability-building plan; every phase ends with a project and a mastery gate.')}</p>
      <div className="curriculum-stats"><span><b>{flattenLessons(modulesData).length}</b> {pick('深度课','deep lessons')}</span><span><b>{lessonMediaStats.lessons}</b> {pick('视频研讨','video seminars')}</span><span><b>24</b> {pick('核心实验','core labs')}</span><span><b>8</b> {pick('阶段作品','phase projects')}</span></div>
    </header>
    <div className="curriculum-layout">
      <aside className="module-index">
        {modulesData.map((m, i) => <button key={m.id} onClick={() => setSelected(i)} className={selected === i ? 'active' : ''}>
          <span>{m.no}</span><div><strong>{m.title}</strong><small>{m.weeks} · {m.hours}h</small></div><ArrowRight />
        </button>)}
      </aside>
      <section className="module-detail">
        <div className="module-head"><div><span className="section-no">PHASE {current.no}</span><h2>{current.title}</h2><p>{current.summary}</p></div><div className="module-time"><strong>{current.weeks}</strong><span>{current.hours} {pick('小时','hours')}</span></div></div>
        <blockquote>{pick('核心问题：','Core question: ')}{current.question}</blockquote>
        <div className="lesson-table">
          <div className="lesson-table-head"><span>{pick('课程','Lesson')}</span><span>{pick('理论内核','Theory')}</span><span>{pick('实践产出','Deliverable')}</span><span>{pick('时长','Time')}</span></div>
          {current.lessons.map((l, i) => <button key={l[0]} className={completed.has(l[0]) ? 'completed-row' : ''} onClick={() => goLesson(current, l, i)}>
            <span><i>{l[0]}</i><strong>{l[1]}</strong><em>{l[2]}</em>{lessonHasMedia(l[0]) && <small className="lesson-video"><VideoCamera weight="fill" /> {t('video')}</small>}</span><span>{l[4]}</span><span>{l[5]}</span><span>{l[3]} <ArrowRight /></span>
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

function Labs({ goLesson }) {
  const { locale, pick } = useI18n()
  const labs = locale === 'zh' ? [
    ['01', '梯度显微镜', '拖动输入与权重，观察局部导数如何沿计算图累积。', '反向传播', '35 min'],
    ['02', 'Tokenizer 病理室', '比较中、英、日、数字和代码的 BPE 切分与压缩率。', 'Token', '45 min'],
    ['03', 'Attention 解剖台', '逐格查看 QK 相似度、mask、softmax 与 value 聚合。', 'Transformer', '55 min'],
    ['04', '训练急诊室', '面对 loss spike、NaN、显存溢出和过拟合，完成故障定位。', '训练系统', '70 min'],
    ['05', '采样风洞', '改变 temperature、top-k、top-p，建立输出多样性相图。', '推理', '40 min'],
    ['06', 'Agent 轨迹审计', '从工具调用轨迹判断规划、权限和终止条件是否可靠。', 'Agent', '60 min'],
  ] : [['01','Gradient Microscope','Drag inputs and weights to observe local derivatives accumulate through a graph.','Backprop','35 min'],['02','Tokenizer Pathology Lab','Compare BPE splits and compression for language, numbers, and code.','Tokens','45 min'],['03','Attention Dissection','Inspect QK similarity, masks, softmax, and value aggregation cell by cell.','Transformer','55 min'],['04','Training ER','Diagnose loss spikes, NaNs, OOMs, and overfitting.','Training','70 min'],['05','Sampling Wind Tunnel','Map temperature, top-k, and top-p to diversity and quality.','Inference','40 min'],['06','Agent Trace Audit','Judge planning, permissions, and termination from tool-call traces.','Agents','60 min']]
  return <main className="page catalog-page">
    <header className="page-lead compact"><span className="section-no">EXPERIMENTS</span><h1>{pick('最好的老师，','The best teacher')}<br />{pick('是一个反直觉的结果。','is a surprising result.')}</h1><p>{pick('每个实验都要求先预测、再运行、后解释；没有“点一下看动画”的伪互动。','Every lab requires a prediction, a run, and an explanation—no click-to-watch pseudo-interactivity.')}</p></header>
    <div className="lab-grid">{labs.map(([n, title, desc, phase, time], i) => <article key={n}>
      <div className="lab-no">{n}<Flask /></div><span className="section-no">{phase} · {time}</span><h2>{title}</h2><p>{desc}</p><button onClick={i === 0 ? goLesson : undefined}>{pick('进入实验','Open lab')} <ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Projects() {
  const { locale, pick } = useI18n()
  const modulesData = useMemo(() => localizeModules(modules, locale), [locale])
  return <main className="page projects-page">
    <header className="page-lead compact"><span className="section-no">BUILD IN PUBLIC</span><h1>{pick('八个作品，','Eight projects.')}<br />{pick('证明你真的会。','Proof that you can build.')}</h1><p>{pick('每个作品都能独立发布：有源码、有实验、有测试、有失败复盘，不只是 notebook 截图。','Every project is publishable: source, experiments, tests, and failure reviews—not notebook screenshots.')}</p></header>
    <div className="project-list">{modulesData.map((m, i) => <article key={m.id}>
      <div className="project-index"><span>{m.no}</span><i className={i === 0 ? 'done' : i === 1 ? 'active' : ''} /></div>
      <div><span className="section-no">{m.weeks} · {m.hours} HOURS</span><h2>{m.project.split('：')[0]}</h2><p>{m.project.includes('：') ? m.project.split('：').slice(1).join('：') : m.project}</p></div>
      <div className="project-proof"><span>{pick('验收证据','Evidence')}</span><b>README</b><b>{pick('测试','Tests')}</b><b>{pick('实验报告','Report')}</b><b>{pick('演示','Demo')}</b></div>
      <button className="icon-button"><ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Library() {
  const { locale, pick } = useI18n()
  const types = sourceTypesFor(locale)
  const localizedResources = useMemo(() => localizeResources(resources, locale), [locale])
  const [type, setType] = useState(types[0])
  const [query, setQuery] = useState('')
  useEffect(() => setType(types[0]), [locale])
  const filtered = localizedResources.filter(r => (type === types[0] || r.type === type) && `${r.author}${r.title}${r.phase}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="page library-page">
    <header className="page-lead compact"><span className="section-no">CURATED SOURCES</span><h1>{pick('不是链接仓库，','Not a link dump.')}<br />{pick('是大师课导航。','A guide to master classes.')}</h1><p>{pick('只选一手、可复现、高信噪比材料。每一份都标明学习位置和使用方式。','Only primary, reproducible, high-signal material—each source has a clear place and purpose.')}</p></header>
    <div className="library-tools"><label><MagnifyingGlass /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={pick('搜索作者、项目或主题','Search author, project, or topic')} /></label><div>{types.map(x => <button className={type === x ? 'active' : ''} onClick={() => setType(x)} key={x}>{x}</button>)}</div></div>
    <div className="resource-table"><div className="resource-head"><span>{pick('来源 / 题目','Source / Title')}</span><span>{pick('用于','Used for')}</span><span>{pick('使用说明','How to use it')}</span><span /></div>{filtered.map(r => <a key={r.title} href={r.url} target="_blank" rel="noreferrer">
      <span><i>{r.type}</i><strong>{r.title}</strong><small>{r.author}</small></span><span>{r.phase}<b>{r.level}</b></span><span>{r.note}</span><ArrowRight />
    </a>)}</div>
  </main>
}

function LessonView({ info, onBack, onNavigate, theme, toggleTheme, complete, onToggleComplete, onSaveNote, onAccount, user, syncStatus }) {
  const { locale } = useI18n()
  const [tab, setTab] = useState('代码')
  const [ran, setRan] = useState(false)
  const localized = useMemo(() => localizeModules(modules, locale), [locale])
  const fallbackModule = localized[1]
  const module = info?.module || fallbackModule
  const lesson = info?.lesson || fallbackModule.lessons[2]
  const lessonKey = `uth-lesson-${lesson[0]}`
  const [reflection, setReflection] = useState(() => localStorage.getItem(`${lessonKey}-note`) || '')
  const specialMaterial = buildLessonMaterial(module, lesson, locale)
  useEffect(() => {
    setReflection(localStorage.getItem(`${lessonKey}-note`) || '')
  }, [lessonKey])
  useEffect(() => {
    if (lesson[0] !== '1.3') return
    localStorage.setItem(`${lessonKey}-note`, reflection)
    localStorage.setItem(`${lessonKey}-note-updated`, new Date().toISOString())
    onSaveNote?.(lesson[0], reflection)
  }, [lesson, lessonKey, reflection, onSaveNote])
  useEffect(() => {
    const receive = event => {
      if (event.detail?.lessonId === lesson[0] && typeof event.detail.note === 'string') setReflection(event.detail.note)
    }
    addEventListener('uth-learning-sync', receive)
    return () => removeEventListener('uth-learning-sync', receive)
  }, [lesson])
  return <LessonStudy key={`${locale}-${lesson[0]}`} module={module} lesson={lesson} onBack={onBack} onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} complete={complete} onToggleComplete={onToggleComplete} onSaveNote={onSaveNote} onAccount={onAccount} user={user} syncStatus={syncStatus} />
  /* Legacy bespoke micrograd workstation retained for a future bilingual editor pass. */
  const outline = ['直觉', '链式法则', '计算图', '实现 Value', '拓扑排序', '梯度检查']
  return <main className="lesson-shell">
    <aside className="lesson-outline">
      <button onClick={onBack}><ArrowLeft /> 返回课程</button>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <AccountButton onClick={onAccount} user={user} syncStatus={syncStatus} compact />
      <span className="section-no">{module.no} {module.title}</span>
      <h3>{lesson[0]} {lesson[1]}</h3>
      <div>{outline.map((x, i) => <button className={i === 3 ? 'active' : i < 3 ? 'done' : ''} key={x}><span>{i < 3 ? <Check /> : i + 1}</span>{x}</button>)}</div>
    </aside>
    <article className="lesson-reading">
      <div className="lesson-breadcrumb">{module.no} {module.title} / {lesson[0]} {lesson[1]}</div>
      <span className="section-no">CONCEPT → DERIVATION → CODE</span>
      <h1>让梯度沿计算图<br />倒着走</h1>
      <p className="lead">从局部导数到 reverse-mode autodiff，亲手实现一个微型 autograd 引擎。</p>
      {specialMaterial.media && <LessonMedia media={specialMaterial.media} />}
      <hr />
      <section><span className="section-no">01 · INTUITION</span><h2>先建立直觉：梯度是敏感度</h2><p>前向传播像水从上游流向下游：输入经过一连串局部运算，最后形成损失。反向传播则从 loss 出发，把“如果这里动一点，loss 会动多少”这条消息沿原路送回去。</p><p>关键并不是背导数表，而是把复杂函数拆成小节点。每条边只负责一个局部导数，节点再把上游梯度乘进来。</p></section>
      <section><span className="section-no">02 · DERIVATION</span><h2>链式法则，其实是消息传递</h2><p>设中间变量 <code>z = f(x, y)</code>，最终损失 <code>L = g(z)</code>。我们关心的不是孤立的局部导数，而是 x 对最终 L 的影响：</p><div className="formula">∂L / ∂x = (∂L / ∂z) · (∂z / ∂x)</div><p>右边第一项是从下游传来的“上游梯度”，第二项是当前边的“局部导数”。乘法完成了影响的连接；若同一变量通过多条路径影响 L，则各路径贡献相加。</p></section>
      <aside className="insight"><Sparkle weight="fill" /><div><strong>Karpathy 的教学切口</strong><p>先在标量上把每个加法和乘法都展开。它很慢，却让动态计算图、梯度累加和拓扑顺序无处藏身；理解以后再把标量换成张量。</p></div></aside>
      <section><span className="section-no">03 · IMPLEMENTATION</span><h2>Value 需要保存什么？</h2><ul className="reading-list"><li><b>data</b>：当前节点的前向数值</li><li><b>grad</b>：最终输出对它的导数，初始为 0</li><li><b>_prev</b>：产生它的父节点集合</li><li><b>_backward</b>：把上游梯度分配给父节点的局部规则</li></ul></section>
      <section className="checkpoint"><span>停下来预测</span><h3>如果 <code>a</code> 同时被两条分支使用，为什么不能写 <code>a.grad = ...</code>？</h3><button onClick={() => alert('提示：两条路径对最终 loss 的影响都要保留。想想多元链式法则中的求和。')}>给我一点提示</button></section>
      <div className="reflection"><span className="section-no">LEARNING CHECK</span><h3>用自己的话解释：为什么反向传播需要拓扑排序？</h3><textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="不要复制定义。试着用‘依赖’和‘上游梯度’解释……" /><small>{reflection.length} / 600 · 写满 80 字后进入自评</small></div>
    </article>
    <aside className="workbench">
      <div className="work-tabs">{['解释', '代码', '可视化'].map(x => <button className={tab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>{x}</button>)}</div>
      {tab === '代码' && <><div className="editor"><div><span>micrograd.py</span><i /></div><pre><code>{codeSample}</code></pre></div><Graph ran={ran} /></>}
      {tab === '解释' && <div className="explain-panel"><span className="section-no">MENTAL MODEL</span><h3>一次 backward 的四步</h3>{['把输出节点 grad 设为 1', '对图做拓扑排序', '按逆序调用 _backward', '在父节点上累加梯度'].map((x, i) => <p key={x}><b>0{i + 1}</b>{x}</p>)}</div>}
      {tab === '可视化' && <Graph ran={ran} large />}
      <div className="work-actions"><button className="primary" onClick={() => setRan(true)}><Play weight="fill" />运行</button><button className="secondary" onClick={() => setRan(false)}>重置</button></div>
      <div className="completion"><button className={complete ? 'completed' : ''} onClick={onToggleComplete}>{complete ? <CheckCircle weight="fill" /> : <Circle />} {complete ? '本节已完成' : '标记完成'}</button><button className="primary" onClick={() => onNavigate(1)}>下一节 <ArrowRight /></button></div>
    </aside>
  </main>
}

function LessonMedia({ media }) {
  const { locale, t, pick } = useI18n()
  const [active, setActive] = useState(false)
  const [network, setNetwork] = useState(() => localStorage.getItem('uth-network') || ((navigator.language === 'zh-CN' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai') ? 'cn' : 'global'))
  const [partByNetwork, setPartByNetwork] = useState({})
  const resolvedSource = resolveMediaSource(media, network)
  const source = resolvedSource || { platform:'Original', title:media.title, author:media.author, duration:media.duration }
  const isYouTube = source.platform === 'YouTube'
  const isBilibili = source.platform === 'Bilibili'
  const isEmbeddable = isYouTube || isBilibili
  const parts = source.parts || []
  const selectedPage = partByNetwork[network] || source.page || parts[0]?.page || 1
  const selectedPart = parts.find(item => item.page === selectedPage)
  const embed = isYouTube
    ? `https://www.youtube-nocookie.com/embed/${source.id}?rel=0`
    : isBilibili ? `https://player.bilibili.com/player.html?bvid=${source.id}&page=${selectedPage}&high_quality=1&danmaku=0` : ''
  const external = isYouTube ? `https://www.youtube.com/watch?v=${source.id}` : isBilibili ? `https://www.bilibili.com/video/${source.id}?p=${selectedPage}` : source.url
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
  const changePart = page => { setPartByNetwork(current => ({ ...current, [network]: page })); setActive(false) }
  return <section className="lesson-media">
    <div className="media-heading"><div><span className="section-no">VIDEO SEMINAR · {source.platform}</span><h2>{t('watchThenBuild')}</h2></div><div className="network-switch" aria-label={t('videoMode')}><button className={network === 'cn' ? 'active' : ''} onClick={() => changeNetwork('cn')}>{t('domestic')}</button><button className={network === 'global' ? 'active' : ''} onClick={() => changeNetwork('global')}>{t('global')}</button></div></div>
    <div className="media-source-line">
      <span className={`source-badge ${source.sourceType || 'primary'}`}>{locale === 'en' ? (network === 'global' ? t('globalOriginal') : t('curatedVideo')) : (source.sourceLabel || (isYouTube ? t('originalCourse') : t('curatedVideo')))}</span>
      <p>{locale === 'en' ? t('sourceDefault') : (source.sourceNote || t('sourceDefault'))}</p>
      {source.originalUrl && network === 'cn' && <a href={source.originalUrl} target="_blank" rel="noreferrer">{t('originalSource')} <ArrowRight /></a>}
    </div>
    {parts.length > 0 && <div className="media-parts" aria-label={t('selectedParts')}><span>{t('selectedParts')}</span><div>{parts.map(item => <button key={item.page} className={selectedPage === item.page ? 'active' : ''} onClick={() => changePart(item.page)}><b>P{item.page}</b>{item.label}</button>)}</div></div>}
    <div className="media-frame">
      {!isEmbeddable ? <div className="cn-fallback global-fallback"><span>↗</span><b>{t('globalOriginal')}</b><p>{resolvedSource ? t('noGlobalEmbed') : t('noSource')}</p>{external && <a href={external} target="_blank" rel="noreferrer">{t('openOfficial')} <ArrowRight /></a>}</div> : active ? <iframe src={embed} title={source.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button onClick={() => { setActive(true); trackEvent('video_played', { network, platform: source.platform }) }}><span><Play weight="fill" /></span><b>{t('loadPlayer', { platform:source.platform })}</b><small>{t('privacyLoad')}</small></button>}
    </div>
    <div className="media-meta"><div><span>{source.author} · {source.duration}{selectedPart ? ` · ${selectedPart.label}` : ''}</span><h3>{locale === 'en' ? (media.globalTitle || media.title) : source.title}</h3></div>{isEmbeddable && external && <a href={external} target="_blank" rel="noreferrer">{t('openExternal')} <ArrowRight /></a>}</div>
    <div className="watch-contract"><article><span>BEFORE</span><b>{t('beforeWatch')}</b><p>{media.before}</p></article><article><span>AFTER</span><b>{t('afterWatch')}</b><p>{media.after}</p></article></div>
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

  return <main className="study-shell">
    <header className="study-topbar">
      <button onClick={onBack}><ArrowLeft /> {t('backPath')}</button>
      <div className="study-progress"><span>{module.no} · {module.title}</span><i><em style={{ width: complete ? '100%' : '42%' }} /></i></div>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} compact />
      <LanguageToggle compact />
      <AccountButton onClick={onAccount} user={user} syncStatus={syncStatus} compact />
    </header>

    <div className="study-layout">
      <aside className="study-nav">
        <span className="section-no">LESSON {material.id}</span>
        <h3>{material.title}</h3>
        <small>{material.type} · {material.duration}</small>
        <nav>{[t('understand'),t('mechanism'),t('practice'),t('quiz'),t('masteryGate')].map((item, index) => <button key={item} className={section === index ? 'active' : ''} onClick={() => { setSection(index); document.getElementById(`study-${index}`)?.scrollIntoView({ behavior: 'smooth' }) }}><span>0{index + 1}</span>{item}</button>)}</nav>
        <div className="study-source-mini"><span>{t('sources')}</span>{material.references.map(x => <b key={x}>{x}</b>)}</div>
      </aside>

      <article className="study-reading">
        <div className="study-breadcrumb">{module.no} {module.title} / {material.id}</div>
        <span className="section-no">{t('theoryPracticeEvidence')}</span>
        <h1>{material.title}</h1>
        <p className="study-lead">{t('lessonLead')}</p>

        <GeoAnswer lessonId={lesson[0]} />

        <section className="objective-card">
          <div><span className="section-no">LEARNING OBJECTIVES</span><h2>{t('objectives')}</h2></div>
          <ol>{material.objectives.map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol>
        </section>

        {material.media && <LessonMedia media={material.media} />}

        <section id="study-0" className="study-section">
          <span className="section-no">01 · INTUITION</span><h2>{t('whyNeed')}</h2>
          {material.opening.map(x => <p key={x}>{x}</p>)}
          <aside className="mental-prompt"><Sparkle weight="fill" /><div><b>{t('predictFirst')}</b><p>{t('predictPrompt', { concept:material.concepts[0]?.name || material.title })}</p></div></aside>
        </section>

        <section id="study-1" className="study-section">
          <span className="section-no">02 · MECHANISM</span><h2>{t('causalChain')}</h2>
          <div className="concept-stack">{material.concepts.map((concept, i) => <article key={`${concept.name}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{concept.name}</h3><p>{concept.note}</p></div></article>)}</div>
          <div className="mechanism-loop">{material.workflow.map((x, i) => <div key={x}><span>STEP {i + 1}</span><b>{x}</b>{i < material.workflow.length - 1 && <ArrowRight />}</div>)}</div>
          <div className="worked-example"><div><span className="section-no">WORKED EXAMPLE</span><h3>{material.worked.title}</h3></div><ol>{material.worked.steps.map((x, i) => <li key={x}><span>{i + 1}</span>{x}</li>)}</ol><button onClick={() => setShowWorked(x => !x)}>{showWorked ? t('collapseCheck') : t('whatCheck')}</button>{showWorked && <p>{material.worked.question}</p>}</div>
          <div className="misconception"><b>{t('pitfall')}</b><p>{material.misconception}</p></div>
        </section>

        {material.spotlight && <section className="paper-spotlight">
          <span className="section-no">RESEARCH BRIDGE · DSPARK</span><h2>{material.spotlight.title}</h2><p>{material.spotlight.body}</p>
          <ul>{material.spotlight.points.map(x => <li key={x}><Check />{x}</li>)}</ul>
          <small>{pick('基于用户提供的 DSpark 论文整理；速度数字需连同硬件、负载和匹配吞吐条件阅读。','Based on the supplied DSpark paper. Read speed claims together with hardware, load, and matched-throughput conditions.')}</small>
        </section>}

        <section id="study-2" className="study-section">
          <span className="section-no">03 · BUILD & VERIFY</span><h2>{material.practice.task}</h2>
          <div className="practice-steps">{material.practice.steps.map((x, i) => <article key={x}><span>{i + 1}</span><p>{x}</p></article>)}</div>
          <div className="study-code"><div><span>minimal_experiment.py</span><em>{t('copyable')}</em></div><pre><code>{material.code}</code></pre></div>
          <div className="evidence-box"><div><span className="section-no">EVIDENCE PACK</span><h3>{t('evidencePack')}</h3></div><ul>{material.practice.evidence.map(x => <li key={x}><CheckCircle />{x}</li>)}</ul></div>
        </section>

        <section id="study-3" className="study-section quiz-card">
          <span className="section-no">04 · RETRIEVAL CHECK</span><h2>{material.quiz.question}</h2>
          <div>{material.quiz.options.map((x, i) => <button key={x} className={answer === i ? (i === 0 ? 'correct' : 'wrong') : ''} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{x}{answer === i && (i === 0 ? <CheckCircle weight="fill" /> : <X weight="bold" />)}</button>)}</div>
          {answer !== null && <p className={`quiz-feedback ${answer === 0 ? 'ok' : ''}`}>{answer === 0 ? t('correct') : t('almost')} {material.quiz.explanation}</p>}
        </section>

        <section className="notes-card">
          <span className="section-no">FIELD NOTES · {user ? t('localCloud') : t('localAuto')}</span><h2>{t('notesTitle')}</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('notesPlaceholder')} />
          <small>{t('charsGoal', { count:note.length })}</small>
        </section>

        <section id="study-4" className="mastery-gate-study">
          <div><span className="section-no">05 · MASTERY GATE</span><h2>{t('masteryQuestion')}</h2></div>
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
    <footer><span>{pick('一手来源','Primary sources')}</span>{brief.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowRight /></a>)}<ShareButton compact surface="geo_answer" lessonId={lessonId} title={brief.question} text={brief.answer.slice(0, 100)} /></footer>
  </section>
}

function Graph({ ran, large }) {
  return <div className={`graph-panel ${large ? 'large' : ''}`}><div className="graph-title"><span>计算图</span><em>{ran ? '梯度已更新' : '等待运行'}</em></div><div className="graph-canvas">
    <div className="edge e1" /><div className="edge e2" /><div className="edge e3" />
    <div className="node a"><b>a</b><span>2.0</span><em>{ran ? 'grad -2.0' : 'grad 0.0'}</em></div>
    <div className="node b"><b>b</b><span>-3.0</span><em>{ran ? 'grad -2.0' : 'grad 0.0'}</em></div>
    <div className="node c"><b>c</b><span>-1.0</span><em>{ran ? 'grad -2.0' : 'grad 0.0'}</em></div>
    <div className="node loss"><b>loss</b><span>1.0</span><em>{ran ? 'grad 1.0' : 'grad 0.0'}</em></div>
  </div></div>
}

function SearchModal({ onClose, onOpen }) {
  const { locale, pick } = useI18n()
  const flatLessons = useMemo(() => flattenLessons(localizeModules(modules, locale)), [locale])
  const [q, setQ] = useState('')
  const results = flatLessons.filter(x => `${x.lesson[1]}${x.lesson[4]}${x.lesson[5]}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  useEffect(() => { const fn = e => e.key === 'Escape' && onClose(); addEventListener('keydown', fn); return () => removeEventListener('keydown', fn) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="command-modal" onMouseDown={e => e.stopPropagation()}>
    <label><MagnifyingGlass /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={pick('搜索课程、概念或实践任务','Search lessons, concepts, or deliverables')} /><kbd>ESC</kbd></label>
    <div className="command-results"><span className="section-no">{q ? pick(`找到 ${results.length} 项`,`${results.length} results`) : pick('推荐继续','Recommended next')}</span>{results.map(x => <button key={`${x.module.id}-${x.lesson[0]}`} onClick={() => onOpen(x.module, x.lesson, x.index)}><BookOpen /><span><strong>{x.lesson[1]}</strong><small>{x.module.no} {x.module.title} · {x.lesson[2]}</small></span><ArrowRight /></button>)}</div>
  </div></div>
}

export default function App() {
  const { locale, setLocale } = useI18n()
  const { user, recovery } = useAuth()
  const localizedModules = useMemo(() => localizeModules(modules, locale), [locale])
  const flatLessons = useMemo(() => flattenLessons(localizedModules), [localizedModules])
  const [view, setView] = useState('home')
  const [moduleIndex, setModuleIndex] = useState(1)
  const [lessonInfo, setLessonInfo] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('uth-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  const [completed, setCompleted] = useState(() => new Set(flatLessons.filter(x => localStorage.getItem(`uth-lesson-${x.lesson[0]}-complete`) === '1').map(x => x.lesson[0])))
  const sync = useLearningSync({ lessonIds, completed, setCompleted, theme, setTheme })
  const saveNote = useCallback((id, note) => sync.saveLesson(id, { note }, { debounce: true }), [sync.saveLesson])
  const progress = Math.round((completed.size / flatLessons.length) * 100)
  const openLesson = (module = localizedModules[1], lesson = localizedModules[1].lessons[2], index = 2) => {
    setLessonInfo({ module, lesson, index }); setView('lesson'); setSearch(false)
    const nextPath = lessonPath(lesson[0], locale)
    if (location.pathname !== nextPath) history.pushState({ lessonId: lesson[0] }, '', `${nextPath}${location.search}`)
    scrollTo(0, 0)
    sync.saveLesson(lesson[0], { last_opened_at: new Date().toISOString() })
    sync.saveProfile({ last_lesson_id: lesson[0] })
    trackEvent('lesson_started', { lesson_id: lesson[0], module_id: module.id, locale })
  }
  const closeLesson = () => {
    setView('path')
    history.pushState({ view: 'path' }, '', `${homePath(locale)}${location.search}`)
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
    const currentId = lessonInfo?.lesson?.[0] || '1.3'
    const currentIndex = flatLessons.findIndex(x => x.lesson[0] === currentId)
    const target = flatLessons[Math.max(0, Math.min(flatLessons.length - 1, currentIndex + delta))]
    if (target) openLesson(target.module, target.lesson, target.index)
  }
  const toggleTheme = () => setTheme(x => x === 'dark' ? 'light' : 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('uth-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07110e' : '#f5f7f5')
  }, [theme])
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
        setLessonInfo({ module: targetRoute.module, lesson: targetRoute.lesson, index: targetRoute.lessonIndex })
        setModuleIndex(targetRoute.moduleIndex)
        setView('lesson')
        if (legacyId || matched.needsCanonical || location.hash) {
          history.replaceState({ lessonId: targetRoute.id }, '', `${lessonPath(targetRoute.id, routeLocale)}${location.search}`)
        }
        return
      }

      if (matched.locale) setLocale(matched.locale)
      else history.replaceState({ view: 'home' }, '', `${homePath(locale)}${location.search}`)
      setView('home')
      setLessonInfo(null)
    }

    syncFromLocation()
    addEventListener('popstate', syncFromLocation)
    return () => removeEventListener('popstate', syncFromLocation)
  }, [locale, setLocale])
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
      const nextPath = view === 'lesson' && lessonId ? lessonPath(lessonId, nextLocale) : homePath(nextLocale)
      history.replaceState(history.state, '', `${nextPath}${location.search}`)
    }
    addEventListener('uth-locale-change', receive)
    return () => removeEventListener('uth-locale-change', receive)
  }, [view, lessonInfo?.lesson?.[0]])
  useEffect(() => {
    const lessonId = lessonInfo?.lesson?.[0]
    applyDocumentSeo(view === 'lesson' && lessonId ? getLessonSeo(lessonId, locale) : getHomeSeo(locale))
  }, [view, locale, lessonInfo?.lesson?.[0]])
  useEffect(() => {
    trackEvent('view_changed', { view, locale })
  }, [view, locale])
  const accountModal = accountOpen && <AccountModal onClose={() => setAccountOpen(false)} progress={progress} completedCount={completed.size} totalLessons={flatLessons.length} syncStatus={sync.status} lastSynced={sync.lastSynced} />
  const currentLessonInfo = lessonInfo ? flatLessons.find(item => item.lesson[0] === lessonInfo.lesson[0]) || lessonInfo : null
  if (view === 'lesson') return <><LessonView info={currentLessonInfo} onBack={closeLesson} onNavigate={navigateLesson} theme={theme} toggleTheme={toggleTheme} complete={completed.has(currentLessonInfo?.lesson?.[0])} onToggleComplete={toggleLessonComplete} onSaveNote={saveNote} onAccount={() => setAccountOpen(true)} user={user} syncStatus={sync.status} />{accountModal}</>
  return <div className="app-shell">
    <Sidebar view={view} setView={setView} open={mobileNav} onClose={() => setMobileNav(false)} progress={progress} theme={theme} toggleTheme={toggleTheme} />
    <div className="app-main"><Topbar onMenu={() => setMobileNav(true)} onSearch={() => setSearch(true)} theme={theme} toggleTheme={toggleTheme} progress={progress} onAccount={() => setAccountOpen(true)} user={user} syncStatus={sync.status} />
      {view === 'home' && <Dashboard goLesson={() => openLesson()} setView={setView} />}
      {view === 'path' && <Curriculum selected={moduleIndex} setSelected={setModuleIndex} goLesson={openLesson} completed={completed} />}
      {view === 'labs' && <Labs goLesson={() => openLesson()} />}
      {view === 'projects' && <Projects />}
      {view === 'library' && <Library />}
    </div>
    {search && <SearchModal onClose={() => setSearch(false)} onOpen={openLesson} />}
    {accountModal}
  </div>
}

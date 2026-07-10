import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BracketsCurly, Check, CheckCircle, Circle,
  Clock, Code, Command, Cube, Flask, FolderOpen, Gauge, GithubLogo, House,
  List, MagnifyingGlass, Play, ReadCvLogo, RocketLaunch, Rows, Sparkle,
  TerminalWindow, X, Moon, Sun, VideoCamera,
} from '@phosphor-icons/react'
import { modules, principles, resources, sourceTypes } from './data.js'
import { buildLessonMaterial, lessonHasMedia, lessonMediaStats } from './lessonContent.js'

const flatLessons = modules.flatMap((m) => m.lessons.map((l, i) => ({ module: m, lesson: l, index: i })))

const navItems = [
  ['home', '总览', House], ['path', '学习路径', Rows], ['labs', '实验室', Flask],
  ['projects', '项目', Cube], ['library', '资料库', FolderOpen],
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
  return <button className="brand" onClick={() => location.reload()} aria-label="返回总览">
    <span className="brand-mark">μ</span><span>UNDER<br />THE HOOD</span>
  </button>
}

function Sidebar({ view, setView, open, onClose, progress }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><Brand /><button className="icon-button mobile-only" onClick={onClose}><X /></button></div>
    <nav className="main-nav" aria-label="主要导航">
      {navItems.map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => { setView(id); onClose() }}>
        <Icon size={20} weight={view === id ? 'fill' : 'regular'} /><span>{label}</span>
      </button>)}
    </nav>
    <div className="sidebar-foot">
      <div className="mastery-ring" style={{ '--p': `${progress}%` }}><span>{progress}%</span></div>
      <div><span className="micro">总体掌握度</span><strong>{progress === 100 ? '全课程已完成' : progress > 50 ? '系统能力形成中' : progress > 0 ? '基础正在形成' : '从第一节开始'}</strong></div>
    </div>
  </aside>
}

function ThemeToggle({ theme, toggleTheme, compact = false }) {
  return <button className={`theme-toggle ${compact ? 'compact' : ''}`} onClick={toggleTheme} aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
    {theme === 'dark' ? <Sun weight="bold" /> : <Moon weight="fill" />}
    {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
  </button>
}

function Topbar({ onMenu, onSearch, theme, toggleTheme, progress }) {
  return <header className="topbar">
    <button className="icon-button mobile-only" onClick={onMenu}><List /></button>
    <button className="search-trigger" onClick={onSearch}><MagnifyingGlass size={17} /><span>搜索课程、实验、项目...</span><kbd>⌘ K</kbd></button>
    <div className="top-progress"><span>总进度 <b>{progress}%</b></span><i><em style={{ width: `${progress}%` }} /></i></div>
    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    <div className="avatar">L</div>
  </header>
}

function Dashboard({ goLesson, setView }) {
  return <main className="page dashboard-page">
    <section className="hero-grid">
      <div className="hero-copy">
        <h1>别只会调用模型。<br /><em>亲手造一个。</em></h1>
        <p>从 0 到 1 拆开大模型：推导、实现、训练、对齐、部署。不是“看懂了”，而是能够解释、复现和诊断。</p>
        <div className="hero-actions">
          <button className="primary" onClick={goLesson}>继续学习 <ArrowRight weight="bold" /></button>
          <button className="secondary" onClick={() => setView('path')}>查看完整路线</button>
        </div>
        <div className="signal-map" aria-label="从 token 到 agent 的学习信号图">
          <div className="signal-line" />
          {['TOKENS', 'BACKPROP', 'GPT', 'ALIGNMENT', 'AGENTS'].map((x, i) => <span key={x} style={{ left: `${i * 24.5}%`, top: i % 2 ? 57 : 26 }}>{x}</span>)}
        </div>
      </div>
      <CurrentLesson goLesson={goLesson} />
    </section>
    <Roadmap />
    <section className="dashboard-lower">
      <Today goLesson={goLesson} />
      <MasteryPanel />
    </section>
    <section className="method-strip">
      <div><span className="section-no">LEARNING LOOP</span><h2>80% 掌握，靠四次经过同一知识</h2></div>
      <div className="loop-steps">
        {['建立直觉', '推导公式', '从零实现', '诊断迁移'].map((x, i) => <div key={x}><span>0{i + 1}</span><strong>{x}</strong></div>)}
      </div>
    </section>
  </main>
}

function CurrentLesson({ goLesson }) {
  return <article className="current-lesson">
    <div className="current-meta"><span><i /> 当前学习</span><span>本周 4 / 6</span></div>
    <span className="chapter-code">01 · 神经网络地基</span>
    <h2>让梯度沿计算图<br />倒着走</h2>
    <p>从局部导数到 reverse-mode autodiff，亲手实现一个微型 autograd 引擎。</p>
    <div className="code-window">
      <div className="code-title"><span>micrograd.py</span><span>Python</span></div>
      <pre><code>{codeSample.split('\n').slice(0, 9).join('\n')}</code></pre>
    </div>
    <button className="lesson-continue" onClick={goLesson}>打开学习工作台 <ArrowRight /></button>
  </article>
}

function Roadmap() {
  return <section className="roadmap-block">
    <div className="section-title-row"><div><span className="section-no">ROADMAP · 26 WEEKS</span><h2>从字符到智能系统</h2></div><p>220–260 小时 · {flatLessons.length} 节深度课 · {lessonMediaStats.lessons} 节视频研讨</p></div>
    <div className="roadmap-rail">
      {modules.map((m, i) => <div className={`road-stop ${i === 1 ? 'current' : ''} ${i === 0 ? 'done' : ''}`} key={m.id}>
        <span>{i === 0 ? <Check /> : m.no}</span><strong>{m.short}</strong><small>{m.weeks}</small>
      </div>)}
    </div>
  </section>
}

function Today({ goLesson }) {
  const tasks = [
    ['读', '链式法则与计算图', '15 分钟', true],
    ['造', '实现 Value.__add__', '30 分钟', true],
    ['验', '有限差分梯度检查', '25 分钟', false],
    ['讲', '为什么需要拓扑排序？', '10 分钟', false],
  ]
  return <section className="today-panel">
    <div className="panel-heading"><div><span className="section-no">TODAY · 80 MIN</span><h2>今天要做</h2></div><Clock size={21} /></div>
    <div className="task-list">
      {tasks.map(([tag, title, time, done], i) => <button key={title} className={i === 2 ? 'now' : ''} onClick={!done ? goLesson : undefined}>
        <span className={`task-check ${done ? 'done' : ''}`}>{done ? <Check /> : ''}</span><b>{tag}</b><strong>{title}</strong><small>{time}</small>{i === 2 && <em>开始</em>}
      </button>)}
    </div>
  </section>
}

function MasteryPanel() {
  return <section className="mastery-panel">
    <div className="panel-heading"><div><span className="section-no">MASTERY GATE</span><h2>不是完成，是掌握</h2></div><Gauge size={22} /></div>
    <div className="mastery-bars">
      {[['解释', 72], ['实现', 48], ['诊断', 31], ['迁移', 18]].map(([k, v]) => <div key={k}><span>{k}<b>{v}%</b></span><i><em style={{ width: `${v}%` }} /></i></div>)}
    </div>
    <p>下一道门：闭卷重写 micrograd，并对三个错误梯度进行定位。</p>
  </section>
}

function Curriculum({ selected, setSelected, goLesson, completed }) {
  const current = modules[selected]
  return <main className="page curriculum-page">
    <header className="page-lead">
      <span className="section-no">THE COMPLETE PATH</span>
      <h1>一条能走到底的<br />大模型学习路线</h1>
      <p>26 周不是速成承诺，而是一套可验证的能力建造计划。每阶段都以作品和掌握门结束。</p>
      <div className="curriculum-stats"><span><b>{flatLessons.length}</b> 深度课</span><span><b>{lessonMediaStats.lessons}</b> 视频研讨</span><span><b>24</b> 核心实验</span><span><b>8</b> 阶段作品</span></div>
    </header>
    <div className="curriculum-layout">
      <aside className="module-index">
        {modules.map((m, i) => <button key={m.id} onClick={() => setSelected(i)} className={selected === i ? 'active' : ''}>
          <span>{m.no}</span><div><strong>{m.title}</strong><small>{m.weeks} · {m.hours}h</small></div><ArrowRight />
        </button>)}
      </aside>
      <section className="module-detail">
        <div className="module-head"><div><span className="section-no">PHASE {current.no}</span><h2>{current.title}</h2><p>{current.summary}</p></div><div className="module-time"><strong>{current.weeks}</strong><span>{current.hours} 小时</span></div></div>
        <blockquote>核心问题：{current.question}</blockquote>
        <div className="lesson-table">
          <div className="lesson-table-head"><span>课程</span><span>理论内核</span><span>实践产出</span><span>时长</span></div>
          {current.lessons.map((l, i) => <button key={l[0]} className={completed.has(l[0]) ? 'completed-row' : ''} onClick={() => goLesson(current, l, i)}>
            <span><i>{l[0]}</i><strong>{l[1]}</strong><em>{l[2]}</em>{lessonHasMedia(l[0]) && <small className="lesson-video"><VideoCamera weight="fill" /> 视频</small>}</span><span>{l[4]}</span><span>{l[5]}</span><span>{l[3]} <ArrowRight /></span>
          </button>)}
        </div>
        <div className="module-outcomes">
          <div><span className="section-no">STAGE PROJECT</span><h3>阶段作品</h3><p>{current.project}</p></div>
          <div><span className="section-no">PASS CRITERIA</span><h3>通过标准</h3><ul>{current.mastery.map(x => <li key={x}><Check />{x}</li>)}</ul></div>
        </div>
        <div className="source-line"><span>精选一手资料</span>{current.sources.map(x => <b key={x}>{x}</b>)}</div>
      </section>
    </div>
  </main>
}

function Labs({ goLesson }) {
  const labs = [
    ['01', '梯度显微镜', '拖动输入与权重，观察局部导数如何沿计算图累积。', '反向传播', '35 min'],
    ['02', 'Tokenizer 病理室', '比较中、英、日、数字和代码的 BPE 切分与压缩率。', 'Token', '45 min'],
    ['03', 'Attention 解剖台', '逐格查看 QK 相似度、mask、softmax 与 value 聚合。', 'Transformer', '55 min'],
    ['04', '训练急诊室', '面对 loss spike、NaN、显存溢出和过拟合，完成故障定位。', '训练系统', '70 min'],
    ['05', '采样风洞', '改变 temperature、top-k、top-p，建立输出多样性相图。', '推理', '40 min'],
    ['06', 'Agent 轨迹审计', '从工具调用轨迹判断规划、权限和终止条件是否可靠。', 'Agent', '60 min'],
  ]
  return <main className="page catalog-page">
    <header className="page-lead compact"><span className="section-no">EXPERIMENTS</span><h1>最好的老师，<br />是一个反直觉的结果。</h1><p>每个实验都要求先预测、再运行、后解释；没有“点一下看动画”的伪互动。</p></header>
    <div className="lab-grid">{labs.map(([n, title, desc, phase, time], i) => <article key={n}>
      <div className="lab-no">{n}<Flask /></div><span className="section-no">{phase} · {time}</span><h2>{title}</h2><p>{desc}</p><button onClick={i === 0 ? goLesson : undefined}>进入实验 <ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Projects() {
  return <main className="page projects-page">
    <header className="page-lead compact"><span className="section-no">BUILD IN PUBLIC</span><h1>八个作品，<br />证明你真的会。</h1><p>每个作品都能独立发布：有源码、有实验、有测试、有失败复盘，不只是 notebook 截图。</p></header>
    <div className="project-list">{modules.map((m, i) => <article key={m.id}>
      <div className="project-index"><span>{m.no}</span><i className={i === 0 ? 'done' : i === 1 ? 'active' : ''} /></div>
      <div><span className="section-no">{m.weeks} · {m.hours} HOURS</span><h2>{m.project.split('：')[0]}</h2><p>{m.project.includes('：') ? m.project.split('：').slice(1).join('：') : m.project}</p></div>
      <div className="project-proof"><span>验收证据</span><b>README</b><b>测试</b><b>实验报告</b><b>演示</b></div>
      <button className="icon-button"><ArrowRight /></button>
    </article>)}</div>
  </main>
}

function Library() {
  const [type, setType] = useState('全部')
  const [query, setQuery] = useState('')
  const filtered = resources.filter(r => (type === '全部' || r.type === type) && `${r.author}${r.title}${r.phase}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="page library-page">
    <header className="page-lead compact"><span className="section-no">CURATED SOURCES</span><h1>不是链接仓库，<br />是大师课导航。</h1><p>只选一手、可复现、高信噪比材料。每一份都标明学习位置和使用方式。</p></header>
    <div className="library-tools"><label><MagnifyingGlass /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索作者、项目或主题" /></label><div>{sourceTypes.map(x => <button className={type === x ? 'active' : ''} onClick={() => setType(x)} key={x}>{x}</button>)}</div></div>
    <div className="resource-table"><div className="resource-head"><span>来源 / 题目</span><span>用于</span><span>使用说明</span><span /></div>{filtered.map(r => <a key={r.title} href={r.url} target="_blank" rel="noreferrer">
      <span><i>{r.type}</i><strong>{r.title}</strong><small>{r.author}</small></span><span>{r.phase}<b>{r.level}</b></span><span>{r.note}</span><ArrowRight />
    </a>)}</div>
  </main>
}

function LessonView({ info, onBack, onNavigate, theme, toggleTheme, complete, onToggleComplete }) {
  const [tab, setTab] = useState('代码')
  const [ran, setRan] = useState(false)
  const [reflection, setReflection] = useState('')
  const module = info?.module || modules[1]
  const lesson = info?.lesson || modules[1].lessons[2]
  const specialMaterial = buildLessonMaterial(module, lesson)
  if (lesson[0] !== '1.3') return <LessonStudy key={lesson[0]} module={module} lesson={lesson} onBack={onBack} onNavigate={onNavigate} theme={theme} toggleTheme={toggleTheme} complete={complete} onToggleComplete={onToggleComplete} />
  const outline = ['直觉', '链式法则', '计算图', '实现 Value', '拓扑排序', '梯度检查']
  return <main className="lesson-shell">
    <aside className="lesson-outline">
      <button onClick={onBack}><ArrowLeft /> 返回课程</button>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
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
  const [active, setActive] = useState(false)
  const [network, setNetwork] = useState(() => localStorage.getItem('uth-network') || ((navigator.language === 'zh-CN' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai') ? 'cn' : 'global'))
  const [partByNetwork, setPartByNetwork] = useState({})
  const source = network === 'cn' && media.cn ? { ...media, ...media.cn } : media
  const isYouTube = source.platform === 'YouTube'
  const unavailableInChina = network === 'cn' && isYouTube
  const parts = source.parts || []
  const selectedPage = partByNetwork[network] || source.page || parts[0]?.page || 1
  const selectedPart = parts.find(item => item.page === selectedPage)
  const embed = isYouTube
    ? `https://www.youtube-nocookie.com/embed/${source.id}?rel=0`
    : `https://player.bilibili.com/player.html?bvid=${source.id}&page=${selectedPage}&high_quality=1&danmaku=0`
  const external = isYouTube ? `https://www.youtube.com/watch?v=${source.id}` : `https://www.bilibili.com/video/${source.id}?p=${selectedPage}`
  const biliSearch = `https://search.bilibili.com/all?keyword=${encodeURIComponent(media.cnQuery || media.title)}`
  const changeNetwork = value => { setNetwork(value); setActive(false); localStorage.setItem('uth-network', value) }
  const changePart = page => { setPartByNetwork(current => ({ ...current, [network]: page })); setActive(false) }
  return <section className="lesson-media">
    <div className="media-heading"><div><span className="section-no">VIDEO SEMINAR · {source.platform}</span><h2>先带着问题看，再用实验验</h2></div><div className="network-switch" aria-label="视频网络模式"><button className={network === 'cn' ? 'active' : ''} onClick={() => changeNetwork('cn')}>国内</button><button className={network === 'global' ? 'active' : ''} onClick={() => changeNetwork('global')}>国际</button></div></div>
    <div className="media-source-line">
      <span className={`source-badge ${source.sourceType || 'primary'}`}>{source.sourceLabel || (isYouTube ? '原始课程' : '精选视频')}</span>
      <p>{source.sourceNote || '视频用于建立直觉，正文、推导和实验仍是完整学习主线。'}</p>
      {source.originalUrl && <a href={source.originalUrl} target="_blank" rel="noreferrer">查看原始来源 <ArrowRight /></a>}
    </div>
    {parts.length > 0 && <div className="media-parts" aria-label="本节视频分段"><span>本节选看</span><div>{parts.map(item => <button key={item.page} className={selectedPage === item.page ? 'active' : ''} onClick={() => changePart(item.page)}><b>P{item.page}</b>{item.label}</button>)}</div></div>}
    <div className="media-frame">
      {unavailableInChina ? <div className="cn-fallback"><span>CN</span><b>国内模式不加载 YouTube</b><p>本节正文、公式和实验是完整主线；视频只是辅助。我们不代理或搬运未经授权的视频。</p><a href={biliSearch} target="_blank" rel="noreferrer">在 B站搜索同主题 <ArrowRight /></a></div> : active ? <iframe src={embed} title={source.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button onClick={() => setActive(true)}><span><Play weight="fill" /></span><b>点击加载 {source.platform} 播放器</b><small>默认不连接第三方，保护加载速度与隐私</small></button>}
    </div>
    <div className="media-meta"><div><span>{source.author} · {source.duration}{selectedPart ? ` · ${selectedPart.label}` : ''}</span><h3>{source.title}</h3></div>{!unavailableInChina && <a href={external} target="_blank" rel="noreferrer">站外打开 <ArrowRight /></a>}</div>
    <div className="watch-contract"><article><span>BEFORE</span><b>观看前先回答</b><p>{media.before}</p></article><article><span>AFTER</span><b>观看后必须产出</b><p>{media.after}</p></article></div>
  </section>
}

function LessonStudy({ module, lesson, onBack, onNavigate, theme, toggleTheme, complete, onToggleComplete }) {
  const material = useMemo(() => buildLessonMaterial(module, lesson), [module, lesson])
  const lessonKey = `uth-lesson-${lesson[0]}`
  const [section, setSection] = useState('理解')
  const [answer, setAnswer] = useState(null)
  const [showWorked, setShowWorked] = useState(false)
  const [note, setNote] = useState(() => localStorage.getItem(`${lessonKey}-note`) || '')

  useEffect(() => { localStorage.setItem(`${lessonKey}-note`, note) }, [lessonKey, note])

  return <main className="study-shell">
    <header className="study-topbar">
      <button onClick={onBack}><ArrowLeft /> 学习路径</button>
      <div className="study-progress"><span>{module.no} · {module.title}</span><i><em style={{ width: complete ? '100%' : '42%' }} /></i></div>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} compact />
    </header>

    <div className="study-layout">
      <aside className="study-nav">
        <span className="section-no">LESSON {material.id}</span>
        <h3>{material.title}</h3>
        <small>{material.type} · {material.duration}</small>
        <nav>{['理解', '机制', '实践', '自测', '掌握门'].map((item, index) => <button key={item} className={section === item ? 'active' : ''} onClick={() => { setSection(item); document.getElementById(`study-${index}`)?.scrollIntoView({ behavior: 'smooth' }) }}><span>0{index + 1}</span>{item}</button>)}</nav>
        <div className="study-source-mini"><span>本节资料线</span>{material.references.map(x => <b key={x}>{x}</b>)}</div>
      </aside>

      <article className="study-reading">
        <div className="study-breadcrumb">{module.no} {module.title} / {material.id}</div>
        <span className="section-no">THEORY × PRACTICE × EVIDENCE</span>
        <h1>{material.title}</h1>
        <p className="study-lead">本节不是内容摘要。你会建立直觉、拆解机制、完成一个可验证实践，并通过迁移问题检查自己是否真的理解。</p>

        <section className="objective-card">
          <div><span className="section-no">LEARNING OBJECTIVES</span><h2>学完你应该能够</h2></div>
          <ol>{material.objectives.map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol>
        </section>

        {material.media && <LessonMedia media={material.media} />}

        <section id="study-0" className="study-section">
          <span className="section-no">01 · INTUITION</span><h2>先回答：为什么需要它？</h2>
          {material.opening.map(x => <p key={x}>{x}</p>)}
          <aside className="mental-prompt"><Sparkle weight="fill" /><div><b>先做一个预测</b><p>如果完全移除“{material.concepts[0]?.name || material.title}”，最先出现的可观测故障会是什么？先写答案，再继续阅读。</p></div></aside>
        </section>

        <section id="study-1" className="study-section">
          <span className="section-no">02 · MECHANISM</span><h2>把术语拆成因果链</h2>
          <div className="concept-stack">{material.concepts.map((concept, i) => <article key={`${concept.name}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{concept.name}</h3><p>{concept.note}</p></div></article>)}</div>
          <div className="mechanism-loop">{material.workflow.map((x, i) => <div key={x}><span>STEP {i + 1}</span><b>{x}</b>{i < material.workflow.length - 1 && <ArrowRight />}</div>)}</div>
          <div className="worked-example"><div><span className="section-no">WORKED EXAMPLE</span><h3>{material.worked.title}</h3></div><ol>{material.worked.steps.map((x, i) => <li key={x}><span>{i + 1}</span>{x}</li>)}</ol><button onClick={() => setShowWorked(x => !x)}>{showWorked ? '收起检查顺序' : '结果不一致时先查什么？'}</button>{showWorked && <p>{material.worked.question}</p>}</div>
          <div className="misconception"><b>容易踩坑</b><p>{material.misconception}</p></div>
        </section>

        {material.spotlight && <section className="paper-spotlight">
          <span className="section-no">RESEARCH BRIDGE · DSPARK</span><h2>{material.spotlight.title}</h2><p>{material.spotlight.body}</p>
          <ul>{material.spotlight.points.map(x => <li key={x}><Check />{x}</li>)}</ul>
          <small>基于用户提供的 DSpark 论文整理；速度数字需连同硬件、负载和匹配吞吐条件阅读。</small>
        </section>}

        <section id="study-2" className="study-section">
          <span className="section-no">03 · BUILD & VERIFY</span><h2>{material.practice.task}</h2>
          <div className="practice-steps">{material.practice.steps.map((x, i) => <article key={x}><span>{i + 1}</span><p>{x}</p></article>)}</div>
          <div className="study-code"><div><span>minimal_experiment.py</span><em>可复制骨架</em></div><pre><code>{material.code}</code></pre></div>
          <div className="evidence-box"><div><span className="section-no">EVIDENCE PACK</span><h3>提交这些证据，才算做完</h3></div><ul>{material.practice.evidence.map(x => <li key={x}><CheckCircle />{x}</li>)}</ul></div>
        </section>

        <section id="study-3" className="study-section quiz-card">
          <span className="section-no">04 · RETRIEVAL CHECK</span><h2>{material.quiz.question}</h2>
          <div>{material.quiz.options.map((x, i) => <button key={x} className={answer === i ? (i === 0 ? 'correct' : 'wrong') : ''} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{x}{answer === i && (i === 0 ? <CheckCircle weight="fill" /> : <X weight="bold" />)}</button>)}</div>
          {answer !== null && <p className={`quiz-feedback ${answer === 0 ? 'ok' : ''}`}>{answer === 0 ? '正确。' : '还差一步。'} {material.quiz.explanation}</p>}
        </section>

        <section className="notes-card">
          <span className="section-no">FIELD NOTES · 自动保存在本机</span><h2>写下你的预测、结果与修正</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="建议格式：我原来认为…；实验结果…；偏差来自…；下次遇到…我会…" />
          <small>{note.length} 字 · 目标至少 120 字</small>
        </section>

        <section id="study-4" className="mastery-gate-study">
          <div><span className="section-no">05 · MASTERY GATE</span><h2>不要问“看完了吗”，问“能迁移吗”</h2></div>
          <ul>{material.mastery.map(x => <li key={x}><Circle />{x}</li>)}</ul>
        </section>

        <footer className="study-footer">
          <button className="secondary" onClick={() => onNavigate(-1)}><ArrowLeft /> 上一节</button>
          <button className={`complete-lesson ${complete ? 'done' : ''}`} onClick={onToggleComplete}>{complete ? <CheckCircle weight="fill" /> : <Circle />}{complete ? '已完成 · 再学一次' : '标记本节完成'}</button>
          <button className="primary" onClick={() => onNavigate(1)}>下一节 <ArrowRight /></button>
        </footer>
      </article>
    </div>
  </main>
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
  const [q, setQ] = useState('')
  const results = flatLessons.filter(x => `${x.lesson[1]}${x.lesson[4]}${x.lesson[5]}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
  useEffect(() => { const fn = e => e.key === 'Escape' && onClose(); addEventListener('keydown', fn); return () => removeEventListener('keydown', fn) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="command-modal" onMouseDown={e => e.stopPropagation()}>
    <label><MagnifyingGlass /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="搜索课程、概念或实践任务" /><kbd>ESC</kbd></label>
    <div className="command-results"><span className="section-no">{q ? `找到 ${results.length} 项` : '推荐继续'}</span>{results.map(x => <button key={`${x.module.id}-${x.lesson[0]}`} onClick={() => onOpen(x.module, x.lesson, x.index)}><BookOpen /><span><strong>{x.lesson[1]}</strong><small>{x.module.no} {x.module.title} · {x.lesson[2]}</small></span><ArrowRight /></button>)}</div>
  </div></div>
}

export default function App() {
  const [view, setView] = useState('home')
  const [moduleIndex, setModuleIndex] = useState(1)
  const [lessonInfo, setLessonInfo] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('uth-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  const [completed, setCompleted] = useState(() => new Set(flatLessons.filter(x => localStorage.getItem(`uth-lesson-${x.lesson[0]}-complete`) === '1').map(x => x.lesson[0])))
  const progress = Math.round((completed.size / flatLessons.length) * 100)
  const openLesson = (module = modules[1], lesson = modules[1].lessons[2], index = 2) => {
    setLessonInfo({ module, lesson, index }); setView('lesson'); setSearch(false)
    history.replaceState(null, '', `#lesson=${lesson[0]}`)
    scrollTo(0, 0)
  }
  const closeLesson = () => {
    setView('path')
    history.replaceState(null, '', `${location.pathname}${location.search}`)
    scrollTo(0, 0)
  }
  const toggleLessonComplete = () => {
    const id = lessonInfo?.lesson?.[0]
    if (!id) return
    setCompleted(previous => {
      const next = new Set(previous)
      if (next.has(id)) { next.delete(id); localStorage.removeItem(`uth-lesson-${id}-complete`) }
      else { next.add(id); localStorage.setItem(`uth-lesson-${id}-complete`, '1') }
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
    const fromHash = () => {
      const match = location.hash.match(/^#lesson=(.+)$/)
      if (!match) return
      const target = flatLessons.find(x => x.lesson[0] === decodeURIComponent(match[1]))
      if (target) { setLessonInfo(target); setView('lesson'); setModuleIndex(modules.indexOf(target.module)) }
    }
    fromHash()
    addEventListener('hashchange', fromHash)
    return () => removeEventListener('hashchange', fromHash)
  }, [])
  useEffect(() => {
    const fn = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true) } }
    addEventListener('keydown', fn); return () => removeEventListener('keydown', fn)
  }, [])
  if (view === 'lesson') return <LessonView info={lessonInfo} onBack={closeLesson} onNavigate={navigateLesson} theme={theme} toggleTheme={toggleTheme} complete={completed.has(lessonInfo?.lesson?.[0])} onToggleComplete={toggleLessonComplete} />
  return <div className="app-shell">
    <Sidebar view={view} setView={setView} open={mobileNav} onClose={() => setMobileNav(false)} progress={progress} />
    <div className="app-main"><Topbar onMenu={() => setMobileNav(true)} onSearch={() => setSearch(true)} theme={theme} toggleTheme={toggleTheme} progress={progress} />
      {view === 'home' && <Dashboard goLesson={() => openLesson()} setView={setView} />}
      {view === 'path' && <Curriculum selected={moduleIndex} setSelected={setModuleIndex} goLesson={openLesson} completed={completed} />}
      {view === 'labs' && <Labs goLesson={() => openLesson()} />}
      {view === 'projects' && <Projects />}
      {view === 'library' && <Library />}
    </div>
    {search && <SearchModal onClose={() => setSearch(false)} onOpen={openLesson} />}
  </div>
}

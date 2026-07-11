import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { trackEvent } from './analytics.js'

const I18nContext = createContext(null)

const messages = {
  zh: {
    overview: '总览', path: '学习路径', labs: '实验室', projects: '项目', library: '资料库',
    search: '搜索课程、实验、项目...', totalProgress: '总进度', login: '登录',
    overallMastery: '总体掌握度', courseComplete: '全课程已完成', forming: '系统能力形成中',
    foundationsForming: '基础正在形成', startFirst: '从第一节开始', backPath: '学习路径',
    dark: '深色模式', light: '浅色模式', video: '视频', domestic: '国内', global: '国际',
    videoMode: '视频网络模式', watchThenBuild: '先带着问题看，再用实验验', originalCourse: '原始课程',
    curatedVideo: '精选视频', sourceDefault: '视频用于建立直觉，正文、推导和实验仍是完整学习主线。',
    originalSource: '查看原始来源', selectedParts: '本节选看', loadPlayer: '点击加载 {platform} 播放器',
    privacyLoad: '默认不连接第三方，保护加载速度与隐私', openExternal: '站外打开',
    beforeWatch: '观看前先回答', afterWatch: '观看后必须产出',
    globalOriginal: '国际模式 · 官方原始来源', noGlobalEmbed: '本节没有可合法嵌入的国际视频。请前往官方课程、论文或代码仓库学习；正文与实验保持完整。',
    openOfficial: '打开官方原始来源', noSource: '暂未找到可靠的国际原始入口',
    theoryPracticeEvidence: '理论 × 实践 × 证据', lessonLead: '本节不是内容摘要。你会建立直觉、拆解机制、完成一个可验证实践，并通过迁移问题检查自己是否真的理解。',
    objectives: '学完你应该能够', whyNeed: '先回答：为什么需要它？', predictFirst: '先做一个预测',
    predictPrompt: '如果完全移除“{concept}”，最先出现的可观测故障会是什么？先写答案，再继续阅读。',
    causalChain: '把术语拆成因果链', workedExample: '例题演练', collapseCheck: '收起检查顺序',
    whatCheck: '结果不一致时先查什么？', pitfall: '容易踩坑', copyable: '可复制骨架', evidencePack: '提交这些证据，才算做完',
    correct: '正确。', almost: '还差一步。', localCloud: '本机优先，云端同步', localAuto: '自动保存在本机',
    notesTitle: '写下你的预测、结果与修正', notesPlaceholder: '建议格式：我原来认为…；实验结果…；偏差来自…；下次遇到…我会…',
    charsGoal: '{count} 字 · 目标至少 120 字', masteryQuestion: '不要问“看完了吗”，问“能迁移吗”',
    previous: '上一节', next: '下一节', completeAgain: '已完成 · 再学一次', markComplete: '标记本节完成',
    understand: '理解', mechanism: '机制', practice: '实践', quiz: '自测', masteryGate: '掌握门', sources: '本节资料线',
  },
  en: {
    overview: 'Overview', path: 'Learning Path', labs: 'Labs', projects: 'Projects', library: 'Library',
    search: 'Search lessons, labs, projects...', totalProgress: 'Progress', login: 'Sign in',
    overallMastery: 'Overall mastery', courseComplete: 'Course completed', forming: 'System skills taking shape',
    foundationsForming: 'Foundations taking shape', startFirst: 'Start with lesson one', backPath: 'Learning path',
    dark: 'Dark mode', light: 'Light mode', video: 'Video', domestic: 'China', global: 'Global',
    videoMode: 'Video source region', watchThenBuild: 'Watch with a question. Verify with an experiment.', originalCourse: 'Original course',
    curatedVideo: 'Curated video', sourceDefault: 'Video builds intuition; the reading, derivation, and lab remain the complete learning path.',
    originalSource: 'View original source', selectedParts: 'Selected segments', loadPlayer: 'Load {platform} player',
    privacyLoad: 'Third-party players stay disconnected until you choose to load them.', openExternal: 'Open externally',
    beforeWatch: 'Answer before watching', afterWatch: 'Required output after watching',
    globalOriginal: 'Global · Official source', noGlobalEmbed: 'No legally embeddable international video is available for this lesson. Continue with the official course, paper, or repository; the reading and lab remain complete.',
    openOfficial: 'Open official source', noSource: 'No reliable international original is available yet.',
    theoryPracticeEvidence: 'Theory × Practice × Evidence', lessonLead: 'This is not a summary. Build intuition, unpack the mechanism, complete a verifiable implementation, and test whether your model transfers.',
    objectives: 'By the end, you should be able to', whyNeed: 'First ask: why do we need it?', predictFirst: 'Make a prediction first',
    predictPrompt: 'If “{concept}” vanished completely, what observable failure would appear first? Write your answer before continuing.',
    causalChain: 'Turn terminology into a causal chain', workedExample: 'Worked example', collapseCheck: 'Hide diagnostic order',
    whatCheck: 'What should I inspect first?', pitfall: 'Common pitfall', copyable: 'Copyable scaffold', evidencePack: 'Submit this evidence before calling it done',
    correct: 'Correct.', almost: 'Not quite.', localCloud: 'Local-first, cloud synced', localAuto: 'Saved locally',
    notesTitle: 'Record your prediction, result, and correction', notesPlaceholder: 'Suggested format: I expected…; the result was…; the gap came from…; next time I will…',
    charsGoal: '{count} characters · target at least 120', masteryQuestion: 'Do not ask “Did I finish?” Ask “Can I transfer it?”',
    previous: 'Previous', next: 'Next', completeAgain: 'Completed · Review again', markComplete: 'Mark lesson complete',
    understand: 'Understand', mechanism: 'Mechanism', practice: 'Practice', quiz: 'Check', masteryGate: 'Mastery gate', sources: 'Lesson sources',
  },
}

function interpolate(value, vars = {}) {
  return Object.entries(vars).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement), value)
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('uth-locale') || (navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'))
  useEffect(() => {
    localStorage.setItem('uth-locale', locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = locale === 'zh' ? 'LLM Study · 从原理到系统' : 'LLM Study · From Principles to Systems'
  }, [locale])
  const value = useMemo(() => ({
    locale,
    setLocale,
    toggleLocale: () => setLocale(current => current === 'zh' ? 'en' : 'zh'),
    t: (key, vars) => interpolate(messages[locale][key] || messages.zh[key] || key, vars),
    pick: (zh, en) => locale === 'zh' ? zh : en,
  }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageToggle({ compact = false }) {
  const { locale, setLocale } = useI18n()
  const changeLocale = value => {
    if (value !== locale) trackEvent('language_switched', { from: locale, to: value })
    setLocale(value)
  }
  return <div className={`language-toggle ${compact ? 'compact' : ''}`} role="group" aria-label="Language / 语言">
    <button className={locale === 'zh' ? 'active' : ''} onClick={() => changeLocale('zh')} aria-pressed={locale === 'zh'}>中</button>
    <button className={locale === 'en' ? 'active' : ''} onClick={() => changeLocale('en')} aria-pressed={locale === 'en'}>EN</button>
  </div>
}

export const AI_REFERRER_DOMAINS = {
  doubao: ['doubao.com'],
  qianwen: ['qianwen.com', 'tongyi.aliyun.com', 'qwen.ai'],
  zhipu: ['chatglm.cn', 'z.ai'],
  deepseek: ['deepseek.com'],
  kimi: ['kimi.com', 'moonshot.cn'],
  yuanbao: ['yuanbao.tencent.com'],
}

export function inferAiPlatform(referrer = '') {
  if (!referrer) return null
  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
    for (const [platform, domains] of Object.entries(AI_REFERRER_DOMAINS)) {
      if (domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
        return { platform, hostname }
      }
    }
  } catch (_) {
    // Ignore malformed or privacy-stripped referrers.
  }
  return null
}

const profiles = {
  prerequisites: {
    journey: '把“照着敲能运行”升级为能解释控制流、读懂报错、用测试保护重构，并把列表计算迁移到数组与张量',
    lens: '每一步都追踪值、类型、shape、输入输出与失败信号',
    verify: '小输入手算、pytest、NumPy/PyTorch 对拍与固定随机种子',
    transfer: '更换文本、shape、dtype 或异常输入后重新运行同一组测试',
    code: `from collections import Counter

def count_bigrams(tokens):
    pairs = zip(tokens, tokens[1:])
    return Counter(pairs)

def test_count_bigrams():
    assert count_bigrams(["a", "b", "a"]) == {("a", "b"): 1, ("b", "a"): 1}`,
  },
  foundations: {
    journey: '把抽象数学变成可观察的张量、数值与实验',
    lens: '始终追问变量是什么、shape 是什么、误差从哪里来',
    verify: '手算结果、NumPy/PyTorch 对拍与边界输入',
    transfer: '换一个 shape、dtype 或数据分布后重新预测结果',
    code: `# 每一步都写下 shape 与不变量\nx = torch.randn(8, 16)\nw = torch.randn(16, 32) / 16**0.5\ny = x @ w\nassert y.shape == (8, 32)\nprint(y.mean(), y.std())`,
  },
  autograd: {
    journey: '从一个标量函数走到可训练神经网络的完整因果链',
    lens: '前向保存依赖，反向传播敏感度，参数更新改变下一次预测',
    verify: '有限差分、PyTorch 对拍与梯度统计',
    transfer: '增加分支、共享参数或更换激活函数后检查梯度',
    code: `def grad_check(f, x, eps=1e-5):\n    numeric = (f(x + eps) - f(x - eps)) / (2 * eps)\n    analytic = autodiff(f, x)\n    return abs(numeric - analytic) < 1e-4`,
  },
  language: {
    journey: '把字符序列写成条件概率，再把概率交给神经网络估计',
    lens: 'token 是接口，交叉熵是反馈，采样把分布重新变成序列',
    verify: '计数基线、困惑度、encode/decode 往返与未见样本',
    transfer: '更换语言、词表或上下文长度后解释性能变化',
    code: `# 自回归训练对齐：输入预测它右边的 token\nx = tokens[:, :-1]\ny = tokens[:, 1:]\nlogits = model(x)\nloss = F.cross_entropy(\n    logits.reshape(-1, logits.size(-1)), y.reshape(-1)\n+)`,
  },
  transformer: {
    journey: '把上下文读取拆成相似度、路由、聚合与残差更新',
    lens: '每次变换都同时追踪 shape、信息流和因果约束',
    verify: '小矩阵手算、mask 单测、权重对齐与生成一致性',
    transfer: '改变 head 数、上下文长度或归一化位置后预测影响',
    code: `q, k, v = qkv.chunk(3, dim=-1)\nscores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))\nscores = scores.masked_fill(causal_mask == 0, float('-inf'))\nweights = scores.softmax(dim=-1)\nout = weights @ v`,
  },
  training: {
    journey: '把一段能运行的代码升级成可预算、可扩展、可恢复的系统',
    lens: '同时观察数据质量、数值稳定、硬件利用率与实验可复现性',
    verify: '吞吐剖析、消融实验、故障注入与 checkpoint 恢复',
    transfer: '改变模型规模、GPU 拓扑或数据混合后重做预算',
    code: `for step, batch in enumerate(loader):\n    with torch.autocast('cuda', dtype=torch.bfloat16):\n        loss = model(batch) / grad_accum\n    loss.backward()\n    if (step + 1) % grad_accum == 0:\n        clip_grad_norm_(model.parameters(), 1.0)\n        optimizer.step(); optimizer.zero_grad(set_to_none=True)`,
  },
  alignment: {
    journey: '把“会续写”的基础模型变成行为可评估的助手',
    lens: '目标、数据、优化算法和评测必须构成闭环',
    verify: '固定评测集、人工复核、置信区间与失败样本分层',
    transfer: '改变用户群、风险等级或奖励信号后重新设计评测',
    code: `# 偏好学习的最小观测量\nmargin = (chosen_logp - rejected_logp)\nref_margin = (ref_chosen_logp - ref_rejected_logp)\nloss = -F.logsigmoid(beta * (margin - ref_margin)).mean()`,
  },
  inference: {
    journey: '把模型计算映射到延迟、吞吐、显存与服务可靠性',
    lens: '先区分 prefill 与 decode，再定位算力、带宽或调度瓶颈',
    verify: '固定质量约束下测 p50/p95 延迟、吞吐、显存和成本',
    transfer: '改变并发、序列长度或硬件后重新选择缓存与批处理策略',
    code: `# 每 token 延迟：把草稿与验证成本除以接受长度\nlatency_per_token = (t_draft + t_verify) / accepted_tokens\n# 任何“更快”都必须同时报告质量与匹配吞吐\nreport(p50, p95, tokens_per_second, memory_gb, quality)`,
  },
  agents: {
    journey: '把一次生成扩展成有状态、可控、可审计的执行循环',
    lens: '每一步都明确观察、决策、工具副作用与终止条件',
    verify: '轨迹回放、schema 校验、权限测试与回归任务集',
    transfer: '换一个工具、失败模式或权限边界后仍保持可控',
    code: `while not state.done:\n    action = policy.observe_and_decide(state)\n    validated = schema.validate(action)\n    result = tools.call(validated, least_privilege=True)\n    state = state.record(action, result)`,
  },
  'frontier-llm': {
    journey: '把前沿名词拆回架构、目标、算法、系统与评测五层',
    lens: '任何能力或速度结论都同时追问基线、负载、质量约束与可复现证据',
    verify: '最小实现、论文公式对照、匹配质量的基准与失败样本分层',
    transfer: '更换模型规模、任务域、上下文长度或并发后重新判断收益',
    code: `# 前缀存活概率：越靠后，继续被接受的概率只会下降\nsurvival = torch.cumprod(confidence, dim=-1)\nexpected_accepts = 1 + survival.sum(dim=-1)\nthroughput = expected_accepts * profiled_steps_per_second(batch_tokens)`,
  },
  'world-foundations': {
    journey: '从观察到隐藏状态，再从动作条件预测走到规划',
    lens: '始终区分世界本身、智能体看到的观察、采取的动作和模型内部状态',
    verify: '状态转移表、手算 belief update 与多步 rollout 成功率',
    transfer: '增加部分可观察性、随机性或新动作后重新规划',
    code: `# action-conditioned one-step dynamics\nnext_state_logits = model(state, action)\nloss = F.cross_entropy(next_state_logits, next_state)\n# planning evaluates complete imagined rollouts, not one-step accuracy\nplan = max(candidate_actions, key=lambda a: rollout_return(model, state, a))`,
  },
  'world-dynamics': {
    journey: '把高维观察压进隐状态，让动力学与策略在想象轨迹中协同',
    lens: '同时追踪表示是否保留任务信息、动力学误差如何累积、策略是否利用模型漏洞',
    verify: '单步误差、不同长度 rollout、真实回报与 imagined return 偏差',
    transfer: '改变预测跨度、随机环境或奖励稀疏度后检查规划',
    code: `z = encoder(observation)\nfor action in candidate_plan:\n    z = dynamics(z, action)\n    imagined_return += reward_head(z)\nbest_plan = candidate_plans[imagined_returns.argmax()]`,
  },
  jepa: {
    journey: '从重建所有像素转向预测对理解与行动真正有用的抽象表征',
    lens: '检查 context、target、predictor 的信息边界，以及表征是否坍塌',
    verify: '冻结表征的线性探针、视频检索、动作预测与规划任务',
    transfer: '更换遮挡策略、视频域或机器人本体后检查表征',
    code: `context = context_encoder(masked_video)\nwith torch.no_grad():\n    target = target_encoder(target_clip)\nprediction = predictor(context, target_positions)\nloss = representation_loss(prediction, target)`,
  },
  'generative-worlds': {
    journey: '从生成下一帧走向动作可控、空间持久和可编辑的交互世界',
    lens: '不只看画质，持续检查动作响应、物体恒常性、几何和长时记忆',
    verify: '固定动作脚本、回访测试、视角闭环、几何一致性与人工盲评',
    transfer: '更换场景风格、相机轨迹或未见动作组合后检查世界一致性',
    code: `for action in scripted_actions:\n    frame, state = world_model.step(state, action)\n    log(control_error(frame, action))\n    log(object_permanence(frame, landmarks))\nassert revisit_consistency(trajectory) > threshold`,
  },
  'physical-ai': {
    journey: '把生成世界接入合成数据、策略训练、现实验证和安全回归',
    lens: '所有仿真收益都要穿过 sim-to-real 偏差与安全边界审查',
    verify: '覆盖度、物理约束、策略回报、现实小样本验证与故障注入',
    transfer: '更换传感器、机器人本体或现实扰动后重新评估',
    code: `synthetic = world_model.generate(scenarios, controls)\npolicy.train(synthetic)\nreport = evaluate(policy, real_holdout)\nassert report.safety_violations == 0\nassert report.sim_to_real_gap < allowed_gap`,
  },
}

const typeGuides = {
  '地图': ['先画系统边界', '标出数据与状态的流向', '用一条真实请求检查遗漏'],
  '代码': ['先写接口和 shape 断言', '实现最小正确版本', '用参考实现逐项对拍'],
  '理论': ['从具体反例建立动机', '明确假设与变量', '用极端情况检查结论'],
  '推导': ['写出已知量与目标量', '逐步变形且标明依据', '用数值例子验证公式'],
  '实验': ['运行前写下预测', '一次只改变一个变量', '保存曲线并解释偏差'],
  '诊断': ['先复现并冻结现场', '观察信号再提出假设', '用最小改动排除假设'],
  '工程': ['定义约束与成功指标', '先做基线再优化', '记录成本、故障与回滚方案'],
  '系统': ['画出关键资源与队列', '定位瓶颈和背压位置', '用负载实验验证容量'],
  '直觉': ['从一个可手算例子开始', '把术语翻译成因果语言', '再回到公式和实现'],
  '验收': ['闭卷解释核心机制', '限时重写最小实现', '面对新条件完成迁移'],
  '研读': ['先看入口与数据流', '沿一次执行追踪模块', '用依赖图复述系统'],
}

const mechanismNotes = [
  '先给它一个可操作的定义，并指出它解决的具体问题。',
  '把它放进前后依赖中：输入从哪里来，输出会改变谁。',
  '写出至少一个不变量、shape 约束或成立条件。',
  '用反例说明忽略它时系统会怎样失败。',
  '把概念落到可以记录的指标或测试上。',
]

const biliSources = {
  cs50p: { platform:'Bilibili', id:'BV1vZfBY9EGa', author:'Futric芯火相传', sourceType:'community', sourceLabel:'社区双语镜像', originalUrl:'https://cs50.harvard.edu/python/', sourceNote:'Harvard CS50P 的完整中英双语社区镜像；按本节精选分P学习，课程要求与勘误仍以 Harvard 官方课程为准。' },
  d2lData: { platform:'Bilibili', id:'BV1CV411Y7i4', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创课程', originalUrl:'https://courses.d2l.ai/zh-v2/', sourceNote:'李沐《动手学深度学习》官方中文课程的数据操作与预处理章节；用于建立 tensor、shape 和 axis 直觉，NumPy 特有规则仍回到官方指南核对。' },
  d2lRegression: { platform:'Bilibili', id:'BV1PX4y1g7KC', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创课程', originalUrl:'https://courses.d2l.ai/zh-v2/', sourceNote:'李沐《动手学深度学习》官方中文课程的优化与线性回归实现；观看后必须在本站最小实验中解释 forward、loss、backward 与 update。' },
  karpathy: { platform:'Bilibili', id:'BV1mqrTBvEaf', author:'常青藤中英字幕课程', sourceType:'community', sourceLabel:'社区精译', originalUrl:'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ', sourceNote:'Andrej Karpathy 原课的中英字幕镜像；保留原课入口，镜像失效不影响正文学习。' },
  karpathyDeep: {
    platform:'Bilibili', id:'BV16cNEeXEer', author:'KrillinAI小林', sourceType:'community', sourceLabel:'社区双语',
    originalUrl:'https://www.youtube.com/watch?v=7xTGNNLPyMI',
    sourceNote:'Andrej Karpathy 原讲座的中英双语镜像。',
    segmentTiming:{
      offsetSeconds:0,
      startSupported:true,
      endSupported:false,
      noteZh:'Bilibili 镜像按原讲座时间轴从片段起点打开，但播放器不会在片段结束时自动停止；需要严格限时请切换全球源。',
      noteEn:'The Bilibili mirror opens at the mapped source start, but it cannot stop automatically at the segment end. Use the global source for bounded playback.',
    },
  },
  raschka: { platform:'Bilibili', id:'BV1RpwzzoErr', author:'脑袋要有光', sourceType:'community', sourceLabel:'作者配套中配', originalUrl:'https://github.com/rasbt/LLMs-from-scratch', sourceNote:'Sebastian Raschka 书籍配套视频的中文配音与字幕版本。' },
  cs336: { platform:'Bilibili', id:'BV1Ect2zjEHR', author:'大模型项目实战教学', sourceType:'community', sourceLabel:'课程字幕镜像', originalUrl:'https://stanford-cs336.github.io/spring2025/', sourceNote:'Stanford CS336 课程镜像；关键结论仍以课程主页、讲义和作业为准。' },
  calculus: { platform:'Bilibili', id:'BV1qW411N7FU', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.youtube.com/watch?v=YG15m2VwSjA', sourceNote:'3Blue1Brown 官方账号发布。' },
  neuralNet: { platform:'Bilibili', id:'BV1bx411M7Zx', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.youtube.com/watch?v=aircAruvnKk', sourceNote:'3Blue1Brown 官方账号发布。' },
  transformerVisual: { platform:'Bilibili', id:'BV13z421U7cs', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.youtube.com/watch?v=wjZofJX0v4M', sourceNote:'3Blue1Brown 官方 Transformer 可视化课程。' },
  liMuAttention: { platform:'Bilibili', id:'BV1pu411o7BE', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'结合论文逐段讲解注意力与 Transformer。' },
  liMuData: { platform:'Bilibili', id:'BV1u142187S5', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'Llama 3.1 预训练数据论文精读。' },
  liMuRun: { platform:'Bilibili', id:'BV1c8HbeaEXi', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'Llama 3.1 训练过程论文精读。' },
  nvidiaFsdp: { platform:'Bilibili', id:'BV1UHMwzsEbz', author:'NVIDIA英伟达', sourceType:'official', sourceLabel:'官方技术分享', sourceNote:'NVIDIA 官方账号发布的 Megatron-Core / FSDP 架构分享。' },
  dpo: { platform:'Bilibili', id:'BV1brFSzBEuh', author:'东川路第一可爱猫猫虫', sourceType:'original', sourceLabel:'中文原创', originalUrl:'https://arxiv.org/abs/2305.18290', sourceNote:'从 DPO 原论文延伸到 ORPO、KTO、SimPO 等变体。' },
  vllm: { platform:'Bilibili', id:'BV1kx4y1x7bu', author:'RethinkFun', sourceType:'original', sourceLabel:'中文原创', originalUrl:'https://arxiv.org/abs/2309.06180', sourceNote:'用 KV Cache 与 PagedAttention 建立 vLLM 核心直觉。' },
  llamaCpp: { platform:'Bilibili', id:'BV1N4wreWE8z', author:'比飞鸟贵重的多_HKL', sourceType:'original', sourceLabel:'源码带读', originalUrl:'https://github.com/ggml-org/llama.cpp', sourceNote:'逐行调试 llama.cpp，适合作为源码研读伴侣。' },
  agentic: { platform:'Bilibili', id:'BV1DfrdByE2H', author:'吴恩达Agent', sourceType:'community', sourceLabel:'课程字幕镜像', originalUrl:'https://www.deeplearning.ai/courses/agentic-ai/', sourceNote:'DeepLearning.AI Agentic AI 课程镜像；保留官方课程入口。' },
  worldOverview: { platform:'Bilibili', id:'BV11LPWzNEkm', author:'硅谷101', sourceType:'original', sourceLabel:'中文深度总览', sourceNote:'49 分钟梳理世界模型的定义、生成式路线、JEPA、空间智能与 Physical AI；用于建立地图，技术结论回到正文和一手资料核验。' },
  pomdpCn: { platform:'Bilibili', id:'BV1AzkaBNEEk', author:'人工智能方法论', sourceType:'original', sourceLabel:'中文专题课', sourceNote:'聚焦部分可观察马尔可夫决策过程；观看时重点记录隐藏状态、观察与 belief update 的关系。' },
  worldFramework: { platform:'Bilibili', id:'BV1YnuWzbEQi', author:'VALSE_Webinar', sourceType:'official', sourceLabel:'中文学术报告', sourceNote:'VALSE 2025 世界模型理论与框架报告，适合在经典架构和评测课建立研究全景。' },
  dreamerCn: { platform:'Bilibili', id:'BV17e411k7zS', author:'B站学术讲解', sourceType:'original', sourceLabel:'中文论文精讲', sourceNote:'从 DreamerV1 到 DreamerV3 梳理 model-based RL；用于理解 RSSM 和 imagined rollout，不替代本站的最小实现实验。' },
  muzeroCn: { platform:'Bilibili', id:'BV1JV411b7Wz', author:'强化学习课程整理', sourceType:'community', sourceLabel:'中文课程视频', sourceNote:'沿 AlphaGo、AlphaZero 到 MuZero 理解 MCTS 与学习动力学；算法细节以原论文和作者报告为准。' },
  jepaCn: { platform:'Bilibili', id:'BV1v1421Q73e', author:'ZOMI酱', sourceType:'original', sourceLabel:'中文原创', sourceNote:'用 14 分钟建立 JEPA 的关键直觉；随后回到正文区分表征预测、坍塌规避与世界模型能力。' },
  vjepa2Cn: { platform:'Bilibili', id:'BV12PMAzdEZ8', author:'CVer计算机视觉', sourceType:'original', sourceLabel:'中文前沿速览', sourceNote:'短视频用于预习 V-JEPA 2 的研究结论；完整机制与机器人规划证据以作者演讲和论文为主。' },
  genie3Cn: { platform:'Bilibili', id:'BV1if4ZzGEeF', author:'双语技术讲解', sourceType:'community', sourceLabel:'中文双语讲解', sourceNote:'结合 Genie 3 演示理解实时交互与世界记忆；注意演示效果不等同于规划效用。' },
  marbleCn: { platform:'Bilibili', id:'BV1UyUVB6E4r', author:'一枚卓子', sourceType:'original', sourceLabel:'中文产品实测', sourceNote:'通过实际体验观察可导航、可回访和可编辑性；产品实测只作现象入口，技术边界以 World Labs 一手资料为准。' },
  cosmosCn: { platform:'Bilibili', id:'BV18hwLeREUK', author:'ZOMI酱', sourceType:'original', sourceLabel:'中文技术剖析', sourceNote:'从视频生成、世界基础模型到 Physical AI 管线拆解 Cosmos，并与普通视频模型区分。' },
}

const bili = (source, details = {}) => ({ ...biliSources[source], ...details })
const part = (page, label, labelEn) => ({ page, label, ...(labelEn ? { labelEn } : {}) })
const videoPart = (id, label) => ({ id, label })
const karpathy = (id, title, duration, page, details = {}) => {
  const { cn: cnDetails, ...rest } = details
  return {
    platform:'YouTube', id, title, author:'Andrej Karpathy', duration,
    sourceType:'primary', sourceLabel:'Original course', sourceNote:'Andrej Karpathy 原始课程视频。',
    cnQuery:`Karpathy ${title} 中文`,
    cn:bili('karpathy', { title:`中英字幕 · ${title}`, duration, page, ...cnDetails }),
    ...rest,
  }
}

const pairedWorldVideo = (cnSource, cnDetails, global, guidance = {}) => ({
  ...bili(cnSource, { ...cnDetails, originalUrl:`https://www.youtube.com/watch?v=${global.id}` }),
  global: {
    platform:'YouTube', sourceType:'primary', sourceLabel:'Original lecture',
    sourceNote:'优先选择作者、大学课程或项目官方频道，用于核对技术机制与能力边界。',
    ...global,
  },
  ...guidance,
})

export const karpathyDeepResource = {
  id: '7xTGNNLPyMI',
  title: 'Deep Dive into LLMs like ChatGPT',
  author: 'Andrej Karpathy',
  duration: '3h31m24s',
  durationSeconds: 12684,
  chapters: [
    ['introduction', 0, 60, 'Introduction', '开场：文本框背后是什么'],
    ['pretraining-data', 60, 467, 'Pretraining data', '预训练数据'],
    ['tokenization', 467, 867, 'Tokenization', 'Tokenization'],
    ['neural-network-io', 867, 1211, 'Neural network I/O', '神经网络输入与输出'],
    ['neural-network-internals', 1211, 1561, 'Neural network internals', '神经网络内部'],
    ['inference', 1561, 1869, 'Inference', '自回归推理'],
    ['gpt2-training-inference', 1869, 2572, 'GPT-2 training and inference', 'GPT-2 训练与推理'],
    ['llama-base-inference', 2572, 3563, 'Llama 3.1 base model inference', 'Llama 3.1 基础模型推理'],
    ['pretraining-to-posttraining', 3563, 3666, 'Pretraining to post-training', '从预训练到后训练'],
    ['posttraining-conversations', 3666, 4832, 'Post-training conversations', '对话数据与后训练'],
    ['hallucinations-tools-memory', 4832, 6106, 'Hallucinations, tools, and working memory', '幻觉、工具与工作记忆'],
    ['knowledge-of-self', 6106, 6416, 'Knowledge of self', '模型对自身知识的判断'],
    ['tokens-to-think', 6416, 7271, 'Models need tokens to think', '模型需要 token 来思考'],
    ['tokenization-revisited', 7271, 7493, 'Tokenization revisited', '再次理解 Tokenization'],
    ['jagged-intelligence', 7493, 7648, 'Jagged intelligence', '参差不齐的智能'],
    ['sft-to-rl', 7648, 8082, 'SFT to RL', '从 SFT 到 RL'],
    ['reinforcement-learning', 8082, 8867, 'Reinforcement learning', '强化学习'],
    ['deepseek-r1', 8867, 9727, 'DeepSeek-R1', 'DeepSeek-R1'],
    ['alphago', 9727, 10106, 'AlphaGo', 'AlphaGo'],
    ['rlhf', 10106, 11379, 'RLHF', 'RLHF'],
    ['things-to-come', 11379, 11715, 'Preview of things to come', '未来方向预览'],
    ['tracking-llms', 11715, 11914, 'Keeping track of LLMs', '如何跟踪 LLM 进展'],
    ['finding-llms', 11914, 12106, 'Where to find LLMs', '在哪里使用 LLM'],
    ['grand-summary', 12106, 12684, 'Grand summary', '全片总结'],
  ].map(([id, start, end, title, titleZh]) => ({ id, start, end, title, titleZh })),
}

const karpathyChapter = id => {
  const chapter = karpathyDeepResource.chapters.find(item => item.id === id)
  if (!chapter) throw new Error(`Unknown Karpathy chapter: ${id}`)
  return chapter
}

const karpathySegment = (id, role, before, after, linksTo = [], pauseAt = null) => ({
  ...karpathyChapter(id), role, before, after, linksTo, pauseAt,
})

const karpathyEnglishGuidance = {
  introduction:{ before:'Without references, write what happens behind a chat box.', after:'Replace “the chat box” with at least three system nodes.' },
  'pretraining-data':{ before:'Predict the steps between public web text and a training example.', after:'Add collection, filtering, deduplication, and mixing to your map.' },
  tokenization:{ before:'Split one bilingual sentence into units using your current intuition.', after:'Record how a tokenizer change affects sequence length and vocabulary indices.' },
  inference:{ before:'Predict whether one forward pass creates a full answer or one token.', after:'Draw logits → sampling → append → next forward.' },
  'pretraining-to-posttraining':{ before:'Write which data could teach continuation versus assistant behavior.', after:'Draw the post-training boundary between base model and assistant.' },
  'grand-summary':{ before:'Redraw the complete stack from memory and watch for missing links.', after:'Correct the map and label parameter, runtime-state, and tool-observation flows.' },
  'llama-base-inference':{ before:'Predict why a base model may continue a webpage instead of answering directly.', after:'Classify the output by training distribution instead of “intelligence”.' },
  'posttraining-conversations':{ before:'Predict how a chat template changes the input token sequence.', after:'Save a paired table of base/instruct encodings and outputs.' },
}

const karpathyMedia = ({ segments, requiredDuration, activityDuration, activityDurationEn }) => ({
  resourceId: karpathyDeepResource.id,
  platform:'YouTube',
  id:karpathyDeepResource.id,
  title:karpathyDeepResource.title,
  author:karpathyDeepResource.author,
  sourceType:'primary',
  sourceLabel:'Original course',
  sourceNote:'Andrej Karpathy 原始完整讲座；本课只要求观看标注片段。',
  duration:karpathyDeepResource.duration,
  resourceDuration:karpathyDeepResource.duration,
  requiredDuration,
  activityDuration,
  activityDurationEn,
  segments,
  cnQuery:'Karpathy 大语言模型 深入 中文',
  cn:bili('karpathyDeep', {
    title:'深入探索像 ChatGPT 这样的大语言模型',
    duration:karpathyDeepResource.duration,
    resourceId:karpathyDeepResource.id,
  }),
})

const lessonMedia = {
  'p.1': {
    ...bili('cs50p', {
      title:'CS50P · 函数、条件与循环',
      titleEn:'CS50P · Functions, Conditionals, and Loops',
      duration:'精选 3 讲',
      page:2,
      parts:[part(2,'函数与变量','Functions & Variables'), part(3,'条件句','Conditionals'), part(4,'循环','Loops')],
    }),
    global:{
      platform:'YouTube', id:'JP7ITIXGpHk', title:'CS50P · Functions, Conditionals, and Loops', author:'Harvard CS50',
      duration:'3 selected lectures', sourceType:'primary', sourceLabel:'Official video',
      sourceNote:'Harvard CS50P 官方讲座；按本节精选 Functions、Conditionals 与 Loops 三讲。',
      originalUrl:'https://cs50.harvard.edu/python/',
      referenceUrl:'https://cs50.harvard.edu/python/',
      parts:[
        videoPart('JP7ITIXGpHk','Functions & Variables'),
        videoPart('_b6NgY_pMdw','Conditionals'),
        videoPart('-7xg8pGcP6w','Loops'),
      ],
    },
    before:'先写一个只会顺序执行的 Python 小程序，再预测函数、条件与循环分别会替代哪一段重复代码。',
    after:'闭卷写出一个含函数、条件与循环的小程序，并用至少三个输入验证正常、边界与失败路径。',
    beforeEn:'Write a sequential Python script, then predict which repeated lines a function, condition, and loop should replace.',
    afterEn:'From memory, write one small program with a function, condition, and loop; test normal, boundary, and failure inputs.',
  },
  'p.2': {
    ...bili('cs50p', {
      title:'CS50P · 异常、库、单元测试与文件 I/O',
      titleEn:'CS50P · Exceptions, Libraries, Unit Tests, and File I/O',
      duration:'精选 4 讲',
      page:5,
      parts:[part(5,'异常','Exceptions'), part(6,'库','Libraries'), part(7,'单元测试','Unit Tests'), part(8,'文件 I/O','File I/O')],
    }),
    global:{
      platform:'YouTube', id:'LW7g1169v7w', title:'CS50P · Exceptions, Libraries, Unit Tests, and File I/O', author:'Harvard CS50',
      duration:'4 selected lectures', sourceType:'primary', sourceLabel:'Official video',
      sourceNote:'Harvard CS50P 官方讲座；Python 语义仍以 Python 官方教程核对。',
      originalUrl:'https://cs50.harvard.edu/python/',
      referenceUrl:'https://docs.python.org/3/tutorial/',
      parts:[
        videoPart('LW7g1169v7w','Exceptions'),
        videoPart('MztLZWibctI','Libraries'),
        videoPart('tIrcxwLqzjQ','Unit Tests'),
        videoPart('KD-Yoel6EVQ','File I/O'),
      ],
    },
  },
  'p.3': {
    ...bili('d2lData', {
      title:'数据操作、Tensor 与预处理',
      titleEn:'Data Operations, Tensors, and Preprocessing',
      duration:'精选 3 讲',
      page:1,
      parts:[part(1,'数据操作','Data Operations'), part(2,'数据操作实现','Data Operations in Code'), part(3,'数据预处理实现','Data Preprocessing in Code')],
    }),
    global:{
      platform:'YouTube', id:'ZB7BZMhfPgk', title:'Introduction to Numerical Computing with NumPy', author:'Alex Chabot-Leclerc · Enthought',
      duration:'Full tutorial', sourceType:'community', sourceLabel:'NumPy 官方精选', sourceLabelEn:'NumPy-vetted video',
      sourceNote:'NumPy 官方 Learn 页面为初学者推荐的完整视频教程；ndarray、shape、axis、dtype、广播和 view/copy 规则仍以官方指南核对。',
      originalUrl:'https://numpy.org/learn/',
      referenceUrl:'https://numpy.org/doc/stable/user/absolute_beginners.html',
    },
  },
  'p.4': {
    ...bili('d2lRegression', {
      title:'从自动求导到第一条训练循环',
      titleEn:'From Autograd to a First Training Loop',
      duration:'精选 3 讲',
      page:2,
      parts:[part(2,'基础优化算法','Basic Optimization'), part(3,'线性回归从零实现','Linear Regression from Scratch'), part(4,'线性回归简洁实现','Concise Linear Regression')],
    }),
    global:{
      platform:'YouTube', id:'M0fX15_-xrY', title:'PyTorch · Autograd and Model Training', author:'PyTorch',
      duration:'2 selected videos', sourceType:'primary', sourceLabel:'Official video',
      sourceNote:'PyTorch 官方视频串联自动求导与完整训练循环；代码细节仍以 Learn the Basics 官方教程为准。',
      originalUrl:'https://docs.pytorch.org/tutorials/beginner/introyt/autogradyt_tutorial.html',
      referenceUrl:'https://docs.pytorch.org/tutorials/beginner/basics/intro.html',
      parts:[
        videoPart('M0fX15_-xrY','Autograd'),
        videoPart('jF43_wj_DCQ','Model Training'),
      ],
    },
  },
  '0.1': karpathyMedia({
    requiredDuration:'30:56',
    activityDuration:'约 14 分钟',
    activityDurationEn:'about 14 minutes',
    segments:[
      karpathySegment('introduction', 'required', '不查资料写下：聊天框背后依次发生了什么？', '把“文本框”改写成至少三个系统节点。', ['0.1']),
      karpathySegment('pretraining-data', 'required', '预测预训练数据从公开网页到训练样本要经过哪些处理。', '在地图上标出收集、过滤、去重与混合。', ['4.2']),
      karpathySegment('tokenization', 'required', '先把一句中英混合文本按自己的直觉切成单元。', '记录 tokenizer 改变后序列长度和词表索引如何变化。', ['2.7', '2.8']),
      karpathySegment('inference', 'required', '预测模型一次前向会生成整个回答还是一个 token。', '画出 logits → sampling → append → next forward 的循环。', ['3.7', '6.1']),
      karpathySegment('pretraining-to-posttraining', 'required', '先写下“会续写”和“会当助手”可能来自哪两类数据。', '在 base model 与 assistant 之间画出后训练边界。', ['5.1', '5.2']),
      karpathySegment('grand-summary', 'required', '闭卷重画全栈地图，再带着缺口看总结。', '修正地图并分别标出参数更新流、请求状态流与工具结果。', ['2.1', '3.1', '5.1', '6.1', '7.1']),
    ],
  }),
  '0.5': bili('calculus', { title:'直观理解链式法则和乘积法则', duration:'16m52s', page:4 }),
  '0.7': bili('raschka', { title:'从零训练一个大语言模型', duration:'27m04s', page:28 }),

  '1.1': bili('neuralNet', { title:'神经网络到底是什么？', duration:'19m13s' }),
  '1.2': bili('calculus', { title:'直观理解链式法则和乘积法则', duration:'16m52s', page:4 }),
  '1.3': karpathy('VMj-3S1tku0', 'Building micrograd', '2h25m', 1, {
    requiredDuration:'57:53',
    before:'在播放前先写下：一个 Value 节点至少要保存哪些状态，为什么梯度必须累加？',
    after:'暂停视频，闭卷实现 add、mul、tanh 和 backward，再用有限差分检查。',
    beforeEn:'Before watching, list the state a Value node needs and predict why gradients must accumulate.',
    afterEn:'Close the source, implement add, multiply, tanh, and backward, then check them with finite differences.',
    segments:[
      { id:'value-object', role:'required', start:1160, end:1760, title:'Value object and graph edges', titleZh:'Value 对象与计算图边', before:'先写出 Value 最少要保存的 data、grad、parents 与 operation。', after:'画出一次加法产生的新节点及两条父边。', beforeEn:'List the minimum data, grad, parents, and operation fields.', afterEn:'Draw the output node and two parent edges created by one addition.' },
      { id:'chain-rule', role:'required', start:2288, end:3071, title:'Chain rule and gradient checks', titleZh:'链式法则与数值梯度', before:'手算一个两层标量表达式的局部导数和上游梯度。', after:'用中心差分核对一个叶子节点的解析梯度。', beforeEn:'Hand-calculate local and upstream derivatives for a two-layer scalar expression.', afterEn:'Check one leaf gradient with a centered finite difference.' },
      { id:'backward-closures', role:'required', start:3071, end:4161, title:'Backward closures and tanh', titleZh:'反向闭包与 tanh', before:'预测 add、mul、tanh 各自需要把什么贡献传回父节点。', after:'为三个运算分别写 _backward，并解释为什么使用 +=。', beforeEn:'Predict the parent contribution for add, multiply, and tanh.', afterEn:'Write each _backward closure and explain why every update uses +=.' },
      { id:'topology-accumulation', role:'required', start:4161, end:5161, title:'Reverse topology and accumulation', titleZh:'逆拓扑与梯度累加', before:'找一个共享节点 x 同时走两条路径到 loss 的例子。', after:'构建拓扑序、逆序执行，并用 y=x*x+x 验证 x.grad=5。', beforeEn:'Create a loss where x reaches the output through two paths.', afterEn:'Build the topological order, reverse it, and verify x.grad=5 for y=x*x+x at x=2.' },
    ],
  }),
  '1.5': karpathy('VMj-3S1tku0', 'From Value to MLP', '2h25m', 1),
  '1.7': karpathy('P6sfmUTpUmc', 'Activations, gradients and BatchNorm', '1h55m', 4),
  '1.8': karpathy('VMj-3S1tku0', 'Rebuild micrograd from scratch', '2h25m', 1),

  '2.1': karpathy('PaCmpygFfXo', 'Building makemore: bigram language model', '1h57m', 2, { before:'先预测 bigram 计数矩阵每一行为什么必须归一化，以及未见组合会发生什么。', after:'更换一份姓名语料，比较计数模型与随机均匀基线的平均 NLL。' }),
  '2.2': karpathy('PaCmpygFfXo', 'NLL and language-model scoring', '1h57m', 2),
  '2.3': bili('raschka', { title:'创建 Token Embedding', duration:'8m38s', page:7 }),
  '2.4': karpathy('TCH_1BHY58I', 'Building makemore Part 2: MLP', '1h15m', 3, { before:'画出 context token → embedding → hidden → logits 的 shape 链。', after:'复现 train/dev/test 切分，故意增大隐藏层，观察训练集与验证集 loss 分叉。' }),
  '2.5': karpathy('P6sfmUTpUmc', 'Building makemore Part 3: Activations & Gradients', '1h55m', 4),
  '2.6': karpathy('q8SA3rM6ckI', 'Building makemore Part 4: Backprop Ninja', '1h55m', 5),
  '2.7': karpathy('zduSFxRajkE', "Let's build the GPT Tokenizer", '2h13m', 9, { cn:{ parts:[part(9,'Karpathy · 从零实现 GPT Tokenizer'), part(5,'Raschka · BPE 分词')] } }),
  '2.8': karpathy('zduSFxRajkE', 'Tokenizer 的隐形代价', '2h13m', 9),
  '2.9': bili('karpathy', { title:'makemore + Tokenizer 复习路径', duration:'选看', page:2, parts:[part(2,'Bigram 与 makemore'), part(3,'MLP 语言模型'), part(4,'激活与梯度'), part(5,'手工反传'), part(9,'GPT Tokenizer')] }),

  '3.1': bili('transformerVisual', { title:'GPT 是什么？直观解释 Transformer', duration:'27m14s' }),
  '3.2': bili('liMuAttention', {
    title:'Transformer 论文逐段精读', duration:'1h27m',
    before:'带着三个问题看：为什么除以 √d、mask 在哪里加、Multi-Head 如何拼接？',
    after:'用四个 token 的小矩阵手算一次 attention，并标注每个张量 shape。',
    global:{
      platform:'YouTube', id:'eMlx5fFNoYc', title:'Attention in transformers, step-by-step | Deep Learning Chapter 6',
      author:'3Blue1Brown', duration:'26m10s', sourceType:'official', sourceLabel:'Official lesson',
      sourceNote:'3Blue1Brown 官方可视化课程，逐步解释 Q、K、V、缩放、mask 与多头注意力。',
      originalUrl:'https://www.youtube.com/watch?v=eMlx5fFNoYc',
      referenceUrl:'https://www.3blue1brown.com/lessons/attention/',
    },
  }),
  '3.3': bili('raschka', { title:'从单头到 Multi-Head Attention', duration:'28m52s', page:16, parts:[part(16,'堆叠多个单头注意力层'), part(17,'权重分割实现多头注意力')] }),
  '3.4': bili('raschka', { title:'位置编码、LayerNorm 与残差连接', duration:'45m30s', page:8, parts:[part(8,'位置编码'), part(19,'LayerNorm'), part(21,'残差连接')] }),
  '3.5': bili('raschka', { title:'逐步搭建 Transformer Block', duration:'58m', page:18, parts:[part(18,'编码 LLM 架构'), part(19,'LayerNorm'), part(20,'GELU 与前馈网络'), part(21,'残差连接'), part(22,'连接注意力与线性层')] }),
  '3.6': karpathy('kCc8FmEb1nY', "Let's build GPT from scratch", '1h56m', 7),
  '3.7': bili('raschka', { title:'温度、Top-k 与生成策略', duration:'32m55s', page:29, parts:[part(29,'温度缩放'), part(30,'Top-k 采样'), part(31,'修改生成函数')] }),
  '3.8': bili('raschka', { title:'保存、加载与对齐 GPT-2 权重', duration:'24m28s', page:32, parts:[part(32,'保存与加载权重'), part(33,'加载 GPT-2 预训练权重')] }),
  '3.9': karpathy('l8pRSuU81PU', "Let's reproduce GPT-2 (124M)", '4h01m', 10, { cn:{ parts:[part(10,'GPT-2 复现 · 上'), part(11,'GPT-2 复现 · 下')] } }),
  '3.10': bili('karpathy', { title:'闭卷实现 GPT · 主线复习', duration:'1h56m', page:7 }),

  '4.2': bili('liMuData', { title:'Llama 3.1 · 预训练数据', duration:'23m37s', before:'先写下数据清洗、去重、混合比例会怎样改变模型学习分布。', after:'为自己的 1GB 语料写 data card，并保留每条过滤规则前后的数量。' }),
  '4.3': bili('raschka', { title:'训练大语言模型', duration:'27m04s', page:28 }),
  '4.5': bili('cs336', { title:'GPU 架构与性能优化', duration:'1h14m', page:5 }),
  '4.6': bili('cs336', { title:'手写高性能算子', duration:'1h20m', page:6 }),
  '4.7': bili('nvidiaFsdp', { title:'基于 Megatron-Core 的 FSDP 架构设计', duration:'37m41s' }),
  '4.8': bili('cs336', { title:'Scaling Laws：经典结论与最新进展', duration:'2h23m', page:9, parts:[part(9,'Scaling Law 基础'), part(11,'最新缩放定律进展')] }),
  '4.9': bili('liMuRun', { title:'Llama 3.1 · 模型训练过程', duration:'10m42s' }),
  '4.10': bili('cs336', { title:'从 PyTorch LLM 到并行训练', duration:'2h34m', page:2, parts:[part(2,'PyTorch 手把手搭建 LLM'), part(8,'并行训练实战')] }),

  '5.1': karpathyMedia({
    requiredDuration:'37:40',
    activityDuration:'25–30 分钟',
    activityDurationEn:'25–30 minutes',
    segments:[
      karpathySegment('llama-base-inference', 'required', '预测基础模型面对问题时为什么可能继续网页而不是直接回答。', '记录输出更像哪类预训练文本分布，而不是只评判“聪不聪明”。', ['5.1']),
      karpathySegment('pretraining-to-posttraining', 'required', '写下参数是否改变，以及训练数据目标如何改变。', '用一条因果链解释 base → assistant 的分界。', ['5.1', '5.2']),
      karpathySegment('posttraining-conversations', 'required', '预测 chat template 会怎样改变输入 token 序列。', '保存同一 prompt 的 base/instruct 编码与输出对照表。', ['5.2']),
    ],
  }),
  '5.2': bili('raschka', { title:'指令数据、批处理与 SFT', duration:'1h01m', page:41, parts:[part(41,'准备指令数据集'), part(42,'组织训练批次'), part(43,'创建数据加载器'), part(44,'加载预训练模型'), part(45,'指令微调')] }),
  '5.3': bili('cs336', { title:'对齐：SFT 与人类反馈强化学习', duration:'1h14m', page:15 }),
  '5.4': bili('dpo', { title:'DPO 的目标、缺陷与变体', duration:'31m25s' }),
  '5.5': bili('cs336', { title:'RL 后训练与 GRPO', duration:'2h37m', page:16, parts:[part(16,'大模型 RL 算法'), part(17,'GRPO')] }),
  '5.6': bili('cs336', { title:'模型评估：任务、指标与污染', duration:'1h20m', page:12 }),

  '6.1': bili('cs336', { title:'大模型推理：Prefill、Decode 与服务负载', duration:'1h22m', page:10 }),
  '6.2': bili('vllm', {
    title:'KV Cache 与 PagedAttention', duration:'12m08s',
    before:'先估算一个请求的 KV cache：层数 × 2 × KV heads × head dim × token 数 × 每元素字节数，并预测长度翻倍后的显存变化。',
    after:'对同一批请求分别画出连续分配与分页分配，标出碎片、复用和 block table；再用公式复核总显存。',
  }),
  '6.3': bili('llamaCpp', { title:'GGUF 文件解析与模型加载', duration:'28m16s', page:5 }),
  '6.4': bili('llamaCpp', { title:'llama.cpp 源码逐行调试带读', duration:'2h34m', page:3, parts:[part(3,'加载后端'), part(5,'解析 GGUF'), part(8,'CPU/GPU Buffer'), part(14,'llama_context'), part(15,'分配 KV Cache')] }),
  '6.5': bili('vllm', { title:'vLLM：KV Cache、PagedAttention 与吞吐', duration:'12m08s' }),

  '7.1': bili('agentic', { title:'Agent 的最小闭环与设计模式', duration:'43m', page:2, parts:[part(2,'什么是 Agentic AI'), part(6,'任务分解'), part(7,'Agent 评测'), part(8,'设计模式')] }),
  '7.2': bili('agentic', { title:'工具调用、代码执行与 MCP', duration:'28m46s', page:14, parts:[part(14,'什么是工具'), part(15,'创建工具'), part(16,'工具语法'), part(17,'代码执行'), part(18,'MCP')] }),
  '7.4': bili('agentic', { title:'规划与多 Agent 工作流', duration:'30m', page:26, parts:[part(26,'规划工作流'), part(27,'创建与执行计划'), part(28,'结合代码执行'), part(29,'多 Agent 工作流'), part(30,'通信模式')] }),
  '7.5': bili('agentic', { title:'Agent 评测、误差分析与优化', duration:'50m', page:19, parts:[part(19,'Agent Evals'), part(20,'误差分析'), part(22,'组件级评估'), part(24,'延迟与成本'), part(25,'开发过程总结')] }),

  'wm.0.1': pairedWorldVideo('worldOverview', { title:'全面解析世界模型：定义、路线、实践与 AGI', duration:'49m36s' }, {
    id:'CkOSMqwvFiQ', title:'Building Generative World Models', author:'Ruiqi Gao · TUM AI Lecture Series', duration:'lecture',
  }, {
    before:'先写下你判断“视频生成器是不是世界模型”的三个标准；观看时检查讲者是否讨论状态、动作和可验证的未来后果。',
    after:'用本站六项判据审计视频中出现的三个项目，并分别写出支持证据与缺失证据。',
  }),
  'wm.0.2': pairedWorldVideo('pomdpCn', { title:'部分可观察马尔可夫决策过程', duration:'专题课' }, {
    id:'2dNp7QyoF_k', title:'Lecture 15: Partially Observable MDPs', author:'UC Berkeley CS287 Advanced Robotics', duration:'lecture',
  }, {
    before:'先区分真实状态、观察和 belief：如果传感器只告诉你“可能在左侧”，策略应该以什么作为输入？',
    after:'手算两轮 action → observation → belief update，并验证概率是否归一化。',
  }),
  'wm.0.3': pairedWorldVideo('dreamerCn', { title:'从 DreamerV1 到 DreamerV3：最小实现的进阶预习', duration:'1h24m56s' }, {
    id:'viXppDhx4R0', title:'DreamerV3 Tutorial: Paper, Diagrams, Clean Code', author:'eclecticsheep.ai', duration:'tutorial',
  }, {
    before:'视频讲的是更完整的 latent world model。观看前先画出本站最小版本的 state + action → next state 接口，避免被复杂架构淹没。',
    after:'只实现 GridWorld 的一步动力学与三步 rollout；再标出 Dreamer 比这个最小版本多出的组件。',
  }),
  'wm.1.1': pairedWorldVideo('worldFramework', { title:'世界模型理论与框架', duration:'17m47s' }, {
    id:'dPsXxLyqpfs', title:'World Models', author:'David Ha & Jürgen Schmidhuber', duration:'paper video',
  }, {
    before:'画出 VAE、MDN-RNN、Controller 三个盒子，并写清每个盒子的输入、输出和训练目标。',
    after:'沿一次 dream rollout 追踪 z、hidden state、action 和 predicted mixture，找出误差开始累积的位置。',
  }),
  'wm.1.2': pairedWorldVideo('dreamerCn', { title:'从 DreamerV1 到 DreamerV3', duration:'1h24m56s' }, {
    id:'awyuuJoHawo', title:'Dream to Control: Learning Behaviors by Latent Imagination', author:'Danijar Hafner · DeepMind', duration:'research talk',
  }, {
    before:'先解释“在想象中训练”为什么仍需要真实环境数据，并预测 actor 会怎样利用一个有偏的世界模型。',
    after:'把真实轨迹和 imagined trajectory 的训练信号分色画出，并设计一个检测 model exploitation 的实验。',
  }),
  'wm.1.3': pairedWorldVideo('muzeroCn', { title:'从 AlphaGo、AlphaZero 到 MuZero', duration:'课程视频' }, {
    id:'L0A86LmH7Yw', title:'MuZero — ICAPS 2020', author:'Julian Schrittwieser', duration:'1h00m',
  }, {
    before:'写下 MuZero 不预测的内容，以及 representation、dynamics、prediction 三个网络各自必须提供什么。',
    after:'在玩具棋盘上展开两层 MCTS，记录 reward、policy、value 如何影响选边，而不是尝试重建棋盘像素。',
  }),
  'wm.2.1': pairedWorldVideo('jepaCn', { title:'JEPA 世界模型详细解读', duration:'14m10s' }, {
    id:'vJKC31YpA8c', title:'Special Lecture on AI and World Models', author:'Yann LeCun', duration:'lecture',
  }, {
    before:'先列出逐像素预测会浪费容量的两类不可预测细节，再预测 JEPA 的 target 应该保留什么。',
    after:'用同一遮挡任务比较 pixel loss 与 representation loss，并写出两者各自可能“作弊”的方式。',
  }),
  'wm.2.2': pairedWorldVideo('vjepa2Cn', { title:'V-JEPA 2：从视频训练到机器人规划', duration:'4m47s' }, {
    id:'o8Cexk56oBk', title:'V-JEPA 2', author:'Nicolas Ballas', duration:'research talk',
  }, {
    before:'把 action-free 视频预训练与 action-conditioned 机器人后训练分成两栏，预测它们分别学到什么。',
    after:'画出候选动作序列在 latent space 中 rollout 到目标表征的规划流程，并列出一个不能由视频 benchmark 证明的能力。',
  }),
  'wm.3.1': pairedWorldVideo('genie3Cn', { title:'详解 Genie 3：世界变得可玩', duration:'双语讲解' }, {
    id:'PDKhUknuQDg', title:'Genie 3: Creating Dynamic Worlds You Can Navigate in Real Time', author:'Google DeepMind', duration:'official demo',
  }, {
    before:'把“画面真实”与“动作响应、物体恒常、世界记忆”分开列项，观看时只记录可观察证据。',
    after:'为同一动作脚本设计 Genie 的控制、回访和长时漂移测试；不要用一次顺利演示代替评测。',
  }),
  'wm.3.2': pairedWorldVideo('marbleCn', { title:'Marble 世界模型初体验', duration:'产品实测' }, {
    id:'UslQB4LUueI', title:'Introducing Marble by World Labs', author:'World Labs', duration:'official demo',
  }, {
    before:'先写出视频生成、3D 重建和生成式世界各自允许用户做什么，再观察 Marble 展示了哪些交互。',
    after:'从可导航、可回访、可编辑、可导出四项记录证据，并单独标记官方演示没有证明的几何与物理能力。',
  }),
  'wm.4.1': pairedWorldVideo('cosmosCn', { title:'NVIDIA Cosmos 世界模型深度剖析', duration:'35m20s' }, {
    id:'9Uch931cDx8', title:'NVIDIA Cosmos: A World Foundation Model Platform for Physical AI', author:'NVIDIA', duration:'official overview',
  }, {
    before:'画出真实传感器数据 → 世界基础模型 → 合成数据 → perception/policy → 现实评测的闭环。',
    after:'为一个机器人任务填写数据来源、后训练目标、guardrail、现实 holdout 和 sim-to-real 指标。',
  }),
  'wm.4.2': pairedWorldVideo('worldFramework', { title:'世界模型理论与框架：评测视角', duration:'17m47s' }, {
    id:'CkOSMqwvFiQ', title:'Building Generative World Models: Progress and Challenges', author:'Ruiqi Gao · TUM AI Lecture Series', duration:'lecture',
  }, {
    before:'先把视觉质量、动作可控性、长期一致性、规划效用和 sim-to-real 写成互不替代的五列。',
    after:'用统一矩阵给 Genie、V-JEPA 2、Marble、Cosmos 填“有证据 / 无证据 / 不适用”，并为每格附来源。',
  }),
}

export const lessonMediaStats = {
  lessons: Object.keys(lessonMedia).length,
  llm: Object.keys(lessonMedia).filter(id => !id.startsWith('wm.')).length,
  world: Object.keys(lessonMedia).filter(id => id.startsWith('wm.')).length,
  domestic: Object.values(lessonMedia).filter(media => media.platform === 'Bilibili' || media.cn?.platform === 'Bilibili').length,
}

export const lessonHasMedia = id => Boolean(lessonMedia[id])
export const getLessonMedia = id => lessonMedia[id] || null

function youtubeSourceFromUrl(url, media) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    if (!id) return null
    return {
      platform: 'YouTube', id, title: media.globalTitle || media.title, author: media.globalAuthor || media.author,
      duration: media.duration, sourceType: 'primary', sourceLabel: 'Original course', sourceNote: 'Official international source.',
      originalUrl: url,
    }
  } catch {
    return null
  }
}

export function resolveMediaSource(media, network) {
  if (network === 'cn') {
    if (media.cn) return { ...media, ...media.cn }
    if (media.platform === 'Bilibili') return media
    return media.url && media.sourceType === 'primary' ? media : null
  }
  if (media.platform === 'YouTube') return media
  if (media.global) {
    const { parts: _domesticParts, page: _domesticPage, segmentTiming: _domesticTiming, titleEn: _domesticTitleEn, ...shared } = media
    return { ...shared, ...media.global }
  }
  const youtube = youtubeSourceFromUrl(media.originalUrl, media)
  if (youtube) return youtube
  return media.originalUrl ? {
    platform: 'Original', title: media.globalTitle || media.title, author: media.globalAuthor || media.author,
    duration: media.duration, url: media.originalUrl, sourceType: 'primary', sourceLabel: 'Official source',
    sourceNote: 'Continue with the official course, paper, or repository.',
  } : null
}

const conceptRules = [
  [/shape|广播|切片|stride|维度/i, name => `${name}首先是内存与索引契约：它决定哪些元素参与同一次运算，以及结果如何排列。调试时打印维度只是起点，还要检查广播是否悄悄复制了你不想要的关系。`],
  [/矩阵乘法|线性组合|线性层|projection|基变换/i, name => `${name}把一组输入方向重新混合为输出方向。对神经网络而言，每个输出维都是输入维的加权和；批次维不参与混合，因此必须能逐维说清权重矩阵的含义。`],
  [/SVD|特征值|向量空间/i, name => `${name}用少数主方向描述线性变换。它帮助理解低秩近似、信息压缩与 LoRA：并非每个参数方向都同样重要。`],
  [/概率|条件分布|likelihood|最大似然/i, name => `${name}把不确定性写成可比较的数。语言模型学习的是 p(next token | context)；最大似然要求模型把真实序列分配到更高概率，而不是直接“记住答案”。`],
  [/熵|KL|交叉熵|NLL|负对数/i, name => `${name}把概率预测变成可相加的代价。负对数会重罚模型对真实答案给出极低概率；交叉熵等于数据熵加上分布错配，因此优化时真正能降低的是错配部分。`],
  [/导数|梯度|Jacobian|链式法则|向量-雅可比/i, name => `${name}描述微小扰动如何影响最终目标。反向模式不显式构造巨大 Jacobian，而是从标量损失出发不断计算向量—雅可比积，所以一次反向传播能得到全部参数梯度。`],
  [/上游梯度|梯度累加|拓扑排序|reverse-mode|动态 DAG/i, name => `${name}属于反向传播的依赖管理：节点必须等下游贡献到齐再向父节点传播；共享参数来自多条路径，贡献要相加而不是覆盖。`],
  [/有限差分|中心差分|梯度检查/i, name => `${name}用函数值变化近似解析梯度。中心差分的截断误差通常更小，但步长太大会不局部、太小会遭遇浮点消减，因此应比较相对误差并抽样检查。`],
  [/激活|ReLU|tanh|饱和|死 ReLU/i, name => `${name}决定信号与梯度能否穿过网络。观察均值、方差和饱和比例比只看 loss 更早发现问题；激活分布一旦挤在平坦区，前层几乎收不到学习信号。`],
  [/初始化|尺度|BatchNorm|LayerNorm|归一化/i, name => `${name}控制深层网络中的数值尺度。目标不是让所有值都一样，而是让每层前向激活与反向梯度处在可学习范围，同时区分训练期统计与推理期行为。`],
  [/SGD|AdamW|学习率|warmup|cosine|weight decay/i, name => `${name}规定参数怎样沿噪声梯度移动。学习率决定步长，动量平滑方向，权重衰减约束参数规模；它们的效果必须结合 batch size 与训练阶段解释。`],
  [/bigram|计数|平滑/i, name => `${name}是最小可审计语言模型：只用当前 token 估计下一个 token。它提供概率归一化、采样和 NLL 的基线，也清楚暴露短上下文无法表达长期依赖。`],
  [/Embedding|embedding|稠密表示|查表/i, name => `${name}本质上是可训练查表：离散 id 选择参数矩阵的一行。相似性不是预先赋予的语义，而是训练目标让经常承担相似预测角色的行逐渐靠近。`],
  [/BPE|pair merge|vocabulary|\bencode\b|\bdecode\b|UTF-8|\btoken(?:izer|ization)?\b/i, name => `${name}位于字符串与模型之间。BPE 反复合并高频相邻单元来换取更短序列，但词表、字节边界和特殊 token 会直接影响多语言、公平性与数字处理。`],
  [/query|key|value|相似度|Scaled Dot-Product|注意力/i, name => `${name}把“我要找什么”与“每个位置提供什么”分开：Q 与 K 产生路由权重，softmax 归一化后对 V 加权求和；缩放避免维度增大时 logits 过尖。`],
  [/mask|causal/i, name => `${name}是因果约束而非普通正则化。训练时整段序列并行计算，但第 t 个位置只能读取不晚于 t 的 token，否则模型会偷看答案并得到虚假低 loss。`],
  [/Multi-Head|head 分割|多头/i, name => `${name}让多个较小子空间并行学习不同路由模式。head 数增加不会自动增加总维度；需要追踪拆分、拼接和输出投影，避免把“更多头”误解为免费容量。`],
  [/残差|residual|shortcut|pre-norm|post norm/i, name => `${name}为深层网络保留一条近似恒等的信息与梯度通道。Pre-Norm 把归一化放在子层前，通常更易优化；残差相加要求主分支与更新分支 shape 完全一致。`],
  [/temperature|top-k|top-p|采样/i, name => `${name}只改变解码分布，不会提升模型知识。温度重标 logits，top-k 固定候选数，top-p 按累计概率自适应截断；评估时必须固定随机种子并同时看质量与多样性。`],
  [/参数量|FLOPs|显存|optimizer states|MFU/i, name => `${name}是训练前的资源守恒账。参数、梯度、优化器状态和激活分别占用显存；FLOPs 描述理论工作量，MFU 则比较实际吞吐与硬件峰值。`],
  [/去重|MinHash|contamination|过滤|数据混合|mixture/i, name => `${name}决定模型反复看到什么。近重复会放大样本权重，评测污染会伪造能力；数据混合比例本质上也是一种训练目标，需要版本化和可追溯。`],
  [/FP16|BF16|FP32|混合精度|loss scaling|overflow/i, name => `${name}在速度、范围与精度之间取舍。BF16 保留接近 FP32 的指数范围，FP16 更易溢出；主权重、归约和敏感算子常需更高精度。`],
  [/HBM|SRAM|内存层级|roofline|arithmetic intensity/i, name => `${name}解释算子为何没有跑到标称 FLOPs。算术强度低时，数据搬运而不是乘加成为瓶颈；优化目标是复用片上数据、减少 HBM 往返。`],
  [/FlashAttention|tiling|online softmax|kernel fusion|Triton/i, name => `${name}通过分块和在线 softmax 避免把完整注意力矩阵写回 HBM。它保持数学结果等价，速度来自更少 IO，而不是近似注意力。`],
  [/all-reduce|FSDP|DP|TP|PP|并行|shard|bubble/i, name => `${name}把计算、参数或序列分给多设备，同时引入通信成本。选择策略时要比较消息大小、链路带宽、同步频率和流水线空泡，而不是只看 GPU 数量。`],
  [/Scaling|Chinchilla|compute-optimal|外推/i, name => `${name}用经验幂律连接损失、参数、数据与计算量。它适合做预算和比较，不是自然定律；数据质量、架构和外推区间改变时，拟合系数也会变。`],
  [/SFT|instruction data|chat template|packing/i, name => `${name}用高质量示范把基础模型的续写分布塑造成助手行为。训练时通常只对目标回复计算 loss；模板、mask 和 packing 错误会让模型学到错误角色或跨样本泄漏。`],
  [/Bradley-Terry|reward model|pairwise|偏好/i, name => `${name}从成对比较中学习相对偏好，而非绝对真值。数据采样、标注者分歧和长度偏差会进入奖励模型，并可能被策略利用。`],
  [/DPO|reference policy|reference|KL/i, name => `${name}比较策略对 chosen/rejected 的相对 log-prob，并用参考策略约束偏移。它省去在线 rollout，但仍依赖偏好数据覆盖和 beta 强度。`],
  [/PPO|GRPO|policy gradient|advantage/i, name => `${name}用采样轨迹估计行为对奖励的贡献。优势函数降低方差，KL 控制策略漂移；训练稳定性取决于奖励、采样和更新比例的共同设计。`],
  [/LLM judge|eval|评测|perplexity|污染|方差/i, name => `${name}必须先固定任务分布、评分规则和置信区间。单一平均分会掩盖子群失败；LLM-as-judge 还需做顺序、长度、自偏好与人工一致性校准。`],
  [/幻觉|校准|confidence|abstention|事实性/i, name => `${name}要求模型的置信程度与真实正确率匹配。生成概率不是事实概率；应分别评估回答正确性、拒答选择和证据可验证性。`],
  [/KV Cache|cache shape|GQA|MQA|长上下文/i, name => `${name}保存历史 token 的 K/V，避免 decode 时重复计算前缀。代价随层数、序列长度、KV head 数和 head dim 增长，因此长上下文常先受显存带宽限制。`],
  [/Prefill|Decode|compute-bound|memory-bound/i, name => `${name}对应两类不同负载：prefill 可并行处理整段输入，通常算力密集；decode 每步只产生一个 token，却反复读取权重与缓存，通常带宽受限。`],
  [/INT8|INT4|GPTQ|AWQ|GGUF|量化/i, name => `${name}用更少比特近似权重或激活。速度收益取决于硬件 kernel，质量损失取决于离群值、分组与校准；文件变小不等于端到端一定更快。`],
  [/PagedAttention|continuous batching|block table|调度/i, name => `${name}把 KV cache 切成可复用块，并在请求进出时动态组成批次。这样减少内存碎片与等待，但调度策略会直接影响首 token 延迟和吞吐公平性。`],
  [/SLO|queue|backpressure|限流|降级|tracing/i, name => `${name}把模型服务从“能响应”提升到“可承诺”。队列长度是过载的早期信号；背压、限流和降级要在资源耗尽前触发，并通过 tracing 定位尾延迟。`],
  [/\bobserve\b|\breason\b|\bact\b|\btermination\b|\bagent\b|tool loop/i, name => `${name}把生成模型嵌入状态机：观察环境、选择动作、执行工具、记录结果并判断终止。可靠性来自显式状态和边界，不来自更长的思维文本。`],
  [/schema|validation|idempotency|side effect|工具调用/i, name => `${name}控制模型输出与真实世界副作用之间的接口。结构校验防止格式漂移，幂等键避免重试造成重复操作，高风险动作必须在执行前审批。`],
  [/记忆|working context|retrieval|summary|memory policy/i, name => `${name}解决有限上下文下“保留什么”的问题。短期工作状态、可检索事实和长期摘要应分层；写入记忆也需要质量门，否则错误会被长期放大。`],
  [/POMDP|belief state|隐藏状态|观测模型|状态、观察|transition|转移/i, name => `${name}把真实世界与智能体能看到的信息分开。世界状态通过动作发生变化，观察只是状态的不完整投影；belief state 用概率汇总历史证据，供预测与规划使用。`],
  [/GridWorld|action-conditioned|模型预测控制|rollout/i, name => `${name}用模型在执行前模拟动作后果。单步误差会在多步滚动中累积，因此规划必须用完整轨迹的回报和失败率验证，而不能只看下一状态准确率。`],
  [/VAE|MDN-RNN|latent dynamics|RSSM|imagined trajectory|dream rollout/i, name => `${name}把高维观察压成隐状态，并在隐空间预测未来。压缩必须保留对奖励和行动有用的信息；动力学模型的系统偏差可能被策略利用。`],
  [/MuZero|MCTS|representation、dynamics、prediction/i, name => `${name}不要求隐状态重建真实画面，而用 value、policy 与 reward 监督学习对搜索有用的动力学。这样的状态是任务相关表征，不应直接解释为真实物理状态。`],
  [/JEPA|joint embedding|context encoder|target encoder|collapse/i, name => `${name}在表征空间预测被遮挡或未来内容，主动忽略难以预测的像素细节。target 分支提供学习目标，predictor 建模条件关系，而防坍塌机制保证表征不退化为常数。`],
  [/latent action|video tokenizer|real-time interaction|动作可控性/i, name => `${name}尝试从视频变化中抽取可控因素，再让动力学根据动作生成后续观察。验证时要固定动作脚本，测响应延迟、方向一致性和长期漂移。`],
  [/persistent 3D|World API|navigation|空间智能|物体恒常性/i, name => `${name}要求世界在视角离开后仍保存几何和对象状态。可导航、可回访、可编辑比单段视频的局部逼真更强，也需要独立的闭环轨迹测试。`],
  [/world foundation model|physical AI|synthetic data|sim-to-real/i, name => `${name}把生成模型作为现实训练的上游数据与仿真系统。价值最终由下游策略在真实留出环境的表现决定，视觉逼真不能替代覆盖度、物理约束和安全验证。`],
  [/Mixture-of-Experts|routing|load balance|MLA|multi-token prediction/i, name => `${name}通过稀疏激活、缓存压缩或额外预测目标改变训练与推理成本。比较时必须分别报告总参数、激活参数、通信、KV 占用和真实吞吐。`],
  [/RLVR|outcome reward|reasoning trace|test-time compute/i, name => `${name}在答案可自动验证的任务上强化成功行为，并允许推理时投入更多计算。奖励能验证最终结果，不代表每一步推理都真实可靠；长度和格式也可能被策略利用。`],
  [/sparse attention|context rot|needle|长上下文/i, name => `${name}涉及模型能否在长序列里定位、组合和使用信息。最大窗口只是容量上限；评测还要分开检索、多跳推理、位置敏感性与干扰鲁棒性。`],
  [/parallel drafter|semi-autoregressive|prefix survival|hardware-aware/i, name => `${name}把草稿质量与服务调度连起来：并行骨干降低草稿时延，轻量顺序头补回块内依赖，前缀存活概率帮助调度器避免在高并发下浪费验证批容量。`],
  [/masked diffusion|block diffusion|parallel decoding/i, name => `${name}尝试并行修复或生成多个 token，减少纯自回归的串行步数。端到端收益取决于迭代次数、草稿接受率、目标模型验证成本和质量约束。`],
]

const scopedConceptRules = {
  'world-foundations': [
    [/POMDP|隐藏状态|belief state|观测模型|奖励与策略/i, name => `${name}属于部分可观察决策过程：环境隐藏状态经观测模型产生当前观察，智能体用历史动作与观察更新 belief state，再据此比较策略的预期累计回报。验证时要把真实状态、可见观察和 belief 估计分开记录。`],
    [/GridWorld|action-conditioned dynamics|rollout|模型预测控制/i, name => `${name}把候选动作送入学习到的转移模型，得到后续状态或观察的预测轨迹；模型预测控制比较整条轨迹的目标值与约束，只执行当前一步再根据新观察重规划。必须同时报告单步误差和多步滚动失败率。`],
    [/状态|观察|动作|转移|预测与规划/i, name => `${name}是世界模型闭环中的明确变量：真实状态产生观察，动作改变后续状态，模型学习这种条件转移并为规划提供反事实预测。检查时要标明它来自真实环境、传感器、策略还是模型内部，避免把预测状态当成世界真值。`],
  ],
  'world-dynamics': [
    [/VAE|MDN-RNN|latent dynamics|controller|dream rollout/i, name => `${name}位于经典 World Models 的“压缩—预测—控制”链路：VAE 把画面压成隐变量，MDN-RNN 预测动作条件下的下一隐状态分布，控制器在想象轨迹中选动作。最终仍要用真实环境回报检查策略是否利用了模型偏差。`],
    [/RSSM|reconstruction|reward prediction|imagined trajectory|actor-critic/i, name => `${name}连接 Dreamer 的确定性记忆与随机隐状态：表示模型吸收新观察，动力学在没有新画面时展开想象，奖励与价值头为 actor-critic 提供训练信号。要比较 imagined return 与真实 return 随预测跨度增长的偏差。`],
    [/MuZero|MCTS|representation|dynamics|prediction|value.*policy/i, name => `${name}属于 MuZero 的任务相关隐空间：representation 编码历史，dynamics 在动作条件下预测下一隐状态与奖励，prediction 输出 policy 和 value，MCTS 用这些量搜索。它不要求重建像素，因此隐状态不能直接当作真实物理状态解释。`],
  ],
  jepa: [
    [/JEPA|joint embedding|context encoder|target encoder|predictor|collapse prevention/i, name => `${name}服务于表征空间预测：context encoder 只读取可见区域，target encoder 产生停止梯度的目标表征，predictor 根据上下文和位置预测被遮挡或未来内容。防坍塌设计必须阻止所有输入映射为同一常数表示。`],
    [/self-supervised video|action conditioning|latent planning|zero-shot control/i, name => `${name}连接 V-JEPA 2 的两个阶段：先从无动作标签视频学习视觉与运动表征，再用较少机器人数据训练动作条件世界模型，在隐空间比较候选动作的预测结果。规划价值必须由新环境中的真实控制成功率验证。`],
  ],
  'generative-worlds': [
    [/video tokenizer/i, name => `${name}把连续视频压缩成离散的时空 token 网格，保留跨帧运动和场景结构，供动力学模型预测后续内容；它编码的是视觉时空模式，不是文本 tokenizer 的子词切分。应检查重建质量、压缩率和动作相关细节是否被保留。`],
    [/latent action/i, name => `${name}从无动作标签视频的相邻变化中学习离散控制变量，使动力学能够区分“世界自行变化”和“可由用户触发的变化”。它不是工具调用循环；可辨识性要通过同一初始画面下不同动作的响应方向与稳定性验证。`],
    [/autoregressive dynamics/i, name => `${name}根据过去的时空 token 与动作逐步预测下一帧或下一段隐表示。自回归展开让误差随时间累积，因此既要测短期像素或表征质量，也要测固定动作脚本下的长时漂移、失控和状态遗忘。`],
    [/real-time interaction/i, name => `${name}要求系统在逐帧接收用户动作后，于交互延迟预算内生成对应的后续观察，并保持控制方向和世界状态连续。实时帧率只证明速度，仍需分别验证动作响应、回访一致性和长时间稳定性。`],
    [/一致性|consistency/i, name => `${name}要求已出现的物体、几何与事件在离开视野后仍能被正确恢复，并在持续交互中避免无因漂移。应使用闭环轨迹、回访位置和更长动作序列测量，而不能凭一段顺利演示判断。`],
    [/persistent 3D|World API|navigation|空间智能|物体恒常性/i, name => `${name}要求世界在视角离开后仍保存几何和对象状态。可导航、可回访、可编辑比单段视频的局部逼真更强，也需要独立的闭环轨迹测试。`],
    [/multimodal world creation|editing/i, name => `${name}把文字、图像、多视图或视频条件映射为可探索世界，并允许后续扩展或编辑。输入一致不保证生成几何正确；需要比较不同条件下的空间闭合、编辑局部性和未观察区域的不确定性。`],
  ],
  'physical-ai': [
    [/world foundation model|physical AI|synthetic data|post-training|policy model/i, name => `${name}把预训练世界表示、生成数据、领域后训练和下游策略串成 Physical AI 管线。合成数据的收益不能由画面逼真度代替，必须在真实留出环境中报告策略成功率、安全违规和 sim-to-real 偏差。`],
    [/controllability|long-horizon consistency|physics|planning utility|sim-to-real|安全/i, name => `${name}是世界模型从“看起来真实”走向“可用于决策”的独立验收维度。评测应固定动作与初始条件，分别测响应、长时漂移、物理约束、规划收益和现实迁移，避免用一个综合观感分掩盖失败。`],
  ],
}

const scopedEnglishConceptRules = {
  'world-foundations': [
    [/POMDP|latent state|belief state|observation model|reward|policy/i, name => `${name} belongs to a partially observable decision process: hidden state produces observations, action changes future state, and the agent updates a belief from its action-observation history before comparing expected returns. Keep ground-truth state, visible observation, and estimated belief separate in the experiment.`],
    [/GridWorld|action-conditioned dynamics|rollout|model-predictive control/i, name => `${name} sends candidate actions through a learned transition model to predict later states or observations. Model-predictive control scores complete trajectories, executes only the current action, and replans after the next observation; report both one-step error and multi-step failure rate.`],
    [/state|observation|action|transition|prediction|planning/i, name => `${name} is an explicit variable in the world-model loop: state produces observations, actions alter subsequent state, and the model supplies conditional counterfactuals for planning. Label whether each value comes from the environment, a sensor, the policy, or the model rather than treating a prediction as ground truth.`],
  ],
  'world-dynamics': [
    [/VAE|MDN-RNN|latent dynamics|controller|dream rollout/i, name => `${name} sits in the classic compress-predict-control chain: a VAE encodes frames, an MDN-RNN predicts the action-conditioned next latent distribution, and a controller acts inside imagined trajectories. Real-environment return must still reveal whether the policy exploited model error.`],
    [/RSSM|reconstruction|reward prediction|imagined trajector|actor-critic/i, name => `${name} connects Dreamer’s deterministic memory and stochastic latent state. Representation learning incorporates observations, dynamics unfolds without new frames, and reward-value heads train the actor-critic; compare imagined and real returns as prediction horizon grows.`],
    [/MuZero|MCTS|representation|dynamics|prediction|\bvalue\b|\bpolicy\b/i, name => `${name} belongs to MuZero’s task-relevant latent system: representation encodes history, dynamics predicts the next latent state and reward under an action, prediction emits policy and value, and MCTS searches with those quantities. The state need not reconstruct pixels and should not be read as literal physics.`],
  ],
  jepa: [
    [/JEPA|joint embedding|context encoder|target encoder|predictor|collapse prevention/i, name => `${name} supports prediction in representation space: the context encoder reads visible regions, the target encoder supplies stop-gradient targets, and the predictor estimates masked or future content from context and position. Anti-collapse design must prevent every input from mapping to the same representation.`],
    [/self-supervised video|action conditioning|latent planning|zero-shot control/i, name => `${name} connects V-JEPA 2’s two stages: learn visual-motion representations from action-free video, then fit an action-conditioned world model with a smaller robot dataset and compare candidate outcomes in latent space. Planning value must be verified by physical task success in unseen settings.`],
  ],
  'generative-worlds': [
    [/video tokenization/i, name => `${name} compresses continuous video into a discrete spatiotemporal token grid that preserves motion and scene structure for future prediction. This is visual-temporal representation rather than text subword segmentation; evaluate reconstruction, compression, and whether action-relevant detail survives.`],
    [/latent actions?/i, name => `${name} learns discrete control variables from changes between frames in video without action labels, helping dynamics separate autonomous change from user-controllable change. This variable describes environment control rather than language-model orchestration; test identifiability with different actions from the same starting frame.`],
    [/autoregressive dynamics/i, name => `${name} predicts the next frame or latent segment step by step from prior spatiotemporal tokens and actions. Errors compound during autoregressive rollout, so evaluate short-horizon quality alongside long-horizon drift, control failure, and state loss.`],
    [/interaction/i, name => `${name} requires frame-by-frame actions to produce corresponding observations within an interaction-latency budget while preserving control direction and world state. Frame rate proves speed only; action response, revisit consistency, and sustained stability remain separate tests.`],
    [/consistency/i, name => `${name} requires objects, geometry, and events to remain recoverable after leaving view and to avoid unexplained drift during continued interaction. Measure it with closed trajectories, revisited locations, and longer action sequences rather than a favorable demo clip.`],
    [/persistent 3D|World API|navigation|spatial intelligence|object permanence/i, name => `${name} requires geometry and object state to survive viewpoint changes. Navigability, revisiting, and editing are stronger than local video realism and need independent closed-loop trajectory tests.`],
    [/multimodal world creation|editing/i, name => `${name} maps text, images, multiview input, or video into an explorable world and may extend or modify it. Consistent conditioning does not guarantee correct geometry; test spatial closure, edit locality, and uncertainty in unobserved regions.`],
  ],
  'physical-ai': [
    [/world foundation model|physical AI|synthetic data|post-training|policy model/i, name => `${name} connects pretrained world representations, generated data, domain adaptation, and downstream policy learning. Visual realism is not evidence of utility; report policy success, safety violations, and sim-to-real gap in held-out physical settings.`],
    [/controllability|long-horizon consistency|physics|planning utility|sim-to-real|safety/i, name => `${name} is an independent acceptance dimension between an impressive video and a decision-useful world model. Fix actions and initial conditions, then measure response, drift, physical constraints, planning gain, and real-world transfer separately.`],
  ],
}

const moduleFallback = {
  foundations: name => `${name}要落在一个可手算的小例子上：写清输入、运算、输出与单位，再用代码对拍。`,
  autograd: name => `${name}要放回前向数值—局部导数—参数更新这条链中，观察它怎样改变最终 loss。`,
  language: name => `${name}最终都要回答它怎样改变下一个 token 的条件分布，以及这种改变如何被 NLL 观测。`,
  transformer: name => `${name}需要同时解释信息流、张量 shape 与因果约束，并在一个四 token 小矩阵上手算。`,
  training: name => `${name}必须用资源、吞吐、数值或数据指标验证；没有基线和故障记录的“优化”无法复现。`,
  alignment: name => `${name}要放进目标—数据—优化—评测闭环，特别检查代理指标是否会被模型钻空子。`,
  inference: name => `${name}需要在固定质量与负载下比较延迟、吞吐、显存和成本，单独的速度数字没有决策意义。`,
  agents: name => `${name}必须映射为可观察状态、权限边界和可回放轨迹，才能被测试与审计。`,
  'frontier-llm': name => `${name}必须同时标出论文目标、计算路径、质量约束和系统负载，避免把单点 benchmark 当成普遍结论。`,
  'world-foundations': name => `${name}要明确它属于真实环境、观察、模型状态还是动作，并用状态转移或 belief update 验证。`,
  'world-dynamics': name => `${name}要在单步预测之外检查长时 rollout、规划回报和模型偏差。`,
  jepa: name => `${name}要说明预测发生在像素还是表征空间、目标如何产生，以及怎样防止表征坍塌。`,
  'generative-worlds': name => `${name}必须用固定动作与回访轨迹验证控制和持久性，不能只凭视觉演示判断。`,
  'physical-ai': name => `${name}最终要由真实留出环境中的策略表现、安全约束和 sim-to-real gap 验收。`,
}

function explainConcept(name, moduleId, index) {
  const rule = scopedConceptRules[moduleId]?.find(([pattern]) => pattern.test(name))
    || conceptRules.find(([pattern]) => pattern.test(name))
  return rule ? rule[1](name) : `${moduleFallback[moduleId]?.(name) || mechanismNotes[index % mechanismNotes.length]} ${mechanismNotes[index % mechanismNotes.length]}`
}

function explainEnglishConcept(name, moduleId, index) {
  const rule = scopedEnglishConceptRules[moduleId]?.find(([pattern]) => pattern.test(name))
  return rule
    ? rule[1](name)
    : `${name} is part of the lesson’s causal model. State its inputs, outputs, invariants, and failure mode; then verify it with a hand-check or a minimal experiment${index === 0 ? ' before moving to an optimized implementation' : ''}.`
}

function splitTheory(text) {
  return text.split(/[、，,；;]/).map(x => x.trim()).filter(Boolean)
}

const prerequisiteCode = {
  'p.1': `from collections import Counter

def tokenize(text):
    return [token.lower() for token in text.split() if token.strip()]

def bigram_counts(tokens):
    return Counter(zip(tokens, tokens[1:]))

def test_bigram_counts():
    assert bigram_counts(["a", "b", "a"]) == {
        ("a", "b"): 1,
        ("b", "a"): 1,
    }`,
  'p.2': `# src/text_stats.py
from pathlib import Path

def load_text(path):
    path = Path(path)
    if path.suffix != ".txt":
        raise ValueError("expected a .txt file")
    return path.read_text(encoding="utf-8")

# tests/test_text_stats.py
import pytest

def test_load_text_rejects_wrong_suffix(tmp_path):
    path = tmp_path / "data.csv"
    path.write_text("a,b", encoding="utf-8")
    with pytest.raises(ValueError):
        load_text(path)`,
  'p.3': `import numpy as np
import torch

ids = np.array([0, 1, 0, 2])
counts_np = np.zeros((3, 3), dtype=np.int64)
np.add.at(counts_np, (ids[:-1], ids[1:]), 1)

ids_t = torch.tensor(ids)
counts_t = torch.zeros((3, 3), dtype=torch.int64)
counts_t.index_put_((ids_t[:-1], ids_t[1:]),
                    torch.ones(3, dtype=torch.int64),
                    accumulate=True)
assert np.array_equal(counts_np, counts_t.numpy())`,
  'p.4': `import torch

torch.manual_seed(7)
x = torch.tensor([[1.0, 0.0], [0.0, 1.0]])
y = torch.tensor([0, 1])
w = torch.zeros((2, 2), requires_grad=True)

logits = x @ w
loss = torch.nn.functional.cross_entropy(logits, y)
loss.backward()
with torch.no_grad():
    w -= 0.1 * w.grad
    w.grad.zero_()

assert torch.isfinite(loss)
assert w.shape == (2, 2)`,
}

const stackMapCode = `flowchart LR
  DATA[Internet text] --> TOKENS[Tokenizer]
  TOKENS --> TRAIN[Next-token training]
  TRAIN --> BASE[Base model]
  BASE --> POST[Post-training]
  POST --> ASSISTANT[Assistant]
  USER[User message] --> CONTEXT[Runtime context]
  CONTEXT --> ASSISTANT
  ASSISTANT --> DECODE[Sample one token]
  DECODE --> CONTEXT
  TOOLS[Tool results] --> CONTEXT`

const baseAssistantCode = `prompts = [
    "What is the capital of France?",
    "Return exactly three JSON keys.",
    "Continue this webpage: <title>Model release",
]

for prompt in prompts:
    base_input = tokenizer(prompt, add_special_tokens=False)
    chat_input = tokenizer.apply_chat_template(
        [{"role": "user", "content": prompt}],
        add_generation_prompt=True,
        tokenize=True,
    )
    compare(prompt, base_input, chat_input,
            base_model.generate(base_input),
            instruct_model.generate(chat_input))`

const microgradLessonCode = `import math

class Value:
    def __init__(self, data, parents=(), op=""):
        self.data = float(data)
        self.grad = 0.0
        self.parents = set(parents)
        self.op = op
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t * t) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo, seen = [], set()
        def build(node):
            if node not in seen:
                seen.add(node)
                for parent in node.parents:
                    build(parent)
                topo.append(node)
        build(self)
        self.grad = 1.0
        for node in reversed(topo):
            node._backward()

x = Value(2.0)
y = x * x + x              # x is shared by two paths
y.backward()
assert y.data == 6.0
assert x.grad == 5.0        # 2*x + 1; overwrite would fail`

const specialLessonCopy = {
  zh: {
    'p.1': {
      objectives:['能从上到下追踪一段 Python 的值、类型与控制流。','能把重复逻辑抽成有明确输入和返回值的函数。','能从 traceback 最后一行定位错误类型，再沿调用栈找到自己的代码。','能为纯函数写至少三个包含边界输入的断言。'],
      opening:['零基础最容易掉进两个坑：只背语法，或只复制能运行的代码。本节把语法压缩到一个可测试的文本统计器里，每学一个结构都立即产生可检查的输出。','CS50P 提供完整零基础主线；本站不复制十周课程，而是选择进入 LLM 实验真正需要的函数、容器、控制流、异常与测试能力。'],
      concepts:[
        {name:'值、变量与类型',note:'变量名绑定到对象，而不是装值的固定盒子。先用 type、repr 和小输入观察值，再判断字符串、整数、列表与字典支持哪些操作。'},
        {name:'分支与循环',note:'控制流决定哪条语句执行以及执行多少次。每个循环都写清初始化、更新和停止条件，并用空输入、单元素和重复元素检查边界。'},
        {name:'函数契约',note:'函数应有明确输入、返回值和失败方式。把打印与返回分开，纯计算函数才能被测试、复用，并在后续迁移到 NumPy 或 PyTorch。'},
        {name:'容器选择',note:'list 保留顺序，dict 按键查找，set 去重，tuple 适合不可变记录。选择容器要能解释访问模式与复杂度，而不是凭语法熟悉度。'},
        {name:'traceback',note:'先读最后一行的异常类型和消息，再向上找到第一处属于自己文件的调用位置。报错是程序状态的证据，不应在未理解原因时用 try/except 全部吞掉。'},
      ],
      workflow:['手算一个三词输入','写最小函数契约','实现并打印中间值','用边界断言固定行为'],
      practice:{task:'实现并测试一个纯 Python 文本统计器',steps:['从三词文本手写期望 token、词频和 bigram 结果。','实现 tokenize 与 bigram_counts，每个函数只做一件事并返回值。','加入空字符串、单词、重复词和中英混合文本测试。','故意制造 TypeError 与 KeyError，记录 traceback 中真正指向修复位置的两行。'],evidence:['可直接运行的 text_stats.py','至少 6 个通过的断言或 pytest 用例','两条错误现场与修复解释','一段说明 list/dict/tuple 选择依据的 README']},
      worked:{title:'从 “a b a” 推到两个 bigram',steps:['tokenize 返回 ["a","b","a"]，顺序必须保留。','zip(tokens, tokens[1:]) 形成 (a,b) 与 (b,a)，不会凭空产生跨边界 pair。','Counter 聚合重复 pair；测试同时验证键和值，避免只看打印结果。'],question:'如果输入只有一个 token，结果应为空、报错还是保留占位？先写契约，再写测试。'},
      code:prerequisiteCode['p.1'],codeLabel:'text_stats.py',
      misconception:'“代码没有报错”只证明这一条路径能跑，不证明函数对空输入、重复元素或错误类型有定义清楚的行为。',
      quiz:{question:'哪项最能证明你已经掌握 Python 基础，而不是只会照抄？',options:['换一组输入后先预测结果，再独立写函数和边界测试并解释 traceback','完整看完一门视频课并记住所有语法名词','复制示例代码后得到同样的三行输出'],explanation:'可迁移的预测、实现、测试与诊断才是掌握证据。'},
      mastery:['闭卷写出 tokenize 与 bigram_counts。','解释 list、dict、set、tuple 的选择差异。','在两分钟内从 traceback 定位一处故意错误。','为一个未见过的纯函数补齐正常、边界和失败测试。'],
      references:['Harvard CS50P · Weeks 0–4','Python Tutorial · Control Flow Tools','Python Tutorial · Data Structures'],
    },
    '1.3': {
      objectives:['能解释 reverse-mode 为什么从标量输出沿逆拓扑顺序传播。','能为 add、mul、tanh 写局部反向规则。','能说明共享节点的梯度为何必须累加而不能覆盖。','能用有限差分和共享节点测试验证实现。'],
      opening:['这一节只做一个最小自动微分内核：前向运算一边计算数值，一边构建动态 DAG；backward 再按逆拓扑顺序把上游梯度乘上局部导数。','先修诊断：若不能手算链式法则，先回到 1.2；若不熟悉类、闭包与集合，先回到 p.1。不要用复制完整 micrograd 掩盖断层。'],
      concepts:[
        {name:'动态 DAG',note:'每次运算创建一个新 Value，并记录父节点和局部反向函数。图由真实执行路径生成，因此分支和重复使用会直接改变依赖关系。'},
        {name:'局部反向规则',note:'add 把上游梯度原样传给两个输入；mul 把上游梯度分别乘以另一个输入的前向值；tanh 乘以 1-t²。每条规则只负责一条局部边。'},
        {name:'拓扑依赖',note:'节点只有在所有下游贡献都到齐后才能继续向父节点传播。先通过 DFS 建立父节点在前的拓扑序，再逆序执行 _backward。'},
        {name:'梯度累加',note:'同一个节点可能经多条路径影响 loss。链式法则要求把各路径贡献相加；使用赋值号会静默丢掉先到的贡献。'},
        {name:'标量种子',note:'对最终标量 y 求 dy/dy=1，因此从输出 grad=1 开始。若输出不是标量，需要显式提供向量—雅可比积的上游向量。'},
        {name:'有限差分边界',note:'中心差分可检查解析梯度，但步长太大不够局部、太小会受浮点消减影响；它是测试工具，不是训练算法。'},
      ],
      workflow:['手算一张含共享节点的图','实现前向节点和局部闭包','建立拓扑序并逆序传播','用有限差分与共享路径测试'],
      practice:{task:'实现可测试的 Value、运算符与 backward',steps:['实现 Value(data, parents, op)，并让 add、mul、tanh 返回新节点。','为每个运算写只处理局部贡献的 _backward，所有父梯度使用 +=。','DFS 建立拓扑序，从输出 grad=1 开始逆序执行。','用 y=x*x+x、中心差分和 PyTorch 标量结果做三重对拍。'],evidence:['可直接运行的 value.py','pytest 覆盖 add、mul、tanh 与有限差分','共享节点 y=x*x+x 在 x=2 时 grad=5 的回归测试','一次把 += 错写成 = 后失败并修复的记录']},
      worked:{title:'为什么 y=x*x+x 会暴露覆盖错误',steps:['x=2 时前向 y=6，x 经 x*x 的左右输入和末尾 +x 共三条边到达输出。','解析导数是 x+x+1=5；每条边只产生自己的贡献。','若 _backward 使用 =，后执行的路径覆盖先前贡献；只有 += 能得到 5。'],question:'若同一节点在两个 batch 中连续 backward，什么时候累加是故意的，什么时候应先清零？'},
      code:microgradLessonCode,codeLabel:'value.py',
      misconception:'“按图倒着遍历”仍不够：没有拓扑依赖会过早传播，没有 += 会在共享节点丢梯度。',
      quiz:{question:'为什么不能在发现一个节点后立刻调用它的 _backward？',options:['它可能还有其他下游路径尚未贡献梯度，必须等依赖到齐','Python 递归不能访问父节点','tanh 的导数只能最后计算'],explanation:'逆拓扑顺序保证节点收到所有下游贡献后才继续传播。'},
      mastery:['闭卷实现 add、mul、tanh 与 backward。','画出 y=x*x+x 的边并逐项算出 grad=5。','故意把 += 改成 =，用测试定位共享节点错误。','解释非标量输出为何需要显式上游向量。'],
      references:['Karpathy · micrograd','Karpathy · Neural Networks: Zero to Hero Lecture 1','PyTorch · Autograd mechanics'],
    },
    'p.2': {
      objectives:['能创建隔离环境并记录 Python 与依赖版本。','能把脚本拆成可导入模块、命令入口与测试。','能为文件编码、路径与输入错误设计明确失败方式。','能用 pytest 的 arrange–act–assert 结构保护重构。'],
      opening:['LLM 学习中的许多“模型问题”其实是环境、路径、编码或数据文件问题。把一次性 notebook 变成可复现小项目，是进入训练实验前必须补上的工程地基。','目标不是学完整软件工程，而是建立四个最低限度：环境可重建、输入可验证、行为可测试、失败可定位。'],
      concepts:[
        {name:'虚拟环境与依赖',note:'项目环境要隔离，并记录解释器与关键包版本。能在新目录重建环境，比“我电脑上能跑”更接近可复现证据。'},
        {name:'模块与入口',note:'计算逻辑放在可导入函数中，命令行入口只负责解析参数和调用。这样同一逻辑既能被测试，也能被 notebook 和后续训练脚本复用。'},
        {name:'Path 与 UTF-8',note:'路径不是普通字符串拼接问题。使用 pathlib，明确输入文件后缀和 UTF-8 编码，并用临时目录测试，避免依赖当前工作目录。'},
        {name:'异常与断言',note:'异常用于外部输入或运行条件不满足，断言用于内部不变量。捕获异常时要缩小范围，并保留足够上下文，而不是 except Exception 后静默继续。'},
        {name:'pytest 回归',note:'每个测试固定输入、执行一个行为、检查明确输出。回归测试的价值是让重构和向量化有安全网，而不是追求测试数量。'},
      ],
      workflow:['冻结当前可运行行为','拆分纯逻辑与副作用','为边界和失败补测试','在空环境复现'],
      practice:{task:'把一次性文本脚本改造成可复现小项目',steps:['建立 src、tests、README 与依赖清单，记录 Python 版本。','把读文件、tokenize、计数和输出拆为独立函数。','用 tmp_path 测试 UTF-8 文件、空文件、错误后缀和不存在路径。','删除环境后按 README 重建并运行 pytest，记录命令与结果。'],evidence:['清晰的目录树和启动命令','至少 8 个 pytest 用例','一个预期失败且消息明确的输入案例','从空环境重建成功的记录']},
      worked:{title:'让文件错误在边界处失败',steps:['load_text 接收 Path，而不是依赖脚本所在目录。','先检查后缀与存在性，再以 UTF-8 读取；失败信息包含目标路径。','测试使用 tmp_path 创建真实临时文件，不污染仓库也不依赖个人目录。'],question:'如果捕获 UnicodeDecodeError 后返回空字符串，后续计数会给出什么误导性结果？'},
      code:prerequisiteCode['p.2'],codeLabel:'src/text_stats.py + tests/',
      misconception:'把所有代码放进 notebook 并成功运行一次，不等于项目可复现；隐藏状态、执行顺序和本机路径都可能成为未记录依赖。',
      quiz:{question:'哪种项目结构最支持后续把 Python 循环替换成 NumPy？',options:['纯计算函数可导入，文件 I/O 在边界，重构前已有行为测试','所有逻辑写在一个从上到下执行的 notebook 单元','用 try/except 包住整个脚本，任何错误都返回空结果'],explanation:'分离纯逻辑、副作用和测试，才能安全比较重构前后的行为。'},
      mastery:['在新目录重建环境并运行测试。','解释异常与断言的不同职责。','用 tmp_path 测试一个 UTF-8 文件流程。','把一段全局脚本重构为可导入函数和入口。'],
      references:['Harvard CS50P · Exceptions, Libraries, Unit Tests, File I/O','Python Tutorial · Modules','pytest Documentation · Getting Started'],
    },
    'p.3': {
      objectives:['能用 ndim、shape、axis、size 与 dtype 描述数组。','能预测 broadcasting 是否成立并写出结果 shape。','能区分切片 view 与显式 copy 对原数组的影响。','能让 NumPy 与 PyTorch 在同一小输入上得到一致结果。'],
      opening:['从 Python list 进入模型代码，真正的门槛不是 API 数量，而是“一个操作同时作用于整块同类型数据”的数组心智。shape、axis 和 dtype 是后续每节模型课的共同语言。','NumPy 官方入门先建立数组规则，PyTorch 再加入 device 与 autograd。不要把两个库当成两套完全无关的语法。'],
      concepts:[
        {name:'ndarray 与同质数据',note:'ndarray 用固定 dtype 和矩形 shape 表示 N 维数据。限制换来紧凑内存和批量运算；Python 嵌套 list 的灵活性不能直接推断为张量行为。'},
        {name:'shape、axis 与 reduce',note:'shape 描述每个轴的长度，axis 指定沿哪一维聚合。任何 sum、mean、softmax 前都先写输入与输出 shape，避免靠运行后猜。'},
        {name:'broadcast',note:'从末尾轴向前比较，维度相等或其中一个为 1 才能广播。广播是逻辑扩展，不应误以为一定复制了完整数据。'},
        {name:'view 与 copy',note:'NumPy 基本切片通常返回共享数据的 view，修改切片可能改变原数组。跨库转换也可能共享内存；需要独立数据时显式 copy 或 clone。'},
        {name:'NumPy → PyTorch',note:'两者共享许多 shape 与广播规则，但 PyTorch tensor 还涉及 device、requires_grad 和计算图。先做数值对拍，再引入梯度。'},
      ],
      workflow:['为小数组标轴','手算索引和广播','向量化替换循环','跨库逐元素对拍'],
      practice:{task:'把循环版 bigram 计数向量化并与 PyTorch 对拍',steps:['用 4 个 token 手算 3×3 计数矩阵，写出每个 pair 的落点。','分别用 Python 循环、np.add.at 与 torch.index_put_ 实现。','断言 shape、dtype、总计数与逐元素结果完全一致。','更换词表大小、重复 pair 和空序列，记录失败边界。'],evidence:['三种实现及相同输入','shape/dtype/axis 台账','逐元素一致性断言','一个 view/copy 共享内存反例']},
      worked:{title:'把 [0,1,0,2] 写进计数矩阵',steps:['源索引是 [0,1,0]，目标索引是 [1,0,2]。','重复索引必须累加，因此普通高级索引赋值可能丢失重复；np.add.at 明确累加语义。','PyTorch index_put_(accumulate=True) 对齐同一契约，再用 array_equal 验证。'],question:'如果 ids 为空或只含一个元素，输出 shape 与总计数应该是什么？'},
      code:prerequisiteCode['p.3'],codeLabel:'vectorize_bigrams.py',
      misconception:'“没有写 for”不自动等于向量化正确或更快；先证明索引、累加、shape 和 dtype 等价，再测性能。',
      quiz:{question:'对 shape=(4,1,8) 与 shape=(3,8) 的两个数组，广播结果是什么？',options:['(4,3,8)，因为从末轴比较时 8 匹配，1 可扩展为 3','不能广播，因为两个数组维数不同','(3,4,8)，总是把较短 shape 放在最前面'],explanation:'广播从末尾轴对齐；缺失的前导轴按 1 处理。'},
      mastery:['看到数组表达式先写出输入与输出 shape。','解释 axis=0 与 axis=-1 的不同聚合对象。','演示 view 修改原数组的反例。','让 NumPy 与 PyTorch 在三组边界输入上对拍。'],
      references:['NumPy · Absolute Basics for Beginners','NumPy · Broadcasting','PyTorch Learn the Basics · Tensors'],
    },
    'p.4': {
      objectives:['能按数据→前向→损失→反向→更新顺序解释训练循环。','能区分参数值、梯度和优化器更新的职责。','能用 shape、有限性与 loss 变化设置最低限度断言。','能在固定随机种子下复现实验并保存失败现场。'],
      opening:['先修掌握门不要求你理解 Transformer，而是检查编程、数组和测试能否连成一次真实参数更新。若不能闭卷解释每一行，就回到对应先修课，而不是带着断层进入 micrograd。','完成标准不是“loss 打印出来了”，而是能预测一次更新方向、验证梯度存在，并在破坏一个条件后定位失败。'],
      concepts:[
        {name:'数据与参数',note:'输入和标签是观测数据，参数是优化器要改变的状态。两者 shape 可能相似，但生命周期和 requires_grad 完全不同。'},
        {name:'前向与 logits',note:'前向计算把输入和参数变成未归一化分数。先断言 batch、类别维和有限性，再交给损失函数。'},
        {name:'loss 标量',note:'交叉熵把一批预测压成可优化标量。标量变小只说明当前数据与目标下的拟合改善，不自动证明泛化。'},
        {name:'backward 与 grad',note:'backward 沿计算图累积每个叶子参数对 loss 的梯度。重复调用前必须理解梯度是否清零，否则累积可能是意图也可能是 bug。'},
        {name:'参数更新',note:'更新要在 no_grad 下执行，随后清零梯度。学习率决定沿负梯度移动的步长；一次更新可用新 loss 与手算方向共同检查。'},
      ],
      workflow:['冻结两样本问题','预测梯度方向','执行一次更新','破坏条件并诊断'],
      practice:{task:'从文本计数走到一个可测试的单步梯度更新',steps:['固定两条 one-hot 输入、标签、初始权重与随机种子，手算初始 logits。','运行 forward、cross_entropy、backward 和一次 SGD 更新，记录每个张量 shape。','断言 loss 有限、grad 非空、参数发生变化，并再次计算 loss。','依次破坏标签范围、dtype、grad 清零和 shape，保存报错或异常曲线。'],evidence:['一条可重复运行的训练脚本','初始/更新后参数与 loss 记录','至少 6 个自动断言','四个故障注入及诊断表']},
      worked:{title:'验证一次 SGD 不是黑箱',steps:['零权重让两个类别初始 logits 相同，交叉熵有可预测基线。','backward 产生与分类错误方向对应的 w.grad；参数更新应沿 -grad。','更新后重新前向，若 loss 未按预期变化，先检查标签、学习率、清零和 no_grad 边界。'],question:'若第二次 backward 前不清零梯度，参数更新代表两个 batch 的累积还是意外重复？你需要什么记录才能判断？'},
      code:prerequisiteCode['p.4'],codeLabel:'first_update.py',
      misconception:'训练循环能运行不等于训练正确；错误标签、错误维度、梯度累积和数据泄漏都可能得到看似正常的 loss。',
      quiz:{question:'一次参数更新后，哪组证据最有诊断价值？',options:['固定输入与种子下的 shape、loss、grad、参数差值和断言','只截取最后一行 loss 数字','只确认 GPU 利用率不为零'],explanation:'训练正确性需要沿数据、计算图和更新边界逐层可观察。'},
      mastery:['闭卷重写最小训练循环。','逐行说出哪些对象会被修改。','注入一次未清零梯度并解释结果。','在新输入上复现实验并通过全部测试。'],
      references:['PyTorch Learn the Basics · Tensors and Autograd','PyTorch Learn the Basics · Optimization Loop','本站 0.6 · PyTorch 张量与可复现实验'],
    },
    '0.1': {
      objectives:['区分训练时改变的参数与请求时改变的状态。','画出数据→token→训练→base model→后训练→assistant→推理/工具主链。','把 2.x–7.x 课程准确挂到主链。','解释为什么“会续写”不等于“会当助手”。'],
      opening:['这不是一节把所有术语讲完的总论，而是一张后续主线反复回看的导航图。你只看六段，共 30:56；剩余 14 分钟必须用于闭卷画图和检索练习。','训练流改变权重，请求流改变上下文、KV cache 与工具结果。把两条流混在一起，是理解 RAG、Agent、微调和推理参数时最常见的根错误。'],
      concepts:[
        {name:'数据与 token',note:'互联网文本先经过收集、过滤、去重与混合，再由固定 tokenizer 变成离散 id。更换 tokenizer 会改变词表、序列长度、embedding 对齐和所有下游权重接口。'},
        {name:'预训练与参数',note:'next-token objective 通过梯度更新模型参数，把训练分布压进权重。用户发一条新消息不会立即重训参数；它只改变本次请求可见的状态。'},
        {name:'Base model',note:'基础模型学习延续训练文本的条件分布，因此遇到问题句可能继续网页、论坛或问答格式。行为像续写不是“坏掉”，而是目标与数据分布的直接结果。'},
        {name:'后训练与 Assistant',note:'SFT、偏好与 RL 等后训练把示范、反馈和任务奖励写入参数，使模型更常遵循角色、格式和停止规则。具体算法在 5.x 展开。'},
        {name:'推理状态',note:'prompt、生成 token、KV cache、采样参数都属于请求时状态。temperature 会重标解码分布，但不会新增参数知识或修改模型权重。'},
        {name:'工具与外部事实',note:'检索、代码执行或 API 返回结果进入工作上下文，模型据此继续生成。工具结果更接近可验证的环境观察，不应伪装成参数记忆。'},
      ],
      workflow:['闭卷画初始地图','按六段修正节点','分开参数流与状态流','把后续课程挂回主链'],
      practice:{task:'在 45 分钟内重建一张可用的 LLM 全栈地图',steps:['0–3 分钟：不查资料画出 ChatGPT 请求链。','3–34 分钟：观看六个 required 片段，每段只回答卡片中的一个问题。','34–41 分钟：重画数据流、参数更新流和请求状态流，并在箭头旁写动词。','41–45 分钟：闭卷回答四题，标出 2.x、3.x、5.x、6.x、7.x 的落点。'],evidence:['观看前与观看后两版地图','三种不同颜色的流向与箭头动词','四道检索题及因果理由','至少一个幻觉位置和一个可验证工具结果']},
      worked:{title:'把一次用户请求放回训练后的系统',steps:['权重在服务启动前已经由预训练与后训练得到，用户消息不会直接改写它。','tokenizer 把消息变成 id；模型产生 logits，采样一个 token，追加上下文后循环。','若调用搜索，返回文本进入上下文；它改变后续输出，却不自动进入长期参数。'],question:'换 tokenizer、加入检索结果、调整 temperature，分别会改变参数、输入表示、请求状态还是解码分布？'},
      code:stackMapCode,codeLabel:'llm-stack-map.mmd',
      misconception:'把“模型在本次对话里看到新事实”说成“模型学会并更新了参数”，会同时误解 RAG、上下文、记忆与微调。',
      quiz:{question:'用户在对话中加入一条检索结果后，最先改变的是什么？',options:['请求上下文与后续 token 的条件分布','模型的全部预训练参数','tokenizer 的词表与 embedding 大小'],explanation:'工具结果进入工作上下文；除非另行启动训练，它不会更新参数或重建 tokenizer。'},
      mastery:['5 分钟内闭卷连出完整主链。','分别指出参数更新流、请求状态流和外部工具流。','解释 base model 与 assistant 的行为差异。','把 2.x、3.x、5.x、6.x、7.x 放到正确节点。'],
      references:['Andrej Karpathy · Deep Dive into LLMs like ChatGPT','本站 LLM 系统课路线图','2.x–7.x 对应专题索引'],
    },
    '5.1': {
      objectives:['用训练分布解释 base 与 instruct 输出差异。','说明 chat template 如何改变输入 token 序列与角色边界。','把 SFT 的行为塑形与“增加知识”区分开。','用六类 prompt 建立可审计的配对观察表。'],
      opening:['本节只回答一个问题：同一套 Transformer 能力，为什么基础模型更像续写器，而后训练模型更像助手？必看视频止于 1:20:32，偏好优化公式留到后续专题。','不要用“哪个更聪明”给输出打分。记录它更像哪种训练分布、是否遵循角色、何时停止、是否承认不确定，以及模板实际加入了哪些 token。'],
      concepts:[
        {name:'预训练分布',note:'基础模型优化互联网文本中的 next-token likelihood。问题、答案、网页、代码和对话都可能出现，但没有统一的助手角色或服务协议。'},
        {name:'Base model 行为',note:'面对 “法国首都是什么？” 时，模型可能回答，也可能继续一段问答网页或重复问题。输出形式是训练分布与 prompt 前缀共同决定的，不应直接等同于知识能力。'},
        {name:'Chat template',note:'模板把 system、user、assistant 角色和特殊 token 编码进序列。权重正确但模板错配时，模型可能乱码、串角色或不停生成，应先核对 tokenizer 与模板。'},
        {name:'SFT 示范',note:'监督微调用高质量对话示范增加“看到这类用户输入后产生这类助手回复”的概率。它重塑行为先验，但不会保证事实正确、拒答校准或所有格式约束。'},
        {name:'Assistant 行为',note:'后训练后的停止、格式、语气与工具协议是数据和目标塑形的结果。它仍基于 next-token generation，只是条件分布被重新组织。'},
        {name:'配对诊断',note:'同一 prompt、相同解码设置、各自正确模板下比较 base/instruct，才能把行为差异与采样噪声、模板错误和模型能力分开。'},
      ],
      workflow:['固定六类 prompt','保存两种真实编码','控制相同解码参数','按训练分布解释差异'],
      practice:{task:'完成 base / instruct 六类 prompt 配对实验',steps:['选择事实问答、格式约束、多轮、不确定性、指令遵循和网页续写六类 prompt。','分别保存 raw base token 与 apply_chat_template 后的 token 序列。','固定 temperature、top-p、seed 与最大长度，记录输出、停止方式和角色边界。','逐行解释更像哪类训练分布；模板错误案例单独标记，不归因于模型能力。'],evidence:['六类 prompt × 两模型对照表','至少两组真实 token 编码差异','统一解码参数与模型版本','一个模板错配故障及修复']},
      worked:{title:'诊断“基础模型不回答问题”',steps:['先确认基础模型收到的是普通文本前缀，而不是它未训练过的聊天模板。','观察输出是否像网页、问答语料或文档续写；这说明它在执行预训练目标。','再用 instruct 权重与匹配模板比较，若角色和停止改变，差异来自后训练分布而非简单能力开关。'],question:'如果 instruct 模型输出乱码，为什么应先检查 tokenizer 与 chat template，而不是直接判定 SFT 失败？'},
      code:baseAssistantCode,codeLabel:'base_vs_instruct.py',
      misconception:'Base model 不直接回答不等于它缺少相关知识；instruct 模型回答流畅也不证明答案事实正确。',
      quiz:{question:'对同一 instruct 权重，哪项最可能导致串角色或不停生成？',options:['使用了不匹配的 tokenizer 或 chat template','没有实现后续偏好优化专题中的损失','没有把 temperature 固定为 0.7'],explanation:'角色边界依赖训练时约定的特殊 token 与模板；本节只诊断基础模型、对话模板与监督示范。'},
      mastery:['闭卷解释 base → assistant 的数据与目标变化。','展示一组 raw prompt 与 chat template token 差异。','用训练分布解释六类 prompt 中至少四类差异。','定位一个权重、tokenizer、模板或采样设置故障。'],
      references:['Karpathy · 00:42:52–01:20:32','Hugging Face · Chat Templates','本站 5.2 · SFT 与对话模板'],
    },
  },
}

specialLessonCopy.en = {
  'p.1': { ...specialLessonCopy.zh['p.1'],
    objectives:['Trace values, types, and control flow through a Python program.','Extract repeated logic into functions with explicit inputs and returns.','Read the final traceback line, then find the first relevant frame in your code.','Write normal, boundary, and failure tests for a pure function.'],
    opening:['Do not learn Python as a vocabulary list. Build one testable text-statistics tool so every language construct produces an observable result.','CS50P is the complete beginner path. This sprint selects the functions, control flow, containers, exceptions, and testing skills needed before tensor work.'],
    concepts:[
      {name:'Values, names, and types',note:'A name refers to an object; it is not a permanently typed box. Inspect type and repr on tiny inputs before assuming which operations a string, number, list, or dictionary supports.'},
      {name:'Branches and loops',note:'Control flow determines which statement runs and how often. State initialization, update, and termination explicitly, then test empty, singleton, and repeated inputs.'},
      {name:'Function contracts',note:'A function needs explicit inputs, a return value, and a defined failure mode. Separate printing from returning so pure computation can be tested and later ported to NumPy or PyTorch.'},
      {name:'Container choice',note:'Lists preserve order, dictionaries support keyed lookup, sets remove duplicates, and tuples represent fixed records. Choose from the access pattern and complexity, not familiarity.'},
      {name:'Tracebacks',note:'Read the exception type and message at the bottom, then move upward to the first frame in your own file. Do not hide an unexplained error behind a broad try/except.'},
    ],
    workflow:['Hand-check a three-token input','Write the smallest function contract','Implement with visible intermediate values','Lock behavior with boundary tests'],
    practice:{task:'Implement and test a pure-Python text statistics tool',steps:['Write the expected tokens, word counts, and bigrams for a three-word input.','Implement tokenize and bigram_counts as single-purpose functions that return values.','Test empty, singleton, repeated, and bilingual text.','Trigger TypeError and KeyError deliberately and record the traceback lines that identify the fix.'],evidence:['A runnable text_stats.py','At least six assertions or pytest tests','Two preserved error cases with explanations','A README explaining container choices']},
    worked:{title:'Derive two bigrams from “a b a”',steps:['Tokenization returns ["a","b","a"] and preserves order.','zip(tokens, tokens[1:]) produces (a,b) and (b,a) without crossing boundaries.','Counter aggregates repeated pairs; the test checks keys and values, not a printed screenshot.'],question:'For a one-token input, should the contract return an empty counter, raise, or create a placeholder? Decide before coding.'},
    misconception:'Code that does not crash has only exercised one path; it has not defined behavior for empty, repeated, or invalid input.',
    quiz:{question:'Which evidence shows Python mastery rather than copying?',options:['Predict on new input, independently implement the function and boundary tests, and explain a traceback','Watch every lecture and recognize all syntax names','Copy the sample and reproduce three output lines'],explanation:'Transferable prediction, implementation, tests, and diagnosis are the evidence.'},
    mastery:['Rewrite tokenize and bigram_counts without a reference.','Explain when to choose list, dict, set, and tuple.','Locate a deliberate error from its traceback in two minutes.','Add normal, boundary, and failure tests to an unseen pure function.'],
    references:['Harvard CS50P · Weeks 0–4','Python Tutorial · Control Flow Tools','Python Tutorial · Data Structures'],
  },
  '1.3': { ...specialLessonCopy.zh['1.3'],
    objectives:['Explain why reverse mode propagates from a scalar output in reverse topological order.','Implement local backward rules for add, multiply, and tanh.','Explain why gradients at shared nodes must accumulate.','Validate the engine with finite differences and a shared-node regression test.'],
    opening:['Build one minimal autodiff engine: forward operations compute values and construct a dynamic DAG; backward multiplies upstream gradients by local derivatives in reverse topological order.','Prerequisite check: return to 1.2 if you cannot hand-calculate the chain rule, or p.1 if classes, closures, and sets are unfamiliar.'],
    concepts:[
      {name:'Dynamic DAG',note:'Every operation creates a Value and records its parents plus a local backward closure. The graph follows the actual execution path, including branches and repeated use.'},
      {name:'Local backward rules',note:'Add copies the upstream gradient to both inputs; multiply scales by the other forward value; tanh scales by 1-t². Each rule owns one local edge.'},
      {name:'Topological dependency',note:'A node can propagate only after all downstream paths have contributed. Build parent-first topology with DFS, then execute _backward in reverse.'},
      {name:'Gradient accumulation',note:'A node may influence the loss through several paths. The chain rule sums those contributions, so assignment silently discards earlier paths.'},
      {name:'Scalar seed',note:'For final scalar y, dy/dy=1 seeds the pass. A non-scalar output requires an explicit upstream vector for a vector–Jacobian product.'},
      {name:'Finite-difference boundary',note:'Centered differences check analytic gradients, but steps that are too large are nonlocal and steps that are too small suffer cancellation. This is a test, not a training algorithm.'},
    ],
    workflow:['Hand-check a graph with a shared node','Implement forward nodes and local closures','Build topology and propagate in reverse','Test finite differences and shared paths'],
    practice:{task:'Implement a tested Value class, operators, and backward',steps:['Implement Value(data, parents, op), with add, multiply, and tanh returning new nodes.','Write local _backward closures and update every parent with +=.','Build topology with DFS, seed the output with grad=1, and execute in reverse.','Compare y=x*x+x against hand math, centered differences, and a scalar PyTorch result.'],evidence:['A directly runnable value.py','pytest coverage for add, multiply, tanh, and finite differences','A regression test proving grad=5 for y=x*x+x at x=2','A preserved failure created by replacing += with =, plus the repair']},
    worked:{title:'Why y=x*x+x exposes overwrite bugs',steps:['At x=2, y=6 and x reaches the output through the left and right inputs of x*x plus the final +x.','The analytic derivative is x+x+1=5; each edge contributes one term.','An assignment in _backward overwrites an earlier path. Only accumulation produces 5.'],question:'Across two consecutive batches, when is accumulated grad intentional and when must you clear it first?'},
    misconception:'Walking backward is insufficient: without topology you propagate too early, and without += you lose shared-node contributions.',
    quiz:{question:'Why not call a node’s _backward immediately when first discovered?',options:['Another downstream path may not have contributed yet, so dependencies must complete first','Python recursion cannot access parent nodes','The derivative of tanh can only be computed last'],explanation:'Reverse topological order ensures every downstream contribution has reached the node before it propagates.'},
    mastery:['Implement add, multiply, tanh, and backward without a reference.','Draw y=x*x+x and derive grad=5 edge by edge.','Replace += with = and use the test to locate the shared-node bug.','Explain why non-scalar outputs require an upstream vector.'],
    references:['Karpathy · micrograd','Karpathy · Neural Networks: Zero to Hero Lecture 1','PyTorch · Autograd mechanics'],
  },
  'p.2': { ...specialLessonCopy.zh['p.2'],
    objectives:['Create an isolated environment and record interpreter and dependency versions.','Separate importable logic, command entry points, and tests.','Define failures for file encoding, paths, and invalid input.','Protect refactors with arrange–act–assert pytest tests.'],
    opening:['Many apparent model failures are environment, path, encoding, or data-file failures. Turning a one-off script into a reproducible project is a prerequisite for credible training experiments.','The minimum bar is reconstructable environments, validated inputs, tested behavior, and diagnosable failures.'],
    concepts:[
      {name:'Environment and dependencies',note:'Isolate the project and record the interpreter and key package versions. Rebuilding it in a fresh directory is stronger evidence than “it runs on my laptop”.'},
      {name:'Modules and entry points',note:'Put computation in importable functions and keep argument parsing at the boundary. The same logic can then be tested and reused from notebooks or training scripts.'},
      {name:'Path and UTF-8',note:'Use pathlib, explicit UTF-8, and temporary directories. String concatenation and the current working directory are hidden dependencies.'},
      {name:'Exceptions and assertions',note:'Use exceptions for invalid external inputs and assertions for internal invariants. Catch narrowly and retain context; never silently convert every failure into an empty result.'},
      {name:'pytest regression',note:'Fix inputs, execute one behavior, and assert an explicit result. Tests are a safety net for refactoring and vectorization, not a count competition.'},
    ],
    workflow:['Freeze current behavior','Separate pure logic from side effects','Add boundary and failure tests','Reproduce in a clean environment'],
    practice:{task:'Turn a one-off text script into a reproducible project',steps:['Create src, tests, README, and dependency metadata; record Python version.','Split file loading, tokenization, counting, and output.','Use tmp_path to test UTF-8, empty files, wrong suffixes, and missing paths.','Rebuild from the README and run pytest.'],evidence:['A clear directory tree and startup command','At least eight pytest cases','One expected failure with a useful message','A clean-environment reconstruction record']},
    worked:{title:'Fail at the file boundary',steps:['Accept Path rather than relying on script location.','Validate suffix and existence, then read UTF-8 with the target path in any error.','Use tmp_path for real temporary files without polluting the repository.'],question:'What misleading downstream result appears if UnicodeDecodeError is converted into an empty string?'},
    misconception:'A notebook that ran once is not a reproducible project; cell order, hidden state, and local paths are undeclared dependencies.',
    quiz:{question:'Which structure best supports replacing a Python loop with NumPy?',options:['Importable pure logic, I/O at the boundary, and behavior tests before the refactor','All logic in one top-to-bottom notebook cell','A broad try/except that returns an empty result'],explanation:'Separated logic, side effects, and tests make behavioral equivalence auditable.'},
    mastery:['Rebuild the environment and run tests in a fresh directory.','Explain the distinct roles of exceptions and assertions.','Test a UTF-8 file flow with tmp_path.','Refactor global script logic into importable functions and an entry point.'],
    references:['Harvard CS50P · Exceptions, Libraries, Unit Tests, File I/O','Python Tutorial · Modules','pytest Documentation · Getting Started'],
  },
  'p.3': { ...specialLessonCopy.zh['p.3'],
    objectives:['Describe arrays with ndim, shape, axis, size, and dtype.','Predict whether broadcasting is valid and write the output shape.','Distinguish a slicing view from an explicit copy.','Match NumPy and PyTorch results on the same tiny input.'],
    opening:['The bridge from Python lists to model code is an array mental model: one operation transforms a homogeneous block of data. Shape, axis, and dtype are the shared language of every later model lesson.','Learn the array rules in NumPy, then add device and autograd in PyTorch; these are connected layers, not unrelated APIs.'],
    concepts:[
      {name:'ndarray and homogeneous data',note:'An ndarray has a fixed dtype and rectangular shape. Those constraints enable compact storage and batch operations; nested-list behavior cannot be assumed to transfer.'},
      {name:'shape, axis, and reduction',note:'Shape gives each axis length; axis selects which dimension is reduced. Write input and output shapes before sum, mean, or softmax.'},
      {name:'Broadcasting',note:'Compare axes from the end: sizes must match or one must be 1. Broadcasting is a logical expansion and does not necessarily materialize a full copy.'},
      {name:'Views and copies',note:'Basic NumPy slices usually share data. Cross-library conversions may also share memory; use copy or clone when independent storage is required.'},
      {name:'NumPy to PyTorch',note:'The libraries share many shape and broadcasting rules, while PyTorch adds device, requires_grad, and a computation graph. Establish numeric parity before gradients.'},
    ],
    workflow:['Label axes on a tiny array','Hand-check indexing and broadcasting','Replace loops with array operations','Compare every element across libraries'],
    practice:{task:'Vectorize bigram counts and compare NumPy with PyTorch',steps:['Hand-build a 3×3 count matrix from four token IDs.','Implement a loop, np.add.at, and torch.index_put_.','Assert shape, dtype, total count, and elementwise equality.','Change vocabulary size, repeated pairs, and empty inputs.'],evidence:['Three implementations on identical inputs','A shape/dtype/axis ledger','Elementwise parity assertions','One view/copy aliasing counterexample']},
    worked:{title:'Write [0,1,0,2] into a count matrix',steps:['Source indices are [0,1,0] and targets are [1,0,2].','Repeated indices require accumulation; np.add.at states that contract explicitly.','Match it with index_put_(accumulate=True), then verify with array_equal.'],question:'For zero or one token, what output shape and total count should the contract guarantee?'},
    misconception:'Removing a for loop does not prove correctness or speed. Prove indexing, accumulation, shape, and dtype equivalence before benchmarking.',
    quiz:{question:'What is the broadcast result of shapes (4,1,8) and (3,8)?',options:['(4,3,8): 8 matches and 1 expands to 3','Invalid because ranks differ','(3,4,8): shorter shapes always go first'],explanation:'Broadcasting aligns from the final axis and treats missing leading axes as 1.'},
    mastery:['Write input and output shapes before evaluating an expression.','Explain axis=0 versus axis=-1.','Demonstrate a view mutating its base array.','Match NumPy and PyTorch on three boundary inputs.'],
    references:['NumPy · Absolute Basics for Beginners','NumPy · Broadcasting','PyTorch Learn the Basics · Tensors'],
  },
  'p.4': { ...specialLessonCopy.zh['p.4'],
    objectives:['Explain data → forward → loss → backward → update.','Separate parameter values, gradients, and optimizer updates.','Assert shapes, finiteness, and expected loss movement.','Reproduce the experiment with a fixed seed and preserved failures.'],
    opening:['This gate checks whether programming, arrays, and tests form one real parameter update. If you cannot explain every line without a reference, return to the corresponding prerequisite.','A printed loss is not completion. Predict the update direction, verify gradients, and diagnose one deliberately broken condition.'],
    concepts:[
      {name:'Data and parameters',note:'Inputs and labels are observations; parameters are state the optimizer changes. Similar shapes do not imply the same lifetime or requires_grad behavior.'},
      {name:'Forward pass and logits',note:'The forward pass maps inputs and parameters to unnormalized scores. Assert batch, class dimension, and finiteness before computing loss.'},
      {name:'Scalar loss',note:'Cross-entropy reduces batch predictions to an optimization scalar. A lower training loss is not evidence of generalization.'},
      {name:'Backward and grad',note:'Backward accumulates each leaf parameter’s derivative. Understand whether repeated calls intentionally accumulate before clearing gradients.'},
      {name:'Parameter update',note:'Update under no_grad, then clear gradients. The learning rate scales movement along the negative gradient; check both direction and new loss.'},
    ],
    workflow:['Freeze a two-example problem','Predict gradient direction','Execute one update','Break a condition and diagnose it'],
    practice:{task:'Move from text counts to one tested gradient update',steps:['Fix two one-hot inputs, labels, initial weights, and seed; hand-check initial logits.','Run forward, cross-entropy, backward, and one SGD update with a shape ledger.','Assert finite loss, nonempty gradients, and changed parameters; recompute loss.','Break label range, dtype, gradient clearing, and shape one at a time.'],evidence:['A reproducible training script','Before/after parameters and losses','At least six automatic assertions','Four fault-injection diagnoses']},
    worked:{title:'Verify one SGD step without treating it as magic',steps:['Zero weights produce equal initial logits and a predictable cross-entropy baseline.','Backward produces w.grad; the update must move along -grad.','If the next loss surprises you, inspect labels, learning rate, clearing, and no_grad boundaries.'],question:'Without clearing gradients, is the next update an intended multi-batch accumulation or an accidental duplicate? What record distinguishes them?'},
    misconception:'A runnable loop can still have invalid labels, wrong dimensions, unintended accumulation, or data leakage.',
    quiz:{question:'Which evidence is most diagnostic after one update?',options:['Shapes, loss, gradients, parameter delta, and assertions under fixed inputs and seed','A screenshot of the final loss','Nonzero GPU utilization'],explanation:'Correctness must be observable across data, graph, and update boundaries.'},
    mastery:['Rewrite the minimal training loop closed-book.','Name every object that is mutated.','Inject uncleared gradients and explain the result.','Reproduce on new input with all tests passing.'],
    references:['PyTorch Learn the Basics · Tensors and Autograd','PyTorch Learn the Basics · Optimization Loop','Lesson 0.6 · PyTorch tensors and reproducible experiments'],
  },
  '0.1': { ...specialLessonCopy.zh['0.1'],
    objectives:['Separate parameters changed during training from state changed during a request.','Draw data → tokens → training → base model → post-training → assistant → inference/tools.','Attach lessons 2.x–7.x to the correct links.','Explain why continuation ability is not assistant behavior.'],
    opening:['This is a reusable map, not a survey of every term. Watch only six segments totaling 30:56; spend the remaining fourteen minutes drawing and retrieving from memory.','Training changes weights. Requests change context, KV cache, and tool observations. Mixing these flows causes persistent confusion about RAG, agents, fine-tuning, and decoding.'],
    concepts:[
      {name:'Data and tokens',note:'Collected text is filtered, deduplicated, mixed, and encoded with a fixed tokenizer. Changing the tokenizer changes sequence lengths, vocabulary indices, embeddings, and downstream interfaces.'},
      {name:'Pretraining and parameters',note:'The next-token objective updates weights with gradients. A new user message changes request state; it does not immediately retrain the model.'},
      {name:'Base model',note:'A base model continues the conditional distribution of its training text. A question may become a webpage or forum continuation rather than a direct service response.'},
      {name:'Post-training and assistant',note:'Demonstrations, preferences, and task rewards reshape role, format, and stopping behavior in the weights. Later lessons separate the algorithms.'},
      {name:'Inference state',note:'Prompt tokens, generated tokens, KV cache, and sampling settings belong to runtime state. Temperature reshapes decoding probabilities; it does not add knowledge.'},
      {name:'Tools and external facts',note:'Search or code results enter working context as observations. They can change the next output without becoming parameter memory.'},
    ],
    workflow:['Draw the initial map closed-book','Correct one node per segment','Separate parameter and runtime flows','Attach later lessons to the chain'],
    practice:{task:'Rebuild a usable LLM stack map in 45 minutes',steps:['Minutes 0–3: draw the request path without references.','Minutes 3–34: watch six required segments and answer one card question per segment.','Minutes 34–41: redraw data, parameter-update, and runtime-state flows with verbs on arrows.','Minutes 41–45: answer four retrieval questions and place 2.x–7.x.'],evidence:['Before and after maps','Three distinct flow colors with verbs','Four retrieval answers with causal reasons','One hallucination point and one verifiable tool observation']},
    worked:{title:'Place one user request in the trained system',steps:['Weights already came from pretraining and post-training before service starts.','The tokenizer encodes the message; the model emits logits, samples one token, appends it, and repeats.','A search result enters context and changes later output without automatically entering long-term weights.'],question:'For a tokenizer change, retrieved evidence, and temperature change, identify which interface or state changes first.'},
    misconception:'Seeing a new fact in a conversation is not the same as learning it into parameters.',
    quiz:{question:'After adding a retrieved passage, what changes first?',options:['Request context and the conditional distribution of later tokens','All pretrained weights','Tokenizer vocabulary and embedding size'],explanation:'Tool output enters working context unless a separate training process updates parameters.'},
    mastery:['Connect the full chain from memory in five minutes.','Identify parameter, runtime-state, and tool-observation flows.','Explain base versus assistant behavior.','Place lessons 2.x–7.x on the correct nodes.'],
    references:['Andrej Karpathy · Deep Dive into LLMs like ChatGPT','LLM Study roadmap','Lessons 2.x–7.x'],
  },
  '5.1': { ...specialLessonCopy.zh['5.1'],
    objectives:['Explain base versus instruct outputs through training distributions.','Show how a chat template changes token sequences and role boundaries.','Separate SFT behavior shaping from adding factual knowledge.','Build an auditable paired comparison across six prompt types.'],
    opening:['This lesson asks one question: why does the same Transformer family behave like a continuation engine before post-training and an assistant after it? Required video ends at 1:20:32; preference-objective formulas stay in later lessons.','Do not score “which is smarter”. Record distributional style, role boundaries, stopping, uncertainty, and the actual tokens introduced by the template.'],
    concepts:[
      {name:'Pretraining distribution',note:'A base model optimizes next-token likelihood over web text. Questions, answers, code, and dialogue may appear without one universal assistant protocol.'},
      {name:'Base-model behavior',note:'A question can be answered or continued as a webpage. The form follows the training distribution and prompt prefix; it is not a direct knowledge-capability switch.'},
      {name:'Chat template',note:'Templates encode system, user, and assistant roles with special tokens. A tokenizer/template mismatch can cause role leakage, gibberish, or nontermination.'},
      {name:'SFT demonstrations',note:'SFT raises the probability of demonstrated assistant responses. It shapes behavior but does not guarantee factuality, calibrated refusal, or every format constraint.'},
      {name:'Assistant behavior',note:'Stopping, tone, format, and tool protocols are learned behaviors layered on next-token generation.'},
      {name:'Paired diagnosis',note:'Use the same prompt and decoding controls with each model’s correct encoding to separate behavior shaping from sampling noise and template errors.'},
    ],
    workflow:['Fix six prompt classes','Save both real encodings','Control decoding settings','Explain differences through training data'],
    practice:{task:'Run a six-class base/instruct paired experiment',steps:['Choose factual, format, multi-turn, uncertainty, instruction-following, and webpage-continuation prompts.','Save raw base tokens and apply_chat_template tokens.','Fix temperature, top-p, seed, and length; record output, stopping, and roles.','Explain each row by training distribution; label template failures separately.'],evidence:['Six prompts × two models','At least two token-encoding comparisons','Pinned decoding and model versions','One template-mismatch failure and repair']},
    worked:{title:'Diagnose a base model that does not answer',steps:['Confirm that the base model receives plain text, not an unfamiliar chat template.','Classify whether output resembles a webpage, QA corpus, or document continuation.','Compare matched instruct weights and template; changed roles and stopping indicate post-training behavior shaping.'],question:'If an instruct model emits gibberish, why inspect tokenizer and template before blaming SFT?'},
    misconception:'A base model that does not directly answer may still contain relevant knowledge; fluent assistant behavior does not prove factual correctness.',
    quiz:{question:'What most directly causes role leakage or nontermination with valid instruct weights?',options:['A mismatched tokenizer or chat template','A missing loss from a later preference-optimization lesson','Temperature not fixed at exactly 0.7'],explanation:'Role boundaries depend on the special tokens and template used during training; this lesson diagnoses base models, templates, and supervised demonstrations.'},
    mastery:['Explain the data/objective transition from base to assistant.','Show one raw-prompt versus chat-template token difference.','Explain four of six prompt differences through training distributions.','Locate a weight, tokenizer, template, or sampling fault.'],
    references:['Karpathy · 00:42:52–01:20:32','Hugging Face · Chat Templates','Lesson 5.2 · SFT and chat templates'],
  },
}

function buildSpecialLessonMaterial(lesson, locale) {
  const [id, title, type, duration] = lesson
  const copy = specialLessonCopy[locale]?.[id]
  if (!copy) return null
  const media = lessonMedia[id]
  const englishGuidanceFor = segment => {
    if (segment.beforeEn && segment.afterEn) return { before:segment.beforeEn, after:segment.afterEn }
    const guidance = karpathyEnglishGuidance[segment.id]
    if (!guidance?.before || !guidance?.after) throw new Error(`Missing English Karpathy guidance: ${segment.id}`)
    return guidance
  }
  const localizedMedia = media && locale === 'en' && media.segments ? {
    ...media,
    segments:media.segments.map(segment => {
      const guidance = englishGuidanceFor(segment)
      return { ...segment, before:guidance.before, after:guidance.after }
    }),
  } : media
  return {
    id, title, type, duration, ...copy,
    media: localizedMedia ? {
      ...localizedMedia,
      globalTitle:title,
      before:locale === 'en'
        ? (localizedMedia.beforeEn || 'Write a prediction before opening the source.')
        : (localizedMedia.before || '打开资料前先写下预测。'),
      after:locale === 'en'
        ? (localizedMedia.afterEn || 'Save the required artifact and one failed case.')
        : (localizedMedia.after || '保存本节要求的产物和一个失败案例。'),
    } : null,
    spotlight:null,
  }
}

const kimiK3AuditCode = `total_params = 2.8e12
active_params = 104e9
routed_experts = 896
selected_experts = 16

print("total / active:", total_params / active_params)
print("routed / selected experts:", routed_experts / selected_experts)
print("hypothetical all-4bit lower bound (TB):", total_params * 4 / 8 / 1e12)

# This is not the actual checkpoint or deployment-memory footprint.
# K3 reports MXFP4 for MoE expert weights; other weights, scales,
# activations, KV state, communication buffers and runtime overhead remain.`

function buildKimiK3EnglishMaterial(lesson) {
  const [id, title, type, duration] = lesson
  return {
    id, title, type, duration,
    objectives: [
      'Draw the sequence-, depth-, and width-wise information paths behind KDA, AttnRes, and Stable LatentMoE.',
      'Separate 2.8T total parameters from 104B active parameters, then account for storage, communication, KV state, and runtime overhead.',
      'Audit an evaluation claim by matching reasoning effort, agent harness, tool access, benchmark split, cost, and preserved failures.',
      'Distinguish open weights from unrestricted open source and identify when the Kimi K3 License requires a separate commercial review.',
    ],
    opening: [
      'Treat Kimi K3 as a coupled model–training–infrastructure–evaluation–license system, not as a brand scorecard. Every headline number needs a measurement boundary.',
      'The official report and repository are primary evidence for what Moonshot AI reports. They are not independent reproduction evidence, and released weights do not disclose every training input or operational detail.',
    ],
    concepts: [
      { name:'KDA', note:'Kimi Delta Attention supplies linear recurrent attention for most layers, while periodic Gated MLA layers restore global content-based access. Audit the 3:1 pattern and the final global-attention layer rather than reducing the design to “linear attention”.' },
      { name:'AttnRes', note:'Attention Residuals let a block selectively read earlier block outputs and embeddings. Track which depth-wise paths are available and what extra state or communication they require.' },
      { name:'Stable LatentMoE', note:'The model routes through 896 experts and selects 16 per token in a compact latent expert space. RMSNorm, SiTU-GLU, and quantile balancing are stabilization mechanisms, not optional footnotes.' },
      { name:'MXFP4 QAT', note:'Quantization-aware training begins during post-training and targets MXFP4 expert weights with MXFP8 activations. Do not infer that the entire checkpoint or serving stack occupies four bits per parameter.' },
      { name:'Million-token agentic RL', note:'The post-training stack combines SFT, long-horizon agentic RL, preserved thinking history, and multiple effort levels. A one-million-token window is capacity; usable long-horizon behavior still needs trajectory and compaction tests.' },
      { name:'Kimi K3 License', note:'The custom license grants broad rights but includes commercial thresholds and display conditions. “Open weight” describes access to weights; it does not erase license obligations or make the release OSI-approved.' },
    ],
    workflow: ['Build an architecture ledger with sequence, depth, and width paths', 'Calculate resource lower bounds and list every excluded runtime term', 'Create an evaluation replay card with matched harness, tools, effort, cost, and failures', 'Run the license decision tree before making a deployment recommendation'],
    practice: {
      task: 'Build a five-layer audit matrix spanning architecture, training, inference, evaluation, and licensing',
      steps: [
        'Predict: write what 2.8T total, 104B active, 896 routed, 16 selected, and a one-million-token context do—and do not—imply.',
        'Build: give every claim a source, evidence class, measurement boundary, dependency, and falsification test.',
        'Verify: cross-check the technical report, official repository, and exact license text; label official claims separately from independent evidence.',
        'Transfer: apply the same matrix to another open-weight model and record which fields cannot be compared directly.',
      ],
      evidence: ['A completed five-layer audit matrix', 'One checked resource calculation with explicit exclusions', 'One benchmark replay card with harness and cost controls', 'A license-boundary note plus one claim marked uncertain or falsified'],
    },
    worked: {
      title:'Audit the headline numbers before comparing scores',
      steps: [
        '2.8T / 104B is about 26.9×, while 896 / 16 is 56×; these ratios describe different boundaries and must not be substituted for each other.',
        'An imaginary all-4-bit lower bound is 1.4 TB, but it is not the checkpoint size or deployment-memory requirement because only expert weights are reported as MXFP4 and runtime state remains.',
        'Re-score one benchmark only after matching reasoning effort, agent harness, tools, public/private split, sampling, and cost; otherwise mark the comparison non-equivalent.',
      ],
      question:'Which conclusion changes first if the harness, tool access, or context-compaction policy differs from the official evaluation?',
    },
    code: kimiK3AuditCode,
    misconception:'“2.8T parameters” does not mean every token computes a dense 2.8T model, and “weights are downloadable” does not mean unrestricted open source or laptop-scale deployment.',
    quiz: {
      question:'Which package of evidence supports a defensible Kimi K3 deployment recommendation?',
      options: [
        'Matched model config, harness, tools, effort, cost, failure cases, infrastructure assumptions, and license review',
        'One official benchmark score and the maximum context-window number',
        'The active-parameter count and a screenshot of a successful prompt',
      ],
      explanation:'A system recommendation needs comparable evaluation, realistic resource accounting, preserved failures, and license boundaries—not a single headline metric.',
    },
    mastery: ['Explain the three architectural axes without a diagram key.', 'Reproduce the parameter and storage-bound calculations with explicit caveats.', 'Turn an official benchmark row into a replayable evaluation card.', 'Decide whether a proposed use requires commercial-license review and explain why.'],
    references: ['Kimi K3 Technical Report · arXiv:2607.24653', 'MoonshotAI/Kimi-K3 · official repository', 'Kimi K3 License · exact repository text'],
    media: null,
    spotlight: {
      kicker:'SYSTEM CASE STUDY · KIMI K3',
      title:'Open weights are not unconditional open source',
      body:'The Kimi K3 License allows broad use but sets special commercial conditions. A Model-as-a-Service business above US$20M aggregate revenue over a consecutive 12-month period needs a separate agreement before commercial use; very large commercial products or services also face a prominent “Kimi K3” display condition, subject to the license’s stated exemptions.',
      points:['Released weights do not make the complete training process reproducible.','Official benchmark claims and independent reproduction are different evidence classes.','Commercial thresholds, attribution, branding, and exemptions must be checked against the exact current license.'],
      note:'Course summary only; not legal advice. Read the exact license before commercial deployment.',
    },
  }
}

function buildKimiK3ChineseMaterial(lesson) {
  const [id, title, type, duration] = lesson
  return {
    id, title, type, duration,
    objectives: [
      '画出序列、深度、宽度三条信息流，解释 KDA、AttnRes 与 Stable LatentMoE 分别改变了什么。',
      '区分 2.8T 总参数与 104B 激活参数，并把存储、通信、KV 状态和运行时开销分别核算。',
      '按推理强度、Agent harness、工具权限、公开/私有题集、成本和失败样本审计评测声明。',
      '区分开放权重与无条件开源，识别 Kimi K3 License 何时需要单独商用审查。',
    ],
    opening: [
      '把 Kimi K3 当作模型—训练—基础设施—评测—许可证五个耦合系统，而不是品牌榜单。2.8T、1M context、前沿成绩和“开源”都必须补上测量边界。',
      '技术报告与官方仓库是一手资料，能证明 Moonshot AI 公布了什么，但不等于第三方已经独立复现；权重可下载也不代表训练数据、训练过程和生产基础设施全部公开。',
    ],
    concepts: [
      { name:'KDA', note:'大部分层用线性递归式的 Kimi Delta Attention，并周期性插入 Gated MLA 恢复全局内容寻址。审计时要核对 3:1 结构和最后的全局注意力层，不能只写“线性注意力”。' },
      { name:'AttnRes', note:'Attention Residuals 让当前 block 有选择地读取更早 block 和 embedding。要画清深度方向的可访问路径，并核算额外状态与通信。' },
      { name:'Stable LatentMoE', note:'模型有 896 个路由专家、每 token 选择 16 个，在紧凑 latent expert space 中工作；RMSNorm、SiTU-GLU 和 Quantile Balancing 都是稳定训练的一部分。' },
      { name:'MXFP4 QAT', note:'量化感知训练从后训练阶段开始，目标是 MXFP4 专家权重与 MXFP8 激活。不能由此推断整个 checkpoint 或服务栈都是每参数 4 bit。' },
      { name:'Million-token agentic RL', note:'后训练组合 SFT、长时程 Agent RL、保留 thinking history 与多档推理强度。百万 token 是容量上限，真正的长期任务能力仍需轨迹、压缩和恢复测试。' },
      { name:'Kimi K3 License', note:'这是包含商用门槛和展示条件的定制许可证。“开放权重”描述权重访问方式，不会自动消除许可义务，也不等同于 OSI 意义上的开源。' },
    ],
    workflow: ['建立序列—深度—宽度三轴架构台账', '计算资源下界并逐项列出未计入的运行时开销', '制作包含 harness、工具、推理强度、成本与失败样本的评测复现卡', '部署建议进入决策前先走完许可证判断树'],
    practice: {
      task:'建立架构—训练—推理—评测—许可证五层审计矩阵',
      steps: [
        '预测：先写下 2.8T 总参数、104B 激活参数、896/16 专家路由与百万上下文分别能说明什么、不能说明什么。',
        '构建：为每条声明补齐来源、证据等级、测量边界、依赖条件和可证伪实验。',
        '验证：交叉核对技术报告、官方仓库与许可证原文；把官方声明和独立证据分栏记录。',
        '迁移：把同一矩阵用于另一个开放权重模型，标出无法直接横向比较的字段。',
      ],
      evidence:['一份完成的五层审计矩阵', '一项写清排除项的资源手算', '一张包含 harness 与成本控制的评测复现卡', '一份许可证边界说明，以及至少一条“不确定或被推翻”的声明'],
    },
    worked: {
      title:'先审计头条数字，再讨论榜单',
      steps: [
        '2.8T / 104B 约为 26.9 倍，896 / 16 为 56 倍；两者边界不同，不能互相替代。',
        '假设全部参数都是 4 bit，理论存储下界是 1.4 TB；但官方只说明专家权重使用 MXFP4，其他权重、scale、激活、KV、通信 buffer 和运行时仍需另算。',
        '只有当推理强度、Agent harness、工具、公开/私有题集、采样和成本匹配时，benchmark 才能直接比较；否则应标为非等价证据。',
      ],
      question:'如果 harness、工具权限或上下文压缩策略变化，原评测结论中哪一项会最先失效？',
    },
    code: kimiK3AuditCode,
    misconception:'“2.8T 参数”不等于每个 token 都进行 2.8T 稠密计算；“权重可下载”也不等于无条件开源或个人电脑可部署。',
    quiz: {
      question:'哪组证据足以支持一份可辩护的 Kimi K3 部署建议？',
      options:[
        '匹配的模型配置、harness、工具、推理强度、成本、失败样本、基础设施假设与许可证审查',
        '一项官方 benchmark 分数和最大上下文数字',
        '激活参数量和一次成功对话截图',
      ],
      explanation:'系统级建议必须同时具备可比评测、真实资源账、失败证据与许可证边界，不能依赖单个头条指标。',
    },
    mastery:['闭卷解释三条架构轴及其耦合关系。', '复算参数与存储下界，并明确所有限定条件。', '把一行官方 benchmark 改写为可复现评测卡。', '判断一个拟议用途是否需要商用许可复核，并说明依据。'],
    references:['Kimi K3 Technical Report · arXiv:2607.24653', 'MoonshotAI/Kimi-K3 · 官方仓库', 'Kimi K3 License · 仓库许可证原文'],
    media:null,
    spotlight:{
      kicker:'SYSTEM CASE STUDY · KIMI K3',
      title:'开放权重不是无条件开源',
      body:'Kimi K3 License 给予广泛使用权，但包含特殊商用条件：连续 12 个月累计收入超过 2,000 万美元的 Model-as-a-Service 业务，在商用前需要另行协议；超大规模商业产品或服务还可能触发显著展示“Kimi K3”的条件，并以许可证列出的豁免为准。',
      points:['发布权重不等于完整训练过程可复现。', '官方 benchmark 声明与第三方独立复现是不同证据等级。', '商用门槛、署名、品牌展示和豁免都必须回到当前许可证原文核对。'],
      note:'本节是学习性摘要，不构成法律意见；商用部署前请阅读许可证原文并进行专业审查。',
    },
  }
}

function buildEnglishLessonMaterial(module, lesson) {
  const [id, title, type, duration, theory, practice] = lesson
  const special = buildSpecialLessonMaterial(lesson, 'en')
  if (special) return special
  if (id === '8.7') return buildKimiK3EnglishMaterial(lesson)
  const concepts = splitTheory(theory)
  const workflow = ['Define the smallest observable question', 'Build the minimal correct mechanism', 'Compare against a baseline or reference', 'Change one condition and explain the result']
  const media = lessonMedia[id]
  return {
    id, title, type, duration,
    objectives: [
      `Explain what problem “${title}” solves without hiding behind terminology.`,
      `Trace the variables and causal links across ${concepts.slice(0, 3).join(', ') || 'the core mechanism'}.`,
      `Complete “${practice}” and judge the result with evidence rather than intuition.`,
    ],
    opening: [
      `Start from the failure of a simpler method. Identify the exact condition where it stops working, then introduce the new mechanism only when the need is visible.`,
      `For every transformation, ask three questions: what enters, what changes, and what observation would prove the output is correct?`,
    ],
    concepts: concepts.map((name, index) => ({ name, note: explainEnglishConcept(name, module.id, index) })),
    workflow,
    practice: {
      task: practice,
      steps: [
        'Predict: write the expected output, trend, or failure before running code.',
        `Build: implement only the minimum components needed to answer the question.`,
        'Verify: compare with a baseline or trusted implementation; save seeds, parameters, and raw outputs.',
        'Transfer: change one shape, dataset, scale, or workload condition and explain whether the conclusion still holds.',
      ],
      evidence: ['A minimal reproducible implementation', 'At least one baseline and controlled comparison', 'One preserved failure case with a diagnosis', 'A conclusion written in your own words'],
    },
    worked: {
      title: `Work through “${practice}”`,
      steps: ['Fix a minimal input, random seed, and baseline.', `Change one factor and trace ${concepts.slice(0, 3).join(' → ') || title}.`, 'Use measurements to decide whether the prediction holds; preserve counterexamples.'],
      question: 'If prediction and result disagree, inspect inputs and masks/shapes first, then numeric range, objective and metric, and finally system resources.',
    },
    code: profiles[module.id]?.code || profiles.foundations.code,
    misconception: `Recognizing the phrase “${concepts[0] || title}” is not mastery. You must predict how a change propagates and design an experiment that could falsify your prediction.`,
    quiz: {
      question: `Which evidence best demonstrates mastery of “${title}”?`,
      options: [`Predict under a new condition, then verify ${concepts[0] || 'the mechanism'} with an implementation and controlled comparison`, 'Recognize every term after watching the lecture', 'Copy the reference code and reproduce one output'],
      explanation: 'Mastery is transferable prediction, implementation, and explanation—not familiarity.',
    },
    mastery: [`Explain the causal chain behind ${concepts.slice(0, 2).join(' and ') || title} in two minutes.`, `Implement the core of “${practice}” without a reference.`, 'Break one assumption deliberately and locate the error using observations.', 'Change one condition and explain whether the result transfers.'],
    references: module.sources.slice(0, 3),
    media: media ? { ...media, globalTitle:title, before:`Before watching, write down the failure that ${concepts[0] || title} is meant to solve and predict the example the instructor will use.`, after:`Build the smallest version of “${practice}” and record one way the result differed from your initial prediction.` } : null,
    spotlight: id === '8.4' ? { title:'Paper bridge: from fixed batches to confidence-aware scheduling', body:'Speculative decoding drafts several tokens and verifies them with the target model. DSpark connects parallel drafting, lightweight sequential dependency, prefix-survival confidence, and hardware-aware scheduling.', points:['Sequential heads recover dependencies within a draft block.','Confidence estimates prevent wasteful over-verification.','The scheduler chooses verification length for the current serving load.'] } : null,
  }
}

export function buildLessonMaterial(module, lesson, locale = 'zh') {
  if (locale === 'en') return buildEnglishLessonMaterial(module, lesson)
  const [id, title, type, duration, theory, practice] = lesson
  const special = buildSpecialLessonMaterial(lesson, 'zh')
  if (special) return special
  if (id === '8.7') return buildKimiK3ChineseMaterial(lesson)
  const profile = profiles[module.id] || profiles.foundations
  const workflow = typeGuides[type] || typeGuides['理论']
  const concepts = splitTheory(theory)
  const isDSpark = id === '8.4'

  return {
    id, title, type, duration,
    objectives: [
      `能不用术语堆砌，解释「${title}」解决了什么问题。`,
      `能围绕 ${concepts.slice(0, 3).join('、')} 画出变量与因果关系。`,
      `能完成「${practice}」，并用证据而不是感觉判断结果。`,
    ],
    opening: [
      `这一节要完成的认知跨越，是${profile.journey}。学习「${title}」时，不要先背结论：先找到旧方法在哪个具体情境下失效，再让新机制自然出现。`,
      `贯穿本节的观察视角是：${profile.lens}。每读完一个概念，都把它翻译成“输入是什么、发生了什么、输出如何验证”三个问题。`,
    ],
    concepts: concepts.map((name, index) => ({ name, note: explainConcept(name, module.id, index) })),
    workflow,
    practice: {
      task: practice,
      steps: [
        `预测：在运行代码前，写下你预期的输出、趋势或失败位置。`,
        `构建：${workflow[0]}，只保留回答核心问题所需的最小组件。`,
        `验证：使用${profile.verify}；保存参数、随机种子与原始结果。`,
        `迁移：${profile.transfer}，说明原结论是否仍成立。`,
      ],
      evidence: ['一份可重复运行的最小代码', '至少一组基线与对照结果', '一个失败案例及原因', '用自己的话写出的结论'],
    },
    worked: {
      title: `把「${practice}」走一遍`,
      steps: [
        `输入与约束：固定一个最小样本、随机种子和基线，把 ${concepts[0] || title} 写成可观察变量。`,
        `机制推演：只改变一个因素，沿 ${concepts.slice(0, 3).join(' → ') || title} 记录中间状态。`,
        `结果判定：用${profile.verify}判断预测是否成立；若不成立，保留失败样本而不是只保存最终成功截图。`,
      ],
      question: `如果结果与预测相反，先检查哪一个中间量？参考顺序是：输入与 mask/shape → 数值范围 → 目标与指标 → 系统资源。`,
    },
    code: profile.code,
    misconception: `常见误区是把“能复述 ${concepts[0] || title}”当成会了。真正的掌握要求你能预测一个变化会怎样沿系统传播，并设计实验推翻自己的预测。`,
    quiz: {
      question: `学习「${title}」时，哪一种证据最能说明你已经掌握？`,
      options: [
        `在新条件下先预测，再用实现和对照实验验证 ${concepts[0] || '核心机制'}`,
        '看完讲解后能认出所有术语',
        '复制参考代码并得到相同的一次输出',
      ],
      explanation: `掌握不等于熟悉。迁移条件下仍能预测、实现和解释，才证明心智模型能够工作。`,
    },
    mastery: [
      `解释：两分钟讲清 ${concepts.slice(0, 2).join('与') || title} 的因果链。`,
      `实现：关掉参考资料，完成「${practice}」的核心部分。`,
      `诊断：故意破坏一个假设，用观测证据定位错误。`,
      `迁移：${profile.transfer}。`,
    ],
    references: [
      ...module.sources.slice(0, 3),
      ...(module.id === 'transformer' ? ['Sebastian Raschka · Build a Large Language Model (From Scratch)'] : []),
      ...(isDSpark ? ['DeepSeek · DSpark / DeepSpec'] : []),
    ],
    media: lessonMedia[id] ? {
      ...lessonMedia[id],
      before: lessonMedia[id].before || `播放前先写下：${concepts[0] || title}解决的旧方法失败点是什么？你预期视频会用哪一个变量或例子解释它？`,
      after: lessonMedia[id].after || `看完不要停在“听懂”：完成「${practice}」的最小版本，并记录一个与观看前预测不同的地方。`,
    } : null,
    spotlight: isDSpark ? {
      title: '论文桥：从固定批次到置信度调度',
      body: '投机解码先用草稿模型提出多个 token，再由目标模型并行验证。难点不只是草稿够不够准，还在于验证长度是否匹配当前负载。DSpark 把并行草稿、轻量顺序依赖、前缀存活置信度与硬件感知调度连成一个系统。',
      points: [
        '顺序头补回块内 token 依赖，减缓越到后缀越难接受的问题。',
        '置信度头估计前缀继续被接受的概率，避免盲目验证过长草稿。',
        '调度器结合服务负载与吞吐曲线选择验证长度；评价必须在匹配吞吐下比较。',
      ],
    } : null,
  }
}

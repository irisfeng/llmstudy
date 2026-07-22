const profiles = {
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
  karpathy: { platform:'Bilibili', id:'BV1mqrTBvEaf', author:'常青藤中英字幕课程', sourceType:'community', sourceLabel:'社区精译', originalUrl:'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ', sourceNote:'Andrej Karpathy 原课的中英字幕镜像；保留原课入口，镜像失效不影响正文学习。' },
  karpathyDeep: { platform:'Bilibili', id:'BV16cNEeXEer', author:'KrillinAI小林', sourceType:'community', sourceLabel:'社区双语', originalUrl:'https://www.youtube.com/watch?v=7xTGNNLPyMI', sourceNote:'Andrej Karpathy 原讲座的中英双语镜像。' },
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
const part = (page, label) => ({ page, label })
const karpathy = (id, title, duration, page, details = {}) => {
  const { cn: cnDetails, ...rest } = details
  return {
    platform:'YouTube', id, title, author:'Andrej Karpathy', duration,
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

const lessonMedia = {
  '0.1': bili('karpathyDeep', { title:'深入探索像 ChatGPT 这样的大语言模型', duration:'3h31m' }),
  '0.5': bili('calculus', { title:'直观理解链式法则和乘积法则', duration:'16m52s', page:4 }),
  '0.7': bili('raschka', { title:'从零训练一个大语言模型', duration:'27m04s', page:28 }),

  '1.1': bili('neuralNet', { title:'神经网络到底是什么？', duration:'19m13s' }),
  '1.2': bili('calculus', { title:'直观理解链式法则和乘积法则', duration:'16m52s', page:4 }),
  '1.3': karpathy('VMj-3S1tku0', 'Building micrograd', '2h25m', 1, { before:'在播放前先写下：一个 Value 节点至少要保存哪些状态，为什么梯度必须累加？', after:'暂停视频，闭卷实现 add、mul、tanh 和 backward，再用有限差分检查。' }),
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
  '3.2': bili('liMuAttention', { title:'Transformer 论文逐段精读', duration:'1h27m', before:'带着三个问题看：为什么除以 √d、mask 在哪里加、Multi-Head 如何拼接？', after:'用四个 token 的小矩阵手算一次 attention，并标注每个张量 shape。' }),
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

  '5.1': { platform:'YouTube', id:'7xTGNNLPyMI', title:'Deep Dive into LLMs like ChatGPT', author:'Andrej Karpathy', duration:'3h31m', cnQuery:'Karpathy 大语言模型 深入 中文', cn:bili('karpathyDeep', { title:'深入探索像 ChatGPT 这样的大语言模型', duration:'3h31m' }) },
  '5.2': bili('raschka', { title:'指令数据、批处理与 SFT', duration:'1h01m', page:41, parts:[part(41,'准备指令数据集'), part(42,'组织训练批次'), part(43,'创建数据加载器'), part(44,'加载预训练模型'), part(45,'指令微调')] }),
  '5.3': bili('cs336', { title:'对齐：SFT 与人类反馈强化学习', duration:'1h14m', page:15 }),
  '5.4': bili('dpo', { title:'DPO 的目标、缺陷与变体', duration:'31m25s' }),
  '5.5': bili('cs336', { title:'RL 后训练与 GRPO', duration:'2h37m', page:16, parts:[part(16,'大模型 RL 算法'), part(17,'GRPO')] }),
  '5.6': bili('cs336', { title:'模型评估：任务、指标与污染', duration:'1h20m', page:12 }),

  '6.1': bili('cs336', { title:'大模型推理：Prefill、Decode 与服务负载', duration:'1h22m', page:10 }),
  '6.2': bili('vllm', { title:'KV Cache 与 PagedAttention', duration:'12m08s' }),
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
    return media.platform === 'Bilibili' ? media : null
  }
  if (media.platform === 'YouTube') return media
  if (media.global) return { ...media, ...media.global }
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
  [/BPE|pair merge|vocabulary|encode|decode|UTF-8|token/i, name => `${name}位于字符串与模型之间。BPE 反复合并高频相邻单元来换取更短序列，但词表、字节边界和特殊 token 会直接影响多语言、公平性与数字处理。`],
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
  [/PPO|GRPO|policy gradient|advantage|rollout/i, name => `${name}用采样轨迹估计行为对奖励的贡献。优势函数降低方差，KL 控制策略漂移；训练稳定性取决于奖励、采样和更新比例的共同设计。`],
  [/LLM judge|eval|评测|perplexity|污染|方差/i, name => `${name}必须先固定任务分布、评分规则和置信区间。单一平均分会掩盖子群失败；LLM-as-judge 还需做顺序、长度、自偏好与人工一致性校准。`],
  [/幻觉|校准|confidence|abstention|事实性/i, name => `${name}要求模型的置信程度与真实正确率匹配。生成概率不是事实概率；应分别评估回答正确性、拒答选择和证据可验证性。`],
  [/KV Cache|cache shape|GQA|MQA|长上下文/i, name => `${name}保存历史 token 的 K/V，避免 decode 时重复计算前缀。代价随层数、序列长度、KV head 数和 head dim 增长，因此长上下文常先受显存带宽限制。`],
  [/Prefill|Decode|compute-bound|memory-bound/i, name => `${name}对应两类不同负载：prefill 可并行处理整段输入，通常算力密集；decode 每步只产生一个 token，却反复读取权重与缓存，通常带宽受限。`],
  [/INT8|INT4|GPTQ|AWQ|GGUF|量化/i, name => `${name}用更少比特近似权重或激活。速度收益取决于硬件 kernel，质量损失取决于离群值、分组与校准；文件变小不等于端到端一定更快。`],
  [/PagedAttention|continuous batching|block table|调度/i, name => `${name}把 KV cache 切成可复用块，并在请求进出时动态组成批次。这样减少内存碎片与等待，但调度策略会直接影响首 token 延迟和吞吐公平性。`],
  [/SLO|queue|backpressure|限流|降级|tracing/i, name => `${name}把模型服务从“能响应”提升到“可承诺”。队列长度是过载的早期信号；背压、限流和降级要在资源耗尽前触发，并通过 tracing 定位尾延迟。`],
  [/observe|reason|act|termination|Agent|tool loop/i, name => `${name}把生成模型嵌入状态机：观察环境、选择动作、执行工具、记录结果并判断终止。可靠性来自显式状态和边界，不来自更长的思维文本。`],
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
  const rule = conceptRules.find(([pattern]) => pattern.test(name))
  return rule ? rule[1](name) : `${moduleFallback[moduleId]?.(name) || mechanismNotes[index % mechanismNotes.length]} ${mechanismNotes[index % mechanismNotes.length]}`
}

function splitTheory(text) {
  return text.split(/[、，,；;]/).map(x => x.trim()).filter(Boolean)
}

function buildEnglishLessonMaterial(module, lesson) {
  const [id, title, type, duration, theory, practice] = lesson
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
    concepts: concepts.map((name, index) => ({
      name,
      note: `${name} is part of the lesson’s causal model. State its inputs, outputs, invariants, and failure mode; then verify it with a hand-check or a minimal experiment${index === 0 ? ' before moving to an optimized implementation' : ''}.`,
    })),
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

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
  calculus: { platform:'Bilibili', id:'BV1qW411N7FU', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.3blue1brown.com/topics/calculus', sourceNote:'3Blue1Brown 官方账号发布。' },
  neuralNet: { platform:'Bilibili', id:'BV1bx411M7Zx', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.3blue1brown.com/topics/neural-networks', sourceNote:'3Blue1Brown 官方账号发布。' },
  transformerVisual: { platform:'Bilibili', id:'BV13z421U7cs', author:'3Blue1Brown', sourceType:'official', sourceLabel:'官方双语', originalUrl:'https://www.youtube.com/watch?v=wjZofJX0v4M', sourceNote:'3Blue1Brown 官方 Transformer 可视化课程。' },
  liMuAttention: { platform:'Bilibili', id:'BV1pu411o7BE', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'结合论文逐段讲解注意力与 Transformer。' },
  liMuData: { platform:'Bilibili', id:'BV1u142187S5', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'Llama 3.1 预训练数据论文精读。' },
  liMuRun: { platform:'Bilibili', id:'BV1c8HbeaEXi', author:'跟李沐学AI', sourceType:'original', sourceLabel:'中文原创', sourceNote:'Llama 3.1 训练过程论文精读。' },
  nvidiaFsdp: { platform:'Bilibili', id:'BV1UHMwzsEbz', author:'NVIDIA英伟达', sourceType:'official', sourceLabel:'官方技术分享', sourceNote:'NVIDIA 官方账号发布的 Megatron-Core / FSDP 架构分享。' },
  dpo: { platform:'Bilibili', id:'BV1brFSzBEuh', author:'东川路第一可爱猫猫虫', sourceType:'original', sourceLabel:'中文原创', originalUrl:'https://arxiv.org/abs/2305.18290', sourceNote:'从 DPO 原论文延伸到 ORPO、KTO、SimPO 等变体。' },
  vllm: { platform:'Bilibili', id:'BV1kx4y1x7bu', author:'RethinkFun', sourceType:'original', sourceLabel:'中文原创', originalUrl:'https://arxiv.org/abs/2309.06180', sourceNote:'用 KV Cache 与 PagedAttention 建立 vLLM 核心直觉。' },
  llamaCpp: { platform:'Bilibili', id:'BV1N4wreWE8z', author:'比飞鸟贵重的多_HKL', sourceType:'original', sourceLabel:'源码带读', originalUrl:'https://github.com/ggml-org/llama.cpp', sourceNote:'逐行调试 llama.cpp，适合作为源码研读伴侣。' },
  agentic: { platform:'Bilibili', id:'BV1DfrdByE2H', author:'吴恩达Agent', sourceType:'community', sourceLabel:'课程字幕镜像', originalUrl:'https://www.deeplearning.ai/courses/agentic-ai/', sourceNote:'DeepLearning.AI Agentic AI 课程镜像；保留官方课程入口。' },
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
}

export const lessonMediaStats = {
  lessons: Object.keys(lessonMedia).length,
  domestic: Object.values(lessonMedia).filter(media => media.platform === 'Bilibili' || media.cn?.platform === 'Bilibili').length,
}

export const lessonHasMedia = id => Boolean(lessonMedia[id])

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
}

function explainConcept(name, moduleId, index) {
  const rule = conceptRules.find(([pattern]) => pattern.test(name))
  return rule ? rule[1](name) : `${moduleFallback[moduleId]?.(name) || mechanismNotes[index % mechanismNotes.length]} ${mechanismNotes[index % mechanismNotes.length]}`
}

function splitTheory(text) {
  return text.split(/[、，,；;]/).map(x => x.trim()).filter(Boolean)
}

export function buildLessonMaterial(module, lesson) {
  const [id, title, type, duration, theory, practice] = lesson
  const profile = profiles[module.id] || profiles.foundations
  const workflow = typeGuides[type] || typeGuides['理论']
  const concepts = splitTheory(theory)
  const isDSpark = id === '6.6'

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

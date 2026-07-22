export const worldModules = [
  {
    id: 'world-foundations', no: 'W0', title: '从语言走向世界', short: '定义与状态', weeks: '2 周', hours: 14,
    summary: '先建立严格边界：世界模型不是视频生成的别名，而是对状态、动作与未来后果的可学习模型。',
    question: '模型要保留什么状态，才能预测行动之后会发生什么？', color: '#6cc6ff',
    lessons: [
      ['wm.0.1', '世界模型究竟是什么', '地图', '80 分钟', '状态、观察、动作、转移、预测与规划', '用统一判据审计 6 个“世界模型”项目'],
      ['wm.0.2', 'POMDP：看不全的世界如何建模', '推导', '110 分钟', '隐藏状态、belief state、观测模型、奖励与策略', '手算一个部分可观察迷宫的 belief update'],
      ['wm.0.3', '造一个最小可运行世界模型', '代码', '140 分钟', 'GridWorld、action-conditioned dynamics、rollout、模型预测控制', '训练下一状态预测器并让智能体用想象选动作'],
    ],
    project: 'World Model Audit：一套可复用判据 + 一个能预测、滚动和规划的 GridWorld。',
    mastery: ['能区分视频生成器与可用于规划的世界模型', '能写出 POMDP 中状态、观察和动作的关系', '能解释单步准确为何不保证长期 rollout 可用'],
    sources: ['Ha & Schmidhuber · World Models', 'Sutton & Barto · Reinforcement Learning', 'LeCun · A Path Towards Autonomous Machine Intelligence'],
  },
  {
    id: 'world-dynamics', no: 'W1', title: '在想象中学习与规划', short: '隐空间动力学', weeks: '3 周', hours: 20,
    summary: '从压缩视觉观察到学习隐空间动力学，再让策略在模型想象出的轨迹中学习。',
    question: '为什么不必重建每个像素，也能预测对决策有用的未来？', color: '#6cc6ff',
    lessons: [
      ['wm.1.1', '经典 World Models：VAE + RNN + Controller', '研读', '130 分钟', 'VAE、MDN-RNN、latent dynamics、controller、dream rollout', '复现一个小型 latent dynamics rollout'],
      ['wm.1.2', 'Dreamer：让智能体在隐空间里做梦', '理论', '150 分钟', 'RSSM、reconstruction、reward prediction、imagined trajectory、actor-critic', '比较真实轨迹训练与 imagined rollout 训练'],
      ['wm.1.3', 'MuZero：只学习规划真正需要的动力学', '推导', '140 分钟', 'representation、dynamics、prediction、MCTS、value与policy', '在玩具博弈中实现简化版模型规划'],
    ],
    project: 'Latent Dynamics Lab：压缩观察、预测未来，并量化误差如何随 rollout 长度累积。',
    mastery: ['能画出 Dreamer 的表示、动力学和行为学习闭环', '能比较像素重建目标与任务相关预测目标', '能说明 MuZero 的隐状态为何不等于真实世界状态'],
    sources: ['World Models', 'DreamerV3', 'MuZero'],
  },
  {
    id: 'jepa', no: 'W2', title: 'JEPA 与抽象世界表征', short: '预测表征', weeks: '2 周', hours: 14,
    summary: '理解杨立昆路线的核心：在表示空间预测不可见或未来部分，避免把容量浪费在不可预测的像素细节上。',
    question: '一个好的世界表征，应该预测什么，又应该主动忽略什么？', color: '#6cc6ff',
    lessons: [
      ['wm.2.1', 'JEPA：为什么不直接预测像素', '理论', '120 分钟', 'joint embedding、context encoder、target encoder、predictor、collapse prevention', '比较像素损失与表征预测损失'],
      ['wm.2.2', 'V-JEPA 2：从视频理解到机器人规划', '研读', '150 分钟', 'self-supervised video、action conditioning、latent planning、zero-shot control', '用官方模型做视频表征检索并设计规划评测'],
    ],
    project: 'Representation Prediction Notebook：遮挡视频片段，在像素与表征空间分别预测并比较。',
    mastery: ['能解释 target encoder 与 predictor 的作用', '能说明表征坍塌风险与规避方式', '能区分 action-free 预训练和 action-conditioned 世界模型'],
    sources: ['LeCun · AMI', 'Meta · V-JEPA', 'Meta · V-JEPA 2'],
  },
  {
    id: 'generative-worlds', no: 'W3', title: '生成、探索与编辑世界', short: 'Genie 与空间智能', weeks: '3 周', hours: 18,
    summary: '沿着 Genie 与 World Labs 两条路线，理解动作可控视频世界和持久可导航 3D 世界的技术边界。',
    question: '生成看起来真实的画面，与维护一个可交互、可持续的世界相差什么？', color: '#ffb86b',
    lessons: [
      ['wm.3.1', 'Genie 1→3：从潜在动作到实时世界', '研读', '160 分钟', 'video tokenizer、latent action、autoregressive dynamics、real-time interaction、一致性', '拆解 Genie 演进并设计动作可控性测试'],
      ['wm.3.2', '李飞飞、Marble 与空间智能', '研读', '140 分钟', 'persistent 3D、multimodal world creation、navigation、editing、World API', '比较视频生成、3D重建与生成式世界'],
    ],
    project: 'Interactive World Scorecard：从动作响应、物体恒常性、几何、记忆和可编辑性评估生成世界。',
    mastery: ['能解释 latent action 如何从无动作标签视频中学习', '能区分 2D 视频一致性与 3D 空间持久性', '能设计不依赖“看起来很酷”的可控性评测'],
    sources: ['Google DeepMind · Genie', 'Google DeepMind · Project Genie', 'World Labs · Marble'],
  },
  {
    id: 'physical-ai', no: 'W4', title: 'Physical AI、评测与前沿', short: '物理智能', weeks: '2 周', hours: 14,
    summary: '把世界模型放回机器人、自动驾驶和合成数据系统，处理仿真到现实、安全与评测问题。',
    question: '一个生成世界怎样才能真正降低机器人在现实中学习的成本与风险？', color: '#ffb86b',
    lessons: [
      ['wm.4.1', 'NVIDIA Cosmos 与世界基础模型', '系统', '140 分钟', 'world foundation model、physical AI、synthetic data、post-training、policy model', '为机器人任务设计 Cosmos 数据与后训练管线'],
      ['wm.4.2', '如何评测世界模型：从好看走向可用', '验收', '150 分钟', 'controllability、long-horizon consistency、physics、planning utility、sim-to-real、安全', '建立跨 Genie、JEPA、Marble、Cosmos 的评测矩阵'],
    ],
    project: 'World Model Evaluation Card：记录任务、环境、动作、预测跨度、失败模式与 sim-to-real 风险。',
    mastery: ['能把生成数据管线与机器人策略训练闭环连起来', '能区分视觉质量、物理一致性和规划效用', '能识别仿真偏差被策略放大的安全风险'],
    sources: ['NVIDIA · Cosmos', 'DreamerV3', 'V-JEPA 2'],
  },
]

const lessonEn = {
  'wm.0.1':['What is a world model, exactly?','state, observation, action, transition, prediction, and planning','Audit six “world model” projects with one consistent rubric'],
  'wm.0.2':['POMDPs: modeling a world you cannot fully observe','latent state, belief state, observation model, reward, and policy','Hand-calculate belief updates in a partially observable maze'],
  'wm.0.3':['Build the smallest working world model','GridWorld, action-conditioned dynamics, rollout, and model-predictive control','Train a next-state predictor and plan actions through imagination'],
  'wm.1.1':['Classic World Models: VAE + RNN + Controller','VAE, MDN-RNN, latent dynamics, controller, and dream rollout','Reproduce a compact latent-dynamics rollout'],
  'wm.1.2':['Dreamer: train an agent inside latent imagination','RSSM, reconstruction, reward prediction, imagined trajectories, and actor-critic','Compare learning from real trajectories with imagined rollouts'],
  'wm.1.3':['MuZero: learn only the dynamics planning needs','representation, dynamics, prediction, MCTS, value, and policy','Implement simplified model-based planning in a toy game'],
  'wm.2.1':['JEPA: why not predict pixels directly?','joint embeddings, context encoder, target encoder, predictor, and collapse prevention','Compare pixel reconstruction and representation-prediction objectives'],
  'wm.2.2':['V-JEPA 2: from video understanding to robot planning','self-supervised video, action conditioning, latent planning, and zero-shot control','Use official representations for video retrieval and design a planning evaluation'],
  'wm.3.1':['Genie 1→3: from latent actions to real-time worlds','video tokenization, latent actions, autoregressive dynamics, interaction, and consistency','Trace Genie’s evolution and design an action-control test'],
  'wm.3.2':['Fei-Fei Li, Marble, and spatial intelligence','persistent 3D, multimodal creation, navigation, editing, and the World API','Compare video generation, 3D reconstruction, and generative worlds'],
  'wm.4.1':['NVIDIA Cosmos and world foundation models','world foundation models, physical AI, synthetic data, post-training, and policy models','Design a Cosmos data and post-training pipeline for a robot task'],
  'wm.4.2':['Evaluate world models: from impressive to useful','controllability, long-horizon consistency, physics, planning utility, sim-to-real, and safety','Build an evaluation matrix across Genie, JEPA, Marble, and Cosmos'],
}

const moduleEn = {
  'world-foundations': ['From Language to Worlds','Definitions & State','Start with a strict boundary: a world model is not a synonym for video generation. It models state, action, and future consequences.','What state must a model retain to predict what follows an action?','World Model Audit: a reusable rubric and a GridWorld that predicts, rolls out, and plans.'],
  'world-dynamics': ['Learning and Planning in Imagination','Latent Dynamics','Compress visual observations, learn latent dynamics, and train behavior inside imagined trajectories.','Why can a model plan without reconstructing every pixel?','Latent Dynamics Lab: predict futures and measure error growth across rollout length.'],
  jepa: ['JEPA and Abstract World Representations','Predict Representations','Predict hidden and future content in representation space while ignoring unpredictable pixel detail.','What should a useful world representation predict—and intentionally ignore?','Representation Prediction Notebook: compare masked prediction in pixel and embedding space.'],
  'generative-worlds': ['Generate, Explore, and Edit Worlds','Genie & Spatial AI','Study action-controllable video worlds and persistent navigable 3D worlds through Genie and World Labs.','What separates realistic-looking generation from a persistent interactive world?','Interactive World Scorecard: evaluate control, permanence, geometry, memory, and editing.'],
  'physical-ai': ['Physical AI, Evaluation, and Frontiers','Physical AI','Connect world models to robotics, autonomous systems, synthetic data, sim-to-real, and safety.','How can a generated world reduce the cost and risk of learning in reality?','World Model Evaluation Card: document tasks, actions, horizons, failure modes, and sim-to-real risk.'],
}

const typeEn = { '地图':'Map', '代码':'Code', '理论':'Theory', '推导':'Derivation', '研读':'Paper Study', '系统':'Systems', '验收':'Assessment' }
const durationEn = value => value.replace('分钟',' min').replace('小时',' hours').replace('周',' weeks')

export function localizeWorldModules(locale) {
  if (locale === 'zh') return worldModules
  return worldModules.map(module => {
    const [title, short, summary, question, project] = moduleEn[module.id]
    return {
      ...module, title, short, summary, question, project, weeks: durationEn(module.weeks),
      mastery: module.mastery.map((_, index) => [
        'Distinguish world generation from models useful for prediction and planning',
        'Explain the module’s state, objective, and evaluation assumptions',
        'Design a controlled experiment that exposes a long-horizon failure',
      ][index]),
      lessons: module.lessons.map(lesson => {
        const en = lessonEn[lesson[0]]
        return [lesson[0], en[0], typeEn[lesson[2]] || lesson[2], durationEn(lesson[3]), en[1], en[2]]
      }),
    }
  })
}

export const worldResources = [
  { author:'David Ha & Jürgen Schmidhuber', title:'World Models', type:'研究', level:'奠基', phase:'隐空间动力学', url:'https://arxiv.org/abs/1803.10122', note:'用 VAE、MDN-RNN 与控制器建立经典世界模型心智框架。' },
  { author:'Danijar Hafner et al.', title:'DreamerV3', type:'研究', level:'主线', phase:'想象学习', url:'https://arxiv.org/abs/2301.04104', note:'理解 RSSM、imagined rollout 与统一配置下的强化学习。' },
  { author:'DeepMind', title:'MuZero', type:'研究', level:'主线', phase:'规划', url:'https://www.nature.com/articles/s41586-020-03051-4', note:'不重建观察，也能学习对 value、policy 和 search 有用的动力学。' },
  { author:'Yann LeCun', title:'A Path Towards Autonomous Machine Intelligence', type:'研究', level:'架构', phase:'JEPA / AMI', url:'https://openreview.net/forum?id=BZ5a1r-kVsf', note:'把感知、世界模型、记忆、代价与行动组织为完整认知架构。' },
  { author:'Meta AI', title:'V-JEPA 2', type:'研究', level:'前沿', phase:'视频 / 机器人', url:'https://ai.meta.com/research/vjepa/', note:'从大规模无标注视频表征，走到动作条件世界模型与机器人规划。' },
  { author:'Google DeepMind', title:'Genie 3', type:'研究', level:'前沿', phase:'可交互世界', url:'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/', note:'研究实时交互、动作响应、长时一致性与世界记忆的现实边界。' },
  { author:'Google DeepMind', title:'Project Genie', type:'动态', level:'产品实验', phase:'世界生成', url:'https://deepmind.google/blog/project-genie-experimenting-with-infinite-interactive-worlds/', note:'观察世界模型从受限研究演示走向可使用原型时新增的产品问题。' },
  { author:'World Labs', title:'Marble: A Multimodal World Model', type:'研究', level:'空间智能', phase:'3D 世界', url:'https://www.worldlabs.ai/blog/marble-world-model', note:'区分持久、可导航、可编辑世界与普通视频生成。' },
  { author:'World Labs', title:'World API', type:'文档', level:'实践', phase:'3D 世界', url:'https://www.worldlabs.ai/blog/announcing-the-world-api', note:'从文字、图像、全景和视频生成可探索世界的产品接口。' },
  { author:'NVIDIA', title:'Cosmos World Foundation Models', type:'研究', level:'Physical AI', phase:'机器人 / 自动驾驶', url:'https://research.nvidia.com/labs/cosmos-lab/', note:'把世界基础模型放进合成数据、后训练、仿真和策略学习管线。' },
]

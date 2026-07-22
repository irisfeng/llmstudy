export const GEO_UPDATED_AT = '2026-07-22'

const briefs = {
  '1.3': {
    zh: {
      question: '反向传播为什么要按逆拓扑顺序，并且用 += 累加梯度？',
      answer: '反向传播是从标量损失出发，沿计算图反向计算向量—雅可比积。一个节点只有在所有下游路径的梯度贡献都到齐后，才能把完整的上游梯度继续传给父节点，所以需要先拓扑排序、再逆序执行。若同一变量被多条路径使用，总导数等于各路径贡献之和，因此梯度必须累加而不能覆盖。',
      points: [
        '前向传播记录数值与依赖关系；反向传播只执行每个运算的局部导数规则。',
        '输出节点的梯度设为1，因为损失对自身的导数是1。',
        '共享参数、分支与重复使用都会产生多条梯度路径，必须求和。',
      ],
      boundaries: '拓扑顺序保证依赖正确，但不能保证导数实现正确；仍需用中心差分和可信框架对拍。有限差分步长过大或过小都会造成误判。',
      sources: [
        { title: 'Andrej Karpathy · micrograd', url: 'https://github.com/karpathy/micrograd' },
        { title: 'Neural Networks: Zero to Hero · micrograd', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0' },
        { title: 'PyTorch · Autograd mechanics', url: 'https://docs.pytorch.org/docs/stable/notes/autograd.html' },
      ],
    },
    en: {
      question: 'Why does backpropagation run in reverse topological order and accumulate gradients with +=?',
      answer: 'Backpropagation starts from a scalar loss and evaluates vector–Jacobian products backward through the computation graph. A node must receive every downstream contribution before it can pass its complete upstream gradient to its parents, so nodes run in reverse topological order. When one value affects the loss through several paths, the total derivative is the sum of those path contributions; gradients must accumulate rather than overwrite one another.',
      points: [
        'The forward pass records values and dependencies; the backward pass applies one local derivative rule per operation.',
        'The output gradient starts at 1 because the loss derivative with respect to itself is 1.',
        'Shared parameters, branches, and repeated use create multiple gradient paths that must be summed.',
      ],
      boundaries: 'Topological order fixes dependency timing, not an incorrect derivative rule. Verify operators with central differences and a trusted autodiff system; both very large and very small finite-difference steps can mislead.',
      sources: [
        { title: 'Andrej Karpathy · micrograd', url: 'https://github.com/karpathy/micrograd' },
        { title: 'Neural Networks: Zero to Hero · micrograd', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0' },
        { title: 'PyTorch · Autograd mechanics', url: 'https://docs.pytorch.org/docs/stable/notes/autograd.html' },
      ],
    },
  },
  '2.7': {
    zh: {
      question: 'BPE为什么能用有限词表表示任意文本？',
      answer: '字节级BPE先把文本表示成UTF-8字节，再反复把训练语料中最常见的相邻token对合并为新token。编码时按照学到的合并规则重放这一过程。因为最底层词表覆盖全部256种字节，即使一个字符、语言或代码片段从未在训练中出现，也仍能退回到字节序列，所以不会产生未知词。',
      points: [
        '合并次数决定词表大小；词表越大通常序列越短，但模型参数和稀有token也会增加。',
        '训练BPE学习的是压缩规则，不是词义边界；一个token不一定对应一个词。',
        'encode与decode必须严格往返，特殊token需要独立的权限和冲突处理。',
      ],
      boundaries: 'BPE结果还受Unicode规范化、预分词、正则规则和合并排序影响。比较不同tokenizer时，应同时报告词表、语料、压缩率和特殊token规则。',
      sources: [
        { title: 'Sennrich et al. · Neural Machine Translation of Rare Words with Subword Units', url: 'https://aclanthology.org/P16-1162/' },
        { title: 'Andrej Karpathy · minbpe', url: 'https://github.com/karpathy/minbpe' },
        { title: 'OpenAI · tiktoken', url: 'https://github.com/openai/tiktoken' },
      ],
    },
    en: {
      question: 'Why can BPE represent arbitrary text with a finite vocabulary?',
      answer: 'Byte-level BPE begins with UTF-8 bytes and repeatedly merges the most frequent adjacent token pair in its training corpus. Encoding replays the learned merge rules. Because the base vocabulary covers all 256 byte values, an unseen character, language, or code fragment can always fall back to bytes instead of becoming an unknown token.',
      points: [
        'The merge count sets vocabulary size: larger vocabularies often shorten sequences but add parameters and rare tokens.',
        'BPE learns compression rules, not semantic word boundaries; one token does not necessarily equal one word.',
        'Encode and decode must round-trip exactly, while special tokens need separate collision and permission rules.',
      ],
      boundaries: 'Results also depend on Unicode normalization, pre-tokenization, regex rules, and merge ordering. Compare tokenizers using vocabulary, corpus, compression ratio, and special-token policy together.',
      sources: [
        { title: 'Sennrich et al. · Neural Machine Translation of Rare Words with Subword Units', url: 'https://aclanthology.org/P16-1162/' },
        { title: 'Andrej Karpathy · minbpe', url: 'https://github.com/karpathy/minbpe' },
        { title: 'OpenAI · tiktoken', url: 'https://github.com/openai/tiktoken' },
      ],
    },
  },
  '3.2': {
    zh: {
      question: 'Q、K、V和缩放点积注意力到底在计算什么？',
      answer: 'Q、K、V是同一批token表示经过三组可学习线性投影得到的向量。Query表示当前位置要检索什么，Key表示每个位置可被怎样匹配，Value携带真正要聚合的信息。注意力先计算QKᵀ/√dₖ得到匹配分数，加上mask后做softmax，再用这些权重对V加权求和。',
      points: [
        'QKᵀ负责内容寻址，softmax把每一行变成和为1的权重，乘V完成信息聚合。',
        '除以√dₖ是为了控制点积方差，避免维度增大后softmax过早饱和、梯度变小。',
        '因果mask禁止当前位置读取未来token；它在softmax之前把非法位置设为负无穷。',
      ],
      boundaries: '“检索什么、提供什么”是帮助理解的心智模型，并非Q、K、V自带固定语义；它们的含义由训练任务和权重共同形成。注意力权重也不能直接等同于因果解释。',
      sources: [
        { title: 'Vaswani et al. · Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
        { title: 'PyTorch · scaled_dot_product_attention', url: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html' },
        { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
      ],
    },
    en: {
      question: 'What do Q, K, V, and scaled dot-product attention actually compute?',
      answer: 'Q, K, and V are learned linear projections of the same token representations. A Query describes what the current position is trying to retrieve, a Key describes how each position can be matched, and a Value carries the information to aggregate. Attention computes QKᵀ/√dₖ, adds a mask, applies softmax, and uses the resulting weights to form a weighted sum of V.',
      points: [
        'QKᵀ performs content addressing, softmax turns each row into weights summing to 1, and multiplication by V aggregates information.',
        'Division by √dₖ controls dot-product variance so larger head dimensions do not prematurely saturate softmax and shrink gradients.',
        'A causal mask blocks future tokens by assigning invalid positions negative infinity before softmax.',
      ],
      boundaries: '“What to retrieve” and “what to provide” are useful mental models, not fixed semantics built into Q, K, or V. Their meaning emerges from training, and attention weights alone are not a causal explanation.',
      sources: [
        { title: 'Vaswani et al. · Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
        { title: 'PyTorch · scaled_dot_product_attention', url: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html' },
        { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
      ],
    },
  },
  '3.5': {
    zh: {
      question: '一个现代 GPT 的 Transformer Block 如何更新残差流？',
      answer: '常见的 pre-norm GPT Block 依次执行 x = x + Attention(LayerNorm(x))，再执行 x = x + MLP(LayerNorm(x))。因果自注意力让每个位置只读取当前及更早的 token；MLP 则独立地变换每个位置的通道。两条残差支路把更新量加回主干，使信息和梯度能跨越许多层传播。',
      alignment: '视频对齐点：按 LayerNorm → 因果多头注意力 → 残差相加 → LayerNorm → GELU/MLP → 残差相加的顺序，逐项核对代码与张量形状。',
      points: [
        '注意力负责跨位置混合信息，MLP 负责在每个位置内部混合特征通道。',
        'pre-norm 把 LayerNorm 放在子层之前；原始 Transformer 论文采用的 post-norm 顺序不同。',
        '残差连接要求子层输出与 x 的形状一致；多头输出必须先拼接并投影回模型维度。',
      ],
      boundaries: '“Transformer Block”不是唯一固定配方。不同模型会改变归一化位置、激活函数、位置编码、注意力类型和偏置；实现时应以目标模型配置为准。Dropout 通常只在训练时启用。',
      sources: [
        { title: 'Raschka · LLMs from Scratch, Chapter 4', url: 'https://github.com/rasbt/LLMs-from-scratch/tree/main/ch04' },
        { title: 'Vaswani et al. · Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
        { title: 'PyTorch · TransformerEncoderLayer', url: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.TransformerEncoderLayer.html' },
      ],
    },
    en: {
      question: 'How does a modern GPT Transformer block update the residual stream?',
      answer: 'A common pre-norm GPT block applies x = x + Attention(LayerNorm(x)), followed by x = x + MLP(LayerNorm(x)). Causal self-attention lets each position read only itself and earlier tokens, while the MLP transforms the channels at each position independently. Both branches add their updates back to the residual stream, helping information and gradients travel through many layers.',
      alignment: 'Lecture alignment: trace LayerNorm → causal multi-head attention → residual add → LayerNorm → GELU/MLP → residual add, checking the code and tensor shapes at every step.',
      points: [
        'Attention mixes information across positions; the MLP mixes feature channels within each position.',
        'Pre-norm places LayerNorm before each sublayer; the original Transformer paper used a different post-norm order.',
        'A residual add requires matching shapes, so concatenated heads must be projected back to the model dimension.',
      ],
      boundaries: 'A “Transformer block” is not one immutable recipe. Models vary normalization order, activation, positional encoding, attention type, and biases; follow the target architecture’s configuration. Dropout is normally active only during training.',
      sources: [
        { title: 'Raschka · LLMs from Scratch, Chapter 4', url: 'https://github.com/rasbt/LLMs-from-scratch/tree/main/ch04' },
        { title: 'Vaswani et al. · Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
        { title: 'PyTorch · TransformerEncoderLayer', url: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.TransformerEncoderLayer.html' },
      ],
    },
  },
  '3.6': {
    zh: {
      question: 'GPT 的训练与生成为什么都建立在“预测下一个 token”上？',
      answer: '训练时，GPT 在因果掩码下并行处理一段 token，并用向右错一位的同一序列作为标签，对每个位置的下一个 token 计算交叉熵。生成时没有未来标签可用，模型只取最后一个位置的 logits，选择或采样一个 token，把它追加到上下文，再重复前向计算。两者学习的是同一个条件分布，只是执行方式不同。',
      alignment: '视频对齐点：在 Karpathy 的 build GPT 主线中，重点追踪数据批次 x/y 的一位偏移、三角 mask、logits reshape、cross-entropy 与逐 token generate 循环。',
      points: [
        '因果 mask 保证位置 t 不能看到 t 之后的标签，避免训练信息泄漏。',
        '训练可同时监督序列中的多个位置；生成必须把新 token 反馈给模型，按步自回归。',
        '温度、top-k 等只改变从 logits 选 token 的策略，不改变模型学到的 next-token 目标。',
      ],
      boundaries: '训练使用真实前缀，而生成逐渐依赖自己的输出，因此两者的输入分布并不完全相同。输入嵌入与输出权重绑定很常见但不是 GPT 的必要条件；上下文长度也受模型配置限制。',
      sources: [
        { title: "Andrej Karpathy · Let's build GPT", url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY' },
        { title: 'Andrej Karpathy · nanoGPT', url: 'https://github.com/karpathy/nanoGPT' },
        { title: 'Radford et al. · GPT-2 Technical Report', url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
      ],
    },
    en: {
      question: 'Why do both GPT training and generation reduce to next-token prediction?',
      answer: 'During training, GPT processes a token sequence in parallel under a causal mask and uses the same sequence shifted by one position as labels, computing next-token cross-entropy at every position. During generation there are no future labels, so the model takes logits at the final position, selects or samples one token, appends it to the context, and repeats. Both estimate the same conditional distribution but execute it differently.',
      alignment: "Lecture alignment: in Karpathy's build-GPT walkthrough, trace the one-token x/y shift, triangular mask, logits reshape, cross-entropy, and token-by-token generate loop.",
      points: [
        'The causal mask prevents position t from seeing later labels and leaking training information.',
        'Training supervises many sequence positions in parallel; generation feeds each new token back autoregressively.',
        'Temperature and top-k change how a token is selected from logits, not the next-token learning objective.',
      ],
      boundaries: 'Training receives ground-truth prefixes while generation increasingly consumes its own outputs, so their input distributions are not identical. Tying input and output weights is common but not required, and context length remains bounded by the model configuration.',
      sources: [
        { title: "Andrej Karpathy · Let's build GPT", url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY' },
        { title: 'Andrej Karpathy · nanoGPT', url: 'https://github.com/karpathy/nanoGPT' },
        { title: 'Radford et al. · GPT-2 Technical Report', url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
      ],
    },
  },
  '4.1': {
    zh: {
      question: '训练大模型前，如何估算参数量、显存和计算量？',
      answer: '先把预算拆成三张表：参数量由各矩阵形状相加；训练显存分别统计权重、梯度、优化器状态与激活值；计算量则按各算子的 FLOPs 累加。对标准稠密 Transformer，C ≈ 6ND 可作为训练计算量的粗略量级估算，其中 N 是参数量、D 是训练 token 数，但最终应以目标配置的算子级估算和实测峰值为准。',
      alignment: '课程对齐点：先手算一个小模型的参数矩阵，再分别记录参数/梯度/优化器/激活显存，最后用 profiler 对照估算，而不是只背“每参数多少字节”。',
      points: [
        '参数相关显存由精度和优化器决定；混合精度训练还可能保留主权重副本，不能套用统一字节数。',
        '激活显存随 batch、序列长度、层数和隐藏维度增长，activation checkpointing 用额外重算换取显存。',
        'FLOPs 预算回答总工作量，硬件利用率决定实际时间；通信、内存带宽与数据管线也会成为瓶颈。',
      ],
      boundaries: '6ND 忽略注意力的部分序列长度开销、词表投影、稀疏/MoE、重计算和通信，只适合作数量级检查。任何预算都应同时注明 dtype、优化器、并行策略、序列长度和 checkpointing 设置。',
      sources: [
        { title: 'Stanford CS336 · Language Modeling from Scratch', url: 'https://cs336.stanford.edu/spring2025/' },
        { title: 'Hoffmann et al. · Training Compute-Optimal LLMs', url: 'https://arxiv.org/abs/2203.15556' },
        { title: 'PyTorch · Activation Checkpointing', url: 'https://docs.pytorch.org/docs/stable/checkpoint.html' },
      ],
    },
    en: {
      question: 'How should you estimate parameter count, memory, and compute before training an LLM?',
      answer: 'Build three separate budgets: sum matrix shapes for parameter count; account independently for weights, gradients, optimizer state, and activations for training memory; and sum operator FLOPs for compute. For a standard dense Transformer, C ≈ 6ND is a useful order-of-magnitude training estimate, where N is parameter count and D is training tokens, but the final plan should use operator-level estimates and measured peaks for the target configuration.',
      alignment: 'Course alignment: hand-count a small model’s parameter matrices, separately record parameter/gradient/optimizer/activation memory, then compare the estimate with a profiler instead of memorizing one bytes-per-parameter rule.',
      points: [
        'Parameter-state memory depends on precision and optimizer; mixed precision may retain master weights, so no universal bytes-per-parameter number applies.',
        'Activation memory grows with batch, sequence length, layers, and width; activation checkpointing trades recomputation for memory.',
        'FLOPs estimate total work, while hardware utilization determines elapsed time; communication, bandwidth, and data loading can also bottleneck.',
      ],
      boundaries: 'The 6ND approximation omits some sequence-length attention cost, vocabulary projection, sparse/MoE behavior, recomputation, and communication. Always report dtype, optimizer, parallelism, sequence length, and checkpointing assumptions with a budget.',
      sources: [
        { title: 'Stanford CS336 · Language Modeling from Scratch', url: 'https://cs336.stanford.edu/spring2025/' },
        { title: 'Hoffmann et al. · Training Compute-Optimal LLMs', url: 'https://arxiv.org/abs/2203.15556' },
        { title: 'PyTorch · Activation Checkpointing', url: 'https://docs.pytorch.org/docs/stable/checkpoint.html' },
      ],
    },
  },
  '5.4': {
    zh: {
      question: 'DPO 如何不用单独训练奖励模型和在线强化学习就学习偏好？',
      answer: 'DPO 使用同一提示下的 chosen/rejected 回答对，比较当前策略对两者的对数概率差，并减去固定参考策略的对应差值，再通过带 β 温度的 logistic 损失提高 chosen 的相对优势。它把带 KL 约束的偏好优化改写成一个直接作用于语言模型的分类式目标，因此标准流程不需要单独拟合奖励模型或进行在线 rollout。',
      alignment: '视频对齐点：紧盯四项 log-prob——策略与参考模型各自对 chosen/rejected 的序列对数概率——以及它们如何组成 margin、乘 β、进入 log-sigmoid。',
      points: [
        '参考策略定义“不要偏离太远”的基线，训练时通常冻结，只更新当前策略。',
        'β 控制相对参考策略的偏好强度；它不是普通学习率，效果依赖数据和实现约定。',
        '损失使用回答 token 的条件对数概率，提示 token 通常不计入 chosen/rejected 的评分。',
      ],
      boundaries: 'DPO 简化了经典 RLHF 管线，但没有消除偏好数据偏差、标签噪声、长度效应或分布外退化。它优化成对相对偏好，并不自动保证事实性、安全性或所有群体的偏好一致。',
      sources: [
        { title: 'Rafailov et al. · Direct Preference Optimization', url: 'https://arxiv.org/abs/2305.18290' },
        { title: 'Hugging Face TRL · DPO Trainer', url: 'https://huggingface.co/docs/trl/dpo_trainer' },
        { title: 'Stanford CS336 · Language Modeling from Scratch', url: 'https://cs336.stanford.edu/spring2025/' },
      ],
    },
    en: {
      question: 'How does DPO learn preferences without a separate reward model and online RL loop?',
      answer: 'DPO takes chosen/rejected responses to the same prompt, compares their log-probability gap under the current policy, subtracts the corresponding gap under a fixed reference policy, and applies a β-scaled logistic loss that increases the chosen response’s relative advantage. This rewrites KL-constrained preference optimization as a classification-style objective on the language model, so the standard procedure needs neither a separately fitted reward model nor online rollouts.',
      alignment: 'Lecture alignment: track four log-probabilities—the policy and reference scores for both chosen and rejected sequences—and how they form a margin, get scaled by β, and enter log-sigmoid.',
      points: [
        'The reference policy supplies the baseline for limiting drift and is normally frozen while the current policy updates.',
        'β controls preference strength relative to the reference; it is not an ordinary learning rate and depends on data and implementation conventions.',
        'The loss scores conditional response-token log-probabilities; prompt tokens are normally excluded from chosen/rejected scoring.',
      ],
      boundaries: 'DPO simplifies the classic RLHF pipeline but does not remove preference-data bias, label noise, length effects, or out-of-distribution degradation. Pairwise relative preference optimization does not automatically guarantee factuality, safety, or agreement across groups.',
      sources: [
        { title: 'Rafailov et al. · Direct Preference Optimization', url: 'https://arxiv.org/abs/2305.18290' },
        { title: 'Hugging Face TRL · DPO Trainer', url: 'https://huggingface.co/docs/trl/dpo_trainer' },
        { title: 'Stanford CS336 · Language Modeling from Scratch', url: 'https://cs336.stanford.edu/spring2025/' },
      ],
    },
  },
  '6.2': {
    zh: {
      question: 'KV Cache 为什么能加速自回归解码，又为什么会吃掉大量显存？',
      answer: '生成第 t 个 token 时，过去 token 在每一层的 Key 和 Value 不会改变。KV Cache 保存这些张量，使模型只需为新 token 计算新的 Q、K、V，再让新 Query 读取缓存，而不用每一步重算整个前缀。对普通缓存，显存大致正比于 2 × 层数 × batch × 序列长度 × KV 头数 × head_dim × 每元素字节数，其中 2 表示 K 和 V。',
      alignment: '视频对齐点：把 prefill 与逐 token decode 分开画图，逐层标出新 Q、追加的新 K/V、读取的历史 K/V，并用模型配置实际代入缓存公式。',
      points: [
        'KV Cache 主要避免 decode 阶段重复计算历史 K/V；它不会消除首次 prefill 的完整计算。',
        '缓存随活动序列长度和并发请求增长；长上下文服务经常首先受 KV 显存而非权重显存限制。',
        'GQA/MQA 通过减少 KV 头数降低缓存，但 Query 头数可以保持更多。',
      ],
      boundaries: '公式假设每层保存完整、同精度的 K/V；滑动窗口、量化、offload、跨层共享和稀疏注意力都会改变结果。修改前缀、位置或 attention mask 时，旧缓存也未必可直接复用。',
      sources: [
        { title: 'Hugging Face Transformers · Cache Strategies', url: 'https://huggingface.co/docs/transformers/kv_cache' },
        { title: 'Raschka · LLMs from Scratch KV Cache', url: 'https://github.com/rasbt/LLMs-from-scratch/tree/main/ch04/03_kv-cache' },
        { title: 'Kwon et al. · PagedAttention and vLLM', url: 'https://arxiv.org/abs/2309.06180' },
      ],
    },
    en: {
      question: 'Why does a KV cache speed up autoregressive decoding, and why can it consume so much memory?',
      answer: 'When generating token t, the Keys and Values for earlier tokens do not change. A KV cache stores them at every layer, so the model computes new Q, K, and V only for the new token and lets its Query attend to cached history instead of recomputing the full prefix. For a conventional cache, memory is roughly proportional to 2 × layers × batch × sequence length × KV heads × head_dim × bytes per element, where 2 accounts for K and V.',
      alignment: 'Lecture alignment: diagram prefill separately from token-by-token decode, label the new Q, appended K/V, and historical K/V at each layer, then plug the actual model configuration into the cache formula.',
      points: [
        'KV caching mainly removes repeated historical K/V computation during decode; it does not eliminate full prompt prefill.',
        'Cache usage grows with active sequence length and concurrent requests, so long-context serving can become KV-memory-bound before weight-memory-bound.',
        'GQA and MQA reduce cache size by using fewer KV heads while retaining more Query heads.',
      ],
      boundaries: 'The formula assumes full, same-precision K/V at every layer. Sliding windows, quantization, offloading, cross-layer sharing, and sparse attention change it. A changed prefix, position scheme, or attention mask may also invalidate reuse.',
      sources: [
        { title: 'Hugging Face Transformers · Cache Strategies', url: 'https://huggingface.co/docs/transformers/kv_cache' },
        { title: 'Raschka · LLMs from Scratch KV Cache', url: 'https://github.com/rasbt/LLMs-from-scratch/tree/main/ch04/03_kv-cache' },
        { title: 'Kwon et al. · PagedAttention and vLLM', url: 'https://arxiv.org/abs/2309.06180' },
      ],
    },
  },
  '6.5': {
    zh: {
      question: 'vLLM 如何用 PagedAttention 和连续批处理提高服务吞吐？',
      answer: 'vLLM 把每条请求的 KV Cache 划分为固定大小的逻辑块，再通过块表映射到不连续的物理显存块。PagedAttention 在计算注意力时按映射读取这些块，从而减少因预留连续大空间造成的碎片和浪费。调度器再用连续批处理在请求到达、完成或生成新 token 时动态调整批次，让 GPU 更少等待。',
      alignment: '视频对齐点：区分三层概念——KV Cache 是数据，PagedAttention 是分块寻址机制，连续批处理是请求调度策略；分别画出块表和每个 decode step 的活动序列。',
      points: [
        '逻辑连续、物理不连续的块映射类似操作系统分页，可按需分配并共享部分缓存。',
        '减少缓存浪费通常允许同一显存容纳更多并发序列，从而提高可批处理的请求数。',
        '连续批处理在序列级动态进出批次，不必等待传统静态批次中最长请求全部结束。',
      ],
      boundaries: 'PagedAttention 解决的是 KV Cache 管理与访问，不等同于减少单次注意力算子 IO 的 FlashAttention。真实吞吐提升取决于模型、硬件、prompt/output 长度、并发、采样方式和延迟目标，论文倍数不能直接套到所有负载。',
      sources: [
        { title: 'Kwon et al. · PagedAttention and vLLM', url: 'https://arxiv.org/abs/2309.06180' },
        { title: 'vLLM · Paged Attention Design', url: 'https://docs.vllm.ai/en/latest/design/paged_attention/' },
        { title: 'vLLM Project · Source Repository', url: 'https://github.com/vllm-project/vllm' },
      ],
    },
    en: {
      question: 'How do PagedAttention and continuous batching improve vLLM serving throughput?',
      answer: 'vLLM divides each request’s KV cache into fixed-size logical blocks and maps them through a block table to non-contiguous physical GPU-memory blocks. PagedAttention follows that mapping while computing attention, reducing fragmentation and waste from reserving large contiguous regions. Its scheduler then uses continuous batching to update the batch as requests arrive, finish, or generate tokens, leaving the GPU idle less often.',
      alignment: 'Lecture alignment: separate three concepts—KV cache is the data, PagedAttention is the block-addressing mechanism, and continuous batching is the request scheduler—then draw both a block table and the active sequences at each decode step.',
      points: [
        'Logically contiguous but physically non-contiguous blocks resemble virtual-memory paging and support on-demand allocation and some sharing.',
        'Less cache waste can fit more concurrent sequences in the same memory, increasing the number of requests available for batching.',
        'Continuous batching admits and removes sequences dynamically instead of waiting for every request in a static batch to finish.',
      ],
      boundaries: 'PagedAttention addresses KV-cache management and access; it is not the same as FlashAttention reducing IO inside an attention kernel. Real throughput gains depend on model, hardware, prompt/output lengths, concurrency, sampling, and latency targets, so paper speedups do not transfer directly to every workload.',
      sources: [
        { title: 'Kwon et al. · PagedAttention and vLLM', url: 'https://arxiv.org/abs/2309.06180' },
        { title: 'vLLM · Paged Attention Design', url: 'https://docs.vllm.ai/en/latest/design/paged_attention/' },
        { title: 'vLLM Project · Source Repository', url: 'https://github.com/vllm-project/vllm' },
      ],
    },
  },
  '7.1': {
    zh: {
      question: '一个可控的 AI Agent 最小闭环由哪些步骤组成？',
      answer: '最小 Agent 循环是：接收目标与当前状态，模型决定直接回答、调用工具或停止；程序校验工具名、参数和权限后执行；把结果作为 observation 写回状态；模型据此选择下一步，直到达到成功条件、失败条件、预算上限或需要人工判断。关键不是循环次数，而是每一步都从环境取得可验证反馈。',
      alignment: '视频对齐点：把一次任务逐帧标成 goal/state → model decision → validated action → tool result/observation → updated state → stop，并明确哪些决策由模型做、哪些约束由代码强制。',
      points: [
        '模型负责处理不确定决策；代码负责权限、schema、超时、重试、预算和终止条件。',
        '预定义代码路径是 workflow；当模型动态决定步骤和工具时，系统才更接近 agent。',
        '工具结果是环境事实而不是模型记忆，必须被记录、解析并用于下一步判断。',
      ],
      boundaries: 'Agent 并非“让 LLM 无限循环”。开放任务会累积错误、成本和风险；生产系统需要沙箱、幂等工具、审计日志、最大步数，以及对付款、发布、删除等高影响动作的人工确认。固定流程足够时不应强行使用 Agent。',
      sources: [
        { title: 'Anthropic · Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
        { title: 'OpenAI · A Practical Guide to Building Agents', url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf' },
        { title: 'DeepLearning.AI · Agentic AI', url: 'https://www.deeplearning.ai/courses/agentic-ai/' },
      ],
    },
    en: {
      question: 'What steps make up the smallest controllable AI-agent loop?',
      answer: 'A minimal agent loop receives a goal and current state; the model decides whether to answer, call a tool, or stop; the program validates tool name, arguments, and permissions before execution; the result is written back as an observation; and the model chooses the next step until success, failure, a budget limit, or a need for human judgment. The essential feature is verifiable environmental feedback at every step, not the number of iterations.',
      alignment: 'Lecture alignment: label one task frame by frame as goal/state → model decision → validated action → tool result/observation → updated state → stop, distinguishing model choices from constraints enforced by code.',
      points: [
        'The model handles uncertain decisions; code enforces permissions, schemas, timeouts, retries, budgets, and termination.',
        'A predefined code path is a workflow; a system becomes more agent-like when the model dynamically chooses steps and tools.',
        'A tool result is environmental evidence, not model memory, and must be recorded, parsed, and used in the next decision.',
      ],
      boundaries: 'An agent is not “an LLM in an infinite loop.” Open-ended tasks compound errors, cost, and risk; production systems need sandboxes, idempotent tools, audit logs, step limits, and human approval for high-impact actions such as payments, publishing, or deletion. Prefer a fixed workflow when it is sufficient.',
      sources: [
        { title: 'Anthropic · Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
        { title: 'OpenAI · A Practical Guide to Building Agents', url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf' },
        { title: 'DeepLearning.AI · Agentic AI', url: 'https://www.deeplearning.ai/courses/agentic-ai/' },
      ],
    },
  },
  'wm.0.1': {
    zh: {
      question: '世界模型究竟是什么，为什么不能把视频生成模型都叫世界模型？',
      answer: '世界模型是智能体内部对环境状态及其变化规律的可学习模型：它根据历史观察形成状态表示，在给定动作或条件后预测未来，并让智能体用这些预测评估行动。视频生成器只要生成视觉上合理的帧即可；若缺少稳定状态、动作因果、长期一致性或规划用途，就不能仅凭“画面像世界”证明它是可用于决策的世界模型。',
      points: ['核心接口是状态、观察、动作与转移，而不是单纯的文字到视频。','真正的价值要由多步预测、反事实与规划任务验证。','像素生成、隐空间预测和3D世界都可能是实现路线，但名称不能代替能力证据。'],
      boundaries: '学界并没有唯一排他的定义；有些工作把大规模视频预测器称为世界模型。课程采用功能性判据：模型必须表达环境变化，并在控制、预测或规划中接受独立评测。',
      sources: [
        { title:'Ha & Schmidhuber · World Models', url:'https://arxiv.org/abs/1803.10122' },
        { title:'LeCun · A Path Towards Autonomous Machine Intelligence', url:'https://openreview.net/forum?id=BZ5a1r-kVsf' },
        { title:'Hafner et al. · DreamerV3', url:'https://arxiv.org/abs/2301.04104' },
      ],
    },
    en: {
      question: 'What is a world model, and why is every video generator not automatically one?',
      answer: 'A world model is a learned internal model of environmental state and change: it uses observation history to form a state representation, predicts futures under actions or conditions, and lets an agent evaluate behavior through those predictions. A video generator only needs visually plausible frames. Without stable state, action-conditioned consequences, long-horizon consistency, or demonstrated planning utility, world-like imagery alone does not establish a useful world model.',
      points: ['The core interface is state, observation, action, and transition—not merely text-to-video.','Multi-step prediction, counterfactual control, and planning provide stronger evidence than visual quality.','Pixel generation, latent prediction, and persistent 3D can all be implementation routes, but labels are not capability evidence.'],
      boundaries: 'Research uses several overlapping definitions, and some work calls large video predictors world models. This course uses a functional test: the model must represent environmental change and be independently evaluated for prediction, control, or planning.',
      sources: [
        { title:'Ha & Schmidhuber · World Models', url:'https://arxiv.org/abs/1803.10122' },
        { title:'LeCun · A Path Towards Autonomous Machine Intelligence', url:'https://openreview.net/forum?id=BZ5a1r-kVsf' },
        { title:'Hafner et al. · DreamerV3', url:'https://arxiv.org/abs/2301.04104' },
      ],
    },
  },
  'wm.2.2': {
    zh: {
      question: 'V-JEPA 2 如何从无动作标签视频学习，最后又用于机器人规划？',
      answer: 'V-JEPA 2 首先用大量图像和无动作标签视频做自监督预训练：context encoder 读取可见视频块，predictor 在抽象表征空间预测被遮挡或未来部分的 target 表征。随后再用少量带机器人动作的数据训练 action-conditioned world model，使候选动作序列能够在隐空间滚动预测；规划器比较预测目标与期望目标的距离，选择更合适的动作执行。',
      points: ['大规模预训练阶段学习视觉与运动表征，并不需要机器人动作标签。','动作条件后训练把“理解视频”转成“预测某个动作会造成什么变化”。','规划效用必须由新环境中的真实控制结果检验，视频 benchmark 不能替代机器人评测。'],
      boundaries: 'V-JEPA 2 展示的是特定机械臂设置中的零样本规划结果，不等于通用机器人智能；性能仍受本体、相机、动作空间、目标表示与规划搜索限制。',
      sources: [
        { title:'Meta AI · V-JEPA 2', url:'https://ai.meta.com/research/vjepa/' },
        { title:'V-JEPA 2 paper', url:'https://arxiv.org/abs/2506.09985' },
        { title:'Meta Research · V-JEPA 2 code', url:'https://github.com/facebookresearch/vjepa2' },
      ],
    },
    en: {
      question: 'How does V-JEPA 2 learn from action-free video and later support robot planning?',
      answer: 'V-JEPA 2 first pretrains self-supervised on large image and action-free video collections: a context encoder reads visible video regions and a predictor estimates masked or future target representations in embedding space. A smaller amount of robot interaction data then trains an action-conditioned world model. Candidate action sequences can be rolled forward in latent space, and a planner selects actions whose predicted representation best approaches the desired goal.',
      points: ['Large-scale pretraining learns visual and motion representations without robot action labels.','Action-conditioned post-training turns video understanding into predictions of action consequences.','Planning utility must be tested through physical control in new environments; video benchmarks are not a substitute.'],
      boundaries: 'V-JEPA 2 demonstrates zero-shot planning in a particular manipulation setup, not general-purpose robotics. Results remain constrained by embodiment, cameras, action space, goal representation, and the planning search procedure.',
      sources: [
        { title:'Meta AI · V-JEPA 2', url:'https://ai.meta.com/research/vjepa/' },
        { title:'V-JEPA 2 paper', url:'https://arxiv.org/abs/2506.09985' },
        { title:'Meta Research · V-JEPA 2 code', url:'https://github.com/facebookresearch/vjepa2' },
      ],
    },
  },
  'wm.3.1': {
    zh: {
      question: 'Genie 1 到 Genie 3 的核心演进是什么？',
      answer: 'Genie 1 的关键是从无动作标签视频中联合学习视频表示、潜在动作和动作条件动力学，让用户能控制生成的二维环境。Genie 2 把范围扩展到从图像生成多样的可控制三维环境，用于训练和评估智能体。Genie 3 进一步以文字生成可实时导航的世界，在720p、24 FPS下维持数分钟的一致性，并加入可提示的世界事件，但长期记忆与精确动作仍有限。',
      points: ['潜在动作模型从相邻视频变化中抽取可控制因素，避免依赖现成键盘标签。','演进重点从短时二维交互走向更通用的三维、实时和更长一致性。','评测必须分别观察动作响应、世界记忆、物体恒常性和长时漂移。'],
      boundaries: 'Genie 3 的公开材料主要是官方研究演示与产品原型信息，完整架构、训练数据和可复现实验尚不等同于开放论文与代码；课程不会把产品描述当成已独立验证的结论。',
      sources: [
        { title:'Genie: Generative Interactive Environments', url:'https://arxiv.org/abs/2402.15391' },
        { title:'Google DeepMind · Genie 2', url:'https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/' },
        { title:'Google DeepMind · Genie 3', url:'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/' },
      ],
    },
    en: {
      question: 'What changed fundamentally from Genie 1 through Genie 3?',
      answer: 'Genie 1 jointly learned video representations, latent actions, and action-conditioned dynamics from videos without action labels, enabling control of generated 2D environments. Genie 2 expanded toward diverse controllable 3D environments generated from images for agent training and evaluation. Genie 3 generates real-time navigable worlds from text, maintains minutes of consistency at 720p and 24 FPS, and adds promptable world events, while long memory and precise action spaces remain limited.',
      points: ['Latent action modeling extracts controllable factors from video changes without requiring keyboard labels.','The progression moves from short 2D interaction toward more general 3D, real-time generation, and longer consistency.','Evaluation should separate action response, world memory, object permanence, and long-horizon drift.'],
      boundaries: 'Public Genie 3 evidence is primarily official research demonstration and product-prototype material. Architecture, training data, and reproducibility are not yet equivalent to a fully open paper and codebase, so product claims are not treated as independently verified results.',
      sources: [
        { title:'Genie: Generative Interactive Environments', url:'https://arxiv.org/abs/2402.15391' },
        { title:'Google DeepMind · Genie 2', url:'https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/' },
        { title:'Google DeepMind · Genie 3', url:'https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/' },
      ],
    },
  },
  'wm.3.2': {
    zh: {
      question: 'World Labs 的空间智能与普通视频生成、3D重建有什么不同？',
      answer: '空间智能要求模型理解并生成可导航、可回访、可编辑的三维环境，而不只是输出固定视角的视频。Marble 接受文字、图像、全景、多视图或视频输入，生成具有一定空间持久性的世界，并可在网页中探索或导出。它也不同于只还原已有场景的3D重建：生成式世界可以创造和扩展未被完整观测的空间，但同时引入几何与真实性的不确定性。',
      points: ['视频生成主要优化时间上的画面序列，持久世界还要维护跨视角几何与对象状态。','3D重建强调忠实恢复已有场景，生成式世界还承担补全、创造与编辑。','真正的空间一致性要通过闭环相机轨迹、回访位置和几何测量验证。'],
      boundaries: '可导航不等于具有完整物理动力学；Marble 的场景生成与机器人可交互世界模型仍是不同层级。空间持久性、几何准确度和下游仿真适用性需要按任务分别评测。',
      sources: [
        { title:'World Labs · Marble', url:'https://www.worldlabs.ai/blog/marble-world-model' },
        { title:'World Labs · World API', url:'https://www.worldlabs.ai/blog/announcing-the-world-api' },
        { title:'World Labs · Spatial Intelligence', url:'https://www.worldlabs.ai/blog' },
      ],
    },
    en: {
      question: 'How does World Labs spatial intelligence differ from video generation and 3D reconstruction?',
      answer: 'Spatial intelligence requires models to understand and generate navigable, revisitable, editable 3D environments rather than a video from one prescribed camera path. Marble accepts text, images, panoramas, multi-view input, or video and creates spatially persistent worlds that can be explored on the web or exported. Unlike reconstruction, which recovers an observed scene, a generative world can invent and extend unobserved space, adding geometric and factual uncertainty.',
      points: ['Video generation models temporal imagery; persistent worlds must also maintain geometry and object state across viewpoints.','3D reconstruction prioritizes faithful recovery, while generative worlds also complete, create, and edit.','Spatial consistency needs closed camera loops, revisited locations, and geometric measurements—not screenshots alone.'],
      boundaries: 'Navigability does not imply a complete physical dynamics model. Marble scene generation and an action-interactive robotics world model remain different capability levels; persistence, geometry, and simulation fitness require task-specific evaluation.',
      sources: [
        { title:'World Labs · Marble', url:'https://www.worldlabs.ai/blog/marble-world-model' },
        { title:'World Labs · World API', url:'https://www.worldlabs.ai/blog/announcing-the-world-api' },
        { title:'World Labs · Spatial Intelligence', url:'https://www.worldlabs.ai/blog' },
      ],
    },
  },
  'wm.4.1': {
    zh: {
      question: 'NVIDIA Cosmos 如何把世界基础模型用于机器人和自动驾驶？',
      answer: 'Cosmos 把预训练世界基础模型、视频 tokenizer、后训练工具、护栏和数据管线组合成 Physical AI 平台。开发者可以用真实传感器或仿真数据进行领域后训练，生成或转换符合目标场景的视频与世界状态，扩大极端场景覆盖，再把这些数据用于感知或策略模型训练。最终收益必须通过真实留出环境中的任务成功率和安全指标验证。',
      points: ['世界基础模型是可适配的上游模型，不是拿来直接控制所有机器人的统一策略。','合成数据价值来自覆盖稀有场景、可控变化与标注效率，而不只是真实感。','闭环必须包含现实评测、分布偏差检测和安全故障注入。'],
      boundaries: '生成数据可能复制训练偏差、违反物理约束或遗漏关键长尾。Cosmos 的开放模型与工具降低实验门槛，但不能消除 sim-to-real gap；不同硬件、传感器和本体仍需独立验证。',
      sources: [
        { title:'NVIDIA · Cosmos', url:'https://www.nvidia.com/en-us/ai/cosmos/' },
        { title:'NVIDIA Research · Cosmos Lab', url:'https://research.nvidia.com/labs/cosmos-lab/' },
        { title:'Cosmos World Foundation Model Platform', url:'https://arxiv.org/abs/2501.03575' },
      ],
    },
    en: {
      question: 'How does NVIDIA Cosmos apply world foundation models to robotics and autonomous driving?',
      answer: 'Cosmos combines pretrained world foundation models, video tokenizers, post-training tools, guardrails, and data pipelines into a physical-AI platform. Developers adapt models with sensor or simulation data, generate or transform videos and world states to expand rare-scenario coverage, and use those outputs to train perception or policy models. The final value must be measured through task success and safety metrics in held-out real environments.',
      points: ['A world foundation model is an adaptable upstream model, not one universal robot-control policy.','Synthetic data is useful for controllable variation, rare-event coverage, and labeling efficiency—not realism alone.','A complete loop includes real-world evaluation, distribution-shift checks, and safety fault injection.'],
      boundaries: 'Generated data can reproduce training bias, violate physical constraints, or omit critical long-tail events. Open Cosmos models and tools lower experimentation costs but do not remove the sim-to-real gap; each hardware, sensor, and embodiment still needs independent validation.',
      sources: [
        { title:'NVIDIA · Cosmos', url:'https://www.nvidia.com/en-us/ai/cosmos/' },
        { title:'NVIDIA Research · Cosmos Lab', url:'https://research.nvidia.com/labs/cosmos-lab/' },
        { title:'Cosmos World Foundation Model Platform', url:'https://arxiv.org/abs/2501.03575' },
      ],
    },
  },
}

export const geoLessonIds = Object.keys(briefs)

export function getGeoBrief(id, locale = 'zh') {
  return briefs[id]?.[locale] || null
}

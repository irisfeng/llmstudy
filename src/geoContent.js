export const GEO_UPDATED_AT = '2026-07-11'

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
}

export const geoLessonIds = Object.keys(briefs)

export function getGeoBrief(id, locale = 'zh') {
  return briefs[id]?.[locale] || null
}

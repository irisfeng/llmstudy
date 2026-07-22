const typeEn = { '地图':'Map', '代码':'Code', '理论':'Theory', '推导':'Derivation', '实验':'Lab', '验收':'Assessment', '直觉':'Intuition', '诊断':'Diagnosis', '工程':'Engineering', '系统':'Systems', '研读':'Code Study' }

const lessonEn = {
  '0.1':['Map the LLM stack and how to learn it','pretraining, post-training, inference, and applications; parameters versus state','Trace one request from text to output tokens'],
  '0.2':['Python objects, iterators, and vectorized thinking','reference semantics, broadcasting, slicing, generators, and complexity','Count bigrams in batches without Python loops'],
  '0.3':['The linear algebra models actually use','vector spaces, matrix multiplication, basis changes, eigenvalues, and SVD intuition','Implement a NumPy linear layer and trace every shape'],
  '0.4':['Probability, information, and cross-entropy','conditional probability, expectation, entropy, KL divergence, and maximum likelihood','Derive and calculate NLL from a count distribution'],
  '0.5':['Derivatives, partials, and the chain rule','local slopes, Jacobians, computation graphs, and vector–Jacobian products','Hand-calculate every local derivative in a two-layer function'],
  '0.6':['PyTorch tensors and reproducible experiments','dtype, device, strides, autograd, and random seeds','Build a reproducible tensor-lab repository'],
  '0.7':['Mastery Gate 0: read a training loop','the data, forward, loss, backward, and update loop','Explain and repair three deliberately broken training loops'],
  '1.1':['A neuron is not magic: functions, parameters, activations','linear combinations, nonlinearity, expressiveness, and decision boundaries','Build a two-input neuron by hand'],
  '1.2':['The chain rule is a message-passing rule','local derivatives, upstream gradients, and gradient accumulation','Annotate every edge of a computation graph with its gradient'],
  '1.3':['Make gradients flow backward through a graph','dynamic DAGs, reverse-mode autodiff, and topological order','Implement Value, operators, and backward'],
  '1.4':['Gradient checking: verify before trusting code','finite differences, central differences, and error scales','Compare every operator against PyTorch'],
  '1.5':['From Value to Neuron, Layer, and MLP','parameter containers, module composition, and forward graphs','Build an MLP in 50 lines'],
  '1.6':['Losses, regularization, and SGD','margin loss, batches, weight decay, and learning rate','Train a two-moons classifier and plot its boundary'],
  '1.7':['Why neural networks fail to train','dead ReLUs, vanishing/exploding gradients, initialization, and activation statistics','Diagnose four broken networks'],
  '1.8':['Mastery Gate 1: rewrite micrograd closed-book','the minimal automatic-differentiation kernel from scratch','Implement, explain, and verify micrograd under time constraints'],
  '2.1':['Bigram: the smallest language model','counts, conditional distributions, sampling, and smoothing','Train and sample a name generator'],
  '2.2':['Negative log-likelihood: the model scorecard','likelihood, logarithms, NLL, and cross-entropy','Calculate mean NLL from a probability table'],
  '2.3':['Embeddings: place discrete symbols in space','lookup tables, dense representations, similarity, and context windows','Visualize character embeddings'],
  '2.4':['MLP language models and data splits','Bengio language models, train/dev/test, underfitting, and overfitting','Reproduce the makemore MLP'],
  '2.5':['Training deep nets: activations, gradients, BatchNorm','initialization scale, saturation, and BatchNorm train/eval behavior','Build an activation and gradient dashboard'],
  '2.6':['Manual backprop: become a Backprop Ninja','tensor-level backprop through cross-entropy, tanh, and BatchNorm','Backpropagate through the whole network without calling backward'],
  '2.7':['BPE: from bytes to subwords','UTF-8, pair merges, vocabulary, encode, and decode','Implement BasicTokenizer from scratch'],
  '2.8':['The hidden cost of tokenization','numbers, whitespace, multilingual text, special tokens, and compression','Compare tokenization pathologies across Chinese, English, and Japanese'],
  '2.9':['Mastery Gate 2: build minBPE + makemore','the complete tokenizer and language-model loop','Train on unseen data, evaluate, and explain failure cases'],
  '3.1':['Context aggregation: from averaging to attention','weighted aggregation and the motivation for queries, keys, and values','Replace a bigram model’s context mechanism step by step'],
  '3.2':['Scaled dot-product attention','similarity, scaling, masks, softmax, and tensor shapes','Implement single-head attention in NumPy'],
  '3.3':['Multi-head attention: read different relations in parallel','head splitting, concatenation, projection, and capacity','Implement and visualize multi-head attention'],
  '3.4':['Position, residual streams, and normalization','positional embeddings, pre-norm, and residual streams','Compare pre-norm and post-norm gradients'],
  '3.5':['Implement a Transformer block line by line','attention, MLP, dropout, and LayerNorm composition','Write a fully testable Transformer block'],
  '3.6':['GPT: autoregressive objectives and weight tying','causal language modeling, embedding tying, logits, and generation','Build miniGPT from scratch'],
  '3.7':['Sampling is not a random button','temperature, top-k, top-p, and repetition control','Build a phase map of sampling parameters'],
  '3.8':['Read GPT-2: configuration, parameter counts, weight loading','model configuration, state_dict, and weight transposition','Load official GPT-2 weights and align logits'],
  '3.9':['Reproduce 124M: from correct to fast','mixed precision, compile, FlashAttention, and gradient accumulation','Optimize throughput step by step with Karpathy'],
  '3.10':['Mastery Gate 3: draw and implement GPT closed-book','architecture, objective, training, and generation as one system','Whiteboard, implement, and train on a new corpus'],
  '4.1':['Budget before training: parameters, FLOPs, memory','parameter counts, activation memory, optimizer states, and MFU','Create a resource budget for a 7B model'],
  '4.2':['Data engineering: collect, clean, deduplicate, mix','quality filtering, MinHash, contamination, and mixtures','Build a traceable 1 GB training corpus'],
  '4.3':['Every control in the training loop','AdamW, warmup, cosine decay, clipping, and checkpoints','Ablate optimizers and learning rates'],
  '4.4':['Mixed precision and numerical stability','FP32, FP16, BF16, loss scaling, and overflow','Reproduce and fix NaN training'],
  '4.5':['GPUs, kernels, and the memory hierarchy','HBM, SRAM, arithmetic intensity, and roofline analysis','Profile an attention kernel'],
  '4.6':['FlashAttention and Triton fundamentals','IO-aware tiling, online softmax, and kernel fusion','Implement a simplified fused softmax'],
  '4.7':['Distributed training: DP, TP, PP, FSDP','communication topology, all-reduce, sharding, and pipeline bubbles','Choose a parallel strategy for different clusters'],
  '4.8':['Scaling laws and Chinchilla intuition','compute optimality, data/parameter ratios, and extrapolation risk','Fit a scaling curve to small-model runs'],
  '4.9':['Training observability and recovery','loss spikes, stragglers, checkpoints, and data drift','Design a training runbook'],
  '4.10':['Mastery Gate 4: from nanoGPT to small pretraining','data, resources, training, and evaluation as one system','Submit budgets, logs, incident review, and a reproducible run'],
  '5.1':['The gap between a base model and an assistant','pretraining distributions, chat templates, and behavior shaping','Compare base and instruct output distributions'],
  '5.2':['SFT: rewrite behavioral priors with demonstrations','instruction data, masks, packing, and chat templates','Run a small LoRA SFT'],
  '5.3':['Preference data and reward models','pairwise preferences, Bradley–Terry, and reward hacking','Train a tiny reward model'],
  '5.4':['DPO: preference optimization without a reward model','reference policies, KL control, and the DPO objective','Implement DPO loss from the equation'],
  '5.5':['PPO, GRPO, and RL post-training','policy gradients, advantage, KL control, and rollouts','Compare SFT, DPO, and RL on a toy task'],
  '5.6':['Evaluation: define “good” before optimizing','perplexity, task evaluation, LLM judges, contamination, and variance','Build a minimal evaluation harness'],
  '5.7':['Hallucination, calibration, and uncertainty','factuality, abstention, confidence, and RAG boundaries','Design a falsifiable hallucination benchmark'],
  '5.8':['Safety, red teaming, and system cards','threat models, jailbreaks, misuse, and risk registers','Red-team a small model'],
  '5.9':['Look inside activations: an interpretability entry point','probing, activation patching, circuits, and SAE intuition','Run an activation-patching experiment with TransformerLens'],
  '5.10':['Mastery Gate 5: defend a post-training plan','objective, data, algorithm, evaluation, and safety in one loop','Design and defend a complete customer-service model plan'],
  '6.1':['Prefill and decode: two different workloads','compute-bound versus memory-bound work, latency, and throughput','Profile one complete generation'],
  '6.2':['KV cache: trade memory for repeated compute','cache shapes, capacity, GQA/MQA, and long context','Implement cached attention'],
  '6.3':['Quantization: numbers, error, calibration','INT8/INT4, weight-only methods, GPTQ, AWQ, and GGUF','Compare quality and speed across four quantization methods'],
  '6.4':['llama.cpp: dissect local inference engineering','GGUF, mmap, CPU/GPU offload, and sampling','Deploy and benchmark on a Mac'],
  '6.5':['vLLM: PagedAttention and continuous batching','block tables, continuous batching, and scheduling','Deploy an OpenAI-compatible service'],
  '6.6':['Service reliability: limits, caching, degradation, observability','SLOs, queues, backpressure, prefix caching, and tracing','Design capacity for 100 QPS'],
  '6.7':['Mastery Gate 6: two deployments, one benchmark','compare edge and server deployment strategies','Report latency, throughput, cost, quality, and fault injection'],
  '7.1':['The minimal agent loop','observe–reason–act, environments, and termination','Write a tool loop without a framework'],
  '7.2':['Tool calling and structured output','schemas, validation, idempotency, and side effects','Implement a safe tool layer with retries'],
  '7.3':['Context engineering and memory','working context, retrieval, summaries, and memory policies','Compare three memory strategies'],
  '7.4':['Planning, reflection, and multi-agent systems','decomposition, search, critics, and coordination cost','Run ablations on a verifiable task'],
  '7.5':['Agent evaluation: from final answers to trajectories','task success, trajectories, tool errors, cost, and latency','Build a 30-task regression suite'],
  '7.6':['Production boundaries: permissions, safety, human oversight','least privilege, approvals, sandboxes, and audit','Threat-model a high-risk tool'],
  '7.7':['nanochat: understand a complete chat system','tokenizer, pretraining, midtraining, SFT, RL, and UI','Draw the repository’s end-to-end dependency graph'],
  '7.8':['Mastery Gate 7: final defense','unify model principles, training, deployment, and system design','Live demo, fault injection, technical defense, and reproducibility review'],
  '8.1':['MoE, MLA, and multi-token prediction','Mixture-of-Experts, routing, load balancing, MLA, and multi-token prediction','Dissect DeepSeek-V3 activation, KV compression, and objectives'],
  '8.2':['Reasoning models and reinforcement learning with verifiable rewards','RLVR, GRPO, outcome rewards, reasoning traces, and test-time compute','Reproduce reasoning RL on a verifiable task with a small model'],
  '8.3':['Long context is not one number','sparse attention, retrieval, positions, context rot, needles, and structured evaluation','Build a layered evaluation from retrieval to multi-hop reasoning'],
  '8.4':['DSpark: speculative generation and scheduling','parallel drafting, semi-autoregressive heads, prefix survival, and hardware-aware scheduling','Implement a prefix-survival scheduler under light and heavy load'],
  '8.5':['Diffusion and block-parallel language models','masked diffusion, parallel decoding, block diffusion, and quality-speed tradeoffs','Compare latency models for autoregressive, parallel, and diffusion drafting'],
  '8.6':['Post-training for agents','tool-use trajectories, task synthesis, verifiable environments, and process/outcome rewards','Design a replayable training and evaluation pipeline for a tool-using agent'],
}

const moduleEn = {
  foundations:{ title:'Before the Model', short:'Foundations', summary:'Build the mathematical, Python, and tensor foundations needed to reason about models rather than merely operate them.', question:'How do text, tensors, probability, gradients, and a training loop connect?', project:'Tensor & Probability Lab: a reproducible notebook suite with shape, gradient, and NLL checks.', mastery:['Trace a training loop end to end','Explain shapes and probability without hand-waving','Verify analytic results against code'] },
  autograd:{ title:'Neural Network Foundations', short:'Backprop', summary:'Move from scalar derivatives to a working neural network by building reverse-mode automatic differentiation.', question:'How does a local derivative become a parameter update?', project:'micrograd+: an audited scalar autograd engine with tests, visualizations, and failure cases.', mastery:['Explain reverse-mode autodiff','Implement a minimal engine closed-book','Diagnose gradient failures with evidence'] },
  language:{ title:'Language Becomes Probability', short:'Tokens & LMs', summary:'Progress from character counts and bigrams to MLP language models and a BPE tokenizer.', question:'How does text become discrete tokens and conditional probability?', project:'Tiny Language Lab: trainable tokenizers and character/subword language models.', mastery:['Derive a neural LM from a count baseline','Explain cross-entropy and perplexity','Implement BPE and analyze tokenizer pathologies'] },
  transformer:{ title:'From Attention to GPT', short:'Transformer', summary:'Derive attention, implement each Transformer component, and reproduce a compact GPT training path.', question:'How can every token read the right context without violating causality?', project:'miniGPT: a tested Transformer trained on a new corpus with an evaluation report.', mastery:['Trace every tensor shape through attention','Implement a Transformer block closed-book','Train, sample, and diagnose a small GPT'] },
  training:{ title:'Turn Training into a System', short:'Data & Scale', summary:'Connect data quality, numerical stability, hardware, distributed execution, and recovery.', question:'What turns a correct loop into an efficient, reproducible training system?', project:'Small Pretraining Run: data card, budget, logs, checkpoints, and incident review.', mastery:['Budget compute and memory','Profile bottlenecks with measurements','Design reproducible and recoverable runs'] },
  alignment:{ title:'Make the Model an Assistant', short:'Post-training', summary:'Connect SFT, preference learning, RL, evaluation, safety, and interpretability.', question:'How do we shape behavior without confusing proxy metrics for the goal?', project:'Post-training Design Review: defend a complete data, algorithm, evaluation, and safety plan.', mastery:['Explain SFT, DPO, and RL tradeoffs','Build a minimal evaluation harness','Identify reward and safety failure modes'] },
  inference:{ title:'Make Models Respond Fast and Reliably', short:'Inference', summary:'Understand prefill, decode, caches, quantization, serving, and production reliability.', question:'How do latency, throughput, memory, quality, and reliability trade off?', project:'Dual Deployment Benchmark: local and server inference under matched quality and load.', mastery:['Model KV-cache memory','Benchmark under realistic load','Design reliable serving capacity'] },
  agents:{ title:'From Models to Intelligent Systems', short:'Agents', summary:'Build auditable tool loops, memory, planning, evaluation, and production permission boundaries.', question:'How do we turn generation into a controlled, testable execution loop?', project:'Auditable Agent: replayable traces, safe tools, regression tasks, and a final defense.', mastery:['Implement an agent loop without a framework','Audit tools and trajectories','Defend a production system design'] },
  'frontier-llm':{ title:'Frontier LLM Systems', short:'2025–2026 Frontiers', summary:'Place reasoning models, sparse architectures, long context, and new decoding methods inside verifiable principles and system constraints.', question:'Which layer—architecture, data, post-training, test-time compute, or serving—caused each recent capability jump?', project:'Frontier Systems Review: reproduce one mechanism and judge it with a cost model and preserved failures.', mastery:['Attribute capability gains to a technical layer rather than a brand','Separate offline scores, single-user speed, and production throughput','Audit proxy metrics and contamination in reasoning, context, and agent evaluations'] },
}

const durationEn = value => value.replace('分钟',' min').replace('小时',' hours').replace('周',' weeks').replace('选看','Optional')

export function localizeModules(modules, locale) {
  if (locale === 'zh') return modules
  return modules.map(module => {
    const meta = moduleEn[module.id]
    return {
      ...module,
      ...meta,
      weeks: durationEn(module.weeks),
      lessons: module.lessons.map(lesson => {
        const translated = lessonEn[lesson[0]]
        return translated ? [lesson[0], translated[0], typeEn[lesson[2]] || lesson[2], durationEn(lesson[3]), translated[1], translated[2]] : lesson
      }),
    }
  })
}

export function localizeResources(resources, locale) {
  if (locale === 'zh') return resources
  const type = { '课程':'Course', '视频':'Video', '博客':'Blog', '代码':'Code', '文档':'Docs', '研究':'Research', '动态':'Updates' }
  return resources.map(resource => ({
    ...resource,
    type: type[resource.type] || resource.type,
    level: resource.level ? 'Curated' : '',
    phase: resource.phase.replaceAll('反向传播','Backprop').replaceAll('神经网络地基','Neural foundations').replaceAll('训练','Training').replaceAll('推理','Inference').replaceAll('评测','Evaluation').replaceAll('后训练','Post-training').replaceAll('代码','Code').replaceAll('课程','Course'),
    note: `Curated for ${resource.phase}. Use this source to cross-check the lesson’s derivation, implementation, and experiments.`,
  }))
}

export const sourceTypesFor = locale => locale === 'zh' ? ['全部','课程','视频','博客','代码','文档','研究','动态'] : ['All','Course','Video','Blog','Code','Docs','Research','Updates']

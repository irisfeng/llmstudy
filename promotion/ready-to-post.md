# 首月可直接发布的内容

## V2EX · 第 1 周

标题：做了一个免费、开源的 87 节 AI 系统课，想听听大家对课程结构的意见

正文：

我最近把自己学习 LLM 与 World Models 的路线整理成了一个免费、开源的中英双语网站。不是模型 API 合集，而是两条可以独立学习的路径：从反向传播、Token、Attention 和 GPT，一直到训练、推理与 Agent；以及从 POMDP、隐空间动力学到 JEPA、Genie 与空间智能。

目前有 87 节课，每节尽量包含：要解决的问题、机制拆解、最小实验、自测和掌握门。15 节核心课另外做了可以直接引用的答案、边界条件和一手来源。游客不登录也能学习，进度先保存在本机。

我最希望得到的不是 Star，而是两个具体反馈：课程顺序有没有明显断层？手机上学习长内容是否舒服？如果有事实错误，也欢迎直接指出来源。

https://llmstudy.shddai.net/zh/?utm_source=v2ex&utm_medium=community&utm_campaign=organic_launch&utm_content=build_in_public

## 掘金 · 第 2 周

标题：反向传播为什么必须逆拓扑？梯度为什么一定要用 `+=`？

文章开头：

很多人能调用 `loss.backward()`，却很难解释两个看似普通的实现细节：为什么节点要按逆拓扑顺序执行？为什么梯度不能直接赋值？

原因不是框架约定，而是计算图上的依赖关系。一个节点只有等所有下游路径的贡献都到齐后，才能把完整梯度继续传给父节点；同一变量若沿多条路径影响损失，总导数就是各路径贡献之和。因此正确实现必须先拓扑排序再逆序，并使用累加而非覆盖。

正文建议继续展开：一个分叉计算图手算、错误覆盖梯度的反例、中心差分检查，以及与 PyTorch autograd 对拍。完整实验与课程页：

https://llmstudy.shddai.net/zh/lesson/1-3-make-gradients-flow-backward-through-a-graph/?utm_source=juejin&utm_medium=article&utm_campaign=organic_launch&utm_content=backprop_deep_dive

## 知乎 · 第 3 周

适合回答的问题：Transformer 中的 Q、K、V 到底是什么？为什么注意力要除以根号 d_k？

回答骨架：

Q、K、V 不是三种预先规定好的语义，而是 token 表示经过三组可学习线性投影得到的向量。可以把 Query 暂时理解为“当前位置要找什么”，Key 是“每个位置如何被匹配”，Value 才是被聚合的信息。

注意力依次计算 `QKᵀ / √d_k`、加入 mask、做 softmax、再乘 V。缩放项控制点积方差，避免维度增大时 softmax 过早饱和；因果 mask 必须在 softmax 之前把未来位置变成负无穷。需要注意，注意力权重并不自动等同于因果解释。

带四 token 手算、张量 shape 和一手来源的课程页：

https://llmstudy.shddai.net/zh/lesson/3-2-scaled-dot-product-attention/?utm_source=zhihu&utm_medium=answer&utm_campaign=organic_launch&utm_content=qkv_explainer

## B站 · 第 4 周

标题：KV Cache 为什么加速大模型，却可能先吃光显存？60 秒讲清

口播骨架：生成下一个 token 时，历史 token 的 Key 和 Value 不会改变。KV Cache 把它们逐层保存，模型只计算新 token 的 Q、K、V，因此避免反复重算整个前缀。代价是显存大约随 `2 × 层数 × batch × 序列长度 × KV头数 × head_dim × 每元素字节数` 增长。这里的 2 就是 K 和 V。它加速的是 decode，不会消除第一次 prefill；GQA、量化、滑动窗口也会改变公式。

简介链接：

https://llmstudy.shddai.net/zh/lesson/6-2-kv-cache-trade-memory-for-repeated-compute/?utm_source=bilibili&utm_medium=video&utm_campaign=organic_launch&utm_content=kv_cache_short

## 视频号 / 朋友圈 · 第 4 周

文案：

把自己学习 AI 系统的路线做成了一个免费网站：87 节中英双语课，包含 LLM 与 World Models 两条独立路线。不是“收藏以后看”，每节都有实践、自测和掌握门。现在最需要的不是点赞，而是认真学习后的纠错和建议。

https://llmstudy.shddai.net/zh/?utm_source=wechat_video&utm_medium=video&utm_campaign=organic_launch&utm_content=course_intro

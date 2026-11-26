# NMR 分步讲解风格指南 / NMR walkthrough style guide

学自 nmr.tips 的解答写法（其印刷版解答的 1D、2D、偶合、综合四册，以及网页版"点一下出一步"的幻灯片形式）。只学方法，不抄题目、文字和图。
Learned from how nmr.tips writes its solutions (the printed 1D, 2D, coupling and mixed sets, and the click-to-advance slide format of the web version). Method only: no problems, wording or figures are copied.

## 0. 底线：数据必须真实 / Ground rule: the data must be real

- 每一个位移、J 值、相关峰，都必须来自用户自己的谱图或峰表，或者来自注明出处的实测数据。凭记忆写出来的"差不多的数"不算数据。
  Every shift, J value and cross peak must come from the user's own spectra or peak list, or from a cited measured source. A plausible number recalled from memory is not data.
- 动笔前先找来源，逐项核对；两份独立来源互相对一下更好。来源写进 `sources`，并写清每个来源具体给了哪些值。
  Find the source before writing and check item by item; two independent sources are better. List them in `sources`, stating exactly which values each one gives.
- 来源没给、但画图需要的值（常见的是 J 的赫兹数和 2D 里"理应有"的相关峰），用 `est`、`Jest`、`expected` 标出来，页面会显示 ≈ 和 *，并在该步的"核对"里说明。
  Values the source lacks but the picture needs (typically J in Hz and "should be there" 2D peaks) are flagged with `est`, `Jest`, `expected`; the page shows ≈ and *, and the step's check says so.
- 来源里没有的谱（例如 NOESY）不要画。可以说"这个实验能直接证明"，但不能假装做过。
  Do not draw a spectrum the source lacks (a NOESY, for example). Say that the experiment would prove the point; do not pretend it was run.
- 来源本身可能有错（学生报告尤其如此）。对不上的地方写明，不要悄悄"修正"成自己觉得对的数。
  Sources can be wrong, student reports especially. State the mismatch; do not silently replace it with the number you believe.
- 谱线形状是程序按峰表画的示意图。位移是真的，峰形不是原始谱。
  Line shapes are drawn by the program from the peak list. The shifts are real; the shapes are not the raw spectrum.

## 1. 核心：一次点击 = 一个推理动作 / One click = one reasoning move

每一步固定四拍，对应播放器的四个字段。
Every step has the same four beats, matching four fields of the player.

| 拍 Beat | 字段 | 写什么 What to write |
|---|---|---|
| 观察 Observe | `text` | 只说谱图上看得见的：δ、积分、裂分、J、哪个交叉峰。Only what is visible: δ, integral, multiplicity, J, which cross peak. |
| 依据 Rule | `rule` | 用到的规律，并给参考值。例："³J(E) ≈ 15 Hz，³J(Z) ≈ 10 Hz"。HMBC 要把键的路径写出来："H–C(1')–O–C(1)，三根键"。The rule used, with reference values. For HMBC write the bond path out. |
| 结论 So | `so` | 只加一个推论：一个片段、一根键、一个归属。Exactly one inference: a fragment, a bond, an assignment. |
| 核对 Check | `check` | 留有余地或交叉验证："指向 E"而不是"证明 E"；这个位移现在还不可靠，等取代基确定再说。Hedge or cross-check: "points to E", not "proves E". |

每步 2 到 4 句。一题 8 到 16 步。
2 to 4 sentences per step. 8 to 16 steps per problem.

## 2. 推理顺序 / Order of reasoning

1. **分子式与不饱和度** Formula and DBE. 把算式写在 `board` 上。
2. **清点氢谱** Inventory of the ¹H spectrum: 有几组信号，积分比写成 1 : 1 : 2 : 3 : 3，加起来是否等于分子式的 H 数。
3. **先排除不属于样品的峰** Set aside what is not the compound: 溶剂（CDCl₃ 中 CHCl₃ 约 7.26）、水（CDCl₃ 中约 1.55）、积分不成整数的杂质峰，并说明理由。
4. **选入口信号并说明为什么** Pick the entry signal and say why: 积分、裂分、位移三样都不含糊的那个（常是甲基双峰或三重峰），或者只有一种可能位置的独特多重峰。
5. **由偶合搭片段** Build fragments from couplings, 一步一个片段。J 相同的两组峰是邻居。
6. **碳谱和 DEPT** ¹³C / DEPT: 数碳、看对称性、由位移认官能团。
7. **HSQC**：给每个 H 配上 C。还没定位置时先用字母 a、b、c 暂称，结构清楚后再编号。没有交叉峰的碳是季碳。
8. **COSY**：按"对角峰 → 交叉峰 → 对角峰"一个峰一个峰地走，把链写成 H-4 → H-3 → H-2。对角线两侧信息相同。没有后续交叉峰说明链到头了。
9. **HMBC**：一次只用一个关键相关，跨过季碳和杂原子把片段接起来，其余的峰留到最后做交叉检查。
10. **立体化学** Stereochemistry: 由 J 值（E/Z，直立/平伏约 10 Hz）或 NOE。
11. **有歧义就比较候选结构** Compare candidates when ambiguous: 列出 a)、b)、c)，用位移增量估算或"应该出现却没出现的峰"逐个排除，最后写"只剩下……"。增量法只给参考值，要说明。
12. **收尾核对** Final check: 原子数、不饱和度、每个峰都归属，写出化合物名称。数据确实定不了的地方要直说，并建议能解决它的实验（例如选择性 1D TOCSY）。

## 3. 抓细节 / Fine points that make it work

- **没看到的峰也是证据** Predicted absences count: 先预言"这个峰在 COSY 里应当看不到"，再去确认。但只在预期峰本应很强时才可靠。
- **陷阱要点名** Name the traps: 非对映异位的 CH₂、假五重峰和假六重峰（两个 J 恰好接近）、屋顶效应和高级谱、¹⁹F 或 ³¹P 带来的额外裂分、偶然重叠（重叠不一定就是高级谱）。
- **拥挤区域就放大** Zoom into crowded regions，不要让读者在全谱里找。
- **数字的写法** Numbers: ¹H 的 δ 写两位小数（低场仪器一位），¹³C 一位或两位，J 用 Hz 写一位小数，统一用小数点。拿不准的写"t?"，不要装作确定。
- **表格跟着推理长** A running table: 列顺序为 δ、裂分和 J、积分、归属，行按 δ 从大到小，归属一栏随着步骤逐行填上。
- **交叉峰的叫法** Cross-peak names: COSY 写 H3/H4，HSQC 和 HMBC 写 H3/C1。
- **让读者先想** Make the reader predict: 关键一步先用 `ask` 抛出问题，再点一下才给答案。
- **语气** Tone: 像助教在黑板前讲，直接、口语化，可以有一点幽默；该提醒就提醒（"这里要小心"）。
- **用对称性省力** Use symmetry: 有 C₂ 轴就只讲半个分子，但要说出来。

## 4. 画面规则 / Screen rules

- 当前这一步在谱图上高亮，结论同时出现在结构上，两边一起动。
- 结构是长出来的：没推出来的原子和键不画，新出现的部分用强调色。
- 颜色固定：COSY 蓝，HSQC 绿，HMBC 橙，NOE 紫。箭头从 H 所在的碳指向相关的碳。
- 一屏学完：平板和电脑上整页不滚动，谱图在左，结构、讲解和按钮在右，归属表和全文放在谱图上方的标签里。
- 每步都有中文和英文，文字可切换中文、英文、双语。朗读每次只读一种语言（中文或英文），用设备系统自带的语音。
- 谱图若是模拟或示意的，在页脚写明。

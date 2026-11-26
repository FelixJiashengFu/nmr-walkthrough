---
name: nmr-step-walkthrough
description: Use for any NMR explanation or structure-solving answer. Builds a click-to-advance, bilingual (中文/EN) step-by-step web walkthrough with highlighted spectra, a growing structure, read-aloud and a transcript, using only real, sourced NMR data.
---

# NMR step walkthrough / NMR 分步讲解

Explain NMR problems as a click-to-advance web page ("点一下动一下"), not as a wall of text. Each click zooms and highlights one signal, grows the structure by one piece and shows a short bilingual explanation. The method is modelled on how nmr.tips writes its solutions. Learn the method only: never copy that site's problems, wording or figures.

## 0. Ground rule: the data must be real / 底线：数据必须真实

This rule outranks everything below.

- Every shift, J value and cross peak must come from the user's own spectra or peak list, or from a cited measured source that you actually read in this session. A plausible number recalled from memory is not data. 凭记忆写出来的"差不多的数"不算数据。
- Before writing steps, find the source and check item by item. Prefer two independent sources. List them in the spec's `sources`, each with `covers` stating exactly which values it gives.
- A value the source lacks but the picture needs (often J in Hz, or a 2D peak that "should be there") is flagged `est`, `Jest` or `expected`. The page then shows ≈ or *, and that step's Check says so.
- Never draw a spectrum type the source does not contain (for example a NOESY). Say which experiment would prove the point; do not pretend it was run.
- Sources can be wrong. State a mismatch openly instead of silently replacing it with the number you believe.
- If no real data can be found, stop and ask the user for their spectra or peak list. Do not build with invented data. The builder rejects a spec without `sources`.
- Line shapes are drawn by the program from the peak list. Shifts are real, shapes are schematic: the page says so.

## 1. How to build it

1. If the MCP tools `nmr_walkthrough_guide`, `validate_nmr_walkthrough` and `build_nmr_walkthrough` are available, call the guide once, write the JSON spec, validate, then build.
2. Otherwise use the builder bundled in this skill folder. Read `builder/SCHEMA.md` and `builder/examples/vanillin.json`, write a spec, and run `node builder/server.mjs --build spec.json out.html --standalone` (needs Node.js 18+, no other dependencies). The method is in `builder/STYLE-GUIDE.md`.
3. Otherwise hand-write one self-contained HTML page that meets the screen rules in section 5 and ends with a list of data sources.
4. Give the user the page: publish it as an artifact where that exists, otherwise give the file path. Fix every validator error and treat warnings (unassigned peaks, steps with no conclusion) as real problems.

## 2. One click = one reasoning move

Every step has four beats, in both Chinese and English:

- **观察 Observe** (`text`): only what is visible. δ, integral, multiplicity, J, which cross peak.
- **依据 Rule** (`rule`): the rule used, with reference values, e.g. ³J(E) ≈ 15 Hz, ³J(Z) ≈ 10 Hz. For HMBC write the bond path out: H–C(1')–O–C(1), three bonds.
- **结论 So** (`so`): exactly one inference: a fragment, a bond or an assignment.
- **核对 Check** (`check`): hedge or cross-check. Write "points to E", not "proves E". Say when a shift is not yet reliable.

2 to 4 sentences per step, 8 to 16 steps per problem. On key steps set `ask` so the reader predicts before the answer is revealed.

## 3. Order of reasoning

1. Formula and DBE, with the calculation on the board.
2. ¹H inventory: number of signal groups, integral ratio written 1 : 1 : 2 : 3 : 3, and whether it sums to the formula.
3. Set aside solvent, water and impurity signals, with the reason (non-integer integral, cannot fit the formula).
4. Pick the entry signal and say why: integral, multiplicity and shift all unambiguous, or a multiplet with only one possible position.
5. Build fragments from couplings, one fragment per step. Signals sharing a J are neighbours.
6. ¹³C and DEPT: count carbons, check symmetry, read functional groups from shifts.
7. HSQC: pair each H with its C. Use letters a, b, c before positions are known and number only afterwards. No cross peak means a carbon without H.
8. COSY: walk diagonal → cross peak → diagonal, one cross peak at a time, and write the chain (H-4 → H-3 → H-2). No further cross peak means the chain ends.
9. HMBC: one key correlation per step to join fragments across quaternary carbons and heteroatoms. Keep the rest for a final cross-check.
10. Stereochemistry from J values or NOE.
11. If ambiguous, list candidate structures and eliminate them with evidence (increment estimates, a signal that should appear but does not). Say that increments give only guide values.
12. Final check: atom count, DBE, every peak assigned, compound name. Where the data cannot decide, say so and name the experiment that would.

## 4. Fine points

- Predicted absences are evidence, but only where the expected peak should be strong.
- Name the traps: diastereotopic CH₂, pseudo-quintets and pseudo-sextets, roof effect and higher-order patterns, extra splitting from ¹⁹F or ³¹P, accidental overlap.
- Zoom into crowded regions.
- Numbers: ¹H δ to two decimals, ¹³C to one, J in Hz to one decimal, decimal points throughout. Mark uncertain readings with "?".
- Keep a running table: δ, multiplicity and J, integral, assignment, rows in descending δ, assignments filled in as steps proceed.
- Cross-peak names: H3/H4 for COSY, H3/C1 for HSQC and HMBC.
- Tone: a teaching assistant at the board. Direct, conversational, a little humour, explicit warnings.

## 5. Screen rules

- The highlighted region of the spectrum and the change on the structure appear together.
- The structure grows: atoms and bonds are not drawn until deduced, and new parts use the accent colour.
- Fixed colours: COSY blue, HSQC green, HMBC orange, NOE purple.
- Every step has Chinese and English. The page offers 中文 / EN / 双语, a read-aloud button (one language at a time, system voice) and a full transcript of all steps.
- The whole lesson fits one screen on a tablet in landscape: spectrum left, structure and step card right, table and transcript as tabs.
- The table and transcript end with the data sources and an explanation of the ≈ and * marks.
- Next and Back buttons, arrow keys, click on the spectrum to advance, and a progress bar that jumps to any step.

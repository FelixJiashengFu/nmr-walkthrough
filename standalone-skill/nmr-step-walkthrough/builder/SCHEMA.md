Pass one JSON object. Text fields accept a plain string or `{ "zh": "...", "en": "..." }` (use both). In text, `_{3}` is a subscript, `^{13}` a superscript and `**x**` bold.

```
{
  title, shortTitle?, formula?, prompt?, note?, answer?,      // answer is shown only on the step marked final
  sources: [{ label, url?, covers? }],                         // where the numbers were measured; covers says exactly which values each source gives. Shown under the table and the transcript. For the user's own spectra use the file or handout name as label (url optional)
  lang?: "both" | "zh" | "en",                                 // starting language, default both
  molecule: {
    atoms: [{ id, x, y, label?, el?, num?, numBelow?, numAt?: [dx, dy] }],  // x,y in any unit, y grows downward; label like "CH3"; label "" draws a bare vertex (ring carbons); numAt places the number, in px
    bonds: [{ a, b, order?: 1|2|3, id? }]                      // a bond WITH an id stays hidden until a step reveals it
  },
  spectra: [
    { id, kind: "1d", nucleus: "1H" | "13C" | ..., mhz?, range: [hi, lo], name?,
      peaks: [{ id, ppm, mult?: "s|d|t|q|quint|sext|sept|m|br" or combos like "dq", J?: [Hz,...], nH?, type?: "CH3", intensity?, lw?,
                est?: true,     // this shift is a typical literature value, not read from the cited spectrum: shown as "≈"
                Jest?: true }]  // same for J: shown as "J ≈"
    },
    { id, kind: "2d", type: "COSY" | "HSQC" | "HMBC" | "TOCSY" | "NOESY",
      x: { nucleus, range: [hi, lo], ref?: <1D spectrum id drawn as projection> }, y: { ... },
      peaks: [{ id, x, y, label?, weak?, expected?: true }] }   // expected: predicted from the structure, not listed by the source: grey dashed ring, label gets "*"
                       // COSY/TOCSY/NOESY: give one side, the mirror and diagonal are drawn for you
  ],
  steps: [{
    title,                      // what this click is about
    ask?,                       // question shown first; the next click reveals the rest
    text,                       // OBSERVE: what is seen in the highlighted region
    rule?,                      // RULE: the rule or reference value used
    so,                         // SO: the one inference this step adds
    check?,                     // CHECK: hedge, cross-check or trap
    board?: [lines],            // equations, e.g. the DBE calculation
    spectrum?: <spectrum id>,   // omit for a formula-only step
    zoom?: [hi, lo] | { x: [hi, lo], y: [hi, lo] },
    peaks?: [peak ids],         // highlighted in the spectrum and the table
    atoms?: [atom ids],         // ringed on the structure
    arrows?: [{ from, to, kind: "cosy" | "hsqc" | "hmbc" | "noe", bend?: 1 | -1 }],
    reveal?: { atoms?: [ids], bonds?: [bond ids] },   // the structure grows; nothing is drawn before it is deduced
    assign?: { <peak id>: "H-3" },                     // fills the running assignment table
    final?: true                // last step: shows the answer
  }]
}
```

Peak ids must be unique across all spectra. Bonds without an id appear as soon as both atoms are revealed.


## Data must be real

Every shift, J value and cross peak in a spec must come from the user's own spectra or peak list, or from a cited measured source listed in `sources`. Never fill a gap from memory and present it as measured. If a value is needed for the picture but the source does not give it, set `est` / `Jest` / `expected` so the page marks it, and say so in that step's `check`. Do not draw a spectrum type (NOESY, COSY ...) that the source does not contain. A spec without `sources` is rejected by validate and build. Only when the user explicitly accepts unverified data, set `unverified: true`; the page then shows a red "unverified" notice.

// Validate a walkthrough spec and render it into one self-contained HTML page.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const isText = v => typeof v === 'string' || (v && typeof v === 'object' && (typeof v.zh === 'string' || typeof v.en === 'string'));
const isRange = r => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite) && r[0] !== r[1];

export function validate(spec) {
  const errors = [], warnings = [];
  const err = m => errors.push(m), warn = m => warnings.push(m);
  if (!spec || typeof spec !== 'object') return { errors: ['spec must be an object'], warnings };
  if (!isText(spec.title)) err('title is required (string or {zh,en})');
  if (!Array.isArray(spec.spectra) || !spec.spectra.length) err('spectra must be a non-empty array');
  if (!Array.isArray(spec.steps) || !spec.steps.length) err('steps must be a non-empty array');
  if (errors.length) return { errors, warnings };

  const atomIds = new Set(), bondIds = new Set(), peakOwner = new Map(), spIds = new Set();
  if (spec.molecule) {
    for (const a of spec.molecule.atoms || []) {
      if (!a.id || !Number.isFinite(a.x) || !Number.isFinite(a.y)) err(`atom ${JSON.stringify(a.id)} needs id, x, y`);
      if (atomIds.has(a.id)) err(`duplicate atom id ${a.id}`);
      atomIds.add(a.id);
    }
    for (const b of spec.molecule.bonds || []) {
      if (!atomIds.has(b.a) || !atomIds.has(b.b)) err(`bond ${b.a}-${b.b} refers to an unknown atom`);
      if (b.id) bondIds.add(b.id);
    }
  } else warn('no molecule: the structure panel will be hidden');

  for (const sp of spec.spectra) {
    if (!sp.id) { err('every spectrum needs an id'); continue; }
    if (spIds.has(sp.id)) err(`duplicate spectrum id ${sp.id}`);
    spIds.add(sp.id);
    if (!Array.isArray(sp.peaks)) { err(`spectrum ${sp.id}: peaks must be an array`); continue; }
    if (sp.kind === '2d') {
      if (!sp.type) err(`spectrum ${sp.id}: 2D spectra need a type (COSY, HSQC, HMBC, ...)`);
      for (const ax of ['x', 'y']) if (!sp[ax] || !isRange(sp[ax].range) || !sp[ax].nucleus) err(`spectrum ${sp.id}: ${ax} needs {nucleus, range:[hi,lo]}`);
      for (const p of sp.peaks) if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) err(`spectrum ${sp.id}: peak ${p.id} needs numeric x and y`);
    } else {
      if (!sp.nucleus) err(`spectrum ${sp.id}: nucleus is required (e.g. "1H")`);
      if (!isRange(sp.range)) err(`spectrum ${sp.id}: range must be [hi, lo] in ppm`);
      for (const p of sp.peaks) {
        if (!Number.isFinite(p.ppm)) err(`spectrum ${sp.id}: peak ${p.id} needs numeric ppm`);
        if (p.mult && !/^(sext|sept|quint|br|[sdtqpm]|\s)+$/.test(p.mult)) warn(`peak ${p.id}: multiplicity "${p.mult}" is not understood and is drawn as a singlet`);
      }
    }
    for (const p of sp.peaks) {
      if (!p.id) { err(`spectrum ${sp.id}: every peak needs an id`); continue; }
      if (peakOwner.has(p.id)) err(`duplicate peak id ${p.id} (ids must be unique across all spectra)`);
      peakOwner.set(p.id, sp.id);
    }
  }
  for (const sp of spec.spectra) if (sp.kind === '2d') for (const ax of ['x', 'y'])
    if (sp[ax]?.ref && !spIds.has(sp[ax].ref)) err(`spectrum ${sp.id}: ${ax}.ref "${sp[ax].ref}" is not a spectrum id`);

  spec.steps.forEach((s, n) => {
    const at = `step ${n + 1}`;
    if (!isText(s.title)) err(`${at}: title is required`);
    if (!isText(s.text) && !isText(s.ask)) err(`${at}: needs text (the observation) or ask`);
    if (s.spectrum && !spIds.has(s.spectrum)) err(`${at}: unknown spectrum "${s.spectrum}"`);
    for (const id of s.peaks || []) {
      if (!peakOwner.has(id)) err(`${at}: unknown peak "${id}"`);
      else if (s.spectrum && peakOwner.get(id) !== s.spectrum) warn(`${at}: peak "${id}" belongs to ${peakOwner.get(id)}, not to the shown spectrum ${s.spectrum}; it is highlighted only in the table`);
    }
    for (const id of [...(s.atoms || []), ...(s.reveal?.atoms || [])]) if (!atomIds.has(id)) err(`${at}: unknown atom "${id}"`);
    for (const id of s.reveal?.bonds || []) if (!bondIds.has(id)) err(`${at}: unknown bond id "${id}"`);
    for (const a of s.arrows || []) if (!atomIds.has(a.from) || !atomIds.has(a.to)) err(`${at}: arrow ${a.from}→${a.to} refers to an unknown atom`);
    for (const id of Object.keys(s.assign || {})) if (!peakOwner.has(id)) err(`${at}: assign refers to unknown peak "${id}"`);
    if (s.zoom) {
      const sp = spec.spectra.find(x => x.id === s.spectrum);
      if (sp?.kind === '2d' ? !(isRange(s.zoom.x) || isRange(s.zoom.y)) : !isRange(s.zoom)) err(`${at}: zoom must be [hi,lo] for 1D or {x:[hi,lo],y:[hi,lo]} for 2D`);
    }
    if (!s.so && !s.ask && n > 0) warn(`${at}: no "so" conclusion; every step should end in one inference`);
    for (const k of ['title', 'text', 'so']) if (s[k] && typeof s[k] === 'object' && !(s[k].zh && s[k].en)) warn(`${at}: ${k} is missing zh or en`);
  });
  if (spec.molecule && spec.steps.some(s => s.reveal)) {
    const shown = new Set(spec.steps.flatMap(s => s.reveal?.atoms || []));
    const missing = [...atomIds].filter(a => !shown.has(a));
    if (missing.length) warn(`atoms never revealed: ${missing.join(', ')}`);
    const bshown = new Set(spec.steps.flatMap(s => s.reveal?.bonds || []));
    const bmissing = [...bondIds].filter(b => !bshown.has(b));
    if (bmissing.length) warn(`bonds with an id that are never revealed: ${bmissing.join(', ')}`);
  }
  const assigned = new Set(spec.steps.flatMap(s => Object.keys(s.assign || {})));
  const unassigned = spec.spectra.filter(sp => sp.kind !== '2d').flatMap(sp => sp.peaks.map(p => p.id)).filter(id => !assigned.has(id));
  if (unassigned.length) warn(`1D peaks never assigned: ${unassigned.join(', ')} (assign every peak, or say why it is solvent/impurity)`);
  if (!Array.isArray(spec.sources) || !spec.sources.length) {
    const m = 'no sources: every shift, J value and correlation must be traceable to measured data (the user\'s own spectra or peak list, or a cited source). Add sources:[{label,url?,covers}] and mark anything the source does not give with est / Jest / expected';
    if (spec.unverified === true) warn(m + '. Built as UNVERIFIED: the page carries a red notice'); else err(m + '. Never fill in numbers from memory. Only if the user explicitly accepts unverified data, set unverified:true (the page then carries a red notice)');
  }
  else for (const q of spec.sources) if (!q.label && !q.url) err('each source needs a label or url');
  if (!spec.steps.at(-1).final) warn('last step is not marked final:true (the verification step that shows the answer)');
  if (spec.steps.length < 6) warn('fewer than 6 steps: one click should carry one idea, so most problems need 8 to 16');
  return { errors, warnings };
}

export function build(spec, { format = 'artifact' } = {}) {
  const { errors, warnings } = validate(spec);
  if (errors.length) throw Object.assign(new Error('Invalid walkthrough spec:\n- ' + errors.join('\n- ')), { errors, warnings });
  const t = spec.shortTitle || (typeof spec.title === 'string' ? spec.title : spec.title.en || spec.title.zh);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let html = readFileSync(join(here, 'player.html'), 'utf8')
    .replace('__TITLE__', () => esc(t))
    .replace('/*__SPEC__*/null', () => JSON.stringify(spec).replace(/</g, '\\u003c'));
  if (format === 'standalone')
    html = '<!doctype html>\n<html lang="zh">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<style>body{margin:0}</style>\n' + html;
  return { html, warnings };
}

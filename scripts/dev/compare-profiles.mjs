/**
 * Dev tool: compares two saved profile runs (see motion-profile.mjs and scroll-profile.mjs) side by side.
 *
 *   node scripts/dev/compare-profiles.mjs baseline phase2 [--preset desktop|phone|tv] [--all]
 *
 * Motion: for each animated element, start / duration / travel / best-fit ease in A and B, flagging what changed.
 * Elements whose fit is poor in either run (RMSE above 3%, usually a dropped frame at the scene start) are marked "~"
 * because their duration and ease are not trustworthy; their travel and start still are. Then start stalls and the scroll
 * profile, if both runs have one.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [labelA, labelB, ...rest] = process.argv.slice(2);
if (!labelA || !labelB) throw new Error('usage: compare-profiles.mjs <labelA> <labelB> [--preset desktop|phone|tv] [--all]');
const presetIndex = rest.indexOf('--preset');
const preset = presetIndex >= 0 ? rest[presetIndex + 1] : 'desktop';
const showAll = rest.includes('--all');

const load = (label, kind) => {
  const file = resolve(`.shots/${label}/${kind}-${preset}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
};
const f = (x, d = 2) => (x === undefined ? '   -  ' : x.toFixed(d));

const a = load(labelA, 'motion');
const b = load(labelB, 'motion');
if (a && b) {
  console.log(`MOTION  ${labelA}  ->  ${labelB}   (${preset}: ${a.env.device}/${a.env.motion} rem ${f(a.env.rem)}px -> ${b.env.device}/${b.env.motion} rem ${f(b.env.rem)}px)`);
  console.log('series'.padEnd(20) + 'ch'.padEnd(8) + 'travel px'.padStart(18) + 'start s'.padStart(16) + 'duration s'.padStart(16) + '   ease');
  const key = (r) => `${r.series}|${r.channel}`;
  const byKeyB = new Map(b.results.map((r) => [key(r), r]));
  for (const ra of a.results) {
    const rb = byKeyB.get(key(ra));
    if (!rb) continue;
    const shaky = ra.rmse > 0.03 || rb.rmse > 0.03;
    const travelChanged = Math.abs(ra.travel - rb.travel) > Math.max(1.5, ra.travel * 0.03) && ra.unit !== 'opacity';
    const startChanged = Math.abs(ra.relativeStart - rb.relativeStart) > 0.02;
    const durChanged = !shaky && Math.abs(ra.duration - rb.duration) > 0.05;
    const easeChanged = !shaky && ra.ease !== rb.ease && Math.abs(ra.rmse - rb.rmse) > 0.004;
    if (!showAll && !(travelChanged || startChanged || durChanged || easeChanged)) continue;
    const mark = [travelChanged && 'travel', startChanged && 'start', durChanged && 'dur', easeChanged && 'ease'].filter(Boolean).join(',');
    const pair = (x, y, d = 2) => `${f(x, d)} -> ${f(y, d)}`.padStart(18);
    console.log(
      (ra.series.padEnd(20) + ra.channel.padEnd(8) + (ra.unit === 'opacity' ? ''.padStart(18) : pair(ra.travel, rb.travel, 1)) + pair(ra.relativeStart, rb.relativeStart, 3).padStart(16) + (shaky ? `~ ${f(ra.duration)} -> ${f(rb.duration)}`.padStart(16) : pair(ra.duration, rb.duration).padStart(16)) + `   ${ra.ease === rb.ease ? ra.ease : `${ra.ease} -> ${rb.ease}`}${shaky ? ' (shaky fit)' : ''}`) + (mark ? `   <-- ${mark}` : ''),
    );
  }
  if (!showAll) console.log('(only rows that changed; --all shows every row)');
  console.log('\nSTART STALLS: longest frame gap in the first 1.2 s of each scene (smooth = ~17 ms)');
  const stallsB = new Map(b.stalls.map((s) => [s.scene, s]));
  for (const sa of a.stalls) {
    const sb = stallsB.get(sa.scene);
    if (sb) console.log(`  ${sa.scene.padEnd(9)} ${String(Math.round(sa.maxGapMs)).padStart(4)} ms -> ${String(Math.round(sb.maxGapMs)).padStart(4)} ms     frames over 25 ms: ${sa.framesOver25ms} -> ${sb.framesOver25ms}`);
  }
}

const sa = load(labelA, 'scroll');
const sb = load(labelB, 'scroll');
if (sa && sb) {
  console.log(`\nSCROLL  ${labelA}  ->  ${labelB}   (${preset})`);
  const row = (name, x, y, d = 1) => console.log(`  ${name.padEnd(28)} ${f(x, d).padStart(9)} -> ${f(y, d).padStart(9)}`);
  row('frame gap p95 (ms)', sa.gapMs.p95, sb.gapMs.p95);
  row('frame gap p99 (ms)', sa.gapMs.p99, sb.gapMs.p99);
  row('frame gap max (ms)', sa.gapMs.max, sb.gapMs.max, 0);
  row('slow frames > 33 ms', sa.slowFrames.over33ms, sb.slowFrames.over33ms, 0);
  row('slow frames > 50 ms', sa.slowFrames.over50ms, sb.slowFrames.over50ms, 0);
  row('slow frames > 100 ms', sa.slowFrames.over100ms, sb.slowFrames.over100ms, 0);
  row('style recalc total (ms)', sa.blink.styleMs, sb.blink.styleMs, 0);
  row('script total (ms)', sa.blink.scriptMs, sb.blink.scriptMs, 0);
  console.log(`  slow frames by section: ${JSON.stringify(sa.slowFramesBySection)}  ->  ${JSON.stringify(sb.slowFramesBySection)}`);
}
if (!a && !sa) console.log(`no ${preset} profiles found for "${labelA}"`);

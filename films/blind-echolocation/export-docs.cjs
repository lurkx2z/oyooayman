/* =====================================================================
   EXPORT-DOCS — the written deliverables of "What If You Went Blind?", read from the page itself so they always match
   the film: subtitles (SRT + WebVTT) from the clips' real word times, the transcript, and the master timeline
   (scenes, narration, NO NARRATION gaps, every shot with its set and whether it carries the "slowed" label).
     NODE_PATH=$(npm root -g) node films/blind-echolocation/export-docs.cjs <out dir>
   Writes blind-echolocation.srt, blind-echolocation.vtt, TRANSCRIPT.md, timeline.json, TIMELINE.md.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || 'out');
const PAGE = path.resolve(__dirname, '../../blind-echolocation.html');

const tc = (s, sep) => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, x = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
// one or two lines of at most 42 characters, broken at the space nearest the middle
function lines(text) {
  if (text.length <= 42) return [text];
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2))) best = i;
  return [text.slice(0, best), text.slice(best + 1)];
}

(async () => {
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 320, height: 180 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + PAGE + '?capture&w=320&h=180');
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  const D = await p.evaluate(() => ({
    duration: BE.end,
    scenes: BN.scenes, phrases: BN.phrases,
    clips: BN.clips.map((c) => ({ id: c.id, scene: c.scene, file: c.file, start: c.start, speechEnd: c.speechEnd, seconds: c.seconds, gainDb: c.gainDb, text: c.text })),
    shots: BE_SHOTS.map((s) => ({ id: s.id, t0: s.t0, t1: Math.min(s.t1, BE.end), set: s.set, slowedLabel: !!s.tag })),
  }));
  await br.close();
  fs.mkdirSync(OUT, { recursive: true });
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // subtitles
  const subs = D.phrases.map((P) => ({ show: P.show, hide: P.hide, text: P.tokens.map((w) => w.text).join(' ') }));
  fs.writeFileSync(path.join(OUT, 'blind-echolocation.srt'), subs.map((s, i) => `${i + 1}\n${tc(s.show, ',')} --> ${tc(s.hide, ',')}\n${lines(s.text).join('\n')}\n`).join('\n'));
  fs.writeFileSync(path.join(OUT, 'blind-echolocation.vtt'), 'WEBVTT\n\n' + subs.map((s) => `${tc(s.show, '.')} --> ${tc(s.hide, '.')}\n${lines(s.text).join('\n')}\n`).join('\n'));

  // transcript
  let T = '# What If You Went Blind… And Learned to See With Sound?\n\nTranscript of the narration as it plays in the film (voice: Charlie). Times are film time.\n';
  for (const sc of D.scenes) {
    const c = D.clips.find((k) => k.scene === sc.n);
    T += `\n## ${sc.title}\n\n*${mmss(sc.start)}–${mmss(sc.end)} · narration ${mmss(c.start)}–${mmss(sc.speechEnd)} · then ${sc.gap.toFixed(1)} s with no narration*\n\n${c.text}\n`;
  }
  fs.writeFileSync(path.join(OUT, 'TRANSCRIPT.md'), T);

  // master timeline
  const TL = {
    title: 'What If You Went Blind… And Learned to See With Sound?', duration: r3(D.duration), fps: 30, size: [1920, 1080],
    scenes: D.scenes.map((sc) => {
      const c = D.clips.find((k) => k.scene === sc.n);
      return {
        n: sc.n, title: sc.title, start: r3(sc.start), end: r3(Math.min(sc.end, D.duration)),
        narration: { clip: c.file, start: r3(c.start), speechEnd: r3(sc.speechEnd), gainDb: c.gainDb },
        noNarration: { start: r3(sc.speechEnd), end: r3(Math.min(sc.end, D.duration)) },
        shots: D.shots.filter((s) => s.t0 < sc.end - 1e-6 && s.t1 > sc.start + 1e-6).map((s) => ({ ...s, t0: r3(s.t0), t1: r3(s.t1) })),
      };
    }),
  };
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(TL, null, 1));
  let M = `# Master timeline\n\n${TL.title} · ${mmss(TL.duration)} (${TL.duration} s) · 1920×1080 · 30 fps\n\nEach scene: a short lead-in, the narration clip, then the screenplay's NO NARRATION section. Shots marked *slowed* carry the on-screen label that the sound waves are slowed down.\n`;
  for (const sc of TL.scenes) {
    M += `\n## ${sc.title}  (${mmss(sc.start)}–${mmss(sc.end)})\n\nNarration ${mmss(sc.narration.start)}–${mmss(sc.narration.speechEnd)} (${sc.narration.clip}); no narration ${mmss(sc.noNarration.start)}–${mmss(sc.noNarration.end)}.\n\n| shot | from | to | set | |\n|---|---|---|---|---|\n`;
    for (const s of sc.shots) M += `| ${s.id} | ${mmss(s.t0)} | ${mmss(s.t1)} | ${s.set} | ${s.slowedLabel ? 'slowed' : ''} |\n`;
  }
  fs.writeFileSync(path.join(OUT, 'TIMELINE.md'), M);
  console.log(`${subs.length} subtitles · ${TL.scenes.length} scenes · ${D.shots.length} shots · ${mmss(TL.duration)} → ${OUT}`);
})();

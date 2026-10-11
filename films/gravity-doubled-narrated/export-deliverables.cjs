/* =====================================================================
   EXPORT DELIVERABLES — reads the film's own data from the running page and writes the timing deliverables:
     timeline.json   the master timeline: narration clips (start/end, speech end, every word), subtitle phrases,
                     shots and cuts, story beats, sound cues, the measured drop physics, the speech-free sections
     subtitles.srt   one cue per phrase, exactly when the narrator says it (same timing the page shows)
     subtitles.vtt   the same, with per-word timestamps
     NODE_PATH=$(npm root -g) node films/gravity-doubled-narrated/export-deliverables.cjs <out_dir>
   Everything comes from the page (window.GN / GB / GB_CUES / GB_SHOTS / the drop rig), so it always matches the film.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || '.');
const ROOT = path.resolve(__dirname, '..', '..');
const PAGE = 'gravity-doubled-narrated.html';

const ts = (t, sep) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  const p = (n, k = 2) => String(n).padStart(k, '0');
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(r, 3)}`;
};

(async () => {
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 270, height: 480 } });
  await p.goto('file://' + path.join(ROOT, PAGE) + '?capture&w=270&h=480', { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  const D = await p.evaluate(() => {
    const r3 = (x) => Math.round(x * 1000) / 1000;
    const beats = {}; for (const k in GB) beats[k] = Array.isArray(GB[k]) ? GB[k].map(r3) : r3(GB[k]);
    const app = FILM._app;
    return {
      title: 'What If Gravity Doubled? (narrated film test)', duration: r3(CONFIG.duration), fps: 30, width: 1920, height: 1080,
      voice: { id: GN.voice, name: 'Charlie', model: GN.model },
      narration: GN.clips.map((c) => ({ id: c.id, file: 'narration/' + c.file, text: c.text, start: c.start, end: c.end, speechEnd: c.speechEnd, seconds: c.seconds, lufsRaw: c.lufs, gainDb: c.gainDb, words: c.words })),
      subtitles: GN.phrases.map((P) => ({ clip: P.clip, show: P.show, hide: P.hide, text: P.tokens.map((t) => t.text).join(' '), words: P.tokens })),
      shots: GB_SHOTS.map((s) => ({ id: s.id, start: r3(Math.max(0, s.t0)), end: r3(Math.min(CONFIG.duration, s.t1)), outside: !!s.outside, experiment: !!s.exp })),
      beats,
      soundCues: GB_CUES.map(([t, id, what]) => ({ t: r3(t), id, what })),
      drop: { height_m: GB_DROP.h, lanes: app.drop.lanes.map((o) => ({ id: o.L.id, g_ms2: o.L.g, landT_s: r3(o.landT), impact_ms: r3(o.vImpact), release_film_s: r3(GB.drop), impact_film_s: r3(GB.drop + o.landT) })) },
      car: { sag1g_m: GB_CAR.sag1, tyre1g_m: GB_CAR.tyre1, extraDropAt2g_m: r3(GB_CAR.sag1 + GB_CAR.tyre1), rideFreq_Hz: GB_CAR.freq },
    };
  });
  await br.close();
  // the speech-free sections: everything between one line's last word and the next line's first word
  const silent = []; let prev = 0;
  for (const c of D.narration) { if (c.words[0].start - prev > 0.5) silent.push({ start: Math.round(prev * 1000) / 1000, end: c.words[0].start }); prev = c.speechEnd; }
  if (D.duration - prev > 0.5) silent.push({ start: prev, end: D.duration });
  D.speechFree = silent.map((s) => ({ ...s, seconds: Math.round((s.end - s.start) * 1000) / 1000 }));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(D, null, 1));
  const srt = D.subtitles.map((S, i) => `${i + 1}\n${ts(S.show, ',')} --> ${ts(S.hide, ',')}\n${S.text}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, 'subtitles.srt'), srt);
  const vtt = 'WEBVTT\n\n' + D.subtitles.map((S, i) => `${i + 1}\n${ts(S.show, '.')} --> ${ts(S.hide, '.')}\n` + S.words.map((w, k) => (k ? `<${ts(w.start, '.')}>` : '') + w.text).join(' ') + '\n').join('\n');
  fs.writeFileSync(path.join(OUT, 'subtitles.vtt'), vtt);
  console.log('wrote timeline.json, subtitles.srt, subtitles.vtt →', OUT);
  console.log('speech-free:', D.speechFree.map((s) => `${s.start}–${s.end} (${s.seconds} s)`).join(', '));
  console.log('drop:', D.drop.lanes.map((l) => `${l.id} ${l.landT_s} s @ ${l.impact_ms} m/s`).join(' · '));
})().catch((e) => { console.error(e); process.exit(1); });

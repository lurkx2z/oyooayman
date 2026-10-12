#!/usr/bin/env python3
"""MIX STEMS — measures, levels, sums and masters the five stems of a gravity-doubled-narrated mix (rendered by
render-stems.cjs). v2 uses mix-v2.js (the default), v3 uses mix-v3.js.

  python3 films/gravity-doubled-narrated/mix-stems.py <stems_dir> <timeline.json> <out_dir>
          [--mix mix-v3.js] [--name v3] [--ref v1=v1_mix.wav --ref v2=v2_mix.wav] [--write-gains | --use-gains]
  (--v1 <wav> is the same as --ref v1=<wav>)

1. ANALYSE every stem on its own (BS.1770 K-weighted loudness): integrated, in the spoken windows, in the speech-free
   windows, the loudest 400 ms, peaks; and the loudness of each named event (the set-down, the smashes, the step...).
2. LEVEL: one gain per stem from targets relative to the narrator (the voice sits at VO_TARGET in its spoken windows):
   music and ambience by their loudness in the speech-free sections, foley by its typical active level there, effects
   by their loudest moment. --write-gains stores the gains in the mix file, so the page's live render matches the export.
3. SUM the stems (each already ducked and shaped by the page's audio code), glue-compress gently (unless the mix file
   says glue: false), set the
   integrated loudness to the target and true-peak limit (4× oversampled) under the ceiling.
4. VERIFY and report: speech-to-background ratio per spoken window, the duck depth measured from the audio (needs the
   *_raw.wav stems), loudness when the narrator stops, peaks and limiter activity, and that the voice stem is silent
   in every speech-free section; the punch of each key impact over the sound just before it. Writes mix_<name>.wav,
   report.json and PNG plots.
Needs: Python 3 + numpy + Pillow, ffmpeg, node (to read the mix file).
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
STEMS = ['voice', 'music', 'amb', 'foley', 'sfx']
NAMES = {'voice': 'Narration', 'music': 'Music', 'amb': 'Ambience', 'foley': 'Movement (foley)', 'sfx': 'Physics / impacts'}
COL = {'voice': (120, 200, 255), 'music': (255, 190, 110), 'amb': (120, 220, 150), 'foley': (230, 140, 230), 'sfx': (255, 110, 100), 'mix': (240, 240, 240), 'v1': (110, 110, 110), 'v2': (200, 150, 90)}
MIXJS = os.path.join(HERE, 'mix.js')   # set from --mix in main()
KW = 'highshelf=f=1681.97:g=4.0:width_type=q:width=0.7071,highpass=f=38.14:width_type=q:width=0.5'
VO_TARGET = -16.0                     # the narrator's loudness in its spoken windows, before mastering
REL = {'music': -3.5, 'amb': -10.0, 'foley': -5.0, 'sfx': 1.0}   # targets relative to the narrator (LU), see LEVEL above


def ff(args, data=None):
    return subprocess.run(['ffmpeg', '-v', 'error', '-nostdin'] + args, input=data, capture_output=True, check=True).stdout


def load(path, af=None):
    a = ['-i', path] + (['-af', af] if af else []) + ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    return np.frombuffer(ff(a), np.float32).reshape(-1, 2).astype(np.float64)


def filt(x, af):
    a = ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', '-af', af, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    y = np.frombuffer(ff(a, x.astype(np.float32).tobytes()), np.float32).reshape(-1, 2).astype(np.float64)
    return y[:len(x)] if len(y) >= len(x) else np.vstack([y, np.zeros((len(x) - len(y), 2))])


def blocks(xk, win, hop, t0=0.0, t1=None):
    p = (xk ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(p)])
    W, H = int(win * SR), int(hop * SR)
    a, b = int(t0 * SR), int((t1 if t1 is not None else len(p) / SR) * SR)
    st = np.arange(a, max(a, min(b, len(p)) - W + 1), H)
    return (st + W / 2) / SR, (c[st + W] - c[st]) / W


def lu(ms):
    return -0.691 + 10 * np.log10(np.maximum(ms, 1e-20))


def integrated(xk, spans=None):
    ms = np.concatenate([blocks(xk, 0.4, 0.1, a, b)[1] for a, b in (spans or [(0, len(xk) / SR)])] or [np.zeros(0)])
    ms = ms[lu(ms) > -70]
    if not len(ms): return float('-inf')
    ms = ms[lu(ms) > lu(ms.mean()) - 10]
    return float(lu(ms.mean()))


def peak_db(x): return float(20 * np.log10(np.abs(x).max() + 1e-12))


def true_peak(path):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = o[o.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1)), float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1))


def write_wav(path, x, fmt='pcm_s24le'):
    ff(['-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', '-c:a', fmt, path], x.astype(np.float32).tobytes())


def read_mix_js():
    js = MIXJS
    out = subprocess.run(['node', '-e', f"global.window={{}};require({json.dumps(js)});console.log(JSON.stringify(window.GB_MIX))"], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def write_gains(gains):
    js = MIXJS; s = open(js).read()
    for k, g in gains.items(): s = re.sub(r'(\b%s: \{ gain: )-?[\d.]+' % k, lambda m: m.group(1) + f'{g:.1f}', s)
    open(js, 'w').write(s)


def write_trims(trims):
    js = MIXJS; s = open(js).read()
    for k, g in trims.items(): s = re.sub(r"('%s': )-?[\d.]+" % k, lambda m: m.group(1) + f'{g:.1f}', s)
    open(js, 'w').write(s)


def speech_windows(clips, merge):
    ws = []
    for c in clips:
        for i, w in enumerate(c['words']): ws.append([w['start'], max(w['end'], c['speechEnd']) if i == len(c['words']) - 1 else w['end']])
    ws.sort(); out = []
    for a, b in ws:
        if out and a - out[-1][1] < merge: out[-1][1] = max(out[-1][1], b)
        else: out.append([a, b])
    return out


# ------------------------------------------------------------------------------------------------------------ plots
class Plot:
    def __init__(self, dur, title, lo=-60, hi=-5, W=1800, H=520):
        self.dur, self.lo, self.hi, self.W, self.H, self.L = dur, lo, hi, W, H, 70
        self.img = Image.new('RGB', (W, H), (18, 14, 24)); self.d = ImageDraw.Draw(self.img)
        self.d.text((self.L, 6), title, fill=(235, 235, 235))
    def X(self, t): return self.L + (self.W - self.L - 12) * t / self.dur
    def Y(self, v): return 30 + (self.H - 80) * (self.hi - max(self.lo, min(self.hi, v))) / (self.hi - self.lo)
    def shade(self, spans, col=(42, 42, 74), label=None):
        for a, b in spans: self.d.rectangle([self.X(a), 30, self.X(b), self.H - 50], fill=col)
    def grid(self, step=10, unit='LUFS'):
        for v in range(int(self.hi // step * step), self.lo - 1, -step):
            self.d.line([self.L, self.Y(v), self.W - 12, self.Y(v)], fill=(62, 62, 62)); self.d.text((4, self.Y(v) - 6), f'{v} {unit}', fill=(170, 170, 170))
        for t in range(0, int(self.dur) + 1, 5): self.d.text((self.X(t) - 8, self.H - 44), f'{t}s', fill=(170, 170, 170))
    def line(self, ts, vs, col, w=2, gap=None):
        # gap: break the line where the points are more than `gap` seconds apart (no data there, e.g. a silent stem)
        seg, last = [], None
        for t, v in zip(ts, vs):
            if t > self.dur: break
            if gap and last is not None and t - last > gap:
                if len(seg) > 1: self.d.line(seg, fill=col, width=w)
                seg = []
            seg.append((self.X(t), self.Y(v))); last = t
        if len(seg) > 1: self.d.line(seg, fill=col, width=w)
    def marks(self, ev):
        for t, name in ev:
            self.d.line([self.X(t), 30, self.X(t), self.H - 50], fill=(90, 80, 60)); self.d.text((self.X(t) + 2, self.H - 66), name, fill=(200, 180, 140))
    def legend(self, items):
        x = self.L
        for name, col in items:
            self.d.rectangle([x, self.H - 22, x + 14, self.H - 10], fill=col); self.d.text((x + 18, self.H - 23), name, fill=(220, 220, 220)); x += 22 + 8 * len(name) + 20
    def save(self, p): self.img.save(p)


def main():
    a = sys.argv[1:]
    if len(a) < 3: print(__doc__); sys.exit(1)
    sdir, tlp, out = a[0], a[1], a[2]
    global MIXJS
    if '--mix' in a: MIXJS = os.path.join(HERE, a[a.index('--mix') + 1])
    NAME = a[a.index('--name') + 1] if '--name' in a else '3min'
    refs = [a[i + 1].split('=', 1) for i, k in enumerate(a) if k == '--ref'] + ([['v1', a[a.index('--v1') + 1]]] if '--v1' in a else [])
    os.makedirs(out, exist_ok=True)
    TL = json.load(open(tlp)); B = TL['beats']; DUR = TL['duration']
    M = read_mix_js()
    wins = speech_windows(TL['narration'], M['merge'])
    free = [(s['start'], s['end']) for s in TL['speechFree']]
    onset = {}
    for c in TL['narration']:   # where each clip's sound really starts (the aligner marks first words ≈50 ms late)
        x = load(os.path.join(HERE, c['file']))[:, 0]; k = int(0.01 * SR); r = np.sqrt((x[:len(x) // k * k].reshape(-1, k) ** 2).mean(1))
        onset[c['id']] = round(c['start'] + int(np.argmax(20 * np.log10(r + 1e-12) > -40)) * 0.01, 3)
    free = []; prev = 0.0
    for c in TL['narration']: free.append((prev, onset[c['id']])); prev = c['speechEnd']
    free.append((prev, DUR))
    big_free = [(s, e) for s, e in free if e - s >= 2.0]          # the real silent sequences (not the 0.66 s before the first word)
    lanes = {l['id']: l for l in TL['drop']['lanes']}
    sl = lambda te: B['replay'] + (te - B['replayFrom']) / B['replayRate']
    events = {   # name: (t0, t1, stem) — the moments whose loudness we check
        'Gravity doubles (the room settles)': (B['g'], B['g'] + 0.6, 'sfx'),
        'First set-down (too fast)': (B['cupDown1'] - 0.05, B['cupDown1'] + 0.4, 'sfx'),
        'The cup sticks, then scrapes free': (B['lift'], B['lift'] + 0.6, 'sfx'),
        '★ Cup set down on the saucer': (B['down'] - 0.05, B['down'] + 0.45, 'sfx'),
        'Clamps open': (B['drop'] - 0.02, B['drop'] + 0.2, 'sfx'),
        '★ 2 g ball lands (0.32 s)': (lanes['g2']['impact_film_s'], lanes['g2']['impact_film_s'] + 0.12, 'sfx'),
        '★ 1 g ball lands (0.45 s)': (lanes['g1']['impact_film_s'], lanes['g1']['impact_film_s'] + 0.12, 'sfx'),
        'Replay: slowed 2 g hit': (sl(lanes['g2']['landT_s']) - 0.05, sl(lanes['g2']['landT_s']) + 0.6, 'sfx'),
        'Chair slides back (standing up)': (B['stand'][0] - 0.55, B['stand'][0] + 0.3, 'sfx'),
        '★ First stair, under his weight': (B['step1'][0] + 0.6, B['step1'][0] + 1.2, 'sfx'),
        'Bicycle set down': (B['lift2'][1] + 0.3, B['lift2'][1] + 0.7, 'sfx'),
        'Effort grunt (cup lift)': (B['lift'], B['lift'] + 1.1, 'foley'),
        'Relief breath': (B['letGo'], B['letGo'] + 1.2, 'foley'),
        'Effort grunt (standing up)': (B['stand'][0] + 0.4, B['stand'][0] + 2.0, 'foley'),
        'Effort grunt (first stair)': (B['step1'][0], B['step1'][0] + 1.6, 'foley'),
        'The pull (helping her up)': (B['help'][0] + 0.8, B['help'][0] + 2.6, 'foley'),
    }
    marks = [(B['g'], 'g'), (B['down'], 'cup'), (B['s3'], 'S3'), (B['drop'], 'drop'), (B['s6'], 'S6'), (B['s7'], 'stairs'), (B['out'], 'outside'), (B['s9'], 'S9'), (B['s10'], 'S10'), (B['s11'], 'S11'), (B['s12'], 'S12')]

    # ---------------------------------------------------------------- 1. analyse
    X, K = {}, {}
    for s in STEMS:
        p = os.path.join(sdir, s + '.wav'); X[s] = load(p); K[s] = filt(X[s], KW)
    n = min(len(x) for x in X.values())
    for s in STEMS: X[s], K[s] = X[s][:n], K[s][:n]
    ana = {}
    for s in STEMS:
        t, ms = blocks(K[s], 0.4, 0.05); m = lu(ms)
        fr = np.zeros_like(t, bool)
        for a0, b0 in big_free: fr |= (t >= a0 + 0.2) & (t <= b0 - 0.2)
        act = m[fr & (m > -60)]
        ana[s] = {'peak_dBFS': round(peak_db(X[s]), 1), 'integrated': round(integrated(K[s]), 1),
                  'in_speech': round(integrated(K[s], wins), 1), 'speech_free': round(integrated(K[s], big_free), 1),
                  'momentary_max': round(float(m.max()), 1), 'momentary_max_at': round(float(t[m.argmax()]), 2),
                  'active_p90_speech_free': round(float(np.percentile(act, 90)), 1) if len(act) else None}
    # ---------------------------------------------------------------- 2. level
    Lv = ana['voice']['in_speech']
    gains = {'voice': VO_TARGET - Lv,
             'music': (VO_TARGET + REL['music']) - ana['music']['speech_free'],
             'amb': (VO_TARGET + REL['amb']) - ana['amb']['speech_free'],
             'foley': (VO_TARGET + REL['foley']) - ana['foley']['active_p90_speech_free'],
             'sfx': (VO_TARGET + REL['sfx']) - ana['sfx']['momentary_max']}
    gains = {k: round(float(v), 1) for k, v in gains.items()}
    # per-line voice trims: even the five lines out around their mean (as heard after the voice chain)
    pl_raw = {c['id']: integrated(K['voice'], [(c['words'][0]['start'], c['speechEnd'])]) for c in TL['narration']}
    mean = float(np.mean(list(pl_raw.values())))
    trims = {k: round(float((M.get('voiceTrim') or {}).get(k, 0) + (mean - v) * 0.9), 1) for k, v in pl_raw.items()}
    measured_gains = dict(gains)
    if '--use-gains' in a: gains = {k: float(M['stems'][k]['gain']) for k in STEMS}   # the final export uses exactly what the mix file says
    elif '--write-gains' in a: write_gains(gains); write_trims(trims)
    G = {s: 10 ** (gains[s] / 20) for s in STEMS}
    # ---------------------------------------------------------------- 3. sum + master
    pre = sum(X[s] * G[s] for s in STEMS)
    glued = filt(pre, 'acompressor=threshold=0.1995:ratio=1.5:attack=30:release=300:knee=2.8:makeup=1:detection=rms') if M.get('glue', True) else pre
    ceiling = M['ceiling']; lim = ceiling - 0.3; gain = M['target'] - integrated(filt(glued, KW)); master = None
    for it in range(8):   # the limiter shaves a little loudness: re-aim the gain and the limit until both targets hold
        y = filt(glued * 10 ** (gain / 20), f'aresample={SR * 4},alimiter=limit={10 ** (lim / 20):.5f}:attack=1:release=60:level=disabled:latency=1,aresample={SR}')
        tmp = os.path.join(out, '_tmp.wav'); write_wav(tmp, y, 'pcm_f32le')
        I, TP, LRA = true_peak(tmp)
        master = (y, gain, lim, I, TP, LRA)
        ok = TP <= ceiling and abs(I - M['target']) <= 0.1
        if ok: break
        if TP > ceiling: lim -= (TP - ceiling) + 0.1
        gain += M['target'] - I
    os.remove(os.path.join(out, '_tmp.wav'))
    y, mgain, mlim, I, TP, LRA = master
    final_end = int(DUR * SR)
    write_wav(os.path.join(out, f'mix_{NAME}.wav'), y)
    # ---------------------------------------------------------------- 4. verify
    yk = filt(y, KW)
    rest = filt(sum(X[s] * G[s] for s in STEMS if s != 'voice'), KW)
    vok = K['voice'] * G['voice']
    # speech vs everything else, per spoken window (400 ms momentary blocks where the voice is active)
    snr = []
    tv, msv = blocks(vok, 0.4, 0.05); tr, msr = blocks(rest, 0.4, 0.05)
    for a0, b0 in wins:
        sel = (tv >= a0) & (tv <= b0) & (lu(msv) > VO_TARGET - 20)
        d = lu(msv[sel]) - lu(msr[sel])
        snr.append({'window': [round(a0, 2), round(b0, 2)], 'median_LU': round(float(np.median(d)), 1), 'min_LU': round(float(d.min()), 1), 'below6_pct': round(float((d < 6).mean() * 100), 1)})
    # the duck depth, measured from the rendered audio: ducked stem ÷ the same stem rendered without ducking
    duck = {}
    for s in STEMS[1:]:
        rp = os.path.join(sdir, s + '_raw.wav')
        if not os.path.exists(rp): continue
        xr = load(rp)[:n]
        tt, a1 = blocks(X[s], 0.1, 0.05); _, a2 = blocks(xr, 0.1, 0.05)
        ok = lu(a2) > -65
        dd = np.where(ok, 10 * np.log10(np.maximum(a1, 1e-20) / np.maximum(a2, 1e-20)), np.nan)
        insp = np.zeros_like(tt, bool)
        for a0, b0 in wins: insp |= (tt >= a0 + 0.05) & (tt <= b0 - 0.05)
        far = np.ones_like(tt, bool)
        for a0, b0 in wins: far &= (tt < a0 - M['attack'] - M['lead'] - 0.1) | (tt > b0 + M['hold'] + M['release'] + 0.1)
        duck[s] = {'set_dB': M['stems'][s]['duck'], 'measured_under_speech_dB': round(float(np.nanmedian(dd[insp & ok])), 2), 'measured_away_from_speech_dB': round(float(np.nanmedian(dd[far & ok])), 2), 'curve': (tt, dd)}
    # loudness when the narrator stops: short-term (3 s) just before the last word vs the lowest point in the 4 s after
    ts, mss = blocks(yk, 3.0, 0.1); S3 = lu(mss)
    tm, msm = blocks(yk, 0.4, 0.05); Mm = lu(msm)
    stops = []
    for c in TL['narration']:
        e = c['speechEnd']
        if e > DUR - 3: continue
        before = float(np.interp(e - 0.2, ts, S3)); sel = (ts >= e + 0.5) & (ts <= e + 4)
        stops.append({'line': c['id'], 'speech_end': e, 'short_term_before': round(before, 1), 'lowest_after': round(float(S3[sel].min()), 1), 'drop_LU': round(before - float(S3[sel].min()), 1)})
    sec = []
    for (a0, b0) in [(0, DUR)] + [tuple(w) for w in wins] + big_free:
        sec.append({'span': [round(a0, 2), round(b0, 2)], 'kind': 'whole film' if (a0, b0) == (0, DUR) else ('speech-free' if (a0, b0) in big_free else 'narration'),
                    'integrated': round(integrated(yk, [(a0, b0)]), 1), 'short_term_min': round(float(S3[(ts >= a0 + 1.5) & (ts <= b0 - 1.5)].min()), 1) if b0 - a0 > 3.2 else None})
    # the voice stem in every speech-free section (must be silence: no narration, no clip tails)
    vfree = []
    for s0, e0 in free:
        seg = X['voice'][int((s0 + 0.1) * SR):int((e0 - 0.01) * SR)]
        vfree.append({'span': [s0, e0], 'voice_peak_dBFS': round(peak_db(seg), 1) if len(seg) else None, 'voice_rms_dBFS': round(float(10 * np.log10((seg ** 2).mean() + 1e-20)), 1) if len(seg) else None})
    subs_in_free = [p for p in TL['subtitles'] for s0, e0 in free if p['show'] < e0 - 0.08 and p['hide'] > s0 + 0.35]   # (a subtitle stays ≤0.3 s after its last word, for reading)
    sub_linger = [round(p['hide'] - max(w['end'] for w in p['words']), 2) for p in TL['subtitles']]
    # events
    ev = {}
    for name, (a0, b0, s) in events.items():
        t, ms = blocks(K[s] * G[s] * 10 ** (mgain / 20), 0.4, 0.02, max(0, a0 - 0.2), b0 + 0.2)
        _, msm2 = blocks(yk, 0.4, 0.02, max(0, a0 - 0.2), b0 + 0.2)
        ev[name] = {'stem': s, 'stem_momentary_max': round(float(lu(ms).max()), 1), 'mix_momentary_max': round(float(lu(msm2).max()), 1), 'mix_peak_dBFS': round(peak_db(y[int(a0 * SR):int(b0 * SR)]), 1)}
    # punch: how far each key impact rises above the sound just before it (the loudest 50 ms block in the first 0.2 s
    # of the hit, against the 1 s that ends 50 ms before it). Same measure for the reference mixes.
    hits = {'Gravity doubles': B['g'], 'Cup set down': B['down'], 'Clamps open': B['drop'], '2 g ball lands': lanes['g2']['impact_film_s'], '1 g ball lands': lanes['g1']['impact_film_s'],
            'First stair': B['step1'][0] + 0.7, 'Bicycle set down': B['lift2'][1] + 0.35}
    def punch(zk, t):
        _, mh = blocks(zk, 0.05, 0.005, t - 0.02, t + 0.25); bed = integrated(zk, [(max(0, t - 1.05), t - 0.05)]) if t > 1.2 else float('nan')
        _, mb = blocks(zk, 1.0, 1.0, max(0, t - 1.05), t - 0.05)
        hit = float(lu(mh).max()); bedl = float(lu(mb.mean())) if len(mb) else float('nan')
        return {'hit_LUFS_50ms': round(hit, 1), 'before_LUFS_1s': round(bedl, 1), 'punch_LU': round(hit - bedl, 1)}
    pun = {k: punch(yk, t) for k, t in hits.items()}
    per_clip = {c['id']: round(integrated(vok * 10 ** (mgain / 20), [(c['words'][0]['start'], c['speechEnd'])]), 1) for c in TL['narration']}
    lim_hits = float((np.abs(y) > 10 ** ((mlim - 0.5) / 20)).mean() * 100)
    rep = {'targets': {'voice_in_speech': VO_TARGET, 'relative_LU': REL, 'integrated': M['target'], 'true_peak_ceiling': ceiling},
           'stems_measured_at_0dB': ana, 'stem_gains_dB': gains, 'stem_gains_from_targets_dB': measured_gains, 'voice_trims_dB': (M.get('voiceTrim') if '--use-gains' in a else trims), 'master': {'gain_dB': round(mgain, 2), 'limiter_dBFS': round(mlim, 2), 'integrated_LUFS': I, 'true_peak_dBTP': TP, 'LRA': LRA, 'samples_near_limit_pct': round(lim_hits, 3)},
           'speech_windows': [[round(a0, 3), round(b0, 3)] for a0, b0 in wins], 'speech_to_background': snr,
           'ducking': {k: {kk: vv for kk, vv in v.items() if kk != 'curve'} for k, v in duck.items()}, 'when_the_narrator_stops': stops, 'sections': sec,
           'voice_in_speech_free_sections': vfree, 'speech_free_sections': [[round(a0, 3), round(b0, 3)] for a0, b0 in free], 'subtitles_in_speech_free_sections': len(subs_in_free), 'subtitle_linger_s': sub_linger, 'narration_loudness_per_line': per_clip, 'events': ev, 'punch': pun,
           'short_term_percentiles': {p: round(float(np.percentile(S3[S3 > -70], p)), 1) for p in (5, 10, 50, 90, 95)}}
    refc = {}
    rep['refs'] = {}
    for lab, path in refs:
        v = load(path)[:n]; vk = filt(v, KW)
        t1, m1 = blocks(vk, 3.0, 0.1); refc[lab] = (t1, lu(m1))
        R = rep['refs'][lab] = {'integrated': round(integrated(vk), 1), 'in_speech': round(integrated(vk, wins), 1), 'speech_free': round(integrated(vk, big_free), 1), 'peak_dBFS': round(peak_db(v), 1),
             'true_peak_LRA': true_peak(path),
             'sections': [{'span': x['span'], 'kind': x['kind'], 'integrated': round(integrated(vk, [tuple(x['span'])]), 1), 'short_term_min': round(float(lu(m1)[(t1 >= x['span'][0] + 1.5) & (t1 <= x['span'][1] - 1.5)].min()), 1) if x['span'][1] - x['span'][0] > 3.2 else None} for x in sec],
             'events': {name: round(float(lu(blocks(vk, 0.4, 0.02, max(0, a0 - 0.2), b0 + 0.2)[1]).max()), 1) for name, (a0, b0, st) in events.items()},
             'punch': {k: punch(vk, t) for k, t in hits.items()},
             'short_term_percentiles': {p: round(float(np.percentile(lu(m1)[lu(m1) > -70], p)), 1) for p in (5, 10, 50, 90, 95)}, 'when_the_narrator_stops': []}
        for c in TL['narration']:
            e = c['speechEnd']
            if e > DUR - 3: continue
            before = float(np.interp(e - 0.2, t1, lu(m1))); sel = (t1 >= e + 0.5) & (t1 <= e + 4)
            R['when_the_narrator_stops'].append({'line': c['id'], 'drop_LU': round(before - float(lu(m1)[sel].min()), 1)})
    json.dump(rep, open(os.path.join(out, 'report.json'), 'w'), indent=1)
    # ---------------------------------------------------------------- plots
    pl = Plot(DUR, f'{NAME} stems after levelling and ducking: momentary loudness (400 ms) of each stem; shaded = the narrator is speaking')
    pl.shade(wins); pl.grid(); pl.marks(marks)
    for s in STEMS:
        t, ms = blocks(K[s] * G[s] * 10 ** (mgain / 20), 0.4, 0.05); pl.line(t, lu(ms), COL[s], 2)
    pl.legend([(NAMES[s], COL[s]) for s in STEMS]); pl.save(os.path.join(out, f'stems_{NAME}.png'))
    labs = [lab for lab, _ in refs]
    pl = Plot(DUR, 'Final mix: short-term loudness (3 s), ' + ', '.join(labs + [NAME + ' (white)']) + '; shaded = narration', lo=-40, hi=-5)
    pl.shade(wins); pl.grid(5); pl.marks(marks)
    for lab in labs: pl.line(*refc[lab], COL.get(lab, (150, 150, 150)), 3)
    pl.line(ts, S3, COL['mix'], 3)
    pl.legend([(lab, COL.get(lab, (150, 150, 150))) for lab in labs] + [(NAME, COL['mix'])]); pl.save(os.path.join(out, '_vs_'.join(labs + [NAME]) + '_loudness.png'))
    # the same, momentary (400 ms): shows the hits and the quiet moments the 3 s curve smooths over
    pl = Plot(DUR, 'Momentary loudness (400 ms), ' + ', '.join(labs[-1:] + [NAME + ' (white)']) + '; shaded = narration', lo=-45, hi=-5)
    pl.shade(wins); pl.grid(5); pl.marks(marks)
    for lab, path in refs[-1:]:
        tq, mq = blocks(filt(load(path)[:n], KW), 0.4, 0.05); pl.line(tq, lu(mq), COL.get(lab, (150, 150, 150)), 2)
    pl.line(tm, Mm, COL['mix'], 2)
    pl.legend([(lab, COL.get(lab, (150, 150, 150))) for lab in labs[-1:]] + [(NAME, COL['mix'])]); pl.save(os.path.join(out, f'momentary_{NAME}.png'))
    if duck:
        # (the plot font has no minus sign or division sign: plain ASCII in the title)
        title = 'Ducking measured from the rendered stems (ducked / un-ducked, 100 ms blocks; gaps = stem silent): ' + ', '.join(f"{NAMES[s].split(' ')[0].lower()} {M['stems'][s]['duck']:g} dB" for s in duck)
        pl = Plot(DUR, title, lo=-9, hi=1, H=380)
        pl.shade(wins); pl.grid(1, 'dB')
        for s, v in duck.items():
            tt, dd = v['curve']; ok = ~np.isnan(dd); pl.line(tt[ok], dd[ok], COL[s], 2, gap=0.25)
        pl.legend([(NAMES[s], COL[s]) for s in duck]); pl.save(os.path.join(out, 'ducking_measured.png'))
    print(json.dumps({k: rep[k] for k in ['stem_gains_dB', 'master']}, indent=1))
    print('speech/background (median, min, % under 6):', [(w['window'], w['median_LU'], w['min_LU'], w['below6_pct']) for w in snr]); print('voice trims ->', trims)
    print('narrator stops (drop LU):', [(x['line'], x['drop_LU']) for x in stops], ' refs:', {k: v['when_the_narrator_stops'] for k, v in rep['refs'].items()})
    print('sections:', [(s['kind'][:6], s['span'], s['integrated'], s['short_term_min']) for s in sec])
    for lab, R in rep['refs'].items(): print(lab, 'sections:', [(x['span'], x['integrated'], x['short_term_min']) for x in R['sections']])
    for k2, v2 in ev.items(): print(f"  {k2:40s} stem {v2['stem_momentary_max']:6.1f}  mix {v2['mix_momentary_max']:6.1f}  refs {[R['events'].get(k2) for R in rep['refs'].values()]}")
    print('punch (LU above the second before):'); [print(f"  {k:30s} {NAME} {v['punch_LU']:5.1f}  " + '  '.join(f"{lab} {R['punch'][k]['punch_LU']:5.1f}" for lab, R in rep['refs'].items())) for k, v in pun.items()]
    print('short-term percentiles:', rep['short_term_percentiles'], {lab: R['short_term_percentiles'] for lab, R in rep['refs'].items()}, 'LRA', LRA, {lab: R['true_peak_LRA'] for lab, R in rep['refs'].items()})
    print('narration per line:', per_clip)
    print('voice in speech-free:', vfree, 'subs there:', len(subs_in_free))
    print('ducking:', rep['ducking'])


if __name__ == '__main__':
    main()

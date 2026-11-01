#!/usr/bin/env python3
"""Soundtrack of know-everything: an original score, effects, ambience beds and nine voices, mixed to one WAV.
   node films/know-everything/sound/cues.cjs && python3 films/know-everything/sound/mix.py && bash films/know-everything/sound/master.sh
Writes sound/out/: music.wav, sfx.wav, amb.wav, voice.wav (stems) and premaster.wav; master.sh makes mix.wav, mix.m4a
and ../soundtrack.js. Everything but the voices is synthesised from seeded noise and maths.
Rules: the voice leads while it speaks; the music clearly leads the ambience (owner, 2026-10-31); the midnight beat is
silence (a clock, then nothing)."""
import json, os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE); OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
C = json.load(open(os.path.join(HERE, 'cues.json')))
T = C['T']; SR = 48000; DUR = C['duration']; N = int(DUR * SR) + SR
R = np.random.default_rng(20261101)
shot = {s['id']: s for s in C['shots']}
CL = C['clips']

def z(): return np.zeros((2, N))
def at(t): return int(round(t * SR))
def add(bus, sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if sig.ndim == 1: sig = np.vstack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))]) * np.sqrt(2)
    if i < 0: sig = sig[:, -i:]; i = 0
    j = min(N, i + sig.shape[1])
    if j <= i: return
    bus[:, i:j] += sig[:, : j - i] * gain
def mx(*a):
    n = max(len(x) for x in a); o = np.zeros(n)
    for x in a: o[: len(x)] += x
    return o
def tt(d): return np.arange(max(1, int(round(d * SR)))) / SR
def db(x): return 10 ** (x / 20)
def shape(sig, lo=20, hi=20000, tilt=0.0):
    """band-limit by FFT (smooth edges); tilt dB/octave above 1 kHz"""
    n = len(sig); F = np.fft.rfft(sig); f = np.fft.rfftfreq(n, 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    if tilt: m *= (np.maximum(f, 1) / 1000) ** (tilt / 6.02)
    return np.fft.irfft(F * m, n)
def noise(d): return R.standard_normal(max(1, int(round(d * SR))))
def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s; A = min(n, int(a * SR)); D = int(d * SR); Rr = min(n, int(r * SR))
    if A: e[:A] = np.linspace(0, 1, A)
    e[A:A + D] = np.linspace(1, s, len(e[A:A + D]))
    if Rr: e[-Rr:] *= np.linspace(1, 0, Rr)
    return e
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def reverb(stereo, dec=2.2, mix=0.25, seed=1):
    r = np.random.default_rng(seed); L = int(dec * SR); env = np.exp(-np.arange(L) / SR * 6.9 / dec)
    out = stereo.copy()
    for c in range(2):
        ir = r.standard_normal(L) * env; ir = shape(ir, 200, 7000); ir /= np.sqrt((ir ** 2).sum())
        n = stereo.shape[1] + L; nf = 1 << (n - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(stereo[c], nf) * np.fft.rfft(ir, nf), nf)[: stereo.shape[1]]
        out[c] = stereo[c] * (1 - mix) + y * mix * 3.0
    return out
def cs(cid): return CL[cid]['start']
def ce(cid): return CL[cid]['end']
def wword(cid, w, n=0):
    L = [x['s'] for x in CL[cid]['words'] if x['w'].lower().strip('.,?!:"\'').replace('...', '') == w] or \
        [x['s'] for x in CL[cid]['words'] if x['w'].lower().strip('.,?!:"\'').startswith(w)]
    return L[n]
sh0 = lambda k: shot[k]['t0']

# ---------------- instruments ----------------
def pluck(f, d=0.9, bright=1.0):
    x = tt(d); s = sum((0.7 ** k) * np.sin(2 * np.pi * f * (k + 1) * x) * np.exp(-x * (3 + k * 2.5 / bright)) for k in range(6))
    return s * np.minimum(1, x / 0.004)
def piano(f, d=2.2):
    x = tt(d); s = sum((0.55 ** k) * np.sin(2 * np.pi * f * (k + 1) * (1 + 0.0004 * k * k) * x) * np.exp(-x * (1.1 + k * 0.9)) for k in range(7))
    return s * np.minimum(1, x / 0.003) * (1 - np.clip((x - d + 0.15) / 0.15, 0, 1))
def celesta(f, d=1.6):
    x = tt(d); s = np.sin(2 * np.pi * f * x) * np.exp(-x * 2.2) + 0.35 * np.sin(2 * np.pi * f * 4.0 * x) * np.exp(-x * 7) + 0.2 * np.sin(2 * np.pi * f * 2 * x) * np.exp(-x * 4)
    return s * np.minimum(1, x / 0.002)
def pad(fs, d, a=1.2, r=1.5, bright=4):
    x = tt(d); s = np.zeros(len(x))
    for f in fs:
        for det in (-0.004, 0.0, 0.0037):
            ph = R.uniform(0, 2 * np.pi)
            s += sum((1 / (k + 1)) * np.sin(2 * np.pi * f * (1 + det) * (k + 1) * x + ph * k) for k in range(bright))
    return s * adsr(len(x), a, 0.3, 0.85, r) / (len(fs) * 3)
def strings(fs, d, a=1.5, r=2.0):
    x = tt(d); s = np.zeros(len(x))
    for f in fs:
        for det in (-0.003, 0.0026):
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * x + R.uniform(0, 6))
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
            s += sum(np.sin(k * ph) / k for k in range(1, 7))
    return shape(s * adsr(len(x), a, 0.3, 0.9, r) / (len(fs) * 4), 120, 5000)
def shimmer(d, base=86):
    x = tt(d); s = np.zeros(len(x))
    for i, iv in enumerate([0, 4, 7, 12, 16, 19]):
        s += np.sin(2 * np.pi * mtof(base + iv) * x + i) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + i * 0.7) * x + i))
    return s / 6 * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2
def kick(d=0.5, f0=110, f1=42):
    x = tt(d); f = f1 + (f0 - f1) * np.exp(-x * 30); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x * 7) + 0.3 * shape(noise(d), 1500, 6000) * np.exp(-x * 60)
def clap(d=0.25):
    x = tt(d); return shape(noise(d), 900, 5000) * (np.exp(-x * 35) + 0.5 * np.exp(-np.maximum(0, x - 0.012) * 40) * (x > 0.012))
def thump(d=0.35, f=55):
    x = tt(d); return np.sin(2 * np.pi * f * x * (1 - 0.3 * x)) * np.exp(-x * 14) * np.minimum(1, x / 0.004)
def hat(d=0.06):
    x = tt(d); return shape(noise(d), 6000, 16000) * np.exp(-x * 80)
def shaker(d=0.09):
    x = tt(d); return shape(noise(d), 3000, 12000) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2
def riser(d, lo=800, hi=9000, p=2.5):
    x = tt(d); return shape(noise(d), lo, hi) * (x / x[-1]) ** p
def boom(d=1.8): return kick(d, 70, 30) + 0.3 * shape(noise(d), 40, 300) * np.exp(-tt(d) * 2.5)

CH = {'D': [50, 54, 57], 'Bm': [47, 50, 54], 'G': [43, 47, 50], 'A': [45, 49, 52], 'Em': [40, 43, 47], 'F#m': [42, 45, 49],
      'F#': [42, 46, 49], 'C': [48, 52, 55], 'Dsus': [50, 55, 57], 'Asus': [45, 50, 52], 'Gmaj7': [43, 47, 50, 54],
      'Dmaj9': [50, 54, 57, 61, 64], 'Bm7': [47, 50, 54, 57], 'Em7': [40, 43, 47, 50], 'Cmaj7': [48, 52, 55, 59]}
mus = z()
def chords(t0, t1, prog, bar, gain, kind='pad', up=12, a=0.6, r=1.0):
    tb, i = t0, 0
    while tb < t1 - 0.1:
        L = min(bar, t1 - tb); fs = [mtof(m + up) for m in CH[prog[i % len(prog)]]]
        sig = pad(fs, L + r, a, r, 4) if kind == 'pad' else strings(fs, L + r, a, r)
        add(mus, sig, tb, gain); tb += bar; i += 1
def arp(t0, t1, prog, bpm, gain, pat=(0, 1, 2, 3, 2, 1, 2, 3), inst=pluck, up=24, step=0.5, bass=0.0, pan=0.25, dur=0.7):
    beat = 60 / bpm; bar = 4 * beat; tb, i = t0, 0
    while tb < t1 - 0.05:
        ns = CH[prog[i % len(prog)]]; k = 0; t = tb
        while t < min(tb + bar, t1) - 0.02:
            p = pat[k % len(pat)]; m = ns[p % len(ns)] + up + 12 * (p // len(ns))
            add(mus, inst(mtof(m), dur), t, gain * (1 if k % 2 == 0 else 0.72), pan * np.sin(k * 1.3 + i)); k += 1; t += beat * step
        if bass: add(mus, pluck(mtof(ns[0] - 12), 1.4, 0.6), tb, bass, -0.15)
        tb += bar; i += 1
def groove(t0, t1, bpm, gk=0.3, gs=0.08, gh=0.0, clapg=0.0):
    beat = 60 / bpm; t, k = t0, 0
    while t < t1 - 0.05:
        if k % 4 in (0, 2) and gk: add(mus, kick(0.4, 95, 45), t, gk)
        if k % 4 in (1, 3) and clapg: add(mus, clap(), t, clapg)
        if gs: add(mus, shaker(), t + beat / 2, gs, 0.3); add(mus, shaker(0.06), t, gs * 0.6, -0.3)
        if gh: add(mus, hat(), t + beat / 2, gh)
        t += beat; k += 1
def melody(t0, notes, beat, gain, inst=celesta, dur=1.4, pan=0.15):
    t = t0
    for m, l in notes:
        if m: add(mus, inst(mtof(m), dur), t, gain, pan)
        t += l * beat
knowing = lambda t, g=1.0: (add(mus, riser(0.9, 2000, 12000, 3), t - 0.9, 0.25 * g), add(mus, shimmer(2.6, 86), t - 0.2, 0.35 * g),
                            [add(mus, celesta(mtof(m), 1.8), t + i * 0.07, 0.22 * g, (-0.4, 0.4)[i % 2]) for i, m in enumerate([74, 78, 81, 86, 90, 93])])

# ---- A. Tuesday morning: a sleepy sus pad, the knowing, then a light celesta + pizzicato theme in D
add(mus, pad([mtof(m) for m in [62, 67, 69]], sh0('roomBurst') + 0.5, 1.5, 0.6, 2), 0.0, 0.25)
knowing(sh0('roomBurst') + 0.05, 1.2); add(mus, boom(1.2), sh0('roomBurst') + 0.05, 0.35)
t0, t1 = sh0('roomBurst') + 0.4, cs('y_party') - 0.15
arp(t0, t1, ['D', 'Bm', 'G', 'A'], 92, 0.11, inst=pluck, up=24, bass=0.22)
chords(t0, t1, ['D', 'Bm', 'G', 'A'], 4 * 60 / 92, 0.18)
THEME = [(74, 1), (76, 0.5), (78, 0.5), (81, 1.5), (78, 0.5), (76, 1), (74, 1), (73, 1), (71, 2), (None, 1), (74, 1), (78, 1), (76, 2), (73, 2), (None, 2)]
for k in range(3): melody(sh0('kitWide') + 0.3 + k * 16 * 60 / 92, THEME, 60 / 92, 0.1)
groove(sh0('kitWide'), t1, 92, gk=0.0, gs=0.05)
add(mus, celesta(mtof(93), 1.0), T['n94'] + 0.05, 0.12); add(mus, celesta(mtof(98), 1.0), T['n94'] + 0.12, 0.08)
for m, dl in ((81, 0), (86, 0.08)): add(mus, pluck(mtof(m), 0.6, 1.4), T['pop'] + 0.15 + dl, 0.14)
# the party line: everything stops, a held note; then the comic double pluck on "Jake's party?!"
add(mus, pad([mtof(81)], ce('y_party') - cs('y_party') + 0.6, 0.1, 0.5, 2), cs('y_party') - 0.1, 0.12)
for m, dl in ((38, 0), (37, 0.22)): add(mus, pluck(mtof(m + 12), 0.9, 0.5), cs('m_party') + 0.35 + dl, 0.5)
# lesson one: three soft descending notes over G → A
chords(sh0('lesson'), sh0('title'), ['G', 'Asus'], 2.6, 0.2)
melody(cs('n_lesson') + 0.05, [(81, 1), (78, 1), (74, 2)], 0.45, 0.14)
# ---- title: a boom, the knowing and a big D swell
t0 = sh0('title'); add(mus, riser(1.4, 600, 9000, 2.5), t0 - 1.4, 0.4); add(mus, boom(2.2), t0 + 0.02, 0.85); knowing(t0 + 0.05, 1.4)
add(mus, pad([mtof(m) for m in CH['Dmaj9'] + [38]], 5.0, 0.3, 1.6, 6), t0, 0.55)
for m, dl in ((62, 0), (66, 0.12), (69, 0.24), (74, 0.36), (78, 0.48)): add(mus, piano(mtof(m), 3.0), t0 + 0.05 + dl, 0.2)
# ---- B. the walk: a soft groove, the theme on plucks
t0, t1 = sh0('walkWide'), sh0('earth')
groove(t0, t1, 100, gk=0.22, gs=0.07); arp(t0, t1, ['D', 'Bm', 'G', 'A'], 100, 0.09, up=24, bass=0.25); chords(t0, t1, ['D', 'Bm', 'G', 'A'], 2.4, 0.14)
melody(t0 + 0.4, THEME, 0.6, 0.09)
# space: a whoosh out, wide airy chords per stop, the edge gets a sub swell
add(mus, riser(1.2, 300, 6000, 2), sh0('earth') - 1.0, 0.4)
for k, (sid, c) in enumerate((('earth', 'Dmaj9'), ('moon', 'Bm7'), ('sunCore', 'Gmaj7'), ('edge', 'Asus'))):
    a, b = sh0(sid), (sh0(['moon', 'sunCore', 'edge', 'holeTalk'][k]))
    add(mus, pad([mtof(m + 12) for m in CH[c]] + [mtof(CH[c][0] - 12)], b - a + 1.6, 0.4, 1.6, 6), a, 0.32)
    add(mus, shimmer(b - a + 1.0, 88 + (k % 2) * 2), a, 0.1)
x = tt(sh0('holeTalk') - sh0('edge') + 0.6); add(mus, np.sin(2 * np.pi * 36 * x) * np.sin(np.pi * x / x[-1]) ** 2, sh0('edge'), 0.5)
# the black hole: a rising low drone into the "pop"
chords(sh0('holeTalk'), sh0('hole'), ['Bm'], 4, 0.18)
t0, t1 = wword('n_hole', 'squeeze') - 0.2, T['bh1']; x = tt(t1 - t0); k = (x / x[-1]) ** 2
dr = np.sin(2 * np.pi * np.cumsum(30 + 40 * k) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(45 + 60 * k) / SR) + 0.3 * shape(noise(t1 - t0), 60, 400)
add(mus, dr * (0.15 + 0.85 * k), t0, 0.45); add(mus, riser(t1 - t0, 300, 5000, 3), t0, 0.25)
add(mus, kick(0.6, 140, 50), T['bh1'] + 0.02, 0.45); add(mus, celesta(mtof(98), 2.0), T['bh1'] + 0.05, 0.16); add(mus, celesta(mtof(93), 2.0), T['bh1'] + 0.15, 0.12)
for m, dl in ((62, 0), (66, 0.25)): add(mus, pluck(mtof(m), 0.6, 0.8), wword('n_hole', 'there') - 0.2 + dl, 0.16)
chords(wword('n_hole', 'there') - 0.3, sh0('oddsStreet'), ['Em7'], 3, 0.15)
# the odds: a ticking pluck pulse
t0, t1 = sh0('oddsStreet'), sh0('thinkWalk')
arp(t0, t1, ['Em', 'A', 'Bm', 'G'], 100, 0.09, pat=(2, 2, 2, 2), up=36, step=0.5, dur=0.25)
chords(t0, t1, ['Em', 'A', 'Bm', 'G'], 2.4, 0.15)
add(mus, shimmer(sh0('kick') - sh0('diceRoll'), 90), sh0('diceRoll'), 0.14)
for i in range(12): add(mus, celesta(mtof(int(R.choice([81, 83, 86, 88, 90, 93]))), 1.2), sh0('diceRoll') + 0.2 + i * 0.36, 0.07, R.uniform(-0.6, 0.6))
for m, dl in ((74, 0), (78, 0.1), (81, 0.2), (86, 0.3)): add(mus, pluck(mtof(m), 0.6, 1.4), T['binLand'] + 0.1 + dl, 0.13)
# you: the walk again, quieter and in minor; the question mark: everything holds on an open chord
t0, t1 = sh0('thinkWalk'), sh0('shopQ')
groove(t0, sh0('shopWin'), 100, gk=0.15, gs=0.05); arp(t0, t1, ['Bm', 'G', 'Em', 'F#'], 100, 0.07, up=24, bass=0.18); chords(t0, t1, ['Bm', 'G', 'Em', 'F#'], 2.4, 0.13)
add(mus, pad([mtof(m) for m in [57, 62, 64, 69, 76]], sh0('classWide') - T['q'] + 1.0, 0.5, 1.4, 5), T['q'], 0.3)
add(mus, shimmer(3.0, 93), T['q'], 0.16); add(mus, celesta(mtof(88), 2.4), T['q'] + 0.05, 0.14)
# ---- C. school: a playful staccato in G; stops for the teacher; the key sting; the hallway bounce
t0, t1 = sh0('classWide'), cs('t_problem') - 0.2
arp(t0, t1, ['G', 'Em', 'C', 'D'], 108, 0.1, pat=(0, 2, 1, 2), up=24, step=0.5, dur=0.3, bass=0.2); groove(sh0('paperFast'), t1, 108, gk=0.0, gs=0.05)
add(mus, pad([mtof(m) for m in [67, 74]], cs('n_lunch') - cs('t_problem'), 0.3, 0.6, 2), cs('t_problem'), 0.1)
add(mus, pluck(mtof(43), 1.2, 0.5), sh0('keyWrong') + 0.35, 0.45); add(mus, celesta(mtof(91), 1.6), sh0('keyWrong') + 0.38, 0.14)
t0, t1 = sh0('hallway'), sh0('yardWide')
arp(t0, t1, ['G', 'Em', 'C', 'D'], 112, 0.1, pat=(0, 2, 1, 2), up=24, step=0.5, dur=0.3, bass=0.24); groove(t0, cs('k_emma') - 0.1, 112, gk=0.2, gs=0.06)
add(mus, pad([mtof(m + 12) for m in CH['G']], 2.6, 0.2, 1.4, 4), cs('n_learn') - 0.1, 0.22); add(mus, celesta(mtof(86), 1.6), cs('n_learn') + 0.2, 0.12)
# ---- D. the backyard: warm plucked arpeggios; the dig builds; a stop for the clunk; gold
t0, t1 = sh0('yardWide'), T['clunk'] - 0.25
arp(t0, t1, ['D', 'A', 'Bm', 'G'], 84, 0.11, pat=(0, 1, 2, 1, 3, 1, 2, 1), up=12, step=0.5, bass=0.25, dur=1.0); chords(t0, t1, ['D', 'A', 'Bm', 'G'], 4 * 60 / 84, 0.14)
groove(T['dig0'], t1, 84, gk=0.18, gs=0.05)
add(mus, riser(t1 - T['dig0'], 400, 6000, 3), T['dig0'], 0.12)
add(mus, riser(0.5, 2000, 12000, 3), T['open'] - 0.5, 0.25); add(mus, shimmer(6.5, 86), T['open'], 0.2)
add(mus, pad([mtof(m + 12) for m in CH['Dmaj9']], sh0('real') - T['open'] + 1.4, 0.5, 1.6, 6), T['open'], 0.32)
for i, m in enumerate([74, 78, 81, 86, 90]): add(mus, celesta(mtof(m), 1.8), T['open'] + 0.08 + i * 0.09, 0.14, (-0.4, 0.4)[i % 2])
chords(sh0('real'), sh0('viral'), ['G', 'A'], 2.4, 0.16)
# viral: an up-tempo build to the 40 million
t0, t1 = sh0('viral'), sh0('vans')
groove(t0, t1, 118, gk=0.35, gs=0.06, clapg=0.18); arp(t0, t1, ['D', 'A', 'Bm', 'G'], 118, 0.1, up=24, bass=0.25); add(mus, riser(T['views'] - t0, 600, 8000, 2.5), t0, 0.22)
add(mus, boom(1.4), T['views'] + 0.02, 0.5); add(mus, pad([mtof(m + 12) for m in CH['D']], 1.8, 0.05, 1.4, 6), T['views'], 0.3)
# ---- E. Wednesday: the news sting and bed; Thursday: the lab (strings), the answer, her tears; Friday: fame
t0 = sh0('vans'); add(mus, boom(1.0), t0 + 0.05, 0.4)
for i in range(3): add(mus, pad([mtof(m + 12) for m in [50, 57, 62, 66]], 0.35, 0.01, 0.25, 7), t0 + 0.1 + i * 0.22, 0.32)
groove(t0 + 0.8, sh0('labWide'), 120, gk=0.18, gh=0.06); chords(t0 + 0.8, sh0('labWide'), ['Bm', 'G'], 2.0, 0.12)
t0, t1 = sh0('labWide'), sh0('papers')
chords(t0, T['write0'], ['Bm', 'G', 'D', 'A'], 3.2, 0.16, kind='str', a=1.2, r=1.6)
add(mus, riser(T['write1'] - T['write0'] + 0.3, 1500, 10000, 2), T['write0'], 0.15); add(mus, shimmer(T['write1'] - T['write0'] + 1.0, 86), T['write0'], 0.14)
chords(T['write1'], t1, ['G', 'D', 'Bm', 'A'], 2.8, 0.2, kind='str', a=1.0, r=1.6)
melody(T['sit'] + 0.2, [(74, 1), (73, 1), (71, 1), (69, 2), (66, 1), (69, 1), (74, 3)], 0.55, 0.12, inst=piano, dur=2.4)
t0, t1 = sh0('papers'), sh0('priceSofa')
groove(t0, t1, 112, gk=0.3, gs=0.06, clapg=0.14); arp(t0, t1, ['D', 'A', 'Bm', 'G'], 112, 0.1, up=24, bass=0.25); chords(t0, t1, ['D', 'A', 'Bm', 'G'], 4 * 60 / 112, 0.18)
add(mus, riser(t1 - sh0('covers'), 800, 9000, 2.5), sh0('covers'), 0.2)
# ---- F. the price: sparse piano in B minor; the gift; the night (the universe never goes quiet)
t0, t1 = sh0('priceSofa'), sh0('night1')
add(mus, kick(0.8, 60, 30), t0 + 0.02, 0.25)
bar = 3.2; tb, i = t0 + 0.3, 0
PROG = ['Bm', 'G', 'D', 'F#']
while tb < t1 - 0.5:
    c = CH[PROG[i % 4]]; add(mus, piano(mtof(c[0] - 12), 3.4), tb, 0.16)
    for j, m in enumerate(c): add(mus, piano(mtof(m + 12), 2.6), tb + 0.4 + j * 0.35, 0.09)
    add(mus, pad([mtof(m) for m in c], bar + 1.0, 0.8, 1.0, 2), tb, 0.12); tb += bar; i += 1
add(mus, celesta(mtof(90), 2.0), T['unwrap'] + 0.45, 0.12)
# night: a dense, rising texture of everything at once, then thin
t0, t1 = sh0('night1'), sh0('carArrive'); x = tt(t1 - t0); k = np.clip(x / (wword('n_night', 'slept') - 1.5 - t0), 0, 1) ** 1.5
tex = sum(np.sin(2 * np.pi * mtof(m) * x + R.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * R.uniform(0.1, 0.6) * x + R.uniform(0, 6))) for m in [62, 69, 74, 76, 81, 83, 86, 88, 93])
cut = 1 - np.clip((x - (wword('n_night', 'slept') - 1.2 - t0)) / 0.8, 0, 1)
add(mus, tex / 9 * (0.2 + 0.8 * k) * cut, t0, 0.3); add(mus, shape(noise(t1 - t0), 2000, 9000) * (0.1 + 0.9 * k) * cut, t0, 0.04)
add(mus, pad([mtof(m) for m in [47, 54, 62]], t1 - t0 + 1, 1.5, 1.5, 3), t0, 0.2)
add(mus, celesta(mtof(98), 3.0), wword('n_night', 'star') + 0.2, 0.12); add(mus, celesta(mtof(97), 3.0), wword('n_night', 'star') + 0.6, 0.1)
add(mus, pad([mtof(98)], t1 - wword('n_night', 'slept') + 1.4, 0.3, 1.0, 1), wword('n_night', 'slept') - 0.6, 0.06)
# ---- G. Saturday night: a low drone, a slow pulse, dark strings
t0, t1 = sh0('carArrive'), sh0('odds1'); x = tt(t1 - t0 + 1.5)
add(mus, (np.sin(2 * np.pi * mtof(35) * x) + 0.5 * np.sin(2 * np.pi * mtof(42) * x)) * np.minimum(1, x / 2.0) * (1 - np.clip((x - (t1 - t0)) / 1.5, 0, 1)), t0, 0.4)
chords(t0, t1, ['Bm', 'G', 'Em', 'F#'], 4.0, 0.16, kind='str', a=1.5, r=1.8)
t = sh0('door')
while t < t1 - 0.2: add(mus, kick(0.5, 70, 35), t, 0.28); add(mus, kick(0.4, 60, 32), t + 0.28, 0.16); t += 1.25
add(mus, boom(2.0), wword('g_tonight', 'midnight') + 0.05, 0.5); add(mus, pad([mtof(m) for m in [35, 47, 54]], 2.5, 0.05, 2.0, 5), wword('g_tonight', 'midnight') + 0.05, 0.3)
knowing(cs('n_know') + 1.4, 0.6)
# ---- H. the choice: ticking pulse, a chord per option; forget it all turns major; the laptop; then it thins to one note
t0, t1 = sh0('odds1'), sh0('forget')
arp(t0, t1, ['Bm', 'Bm', 'G', 'F#'], 120, 0.08, pat=(0, 0, 0, 0), up=36, step=1.0, dur=0.2)
chords(t0, t1, ['Bm', 'G', 'Em', 'F#'], 3.0, 0.15, kind='str', a=0.8, r=1.2)
for tc in (T['c1'], T['c2'], T['c3']): add(mus, pluck(mtof(35 + 12), 1.4, 0.5), tc, 0.35); add(mus, kick(0.6, 70, 32), tc, 0.25)
t0, t1 = T['c4'] - 0.2, sh0('laptop')
add(mus, riser(0.8, 2000, 12000, 3), t0 - 0.8, 0.2); add(mus, shimmer(t1 - t0, 86), t0, 0.12)
chords(t0, t1, ['G', 'D', 'G', 'A'], 2.6, 0.2, kind='str', a=0.8, r=1.4)
for i, m in enumerate([67, 71, 74, 79, 83]): add(mus, celesta(mtof(m + 12), 2.0), t0 + 0.2 + i * 0.1, 0.12)
g0 = wword('n_forget', 'gone')
add(mus, pad([mtof(m) for m in [62, 74]], 1.4, 0.01, 1.2, 2), g0, 0.12)
t0, t1 = sh0('laptop'), sh0('firstQ')
arp(t0, t1, ['Bm', 'G', 'Em', 'F#'], 120, 0.08, pat=(0, 0, 0, 0), up=36, step=1.0, dur=0.2); chords(t0, t1, ['Bm', 'G', 'Em', 'F#'], 2.0, 0.15, kind='str', a=0.5, r=1.0)
add(mus, boom(1.6), wword('n_comp', 'nobody') - 0.05, 0.3)
t0 = sh0('firstQ'); e = ce('n_first2') + 0.35
add(mus, pad([mtof(74)], e - t0 + 1.0, 0.8, 1.0, 2), t0, 0.14)
add(mus, pad([mtof(m) for m in [57, 62, 64, 69, 76]], e - T['qBig'] + 1.0, 0.4, 1.0, 5), T['qBig'], 0.26); add(mus, shimmer(e - T['qBig'] + 0.8, 93), T['qBig'], 0.12)
# ---- I. silence (the clock, in sfx). ---- J. Sunday: the theme on warm piano, a laugh of plucks, the open question at the end
t0, t1 = sh0('sunday') + 0.6, sh0('pillow')
bar = 4 * 60 / 80; tb, i = t0, 0
while tb < t1 - 0.3:
    c = CH[['D', 'Bm', 'G', 'A'][i % 4]]; add(mus, piano(mtof(c[0] - 12), 3.6), tb, 0.16)
    for j, m in enumerate(c): add(mus, piano(mtof(m + 12), 2.8), tb + j * 0.18, 0.08)
    add(mus, pad([mtof(m) for m in c], bar + 1.0, 0.8, 1.0, 2), tb, 0.1); tb += bar; i += 1
for k in range(2): melody(sh0('ceiling') + 0.3 + k * 16 * 0.75, THEME, 0.75, 0.1, inst=piano, dur=2.0)
for m, dl in ((74, 0), (78, 0.1), (81, 0.2), (86, 0.3)): add(mus, pluck(mtof(m), 0.6, 1.4), wword('n_burn', 'laugh') + dl, 0.12)
add(mus, celesta(mtof(86), 2.0), T['good'] + 0.2, 0.12); add(mus, celesta(mtof(90), 2.0), T['good'] + 0.3, 0.1)
t0 = sh0('pillow'); add(mus, pad([mtof(m) for m in [50, 57, 64, 66, 69]], DUR - t0 + 0.5, 1.2, 2.5, 4), t0, 0.24)
add(mus, shimmer(DUR - wword('n_note', 'pillow') + 0.4, 86), wword('n_note', 'pillow') - 0.4, 0.08)
t0 = cs('n_cta2'); add(mus, pad([mtof(m) for m in [43, 55, 62, 64, 69, 74]], DUR - t0 + 0.5, 0.4, 3.0, 5), t0 - 0.2, 0.3)
for i, m in enumerate([67, 71, 74, 76, 81]): add(mus, piano(mtof(m), 4.0), t0 + 1.2 + i * 0.16, 0.1)
mus = reverb(mus, 2.6, 0.3, 3)

# ---------------- effects ----------------
sfx = z()
def clunk(f=190): x = tt(0.4); return np.sin(2 * np.pi * f * x) * np.exp(-x * 25) + 0.3 * np.sin(2 * np.pi * f * 6.5 * x) * np.exp(-x * 30) + 0.15 * np.sin(2 * np.pi * f * 13.7 * x) * np.exp(-x * 40)
def clang(d=2.5, f0=523): x = tt(d); return sum(a * np.sin(2 * np.pi * f0 * f * x) * np.exp(-x * dc) for f, a, dc in ((1, 1, 2.5), (2.575, 0.6, 3.5), (4.57, 0.4, 5), (6.9, 0.25, 7), (1.507, 0.5, 3)))
def squeak(d=0.25, f0=900, f1=1300): x = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(x))) / SR) * np.sin(np.linspace(0, np.pi, len(x)))
def whoosh(d=0.8, lo=300, hi=6000): x = tt(d); return shape(noise(d), lo, hi) * np.sin(np.pi * x / d) ** 2
def crowd(d, lo=250, hi=2500, var=0.3):
    x = tt(d); s = shape(noise(d), lo, hi); am = 1 + var * shape(R.standard_normal(len(x)), 0.3, 3) * 40; return s * np.clip(am, 0.2, 2)
def bell(d, f1=2350, f2=3710, rate=16):
    x = tt(d); return (np.sin(2 * np.pi * f1 * x) + 0.5 * np.sin(2 * np.pi * f2 * x)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rate * x))) * np.minimum(1, x / 0.05) * (1 - np.clip((x - d + 0.05) / 0.05, 0, 1))
def buzz(d=0.5): x = tt(d); return shape(np.sign(np.sin(2 * np.pi * 150 * x)) * (0.6 + 0.4 * np.sin(2 * np.pi * 25 * x)), 80, 2500) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 0.5
def blip(f=1300, d=0.09): x = tt(d); return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 1.5 * x)) * np.exp(-x * 30) * np.minimum(1, x / 0.003)
def zip_(d=0.22): x = tt(d); return shape(noise(d), 1500, 7000) * np.sin(np.pi * x / d) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(np.linspace(40, 140, len(x))) / SR))
def tick(f=3000): x = tt(0.03); return shape(noise(0.03), 1500, 9000) * np.exp(-x * 220) + 0.4 * np.sin(2 * np.pi * f * x) * np.exp(-x * 150)
def ping(f=1760): x = tt(0.25); return np.sin(2 * np.pi * f * x) * np.exp(-x * 16) + 0.4 * np.sin(2 * np.pi * f * 1.5 * x) * np.exp(-x * 22)
def shutter(): return shape(noise(0.05), 2000, 10000) * np.exp(-tt(0.05) * 90)
def paper(d=0.35): x = tt(d); return shape(noise(d), 400, 5000) * np.sin(np.pi * x / d) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * x)))
def knock(): return mx(thump(0.18, 110) * 0.8, 0.5 * shape(noise(0.08), 300, 2500) * np.exp(-tt(0.08) * 50))
def step(): return mx(thump(0.12, 85) * 0.6, 0.3 * shape(noise(0.1), 300, 2500) * np.exp(-tt(0.1) * 40))
def slam(): return mx(kick(0.5, 90, 40), 0.6 * clunk(150), 0.3 * shape(noise(0.25), 200, 3000) * np.exp(-tt(0.25) * 20))
# morning: the alarm, the phone buzz, toaster pop + a hiss of smoke
add(sfx, bell(T['eyes'] + 0.7), 0.0, 0.1, -0.35); add(sfx, kick(0.3, 160, 60), T['eyes'] + 0.7, 0.2, -0.35)
for k in range(2): add(sfx, buzz(0.45), T['buzz'] + k * 0.6, 0.3, 0.2)
add(sfx, mx(squeak(0.12, 500, 900), clunk(420) * 0.6), T['pop'], 0.4, 0.3); add(sfx, shape(noise(0.15), 2000, 8000) * np.exp(-tt(0.15) * 25), T['pop'], 0.2, 0.3)
add(sfx, shape(noise(6.0), 2500, 9000) * adsr(at(6.0), 0.4, 0.1, 1, 2.0), T['pop'] - 1.5, 0.03, 0.3)
for tg in (T['spider'], T['dust'], T['num'], T['read']): add(sfx, blip(1500, 0.07), tg, 0.06, 0.2)
# the walk: two passing cars; space whoosh; the black hole suck and pop; dice; the can
for tc, p in ((sh0('walkWide') + 1.0, -0.6), (sh0('walkTags') + 1.5, 0.6)): add(sfx, whoosh(2.2, 150, 2500), tc, 0.18, p)
add(sfx, whoosh(1.4, 200, 8000), sh0('earth') - 0.6, 0.35)
add(sfx, shape(noise(T['bh1'] - T['bh0']), 60, 600) * np.linspace(0.2, 1, at(T['bh1'] - T['bh0'])) ** 2, T['bh0'], 0.4)
add(sfx, mx(kick(0.4, 200, 60), 0.4 * shape(noise(0.3), 1000, 8000) * np.exp(-tt(0.3) * 20)), T['bh1'], 0.4)
for i in range(8): add(sfx, clunk(900 + 300 * (i % 3)) * 0.3, sh0('diceRoll') + 0.4 + i * 0.5, 0.08, (-0.5, 0.5)[i % 2])
add(sfx, clunk(900) * 0.6 + clang(0.4, 1700) * 0.3, T['kick'], 0.3, -0.1); add(sfx, whoosh(T['binLand'] - T['kick'], 600, 5000), T['kick'], 0.06)
add(sfx, mx(clang(1.2, 620) * 0.5, clunk(300)), T['binLand'], 0.4, 0.4)
add(sfx, ping(2400) * 0.5, T['q'], 0.04)
# school: scribbling, pencil down, a chair; the hallway murmur
x = tt(T['fill1'] - T['fill0'] + 0.3); add(sfx, shape(noise(len(x) / SR), 1500, 7000) * np.clip(shape(R.standard_normal(len(x)), 5, 25) * 60, 0, 1), T['fill0'], 0.25, 0.2)
add(sfx, clunk(1100) * 0.6, T['down'], 0.3, 0.2)
add(sfx, paper(0.4), sh0('keyWrong') + 0.05, 0.15)
# the backyard: digging (a scrape and a thud per stroke), the clunk, the lid, the coins
t = T['dig0'] + 0.25
while t < T['clunk'] - 0.4: add(sfx, shape(noise(0.25), 400, 4000) * np.sin(np.pi * tt(0.25) / 0.25), t, 0.22, 0.1); add(sfx, mx(thump(0.2, 80), 0.3 * shape(noise(0.15), 100, 900) * np.exp(-tt(0.15) * 20)), t + 0.2, 0.3, 0.1); t += 1 / 1.4
add(sfx, mx(clunk(240), 0.4 * clang(0.6, 700)), T['clunk'], 0.6)
add(sfx, squeak(0.45, 320, 230) * 0.6 + 0.3 * shape(noise(0.45), 300, 2000) * np.sin(np.pi * tt(0.45) / 0.45), T['open'] - 0.25, 0.25)
for i in range(18): add(sfx, ping(R.uniform(3000, 6500)) * 0.4, T['open'] + 0.2 + R.uniform(0, 0.8), 0.08, R.uniform(-0.5, 0.5))
# viral: notifications speed up; then the news vans: shutters and reporters
t, gap = sh0('viral') + 0.3, 0.6
while t < T['views']: add(sfx, ping(1320) + ping(1760) * 0.6, t, 0.06, R.uniform(-0.6, 0.6)); t += gap; gap = max(0.07, gap * 0.8)
add(sfx, whoosh(0.8, 500, 9000), T['views'] - 0.4, 0.3)
for i in range(14): add(sfx, shutter(), sh0('vans') + R.uniform(0.2, sh0('news') - sh0('vans')), 0.15, R.uniform(-0.7, 0.7))
# the lab: marker squeaks, her stool
t = T['write0']
while t < T['write1']: add(sfx, squeak(R.uniform(0.12, 0.3), R.uniform(1500, 2000), R.uniform(2000, 2600)), t, 0.05, 0.2); t += R.uniform(0.15, 0.35)
add(sfx, mx(squeak(0.5, 300, 200) * 0.5, thump(0.2, 90)), T['sit'] + 0.3, 0.2, -0.2)
# Friday: paper flaps, flashes
for k in range(2): add(sfx, paper(0.45), sh0('papers') + 0.15 + k * 0.5, 0.2, (-0.3, 0.3)[k])
for i in range(10): add(sfx, shutter(), sh0('covers') + R.uniform(0, 2.5), 0.15, R.uniform(-0.7, 0.7))
# the gift: paper rustle and a tear
add(sfx, mx(paper(0.8) * 0.8, shape(noise(0.3), 1500, 7000) * np.exp(-tt(0.3) * 10)), T['unwrap'], 0.25)
# the night: heartbeats everywhere, a storm, thunder; a star dying (in the score)
hb = wword('n_night', 'heartbeat')
for i in range(70): tb = hb - 0.3 + R.uniform(0, 3.2 + i * 0.03); add(sfx, thump(0.2, R.uniform(45, 60)), tb, 0.07, R.uniform(-0.8, 0.8))
st = wword('n_night', 'storm'); d = wword('n_night', 'slept') - 0.8 - st
add(sfx, shape(noise(d), 400, 7000) * adsr(at(d), 0.5, 0.1, 1, 1.5), st - 0.3, 0.06); add(sfx, shape(noise(4.0), 25, 220) * np.exp(-tt(4.0) * 1.2) * np.minimum(1, tt(4.0) / 0.15), st + 0.3, 0.6)
# Saturday: the car arrives (engine, tyres), stops; the door; steps; knocks; the front door opens
t0, t1 = T['carIn'], T['carStop']; x = tt(t1 - t0 + 0.2); k = np.clip(x / (t1 - t0), 0, 1)
f = 34 - 6 * k; ph = 2 * np.pi * np.cumsum(f) / SR
eng = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph + 0.4)) + 0.3 * shape(noise(len(x) / SR), 80, 600)
add(sfx, eng * (0.2 + 0.8 * np.sin(np.pi * 0.5 * k)), t0, 0.25, 0.5); add(sfx, shape(noise(len(x) / SR), 200, 2500) * np.sin(np.pi * k) ** 2, t0, 0.12, 0.4)
add(sfx, squeak(0.4, 1800, 1500) * 0.3, t1 - 0.3, 0.06, 0.4)
x = tt(sh0('odds1') - t1); ph = 2 * np.pi * np.cumsum(np.full(len(x), 28.0)) / SR
idle = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * x)) * np.minimum(1, x / 0.3)
idle *= np.where(x < sh0('door') - t1, 1, 0.45); add(sfx, idle, t1, 0.09, 0.3)
add(sfx, slam(), t1 + 1.25, 0.45, 0.4)
for i in range(5): add(sfx, step(), t1 + 1.7 + i * 0.48, 0.2, 0.3 - i * 0.08)
for i in range(3): add(sfx, knock(), ce('n_car') + 0.08 + i * 0.24, 0.45, -0.1)
add(sfx, squeak(0.6, 260, 180) * 0.5, sh0('door') + 0.05, 0.15)
# the choice: a clock that ticks through it all; card blips and strikes; the forget glow; the tags glitch; the laptop
t, k = sh0('odds1'), 0
while t < ce('n_first2') - 0.2: add(sfx, tick(3000 if k % 2 else 2400), t, 0.07, -0.3); t += 1.0; k += 1
for tc, ts in ((T['c1'], T['c1'] + 1.1), (T['c2'], T['c2'] + 1.1), (T['c3'], T['c3'] + 2.0)): add(sfx, blip(1200), tc, 0.18); add(sfx, zip_(), ts, 0.22)
add(sfx, mx(blip(1600, 0.15), blip(2400, 0.2) * 0.5), T['c4'], 0.18)
t0, t1 = wword('n_forget', 'every') - 0.2, g0
for i in range(30): tg = R.uniform(t0, t1); add(sfx, shape(noise(0.04), 800, 9000) * np.sign(np.sin(2 * np.pi * 60 * tt(0.04))), tg, 0.08, R.uniform(-0.7, 0.7))
add(sfx, whoosh(0.6, 400, 8000), g0 - 0.3, 0.2)
t = sh0('laptop') + 0.3
while t < T['n99'] - 0.2: add(sfx, blip(2000, 0.04), t, 0.05, 0.3); t += 0.2
add(sfx, mx(blip(1000, 0.2), blip(1500, 0.3) * 0.7), T['n99'] - 0.1, 0.18, 0.3)
# the silence: the clock alone (quiet), it reaches midnight, a far bell, then nothing
t, k = ce('n_first2') + 0.4, 0
while t < T['mid'] + 0.05: add(sfx, tick(3000 if k % 2 else 2400), t, 0.05 * (0.6 + 0.4 * min(1, k / 3)), -0.2); t += 1.0; k += 1
add(sfx, clang(5.0, 196) * np.exp(-tt(5.0) * 0.3), T['mid'] + 0.1, 0.05)
# Sunday: the alarm again (the same bell), the toaster, a pillow
add(sfx, bell(wword('n_sun', 'open') - sh0('sunday') + 0.1), sh0('sunday') + 0.2, 0.08, -0.35)
add(sfx, mx(squeak(0.12, 500, 900), clunk(420) * 0.6), T['pop2'], 0.35, 0.3); add(sfx, shape(noise(5.0), 2500, 9000) * adsr(at(5.0), 0.3, 0.1, 1, 2.0), T['pop2'] - 0.5, 0.04, 0.3)
add(sfx, mx(paper(0.6) * 0.5, whoosh(0.5, 200, 2000) * 0.5), wword('n_note', 'pillow') - 0.5, 0.18)
sfx = reverb(sfx, 1.3, 0.16, 5)

# ---------------- ambience beds (kept well under the music) ----------------
amb = z()
def bed(d, lo, hi, a=0.5, r=0.5): return shape(noise(d), lo, hi) * adsr(at(d), a, 0.1, 1, r)
def birds(t0, t1, n, g=0.05):
    for i in range(n):
        tc = t0 + R.uniform(0.1, max(0.2, t1 - t0 - 0.3)); y = tt(0.12); f = 3500 + 900 * np.sin(np.linspace(0, 3, len(y)))
        add(amb, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(y))), tc, g, R.uniform(-0.6, 0.6))
def crickets(t0, t1, g=0.03):
    x = tt(t1 - t0); s = np.sin(2 * np.pi * 4600 * x) * (np.sin(2 * np.pi * 30 * x) > 0.3) * (np.sin(2 * np.pi * 0.9 * x) > 0)
    add(amb, s * adsr(len(x), 0.6, 0.1, 1, 0.6), t0, g, 0.4)
def room(a, b, lo, hi, g, n=0, bg=0.05): add(amb, bed(b - a, lo, hi), a, g); birds(a, b, n, bg) if n else None
room(0, sh0('kitWide'), 100, 900, 0.12, 5)
room(sh0('kitWide'), sh0('title'), 80, 1200, 0.14, 3, 0.03); x = tt(sh0('title') - sh0('kitWide')); add(amb, np.sin(2 * np.pi * 120 * x) * 0.3, sh0('kitWide'), 0.05)
room(sh0('title'), sh0('earth'), 80, 1600, 0.2, 10)
room(sh0('holeTalk'), sh0('classWide'), 80, 1600, 0.2, 14)
room(sh0('classWide'), sh0('hallway'), 100, 700, 0.1)
add(amb, crowd(sh0('yardWide') - sh0('hallway'), 250, 2500), sh0('hallway'), 0.12)
room(sh0('yardWide'), sh0('viral'), 80, 1200, 0.14, 14, 0.06)
room(sh0('vans'), sh0('news'), 80, 1600, 0.16, 4); add(amb, crowd(sh0('news') - sh0('vans'), 300, 2500), sh0('vans'), 0.12)
room(sh0('labWide'), sh0('papers'), 100, 600, 0.08); x = tt(sh0('papers') - sh0('labWide')); add(amb, np.sin(2 * np.pi * 60 * x) * 0.4 + 0.2 * np.sin(2 * np.pi * 180 * x), sh0('labWide'), 0.04)
room(sh0('priceSofa'), sh0('night1'), 80, 700, 0.1)
x = tt(sh0('giftIn') - sh0('priceSofa')); add(amb, shape(noise(len(x) / SR), 300, 3000) * np.clip(shape(R.standard_normal(len(x)), 2, 8) * 25, 0, 1), sh0('priceSofa'), 0.06, -0.5)   # the TV
room(sh0('night1'), sh0('carArrive'), 60, 600, 0.08); crickets(sh0('night1'), sh0('carArrive'), 0.012)
room(sh0('carArrive'), sh0('odds1'), 60, 900, 0.12); crickets(sh0('carArrive'), sh0('odds1'), 0.02)
room(sh0('odds1'), sh0('firstQ'), 60, 500, 0.06); crickets(sh0('odds1'), sh0('firstQ'), 0.008)
room(sh0('sunday'), sh0('toast2'), 100, 900, 0.1, 12, 0.05)
room(sh0('toast2'), sh0('gone'), 80, 1200, 0.12, 4, 0.03)
room(sh0('gone'), sh0('pillow'), 80, 1600, 0.18, 10)
room(sh0('pillow'), DUR, 100, 900, 0.08, 4, 0.03)

# ---------------- voices ----------------
voice = z()
def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
PAN = {'n': 0.0, 'y': -0.12, 's': 0.12, 'm': 0.15, 't': -0.1, 'k': 0.1, 'a': 0.0, 'p': -0.12, 'g': 0.12}
GAIN = {'n': 1.0, 'y': 1.15, 's': 1.15, 'm': 1.1, 't': 1.1, 'k': 1.15, 'a': 1.0, 'p': 1.1, 'g': 1.1}
venv = np.zeros(N); used = 0
for cid in C['clips']:
    c = CL[cid]
    if 'at' not in c: continue
    s = load(os.path.join(FILM, c['mp3'])); s = s / (np.sqrt(np.mean(s[np.abs(s) > 0.02] ** 2)) + 1e-9) * 0.1 * GAIN[c['who']]
    if cid == 'a_news': s = shape(s, 300, 3800) * 0.9                        # through the TV
    add(voice, s, c['at'], 1.0, PAN[c['who']]); used += 1
    i, j = at(c['start'] - 0.12), min(N, at(c['end'] + 0.2)); venv[i:j] = 1
voice = reverb(voice, 0.6, 0.06, 7)
k = np.ones(at(0.3)) / at(0.3); duck = np.convolve(venv, k, 'same')
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
voice *= 0.1 / rms(voice[:, venv > 0.5])
mus *= 0.1 / rms(mus) * db(-0.5)
sfx *= 0.1 / rms(sfx) * db(-8)
amb *= 0.1 / rms(amb) * db(-21)
mus_d = mus * (1 - duck * (1 - db(-6.0)))
amb_d = amb * (1 - duck * (1 - db(-3)))
mix = voice + mus_d + sfx + amb_d
for name, sig in (('music', mus_d), ('sfx', sfx), ('amb', amb_d), ('voice', voice), ('premaster', mix)):
    sig = sig[:, : int(DUR * SR)]
    data = (sig.T / max(1.0, np.abs(sig).max() * 1.05)) if name == 'premaster' else sig.T * 0.5
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', os.path.join(OUT, name + '.wav')], input=data.astype(np.float64).tobytes(), check=True)
print('voices placed:', used)
print('balance (RMS dB): voice %.1f  music %.1f  sfx %.1f  amb %.1f' % (20 * np.log10(rms(voice[:, venv > 0.5])), 20 * np.log10(rms(mus_d)), 20 * np.log10(rms(sfx)), 20 * np.log10(rms(amb_d))))
gap = venv < 0.5
print('in the gaps between lines: music %.1f  amb %.1f' % (20 * np.log10(rms(mus_d[:, gap])), 20 * np.log10(rms(amb_d[:, gap]))))

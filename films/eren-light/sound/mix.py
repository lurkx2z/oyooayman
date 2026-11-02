#!/usr/bin/env python3
"""Soundtrack of eren-light: an original score (piano, choir, organ, war drums, low strings), effects, rain and three voices.
   node films/eren-light/sound/cues.cjs && python3 films/eren-light/sound/mix.py && bash films/eren-light/sound/master.sh
Writes sound/out/: music.wav, sfx.wav, amb.wav, voice.wav (stems) and premaster.wav; master.sh makes mix.wav, mix.m4a
and ../soundtrack.js. Everything but the voices is synthesised from seeded noise and maths.
Rules: the voice leads while it speaks; the music clearly leads the ambience (owner, 2026-10-31); the countdown's last
sixteen seconds are silence (the clock and a heartbeat), and the heartbeat goes on after zero."""
import json, os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE); OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
C = json.load(open(os.path.join(HERE, 'cues.json')))
T = C['T']; SR = 48000; DUR = C['duration']; N = int(DUR * SR) + SR
R = np.random.default_rng(20261102)
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

CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'Gm': [43, 46, 50], 'A': [45, 49, 52], 'F': [41, 45, 48], 'C': [48, 52, 55], 'Eb': [51, 55, 58],
      'Am': [45, 48, 52], 'Dm9': [50, 53, 57, 60, 64], 'Bbmaj7': [46, 50, 53, 57], 'Gm7': [43, 46, 50, 53], 'A7': [45, 49, 52, 55], 'Fadd9': [41, 45, 48, 55],
      'Csus': [48, 53, 55], 'Dsus': [50, 55, 57], 'D': [50, 54, 57]}
mus = z()
def choir(fs, d, a=1.5, r=2.0, vowel='ah'):
    """a wordless choir: detuned harmonic stacks through vowel formants"""
    x = tt(d); s = np.zeros(len(x))
    for f in fs:
        for det in (-0.006, -0.002, 0.003, 0.007):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (4.6 + det * 100) * x + R.uniform(0, 6))
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
            s += sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 12))
    F1, F2 = (700, 1150) if vowel == 'ah' else (400, 800)
    s = 0.5 * shape(s, F1 * 0.6, F1 * 1.5) + 0.35 * shape(s, F2 * 0.75, F2 * 1.35) + 0.15 * shape(s, 120, 500)
    return s * adsr(len(x), a, 0.4, 0.9, r) / (len(fs) * 4)
def organ(fs, d, a=0.08, r=1.2):
    x = tt(d); s = np.zeros(len(x))
    for f in fs:
        for mult, amp in ((0.5, 0.6), (1, 1), (2, 0.6), (3, 0.35), (4, 0.3), (6, 0.15), (8, 0.12)):
            s += amp * np.sin(2 * np.pi * f * mult * x + mult)
    s *= 1 + 0.08 * np.sin(2 * np.pi * 6.2 * x)
    return s * adsr(len(x), a, 0.2, 0.9, r) / (len(fs) * 3)
def brass(f, d, a=0.4, r=0.6):
    x = tt(d); ph = 2 * np.pi * f * x; saw = sum(np.sin(k * ph) / k for k in range(1, 16))
    env = adsr(len(x), a, 0.3, 0.8, r); return shape(saw * env, 40, 300 + 2400 * float(np.mean(env))) * env
def taiko(d=1.2, f=58):
    x = tt(d); body = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-x * 18))) / SR) * np.exp(-x * 4.5)
    return body + 0.45 * shape(noise(d), 60, 700) * np.exp(-x * 9) + 0.2 * shape(noise(d), 1200, 5000) * np.exp(-x * 60)
def tbell(f=220, d=6.0):
    x = tt(d); return sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x * dc) for m, a, dc in ((0.5, 0.5, 0.5), (1, 1, 0.7), (1.19, 0.5, 1.0), (1.56, 0.35, 1.3), (2.0, 0.45, 1.1), (2.51, 0.25, 1.8), (3.01, 0.2, 2.2))) * np.minimum(1, x / 0.003)
def drone(d, f=36.7, a=2.0, r=2.0):
    x = tt(d); s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2 * x + 1) + 0.25 * shape(noise(d), f, f * 6)
    return s * adsr(len(x), a, 0.2, 1, r)
def hit(t, g=1.0, low=True):
    add(mus, boom(2.2), t, 0.7 * g); add(mus, taiko(1.6, 48), t, 0.5 * g)
    if low: add(mus, piano(mtof(26), 3.0) + piano(mtof(38), 3.0) + piano(mtof(41), 3.0), t, 0.22 * g)
def chords(t0, t1, prog, bar, gain, kind='pad', up=12, a=0.6, r=1.0, vowel='ah'):
    tb, i = t0, 0
    while tb < t1 - 0.1:
        L = min(bar, t1 - tb); fs = [mtof(m + up) for m in CH[prog[i % len(prog)]]]
        sig = {'pad': lambda: pad(fs, L + r, a, r, 4), 'str': lambda: strings(fs, L + r, a, r), 'choir': lambda: choir(fs, L + r, a, r, vowel), 'organ': lambda: organ(fs, L + r, a, r)}[kind]()
        add(mus, sig, tb, gain); tb += bar; i += 1
def ostinato(t0, t1, prog, bpm, gain, up=0, pat=(0, 0, 2, 0, 1, 0, 2, 1), bassg=0.0):
    """low strings in eighths: the engine of the debate"""
    beat = 60 / bpm; bar = 4 * beat; tb, i = t0, 0
    while tb < t1 - 0.05:
        ns = CH[prog[i % len(prog)]]; t, k = tb, 0
        while t < min(tb + bar, t1) - 0.02:
            m = ns[pat[k % len(pat)] % len(ns)] + up
            add(mus, strings([mtof(m)], beat * 0.5 + 0.12, 0.01, 0.1), t, gain * (1.0 if k % 2 == 0 else 0.7), 0.15 * np.sin(k)); k += 1; t += beat / 2
        if bassg: add(mus, strings([mtof(ns[0] - 12)], bar + 0.4, 0.05, 0.5), tb, bassg)
        tb += bar; i += 1
def march(t0, t1, bpm, g=1.0):
    """Eren's march: war drums, the low pulse of the giants"""
    beat = 60 / bpm; t, k = t0, 0
    while t < t1 - 0.05:
        if k % 4 == 0: add(mus, taiko(1.4, 50), t, 0.55 * g)
        if k % 4 == 2: add(mus, taiko(1.0, 62), t, 0.35 * g)
        if k % 8 == 7: add(mus, taiko(0.6, 75), t + beat / 2, 0.25 * g)
        add(mus, taiko(0.3, 140) * 0.3, t + beat / 2, 0.12 * g, 0.3)
        t += beat; k += 1
LIGHT = [(62, 1), (65, 1), (69, 1), (73, 2), (72, 1), (69, 1), (65, 2)]   # D F A C# - C A F : Light's motif
def lightMotif(t0, beat, gain, inst=piano, up=12, dur=2.4):
    t = t0
    for m, l in LIGHT: add(mus, inst(mtof(m + up), dur), t, gain, -0.15); t += l * beat
def erenMotif(t0, beat, gain):
    """Eren: a low brass call, D - F - E - D, a rising minor third that falls back"""
    t = t0
    for m, l in ((38, 2), (41, 1.5), (40, 0.5), (38, 3)): add(mus, brass(mtof(m), l * beat + 0.5, 0.25, 0.5), t, gain, 0.15); add(mus, brass(mtof(m + 12), l * beat + 0.5, 0.3, 0.5), t, gain * 0.5, 0.15); t += l * beat

BPM = 84; BT = 60 / BPM
# ---- A. cold open: the pen (a drone, one low note), the forty seconds (a riser), the cell (heartbeat, a hit on the fall)
add(mus, drone(shot['shake']['t0'] + 1.0, 36.7, 1.5, 1.5), 0.0, 0.35)
add(mus, piano(mtof(26), 4.0) + piano(mtof(38), 4.0), 0.15, 0.35)
add(mus, celesta(mtof(86), 2.0), T['write1'] - 0.3, 0.14)
add(mus, riser(sh0('cell') - sh0('fast') + 0.3, 600, 9000, 2.2), sh0('fast'), 0.3)
add(mus, strings([mtof(81), mtof(82)], sh0('shake') - sh0('cell') + 0.5, 0.4, 0.4), sh0('cell'), 0.12)
hit(T['fall'], 0.9)
# the giants: war drums, a low string ostinato, choir; Light's motif; Eren's call; both, rising into the title
t0, t1 = T['shake'] - 0.3, sh0('twoL')
march(t0, t1, BPM, 0.9); ostinato(t0 + 4 * BT, t1, ['Dm', 'Bb', 'Gm', 'A'], BPM, 0.1, up=-12, bassg=0.12); chords(sh0('horizon'), t1, ['Dm', 'Bb', 'Gm', 'A'], 4 * BT, 0.22, 'choir', 12, 1.2, 1.5)
chords(sh0('twoL'), sh0('twoE'), ['Dm9'], 6, 0.16, 'pad'); lightMotif(sh0('twoL') + 0.2, 0.42, 0.2)
march(sh0('twoE'), sh0('title') - 0.5, BPM, 0.8); erenMotif(sh0('twoE') + 0.1, 0.42, 0.2)
add(mus, riser(sh0('title') - sh0('meet') + 0.2, 400, 9000, 2.5), sh0('meet'), 0.35); chords(sh0('meet'), sh0('title'), ['A'], 3, 0.25, 'choir', 12, 0.3, 0.5)
# ---- the title: a hit, a choir chord, a bell
hit(T['title'], 1.1); add(mus, choir([mtof(m + 12) for m in CH['Dm9']], 4.5, 0.15, 2.5), T['title'], 0.5); add(mus, tbell(mtof(50), 6), T['title'] + 0.05, 0.18)
# ---- B. the station: sparse piano (the clock is stopped, so the music is too); Light arrives on his motif
t0, t1 = sh0('stWide'), sh0('door')
tb, i = t0 + 0.4, 0
while tb < t1 - 1.0:
    c = CH[['Dm', 'Bb', 'Gm', 'A'][i % 4]]; add(mus, piano(mtof(c[0] - 12), 3.6), tb, 0.14)
    for j, m in enumerate(c): add(mus, piano(mtof(m + 12), 2.8), tb + 0.5 + j * 0.42, 0.06)
    add(mus, pad([mtof(m) for m in c], 3.8, 1.0, 1.2, 2), tb, 0.08); tb += 3.4; i += 1
lightMotif(sh0('lightIn') + 0.3, 0.5, 0.12, inst=celesta, up=12, dur=2.0)
# the far door: Eren; each step a drum; the giant (a hit and the choir); the command (the march)
t0 = T['door']; add(mus, drone(sh0('late') - t0, 36.7, 0.5, 1.2), t0, 0.3)
for k in range(9): add(mus, taiko(0.9, 52), sh0('erenWalk') + 0.2 + k * 0.62, 0.18 + 0.02 * k)
erenMotif(sh0('erenWalk') + 0.5, 0.55, 0.16)
hit(T['giant15'], 0.8); add(mus, choir([mtof(m + 12) for m in CH['Dm']], 5.0, 0.4, 2.0), T['giant15'], 0.3)
march(sh0('command'), sh0('late') - 0.2, BPM, 0.7); chords(sh0('command'), sh0('late'), ['Bb', 'A'], 2 * BT, 0.2, 'choir', 12, 0.4, 0.8)
# the first words: a held note; the future: shimmer and slow celesta; the rules: the ostinato starts, a hit on "collide"
add(mus, pad([mtof(62), mtof(69)], sh0('future') - sh0('late') + 1.0, 0.3, 1.0, 2), sh0('late'), 0.1)
add(mus, shimmer(sh0('rules') - sh0('future') + 0.5, 86), sh0('future'), 0.12); chords(sh0('future'), sh0('rules'), ['Gm7', 'A7'], 3.8, 0.14, 'pad')
for i, m in enumerate([74, 77, 81, 85, 86, 81]): add(mus, celesta(mtof(m), 2.2), sh0('future') + 0.6 + i * 1.1, 0.08, (-0.4, 0.4)[i % 2])
ostinato(sh0('rules'), T['collideA'], ['Dm', 'Dm', 'Bb', 'A'], BPM, 0.08, up=-12, bassg=0.08); add(mus, riser(T['collideA'] - sh0('rulesC'), 500, 8000, 2.5), sh0('rulesC'), 0.25)
hit(T['collideA'], 1.0)
# ---- C. the four rounds: a card hit, then the ostinato under the talk
def card(sid): add(mus, taiko(1.6, 46), sh0(sid) + 0.05, 0.5); add(mus, boom(1.4), sh0(sid) + 0.05, 0.4); add(mus, choir([mtof(m + 12) for m in CH['Dm']], 2.6, 0.05, 1.8), sh0(sid) + 0.05, 0.25)
for sid in ('r1', 'r2', 'r3', 'r4'): card(sid)
ostinato(sh0('r1') + 1.2, sh0('nod'), ['Dm', 'Bb', 'Gm', 'A'], BPM, 0.09, up=-12, bassg=0.06)
chords(sh0('nod'), sh0('agree1'), ['Bbmaj7', 'Fadd9'], 4.0, 0.14, 'pad'); lightMotif(sh0('alone') + 0.4, 0.55, 0.07, inst=piano, up=0)
add(mus, choir([mtof(m + 12) for m in CH['F']], 3.5, 0.1, 2.0), T['stamp1'], 0.28)
# round 2: tighter, darker; the 80 %: a hit; the march of the giants; Light stands
ostinato(sh0('r2') + 1.2, T['eighty'] - 0.4, ['Dm', 'Eb', 'Dm', 'A'], BPM, 0.09, up=-12, bassg=0.06)
hit(T['eighty'], 1.1); add(mus, choir([mtof(m + 12) for m in CH['Dm']], 4.0, 0.05, 2.0), T['eighty'], 0.35)
t0, t1 = sh0('globe'), sh0('monster')
march(t0, t1, BPM, 0.85); ostinato(t0, t1, ['Dm', 'Bb', 'Gm', 'A'], BPM, 0.09, up=-12, bassg=0.1); chords(t0, t1, ['Dm', 'Bb', 'Gm', 'A'], 4 * BT, 0.24, 'choir', 12, 0.8, 1.2)
erenMotif(sh0('march') + 0.1, BT, 0.2)
hit(T['stand'], 0.8)
chords(sh0('monster') + 0.6, sh0('mirror'), ['Gm', 'A'], 4.0, 0.12, 'str', 0, 1.0, 1.4)
ostinato(sh0('agents'), sh0('mirror'), ['Gm', 'A'], BPM, 0.06, up=-12)
chords(sh0('mirror'), sh0('agree2'), ['Bb', 'A'], 3.0, 0.14, 'pad')
add(mus, choir([mtof(m + 12) for m in CH['F']], 3.5, 0.1, 2.0), T['stamp2'], 0.28)
# round 3: Light's world on an organ; Eren's face changes (a rising string swell); "freedom" on the drums
chords(sh0('god'), sh0('eChange'), ['Dm', 'Bb', 'Gm', 'A7'], 2.9, 0.22, 'organ', 0, 0.1, 1.2); chords(sh0('god'), sh0('eChange'), ['Dm', 'Bb', 'Gm', 'A7'], 2.9, 0.16, 'choir', 12, 0.6, 1.2)
add(mus, strings([mtof(62), mtof(69), mtof(74)], sh0('eWall') - sh0('eChange') + 0.6, 3.0, 0.6), sh0('eChange'), 0.16); add(mus, riser(sh0('eWall') - sh0('eChange'), 300, 6000, 2.5), sh0('eChange'), 0.18)
erenMotif(sh0('eWall') + 0.2, 0.62, 0.16); chords(sh0('eWall'), sh0('burn'), ['Dm', 'Bb'], 3.4, 0.12, 'str', 0, 0.8, 1.2)
march(sh0('burn'), sh0('clash3'), BPM, 0.8); ostinato(sh0('burn'), sh0('clash3'), ['Dm', 'Bb', 'Gm', 'A'], BPM, 0.08, up=-12, bassg=0.09)
add(mus, riser(sh0('clash3') - sh0('strings') + 0.2, 500, 9000, 2.5), sh0('strings'), 0.25)
hit(T['crack'], 1.1)
# round 4: a throne (organ, cold); heroes (Eren's call, slow and sad on strings); the verdict on piano
chords(sh0('throne'), sh0('heroes'), ['Dm', 'Gm'], 1.8, 0.16, 'organ', 0, 0.1, 1.0)
chords(sh0('heroes'), sh0('puzzled'), ['Bbmaj7', 'Fadd9', 'Gm7', 'A'], 1.6, 0.16, 'str', 0, 0.6, 1.2); erenMotif(sh0('heroes') + 0.2, 0.75, 0.12)
chords(sh0('puzzled'), sh0('board'), ['Gm7', 'A7'], 3.4, 0.1, 'pad')
add(mus, kick(0.6, 70, 32), T['stamp4'], 0.3)
t0, t1 = sh0('board'), sh0('tick') + 1.0
tb, i = t0 + 0.2, 0
while tb < t1 - 1.0:
    c = CH[['Dm', 'Bb', 'Gm', 'A'][i % 4]]; add(mus, piano(mtof(c[0] - 12), 3.6), tb, 0.12)
    for j, m in enumerate(c): add(mus, piano(mtof(m + 12), 2.8), tb + 0.4 + j * 0.38, 0.05)
    tb += 3.0; i += 1
# ---- D. the click: a bell, the clock runs; the music finds its tempo in the seconds (60 bpm); the name; the forty seconds
add(mus, tbell(mtof(38), 7.0), T['click'] + 0.02, 0.3)
t0, t1 = T['click'] + 1.0, T['written']
tb, k = t0, 0
while tb < t1 - 0.1: add(mus, piano(mtof(26 if k % 4 else 26), 1.4) * 0.8, tb, 0.14 + 0.01 * k); tb += 1.0; k += 1
add(mus, strings([mtof(62), mtof(65)], t1 - t0 + 0.6, 4.0, 0.5), t0, 0.12); add(mus, riser(t1 - T['wr0'], 400, 7000, 2.5), T['wr0'], 0.18)
lightMotif(T['open'] + 0.1, 0.5, 0.14, inst=piano, up=12, dur=2.4)
hit(T['written'], 1.0); add(mus, choir([mtof(m + 12) for m in CH['Dm']], 3.5, 0.05, 2.0), T['written'], 0.3)
t0, t1 = T['written'] + 1.0, sh0('collide')
tb, k = t0, 0
while tb < t1 - 0.1:
    add(mus, piano(mtof(26), 1.6), tb, 0.13); add(mus, strings([mtof(38)], 1.1, 0.05, 0.3), tb, 0.08)
    if k % 2: add(mus, piano(mtof(41), 1.2), tb + 0.5, 0.05)
    tb += 1.0; k += 1
chords(sh0('heart'), sh0('collide'), ['Dm', 'Bb', 'Gm', 'A'], 4.0, 0.12, 'choir', 12, 1.0, 1.2, 'oo')
erenMotif(sh0('seen') + 0.2, 0.62, 0.13)
# the collision: both motifs at once, a swell, a hit; then everything stops for the silence
t0 = sh0('collide'); lightMotif(t0 + 0.1, 0.45, 0.12, inst=piano, up=12); erenMotif(t0 + 0.1, 0.45, 0.14); march(t0, sh0('sA') - 0.6, 84, 0.6)
chords(t0, sh0('sA') - 0.4, ['Dm', 'A'], 3.0, 0.2, 'choir', 12, 0.6, 0.8)
hit(T['collideB'] + 0.55, 1.0)
# ---- E. the silence: no music, only a sub-drone you feel more than hear
add(mus, drone(T['zero'] - sh0('sA') + 0.5, 30.0, 4.0, 0.3), sh0('sA'), 0.035)
# ---- F. zero: one chord pulled out from under, then a slow choir; he smiles (D major, wrong and warm); the lights go out
add(mus, boom(2.6), T['zero'] + 0.02, 0.45)
t0 = cs('n_end') - 0.4; chords(t0, T['smile'] - 0.1, ['Dm', 'Bb'], 2.4, 0.3, 'choir', 12, 1.5, 1.0, 'oo')
add(mus, choir([mtof(m + 12) for m in CH['D']], T['out'] - T['smile'] + 1.0, 0.6, 0.6, 'oo'), T['smile'] - 0.1, 0.42)
add(mus, celesta(mtof(78), 2.4), T['smile'] + 0.1, 0.1)
t0 = T['out'] + 1.4; add(mus, drone(DUR - t0 + 0.5, 36.7, 1.0, 2.0), t0, 0.25)
c0 = cs('n_cta'); lightMotif(c0 - 0.2, 0.42, 0.1, inst=piano, up=12); add(mus, taiko(2.4, 44), DUR - 2.2, 0.5); add(mus, choir([mtof(m + 12) for m in CH['Dm9']], DUR - c0 + 0.5, 0.8, 2.2), c0 - 0.2, 0.22)
mus = reverb(mus, 2.8, 0.3, 3)

# ---------------- effects ----------------
sfx = z()
def clunk(f=190): x = tt(0.4); return np.sin(2 * np.pi * f * x) * np.exp(-x * 25) + 0.3 * np.sin(2 * np.pi * f * 6.5 * x) * np.exp(-x * 30) + 0.15 * np.sin(2 * np.pi * f * 13.7 * x) * np.exp(-x * 40)
def squeak(d=0.25, f0=900, f1=1300): x = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(x))) / SR) * np.sin(np.linspace(0, np.pi, len(x)))
def whoosh(d=0.8, lo=300, hi=6000): x = tt(d); return shape(noise(d), lo, hi) * np.sin(np.pi * x / d) ** 2
def tick(f=3000): x = tt(0.04); return shape(noise(0.04), 1500, 9000) * np.exp(-x * 200) + 0.5 * np.sin(2 * np.pi * f * x) * np.exp(-x * 140) + 0.4 * np.sin(2 * np.pi * 900 * x) * np.exp(-x * 90)
def tock(): return tick(2200) * 0.9
def shutter(): return shape(noise(0.05), 2000, 10000) * np.exp(-tt(0.05) * 90)
def paper(d=0.35): x = tt(d); return shape(noise(d), 400, 5000) * np.sin(np.pi * x / d) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * x)))
def scratch(d):
    x = tt(d); return shape(noise(d), 1800, 8000) * np.clip(shape(R.standard_normal(len(x)), 4, 22) * 60, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * x))
def heart(): return mx(thump(0.22, 52) * 1.0, np.concatenate([np.zeros(at(0.17)), thump(0.2, 46) * 0.7]))
def stomp(): return mx(kick(1.2, 60, 26) * 1.0, 0.6 * shape(noise(1.2), 30, 260) * np.exp(-tt(1.2) * 3), 0.15 * shape(noise(0.6), 800, 4000) * np.exp(-tt(0.6) * 6))
def stampT(): return mx(thump(0.25, 90) * 0.9, 0.5 * shape(noise(0.12), 300, 3000) * np.exp(-tt(0.12) * 40))
def crack(): x = tt(0.9); return shape(noise(0.9), 1500, 12000) * (np.exp(-x * 9) + 0.3 * (np.sin(2 * np.pi * 37 * x) > 0.6) * np.exp(-x * 4))
def wetstep(): return mx(thump(0.12, 90) * 0.6, 0.35 * shape(noise(0.14), 600, 5000) * np.exp(-tt(0.14) * 30))
def switch(): return mx(clunk(160) * 0.9, 0.4 * shape(noise(0.06), 1000, 7000) * np.exp(-tt(0.06) * 70))
def door(): x = tt(1.4); return mx(squeak(1.0, 240, 170) * 0.4, 0.5 * shape(noise(1.0), 200, 1500) * np.sin(np.pi * tt(1.0)) * 0.6, np.concatenate([np.zeros(at(0.95)), mx(kick(0.4, 80, 40), clunk(130) * 0.5) * 0.9]))
# the pen (open and at the end)
add(sfx, scratch(T['write1'] - T['write0']), T['write0'], 0.32, 0.15)
add(sfx, scratch(T['written'] - T['wr0']), T['wr0'], 0.32, 0.15); add(sfx, mx(paper(0.5), thump(0.2, 120) * 0.3), T['open'] - 0.1, 0.35)
# the forty seconds collapsing: ticks speeding up
t, gap = sh0('fast') + 0.05, 0.16
while t < sh0('cell') - 0.05: add(sfx, tick(), t, 0.16); t += gap; gap = max(0.035, gap * 0.9)
# the cell: the heart lurches, the fall
add(sfx, heart(), T['grab'] - 0.05, 0.7); add(sfx, heart(), T['grab'] + 0.75, 0.45)
add(sfx, mx(thump(0.4, 70), 0.5 * shape(noise(0.3), 200, 3000) * np.exp(-tt(0.3) * 15)), T['fall'] + 0.4, 0.5)
# the giants' footsteps
t = T['shake'] - 0.3
while t < sh0('horizon') + 0.2: add(sfx, stomp(), t, 0.55); t += 0.9
for k in range(4): add(sfx, stomp(), sh0('horizon') + 0.6 + k * 0.9, 0.35, (-0.5, 0.5)[k % 2])
t0 = sh0('feet'); k = 0
while True:
    tf = t0 + 1.25 * (0.45 + 0.9 * k)
    if tf > sh0('twoL') - 0.05: break
    add(sfx, stomp(), tf, 0.75); k += 1
for k in range(3): add(sfx, stomp(), sh0('twoE') + 0.4 + k * 0.85, 0.3, 0.4)
# title
add(sfx, whoosh(1.0, 300, 7000), T['title'] - 0.8, 0.25)
# the door, Eren's wet steps, the giant's steam
add(sfx, door(), T['door'] - 0.95 + 0.25, 0.5, 0.4)
t = sh0('erenWalk') + 0.1
while t < sh0('titan') - 0.1: add(sfx, wetstep(), t, 0.22, 0.2 - (t - sh0('erenWalk')) * 0.05); t += np.pi / 5.5
add(sfx, shape(noise(4.0), 1500, 9000) * adsr(at(4.0), 0.8, 0.1, 1, 1.5), T['giant15'] + 0.2, 0.06)
for k in range(5): add(sfx, stomp(), sh0('command') + 0.3 + k * 0.8, 0.25, R.uniform(-0.5, 0.5))
add(sfx, crack(), T['collideA'], 0.45)
# rounds: a whoosh into each card; the court's flashes; the stamps
for sid in ('r1', 'r2', 'r3', 'r4'): add(sfx, whoosh(0.7, 400, 8000), sh0(sid) - 0.45, 0.3)
for i in range(10): add(sfx, shutter(), sh0('court') + R.uniform(0.1, 2.8), 0.16, R.uniform(-0.7, 0.7))
add(sfx, stampT(), cs('l_rotten') + 0.01 if False else wword('l_rotten', 'free') - 0.1 + 0.25, 0.5)
for ts in (T['stamp1'], T['stamp2'], T['stamp4']): add(sfx, stampT(), ts + 0.2, 0.6)
# the giant's foot, the march, the agents falling, the stand
add(sfx, stomp(), sh0('foot') + 0.72 * (sh0('kid') - sh0('foot')), 0.8)
t = sh0('march') + 0.1
while t < sh0('monster'): add(sfx, stomp(), t, 0.4, R.uniform(-0.6, 0.6)); t += 0.7
add(sfx, mx(squeak(0.3, 300, 220) * 0.4, thump(0.2, 90)), T['stand'], 0.25, -0.2)
for i in range(12): add(sfx, mx(thump(0.25, 70), 0.3 * shape(noise(0.2), 300, 2000) * np.exp(-tt(0.2) * 20)), sh0('agents') + 0.4 + i * 0.32 + 0.3, 0.16, -0.7 + i * 0.12)
add(sfx, mx(squeak(0.3, 300, 220) * 0.4, thump(0.2, 90)), T['erenStand'], 0.25, 0.2)
for i in range(6): add(sfx, mx(squeak(0.06, 2400, 1800) * 0.5, shape(noise(0.05), 2000, 8000) * np.exp(-tt(0.05) * 60)), sh0('strings') + 0.9 + i * 0.13, 0.2, 0.4)
add(sfx, crack(), T['crack'], 0.6)
# the clock: the click, then every second until zero (the countdown's seconds), the last one louder
add(sfx, mx(clunk(300) * 0.8, tick(2000)), T['click'], 0.55, -0.1)
t, k = T['click'] + 1.0, 0
while t < T['zero'] + 0.5:
    last = abs(t - T['zero']) < 0.02
    add(sfx, (tick() if k % 2 == 0 else tock()), t, (0.45 if last else (0.13 if t > sh0('sA') else 0.2)), -0.1); t += 1.0; k += 1
# Eren's heart: in the x-ray loud, through the silence quietly, and it does not stop at zero
t = np.ceil(sh0('heart') * 1.1) / 1.1
while t < DUR - 4.0:
    g = 0.5 if t < sh0('failed') else (0.16 if t < sh0('sA') else 0.12)
    if t > T['zero'] - 0.1 and t < T['zero'] + 3.5: g = 0.36
    if t > T['out'] + 1.4: g = 0.16
    add(sfx, heart(), t, g); t += 1 / 1.1
# the end: three lights switching off
for k in range(3): add(sfx, switch(), T['out'] + 0.6 * k, 0.4, (-0.5, 0.0, 0.5)[k])
sfx = reverb(sfx, 1.6, 0.2, 5)

# ---------------- ambience: rain on the glass roof (kept well under the music) ----------------
amb = z()
def rain(d, g=1.0, heavy=0.0):
    x = tt(d); s = shape(noise(d), 500, 9000) * (0.7 + 0.3 * shape(R.standard_normal(len(x)), 0.2, 2) * 30)
    n = int(d * (30 + 60 * heavy))
    for i in range(n):
        j = R.integers(0, len(x) - 2000); y = tt(0.02); s[j:j + len(y)] += R.uniform(0.5, 2) * shape(noise(0.02), 2000, 9000) * np.exp(-y * 250)
    return s * adsr(len(x), 1.0, 0.1, 1, 1.0) * g
def stomps(d): x = tt(d); return shape(noise(d), 25, 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * x))
add(amb, shape(noise(T['title']), 30, 400) * adsr(at(T['title']), 2, 0.1, 1, 1), 0, 0.15)                # wind over the open
add(amb, rain(sh0('r1') - sh0('stWide') + 1, 1.0), sh0('stWide') - 0.5, 0.35)
add(amb, rain(sh0('tick') - sh0('r1') + 1, 0.7), sh0('r1') - 0.5, 0.25)
add(amb, rain(T['click'] - sh0('tick') + 0.5, 0.25), sh0('tick'), 0.25)                                        # frozen: the rain hushes
add(amb, rain(sh0('sA') - T['click'] + 1.0, 1.0, 0.6), T['click'], 0.35)                                     # the station moves
add(amb, rain(T['zero'] - sh0('sA') + 1.0, 1.0, 0.3), sh0('sA') - 0.5, 0.1)                                  # the silence: the rain far away
add(amb, rain(T['out'] - T['zero'] + 1.0, 1.0, 0.4), T['zero'], 0.22)
add(amb, stomps(sh0('kid') - sh0('globe')), sh0('globe'), 0.2)
add(amb, rain(DUR - T['out'], 0.4), T['out'], 0.2)
# ---------------- voices ----------------
voice = z()
def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
PAN = {'n': 0.0, 'l': -0.14, 'e': 0.14}
GAIN = {'n': 1.0, 'l': 1.1, 'e': 1.1}
venv = np.zeros(N); used = 0
for cid in C['clips']:
    c = CL[cid]
    if 'at' not in c: continue
    s = load(os.path.join(FILM, c['mp3'])); s = s / (np.sqrt(np.mean(s[np.abs(s) > 0.02] ** 2)) + 1e-9) * 0.1 * GAIN[c['who']]
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

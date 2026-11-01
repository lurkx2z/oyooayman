#!/usr/bin/env python3
"""v2 soundtrack of strong-bones: an original score, effects, ambience beds and seven voices, mixed to one WAV.
   node films/strong-bones/v2/sound/cues.cjs && python3 films/strong-bones/v2/sound/mix.py && bash films/strong-bones/v2/sound/master.sh
Writes v2/sound/out/: music.wav, sfx.wav, amb.wav, voice.wav (stems) and premaster.wav; master.sh makes mix.wav,
mix.m4a and ../soundtrack.js. Everything but the voices is synthesised from seeded noise and maths.
Rule (owner, 2026-10-31): the music must clearly lead the ambience; the voice leads everything while it speaks."""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE); OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
C = json.load(open(os.path.join(HERE, 'cues.json')))
T = C['T']; SR = 48000; DUR = C['duration']; N = int(DUR * SR) + SR
R = np.random.default_rng(20261101)
shot = {s['id']: s for s in C['shots']}

def z(): return np.zeros((2, N))
def at(t): return int(round(t * SR))
def add(bus, sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if sig.ndim == 1: sig = np.vstack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))]) * np.sqrt(2)
    j = min(N, i + sig.shape[1]);
    if j <= i or i < 0: return
    bus[:, i:j] += sig[:, : j - i] * gain
def tt(d): return np.arange(int(round(d * SR))) / SR
def db(x): return 10 ** (x / 20)
def shape(sig, lo=20, hi=20000, tilt=0.0):
    """band-limit by FFT (smooth edges); tilt dB/octave above 1 kHz"""
    n = len(sig); F = np.fft.rfft(sig); f = np.fft.rfftfreq(n, 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    if tilt: m *= (np.maximum(f, 1) / 1000) ** (tilt / 6.02)
    return np.fft.irfft(F * m, n)
def noise(d): return R.standard_normal(int(round(d * SR)))
def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s; A = int(a * SR); D = int(d * SR); Rr = int(r * SR)
    e[:A] = np.linspace(0, 1, A) if A else e[:A]; e[A:A + D] = np.linspace(1, s, len(e[A:A + D]))
    if Rr: e[-Rr:] *= np.linspace(1, 0, len(e[-Rr:]))
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

# ---------------- instruments ----------------
def pluck(f, d=0.9, bright=1.0):
    x = tt(d); s = sum((0.7 ** k) * np.sin(2 * np.pi * f * (k + 1) * x) * np.exp(-x * (3 + k * 2.5 / bright)) for k in range(6))
    return s * np.minimum(1, x / 0.004)
def piano(f, d=2.2):
    x = tt(d); s = sum((0.55 ** k) * np.sin(2 * np.pi * f * (k + 1) * (1 + 0.0004 * k * k) * x) * np.exp(-x * (1.1 + k * 0.9)) for k in range(7))
    return s * np.minimum(1, x / 0.003) * (1 - np.clip((x - d + 0.15) / 0.15, 0, 1))
def pad(fs, d, a=1.2, r=1.5, bright=4):
    x = tt(d); s = np.zeros(len(x))
    for f in fs:
        for det in (-0.004, 0.0, 0.0037):
            ph = R.uniform(0, 2 * np.pi)
            s += sum((1 / (k + 1)) * np.sin(2 * np.pi * f * (1 + det) * (k + 1) * x + ph * k) for k in range(bright))
    s *= adsr(len(x), a, 0.3, 0.85, r) / (len(fs) * 3)
    return s
def kick(d=0.5, f0=110, f1=42):
    x = tt(d); f = f1 + (f0 - f1) * np.exp(-x * 30); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x * 7) + 0.3 * shape(noise(d), 1500, 6000) * np.exp(-x * 60)
def clap(d=0.25):
    x = tt(d); return shape(noise(d), 900, 5000) * (np.exp(-x * 35) + 0.5 * np.exp(-np.maximum(0, x - 0.012) * 40) * (x > 0.012))
def thump(d=0.35, f=55):
    x = tt(d); return np.sin(2 * np.pi * f * x * (1 - 0.3 * x)) * np.exp(-x * 14) * np.minimum(1, x / 0.004)
def hat(d=0.06):
    x = tt(d); return shape(noise(d), 6000, 16000) * np.exp(-x * 80)

# ---------------- helpers on the cue sheet ----------------
sh0 = lambda k: shot[k]['t0']
def wword(cid, w, n=0):
    L = [x['s'] for x in C['clips'][cid]['words'] if x['w'].lower().strip('.,?!"\'').startswith(w)]
    return L[n]
def bed(d, lo, hi, a=0.5, r=0.5): return shape(noise(d), lo, hi) * adsr(at(d), a, 0.1, 1, r)

# ---------------- score ----------------
mus = z()
CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'F': [41, 45, 48], 'C': [48, 52, 55], 'Gm': [43, 46, 50], 'A': [45, 49, 52], 'Fmaj': [53, 57, 60]}
# A: morning — a light pizzicato in F (with breaths at the slap, the lid and the mug)
beat = 60 / 116; t = 0.2; k = 0
pat = [65, 69, 72, 69, 67, 70, 74, 70, 65, 69, 72, 77, 76, 72, 70, 67]
while t < sh0('xrayWrist') - 0.1:
    if any(abs(t - T[e]) < 0.35 for e in ('slap', 'lid', 'mug')): k += 1; t += beat / 2; continue
    n = pat[k % len(pat)]; add(mus, pluck(mtof(n), 0.5), t, 0.22 if k % 2 == 0 else 0.15, pan=0.25 * np.sin(k))
    if k % 4 == 0: add(mus, pluck(mtof(n - 24), 0.9, 0.6), t, 0.32, pan=-0.2)
    if k % 2 == 1: add(mus, hat(0.04), t, 0.06)
    k += 1; t += beat / 2
for e in ('slap', 'lid', 'mug'):
    for m, dl in ((77, 0), (81, 0.06), (84, 0.12)): add(mus, pluck(mtof(m), 0.7, 1.5), T[e] + 0.12 + dl, 0.2)
# x-ray: a cold suspended chord
add(mus, pad([mtof(m) for m in [50, 57, 64]], sh0('title') - sh0('xrayWrist') + 0.6, 0.3, 0.6, 3), sh0('xrayWrist'), 0.4)
# title: a boom and a big Dm swell
t0 = sh0('title'); add(mus, kick(1.6, 70, 30), t0 + 0.02, 0.9)
add(mus, pad([mtof(m) for m in CH['Dm'] + [62, 69]], 4.6, 0.25, 1.4, 6), t0, 0.6)
for m, dl in ((62, 0), (65, 0.12), (69, 0.24), (74, 0.36)): add(mus, piano(mtof(m), 2.5), t0 + 0.05 + dl, 0.2)
# B: the doctor — curious Dm–Bb–Gm–A with a ticking pluck
t0, t1 = sh0('docWide'), sh0('gymWide'); L = (t1 - t0) / 4
for i, c in enumerate(['Dm', 'Bb', 'Gm', 'A']): add(mus, pad([mtof(m) for m in CH[c]], L + 1.0, 0.6, 1.0, 3), t0 + i * L, 0.42)
t = t0
while t < t1 - 0.3: add(mus, pluck(mtof(74), 0.18, 2), t, 0.07, pan=0.4); t += beat
for i in range(16): add(mus, pluck(mtof([62, 65, 69, 67][i % 4] + (0 if i < 8 else 2)), 0.9, 0.8), t0 + i * L / 4 + beat / 2, 0.15, pan=-0.3)
add(mus, kick(1.0, 60, 30), T['bend'], 0.5)
# C: training → record → fame: drums build, Bb–F–C–Dm, a fanfare at the record
t0, t1 = sh0('gymWide'), sh0('finalWide'); b2 = 60 / 104; t = t0; i = 0
while t < t1 - 0.2:
    build = min(1, (t - t0) / max(0.1, T['kilos'] - t0))
    add(mus, kick(), t, 0.45 + 0.35 * build)
    if i % 2 == 1: add(mus, clap(), t, 0.15 + 0.3 * build)
    if t > sh0('egg'): add(mus, hat(), t + b2 / 2, 0.18)
    t += b2; i += 1
L = (t1 - t0) / 4
for i, c in enumerate(['Bb', 'F', 'C', 'Dm']): add(mus, pad([mtof(m + 12) for m in CH[c]] + [mtof(CH[c][0])], L + 0.8, 0.5, 0.8, 6), t0 + i * L, 0.45 + 0.12 * i)
for m, dl in ((70, 0), (74, 0.08), (77, 0.16), (82, 0.24), (86, 0.32)): add(mus, piano(mtof(m), 2.5), T['kilos'] + 0.15 + dl, 0.26)
add(mus, kick(1.4, 80, 30) + 0.5 * shape(noise(1.4), 3000, 14000) * np.exp(-tt(1.4) * 3), T['kilos'] + 0.1, 0.6)
# D: the final → the scaffold → the choice: drone, tremolo, a pulse that speeds up
t0, t1 = sh0('finalWide'), T['letGo']; x = tt(t1 - t0 + 0.2)
rise = np.clip((x - (T['bolt'] - t0)) / (t1 - T['bolt']), 0, 1)
drone = (np.sin(2 * np.pi * mtof(38) * x) + 0.4 * np.sin(2 * np.pi * mtof(45) * x)) * np.minimum(1, x / 1.5)
trem = pad([mtof(62), mtof(65), mtof(69)], t1 - t0 + 0.2, 1.5, 0.15, 5) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x))
add(mus, drone * (0.3 + 0.25 * rise), t0, 1.0); add(mus, trem * (0.25 + 0.55 * rise), t0, 1.0)
t = t0 + 0.4
while t < t1 - 0.1:
    p = 0.8 - 0.5 * np.clip((t - T['bolt']) / (t1 - T['bolt']), 0, 1); add(mus, kick(0.4, 80, 38), t, 0.35 + 0.15 * rise[min(len(rise) - 1, at(t - t0))]); t += p
add(mus, kick(1.2, 70, 30), sh0('maya'), 0.6)
# E: let go — the music stops dead. A riser into the run.
x = tt(T['catch'] - T['run0'] + 0.05); add(mus, shape(noise(len(x) / SR), 800, 9000) * (x / x[-1]) ** 2.5 * 0.5, T['run0'], 1.0)
# G: home — a warm piano Bb–F–Gm–F with a melody, an open chord for the question
t0 = sh0('tv') + 0.2; L = 2.4; mel = [74, 72, 70, 69, 70, 72, 74, 77, 76, 74, 72, 74]
for i, c in enumerate(['Bb', 'F', 'Gm', 'Fmaj', 'Bb', 'F']):
    tb = t0 + i * L
    if tb > DUR - 1: break
    for j, m in enumerate(CH[c]): add(mus, piano(mtof(m), 3.0), tb + j * 0.11, 0.17)
    add(mus, piano(mtof(CH[c][0] - 12), 3.2), tb, 0.2); add(mus, pad([mtof(m) for m in CH[c]], L + 0.8, 0.8, 1.0, 2), tb, 0.16)
    for q in range(2): add(mus, piano(mtof(mel[(2 * i + q) % len(mel)]), 2.0), tb + q * L / 2 + 0.6, 0.12)
cta = C['clips']['n_cta']['start']
add(mus, pad([mtof(m) for m in [58, 62, 65, 69]], DUR - cta + 0.5, 0.2, 1.2, 4), cta - 0.1, 0.4)
mus = reverb(mus, 2.4, 0.28, 3)

# ---------------- effects (hits) ----------------
sfx = z()
def glass(d=0.5, n=14):
    x = tt(d); s = shape(noise(d), 2000, 14000) * np.exp(-x * 25)
    for i in range(n):
        f = R.uniform(3000, 8000); t0 = R.uniform(0, max(0.01, d - 0.13)); y = tt(0.12); s[at(t0): at(t0) + len(y)] += 0.25 * np.sin(2 * np.pi * f * y) * np.exp(-y * 50)
    return s
def clunk(f=190): x = tt(0.4); return np.sin(2 * np.pi * f * x) * np.exp(-x * 25) + 0.3 * np.sin(2 * np.pi * f * 6.5 * x) * np.exp(-x * 30) + 0.15 * np.sin(2 * np.pi * f * 13.7 * x) * np.exp(-x * 40)
def clang(d=2.5, f0=523): x = tt(d); return sum(a * np.sin(2 * np.pi * f0 * f * x) * np.exp(-x * dc) for f, a, dc in ((1, 1, 2.5), (2.575, 0.6, 3.5), (4.57, 0.4, 5), (6.9, 0.25, 7), (1.507, 0.5, 3)))
def bone(): x = tt(0.12); return shape(noise(0.12), 900, 7000) * np.exp(-x * 45) + 0.6 * thump(0.12, 120)
def boing(d=0.6): x = tt(d); return np.sin(2 * np.pi * (300 + 200 * np.sin(2 * np.pi * 9 * x) * np.exp(-x * 4)) * x) * np.exp(-x * 5)
def squeak(d=0.25, f0=900, f1=1300): x = tt(d); return np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, len(x))) / SR) * np.sin(np.linspace(0, np.pi, len(x)))
def groan(d):
    x = tt(d); f = 70 + 30 * np.sin(2 * np.pi * 0.7 * x) + 25 * x / d; ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3.01 * ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.3 * x)) * np.minimum(1, x / 0.5)
def whoosh(d=0.8): x = tt(d); return shape(noise(d), 300, 6000) * np.sin(np.pi * x / d) ** 2
def crowd(d, lo=250, hi=2500, var=0.3):
    x = tt(d); s = shape(noise(d), lo, hi); am = 1 + var * shape(R.standard_normal(len(x)), 0.3, 3) * 40; return s * np.clip(am, 0.2, 2)
# the alarm clock: a bell ringing until the slap, then the smash (crunch, springs, glass)
d = T['slap']; x = tt(d); bell = (np.sin(2 * np.pi * 2350 * x) + 0.5 * np.sin(2 * np.pi * 3710 * x)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 16 * x))) * np.minimum(1, x / 0.05)
add(sfx, bell, 0.0, 0.07, -0.3)
add(sfx, kick(0.6, 120, 40), T['slap'], 0.8); add(sfx, glass(0.6, 18), T['slap'], 0.5); add(sfx, shape(noise(0.3), 300, 4000) * np.exp(-tt(0.3) * 14), T['slap'], 0.5)
add(sfx, boing(), T['slap'] + 0.05, 0.12, 0.3); add(sfx, clunk(310), T['slap'] + 0.35, 0.2, -0.3); add(sfx, clunk(420), T['slap'] + 0.5, 0.15, 0.3)
# the jar: grind, glass crack
add(sfx, shape(noise(0.5), 200, 2000) * np.sin(np.linspace(0, np.pi, at(0.5))) * 0.4, T['lid'] - 0.6, 0.2)
add(sfx, glass(), T['lid'], 0.6); add(sfx, thump(0.2, 140), T['lid'], 0.35)
# the mug: snap, fall, smash + splash
add(sfx, shape(noise(0.05), 1500, 8000) * np.exp(-tt(0.05) * 90), T['mug'], 0.5)
add(sfx, clunk(), T['mugHit'], 0.5); add(sfx, glass(0.4, 8) * 0.6, T['mugHit'], 0.5)
add(sfx, shape(noise(0.45), 400, 5000) * np.exp(-tt(0.45) * 7) * np.minimum(1, tt(0.45) / 0.01), T['mugHit'] + 0.02, 0.3)
# x-ray: a hum and crackles as the cracks glow
x = tt(sh0('title') - sh0('xrayWrist')); add(sfx, (np.sin(2 * np.pi * 120 * x) + 0.3 * np.sin(2 * np.pi * 240 * x)) * np.minimum(1, x / 0.2), sh0('xrayWrist'), 0.05)
for i in range(4): add(sfx, glass(0.15, 3) * 0.6, T['crack'] + i * 0.35, 0.3, (-0.3, 0.3)[i % 2])
add(sfx, whoosh(1.0), sh0('title') - 0.5, 0.35)
# doctor: marker squeak, the rail bending (creak), the hand letting go
add(sfx, squeak(0.5, 1800, 2400), T['circle'] - 0.3, 0.06)
add(sfx, groan(1.1) * 0.6 + squeak(1.1, 400, 260) * 0.4, T['bend'], 0.3)
# gym: chalk clap, bar clank; the egg survives (a tiny tap)
add(sfx, shape(noise(0.15), 600, 5000) * np.exp(-tt(0.15) * 30), sh0('gymWide') + 0.1, 0.3); add(sfx, clang(0.8, 900) * 0.4, sh0('gymWide') + 0.5, 0.25)
add(sfx, shape(noise(0.03), 3000, 9000) * np.exp(-tt(0.03) * 100), T['egg'], 0.15)
# the record: a roar, camera clicks; then phone pings
ta, tb = sh0('recWide'), sh0('phone')
add(sfx, crowd(T['kilos'] - ta + 0.4, 200, 1800) * adsr(at(T['kilos'] - ta + 0.4), 0.3, 0.1, 1, 0.3), ta, 0.3)
roar = crowd(tb - T['kilos'] + 0.6, 300, 4000, 0.5) * adsr(at(tb - T['kilos'] + 0.6), 0.25, 0.3, 0.85, 0.5)
add(sfx, roar, T['kilos'], 0.8, -0.2); add(sfx, crowd(tb - T['kilos'] + 0.6, 300, 4000, 0.5) * adsr(at(tb - T['kilos'] + 0.6), 0.3, 0.3, 0.85, 0.5), T['kilos'] + 0.05, 0.8, 0.2)
for i in range(22): add(sfx, shape(noise(0.03), 2000, 10000) * np.exp(-tt(0.03) * 120), ta + R.uniform(0, tb - ta), 0.12, R.uniform(-0.8, 0.8))
for i in range(5): y = tt(0.18); add(sfx, np.sin(2 * np.pi * (1320 if i % 2 else 1760) * y) * np.exp(-y * 18), tb + 0.2 + i * 0.36, 0.08, 0.3)
# the final: a hush of the crowd
ta, tb = sh0('finalWide'), sh0('outside'); add(sfx, crowd(tb - ta + 0.3, 200, 1200) * adsr(at(tb - ta + 0.3), 0.3, 0.1, 1, 0.3), ta, 0.12)
# the scaffold: creaks, the bolt shears (ping + scrape), a groan that grows, the buckets fall
for k in range(3): add(sfx, squeak(0.3, 700, 520), sh0('outside') + 0.8 + k * 1.1, 0.04)
add(sfx, clang(0.6, 1900) * 0.5, T['bolt'], 0.35); add(sfx, shape(noise(0.25), 1500, 9000) * np.exp(-tt(0.25) * 12), T['bolt'], 0.3)
add(sfx, groan(T['catch'] - T['bolt']) * np.linspace(0.3, 1, at(T['catch'] - T['bolt'])), T['bolt'] + 0.1, 0.22)
for k in range(3): add(sfx, clunk(260 + k * 60), T['run0'] + 0.4 + k * 0.2, 0.25, 0.4)
# the choice: heartbeat (slow → fast); the bar hits the platform
t = wword('n_cost', 'catch'); bpm = 64
while t < T['catch'] - 0.1:
    add(sfx, thump(0.25, 52), t, 0.6); add(sfx, thump(0.22, 46), t + 0.22, 0.4)
    bpm = 64 + 80 * np.clip((t - T['letGo']) / (T['catch'] - T['letGo']), 0, 1); t += 60 / bpm
add(sfx, kick(0.8, 70, 30) + 0.5 * clang(0.8, 340), T['letGo'] + 0.45, 0.7)
# the run: fast footsteps, wind; the catch: clang, two bone cracks, a boom; then ringing
t = T['run0'] + 0.05; k = 0
while t < T['catch'] - 0.05: add(sfx, thump(0.12, 90 + 10 * (k % 2)) + 0.3 * shape(noise(0.12), 500, 3000) * np.exp(-tt(0.12) * 40), t, 0.45, (-0.2, 0.2)[k % 2]); t += 0.14; k += 1
add(sfx, whoosh(T['catch'] - T['run0']), T['run0'], 0.3)
add(sfx, clang(), T['catch'], 0.5); add(sfx, kick(1.4, 90, 28), T['catch'], 0.95)
add(sfx, bone(), T['catch'] + 0.06, 0.95, -0.4); add(sfx, bone(), T['catch'] + 0.12, 0.95, 0.4)
x = tt(3.0); add(sfx, np.sin(2 * np.pi * 3200 * x) * np.exp(-x * 1.0) * np.minimum(1, x / 0.3), T['catch'] + 0.3, 0.03)
add(sfx, shape(noise(1.6), 100, 900) * np.exp(-tt(1.6) * 2), T['catch'] + 0.2, 0.2)       # dust
# home: the jar pops
add(sfx, shape(noise(0.08), 800, 6000) * np.exp(-tt(0.08) * 60) + 0.5 * thump(0.08, 300), T['pop'], 0.45)
sfx = reverb(sfx, 1.4, 0.18, 5)

# ---------------- ambience beds (kept well under the music) ----------------
amb = z()
def birds(t0, t1, n, g=0.05):
    for i in range(n):
        tc = t0 + R.uniform(0.1, max(0.2, t1 - t0 - 0.3)); y = tt(0.12); f = 3500 + 900 * np.sin(np.linspace(0, 3, len(y)))
        add(amb, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(y))), tc, g, R.uniform(-0.6, 0.6))
add(amb, bed(sh0('jar'), 100, 900), 0, 0.15); birds(0.3, sh0('jar'), 4)
add(amb, bed(sh0('xrayWrist') - sh0('jar'), 120, 1200), sh0('jar'), 0.15)
add(amb, bed(sh0('docWide') - sh0('title'), 80, 1500), sh0('title'), 0.2); birds(sh0('title'), sh0('docWide'), 6)
add(amb, bed(sh0('gymWide') - sh0('docWide'), 100, 800), sh0('docWide'), 0.12)
add(amb, bed(sh0('recWide') - sh0('gymWide'), 100, 1500), sh0('gymWide'), 0.15)
add(amb, bed(sh0('finalWide') - sh0('billboard'), 80, 1500), sh0('billboard'), 0.18)
add(amb, bed(sh0('maya') - sh0('outside'), 60, 700), sh0('outside'), 0.2); birds(sh0('outside'), sh0('bolt'), 3, 0.03)
add(amb, bed(sh0('tv') - sh0('run'), 60, 700), sh0('run'), 0.15)
x = tt(DUR - sh0('tv')); add(amb, (0.4 * np.sin(2 * np.pi * 100 * x) + shape(noise(DUR - sh0('tv')), 100, 900)) * adsr(len(x), 0.8, 0.1, 1, 1.0), sh0('tv'), 0.12)

# ---------------- voices ----------------
voice = z()
def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
PAN = {'n': 0.0, 'y': -0.12, 's': 0.12, 'd': -0.15, 'c': -0.2, 'a': 0.0, 'w': 0.2}
GAIN = {'n': 1.0, 'y': 1.15, 's': 1.2, 'd': 1.1, 'c': 1.15, 'a': 1.0, 'w': 0.95}
venv = np.zeros(N); pa = z()
for cid, c in C['clips'].items():
    s = load(os.path.join(FILM, c['mp3'])) * GAIN[c['who']]
    if cid == 'a_tv': s = shape(s, 350, 3500) * 0.8                                   # through the TV speaker
    if cid in ('a_record', 'a_final'): add(pa, s, c['at'], 1.0); continue              # the stadium PA: big room
    add(voice, s, c['at'], 1.0, PAN[c['who']])
    i, j = at(c['start'] - 0.12), min(N, at(c['end'] + 0.2)); venv[i:j] = 1
for cid in ('a_record', 'a_final'):
    c = C['clips'][cid]; i, j = at(c['start'] - 0.12), min(N, at(c['end'] + 0.2)); venv[i:j] = 1
voice = reverb(voice, 0.6, 0.06, 7) + reverb(pa, 2.8, 0.45, 8)
k = np.ones(at(0.25)) / at(0.25); duck = np.convolve(venv, k, 'same')
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
voice *= 0.1 / rms(voice[:, venv > 0.5])
mus *= 0.1 / rms(mus) * db(-2.5)
sfx *= 0.1 / rms(sfx) * db(-9)
amb *= 0.1 / rms(amb) * db(-22.5)
mus_d = mus * (1 - duck * (1 - db(-8)))
mix = voice + mus_d + sfx + amb
for name, sig in (('music', mus_d), ('sfx', sfx), ('amb', amb), ('voice', voice), ('premaster', mix)):
    sig = sig[:, : int(DUR * SR)]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', os.path.join(OUT, name + '.wav')], input=(sig.T / max(1.0, np.abs(sig).max() * 1.05)).astype(np.float64).tobytes() if name == 'premaster' else (sig.T * 0.5).astype(np.float64).tobytes(), check=True)
print('balance (RMS dB): voice %.1f  music %.1f  sfx %.1f  amb %.1f' % (20 * np.log10(rms(voice[:, venv > 0.5])), 20 * np.log10(rms(mus_d)), 20 * np.log10(rms(sfx)), 20 * np.log10(rms(amb))))

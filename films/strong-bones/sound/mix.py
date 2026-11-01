#!/usr/bin/env python3
"""The soundtrack of the strong-bones test: an original score, the effects and the two voices, mixed to one WAV.
   python3 films/strong-bones/sound/mix.py        (run sound/cues.cjs first; needs numpy and ffmpeg)
Writes sound/out/: music.wav, sfx.wav, amb.wav, voice.wav (stems), mix.wav (normalised: -15 LUFS, -1.5 dBTP) and
../soundtrack.js (MP3 160k, base64) for the page. Everything is synthesised from seeded noise and maths.
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

# ---------------- score ----------------
mus = z()
CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'F': [41, 45, 48], 'C': [48, 52, 55], 'Gm': [43, 46, 50], 'A': [45, 49, 52], 'Fmaj': [53, 57, 60], 'Eb': [51, 55, 58]}
# A: kitchen — light, playful pizzicato in F (0 → title)
beat = 60 / 112
t = 0.15; pat = [65, 69, 72, 69, 67, 70, 74, 70, 65, 69, 72, 77, 76, 72, 70, 67]
k = 0
while t < shot['title']['t0'] - 0.2:
    n = pat[k % len(pat)]; g = 0.22 if k % 2 == 0 else 0.15
    if abs(t - T['lid']) < 0.4 or abs(t - T['mug']) < 0.35: k += 1; t += beat / 2; continue    # (a breath at the two breaks)
    add(mus, pluck(mtof(n), 0.5), t, g, pan=0.25 * np.sin(k))
    if k % 4 == 0: add(mus, pluck(mtof(n - 24), 0.9, 0.6), t, 0.3, pan=-0.2)
    k += 1; t += beat / 2
# stingers at the two breaks
for tb in (T['lid'], T['mug']):
    for m, dl in ((77, 0), (81, 0.06), (84, 0.12)): add(mus, pluck(mtof(m), 0.7, 1.5), tb + 0.1 + dl, 0.2)
# title: a low boom and a Dm swell
t0 = shot['title']['t0']
add(mus, kick(1.6, 70, 30), t0 + 0.05, 0.9)
add(mus, pad([mtof(m) for m in CH['Dm'] + [62]], 5.2, 0.6, 1.8, 5), t0, 0.55)
# B: the rule (diagram + careful): a ticking pulse, a mysterious Dm–Bb–Gm–A
t0 = shot['diagram']['t0']; t1 = shot['lift']['t0']
prog = ['Dm', 'Bb', 'Gm', 'A']; L = (t1 - t0) / 4
for i, c in enumerate(prog): add(mus, pad([mtof(m) for m in CH[c]], L + 1.0, 0.8, 1.0, 3), t0 + i * L, 0.42)
t = t0
while t < t1 - 0.3:
    add(mus, pluck(mtof(74), 0.18, 2), t, 0.06, pan=0.4); t += beat
for i in range(16):
    tb = t0 + i * L / 4; add(mus, pluck(mtof([62, 65, 69, 67][i % 4] + (0 if i < 8 else 2)), 0.9, 0.8), tb + beat / 2, 0.14, pan=-0.3)
# C: the record and the nickname: drums, a triumphant Bb–F–C–Dm
t0 = shot['lift']['t0']; t1 = shot['final']['t0']
b2 = 60 / 96; t = t0; i = 0
while t < t1 - 0.2:
    build = min(1, (t - t0) / max(0.1, T['over'] - t0))
    add(mus, kick(), t, 0.55 + 0.3 * build)
    if t > T['rack'] and i % 2 == 1: add(mus, clap(), t, 0.3 + 0.25 * build)
    if t > T['over']: add(mus, hat(), t + b2 / 2, 0.2)
    t += b2; i += 1
prog = ['Bb', 'F', 'C', 'Dm']; L = (t1 - t0) / 4
for i, c in enumerate(prog): add(mus, pad([mtof(m + 12) for m in CH[c]] + [mtof(CH[c][0])], L + 0.8, 0.5, 0.8, 6), t0 + i * L, 0.5 + 0.15 * i)
for m, dl in ((70, 0), (74, 0.08), (77, 0.16), (82, 0.24)): add(mus, piano(mtof(m), 2.5), T['over'] + 0.25 + dl, 0.25)
# D: the final, the door, your sister: tension — a low drone, a tremolo, a pulse that speeds up
t0 = shot['final']['t0']; t1 = T['choice']
x = tt(t1 - t0 + 0.3)
drone = (np.sin(2 * np.pi * mtof(38) * x) + 0.4 * np.sin(2 * np.pi * mtof(45) * x)) * np.minimum(1, x / 2)
trem = pad([mtof(62), mtof(65), mtof(69)], t1 - t0 + 0.3, 2.0, 0.3, 5) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x))
rise = np.clip((x - (T['lean'] - t0)) / (t1 - T['lean']), 0, 1)
add(mus, drone * (0.25 + 0.2 * rise), t0, 1.0); add(mus, trem * (0.25 + 0.5 * rise), t0, 1.0)
t = t0 + 0.5
while t < t1 - 0.1:
    p = 0.85 - 0.45 * np.clip((t - T['lean']) / (t1 - T['lean']), 0, 1)
    add(mus, kick(0.4, 80, 38), t, 0.32); t += p
# E: the choice — the music stops dead. Only your heartbeat and a ringing (sfx). Then a riser into the run.
x = tt(T['catch'] - T['run'] + 0.05)
riser = shape(noise(len(x) / SR), 800, 9000) * (x / x[-1]) ** 2.5 * 0.5
add(mus, riser, T['run'], 1.0)
# G: a week later — a warm piano: Bb – F – Gm – F, a melody on top
t0 = T['after'] + 0.3; t1 = DUR
prog = ['Bb', 'F', 'Gm', 'Fmaj', 'Bb', 'F']; L = 2.6
mel = [74, 72, 70, 69, 70, 72, 74, 77, 76, 74, 72, 74]
for i, c in enumerate(prog):
    tb = t0 + i * L
    if tb > t1 - 1: break
    for j, m in enumerate(CH[c]): add(mus, piano(mtof(m), 3.0), tb + j * 0.11, 0.17)
    add(mus, piano(mtof(CH[c][0] - 12), 3.2), tb, 0.2)
    add(mus, pad([mtof(m) for m in CH[c]], L + 0.8, 0.8, 1.0, 2), tb, 0.18)
    for q in range(2): add(mus, piano(mtof(mel[(2 * i + q) % len(mel)]), 2.0), tb + q * L / 2 + 0.6, 0.12)
# the question: a last open chord
add(mus, pad([mtof(m) for m in [58, 62, 65, 69]], DUR - C['clips']['cta']['start'] + 0.5, 0.2, 1.2, 4), C['clips']['cta']['start'] - 0.1, 0.4)
mus = reverb(mus, 2.4, 0.28, 3)

# ---------------- effects ----------------
sfx = z()
def glass_crack():
    d = 0.5; x = tt(d); s = shape(noise(d), 2000, 14000) * np.exp(-x * 25)
    for i in range(14):
        f = R.uniform(3000, 8000); t0 = R.uniform(0, 0.35); y = tt(0.12)
        s[at(t0): at(t0) + len(y)] += 0.25 * np.sin(2 * np.pi * f * y) * np.exp(-y * 50)
    return s
add(sfx, shape(noise(0.08), 300, 3000) * np.exp(-tt(0.08) * 40), T['lid'] - 0.95, 0.12)              # the lid's grind
add(sfx, shape(noise(0.5), 200, 2000) * np.sin(np.linspace(0, np.pi, at(0.5))) * 0.4, T['lid'] - 0.6, 0.18)
add(sfx, glass_crack(), T['lid'], 0.6); add(sfx, thump(0.2, 140), T['lid'], 0.35)
# the mug: a snap, a fall, a clunk, a splash
add(sfx, shape(noise(0.05), 1500, 8000) * np.exp(-tt(0.05) * 90), T['mug'], 0.5)
def clunk(): x = tt(0.4); return (np.sin(2 * np.pi * 190 * x) * np.exp(-x * 25) + 0.3 * np.sin(2 * np.pi * 1230 * x) * np.exp(-x * 30) + 0.15 * np.sin(2 * np.pi * 2610 * x) * np.exp(-x * 40))
add(sfx, clunk(), T['mug'] + 0.17, 0.55)
add(sfx, shape(noise(0.45), 400, 5000) * np.exp(-tt(0.45) * 7) * np.minimum(1, tt(0.45) / 0.01), T['mug'] + 0.19, 0.3)
add(sfx, shape(noise(1.0), 300, 6000) * np.exp(-tt(1.0) * 9), shot['title']['t0'], 0.2)                                     # whoosh into the title
# the diagram: the muscle thumps; the crack at "break"
def wword(cid, w):
    for x in C['clips'][cid]['words']:
        if x['w'].lower().strip('.,?!"\'').startswith(w): return x['s']
tm = wword('rule', 'ten')
for i in range(int((shot['careful']['t0'] - tm) / 0.785)): add(sfx, thump(0.3, 48), tm + i * 0.785, 0.35)
add(sfx, glass_crack() * 0.5 + np.concatenate([thump(0.3, 70), np.zeros(at(0.2))]), wword('nuance', 'break'), 0.5)
add(sfx, shape(noise(0.06), 2000, 9000) * np.exp(-tt(0.06) * 70), T['egg'], 0.35)                                          # the egg
# the crowd: a murmur in the hall; a roar for the record and the nickname; a hush for the final
def crowd(d, lo=250, hi=2500, var=0.3, seed=0):
    x = tt(d); s = shape(noise(d), lo, hi)
    am = 1 + var * shape(R.standard_normal(len(x)), 0.3, 3) * 40
    return s * np.clip(am, 0.2, 2)
ta, tb = shot['lift']['t0'], shot['final']['t0']
add(sfx, crowd(tb - ta + 0.5, 200, 1800) * adsr(at(tb - ta + 0.5), 0.5, 0.1, 1, 0.4), ta, 0.12)
roar = crowd(tb - T['over'], 300, 4000, 0.5) * adsr(at(tb - T['over']), 0.35, 0.3, 0.8, 0.6)
add(sfx, roar, T['over'] + 0.15, 0.45, -0.2); add(sfx, crowd(tb - T['over'], 300, 4000, 0.5) * adsr(at(tb - T['over']), 0.4, 0.3, 0.8, 0.6), T['over'] + 0.2, 0.45, 0.2)
for i in range(18):
    tc = shot['screen']['t0'] + R.uniform(0, tb - shot['screen']['t0']); add(sfx, shape(noise(0.03), 2000, 10000) * np.exp(-tt(0.03) * 120), tc, 0.12, R.uniform(-0.8, 0.8))
add(sfx, crowd(T['choice'] - tb, 200, 1200) * adsr(at(T['choice'] - tb), 0.3, 0.1, 1, 0.5), tb, 0.07)
# outside (door, sister): birds and far traffic, quiet
to, te = shot['door']['t0'], shot['face']['t0']
add(sfx, shape(noise(te - to), 80, 600) * adsr(at(te - to), 0.4, 0.1, 1, 0.4), to, 0.05)
for i in range(7):
    tc = to + R.uniform(0.2, te - to - 0.4); y = tt(0.12); f = 3500 + 900 * np.sin(np.linspace(0, 3, len(y)))
    add(sfx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(y))), tc, 0.04, R.uniform(-0.6, 0.6))
# the scaffold: a metal groan that grows, squeaks
def groan(d):
    x = tt(d); f = 70 + 30 * np.sin(2 * np.pi * 0.7 * x) + 25 * x / d; ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3.01 * ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.3 * x)) * np.minimum(1, x / 0.5)
add(sfx, groan(T['catch'] - T['lean']) * np.linspace(0.3, 1, at(T['catch'] - T['lean'])), T['lean'], 0.22)
for k in range(5): tc = T['lean'] + 0.4 + k * 1.6; y = tt(0.25); add(sfx, np.sin(2 * np.pi * (900 + 300 * y / 0.25) * y) * np.sin(np.linspace(0, np.pi, len(y))), tc, 0.05)
# the choice: a heartbeat, slow then fast; a thin ringing
t = wword('cost', 'catch'); bpm = 66
while t < T['catch'] - 0.1:
    add(sfx, thump(0.25, 52), t, 0.55); add(sfx, thump(0.22, 46), t + 0.22, 0.35)
    bpm = 66 + 70 * np.clip((t - T['letGo']) / (T['catch'] - T['letGo']), 0, 1); t += 60 / bpm
x = tt(T['run'] - T['choice']); add(sfx, np.sin(2 * np.pi * 3600 * x) * np.sin(np.linspace(0, np.pi, len(x))) ** 2, T['choice'], 0.025)
add(sfx, shape(noise(0.12), 200, 2500) * np.exp(-tt(0.12) * 30), T['letGo'], 0.12)                                        # chalky hands off the bar
# the run: footsteps (fast), then out into the air
t = T['run'] + 0.05; k = 0
while t < T['catch'] - 0.05: add(sfx, thump(0.12, 90 + 10 * (k % 2)) + 0.3 * shape(noise(0.12), 500, 3000) * np.exp(-tt(0.12) * 40), t, 0.4, (-0.2, 0.2)[k % 2]); t += 0.16; k += 1
# the catch: a metal clang, two bone cracks, a boom; then ringing in the black
def clang(d=2.5):
    x = tt(d); return sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * dc) for f, a, dc in ((523, 1, 2.5), (1347, 0.6, 3.5), (2391, 0.4, 5), (3611, 0.25, 7), (788, 0.5, 3)))
def bone():
    x = tt(0.12); return shape(noise(0.12), 900, 7000) * np.exp(-x * 45) + 0.6 * thump(0.12, 120)
add(sfx, clang(), T['catch'], 0.45); add(sfx, kick(1.4, 90, 28), T['catch'], 0.9)
add(sfx, bone(), T['catch'] + 0.07, 0.9, -0.4); add(sfx, bone(), T['catch'] + 0.13, 0.9, 0.4)
x = tt(3.0); add(sfx, np.sin(2 * np.pi * 3200 * x) * np.exp(-x * 1.1) * np.minimum(1, x / 0.3), T['catch'] + 0.3, 0.03)
# a week later: night (a fridge hum, a far city), the TV low; paper for the letter
ta = T['after']
add(sfx, (0.4 * np.sin(2 * np.pi * 100 * tt(DUR - ta)) + shape(noise(DUR - ta), 100, 900)) * adsr(at(DUR - ta), 1.0, 0.1, 1, 1.0), ta, 0.03)
add(sfx, crowd(shot['letter']['t0'] - ta, 300, 3000, 0.8) * adsr(at(shot['letter']['t0'] - ta), 0.6, 0.1, 1, 0.6), ta, 0.025, -0.5)
for k in range(3): add(sfx, shape(noise(0.25), 1500, 9000) * np.sin(np.linspace(0, np.pi, at(0.25))), shot['letter']['t0'] + 0.1 + k * 0.22, 0.14, 0.2)
sfx = reverb(sfx, 1.4, 0.18, 5)

# ---------------- voices ----------------
voice = z()
def load(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
venv = np.zeros(N)
for cid, c in C['clips'].items():
    s = load(os.path.join(FILM, c['mp3']))
    g = 1.0 if c['who'] == 'n' else 1.25
    add(voice, s, c['start'], g, 0.0 if c['who'] == 'n' else 0.12)
    i, j = at(c['start'] - 0.15), min(N, at(c['end'] + 0.25)); venv[i:j] = 1
voice = reverb(voice, 0.6, 0.06, 7)
# ducking: music dips under the voice (smoothed)
k = np.ones(at(0.25)) / at(0.25); duck = np.convolve(venv, k, 'same')
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
voice *= 0.1 / rms(voice[:, venv > 0.5])
mus *= 0.1 / rms(mus) * db(-3.0)
sfx *= 0.1 / rms(sfx) * db(-11)
mus_d = mus * (1 - duck * (1 - db(-7)))
mix = voice + mus_d + sfx
# the choice: nothing but the heartbeat and the ring (the music stopped by itself; keep the voice gap clean)
for name, sig in (('music', mus_d), ('sfx', sfx), ('voice', voice), ('premaster', mix)):
    sig = sig[:, : int(DUR * SR)]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', os.path.join(OUT, name + '.wav')], input=(sig.T / max(1.0, np.abs(sig).max() * 1.05)).astype(np.float64).tobytes() if name == 'premaster' else (sig.T * 0.5).astype(np.float64).tobytes(), check=True)
print('stems written; balance (RMS, dB): voice %.1f  music %.1f  sfx %.1f' % (20 * np.log10(rms(voice[:, venv > 0.5])), 20 * np.log10(rms(mus_d)), 20 * np.log10(rms(sfx))))

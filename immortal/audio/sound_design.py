"""Sound design for "The Boy Who Returned", synthesized from the scene's events file (no third-party samples).

  python3 immortal/audio/sound_design.py --events immortal/build/village_return_events.json --out immortal/build/audio

Stems (48 kHz stereo WAV): ambience (dawn wind, leaves, birds), fire, foley (footsteps, cloth, the stick, breath,
whispers), music (restrained score), dialogue (recorded lines when they exist, see AUDIO_SPEC.json), and the
mix, normalised to -15 LUFS integrated with true peak under -1 dBTP. Seeded: identical every run.
Levels follow the camera: what is near the active camera is louder and brighter.
"""
import argparse
import json
import math
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))


def db(x):
    return 10 ** (x / 20)


def rng(seed):
    return np.random.default_rng(seed)


def sos_bp(lo, hi, order=2):
    return signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')


def sos_lp(f, order=2):
    return signal.butter(order, f, 'lowpass', fs=SR, output='sos')


def sos_hp(f, order=2):
    return signal.butter(order, f, 'highpass', fs=SR, output='sos')


def filt(sos, x):
    return signal.sosfilt(sos, x)


def pink(n, r):
    """1/f noise by spectral shaping."""
    w = r.normal(0, 1, n)
    X = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    X /= np.sqrt(f)
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def smooth_noise(n, r, rate_hz, lo=0.0, hi=1.0):
    """Slowly varying control signal in lo..hi (cubic interpolation of random points)."""
    k = max(4, int(n / SR * rate_hz) + 4)
    pts = r.uniform(lo, hi, k)
    x = np.linspace(0, k - 3.0001, n)
    i = np.floor(x).astype(int)
    u = x - i
    p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
    return p1 + 0.5 * u * (p2 - p0 + u * (2 * p0 - 5 * p1 + 4 * p2 - p3 + u * (3 * (p1 - p2) + p3 - p0)))


def env_ar(n, a, r, shape=2.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
    return e ** (shape / 2)


def place(buf, x, t, gain=1.0, pan=0.0):
    """Add mono x into stereo buf at time t with equal-power pan (-1 left .. +1 right)."""
    i = int(t * SR)
    if i >= buf.shape[1] or i + len(x) <= 0:
        return
    j0 = max(0, -i)
    x = x[j0:]
    i = max(0, i)
    n = min(len(x), buf.shape[1] - i)
    a = (pan + 1) * math.pi / 4
    buf[0, i:i + n] += x[:n] * gain * math.cos(a)
    buf[1, i:i + n] += x[:n] * gain * math.sin(a)


def reverb_ir(seconds, r, damp=3500, pre=0.012):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for c in range(2):
        noise = r.normal(0, 1, n) * np.exp(-t * 6.9 / seconds)
        ir[c] = filt(sos_lp(damp), noise)
    ir[:, :int(pre * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve_st(x, ir, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[c] = signal.fftconvolve(x[c], ir[c])[:x.shape[1]]
    return x * (1 - wet) + out * wet


# ------------------------------------------------------------------------------------------------ the scene
class Scene:
    def __init__(self, ev):
        self.ev = ev
        self.fps = ev['fps']
        self.n = int(ev['frames'] / self.fps * SR)
        self.cam = np.array(ev['camera_per_frame'])
        self.aren = np.array(ev['aren_eye_per_frame'])
        self.father = np.array(ev['father_eye_per_frame'])
        self.vill = np.array(ev['villagers_eye_per_frame'])
        self.black = ev['black']

    def frame(self, t):
        return int(min(max(t * self.fps, 0), len(self.cam) - 1))

    def dist(self, t, p):
        c = self.cam[self.frame(t)]
        p = np.asarray(p, dtype=float)
        if len(p) == 2:
            p = np.array([p[0], p[1], 0.3])
        return float(np.linalg.norm(c - p))

    def pan(self, t, p):
        """Rough screen pan from the camera's view of the action (the camera looks roughly at the subject pair)."""
        f = self.frame(t)
        c = self.cam[f]
        mid = (self.aren[f] + self.father[f]) / 2
        view = mid - c
        view[2] = 0
        view /= np.linalg.norm(view) + 1e-9
        right = np.array([view[1], -view[0], 0])
        p = np.asarray(p, dtype=float)
        if len(p) == 2:
            p = np.array([p[0], p[1], 0])
        d = p - c
        d[2] = 0
        return float(np.clip(np.dot(d, right) / (np.linalg.norm(d) + 1e-9) * 1.2, -0.85, 0.85))

    def dist_gain(self, t, p, ref=1.5, floor=-26):
        d = self.dist(t, p)
        return db(max(floor, -20 * math.log10(max(d, 0.3) / ref)))


def ambience(sc, r):
    n = sc.n
    out = np.zeros((2, n))
    gust = smooth_noise(n, r, 0.12, 0.35, 1.0)
    for c in range(2):
        w = pink(n, r)
        w = filt(sos_lp(700), w) * 0.6 + filt(sos_bp(150, 1800), w) * 0.25
        out[c] += w * gust * db(-24)
        leaves = filt(sos_bp(2500, 7500), r.normal(0, 1, n)) * smooth_noise(n, r, 1.3, 0.0, 1.0) ** 2 * gust
        out[c] += leaves * db(-44)
    # birds: sparse dawn calls, distant
    birds = np.zeros((2, n))
    t = 0.6
    while t < sc.black - 0.5:
        kind = r.choice(['phrase', 'chip', 'chip', 'dove'], p=[0.45, 0.25, 0.15, 0.15])
        x = bird(kind, r)
        place(birds, x, t, db(r.uniform(-30, -20)), pan=r.uniform(-0.9, 0.9))
        t += r.uniform(1.4, 4.2)
    birds = convolve_st(birds, reverb_ir(1.6, r, 5000, 0.03), 0.45)
    out += filt(sos_lp(7000), birds)
    # the world holds its breath while the father steps back: the dawn chorus and the wind dip
    tt = np.arange(n) / SR
    duck = 1 - 0.72 * band(tt, 20.6, 21.0, 23.2, 24.6)
    duck *= 1 - 0.4 * band(tt, 32.2, 32.6, 34.8, 35.4)
    out *= duck
    return out


def band(tt, a0, a1, b0, b1):
    up = np.clip((tt - a0) / max(a1 - a0, 1e-4), 0, 1)
    dn = np.clip((tt - b0) / max(b1 - b0, 1e-4), 0, 1)
    s = lambda x: x * x * (3 - 2 * x)
    return s(up) * (1 - s(dn))


def bird(kind, r):
    if kind == 'chip':
        out = []
        for k in range(int(r.integers(1, 4))):
            d = r.uniform(0.03, 0.06)
            n = int(d * SR)
            t = np.arange(n) / SR
            f0, f1 = r.uniform(4500, 6500), r.uniform(2800, 3800)
            ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (t / d)) / SR
            out.append(np.sin(ph) * np.sin(np.pi * t / d) ** 2)
            out.append(np.zeros(int(r.uniform(0.06, 0.14) * SR)))
        return np.concatenate(out)
    if kind == 'dove':
        out = []
        base = r.uniform(480, 560)
        for k, (dur, rel) in enumerate(((0.35, 1.0), (0.5, 1.08), (0.3, 0.95), (0.3, 0.95))):
            n = int(dur * SR)
            t = np.arange(n) / SR
            f = base * rel * (1 + 0.04 * np.sin(np.pi * t / dur))
            ph = 2 * np.pi * np.cumsum(f) / SR
            x = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.sin(np.pi * t / dur) ** 1.5
            out += [x, np.zeros(int(0.12 * SR))]
        return np.concatenate(out) * 0.6
    # a thrush-like phrase of 3-6 tonal notes with glides and trills
    out = []
    for k in range(int(r.integers(3, 7))):
        d = r.uniform(0.06, 0.18)
        n = int(d * SR)
        t = np.arange(n) / SR
        f0 = r.uniform(2000, 4200)
        glide = r.uniform(-900, 900)
        trill = r.uniform(0, 1) < 0.35
        f = f0 + glide * (t / d) + (np.sin(2 * np.pi * 38 * t) * 250 if trill else 0)
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = (np.sin(ph) + 0.15 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 1.2
        out += [x, np.zeros(int(r.uniform(0.03, 0.09) * SR))]
    return np.concatenate(out)


def fire(sc, r):
    n = sc.n
    tt = np.arange(n) / SR
    out = np.zeros((2, n))
    roar = filt(sos_lp(260), np.cumsum(r.normal(0, 1, n)) * 0.002)
    roar = filt(sos_hp(35), roar)
    roar /= np.abs(roar).max() + 1e-9
    roar *= smooth_noise(n, r, 0.8, 0.6, 1.0)
    crack = np.zeros(n)
    rate = 18.0
    t = 0.0
    while t < sc.n / SR:
        t += r.exponential(1 / rate)
        a = min(1.0, (r.pareto(2.2) + 0.2) * 0.25)
        d = r.uniform(0.002, 0.012)
        m = int(d * 8 * SR)
        e = np.exp(-np.arange(m) / (d * SR))
        click = r.normal(0, 1, m) * e
        lo = r.uniform(900, 2500)
        click = filt(sos_bp(lo, min(lo * 4, 16000)), click)
        i = int(t * SR)
        if i + m < n:
            crack[i:i + m] += click * a
    for c in range(2):
        out[c] = roar * db(-27) + crack * db(-25)
    # perspective: louder when the camera is near the father's fire
    g = np.array([sc.dist_gain(x, sc.ev['fire'], ref=2.0, floor=-14) for x in np.arange(0, sc.n / SR, 1 / sc.fps)])
    g = np.interp(tt, np.arange(len(g)) / sc.fps, g)
    g = filt(sos_lp(3), g)   # no zipper at cuts, but fast enough to follow a cut
    out *= g
    # the fire, too, seems to go quiet while the father steps back
    out *= 1 - 0.7 * band(tt, 20.6, 21.0, 23.2, 24.8)
    # sparks when the stick drops into the embers
    for e in sc.ev['events']:
        if e['type'] == 'stick_hit':
            burst = np.zeros(int(0.9 * SR))
            for k in range(14):
                i = int(r.exponential(0.18) * SR)
                if i < len(burst) - 600:
                    burst[i:i + 600] += filt(sos_bp(1500, 6000), r.normal(0, 1, 600)) * np.exp(-np.arange(600) / 90)
            place(out, burst, e['t'] + 0.02, db(-16) * e['strength'] * sc.dist_gain(e['t'], sc.ev['fire'], 2.0))
    return out


def footstep(r, weight, drag, heavy):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    thud = filt(sos_lp(180 if heavy else 240), r.normal(0, 1, n)) * np.exp(-t / (0.035 if heavy else 0.025)) * 3.0
    grit = filt(sos_bp(1200, 5200), r.normal(0, 1, n)) * np.exp(-t / 0.05) * smooth_noise(n, r, 120, 0.3, 1.0)
    x = thud * (1.2 if heavy else 0.8) * weight + grit * (0.35 + 0.3 * weight)
    if drag > 0:
        m = int(drag * SR)
        tt = np.arange(m) / SR
        scuff = filt(sos_bp(700, 3200), r.normal(0, 1, m)) * np.sin(np.pi * tt / drag) ** 1.5 * 0.35
        x = np.concatenate([scuff, x])
    return x, (drag if drag > 0 else 0.0)


def cloth(r, dur, strength):
    n = int(dur * SR)
    t = np.arange(n) / SR
    am = smooth_noise(n, r, 14, 0.0, 1.0) ** 2
    shape = np.sin(np.pi * t / dur) ** 0.8
    return filt(sos_bp(900, 6000), r.normal(0, 1, n)) * am * shape * strength


def stick_clack(r, strength):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f0 = r.uniform(480, 560)
    x = np.zeros(n)
    for k, (ratio, dec, amp) in enumerate(((1, 0.09, 1.0), (2.76, 0.05, 0.6), (5.4, 0.03, 0.4), (8.9, 0.018, 0.25))):
        x += np.sin(2 * np.pi * f0 * ratio * t + r.uniform(0, 6)) * np.exp(-t / dec) * amp
    x += filt(sos_bp(2000, 9000), r.normal(0, 1, n)) * np.exp(-t / 0.004) * 0.8
    x += filt(sos_lp(400), r.normal(0, 1, n)) * np.exp(-t / 0.05) * 0.8   # ash puff
    return x * strength


def breath_track(sc, r, who, series, level_db):
    """Breath noise from a breathing signal sampled per frame (sin of phase): air moves when the chest moves."""
    n = sc.n
    fr = np.arange(len(series)) / sc.fps
    s = np.array(series)
    ds = np.gradient(s) * sc.fps
    tt = np.arange(n) / SR
    v = np.interp(tt, fr, ds)
    inhale = np.clip(v, 0, None)
    exhale = np.clip(-v, 0, None)
    noise = r.normal(0, 1, n)
    hi = filt(sos_bp(1400, 5200), noise)
    lo = filt(sos_bp(350, 2200), noise)
    sig = hi * inhale ** 1.4 * 0.55 + lo * exhale ** 1.4 * 0.8
    pos = sc.aren if who == 'aren' else sc.father
    g = np.array([sc.dist_gain(f / sc.fps, pos[f], ref=1.0, floor=-40) for f in range(len(pos))])
    g = np.interp(tt, np.arange(len(g)) / sc.fps, g)
    pan = np.array([sc.pan(f / sc.fps, pos[f]) for f in range(len(pos))])
    pan = np.interp(tt, np.arange(len(pan)) / sc.fps, pan)
    a = (pan + 1) * math.pi / 4
    out = np.stack([sig * g * np.cos(a), sig * g * np.sin(a)]) * db(level_db)
    return out


def whisper(r, dur):
    n = int(dur * SR)
    out = np.zeros(n)
    t = 0.0
    vowels = [(300, 2300), (600, 1200), (700, 1800), (400, 800), (500, 1700)]
    while t < dur - 0.15:
        d = r.uniform(0.08, 0.22)
        m = int(d * SR)
        f1, f2 = vowels[int(r.integers(0, len(vowels)))]
        x = r.normal(0, 1, m)
        y = filt(sos_bp(f1 * 0.8, f1 * 1.3), x) * 0.6 + filt(sos_bp(f2 * 0.85, f2 * 1.2), x) + \
            filt(sos_bp(3500, 7000), x) * (0.7 if r.uniform() < 0.3 else 0.15)
        y *= np.sin(np.pi * np.arange(m) / m) ** 1.5
        i = int(t * SR)
        out[i:i + m] += y[:max(0, min(m, n - i))]
        t += d + (r.uniform(0.15, 0.45) if r.uniform() < 0.25 else r.uniform(0.0, 0.05))
    return out


def foley(sc, r):
    n = sc.n
    out = np.zeros((2, n))
    for e in sc.ev['events']:
        t = e['t']
        if e['type'] == 'step':
            heavy = e['who'] == 'father'
            vill = e['who'].startswith('villager')
            drag = 0.12 if (e['who'] == 'aren' and e['lift'] < 0.055 and t < 11) else (0.18 if e['lift'] < 0.02 else 0.0)
            weight = 0.9 if heavy else 0.55
            if e['who'] == 'father' and abs(t - 21.35) < 0.05:
                weight = 1.25          # the step back lands
            x, pre = footstep(r, weight, drag, heavy)
            g = sc.dist_gain(t, e['pos'], ref=1.6, floor=-30) * db(-12)
            if vill:
                g *= db(-6)
            place(out, x, t - pre, g, sc.pan(t, e['pos']))
        elif e['type'] == 'cloth':
            who = e['who']
            pos = sc.aren[sc.frame(t)] if who == 'aren' else (sc.father[sc.frame(t)] if who == 'father' else sc.vill[sc.frame(t)])
            g = sc.dist_gain(t, pos, ref=1.2, floor=-30) * db(-20)
            place(out, cloth(r, e['dur'], e['strength']), t, g, sc.pan(t, pos))
        elif e['type'] == 'stick_hit':
            g = sc.dist_gain(t, sc.ev['fire'], ref=1.5, floor=-24) * db(-10)
            place(out, stick_clack(r, e['strength']), t, g, sc.pan(t, sc.ev['fire']))
        elif e['type'] == 'gasp':
            pos = sc.aren[sc.frame(t)] if e['who'] == 'aren' else sc.father[sc.frame(t)]
            m = int(0.38 * SR)
            tt = np.arange(m) / SR
            x = filt(sos_bp(1300, 5500), r.normal(0, 1, m)) * np.sin(np.pi * np.minimum(1, tt / 0.3)) ** 2
            place(out, x, t, sc.dist_gain(t, pos, ref=1.0, floor=-36) * db(-22) * e['strength'], sc.pan(t, pos))
        elif e['type'] == 'whisper':
            x = whisper(r, e['dur'])
            x2 = whisper(rng(77), e['dur'] * 0.8)
            pos = sc.vill[sc.frame(t)]
            g = sc.dist_gain(t, pos, ref=1.5, floor=-24) * db(-17) * e['strength']
            place(out, x, t, g, -0.35)
            place(out, x2, t + 0.5, g * 0.7, -0.15)
    # breath
    br = np.array(sc.ev['breath_aren_father_per_frame'])
    out += breath_track(sc, rng(5), 'aren', br[:, 0], -27)
    out += breath_track(sc, rng(6), 'father', br[:, 1], -31)
    return convolve_st(out, reverb_ir(0.7, r, 4000, 0.008), 0.12)


# ------------------------------------------------------------------------------------------------ music
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def hz(name):
    o = int(name[-1])
    k = NOTE[name[:-1]]
    return 440.0 * 2 ** ((k - 9) / 12 + (o - 4))


def strings(freqs, dur, r, attack=2.0, release=2.0, bright=1400):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12) * (1 + 0.003 * np.sin(2 * np.pi * r.uniform(4.5, 5.5) * t + r.uniform(0, 6)))
            ph = 2 * np.pi * np.cumsum(ff) / SR
            saw = 2 * ((ph / (2 * np.pi)) % 1.0) - 1
            x += saw / 3
    x = filt(sos_lp(bright, 2), x)
    e = np.minimum(1, t / attack) * np.clip((dur - t) / release, 0, 1)
    return x * (e ** 1.5) / max(1, len(freqs))


def piano(f, dur, r, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    B = 0.0004
    for k in range(1, 12):
        fk = f * k * math.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** 1.1) * (0.6 + 0.4 * vel)
        dec = 2.8 / (1 + 0.35 * k) * (1.2 - 0.4 * min(1, f / 600))
        x += np.sin(2 * np.pi * fk * t + r.uniform(0, 6)) * np.exp(-t / dec) * amp
    x += filt(sos_bp(800, 4000), r.normal(0, 1, n)) * np.exp(-t / 0.006) * 0.15 * vel
    return x * vel


def flute(f, dur, r):
    n = int(dur * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.minimum(1, t / 0.6)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    x += filt(sos_bp(f * 0.9, f * 1.6), r.normal(0, 1, n)) * 0.08
    e = np.minimum(1, t / 0.35) * np.clip((dur - t) / 0.6, 0, 1)
    return x * e


def music(sc, r):
    n = sc.n
    out = np.zeros((2, n))

    def put(x, t, g, pan=0.0):
        place(out, x, t, db(g), pan)
    # a low D, barely there, as he walks in; the fifth when his father sees him
    put(strings([hz('D2'), hz('D3')], 11.0, r, attack=4.0, release=3.0, bright=500), 1.5, -24)
    put(strings([hz('A2')], 8.0, r, attack=2.5, release=3.0, bright=600), 8.6, -27)
    # hope: a warm chord, a voice-like line over it, rising towards the embrace
    put(strings([hz('D3'), hz('F3'), hz('A3')], 8.8, r, attack=2.8, release=0.25, bright=1300), 12.2, -22)
    put(strings([hz('A3'), hz('D4'), hz('F4')], 3.2, r, attack=1.6, release=0.2, bright=2200), 17.8, -23)
    for f0, t0, d in (('F4', 13.2, 1.6), ('A4', 14.9, 1.4), ('D5', 16.4, 2.4), ('E5', 18.9, 1.95)):
        put(flute(hz(f0), d, r), t0, -27, 0.15)
    # 20.8: the father's foot lifts; the music is simply gone.
    # the realisation: one low note, then a sparse figure under the father's words
    for name, t0, v, d in (('D2', 23.4, 1.0, 6.0), ('A2', 23.42, 0.6, 6.0), ('F3', 25.6, 0.5, 4.0),
                           ('E3', 27.9, 0.45, 3.5), ('D3', 30.0, 0.5, 4.0), ('A2', 32.4, 0.4, 3.5)):
        put(piano(hz(name), d, r, v), t0, -21)
    # "It's me.": strings return, very quiet, and swell slowly into the pull back
    put(strings([hz('D3'), hz('A3'), hz('E4')], 9.4, r, attack=3.5, release=0.08, bright=900), 35.0, -25)
    put(strings([hz('F3'), hz('A3'), hz('D4'), hz('A4')], 4.4, r, attack=3.2, release=0.06, bright=1600), 40.0, -22)
    put(flute(hz('A4'), 3.0, r), 41.3, -29, 0.1)
    # after the cut to black: one note rings out
    put(piano(hz('D3'), 2.5, r, 0.55), sc.black + 0.05, -24)
    tt = np.arange(n) / SR
    # hard stop at the cut to black (except the last note), short fade so it does not click
    gate = np.ones(n)
    i = int(sc.black * SR)
    gate[i:i + 480] = np.linspace(1, 0, 480)
    gate[i + 480:] = 0
    late = np.zeros((2, n))
    place(late, piano(hz('D3'), 2.5, r, 0.55), sc.black + 0.05, db(-24))
    out = out * gate + late
    out = convolve_st(out, reverb_ir(3.2, r, 3000, 0.02), 0.5)
    out[:, tt < 20.75] *= 1.0
    return out


def dialogue(sc, r):
    """Recorded lines (ElevenLabs, via the GitHub workflow) placed at their times, if they exist."""
    out = np.zeros((2, sc.n))
    man = os.path.join(HERE, 'generated', 'manifest.json')
    if not os.path.exists(man):
        return out, False
    m = json.load(open(man))
    found = False
    lines = {e['id']: e for e in sc.ev['events'] if e['type'] == 'line'}
    for item in m.get('lines', []):
        lid = item.get('id')
        if lid not in lines or not item.get('file'):
            continue
        p = os.path.join(HERE, 'generated', item['file'])
        if not os.path.exists(p):
            continue
        x, sr = sf.read(p, always_2d=True)
        x = x.mean(axis=1)
        if sr != SR:
            x = signal.resample_poly(x, SR, sr)
        meter = pyln.Meter(SR)
        lufs = meter.integrated_loudness(x) if len(x) > SR * 0.4 else -23
        x *= db(-20 - lufs)
        e = lines[lid]
        pos = sc.aren[sc.frame(e['t'])] if e['who'] == 'aren' else sc.father[sc.frame(e['t'])]
        g = sc.dist_gain(e['t'], pos, ref=1.4, floor=-10)
        place(out, x, e['t'], g, sc.pan(e['t'], pos) * 0.5)
        found = True
    return convolve_st(out, reverb_ir(0.6, r, 5000, 0.006), 0.1), found


def limiter(x, ceiling_db=-1.2):
    """True-peak safe limiter: 4x oversampled peak detection, smooth gain."""
    c = db(ceiling_db)
    up = np.stack([signal.resample_poly(x[k], 4, 1) for k in range(2)])
    peak = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[:x.shape[1]]
    peak = np.pad(peak, (0, x.shape[1] - len(peak)), constant_values=0)
    need = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    # look-ahead minimum over 2 ms, release 80 ms
    w = int(0.002 * SR)
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * w + 1)
    rel = math.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel
        out[i] = cur
    return x * out


def true_peak_db(x):
    up = np.stack([signal.resample_poly(x[k], 4, 1) for k in range(2)])
    return 20 * math.log10(np.abs(up).max() + 1e-12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--events', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--target', type=float, default=-15.0)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    ev = json.load(open(a.events))
    sc = Scene(ev)
    stems = {
        'ambience': ambience(sc, rng(1)) * db(5),
        'fire': fire(sc, rng(2)),
        'foley': foley(sc, rng(3)),
        'music': music(sc, rng(4)),
    }
    dl, has_voice = dialogue(sc, rng(8))
    stems['dialogue'] = dl
    if has_voice:
        # music and fire step back under the voices
        tt = np.arange(sc.n) / SR
        duck = np.ones(sc.n)
        for e in ev['events']:
            if e['type'] == 'line':
                duck = np.minimum(duck, 1 - 0.45 * band(tt, e['t'] - 0.25, e['t'], e['end'], e['end'] + 0.4))
        stems['music'] *= duck
        stems['fire'] *= 0.6 + 0.4 * duck
    mix = sum(stems.values())
    # silence after the music's last note
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(mix.T)
    gain = db(a.target - lufs)
    for k in stems:
        stems[k] *= gain
    mix *= gain
    for _ in range(3):
        mix = limiter(mix, -1.3)
        lufs = meter.integrated_loudness(mix.T)
        if abs(lufs - a.target) < 0.3:
            break
        mix *= db(a.target - lufs)
    tp = true_peak_db(mix)
    for k, x in stems.items():
        sf.write(os.path.join(a.out, f'stem_{k}.wav'), x.T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(os.path.join(a.out, 'mix.wav'), mix.T.astype(np.float32), SR, subtype='PCM_24')
    lra = None
    st = []
    win = int(3 * SR)
    for i in range(0, mix.shape[1] - win, SR):
        v = meter.integrated_loudness(mix[:, i:i + win].T) if np.abs(mix[:, i:i + win]).max() > 1e-6 else -70
        st.append(v)
    st = np.array([v for v in st if v > -70])
    if len(st):
        lra = float(np.percentile(st, 95) - np.percentile(st, 10))
    rep = {'integrated_lufs': round(float(meter.integrated_loudness(mix.T)), 2), 'true_peak_dbtp': round(tp, 2),
           'loudness_range_lu_approx': round(lra, 1) if lra else None, 'voices': has_voice}
    json.dump(rep, open(os.path.join(a.out, 'loudness.json'), 'w'), indent=1)
    print(rep)


if __name__ == '__main__':
    main()

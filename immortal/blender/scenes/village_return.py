"""PROJECT IMMORTAL, proof of concept: "The Boy Who Returned" (45 s, 16:9, 24 fps).

Builds the whole scene from code: the village at dawn, Aren, his father and three villagers, every performance (feet,
body, hands, face, eyes, dialogue mouth shapes), ten camera set-ups bound to timeline markers, per-shot lighting,
the father's stick, and an events file for the sound design. Everything is a pure function of time and fixed seeds,
so every build is identical.

  python village_return.py --out immortal/build/village_return.blend [--no-villagers] [--quick]

Beat sheet (seconds): see SHOTS below and PLAN.md next to this file.
"""
import argparse
import bisect
import json
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Euler, Matrix, Vector  # noqa: E402

from imm import anim as A  # noqa: E402
from imm import body as Bd  # noqa: E402
from imm import build as BLD  # noqa: E402
from imm import face as F  # noqa: E402
from imm import village as V  # noqa: E402

FPS = 24
DUR = 45.0
NF = int(round(DUR * FPS))          # frames 1..NF, frame f shows time (f - 1) / FPS
BLACK = 44.4                        # cut to black

SHOTS = [  # name, start, end
    ('S1_return', 0.0, 6.0),
    ('S2_recognition', 6.0, 12.0),
    ('S3_hope', 12.0, 18.5),
    ('S4a_step_back', 18.5, 21.9),
    ('S4b_smile_fades', 21.9, 26.5),
    ('S5a_father_cu', 26.5, 32.2),
    ('S5b_dont_know', 32.2, 35.0),
    ('S6a_its_me', 35.0, 38.6),
    ('S6b_villagers', 38.6, 40.0),
    ('S6c_pullback', 40.0, BLACK),
]

# blocking (world metres, the village fire is at village.FIRE)
A1 = Vector((-0.95, 0.30, 0))      # where Aren stops
A3 = Vector((0.36, 0.155, 0))      # after his last step
F0 = Vector((2.10, 0.05, 0))       # father at his fire
EAST, WEST = math.pi / 2, -math.pi / 2
T_ARRIVE = 10.4
EMBERS = V.FIRE + Vector((0.05, 0.05, 0.04))

DIALOGUE = json.load(open(os.path.join(HERE, 'dialogue.json')))['lines']


def t_of(f):
    return (f - 1) / FPS


def shot_at(t):
    for s in SHOTS:
        if s[1] <= t < s[2]:
            return s
    return SHOTS[-1]


def K(t, keys, ease=A.smooth):
    """Piecewise eased interpolation through [(time, value), ...] (values may be floats or Vectors)."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            if t1 <= t0:
                return v1
            u = ease((t - t0) / (t1 - t0))
            return v0 + (v1 - v0) * u
    return keys[-1][1]


def wobble(t, seed, amp, freq=1.0):
    return amp * A.noise1(t, seed, freq)


# ------------------------------------------------------------------------------------------------------ helpers
class Phase:
    """Integrated phase of a time-varying rate (Hz) sampled per frame: smooth breathing whatever the rate does."""

    def __init__(self, rate_fn, seed=0.0):
        self.ph = np.zeros(NF + 2)
        acc = seed
        for f in range(NF + 2):
            self.ph[f] = acc
            acc += 2 * math.pi * rate_fn(f / FPS) / FPS

    def __call__(self, t):
        x = t * FPS
        i = int(min(max(x, 0), NF))
        u = x - i
        return self.ph[i] * (1 - u) + self.ph[i + 1] * u


class Saccades:
    """Small, quick eye re-fixations (world-space offsets of the look target), seeded."""

    def __init__(self, seed, lo=0.35, hi=1.5, amp=0.018):
        rng = np.random.default_rng(seed)
        self.ts, self.offs = [0.0], [Vector((0, 0, 0))]
        t = 0.0
        while t < DUR + 1:
            t += rng.uniform(lo, hi)
            self.ts.append(t)
            self.offs.append(Vector((rng.normal(0, amp), rng.normal(0, amp * 0.4), rng.normal(0, amp * 0.6))))

    def at(self, t, scale=1.0):
        i = max(0, bisect.bisect_right(self.ts, t) - 1)
        prev = self.offs[i - 1] if i > 0 else self.offs[i]
        u = A.smooth((t - self.ts[i]) / 0.045)
        return prev.lerp(self.offs[i], u) * scale


def blink_times(seed, lo, hi, extra=(), suppress=()):
    rng = np.random.default_rng(seed)
    out, t = [], rng.uniform(0.4, lo)
    while t < DUR:
        if not any(a <= t <= b for a, b in suppress):
            out.append(t)
        t += rng.uniform(lo, hi)
    return sorted(out + list(extra))


def blink_w(t, times, slow=()):
    w = 0.0
    for b in times:
        dur = 1.8 if any(abs(b - s) < 1e-6 for s in slow) else 1.0
        dt = (t - b) / dur
        if 0 <= dt < 0.26:
            if dt < 0.07:
                w = max(w, A.smooth(dt / 0.07))
            elif dt < 0.11:
                w = 1.0
            else:
                w = max(w, 1 - A.smooth((dt - 0.11) / 0.15))
    return w


def viseme_weights(t, who, gain=1.0):
    out = {}
    for L in DIALOGUE:
        if L['who'] != who or not (L['start'] - 0.2 <= t <= L['end'] + 0.3):
            continue
        for shape, a, b in L['visemes']:
            s0, s1 = L['start'] + a, L['start'] + b
            w = A.env(t, s0 - 0.05, s0 + 0.03, s1 - 0.02, s1 + 0.07) * gain
            if w > 0:
                for k, v in F.VISEMES[shape].items():
                    out[k] = out.get(k, 0.0) + v * w
    if 'JawDrop' in out:
        out['JawDrop'] = min(out['JawDrop'], 0.42)
    return out


def speaking(t, who):
    return max([A.env(t, L['start'] - 0.1, L['start'] + 0.05, L['end'] - 0.05, L['end'] + 0.15)
                for L in DIALOGUE if L['who'] == who] + [0.0])


def expr(weights):
    out = {}
    for name, w in weights.items():
        if w > 1e-4:
            for k, v in F.EXPRESSIONS[name].items():
                out[k] = out.get(k, 0.0) + v * w
    return out


def add(d, extra, scale=1.0):
    for k, v in extra.items():
        d[k] = d.get(k, 0.0) + v * scale
    return d


def finish_face(w, blink, lid_down=0.0):
    """Blink and lid-follow on top of an expression mix; eye units are left to the look target."""
    for k in list(w):
        if k in F.EYE_UNITS:
            del w[k]
        elif 'UpperLidOpen' in k:
            w[k] *= (1 - blink)
    for s in ('Left', 'Right'):
        w[s + 'UpperLidClosed'] = min(1.05, w.get(s + 'UpperLidClosed', 0.0) * (1 - blink) + blink + lid_down * (1 - blink))
    return w


class Actor:
    def __init__(self, cid, coll, subdiv):
        self.id = cid
        self.ch = BLD.character(cid, coll, subdiv=subdiv)
        self.rig = A.Rig(self.ch)
        self.rig.setup_ik(coll)
        self.face = F.FaceRig(self.ch.rig)
        self.hands = Bd.frames_for(self.rig)
        self.eye = self.ch.eye_center.copy()
        self.place = {}         # frame -> (loc, yaw, bend)
        self.feet = None
        self.steps = []

    def eye_world(self, f, bend=None):
        loc, yaw, b0 = self.place[min(max(f, 1), NF)]
        b = math.radians(b0 if bend is None else bend)
        hip = self.rig.hip_h
        e = self.eye
        rel = e.z - hip
        p = Vector((e.x, e.y - math.sin(b) * rel, hip + math.cos(b) * rel))
        return loc + Matrix.Rotation(yaw, 3, 'Z') @ p

    def to_world(self, f, p):
        loc, yaw, _ = self.place[min(max(f, 1), NF)]
        return loc + Matrix.Rotation(yaw, 3, 'Z') @ Vector(p)

    def feet_targets(self, P, t):
        for s in 'LR':
            xy = self.feet.state(s, t)[0]
            p, q, u = self.feet.target(s, t, ground=V.ground_height(xy.x, xy.y))
            P.targets['foot_' + s] = (p, q)

    def ground_mid(self, t):
        a, b = self.feet.state('L', t)[0], self.feet.state('R', t)[0]
        return V.ground_height((a.x + b.x) / 2, (a.y + b.y) / 2)

    def hand_ik(self, P, side, world, influence, elbow_char=None):
        P.targets['hand_' + side] = (Vector(world), None)
        P.influence[('lowerarm02.' + side, 'ArmIK')] = influence
        if elbow_char is not None:
            P.targets['elbow_' + side] = (Vector(elbow_char), None)

    def finish(self, P, f, w):
        P.basis.update(self.face.rotations(w))
        return P


def facing(yaw):
    """(forward, left) world xy unit vectors for a facing yaw."""
    return Vector((math.sin(yaw), -math.cos(yaw), 0)), Vector((math.cos(yaw), math.sin(yaw), 0))


# ------------------------------------------------------------------------------------------------------ Aren
class Aren(Actor):
    def setup(self):
        path = [(-5.6, 6.2), (-3.4, 3.3), (-2.1, 0.75), (A1.x, A1.y)]
        st = 0.85
        for _ in range(6):
            steps, t_end, sL, sR, y0, y1 = A.walk_steps(path, 0.1, 'L', 0.46, st, lift=0.05, rng_seed=11, jitter=0.12,
                                                        width=0.09, stumble=(7, 0.3))
            st *= (T_ARRIVE - 0.1) / (t_end - 0.1)
        self.walk_end = t_end
        fwd, left = facing(EAST)
        A2 = A1 + fwd * 0.62
        steps += [
            # turn to face his father
            A.Step('L', 11.15, 11.6, A1 + left * 0.09 + fwd * 0.02, EAST, lift=0.02),
            A.Step('R', 11.65, 12.05, A1 - left * 0.09 - fwd * 0.02, EAST, lift=0.02),
            # two hesitant steps towards him
            A.Step('R', 16.0, 16.5, A1 + fwd * 0.40 - left * 0.09, EAST, lift=0.04),
            A.Step('L', 16.62, 17.2, A2 + fwd * 0.02 + left * 0.09, EAST, lift=0.045),
            # the step that makes him step back
            A.Step('R', 19.0, 19.5, A3 + fwd * 0.13 - left * 0.085, EAST, lift=0.05),
            A.Step('L', 19.62, 20.05, A3 - fwd * 0.09 + left * 0.095, EAST, lift=0.03),
        ]
        self.steps = steps
        self.feet = A.Feet(self.rig, sL, sR, y0, steps)
        self.breath = Phase(lambda t: K(t, [(0, 0.5), (10.4, 0.45), (13, 0.3), (19, 0.32), (21.3, 0.12), (22.6, 0.4),
                                            (26, 0.3), (36, 0.28), (40, 0.33)]), seed=0.4)
        self.blinks = blink_times(101, 2.0, 4.6, extra=(23.9, 33.3, 42.9),
                                  suppress=((13.6, 14.9), (19.8, 23.6), (35.8, 37.4), (40.2, 42.6)))
        self.slow_blinks = (23.9, 42.9)
        self.sacc = Saccades(7)
        j = self.ch.joints
        self.tear = j['shoulder01.L____head'] + Vector((-0.015, -0.06, -0.03))

    def bend(self, t):
        return K(t, [(0, 13), (7.6, 13), (9.0, 7), (10.4, 6), (13, 3), (15, 1), (19, 2), (20.3, 6), (21.3, 5.5),
                     (22.6, 3), (26, 5), (32.3, 5), (33.0, 9), (34.0, 4), (35.5, 6), (38, 6), (41, 4), (43.5, 8)])

    def placement(self, t):
        crouch = K(t, [(0, 0.045), (10.2, 0.045), (11, 0.025), (19, 0.025), (20.2, 0.04), (22, 0.028)])
        bob = 0.03 if t < self.walk_end + 0.1 else 0.012
        bias = K(t, [(12, 0.0), (17.2, 0.0), (17.7, -0.12), (19.0, -0.12), (20.0, 0.05), (20.6, 0.18), (21.3, 0.18),
                     (22.6, 0.0), (35.3, 0.0), (36.0, 0.12), (41, 0.12), (42.5, 0.02)])
        loc, yaw, swing, stance = A.pelvis_from_feet(self.rig, self.feet, t, crouch=crouch, bob=bob, sway=0.03,
                                                     ground=self.ground_mid(t), bias=bias)
        return loc, yaw, swing, stance

    def pose(self, f, others):
        t = t_of(f)
        fa = others['father']
        P = A.Pose(self.rig)
        loc, yaw, swing, stance = self.placement(t)
        P.obj_loc, P.obj_yaw = loc, yaw
        self.feet_targets(P, t)
        bend = self.bend(t)
        walking = t < self.walk_end
        # ---- torso: exhaustion, limp, hope rising, the lean in, the shrink back
        P.spread(A.SPINE, (1, 0, 0), bend)
        P.spread(A.NECK, (1, 0, 0), K(t, [(0, 8), (7.8, 8), (9, 2), (12, 0)]))
        sw = 0.0
        if swing is not None and walking:
            sw = math.sin(math.pi * swing) * (1 if stance == 'L' else -1)
            P.spread(A.SPINE[:3], (0, 0, 1), 4 * sw)
            P.spread(A.SPINE[:2], (0, 1, 0), -2.5 * sw)
        # weight on one hip while he stands
        hip = K(t, [(11, 0), (12.5, 1.0), (16, 1.0), (16.5, 0)])
        P.turn('spine01', (0, 1, 0), 2.5 * hip)
        ph = Bd.breathe(P, self.breath(t), depth=K(t, [(0, 2.2), (10.4, 2.0), (13, 1.2), (21.2, 1.4), (21.4, 0.3),
                                                          (22.4, 0.3), (23.2, 1.6), (26, 1.1)]))
        # a caught breath when the father steps back, another before "It's me."
        P.spread(A.SPINE[2:], (1, 0, 0), -1.6 * A.env(t, 21.25, 21.45, 21.9, 22.6) - 1.2 * A.env(t, 35.6, 35.9, 36.2, 36.4))
        # ---- head and eyes
        f_eye = fa.eye_world(f)
        ground_pt = loc + facing(yaw)[0] * 2.2 + Vector((0, 0, 0.0))
        look_up = A.ramp(t, 7.7, 9.0)
        tgt = ground_pt.lerp(f_eye, look_up)
        # looking down at his own torn clothes (32.4-33.8)
        down = A.env(t, 32.35, 32.95, 33.75, 34.15)
        aim_w = (0.55 + 0.4 * look_up) * (1 - down)
        head_pt = Vector((self.eye.x, self.eye.y, self.eye.z))
        ya, pa = Bd.head_aim(P, self.rig, loc, yaw, tgt, head_pt, weight=aim_w, max_yaw=60)
        P.turn('head', (1, 0, 0), 26 * down + 5 * A.env(t, 25.2, 25.8, 26.6, 27.5))
        P.turn('neck02', (1, 0, 0), 8 * down)
        P.turn('head', (0, 0, 1), 18 * down)
        P.turn('head', (0, 1, 0), K(t, [(13, 0), (15, -4), (19, -4), (21, 0), (24, 3), (27, 0), (36, -3), (40, 0)]))
        # small nods while speaking, a head drop when his father refuses his hand
        P.turn('head', (1, 0, 0), 3 * math.sin(2 * math.pi * 2.2 * t) * speaking(t, 'aren')
               + 4 * A.ramp(t, 42.4, 43.6))
        sac = self.sacc.at(t, 1.0 if look_up > 0.5 else 0.4)
        own = A.char_to_world(P, self.tear + Vector((0, 0, 0.0)))
        eye_t = tgt + sac
        eye_t = eye_t.lerp(own, down)
        P.look = eye_t
        # ---- arms and hands
        hug = A.env(t, 19.35, 20.5, 21.55, 22.8)
        linger_R = A.env(t, 19.35, 20.5, 22.2, 23.6)
        swing_amp = 9 if walking else 0
        Bd.arms_hang(P, 1.0, elbow=14 + 22 * hug, fwd=26 * hug,
                     swing_L=swing_amp * 0.45 * -sw, swing_R=swing_amp * sw + 8 * (linger_R - hug), out=-6 * hug)
        # the wounded left shoulder is held a little
        P.turn('upperarm02.L', (0, 1, 0), -4)
        P.turn('clavicle.L', (0, 1, 0), 2)
        curl = 0.35 - 0.2 * hug
        tense = A.env(t, 21.3, 21.6, 23.0, 24.5)
        Bd.hand(P, self.hands, 'L', curl=curl + 0.25 * tense, thumb=0.25)
        # right hand: touches the tear (32.6-34.6), then reaches out (35.4-41.8)
        touch = A.env(t, 32.55, 33.25, 34.35, 35.1)
        reach = A.env(t, 35.35, 36.25, 41.0, 42.7)
        tremble = Vector((wobble(t, 3.1, 0.004, 9), wobble(t, 4.2, 0.004, 8), wobble(t, 5.3, 0.005, 10)))
        if touch > 0:
            # the wrist sits below and inside the tear so the fingers rest on it
            self.hand_ik(P, 'R', A.char_to_world(P, self.tear + Vector((-0.06, -0.035, -0.1))), touch,
                         elbow_char=self.rig.head['lowerarm01.R'] + Vector((-0.15, -0.25, -0.2)))
        elif reach > 0:
            reach_pt = A.char_to_world(P, Vector((-0.17, -0.44 - 0.03 * A.ramp(t, 36.2, 36.8), 1.03)))
            self.hand_ik(P, 'R', reach_pt + tremble * A.ramp(t, 36.4, 37.5), reach,
                         elbow_char=self.rig.head['lowerarm01.R'] + Vector((-0.25, 0.25, -0.25)))
            P.turn('lowerarm02.R', self.rig.tail['lowerarm02.R'] - self.rig.head['lowerarm02.R'], 55 * reach)
        else:
            P.influence[('lowerarm02.R', 'ArmIK')] = 0.0
        Bd.hand(P, self.hands, 'R', curl=curl + 0.25 * tense - 0.15 * reach + 0.1 * touch, thumb=0.25 - 0.1 * reach,
                spread=0.3 * reach)
        # ---- face
        w = expr({
            'tired': K(t, [(0, 0.95), (9, 0.85), (10.5, 0.55), (13, 0.3), (16, 0.15), (25, 0.25), (45, 0.3)]),
            'recognition': K(t, [(8.6, 0), (9.6, 0.55), (11, 0.3), (13, 0), (21.25, 0), (21.5, 0.4), (22.9, 0)]),
            'hope_smile': K(t, [(12.8, 0), (13.7, 0.38), (14.1, 0.55), (15.0, 0.62), (16.0, 0.75), (19.0, 0.8),
                                (20.4, 0.95), (21.3, 0.95), (21.8, 0.8), (22.6, 0.7), (23.4, 0.55), (24.0, 0.5),
                                (25.2, 0.12), (26.0, 0.0), (35.6, 0.0), (36.3, 0.22), (37.2, 0.18), (38.2, 0.0)]),
            'hurt': K(t, [(22.6, 0), (23.6, 0.3), (25.0, 0.55), (26.5, 0.6), (28, 0.45), (32.2, 0.4), (35, 0.35),
                          (38.5, 0.4), (40, 0.3)]),
            'confused': K(t, [(32.0, 0), (33.2, 0.55), (34.6, 0.45), (35.6, 0.1)]),
            'grief': K(t, [(38.5, 0), (40.5, 0.3), (42.2, 0.55), (44.4, 0.62)]),
        })
        # mouth breathing from exhaustion, a quiver as the smile breaks
        w['JawDrop'] = w.get('JawDrop', 0) + 0.05 * (0.5 + 0.5 * ph) * K(t, [(0, 1.0), (12, 0.6), (14, 0.2)])
        quiver = A.env(t, 23.6, 24.1, 25.5, 26.3) + 0.6 * A.env(t, 41.5, 42.3, 44.0, 45)
        w['lowerLipUp'] = w.get('lowerLipUp', 0) + quiver * (0.1 + 0.06 * math.sin(2 * math.pi * 7.3 * t))
        add(w, viseme_weights(t, 'aren'))
        blink = blink_w(t, self.blinks, self.slow_blinks)
        eye_pitch = math.degrees(math.atan2(-(P.look.z - (loc.z + self.eye.z)), (P.look - loc).xy.length + 1e-6)) - pa
        lid_down = max(0.0, min(1.0, eye_pitch / 35.0)) * 0.55
        finish_face(w, blink, lid_down)
        self.place[f] = (loc, yaw, bend)
        return self.finish(P, f, w)


# ------------------------------------------------------------------------------------------------------ father
class Father(Actor):
    def setup(self):
        y0 = math.atan2((EMBERS - F0).x, -(EMBERS - F0).y)
        fwd0, left0 = facing(y0)
        sL = F0 + left0 * 0.12 + fwd0 * 0.07
        sR = F0 - left0 * 0.12 - fwd0 * 0.05
        fwd, left = facing(WEST)
        steps = [
            # turns from the fire to face the boy
            A.Step('R', 11.2, 11.62, F0 - left * 0.1 + fwd * 0.0, WEST, lift=0.03),
            A.Step('L', 11.6, 12.0, F0 + left * 0.1 + fwd * 0.04, WEST, lift=0.025),
            # the step back: back (right) foot first ...
            A.Step('R', 20.8, 21.35, F0 - left * 0.12 - fwd * 0.38, WEST + 0.12, lift=0.035),
            # ... and the front foot drags after it
            A.Step('L', 22.05, 22.5, F0 + left * 0.1 - fwd * 0.2, WEST + 0.04, lift=0.012),
        ]
        self.y0 = y0
        self.steps = steps
        self.feet = A.Feet(self.rig, sL, sR, y0, steps)
        self.breath = Phase(lambda t: K(t, [(0, 0.22), (7.4, 0.22), (8.0, 0.1), (9.5, 0.1), (11, 0.32), (18, 0.3),
                                            (19.7, 0.5), (20.2, 0.05), (22.4, 0.05), (23, 0.42), (26, 0.3)]), seed=1.3)
        self.blinks = blink_times(202, 2.6, 5.5, extra=(10.15, 10.45, 29.45),
                                  suppress=((7.6, 10.0), (10.6, 13.5), (20.4, 23.0), (36.0, 38.0)))
        self.sacc = Saccades(19, amp=0.014)
        self.release = 10.55

    def bend(self, t):
        return K(t, [(0, 24), (7.6, 24), (8.6, 20), (9.9, 7), (11, 3), (19.6, 2), (20.9, 0), (21.5, -5), (22.1, -2),
                     (22.7, 1.5), (26, 2), (27.3, 4), (29, 3), (36, 3), (38, 4.5), (42.5, 6)])

    def placement(self, t):
        crouch = K(t, [(0, 0.06), (8.4, 0.06), (9.8, 0.025), (20.7, 0.025), (21.3, 0.045), (22.6, 0.03)])
        bias = K(t, [(0, 0.0), (20.75, 0.0), (21.2, -0.05), (21.8, 0.32), (22.0, 0.34), (22.6, 0.22), (24, 0.12)])
        offs = K(t, [(0, 0.0), (21.35, 0.0), (21.8, 0.05), (22.6, 0.02)])
        loc, yaw, swing, stance = A.pelvis_from_feet(self.rig, self.feet, t, crouch=crouch, bob=0.012, sway=0.035,
                                                     ground=self.ground_mid(t), bias=bias,
                                                     offset=Vector((offs, 0, 0)))
        # the shoulders follow the feet late: hold the pre-step facing a moment
        return loc, yaw, swing, stance

    def pose(self, f, others):
        t = t_of(f)
        ar = others['aren']
        P = A.Pose(self.rig)
        loc, yaw, swing, stance = self.placement(t)
        P.obj_loc, P.obj_yaw = loc, yaw
        self.feet_targets(P, t)
        bend = self.bend(t)
        P.spread(A.SPINE, (1, 0, 0), bend)
        P.spread(A.NECK, (1, 0, 0), K(t, [(0, 10), (8.4, 8), (9.8, 0)]))
        # shoulders follow the step back late, then he turns his chest a little away
        lag = A.env(t, 21.35, 21.75, 22.0, 22.6)
        P.spread(A.SPINE[:3], (0, 0, 1), -7 * lag + K(t, [(21.8, 0), (22.8, 5), (30, 3), (36, 4), (42, 6)]))
        Bd.breathe(P, self.breath(t), depth=K(t, [(0, 1.0), (19.6, 1.2), (19.9, 2.6), (20.2, 1.0), (23, 1.8),
                                                         (26, 1.3)]))
        # ---- head and eyes
        a_eye = ar.eye_world(f)
        embers = EMBERS + Vector((0, 0, 0.05))
        notice = A.ramp(t, 7.45, 7.75)
        head_on = K(t, [(7.5, 0), (8.3, 0.45), (8.7, 0.5), (9.7, 0.95)])
        tgt = embers.lerp(a_eye, notice)
        # scanning down to the wound (29.2-29.9), down to the offered hand (36.0-37.1), shame (26.6-27.1, 42.6+)
        wound = ar.to_world(f, ar.tear)
        hand = ar.to_world(f, Vector((-0.17, -0.47, 1.03)))
        tgt = tgt.lerp(wound, A.env(t, 29.15, 29.45, 29.75, 30.0))
        tgt = tgt.lerp(hand, A.env(t, 35.95, 36.3, 37.0, 37.3))
        ground = ar.to_world(f, Vector((0, -0.9, 0.0)))
        tgt = tgt.lerp(ground, A.env(t, 26.55, 26.8, 27.0, 27.3) + 0.8 * A.ramp(t, 42.6, 43.6))
        head_pt = Vector((self.eye.x, self.eye.y, self.eye.z))
        ya, pa = Bd.head_aim(P, self.rig, loc, yaw, tgt, head_pt, weight=head_on * 0.95 + (1 - notice) * 0.6,
                             max_yaw=75, bias=(K(t, [(20.9, 0), (21.6, -7), (24, -4), (30, -3)]), 0))
        # chin pulled back as the boy steps closer; a slow disbelieving head shake before "How are you alive?"
        P.turn('head', (1, 0, 0), -4 * A.env(t, 20.0, 20.6, 22.5, 24.0))
        P.turn('head', (0, 0, 1), 4.5 * math.sin(2 * math.pi * 2.6 * (t - 29.85)) * A.env(t, 29.85, 29.95, 30.15, 30.3))
        P.turn('head', (1, 0, 0), 2.2 * math.sin(2 * math.pi * 2.0 * t) * speaking(t, 'father'))
        P.look = tgt + self.sacc.at(t, 1.0 if t > 12 else 0.3)
        # ---- arms: the stick, the frozen hand, the guard, the fingers that almost reach
        holding = t < self.release
        if t < self.release + 1.0:
            poke = 0.0 if t > 7.55 else (0.06 * max(0.0, math.sin(2 * math.pi * 0.62 * t)) ** 2)
            drift = Vector((wobble(t, 9.1, 0.01, 0.8), wobble(t, 7.3, 0.01, 0.7), 0))
            stick_dir = (embers - A.char_to_world(P, Vector((-0.22, -0.36, 0.86)))).normalized()
            grip = A.char_to_world(P, Vector((-0.22, -0.36, 0.86))) + stick_dir * poke + drift * (t < 7.55)
            # after the release the hand stays where it was, then sinks
            grip += Vector((0, 0, -0.02 * A.ramp(t, self.release, self.release + 0.6)))
            self.hand_ik(P, 'R', grip, 1.0 - A.ramp(t, self.release + 0.15, self.release + 1.0),
                         elbow_char=self.rig.head['lowerarm01.R'] + Vector((-0.3, 0.3, -0.1)))
        else:
            P.influence[('lowerarm02.R', 'ArmIK')] = 0.0
        frozen = K(t, [(10.6, 1.0), (13.0, 1.0), (15.5, 0.0)])
        guard = A.env(t, 20.95, 21.55, 22.8, 24.4)
        Bd.arms_hang(P, 1.0, elbow=16, fwd=0)
        P.turn('upperarm02.R', (1, 0, 0), -(18 * frozen + 14 * guard))
        P.turn('lowerarm01.R', (1, 0, 0), -(25 * frozen + 30 * guard))
        P.turn('upperarm02.R', (0, 1, 0), 12 * frozen)
        # the left hand: fingers move as if to reach, and close again
        twitch = A.env(t, 37.35, 37.7, 37.85, 38.15)
        close = A.ramp(t, 38.05, 38.6)
        P.turn('upperarm02.L', (1, 0, 0), -5 * twitch - 4 * guard)
        P.turn('lowerarm01.L', (1, 0, 0), -9 * twitch)
        Bd.hand(P, self.hands, 'L', curl=0.4 - 0.32 * twitch + 0.25 * close, thumb=0.3 - 0.15 * twitch + 0.2 * close,
                spread=0.5 * twitch, per={'index': -0.08 * twitch})
        grip_c = 0.95 if holding else K(t, [(self.release, 0.95), (self.release + 0.25, 0.15), (13, 0.15), (15.5, 0.4)])
        Bd.hand(P, self.hands, 'R', curl=grip_c - 0.1 * guard, thumb=0.75 if holding else 0.3, spread=0.4 * guard)
        # ---- face
        w = expr({
            'restraint': K(t, [(0, 0.12), (7.4, 0.12), (8.0, 0.0), (35, 0.0), (37.6, 0.0), (38.2, 0.45), (40, 0.3)]),
            'confused': K(t, [(7.4, 0), (8.0, 0.45), (8.8, 0.2), (9.4, 0)]),
            'recognition': K(t, [(8.5, 0), (9.3, 0.85), (10.0, 0.6), (11.5, 0.3), (18, 0.2), (19, 0.0)]),
            'disbelief': K(t, [(9.4, 0), (10.2, 0.7), (11.5, 0.55), (18.5, 0.45), (21, 0.2), (26.5, 0.15),
                               (29.9, 0.45), (31.6, 0.4), (33, 0.25)]),
            'fear': K(t, [(10.6, 0), (11.8, 0.35), (18.5, 0.4), (20.3, 0.8), (21.5, 0.85), (24, 0.6), (26.5, 0.4),
                          (27.3, 0.25), (28.9, 0.3), (30.0, 0.55), (31.6, 0.6), (34, 0.5), (36.5, 0.55),
                          (38.0, 0.6), (42, 0.45)]),
            'grief': K(t, [(24, 0), (26.5, 0.4), (27.6, 0.75), (28.9, 0.6), (30.0, 0.3), (35, 0.3), (38.2, 0.5),
                           (42, 0.62)]),
        })
        w['LeftLowerLidUp'] = w.get('LeftLowerLidUp', 0) + 0.18 * (1 - notice)   # squinting into the fire
        w['RightLowerLidUp'] = w.get('RightLowerLidUp', 0) + 0.18 * (1 - notice)
        # held breath: lips part; a swallow before he speaks (26.75)
        w['JawDrop'] = w.get('JawDrop', 0) + 0.06 * A.env(t, 9.6, 10.2, 12, 14) + 0.05 * A.env(t, 20.4, 20.8, 22.6, 23.4)
        w['ChinForward'] = w.get('ChinForward', 0) + 0.25 * A.env(t, 26.65, 26.8, 26.9, 27.05)
        add(w, viseme_weights(t, 'father'))
        blink = blink_w(t, self.blinks)
        eye_pitch = math.degrees(math.atan2(-(P.look.z - (loc.z + self.eye.z)), (P.look - loc).xy.length + 1e-6)) - pa
        finish_face(w, blink, max(0.0, min(1.0, eye_pitch / 35.0)) * 0.5)
        self.place[f] = (loc, yaw, bend)
        return self.finish(P, f, w)


# ------------------------------------------------------------------------------------------------------ villagers
class Villager(Actor):
    """Background villager: busy, back half-turned, until the boy's voice carries (react time)."""

    def configure(self, pos, yaw, react, turn_to, task, seed, whisper_to=None, step_back=False, react_yaw=None):
        self.pos, self.yaw0, self.react, self.turn_to = Vector((pos[0], pos[1], 0)), yaw, react, Vector(turn_to)
        self.task, self.seed, self.whisper_to, self.step_back = task, seed, whisper_to, step_back
        d = self.turn_to - self.pos
        y1 = react_yaw if react_yaw is not None else math.atan2(d.x, -d.y)
        # turn partway (feet), the head does the rest
        dy = (y1 - yaw + math.pi) % (2 * math.pi) - math.pi
        y1 = yaw + dy * 0.75
        fwd0, left0 = facing(yaw)
        sL = self.pos + left0 * 0.1
        sR = self.pos - left0 * 0.1
        fwd1, left1 = facing(y1)
        r = react
        lead = 'L' if dy > 0 else 'R'
        trail = 'R' if lead == 'L' else 'L'
        sgn = {'L': 1, 'R': -1}
        steps = [A.Step(lead, r + 0.35, r + 0.75, self.pos + left1 * 0.1 * sgn[lead], y1, lift=0.03),
                 A.Step(trail, r + 0.7, r + 1.1, self.pos + left1 * 0.1 * sgn[trail] - fwd1 * 0.03, y1, lift=0.025)]
        if step_back:
            steps.append(A.Step('R', r + 1.25, r + 1.65, self.pos - left1 * 0.11 - fwd1 * 0.3, y1, lift=0.03))
        self.steps = steps
        self.feet = A.Feet(self.rig, sL, sR, yaw, steps)
        self.breath = Phase(lambda t: 0.25 + 0.15 * A.ramp(t, react, react + 1), seed=seed)
        self.blinks = blink_times(300 + int(seed * 10), 2.4, 5.0)
        self.sacc = Saccades(40 + int(seed * 10), amp=0.03)

    def pose(self, f, others):
        t = t_of(f)
        r = self.react
        P = A.Pose(self.rig)
        bias = 0.12 * math.sin(0.21 * t + self.seed) + (0.25 * A.ramp(t, r + 1.25, r + 1.7) if self.step_back else 0)
        loc, yaw, swing, stance = A.pelvis_from_feet(self.rig, self.feet, t, crouch=0.025, bob=0.01, sway=0.03,
                                                     ground=self.ground_mid(t), bias=bias)
        P.obj_loc, P.obj_yaw = loc, yaw
        self.feet_targets(P, t)
        working = 1 - A.ramp(t, r, r + 0.35)
        bend = 10 * working + 3 + (6 * A.env(t, r + 1.0, r + 1.4, 46, 47) if self.whisper_to else 0)
        P.spread(A.SPINE, (1, 0, 0), bend)
        Bd.breathe(P, self.breath(t), 1.0)
        ar = others['aren']
        a_eye = ar.eye_world(f)
        if self.whisper_to is not None:
            other = others[self.whisper_to].eye_world(f)
            lean = A.env(t, r + 1.0, r + 1.4, 46, 47)
            look = a_eye.lerp(other, lean * 0.85)
        else:
            look = a_eye
        busy_pt = A.char_to_world(P, Vector((0, -0.45, 0.7)))
        tgt = busy_pt.lerp(look, A.ramp(t, r + 0.05, r + 0.4))
        Bd.head_aim(P, self.rig, loc, yaw, tgt, Vector((self.eye.x, self.eye.y, self.eye.z)), weight=0.9, max_yaw=80)
        P.look = tgt + self.sacc.at(t, 0.5)
        # hands: the task while working
        Bd.arms_hang(P, 1.0, elbow=15, fwd=0)
        if self.task == 'cord':
            for s, sx in (('L', 1), ('R', -1)):
                c = Vector((sx * 0.06, -0.3, 0.98))
                c += Vector((0.025 * math.sin(2 * math.pi * 0.9 * t + sx), 0, 0.02 * math.sin(2 * math.pi * 1.8 * t)))
                self.hand_ik(P, s, A.char_to_world(P, c), working * 0.95)
            Bd.hand(P, self.hands, 'L', curl=0.6, thumb=0.5)
            Bd.hand(P, self.hands, 'R', curl=0.6, thumb=0.5)
        elif self.task == 'rack':
            c = Vector((-0.18, -0.42, 1.25 + 0.05 * math.sin(0.7 * t)))
            self.hand_ik(P, 'R', A.char_to_world(P, c), working * 0.9)
            Bd.hand(P, self.hands, 'R', curl=0.7 * working + 0.3, thumb=0.5)
            Bd.hand(P, self.hands, 'L', curl=0.35, thumb=0.3)
            # after the turn, the hand goes back towards the spears
            back = A.env(t, r + 1.3, r + 1.8, 46, 47)
            P.turn('upperarm02.R', (1, 0, 0), 22 * back)
        else:   # clasped / resting
            for s, sx in (('L', 1), ('R', -1)):
                self.hand_ik(P, s, A.char_to_world(P, Vector((sx * 0.03, -0.2, 0.86))), 0.9)
            Bd.hand(P, self.hands, 'L', curl=0.45, thumb=0.35)
            Bd.hand(P, self.hands, 'R', curl=0.45, thumb=0.35)
        # whisper: a hand up beside the mouth
        if self.whisper_to is not None:
            wh = A.env(t, r + 1.05, r + 1.5, 46, 47)
            if wh > 0:
                side = 'R'
                self.hand_ik(P, side, A.char_to_world(P, Vector((-0.07, -0.16, self.eye.z - 0.1))), wh,
                             elbow_char=self.rig.head['lowerarm01.R'] + Vector((-0.2, 0.0, -0.3)))
                Bd.hand(P, self.hands, side, curl=0.25, thumb=0.2)
        w = expr({'neutral': 1.0,
                  'recognition': A.env(t, r + 0.1, r + 0.5, r + 1.2, r + 2.0) * 0.7,
                  'disbelief': A.ramp(t, r + 0.4, r + 1.2) * 0.5,
                  'fear': A.ramp(t, r + 0.8, r + 1.6) * 0.35})
        if self.whisper_to is not None:
            k = A.env(t, r + 1.3, r + 1.4, 46, 47)
            w['JawDrop'] = w.get('JawDrop', 0) + k * 0.08 * (0.5 + 0.5 * math.sin(2 * math.pi * 5.5 * t))
            w['LipsKiss'] = w.get('LipsKiss', 0) + k * 0.15 * (0.5 + 0.5 * math.sin(2 * math.pi * 3.1 * t + 1))
        finish_face(w, blink_w(t, self.blinks))
        self.place[f] = (loc, yaw, bend)
        return self.finish(P, f, w)


# ------------------------------------------------------------------------------------------------------ props
def make_stick(coll):
    L = 1.18
    me = bpy.data.meshes.new('father_stick')
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.016, radius2=0.011, depth=L,
                          matrix=Matrix.Translation((0, 0, L / 2 - 0.12)))
    # a few bends so it reads as a branch
    for v in bm.verts:
        z = v.co.z
        v.co.x += 0.012 * math.sin(z * 5.1) + 0.006 * math.sin(z * 13.0)
        v.co.y += 0.008 * math.sin(z * 7.3 + 1.0)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('father_stick', me)
    coll.objects.link(ob)
    mat = V.bark_material('stick_bark', (0.11, 0.08, 0.055))
    me.materials.append(mat)
    ob.rotation_mode = 'QUATERNION'
    return ob, L - 0.12


def stick_track(palm, tip_target, length):
    d = (tip_target - palm).normalized()
    return palm, d.to_track_quat('Z', 'Y'), d


def stick_fall(p_grip, d0, length, t0, tt):
    """The stick pivots on its tip in the embers and falls: a rigid rod rotating about its lower end."""
    tip = p_grip + d0 * length
    up = -d0                                  # from tip towards the grip end
    horiz = Vector((up.x, up.y, 0)).normalized()
    th0 = math.atan2(up.z, Vector((up.x, up.y, 0)).length)    # elevation of the rod
    g, Lr = 9.81, length + 0.12
    th, om, t = th0, 0.0, t0
    dt = 1 / 480
    out = []
    bounced = 0
    hits = []
    floor = math.asin(max(-1, min(1, (0.035 - tip.z) / Lr)))
    while t < tt + 1e-9:
        acc = -(3 * g / (2 * Lr)) * math.cos(th)
        om += acc * dt
        th += om * dt
        if th < floor:
            th = floor
            if abs(om) > 0.3 and bounced < 2:
                hits.append((t, abs(om) * Lr))
                om = -om * 0.22
                bounced += 1
            else:
                om = 0.0
        t += dt
        out.append((t, th))
    return tip, horiz, out, hits


# ------------------------------------------------------------------------------------------------------ build
def collection(name, parent):
    c = bpy.data.collections.new(name)
    parent.children.link(c)
    return c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(HERE, '..', '..', 'build', 'village_return.blend'))
    ap.add_argument('--no-villagers', action='store_true')
    ap.add_argument('--quick', action='store_true', help='subdivision 0 everywhere (fast tests)')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    a = ap.parse_args(argv)
    t_start = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, NF
    root = sc.collection
    c_set = collection('set', root)
    c_chars = collection('characters', root)
    c_rigs = collection('rigs', root)
    c_cams = collection('cameras', root)
    c_light = collection('shot_lights', root)
    info = V.build(sc, c_set)
    print(f'set built {time.time() - t_start:.0f}s', flush=True)

    sub = 0 if a.quick else 1
    actors = {}
    ar = Aren('aren', collection('aren', c_chars), sub)
    fa = Father('father', collection('father', c_chars), sub)
    actors = {'aren': ar, 'father': fa}
    ar.setup()
    fa.setup()
    vill = []
    if not a.no_villagers:
        neda = Villager('villager_woman', collection('neda', c_chars), 0)
        elder = Villager('villager_elder', collection('elder', c_chars), 0)
        hunter = Villager('villager_hunter', collection('hunter', c_chars), 0)
        neda.configure((1.3, 5.4), math.atan2(0.5, 0.85), 38.75, A3, 'cord', 1.1, whisper_to='villager_elder')
        elder.configure((0.55, 5.95), math.atan2(0.7, 0.6), 38.95, A3, 'clasp', 2.2)
        hunter.configure((-0.9, 4.9), math.atan2(-0.7, -0.4), 38.7, A3, 'rack', 3.3, step_back=True)
        vill = [neda, elder, hunter]
        for v in vill:
            actors[v.id] = v
    # rigs and IK empties into their own collection (meshes can then be excluded for fast evaluation passes)
    for cc in c_chars.children:
        for ob in list(cc.objects):
            if ob.type in ('ARMATURE', 'EMPTY'):
                cc.objects.unlink(ob)
                c_rigs.objects.link(ob)
    print(f'characters built {time.time() - t_start:.0f}s', flush=True)

    # ---- pass 0: placements (so everyone can look at everyone)
    for f in range(1, NF + 1):
        t = t_of(f)
        for act in actors.values():
            if isinstance(act, Villager):
                loc, yaw, _, _ = A.pelvis_from_feet(act.rig, act.feet, t, crouch=0.025, ground=act.ground_mid(t))
                act.place[f] = (loc, yaw, 5.0)
            else:
                loc, yaw, _, _ = act.placement(t)
                act.place[f] = (loc, yaw, act.bend(t))
    # ---- pass 1: performances, baked
    bk = A.Baker()
    for f in range(1, NF + 1):
        for act in actors.values():
            P = act.pose(f, actors)
            A.bake_pose(bk, act.rig, P, f)
    bk.write()
    print(f'performances baked {time.time() - t_start:.0f}s', flush=True)

    # ---- pass 2: evaluate the rigs (meshes excluded) for cameras, focus, the stick and framing checks
    stick, stick_len = make_stick(c_set)
    vl = bpy.context.view_layer
    for lc in vl.layer_collection.children:
        if lc.name in ('characters', 'set'):
            lc.exclude = True
    track = {k: [] for k in ('aren_eye', 'father_eye', 'aren_chest', 'father_chest', 'father_hip', 'father_palm',
                             'father_palm_dir', 'neda_eye', 'elder_eye', 'hunter_eye', 'aren_hand')}
    dg = bpy.context.evaluated_depsgraph_get()
    for f in range(1, NF + 1):
        sc.frame_set(f)
        for key, act in (('aren', ar), ('father', fa), ('neda', actors.get('villager_woman')),
                         ('elder', actors.get('villager_elder')), ('hunter', actors.get('villager_hunter'))):
            if act is None:
                if key + '_eye' in track:
                    track[key + '_eye'].append(Vector((0, 0, 0)))
                continue
            ob = act.ch.rig.evaluated_get(dg)
            Mw = ob.matrix_world
            pb = ob.pose.bones
            eye = (Mw @ pb['eye.L'].head + Mw @ pb['eye.R'].head) / 2
            track[key + '_eye'].append(eye)
            if key in ('aren', 'father'):
                track[key + '_chest'].append(Mw @ pb['spine03'].head)
            if key == 'father':
                track['father_hip'].append(Mw @ pb['root'].head)
                w_ = Mw @ pb['wrist.R'].head
                m_ = Mw @ pb['finger3-1.R'].head
                i_ = Mw @ pb['finger2-1.R'].head
                p_ = Mw @ pb['finger5-1.R'].head
                n_ = (m_ - w_).cross(p_ - i_).normalized()
                track['father_palm'].append(w_.lerp(m_, 0.62))
                track['father_palm_dir'].append(n_)
            if key == 'aren':
                track['aren_hand'].append(Mw @ pb['finger3-1.R'].head)
    for lc in vl.layer_collection.children:
        lc.exclude = False
    print(f'evaluation pass {time.time() - t_start:.0f}s', flush=True)

    # ---- the stick: in the hand until the release, then it falls into the ashes
    bk = A.Baker()
    rel_f = int(fa.release * FPS) + 1
    events = []
    for f in range(1, NF + 1):
        t = t_of(f)
        if f <= rel_f:
            palm = track['father_palm'][f - 1] - track['father_palm_dir'][f - 1] * 0.012
            loc, q, d = stick_track(palm, EMBERS, stick_len)
            last = (palm, d)
        else:
            break
        for i in range(3):
            bk.put(stick, 'location', i, f, loc[i])
        for i in range(4):
            bk.put(stick, 'rotation_quaternion', i, f, q[i])
    p_grip, d0 = last
    t0 = t_of(rel_f)
    # slides a few centimetres through the loosening grip before it tips
    tip, horiz, curve, hits = stick_fall(p_grip, d0, stick_len, t0 + 0.12, DUR)
    for f in range(rel_f + 1, NF + 1):
        t = t_of(f)
        if t < t0 + 0.12:
            s = A.smooth((t - t0) / 0.12)
            loc = p_grip + d0 * 0.03 * s
            q = d0.to_track_quat('Z', 'Y')
        else:
            i = min(len(curve) - 1, int((t - t0 - 0.12) * 480))
            th = curve[i][1]
            up = horiz * math.cos(th) + Vector((0, 0, 1)) * math.sin(th)
            d = -up
            loc = tip + up * (stick_len - 0.03)
            q = d.to_track_quat('Z', 'Y')
        for i in range(3):
            bk.put(stick, 'location', i, f, loc[i])
        for i in range(4):
            bk.put(stick, 'rotation_quaternion', i, f, q[i])
    bk.write()
    for th, v in hits:
        events.append({'type': 'stick_hit', 't': round(th, 3), 'strength': round(min(1.0, v / 3.0), 3)})

    # ---- cameras
    cams = build_cameras(sc, c_cams, track, actors)
    build_shot_lights(sc, c_light, cams, track)
    fire_flicker(info)
    render_settings(sc)

    # ---- events for the sound design
    for act in actors.values():
        for s in act.steps:
            events.append({'type': 'step', 'who': act.id, 't': round(s.t, 3), 'foot': s.foot,
                           'lift_t': round(s.t_lift, 3), 'lift': round(s.lift, 3),
                           'pos': [round(s.pos.x, 3), round(s.pos.y, 3)]})
    events += [
        {'type': 'cloth', 'who': 'aren', 't': 19.35, 'dur': 1.1, 'strength': 0.6},
        {'type': 'cloth', 'who': 'aren', 't': 21.55, 'dur': 1.2, 'strength': 0.35},
        {'type': 'cloth', 'who': 'aren', 't': 32.55, 'dur': 0.7, 'strength': 0.4},
        {'type': 'cloth', 'who': 'aren', 't': 35.35, 'dur': 0.9, 'strength': 0.45},
        {'type': 'cloth', 'who': 'father', 't': 20.8, 'dur': 0.9, 'strength': 0.7},
        {'type': 'cloth', 'who': 'father', 't': 11.2, 'dur': 0.8, 'strength': 0.4},
        {'type': 'cloth', 'who': 'villagers', 't': 38.75, 'dur': 1.3, 'strength': 0.4},
        {'type': 'gasp', 'who': 'father', 't': 19.7, 'strength': 0.6},
        {'type': 'gasp', 'who': 'aren', 't': 21.3, 'strength': 0.35},
        {'type': 'breath_hold', 'who': 'father', 't': 20.2, 'dur': 2.2},
        {'type': 'whisper', 'who': 'villagers', 't': 40.0, 'dur': 3.6, 'strength': 0.5},
    ]
    for L in DIALOGUE:
        events.append({'type': 'line', 'id': L['id'], 'who': L['who'], 't': L['start'], 'end': L['end'],
                       'text': L['text']})
    breath = []
    for f in range(1, NF + 1):
        t = t_of(f)
        breath.append([round(math.sin(ar.breath(t)), 3), round(math.sin(fa.breath(t)), 3)])
    cam_track = []
    for f in range(1, NF + 1):
        c = _eval_loc(cams[shot_at(t_of(f))[0]], f)
        cam_track.append([round(c.x, 3), round(c.y, 3), round(c.z, 3)])
    meta = {'fps': FPS, 'frames': NF, 'black': BLACK, 'fire': [V.FIRE.x, V.FIRE.y], 'fire2': [V.FIRE2.x, V.FIRE2.y],
            'camera_per_frame': cam_track,
            'aren_eye_per_frame': [[round(x, 3) for x in v] for v in track['aren_eye']],
            'father_eye_per_frame': [[round(x, 3) for x in v] for v in track['father_eye']],
            'villagers_eye_per_frame': [[round(x, 3) for x in v] for v in track['elder_eye']],
            'shots': [{'name': n, 'start': s, 'end': e} for n, s, e in SHOTS],
            'events': sorted(events, key=lambda e: e['t']), 'breath_aren_father_per_frame': breath}
    out_dir = os.path.dirname(os.path.abspath(a.out))
    os.makedirs(out_dir, exist_ok=True)
    json.dump(meta, open(os.path.join(out_dir, 'village_return_events.json'), 'w'), indent=1)
    sc.frame_set(int(14.5 * FPS))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.out), compress=True)
    print(f'saved {a.out} in {time.time() - t_start:.0f}s', flush=True)


# ------------------------------------------------------------------------------------------------------ cameras
SENSOR_W, SENSOR_H = 36.0, 20.25


def aim_point(cam, subj, u, v, lens):
    d = subj - cam
    dist = d.length
    right = d.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(d).normalized()
    fw, fh = dist * SENSOR_W / lens, dist * SENSOR_H / lens
    return subj - right * u * fw - up * v * fh


def build_cameras(sc, coll, track, actors):
    def eye(name, f):
        return track[name][min(max(f, 1), NF) - 1]

    def mid(a, b, w=0.5):
        return a.lerp(b, w)

    # each spec: function f -> (cam_pos, subject, u, v, lens, focus_point, fstop, shake_deg)
    def s1(f, t):
        u = A.smoother((t - 0.0) / 6.0)
        cam = Vector((1.6, -10.8, 1.65)).lerp(Vector((0.85, -8.1, 1.5)), u)
        subj = mid(eye('aren_eye', f), eye('father_eye', f), 0.42)
        return cam, subj - Vector((0, 0, 0.35)), 0.0, 0.05, 30 + 3 * u, eye('aren_eye', f), 5.6, 0.12

    def s2(f, t):
        u = A.smoother((t - 6.0) / 6.0)
        cam = Vector((0.6, -2.0, 1.36)).lerp(Vector((0.78, -1.66, 1.4)), u)
        return cam, eye('father_eye', f), 0.12, 0.17, 45, eye('father_eye', f), 2.8, 0.1

    def aren_cu(f, t, t0, t1, off, u=-0.11, v=0.16, lens=85, push=0.08, fstop=2.0, base_f=None):
        k = A.smooth((t - t0) / max(0.1, t1 - t0))
        e = eye('aren_eye', base_f or f)
        cam = e + off * (1 - push * k)
        return cam, eye('aren_eye', f), u, v, lens, eye('aren_eye', f), fstop, 0.15

    def s3(f, t):
        base = eye('aren_eye', f)
        cam = base + Vector((1.12, -0.82, -0.02))
        return cam, base, -0.12, 0.15, 85, base, 2.0, 0.15

    def s4a(f, t):
        # dollies with the boy as he steps in, so the two never overlap on screen
        e0 = eye('aren_eye', int(18.5 * FPS) + 1)
        e1 = eye('aren_eye', f)
        cam = Vector((e0.x + 0.6 * (e1.x - e0.x), e0.y, e0.z)) + Vector((-1.05, -1.3, -0.45))
        subj = eye('father_hip', f) * 0.75 + eye('father_eye', f) * 0.25
        return cam, subj, 0.16, 0.1, 24, eye('father_eye', f), 4.0, 0.08

    def s4b(f, t):
        f0 = int(21.9 * FPS) + 1
        return aren_cu(f, t, 21.9, 26.5, Vector((1.12, -0.86, -0.01)), base_f=f0, push=0.1)

    def s5a(f, t):
        f0 = int(26.5 * FPS) + 1
        k = A.smooth((t - 26.5) / 5.7)
        base = eye('father_eye', f0)
        cam = base + Vector((-1.05, -0.9, -0.04)) * (1 - 0.1 * k)
        return cam, eye('father_eye', f), 0.12, 0.15, 85, eye('father_eye', f), 2.0, 0.15

    def s5b(f, t):
        f0 = int(32.2 * FPS) + 1
        return aren_cu(f, t, 32.2, 35.0, Vector((1.15, -0.9, -0.03)), base_f=f0, lens=70, v=0.22, push=0.04)

    def s6a(f, t):
        k = A.smooth((t - 35.0) / 3.6)
        cam = Vector((1.2, -3.35, 1.33)) + Vector((0.12, 0.1, 0)) * k
        subj = mid(eye('aren_eye', f), eye('father_eye', f)) - Vector((0, 0, 0.3))
        return cam, subj, 0.0, 0.08, 38, eye('aren_eye', f), 4.0, 0.08

    def s6b(f, t):
        cam = Vector((1.7, -1.4, 1.55))
        subj = mid(eye('neda_eye', f), eye('elder_eye', f))
        return cam, subj, 0.04, 0.12, 55, subj, 3.2, 0.12

    def s6c(f, t):
        f0 = int(40.0 * FPS) + 1
        e0 = eye('aren_eye', f0)
        start = e0 + Vector((1.12, -0.86, -0.01))
        end = Vector((-0.2, -7.2, 3.3))
        k = A.smoother((t - 41.1) / (BLACK - 41.1))
        cam = start.lerp(end, k)
        subj = eye('aren_eye', f).lerp(Vector((1.35, 0.6, 0.9)), k)
        lens = 85 + (32 - 85) * A.smooth(min(1.0, k * 1.3))
        return cam, subj, -0.11 * (1 - k), 0.16 * (1 - k) + 0.05 * k, lens, eye('aren_eye', f), 2.0 + 4 * k, 0.12

    fns = {'S1_return': s1, 'S2_recognition': s2, 'S3_hope': s3, 'S4a_step_back': s4a, 'S4b_smile_fades': s4b,
           'S5a_father_cu': s5a, 'S5b_dont_know': s5b, 'S6a_its_me': s6a, 'S6b_villagers': s6b, 'S6c_pullback': s6c}
    taus = {'S1_return': 0.6, 'S2_recognition': 0.35, 'S3_hope': 0.35, 'S4a_step_back': 0.5, 'S4b_smile_fades': 0.3,
            'S5a_father_cu': 0.3, 'S5b_dont_know': 0.3, 'S6a_its_me': 0.45, 'S6b_villagers': 0.35, 'S6c_pullback': 0.3}
    cams = {}
    bk = A.Baker()
    report = []
    for i, (name, ts, te) in enumerate(SHOTS):
        cd = bpy.data.cameras.new('CAM_' + name)
        cd.sensor_fit = 'HORIZONTAL'
        cd.sensor_width = SENSOR_W
        cd.dof.use_dof = True
        cd.clip_start = 0.05
        cd.clip_end = 400
        ob = bpy.data.objects.new('CAM_' + name, cd)
        coll.objects.link(ob)
        ob.rotation_mode = 'QUATERNION'
        cams[name] = ob
        f0, f1 = int(round(ts * FPS)) + 1, int(round(te * FPS))
        m = sc.timeline_markers.new(name, frame=f0)
        m.camera = ob
        aim_s = None
        a = 1.0
        for f in range(f0, f1 + 1):
            t = t_of(f)
            cam, subj, u, v, lens, focus, fstop, shake = fns[name](f, t)
            raw = aim_point(cam, subj, u, v, lens)
            if aim_s is None:
                aim_s = raw.copy()
            a = 1 - math.exp(-(1 / FPS) / taus[name])
            aim_s = aim_s + (raw - aim_s) * a
            q = (aim_s - cam).to_track_quat('-Z', 'Y')
            # operator: slow drift + a little breathing
            e = (math.radians(wobble(t, i * 3.7 + 1, shake, 0.45)), math.radians(wobble(t, i * 5.3 + 2, shake, 0.38)),
                 math.radians(wobble(t, i * 2.1 + 3, shake * 0.4, 0.3)))
            q = q @ Euler(e, 'XYZ').to_quaternion()
            for k in range(3):
                bk.put(ob, 'location', k, f, cam[k])
            for k in range(4):
                bk.put(ob, 'rotation_quaternion', k, f, q[k])
            bk.put(cd, 'lens', 0, f, lens)
            view = q @ Vector((0, 0, -1))
            bk.put(cd, 'dof.focus_distance', 0, f, max(0.3, (focus - cam).dot(view)))
            bk.put(cd, 'dof.aperture_fstop', 0, f, fstop)
        report.append(name)
    bk.write()
    sc.camera = cams[SHOTS[0][0]]
    return cams


def build_shot_lights(sc, coll, cams, track):
    """Per-shot soft fill (camera side) and rim (behind the subject), keyed per frame."""
    def area(name, size, color):
        L = bpy.data.lights.new(name, 'AREA')
        L.size = size
        L.color = color
        L.energy = 0
        ob = bpy.data.objects.new(name, L)
        coll.objects.link(ob)
        ob.rotation_mode = 'QUATERNION'
        return ob
    fill = area('shot_fill', 1.2, (1.0, 0.82, 0.68))
    rim = area('shot_rim', 0.8, (1.0, 0.72, 0.5))
    # (subject track, fill energy, fill offset from camera (right, up, back), rim energy, rim offset from subject)
    P = {
        'S1_return': (None, 0, None, 0, None),
        'S2_recognition': ('father_eye', 14, (0.6, 0.3, 0.0), 26, Vector((1.0, 1.0, 0.5))),
        'S3_hope': ('aren_eye', 7, (-0.8, 0.35, 0.0), 20, Vector((-0.6, 0.9, 0.4))),
        'S4a_step_back': ('father_eye', 5, (0.6, 0.4, 0.0), 20, Vector((1.0, 0.6, 0.5))),
        'S4b_smile_fades': ('aren_eye', 7, (-0.8, 0.35, 0.0), 20, Vector((-0.6, 0.9, 0.4))),
        'S5a_father_cu': ('father_eye', 16, (0.45, 0.25, 0.0), 24, Vector((0.9, 0.8, 0.45))),
        'S5b_dont_know': ('aren_eye', 7, (-0.8, 0.35, 0.0), 20, Vector((-0.6, 0.9, 0.4))),
        'S6a_its_me': ('aren_eye', 4, (0.0, 0.5, 0.0), 16, Vector((-0.4, 1.4, 0.6))),
        'S6b_villagers': ('elder_eye', 3, (0.5, 0.4, 0.0), 0, None),
        'S6c_pullback': ('aren_eye', 6, (-0.8, 0.35, 0.0), 16, Vector((-0.6, 0.9, 0.4))),
    }
    bk = A.Baker()
    for f in range(1, NF + 1):
        t = t_of(f)
        name = shot_at(t)[0]
        key, fe, fo, re, ro = P[name]
        cam = cams[name]
        fade = 1.0
        if name == 'S6c_pullback':
            fade = 1 - A.ramp(t, 41.2, 43.0)
        if key is None:
            for ob in (fill, rim):
                bk.put(ob.data, 'energy', 0, f, 0.0)
            continue
        subj = track[key][f - 1]
        cpos = _eval_loc(cam, f)     # camera position from its baked track
        d = (subj - cpos).normalized()
        right = d.cross(Vector((0, 0, 1))).normalized()
        up = right.cross(d).normalized()
        fp = cpos + right * fo[0] + up * fo[1] - d * fo[2]
        q = (subj - fp).to_track_quat('-Z', 'Y')
        for i in range(3):
            bk.put(fill, 'location', i, f, fp[i])
        for i in range(4):
            bk.put(fill, 'rotation_quaternion', i, f, q[i])
        bk.put(fill.data, 'energy', 0, f, fe * fade)
        if ro is not None:
            rp = subj + ro
            q2 = (subj - rp).to_track_quat('-Z', 'Y')
            for i in range(3):
                bk.put(rim, 'location', i, f, rp[i])
            for i in range(4):
                bk.put(rim, 'rotation_quaternion', i, f, q2[i])
            bk.put(rim.data, 'energy', 0, f, re * fade)
        else:
            bk.put(rim.data, 'energy', 0, f, 0.0)
    bk.write()
    return fill, rim


def _eval_loc(ob, f):
    ad = ob.animation_data
    act = ad.action
    vals = []
    for i in range(3):
        fc = None
        try:
            fc = act.fcurves.find('location', index=i)
        except Exception:
            pass
        if fc is None:
            # layered actions (Blender 4.4+): look through the channelbag
            for layer in act.layers:
                for strip in layer.strips:
                    cb = strip.channelbag(ad.action_slot)
                    if cb:
                        fc = cb.fcurves.find('location', index=i)
        vals.append(fc.evaluate(f) if fc else 0.0)
    return Vector(vals)


def fire_flicker(info):
    bk = A.Baker()
    for k, lo in enumerate(info['glow']):
        base = lo.data.energy
        for f in range(1, NF + 1):
            t = t_of(f)
            e = base * (1 + 0.16 * A.noise1(t, 11 + k, 6.5) + 0.07 * A.noise1(t, 23 + k, 17.0))
            bk.put(lo.data, 'energy', 0, f, e)
    bk.write()


def render_settings(sc):
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.render.resolution_percentage = 100
    ee = sc.eevee
    ee.taa_render_samples = 64
    for attr, val in (('use_shadows', True), ('use_volumetric_shadows', True), ('volumetric_tile_size', '8'),
                      ('use_raytracing', True)):
        if hasattr(ee, attr):
            try:
                setattr(ee, attr, val)
            except Exception:
                pass
    vs = sc.view_settings
    vs.view_transform = 'AgX'
    looks = [i.identifier for i in vs.bl_rna.properties['look'].enum_items]
    for want in ('AgX - Medium High Contrast', 'Medium High Contrast'):
        if want in looks:
            vs.look = want
            break
    vs.exposure = 0.0
    sc.render.film_transparent = False
    sc.render.use_motion_blur = False


if __name__ == '__main__':
    main()

"""Body pose vocabulary on top of anim.Pose: arm hang, hand shapes (finger curls computed from each hand's own rest
geometry, so the same call works for every character and both sides), breathing, posture.

All angles are degrees; all axes are character space (+X = character's left, -Y = forward, +Z = up).
"""
import math

from mathutils import Vector

from . import anim as A

FINGERS = {'thumb': 1, 'index': 2, 'middle': 3, 'ring': 4, 'pinky': 5}


class HandFrame:
    """Per-side curl axes for every finger joint, derived from the rest skeleton."""

    def __init__(self, rig, side):
        self.side = side
        h, t = rig.head, rig.tail
        sx = 1 if side == 'L' else -1
        k = (h[f'finger5-1.{side}'] - h[f'finger2-1.{side}']).normalized()      # knuckle line, index -> pinky
        d_hand = (h[f'finger3-1.{side}'] - h[f'wrist.{side}']).normalized()
        # palm normal: in the MakeHuman rest A-pose the palms face down and in towards the body
        n = d_hand.cross(k).normalized()
        if n.dot(Vector((-sx, 0, -1))) < 0:
            n = -n
        self.palm = n
        self.axes = {}
        for f in range(1, 6):
            for j in range(1, 4):
                b = f'finger{f}-{j}.{side}'
                d = (t[b] - h[b]).normalized()
                a = d.cross(n).normalized()
                if f == 1:
                    # the thumb folds across the palm towards the pinky
                    a = d.cross((n * 0.6 + k * 0.8).normalized()).normalized()
                self.axes[b] = a
        self.spread_axis = n  # fingers fan about the palm normal
        self.k = k


def hand(P, frames, side, curl=0.25, thumb=0.2, spread=0.0, per=None, wrist=(0, 0, 0)):
    """Hand shape. curl 0 = flat, 1 = fist; per = {'index': extra curl, ...}; wrist = (flex, deviation, twist) deg."""
    hf = frames[side]
    per = per or {}
    for name, f in FINGERS.items():
        c = (thumb if f == 1 else curl) + per.get(name, 0.0)
        if f == 1:
            js = (25, 30, 35)
        else:
            js = (70, 85, 55)
        for j in range(1, 4):
            b = f'finger{f}-{j}.{side}'
            P.turn(b, hf.axes[b], js[j - 1] * c)
        if f > 1 and spread:
            P.turn(f'finger{f}-1.{side}', hf.spread_axis, spread * (f - 3) * 6 * (1 if side == 'L' else -1))
    fl, dev, tw = wrist
    if fl:
        P.turn(f'wrist.{side}', hf.k, fl)
    if dev:
        P.turn(f'wrist.{side}', hf.palm, dev)


def frames_for(rig):
    return {s: HandFrame(rig, s) for s in ('L', 'R')}


# the MakeHuman rest pose already bends the elbows by about this much
REST_ELBOW = 45.0


def arms_hang(P, amount=1.0, elbow=18, fwd=0.0, swing_L=0.0, swing_R=0.0, out=0.0):
    """Arms from the MakeHuman rest A-pose down to the sides. elbow = total bend in degrees (0 = straight);
    swing = forward(+)/back(-) degrees."""
    P.turn('upperarm02.L', (0, 1, 0), (40 - out) * amount)
    P.turn('upperarm02.R', (0, 1, 0), -(40 - out) * amount)
    for s, sw in (('L', swing_L), ('R', swing_R)):
        P.turn(f'upperarm02.{s}', (1, 0, 0), -(fwd + sw))
        P.turn(f'lowerarm01.{s}', (1, 0, 0), -(elbow - REST_ELBOW * amount))


def breathe(P, phase, depth=1.0):
    """Chest rise for a breathing phase in radians (integrate the rate outside, so rate changes stay smooth).
    Returns sin(phase): +1 = full inhale."""
    ph = math.sin(phase)
    P.turn('spine03', (1, 0, 0), -0.8 * depth * ph)
    P.turn('spine04', (1, 0, 0), -0.6 * depth * ph)
    P.turn('clavicle.L', (0, 1, 0), -0.9 * depth * ph)
    P.turn('clavicle.R', (0, 1, 0), 0.9 * depth * ph)
    return ph


def head_aim(P, rig, pose_loc, yaw, target, head_pt, weight=1.0, max_yaw=70, max_pitch=35, split=(0.25, 0.35, 0.4),
             bias=(0.0, 0.0)):
    """Turn spine-top / neck / head so the face points at a world target. bias adds (yaw, pitch) degrees."""
    R = A.Matrix.Rotation(-yaw, 3, 'Z')
    d = R @ (Vector(target) - (pose_loc + A.Matrix.Rotation(yaw, 3, 'Z') @ head_pt))
    ya = math.degrees(math.atan2(d.x, -d.y)) + bias[0]
    pa = math.degrees(math.atan2(-d.z, math.hypot(d.x, d.y))) + bias[1]
    ya = max(-max_yaw, min(max_yaw, ya)) * weight
    pa = max(-max_pitch, min(max_pitch, pa)) * weight
    for b, w in zip(('spine01', 'neck02', 'head'), split):
        P.turn(b, (0, 0, 1), ya * w)
    for b, w in zip(('neck01', 'neck02', 'head'), (0.25, 0.3, 0.45)):
        P.turn(b, (1, 0, 0), pa * w)
    return ya, pa

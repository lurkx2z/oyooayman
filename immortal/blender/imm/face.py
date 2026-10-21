"""Facial performance system.

Layer 1, units: MakeHuman's 60 CC0 face pose units (brows, lids, cheeks, lips, jaw, tongue), each a set of face-bone
rotations. They blend linearly in rotation-vector space, so any mix of units at any weights is smooth and stable.
Layer 2, expressions: named, reusable mixes of units (EXPRESSIONS below), the vocabulary the shot scripts use.
Layer 3, performance: per-frame curves of expression weights + extra unit offsets + blinks + visemes, baked to keys.

Eye direction is not a unit: it comes from each character's look target (see character.add_look_target).
"""
import math

import numpy as np
from mathutils import Matrix, Quaternion, Vector

from . import mh

EYE_UNITS = {'LeftEyeDown', 'RightEyeDown', 'LeftEyeUp', 'RightEyeUp', 'LeftEyeturnRight', 'RightEyeturnRight',
             'LeftEyeturnLeft', 'RightEyeturnLeft'}


def _euler(rx, ry, rz, order):
    R = Matrix.Identity(3)
    for ax in order:  # BVH: matrices multiply in channel order
        a = {'Xrotation': rx, 'Yrotation': ry, 'Zrotation': rz}[ax]
        R = R @ Matrix.Rotation(math.radians(a), 3, ax[0])
    return R


def _rotvec(R):
    q = R.to_quaternion()
    if q.w < 0:
        q.negate()
    ang = 2 * math.acos(max(-1.0, min(1.0, q.w)))
    s = math.sqrt(max(1e-12, 1 - q.w * q.w))
    return np.array([q.x, q.y, q.z]) / s * ang if ang > 1e-9 else np.zeros(3)


def _from_rotvec(v):
    ang = float(np.linalg.norm(v))
    if ang < 1e-10:
        return Quaternion()
    return Quaternion(Vector(v / ang), ang)


class FaceRig:
    """Applies unit mixes to a character's armature (pose bones in QUATERNION mode)."""

    _cache = None

    def __init__(self, rig):
        if FaceRig._cache is None:
            FaceRig._cache = mh.load_face_units()
        names, data = FaceRig._cache
        self.rig = rig
        self.units = names
        self.index = {n: i for i, n in enumerate(names)}
        self.vec = {}     # bone -> (n_units, 3) rotation vectors (world-aligned frame)
        for bone, frames in data.items():
            if bone not in rig.pose.bones:
                continue
            rv = np.array([_rotvec(_euler(rx, ry, rz, order)) for rx, ry, rz, order in frames])
            rv -= rv[0]   # relative to the Rest frame
            if np.abs(rv).max() > 1e-6:
                self.vec[bone] = rv
        self.rest = {b: rig.data.bones[b].matrix_local.to_3x3() for b in self.vec}
        for b in self.vec:
            rig.pose.bones[b].rotation_mode = 'QUATERNION'

    def rotations(self, weights):
        """weights: {unit: w} -> {bone: Quaternion basis rotation}."""
        w = np.zeros(len(self.units))
        for k, x in weights.items():
            if k in self.index:
                w[self.index[k]] += x
        out = {}
        for b, rv in self.vec.items():
            v = w @ rv
            R = _from_rotvec(v).to_matrix()
            rest = self.rest[b]
            out[b] = (rest.inverted() @ R @ rest).to_quaternion()
        return out

    def apply(self, weights):
        for b, q in self.rotations(weights).items():
            self.rig.pose.bones[b].rotation_quaternion = q

    def key(self, weights, frame):
        for b, q in self.rotations(weights).items():
            pb = self.rig.pose.bones[b]
            pb.rotation_quaternion = q
            pb.keyframe_insert('rotation_quaternion', frame=frame, group='face')


def sym(**kw):
    """sym(InnerBrowUp=0.5) -> both LeftInnerBrowUp and RightInnerBrowUp; plain names pass through."""
    out = {}
    for k, v in kw.items():
        if k.startswith('_'):
            k = k[1:]
            out['Left' + k] = v
            out['Right' + k] = v
        elif k.startswith('M_'):  # mouth units are named MouthLeftX / MouthRightX
            out['MouthLeft' + k[2:]] = v
            out['MouthRight' + k[2:]] = v
        else:
            out[k] = v
    return out


def mix(*pairs):
    """mix((exprA, wA), (exprB, wB), ...) -> weighted unit dict."""
    out = {}
    for e, w in pairs:
        for k, v in e.items():
            out[k] = out.get(k, 0.0) + v * w
    return out


# Expression vocabulary (tuned on Aren and the father in immortal/blender/tests/face_lab.py).
EXPRESSIONS = {
    'neutral': {},
    'tired': sym(_UpperLidClosed=0.28, _InnerBrowUp=0.15, M_PullDown=0.1),
    'hope_smile': sym(M_PullUp=0.75, _CheekUp=0.5, _LowerLidUp=0.35, _InnerBrowUp=0.3, _UpperLidOpen=0.1),
    'recognition': sym(_UpperLidOpen=0.45, _OuterBrowUp=0.35, _InnerBrowUp=0.25),
    'disbelief': sym(_UpperLidOpen=0.6, _InnerBrowUp=0.55, _OuterBrowUp=0.5, JawDrop=0.18),
    'fear': sym(_UpperLidOpen=0.75, _InnerBrowUp=0.8, _OuterBrowUp=0.2, M_PullSide=0.3, JawDrop=0.12,
                lowerLipDown=0.2, M_Platysma=0.3),
    'confused': {'LeftInnerBrowUp': 0.55, 'RightInnerBrowUp': 0.3, 'RightBrowDown': 0.25, 'MouthLeftPullSide': 0.15,
                 'lowerLipUp': 0.15},
    'hurt': sym(_InnerBrowUp=1.0, _BrowDown=0.2, M_PullDown=0.6, _LowerLidUp=0.35, lowerLipUp=0.35, M_Platysma=0.15),
    'grief': sym(_InnerBrowUp=1.0, _BrowDown=0.25, M_PullDown=0.6, _UpperLidClosed=0.25, _LowerLidUp=0.35,
                 lowerLipForward=0.25, M_Platysma=0.25),
    'restraint': sym(_BrowDown=0.3, _InnerBrowUp=0.35, UpperLipBackward=0.2, lowerLipUp=0.25, M_PullSide=0.12),
}

# Mouth shapes for dialogue (blended on top, short attack/release in performance.py)
VISEMES = {
    'rest': {},
    'A': {'JawDrop': 0.35, 'UpperLipUp': 0.1},           # father, I, how, alive (open vowels)
    'E': {'JawDrop': 0.2, 'MouthLeftPullSide': 0.25, 'MouthRightPullSide': 0.25},
    'O': {'JawDrop': 0.25, 'LipsKiss': 0.45},           # don't, know, you
    'U': {'JawDrop': 0.1, 'LipsKiss': 0.7},             # watched (w), you
    'M': {'lowerLipUp': 0.35, 'UpperLipForward': 0.1},  # m, b, p closed
    'F': {'lowerLipBackward': 0.5, 'lowerLipUp': 0.25, 'UpperLipUp': 0.1},  # f, v
    'T': {'JawDrop': 0.12, 'TongueUp': 0.4},             # t, d, n, l
    'S': {'JawDrop': 0.06, 'MouthLeftPullSide': 0.2, 'MouthRightPullSide': 0.2},
}

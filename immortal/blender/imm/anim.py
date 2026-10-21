"""Body animation toolkit: per-frame pose evaluation baked to keyframes.

A performance is a Python function of time that fills a Pose (bone rotations in character space, IK targets in
world space, face unit weights, eye target). Everything is a pure function of the frame number, then baked, so
renders are deterministic and the .blend stays editable (ordinary F-curves, IK constraints, empties).

Character space = the armature's rest frame: +X = character's left, -Y = forward, +Z = up.
"""
import math

import bpy
import numpy as np
from mathutils import Euler, Matrix, Quaternion, Vector

FPS = 24


def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def smoother(x):
    x = max(0.0, min(1.0, x))
    return x * x * x * (x * (x * 6 - 15) + 10)


def ramp(t, t0, t1, ease=smooth):
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return ease((t - t0) / (t1 - t0))


def env(t, a0, a1, b0, b1, ease=smooth):
    """0 before a0, rises to 1 by a1, holds, falls to 0 from b0 to b1."""
    return ramp(t, a0, a1, ease) * (1 - ramp(t, b0, b1, ease))


def lerp(a, b, x):
    return a + (b - a) * x


def noise1(t, seed, freq=1.0):
    """Smooth deterministic 1-D noise in about -1..1 (sum of incommensurate sines)."""
    s = seed * 12.9898
    return (math.sin(t * freq * 1.0 + s) * 0.5 + math.sin(t * freq * 2.31 + s * 1.7) * 0.3
            + math.sin(t * freq * 4.17 + s * 0.3) * 0.2)


def heading_to_euler_z(d):
    return math.atan2(d.x, -d.y)


class Rig:
    """Static data for one character's armature: rest rotations, parents, and IK set-up."""

    def __init__(self, ch):
        self.ch = ch
        self.ob = ch.rig
        bones = self.ob.data.bones
        self.rest = {b.name: b.matrix_local.to_3x3() for b in bones}
        self.rest_inv = {k: m.inverted() for k, m in self.rest.items()}
        self.parent = {b.name: (b.parent.name if b.parent else None) for b in bones}
        self.head = {b.name: b.head_local.copy() for b in bones}
        self.tail = {b.name: b.tail_local.copy() for b in bones}
        self.order = [b.name for b in bones]  # parents come before children in Blender's list
        for pb in self.ob.pose.bones:
            pb.rotation_mode = 'QUATERNION'
        self.targets = {}
        self.ankle_h = (self.head['foot.L'].z + self.head['foot.R'].z) / 2
        self.hip_h = self.head['upperleg02.L'].z
        self.leg_len = (self.head['upperleg02.L'] - self.head['lowerleg01.L']).length + \
                       (self.head['lowerleg01.L'] - self.head['foot.L']).length

    def setup_ik(self, coll):
        """Leg IK (hip + knee, feet on world-space targets with knee poles) and optional arm IK (influence 0 until
        a performance uses it)."""
        ob = self.ob
        cid = self.ch.id
        for side in ('L', 'R'):
            sx = 1 if side == 'L' else -1
            foot = _empty(f'{cid}_foot_{side}', coll, 0.06)
            foot.rotation_mode = 'QUATERNION'
            pole = _empty(f'{cid}_knee_{side}', coll, 0.03)
            pole.parent = ob
            pole.location = self.head['lowerleg01.' + side] + Vector((sx * 0.05, -0.5, 0))
            self.targets['foot_' + side] = foot
            self.targets['knee_' + side] = pole
            pb = ob.pose.bones['lowerleg02.' + side]
            c = pb.constraints.new('IK')
            c.target = foot
            c.pole_target = pole
            c.pole_angle = math.radians(-90)
            c.chain_count = 3
            c.use_stretch = False
            pb.lock_ik_x = pb.lock_ik_y = pb.lock_ik_z = True
            ob.pose.bones['upperleg02.' + side].lock_ik_y = True
            ob.pose.bones['lowerleg01.' + side].lock_ik_y = True
            ob.pose.bones['lowerleg01.' + side].lock_ik_z = True
            fpb = ob.pose.bones['foot.' + side]
            cr = fpb.constraints.new('COPY_ROTATION')
            cr.target = foot
            cr.name = 'FootRot'
            # arm IK, off by default
            hand = _empty(f'{cid}_hand_{side}', coll, 0.04)
            elbow = _empty(f'{cid}_elbow_{side}', coll, 0.03)
            elbow.parent = ob
            elbow.location = self.head['lowerarm01.' + side] + Vector((sx * 0.25, 0.35, -0.1))
            self.targets['hand_' + side] = hand
            self.targets['elbow_' + side] = elbow
            apb = ob.pose.bones['lowerarm02.' + side]
            ac = apb.constraints.new('IK')
            ac.name = 'ArmIK'
            ac.target = hand
            ac.pole_target = elbow
            ac.pole_angle = math.radians(-90)
            ac.chain_count = 3
            ac.use_stretch = False
            ac.influence = 0.0
            apb.lock_ik_x = apb.lock_ik_y = apb.lock_ik_z = True
        # eyes follow a look target
        look = _empty(f'{cid}_look', coll, 0.05)
        self.targets['look'] = look
        for side in ('L', 'R'):
            c = ob.pose.bones['eye.' + side].constraints.new('DAMPED_TRACK')
            c.target = look
            c.track_axis = 'TRACK_Y'

    # rest foot target transform for a given world placement
    def foot_rest_offset(self, side):
        return self.head['foot.' + side]


def _empty(name, coll, size):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = size
    e.empty_display_type = 'SPHERE'
    coll.objects.link(e)
    return e


class Pose:
    """One frame's pose. Rotations are accumulated per bone as character-space rotations (applied about the
    bone's rest orientation, FK semantics), then converted to basis quaternions."""

    def __init__(self, rig):
        self.rig = rig
        self.rot = {}        # bone -> Quaternion in character space (pre-rest)
        self.basis = {}      # bone -> explicit basis quaternion (face units), multiplied after
        self.loc = {}        # bone -> Vector basis location
        self.obj_loc = Vector((0, 0, 0))
        self.obj_yaw = 0.0
        self.targets = {}    # target name -> (Vector loc, Quaternion rot or None)
        self.influence = {}  # (bone, constraint) -> value
        self.face = {}
        self.look = None

    def turn(self, bone, axis, deg):
        q = Quaternion(Vector(axis).normalized(), math.radians(deg))
        self.rot[bone] = q @ self.rot.get(bone, Quaternion())

    def spread(self, bones, axis, deg):
        for b in bones:
            self.turn(b, axis, deg / len(bones))

    def basis_of(self, bone):
        R = self.rot.get(bone)
        q = Quaternion()
        if R is not None:
            rest = self.rig.rest[bone]
            q = (self.rig.rest_inv[bone] @ R.to_matrix() @ rest).to_quaternion()
        if bone in self.basis:
            q = q @ self.basis[bone]
        return q


SPINE = ['spine05', 'spine04', 'spine03', 'spine02', 'spine01']
NECK = ['neck01', 'neck02', 'neck03']


class Baker:
    """Collects per-frame values and writes them as F-curves in one go (fast, exact)."""

    def __init__(self):
        self.ch = {}

    def put(self, owner, path, index, frame, value):
        self.ch.setdefault((owner, path, index), []).append((frame, value))

    def write(self):
        by_owner = {}
        for (owner, path, idx), keys in self.ch.items():
            by_owner.setdefault(owner, []).append((path, idx, keys))
        for owner, chans in by_owner.items():
            if owner.animation_data is None:
                owner.animation_data_create()
            act = owner.animation_data.action
            if act is None:
                act = bpy.data.actions.new(owner.name + '_perf')
                owner.animation_data.action = act
            for path, idx, keys in chans:
                fc = _fcurve(owner, act, path, idx)
                fc.keyframe_points.add(len(keys))
                co = np.array(keys, dtype=np.float64).ravel()
                fc.keyframe_points.foreach_set('co', co)
                fc.keyframe_points.foreach_set('interpolation', np.full(len(keys), 1, dtype=np.int32))  # LINEAR
                fc.update()
        self.ch = {}


def _fcurve(owner, act, path, idx):
    # Blender 4.4+ layered actions: use the legacy-compatible helper when present
    try:
        return act.fcurve_ensure_for_datablock(owner, path, index=idx)
    except Exception:
        fc = act.fcurves.find(path, index=idx)
        return fc or act.fcurves.new(path, index=idx)


def bake_pose(baker, rig, pose, frame, face_rig=None):
    ob = rig.ob
    for b in set(pose.rot) | set(pose.basis):
        q = pose.basis_of(b)
        path = f'pose.bones["{b}"].rotation_quaternion'
        for i in range(4):
            baker.put(ob, path, i, frame, q[i])
    for b, v in pose.loc.items():
        path = f'pose.bones["{b}"].location'
        for i in range(3):
            baker.put(ob, path, i, frame, v[i])
    for i in range(3):
        baker.put(ob, 'location', i, frame, pose.obj_loc[i])
    baker.put(ob, 'rotation_euler', 2, frame, pose.obj_yaw)
    for name, (loc, rot) in pose.targets.items():
        t = rig.targets[name]
        for i in range(3):
            baker.put(t, 'location', i, frame, loc[i])
        if rot is not None:
            for i in range(4):
                baker.put(t, 'rotation_quaternion', i, frame, rot[i])
    for (bone, cname), v in pose.influence.items():
        baker.put(ob, f'pose.bones["{bone}"].constraints["{cname}"].influence', 0, frame, v)
    if pose.look is not None:
        for i in range(3):
            baker.put(rig.targets['look'], 'location', i, frame, pose.look[i])


def char_to_world(pose, p):
    """Character-space point -> world, using the pose's object placement."""
    R = Matrix.Rotation(pose.obj_yaw, 3, 'Z')
    return pose.obj_loc + R @ p


# ------------------------------------------------------------------------------------------------ locomotion
class Step:
    """A foot plant: `foot` lands at world `pos` (ankle xy) with `yaw` (facing, radians, as obj_yaw) at time `t`,
    having lifted at `t_lift`. lift = swing height (m)."""

    def __init__(self, foot, t_lift, t, pos, yaw, lift=0.07, drag=0.0):
        self.foot, self.t_lift, self.t, self.pos, self.yaw, self.lift, self.drag = foot, t_lift, t, Vector(pos), yaw, lift, drag


class Feet:
    """Foot targets from a list of steps per foot, starting from initial placements."""

    def __init__(self, rig, start_L, start_R, yaw0, steps):
        self.rig = rig
        self.start = {'L': (Vector(start_L), yaw0), 'R': (Vector(start_R), yaw0)}
        self.steps = {'L': sorted([s for s in steps if s.foot == 'L'], key=lambda s: s.t),
                      'R': sorted([s for s in steps if s.foot == 'R'], key=lambda s: s.t)}

    def state(self, side, t):
        """-> (xy Vector, yaw, height, pitch_deg, swing phase or None)"""
        pos, yaw = self.start[side]
        for s in self.steps[side]:
            if t >= s.t:
                pos, yaw = s.pos, s.yaw
                continue
            if t > s.t_lift:
                u = (t - s.t_lift) / (s.t - s.t_lift)
                e = smoother(u)
                xy = pos.lerp(s.pos, e)
                h = s.lift * math.sin(math.pi * min(1, u * 1.08)) ** 0.9 + 0.025 * math.sin(math.pi * min(1, u / 0.35)) * (u < 0.35)
                dyaw = (s.yaw - yaw + math.pi) % (2 * math.pi) - math.pi
                pitch = 12 * math.sin(math.pi * min(1, u / 0.35)) * (u < 0.35) - 10 * env(u, 0.6, 0.85, 0.92, 1.0)
                return xy, yaw + dyaw * e, h, pitch, u
            return pos, yaw, 0.0, 0.0, None
        return pos, yaw, 0.0, 0.0, None

    def target(self, side, t, ground=0.0):
        xy, yaw, h, pitch, u = self.state(side, t)
        rig = self.rig
        # ankle height above the sole + swing
        z = ground + rig.ankle_h + h
        q = Quaternion((0, 0, 1), yaw) @ Quaternion((1, 0, 0), math.radians(pitch))
        # foot bone rest orientation in world when the character faces yaw
        rest = rig.rest['foot.' + side].to_quaternion()
        return Vector((xy.x, xy.y, z)), q @ rest, u


def walk_steps(path, t0, foot0, step_len, step_time, lift=0.06, rng_seed=0, jitter=0.12, width=0.1, end_feet_together=True,
               stumble=None):
    """Footsteps along a polyline path (list of xy). Returns (steps, t_end, start_L, start_R, yaw0, final_yaw).
    step_time may vary per step (jitter, fraction); stumble = (step_index, extra_time) for an uneven step."""
    rng = np.random.default_rng(rng_seed)
    pts = [Vector((p[0], p[1], 0)) for p in path]
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
    total = sum(seg)

    def at(d):
        d = max(0, min(total, d))
        for i, L in enumerate(seg):
            if d <= L or i == len(seg) - 1:
                u = d / L if L > 0 else 0
                p = pts[i].lerp(pts[i + 1], u)
                dirv = (pts[i + 1] - pts[i]).normalized()
                return p, dirv
            d -= L
        return pts[-1], (pts[-1] - pts[-2]).normalized()

    p0, d0 = at(0)
    yaw0 = heading_to_euler_z(d0)
    side_vec = lambda d: Vector((-d.y, d.x, 0))  # character's left when facing d
    start_L = p0 + side_vec(d0) * width
    start_R = p0 - side_vec(d0) * width
    steps = []
    d = 0.0
    t = t0
    foot = foot0
    n = max(1, int(round(total / step_len)))
    sl = total / n
    for k in range(n + (1 if end_feet_together else 0)):
        last = k == n
        d_target = min(total, d + (sl if k > 0 else sl * 0.5)) if not last else total
        dt = step_time * (1 + rng.uniform(-jitter, jitter))
        if stumble and k == stumble[0]:
            dt += stumble[1]
        p, dirv = at(d_target)
        sgn = 1 if foot == 'L' else -1
        pos = p + side_vec(dirv) * width * sgn
        yaw = heading_to_euler_z(dirv)
        steps.append(Step(foot, t + dt * 0.12, t + dt, pos, yaw, lift=lift * (0.6 if last else 1.0)))
        t += dt * (0.62 if not last else 1.0)
        d = d_target
        foot = 'R' if foot == 'L' else 'L'
    return steps, t, start_L, start_R, yaw0, heading_to_euler_z(at(total)[1])


def pelvis_from_feet(rig, feet, t, yaw_override=None, crouch=0.03, bob=0.025, sway=0.022, ground=0.0, bias=0.0,
                     offset=None):
    """Object placement (xy, z offset, yaw) that keeps both legs reachable: centre between the feet, shifted over the
    stance foot, height dropping in double support (bob) and never higher than the legs allow.
    bias shifts the weight from the left (-0.5) to the right (+0.5) foot; offset is an extra world-space xy shift."""
    sL = feet.state('L', t)
    sR = feet.state('R', t)
    pL, pR = sL[0], sR[0]
    yaw = yaw_override if yaw_override is not None else _ang_mid(sL[1], sR[1])
    mid = (pL + pR) / 2
    swing = sL[4] if sL[4] is not None else sR[4]
    stance = 'R' if sL[4] is not None else ('L' if sR[4] is not None else None)
    shift = Vector((0, 0, 0))
    lift_amt = 0.0
    if swing is not None:
        st = pR if stance == 'R' else pL
        shift = (st - mid) * (sway / 0.1) * math.sin(math.pi * swing)
        lift_amt = math.sin(math.pi * swing)
    xy = mid + shift + (pR - pL) * bias
    if offset is not None:
        xy = xy + Vector((offset[0], offset[1], 0))
    # desired hip drop: crouch + bob (low at contact)
    drop = crouch + bob * (1 - lift_amt)
    # reach limit for each leg: hip joint above the ankle
    R = Matrix.Rotation(yaw, 3, 'Z')
    zmax = 10.0
    for side, st in (('L', sL), ('R', sR)):
        hip_c = R @ Vector((rig.head['upperleg02.' + side].x, rig.head['upperleg02.' + side].y, 0))
        ank = Vector((st[0].x, st[0].y, 0))
        dxy = (Vector((xy.x, xy.y, 0)) + hip_c - ank).length
        reach = rig.leg_len * 0.985
        if dxy < reach:
            hz = math.sqrt(reach * reach - dxy * dxy) + rig.ankle_h + ground + st[2]
            zmax = min(zmax, hz - rig.hip_h)
    dz = min(-drop, zmax)
    # the root sits behind the ankles in the rest pose: put the object so the pelvis is over xy
    off = R @ Vector((0, rig.head['root'].y * 0.5, 0))
    return Vector((xy.x - off.x, xy.y - off.y, dz)), yaw, swing, stance


def _ang_mid(a, b):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi
    return a + d / 2

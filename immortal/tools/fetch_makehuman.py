#!/usr/bin/env python3
"""Vendor the CC0 MakeHuman assets Project Immortal needs into immortal/assets/makehuman/ (run once; re-run after
adding a character or a face modifier). Downloads the base mesh, rig, weights, face pose units and exactly the
targets the character specs in immortal/blender/characters/*.json use, then writes MANIFEST.json with sizes and
sha256 so a rebuild can prove it used the same data. Standard library + numpy only."""
import glob
import hashlib
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blender'))
from imm import mh  # noqa: E402


def fetch(rel):
    dst = mh.asset(rel)
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with urllib.request.urlopen(mh.RAW + rel, timeout=60) as r:
        data = r.read()
    open(dst, 'wb').write(data)
    print('fetched', rel, len(data))
    return dst


def main():
    files = list(mh.BASE_FILES) + ['data/modifiers/modeling_modifiers.json', '../LICENSE.ASSETS.md']
    for spec_file in sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'blender', 'characters', '*.json'))):
        spec = json.load(open(spec_file))
        for rel, _ in mh.macro_targets(spec['macro']) + mh.modifier_targets(spec.get('modifiers', {})):
            files.append(rel)
    files = sorted(set(files))
    for rel in files:
        fetch(rel)
    man = {'source': mh.RAW, 'license': 'CC0 1.0 (MakeHuman assets, see LICENSE.ASSETS.md)', 'files': {}}
    for rel in files:
        b = open(mh.asset(rel), 'rb').read()
        man['files'][rel] = {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
    json.dump(man, open(mh.asset('MANIFEST.json'), 'w'), indent=1)
    print(len(files), 'files ok')


if __name__ == '__main__':
    main()

#!/usr/bin/env bash
# =====================================================================
# NEW EPISODE — start an episode from templates/episode/ (a minimal, working, on-style film:
# overcast city subclass, walkers and traffic, centred title, a readout, captions, hands, sound).
#
#   tools/new-episode.sh <slug> <TAG> "WHAT IF GRAVITY / DOUBLED / FOR 10 SECONDS?"
#     slug  lowercase-with-hyphens → films/<slug>/ and <slug>.html
#     TAG   2–4 capital letters, the film's global prefix (e.g. GV); must not clash with existing films
#     title lines separated by " / " (2 or 3 lines; the middle line becomes the big "hero" line)
#
# Then: NODE_PATH=$(npm root -g) node tools/check-page.cjs <slug>.html
#       NODE_PATH=$(npm root -g) node tools/stills.cjs --page <slug>.html --t 1,4,10,21,26 --out /tmp/<slug>_s
# =====================================================================
set -euo pipefail
SLUG=${1:?slug}; TAG=${2:?TAG}; TITLE=${3:?title}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[[ "$SLUG" =~ ^[a-z0-9-]+$ ]] || { echo "slug must be lowercase letters, digits, hyphens"; exit 1; }
[[ "$TAG" =~ ^[A-Z]{2,4}$ ]] || { echo "TAG must be 2-4 capital letters"; exit 1; }
if [[ -e "$ROOT/films/$SLUG" || -e "$ROOT/$SLUG.html" ]]; then echo "films/$SLUG or $SLUG.html already exists"; exit 1; fi
if grep -rqE "\b(const|class|function) ${TAG}([_A-Z]|\b)" "$ROOT/films" "$ROOT/js" 2>/dev/null; then echo "prefix $TAG is already used somewhere; pick another"; exit 1; fi
Tag="${TAG:0:1}$(echo "${TAG:1}" | tr 'A-Z' 'a-z')"
tag="$(echo "$TAG" | tr 'A-Z' 'a-z')"
python3 - "$ROOT" "$SLUG" "$TAG" "$Tag" "$tag" "$TITLE" <<'PY'
import sys, os, html, glob
root, slug, TAG, Tag, tag, title = sys.argv[1:7]
parts = [p.strip() for p in title.split('/') if p.strip()]
text = ' '.join(parts)
cls = ['kick', 'hero', 'kick'] if len(parts) == 3 else ['kick', 'hero'] if len(parts) == 2 else ['hero'] * len(parts)
h = ''.join('<span class="%s">%s</span>' % (c, html.escape(p, quote=False)) for c, p in zip(cls, parts))
rep = {'__SLUG__': slug, '__TAG__': TAG, '__Tag__': Tag, '__tag__': tag,
       '__TITLE_TEXT__': html.escape(text, quote=False).replace("'", '’'), '__TITLE_HTML__': h.replace("'", '’')}
def sub(src, dst):
    s = open(src, encoding='utf-8').read()
    for k, v in rep.items():
        s = s.replace(k, v)
    open(dst, 'w', encoding='utf-8').write(s)
os.makedirs(os.path.join(root, 'films', slug), exist_ok=True)
for f in glob.glob(os.path.join(root, 'templates', 'episode', 'films', '*')):
    sub(f, os.path.join(root, 'films', slug, os.path.basename(f)))
sub(os.path.join(root, 'templates', 'episode', 'page.html'), os.path.join(root, slug + '.html'))
PY
echo "created films/$SLUG/ and $SLUG.html (prefixes $TAG / $Tag / $tag)"
ls "$ROOT/films/$SLUG"

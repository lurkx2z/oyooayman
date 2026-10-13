#!/usr/bin/env python3
"""MAKE-PLANET — bakes the planet's maps for "What if Africa suddenly disappeared?" into planet-data.js.

    python3 films/africa-disappears/make-planet.py <natural-earth-geojson-dir>

Input: Natural Earth (public domain, naturalearthdata.com) GeoJSON files, not stored in the repo:
  ne_50m_land, ne_50m_admin_0_countries, ne_50m_lakes, ne_50m_glaciated_areas, ne_50m_antarctic_ice_shelves_polys,
  ne_10m_bathymetry_{L_0,K_200,J_1000,I_2000,H_3000,G_4000,F_5000}, ne_10m_populated_places_simple.
Output (equirectangular, lon −180…180 left to right, lat 90…−90 top to bottom), embedded as data URIs:
  DAY  4096×2048 JPEG  muted land biomes + ocean coloured by depth (today's Earth)
  DATA 4096×2048 PNG   R land (1) · G Africa: 0 outside, else 0.02 + 0.98·(distance from its coast / 1600 km)
                       B ocean depth / 6000 m · A the basin floor's relief (0…1)
  AUX  2048×1024 PNG   R clouds · G night lights (outside Africa) · B Africa's night lights
Also writes AF_CITIES (the large African cities, for the "erased" shot).
Africa = the 54 countries Natural Earth lists in CONTINENT 'Africa', with Egypt cut at the Suez Canal (Sinai is Asia).
Deterministic: seeded noise only.
"""
import json, sys, os, io, base64, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/geo'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'planet-data.js')
W, H = 4096, 2048
rng = np.random.default_rng(20261013)


def load(name):
    with open(os.path.join(SRC, name + '.geojson')) as f:
        return json.load(f)['features']


def rings(geom):
    if geom is None:
        return []
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon':
        return geom['coordinates']
    return []


def xy(lon, lat, w=W, h=H):
    return ((lon + 180.0) / 360.0 * w, (90.0 - lat) / 180.0 * h)


def raster(feats, w=W, h=H, clip=None):
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    for f in feats:
        for poly in rings(f['geometry']):
            for k, ring in enumerate(poly):
                pts = [xy(p[0], p[1], w, h) for p in ring]
                if clip:
                    pts = [xy(p[0], p[1], w, h) for p in clip(ring)]
                if len(pts) >= 3:
                    d.polygon(pts, fill=255 if k == 0 else 0)
    return np.asarray(im, dtype=np.float32) / 255.0


# ---------------------------------------------------------------------------------------------------- land, Africa
land = raster(load('ne_50m_land'))
countries = load('ne_50m_admin_0_countries')
afr = [f for f in countries if f['properties']['CONTINENT'] == 'Africa']
africa = raster(afr)
# Egypt east of the Suez Canal (Sinai) is Asia: keep it. The canal: Port Said (32.31, 31.27) → Suez (32.55, 29.95).
lon = (np.arange(W) + 0.5) / W * 360 - 180
lat = 90 - (np.arange(H) + 0.5) / H * 180
LON, LAT = np.meshgrid(lon, lat)
canal_lon = 32.31 + (31.27 - LAT) / (31.27 - 29.95) * (32.55 - 32.31)
sinai = (LON > canal_lon) & (LAT > 27.6) & (LAT < 31.6) & (LON < 35.0)
africa[sinai] = 0
africa = np.minimum(africa, np.maximum(land, africa))   # (country polygons reach slightly past the coast)
land = np.maximum(land, africa)
lakes = raster(load('ne_50m_lakes'))
ice = np.maximum(raster(load('ne_50m_glaciated_areas')), raster(load('ne_50m_antarctic_ice_shelves_polys')))
ice[LAT < -60] = np.maximum(ice[LAT < -60], land[LAT < -60])

# distance inside Africa from its coast (km). Pixels are 9.78 km tall; their width shrinks with cos(lat), so the
# transform runs in a grid stretched to Africa's mean scale (good to ~15 % near its north and south tips).
km = 40075.0 / W
inside = africa > 0.5
dist = ndimage.distance_transform_edt(inside, sampling=(km, km * math.cos(math.radians(8))))
afr_g = np.where(inside, 0.02 + 0.98 * np.clip(dist / 1600.0, 0, 1), 0.0)
print('Africa: max inland distance %.0f km, %.1f M km² (land pixels × area)' % (dist.max(), (inside * (km * km * np.cos(np.radians(LAT)))).sum() / 1e6))

# ---------------------------------------------------------------------------------------------------- ocean depth
depth = np.zeros((H, W), np.float32)
for lvl, name in [(200, 'K_200'), (1000, 'J_1000'), (2000, 'I_2000'), (3000, 'H_3000'), (4000, 'G_4000'), (5000, 'F_5000')]:
    m = raster(load('ne_10m_bathymetry_' + name))
    depth = np.where(m > 0.5, lvl, depth)
ocean = (land < 0.5) | (africa > 0.5)
depth = np.where(ocean & (depth == 0), 80.0, depth)   # the 0–200 m shelf band
depth = ndimage.gaussian_filter(depth, 2.2) * ocean
depth[africa > 0.5] = 0
print('depth range', depth.min(), depth.max())

# ---------------------------------------------------------------------------------------------------- seeded noise
def value_noise(shape, cells, seed):
    r = np.random.default_rng(seed)
    g = r.random((cells[0] + 1, cells[1] + 1)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((shape[1], shape[0]), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255.0


def fbm(shape, base, octaves, seed):
    v = np.zeros(shape, np.float32); a = 0.5; n = 0
    for o in range(octaves):
        c = (int(base[0] * 2 ** o), int(base[1] * 2 ** o))
        v += a * value_noise(shape, c, seed + o * 17); n += a; a *= 0.5
    return v / n


N1 = fbm((H, W), (6, 12), 6, 3)
N2 = fbm((H, W), (24, 48), 4, 9)

# ---------------------------------------------------------------------------------------------------- land colour
# aridity: 0 wet forest … 1 desert. A smooth climate sketch (deserts, savannas, rainforests) + noise.
def blob(lo, la, r, s=1.0):
    dl = (LON - lo) * np.cos(np.radians(LAT)); dd = LAT - la
    return s * np.exp(-(dl * dl + dd * dd) / (2 * r * r))


alat = np.abs(LAT)
arid = 0.3 - 0.3 * np.exp(-((alat - 2) / 9) ** 2) + 0.12 * np.exp(-((alat - 24) / 8) ** 2) - 0.2 * np.exp(-((alat - 55) / 10) ** 2)
for b in [(12, 23, 12, 0.7), (25, 25, 9, 0.6), (-5, 22, 8, 0.5), (45, 22, 9, 0.55), (55, 30, 8, 0.4), (63, 37, 7, 0.4), (70, 27, 4, 0.3),
          (100, 41, 9, 0.5), (85, 40, 6, 0.4), (133, -25, 11, 0.6), (122, -26, 7, 0.4), (-112, 33, 6, 0.4), (-117, 39, 5, 0.35), (-70, -24, 4, 0.5),
          (-68, -40, 5, 0.35), (19, -24, 6, 0.45), (15, -22, 4, 0.35), (2, 15, 9, 0.25), (20, 15, 10, 0.2), (40, 7, 5, 0.25), (43, 12, 5, 0.35), (55, 46, 7, 0.3)]:
    arid += blob(*b)
for b in [(22, 0, 10, 0.5), (-62, -5, 14, 0.55), (110, 0, 12, 0.45), (100, 15, 8, 0.25), (-75, 5, 6, 0.3), (-48, -20, 8, 0.25), (30, 58, 18, 0.15),
          (-80, 40, 10, 0.2), (138, 37, 6, 0.25), (148, -5, 6, 0.35), (49, -19, 2.5, 0.3), (10, 50, 10, 0.2), (-122, 47, 4, 0.25)]:
    arid -= blob(*b)
arid = np.clip(arid + 0.22 * (N1 - 0.5) + 0.08 * (N2 - 0.5), 0, 1)
cold = np.clip((alat - 55) / 15, 0, 1)

pal = lambda *c: np.array(c, np.float32) / 255.0
forest, green, savanna, dry, desert, tundra, snow = pal(36, 56, 34), pal(60, 80, 46), pal(104, 106, 66), pal(146, 128, 90), pal(184, 158, 116), pal(92, 92, 78), pal(228, 232, 236)
def ramp(x, stops):
    out = np.zeros(x.shape + (3,), np.float32)
    for i in range(len(stops) - 1):
        a, ca = stops[i]; b, cb = stops[i + 1]
        k = np.clip((x - a) / (b - a), 0, 1)[..., None]
        m = ((x >= a) & (x <= b))[..., None] if i < len(stops) - 2 else (x >= a)[..., None]
        out = np.where(m, ca * (1 - k) + cb * k, out)
    out = np.where((x < stops[0][0])[..., None], stops[0][1], out)
    return out
landc = ramp(arid, [(0.0, forest), (0.3, green), (0.5, savanna), (0.66, dry), (0.82, desert)])
landc = landc * (1 - cold[..., None] * 0.8) + tundra * cold[..., None] * 0.8
landc *= (0.86 + 0.28 * N2)[..., None]
landc = landc * (1 - ice[..., None]) + snow * ice[..., None]

# ocean colour by depth (muted: teal shelves → deep navy)
dn = np.clip(depth / 5000.0, 0, 1)
shelf, mid, deep = pal(44, 86, 100), pal(24, 56, 84), pal(13, 30, 52)
oc = np.where((dn < 0.08)[..., None], shelf * (1 - dn[..., None] / 0.08) + mid * (dn[..., None] / 0.08), mid * (1 - (dn[..., None] - 0.08) / 0.92) + deep * ((dn[..., None] - 0.08) / 0.92))
oc *= (0.94 + 0.12 * N1)[..., None]
lakec = pal(36, 70, 88)
is_land = (land > 0.5)
col = np.where(is_land[..., None], landc, oc)
col = np.where((lakes > 0.5)[..., None] & is_land[..., None], lakec, col)
# soft coast (a 1 px blend)
day = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8), 'RGB')

# ---------------------------------------------------------------------------------------------------- basin relief
relief = np.clip(0.55 * fbm((H, W), (10, 20), 5, 41) + 0.45 * fbm((H, W), (40, 80), 3, 43), 0, 1)

data = np.stack([land, afr_g, np.clip(depth / 6000.0, 0, 1), relief], -1)
data_im = Image.fromarray((np.clip(data, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')

# ---------------------------------------------------------------------------------------------------- clouds, lights
w2, h2 = 4096, 2048
lon2 = (np.arange(w2) + 0.5) / w2 * 360 - 180; lat2 = 90 - (np.arange(h2) + 0.5) / h2 * 180
L2, B2 = np.meshgrid(lon2, lat2)
al2 = np.abs(B2)
cover = 0.36 + 0.3 * np.exp(-((B2 - 6) / 6) ** 2) - 0.22 * np.exp(-((al2 - 24) / 8) ** 2) + 0.26 * np.exp(-((al2 - 52) / 11) ** 2)
# zonal streaks: noise stretched east–west
cn = 0.6 * fbm((h2, w2), (16, 14), 6, 71) + 0.4 * fbm((h2, w2), (48, 30), 4, 77)
warp = fbm((h2, w2), (8, 8), 3, 79)
cn = ndimage.map_coordinates(cn, [np.clip(np.arange(h2)[:, None] + (warp - 0.5) * 40, 0, h2 - 1) * np.ones((1, w2)), (np.arange(w2)[None, :] + (warp - 0.5) * 120) % w2], order=1)
cloud = np.clip((cn - (1 - cover)) / 0.22, 0, 1) ** 1.2
# Africa's own sky: keep the cloud thin there so the continent (and later the basin) reads
afr2 = np.asarray(Image.fromarray((afr_g > 0).astype(np.uint8) * 255).resize((w2, h2), Image.BILINEAR), np.float32) / 255
afr2 = ndimage.gaussian_filter(afr2, 12)
cloud *= 1 - 0.75 * np.clip(afr2 * 1.6, 0, 1)

places = load('ne_10m_populated_places_simple')
lights = np.zeros((h2, w2), np.float32); alights = np.zeros((h2, w2), np.float32)
yy, xx = np.mgrid[0:h2, 0:w2]
cities = []
for f in places:
    p = f['properties']; pop = p.get('pop_max') or 0
    if pop < 25000:
        continue
    x, y = xy(p['longitude'], p['latitude'], w2, h2)
    in_af = afr_g[min(H - 1, int(y * H / h2)), min(W - 1, int(x * W / w2))] > 0
    r = 0.8 + 3.0 * (pop / 1e7) ** 0.5
    x0, x1, y0, y1 = int(x - 3 * r) - 1, int(x + 3 * r) + 2, int(y - 3 * r) - 1, int(y + 3 * r) + 2
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(w2, x1), min(h2, y1)
    g = np.exp(-((xx[y0:y1, x0:x1] - x) ** 2 + (yy[y0:y1, x0:x1] - y) ** 2) / (2 * r * r)) * min(1.0, 0.18 + 0.8 * (pop / 3e6) ** 0.5)
    (alights if in_af else lights)[y0:y1, x0:x1] += g
    if in_af and pop > 2.5e6:
        cities.append([p['name'], round(p['longitude'], 2), round(p['latitude'], 2), int(pop)])
lights = np.clip(lights, 0, 1) ** 1.3; alights = np.clip(alights, 0, 1) ** 1.3
aux = np.stack([cloud, lights, alights], -1)
aux_im = Image.fromarray((np.clip(aux, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
cities.sort(key=lambda c: -c[3])


def uri(im, fmt, **kw):
    b = io.BytesIO(); im.save(b, fmt, **kw)
    print(fmt, im.size, '%.2f MB' % (len(b.getvalue()) / 1e6))
    return 'data:image/%s;base64,' % fmt.lower() + base64.b64encode(b.getvalue()).decode()


with open(OUT, 'w') as f:
    f.write('/* The planet\'s maps for "What if Africa suddenly disappeared?", baked by make-planet.py from Natural Earth\n'
            '   (public domain). Do not edit by hand. DAY: colour; DATA: R land, G Africa (distance from its coast),\n'
            '   B ocean depth, A basin relief; AUX: R clouds, G night lights, B Africa\'s night lights. */\n')
    f.write('window.AF_MAPS = {\n day: "%s",\n data: "%s",\n aux: "%s"\n};\n' % (uri(day, 'JPEG', quality=90), uri(data_im, 'PNG', optimize=True), uri(aux_im, 'PNG', optimize=True)))
    f.write('window.AF_CITIES = %s;\n' % json.dumps(cities[:24]))
day.resize((1024, 512)).save('/tmp/geo/preview_day.jpg')
Image.fromarray((afr_g * 255).astype(np.uint8)).resize((1024, 512)).save('/tmp/geo/preview_afr.png')
aux_im.resize((1024, 512)).save('/tmp/geo/preview_aux.png')
print('cities', cities[:12])
print('wrote', OUT, '%.1f MB' % (os.path.getsize(OUT) / 1e6))

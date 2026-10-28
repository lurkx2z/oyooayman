# Which planets are on the far side of the cut tonight (and where they are in the garden sky at 22:00 GMT). psi=250 is the cut's orientation (geom.py).
import ephem, math, numpy as np
D=math.radians
def v_latlon(lat,lon):
    la,lo=D(lat),D(lon); return np.array([math.cos(la)*math.cos(lo),math.cos(la)*math.sin(lo),math.sin(la)])
T='2026/10/28 22:00:00'
m=ephem.Moon(); m.compute(T, epoch=T)
ob=ephem.Observer(); ob.lon='0'; ob.lat='0'; ob.date=T; ob.epoch=ob.date
gst=float(ob.sidereal_time())
def ef(body):
    body.compute(T, epoch=T); return v_latlon(math.degrees(float(body.g_dec)), math.degrees(float(body.g_ra)-gst))
mvec=ef(ephem.Moon())
a=np.cross(mvec,[0,0,1]); a/=np.linalg.norm(a); b=np.cross(mvec,a)
psi=250.0
n=math.cos(D(psi))*a+math.sin(D(psi))*b
lon=ephem.Observer(); lon.lat='51.5'; lon.lon='-0.1'; lon.date=T
for B in [ephem.Sun,ephem.Mercury,ephem.Venus,ephem.Mars,ephem.Jupiter,ephem.Saturn,ephem.Uranus,ephem.Neptune]:
    b_=B(); v=ef(b_); d=v@n
    b2=B(); b2.compute(lon)
    print('%-8s %s  n.d=%+.3f  az %.0f alt %.0f mag %.1f'%(B.__name__,'KEPT' if d>0 else 'GONE',d,math.degrees(float(b2.az)),math.degrees(float(b2.alt)),b2.mag))

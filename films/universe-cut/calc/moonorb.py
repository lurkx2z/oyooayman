import ephem, math, numpy as np
GM_E=3.986004e14; GM_M=4.9048695e12
def geo(t):
    m=ephem.Moon(); m.compute(t, epoch=t)
    r=m.earth_distance*149597870.7e3
    ra,dec=float(m.g_ra),float(m.g_dec)
    return r*np.array([math.cos(dec)*math.cos(ra),math.cos(dec)*math.sin(ra),math.sin(dec)])
t0=ephem.Date('2026/10/28 22:00:00'); dt=60/86400
r=geo(t0); v=(geo(t0+dt)-geo(t0-dt))/(120)
print('r %.0f km  v %.1f m/s'%(np.linalg.norm(r)/1e3,np.linalg.norm(v)))
E_before=0.5*v@v-(GM_E+GM_M)/np.linalg.norm(r)
print('specific orbital energy before %.3e'%E_before)
# n in equatorial (inertial) frame: rotate Earth-fixed n by GST
exec(open('geom.py').read().split("for psi in np.arange")[0])
psi=250.0; n=math.cos(D(psi))*a+math.sin(D(psi))*b
gs=gst
Rz=np.array([[math.cos(gs),-math.sin(gs),0],[math.sin(gs),math.cos(gs),0],[0,0,1]])
nI=Rz@n
# half-earth CoM offset along +n: 2160 km scaled; velocity from spin
dE=2.16e6*0.9708**0 ; w=7.2921e-5
vE=np.cross([0,0,w],dE*nI)
dMo=0.36*1.7374e6*0.98   # moon half CoM offset (nearly uniform Moon: 3/8 R)
wM=2*math.pi/(27.32*86400)
vMo=np.cross([0,0,wM],dMo*nI)  # approx moon spin axis ~ ecliptic pole; tiny anyway
rr=r+dMo*nI-dE*nI; vv=v+vMo-vE
E_after=0.5*vv@vv-(GM_E/2+GM_M/2)/np.linalg.norm(rr)
vesc=math.sqrt(2*(GM_E/2+GM_M/2)/np.linalg.norm(rr))
print('half-Earth CoM spin velocity %.0f m/s'%np.linalg.norm(vE))
print('after: rel speed %.1f m/s, escape speed %.1f m/s, energy %.3e -> %s'%(np.linalg.norm(vv),vesc,E_after,'UNBOUND' if E_after>0 else 'bound'))
# without the spin term
vv2=v; rr2=r
print('ignoring spin: speed %.1f vs esc %.1f'%(np.linalg.norm(vv2),math.sqrt(2*(GM_E/2+GM_M/2)/np.linalg.norm(rr2))))

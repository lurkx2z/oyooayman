# The new Earth's orbit: the kept half's centre of mass moves with the spin it had (omega x r_cm), which nudges its path round the Sun.
import ephem, math, numpy as np
n=np.array([-0.464399,-0.291896,0.83614])
# hemisphere CM with PREM-like density: approximate using two-layer (core 10.9 g/cc r<3480, mantle 4.45)
R=6371.0
def hemi_cm(layers):
    # layers: list of (r_in, r_out, rho); uniform half-shell CM z = 3/8 (r2^4-r1^4)/(r2^3-r1^3)
    M=0; Mz=0
    for r1,r2,rho in layers:
        m=rho*(2/3)*math.pi*(r2**3-r1**3); z=3/8*(r2**4-r1**4)/(r2**3-r1**3); M+=m; Mz+=m*z
    return Mz/M
zc=hemi_cm([(0,1221,12.9),(1221,3480,10.9),(3480,5701,5.0),(5701,6371,3.6)])
print('half-Earth CM from centre: %.0f km (uniform: %.0f)'%(zc,3/8*R))
w=7.2921e-5
v_spin=np.cross([0,0,w],n*zc)   # km/s
print('CM velocity from spin:',v_spin, np.linalg.norm(v_spin))
T='2026/10/28 22:00:00'
s=ephem.Sun(); s.compute(T, epoch=T)
# heliocentric earth position: -sun geocentric (equatorial, of date)
ra,dec=float(s.ra),float(s.dec); r=s.earth_distance
sv=np.array([math.cos(dec)*math.cos(ra),math.cos(dec)*math.sin(ra),math.sin(dec)])
E=-sv*r
# earth velocity: numerically
def epos(t):
    s=ephem.Sun(); s.compute(t, epoch=T); ra,dec=float(s.ra),float(s.dec); r=s.earth_distance
    return -np.array([math.cos(dec)*math.cos(ra),math.cos(dec)*math.sin(ra),math.sin(dec)])*r
dt=1/24
V=(epos(ephem.Date(ephem.Date(T)+dt))-epos(ephem.Date(ephem.Date(T)-dt)))/(2*dt)  # AU/day
AU=1.495978707e8; V=V*AU/86400; rr=np.linalg.norm(E)*AU
print('Earth v %.3f km/s r %.4f AU'%(np.linalg.norm(V),np.linalg.norm(E)))
GM=1.32712440018e11
def a_of(v,r): return 1/(2/r-v*v/GM)
a0=a_of(np.linalg.norm(V),rr); a1=a_of(np.linalg.norm(V+v_spin),rr)
print('a0 %.5f AU a1 %.5f AU  year change %.2f days'%(a0/AU,a1/AU,365.256*((a1/a0)**1.5-1)))

# P-wave first arrival from the cut face to a surface point phi degrees from it, by ray theory (replaces the grid
# search in travel.py, whose city look-up took the minimum over a +-30 km box and ran 5-7 s early).
# By mirror symmetry the fastest path from the face meets it square on, so it is half of the surface-to-surface ray
# between phi and its mirror image at -phi: T(phi) = the half time of the ray whose half distance is phi.
# Prints HV_ARR for physics.js (every 2 degrees, 0 to 90) and the cities.
import numpy as np, math

exec(open(__file__.replace('rays.py','travel.py')).read().split("h=10.0")[0])  # vp(r), R
# fine radial grid
r=np.linspace(1.0,R,400001); v=np.array([vp(x) for x in r]); eta=r/v
def half(p):
    # turning radius: largest r where eta<=p  (eta must exceed p above it)
    m=eta>p
    # find deepest point of the continuous region from surface where eta>p
    idx=np.where(~m)[0]
    k=idx[-1]+1 if len(idx) else 0
    rr=r[k:]; ee=eta[k:]
    s=np.sqrt(np.maximum(ee**2-p**2,1e-30))
    # integrate with substitution near turning point: use trapezoid on fine grid, add analytic tail
    dth=p/(rr*s); dt=ee**2/(rr*s)
    # drop first point singular; approximate tail with analytic sqrt behaviour
    D=np.trapezoid(dth[1:],rr[1:]); T=np.trapezoid(dt[1:],rr[1:])
    # tail correction: over first interval, integrand ~ A/sqrt(r-r0): integral = 2*f1*(dr)
    d1=rr[1]-rr[0]; D+=2*dth[1]*d1*0.5; T+=2*dt[1]*d1*0.5
    return math.degrees(D),T,rr[0]

def arrival(phi):
    if phi <= 0: return 0.0
    ps=np.linspace(150,R/5.8*0.9999,2500); res=[half(p) for p in ps]
    Ds=np.array([x[0] for x in res]); Ts=np.array([x[1] for x in res]); c=[]
    for i in range(len(ps)-1):
        if (Ds[i]-phi)*(Ds[i+1]-phi)<=0:
            u=(phi-Ds[i])/(Ds[i+1]-Ds[i]); c.append(Ts[i]+u*(Ts[i+1]-Ts[i]))
    return min(c) if c else None
# (beyond the core's shadow, about 50 degrees, no direct P ray: there the old grid table, shifted to join on)
OLD=[0, 23.4, 50.6, 77.8, 105.1, 129.7, 150.8, 169.4, 186.5, 205.1, 221.6, 237.9, 254.1, 268.8, 283.8, 297.9, 311.0, 324.4, 336.3, 348.6,
  359.4, 370.0, 379.8, 389.4, 398.5, 407.8, 416.8, 425.2, 435.3, 444.6, 453.3, 462.6, 471.2, 480.9, 488.8, 497.7, 507.5, 515.5, 524.3, 533.0, 541.5, 550.8, 558.5, 567.2, 575.9, 585.3]
tab=[]; off=0.0
for i, phi in enumerate(range(0, 92, 2)):
    a = arrival(phi) if phi <= 48 else None
    if a is None: a = OLD[i] + off
    else: off = a - OLD[i]
    tab.append(a)
print('HV_ARR = [' + ', '.join('%.1f' % x for x in tab) + ']')

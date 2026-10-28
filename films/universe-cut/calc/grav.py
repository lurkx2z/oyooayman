import numpy as np
# PREM-ish density (kg/m^3) by radius (km)
def rho(r):
    x=r/6371.0
    if r<1221.5: return 13088.5-8838.1*x*x
    if r<3480: return 12581.5-1263.8*x-3642.6*x*x-5528.1*x**3
    if r<5701: return 7956.8-6476.1*x+5528.3*x*x-3080.7*x**3  # approx lower mantle
    if r<5971: return 11249.4-8029.8*x  # rough
    if r<6346.6: return 4400.0
    return 2900.0
G=6.674e-11
R=6371e3
# discretize half sphere z>0 (kept); grid
N=120
xs=np.linspace(-R,R,N); dx=xs[1]-xs[0]
X,Y,Z=np.meshgrid(xs,xs,xs,indexing='ij')
Rr=np.sqrt(X**2+Y**2+Z**2)
vr=np.vectorize(rho)
D=vr(Rr/1000.0)
D[Rr>R]=0
Mfull=D.sum()*dx**3
mask=(Z>0)
Dh=np.where(mask,D,0.0)
Dh[np.abs(Z)<1e-6]=0
# include half-weight at z==0? xs symmetric even N -> no zero plane
M=Dh.sum()*dx**3
zc=(Dh*Z).sum()*dx**3/M
print('Mfull %.3e (true 5.972e24) Mhalf %.3e  CoM offset %.0f km'%(Mfull,M,zc/1000))
pts=np.argwhere(Dh>0)
m=Dh[Dh>0]*dx**3
P=np.stack([X[Dh>0],Y[Dh>0],Z[Dh>0]],1)
def g_at(p):
    d=P-p; r=np.sqrt((d**2).sum(1))+1e-3
    return G*(m[:,None]*d/(r**3)[:,None]).sum(0)
g0=G*Mfull/R**2
print('g0 %.2f'%g0)
for lat in [90,80,70,60,50,40,30,25,20,15,10,5,1]:
    th=np.radians(lat)  # angle above the cut plane (phi)
    p=np.array([R*np.cos(th),0,R*np.sin(th)])*1.0005
    g=g_at(p)
    up=p/np.linalg.norm(p)
    gn=-g.dot(up); gt=g - (g.dot(up))*up
    tilt=np.degrees(np.arctan2(np.linalg.norm(gt),gn))
    # direction of gt: toward +z (pole) along surface?
    sgn=np.sign(gt[2]) if lat<90 else 0
    print('phi %4.0f  |g| %.2f  gn %.2f  gt %.2f  tilt %5.1f deg  toward pole %d  weight %.0f%%'%(lat,np.linalg.norm(g),gn,np.linalg.norm(gt),tilt,sgn,100*np.linalg.norm(g)/g0))

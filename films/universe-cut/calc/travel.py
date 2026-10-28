# P-wave first arrival from the cut face (plane z=0, the vanished side z<0) to a surface point at angle phi above it.
# 2-D in the plane containing the point and the face normal (that plane holds the fastest path by symmetry).
import numpy as np, heapq, math
R=6371.0
def vp(r):  # PREM-ish P speed km/s
    x=r/R
    if r<1221.5: return 11.2622-6.3640*x*x
    if r<3480: return 11.0487-4.0362*x+4.8023*x*x-13.5732*x**3
    if r<3630: return 15.3891-5.3181*x+5.5242*x*x-2.5514*x**3
    if r<5600: return 24.952-40.4673*x+51.4832*x*x-26.6419*x**3
    if r<5701: return 29.2766-23.6027*x+5.5242*x*x-2.5514*x**3
    if r<5771: return 19.0957-9.8672*x
    if r<5971: return 39.7027-32.6166*x
    if r<6151: return 20.3926-12.2569*x
    if r<6346.6: return 4.1875+3.9382*x
    if r<6356: return 6.8
    return 5.8
h=10.0
xs=np.arange(-R,R+h,h); zs=np.arange(0,R+h,h)
NX,NZ=len(xs),len(zs)
inside=np.zeros((NX,NZ),bool); slow=np.zeros((NX,NZ))
for i,x in enumerate(xs):
    for j,z in enumerate(zs):
        r=math.hypot(x,z)
        if r<=R: inside[i,j]=True; slow[i,j]=1.0/vp(r)
T=np.full((NX,NZ),np.inf)
pq=[]
for i in range(NX):
    if inside[i,0]: T[i,0]=0; heapq.heappush(pq,(0.0,i,0))
nb=[(a,b) for a in range(-3,4) for b in range(-3,4) if (a,b)!=(0,0) and math.gcd(abs(a),abs(b))==1]
while pq:
    t,i,j=heapq.heappop(pq)
    if t>T[i,j]: continue
    for a,b in nb:
        ii,jj=i+a,j+b
        if 0<=ii<NX and 0<=jj<NZ and inside[ii,jj]:
            d=h*math.hypot(a,b); nt=t+d*0.5*(slow[i,j]+slow[ii,jj])
            if nt<T[ii,jj]: T[ii,jj]=nt; heapq.heappush(pq,(nt,ii,jj))
np.save('T.npy',T)
for phi in [5,10,15,19,20,20.17,21,25,30]:
    x=R*math.cos(math.radians(phi))-3; z=R*math.sin(math.radians(phi))-3
    i=int(round((x+R)/h)); j=int(round(z/h))
    # nearest inside cell
    best=min(((T[ii,jj],ii,jj) for ii in range(i-3,i+4) for jj in range(j-3,j+4) if 0<=ii<NX and 0<=jj<NZ and inside[ii,jj]))
    print('phi %5.2f  first P arrival %.0f s = %d:%02d'%(phi,best[0],best[0]//60,best[0]%60))

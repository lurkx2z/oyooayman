import numpy as np, math
exec(open('grav.py').read().split("G=6.674e-11")[0])
G=6.674e-11; R=6371e3
N=128; L=2*R
xs=(np.arange(N)+0.5)/N*L-R; dx=xs[1]-xs[0]
X,Y,Z=np.meshgrid(xs,xs,xs,indexing='ij'); Rr=np.sqrt(X**2+Y**2+Z**2)
D=np.vectorize(rho)(Rr/1000.0); D[Rr>R]=0
scale=5.972e24/(D.sum()*dx**3); D*=scale
def potential(Dm):
    M=2*N
    k=np.fft.fftfreq(M)*M*dx
    KX,KY,KZ=np.meshgrid(k,k,k,indexing='ij'); r=np.sqrt(KX**2+KY**2+KZ**2); r[0,0,0]=dx*0.6
    ker=-G/r*dx**3
    P=np.zeros((M,M,M)); P[:N,:N,:N]=Dm
    phi=np.real(np.fft.ifftn(np.fft.fftn(P)*np.fft.fftn(ker)))[:N,:N,:N]
    return phi
phi=potential(D); U=0.5*(D*phi).sum()*dx**3
print('full Earth U %.3e J (lit. ~ -2.49e32)'%U)
Dh=np.where(Z>0,D,0); phih=potential(Dh); Uh=0.5*(Dh*phih).sum()*dx**3
Mh=Dh.sum()*dx**3
Uball=U*0.5**(5/3)
rel=Uh-Uball
print('half M %.3e  U_hemi %.3e  U_ball %.3e  release %.3e J  per kg %.2e J/kg'%(Mh,Uh,Uball,rel,rel/Mh))
# escape speed from face centre and surface of hemisphere
i0=N//2
print('phi at face centre ~ %.2e J/kg -> v_esc %.1f km/s'%(phih[i0,i0,i0],math.sqrt(-2*phih[i0,i0,i0])/1000))
print('central pressure context, melting needs ~2e6 J/kg')
print('largest quake (1960 Chile) ~1e19 J seismic; ratio %.1e'%(rel/1e19))

import ephem, math, numpy as np
exec(open('geom.py').read().split("for psi in np.arange")[0])
psi=250.0
n=math.cos(D(psi))*a+math.sin(D(psi))*b
c=299792.458
# moon distance
m.compute('2026/10/28 22:00:00'); dM=m.earth_distance*149597870.7
print('Moon dist %.0f km, light %.3f s'%(dM,dM/c))
Rm=1737.4; RE=6371
Vk=V*(RE+0.002)
Mpos=mvec*dM
d=Vk@n
print('viewer dist from plane %.0f km'%d)
# Moon wipe: points on vanished half at depth delta below plane; last light time
for delta in [1737.4,1500,1000,500,100,1]:
    # point on the moon surface at depth delta on vanished side, nearest our line of sight approx: Q = M - delta n
    Q=Mpos-delta*n
    L=np.linalg.norm(Q-Vk)
    f=delta/(delta+d)
    print(' delta %6.0f km -> gone at %.3f s'%(delta,(1-f)*L/c))
# stars
for beta in [10,4,1,0.4,0.1,0.04]:
    print(' star %.2f deg beyond the line gone at %.4f s'%(beta,d/(c*math.sin(D(beta)))))
# Astra positions
for name,lon in [('Astra 28.2E',28.2),('Astra 19.2E',19.2),('Hot Bird 13E',13.0),('Eutelsat 9E',9),('Intelsat 1W',-1)]:
    p=v_latlon(0,lon)*42164
    print(name,'kept' if p@n>0 else 'GONE', '%.0f km'%(p@n))
# where is the sky boundary from London, and the moon
def azalt_(dv): return (math.degrees(math.atan2(dv@east,dv@north))%360, math.degrees(math.asin(np.clip(dv@up,-1,1))))
print('moon topocentric az/alt', azalt_((Mpos-Vk)/np.linalg.norm(Mpos-Vk)))
print('vanished-sky centre az/alt', azalt_(-n))
# moon cut: parallax offset of moon centre from the star line
off=math.degrees(math.asin(((Mpos-Vk)/np.linalg.norm(Mpos-Vk))@n))
print('moon centre is %.3f deg on the %s side of the star line; moon radius %.3f deg'%(abs(off),'kept' if off>0 else 'vanished',math.degrees(math.atan(Rm/np.linalg.norm(Mpos-Vk)))))
# nearest edge point to London
e=V-(V@n)*n; e/=np.linalg.norm(e); print('nearest edge point', latlon(e), 'arc km %.0f'%(RE*math.acos(V@e)))
# sun
print('sun az/alt',azalt_(svec),' sun angle from plane %.1f deg'%math.degrees(math.asin(svec@n)))
# geostationary arc

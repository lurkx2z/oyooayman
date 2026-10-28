import ephem, math, numpy as np
D=math.radians
def v_latlon(lat,lon): 
    la,lo=D(lat),D(lon); return np.array([math.cos(la)*math.cos(lo),math.cos(la)*math.sin(lo),math.sin(la)])
def latlon(v): v=v/np.linalg.norm(v); return math.degrees(math.asin(v[2])), math.degrees(math.atan2(v[1],v[0]))
# Earth-fixed frame (x: lon 0 on equator, z: north pole). Moon geocentric direction in Earth-fixed coords at 2026-10-28 22:00 UT
o=ephem.Observer(); o.date='2026/10/28 22:00:00'
gmst=float(o.sidereal_time()) if False else None
m=ephem.Moon(); m.compute('2026/10/28 22:00:00', epoch='2026/10/28 22:00:00')
ra,dec=float(m.g_ra),float(m.g_dec)
# Greenwich sidereal time
ob=ephem.Observer(); ob.lon='0'; ob.lat='0'; ob.date='2026/10/28 22:00:00'; ob.epoch=ob.date
gst=float(ob.sidereal_time())
lonM=math.degrees(ra-gst); latM=math.degrees(dec)
print('sub-lunar point lat %.2f lon %.2f'%(latM,((lonM+180)%360)-180))
mvec=v_latlon(latM,lonM)
s=ephem.Sun(); s.compute('2026/10/28 22:00:00', epoch='2026/10/28 22:00:00')
svec=v_latlon(math.degrees(float(s.g_dec)),math.degrees(float(s.g_ra)-gst))
V=v_latlon(51.5,-0.1)
# n perpendicular to mvec: basis
a=np.cross(mvec,[0,0,1]); a/=np.linalg.norm(a); b=np.cross(mvec,a)
def frame(lat,lon):
    up=v_latlon(lat,lon); north=np.array([-math.sin(D(lat))*math.cos(D(lon)),-math.sin(D(lat))*math.sin(D(lon)),math.cos(D(lat))]); east=np.cross(north,up); return up,north,east
up,north,east=frame(51.5,-0.1)
def azalt(d):
    return (math.degrees(math.atan2(d@east,d@north))%360, math.degrees(math.asin(np.clip(d@up,-1,1))))
for psi in np.arange(0,360,1.0):
    n=math.cos(D(psi))*a+math.sin(D(psi))*b
    phi=math.degrees(math.asin(n@V))
    if abs(phi-20)<0.5:
        Ae,_=azalt(-n)
        pole=latlon(n); 
        print('psi %5.1f phi %.2f edge az %.0f  kept-centre lat %.1f lon %.1f  sun kept %s (n.s=%.2f)'%(psi,phi,Ae,pole[0],pole[1],n@svec>0,n@svec))

psi=250.0
n=math.cos(D(psi))*a+math.sin(D(psi))*b
print('n (earth-fixed)',n, 'phi',math.degrees(math.asin(n@V)))
# edge circle points
u1=np.cross(n,[0,0,1.0]); u1/=np.linalg.norm(u1); u2=np.cross(n,u1)
pts=[latlon(math.cos(D(t))*u1+math.sin(D(t))*u2) for t in range(0,360,10)]
print('edge circle:', ' '.join('(%.0f,%.0f)'%p for p in pts))
places={'London':(51.5,-0.1),'Paris':(48.9,2.35),'Madrid':(40.4,-3.7),'Rome':(41.9,12.5),'Algiers':(36.75,3.05),'Tunis':(36.8,10.2),'Tripoli':(32.9,13.2),'Cairo':(30.05,31.2),'Casablanca':(33.6,-7.6),'Marrakesh':(31.6,-8.0),'Canary Is':(28.1,-15.4),'Lagos':(6.5,3.4),'Dakar':(14.7,-17.45),'Khartoum':(15.6,32.5),'Addis':(9.0,38.75),'Nairobi':(-1.3,36.8),'Jo-burg':(-26.2,28),'Riyadh':(24.7,46.7),'Dubai':(25.2,55.3),'Tehran':(35.7,51.4),'Karachi':(24.9,67),'Delhi':(28.6,77.2),'Mumbai':(19.1,72.9),'Kolkata':(22.6,88.4),'Chennai':(13.1,80.3),'Dhaka':(23.8,90.4),'Bangkok':(13.75,100.5),'Singapore':(1.3,103.8),'Jakarta':(-6.2,106.8),'Manila':(14.6,121),'Beijing':(39.9,116.4),'Shanghai':(31.2,121.5),'Tokyo':(35.7,139.7),'Sydney':(-33.9,151.2),'Perth':(-31.95,115.9),'Auckland':(-36.85,174.8),'Honolulu':(21.3,-157.8),'LA':(34.05,-118.2),'NYC':(40.7,-74),'Mexico City':(19.4,-99.1),'Bogota':(4.6,-74.1),'Lima':(-12,-77),'Sao Paulo':(-23.5,-46.6),'Buenos Aires':(-34.6,-58.4),'Santiago':(-33.45,-70.65),'Moscow':(55.75,37.6),'Istanbul':(41,29),'Athens':(38,23.7),'Reykjavik':(64.1,-21.9),'Miami':(25.8,-80.2),'Havana':(23.1,-82.4),'Panama':(9,-79.5),'Galapagos':(-0.9,-90.3),'South Pole':(-90,0),'North Pole':(90,0),'Mecca':(21.4,39.8),'Baghdad':(33.3,44.4),'Kabul':(34.5,69.2),'Lahore':(31.5,74.3),'Kathmandu':(27.7,85.3),'Colombo':(6.9,79.85),'Kinshasa':(-4.3,15.3),'Luanda':(-8.8,13.2),'Accra':(5.6,-0.2),'Abidjan':(5.35,-4),'Kano':(12,8.5),'Dar es Salaam':(-6.8,39.3),'Cape Town':(-33.9,18.4),'Malta':(35.9,14.5),'Sicily':(37.5,14.0),'Gibraltar':(36.1,-5.35),'Seville':(37.4,-6),'Lisbon':(38.7,-9.1),'Barcelona':(41.4,2.17),'Naples':(40.85,14.25),'Crete':(35.2,24.9),'Cyprus':(35,33),'Tel Aviv':(32.1,34.8),'Hawaii':(21.3,-157.8),'Fiji':(-17.7,178),'Tahiti':(-17.5,-149.5),'Easter Is':(-27.1,-109.4)}
for k,(la,lo) in places.items():
    d=v_latlon(la,lo)@n
    print('%-14s %s  %.0f km from cut plane, %4.1f deg'%(k,'KEPT ' if d>0 else 'GONE ',abs(d)*6371,math.degrees(math.asin(d))))

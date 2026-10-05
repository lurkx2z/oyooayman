/* =====================================================================
   LAYOUT — the street's dimensions (metres).  Camera looks down -Z.
   Right-hand traffic: vehicles heading -Z use the +X lanes.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0,         // avenue is 14 m wide (x = -7 … 7)
  curbH: 0.15,           // sidewalk height
  frontage: 12.5,        // building fronts at |x| = 12.5
  laneW: 3.5,

  // main avenue lanes  (dir = direction of travel along Z)
  lanes: {
    S1: { axis: 'z', x: 1.75, dir: -1 },   // heading away from camera
    S2: { axis: 'z', x: 5.25, dir: -1 },   // curb lane next to the viewer
    N1: { axis: 'z', x: -1.75, dir: 1 },   // heading toward camera
    N2: { axis: 'z', x: -5.25, dir: 1 },   // far curb lane (buses)
  },

  // cross street (runs along X)
  crossZ: -48,
  crossHalf: 7,
  crossLanes: {
    E1: { axis: 'x', z: -46.25, dir: 1 },
    E2: { axis: 'x', z: -42.75, dir: 1 },
    W1: { axis: 'x', z: -49.75, dir: -1 },
    W2: { axis: 'x', z: -53.25, dir: -1 },
  },

  // construction lot on the viewer's side
  lot: { x0: 12.5, x1: 32, z0: -35.5, z1: -13.5 },

  // grill cart
  cart: { x: 10.95, z: -9.0 },

  // bus stop across the street
  busStop: { x: -10.2, z: -21 },

  // café tables across the street
  cafe: { x: -10.9, z: -28.0 },

  // avenue extent
  zNear: 160,
  zFar: -1200,
};

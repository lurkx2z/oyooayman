/* =====================================================================
   AIR — the airliner on approach (the shared AircraftSystem, flying
   SCRIPT.aircraft). At 2 G its wings must make twice the lift to hold it up:
   at the same speed that means a much higher angle of attack. The crew pitch
   the nose up and go to full power, but it is still sinking: about 41 % more
   speed would be needed, and the approach doesn't have it.
   This subclass adds the nose-up attitude and a slight wing rock near the stall.
   ===================================================================== */

class GvAirliner extends AircraftSystem {
  constructor(scene) {
    super(scene);
    // nose attitude above the flight path (degrees): a normal approach (≈ 3°), then hauled up toward the stall
    this.pitch = new Track([[GV.plane[0] - 0.4, 5], [44.6, 8], [47.0, 12], [50.0, 15], [56, 16]], 'inOutSine');
  }
  update(t) {
    super.update(t);
    const g = this.group;
    g.visible = t >= this.t0 && t < this.t1;
    if (!g.visible) return;
    g.rotateX(MathX.deg(this.pitch.value(t)));
    g.rotateZ(MathX.deg(3.2) * Math.sin((t - 44) * 1.6) * MathX.smooth(t, 46, 48.5));
  }
}

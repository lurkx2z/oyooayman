/* =====================================================================
   DEV CONTROLS — play/pause, restart, scrub, time, FPS, mute, debug,
   recording mode, fullscreen, WAV export + keyboard shortcuts.
   ===================================================================== */

class DevControls {
  constructor(app) {
    this.app = app;
    const $ = (id) => document.getElementById(id);
    this.el = {
      play: $('bPlay'), restart: $('bRestart'), scrub: $('scrub'), time: $('time'), fps: $('fps'),
      mute: $('bMute'), debug: $('bDebug'), rec: $('bRec'), full: $('bFull'), wav: $('bWav'),
      markers: $('markers'), debugPanel: $('debug'), overlay: $('startOverlay'),
    };
    const E = this.el, tl = app.tl;
    E.scrub.max = String(tl.duration);
    for (const ev of tl.events) {
      const i = document.createElement('i');
      i.style.left = `${(ev.time / tl.duration) * 100}%`;
      i.title = `${ev.time.toFixed(2)}s  ${ev.label}`;
      E.markers.appendChild(i);
    }
    E.play.onclick = () => app.togglePlay();
    E.restart.onclick = () => app.restart();
    E.scrub.oninput = () => app.seek(parseFloat(E.scrub.value));
    E.mute.onclick = () => app.toggleMute();
    E.debug.onclick = () => this.toggleDebug();
    E.rec.onclick = () => app.setRecording(true);
    E.full.onclick = () => this.fullscreen();
    E.wav.onclick = () => app.audio.exportWav();
    E.overlay.onclick = () => { E.overlay.classList.add('hidden'); app.play(); };

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
      const k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); E.overlay.classList.add('hidden'); app.togglePlay(); }
      else if (k === 'r') { E.overlay.classList.add('hidden'); app.restart(); }
      else if (k === 'd') this.toggleDebug();
      else if (k === 'f') this.fullscreen();
      else if (k === 'm') app.toggleMute();
      else if (k === 'h') app.setRecording(!app.recording);
      else if (k === 'escape') app.setRecording(false);
      else if (k === 'arrowright') { e.preventDefault(); app.step(e.shiftKey ? 1 : 1 / CONFIG.fps); }
      else if (k === 'arrowleft') { e.preventDefault(); app.step(e.shiftKey ? -1 : -1 / CONFIG.fps); }
      else if (k === ']') app.jumpEvent(1);
      else if (k === '[') app.jumpEvent(-1);
    });
    this.buildDebug();
  }

  fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  toggleDebug() {
    this.el.debugPanel.classList.toggle('show');
    this.el.debug.classList.toggle('on', this.el.debugPanel.classList.contains('show'));
  }

  buildDebug() {
    const tl = this.app.tl, P = this.el.debugPanel;
    P.innerHTML = `<h3>Timeline events</h3><div id="evlist"></div>
      <h3 style="margin-top:10px">Info</h3><div id="dbginfo"></div>
      <h3 style="margin-top:10px">Keys</h3>
      <div><kbd>Space</kbd> play/pause · <kbd>R</kbd> restart · <kbd>D</kbd> debug<br><kbd>F</kbd> fullscreen · <kbd>M</kbd> mute · <kbd>H</kbd> recording mode<br><kbd>←</kbd>/<kbd>→</kbd> 1 frame (Shift = 1 s) · <kbd>[</kbd>/<kbd>]</kbd> prev/next event</div>`;
    const list = P.querySelector('#evlist');
    this.evEls = tl.events.map((ev) => {
      const d = document.createElement('div');
      d.className = 'ev';
      d.textContent = `${ev.time.toFixed(2).padStart(5)}s  ${ev.label}`;
      d.onclick = () => this.app.seek(ev.time);
      list.appendChild(d);
      return d;
    });
    this.info = P.querySelector('#dbginfo');
  }

  update(t, fps, info) {
    const E = this.el;
    if (document.activeElement !== E.scrub) E.scrub.value = t.toFixed(3);
    const m = Math.floor(t / 60), s = t - m * 60;
    E.time.textContent = `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')} · f${Math.round(t * CONFIG.fps)}`;
    E.fps.textContent = `${fps.toFixed(0)} fps`;
    E.play.textContent = this.app.playing ? '❚❚ PAUSE' : '▶ PLAY';
    E.play.classList.toggle('on', this.app.playing);
    E.mute.textContent = this.app.audio.muted ? '🔇 MUTED' : '🔊 SOUND';
    if (this.el.debugPanel.classList.contains('show')) {
      const cur = this.app.tl.currentEvent(t);
      this.evEls.forEach((d, i) => d.classList.toggle('cur', this.app.tl.events[i] === cur));
      this.info.innerHTML = info;
    }
  }
}

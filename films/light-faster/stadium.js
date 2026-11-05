/* (placeholder while the set is built) */
LF_SETS.stadium = (app) => { const S = lfSet(app, { sky: '#101418', fov: 50 }); lfBox(4, 3, 4, lfStd('#888'), 0, 1.5, -6); return { scene: S.scene, camera: S.camera, frame(t) { this._s = lfStoryAt(t); lfCam(S.camera, [0, 1.6, 0], [0, 1.5, -6], 50); }, labels() { return []; } }; };

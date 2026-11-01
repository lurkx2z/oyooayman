/* Writes sound/cues.json: the film's event times (T), shots (from shots.js) and the voice clips (timing.js), for mix.py. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.resolve(__dirname, '..');
const ctx = { window: {}, Math, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(D, 'timing.js'), 'utf8'), ctx);
vm.runInContext('var KET = window.KET;', ctx);
const core = fs.readFileSync(path.join(D, 'core.js'), 'utf8');
vm.runInContext(core.slice(0, core.indexOf('const SERIF')).replace(/^const /gm, 'var '), ctx);
const shots = fs.readFileSync(path.join(D, 'shots.js'), 'utf8');
vm.runInContext(shots.slice(0, shots.indexOf('const shotAt')).replace(/^const /gm, 'var '), ctx);
const out = { T: ctx.T, shots: ctx.SHOTS, clips: ctx.KET.clips, duration: ctx.KET.duration };
fs.writeFileSync(path.join(__dirname, 'cues.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(ctx.T)); console.log(ctx.SHOTS.map((s) => s.id + '@' + s.t0.toFixed(2)).join(' '));

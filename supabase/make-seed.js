// Builds supabase/backup/seed-cards.sql from the backup of the old CHICHA TCG data.
// Usage (in the game folder):  node supabase/make-seed.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'backup');
const d = JSON.parse(fs.readFileSync(path.join(dir, 'game.json')))[0].data;

const q = v => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v, def) => (v === '' || v == null || isNaN(+v)) ? def : +v;
// keep only the file name of a storage URL; embedded videos were saved as <id>-a.<ext> / <id>-b.<ext>
const files = fs.readdirSync(path.join(dir, 'cards'));
function fileOf(v, id, side) {
  if (!v) return null;
  if (v.startsWith('data:')) return files.find(f => f.startsWith(`${id}-${side}.`)) || null;
  const m = v.match(/\/object\/public\/cards\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : v;
}

const series = d.series || [];
const backs = d.back || {};
const lines = ['-- Generated from the CHICHA TCG backup. Run after schema.sql (SQL Editor -> paste -> Run).', 'begin;'];
for (const s of series) {
  lines.push(`insert into public.series (id, code, name, color1, color2, back_image) values (${q(s.id)}, ${q(s.code || '')}, ${q(s.n || s.id)}, ${q(s.c1 || '#ff2e88')}, ${q(s.c2 || '#ffe600')}, ${q(fileOf(backs[s.id], s.id, 'back'))}) on conflict (id) do update set code = excluded.code, name = excluded.name, color1 = excluded.color1, color2 = excluded.color2, back_image = excluded.back_image;`);
}
const RAR = 'CUHRXEPNILMSK'.split(''), TYPES = ['feu', 'eau', 'nature', 'foudre', 'psy', 'ombre'];
let n = 0;
(d.cards || []).forEach((c, i) => {
  if (!c.id || !c.n) return;
  const vals = [
    q(c.id), q(series.some(s => s.id === c.s) ? c.s : null), q(c.n), q(RAR.includes(c.r) ? c.r : 'C'), q(TYPES.includes(c.t) ? c.t : 'feu'),
    num(c.pv, 0), q(c.an || ''), num(c.a, 0), q(c.f || ''),
    q(fileOf(c.img, c.id, 'a')), q(fileOf(c.img2, c.id, 'b')),
    num(c.fx, 50), num(c.fy, 50), num(c.fz, 1) || 1, num(c.lim, 0), q(c.n2 || ''), c.duo ? 'true' : 'false', i
  ];
  lines.push(`insert into public.cards (id, series_id, name, rarity, type, hp, attack_name, attack, description, image, image2, frame_x, frame_y, frame_zoom, card_limit, name2, duo, sort) values (${vals.join(', ')}) on conflict (id) do update set series_id = excluded.series_id, name = excluded.name, rarity = excluded.rarity, type = excluded.type, hp = excluded.hp, attack_name = excluded.attack_name, attack = excluded.attack, description = excluded.description, image = excluded.image, image2 = excluded.image2, frame_x = excluded.frame_x, frame_y = excluded.frame_y, frame_zoom = excluded.frame_zoom, card_limit = excluded.card_limit, name2 = excluded.name2, duo = excluded.duo, sort = excluded.sort;`);
  n++;
});
lines.push('commit;');
fs.writeFileSync(path.join(dir, 'seed-cards.sql'), lines.join('\n') + '\n');
console.log(`seed-cards.sql: ${series.length} series, ${n} cards`);

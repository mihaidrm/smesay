// Static renderer for a .dc.html board: evaluates {{holes}}, <sc-if>, <sc-for> against renderVals() in a given state.
const fs = require('fs');
function load(file) {
  const src = fs.readFileSync(file, 'utf8');
  const js = src.match(/data-dc-script[^>]*>\n([\s\S]*?)\n<\/script>/)[1];
  class DCLogic { constructor() { this.props = {}; } setState(p) { Object.assign(this.state, p); } }
  const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  const body = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const helmet = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || ['', ''])[1];
  const tpl = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  return { Component, tpl, helmet };
}
function lookup(scope, path) {
  path = path.trim();
  if (path === 'true') return true; if (path === 'false') return false;
  let cur = scope; for (const k of path.split('.')) { if (cur == null) return undefined; cur = cur[k]; }
  return cur;
}
function findBlock(html, tag, from) {
  const open = new RegExp('<' + tag + '\\b[^>]*>', 'g'); open.lastIndex = from;
  const m = open.exec(html); if (!m) return null;
  let depth = 1, i = m.index + m[0].length; const re = new RegExp('<' + tag + '\\b[^>]*>|</' + tag + '>', 'g'); re.lastIndex = i; let mm;
  while ((mm = re.exec(html))) { if (mm[0].startsWith('</')) depth--; else depth++; if (depth === 0) return { start: m.index, openTag: m[0], inner: html.slice(i, mm.index), end: mm.index + mm[0].length }; }
  return null;
}
function render(html, scope) {
  // process the first sc-for or sc-if block found, recursively
  for (;;) {
    const f = findBlock(html, 'sc-for', 0), i = findBlock(html, 'sc-if', 0);
    let b = null, kind = null;
    if (f && (!i || f.start < i.start)) { b = f; kind = 'for'; } else if (i) { b = i; kind = 'if'; }
    if (!b) break;
    let out = '';
    if (kind === 'for') {
      const list = lookup(scope, b.openTag.match(/list="\{\{([^}]*)\}\}"/)[1]) || [];
      const as = b.openTag.match(/as="([^"]*)"/)[1];
      out = list.map((item, idx) => render(b.inner, Object.assign({}, scope, { [as]: item, $index: idx }))).join('');
    } else {
      const v = lookup(scope, b.openTag.match(/value="\{\{([^}]*)\}\}"/)[1]);
      out = v ? render(b.inner, scope) : '';
    }
    html = html.slice(0, b.start) + out + html.slice(b.end);
  }
  // attributes bound to booleans/functions
  html = html.replace(/\s(disabled|checked)="\{\{([^}]*)\}\}"/g, (m, a, p) => lookup(scope, p) ? ' ' + a : '');
  html = html.replace(/\s(onClick|onChange)="\{\{[^}]*\}\}"/g, '');
  html = html.replace(/\svalue="\{\{([^}]*)\}\}"/g, (m, p) => ' value="' + String(lookup(scope, p) ?? '') + '"');
  html = html.replace(/\{\{([^}]*)\}\}/g, (m, p) => { const v = lookup(scope, p); return typeof v === 'function' ? '' : (v == null ? '' : String(v)); });
  return html;
}
module.exports = { load, render };
if (require.main === module) {
  const [file, outFile, script] = process.argv.slice(2);
  const { Component, tpl, helmet } = load(file);
  const c = new Component(); const ev = (v) => ({ target: { value: v, checked: v } });
  // the script drives the component into the wanted state, e.g. "r=c.renderVals();r.setName(ev('Dana'));..."
  let r = c.renderVals(); eval(script || '');
  r = c.renderVals();
  const page = '<!doctype html><html><head><meta charset="utf-8">' + helmet.replace(/<helmet>|<\/helmet>/g, '') + '</head><body>' + render(tpl, r) + '</body></html>';
  fs.writeFileSync(outFile, page);
  console.log('rendered', outFile, 'screen:', ['isAbout', 'isArea', 'isWrap', 'isDone', 'isClosed', 'isRevoked'].filter(k => r[k]).join(','));
}

# Writes docs/design-notes/prototype-01/GoldenSet.dc.html, a canvas board that shows each golden
# spec as received and what the Shape step must produce from it. Reads evals/specs and
# evals/expected; rerun after golden-generator.py. Python 3.12 or later.
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT.parent / 'docs' / 'design-notes' / 'prototype-01' / 'GoldenSet.dc.html'

specs = []
for exp_path in sorted((ROOT / 'expected').glob('*.json')):
    e = json.loads(exp_path.read_text())
    md = (ROOT / e['source']).read_text()
    doc = md.split('```text\n', 1)[1].split('\n```', 1)[0]
    fmt = re.search(r'^Format: (.*)$', md, re.M).group(1)
    specs.append(dict(id=e['id'], domain=e['domain'], format=fmt, doc=doc, context=e['context'], item_count=e['item_count'],
                      areas=e['areas'], items=e['items'], must_not_invent=e['must_not_invent'], notes=e['notes']))

DATA = json.dumps(specs, ensure_ascii=False)

html = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Golden set</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;font-family:'Geist','Segoe UI',system-ui,sans-serif;background:#FFFFFF;color:#16181C}
button{font:inherit;color:inherit;cursor:pointer}
button:focus-visible{outline:2px solid #0E6B63;outline-offset:2px}
.mono{font-family:'Geist Mono',monospace}
</style>
</helmet>
<div style="width: 1440px; height: 1000px; box-sizing: border-box; background: #FFFFFF; color: #16181C; display: flex; font-size: 14px; line-height: 1.45; overflow: hidden">

<div style="width: 300px; flex-shrink: 0; box-sizing: border-box; background: #F6F6F4; border-right: 1px solid #E3E1DC; padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto">
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="font-size: 18px; font-weight: 500; letter-spacing: -0.02em">Golden set</div>
<div style="font-size: 13px; color: #5B6069">Ten messy lists from invented domains and what the Shape step must make of each. Source: evals/ in the repository.</div>
</div>
<div style="display: flex; flex-direction: column; gap: 4px">
<sc-for list="{{specs}}" as="sp" hint-placeholder-count="10">
<button type="button" onClick="{{sp.pick}}" aria-pressed="{{sp.active}}" style="text-align: left; padding: 8px 10px; border-radius: 6px; border: 1px solid {{sp.bd}}; background: {{sp.bg}}; display: flex; flex-direction: column; gap: 2px">
<span style="display: flex; gap: 8px; align-items: baseline"><span class="mono" style="font-size: 11px; color: #5B6069">{{sp.id}}</span><span style="font-weight: 500">{{sp.domain}}</span></span>
<span style="font-size: 12px; color: #5B6069">{{sp.meta}}</span>
</button>
</sc-for>
</div>
<div style="margin-top: auto; font-size: 12px; color: #5B6069">Totals: {{totals}}. Two specs carry a project context block (decision 0011). The E4 runner scores items found, missed, invented and wording that changed meaning (evals/README.md).</div>
</div>

<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column">
<div style="flex-shrink: 0; padding: 18px 28px 14px 28px; border-bottom: 1px solid #E3E1DC; display: flex; flex-direction: column; gap: 6px">
<div style="display: flex; align-items: baseline; gap: 12px"><span class="mono" style="font-size: 12px; color: #5B6069">Spec {{cur.id}}</span><h1 style="margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -0.02em">{{cur.domain}}</h1></div>
<div style="font-size: 13px; color: #5B6069">{{cur.format}}</div>
<sc-if value="{{hasContext}}" hint-placeholder-val="{{false}}">
<div style="display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 6px; background: #E3F1EF; font-size: 13px">
<div><span style="font-weight: 500">Project context given to the AI.</span> {{ctx.goal}} {{ctx.audience}}</div>
<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center"><span style="color: #454A52">Terms to keep as written:</span>
<sc-for list="{{ctx.terms}}" as="t" hint-placeholder-count="5"><span class="mono" style="padding: 1px 8px; border-radius: 999px; background: #FFFFFF; border: 1px solid #7FD1C6; font-size: 12px">{{t.term}}</span></sc-for>
</div>
</div>
</sc-if>
</div>

<div style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: 480px minmax(0, 1fr)">
<div style="min-height: 0; display: flex; flex-direction: column; border-right: 1px solid #E3E1DC">
<div style="flex-shrink: 0; padding: 10px 20px; font-size: 12px; font-weight: 500; color: #5B6069; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #F0EFEB">As received</div>
<pre class="mono" style="margin: 0; flex-grow: 1; min-height: 0; overflow: auto; padding: 16px 20px; font-size: 12px; line-height: 1.5; white-space: pre-wrap; background: #FAFAF9; color: #16181C">{{cur.doc}}</pre>
</div>
<div style="min-height: 0; display: flex; flex-direction: column">
<div style="flex-shrink: 0; padding: 10px 20px; font-size: 12px; font-weight: 500; color: #5B6069; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #F0EFEB; display: flex; justify-content: space-between"><span>Expected after Shape</span><span>{{cur.count}}</span></div>
<div style="flex-grow: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px">
<sc-for list="{{areas}}" as="ar" hint-placeholder-count="4">
<div style="border: 1px solid #E3E1DC; border-radius: 6px">
<div style="display: flex; align-items: baseline; gap: 10px; padding: 8px 14px; background: #F6F6F4; border-bottom: 1px solid #E3E1DC; border-radius: 6px 6px 0 0"><span style="font-weight: 500">{{ar.name}}</span><span style="font-size: 12px; color: #5B6069">{{ar.aliases}}</span></div>
<sc-for list="{{ar.items}}" as="it" hint-placeholder-count="3">
<div style="display: flex; gap: 12px; padding: 8px 14px; border-bottom: 1px solid #F0EFEB; font-size: 13px">
<span class="mono" style="width: 52px; flex-shrink: 0; font-size: 11px; color: #5B6069; padding-top: 3px">{{it.ref}}</span>
<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px">
<div>{{it.meaning}}</div>
<div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center">
<sc-for list="{{it.keep}}" as="k" hint-placeholder-count="2"><span class="mono" style="padding: 0 6px; border-radius: 999px; border: 1px solid #C9C7C1; font-size: 11px; color: #454A52">{{k.t}}</span></sc-for>
<sc-for list="{{it.flags}}" as="f" hint-placeholder-count="1"><span style="padding: 0 8px; border-radius: 999px; background: {{f.bg}}; color: {{f.fg}}; font-size: 11px; font-weight: 500">{{f.label}}</span></sc-for>
</div>
</div>
</div>
</sc-for>
</div>
</sc-for>
<div style="border: 1px solid #E3E1DC; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; font-size: 13px">
<div style="font-weight: 500">Must not invent</div>
<div style="display: flex; flex-wrap: wrap; gap: 6px">
<sc-for list="{{mni}}" as="m" hint-placeholder-count="4"><span style="padding: 2px 10px; border-radius: 999px; background: #F0F0EE; color: #454A52; font-size: 12px">{{m.t}}</span></sc-for>
</div>
</div>
<div style="font-size: 13px; color: #454A52; padding: 0 2px 8px 2px"><span style="font-weight: 500; color: #16181C">What makes it hard.</span> {{cur.notes}}</div>
</div>
</div>
</div>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1000}}'>
class Component extends DCLogic {
state = { spec: '01' };
data() { return __DATA__; }
renderVals() {
const s = this.state;
const all = this.data();
const cur = all.find((x) => x.id === s.spec) || all[0];
const specs = all.map((x) => ({
id: x.id, domain: x.domain, meta: x.item_count + ' items, ' + x.areas.length + ' areas' + (x.context ? ', with context' : ''),
active: x.id === cur.id, bg: x.id === cur.id ? '#FFFFFF' : 'transparent', bd: x.id === cur.id ? '#E3E1DC' : 'transparent',
pick: () => this.setState({ spec: x.id })
}));
const byRef = {};
cur.items.forEach((it) => { byRef[it.ref] = it; });
const FLAG = {
proposed: { bg: '#FFFFFF', fg: '#16181C' }, ambiguous: { bg: '#EEE8FA', fg: '#4C2F94' }, duplicate: { bg: '#F0F0EE', fg: '#454A52' }
};
const areas = cur.areas.map((ar) => ({
name: ar.name, aliases: ar.aliases.length ? 'also accepted: ' + ar.aliases.join(', ') : '',
items: ar.items.map((ref) => {
const it = byRef[ref];
const flags = [];
if (it.proposed) flags.push({ label: 'proposed ' + it.proposed, bg: '#FFFFFF', fg: '#16181C' });
if (it.ambiguous) flags.push({ label: 'ambiguity flag expected', bg: FLAG.ambiguous.bg, fg: FLAG.ambiguous.fg });
if (it.duplicate_of) flags.push({ label: 'duplicate of ' + it.duplicate_of, bg: FLAG.duplicate.bg, fg: FLAG.duplicate.fg });
return { ref: it.ref, meaning: it.meaning, keep: it.must_keep.map((t) => ({ t: t })), flags: flags };
})
}));
const totalItems = all.reduce((n, x) => n + x.item_count, 0);
const totalAreas = all.reduce((n, x) => n + x.areas.length, 0);
return {
specs: specs,
cur: { id: cur.id, domain: cur.domain, format: cur.format, doc: cur.doc, notes: cur.notes, count: cur.item_count + ' items in ' + cur.areas.length + ' areas' },
hasContext: !!cur.context,
ctx: cur.context ? { goal: cur.context.goal, audience: cur.context.audience, terms: cur.context.glossary.map((t) => ({ term: t })) } : { goal: '', audience: '', terms: [] },
areas: areas,
mni: cur.must_not_invent.map((t) => ({ t: t })),
totals: totalItems + ' items, ' + totalAreas + ' areas in 10 specs'
};
}
}
</script>
</body>
</html>
'''
OUT.write_text(html.replace('__DATA__', DATA))
print('wrote', OUT, len(specs), 'specs')

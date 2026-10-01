import pathlib, sys
FONT = "<link href=\"https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500&amp;display=swap\" rel=\"stylesheet\">"
BTN = "min-height: 52px; border: 0; border-radius: 999px; font-weight: 500;"
def choice(label, hint, pre):
    return f'''<button type="button" onClick="{{{{v.{pre}Pick}}}}" aria-pressed="{{{{v.{pre}On}}}}" style="min-height: 52px; padding: 8px 16px; text-align: left; border: 1px solid {{{{v.{pre}Bd}}}}; border-radius: 12px; background: {{{{v.{pre}Bg}}}}; color: {{{{v.{pre}Fg}}}}; display: flex; flex-direction: column; gap: 2px">
<span style="font-weight: 500">{label}</span>
<span style="font-size: 14px; opacity: 0.8">{hint}</span>
</button>'''
def pill(pre):
    return f'<sc-if value="{{{{v.{pre}Show}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" onClick="{{{{v.{pre}Pick}}}}" aria-pressed="{{{{v.{pre}On}}}}" style="flex-grow: 1; min-height: 48px; border: 1px solid {{{{v.{pre}Bd}}}}; border-radius: 999px; background: {{{{v.{pre}Bg}}}}; color: {{{{v.{pre}Fg}}}}; font-size: 15px; font-weight: 500">{{{{v.{pre}Label}}}}</button></sc-if>'
TA = lambda id_, label, val, on: f'''<label for="{id_}" style="font-size: 15px; font-weight: 500">{label}</label>
<textarea id="{id_}" rows="3" value="{{{{{val}}}}}" onChange="{{{{{on}}}}}" style="box-sizing: border-box; padding: 12px 14px; border: 1px solid #C9C7C1; border-radius: 12px; background: #FFFFFF; resize: none"></textarea>'''
def footer(inner):
    return f'<div style="padding: 16px 20px; border-top: 1px solid #E3E1DC"><div class="col" style="display: flex; flex-direction: column; gap: 8px">{inner}</div></div>'
def scroll(inner, gap=16):
    return f'<div style="flex-grow: 1; overflow-y: auto; padding: 20px"><div class="col" style="display: flex; flex-direction: column; gap: {gap}px">{inner}</div></div>'
def notice(title, body, extra=''):
    return f'''<div style="flex-grow: 1; padding: 48px 20px 24px 20px"><div class="col" style="display: flex; flex-direction: column; gap: 16px">
<div style="width: 56px; height: 56px; border-radius: 999px; background: #F0F0EE; display: flex; align-items: center; justify-content: center"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#454A52" stroke-width="2" stroke-linecap="round"><path d="M12 8v5M12 16.5v.5"></path><circle cx="12" cy="12" r="9"></circle></svg></div>
<h1 style="margin: 0; font-size: 28px; font-weight: 400; line-height: 1.1">{title}</h1>
<div style="color: #454A52">{body}</div>{extra}
</div></div>'''

screens = f'''
<div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #E3E1DC">
<div style="display: flex; align-items: center; gap: 10px">
<div style="width: 28px; height: 28px; border-radius: 8px; background: #16181C; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600">M</div>
<div style="font-size: 15px; font-weight: 500">Marlow Group</div>
</div>
<div style="font-size: 13px; color: #5B6069">{{{{headerNote}}}}</div>
</div>

<sc-if value="{{{{isLanding}}}}" hint-placeholder-val="{{{{true}}}}">
{scroll('''<h1 style="margin: 0; font-size: 28px; font-weight: 400; line-height: 1.1; letter-spacing: -0.01em">New expense tool</h1>
<div style="color: #454A52">We are replacing the expense tool for all 400 staff. Below are six things we think it must do. Tell us where you agree and where you do not. It takes about five minutes.</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<label for="r-name" style="font-size: 15px; font-weight: 500">Your name</label>
<input id="r-name" type="text" value="{{name}}" onChange="{{setName}}" autocomplete="name" style="min-height: 48px; box-sizing: border-box; padding: 0 14px; border: 1px solid #C9C7C1; border-radius: 12px; background: #FFFFFF">
</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<label for="r-role" style="font-size: 15px; font-weight: 500">Your role</label>
<select id="r-role" value="{{role}}" onChange="{{setRole}}" style="min-height: 48px; box-sizing: border-box; padding: 0 14px; border: 1px solid #C9C7C1; border-radius: 12px; background: #FFFFFF">
<option value="">Choose a role</option>
<option value="Sales">Sales</option>
<option value="Finance">Finance</option>
<option value="Engineering manager">Engineering manager</option>
<option value="HR">HR</option>
</select>
</div>
<div style="font-size: 14px; color: #5B6069">Your answers go to the project team at Marlow Group. They are saved as you go, so you can close this page and come back. [PRIVACY NOTICE LINK]</div>''', 20)}
{footer('''<button type="button" onClick="{{start}}" disabled="{{startDisabled}}" style="''' + BTN + ''' background: #16181C; color: #FFFFFF; opacity: {{startOpacity}}">Start</button>
<sc-if value="{{startDisabled}}" hint-placeholder-val="{{false}}"><div style="font-size: 14px; color: #5B6069; text-align: center">Fill in your name and role to start.</div></sc-if>''')}
</sc-if>

<sc-if value="{{{{isResume}}}}" hint-placeholder-val="{{{{false}}}}">
{scroll('''<h1 style="margin: 0; font-size: 28px; font-weight: 400; line-height: 1.1; letter-spacing: -0.01em">Welcome back, Ioana</h1>
<div style="color: #454A52">This is your personal link for the new expense tool. You answered {{resumeCount}} of 6 items last time. Your answers are saved; carry on where you stopped.</div>
<div style="background: #F6F6F4; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 4px; font-size: 15px"><div><span style="color: #5B6069">Name</span> Ioana Marin</div><div><span style="color: #5B6069">Role</span> Sales</div><div style="color: #5B6069; font-size: 13px">Set by the project team. Not you? [CONTACT LINK]</div></div>''', 20)}
{footer('''<button type="button" onClick="{{resumeGo}}" style="''' + BTN + ''' background: #16181C; color: #FFFFFF">Continue</button>''')}
</sc-if>

<sc-if value="{{{{isItem}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="padding: 14px 20px 0 20px"><div class="col" style="display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; justify-content: space-between; font-size: 14px; color: #5B6069">
<div>{{{{headLeft}}}}</div>
<div style="font-family: 'Geist Mono', monospace">{{{{headRight}}}}</div>
</div>
<div style="height: 6px; border-radius: 999px; background: #ECEAE5; overflow: hidden">
<div style="height: 6px; border-radius: 999px; background: #16181C; width: {{{{progressWidth}}}}; transition: width 250ms ease-out"></div>
</div>
</div></div>
<div style="flex-grow: 1; overflow-y: auto; padding: 20px"><div class="col" style="display: flex; flex-direction: column; gap: 28px">
<sc-for list="{{{{visible}}}}" as="v" hint-placeholder-count="1">
<div style="display: flex; flex-direction: column; gap: 16px">
<div style="background: #F6F6F4; border: 1px solid #E3E1DC; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px">
<sc-if value="{{{{v.showArea}}}}" hint-placeholder-val="{{{{false}}}}"><div style="font-size: 13px; color: #5B6069">{{{{v.area}}}} · {{{{v.ref}}}}</div></sc-if>
<div style="font-size: 19px; line-height: 1.3">{{{{v.text}}}}</div>
<sc-if value="{{{{v.showProposed}}}}" hint-placeholder-val="{{{{true}}}}">
<div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5B6069">
<div>Proposed priority</div>
<div style="padding: 2px 10px; border-radius: 999px; background: #FFFFFF; border: 1px solid #C9C7C1; color: #16181C; font-weight: 500">{{{{v.proposedLabel}}}}</div>
</div>
</sc-if>
</div>
<sc-if value="{{{{v.showProposed}}}}" hint-placeholder-val="{{{{true}}}}">
<div style="display: flex; flex-direction: column; gap: 8px">
{choice('Agree', '{{v.agreeHint}}', 'ag')}
{choice('Change the priority', 'Pick another priority and say why', 'df')}
{choice('Disagree', 'Not needed, or wrong as written. Say why', 'dg')}
{choice('Unclear', 'I cannot answer without more detail', 'un')}
</div>
</sc-if>
<sc-if value="{{{{v.blind}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="display: flex; flex-direction: column; gap: 10px">
<div style="font-size: 15px; font-weight: 500">How important is this?</div>
<div style="display: flex; gap: 8px">{pill('p1')}{pill('p2')}{pill('p3')}{pill('p4')}</div>
<div style="display: flex; flex-direction: column; gap: 8px">
{choice('Disagree', 'Not needed, or wrong as written. Say why', 'dg')}
{choice('Unclear', 'I cannot answer without more detail', 'un')}
</div>
</div>
</sc-if>
<sc-if value="{{{{v.isDiff}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="display: flex; flex-direction: column; gap: 10px">
<div style="font-size: 15px; font-weight: 500">What should it be?</div>
<div style="display: flex; gap: 8px">{pill('o1')}{pill('o2')}{pill('o3')}</div>
{TA('r-reason-{{v.id}}', 'Why? The team reads every reason.', 'v.answerText', 'v.setText')}
</div>
</sc-if>
<sc-if value="{{{{v.isDisagree}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="display: flex; flex-direction: column; gap: 10px">
{TA('r-disagree-{{v.id}}', 'What should it say instead, or why is it not needed?', 'v.answerText', 'v.setText')}
</div>
</sc-if>
<sc-if value="{{{{v.isUnclear}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="display: flex; flex-direction: column; gap: 10px">
{TA('r-question-{{v.id}}', 'What would you need to know to answer?', 'v.answerText', 'v.setText')}
</div>
</sc-if>
<sc-if value="{{{{v.showNote}}}}" hint-placeholder-val="{{{{false}}}}"><div style="font-size: 14px; color: #5B6069">{{{{v.note}}}}</div></sc-if>
</div>
</sc-for>
</div></div>
{footer('''<div style="display: flex; gap: 10px">
<button type="button" onClick="{{back}}" style="min-height: 52px; padding: 0 22px; border: 1px solid #C9C7C1; border-radius: 999px; background: #FFFFFF; font-weight: 500">Back</button>
<button type="button" onClick="{{next}}" disabled="{{nextDisabled}}" style="flex-grow: 1; ''' + BTN + ''' background: #16181C; color: #FFFFFF; opacity: {{nextOpacity}}">{{nextLabel}}</button>
</div>
<div style="font-size: 14px; color: #5B6069; text-align: center">{{saveNote}}</div>''')}
</sc-if>

<sc-if value="{{{{isMissing}}}}" hint-placeholder-val="{{{{false}}}}">
{scroll('''<h1 style="margin: 0; font-size: 26px; font-weight: 400; line-height: 1.15">Is anything missing?</h1>
<div style="color: #454A52">If the list left out something the new system must do, add it here. Skip this if nothing comes to mind.</div>
<label for="r-missing" style="font-size: 15px; font-weight: 500">Missing item</label>
<textarea id="r-missing" rows="4" value="{{missingText}}" onChange="{{setMissing}}" style="box-sizing: border-box; padding: 12px 14px; border: 1px solid #C9C7C1; border-radius: 12px; background: #FFFFFF; resize: none"></textarea>''')}
{footer('''<div style="display: flex; gap: 10px">
<button type="button" onClick="{{backToItems}}" style="min-height: 52px; padding: 0 22px; border: 1px solid #C9C7C1; border-radius: 999px; background: #FFFFFF; font-weight: 500">Back</button>
<button type="button" onClick="{{toSummary}}" style="flex-grow: 1; ''' + BTN + ''' background: #16181C; color: #FFFFFF">{{missingNextLabel}}</button>
</div>''')}
</sc-if>

<sc-if value="{{{{isSummary}}}}" hint-placeholder-val="{{{{false}}}}">
{scroll('''<div style="display: flex; flex-direction: column; gap: 6px">
<h1 style="margin: 0; font-size: 26px; font-weight: 400; line-height: 1.15">Review your answers</h1>
<div style="color: #454A52; font-size: 15px">{{summaryLine}}</div>
</div>
<div style="display: flex; flex-direction: column; gap: 8px">
<sc-for list="{{rows}}" as="r" hint-placeholder-count="6">
<div style="border: 1px solid #E3E1DC; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px">
<div style="font-size: 15px">{{r.text}}</div>
<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
<div style="padding: 2px 10px; border-radius: 999px; background: {{r.bg}}; color: {{r.fg}}; font-size: 13px; font-weight: 500">{{r.status}}</div>
<button type="button" onClick="{{r.edit}}" style="min-height: 44px; padding: 0 12px; border: 0; background: transparent; color: #0E6B63; font-size: 15px; font-weight: 500">Change</button>
</div>
<sc-if value="{{r.hasDetail}}" hint-placeholder-val="{{false}}">
<div style="font-size: 14px; color: #454A52; background: #F6F6F4; border-radius: 8px; padding: 8px 10px">{{r.detail}}</div>
</sc-if>
</div>
</sc-for>
</div>
<sc-if value="{{hasMissing}}" hint-placeholder-val="{{false}}">
<div style="border: 1px solid #E3E1DC; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px">
<div style="align-self: flex-start; padding: 2px 10px; border-radius: 999px; background: #E3EEF9; color: #1F4F7A; font-size: 13px; font-weight: 500">You added</div>
<div style="font-size: 15px">{{missingText}}</div>
</div>
</sc-if>
<div style="display: flex; flex-direction: column; gap: 8px">
<div style="font-size: 15px; font-weight: 500">How confident are you in these answers?</div>
<div style="display: flex; gap: 8px">
<sc-for list="{{confidence}}" as="k" hint-placeholder-count="5">
<button type="button" onClick="{{k.pick}}" aria-pressed="{{k.active}}" aria-label="{{k.aria}}" style="flex-grow: 1; min-height: 48px; border: 1px solid {{k.bd}}; border-radius: 12px; background: {{k.bg}}; color: {{k.fg}}; font-family: 'Geist Mono', monospace">{{k.n}}</button>
</sc-for>
</div>
<div style="display: flex; justify-content: space-between; font-size: 13px; color: #5B6069"><div>Guessing</div><div>Certain</div></div>
</div>
<div style="display: flex; align-items: flex-start; gap: 12px; background: #F6F6F4; border-radius: 12px; padding: 14px">
<input id="r-sign" type="checkbox" checked="{{signed}}" onChange="{{toggleSigned}}" style="width: 24px; height: 24px; margin: 0; flex-shrink: 0; accent-color: #16181C">
<label for="r-sign" style="font-size: 15px">I confirm these answers reflect my view as of today.</label>
</div>''', 18)}
{footer('''<button type="button" onClick="{{submit}}" disabled="{{submitDisabled}}" style="''' + BTN + ''' background: #16181C; color: #FFFFFF; opacity: {{submitOpacity}}">Submit answers</button>
<sc-if value="{{submitDisabled}}" hint-placeholder-val="{{false}}"><div style="font-size: 14px; color: #5B6069; text-align: center">Pick a confidence level and tick the confirmation to submit.</div></sc-if>''')}
</sc-if>

<sc-if value="{{{{isDone}}}}" hint-placeholder-val="{{{{false}}}}">
<div style="flex-grow: 1; padding: 48px 20px 24px 20px"><div class="col" style="display: flex; flex-direction: column; gap: 16px">
<div style="width: 56px; height: 56px; border-radius: 999px; background: #E6F4EC; display: flex; align-items: center; justify-content: center">
<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#22643F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</div>
<h1 style="margin: 0; font-size: 28px; font-weight: 400; line-height: 1.1">Answers submitted</h1>
<div style="color: #454A52">Thank you, {{{{displayName}}}}. The project team can see your answers now.</div>
<div style="background: #F6F6F4; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px; font-size: 15px">
<div>{{{{summaryLine}}}}</div>
<div style="color: #5B6069; font-family: 'Geist Mono', monospace; font-size: 13px">{{{{submittedAt}}}}</div>
</div>
<div style="color: #5B6069; font-size: 15px">You can change your answers until 20 October 2026. Open the same link again.</div>
</div></div>
{footer('''<button type="button" onClick="{{reopen}}" style="width: 100%; min-height: 52px; border: 1px solid #C9C7C1; border-radius: 999px; background: #FFFFFF; font-weight: 500">Change my answers</button>''')}
</sc-if>

<sc-if value="{{{{isClosed}}}}" hint-placeholder-val="{{{{false}}}}">
{notice('This link closed on 20 October 2026', 'The project team at Marlow Group stopped collecting answers for the new expense tool. Nothing you sent is lost.', '<div style="background: #F6F6F4; border-radius: 12px; padding: 14px; font-size: 15px; display: flex; flex-direction: column; gap: 4px"><div>{{closedLine}}</div><div style="color: #5B6069">If you were still answering, contact the project team: [PM CONTACT]</div></div>')}
</sc-if>

<sc-if value="{{{{isRevoked}}}}" hint-placeholder-val="{{{{false}}}}">
{notice('This link is no longer active', 'The project team at Marlow Group withdrew it. If you were asked to answer, ask them for a new link.', '<div style="color: #5B6069; font-size: 15px">Nothing was saved from this visit.</div>')}
</sc-if>

<div style="border-top: 1px dashed #C9C7C1; background: #F6F6F4; padding: 6px 12px; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; font-size: 11px; color: #5B6069">
<span>Prototype:</span>
<button type="button" onClick="{{{{cycleLayout}}}}" style="border: 0; background: transparent; padding: 4px 0; font-size: 11px; color: #0E6B63; text-decoration: underline">Layout: {{{{layoutLabel}}}}</button>
<button type="button" onClick="{{{{toggleBlind}}}}" style="border: 0; background: transparent; padding: 4px 0; font-size: 11px; color: #0E6B63; text-decoration: underline">Proposed value: {{{{blindLabel}}}}</button>
<button type="button" onClick="{{{{cycleLink}}}}" style="border: 0; background: transparent; padding: 4px 0; font-size: 11px; color: #0E6B63; text-decoration: underline">Link: {{{{linkLabel}}}}</button>
</div>
'''

JS = r'''class Component extends DCLogic {
state = { screen: 'landing', idx: 0, name: '', role: '', answers: {}, missingText: '', confidence: 0, signed: false, submittedAt: '', layout: 'item', blind: false, link: 'open' };

items() {
return [
{ id: 'i1', ref: 'CL-01', area: 'Submitting', proposed: 'M', text: 'Photograph a receipt and the amount, date and merchant are filled in automatically.' },
{ id: 'i2', ref: 'CL-02', area: 'Submitting', proposed: 'S', text: 'Split one receipt across two projects or cost centres.' },
{ id: 'i3', ref: 'CL-03', area: 'Approving', proposed: 'M', text: 'Managers approve or reject from the email, without logging in.' },
{ id: 'i4', ref: 'CL-04', area: 'Approving', proposed: 'S', text: 'Expenses over the policy limit are flagged before they reach the approver.' },
{ id: 'i5', ref: 'CL-05', area: 'Paying', proposed: 'M', text: 'Approved expenses are paid with the next salary run.' },
{ id: 'i6', ref: 'CL-06', area: 'Paying', proposed: 'C', text: 'Employees can request a cash advance before a trip.' }
];
}

renderVals() {
const s = this.state;
const items = this.items();
const areas = ['Submitting', 'Approving', 'Paying'];
const LABEL = { M: 'Must have', S: 'Should have', C: 'Could have', W: "Won't have" };
const SHORT = { M: 'Must', S: 'Should', C: 'Could', W: "Won't" };
const on = { bg: '#16181C', fg: '#FFFFFF', bd: '#16181C' };
const off = { bg: '#FFFFFF', fg: '#16181C', bd: '#C9C7C1' };
const hasText = (x) => ((x && x.text) || '').trim().length > 0;
const complete = (x) => !!x && (x.kind === 'agree' || (x.kind === 'pick' && !!x.value) || (x.kind === 'diff' && !!x.value && hasText(x)) || (x.kind === 'disagree' && hasText(x)) || (x.kind === 'unclear' && hasText(x)));
const setAns = (id, next) => { const answers = Object.assign({}, s.answers); answers[id] = next; this.setState({ answers: answers }); };

const cur = items[s.idx];
let visible;
if (s.layout === 'area') visible = items.filter((x) => x.area === cur.area);
else if (s.layout === 'page') visible = items.slice();
else visible = [cur];

const view = visible.map((it) => {
const a = s.answers[it.id] || {};
const sty = (active) => (active ? on : off);
const v = { id: it.id, ref: it.ref, area: it.area, text: it.text, proposedLabel: LABEL[it.proposed], showProposed: !s.blind, blind: s.blind, showArea: s.layout !== 'item', agreeHint: LABEL[it.proposed] + ' is right' };
const kinds = { ag: 'agree', df: 'diff', dg: 'disagree', un: 'unclear' };
Object.keys(kinds).forEach((k) => {
const active = a.kind === kinds[k]; const st = sty(active);
v[k + 'On'] = active; v[k + 'Bg'] = st.bg; v[k + 'Fg'] = st.fg; v[k + 'Bd'] = st.bd;
v[k + 'Pick'] = () => setAns(it.id, active ? a : { kind: kinds[k], value: null, text: '' });
});
const opts = ['M', 'S', 'C', 'W'].filter((x) => !s.blind ? x !== it.proposed : true);
['o1', 'o2', 'o3'].forEach((k, i) => {
const val = opts[i]; const active = a.kind === 'diff' && a.value === val; const st = sty(active);
v[k + 'Show'] = !!val && !s.blind; v[k + 'Label'] = val ? SHORT[val] : ''; v[k + 'On'] = active; v[k + 'Bg'] = st.bg; v[k + 'Fg'] = st.fg; v[k + 'Bd'] = st.bd;
v[k + 'Pick'] = () => setAns(it.id, { kind: 'diff', value: val, text: a.text || '' });
});
['p1', 'p2', 'p3', 'p4'].forEach((k, i) => {
const val = ['M', 'S', 'C', 'W'][i]; const active = a.kind === 'pick' && a.value === val; const st = sty(active);
v[k + 'Show'] = s.blind; v[k + 'Label'] = SHORT[val]; v[k + 'On'] = active; v[k + 'Bg'] = st.bg; v[k + 'Fg'] = st.fg; v[k + 'Bd'] = st.bd;
v[k + 'Pick'] = () => setAns(it.id, { kind: 'pick', value: val, text: '' });
});
v.isDiff = a.kind === 'diff'; v.isDisagree = a.kind === 'disagree'; v.isUnclear = a.kind === 'unclear';
v.answerText = a.text || '';
v.setText = (e) => setAns(it.id, Object.assign({}, a, { text: e.target.value }));
const done = complete(a);
v.showNote = s.layout !== 'item';
v.note = done ? 'Saved' : (a.kind ? 'Finish this answer to continue.' : 'Not answered yet.');
return v;
});

const allDone = visible.every((it) => complete(s.answers[it.id]));
const answered = items.filter((it) => complete(s.answers[it.id])).length;
const visAnswered = visible.filter((it) => complete(s.answers[it.id])).length;
const areaIdx = areas.indexOf(cur.area);
const lastItem = s.idx === items.length - 1;
const lastArea = areaIdx === areas.length - 1;
let headLeft, headRight, nextLabel, isLast;
if (s.layout === 'page') { headLeft = 'All six items'; headRight = answered + ' of 6 answered'; nextLabel = 'Continue'; isLast = true; }
else if (s.layout === 'area') { headLeft = cur.area; headRight = 'Area ' + (areaIdx + 1) + ' of 3'; nextLabel = lastArea ? 'Continue' : 'Next area'; isLast = lastArea; }
else { headLeft = cur.area; headRight = (s.idx + 1) + ' of 6'; nextLabel = lastItem ? 'Continue' : 'Next item'; isLast = lastItem; }
const curA = s.answers[cur.id] || {};
const saveNote = allDone ? 'Saved' : (s.layout === 'item' ? (curA.kind === 'diff' ? 'Pick a priority and give a reason to continue.' : (curA.kind === 'disagree' ? 'Say why to continue.' : (curA.kind === 'unclear' ? 'Write your question to continue.' : 'Choose an answer to continue.'))) : (visAnswered + ' of ' + visible.length + ' answered on this screen. Answer every item to continue.'));
const next = () => {
if (s.layout === 'page') return this.setState({ screen: 'missing' });
if (s.layout === 'area') { if (lastArea) return this.setState({ screen: 'missing' }); const nextArea = areas[areaIdx + 1]; return this.setState({ idx: items.findIndex((x) => x.area === nextArea) }); }
return this.setState(lastItem ? { screen: 'missing' } : { idx: s.idx + 1 });
};
const back = () => {
if (s.layout === 'page') return this.setState({ screen: s.link === 'personal' ? 'resume' : 'landing' });
if (s.layout === 'area') { if (areaIdx === 0) return this.setState({ screen: s.link === 'personal' ? 'resume' : 'landing' }); const prevArea = areas[areaIdx - 1]; return this.setState({ idx: items.findIndex((x) => x.area === prevArea) }); }
return this.setState(s.idx === 0 ? { screen: s.link === 'personal' ? 'resume' : 'landing' } : { idx: s.idx - 1 });
};

const startDisabled = s.name.trim().length === 0 || s.role === '';
const submitDisabled = s.confidence === 0 || !s.signed;
let agreed = 0, pushed = 0, disagreed = 0, unclear = 0;
const rows = items.map((x, i) => {
const ans = s.answers[x.id] || {};
let status = 'Not answered', bg = '#F0F0EE', fg = '#454A52';
if (ans.kind === 'agree') { agreed += 1; status = 'Agree: ' + LABEL[x.proposed]; bg = '#E6F4EC'; fg = '#22643F'; }
if (ans.kind === 'pick') { agreed += 1; status = LABEL[ans.value]; bg = '#E6F4EC'; fg = '#22643F'; }
if (ans.kind === 'diff') { pushed += 1; status = 'Changed to ' + (LABEL[ans.value] || ''); bg = '#FBF1DC'; fg = '#7A5210'; }
if (ans.kind === 'disagree') { disagreed += 1; status = 'Disagree'; bg = '#F0F0EE'; fg = '#454A52'; }
if (ans.kind === 'unclear') { unclear += 1; status = 'Unclear'; bg = '#EEE8FA'; fg = '#4C2F94'; }
return { text: x.text, status: status, bg: bg, fg: fg, detail: ans.text || '', hasDetail: hasText(ans), edit: () => this.setState({ screen: 'item', idx: i }) };
});
const hasMissing = s.missingText.trim().length > 0;
const summaryLine = agreed + ' agreed, ' + pushed + ' changed, ' + disagreed + ' disagreed, ' + unclear + ' unclear' + (hasMissing ? ', 1 item added' : '');
const confidence = [1, 2, 3, 4, 5].map((n) => { const active = s.confidence === n; const st = active ? on : off; return { n: String(n), aria: 'Confidence ' + n + ' of 5', active: active, bg: st.bg, fg: st.fg, bd: st.bd, pick: () => this.setState({ confidence: n }) }; });
const pad = (n) => (n < 10 ? '0' : '') + n;
const stamp = () => { const d = new Date(); const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return 'Submitted ' + d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' UTC'; };
const screen = s.link === 'closed' ? 'closed' : (s.link === 'revoked' ? 'revoked' : s.screen);
const headerNote = screen === 'done' ? 'Submitted' : (screen === 'closed' ? 'Closed' : (screen === 'revoked' ? 'Inactive' : (screen === 'landing' || screen === 'resume' ? 'Closes 20 Oct' : 'Saved')));
const displayName = s.link === 'personal' ? 'Ioana' : (s.name.trim() || 'there');
const layouts = ['item', 'area', 'page'];
const links = ['open', 'personal', 'closed', 'revoked'];
const layoutLabel = { item: 'one item per screen', area: 'one area per screen', page: 'one long page' }[s.layout];

return {
isLanding: screen === 'landing', isResume: screen === 'resume', isItem: screen === 'item', isMissing: screen === 'missing', isSummary: screen === 'summary', isDone: screen === 'done', isClosed: screen === 'closed', isRevoked: screen === 'revoked',
headerNote: headerNote, name: s.name, role: s.role,
setName: (e) => this.setState({ name: e.target.value }), setRole: (e) => this.setState({ role: e.target.value }),
startDisabled: startDisabled, startOpacity: startDisabled ? 0.4 : 1, start: () => this.setState({ screen: 'item', idx: 0 }),
resumeCount: 4, resumeGo: () => this.setState({ screen: 'item', idx: 4 }),
headLeft: headLeft, headRight: headRight, progressWidth: Math.round((answered / items.length) * 100) + '%',
visible: view, nextDisabled: !allDone, nextOpacity: allDone ? 1 : 0.4, nextLabel: nextLabel, saveNote: saveNote, next: next, back: back,
missingText: s.missingText, setMissing: (e) => this.setState({ missingText: e.target.value }), missingNextLabel: hasMissing ? 'Add and continue' : 'Skip',
backToItems: () => this.setState({ screen: 'item', idx: items.length - 1 }), toSummary: () => this.setState({ screen: 'summary' }),
rows: rows, hasMissing: hasMissing, summaryLine: summaryLine, confidence: confidence, signed: s.signed,
toggleSigned: (e) => this.setState({ signed: e.target.checked }), submitDisabled: submitDisabled, submitOpacity: submitDisabled ? 0.4 : 1,
submit: () => this.setState({ screen: 'done', submittedAt: stamp() }), submittedAt: s.submittedAt, displayName: displayName, reopen: () => this.setState({ screen: 'summary' }),
closedLine: s.submittedAt ? ('Your answers were submitted. ' + s.submittedAt) : (answered > 0 ? 'You answered ' + answered + ' of 6 items. Unsubmitted answers are kept and shown to the team as partial.' : 'You had not started.'),
layoutLabel: layoutLabel, blindLabel: s.blind ? 'hidden (rate blind)' : 'shown', linkLabel: s.link,
cycleLayout: () => { const i = layouts.indexOf(s.layout); const l = layouts[(i + 1) % layouts.length]; this.setState({ layout: l, screen: s.screen === 'item' ? 'item' : s.screen, idx: l === 'area' ? items.findIndex((x) => x.area === cur.area) : s.idx }); },
toggleBlind: () => this.setState({ blind: !s.blind, answers: {} }),
cycleLink: () => { const i = links.indexOf(s.link); const l = links[(i + 1) % links.length]; this.setState({ link: l, screen: l === 'personal' ? 'resume' : (l === 'open' ? 'landing' : s.screen), name: l === 'personal' ? 'Ioana Marin' : s.name, role: l === 'personal' ? 'Sales' : s.role, answers: l === 'personal' ? { i1: { kind: 'agree' }, i2: { kind: 'diff', value: 'M', text: 'My team bills two projects on almost every trip.' }, i3: { kind: 'agree' }, i4: { kind: 'diff', value: 'M', text: 'I find out I was over the limit three weeks later.' } } : s.answers }); }
};
}
}'''

def page(title, root_style, header_pad, w, h):
    s = screens.replace('padding: 16px 20px; border-bottom: 1px solid #E3E1DC">', f'padding: 16px {header_pad}; border-bottom: 1px solid #E3E1DC">', 1)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONT}
<style>
body{{margin:0;font-family:'Geist','Segoe UI',system-ui,sans-serif;background:#FFFFFF;color:#16181C}}
a{{color:#0E6B63}}a:hover{{color:#0A4F49}}
button,input,select,textarea{{font:inherit;color:inherit}}
button{{cursor:pointer}}button:disabled{{cursor:not-allowed}}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{{outline:2px solid #0E6B63;outline-offset:2px}}
.col{{width:100%;max-width:640px;margin:0 auto;box-sizing:border-box}}
</style>
</helmet>
<div style="{root_style}">
{s}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
{JS}
</script>
</body>
</html>
"""
out = pathlib.Path('out'); out.mkdir(exist_ok=True)
(out / 'Respondent.dc.html').write_text(page('Respondent journey, phone', 'width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; color: #16181C; display: flex; flex-direction: column; font-size: 17px; line-height: 1.45; overflow: hidden', '20px', 390, 844))
(out / 'RespondentDesktop.dc.html').write_text(page('Respondent journey, desktop', 'width: 1440px; height: 900px; box-sizing: border-box; background: #FFFFFF; color: #16181C; display: flex; flex-direction: column; font-size: 17px; line-height: 1.45; overflow: hidden', '120px', 1440, 900))
print('written')

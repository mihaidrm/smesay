# Shared tokens and helpers for the brand boards
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def mix(a,b,t):
    a=a.lstrip('#'); b=b.lstrip('#')
    return '#'+''.join('%02X'%round(int(a[i:i+2],16)*(1-t)+int(b[i:i+2],16)*t) for i in (0,2,4))
TEAL='#0E6B63'
teal = {50:'#E3F1EF',100:mix('#FFFFFF',TEAL,0.22),200:mix('#FFFFFF',TEAL,0.38),300:'#7FD1C6',400:mix('#7FD1C6',TEAL,0.45),500:mix('#7FD1C6',TEAL,0.75),600:mix('#FFFFFF',TEAL,0.92),700:TEAL,800:mix(TEAL,'#16181C',0.3),900:mix(TEAL,'#16181C',0.55)}
NEUT=[('White','#FFFFFF','Page background'),('Grey 50','#F6F6F4','Section background'),('Greige','#ECEAE5','Cards holding product fragments'),('Hairline','#E6E4DF','Borders, dividers'),('Hairline strong','#C9C7C1','Input borders, arrows'),('Muted ink','#5B6069','Secondary text'),('Ink soft','#454A52','Body on marketing'),('Ink','#16181C','Text, primary buttons'),('Ink raised','#22252A','Cards on ink')]
STATUS=[('Agree','#2F855A','#E6F4EC','#22643F'),('Pushed back','#B7791F','#FBF1DC','#7A5210'),('Unclear','#7C3AED','#EEE8FA','#4C2F94'),('Missing','#2B6CB0','#E3EEF9','#1F4F7A'),('Not needed','#718096','#F0F0EE','#454A52')]
FONT="<link href=\"https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500&amp;display=swap\" rel=\"stylesheet\">"
def page(title, body, h):
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
</style>
</helmet>
<div style="width: 1440px; height: {h}px; box-sizing: border-box; background: #FFFFFF; color: #16181C; padding: 44px 56px; display: flex; flex-direction: column; gap: 28px; font-size: 13px; line-height: 1.45">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""
def head(eyebrow, title, note):
    return f"""<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 6px">
<div style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069">{eyebrow}</div>
<h1 style="margin: 0; font-size: 32px; font-weight: 500; letter-spacing: -0.03em">{title}</h1>
</div>
<div style="width: 460px; color: #454A52">{note}</div>
</div>"""
def section(label):
    return f'<div style="font-weight: 500; font-size: 15px; letter-spacing: -0.01em; border-bottom: 1px solid #E6E4DF; padding-bottom: 8px">{label}</div>'
MARK_B = lambda size, fill='#0E6B63', ink='#FFFFFF': f'<svg width="{size}" height="{size}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="{fill}"></rect><path d="M7 8.5h8v7H10l-3 2.5z" fill="{ink}"></path><path d="M17 11.5h8v7h-5l-3 2.5z" fill="none" stroke="{ink}" stroke-width="2" stroke-linejoin="round"></path><path d="M7 25h18" stroke="{ink}" stroke-width="2.5" stroke-linecap="round"></path></svg>'
FAV = lambda size, fill='#0E6B63', ink='#FFFFFF': f'<svg width="{size}" height="{size}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="{fill}"></rect><path d="M6 9h9v8h-5l-4 3z" fill="{ink}"></path><path d="M17 13h9v8h-5l-4 3z" fill="none" stroke="{ink}" stroke-width="2.5" stroke-linejoin="round"></path></svg>'
def wordmark(size, ink='#16181C', me='#0E6B63'):
    return f'<span style="font-size: {size}px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; color: {ink}">S<span style="color: {me}">ME</span>say</span>'

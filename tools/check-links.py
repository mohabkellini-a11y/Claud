"""Link and HTML check. Run from the repo root:  python3 tools/check-links.py .
Prints broken links, broken anchors, missing alt text, duplicate IDs, unclosed tags and JSON-LD errors.
Lines about dashes, css versions, the hidden honeypot field and heading order are information only."""
import re,sys,os,glob,json,html
from html.parser import HTMLParser
from collections import Counter
root=sys.argv[1]
pages=[p for p in sorted(glob.glob(root+'/*.html'))+[root+'/thank-you/index.html'] if 'google' not in p]
files=set(os.path.relpath(os.path.join(d,f),root) for d,_,fs in os.walk(root) for f in fs if '.git' not in d)
ids={}
VOID={'meta','link','img','br','hr','input','source','area','base','col','embed','track','wbr'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.ids=[]; s.links=[]; s.imgs=[]; s.stack=[]; s.err=[]; s.text=[]; s.skip=0; s.btn=[]; s.h=[]; s.cur=None; s.inputs=[]; s.labels=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if 'id' in a: s.ids.append(a['id'])
        if t=='a': s.links.append((a.get('href'),s.getpos()[0],a))
        if t=='img': s.imgs.append((a,s.getpos()[0]))
        if t in('script','style'): s.skip+=1
        if t in ('svg',): pass
        if t=='label': s.labels.append(a.get('for'))
        if t in('input','select','textarea') and a.get('type') not in('hidden','submit'): s.inputs.append((a.get('id'),a.get('name'),a.get('aria-label'),s.getpos()[0],a.get('style')))
        if re.fullmatch(r'h[1-6]',t): s.cur=[t,'']
        if t not in VOID: s.stack.append((t,s.getpos()[0]))
    def handle_startendtag(s,t,a):
        a=dict(a)
        if 'id' in a: s.ids.append(a['id'])
        if t=='img': s.imgs.append((a,s.getpos()[0]))
        if t in('input',) and a.get('type') not in('hidden','submit'): s.inputs.append((a.get('id'),a.get('name'),a.get('aria-label'),s.getpos()[0],a.get('style')))
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
        if re.fullmatch(r'h[1-6]',t) and s.cur: s.h.append((s.cur[0],re.sub(r'\s+',' ',s.cur[1]).strip())); s.cur=None
        if t in VOID: return
        if s.stack and s.stack[-1][0]==t: s.stack.pop()
        else:
            names=[x[0] for x in s.stack]
            if t in names:
                while s.stack and s.stack[-1][0]!=t:
                    u=s.stack.pop()
                    if u[0] not in('p','li','path','circle','rect','g'): s.err.append('unclosed <%s> from line %d (closed by </%s> line %d)'%(u[0],u[1],t,s.getpos()[0]))
                s.stack.pop()
            else: s.err.append('stray </%s> line %d'%(t,s.getpos()[0]))
    def handle_data(s,d):
        if s.cur is not None: s.cur[1]+=d
        if not s.skip: s.text.append(d)
parsed={}
for p in pages:
    t=open(p,encoding='utf-8').read(); pr=P(); pr.feed(t); parsed[os.path.relpath(p,root)]=(pr,t)
for name,(pr,t) in parsed.items():
    out=[]
    dup=[k for k,v in Counter(pr.ids).items() if v>1]
    if dup: out.append('DUP IDs: %s'%dup)
    for e in pr.err: out.append('HTML: '+e)
    if pr.stack: out.append('HTML: unclosed at EOF %s'%pr.stack)
    for a,l in pr.imgs:
        if 'alt' not in a: out.append('IMG no alt line %d %s'%(l,a.get('src')))
        elif a['alt']=='' and a.get('aria-hidden')!='true': out.append('IMG empty alt (not hidden) line %d'%l)
        if 'width' not in a or 'height' not in a: out.append('IMG no width/height line %d %s'%(l,a.get('src')))
        if a.get('loading')!='lazy': pass
        src=a.get('src','')
        if not src.startswith('http'):
            f=os.path.normpath(os.path.join(os.path.dirname(name),src.lstrip('/') if src.startswith('/') else src))
            if f not in files: out.append('IMG broken src line %d %s'%(l,src))
    for href,l,a in pr.links:
        if href is None: out.append('A no href line %d'%l); continue
        if href.startswith(('mailto:','tel:')): continue
        if href.startswith('http'):
            m=re.match(r'https?://(www\.)?eversafe-fire\.com(/.*)?$',href)
            if not m:
                if a.get('target')=='_blank' and 'noopener' not in (a.get('rel') or ''): out.append('EXT link without noopener line %d'%l)
                continue
            href=m.group(2) or '/'
        path,_,frag=href.partition('#')
        if path in('','/'): tgt='index.html' if path=='/' else name
        else:
            tgt=path.lstrip('/') if path.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(name),path))
            if tgt.endswith('/') : tgt+='index.html'
            if tgt not in files and tgt+'/index.html' in files: tgt=tgt+'/index.html'
        if tgt not in files: out.append('BROKEN link line %d: %s'%(l,href)); continue
        if frag and tgt in parsed and frag not in parsed[tgt][0].ids: out.append('BROKEN anchor line %d: %s (no id="%s" in %s)'%(l,href,frag,tgt))
    for i,n,al,l,st in pr.inputs:
        if (i not in pr.labels) and not al: out.append('INPUT no label line %d name=%s id=%s style=%s'%(l,n,i,st))
    hs=[int(h[0][1]) for h in pr.h]; 
    if hs.count(1)!=1: out.append('H1 count=%d'%hs.count(1))
    for a,b in zip(hs,hs[1:]):
        if b>a+1: out.append('heading skip h%d→h%d'%(a,b)); break
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>',t,re.S):
        try: json.loads(m.group(1))
        except Exception as e: out.append('JSON-LD parse error: %s'%e)
    if 'lang=' not in t[:200]: out.append('no lang')
    vis=' '.join(pr.text)
    out.append('dashes in visible text: em=%d en=%d | "Learn more"=%d | weight800 in font url=%s | fonts=%s'%(vis.count('—'),vis.count('–'),len(re.findall(r'Learn more',vis)),'800' in ''.join(re.findall(r'fonts.googleapis[^"]*',t)), 'yes' if 'fonts.googleapis' in t else 'NONE'))
    out.append('css=%s js=%s inline<style>=%d inline style attrs=%d'%(re.findall(r'styles\.css[^"]*',t),re.findall(r'script\.js[^"]*',t),t.count('<style'),t.count('style="')))
    print('==',name); [print('   ',o) for o in out]

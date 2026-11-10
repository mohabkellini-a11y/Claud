// Page checks: sideways scroll, text below 12px, tap targets below 44px, contrast, script errors.
// 1) In the repo root run:  python3 -m http.server 8765
// 2) Then run:              node tools/check-pages.js        (W=375,1440 to limit widths)
// Screenshots go to the folder in SHOTS (default: system temp /eversafe-shots).
// Known and accepted contrast findings: orange text on blue, gradient buttons, footer tagline (owner's choice).
const { chromium } = require('playwright');
const fs=require('fs');
const path=require('path');
const ROOT=path.join(__dirname,'..');
const SHOTS=process.env.SHOTS||path.join(require('os').tmpdir(),'eversafe-shots');
fs.mkdirSync(SHOTS,{recursive:true});
const pages = fs.readdirSync(ROOT).filter(f=>f.endsWith('.html')&&!f.startsWith('google')).concat(['thank-you/index.html']);
const widths = (process.env.W||"375,768,1024,1440").split(",").map(Number);
(async()=>{
  const b = await chromium.launch();
  const agg={};
  for (const p of pages){
    for (const w of widths){
      const ctx = await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:1});
      const pg = await ctx.newPage();
      const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
      await pg.goto('http://localhost:8765/'+p,{waitUntil:'load'});
      await pg.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
      await pg.waitForTimeout(800);
      const r = await pg.evaluate(()=>{
        const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(/[,\s\/]+/).filter(Boolean).map(Number);return [a[0],a[1],a[2],a.length>3?a[3]:1];};
        const lum=c=>{const a=c.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2];};
        const over=(f,b)=>[0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3])).concat([1]);
        const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
        // candidate backgrounds behind an element: walk up, collect solid colors and gradient stops
        function bgs(e){
          let layers=[]; let n=e;
          while(n&&n.nodeType===1){
            const s=getComputedStyle(n); const col=parse(s.backgroundColor); const img=s.backgroundImage;
            let stops=[];
            if(img&&img.includes('gradient')){ (img.match(/rgba?\([^)]+\)/g)||[]).forEach(x=>stops.push(parse(x))); }
            if(stops.length) { layers.push({stops}); if(stops.every(x=>x[3]===1)) break; }
            if(col&&col[3]>0){ layers.push({stops:[col]}); if(col[3]===1) break; }
            n=n.parentElement;
          }
          // compose from bottom (white default) to top, taking each combination of stops (worst case)
          let bases=[[255,255,255,1]];
          for(const L of layers.reverse()){ const nb=[]; for(const base of bases) for(const st of L.stops) nb.push(over(st,base)); bases=nb.slice(0,64); }
          return bases;
        }
        const vis=e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0&&r.width>0&&r.height>0;};
        const out={overflow: document.documentElement.scrollWidth - window.innerWidth, small:{}, taps:{}, contrast:{}};
        document.querySelectorAll('body *').forEach(e=>{
          if(!vis(e)||e.closest('[hidden]')||e.closest('svg'))return;
          const txt=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim().length>1).map(n=>n.textContent.trim()).join(' ');
          if(!txt)return;
          const s=getComputedStyle(e); const fs=parseFloat(s.fontSize);
          const key=(e.className&&typeof e.className==='string'?e.tagName.toLowerCase()+'.'+e.className.split(' ')[0]:e.tagName.toLowerCase()+'<'+(e.parentElement.className||e.parentElement.tagName).toString().split(' ')[0]);
          if(fs<12) out.small[key]=fs.toFixed(1)+' "'+txt.slice(0,24)+'"';
          let fg=parse(s.color); if(!fg)return;
          if(s.webkitTextFillColor&&parse(s.webkitTextFillColor)) fg=parse(s.webkitTextFillColor);
          let worst=99; for(const bg of bgs(e)){ const c=cr(over(fg,bg),bg); if(c<worst)worst=c; }
          const big=(fs>=24)||(fs>=18.66&&+s.fontWeight>=700);
          if(worst<(big?3:4.5)) out.contrast[key]=worst.toFixed(2)+(big?' (large)':'')+' "'+txt.slice(0,24)+'"';
        });
        document.querySelectorAll('a,button,input:not([type=hidden]),select,textarea,summary,[role=button]').forEach(e=>{
          if(!vis(e)||e.closest('[hidden]'))return; let r=e.getBoundingClientRect();
          if(e.tagName==='INPUT'&&(e.type==='radio'||e.type==='checkbox')&&e.closest('label')) r=e.closest('label').getBoundingClientRect();
          if(e.tagName==='INPUT'&&e.style.display==='none')return;
          if(r.height<43.5||r.width<43.5){ const key=(typeof e.className==='string'&&e.className?e.tagName.toLowerCase()+'.'+e.className.split(' ')[0]:e.tagName.toLowerCase()+'<'+(e.parentElement.className||e.parentElement.tagName).toString().split(' ')[0]); out.taps[key]=Math.round(r.width)+'x'+Math.round(r.height)+' "'+(e.textContent||'').trim().slice(0,20)+'"'; }
        });
        return out;
      });
      if(r.overflow>0) console.log(`OVERFLOW ${p}@${w}: ${r.overflow}px`);
      if(errs.length) console.log(`JS ERRORS ${p}@${w}: ${errs.join(' | ').slice(0,200)}`);
      for(const kind of ['small','taps','contrast']) for(const [k,v] of Object.entries(r[kind])){ const kk=kind+' :: '+k; (agg[kk]=agg[kk]||{v,where:new Set()}).where.add(p.replace('.html','')+'@'+w); }
      await pg.screenshot({path:`${SHOTS}/${p.replace(/[\/]/g,'_').replace('.html','')}-${w}.png`,fullPage:true});
      await ctx.close();
    }
  }
  for(const [k,o] of Object.entries(agg).sort()){ const wh=[...o.where]; console.log(k+' => '+o.v+' ['+wh.length+' views: '+wh.slice(0,3).join(', ')+(wh.length>3?', …':'')+']'); }
  console.log('pages checked:',pages.length,'x',widths.length);
  await b.close();
})();

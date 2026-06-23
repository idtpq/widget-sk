(function () {
  'use strict';

  const WORKER_URL = 'https://bot-sk.metsukisutemi.workers.dev';

  function getUTM() {
    return {
      source:   new URLSearchParams(location.search).get('utm_source')   || sessionStorage.getItem('mk_utm_source')   || '',
      medium:   new URLSearchParams(location.search).get('utm_medium')   || sessionStorage.getItem('mk_utm_medium')   || '',
      campaign: new URLSearchParams(location.search).get('utm_campaign') || sessionStorage.getItem('mk_utm_campaign') || '',
    };
  }
  ['source','medium','campaign'].forEach(k => {
    const v = new URLSearchParams(location.search).get('utm_'+k);
    if (v) sessionStorage.setItem('mk_utm_'+k, v);
  });

  function genSID() {
    return '№ ' + String(Math.floor(100000 + Math.random() * 900000));
  }

  // формат суми: 41.28 -> "41,28"
  function m(v){ return String(v==null?'':v).replace('.', ','); }

  const CSS = `
    #sg-root{position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    #sg-btn{width:58px;height:58px;border-radius:50%;background:#1c3d2e;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.22);transition:transform .2s,box-shadow .2s;position:relative;}
    #sg-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.28);}
    #sg-btn{animation:sg-chat-btn-pulse 1.9s ease-out infinite;}
    #sg-btn:hover{animation-play-state:paused;}
    @keyframes sg-chat-btn-pulse{0%{box-shadow:0 4px 16px rgba(0,0,0,.22),0 0 0 0 rgba(28,61,46,.45);}70%{box-shadow:0 4px 16px rgba(0,0,0,.22),0 0 0 13px rgba(28,61,46,0);}100%{box-shadow:0 4px 16px rgba(0,0,0,.22),0 0 0 0 rgba(28,61,46,0);}}
    #sg-btn svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
    #sg-badge{position:absolute;top:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:#e53e3e;border:2px solid #fff;display:none;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;}
    #sg-tooltip{position:absolute;bottom:68px;right:0;background:#1c3d2e;color:#fff;font-size:13px;padding:10px 14px;border-radius:12px 12px 0 12px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.2);display:none;cursor:pointer;line-height:1.4;}
    #sg-tooltip:after{content:'';position:absolute;bottom:-6px;right:16px;border:6px solid transparent;border-top-color:#1c3d2e;border-bottom:none;}
    #sg-box{position:absolute;bottom:70px;right:0;width:340px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;max-height:calc(100vh - 120px);transition:opacity .2s,transform .2s;transform-origin:bottom right;}
    #sg-box.hidden{opacity:0;transform:scale(.95) translateY(8px);pointer-events:none;}
    #sg-hd{background:#1c3d2e;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
    .sg-hav{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;}
    .sg-htxt{flex:1;min-width:0;}
    .sg-hname{color:#fff;font-size:14px;font-weight:600;}
    .sg-hsub{color:rgba(255,255,255,.6);font-size:11px;margin-top:2px;display:flex;align-items:center;gap:5px;}
    .sg-online{width:6px;height:6px;background:#68d391;border-radius:50%;animation:sg-pulse 2s infinite;}
    @keyframes sg-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    #sg-x{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.5);font-size:18px;line-height:1;padding:2px 4px;transition:color .15s;flex-shrink:0;}
    #sg-x:hover{color:#fff;}
    #sg-sid{text-align:center;font-size:10px;color:#b8b0a4;padding:3px 0;background:#f7f6f3;font-family:monospace;flex-shrink:0;}
    #sg-trust{display:flex;justify-content:center;gap:0;background:#eef3ee;flex-shrink:0;border-bottom:1px solid #dde8dd;}
    .sg-ti{flex:1;text-align:center;font-size:10px;font-weight:600;color:#2c5840;padding:5px 2px;letter-spacing:.1px;}
    #sg-log{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;background:#f7f6f3;min-height:220px;max-height:300px;}
    #sg-log::-webkit-scrollbar{width:3px;}
    #sg-log::-webkit-scrollbar-thumb{background:#d0c8bc;border-radius:2px;}
    .sg-row{display:flex;align-items:flex-end;gap:7px;}
    .sg-row.u{flex-direction:row-reverse;}
    .sg-ava{width:26px;height:26px;border-radius:50%;background:#1c3d2e;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;}
    .sg-bubble{max-width:78%;padding:9px 13px;font-size:14px;line-height:1.55;word-break:break-word;white-space:pre-wrap;border-radius:14px;}
    .sg-row.b .sg-bubble{background:#fff;color:#1a1a1a;border-bottom-left-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.08);}
    .sg-row.u .sg-bubble{background:#1c3d2e;color:#fff;border-bottom-right-radius:3px;}
    .sg-typing .sg-bubble{padding:11px 14px;}
    .sg-dots span{display:inline-block;width:6px;height:6px;background:#b0a898;border-radius:50%;margin:0 2px;animation:sg-b 1.2s infinite;}
    .sg-dots span:nth-child(2){animation-delay:.2s}.sg-dots span:nth-child(3){animation-delay:.4s}
    @keyframes sg-b{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .sg-ts{text-align:center;font-size:11px;color:#b8b0a4;margin:2px 0;}
    #sg-qr{padding:6px 10px 4px;display:flex;flex-wrap:wrap;gap:6px;background:#f7f6f3;flex-shrink:0;min-height:0;}
    .sg-qbtn{background:#fff;border:1.5px solid #1c3d2e;color:#1c3d2e;border-radius:20px;padding:6px 13px;font-size:13px;cursor:pointer;transition:all .15s;font-family:inherit;line-height:1.3;}
    .sg-qbtn:hover{background:#1c3d2e;color:#fff;}
    .sg-pay-wrap{display:flex;justify-content:center;padding:8px 0;}
    .sg-pay-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(180deg,#1a1a1a 0%,#0d0d0d 100%);color:#fff;text-decoration:none;padding:13px 18px;border-radius:14px;font-size:16px;font-weight:800;letter-spacing:-0.01em;box-shadow:0 8px 20px rgba(0,0,0,.16);transition:transform .15s,box-shadow .15s,filter .15s;min-width:218px;max-width:100%;border:1.5px solid #171717;}
    .sg-pay-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(0,0,0,.20);filter:brightness(1.03);}
    .sg-pay-btn .sg-pay-amount{font-size:17px;font-weight:900;color:#fff;white-space:nowrap;}
    .sg-pay-note{font-size:12px;color:#6b7280;text-align:center;margin-top:6px;}
    .sg-pay-loading{margin:8px 12px;padding:14px 14px;border-radius:14px;background:#f7f7f5;border:1px solid #ece7de;}
    .sg-pay-loading-top{font-size:13px;color:#374151;line-height:1.45;margin-bottom:10px;text-align:center;}
    .sg-pay-loading-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-width:218px;max-width:100%;margin:0 auto;background:linear-gradient(180deg,#1a1a1a 0%,#0d0d0d 100%);color:#fff;border-radius:14px;padding:13px 18px;border:1.5px solid #171717;opacity:.92;}
    .sg-pay-loading-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.28);border-top-color:#ffffff;animation:sg-spin .8s linear infinite;}
    @keyframes sg-spin{to{transform:rotate(360deg);}}
    .sg-cod-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;font-size:13px;color:#15803d;text-align:center;margin:4px 12px;}
    #sg-ft{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #ede8e0;background:#fff;flex-shrink:0;align-items:flex-end;}
    #sg-ta{flex:1;border:1.5px solid #ddd7ce;border-radius:10px;padding:9px 12px;font-size:14px;line-height:1.4;resize:none;outline:none;max-height:80px;font-family:inherit;color:#1a1a1a;background:#faf8f5;transition:border-color .15s;}
    #sg-ta:focus{border-color:#1c3d2e;background:#fff;}
    #sg-ta::placeholder{color:#b8b0a4;}
    #sg-go{width:38px;height:38px;border-radius:10px;background:#1c3d2e;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;padding:0;align-self:flex-end;}
    #sg-go:hover{background:#142d21;}
    #sg-go:disabled{background:#c5bdb4;cursor:not-allowed;}
    #sg-go svg{width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    #sg-pw{text-align:center;font-size:10px;color:#c5bdb4;padding:5px;background:#fff;flex-shrink:0;border-top:1px solid #f0ebe2;}
    @media(max-width:400px){#sg-root{bottom:16px;right:16px;}#sg-box{width:calc(100vw - 32px);right:0;}}
  `;

  const SID = genSID();
  let open=false, busy=false, started=false;
  let hist=[];
  let ses={
    name:null,phone:null,email:null,contact:null,circleSize:null,
    thickness:null,
    price:null,product:null,address:null,
    paymentMethod:null,total:null,delivery:null,stripeUrl:null,
    leadFired:false,
    phoneRequest:false,
    paymentLinkSent:false,
    pendingAddressParts:[],
    sessionSavedOnce:false,
    _saveTimer:null,
    _warmLeadSent:false,
  };

  function build(){
    const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
    const r=document.createElement('div');r.id='sg-root';
    r.innerHTML=`
      <div id="sg-box" class="hidden">
        <div id="sg-hd">
          <div class="sg-hav">K</div>
          <div class="sg-htxt">
            <div class="sg-hname">Klára — Poradkyňa</div>
            <div class="sg-hsub"><span class="sg-online"></span>makkesklo.shop</div>
          </div>
          <button id="sg-x">✕</button>
        </div>
        <div id="sg-sid">ID chatu: ${SID}</div>
        <div id="sg-trust">
          <span class="sg-ti">✓ 100 000+ objednávok</span>
          <span class="sg-ti">✓ Bezpečná platba</span>
          <span class="sg-ti">✓ Rezanie na mieru</span>
        </div>
        <div id="sg-log" role="log" aria-live="polite"></div>
        <div id="sg-qr"></div>
        <div id="sg-ft">
          <textarea id="sg-ta" rows="1" placeholder="Napíšte správu…"></textarea>
          <button id="sg-go">
            <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div id="sg-pw">makkesklo.shop</div>
      </div>
      <div id="sg-tooltip">Spočítam cenu vášho stola za 30 sek. 👋</div>
      <button id="sg-btn">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span id="sg-badge"></span>
      </button>
    `;
    document.body.appendChild(r);
  }

  const el=id=>document.getElementById(id);
  function scroll(){const l=el('sg-log');l.scrollTop=l.scrollHeight;}
  function addTime(){
    const d=new Date(),t=document.createElement('div');
    t.className='sg-ts';
    t.textContent=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    el('sg-log').appendChild(t);
  }
  function addBot(text){
    el('sg-log').querySelector('.sg-typing')?.remove();
    const row=document.createElement('div');row.className='sg-row b';
    row.innerHTML=`<div class="sg-ava">K</div><div class="sg-bubble">${text.replace(/\n/g,'<br>')}</div>`;
    el('sg-log').appendChild(row);scroll();
  }
  function addUser(text){
    const row=document.createElement('div');row.className='sg-row u';
    row.innerHTML=`<div class="sg-bubble">${text.replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</div>`;
    el('sg-log').appendChild(row);clearQR();scroll();
  }
  function showTyping(){
    const row=document.createElement('div');row.className='sg-row b sg-typing';
    row.innerHTML=`<div class="sg-ava">K</div><div class="sg-bubble"><span class="sg-dots"><span></span><span></span><span></span></span></div>`;
    el('sg-log').appendChild(row);scroll();
  }
  function lock(v){el('sg-ta').disabled=v;el('sg-go').disabled=v;}

  function setQR(buttons){
    const qr=el('sg-qr');qr.innerHTML='';
    buttons.forEach(label=>{
      const btn=document.createElement('button');
      btn.className='sg-qbtn';btn.textContent=label;
      btn.onclick=()=>send(label);
      qr.appendChild(btn);
    });
  }
  function clearQR(){el('sg-qr').innerHTML='';}

  function detectQR(botText){
    const questionCount=(botText.match(/[?]/g)||[]).length;
    if(questionCount>1)return;

    const t=botText.toLowerCase();

    if(ses.paymentLinkSent)return;
    if(t.includes('prijala som objednávku'))return;

    // Druh povrchu — štartová otázka
    if(t.includes('druh povrchu')||t.includes('aký druh stola')||t.includes('aký povrch')){
      setQR(['Drevo matné','Sklo / lak / lesk','Laminát']);
    // Intenzita
    } else if(t.includes('intenz')&&!t.includes('rozmer')){
      setQR(['Intenzívne (kuchyňa/deti)','Menej často (pracovňa/obývačka)']);
    // Hrúbka
    } else if(t.includes('1,5mm')&&t.includes('2mm')&&!t.includes('rozmer')&&!ses.price){
      setQR(['1,5mm — lacnejšie','2mm — pevnejšie']);
    // Rozmery — populárne rozmery ako skratky
    } else if((t.includes('rozmery v cm')||t.includes('uveďte rozmery')||t.includes('zadajte rozmery'))&&!ses.price){
      setQR(['80×60 cm','100×80 cm','120×80 cm','140×80 cm','160×90 cm','Iné rozmery']);
    // Okrúhly?
    } else if((t.includes('okrúhly')||t.includes('je okrúhly'))&&!t.includes('rozmer')){
      setQR(['Áno, okrúhly','Nie, obdĺžnik']);
    // Ďalšie stoly?
    } else if(t.includes('ďalšie stoly')||t.includes('ďalšie stoly')||t.includes('ešte nejaké')){
      setQR(['Áno, mám ešte','Nie, to je všetko']);
    // Spôsob platby
    } else if((t.includes('zaplat')&&(t.includes('ako')||t.includes('spôsob')))||(t.includes('platb')&&t.includes('spôsob'))){
      setQR(['💳 Online (karta)','🚚 Dobierka']);
    // Všeobecná otázka
    } else if(t.includes('mám otázku')||t.includes('ako vám môžem')||t.includes('s čím')){
      setQR(['Chcem objednať','Mám otázku o produkte']);
    }
  }

  function clearPaymentUi(){
    el('sg-log').querySelectorAll('#sg-pay-state, .sg-pay-loading, .sg-pay-ready').forEach(n=>n.remove());
  }

  function showPaymentLoading(total){
    clearQR();clearPaymentUi();
    const sidEl=el('sg-sid');
    if(sidEl)sidEl.textContent='Č. objednávky: '+SID;
    const w=document.createElement('div');
    w.id='sg-pay-state';w.className='sg-pay-loading';
    w.innerHTML=
      '<div class="sg-pay-loading-top">Pripravujem bezpečný odkaz na platbu. Zvyčajne to trvá pár sekúnd.</div>'+
      '<div class="sg-pay-loading-btn">'+
        '<span class="sg-pay-loading-spinner"></span>'+
        '<span class="sg-pay-amount">Generujem odkaz '+m(total)+' €</span>'+
      '</div>'+
      '<div class="sg-pay-note">Po vygenerovaní sa zobrazí tlačidlo platby kartou.</div>';
    el('sg-log').appendChild(w);scroll();
  }

  function showPayBtn(url,total){
    clearQR();clearPaymentUi();
    const sidEl=el('sg-sid');
    if(sidEl)sidEl.textContent='Č. objednávky: '+SID;
    const w=document.createElement('div');
    w.id='sg-pay-state';w.className='sg-pay-ready';
    w.style.cssText='padding:8px 12px;';
    w.innerHTML=
      '<div style="font-size:13px;color:#374151;margin-bottom:8px;line-height:1.4;">'+
        'Objednávka <strong>'+SID+'</strong> bude odovzdaná na spracovanie po zaplatení.'+
      '</div>'+
      '<div style="display:flex;justify-content:center;margin-bottom:4px;">'+
        '<a href="'+url+'" target="_blank" rel="noopener" class="sg-pay-btn" aria-label="Zaplatiť kartou">'+
          '<span class="sg-pay-amount">Zaplatiť '+m(total)+' € kartou</span>'+
        '</a>'+
      '</div>'+
      '<div class="sg-pay-note">Platba prebehne cez Stripe (karta, aj Google Pay / Apple Pay).</div>'+
      '<div style="font-size:11px;color:#9ca3af;text-align:center;cursor:pointer;margin-top:8px;" onclick="window.__mkChangeToCOD&&window.__mkChangeToCOD('+total+')">'+
        'Zmeniť na platbu na dobierku →'+
      '</div>';
    el('sg-log').appendChild(w);scroll();

    window.__mkChangeToCOD=function(t){
      ses.paymentMethod='cod';
      clearPaymentUi();clearQR();
      showCOD(t);
      fireUpdate('payment_changed_to_cod',{payment_method:'cod',total:t});
      savePostPaymentUpdate('payment_changed_to_cod_button');
    };
  }

  function showCOD(total){
    clearQR();
    const sidEl=el('sg-sid');
    if(sidEl)sidEl.textContent='Č. objednávky: '+SID;
    const d=document.createElement('div');d.className='sg-cod-box';
    d.innerHTML='✅ Objednávka prijatá!<br>Č. objednávky: <strong>'+SID+'</strong><br>Platba na dobierku: <strong>'+m(total)+' €</strong><br>Čoskoro sa vám ozveme.';
    el('sg-log').appendChild(d);scroll();
  }

  async function openChat(){
    open=true;el('sg-box').classList.remove('hidden');
    el('sg-badge').style.display='none';el('sg-tooltip').style.display='none';
    if(!started){
      started=true;showTyping();
      await new Promise(r=>setTimeout(r,600));
      el('sg-log').querySelector('.sg-typing')?.remove();
      addBot('Dobrý deň! 👋 Som Klára z makkesklo.shop.\n\nSpočítam cenu ochranného skla na váš stôl za menej než minútu.\n\nAký druh povrchu má váš stôl?');
      addTime();
      setQR(['Drevo matné','Sklo / lak / lesk','Laminát','Mám otázku']);
    }
    el('sg-ta').focus();
  }

  function closeChat(){
    sessionStorage.setItem('mk_auto_block','1');
    open=false;el('sg-box').classList.add('hidden');
    if(!hasContactData()&&hist.length>1){
      saveSessionNow('close_no_contact');
    }
  }

  // ── Data extraction ──────────────────────────────────────────────────────
  // SK телефон: +421 9xx xxx xxx  або  09xx xxx xxx (мобільні), також стаціонарні +421 x...
  function getPhone(t){
    const raw=String(t||'');
    const m=raw.match(/(?:\+421[\s-]?|00421[\s-]?|0)([1-9]\d{1,2}[\s-]?\d{3}[\s-]?\d{2,3})/);
    if(!m)return null;
    const digits=m[0].replace(/[^\d+]/g,'');
    const clean=digits.replace(/[^\d]/g,'');
    if(clean.length<9||clean.length>12)return null;
    return m[0].replace(/[\s-]/g,'');
  }
  function getEmail(t){const m=t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);return m?m[0]:null;}

  const NOT_NAMES=new Set(['chcem','chce','mám','mam','áno','ano','nie','intenzívne','intenzivne','menej','často','casto','drevo','sklo','laminát','laminat','online','dobierka','objednávka','objednavka','okrúhly','okruhly','obdĺžnik','obdlznik','pevnejšie','pevnejsie','lacnejšie','lacnejsie','vypočítaj','vypocitaj','iné','ine','ešte','este','či','ci','ako','aký','aka','aké','ake','ktoré','ktore','kde','kedy','prosím','prosim','ďakujem','dakujem','super','dobre','rozumiem','samozrejme','zaujíma','zaujima','ma','sám','sam','radšej','radsej','kontakt','telefonicky','aká','kolko','koľko','stojí','stoji','potrebujem','mám','môj','moj','stôl','stol','štvorec','stvorec','hrany','skrinka','kuchynská','kuchynska']);
  const ADDR_EXCLUDE=/^(?:🛒\s*)?Chcem objednať$|^(?:❓\s*)?Mám otázku$|^Drevo matné$|^Sklo\s*\/\s*lak\s*\/\s*lesk$|^Laminát$|^Intenzívne\s*\(kuchyňa\/deti\)$|^Menej často\s*\(pracovňa\/obývačka\)$|^1,5mm\s*—\s*lacnejšie$|^2mm\s*—\s*pevnejšie$|^Áno,\s*okrúhly$|^Nie,\s*obdĺžnik$|^Áno,\s*mám ešte$|^Nie,\s*to je všetko$|^(?:💳\s*)?Online\s*\(karta\)$|^(?:🚚\s*)?Dobierka$|^\d{2,3}[×x]\d{2,3}\s*cm$|^Iné rozmery$|^Mám otázku o produkte$/i;

  function normalizeAddressPart(t){
    return String(t||'')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,'')
      .replace(/(?:\+421[\s-]?|00421[\s-]?|0)[1-9]\d{1,2}[\s-]?\d{3}[\s-]?\d{2,3}/g,'')
      .replace(/^[,;\s]+|[,;\s]+$/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function looksLikeAddressPart(t){
    const v=String(t||'').trim();
    if(!v||ADDR_EXCLUDE.test(v))return false;
    if(getEmail(v)&&normalizeAddressPart(v).length<3)return false;
    if(/^[+\d\s-]{7,}$/.test(v))return false;
    if(/\d{2,3}\s*[xX×]\s*\d{2,3}/.test(v))return false;
    return /\d{3}\s?\d{2}|\b(ul\.?|ulica|nám\.?|námestie|cesta|trieda)\b/i.test(v)||/\d/.test(v);
  }

  function rememberAddressPart(t){
    const part=normalizeAddressPart(t);
    if(!part||part.length<3||ADDR_EXCLUDE.test(part))return;
    if(!looksLikeAddressPart(part))return;
    if(!ses.pendingAddressParts.includes(part))ses.pendingAddressParts.push(part);
    ses.address=ses.pendingAddressParts.join(', ');
  }

  function getAddressFromBot(t){
    const m=String(t||'').match(/Adresa:\s*([\s\S]*?)(?:\n\s*\n|Odkaz na platbu|Ozveme|$)/i);
    if(!m)return null;
    const addr=m[1].split('\n').map(x=>x.trim()).filter(Boolean).join(', ').replace(/^[,;\s]+|[,;\s]+$/g,'').trim();
    return addr||null;
  }

  function getNameFromAddressValue(addr){
    const raw=String(addr||'').trim();
    if(!raw)return null;
    let first=raw.split(',')[0]||'';
    first=first
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,' ')
      .replace(/(?:tel\.?|telefón|telefon|phone|č\.?\s*tel\.?)\s*[:.]?/ig,' ')
      .replace(/(?:\+421[\s-]?|00421[\s-]?|0)[1-9]\d{1,2}[\s-]?\d{3}[\s-]?\d{2,3}/g,' ')
      .replace(/\b(ul\.?|ulica|nám\.?|námestie|cesta|trieda)\b[\s\S]*$/i,' ')
      .replace(/\d{3}\s?\d{2}[\s\S]*$/,' ')
      .replace(/[^A-Za-zžźćąśęłóńŽŹĆĄŚĘŁÓŃáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ .'-]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
    const words=first.split(/\s+/).filter(Boolean).slice(0,3);
    if(words.length<2)return null;
    if(words.some(w=>w.length<2||NOT_NAMES.has(w.toLowerCase())||/mm|cm|€/i.test(w)))return null;
    const name=words.join(' ');
    return isBadName(name)?null:name;
  }

  function getNameFromBotAddress(t){return getNameFromAddressValue(getAddressFromBot(t));}

  function cleanMoney(v){return String(v||'').replace(/\s+/g,'').replace(',','.');}

  function getMoneyValuesFromLine(line){
    return [...String(line||'').matchAll(/([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)/gi)]
      .map(m=>parseFloat(cleanMoney(m[1])))
      .filter(n=>Number.isFinite(n));
  }

  function isProductLine(line){
    const l=String(line||'').trim();
    if(!/^[-—•▪■]/.test(l))return false;
    if(/doprava|spolu|cena skla|čas|adresa|odkaz|platb/i.test(l))return false;
    return /\d{2,4}\s*[xX×х]\s*\d{2,4}|kruh|obdĺžnik|štvorec|priemer|cm|mm|lesklé|ryhované/i.test(l)&&/€|eur/i.test(l);
  }

  function getProductLines(t){
    return String(t||'').split('\n').map(l=>l.trim()).filter(isProductLine);
  }

  function sumProductLines(t){
    const lines=getProductLines(t);
    let sum=0;
    for(const line of lines){
      const vals=getMoneyValuesFromLine(line);
      if(vals.length)sum+=vals[vals.length-1];
    }
    return sum>0?String(Math.round(sum*100)/100).replace('.00',''):null;
  }

  function getPrice(t){
    let m=String(t||'').match(/Cena\s+skla[:\s]+([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)/i);
    if(m)return cleanMoney(m[1]);
    m=String(t||'').match(/Cena\s+tovaru[:\s]+([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)/i);
    if(m)return cleanMoney(m[1]);
    const summed=sumProductLines(t);
    if(summed)return summed;
    return null;
  }

  function getTotal(t){
    const m=String(t||'').match(/Spolu[:\s]+([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)?/i);
    return m?cleanMoney(m[1]):null;
  }

  function getDelivery(t){
    const s=String(t||'');
    if(/Doprava\s+GLS[:\s]+(?:zadarmo|gratis|0)|Doprava[:\s]+(?:zadarmo|gratis)/i.test(s))return 'gratis';
    const m=s.match(/Doprava\s+GLS[:\s]+([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)/i)||s.match(/Doprava[:\s]+([\d\s]+(?:[,.]\d+)?)\s*(?:€|eur)/i);
    return m?cleanMoney(m[1]):null;
  }

  function getProduct(t){
    const productLines=getProductLines(t);
    return productLines.length?productLines.map(l=>l.replace(/^[-—•▪■]\s*/,'').trim()).join(' | '):null;
  }

  // ── FIX: визначення товщини з будь-якого тексту ────────────────────────────
  // Повертає 'ryhované 1,5mm' / 'lesklé 2mm' / 'lesklé 1,5mm' або null.
  function detectThickness(text){
    const s=String(text||'').toLowerCase();
    const ryf=/ryhované|ryhovany|ryhovan/.test(s);
    if(/2\s*mm|2mm|2\.0\s*mm|pevnejš/.test(s))return ryf?'ryhované 2mm':'lesklé 2mm';
    if(/1[\s.,]*5\s*mm|1\.5mm|1,5mm|lacnejš|tenš/.test(s))return ryf?'ryhované 1,5mm':'lesklé 1,5mm';
    if(ryf)return 'ryhované 1,5mm'; // ryhované je iba 1,5mm
    return null;
  }
  function captureThickness(text){
    const t=detectThickness(text);
    if(t)ses.thickness=t;
  }

  // ── FIX: fallback товару з усього діалогу (тільки повідомлення клієнта) ─────
  function getDimsFallback(){
    const userText=hist.filter(m=>m.role==='user').map(m=>m.content).join('\n');
    const found=[];
    const pushDim=(w,h)=>{
      w=parseInt(w,10);h=parseInt(h,10);
      if(!(w>=20&&w<=2000&&h>=20&&h<=2000))return;
      found.push(w+'×'+h+' cm');
    };
    // 1) з "cm": 120×80 cm, 81x40 cm
    for(const mm of userText.matchAll(/(\d{2,4})\s*[xX×х\/]\s*(\d{2,4})\s*cm/gi))pushDim(mm[1],mm[2]);
    // 2) БЕЗ "cm": 120x80, 120 × 80, 120/80, 120 na 80
    for(const mm of userText.matchAll(/(?:^|[^\d.,])(\d{2,4})\s*(?:[xX×х\/]|na)\s*(\d{2,4})(?![\d.,])/gi))pushDim(mm[1],mm[2]);
    // круги: kruh ⌀90, priemer 90 cm
    const circles=[...userText.matchAll(/(?:kruh|priemer|okr[úu]hl\w*)\s*[⌀]?\s*(\d{2,4})\s*cm?/gi)]
      .map(mm=>'kruh ⌀'+mm[1]+' cm');
    let all=[...new Set([...found,...circles])];
    if(ses.circleSize){
      const d=ses.circleSize;
      const idx=all.indexOf(d+'×'+d+' cm');
      if(idx>=0)all[idx]='kruh ⌀'+d+' cm';
      all=[...new Set(all)];
    }
    if(!all.length)return null;
    const th=ses.thickness?(', '+ses.thickness):'';
    return all.map(dim=>{
      if(dim.indexOf('kruh')===0||dim.indexOf('⌀')>=0){
        const d=(dim.match(/(\d{2,4})/)||[])[1]||'';
        return 'Kruh ⌀ '+d+' cm'+th;
      }
      return 'Obdĺžnik '+dim+th;
    }).join(' | ');
  }

  const BAD_NAME_RE=/\b(zaujíma\s+ma|hľadám|hladam|radšej\s+telefonicky|radsej\s+telefonicky|kontakt\s+telefonicky|telefonicky|st[ôo]l|stol|štvorec|stvorec|obdĺžnik|obdlznik|kruh|hrany|skrinka|skrinka|kuchynská|kuchynska|aká\s+je|aka\s+je|aká\s+cena|koľko\s+stojí|kolko\s+stoji|potrebujem|m[ôo]j\s+st[ôo]l|dobrý\s+deň|dobry\s+den|či\s+|to\s+je|nemám|nemam|čo\s+to|co\s+to|platb|doprav|adresa|rozmer|hrúbk|hrubk|produkt)\b/i;

  function titleCaseName(name){
    return String(name||'').split(/\s+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
  }

  function cleanFinalName(name){
    const n=String(name||'').trim().replace(/\s+/g,' ');
    if(!n||isBadName(n))return'';
    return titleCaseName(n);
  }

  function wantsPhoneContact(text){
    return/(zavolajte\s+mi|zatelefonujte|kontakt\s+telefonicky|radšej\s+telefonicky|radsej\s+telefonicky|prosím\s+o\s+kontakt|prosim\s+o\s+kontakt|ozvite\s+sa|telefonicky\s+objedna|cez\s+telefón|cez\s+telefon)/i.test(String(text||''));
  }

  function isBadName(n){
    const v=String(n||'').trim().toLowerCase();
    if(!v)return true;
    if(BAD_NAME_RE.test(v))return true;
    if(/[,@0-9]/.test(v))return true;
    const parts=v.split(/\s+/).filter(Boolean);
    if(parts.length<2||parts.length>3)return true;
    if(parts.some(p=>NOT_NAMES.has(p)||p.length<2||/mm|cm|€|eur/i.test(p)))return true;
    if(!/^[a-záäčďéíĺľňóôŕšťúýžA-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽąćęłńóśźż .'-]+$/i.test(v))return true;
    return false;
  }

  function cleanNameCandidate(t){
    let v=String(t||'')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,' ')
      .replace(/(?:tel\.?|telefón|telefon|phone|č\.?\s*tel\.?)\s*[:.]?/ig,' ')
      .replace(/(?:\+421[\s-]?|00421[\s-]?|0)[1-9]\d{1,2}[\s-]?\d{3}[\s-]?\d{2,3}/g,' ')
      .replace(/\b(ul\.?|ulica|nám\.?|námestie|cesta|trieda)\b[\s\S]*$/i,' ')
      .replace(/\d{3}\s?\d{2}[\s\S]*$/,' ')
      .split(',')[0]
      .replace(/^[,;:\s]+|[,;:\s]+$/g,'')
      .replace(/\s+/g,' ')
      .trim();
    return v;
  }

  function getName(t){
    const raw=String(t||'').trim();
    if(!raw||ADDR_EXCLUDE.test(raw))return null;
    const lastBot=hist.filter(m=>m.role==='assistant').slice(-1)[0]?.content||'';
    const botAskedShipping=/meno|priezvisko|údaje na doruč|dorucen|telefón|telefon|email|adresa/i.test(lastBot);
    const hasContactOrAddress=!!(getPhone(raw)||getEmail(raw)||/\d{3}\s?\d{2}|\b(ul\.?|ulica|nám\.?|námestie)\b/i.test(raw));
    if(!botAskedShipping&&!hasContactOrAddress&&!/(?:som|volám sa|volam sa|meno|priezvisko)[:\s]/i.test(raw))return null;
    let explicit=raw.match(/(?:som|volám sa|volam sa|meno(?:\s+a\s+priezvisko)?\s*:?)([A-Za-zžźćąśęłóńáäčďéíĺľňóôŕšťúýž .'-]+(?:\s+[A-Za-zžźćąśęłóńáäčďéíĺľňóôŕšťúýž .'-]+)?)/i);
    let candidate=explicit?explicit[1]:cleanNameCandidate(raw);
    const words=candidate.replace(/[^A-Za-zžźćąśęłóńáäčďéíĺľňóôŕšťúýž .'-]/g,' ').split(/\s+/).map(w=>w.trim()).filter(Boolean).slice(0,3);
    if(words.length<2)return null;
    if(words.some(w=>w.length<2||NOT_NAMES.has(w.toLowerCase())||/mm|cm|€/i.test(w)))return null;
    const name=words.join(' ');
    return isBadName(name)?null:name;
  }

  function getAddress(t){
    const raw=String(t||'').trim();
    if(!raw||ADDR_EXCLUDE.test(raw))return null;
    const withoutContact=normalizeAddressPart(raw);
    if(/\d{3}\s?\d{2}/.test(raw)){rememberAddressPart(withoutContact||raw);return ses.address||withoutContact||raw;}
    if(/\b(ul\.?|ulica|nám\.?|námestie|cesta|trieda)\b/i.test(raw)){rememberAddressPart(withoutContact||raw);return ses.address||withoutContact||raw;}
    const lastBot=hist.filter(m=>m.role==='assistant').slice(-1)[0]?.content||'';
    const botAskedAddress=/adresa|ulica|mesto|psč|psc|údaje na doruč|dorucen/i.test(lastBot);
    if(botAskedAddress&&looksLikeAddressPart(raw)){rememberAddressPart(withoutContact||raw);return ses.address||withoutContact||raw;}
    const hasContact=getEmail(raw)||getPhone(raw);
    if(hasContact&&withoutContact&&withoutContact.length>3&&!ADDR_EXCLUDE.test(withoutContact)){rememberAddressPart(withoutContact);return ses.address||withoutContact;}
    return null;
  }

  function buildSummary(){return hist.filter(m=>m.role==='user').slice(-4).map(m=>m.content.slice(0,80)).join(' | ');}
  function buildFullChat(){return hist.map(m=>(m.role==='user'?'👤 ':'🤖 ')+m.content).join('\n---\n');}

  function formatProductForTG(){
    const src=ses.product||getDimsFallback();
    if(!src)return'upresňuje sa';
    const lines=src.split('|').map(p=>p.trim()).filter(Boolean);
    return lines.map(p=>{
      const isCircle=p.includes('kruh')||p.includes('⌀');
      const icon=isCircle?'⭕':'▪️';
      const hasQty=/×\d+|x\d+|\d+\s*ks/.test(p);
      return icon+' '+p+(hasQty?'':' (×1)');
    }).join('\n');
  }

  function buildLeadData(extra={}){
    const utm=getUTM();
    const pNum=parseFloat(ses.price)||0;
    // FIX: doprava VŽDY z hodnoty skla, NIKDY z toho čo napísal bot.
    // Zadarmo iba ak sklo >= 120 €, inak 9 €. Spolu = sklo + doprava.
    let delivery;
    let total;
    if(pNum>0){
      delivery=pNum>=120?'gratis':'9';
      total=String(delivery==='gratis'?pNum:pNum+9);
    }else{
      delivery=ses.delivery||'9';
      total=ses.total||'';
    }
    if(delivery)ses.delivery=delivery;
    if(total)ses.total=String(total);
    const derivedName=(!ses.name||isBadName(ses.name))?getNameFromAddressValue(ses.address):null;
    if(derivedName)ses.name=derivedName;
    if(ses.name&&isBadName(ses.name))ses.name='';
    const finalName=cleanFinalName(ses.name);
    return{
      session_id:SID,
      request_type:ses.phoneRequest?'phone_request':'',
      name:finalName,
      phone:ses.phone||'',
      email:ses.email||'',
      contact:ses.contact||'',
      product:ses.product||getDimsFallback()||(ses.phoneRequest?'Žiadosť o telefonický kontakt':''),
      product_formatted:ses.phoneRequest&&!ses.product?'📞 Žiadosť o telefonický kontakt':formatProductForTG(),
      price:ses.price||'',
      delivery,
      total:ses.total||'',
      address:ses.address||'',
      payment_method:ses.paymentMethod||'',
      stripe_url:ses.stripeUrl||'',
      summary:buildSummary(),
      full_chat:buildFullChat(),
      utm_source:utm.source,
      utm_medium:utm.medium,
      utm_campaign:utm.campaign,
      messages:hist,
      ...extra,
    };
  }

  async function fireLead(extra={}){
    if(ses.leadFired)return;
    if(!ses.phone&&!ses.email&&!ses.contact)return;
    try{
      const payload=buildLeadData(extra);
      const res=await fetch(WORKER_URL+'/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      let data={};
      try{data=await res.json();}catch(_){}
      if(res.ok&&data.ok!==false){ses.leadFired=true;}
      else{console.error('[MK] Lead failed:',data.error||res.status);}
    }catch(e){console.error('[MK] Lead error:',e);}
  }

  async function fireUpdate(changeType,extra={}){
    try{
      await fetch(WORKER_URL+'/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...buildLeadData(),...extra,change_type:changeType})});
    }catch(e){console.error('[MK] Update error:',e);}
  }

  function hasContactData(){return!!(ses.phone||ses.email||ses.contact);}

  function clearSessionTimer(){if(ses._saveTimer){clearTimeout(ses._saveTimer);ses._saveTimer=null;}}

  async function saveSessionNow(reason='session'){
    if(!hist.length)return;
    try{
      await fetch(WORKER_URL+'/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildLeadData({save_reason:reason,sheet_action:'upsert_by_session_id',session_saved_before:ses.sessionSavedOnce?'yes':'no'}))});
      ses.sessionSavedOnce=true;
    }catch(e){console.error('[MK] Session save error:',e);}
  }

  function scheduleSessionSave(reason='idle_no_contact'){
    clearSessionTimer();
    if(hasContactData())return;
    ses._saveTimer=setTimeout(()=>{if(!hasContactData())saveSessionNow(reason);},60000);
  }

  function savePostPaymentUpdate(reason='post_payment_update'){
    if(!ses.paymentLinkSent)return;
    saveSessionNow(reason);
  }

  // ── Warm lead: email є, ціна відома, замовлення не завершене ────────────────
  async function scheduleWarmLead(){
    if(ses._warmLeadSent)return;
    if(!ses.email&&!ses.contact)return;
    if(!ses.price)return;
    if(ses.paymentLinkSent)return;
    ses._warmLeadSent=true;
    try{
      await fetch(WORKER_URL+'/warm-lead',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(buildLeadData({warm_captured_at:Date.now()})),
      });
    }catch(e){console.error('[MK] Warm lead error:',e);}
  }

  async function sendLeadWithStripe(stripeUrl){
    ses.stripeUrl=stripeUrl;
    if(ses.leadFired){
      await fetch(WORKER_URL+'/session',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(buildLeadData({save_reason:'stripe_url_update',stripe_url:stripeUrl,payment_method:'stripe',sheet_action:'upsert_by_session_id'})),
      });
    } else {
      await fireLead();
    }
  }

  async function generateStripe(){
    try{
      const lastBot=hist.filter(m=>m.role==='assistant').slice(-1)[0]?.content||'';
      const pNum=parseFloat(ses.price)||0;
      const parsedTotal=getTotal(lastBot);
      // FIX: deterministická doprava a suma — neveríme "zadarmo/Spolu" z bota.
      // Zadarmo iba ak sklo >= 120 €, inak pripočítaj 9 € k sume v Stripe.
      const deliveryVal=pNum>0?(pNum>=120?'gratis':'9'):(ses.delivery||'9');
      ses.delivery=deliveryVal;
      const finalTotal=pNum>0
        ? String(deliveryVal==='gratis'?pNum:pNum+9)
        : (ses.total||parsedTotal||'');
      ses.total=String(finalTotal);
      const paymentPayload=buildLeadData({product:ses.product||getDimsFallback()||'Mäkké sklo',product_formatted:formatProductForTG(),total:finalTotal,payment_method:'stripe',contact:ses.email||ses.phone||ses.contact||''});
      showPaymentLoading(finalTotal);
      const res=await fetch(WORKER_URL+'/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(paymentPayload)});
      const d=await res.json();
      if(d.ok&&d.url){
        ses.stripeUrl=d.url;
        ses.stripeSessionId=d.session_id||'';
        const shownTotal=(d.amount!=null?d.amount:finalTotal);
        showPayBtn(d.url,shownTotal);
        await sendLeadWithStripe(d.url);
      }else{
        clearPaymentUi();
        console.error('[MK] Stripe:',d.error);
        addBot('Problém s online platbou. Napíšte nám prosím na info@makkesklo.shop a pomôžeme.');
      }
    }catch(e){clearPaymentUi();console.error('[MK] Stripe error:',e);}
  }

  async function send(quickText){
    const ta=el('sg-ta');
    const text=(quickText||ta.value).trim();
    if(!text||busy)return;
    if(!quickText){ta.value='';ta.style.height='auto';}
    busy=true;lock(true);
    clearSessionTimer();
    addUser(text);showTyping();

    if(wantsPhoneContact(text))ses.phoneRequest=true;
    if(/dobierk|pri prevzatí|pri prevzati|pri doruč|pri doruc|hotovost|hotovosť|na dobierku/i.test(text))ses.paymentMethod='cod';
    if(/online|karta|kartou|prevod|zaplat/i.test(text))ses.paymentMethod='stripe';

    if(/áno.*okr[úu]hl|okr[úu]hl.*áno|ano.*okruhl|okruhl.*ano/i.test(text)||text==='Áno, okrúhly'){
      const allText=hist.map(m=>m.content).join(' ');
      const sameDims=[...allText.matchAll(/(\d{2,3})\s*[xX×]\s*(\d{2,3})\s*cm/g)].filter(m=>m[1]===m[2]);
      if(sameDims.length>0){
        const d=sameDims[sameDims.length-1][1];
        ses.circleSize=d;
        if(ses.product)ses.product=ses.product.replace(new RegExp(d+'[×x]'+d+'\\s*cm'),'kruh ⌀'+d+' cm');
        else ses.product='kruh ⌀'+d+' cm';
      }
    }

    if(ses.paymentLinkSent&&ses.paymentMethod!=='cod'&&/dobierk|zmeni.*platb|cod|na dobierku/i.test(text)){
      ses.paymentMethod='cod';
      const pNum=parseFloat(ses.price)||0;
      const deliveryVal=pNum>0?(pNum>=120?'gratis':'9'):(ses.delivery||'9');
      const total=pNum>0?String(deliveryVal==='gratis'?pNum:pNum+9):(ses.total||'');
      ses.delivery=deliveryVal;ses.total=String(total);
      showCOD(total);
      if(ses.leadFired){await fireUpdate('payment_changed_to_cod',{payment_method:'cod',total});}
      else{await fireLead();}
      savePostPaymentUpdate('payment_changed_to_cod');
      busy=false;lock(false);el('sg-ta').focus();return;
    }

    const phone=getPhone(text),email=getEmail(text),name=getName(text),addr=getAddress(text);
    captureThickness(text);
    if(phone&&!ses.phone)ses.phone=phone;
    if(email&&!ses.email)ses.email=email;
    if(name&&(!ses.name||isBadName(ses.name)))ses.name=name;
    if(addr)ses.address=addr;
    if((phone||email)&&!ses.contact)ses.contact=phone||email;

    hist.push({role:'user',content:text});

    if(ses.phoneRequest&&(ses.phone||ses.contact)&&!ses.leadFired){
      if(!ses.product)ses.product='Žiadosť o telefonický kontakt';
      await fireLead({status:'phone_request',request_type:'phone_request'});
    }

    if(!hasContactData()){scheduleSessionSave('idle_no_contact_after_user');}
    else if(ses.paymentLinkSent){savePostPaymentUpdate('post_payment_user_message');}

    try{
      const res=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})});
      const data=await res.json();
      const reply=data.content?.[0]?.text||'Prepáčte, skúste znova.';
      hist.push({role:'assistant',content:reply});

      const price=getPrice(reply),totalParsed=getTotal(reply),deliveryParsed=getDelivery(reply),product=getProduct(reply),addrBot=getAddressFromBot(reply),nameAddr=getNameFromBotAddress(reply);
      captureThickness(reply);
      if(price)ses.price=price;
      if(totalParsed)ses.total=totalParsed;
      if(deliveryParsed)ses.delivery=deliveryParsed;
      if(product)ses.product=product;
      if(addrBot)ses.address=addrBot;
      if(nameAddr&&(!ses.name||isBadName(ses.name)))ses.name=nameAddr;
      if(/telefonicky|ozveme sa|zavoláme|číslo telefónu/i.test(reply))ses.phoneRequest=true;
      if(/na dobierku|dobierka|pri prevzatí|pri prevzati|pri doruč/i.test(reply))ses.paymentMethod='cod';
      if(/odkaz na platbu sa zobraz|online kartou|kartou|platba kartou/i.test(reply)&&ses.paymentMethod!=='cod')ses.paymentMethod='stripe';

      addBot(reply);addTime();detectQR(reply);

      if(ses.email&&ses.price&&!ses.paymentLinkSent&&!ses._warmLeadSent){
        scheduleWarmLead();
      }

      if(!hasContactData()){scheduleSessionSave('idle_no_contact_after_bot');}
      else if(ses.paymentLinkSent){savePostPaymentUpdate('post_payment_bot_reply');}

      const isConfirm=/prijala som objednávku|prijala som objednavku|zobrazí sa o chvíľu|spolu[:\s]/i.test(reply);
      if(isConfirm&&(ses.phone||ses.email)&&!ses.paymentLinkSent){
        ses.paymentLinkSent=true;
        if(ses.paymentMethod==='cod'){
          const pNum=parseFloat(ses.price)||0;
          const deliveryVal=pNum>0?(pNum>=120?'gratis':'9'):(ses.delivery||'9');
          const total=pNum>0?String(deliveryVal==='gratis'?pNum:pNum+9):(ses.total||'');
          ses.delivery=deliveryVal;ses.total=String(total);
          showCOD(total);
          fireLead();
        }else{
          generateStripe();
        }
      }
    }catch(e){
      el('sg-log').querySelector('.sg-typing')?.remove();
      addBot('Žiadne pripojenie. Prosím obnovte stránku.');
      if(!hasContactData())scheduleSessionSave('idle_error_no_contact');
      else if(ses.paymentLinkSent)savePostPaymentUpdate('post_payment_error');
    }finally{
      busy=false;lock(false);el('sg-ta').focus();
    }
  }

  function autoOpen(){
    if(sessionStorage.getItem('mk_auto_done')||sessionStorage.getItem('mk_auto_block'))return;

    // Tooltip po 5 sek
    setTimeout(()=>{
      if(!open&&!sessionStorage.getItem('mk_auto_block')){
        const t=el('sg-tooltip');
        if(t)t.style.display='block';
      }
    },5000);

    // Auto-open po 30 sek
    setTimeout(()=>{
      if(!open&&!sessionStorage.getItem('mk_auto_block')){
        sessionStorage.setItem('mk_auto_done','1');
        openChat();
      }
    },30000);
  }

  function init(){
    build();
    el('sg-btn').addEventListener('click',()=>{sessionStorage.setItem('mk_auto_block','1');open?closeChat():openChat();});
    el('sg-x').addEventListener('click',closeChat);
    el('sg-go').addEventListener('click',()=>send());
    el('sg-tooltip').addEventListener('click',()=>{sessionStorage.setItem('mk_auto_block','1');openChat();});
    el('sg-ta').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
    el('sg-ta').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px';});
    autoOpen();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();

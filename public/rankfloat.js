// Bảng xếp hạng nổi luôn hiển thị + chế độ Picture-in-Picture (PiP).
// Ưu tiên Document PiP (Chrome/Edge 116+): cửa sổ nổi có thể cộng/trừ điểm.
// Dự phòng: vẽ bảng lên canvas và phát qua video PiP (Safari...), chỉ xem.
(function(){
  const PREF_KEY='soi-noi-float-v1';
  let prefs={x:null,y:null,min:false};
  try{Object.assign(prefs,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'));}catch(e){}
  const savePrefs=()=>{try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch(e){}};

  const panel=document.getElementById('floatRank');
  const body=panel.querySelector('.fr-body');
  const peek=panel.querySelector('.fr-peek');
  const pipBtn=panel.querySelector('[data-fr="pip"]');
  const minBtn=panel.querySelector('[data-fr="min"]');
  let pipWin=null, videoPip=null, lastScores=new Map();

  const canDocPip='documentPictureInPicture' in window;
  const canVideoPip=!!(document.pictureInPictureEnabled&&HTMLCanvasElement.prototype.captureStream);
  if(!canDocPip&&!canVideoPip){pipBtn.hidden=true;}

  function standings(){
    const s=current();
    const sorted=[...s.students].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'vi'));
    const hasPoints=s.events.length>0;
    return {s,hasPoints,rows:sorted.map(p=>({p,rank:hasPoints?sorted.findIndex(x=>x.score===p.score)+1:null}))};
  }

  function html(withButtons){
    const {s,rows}=standings();
    const sub=`<div class="fr-sub">${esc(s.className)} · ${esc(s.title)}</div>`;
    if(!rows.length)return sub+'<div class="fr-empty">Chưa có học sinh.<br>Nhập danh sách ở mục “Học sinh &amp; điểm”.</div>';
    return sub+'<ol class="fr-list">'+rows.map(({p,rank})=>{
      const changed=lastScores.has(p.id)&&lastScores.get(p.id)!==p.score;
      return `<li class="fr-row${rank&&rank<=3&&p.score>0?' top'+rank:''}${changed?' fr-bump':''}"><span class="fr-rank">${rank??'—'}</span><span class="fr-name" title="${esc(p.name)}">${esc(p.name)}</span><span class="fr-score">${p.score}</span>${withButtons?`<span class="fr-btns"><button data-id="${p.id}" data-d="-1" aria-label="Trừ điểm ${esc(p.name)}">−</button><button data-id="${p.id}" data-d="1" aria-label="Cộng điểm ${esc(p.name)}">+</button></span>`:''}</li>`;
    }).join('')+'</ol>';
  }

  function peekText(){
    const {rows,hasPoints}=standings();
    if(!rows.length)return 'Bảng xếp hạng';
    if(!hasPoints)return `Bảng xếp hạng · ${rows.length} HS`;
    const top=rows.filter(r=>r.rank===1).map(r=>r.p.name.split(' ').slice(-1)[0]);
    return `♛ ${top.slice(0,2).join(', ')}${top.length>2?'…':''} · ${rows[0].p.score}đ`;
  }

  function update(){
    if(typeof current!=='function')return;
    body.innerHTML=html(true);
    peek.textContent=peekText();
    if(pipWin)pipWin.document.getElementById('pipBody').innerHTML=html(true);
    if(videoPip)drawCanvas();
    lastScores=new Map(current().students.map(p=>[p.id,p.score]));
  }

  function onScoreClick(e){
    const b=e.target.closest('[data-d]');
    if(b)score(b.dataset.id,Number(b.dataset.d)*Number(document.getElementById('step').value||1));
  }
  body.addEventListener('click',onScoreClick);

  // ----- Thu gọn / mở rộng -----
  function setMin(v){prefs.min=v;panel.classList.toggle('is-min',v);minBtn.textContent=v?'▢':'–';minBtn.title=minBtn.ariaLabel=v?'Mở rộng bảng xếp hạng':'Thu gọn bảng xếp hạng';savePrefs();clamp();}
  minBtn.onclick=()=>setMin(!prefs.min);
  peek.onclick=()=>setMin(false);

  // ----- Kéo thả -----
  function place(x,y){panel.style.left=x+'px';panel.style.top=y+'px';panel.style.right='auto';panel.style.bottom='auto';}
  function clamp(){
    if(prefs.x==null)return;
    if(innerWidth<=520){panel.removeAttribute('style');return;}
    const r=panel.getBoundingClientRect();
    prefs.x=Math.max(8,Math.min(prefs.x,innerWidth-r.width-8));
    prefs.y=Math.max(8,Math.min(prefs.y,innerHeight-r.height-8));
    place(prefs.x,prefs.y);
  }
  const head=panel.querySelector('.fr-head');
  head.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    const r=panel.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    head.setPointerCapture(e.pointerId);panel.classList.add('is-drag');
    const move=ev=>{prefs.x=ev.clientX-dx;prefs.y=ev.clientY-dy;clamp();};
    const up=()=>{head.removeEventListener('pointermove',move);head.removeEventListener('pointerup',up);head.removeEventListener('pointercancel',up);panel.classList.remove('is-drag');savePrefs();};
    head.addEventListener('pointermove',move);head.addEventListener('pointerup',up);head.addEventListener('pointercancel',up);
  });
  head.addEventListener('dblclick',e=>{if(!e.target.closest('button')){prefs.x=prefs.y=null;panel.removeAttribute('style');savePrefs();}});
  addEventListener('resize',clamp);

  // ----- PiP -----
  function setPipState(on){
    panel.classList.toggle('is-pip',on);
    pipBtn.textContent=on?'⧉ Đóng PiP':'⧉ PiP';
    pipBtn.title=on?'Đóng cửa sổ nổi':'Mở cửa sổ nổi (PiP) – vẫn thấy khi chuyển sang ứng dụng khác';
    pipBtn.setAttribute('aria-pressed',on);
  }

  async function openDocPip(){
    pipWin=await documentPictureInPicture.requestWindow({width:320,height:Math.min(560,140+current().students.length*40)});
    const d=pipWin.document;
    d.documentElement.lang='vi';
    d.title='Bảng xếp hạng';
    for(const href of['https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap',new URL('rankfloat.css',location.href).href]){
      const l=d.createElement('link');l.rel='stylesheet';l.href=href;d.head.append(l);
    }
    d.body.className='fr-pipdoc';
    d.body.innerHTML='<header class="fr-head"><span class="fr-title">🏆 Bảng xếp hạng</span><span class="fr-live">● TRỰC TIẾP</span></header><div class="fr-body" id="pipBody"></div>';
    d.getElementById('pipBody').addEventListener('click',onScoreClick);
    pipWin.addEventListener('pagehide',()=>{pipWin=null;setPipState(false);});
    setPipState(true);update();
  }

  // Dự phòng: canvas -> video PiP
  const canvas=document.createElement('canvas');canvas.width=360;canvas.height=480;
  function drawCanvas(){
    const ctx=canvas.getContext('2d'),{s,rows}=standings(),W=canvas.width,H=canvas.height,F='"Be Vietnam Pro",system-ui,sans-serif';
    ctx.fillStyle='#f7f8f3';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#227454';ctx.fillRect(0,0,W,62);
    ctx.fillStyle='#fff';ctx.font=`700 19px ${F}`;ctx.fillText('🏆 Bảng xếp hạng',16,30);
    ctx.font=`500 12px ${F}`;ctx.fillStyle='#d5eadf';ctx.fillText(`${s.className} · ${s.title}`.slice(0,48),16,50);
    const max=Math.floor((H-74)/36);
    rows.slice(0,max).forEach(({p,rank},i)=>{
      const y=74+i*36;
      ctx.fillStyle=p.score<=0?'#fff':rank===1?'#fbf1d3':rank===2?'#eef1f3':rank===3?'#f8e9de':'#fff';
      ctx.beginPath();ctx.roundRect?ctx.roundRect(10,y,W-20,30,8):ctx.rect(10,y,W-20,30);ctx.fill();
      ctx.fillStyle='#7d8f73';ctx.font=`700 13px ${F}`;ctx.fillText(rank??'—',22,y+20);
      ctx.fillStyle='#26382f';ctx.font=`600 14px ${F}`;
      let name=p.name;while(ctx.measureText(name).width>W-130&&name.length>3)name=name.slice(0,-2);
      ctx.fillText(name===p.name?name:name+'…',52,y+20);
      ctx.fillStyle='#227454';ctx.font=`800 15px ${F}`;ctx.textAlign='right';ctx.fillText(p.score,W-22,y+20);ctx.textAlign='left';
    });
    if(!rows.length){ctx.fillStyle='#829083';ctx.font=`500 13px ${F}`;ctx.fillText('Chưa có học sinh.',16,100);}
    if(rows.length>max){ctx.fillStyle='#829083';ctx.font=`500 11px ${F}`;ctx.fillText(`+${rows.length-max} học sinh khác`,16,H-8);}
  }
  async function openVideoPip(){
    drawCanvas();
    const v=document.createElement('video');
    v.muted=true;v.playsInline=true;v.className='fr-video';
    v.srcObject=canvas.captureStream(4);
    document.body.append(v);
    await v.play();
    await v.requestPictureInPicture();
    const tick=setInterval(drawCanvas,1000);
    videoPip={v,tick};setPipState(true);
    v.addEventListener('leavepictureinpicture',()=>{clearInterval(tick);v.srcObject.getTracks().forEach(t=>t.stop());v.remove();videoPip=null;setPipState(false);},{once:true});
  }

  pipBtn.onclick=async()=>{
    try{
      if(pipWin){pipWin.close();return;}
      if(videoPip){await document.exitPictureInPicture();return;}
      if(canDocPip)await openDocPip();else await openVideoPip();
    }catch(e){toast('Không mở được cửa sổ PiP. Hãy dùng Chrome hoặc Edge bản mới.');}
  };

  setPipState(false);
  if(prefs.x!=null)requestAnimationFrame(clamp);
  setMin(!!prefs.min);
  window.FloatRank={update};
  update();
})();

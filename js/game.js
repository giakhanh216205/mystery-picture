(function(){
const PAINTING = "images/painting.jpg";
const TILES = [
  {type:"q", hint:"Fabric", answer:"SILK", vi:"",
   q:"What is the soft, smooth, and shiny material, traditionally woven in famous craft villages such as Van Phuc (Ha Dong), and commonly used to create elegant, flowing garments?"},
  {type:"q", hint:"Flower", answer:"LOTUS", vi:"",
   q:"Which flower symbolizes purity and elegance in Vietnamese culture and is often used as an embroidered pattern on traditional clothing?"},
  {type:"q", hint:"Traditional Accessory", answer:"CONICALHAT", vi:"(Nón lá)",
   q:"What is the traditional cone-shaped object made of palm leaves, used to protect people from the sun and rain, and often associated with Vietnamese women in the past?"},
  {type:"q", hint:"Nguyễn Dynasty Costume", answer:"FIVEPANELGOWN", vi:"(Áo ngũ thân)",
   q:"What is the traditional Vietnamese garment consisting of five panels, fastened with buttons on the right side, and commonly worn by both men and women during the Nguyễn Dynasty?"},
  {type:"lucky", answer:"LUCKYNUMBER"},
  {type:"q", hint:"Famous Painting", answer:"YOUNGWOMANWITHLILIES", vi:"(Thiếu nữ bên hoa huệ)", img:PAINTING,
   q:"What is the name of this famous painting by Vietnamese artist Tô Ngọc Vân?"},
  {type:"lucky", answer:"LUCKYNUMBER"}
];
const N = TILES.length;
const $ = id => document.getElementById(id);

// ---------- state ----------
let opened = new Set();
let cur = -1, phase = "";
const hot = window.claude && window.claude.hot;
function save(){ try{ localStorage.setItem("mp-opened", JSON.stringify([...opened])); }catch(e){} }
function load(data){
  let arr = (data && data.opened) || null;
  if(!arr){ try{ arr = JSON.parse(localStorage.getItem("mp-opened") || "null"); }catch(e){ arr = null; } }
  if(Array.isArray(arr)) opened = new Set(arr.filter(n => n >= 0 && n < N));
}
if(hot && hot.snapshot) hot.snapshot(() => ({opened:[...opened], started: $("start").hidden}));

// ---------- sound ----------
let ac = null, soundOn = true;
function ctx(){ if(!ac){ try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(ac && ac.state==="suspended") ac.resume(); return ac; }
function tone(f, len, vol, type, when){
  if(!soundOn) return; const a = ctx(); if(!a) return;
  const t = a.currentTime + (when||0), o = a.createOscillator(), g = a.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+len);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t+len+0.05);
}
const sfx = {
  tick(){ tone(900,.07,.12); },
  beep(){ tone(1320,.2,.3); },
  buzz(){ tone(196,.9,.25,"square"); tone(233,.9,.15,"sawtooth"); },
  correct(){ [523,659,784,1047].forEach((f,i)=>tone(f,.35,.22,"triangle",i*.09)); },
  open(){ tone(330,.25,.15,"triangle"); tone(495,.3,.15,"triangle",.12); },
  fanfare(){ [523,523,523,698,880,1047].forEach((f,i)=>tone(f,i<3?.16:.5,.22,"triangle",[0,.15,.3,.48,.72,.96][i])); },
  click(){ tone(600,.05,.08); }
};

// ---------- board ----------
function boxesHTML(word, filled){
  return [...word].map(ch => `<div class="box">${filled?`<span>${ch}</span>`:""}</div>`).join("");
}
function renderBoard(){
  const rows = $("rows"); rows.innerHTML = "";
  TILES.forEach((t,i) => {
    const done = opened.has(i);
    const b = document.createElement("button");
    b.type = "button"; b.className = "row" + (done?" done":"");
    b.setAttribute("aria-label", done ? `Tile ${i+1}: ${t.answer}` : `Open tile ${i+1}`);
    b.innerHTML = `<span class="num">${i+1}</span><span class="boxes" style="--n:${t.answer.length}">${boxesHTML(t.answer, done)}</span><span class="count">${t.answer.length}</span>`;
    if(!done) b.addEventListener("click", () => openTile(i));
    rows.appendChild(b);
  });
  const g = $("grid");
  if(!g.children.length){
    for(let i=0;i<N;i++){
      const tb = document.createElement("button");
      tb.type="button"; tb.className = `tile t${i+1}`; tb.dataset.i = i;
      tb.setAttribute("aria-label", `Open tile ${i+1}`);
      tb.innerHTML = `<span class="face">${i+1}</span>`;
      tb.addEventListener("click", () => openTile(i));
      g.appendChild(tb);
    }
  }
  [...g.children].forEach((tb,i) => tb.classList.toggle("open", opened.has(i)));
  const left = N - opened.size;
  $("picmsg").textContent = left === N ? "Pick any tile to begin!" : left === 0 ? "All tiles open! What is our topic?" : `${left} tile${left>1?"s":""} left · guess anytime!`;
}

// ---------- timer ----------
const C = 2*Math.PI*44;
$("bar").style.strokeDasharray = C;
let tDur = 15, tLeft = 15, tRun = false, tLast = 0, tRaf = 0, tLastSec = 15, tDone = false;
function drawTimer(){
  const frac = Math.max(0, tLeft / tDur);
  $("bar").style.strokeDashoffset = C * (1 - frac);
  const ring = $("ring");
  if(tDone){ ring.classList.add("up"); ring.classList.remove("urgent"); $("sec").textContent = "TIME'S UP!"; $("unit").textContent = ""; return; }
  ring.classList.remove("up");
  ring.classList.toggle("urgent", tLeft <= 5 && tLeft > 0);
  $("sec").textContent = Math.ceil(tLeft - 1e-6);
  $("unit").textContent = tRun ? "SECONDS" : (tLeft === tDur ? "TAP TO START" : "PAUSED");
}
function loop(now){
  if(!tRun) return;
  const dt = (now - tLast)/1000; tLast = now;
  tLeft = Math.max(0, tLeft - dt);
  const s = Math.ceil(tLeft - 1e-6);
  if(s !== tLastSec){ tLastSec = s; if(s > 0){ s <= 5 ? sfx.beep() : sfx.tick(); } }
  if(tLeft <= 0){ tRun = false; tDone = true; sfx.buzz(); $("tPause").textContent = "START"; drawTimer(); return; }
  drawTimer(); tRaf = requestAnimationFrame(loop);
}
function tStart(){ if(tDone) return; tRun = true; tLast = performance.now(); $("tPause").textContent = "PAUSE"; drawTimer(); cancelAnimationFrame(tRaf); tRaf = requestAnimationFrame(loop); }
function tStop(){ tRun = false; cancelAnimationFrame(tRaf); $("tPause").textContent = "START"; drawTimer(); }
function tReset(auto){ tStop(); tDur = +$("dur").value; tLeft = tDur; tLastSec = tDur; tDone = false; drawTimer(); if(auto) tStart(); }
$("ring").addEventListener("click", () => { if(tDone) return tReset(true); tRun ? tStop() : tStart(); });
$("tPause").addEventListener("click", () => { if(tDone) return tReset(true); tRun ? tStop() : tStart(); });
$("tRestart").addEventListener("click", () => tReset(true));

// ---------- question flow ----------
function showScreen(id){ ["start","qs","ls","fsn"].forEach(s => $(s).hidden = (s !== id)); }
function openTile(i){
  if(opened.has(i)) return;
  ctx(); sfx.click(); cur = i;
  const t = TILES[i];
  if(t.type === "lucky"){
    $("lnum").textContent = i+1; $("lOpen").textContent = `OPEN TILE ${i+1}`;
    showScreen("ls"); phase = "lucky"; sfx.fanfare(); confetti(2600);
    return;
  }
  phase = "question";
  $("qnum").textContent = i+1; $("qeye").textContent = `TILE ${i+1} OF ${N}`; $("qhint").textContent = `Hint: ${t.hint}`;
  $("qcard").innerHTML = (t.img ? `<img src="${t.img}" alt="The painting for question ${i+1}">` : "") + `<p>${t.q}</p>`;
  const ab = $("abox"); ab.style.setProperty("--n", t.answer.length); ab.innerHTML = [...t.answer].map(() => `<div class="box"></div>`).join("");
  $("alab").textContent = `THE ANSWER HAS ${t.answer.length} LETTERS`; $("alab").classList.remove("ok");
  $("avi").textContent = "";
  $("timerBox").hidden = false; $("openedBox").hidden = true;
  $("qmsg").textContent = "Raise your hand to answer!";
  $("qNext").textContent = "SHOW ANSWER";
  showScreen("qs");
  tReset(true);
}
function showAnswer(){
  const t = TILES[cur]; phase = "answer"; tStop();
  const boxes = $("abox").children;
  [...t.answer].forEach((ch,k) => { const b = boxes[k]; b.innerHTML = `<span>${ch}</span>`; b.style.animationDelay = (k*0.06)+"s"; b.classList.add("flip","filled"); });
  $("alab").textContent = "CORRECT ANSWER"; $("alab").classList.add("ok");
  $("avi").textContent = t.vi || "";
  $("timerBox").hidden = true; $("openedBox").hidden = false; $("openedNum").textContent = cur+1;
  $("qmsg").textContent = "Now let's open the picture!";
  $("qNext").textContent = `OPEN TILE ${cur+1}`;
  sfx.correct();
}
function commitOpen(){
  const i = cur; tStop();
  opened.add(i); save(); showScreen(null); phase = ""; cur = -1;
  // render rows now, flip the tile a beat later so the class change animates
  const g = $("grid"); renderBoard(); const tb = g.children[i];
  tb.classList.remove("open"); void tb.offsetWidth;
  requestAnimationFrame(() => { tb.classList.add("open"); sfx.open(); });
}
function backToBoard(){ tStop(); showScreen(null); phase = ""; cur = -1; }
$("qNext").addEventListener("click", () => phase === "question" ? showAnswer() : commitOpen());
$("qBack").addEventListener("click", backToBoard);
$("lOpen").addEventListener("click", commitOpen);

// ---------- final ----------
function reveal(){
  tStop(); phase = "final";
  const k = $("kfinal"); k.innerHTML = "";
  ["Á","O"," ","D","À","I"].forEach((ch,idx) => { const el = document.createElement("i"); if(ch === " "){ el.className = "sp"; } else { el.textContent = ch; el.style.animationDelay = (0.25 + idx*0.18)+"s"; } k.appendChild(el); });
  showScreen("fsn"); sfx.fanfare(); setTimeout(() => confetti(3200), 900);
}
$("revealBtn").addEventListener("click", () => { ctx(); reveal(); });
$("fConf").addEventListener("click", () => { sfx.fanfare(); confetti(3000); });
$("fBack").addEventListener("click", backToBoard);

// ---------- tools ----------
$("go").addEventListener("click", () => { ctx(); sfx.click(); showScreen(null); });
$("snd").addEventListener("click", () => { soundOn = !soundOn; const b = $("snd"); b.textContent = soundOn ? "SOUND ON" : "SOUND OFF"; b.classList.toggle("on", soundOn); b.setAttribute("aria-pressed", soundOn); if(soundOn){ ctx(); sfx.click(); } });
$("fs").addEventListener("click", () => {
  const d = document;
  try{ if(!d.fullscreenElement){ const p = d.documentElement.requestFullscreen && d.documentElement.requestFullscreen(); if(p && p.catch) p.catch(()=>{}); } else { d.exitFullscreen && d.exitFullscreen(); } }catch(e){}
});
$("dur").addEventListener("change", () => { if(phase === "question") tReset(false); });
$("reset").addEventListener("click", () => { $("confirm").hidden = false; });
$("cNo").addEventListener("click", () => { $("confirm").hidden = true; });
$("cYes").addEventListener("click", () => { opened.clear(); save(); $("confirm").hidden = true; const g = $("grid"); g.innerHTML = ""; renderBoard(); showScreen("start"); });

document.addEventListener("keydown", e => {
  if(e.target && (e.target.tagName === "SELECT" || e.target.tagName === "INPUT")) return;
  if(!$("start").hidden){ if(e.key === "Enter"){ e.preventDefault(); $("go").click(); } return; }
  if(phase === "" && /^[1-7]$/.test(e.key)){ openTile(+e.key - 1); return; }
  if(e.key === "Escape"){ if(phase) backToBoard(); return; }
  if(e.key === "Enter"){
    if(phase === "question" || phase === "answer"){ e.preventDefault(); $("qNext").click(); }
    else if(phase === "lucky"){ e.preventDefault(); commitOpen(); }
  }
  if(e.key === " " && phase === "question"){ e.preventDefault(); $("ring").click(); }
});

// ---------- star polygon ----------
(function(){ const pts = []; const n = 24; for(let k=0;k<n*2;k++){ const r = k%2 ? 38 : 49; const a = Math.PI*k/n - Math.PI/2; pts.push((50+r*Math.cos(a)).toFixed(2)+","+(50+r*Math.sin(a)).toFixed(2)); } $("starPoly").setAttribute("points", pts.join(" ")); })();

// ---------- confetti ----------
const cv = $("fx"), cx2 = cv.getContext("2d"); let parts = [], fxRaf = 0, fxEnd = 0;
function confetti(ms){
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = window.devicePixelRatio || 1; cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; cx2.setTransform(dpr,0,0,dpr,0,0);
  const cols = ["#d9a84e","#f3d68e","#f6eee0","#f25c3b","#ffffff"];
  for(let k=0;k<180;k++) parts.push({x:innerWidth/2 + (Math.random()-.5)*innerWidth*.3, y:innerHeight*.35, vx:(Math.random()-.5)*14, vy:-Math.random()*14-4, s:5+Math.random()*7, r:Math.random()*6, vr:(Math.random()-.5)*.3, c:cols[k%cols.length]});
  fxEnd = performance.now() + ms; cancelAnimationFrame(fxRaf); fxRaf = requestAnimationFrame(fxLoop);
}
function fxLoop(now){
  cx2.clearRect(0,0,innerWidth,innerHeight);
  parts.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx2.save(); cx2.translate(p.x,p.y); cx2.rotate(p.r); cx2.fillStyle = p.c; cx2.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); cx2.restore(); });
  parts = parts.filter(p => p.y < innerHeight + 40);
  if(parts.length && now < fxEnd + 2500) fxRaf = requestAnimationFrame(fxLoop); else { parts = []; cx2.clearRect(0,0,innerWidth,innerHeight); }
}

// ---------- boot ----------
function start(data){
  load(data);
  renderBoard(); drawTimer();
  if(data && data.started) showScreen(null);
}
if(hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();

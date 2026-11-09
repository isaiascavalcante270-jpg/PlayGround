(() => {
  'use strict';
  const canvas = document.getElementById('arena');
  const ctx = canvas.getContext('2d');
  const ui = Object.fromEntries(['playerHp','playerHpText','playerKi','playerKiText','enemyHp','enemyHpText','enemyKi','enemyKiText','combo','comboNum','comboGrade','timer','limitBar','limitText','powerLevel','pauseOverlay','resultOverlay','resultTitle','resultEyebrow','resultCopy','toast','fightCallout'].map(id => [id, document.getElementById(id)]));
  const keys = new Set(), held = {up:false,down:false,left:false,right:false,guard:false,charge:false};
  const W = {w:0,h:0,dpr:1,time:0,last:0,elapsed:0,active:true,paused:false,over:false,flash:0,shake:0,toastTimer:0,comboTimer:0,enemyThink:0,player:{x:-2.1,z:.32,hp:100,ki:72,stun:0,attack:0,attackType:'',guard:false,charging:false,facing:1,walk:0,hitFlash:0},enemy:{x:2.1,z:.32,hp:100,ki:56,stun:0,attack:0,attackType:'',guard:false,charging:false,facing:-1,walk:0,hitFlash:0},combo:0,limit:36,particles:[],bolts:[],embers:[],stars:[],clouds:[]};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function resize(){const r=canvas.getBoundingClientRect();W.w=r.width;W.h=r.height;W.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*W.dpr);canvas.height=Math.round(r.height*W.dpr);ctx.setTransform(W.dpr,0,0,W.dpr,0,0);seedScene();}
  function seedScene(){W.stars=Array.from({length:75},()=>({x:Math.random()*W.w,y:Math.random()*W.h*.48,r:Math.random()*1.5+.25,a:Math.random()*.55+.2}));W.clouds=Array.from({length:7},(_,i)=>({x:((i*177)%W.w),y:W.h*(.16+(i%3)*.075),s:.5+Math.random()*.9}));}
  function updateBars(){const p=W.player,e=W.enemy;ui.playerHp.style.width=p.hp+'%';ui.playerHpText.textContent=Math.ceil(p.hp)+'%';ui.playerKi.style.width=p.ki+'%';ui.playerKiText.textContent=Math.ceil(p.ki)+'%';ui.enemyHp.style.width=e.hp+'%';ui.enemyHpText.textContent=Math.ceil(e.hp)+'%';ui.enemyKi.style.width=e.ki+'%';ui.enemyKiText.textContent=Math.ceil(e.ki)+'%';ui.limitBar.style.width=W.limit+'%';ui.limitText.textContent=Math.floor(W.limit)+'%';ui.powerLevel.textContent=(9000+W.combo*430).toLocaleString();ui.comboNum.textContent=W.combo;ui.combo.classList.toggle('active',W.combo>1&&W.comboTimer>0);ui.comboGrade.textContent=W.combo>8?'MONSTER!':W.combo>4?'DOMINATING':W.combo>1?'NICE!':'';}
  function announce(text,duration=1.5){ui.toast.textContent=text;ui.toast.classList.add('show');W.toastTimer=duration;}
  function showCallout(text){ui.fightCallout.textContent=text;ui.fightCallout.classList.remove('show');void ui.fightCallout.offsetWidth;ui.fightCallout.classList.add('show');}
  function reset(){Object.assign(W.player,{x:-2.1,z:.32,hp:100,ki:72,stun:0,attack:0,attackType:'',guard:false,charging:false,walk:0,hitFlash:0});Object.assign(W.enemy,{x:2.1,z:.32,hp:100,ki:56,stun:0,attack:0,attackType:'',guard:false,charging:false,walk:0,hitFlash:0});W.combo=0;W.comboTimer=0;W.limit=36;W.elapsed=0;W.over=false;W.paused=false;W.particles=[];W.bolts=[];W.shake=0;ui.pauseOverlay.classList.remove('open');ui.resultOverlay.classList.remove('open');updateBars();showCallout('FIGHT!');}
  function pause(){if(W.over)return;W.paused=!W.paused;ui.pauseOverlay.classList.toggle('open',W.paused);}
  function finish(win){W.over=true;W.paused=false;ui.resultTitle.textContent=win?'VICTORY':'DEFEAT';ui.resultEyebrow.textContent=win?'UNIVERSE SAVED':'MATCH COMPLETE';ui.resultCopy.textContent=win?'The universe is a little safer.':'Every legend has a next round.';ui.resultOverlay.classList.add('open');}
  function point(x,y){return {x,y};}
  function path(points,fill,stroke='#171b28',lw=3){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.stroke();}}
  function ellipse(x,y,rx,ry,fill,stroke='#171b28',lw=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
  function line(points,color,width=4){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function roundRect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function sky(){const w=W.w,h=W.h;let g=ctx.createLinearGradient(0,0,0,h*.72);g.addColorStop(0,'#17243d');g.addColorStop(.4,'#586c88');g.addColorStop(.72,'#e6a674');g.addColorStop(1,'#f4cb8a');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const sunX=w*.72,sunY=h*.285,sunR=Math.min(w,h)*.095;let halo=ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,sunR*2.7);halo.addColorStop(0,'#fff5ceaa');halo.addColorStop(.28,'#ffd89957');halo.addColorStop(1,'#ffc98500');ctx.fillStyle=halo;ctx.fillRect(sunX-sunR*3,sunY-sunR*3,sunR*6,sunR*6);ellipse(sunX,sunY,sunR,sunR,'#ffecbb','#ffecbb',0);
    for(const s of W.stars){ctx.globalAlpha=s.a*(.5+.5*Math.sin(W.time*1.5+s.x));ctx.fillStyle='#fff';ctx.fillRect(s.x,s.y,s.r,s.r)}ctx.globalAlpha=1;
    W.clouds.forEach((c,i)=>{const x=((c.x+W.time*(5+i%3)*c.s)%(w+220))-110;ctx.globalAlpha=.13;ctx.fillStyle=i%2?'#fff0d9':'#d8e6ff';for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+j*40*c.s,h*.25+(j%2)*8,c.s*49,c.s*15,0,0,Math.PI*2);ctx.fill()} });ctx.globalAlpha=1;
    path([[0,h*.51],[w*.07,h*.43],[w*.15,h*.48],[w*.25,h*.39],[w*.36,h*.5],[w*.48,h*.42],[w*.59,h*.49],[w*.72,h*.4],[w*.81,h*.49],[w*.91,h*.41],[w,h*.47],[w,h*.73],[0,h*.73]],'#6b6574','#554e61',1);
    path([[0,h*.55],[w*.12,h*.48],[w*.23,h*.55],[w*.34,h*.46],[w*.46,h*.56],[w*.58,h*.49],[w*.71,h*.54],[w*.83,h*.47],[w,h*.55],[w,h*.73],[0,h*.73]],'#858078','#6e6c6d',1);
    // distant tournament gates and tiny pagoda silhouettes
    ctx.fillStyle='#514a4e';const gateX=w*.2,gateY=h*.5;ctx.fillRect(gateX,gateY-38,5,50);ctx.fillRect(gateX+53,gateY-38,5,50);path([[gateX-9,gateY-37],[gateX+67,gateY-37],[gateX+57,gateY-45],[gateX+1,gateY-45]],'#544651','#423a43',1);ctx.fillRect(w*.84,h*.45,3,44);ctx.fillRect(w*.89,h*.44,3,45);path([[w*.825,h*.45],[w*.91,h*.45],[w*.9,h*.42],[w*.84,h*.42]],'#594950','#493b43',1);
  }
  function arenaFloor(){const w=W.w,h=W.h,hor=h*.56;let g=ctx.createLinearGradient(0,hor,0,h);g.addColorStop(0,'#b3a28c');g.addColorStop(.22,'#8e897f');g.addColorStop(1,'#343c49');ctx.fillStyle=g;ctx.fillRect(0,hor,w,h-hor);
    // perspective dojo tiles
    ctx.save();ctx.beginPath();ctx.rect(0,hor,w,h-hor);ctx.clip();ctx.strokeStyle='#eee0c331';ctx.lineWidth=1;
    for(let i=-12;i<=12;i++){const bx=w/2+i*w*.1;ctx.beginPath();ctx.moveTo(w/2+(bx-w/2)*.08,hor);ctx.lineTo(bx,h*1.1);ctx.stroke()}
    for(let j=1;j<12;j++){const t=j/12,y=hor+(h-hor)*t*t;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    ctx.restore();
    // ring edges
    ctx.beginPath();ctx.ellipse(w*.5,h*.73,w*.37,h*.19,0,0,Math.PI*2);ctx.strokeStyle='#f8e4bc88';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.ellipse(w*.5,h*.73,w*.29,h*.145,0,0,Math.PI*2);ctx.strokeStyle='#514e4c66';ctx.lineWidth=1.5;ctx.stroke();
    // decorative boundary markers
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=w*.5+Math.cos(a)*w*.37,y=h*.73+Math.sin(a)*h*.19;ellipse(x,y,3,2,'#ffdc9b88','#f9e3bb66',1)}
  }
  function characterScale(f){return (.68+f.z*.48)*Math.min(Math.max(W.w/1000,W.h/720*.92),1.35)}
  function fighter(f,isPlayer){
    const scale=characterScale(f), groundY=W.h*(.585+f.z*.28), cx=W.w*.5+f.x*W.w*.075;
    const facing=f.facing, bob=(f.walk?Math.sin(W.time*13)*2:Math.sin(W.time*3)*1.5)*scale, aura=f.charging||f.ki>94;
    ctx.save();ctx.translate(cx,groundY);ctx.scale(scale,scale);
    // shadow and charging aura
    ctx.save();ctx.scale(1,.32);ellipse(0,0,43,12,'#15192180','#00000000',0);ctx.restore();
    if(aura){const pulse=1+Math.sin(W.time*13)*.045;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.42;let ag=ctx.createRadialGradient(0,-65,8,0,-66,72*pulse);ag.addColorStop(0,isPlayer?'#79eeffbb':'#ffb55abb');ag.addColorStop(.45,isPlayer?'#47bcff6a':'#ff693b65');ag.addColorStop(1,'#ffad1600');ctx.fillStyle=ag;ctx.beginPath();ctx.ellipse(0,-63,47*pulse,82*pulse,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.strokeStyle=isPlayer?'#8df6ff':'#ffcf70';ctx.lineWidth=2;for(let i=0;i<5;i++){const xx=Math.sin(W.time*7+i*2.7)*31,yy=-30-((W.time*85+i*29)%82);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+Math.sin(W.time*9+i)*5,yy-12);ctx.stroke()}ctx.restore()}
    if(f.hitFlash>0){ctx.globalAlpha=.4+Math.sin(W.time*70)*.2}
    const skin='#f4bb91',outline='#201d2a',suit=isPlayer?'#ed7627':'#315dce',shadow=isPlayer?'#a94325':'#1c3483',hair=isPlayer?'#171a25':'#121621';
    const lean=f.attack>0?Math.sin((1-f.attack)*Math.PI)*.24:0;ctx.translate(0,bob);ctx.rotate(-facing*lean*.22);
    // legs, boots
    const stride=f.walk?Math.sin(W.time*13)*8:0;
    path([[-12,-35],[-2,-34],[2,-13+stride*.3],[-8,-10],[-18,-27]],'#263451',outline,3);
    path([[1,-34],[14,-35],[18,-14-stride*.3],[8,-10],[2,-23]],'#263451',outline,3);
    path([[-17,-15],[-7,-13],[-5,-6],[-20,-5]],isPlayer?'#f3ece0':'#eef2ff',outline,2);
    path([[9,-14],[19,-15],[24,-7],[8,-6]],isPlayer?'#f3ece0':'#eef2ff',outline,2);
    // gi tunic
    path([[-13,-69],[-23,-63],[-17,-39],[-14,-28],[0,-25],[17,-29],[21,-56],[12,-68],[0,-72]],suit,outline,3);
    path([[-13,-65],[-1,-58],[7,-30],[-1,-27],[-9,-39]],isPlayer?'#ff9b35':'#5488ff',shadow,1.5);
    path([[-13,-64],[-20,-59],[-25,-45],[-19,-39],[-11,-52]],isPlayer?'#ff8530':'#426fea',outline,3);
    // belt
    path([[-15,-40],[17,-40],[16,-34],[-15,-34]],'#f6e5c4',outline,2);path([[2,-39],[8,-39],[7,-33],[1,-32]],'#e4d1aa',outline,1);
    // arms + fists, attacking pose extends toward facing direction
    const punch=f.attack>0?Math.sin((1-f.attack)*Math.PI):0;
    if(punch>.1){const ex=facing*(27+47*punch),ey=-54-5*punch;line([[facing*12,-61],[facing*21,-58],[ex-6,ey]],skin,10);ellipse(ex,ey,9,8,'#f1bd92',outline,2);ctx.save();ctx.globalAlpha=.7*punch;ctx.strokeStyle=isPlayer?'#ffce57':'#9bc7ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(facing*24,-57);ctx.lineTo(ex+facing*17,ey);ctx.stroke();ctx.restore();}
    else{line([[-13,-61],[-21,-51],[-18,-43]],skin,9);ellipse(-18,-41,6,6,skin,outline,2);line([[13,-61],[21,-53],[18,-45]],skin,9);ellipse(18,-43,6,6,skin,outline,2)}
    // neck and face
    path([[-7,-75],[-7,-66],[1,-63],[8,-69],[7,-77]],skin,outline,2);
    ellipse(0,-85,14,16,skin,outline,2.5);
    // hair silhouette spikes, swept differently per character
    if(isPlayer){path([[-14,-89],[-23,-96],[-17,-95],[-23,-108],[-12,-101],[-12,-115],[-3,-104],[4,-117],[8,-103],[18,-109],[14,-96],[22,-91],[13,-87],[-11,-85]],hair,'#090d15',2);}
    else{path([[-14,-90],[-20,-106],[-8,-99],[-8,-118],[1,-104],[10,-117],[12,-101],[21,-107],[16,-90],[10,-84],[-10,-84]],hair,'#080c14',2);}
    // brow and eye point toward rival
    line([[3*facing,-85],[10*facing,-87]],'#32253a',2.4);line([[5*facing,-81],[10*facing,-81]],'#fff9e9',2);line([[9*facing,-81],[10*facing,-81]],'#222638',2);
    if(!isPlayer){path([[-19,-48],[-12,-45],[-7,-47],[-12,-51]],'#e7eaff',outline,1)}
    // emblem
    ellipse(-4,-49,5,5,'#fff2d6',outline,1);ctx.fillStyle=shadow;ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText(isPlayer?'悟':'王',-4,-46);
    ctx.restore();
  }
  function drawBolt(b){const t=clamp(b.life/.55,0,1);ctx.save();ctx.globalAlpha=t;ctx.globalCompositeOperation='lighter';ctx.shadowBlur=22;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.ellipse(b.x,b.y,18*t+7,9*t+3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(b.x,b.y,9*t+3,4*t+2,0,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++){ctx.strokeStyle=b.color+'aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x-b.dir*(14+i*7),b.y+(i-1)*6);ctx.lineTo(b.x-b.dir*(30+i*9),b.y+(i-1)*9+Math.sin(W.time*35+i)*3);ctx.stroke()}ctx.restore();}
  function drawParticles(){for(const p of W.particles){const a=clamp(p.life/p.max,0,1);ctx.globalAlpha=a;ctx.fillStyle=p.color;if(p.kind==='ring'){ctx.strokeStyle=p.color;ctx.lineWidth=3*a;ctx.beginPath();ctx.arc(p.x,p.y,p.r+(1-a)*36,0,Math.PI*2);ctx.stroke()}else{ctx.beginPath();ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1;W.bolts.forEach(drawBolt);}
  function render(){const w=W.w,h=W.h;if(!w||!h)return;ctx.save();if(W.shake>0){ctx.translate((Math.random()-.5)*W.shake,(Math.random()-.5)*W.shake)}sky();arenaFloor();
    // atmospheric heat shimmer and distant motes
    for(let i=0;i<15;i++){const x=((i*137+W.time*11)%w),y=h*(.55+(i%6)*.055);ctx.globalAlpha=.18;ctx.fillStyle=i%2?'#fff':'#ffe6b6';ctx.fillRect(x,y,1,1)}ctx.globalAlpha=1;
    const chars=[{f:W.player,p:true},{f:W.enemy,p:false}].sort((a,b)=>a.f.z-b.f.z);chars.forEach(c=>fighter(c.f,c.p));drawParticles();
    if(W.flash>0){ctx.fillStyle=`rgba(255,244,218,${W.flash*.45})`;ctx.fillRect(0,0,w,h)}ctx.restore();
  }
  function coords(f){return {x:W.w*.5+f.x*W.w*.075,y:W.h*(.585+f.z*.28)-85*characterScale(f)}}
  function burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*180;W.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:2+Math.random()*4,color,life:.25+Math.random()*.42,max:.7,kind:'spark'})}W.particles.push({x,y,r:2,color,life:.28,max:.28,kind:'ring'});}
  function takeHit(target,amount,attacker,type){const guarded=target.guard;const damage=guarded?amount*.18:amount;target.hp=clamp(target.hp-damage,0,100);target.stun=guarded?.08:.22;target.hitFlash=guarded?.08:.16;const at=coords(target);burst(at.x,at.y,'#ffe9b0',guarded?5:12);if(!guarded){W.shake=Math.max(W.shake,type==='heavy'?9:5);W.flash=Math.max(W.flash,.18);target.x=clamp(target.x+attacker.facing*.16,-4.2,4.2)}else announce('GUARD BREAKER?  BLOCKED!',.7);if(target.hp<=0){setTimeout(()=>{if(!W.over)finish(target===W.enemy)},280)}}
  function melee(f,target,type){if(f.stun>0||f.attack>0||W.over)return;if(type==='heavy'&&f.ki<8){announce('NOT ENOUGH KI',.8);return}if(type==='heavy')f.ki-=8;const d=Math.hypot(f.x-target.x,(f.z-target.z)*2);f.attack=type==='heavy'?.47:.31;f.attackType=type;f.attackHit=false;f.attackTarget=target;f.attackRange=type==='heavy'?2.9:2.35;if(d<f.attackRange){f.attackHit=true;takeHit(target,type==='heavy'?15:6,f,type);if(target===W.enemy){W.combo++;W.comboTimer=1.35;W.limit=clamp(W.limit+(type==='heavy'?6:3),0,100);if(W.combo===3)announce('COMBO x3 · KEEP IT GOING',1)} }else if(target===W.enemy){W.combo=0;W.comboTimer=0}}
  function shoot(f,target){if(f.stun>0||f.ki<14||W.over){if(f.ki<14)announce('KI TOO LOW',.7);return}f.ki-=14;const from=coords(f),to=coords(target),dir=Math.sign(to.x-from.x)||f.facing;W.bolts.push({x:from.x+dir*27,y:from.y-10,vx:dir*Math.max(500,W.w*.72),life:2,color:f===W.player?'#77e9ff':'#ff9b67',target,owner:f,damage:f===W.player?10:9});burst(from.x+dir*22,from.y-10,f===W.player?'#65ddff':'#ff9c6c',5);}
  function controls(){const p=W.player;if(W.over||W.paused)return;p.guard=held.guard;p.charging=held.charge;if(held.charge){p.ki=clamp(p.ki+27/60,0,100);W.limit=clamp(W.limit+.025,0,100)}let dx=(held.right?1:0)-(held.left?1:0),dz=(held.down?1:0)-(held.up?1:0);if(p.stun<=0&&p.attack<=0&&!p.guard){if(dx||dz){const n=Math.hypot(dx,dz);p.x=clamp(p.x+dx/n*2.9/60,-4.25,4.25);p.z=clamp(p.z+dz/n*1.7/60,.08,.82);p.walk=1;p.facing=dx?Math.sign(dx):p.facing}else p.walk=0}}
  function enemyAI(dt){const e=W.enemy,p=W.player;if(e.stun>0||W.over)return;W.enemyThink-=dt;const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz*2);e.facing=Math.sign(dx)||-1;e.guard=false;e.charging=false;if(d>2.25){e.x+=Math.sign(dx)*1.45*dt;e.z=clamp(e.z+Math.sign(dz)*.62*dt,.12,.8);e.walk=1}else e.walk=0;if(e.ki<28&&Math.random()<dt*.8)e.charging=true;if(W.enemyThink<=0){W.enemyThink=.9+Math.random()*.7;if(d<2.1){if(Math.random()<.25){e.guard=true;setTimeout(()=>{e.guard=false},500)}else melee(e,p,Math.random()<.25&&e.ki>9?'heavy':'light')}else if(d<5&&e.ki>17&&Math.random()<.45)shoot(e,p)}}
  function update(dt){if(W.paused||W.over)return;W.time+=dt;W.elapsed+=dt;controls();enemyAI(dt);for(const f of [W.player,W.enemy]){if(f.stun>0)f.stun=Math.max(0,f.stun-dt);if(f.hitFlash>0)f.hitFlash=Math.max(0,f.hitFlash-dt);if(f.attack>0){f.attack=Math.max(0,f.attack-dt);if(f.attack===0)f.attackType=''}if(f!==W.player&&f.charging)f.ki=clamp(f.ki+18*dt,0,100)}
    W.comboTimer-=dt;if(W.comboTimer<=0){W.combo=0;W.comboTimer=0}W.bolts=W.bolts.filter(b=>{b.life-=dt;b.x+=b.vx*dt;const at=coords(b.target);if(Math.abs(at.x-b.x)<22&&b.life>0){takeHit(b.target,b.damage,b.owner,'blast');if(b.target===W.enemy){W.combo++;W.comboTimer=1.35;W.limit=clamp(W.limit+5,0,100)}return false}if(b.life<=0||b.x<0||b.x>W.w){if(b.x<0||b.x>W.w)burst(b.x,b.y,b.color,3);return false}return true});W.particles=W.particles.filter(p=>{p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;p.vy=(p.vy||0)+85*dt;return p.life>0});W.flash=Math.max(0,W.flash-dt);W.shake=Math.max(0,W.shake-dt*28);W.toastTimer-=dt;if(W.toastTimer<=0)ui.toast.classList.remove('show');let remain=Math.max(0,99-W.elapsed),m=Math.floor(remain/60),s=Math.floor(remain%60);ui.timer.innerHTML=`${String(m).padStart(2,'0')}<span>:</span>${String(s).padStart(2,'0')}`;if(remain<=0)finish(W.player.hp>=W.enemy.hp);updateBars();}
  function frame(now){const dt=Math.min(.04,(now-W.last)/1000||0);W.last=now;if(!W.paused){update(dt)}render();requestAnimationFrame(frame)}
  function keyAction(key){if(key==='j')melee(W.player,W.enemy,'light');if(key==='k')melee(W.player,W.enemy,'heavy');if(key==='o')shoot(W.player,W.enemy);if(key==='escape'||key==='p')pause();}
  const map={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',l:'guard',i:'charge'};
  window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(map[e.key]||['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(!keys.has(k)){keys.add(k);if(k==='j'||k==='k'||k==='o'||k==='escape'||k==='p')keyAction(k)}if(map[e.key])held[map[e.key]]=true;});
  window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(k);if(map[e.key])held[map[e.key]]=false;});window.addEventListener('blur',()=>{keys.clear();Object.keys(held).forEach(k=>held[k]=false)});
  document.querySelectorAll('[data-hold]').forEach(btn=>{const action=btn.dataset.hold;const down=e=>{e.preventDefault();btn.classList.add('pressed');if(action in held)held[action]=true};const up=e=>{e.preventDefault();btn.classList.remove('pressed');if(action in held)held[action]=false};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up)});
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('pointerdown',e=>{e.preventDefault();const a=btn.dataset.action;if(a==='light')melee(W.player,W.enemy,'light');if(a==='heavy')melee(W.player,W.enemy,'heavy');if(a==='blast')shoot(W.player,W.enemy)}));
  document.getElementById('pauseBtn').addEventListener('click',pause);document.getElementById('resumeBtn').addEventListener('click',pause);document.getElementById('restartBtn').addEventListener('click',reset);document.getElementById('playAgainBtn').addEventListener('click',reset);window.addEventListener('resize',resize);
  resize();updateBars();showCallout('FIGHT!');requestAnimationFrame(frame);
})();

(function(){
const $=id=>document.getElementById(id);
const startCard=$('start'), resultCard=$('result');
$('startBtn').addEventListener('click',startGame);
$('again').addEventListener('click',startGame);

if(!window.THREE){
  startCard.innerHTML='<h2>3D LIBRARY DID NOT LOAD</h2><p>Connect to the internet, then reload this file. The game needs to download Three.js from jsDelivr.</p>';
  return;
}

const wrap=$('wrap'), scene=new THREE.Scene();

scene.background=new THREE.Color(0x070b1b);
scene.fog=new THREE.FogExp2(0x070b1b,.017);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,200);
const renderer=new THREE.WebGLRenderer({antialias:true});

renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.outputEncoding=THREE.sRGBEncoding;wrap.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xaad6ff,0x17102e,1.7));

const sun=new THREE.DirectionalLight(0xc4faff,2.5);sun.position.set(-7,14,8);sun.castShadow=true;scene.add(sun);
const l1=new THREE.PointLight(0x00cfff,2.5,28);l1.position.set(-5,4,4);scene.add(l1);
const l2=new THREE.PointLight(0xff25d4,2.5,28);l2.position.set(5,4,-5);scene.add(l2);

const mat=(c,e=0,ei=0)=>new 
THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:ei,roughness:.5,metalness:.15});

const platform=new 
THREE.Mesh(new THREE.CylinderGeometry(12.8,14,1.2,8),mat(0x172344,0x071b48,.5));
platform.position.y=-.62;platform.receiveShadow=true;scene.add(platform);

const surface=new 
THREE.Mesh(new THREE.CylinderGeometry(12.6,12.6,.12,8),mat(0x1a3154));
surface.position.y=.03;surface.receiveShadow=true;scene.add(surface);

const rim=new 
THREE.Mesh(new THREE.TorusGeometry(12.7,.07,8,64),mat(0x13eaff,0x00cfff,2));
rim.rotation.x=Math.PI/2;rim.position.y=.1;scene.add(rim);

for(let i=0;i<12;i++){
  let a=i/12*Math.PI*2;
  let rock=new 
  THREE.Mesh(new THREE.ConeGeometry(.7+(i%3)*.15,2.2+(i%4)*.3,5),mat(i%2?0x171a3d:0x101c36));
  rock.position.set(Math.cos(a)*12.5,-2.1-(i%3)*.3,Math.sin(a)*12.5);scene.add(rock)
}

for(let i=0;i<260;i++){
  let star=new 
  THREE.Mesh(new THREE.SphereGeometry(.035,4,4),new THREE.MeshBasicMaterial({color:0x9fcfff}));
  star.position.set((Math.random()-.5)*90,Math.random()*40+2,(Math.random()-.5)*90);
  scene.add(star)
}

const player=new THREE.Group();
const body=new 
THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.9,8),mat(0x69f2ff,0x00aacc,.5));
body.position.y=.72;body.castShadow=true;player.add(body);

const head=new 
THREE.Mesh(new THREE.SphereGeometry(.28,12,10),mat(0xe0ffff,0x00bfff,.4));
head.position.y=1.35;player.add(head);

const visor=new 
THREE.Mesh(new THREE.BoxGeometry(.34,.11,.12),mat(0x1a2143,0xb14bff,1.5));
visor.position.set(0,1.37,.23);
player.add(visor);

const pack=new 
THREE.Mesh(new THREE.BoxGeometry(.35,.42,.18),mat(0xff4fd8,0xa30b83,.9));
pack.position.set(0,.72,-.28);
player.add(pack);
player.position.set(0,0,8.3);
scene.add(player);

const crystals=[],gemMat=mat(0x7dffff,0x13dfff,2.5),
coords=[[0,4],[3.5,2.4],[-3.8,2.2],[6,-1.5],[-6.4,-1.3],[2.5,-5.3],[-2.9,-6],[0,-8],[8,3.8],[-8,4],[7,-6.5],[-7.5,-6.3]];
coords.forEach((p,i)=>{
  const g=new 
  THREE.Group(),gem=new 
  THREE.Mesh(new THREE.OctahedronGeometry(.46,0),gemMat);
  gem.scale.y=1.3;
  g.add(gem);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.025,6,24),mat(0xff4fd8,0xff22cf,2));
  ring.rotation.x=Math.PI/2;g.add(ring);
  g.position.set(p[0],.9,p[1]);
  g.userData={phase:i*.7};
  scene.add(g);crystals.push(g)
});

const portal=new 
THREE.Group();portal.position.set(0,0,-10);
scene.add(portal);

const portalRing=new 
THREE.Mesh(new THREE.TorusGeometry(1.12,.12,10,40),mat(0xff4fd8,0xff1dc9,3));
portalRing.position.y=1.4;portal.add(portalRing);

const portalDisk=new 
THREE.Mesh(new THREE.CircleGeometry(.98,32),new THREE.MeshBasicMaterial({
  color:0x6021a1,transparent:true,opacity:.55,side:THREE.DoubleSide
}));
portalDisk.position.set(0,1.4,0);
portal.add(portalDisk);

const portalBase=new 
THREE.Mesh(new THREE.CylinderGeometry(1.4,1.55,.18,8),mat(0x29204c,0x8c22ff,1));
portalBase.position.y=.1;portal.add(portalBase);

const drones=[];
for(let i=0;i<3;i++){
  const d=new THREE.Group();
  d.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.36,1),mat(0x3b244e,0xff2d91,2.5)));
  const dr=new THREE.Mesh(new THREE.TorusGeometry(.58,.05,8,24),mat(0xff4fd8,0xff2d91,2));
  dr.rotation.x=Math.PI/2;d.add(dr);
  d.userData={phase:i*2.1,radius:4.6+i*1.7,speed:.5+i*.13};scene.add(d);drones.push(d)
}

const keys=Object.create(null);

let active=false,finished=false,energy=0,timer=90,last=performance.now(),vy=0,grounded=true,invuln=0;

function updateHud(){$('energy').textContent=energy;
  $('time').textContent=Math.ceil(Math.max(0,timer))
}

function startGame(){active=true;finished=false;energy=0;
  timer=90;
  vy=0;
  grounded=true;
  invuln=0;
  player.position.set(0,0,8.3);
  crystals.forEach(c=>c.visible=true);startCard.classList.add('hidden');
  resultCard.classList.add('hidden');
  $('hint').textContent='COLLECT 6 CRYSTALS · AVOID DRONES · REACH THE PORTAL';updateHud()
}

function finish(win){if(finished)return;
  finished=true;active=false;
  $('resultEyebrow').textContent=win?'RELIC SECURED':'SIGNAL LOST';
  $('resultTitle').textContent=win?'ISLAND CLEARED':'TIME EXPIRED';
  $('resultText').textContent=win?'You escaped with '+energy+' energy crystals!':'You recovered '+energy+' crystals. Try again and reach the portal in time.';resultCard.classList.remove('hidden')}
addEventListener('keydown',e=>{
  keys[e.code]=true;

  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()
  });

addEventListener('keyup',e=>keys[e.code]=false);

function bind(btn,key){
  const down=e=>{e.preventDefault();
    keys[key]=true},up=e=>{e.preventDefault();
      keys[key]=false};
      btn.addEventListener('pointerdown',down);
      ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,up))
    }
document.querySelectorAll('[data-key]').forEach(b=>bind(b,b.dataset.key));bind($('jump'),'Space');

function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-last)/1000,.04);
  last=now;

crystals.forEach(c=>{if(c.visible){
  c.rotation.y+=dt*1.4;c.position.y=.9+Math.sin(now*.002+c.userData.phase)*.15;
  c.children[1].rotation.z+=dt*.7
}});

drones.forEach(d=>{
  const u=d.userData,a=now*.00055*u.speed+u.phase;
  d.position.set(Math.cos(a)*u.radius,1.25+Math.sin(now*.002+u.phase)*.4,Math.sin(a)*u.radius);
  d.rotation.y+=dt
});

portalRing.rotation.y=Math.sin(now*.0007)*.15;
portalDisk.material.opacity=.4+Math.sin(now*.003)*.1;

if(active&&!finished){
  timer-=dt;
  if(timer<=0){
    timer=0;updateHud();finish(false)
  }

const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),
s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),len=Math.hypot(f,s)||1;

if(f||s){
  const dx=s/len,dz=-f/len;player.position.x+=dx*5*dt;player.position.z+=dz*5*dt;player.rotation.y=Math.atan2(dx,dz)
}

if((keys.Space||keys.ShiftLeft)&&grounded){
  vy=6.5;grounded=false}vy-=16*dt;
  player.position.y+=vy*dt;
  if(player.position.y<=0){
    player.position.y=0;vy=0;grounded=true
  }

const radius=Math.hypot(player.position.x,player.position.z);
if(radius>11.45){
  player.position.x*=11.45/radius;player.position.z*=11.45/radius
}

crystals.forEach(c=>{
  if(c.visible&&player.position.distanceTo(c.position)<1.1){
    c.visible=false;energy++;updateHud();$('hint').textContent='ENERGY ACQUIRED · '+energy+' / 12'
  }
});

invuln-=dt;
drones.forEach(d=>{
  if(invuln<=0&&player.position.distanceTo(d.position)<.9){
    timer=Math.max(0,timer-8);
    invuln=1.1;updateHud();
    $('hint').textContent='DRONE HIT · -8 SECONDS'
  }
});

if(Math.hypot(player.position.x,player.position.z+10)<1.5){
  if(energy>=6)finish(true);else $('hint').textContent='PORTAL LOCKED · COLLECT AT LEAST 6 CRYSTALS'
}

if(Math.floor(timer)%3===0)updateHud()
}

const target=new 
THREE.Vector3(player.position.x,player.position.y+1,player.position.z),
desired=new THREE.Vector3(player.position.x,player.position.y+6.2,player.position.z+9.5);camera.position.lerp(desired,.09);
camera.lookAt(target);renderer.render(scene,camera)
}

camera.position.set(0,7,18);requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))
});
})();
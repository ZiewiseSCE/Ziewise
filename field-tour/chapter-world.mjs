import * as T from '../ai-briefing/vendor/three.module.min.js';
import {batchStatic} from './batch.mjs';
const poses={
  energy:[[[-.82,1.61,2.68],[-.26,1.12,-.35],52],[[-.18,1.65,1.38],[.06,1.48,-.40],48],[[1.22,1.55,1.49],[.73,1.23,-.25],47]],
  commerce:[[[-.93,1.58,2.39],[-.26,1.19,-.33],54],[[.07,1.46,1.12],[-.05,1.19,.05],49],[[1.34,1.56,1.61],[.66,1.26,-.05],46]]
};
const company=['research','infrastructure','credentials'];
export function createChapterWorld(canvas,{capture=false}={}){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:capture,alpha:false});
  renderer.setPixelRatio(capture?1:Math.min(devicePixelRatio,1.45));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene();scene.background=new T.Color(0xabbabe);
  const camera=new T.PerspectiveCamera(45,1,.04,80);
  scene.add(new T.HemisphereLight(0xe7f0fb,0xb09b81,1.45));
  const sun=new T.DirectionalLight(0xffebca,2.48);sun.position.set(-2.9,4.4,3.4);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-3,near:.1,far:15});sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.00023;sun.shadow.normalBias=.008;scene.add(sun);
  const fill=new T.DirectionalLight(0xe7efff,.60);fill.position.set(2.6,2.5,-1);scene.add(fill);
  const pending=new Map();let active=null,w=0,h=0;
  const env=new T.TextureLoader().loadAsync(new URL('./photography/studio-light.webp',import.meta.url).href).then(tex=>{
    tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;const gen=new T.PMREMGenerator(renderer);
    const target=gen.fromEquirectangular(tex);scene.environment=target.texture;scene.environmentIntensity=.90;gen.dispose();tex.dispose();
  }).catch(()=>{});
  async function build(id){
    let module,station;
    if(company.includes(id)){module=await import('./chapters/company/company.mjs');station=module.buildCompany(T,id);}
    else if(poses[id]){module=await import('./chapters/industry-a/industry-a.mjs');station=module.buildIndustryA(T,id);}
    else {module=await import('./chapters/industry-b/industry-b.mjs');station=module.buildIndustryB(T,id);}
    await Promise.all([env,station.ready]);batchStatic(T,station.group);return station;
  }
  async function prepare(id){if(!pending.has(id))pending.set(id,build(id).catch(e=>{pending.delete(id);throw e;}));return pending.get(id);}
  function pose(station,id,i){
    if(poses[id]){const [eye,at,fov]=poses[id][i];return [new T.Vector3(...eye),new T.Vector3(...at),fov];}
    const at=station.anchors[i].clone();
    const dist=id==='credentials'?1.35:id==='print'?1.66:1.9;
    const eye=at.clone().add(new T.Vector3((i===0?-.37:i===2?.39:.08),id==='print'?.34:.22,dist));
    return [eye,at,id==='credentials'?43:49];
  }
  function draw(id,station,p,lean=[0,0]){
    if(active!==station){if(active)scene.remove(active.group);scene.add(station.group);active=station;}
    if(w!==canvas.clientWidth||h!==canvas.clientHeight){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(Math.max(w,1),Math.max(h,1),false);}
    camera.aspect=w/Math.max(1,h);
    const at=p*3,part=Math.min(2,Math.floor(at)),sub=at-part;
    const next=(part+1)%3,a=pose(station,id,part),b=pose(station,id,next);
    const blend=T.MathUtils.smoothstep(sub,.64,.995),target=a[1].lerp(b[1],blend);
    camera.position.copy(a[0]).lerp(b[0],blend);
    camera.position.x+=.08*Math.sin(p*2*Math.PI)+lean[0]*.16;camera.position.y+=.026*Math.sin(p*4*Math.PI)+lean[1]*.07;
    if(camera.aspect<.92)camera.position.sub(target).multiplyScalar(id==='energy'?1.38:1.18).add(target);
    camera.fov=T.MathUtils.lerp(a[2],b[2],blend)+(camera.aspect<.92?6:0);
    camera.lookAt(target);camera.updateProjectionMatrix();station.update(p);renderer.render(scene,camera);
  }
  return {prepare,draw};
}

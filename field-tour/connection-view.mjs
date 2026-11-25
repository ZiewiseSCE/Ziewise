const selectors=['local','gpt','claude','gemini'];
const targets=[[.64,.87,-.08],[.833,.869,.196],[.919,.869,.194],[1.000,.869,.189]];
const eyes=[[.98,1.18,.96],[.97,1.06,.90],[1.085,1.055,.89],[1.19,1.057,.88]];
export function frameConnection(T,station,shot,pos,look){
  const index=value=>Math.max(0,selectors.indexOf(value));
  const world=([x,y,z])=>new T.Vector3(station.side*(3.55-z),y,station.z+station.side*x);
  if(shot.from){pos.copy(world(eyes[index(shot.from)]));look.copy(world(targets[index(shot.from)]));}
  const u=T.MathUtils.smoothstep(shot.blend,0,1),i=index(shot.to);
  pos.lerp(world(eyes[i]),u);look.lerp(world(targets[i]),u);
  return shot.from?1:u;
}

// Selecting a model traces the logical route on the actual desktop devices.
export function buildConnectionPath(T,parent){
  const group=new T.Group();group.name='Selected inference route';group.userData.dynamic=true;group.visible=false;parent.add(group);
  const green=new T.MeshBasicMaterial({color:0x63c59f,transparent:true,opacity:.72,depthWrite:false,toneMapped:false});
  const amber=new T.MeshBasicMaterial({color:0xf3b95f,transparent:true,opacity:.85,depthWrite:false,toneMapped:false});
  const dot=new T.MeshBasicMaterial({color:0xeaffc0,toneMapped:false});
  const line=(points,material)=>{
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
    const tube=new T.Mesh(new T.TubeGeometry(path,48,.004,7,false),material);
    const pulse=new T.Mesh(new T.SphereGeometry(.014,14,10),dot);group.add(tube,pulse);return {path,tube,pulse};
  };
  const inward=line([[-.845,.925,.098],[-.83,.808,.304],[-.63,.79,.345],[.32,.792,.343],[.445,.823,.214],[.64,.867,-.033]],green);
  const local=line([[.64,.867,-.033],[.553,.799,-.047],[.35,.793,-.092],[.15,.817,-.112],[-.055,.901,-.19]],green);
  const remote=targets.slice(1).map(([x])=>line([[.64,.867,-.033],[.673,.803,.065],[.64,.792,.192],[.712,.794,.309],[x,.809,.318],[x,.833,.202]],amber));
  return (selected,time)=>{
    group.visible=!!selected;if(!selected)return;
    const i=selectors.indexOf(selected);
    for(const [n,part] of [inward,local,...remote].entries()){
      part.tube.visible=part.pulse.visible=n===0||(n===1?i===0:n-1===i);
      if(part.pulse.visible)part.path.getPointAt((time*.60+n*.37)%1,part.pulse.position);
    }
  };
}

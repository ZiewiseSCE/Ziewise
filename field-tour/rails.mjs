// Each sequence is blocked from an operator's eye in station-local metres.
// The three positions frame the incoming work, its processing and the operator's decision.
const positions={
  design:[[-1.32,1.70,2.86],[-.36,1.48,1.52],[.86,1.70,1.73]],
  systems:[[-1.24,1.69,1.99],[.04,1.56,1.28],[1.30,1.43,1.38]],
  vision:[[-1.02,1.68,2.26],[-.23,1.32,1.40],[1.18,1.50,1.56]],
  safety:[[1.48,1.45,2.43],[-1.11,1.60,1.43],[.85,1.49,1.82]],
  maintenance:[[-1.35,1.48,2.10],[-.37,1.38,1.42],[.91,1.56,1.55]],
  count:[[-1.49,1.63,2.17],[-.18,1.78,1.56],[1.1,1.50,1.42]],
  edge:[[-1.10,1.57,2.12],[.08,1.39,1.42],[.99,1.71,1.60]],
  observer:[[1.36,1.66,1.98],[-.68,1.61,1.24],[.37,1.52,1.19]],
  print:[[-1.02,1.46,1.94],[.62,1.52,1.36],[.41,1.27,1.35]],
  knowledge:[[-1.26,1.49,1.62],[-.06,1.54,1.33],[1.28,1.36,1.31]],
  hr:[[-1.29,1.54,1.69],[-.05,1.59,1.39],[1.24,1.43,1.44]],
  finance:[[-1.18,1.41,1.68],[-.19,1.56,1.32],[1.01,1.48,1.31]],
  purchase:[[-1.32,1.62,1.96],[-.09,1.54,1.37],[.91,1.45,1.30]],
  sales:[[-1.18,1.65,2.05],[-.08,1.50,1.35],[1.09,1.57,1.40]],
  roi:[[-1.23,1.56,1.87],[-.13,1.68,1.45],[1.11,1.45,1.47]],
  poc:[[-1.19,1.60,2.13],[-.22,1.48,1.36],[1.13,1.59,1.53]]
};
export function cameraRail(T,s,prior,entry,brief){
  const vec=(x,y,z)=>new T.Vector3(x,y,z);
  const station=(along,y,depth)=>vec(s.side*(3.55-depth),y,s.z+s.side*along);
  const terminal=t=>vec(t.side*.49,1.62,t.z-.94);
  const present=prior&&!entry;
  const direction=present?Math.sign(s.z-prior.z)||-1:-1;
  const start=present?terminal(prior):s.id==='design'&&!brief?station(-1.56,1.51,2.24):vec(-s.side*.48,1.72,s.z+3.4);
  const work=positions[s.id].map(([x,y,z])=>station(x,y,brief?z:z+.34));
  const landing=present||s.id!=='design'||brief?vec(s.side*.66,1.66,s.z-direction*1.43):station(-.82,1.58,2.19);
  const delta=Math.abs(s.z-start.z);
  const middle=present?vec((start.x+landing.x)*.22,1.70,(start.z+landing.z)*.5):start.clone().lerp(landing,.45);
  const travel=new T.CatmullRomCurve3([start,middle,landing,work[0]],false,'centripetal');
  const inspect=new T.CatmullRomCurve3([work[0],work[1],work[2],terminal(s)],false,'centripetal');
  const gate=present?Math.min(.39,.19+delta*.008):s.id==='design'&&!brief?.14:.25;
  return {travel,inspect,gate,direction,distance:delta,opening:!present,terminal,work};
}

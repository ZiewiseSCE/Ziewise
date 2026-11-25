// Six diffuse hemispheres per position, sampled from window, skylight and wall radiance.
const volumes=new WeakMap();
export function loadDaylight(T){
  if(!volumes.has(T))volumes.set(T,prepareDaylight(T).catch(error=>{volumes.delete(T);throw error;}));
  return volumes.get(T);
}
async function prepareDaylight(T) {
  const response=await fetch(new URL('./finishes/daylight-volume.bin',import.meta.url));
  if(!response.ok)throw Error('Daylight volume');
  const bytes=new Uint8Array(await response.arrayBuffer()), nx=17,ny=8,nz=73;
  if(bytes.length!==6*nx*ny*nz*4)throw Error('Incomplete daylight volume');
  const map=new T.Data3DTexture(bytes,nx*6,ny,nz);
  map.format=T.RGBAFormat;map.minFilter=map.magFilter=T.LinearFilter;map.unpackAlignment=1;map.needsUpdate=true;
  const grain=await new T.TextureLoader().loadAsync(new URL('./finishes/rusty_painted_metal-rough.webp',import.meta.url).href);
  grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.anisotropy=4;
  const applied=new WeakSet();
  return group=>group.traverse(node=>{
    if(!node.isMesh)return;
    for(const m of Array.isArray(node.material)?node.material:[node.material]){
      if(!m?.isMeshStandardMaterial||m.transparent||applied.has(m))continue;
      applied.add(m);
      const micro=!m.map&&!m.roughnessMap&&!m.normalMap&&m.metalness>.14;
      const original=m.onBeforeCompile, key=m.customProgramCacheKey();
      m.customProgramCacheKey=()=>key+'/facility-daylight-v1/'+Number(micro);
      m.onBeforeCompile=function(shader,renderer){
        original.call(this,shader,renderer);
        shader.uniforms.facilityDaylight={value:map};
        if(micro)shader.uniforms.surfaceGrain={value:grain};
        shader.vertexShader='varying vec3 facilityPoint;\n'+shader.vertexShader.replace('#include <project_vertex>',
          '#include <project_vertex>\nvec4 facilityVertex=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nfacilityVertex=instanceMatrix*facilityVertex;\n#endif\nfacilityPoint=(modelMatrix*facilityVertex).xyz;');
        shader.fragmentShader=`varying vec3 facilityPoint;
        uniform highp sampler3D facilityDaylight;
        vec3 daylightLobe(vec3 q,float face){
          return texture(facilityDaylight,vec3((face*17.+.5+q.x*16.)/102.,(.5+q.y*7.)/8.,(.5+q.z*72.)/73.)).rgb;
        }
        `+shader.fragmentShader.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
          vec3 fn=inverseTransformDirection(normal,viewMatrix);
          vec3 fq=clamp((facilityPoint-vec3(-6.88,.04,-49.9))/vec3(13.76,5.64,62.05),0.,1.);
          vec3 fday=daylightLobe(fq,fn.x>=0.?0.:1.)*fn.x*fn.x+daylightLobe(fq,fn.y>=0.?2.:3.)*fn.y*fn.y+daylightLobe(fq,fn.z>=0.?4.:5.)*fn.z*fn.z;
          irradiance+=fday*2.15;
        `);
        if(micro){
          shader.fragmentShader='uniform sampler2D surfaceGrain;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            vec3 gn=abs(normalize(cross(dFdx(facilityPoint),dFdy(facilityPoint))));
            vec2 guv=gn.y>max(gn.x,gn.z)?facilityPoint.xz:gn.x>gn.z?facilityPoint.zy:facilityPoint.xy;
            float worn=texture2D(surfaceGrain,guv*2.25).r;
            roughnessFactor=clamp(roughnessFactor+(worn-.56)*.28,.08,.98);
            diffuseColor.rgb*=.971+.066*worn;`);
        }
      };
      m.needsUpdate=true;
    }
  });
}

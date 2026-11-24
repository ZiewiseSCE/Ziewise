// The public site stores the licensed material scans locally, alongside the geometry.
export async function applyFinishes(T, scene, building, camera) {
  const loader=new T.TextureLoader();
  const wall=new Map();
  building.traverse(node=>{if(node.material?.name)wall.set(node.material.name,node.material);});
  async function texture(name,repeat,color) {
    const map=await loader.loadAsync(new URL('./finishes/'+name,import.meta.url).href);
    map.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;map.anisotropy=4;
    if(repeat){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.setScalar(repeat);}
    return map;
  }
  const promises=[
    Promise.all([texture('hangar-slab-basecolor.webp',1.58,true),texture('hangar-slab-normal-gl.webp',1.58,false)]).then(([base,bump])=>{
      const mat=wall.get('workshop concrete');if(!mat)return;
      mat.map=base;mat.normalMap=bump;mat.normalScale.set(.49,.49);mat.color.setHex(0xb3c0bf);mat.metalness=.095;mat.roughness=.70;
      // Window bays project broad daylight and fine mullion shadows over the crossing lanes.
      mat.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec3 vFloorWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvFloorWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vFloorWorld;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float across=smoothstep(-5.0,-2.1,vFloorWorld.x)*(1.0-smoothstep(4.0,6.65,vFloorWorld.x));
          float along=mod(vFloorWorld.z+.57*vFloorWorld.x+4.4,6.4);
          float frame=smoothstep(.13,.36,along)*(1.0-smoothstep(5.15,5.55,along));
          float pane=abs(fract((along-.14)/1.40)-.5);
          float sunlight=across*frame*(.58+.42*smoothstep(.01,.09,pane));
          diffuseColor.rgb*=mix(vec3(.70,.76,.83),vec3(1.34,1.22,1.07),sunlight);`);
      };
      mat.needsUpdate=true;
    }),
    Promise.all([texture('fastened-sheet-basecolor.webp',1.07,true),texture('fastened-sheet-normal-gl.webp',1.07,false)]).then(([base,bump])=>{
      const mat=wall.get('workshop wall panels');if(!mat)return;
      mat.map=base;mat.normalMap=bump;mat.normalScale.set(.38,.38);mat.roughness=.64;mat.metalness=.33;mat.color.setHex(0xa3b4ad);mat.needsUpdate=true;
      const lower=wall.get('workshop lower wall');if(lower){lower.color.setHex(0x788a83);lower.roughness=.72;}
    }),
    texture('daylight-yard-horizon.webp',0,true).then(photo=>{
      const geom=new T.SphereGeometry(84,72,18,0,2*Math.PI,T.MathUtils.degToRad(48),T.MathUtils.degToRad(56));
      const mat=new T.MeshBasicMaterial({map:photo,side:T.BackSide,fog:false,toneMapped:false,depthWrite:false,color:0xe2eaec});
      const shell=new T.Mesh(geom,mat);shell.rotation.y=.10;shell.renderOrder=-500;shell.frustumCulled=false;
      shell.onBeforeRender=()=>{shell.position.copy(camera.position);shell.updateMatrixWorld(true);};
      scene.add(shell);
      for(const group of building.children)if(group.name.startsWith('Campus exterior')||group.name==='Decision room outlook')group.visible=false;
    })
  ];
  await Promise.allSettled(promises);
}

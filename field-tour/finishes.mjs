// The public site stores the licensed material scans locally, alongside the geometry.
export async function applyFinishes(T, scene, building) {
  const loader=new T.TextureLoader();
  const wall=new Map();
  building.traverse(node=>{if(node.material?.name)wall.set(node.material.name,node.material);});
  async function texture(name,repeat,color,folder='./finishes/') {
    const map=await loader.loadAsync(new URL(folder+name,import.meta.url).href);
    map.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;map.anisotropy=4;
    if(repeat){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.setScalar(repeat);}
    return map;
  }
  const promises=[
    ...[['terrazzo passage','terrazzo_tiles',1.75,0xc5c2b8,.39,.78],['interior plaster','plastered_wall_02',1.25,0xd9d8d2,.43,.95],
        ['acoustic ceiling','plastered_wall_02',2.4,0xe3e3de,.36,.97]].map(async ([label,key,repeat,tint,scale,r])=>{
      const material=wall.get(label);if(!material)return;
      const [color,normal,rough]=await Promise.all(['diff','nor_gl','rough'].map((c,i)=>texture(key+'-'+c+'.webp',repeat,i===0)));
      Object.assign(material,{map:color,normalMap:normal,roughnessMap:rough,roughness:r,metalness:.015});
      material.color.setHex(tint);material.normalScale.setScalar(scale);material.needsUpdate=true;
    }),
    ...[['workshop concrete','hangar_concrete_floor',1.58],['workshop wall panels','corrugated_iron_03',1.07],
        ['brushed structure','rusty_painted_metal',2.2],['galvanized air duct','rusty_painted_metal',1.4]].map(async ([label,key,repeat])=>{
      const m=wall.get(label);if(!m)return;
      m.roughnessMap=await texture(key+'-rough.webp',repeat,false);m.needsUpdate=true;
    }),
    Promise.all(['color','normal','rough'].map((k,i)=>texture('oak-'+k+'.webp',1,i===0,'./office-materials/maps/'))).then(([color,normal,rough])=>{
      for(const [label,tint] of [['oak flooring',0xccaa87],['oak joinery',0xc8a17e],['walnut linings',0x93775c]]){
        const mat=wall.get(label);if(!mat)continue;
        mat.map=color;mat.normalMap=normal;mat.roughnessMap=rough;mat.color.setHex(tint);mat.normalScale.set(.26,.26);mat.roughness=.83;mat.needsUpdate=true;
      }
    }),
    Promise.all(['color','normal','rough'].map((k,i)=>texture('weave-'+k+'.webp',2.9,i===0,'./office-materials/maps/'))).then(([color,normal,rough])=>{
      const mat=wall.get('office carpet');if(!mat)return;
      mat.map=color;mat.normalMap=normal;mat.roughnessMap=rough;mat.color.setHex(0x94958e);mat.normalScale.set(.27,.27);mat.roughness=1;mat.needsUpdate=true;
    }),
    texture('metal-normal.webp',2,false,'./office-materials/maps/').then(normal=>{
      for(const [label,amount] of [['painted steel beams',.12],['painted roof panels',.09]]){
        const mat=wall.get(label);if(!mat)continue;mat.normalMap=normal;mat.normalScale.set(amount,amount);mat.needsUpdate=true;
      }
    }),
    Promise.all([texture('hangar-slab-basecolor.webp',1.58,true),texture('hangar-slab-normal-gl.webp',1.58,false)]).then(([base,bump])=>{
      const mat=wall.get('workshop concrete');if(!mat)return;
      mat.map=base;mat.normalMap=bump;mat.normalScale.set(.78,.78);mat.color.setHex(0xc3c2bc);mat.metalness=.035;mat.roughness=.86;
      // Window bays project broad daylight and fine mullion shadows over the crossing lanes.
      mat.onBeforeCompile=shader=>{
        shader.vertexShader='varying vec3 vFloorWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvFloorWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vFloorWorld;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float across=smoothstep(-5.0,-2.1,vFloorWorld.x)*(1.0-smoothstep(4.0,6.65,vFloorWorld.x));
          float along=mod(vFloorWorld.z+.57*vFloorWorld.x+4.4,6.4);
          float frame=smoothstep(.13,.36,along)*(1.0-smoothstep(5.15,5.55,along));
          float pane=abs(fract((along-.14)/1.40)-.5);
          float sunlight=across*frame*(.58+.42*smoothstep(.01,.09,pane));
          diffuseColor.rgb*=mix(vec3(.92,.94,.97),vec3(1.035,1.025,1.01),sunlight);`);
      };
      mat.needsUpdate=true;
    }),
    Promise.all([texture('fastened-sheet-basecolor.webp',1.07,true),texture('fastened-sheet-normal-gl.webp',1.07,false)]).then(([base,bump])=>{
      const mat=wall.get('workshop wall panels');if(!mat)return;
      mat.map=base;mat.normalMap=bump;mat.normalScale.set(.71,.71);mat.roughness=.81;mat.metalness=.31;mat.color.setHex(0xc4c4bf);mat.needsUpdate=true;
      const lower=wall.get('workshop lower wall');if(lower){lower.map=base;lower.normalMap=bump;lower.normalScale.setScalar(.32);lower.color.setHex(0x9da3a0);lower.roughness=.78;lower.needsUpdate=true;}
    }),
    texture('daylight-yard-horizon.webp',0,true).then(photo=>{
      const geom=new T.SphereGeometry(84,72,18,0,2*Math.PI,T.MathUtils.degToRad(48),T.MathUtils.degToRad(56));
      const mat=new T.MeshBasicMaterial({map:photo,side:T.BackSide,fog:false,toneMapped:false,depthWrite:false,color:0xe2eaec});
      const shell=new T.Mesh(geom,mat);shell.rotation.y=.10;shell.renderOrder=-500;shell.frustumCulled=false;
      const eye=new T.Vector3();shell.onBeforeRender=(_r,_s,activeCamera)=>{activeCamera.getWorldPosition(eye);shell.position.copy(eye);shell.updateMatrixWorld(true);};
      scene.add(shell);
      for(const group of building.children)if(group.name.startsWith('Campus exterior')||group.name==='Decision room outlook')group.visible=false;
    })
  ];
  const glass=wall.get('exterior glazing');
  if(glass){
    glass.metalness=0;glass.roughness=.092;glass.envMapIntensity=.76;
    glass.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'diffuseColor.a=.085+.34*pow(1.-clamp(abs(dot(normal,normalize(vViewPosition))),0.,1.),4.);\n#include <opaque_fragment>');};
    glass.needsUpdate=true;
  }
  await Promise.allSettled(promises);
}

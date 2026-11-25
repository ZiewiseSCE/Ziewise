import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';

// Dimensions are in metres; y is the surface supporting the lowest point of the asset.
const layout={
  drill_press_01:[{x:4.99,z:.63,y:0,h:1.93,yaw:-1.16},{x:-5.32,z:-10.85,y:0,h:1.86,yaw:1.03}],
  portable_welding_cart:[{x:-4.9,z:2.05,y:0,h:1.17,yaw:1.92},{x:5.08,z:-8.15,y:0,h:1.17,yaw:-.72}],
  portable_generator:[{x:4.96,z:-16.15,y:0,h:.87,yaw:-1.08}],
  industrial_caged_sconce:[{x:-6.70,z:2.32,y:2.16,h:.32,yaw:1.57},{x:6.70,z:-6.65,y:2.13,h:.32,yaw:-1.57}],
  metal_tool_chest:[{x:3.14,z:6.70,y:.89,h:.45,yaw:-1.55}],
  industrial_microscope:[{x:3.05,z:5.97,y:.89,h:.405,yaw:-1.17}],
  steel_frame_shelves_01:[{x:5.84,z:5.45,y:0,h:2.23,yaw:-1.56},{x:-5.72,z:-15.15,y:0,h:2.06,yaw:1.53}],
  industrial_storage_cart:[{x:-3.35,z:-17.87,y:0,h:1.01,yaw:1.16}],
  korean_fire_extinguisher_01:[{x:-2.39,z:-6.15,y:0,h:.51,yaw:1.23},{x:4.47,z:-21.95,y:0,h:.51,yaw:-1.37}],
  plastic_crate_02:[{x:5.61,z:5.24,y:.1,h:.24,yaw:-1.55},{x:5.63,z:5.73,y:.1,h:.24,yaw:-1.49},{x:-5.53,z:-15.17,y:.12,h:.23,yaw:1.49}]
};

function opticalBench(T,scene,batchStatic){
  const group=new T.Group(),block=new T.BoxGeometry(1,1,1),foot=new T.CylinderGeometry(1,1,1,16);
  group.name='Optical workbench';group.position.set(3.09,0,6.34);
  const frame=new T.MeshStandardMaterial({color:0x4a5553,roughness:.43,metalness:.63});
  const edge=new T.MeshStandardMaterial({name:'beech work surface',color:0xbca78a,roughness:.61});
  const zinc=new T.MeshStandardMaterial({color:0x989f9c,roughness:.37,metalness:.77});
  const rubber=new T.MeshStandardMaterial({color:0x292b29,roughness:.87});
  function add(x,y,z,w,h,d,mat,geom=block){
    const mesh=new T.Mesh(geom,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  add(0,.868,0,.71,.044,1.61,edge);add(0,.217,0,.58,.019,1.45,zinc);
  for(const x of [-.294,.294]){
    for(const y of [.235,.81])add(x,y,0,.027,.048,1.46,frame);
    for(const z of [-.702,.702]){
      add(x,.445,z,.038,.787,.038,frame);add(x,.045,z,.012,.067,.012,zinc,foot);
      add(x,.015,z,.031,.03,.031,rubber,foot);
    }
  }
  for(const z of [-.702,.702])for(const y of [.235,.81])add(0,y,z,.585,.048,.032,frame);
  batchStatic(T,group);scene.add(group);
  return new T.TextureLoader().loadAsync(new URL('./office-materials/maps/oak-color.webp',import.meta.url).href).then(map=>{
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;edge.map=map;edge.color.setHex(0xc59d76);edge.needsUpdate=true;
  }).catch(()=>{});
}

export function placeEquipment(T,scene,batchStatic) {
  const assets=new Map(),loader=new GLTFLoader();
  const bench=opticalBench(T,scene,batchStatic);
  async function load(key){
    const model=await loader.loadAsync(new URL('./equipment/'+key+'.glb',import.meta.url).href);
    const source=model.scene;
    source.traverse(node=>{
      if(!node.isMesh)return;
      node.castShadow=true;node.receiveShadow=true;
      const materials=Array.isArray(node.material)?node.material:[node.material];
      for(const m of materials){
        for(const map of [m.map,m.normalMap,m.roughnessMap,m.aoMap])if(map)map.anisotropy=4;
      }
    });
    const box=new T.Box3().setFromObject(source),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0)return;
    const copies=[];
    for(const item of layout[key]){
      const mount=new T.Group(),model=source.clone(true),s=item.h/size.y;
      model.position.sub(new T.Vector3(center.x,box.min.y,center.z));
      mount.name=key;mount.add(model);mount.scale.setScalar(s);mount.rotation.y=item.yaw;
      mount.position.set(item.x,item.y,item.z);
      scene.add(mount);copies.push(mount);
    }
    assets.set(key,copies);
  }
  const tasks=new Map();
  function demand(key){if(!tasks.has(key))tasks.set(key,load(key));return tasks.get(key);}
  function near(z){return Promise.allSettled([bench,...Object.keys(layout).filter(key=>layout[key].some(item=>Math.abs(item.z-z)<7)).map(demand)]);}
  return {get ready(){return Promise.all([bench,...Object.keys(layout).map(demand)]);},near,assets,visibleFrom(z,maxDistance){
    for(const groups of assets.values())for(const group of groups)group.visible=Math.abs(group.position.z-z)<maxDistance;
  }};
}

// Combine immobile props within one bay, retaining individual mechanisms and transparent surfaces.
export function batchStatic(T, root) {
  root.updateWorldMatrix(true,true);
  const inverse=new T.Matrix4().copy(root.matrixWorld).invert();
  const sets=new Map();
  function collect(node) {
    if(node.userData.dynamic)return;
    if(node.isMesh && !node.isInstancedMesh && !node.isSkinnedMesh && !Array.isArray(node.material)) {
      const g=node.geometry,m=node.material;
      if(g?.attributes.position&&g.attributes.normal&&!m.transparent&&!m.vertexColors&&!g.morphAttributes?.position) {
        const key=[m.uuid,node.castShadow,node.receiveShadow,node.renderOrder].join('/');
        if(!sets.has(key))sets.set(key,[]);
        sets.get(key).push(node);
      }
    }
    for(const child of node.children)collect(child);
  }
  collect(root);
  const transform=new T.Matrix4(),rotation=new T.Matrix3(),p=new T.Vector3(),n=new T.Vector3();
  for(const list of sets.values()) {
    if(list.length<2)continue;
    let vertices=0,indices=0;
    for(const mesh of list) {
      vertices+=mesh.geometry.attributes.position.count;
      indices+=mesh.geometry.index?.count??mesh.geometry.attributes.position.count;
    }
    const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),uvs=new Float32Array(vertices*2);
    const ids=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);
    let vBase=0,iBase=0;
    for(const mesh of list) {
      const g=mesh.geometry,source=g.attributes.position,normal=g.attributes.normal,uv=g.attributes.uv;
      transform.multiplyMatrices(inverse,mesh.matrixWorld);rotation.getNormalMatrix(transform);
      for(let j=0;j<source.count;j++) {
        p.fromBufferAttribute(source,j).applyMatrix4(transform).toArray(positions,(vBase+j)*3);
        n.fromBufferAttribute(normal,j).applyNormalMatrix(rotation).toArray(normals,(vBase+j)*3);
        if(uv){uvs[(vBase+j)*2]=uv.getX(j);uvs[(vBase+j)*2+1]=uv.getY(j);}
      }
      const count=g.index?.count??source.count;
      for(let j=0;j<count;j++)ids[iBase+j]=vBase+(g.index?g.index.getX(j):j);
      iBase+=count;vBase+=source.count;
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.BufferAttribute(positions,3));
    g.setAttribute('normal',new T.BufferAttribute(normals,3));
    g.setAttribute('uv',new T.BufferAttribute(uvs,2));
    g.setIndex(new T.BufferAttribute(ids,1));g.computeBoundingSphere();
    const first=list[0],mesh=new T.Mesh(g,first.material);
    mesh.name=first.material.name;mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.renderOrder=first.renderOrder;
    for(const previous of list)previous.removeFromParent();
    root.add(mesh);
  }
}

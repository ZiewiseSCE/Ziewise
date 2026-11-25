// Continuous customer facility, in metres. The z axis runs from the receiving hall to the offices.
export function buildArchitecture(T) {
  const building = new T.Group();
  building.name = 'Manufacturing hall and offices';
  const up = new T.Vector3(0, 1, 0);
  const direction = new T.Vector3();
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const cylinders = new Map();
  const halfWidth = 6.94;
  const thresholdZ = -21.6;

  function cell(name) {
    const part = new T.Group();
    part.name = name;
    part.userData.batchCell = true;
    building.add(part);
    return part;
  }

  function random(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function canvasTexture(width, height, draw, repeat = true) {
    let canvas;
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    } else if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
    }
    const ctx = canvas?.getContext('2d');
    if (!ctx) return null;
    draw(ctx, width, height);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = texture.wrapT = repeat ? T.RepeatWrapping : T.ClampToEdgeWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  function noiseGrid(count, rand) {
    const grid = Float32Array.from({ length: count * count }, rand);
    return (x, y) => {
      const gx = x * count, gy = y * count;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = grid[(iy % count) * count + ix % count];
      const b = grid[(iy % count) * count + (ix + 1) % count];
      const c = grid[((iy + 1) % count) * count + ix % count];
      const d = grid[((iy + 1) % count) * count + (ix + 1) % count];
      return a + sx * (b - a) + sy * (c - a + sx * (a - b - c + d));
    };
  }

  function mineral(base, grit, seed, flecks = false) {
    const rand = random(seed);
    const wide = noiseGrid(5, rand), close = noiseGrid(23, rand);
    return canvasTexture(512, 512, (ctx, w, h) => {
      const data = ctx.createImageData(w, h), pixels = data.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = 4 * (y * w + x);
          const value = (wide(x / w, y / h) - .5) * 16 + (close(x / w, y / h) - .5) * 9 + (rand() - .5) * grit;
          pixels[i] = base[0] + value;
          pixels[i + 1] = base[1] + value;
          pixels[i + 2] = base[2] + value;
          pixels[i + 3] = 255;
        }
      }
      ctx.putImageData(data, 0, 0);
      for (let i = 0; i < (flecks ? 7300 : 2600); i++) {
        const x = rand() * w, y = rand() * h;
        const r = .28 + rand() * (flecks ? 1.32 : .88);
        ctx.fillStyle = rand() < .55 ? 'rgba(55,56,48,.27)' : 'rgba(250,248,232,.40)';
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x, y - .5 * r);
        ctx.lineTo(x + 1.3 * r, y + .3 * r); ctx.lineTo(x + .3 * r, y + r); ctx.fill();
      }
      if (!flecks) {
        for (let i = 0; i < 40; i++) {
          const x = rand() * w, y = rand() * h;
          ctx.strokeStyle = 'rgba(60,66,64,.08)'; ctx.lineWidth = .6 + rand() * .8;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 1, x + 20 + rand() * 48, y + 2 + rand() * 3); ctx.stroke();
        }
      }
    });
  }

  const woodMap = canvasTexture(384, 512, (ctx, w, h) => {
    const rand = random(673), grain = noiseGrid(19, rand);
    const img = ctx.createImageData(w, h), pixels = img.data;
    const boards = Array.from({ length: 9 }, () => (rand() - .5) * 15);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h, grainShift = grain(u, v) - .5;
      const fibre = .5 + .5 * Math.cos(2 * Math.PI * (49 * u + .54 * Math.sin(2 * Math.PI * v) + grainShift * 1.35));
      const px = 4 * (y * w + x), board = Math.floor(u * 9);
      const joint = u * 9 - board < .012 ? 14 : 0;
      const shade = boards[board] + grainShift * 17 - 12 * fibre ** 4 + (rand() - .5) * 9 - joint;
      pixels[px] = 174 + shade; pixels[px + 1] = 132 + shade; pixels[px + 2] = 94 + shade * .84; pixels[px + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });

  const carpetMap = canvasTexture(256, 256, (ctx, w, h) => {
    const rand = random(151); ctx.fillStyle = '#777c75'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const value = Math.floor(103 + (x % 8 === 0 ? 5 : 0) + rand() * 28);
      ctx.fillStyle = `rgb(${value},${value + 5},${value + 1})`;
      ctx.fillRect(x, y, 1 + (y % 4 === 0), 2);
    }
  });

  const skyMap = canvasTexture(1024, 256, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#a9c6d3'); sky.addColorStop(.63, '#dce5e5'); sky.addColorStop(1, '#edf0e6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    for (const [height, amplitude, offset, color] of [[.73,.07,1.1,'#c1ccca'],[.82,.052,2.7,'#aab9b5'],[.91,.029,1.8,'#99aaa2']]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 2) {
        const t = 2 * Math.PI * x / w;
        const ridge = .55 * Math.cos(2 * t + offset) + .24 * Math.cos(5 * t - offset) + .18 * Math.sin(7 * t) + .03 * Math.sin(29 * t);
        ctx.lineTo(x, (height + amplitude * ridge) * h);
      }
      ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
    }
  }, false);

  const leafMap = canvasTexture(192, 192, (ctx, w, h) => {
    const rand = random(8012);
    function branch(x,y,len,angle,width,depth) {
      const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
      ctx.strokeStyle = depth > 1 ? '#655e4e' : '#68694f'; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(ex,ey); ctx.stroke();
      if (depth <= 2) {
        for (let k = 0; k < 34; k++) {
          const rad = Math.sqrt(rand()) * (depth + 2) * 3.8, a = rand() * Math.PI * 2, light = rand();
          ctx.fillStyle = light < .32 ? '#627459' : light < .68 ? '#788868' : '#92a17e';
          ctx.fillRect(ex + Math.cos(a) * rad, ey + Math.sin(a) * rad * .78, 1.9 + rand() * 2.7, 1 + rand() * 2);
        }
      }
      if (!depth) return;
      branch(ex,ey,len * (.65 + .07 * rand()),angle - .24 - .46 * rand(),width * .65,depth - 1);
      branch(ex,ey,len * (.63 + .09 * rand()),angle + .22 + .47 * rand(),width * .65,depth - 1);
    }
    branch(w * .50,h,61,-Math.PI / 2,4.4,6);
    branch(w * .49,h * .82,44,-2.02,2.6,5);
    branch(w * .51,h * .82,43,-1.05,2.7,5);
  }, false);

  const edgeMap = canvasTexture(96, 8, (ctx, w, h) => {
    const ramp=ctx.createLinearGradient(0,0,w,0);
    ramp.addColorStop(0,'rgba(36,42,35,.42)'); ramp.addColorStop(.16,'rgba(42,45,39,.24)');
    ramp.addColorStop(.47,'rgba(49,51,44,.085)'); ramp.addColorStop(1,'rgba(50,53,46,0)');
    ctx.fillStyle=ramp; ctx.fillRect(0,0,w,h);
  }, false);
  const shadowMap = canvasTexture(96, 96, (ctx, w, h) => {
    const fade=ctx.createRadialGradient(w/2,h/2,w*.09,w/2,h/2,w*.5);
    fade.addColorStop(0,'rgba(37,39,32,.43)'); fade.addColorStop(.44,'rgba(42,43,34,.25)');
    fade.addColorStop(1,'rgba(45,46,40,0)'); ctx.fillStyle=fade; ctx.fillRect(0,0,w,h);
  }, false);
  const facadeMap = canvasTexture(512, 256, (ctx,w,h) => {
    const rand=random(1184), cw=w/8, ch=h/4;
    ctx.fillStyle='#bcc0b6'; ctx.fillRect(0,0,w,h);
    for(let row=0;row<4;row++) for(let col=0;col<8;col++) {
      const x=col*cw+3, y=row*ch+6, shade=rand();
      const light=ctx.createLinearGradient(x,y,x,y+ch*.83);
      light.addColorStop(0,shade<.3?'#92aaa8':'#aabdbb');
      light.addColorStop(.54,shade<.3?'#819895':'#98aeae');
      light.addColorStop(1,shade<.3?'#778c88':'#8b9e9d');
      ctx.fillStyle=light; ctx.fillRect(x,y,cw-6,ch*.78);
      if(rand()>.54){ctx.fillStyle='rgba(207,208,188,.54)';ctx.fillRect(x,y,cw-6,ch*(.12+rand()*.36));}
      ctx.fillStyle='rgba(78,92,89,.67)'; ctx.fillRect(x+cw*.56,y,1.9,ch*.78);
      ctx.fillStyle='rgba(211,215,205,.75)';ctx.fillRect(x,y+ch*.78,cw-6,2.1);
    }
  });

  const std = (color, roughness = .76, metalness = .06, extra = {}) => new T.MeshStandardMaterial({color, roughness, metalness, ...extra});
  function paintMap(map, fallback, roughness, metalness = .02) {
    return std(map ? 0xffffff : fallback, roughness, metalness, map ? { map } : {});
  }
  const epoxy = paintMap(mineral([146,153,147],13,431),0x929993,.65,.07);
  epoxy.name='workshop concrete';
  const stone = paintMap(mineral([193,191,180],15,1243,true),0xc1bfb4,.64,.04);
  const oak = paintMap(woodMap,0xae845e,.60);
  const carpet = paintMap(carpetMap,0x777c75,.99);
  const M = {
    epoxy,stone,oak,carpet,
    cladding:std(0xc0c9c3,.78,.15), roof:std(0xa9b5b2,.83,.13), wainscot:std(0xa2aaa2,.89),
    steel:std(0x596f70,.56,.40), steelEdge:std(0x839694,.53,.38), iron:std(0x475454,.60,.32),
    metal:std(0xacb7b2,.41,.48), darkMetal:std(0x444e4b,.48,.34), pipe:std(0x879793,.54,.44),
    yellow:std(0xd1a148,.70,.18), paint:std(0xd2b66b,.83,.02), fire:std(0x9b6458,.64,.20),
    seam:std(0x7c8680,.96,.01), officeSeam:std(0xa9a79b,.93,.01), white:std(0xdfded3,.87),
    ceiling:std(0xe1e0d4,.93), walnut:std(0x916747,.68,.02), oakLight:std(0xb58d65,.69,.02),
    trim:std(0x555c54,.55,.23), textile:std(0xc8c6b8,.90), officeTrim:std(0x939487,.58,.18),
    warmLight:new T.MeshBasicMaterial({color:0xffebc3,toneMapped:false}), daylight:new T.MeshBasicMaterial({color:0xe5f0ec,toneMapped:false}),
    sky:new T.MeshBasicMaterial({color:skyMap?0xffffff:0xc5d8dd,map:skyMap,side:T.DoubleSide,toneMapped:false}),
    pane:std(0xabc8c7,.20,.14,{transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide}),
    frost:std(0xd0d9cf,.64,.02,{transparent:true,opacity:.50,depthWrite:false,side:T.DoubleSide}),
    shade:std(0xc7c7b9,.89,.01,{transparent:true,opacity:.64,depthWrite:false,side:T.DoubleSide}),
    garden:std(0x778776,.95,.00), exterior:std(0xa9b4b0,.87,.08), extDark:std(0x7b8d90,.85,.10),
    extGlazing:std(0x8ca8ab,.52,.13), extLight:std(0xc6c9bb,.87,.06),
    leaf:std(leafMap?0xffffff:0x7b916d,1,0,{map:leafMap,alphaTest:.43,side:T.DoubleSide}),
    shadow: new T.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:shadowMap?1:0,depthWrite:false}),
    edgeShade: new T.MeshBasicMaterial({map:edgeMap,transparent:true,opacity:edgeMap?1:0,depthWrite:false}),
    facade:paintMap(facadeMap,0xa4b2ae,.84,.05), foliage:std(0xffffff,.55,.005,{vertexColors:true,side:T.DoubleSide}),
    bark:std(0x645844,.90,0), ceramic:std(0xb5b6a6,.70,.06), soil:std(0x494b3c,.97,0),
  };
  M.cladding.name='workshop wall panels';
  M.wainscot.name='workshop lower wall';
  M.oak.name='oak flooring';M.carpet.name='office carpet';M.pane.name='exterior glazing';
  M.roof.name='painted roof panels';M.steel.name='painted steel beams';
  M.walnut.name='walnut linings';M.oakLight.name='oak joinery';
  M.white.name='interior plaster';M.stone.name='terrazzo passage';M.ceiling.name='acoustic ceiling';
  M.pipe.name='galvanized air duct';M.iron.name='brushed structure';

  function add(group, geometry, material, casts = false) {
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = casts || [M.steel,M.steelEdge,M.trim,M.iron].includes(material); mesh.receiveShadow = !material.isMeshBasicMaterial && !material.transparent && material !== M.leaf;
    group.add(mesh); return mesh;
  }
  function box(group, x,y,z,w,h,d,mat,casts=false) {
    const mesh=add(group,unitBox,mat,casts); mesh.position.set(x,y,z); mesh.scale.set(w,h,d); return mesh;
  }
  function rod(group, from, to, radius, mat, sides=12, casts=false) {
    if (!cylinders.has(sides)) cylinders.set(sides,new T.CylinderGeometry(1,1,1,sides,1));
    const mesh=add(group,cylinders.get(sides),mat,casts);
    direction.set(to[0]-from[0],to[1]-from[1],to[2]-from[2]);
    mesh.scale.set(radius,direction.length(),radius);
    mesh.position.set((from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2);
    mesh.quaternion.setFromUnitVectors(up,direction.normalize()); return mesh;
  }
  function member(group, from, to, w, depth, mat, casts=false) {
    direction.set(to[0]-from[0],to[1]-from[1],to[2]-from[2]);
    const mesh=box(group,(from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2,w,direction.length(),depth,mat,casts);
    mesh.quaternion.setFromUnitVectors(up,direction.normalize()); return mesh;
  }
  function quad(group, points, uv, mat) {
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv.flat(),2));
    geo.setIndex([0,1,2,0,2,3]); geo.computeVertexNormals(); return add(group,geo,mat);
  }
  function floor(group,x0,x1,z0,z1,mat,tile=2.7,y=0) {
    const points=[[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0]];
    return quad(group,points,points.map(p=>[p[0]/tile,-p[2]/tile]),mat);
  }
  function wall(group,side,x,z0,z1,y0,y1,mat,tile=2.2) {
    const points=[[x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]];
    if(side>0) points.reverse();
    const surface=quad(group,points,points.map(p=>[p[2]/tile,p[1]/tile]),mat);
    if(!mat.transparent){surface.castShadow=true;mat.shadowSide=T.DoubleSide;}
    return surface;
  }
  function glass(group,side,x,z0,z1,y0,y1) { return wall(group,side,x,z0,z1,y0,y1,M.pane); }

  function edgeShadow(group,side,x,z0,z1,width) {
    const outer=x, inner=x-side*width, a=Math.min(inner,outer), b=Math.max(inner,outer);
    const left=side>0?1:0, right=1-left;
    quad(group,[[a,.012,z1],[b,.012,z1],[b,.012,z0],[a,.012,z0]],[[left,0],[right,0],[right,1],[left,1]],M.edgeShade);
  }
  function footShadow(group,x,z,w,d) {
    quad(group,[[x-w/2,.015,z+d/2],[x+w/2,.015,z+d/2],[x+w/2,.015,z-d/2],[x-w/2,.015,z-d/2]],[[0,0],[1,0],[1,1],[0,1]],M.shadow);
  }

  function profiledWall(group,side,z0,z1,y0,y1,mat) {
    const face=[], tex=[], indices=[];
    const ribs=Math.ceil((z1-z0)/.46), step=(z1-z0)/ribs;
    for(let i=0;i<=ribs;i++) {
      const profile=i===ribs?[[0,0]]:[[0,0],[.12,0],[.17,.026],[.31,.026],[.36,0]];
      for(const [u,rise] of profile) {
        const z=z0+(i+u)*step, x=side*(halfWidth-rise), index=face.length/3;
        face.push(x,y0,z,x,y1,z); tex.push(z/2,y0/2,z/2,y1/2);
        if(index) {
          if(side>0) indices.push(index-2,index+1,index-1,index-2,index,index+1);
          else indices.push(index-2,index-1,index+1,index-2,index+1,index);
        }
      }
    }
    const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(face,3)); geo.setAttribute('uv',new T.Float32BufferAttribute(tex,2));
    geo.setIndex(indices);geo.computeVertexNormals();const panel=add(group,geo,mat,true);panel.material.shadowSide=T.DoubleSide;
  }
  function windowWall(group,side,z0,z1,low,high,office=false,shade=false) {
    const center=(z0+z1)/2, span=z1-z0, x=side*(halfWidth-.052);
    const frame=office?M.trim:M.iron;
    glass(group,side,x,z0,z1,low,high);
    for(const y of [low,high]) box(group,x-side*.03,y,center,.12,office?.078:.095,span,frame);
    const n=Math.max(2,Math.round(span/(office?1.88:1.47)));
    for(let k=0;k<=n;k++) {
      const z=z0+span*k/n;
      box(group,x-side*.03,(low+high)/2,z,.11,high-low,office?.062:.067,frame);
    }
    const transom=office?high-.61:high-.74;
    box(group,x-side*.035,transom,center,.108,.043,span,frame);
    if(!office) box(group,x-side*.092,low-.036,center,.23,.052,span+.1,M.metal);
    if (shade) {
      const shadeEnd=z0+span*.55;
      wall(group,side,x-side*.125,z0+.09,shadeEnd,high-.95,high-.12,M.shade);
      box(group,x-side*.13,high-.96,(z0+.09+shadeEnd)/2,.035,.026,shadeEnd-z0-.09,M.officeTrim);
    }
  }

  const pitchY = x => 5.94 - .056 * Math.abs(x);
  function roofStrip(group,x0,x1,z0,z1,material) {
    const points=[[x0,pitchY(x0),z0],[x1,pitchY(x1),z0],[x1,pitchY(x1),z1],[x0,pitchY(x0),z1]];
    const mesh=quad(group,points,points.map(p=>[p[0]/1.9,p[2]/1.9]),material);
    if(!material.isMeshBasicMaterial&&!material.transparent){mesh.castShadow=true;material.shadowSide=T.DoubleSide;}
  }
  function truss(group,z) {
    const xMax=6.70, bottom=5.11;
    for(const sign of [-1,1]) {
      const x=sign*xMax;
      box(group,x,2.77,z,.205,5.54,.30,M.steel);
      box(group,x-sign*.12,2.77,z,.052,5.54,.41,M.steelEdge);
      box(group,x, .08,z,.42,.14,.53,M.steelEdge);
      footShadow(group,x,z,1.25,1.06);
      box(group,x-sign*.15,4.76,z,.40,.09,.40,M.steel,true);
      member(group,[x,4.64,z],[x-sign*.84,5.14,z],.11,.17,M.steel,true);
      member(group,[x,5.53,z],[0,5.91,z],.115,.16,M.steelEdge,true);
    }
    box(group,0,bottom,z,13.40,.106,.15,M.steel,true);
    const nodes=10;
    for(let j=0;j<nodes;j++) {
      const a=-xMax+2*xMax*j/nodes, b=-xMax+2*xMax*(j+1)/nodes;
      const high=j<nodes/2?a:b, low=j<nodes/2?b:a;
      member(group,[high,pitchY(high)-.07,z],[low,bottom+.04,z],.049,.064,M.steelEdge);
      if(j>0) box(group,a,(pitchY(a)-.12+bottom)/2,z,.042,pitchY(a)-bottom-.12,.057,M.steel);
    }
  }
  function factoryLamp(group,x,z) {
    const y=4.69;
    for(const end of [-.65,.65]) rod(group,[x,y+.09,z+end],[x,5.32,z+end],.008,M.darkMetal,5);
    box(group,x,y+.015,z,.16,.09,1.78,M.iron);
    box(group,x,y-.039,z,.122,.025,1.69,M.daylight);
  }
  function overheadUtilities(group,z0,z1) {
    const mid=(z0+z1)/2, len=z1-z0;
    rod(group,[-4.98,4.84,z0],[-4.98,4.84,z1],.218,M.pipe,22);
    for(const z of [z0+.64,mid,z1-.62]) rod(group,[-4.98,4.84,z-.027],[-4.98,4.84,z+.027],.232,M.metal,24);
    for(const z of [z0+1.22,z1-1.24]) {
      for(const x of [-5.23,-4.73]) rod(group,[x,4.58,z],[x,5.47,z],.013,M.iron,6);
      box(group,-4.98,4.57,z,.60,.047,.052,M.steel);
    }
    rod(group,[-3.68,5.18,z0],[-3.68,5.18,z1],.055,M.fire,12);
    box(group,5.77,4.50,mid,.38,.06,len,M.steel);
    for(const x of [5.60,5.94]) box(group,x,4.565,mid,.034,.13,len,M.metal);
    for(const sign of [-1,1]) {
      const x=sign*6.36;
      box(group,x,4.43,mid,.22,.28,len,M.steel);
      box(group,x,4.58,mid,.29,.046,len,M.steelEdge);
    }
  }
  function serviceDoor(group,side,z0,z1) {
    const x=side*(halfWidth-.035), mid=(z0+z1)/2, span=z1-z0;
    box(group,x,1.98,mid,.11,3.95,span,M.steel);
    for(let y=.12;y<3.87;y+=.19) box(group,x-side*.072,y,mid,.04,.030,span-.12,M.steelEdge);
    for(const z of [z0,z1]) box(group,x-side*.10,2.03,z,.20,4.05,.11,M.iron);
    box(group,x-side*.12,4.06,mid,.42,.31,span+.20,M.metal);
  }
  function factoryBay(z0,z1,index) {
    const g=cell(`Factory bay ${index+1}`), mid=(z0+z1)/2, span=z1-z0;
    floor(g,-halfWidth,halfWidth,z0,z1,M.epoxy,3.45);
    for(const x of [-4.52,4.52]) floor(g,x-.005,x+.005,z0,z1,M.seam,1,.003);
    for(const z of [z0,mid]) floor(g,-halfWidth,halfWidth,z-.007,z+.007,M.seam,1,.003);
    for(const x of [-1.80,1.80]) floor(g,x-.043,x+.043,z0+.04,z1-.04,M.paint,1,.007);
    for(const side of [-1,1]) {
      const x=side*halfWidth, door=side===-1&&index===3;
      const lower=side===1?1.72:3.16, upper=side===1?4.96:4.98;
      if(door) {
        profiledWall(g,side,z0,z1,0,5.59,M.cladding); serviceDoor(g,side,mid-2.09,mid+2.09);
      } else {
        wall(g,side,x,z0,z1,0,.95,M.wainscot);
        profiledWall(g,side,z0,z1,.95,lower,M.cladding);
        profiledWall(g,side,z0,z1,upper,5.58,M.cladding);
        windowWall(g,side,z0+.15,z1-.15,lower,upper);
        for(const z of [z0+.075,z1-.075]) box(g,x,(upper+lower)/2,z,.12,upper-lower,.15,M.cladding);
      }
      box(g,x-side*.049,.102,mid,.12,.20,span,M.steelEdge);
      edgeShadow(g,side,x,z0,z1,.78);
      if(!door) {
        box(g,x-side*.046,.952,mid,.11,.038,span,M.metal);
        for(const z of [z0+1.0,z1-1.0]) {
          box(g,x-side*.065,.62,z,.11,.26,.19,M.pipe);
          rod(g,[x-side*.078,.75,z],[x-side*.078,1.43,z],.016,M.metal,8);
        }
      }
    }
    roofStrip(g,-halfWidth,0,z0,z1,M.roof);
    roofStrip(g,0,1.36,z0,z1,M.roof);
    roofStrip(g,3.03,halfWidth,z0,z1,M.roof);
    roofStrip(g,1.36,3.03,z0,z0+.77,M.roof); roofStrip(g,1.36,3.03,z1-.77,z1,M.roof);
    roofStrip(g,1.36,3.03,z0+.77,z1-.77,M.daylight);
    for(const z of [z0+.79,mid,z1-.79]) {
      member(g,[1.36,pitchY(1.36)-.031,z],[3.03,pitchY(3.03)-.031,z],.063,.08,M.steelEdge);
    }
    for(const x of [-5.55,-2.75,0,1.36,3.03,5.45]) box(g,x,pitchY(x)-.048,mid,.077,.096,span,M.steelEdge);
    truss(g,z1-.29); overheadUtilities(g,z0,z1);
    factoryLamp(g,-1.47,mid); factoryLamp(g,3.67,mid-.62);
    return g;
  }

  const factoryEnds=[12.35,5.53,-1.18,-7.98,-14.79,thresholdZ];
  const factory=factoryEnds.slice(1).map((end,i)=>factoryBay(end,factoryEnds[i],i));
  const bridge=factory[1], bridgeZ=1.55;
  for(const z of [bridgeZ-.29,bridgeZ+.29]) {
    box(bridge,0,4.62,z,12.85,.31,.11,M.yellow,true);
    for(const y of [4.45,4.79]) box(bridge,0,y,z,12.88,.052,.17,M.yellow,true);
  }
  for(const x of [-6.27,-3.1,0,3.05,6.27]) box(bridge,x,4.64,bridgeZ,.08,.11,.60,M.iron);
  for(const x of [-6.35,6.35]) box(bridge,x,4.61,bridgeZ,.45,.17,1.15,M.iron,true);
  box(bridge,5.48,4.49,bridgeZ,.93,.21,.59,M.darkMetal,true);
  const arrival=factory[0];
  box(arrival,0,2.79,12.42,13.95,5.57,.16,M.cladding);
  box(arrival,-1.18,1.99,12.31,4.28,3.98,.10,M.steel);
  for(let i=0;i<19;i++) box(arrival,-1.18,.14+i*.203,12.246,4.2,.03,.024,M.steelEdge);
  box(arrival,-1.18,4.01,12.18,4.45,.22,.30,M.metal);
  for(const x of [-3.38,1.02]) box(arrival,x,1.99,12.17,.115,3.99,.25,M.iron);

  function officeLight(g,z,side,long) {
    const x=side*2.4;
    box(g,x,4.125,z,.103,.076,long,M.trim);
    box(g,x,4.078,z,.079,.025,long-.09,M.warmLight);
  }
  function pendant(g,x,z,y,radius) {
    rod(g,[x,y+.13,z],[x,4.16,z],.012,M.trim,7);
    rod(g,[x,4.13,z],[x,4.18,z],.068,M.trim,12);
    const profile=[new T.Vector2(.10*radius,.16),new T.Vector2(.39*radius,.13),new T.Vector2(.80*radius,.062),new T.Vector2(radius,-.049),new T.Vector2(.995*radius,-.070)];
    const shade=add(g,new T.LatheGeometry(profile.reverse(),26),M.trim);
    shade.position.set(x,y,z);
    rod(g,[x,y-.064,z],[x,y-.054,z],radius*.975,M.warmLight,26);
  }
  function ficus(g,x,z,height,seed) {
    const rand=random(seed), pScale=height/1.82, potHeight=.46*pScale;
    const pot=add(g,new T.CylinderGeometry(.23*pScale,.165*pScale,potHeight,24),M.ceramic,true);
    pot.position.set(x,potHeight/2,z);
    rod(g,[x,potHeight-.004,z],[x,potHeight+.012,z],.210*pScale,M.soil,24);
    footShadow(g,x,z,.93*pScale,.83*pScale);
    const vertices=[],uv=[],colors=[],idx=[];
    const shades=[0x425c45,0x536b4c,0x5c7552,0x6a7f59,0x778864].map(c=>new T.Color(c));
    for (let stem=0;stem<4;stem++) {
      const heading=stem*1.64, spread=.14+rand()*.11;
      const base=[x+(rand()-.5)*.11,potHeight,z+(rand()-.5)*.1];
      const tip=[x+Math.cos(heading)*spread,(.78+rand()*.20)*height,z+Math.sin(heading)*spread];
      rod(g,base,tip,.019*pScale,M.bark,8);
      for(let n=0;n<10;n++) {
        const t=.27+n*.073, angle=heading+n*2.37+rand()*.22;
        const sx=base[0]+(tip[0]-base[0])*t, sy=base[1]+(tip[1]-base[1])*t, sz=base[2]+(tip[2]-base[2])*t;
        const dx=Math.cos(angle), dz=Math.sin(angle), length=(.22+.12*rand())*pScale, width=(.047+.016*rand())*pScale;
        const ox=sx+dx*.062*pScale, oy=sy+.032*pScale, oz=sz+dz*.062*pScale;
        const color=shades[Math.floor(rand()*shades.length)], start=vertices.length/3;
        for(let k=0;k<=4;k++) {
          const a=k/4, spreadWidth=width*Math.sin(Math.PI*a), ly=oy+pScale*(.08*Math.sin(Math.PI*a)-.060*a);
          const lx=ox+dx*length*a,lz=oz+dz*length*a;
          for(let edge=-1;edge<=1;edge++) {
            vertices.push(lx-dz*spreadWidth*edge,ly+(edge===0?.016*pScale*Math.sin(Math.PI*a):0),lz+dx*spreadWidth*edge);
            const light=edge===-1?.82:edge===0?1.04:.96;
            colors.push(color.r*light,color.g*light,color.b*light);uv.push((edge+1)*.5,a);
          }
          if(k) for(let j=0;j<2;j++){const v=start+(k-1)*3+j;idx.push(v,v+3,v+1,v+1,v+3,v+4);}
        }
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();add(g,geo,M.foliage,true);
  }
  function officeBay(z0,z1,index) {
    const g=cell(`Office suite ${index+1}`), mid=(z0+z1)/2, span=z1-z0;
    for(const side of [-1,1]) {
      const bounds=side<0?[-halfWidth,-1.73]:[1.73,halfWidth];
      floor(g,...bounds,z0,z1,index===3?M.oak:M.carpet,index===3?2.38:.64);
      floor(g,side*1.73-.011,side*1.73+.011,z0,z1,M.officeTrim,1,.004);
    }
    floor(g,-1.73,1.73,z0,z1,M.stone,2.72);
    const tiles=Math.round(span/1.42);
    for(let t=0;t<tiles;t++) {
      const z=z0+t*span/tiles;
      floor(g,-1.73,1.73,z-.006,z+.006,M.officeSeam,1,.003);
    }
    floor(g,-.007,.007,z0,z1,M.officeSeam,1,.003);
    const lid=[[-6.97,4.19,z0],[6.97,4.19,z0],[6.97,4.19,z1],[-6.97,4.19,z1]];
    const ceiling=quad(g,lid,lid.map(([x,,z])=>[x/1.2,z/1.2]),M.ceiling);
    ceiling.castShadow=true;M.ceiling.shadowSide=T.DoubleSide;
    for(let x=-6.6;x<6.9;x+=1.2)box(g,x,4.181,mid,.014,.013,span,M.officeSeam);
    for(let z=z0+.6;z<z1-.2;z+=1.2)box(g,0,4.181,z,13.82,.013,.016,M.officeSeam);
    // Thin recesses divide the warm plaster ceiling into broad acoustic rafts.
    for(const x of [-4.24,0,4.24]) box(g,x,4.185,mid,.024,.009,span,M.officeTrim);
    box(g,0,4.185,z0+.02,13.80,.009,.028,M.officeTrim);
    officeLight(g,mid-.07,-1,span-.56); officeLight(g,mid-.07,1,span-.56);
    for(const x of [-5.45,5.45]) {
      box(g,x,4.171,mid,.28,.027,1.35,M.officeTrim);
      for(let i=0;i<4;i++) box(g,x-.097+.064*i,4.149,mid,.022,.022,1.21,M.trim);
    }
    const right=1;
    wall(g,right,halfWidth,z0,z1,0,.29,M.white);
    wall(g,right,halfWidth,z0,z1,3.95,4.22,M.white);
    windowWall(g,right,z0+.16,z1-.16,.29,3.95,true,index%2===0);
    for(const z of [z0+.08,z1-.08]) box(g,halfWidth,2.06,z,.23,4.12,.16,M.white);
    box(g,halfWidth-.064,.18,mid,.13,.155,span,M.officeTrim);
    if(index===0 || index===3) {
      const low=index===3?.33:1.14;
      wall(g,-1,-halfWidth,z0,z1,0,low,M.white); wall(g,-1,-halfWidth,z0,z1,3.89,4.22,M.white);
      windowWall(g,-1,z0+.16,z1-.16,low,3.89,true,index===0);
      for(const z of [z0+.08,z1-.08]) box(g,-halfWidth,2.06,z,.20,4.12,.16,M.white);
    } else {
      wall(g,-1,-halfWidth,z0,z1,0,4.20,index===1?M.white:M.oak,2.47);
      if(index===1) {
        for(const z of [z0+1.28,z0+3.47,z0+5.66]) box(g,-halfWidth+.028,2.08,z,.055,3.54,2.08,M.textile);
        box(g,-halfWidth+.068,3.91,mid,.13,.06,span,M.white);
        // An integrated credenza below the fabric panels, set behind the operator workstations.
        box(g,-6.67,.53,mid,.49,.91,4.38,M.walnut);
        box(g,-6.62,1.02,mid,.60,.068,4.47,M.white);
        for(let k=0;k<6;k++) {
          const z=z0+1.73+k*.71;
          box(g,-6.403,.55,z,.047,.81,.69,M.oakLight);
          box(g,-6.366,.83,z,.05,.026,.16,M.trim);
        }
      } else {
        const slatCount=Math.round(span/.133);
        for(let i=0;i<slatCount;i++) {
          const z=z0+(i+.5)*span/slatCount;
          box(g,-halfWidth+.046,2.095,z,.088,4.05,.037,i%5===0?M.oakLight:M.walnut);
        }
        box(g,-halfWidth+.125,3.98,mid,.051,.038,span-.22,M.warmLight);
      }
    }
    box(g,-halfWidth+.057,.072,mid,.115,.135,span,M.officeTrim);
    edgeShadow(g,-1,-halfWidth,z0,z1,.72);edgeShadow(g,1,halfWidth,z0,z1,.52);
    if(index===0) ficus(g,5.96,z1-1.7,1.96,814);
    if(index===1) ficus(g,-6.11,z0+.55,1.66,181);
    if(index===2) ficus(g,6.08,mid,1.86,912);
    if(index===3) {
      ficus(g,-6.06,z0+.95,2.01,9127);
      // The timber acoustic raft and two low warm fittings mark the meeting suite.
      for(const side of [-1,1]) {
        for(let f=0;f<13;f++) box(g,side*(2.58+f*.19),3.985,mid,.062,.192,4.75,f%4===0?M.walnut:M.oakLight);
        for(const dz of [-1.75,1.75]) box(g,side*3.72,4.11,mid+dz,2.46,.059,.042,M.trim);
      }
      pendant(g,-3.69,mid+.59,3.13,.34);pendant(g,-3.47,mid-.57,3.29,.23);
      pendant(g,3.67,mid-.28,3.25,.31);
    }
    return g;
  }
  const officeEnds=[thresholdZ,-28.70,-35.8,-42.90,-50.05];
  const offices=officeEnds.slice(1).map((end,i)=>officeBay(end,officeEnds[i],i));

  function endGlass(group,x0,x1,y0,y1,z,material) {
    return quad(group,[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],[[0,0],[1,0],[1,1],[0,1]],material);
  }
  const threshold=offices[0];
  for(const sign of [-1,1]) {
    const inner=1.96, outer=6.92, width=outer-inner, x=sign*(inner+width/2);
    endGlass(threshold,Math.min(sign*inner,sign*outer),Math.max(sign*inner,sign*outer),.09,3.31,thresholdZ,M.pane);
    for(const y of [1.14,1.22]) endGlass(threshold,Math.min(sign*inner,sign*outer),Math.max(sign*inner,sign*outer),y,y+.024,thresholdZ+.01,M.frost);
    for(let i=0;i<=3;i++) box(threshold,sign*(inner+width*i/3),1.68,thresholdZ,.057,3.35,.13,M.trim);
    box(threshold,x,.06,thresholdZ,width,.11,.16,M.officeTrim);
  }
  for(const y of [3.34,4.105]) box(threshold,0,y,thresholdZ,13.85,.096,.16,M.trim);
  endGlass(threshold,-6.93,6.93,3.39,4.05,thresholdZ,M.pane);
  for(const x of [-4.4,-1.96,1.96,4.4]) box(threshold,x,3.72,thresholdZ,.051,.67,.12,M.trim);
  box(threshold,0,4.83,thresholdZ,13.90,1.33,.18,M.cladding);
  // The small pitched gable closes the gap visible from the last manufacturing bay.
  const gable=new T.BufferGeometry();
  gable.setAttribute('position',new T.Float32BufferAttribute([-6.94,5.49,thresholdZ,6.94,5.49,thresholdZ,0,5.96,thresholdZ],3));
  gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2)); gable.computeVertexNormals(); add(threshold,gable,M.cladding);
  floor(threshold,-1.96,1.96,thresholdZ-.052,thresholdZ+.052,M.metal,1,.009);

  const end=offices.at(-1), endZ=-50.07;
  for(const sign of [-1,1]) {
    const x=sign*5.32;
    box(end,x,2.08,endZ,3.26,4.16,.17,M.walnut);
    for(let n=0;n<21;n++) box(end,sign*(3.72+n*.15),2.09,endZ+.105,.038,4.06,.06,M.oakLight);
  }
  endGlass(end,-3.68,3.68,.35,3.88,endZ,M.pane);
  for(const x of [-3.68,-1.84,0,1.84,3.68]) box(end,x,2.09,endZ,.072,3.58,.15,M.trim);
  for(const y of [.36,3.14,3.88]) box(end,0,y,endZ,7.43,.066,.15,M.trim);
  box(end,0,.155,endZ,7.43,.31,.18,M.white); box(end,0,4.065,endZ,7.43,.35,.18,M.white);

  // Exterior geometry gives the glazing parallax; the painted horizon is visible beyond the roofs.
  function tree(group,x,z,size,rotation) {
    if(!leafMap) return;
    for(let i=0;i<3;i++) {
      const angle=rotation+i*Math.PI/3, dx=Math.cos(angle)*size*.47,dz=Math.sin(angle)*size*.47;
      quad(group,[[x-dx,-.18,z-dz],[x+dx,-.18,z+dz],[x+dx,size-.18,z+dz],[x-dx,size-.18,z-dz]],[[0,0],[1,0],[1,1],[0,1]],M.leaf);
    }
  }
  function outside(z0,z1,i) {
    const g=cell(`Campus exterior ${i+1}`), mid=(z0+z1)/2, span=z1-z0;
    for(const sign of [-1,1]) {
      const bgx=sign*25.9;
      const p=[[bgx,-1,z0],[bgx,10.5,z0],[bgx,10.5,z1],[bgx,-1,z1]];
      quad(g,p,[[0,0],[0,1],[1,1],[1,0]],M.sky);
      const ground=sign<0?[-25.88,-halfWidth]:[halfWidth,25.88];
      floor(g,...ground,z0,z1,M.garden,1,-.27);
      const offset=sign<0?1:0;
      for(let n=0;n<2;n++) {
        const z=z0+(n+.53)*span/2 + (sign<0?.57:0), tall=3.1+((i*3+n+offset)%4)*.90;
        const x=sign*(18.8+((n+i+offset)%3)*1.43), width=4.7+((i+n)%3)*.83, length=span*.33;
        box(g,x,tall/2-.22,z,width,tall,length,n?M.extLight:M.exterior);
        box(g,x,tall-.15,z,width+.20,.11,length+.24,M.extDark);
        const face=x-sign*(width/2+.015);
        const front=[[face,.26,z-length*.45],[face,tall-.23,z-length*.45],[face,tall-.23,z+length*.45],[face,.26,z+length*.45]];
        const uv=[[0,0],[0,tall/4.5],[length/9,tall/4.5],[length/9,0]];
        if(sign>0){front.reverse();uv.reverse();}quad(g,front,uv,M.facade);
        box(g,x+sign*.39,tall+.18,z+.58,width*.28,.59,1.15,M.exterior);
        tree(g,sign*(9.55+n*.82),z-1.32,3.18+((n+i+offset)%4)*.32,(n+i)*.71);
      }
      box(g,sign*11.0,-.085,mid,.20,.33,span,M.extLight);
    }
    return g;
  }
  const exteriorEnds=[14,-2.0,-18.4,-34.7,-51.2];
  exteriorEnds.slice(1).forEach((z,i)=>outside(z,exteriorEnds[i],i));
  const horizon=cell('Decision room outlook');
  quad(horizon,[[-28,-1,-72],[28,-1,-72],[28,11,-72],[-28,11,-72]],[[0,0],[1,0],[1,1],[0,1]],M.sky);
  floor(horizon,-26,26,-72,-50.10,M.garden,1,-.27);
  for(const [x,z,w,d,h] of [[-9,-63,6.8,4,3.25],[-2,-68,5,4.2,4.1],[5,-66,7.1,3.8,3.6],[13,-60,6.2,3.2,4.6]]) {
    box(horizon,x,h/2-.18,z,w,h,d,M.extLight); box(horizon,x,h-.14,z,w+.15,.13,d+.16,M.extDark);
    for(let y=.78;y<h-.28;y+=1.01) box(horizon,x,y,z+d/2+.02,w*.87,.48,.04,M.extGlazing);
    for(let px=x-w*.43;px<x+w*.44;px+=1.12) box(horizon,px,(h-.26)/2,z+d/2+.05,.07,h-.30,.045,M.exterior);
  }
  tree(horizon,-3.85,-54.12,3.6,.37); tree(horizon,3.1,-54.8,4.0,1.01);
  building.updateMatrixWorld(true);
  return building;
}

// A physical operator terminal. The video aperture receives the facility's own CCTV camera.
export function buildControlDisplay(T){
  const group=new T.Group(),dark=new T.MeshStandardMaterial({color:0x252c30,roughness:.42,metalness:.38});
  const metal=new T.MeshStandardMaterial({color:0x8c9391,roughness:.32,metalness:.79});
  const box=new T.BoxGeometry(1,1,1);
  function part(x,y,z,w,h,d,m=dark){const n=new T.Mesh(box,m);n.scale.set(w,h,d);n.position.set(x,y,z);n.castShadow=n.receiveShadow=true;group.add(n);return n;}
  part(0,.036,-.06,.63,.06,.56,metal);part(0,.58,-.13,.074,1.09,.088,metal);
  part(0,1.42,-.086,.10,.57,.14);part(0,1.46,0,1.05,.67,.061);
  part(0,1.46,.032,1.025,.647,.008);
  for(let j=0;j<8;j++)part(.29+.021*j,1.121,.002,.01,.013,.016,metal);
  const c=document.createElement('canvas');c.width=1024;c.height=640;
  const ctx=c.getContext('2d');ctx.fillStyle='#18282b';ctx.fillRect(0,0,1024,640);
  ctx.fillStyle='#b4d4cf';ctx.font='500 26px Arial, sans-serif';ctx.fillText('ZIEVIEW   /   CAMERA 01',35,51);
  ctx.fillStyle='#b8e2a0';ctx.fillRect(36,565,8,30);ctx.fillStyle='#e0e6e1';ctx.font='500 28px sans-serif';ctx.fillText('작업 구역   ·   영상 확인',62,590);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(1.00,.625),new T.MeshBasicMaterial({map:tex,toneMapped:false}));panel.position.set(0,1.46,.037);group.add(panel);
  const material=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const feed=new T.Mesh(new T.PlaneGeometry(.947,.457),material);feed.position.set(0,1.46,.0383);feed.userData.dynamic=true;group.add(feed);
  const ready=new T.TextureLoader().loadAsync(new URL('./views/safety-feed.webp',import.meta.url).href).then(t=>{t.colorSpace=T.SRGBColorSpace;if(!material.map){material.map=t;material.needsUpdate=true;}return true;}).catch(()=>true);
  function setFeed(texture){if(material.map!==texture){material.map=texture;material.needsUpdate=true;}}
  return {group,setFeed,ready};
}

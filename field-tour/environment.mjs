import * as T from '../ai-briefing/vendor/three.module.min.js';
const decoded=new Map(),halfRows=[];
async function decode(url) {
  const response=await fetch(url);
  if(!response.ok)throw new Error('Workshop lighting unavailable');
  const source=await createImageBitmap(await response.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
  const context=c.getContext('2d',{willReadFrequently:true});
  context.drawImage(source,0,0);source.close();
  const bytes=context.getImageData(0,0,c.width,c.height).data, pixels=new Uint16Array(bytes.length);
  for(let i=0;i<bytes.length;i+=4) {
    const exponent=bytes[i+3];
    let row=halfRows[exponent];
    if(!row){
      const scale=2**(exponent-136);
      row=halfRows[exponent]=Uint16Array.from({length:256},(_,n)=>T.DataUtils.toHalfFloat(Math.min(30000,n*scale)));
    }
    pixels[i]=row[bytes[i]];pixels[i+1]=row[bytes[i+1]];pixels[i+2]=row[bytes[i+2]];
    pixels[i+3]=15360;
  }
  return {pixels,width:c.width,height:c.height};
}
export async function lightProbe(renderer,file) {
  const url=new URL(file,import.meta.url).href;
  if(!decoded.has(url))decoded.set(url,decode(url).catch(error=>{decoded.delete(url);throw error;}));
  const {pixels,width,height}=await decoded.get(url);
  const sourceTexture=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.HalfFloatType);
  sourceTexture.mapping=T.EquirectangularReflectionMapping;sourceTexture.flipY=true;sourceTexture.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer),target=generator.fromEquirectangular(sourceTexture);
  sourceTexture.dispose();generator.dispose();
  return target;
}

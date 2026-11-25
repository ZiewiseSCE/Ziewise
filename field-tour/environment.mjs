import * as T from '../ai-briefing/vendor/three.module.min.js';
export async function lightProbe(renderer,file) {
  const url=new URL(file,import.meta.url);
  const response=await fetch(url);
  if(!response.ok)throw new Error('Workshop lighting unavailable');
  const source=await createImageBitmap(await response.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
  const context=c.getContext('2d',{willReadFrequently:true});
  context.drawImage(source,0,0);source.close();
  const bytes=context.getImageData(0,0,c.width,c.height).data, pixels=new Uint16Array(bytes.length);
  const exponent=Array.from({length:256},(_,e)=>2**(e-136));
  for(let i=0;i<bytes.length;i+=4) {
    const scale=exponent[bytes[i+3]];
    for(let k=0;k<3;k++)pixels[i+k]=T.DataUtils.toHalfFloat(Math.min(30000,bytes[i+k]*scale));
    pixels[i+3]=15360;
  }
  const sourceTexture=new T.DataTexture(pixels,c.width,c.height,T.RGBAFormat,T.HalfFloatType);
  sourceTexture.mapping=T.EquirectangularReflectionMapping;sourceTexture.flipY=true;sourceTexture.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer),target=generator.fromEquirectangular(sourceTexture);
  sourceTexture.dispose();generator.dispose();
  return target;
}

// Work in linear scene radiance before the display transform. All depth tests use metres.
export function createOptics(T,renderer,{mobile=false}={}) {
  if(!renderer.extensions.has('EXT_color_buffer_float'))return null;
  const target=new T.WebGLRenderTarget(1,1,{
    type:T.HalfFloatType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter,
    samples:mobile?0:Math.min(2,renderer.capabilities.maxSamples),depthBuffer:true,stencilBuffer:false
  });
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  target.depthTexture.minFilter=target.depthTexture.magFilter=T.NearestFilter;
  const size=new T.Vector2(),quad=new T.BufferGeometry();
  quad.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const uniforms={radiance:{value:target.texture},depthMap:{value:target.depthTexture},
    invProj:{value:new T.Matrix4()},pixels:{value:new T.Vector2(1,1)},projectScale:{value:1},
    focus:{value:3},aperture:{value:0},strength:{value:.74}};
  const material=new T.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,
    vertexShader:`varying vec2 film;
    void main(){film=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`varying vec2 film;
    uniform sampler2D radiance,depthMap;
    uniform mat4 invProj;
    uniform vec2 pixels;
    uniform float focus,aperture,strength,projectScale;
    vec3 viewPoint(vec2 coord){
      float d=texture2D(depthMap,coord).r;
      vec4 p=invProj*vec4(coord*2.-1.,d*2.-1.,1.);
      return p.xyz/p.w;
    }
    void main(){
      vec3 point=viewPoint(film);
      float metres=-point.z;
      vec3 normal=normalize(cross(dFdx(point),dFdy(point)));
      if(dot(normal,-point)<0.) normal=-normal;
      float occlusion=0.;
      vec3 color=texture2D(radiance,film).rgb;
      if(metres<34.){
        float scale=min(64.,projectScale/max(.35,metres));
        for(int i=0;i<12;i++){
          float n=float(i),angle=n*2.399963+.38;
          float radius=.058+.37*(n+.5)/12.;
          vec2 uv=clamp(film+vec2(cos(angle),sin(angle))*radius*scale*pixels,vec2(.0001),vec2(.9999));
          vec3 delta=viewPoint(uv)-point;
          float distance=length(delta);
          float horizon=max(dot(normal,delta)-(.004+.002*metres),0.)/max(.01,distance);
          occlusion+=horizon*(1.-smoothstep(.11,.55,distance));
        }
        color*=1.-min(.32,occlusion*.12)*strength*(1.-smoothstep(18.,34.,metres));
      }
      // Keep the working plane sharp. Limit the defocus circle to a narrow optical fringe.
      float coc=aperture*max(0.,1.-focus/max(metres,.1));
      if(coc>.22){
        vec3 sum=vec3(0.);float weight=0.;
        for(int j=0;j<6;j++){
          float angle=float(j)*1.04719755+.18;
          vec2 uv=film+vec2(cos(angle),sin(angle))*coc*pixels;
          float k=smoothstep(focus*.92,focus*1.18,-viewPoint(uv).z);
          sum+=texture2D(radiance,uv).rgb*k;weight+=k;
        }
        color=mix(color,sum/max(.001,weight),.60*smoothstep(.22,.75,coc)*min(1.,weight));
      }
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const screen=new T.Scene(),camera2d=new T.OrthographicCamera(-1,1,1,-1,0,1),mesh=new T.Mesh(quad,material);
  mesh.frustumCulled=false;screen.add(mesh);
  function render(scene,camera,distance,inspect){
    renderer.getDrawingBufferSize(size);
    if(size.x!==target.width||size.y!==target.height)target.setSize(size.x,size.y);
    uniforms.invProj.value.copy(camera.projectionMatrixInverse);uniforms.pixels.value.set(1/size.x,1/size.y);
    uniforms.projectScale.value=size.y*.5*camera.projectionMatrix.elements[5];
    uniforms.focus.value=Math.max(.28,distance);uniforms.aperture.value=inspect?Math.min(2.55,size.y*.00245):0.;
    renderer.setRenderTarget(target);renderer.render(scene,camera);
    const calls=renderer.info.render.calls,triangles=renderer.info.render.triangles;
    renderer.setRenderTarget(null);renderer.render(screen,camera2d);
    return {calls,triangles};
  }
  return {render,dispose(){target.dispose();quad.dispose();material.dispose();}};
}

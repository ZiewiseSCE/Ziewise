/* Each field photograph is projected onto an offline-estimated 3D surface.
   Camera translation gives nearby equipment more parallax than distant machinery. */
window.createFieldCamera = function createFieldCamera(canvas, images, invalidate) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return null;
  const vertex = `
    attribute vec3 aPosition;
    attribute vec2 aUV;
    uniform vec3 uEye;
    uniform vec2 uAngle;
    uniform vec2 uScale;
    uniform float uOffset;
    varying vec2 vUV;
    void main() {
      vec3 p = aPosition - uEye;
      float cy = cos(uAngle.x), sy = sin(uAngle.x), cx = cos(uAngle.y), sx = sin(uAngle.y);
      p = vec3(cy*p.x + sy*p.z, p.y, -sy*p.x + cy*p.z);
      p = vec3(p.x, cx*p.y - sx*p.z, sx*p.y + cx*p.z);
      float w = -p.z;
      gl_Position = vec4(p.x*uScale.x+uOffset*w, p.y*uScale.y, 1.005*w-.2005, w);
      vUV = aUV;
    }`;
  const fragment = `
    precision mediump float;
    uniform sampler2D uPhoto;
    uniform float uAlpha;
    varying vec2 vUV;
    void main(){ gl_FragColor = vec4(texture2D(uPhoto,vUV).rgb,uAlpha); }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Field shader could not be compiled');
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const loc = Object.fromEntries(['uEye','uAngle','uScale','uOffset','uAlpha','uPhoto'].map(key => [key, gl.getUniformLocation(program,key)]));
  const position = gl.getAttribLocation(program,'aPosition'), uv = gl.getAttribLocation(program,'aUV');
  gl.enableVertexAttribArray(position);
  gl.enableVertexAttribArray(uv);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(.035,.055,.054,1);
  gl.uniform1i(loc.uPhoto,0);
  const models = [], loading = new Map();
  const tanFov = .56;
  let lost = false;
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true;
    canvas.parentElement.classList.remove('rendering');
    canvas.dataset.renderer = 'photographic-fallback';
    invalidate();
  });
  function buffer(target, values) {
    const handle = gl.createBuffer();
    gl.bindBuffer(target, handle);
    gl.bufferData(target, values, gl.STATIC_DRAW);
    return handle;
  }
  async function load(index) {
    if (lost || loading.has(index)) return;
    loading.set(index,true);
    try {
      const name = window.ZiewiseScenes[index].image;
      const [response] = await Promise.all([fetch('./assets/' + name + '.depth'), images[index].decode()]);
      if (!response.ok) return;
      const raw = await response.arrayBuffer();
      if (lost || raw.byteLength < 4) return;
      const header = new DataView(raw);
      const columns = header.getUint16(0,true), rows = header.getUint16(2,true);
      if (columns*rows+4 !== raw.byteLength || columns*rows > 65535) return;
      const depth = new Uint8Array(raw,4), photo = images[index];
      const aspect = photo.naturalWidth / photo.naturalHeight;
      const vertices = new Float32Array(columns*rows*5);
      const faces = new Uint16Array((columns-1)*(rows-1)*6);
      let v = 0, f = 0;
      for (let y=0;y<rows;y++) {
        for (let x=0;x<columns;x++) {
          const id=y*columns+x, u=x/(columns-1), t=y/(rows-1);
          const distance=1/(.074+depth[id]/255*.58);
          vertices[v++]=(u*2-1)*distance*tanFov*aspect;
          vertices[v++]=(1-t*2)*distance*tanFov;
          vertices[v++]=-distance;
          vertices[v++]=u;
          vertices[v++]=t;
          if (x+1<columns && y+1<rows) {
            faces.set([id,id+columns,id+1,id+1,id+columns,id+columns+1],f);
            f+=6;
          }
        }
      }
      const texture=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photo);
      models[index]={vertices:buffer(gl.ARRAY_BUFFER,vertices),faces:buffer(gl.ELEMENT_ARRAY_BUFFER,faces),count:faces.length,texture,aspect};
      invalidate();
    } catch { /* The independently loaded photograph keeps the story available. */ }
  }
  function draw(index, progress, alpha, look, still) {
    const model=models[index], scene=window.ZiewiseScenes[index];
    const ratio=canvas.width/canvas.height;
    const cover=Math.max(1,ratio/model.aspect)*1.065;
    const t=still ? .26 : Math.min(1,Math.max(0,progress));
    const [left,right,near,far,yawStart,yawEnd]=scene.path;
    const dx=left+(right-left)*t+look.x*.050, dy=(still ? 0 : Math.sin(t*Math.PI)*.018)+look.y*.034;
    gl.uniform3f(loc.uEye,dx,dy,-(near+(far-near)*t));
    gl.uniform2f(loc.uAngle,yawStart+(yawEnd-yawStart)*t-look.x*.012,look.y*.009);
    gl.uniform2f(loc.uScale,cover/(tanFov*ratio),cover/tanFov);
    gl.uniform1f(loc.uOffset,(1-2*scene.align)*Math.max(0,model.aspect/ratio-1));
    gl.uniform1f(loc.uAlpha,alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER,model.vertices);
    gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);
    gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.faces);
    gl.bindTexture(gl.TEXTURE_2D,model.texture);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,model.count,gl.UNSIGNED_SHORT,0);
  }
  function paint(current,t,previous,previousT,blend,look,still) {
    if (lost || !models[current]) return false;
    const density=Math.min(devicePixelRatio || 1,1.45,2400/Math.max(1,canvas.clientWidth));
    const width=Math.max(2,Math.round(canvas.clientWidth*density)),height=Math.max(2,Math.round(canvas.clientHeight*density));
    if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
    gl.viewport(0,0,width,height);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    if (blend<1 && models[previous] && previous!==current) {
      draw(previous,previousT,1,look,still);
      gl.enable(gl.BLEND);
      draw(current,t,blend,look,still);
    } else draw(current,t,1,look,still);
    canvas.dataset.renderer='depth-webgl';
    return true;
  }
  return { load, paint };
};

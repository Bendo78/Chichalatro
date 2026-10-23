/* Animated swirling paint background (WebGL), rendered at low resolution for a pixel look.
   Each screen sets a palette; colors blend smoothly between palettes. */
(function () {
  const PAL = {
    menu: ['#2a0a2e', '#d4145a', '#13a6a0'],
    table: ['#06231a', '#0f5c3f', '#1f8a5b'],
    boss: ['#22040e', '#8f0d33', '#e2463a'],
    shop: ['#140a2b', '#4b1a8f', '#c23bd4'],
    win: ['#2b1600', '#e08a00', '#ffe24a'],
    lose: ['#0d0d14', '#3a2a4a', '#6b2340']
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  let cur = PAL.menu.map(hex), target = cur.map(c => c.slice()), gl, prog, uT, uR, uC, cv, on = true, t0 = performance.now();

  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
    uniform vec2 r; uniform float t; uniform vec3 c[3];
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
      float a=atan(uv.y,uv.x), d=length(uv);
      uv=vec2(cos(a+d*1.6-t*.06),sin(a+d*1.6-t*.06))*d;
      for(int i=0;i<5;i++){
        float fi=float(i);
        uv+=.32*vec2(sin(uv.y*2.6+t*.21+fi*1.7),cos(uv.x*2.4-t*.17+fi*2.3));
      }
      float v=sin(uv.x*3.2+uv.y*2.1)*.5+.5;
      float w=sin(length(uv)*5.-t*.25)*.5+.5;
      vec3 col=mix(c[0],c[1],smoothstep(.15,.85,v));
      col=mix(col,c[2],smoothstep(.62,1.,w)*.75);
      col*=1.-.55*smoothstep(.45,1.25,d);
      gl_FragColor=vec4(col,1.);
    }`;

  function init() {
    cv = document.createElement('canvas');
    cv.id = 'bg';
    document.body.prepend(cv);
    gl = cv.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) { cv.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uT = gl.getUniformLocation(prog, 't'); uR = gl.getUniformLocation(prog, 'r'); uC = gl.getUniformLocation(prog, 'c');
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }
  function resize() {
    if (!cv) return;
    const scale = 5; // one shader pixel = 5 screen pixels
    cv.width = Math.max(1, Math.ceil(innerWidth / scale));
    cv.height = Math.max(1, Math.ceil(innerHeight / scale));
    gl && gl.viewport(0, 0, cv.width, cv.height);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!on || document.hidden) return;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (target[i][j] - cur[i][j]) * .04;
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform3fv(uC, new Float32Array(cur.flat()));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function set(name) { if (PAL[name]) target = PAL[name].map(hex); }
  function enable(v) { on = v; if (cv) cv.style.display = v ? '' : 'none'; }

  window.Bg = { init, set, enable };
})();

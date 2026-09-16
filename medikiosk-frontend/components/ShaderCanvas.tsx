'use client';

import React, { useEffect, useRef } from 'react';

interface ShaderCanvasProps {
  type?: 'wave' | 'orb';
  className?: string;
}

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ type = 'wave', className = 'w-full h-full' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Exact shader from line.html (ANIMATION_3)
    const waveFs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          float wave = sin(uv.x * 20.0 + u_time * 5.0) * 0.1;
          float dist = abs(uv.y - 0.5 + wave);
          float glow = 0.05 / dist;
          
          vec3 color = vec3(0.05, 0.58, 0.53);
          color *= glow;
          
          float mask = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
          gl_FragColor = vec4(color * mask, 1.0);
      }
    `;

    // Exact shader from circle.html (ANIMATION_4)
    const orbFs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          vec2 center = vec2(0.5, 0.5);
          float d = distance(uv, center);
          
          // Pulsing core
          float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
          float ring = smoothstep(0.3 + pulse * 0.05, 0.31 + pulse * 0.05, d) - smoothstep(0.33 + pulse * 0.05, 0.34 + pulse * 0.05, d);
          
          // Inner glow
          float innerGlow = smoothstep(0.3, 0.0, d);
          
          vec3 color = mix(vec3(0.05, 0.58, 0.53), vec3(0.12, 0.23, 0.54), d);
          vec3 finalColor = color * (ring + innerGlow * 0.5);
          
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const fsSource = type === 'orb' ? orbFs : waveFs;

    function createShader(glCtx: WebGLRenderingContext, shaderType: number, src: string) {
      const shader = glCtx.createShader(shaderType);
      if (!shader) return null;
      glCtx.shaderSource(shader, src);
      glCtx.compileShader(shader);
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function render(t: number) {
      if (!gl || !canvas) return;
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [type]);

  return <canvas ref={canvasRef} className={className} style={{ display: 'block' }} />;
};

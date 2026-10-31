/**
 * Feature-detect WebGL support safely without leaking contexts.
 * Explicitly triggers context loss on the test canvas to avoid eating into browser limits.
 */
let forceWebGLDisabledForTest = false;

export function __setForceWebGLDisabledForTest(val) {
  forceWebGLDisabledForTest = Boolean(val);
}

export function isWebGLAvailable() {
  if (forceWebGLDisabledForTest) return false;
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    const supported = Boolean(window.WebGLRenderingContext && gl);
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    return supported;
  } catch {
    return false;
  }
}

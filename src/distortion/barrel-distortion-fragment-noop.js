var BarrelDistortionFragmentNoop = {
  type: 'vertex',

  uniforms: {
    'texture': {type: 't', value: null}
  },

  vertexShader: [
    'varying vec2 vUV;',

    'void main() {',
      'vUV = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n'),

  fragmentShader: [
    'uniform sampler2D texture;',

    'varying vec2 vUV;',

    'void main() {',
      'gl_FragColor = texture2D(texture, vUV);',
    '}'
  ].join('\n')
};

module.exports = BarrelDistortionFragmentNoop;

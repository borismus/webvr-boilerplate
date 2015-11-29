/**
 * An implementation of barrel distortion using a distortion mesh. This should
 * be much more efficient than using a fragment shader, since we can select the
 * density of the distortion mesh so that |pixels| >> |vertices|.
 */
var BarrelDistortionMesh = {
  type: 'vertex',

  uniforms: {
    'texture': {type: 't', value: null}
  },

  vertexShader: [
    'varying vec2 vUV;',

    'void main() {',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n'),

  fragmentShader: [
    'uniform sampler2D texture;',

    'varying vec2 vUV;',

    'void main() {',
      'gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);',
    '}'
  ].join('\n')
};

module.exports = BarrelDistortionMesh;

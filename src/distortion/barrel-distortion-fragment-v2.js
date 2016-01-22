var BarrelDistortionFragment = {
  type: 'fragment_v2',

  
  uniforms: {
    'texture':   { type: 't', value: null },
    'distortion': { type: 'v2', value: new THREE.Vector2(0.441, 0.156) },
    'projectionLeft':    { type: 'v4', value: new THREE.Vector4(1.0, 1.0, -0.5, -0.5) },
    'unprojectionLeft':  { type: 'v4', value: new THREE.Vector4(1.0, 1.0, -0.5, -0.5) },
    'backgroundColor': { type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0) },
    'showCenter': { type: 'i', value: 0},
    'dividerColor': { type: 'v4', value: new THREE.Vector4(0.5, 0.5, 0.5, 1.0) },
  },

  vertexShader: [
  'varying vec2 vUV;',

  'void main() {',
    'vUV = uv;',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
  '}'

  ].join('\n'),

  // TODO: use min/max/saturate instead of conditionals
  fragmentShader: [
    'uniform sampler2D texture;',

    'uniform vec2 distortion;',
    'uniform vec4 backgroundColor;',
    'uniform vec4 projectionLeft;',
    'uniform vec4 unprojectionLeft;',
    'uniform int showCenter;',
    'uniform vec4 dividerColor;',

    'varying vec2 vUV;',

    'float poly(float val) {',
      'return (showCenter == 1 && val < 0.00010) ? ',
      '10000.0 : 1.0 + (distortion.x + distortion.y * val) * val;',
    '}',

    'vec2 barrel(vec2 v, vec4 projection, vec4 unprojection) {',
      'vec2 w = (v + unprojection.zw) / unprojection.xy;',
      'return projection.xy * (poly(dot(w, w)) * w) - projection.zw;',
    '}',

    'void main() {',
      // right projections are shifted and vertically mirrored relative to left
      'vec4 projectionRight = ',
      '(projectionLeft + vec4(0.0, 0.0, 1.0, 0.0)) * vec4(1.0, 1.0, -1.0, 1.0);',
      'vec4 unprojectionRight = ',
      '(unprojectionLeft + vec4(0.0, 0.0, 1.0, 0.0)) * vec4(1.0, 1.0, -1.0, 1.0);',

      'vec2 a = (vUV.x < 0.5) ? ',
      'barrel(vec2(vUV.x / 0.5, vUV.y), projectionLeft, unprojectionLeft) : ',
      'barrel(vec2((vUV.x - 0.5) / 0.5, vUV.y), projectionRight, unprojectionRight);',

      'if (dividerColor.w > 0.0 && abs(vUV.x - 0.5) < .001) {',
        // Don't render the divider, since it's rendered in HTML.
        //'gl_FragColor = dividerColor;',
      '} else if (a.x < 0.0 || a.x > 1.0 || a.y < 0.0 || a.y > 1.0) {',
        'gl_FragColor = backgroundColor;',
      '} else {',
        'gl_FragColor = texture2D(texture, vec2(a.x * 0.5 + (vUV.x < 0.5 ? 0.0 : 0.5), a.y));',
      '}',
    '}'

    ].join('\n')
};

module.exports = BarrelDistortionFragment;

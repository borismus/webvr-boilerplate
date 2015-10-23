/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DeviceInfo = require('./device-info.js');

var deviceInfo = new DeviceInfo();

var BarrelDistortion = {
  uniforms: {
    'tDiffuse': {type: 't', value: null},
    'distortion': {type: 'v2', value: new THREE.Vector2(0.441, 0.156)},
    'leftCenter': {type: 'v2', value: new THREE.Vector2(0.5, 0.5)},
    'rightCenter': {type: 'v2', value: new THREE.Vector2(0.5, 0.5)},
    'background': {type: 'v4', value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0)},
  },

  vertexShader: [
    'varying vec2 vUV;',

    'void main() {',
      'vUV = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'

  ].join('\n'),

  fragmentShader: [
    'uniform sampler2D tDiffuse;',

    'uniform vec2 distortion;',
    'uniform vec2 leftCenter;',
    'uniform vec2 rightCenter;',
    'uniform vec4 background;',

    'varying vec2 vUV;',

    'float poly(float val) {',
      'return 1.0 + (distortion.x + distortion.y * val) * val;',
    '}',

    'vec2 barrel(vec2 v, vec2 center) {',
      'vec2 w = v - center;',
      'return poly(dot(w, w)) * w + center;',
    '}',

    'void main() {',
      'bool isLeft = (vUV.x < 0.5);',
      'float offset = isLeft ? 0.0 : 0.5;',
      'vec2 a = barrel(vec2((vUV.x - offset) / 0.5, vUV.y), isLeft ? leftCenter : rightCenter);',
      'if (a.x < 0.0 || a.x > 1.0 || a.y < 0.0 || a.y > 1.0) {',
        'gl_FragColor = background;',
      '} else {',
        'gl_FragColor = texture2D(tDiffuse, vec2(a.x * 0.5 + offset, a.y));',
      '}',
    '}'

  ].join('\n')
};


var ShaderPass = function(shader) {
  this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  this.material = new THREE.ShaderMaterial({
    defines: shader.defines || {},
    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this.scene  = new THREE.Scene();
  this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
  this.scene.add(this.quad);

  this.render = function(renderFunc, buffer) {
    this.uniforms['tDiffuse'].value = buffer;
    this.quad.material = this.material;
    renderFunc(this.scene, this.camera);
  }
};

function createRenderTarget(renderer) {
  var width  = renderer.context.canvas.width;
  var height = renderer.context.canvas.height;
  var parameters = {minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBFormat,
                    stencilBuffer: false,
                    depthBuffer: false};

  return new THREE.WebGLRenderTarget(width, height, parameters);
}

// TODO: Refactor into prototype-style classes.
function CardboardDistorter(renderer) {
  var left = deviceInfo.getLeftEyeCenter();
  var right = deviceInfo.getRightEyeCenter();

  // Pass in left and right eye centers into the shader.
  BarrelDistortion.leftCenter = {type: 'v2', value: new THREE.Vector2(left.x, left.y)};
  BarrelDistortion.rightCenter = {type: 'v2', value: new THREE.Vector2(right.x, right.y)};

  // Allow custom background colors if this global is set.
  if (WebVRConfig.DISTORTION_BGCOLOR) {
    BarrelDistortion.uniforms.background =
      {type: 'v4', value: WebVRConfig.DISTORTION_BGCOLOR};
  }

  var shaderPass = new ShaderPass(BarrelDistortion);

  var textureTarget = null;
  var genuineRender = renderer.render;
  var genuineSetSize = renderer.setSize;
  var isActive = false;

  this.patch = function() {
    if (!isActive) {
      return;
    }
    textureTarget = createRenderTarget(renderer);

    renderer.render = function(scene, camera, renderTarget, forceClear) {
      genuineRender.call(renderer, scene, camera, textureTarget, forceClear);
    }

    renderer.setSize = function (width, height) {
      genuineSetSize.call(renderer, width, height);
      textureTarget = createRenderTarget(renderer);
    };
  }

  this.unpatch = function() {
    if (!isActive) {
      return;
    }
    renderer.render = genuineRender;
    renderer.setSize = genuineSetSize;
  }

  this.preRender = function() {
    if (!isActive) {
      return;
    }
    renderer.setRenderTarget(textureTarget);
  }

  this.postRender = function() {
    if (!isActive) {
      return;
    }
    var size = renderer.getSize();
    renderer.setViewport(0, 0, size.width, size.height);
    shaderPass.render(genuineRender.bind(renderer), textureTarget);
  }

  /**
   * Toggles distortion. This is called externally by the boilerplate.
   * It should be enabled only if WebVR is provided by polyfill.
   */
  this.setActive = function(state) {
    isActive = state;
  }
}

module.exports = CardboardDistorter;

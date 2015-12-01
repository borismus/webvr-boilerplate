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

var BarrelDistortion = require('./distortion/barrel-distortion-fragment.js');
var DeviceInfo = require('./device-info.js');

var deviceInfo = new DeviceInfo();


function ShaderPass(shader) {
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
};

ShaderPass.prototype.render = function(renderFunc, buffer) {
  this.uniforms['texture'].value = buffer;
  this.quad.material = this.material;
  renderFunc(this.scene, this.camera);
};

function createRenderTarget(renderer) {
  var width  = renderer.context.canvas.width;
  var height = renderer.context.canvas.height;
  var parameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false
  };

  return new THREE.WebGLRenderTarget(width, height, parameters);
}

function CardboardDistorter(renderer) {
  var left = deviceInfo.getLeftEyeCenter();
  var right = deviceInfo.getRightEyeCenter();

  // Parameters for the fragment shader.
  if (BarrelDistortion.type == 'fragment') {
    // Pass in left and right eye centers into the shader.
    BarrelDistortion.leftCenter = {type: 'v2', value: new THREE.Vector2(left.x, left.y)};
    BarrelDistortion.rightCenter = {type: 'v2', value: new THREE.Vector2(right.x, right.y)};

    // Allow custom background colors if this global is set.
    if (WebVRConfig.DISTORTION_BGCOLOR) {
      BarrelDistortion.uniforms.background =
        {type: 'v4', value: WebVRConfig.DISTORTION_BGCOLOR};
    }
  }
  // TODO: Implement barrel distortion using a mesh.

  this.shaderPass = new ShaderPass(BarrelDistortion);
  this.renderer = renderer;

  this.textureTarget = null;
  this.genuineRender = renderer.render;
  this.genuineSetSize = renderer.setSize;
  this.isActive = false;
}

CardboardDistorter.prototype.patch = function() {
  if (!this.isActive) {
    return;
  }
  this.textureTarget = createRenderTarget(renderer);

  this.renderer.render = function(scene, camera, renderTarget, forceClear) {
    this.genuineRender.call(this.renderer, scene, camera, this.textureTarget, forceClear);
  }.bind(this);

  renderer.setSize = function(width, height) {
    this.genuineSetSize.call(this.renderer, width, height);
    this.textureTarget = createRenderTarget(this.renderer);
  }.bind(this);
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isActive) {
    return;
  }
  this.renderer.render = this.genuineRender;
  this.renderer.setSize = this.genuineSetSize;
};

CardboardDistorter.prototype.preRender = function() {
  if (!this.isActive) {
    return;
  }
  this.renderer.setRenderTarget(this.textureTarget);
};

CardboardDistorter.prototype.postRender = function() {
  if (!this.isActive) {
    return;
  }
  var size = this.renderer.getSize();
  this.renderer.setViewport(0, 0, size.width, size.height);
  this.shaderPass.render(this.genuineRender.bind(renderer), this.textureTarget);
};

/**
 * Toggles distortion. This is called externally by the boilerplate.
 * It should be enabled only if WebVR is provided by polyfill.
 */
CardboardDistorter.prototype.setActive = function(state) {
  this.isActive = state;
};

/**
 * Sets distortion coefficients as a Vector2.
 */
CardboardDistorter.prototype.setDistortionCoefficients = function(coefficients) {
  var value = new THREE.Vector2(coefficients[0], coefficients[1]);
  this.shaderPass.material.uniforms.distortion.value = value;
  this.shaderPass.material.needsUpdate = true;
};

module.exports = CardboardDistorter;

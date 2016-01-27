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

var BarrelDistortion = require('./distortion/barrel-distortion-fragment-v2.js');
var Util = require('./util.js');


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
  this.uniforms.texture.value = buffer;
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
  this.textureTarget = createRenderTarget(this.renderer);

  this.renderer.render = function(scene, camera, renderTarget, forceClear) {
    this.genuineRender.call(this.renderer, scene, camera, this.textureTarget, forceClear);
  }.bind(this);

  this.renderer.setSize = function(width, height) {
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
  this.shaderPass.render(this.genuineRender.bind(this.renderer), this.textureTarget);
};

/**
 * Toggles distortion. This is called externally by the boilerplate.
 * It should be enabled only if WebVR is provided by polyfill.
 */
CardboardDistorter.prototype.setActive = function(state) {
  this.isActive = state;
};

/**
 * Updates uniforms.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var uniforms = this.shaderPass.material.uniforms;

  var distortedProj = deviceInfo.getProjectionMatrixLeftEye();
  var undistortedProj = deviceInfo.getProjectionMatrixLeftEye(true);
  var viewport = deviceInfo.getUndistortedViewportLeftEye();

  var device = deviceInfo.device;
  var params = {
    xScale: viewport.width / (device.width / 2),
    yScale: viewport.height / device.height,
    xTrans: 2 * (viewport.x + viewport.width / 2) / (device.width / 2) - 1,
    yTrans: 2 * (viewport.y + viewport.height / 2) / device.height - 1
  }

  uniforms.projectionLeft.value.copy(
      Util.projectionMatrixToVector_(distortedProj));
  uniforms.unprojectionLeft.value.copy(
      Util.projectionMatrixToVector_(undistortedProj, params));

  // Set distortion coefficients.
  var coefficients = deviceInfo.viewer.distortionCoefficients;
  uniforms.distortion.value.set(coefficients[0], coefficients[1]);
      

  // For viewer profile debugging, show the lens center.
  if (WebVRConfig.SHOW_EYE_CENTERS) {
    uniforms.showCenter.value = 1;
  }

  // Allow custom background colors if this global is set.
  if (WebVRConfig.DISTORTION_BGCOLOR) {
    uniforms.backgroundColor.value =
        WebVRConfig.DISTORTION_BGCOLOR;
  }

  this.shaderPass.material.needsUpdate = true;
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

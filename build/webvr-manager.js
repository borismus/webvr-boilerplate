(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

var Modes = require('./modes.js');
var Emitter = require('./emitter.js');
var Util = require('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function ButtonManager() {
  this.loadIcons_();

  // Make the fullscreen button.
  var fsButton = this.createButton();
  fsButton.src = this.ICONS.fullscreen;
  fsButton.title = 'Fullscreen mode';
  var s = fsButton.style;
  s.bottom = 0;
  s.right = 0;
  fsButton.addEventListener('click', this.createClickHandler_('fs'));
  document.body.appendChild(fsButton);
  this.fsButton = fsButton;

  // Make the VR button.
  var vrButton = this.createButton();
  vrButton.src = this.ICONS.cardboard;
  vrButton.title = 'Virtual reality mode';
  var s = vrButton.style;
  s.bottom = 0;
  s.right = '48px';
  vrButton.addEventListener('click', this.createClickHandler_('vr'));
  document.body.appendChild(vrButton);
  this.vrButton = vrButton;

  // Make the back button.
  var backButton = this.createButton();
  backButton.title = 'Back to previous mode';
  var s = backButton.style;
  s.left = 0;
  s.top = 0;
  backButton.src = this.ICONS.back;
  backButton.addEventListener('click', this.createClickHandler_('back'));
  document.body.appendChild(backButton);
  this.backButton = backButton;

  this.isVisible = true;

}
ButtonManager.prototype = new Emitter();

ButtonManager.prototype.createButton = function() {
  var button = document.createElement('img');
  var s = button.style;
  s.position = 'fixed';
  s.width = '24px'
  s.height = '24px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  s.padding = '12px';
  s.zIndex = 1;
  s.display = 'none';

  // Prevent button from being selected and dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // Style it on hover.
  button.addEventListener('mouseenter', function(e) {
    /* -webkit-filter: drop-shadow(0 0 5px rgba(255,255,255,1)); */
    s.webkitFilter = 'drop-shadow(0 0 5px rgba(255,255,255,1))';
  });
  button.addEventListener('mouseleave', function(e) {
    s.webkitFilter = '';
  });
  return button;
};

ButtonManager.prototype.setMode = function(mode, isVRCompatible) {
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.NORMAL:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.fullscreen;
      //this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      // For now, just disable direct-to-VR mode.
      this.vrButton.style.display = 'none';
      this.backButton.style.display = 'none';
      break;
    case Modes.MAGIC_WINDOW:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.exitFullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      this.backButton.style.display = 'block';
      break;
    case Modes.VR:
      this.fsButton.style.display = 'none';
      this.vrButton.style.display = 'none';
      this.backButton.style.display = 'block';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  var oldValue = this.fsButton.style.display;
  this.fsButton.style.display = 'inline-block';
  this.fsButton.offsetHeight;
  this.fsButton.style.display = oldValue;
};

ButtonManager.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.fsButton.style.display = isVisible ? 'block' : 'none';
};

ButtonManager.prototype.createClickHandler_ = function(eventName) {
  return function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.emit(eventName);
  }.bind(this);
};

ButtonManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
  this.ICONS.cardboard = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
  this.ICONS.fullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
  this.ICONS.exitFullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNSAxNmgzdjNoMnYtNUg1djJ6bTMtOEg1djJoNVY1SDh2M3ptNiAxMWgydi0zaDN2LTJoLTV2NXptMi0xMVY1aC0ydjVoNVY4aC0zeiIvPgo8L3N2Zz4K');
  this.ICONS.back = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMjAgMTFINy44M2w1LjU5LTUuNTlMMTIgNGwtOCA4IDggOCAxLjQxLTEuNDFMNy44MyAxM0gyMHYtMnoiLz4KPC9zdmc+Cg==');
};

module.exports = ButtonManager;

},{"./emitter.js":4,"./modes.js":6,"./util.js":8}],2:[function(require,module,exports){
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
  if (window.WEBVR_BACKGROUND_COLOR) {
    BarrelDistortion.uniforms.background =
      {type: 'v4', value: window.WEBVR_BACKGROUND_COLOR};
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

},{"./device-info.js":3}],3:[function(require,module,exports){
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

var Util = require('./util.js');

// Width, height and bevel measurements done on real iPhones.
// Resolutions from http://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
// Note: iPhone pixels are not square, so relying on diagonal is not enough.
var Devices = {
  iPhone5: new Device({
    width: 640,
    height: 1136,
    widthMm: 51.27,
    heightMm: 90.11,
    bevelMm: 3.96
  }),
  iPhone6: new Device({
    width: 750,
    height: 1334,
    widthMm: 58.4,
    heightMm: 103.8,
    bevelMm: 3.71
  }),
  iPhone6Plus: new Device({
    width: 1242,
    height: 2208,
    widthMm: 69.54,
    heightMm: 122.35,
    bevelMm: 4.62
  })
};

var Enclosures = {
  CardboardV1: new CardboardEnclosure({
    ipdMm: 61,
    baselineLensCenterMm: 37.26
  }),
  FunkyMonkey: new CardboardEnclosure({
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Gives the correct device DPI based on screen dimensions and user agent.
 * For now, only iOS is supported.
 */
function DeviceInfo() {
  this.device = this.determineDevice_();
  this.enclosure = Enclosures.CardboardV1;
}

/**
 * Gets the coordinates (in [0, 1]) for the left eye.
 */
DeviceInfo.prototype.getLeftEyeCenter = function() {
  if (!this.device) {
    return DEFAULT_LEFT_CENTER;
  }
  // Get parameters from the enclosure.
  var eyeToMid = this.enclosure.ipdMm / 2;
  var eyeToBase = this.enclosure.baselineLensCenterMm;

  // Get parameters from the phone.
  var halfWidthMm = this.device.heightMm / 2;
  var heightMm = this.device.widthMm;

  // Do calculations.
  // Measure the distance between bottom of screen and center.
  var eyeToBevel = eyeToBase - this.device.bevelMm;
  var px = 1 - (eyeToMid / halfWidthMm);
  var py = 1 - (eyeToBevel / heightMm);

  return {x: px, y: py};
};

DeviceInfo.prototype.getRightEyeCenter = function() {
  if (!this.device) {
    return DEFAULT_RIGHT_CENTER;
  }
  var left = this.getLeftEyeCenter();
  return {x: 1 - left.x, y: left.y};
};

DeviceInfo.prototype.determineDevice_ = function() {
  // Only support iPhones.
  if (!Util.isIOS()) {
    return null;
  }

  // On iOS, use screen dimensions to determine iPhone/iPad model.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Check both width and height since the phone may be in landscape.
  var width = screen.availWidth;
  var height = screen.availHeight;
  var pixelWidth = width * window.devicePixelRatio;
  var pixelHeight = height * window.devicePixelRatio;

  // Match the screen dimension to the correct device.
  for (var id in Devices) {
    var device = Devices[id];
    // Expect an exact match on width.
    if (device.width == pixelWidth || device.width == pixelHeight) {
      console.log('Detected iPhone: %s', id);
      // This is the right device.
      return device;
    }
  }
  return null;
};


function Device(params) {
  this.width = params.width;
  this.height = params.height;
  this.widthMm = params.widthMm;
  this.heightMm = params.heightMm;
  this.bevelMm = params.bevelMm;
}


function CardboardEnclosure(params) {
  // Distortion coefficients.
  this.k1 = params.k1;
  this.k2 = params.k2;
  // IPD in millimeters.
  this.ipdMm = params.ipdMm;
  // Distance between baseline and lens.
  this.baselineLensCenterMm = params.baselineLensCenterMm;
}

module.exports = DeviceInfo;

},{"./util.js":8}],4:[function(require,module,exports){
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

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments)
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],5:[function(require,module,exports){
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

var WebVRManager = require('./webvr-manager.js');

window.WebVRManager = WebVRManager;

},{"./webvr-manager.js":10}],6:[function(require,module,exports){
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

var Modes = {
  UNKNOWN: 0,
  // Not fullscreen, just tracking.
  NORMAL: 1,
  // Magic window immersive mode.
  MAGIC_WINDOW: 2,
  // Full screen split screen VR mode.
  VR: 3,
};

module.exports = Modes;

},{}],7:[function(require,module,exports){
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

var Util = require('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.backgroundRepeat = 'no-repeat';
  s.backgroundPosition = '50% 20%';
  s.backgroundImage = 'url(' + this.icon + ')';

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '24px';
  s.fontFamily = 'sans-serif';
  s.position = 'fixed';
  s.bottom = 0;
  s.marginBottom = '5%';
  s.marginLeft = 'auto';
  s.marginRight = 'auto';
  s.width = '100%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  this.overlay = overlay;
  this.text = text;
  document.body.appendChild(overlay);

  this.hide();
}

RotateInstructions.prototype.show = function() {
  this.overlay.style.display = 'block';

  var sText = this.text.style;
  var s = this.overlay.style;

  if (Util.isLandscapeMode()) {
    s.backgroundSize = '30%';
  } else {
    s.backgroundSize = '60%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms) {
  this.show();
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.loadIcon_ = function() {
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":8}],8:[function(require,module,exports){
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

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

Util.appendQueryParameter = function(key, value) {
  var url = window.location.href;
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90 || window.matchMedia('(orientation: landscape)').matches);
};


module.exports = Util;

},{}],9:[function(require,module,exports){
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

var Util = require('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');

  video.addEventListener('ended', function() {
    video.play();
  });

  this.request = function() {
    if (video.paused) {
      // Base64 version of videos_src/no-sleep-60s.webm.
      video.src = Util.base64('video/webm', 'GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAAH4xFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggfG7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEUq17GDD0JATYCNTGF2ZjU2LjQwLjEwMVdBjUxhdmY1Ni40MC4xMDFzpJAGSJTMbsLpDt/ySkipgX1fRImIQO1MAAAAAAAWVK5rAQAAAAAAADuuAQAAAAAAADLXgQFzxYEBnIEAIrWcg3VuZIaFVl9WUDmDgQEj44OEO5rKAOABAAAAAAAABrCBsLqBkB9DtnUBAAAAAAAAo+eBAKOmgQAAgKJJg0IAAV4BHsAHBIODCoAACmH2MAAAZxgz4dPSTFi5JACjloED6ACmAECSnABMQAADYAAAWi0quoCjloEH0ACmAECSnABNwAADYAAAWi0quoCjloELuACmAECSnABNgAADYAAAWi0quoCjloEPoACmAECSnABNYAADYAAAWi0quoCjloETiACmAECSnABNIAADYAAAWi0quoAfQ7Z1AQAAAAAAAJTnghdwo5aBAAAApgBAkpwATOAAA2AAAFotKrqAo5aBA+gApgBAkpwATMAAA2AAAFotKrqAo5aBB9AApgBAkpwATIAAA2AAAFotKrqAo5aBC7gApgBAkpwATEAAA2AAAFotKrqAo5aBD6AApgDAkpwAQ2AAA2AAAFotKrqAo5aBE4gApgBAkpwATCAAA2AAAFotKrqAH0O2dQEAAAAAAACU54Iu4KOWgQAAAKYAQJKcAEvAAANgAABaLSq6gKOWgQPoAKYAQJKcAEtgAANgAABaLSq6gKOWgQfQAKYAQJKcAEsAAANgAABaLSq6gKOWgQu4AKYAQJKcAEqAAANgAABaLSq6gKOWgQ+gAKYAQJKcAEogAANgAABaLSq6gKOWgROIAKYAQJKcAEnAAANgAABaLSq6gB9DtnUBAAAAAAAAlOeCRlCjloEAAACmAECSnABJgAADYAAAWi0quoCjloED6ACmAECSnABJIAADYAAAWi0quoCjloEH0ACmAMCSnABDYAADYAAAWi0quoCjloELuACmAECSnABI4AADYAAAWi0quoCjloEPoACmAECSnABIoAADYAAAWi0quoCjloETiACmAECSnABIYAADYAAAWi0quoAfQ7Z1AQAAAAAAAJTngl3Ao5aBAAAApgBAkpwASCAAA2AAAFotKrqAo5aBA+gApgBAkpwASAAAA2AAAFotKrqAo5aBB9AApgBAkpwAR8AAA2AAAFotKrqAo5aBC7gApgBAkpwAR4AAA2AAAFotKrqAo5aBD6AApgBAkpwAR2AAA2AAAFotKrqAo5aBE4gApgBAkpwARyAAA2AAAFotKrqAH0O2dQEAAAAAAACU54J1MKOWgQAAAKYAwJKcAENgAANgAABaLSq6gKOWgQPoAKYAQJKcAEbgAANgAABaLSq6gKOWgQfQAKYAQJKcAEagAANgAABaLSq6gKOWgQu4AKYAQJKcAEaAAANgAABaLSq6gKOWgQ+gAKYAQJKcAEZAAANgAABaLSq6gKOWgROIAKYAQJKcAEYAAANgAABaLSq6gB9DtnUBAAAAAAAAlOeCjKCjloEAAACmAECSnABF4AADYAAAWi0quoCjloED6ACmAECSnABFwAADYAAAWi0quoCjloEH0ACmAECSnABFoAADYAAAWi0quoCjloELuACmAECSnABFgAADYAAAWi0quoCjloEPoACmAMCSnABDYAADYAAAWi0quoCjloETiACmAECSnABFYAADYAAAWi0quoAfQ7Z1AQAAAAAAAJTngqQQo5aBAAAApgBAkpwARUAAA2AAAFotKrqAo5aBA+gApgBAkpwARSAAA2AAAFotKrqAo5aBB9AApgBAkpwARQAAA2AAAFotKrqAo5aBC7gApgBAkpwARQAAA2AAAFotKrqAo5aBD6AApgBAkpwAROAAA2AAAFotKrqAo5aBE4gApgBAkpwARMAAA2AAAFotKrqAH0O2dQEAAAAAAACU54K7gKOWgQAAAKYAQJKcAESgAANgAABaLSq6gKOWgQPoAKYAQJKcAESAAANgAABaLSq6gKOWgQfQAKYAwJKcAENgAANgAABaLSq6gKOWgQu4AKYAQJKcAERgAANgAABaLSq6gKOWgQ+gAKYAQJKcAERAAANgAABaLSq6gKOWgROIAKYAQJKcAEQgAANgAABaLSq6gB9DtnUBAAAAAAAAlOeC0vCjloEAAACmAECSnABEIAADYAAAWi0quoCjloED6ACmAECSnABEAAADYAAAWi0quoCjloEH0ACmAECSnABD4AADYAAAWi0quoCjloELuACmAECSnABDwAADYAAAWi0quoCjloEPoACmAECSnABDoAADYAAAWi0quoCjloETiACmAECSnABDgAADYAAAWi0quoAcU7trAQAAAAAAABG7j7OBALeK94EB8YIBd/CBAw==');
      video.play();
    }
  };

  this.release = function() {
    video.pause();
    video.src = '';
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();

},{"./util.js":8}],10:[function(require,module,exports){
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

var Wakelock = require('./wakelock.js');
var CardboardDistorter = require('./cardboard-distorter.js');
var Modes = require('./modes.js');
var RotateInstructions = require('./rotate-instructions.js');
var Util = require('./util.js');
var ButtonManager = require('./button-manager.js');

/**
 * Helper for getting in and out of VR mode.
 * Here we assume VR mode == full screen mode.
 *
 * 1. Detects whether or not VR mode is possible by feature detecting for
 * WebVR (or polyfill).
 *
 * 2. If WebVR is available, shows a button that lets you enter VR mode.
 *
 * 3. Provides Cardboard-style distortion if the webvr-polyfill is being used.
 *
 * 4. Provides best practices while in VR mode.
 * - Full screen
 * - Wake lock
 * - Orientation lock (mobile only)
 */
function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  this.mode = Modes.UNKNOWN;

  // Set option to hide the button.
  var hideButton = this.params.hideButton || false;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  this.distorter = new CardboardDistorter(renderer);
  this.button = new ButtonManager();
  this.rotateInstructions = new RotateInstructions();

  this.isVRCompatible = false;
  this.isFullscreenDisabled = !!Util.getQueryParameter('no_fullscreen');

  if (hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getDeviceByType_(HMDVRDevice).then(function(hmd) {
    // Activate either VR or Immersive mode.
    if (window.WEBVR_FORCE_DISTORTION) {
      this.distorter.setActive(true);
      this.isVRCompatible = true;
    } else if (hmd) {
      this.isVRCompatible = true;
      // Only enable distortion if we are dealing using the polyfill and this is iOS.
      if (hmd.deviceName.indexOf('webvr-polyfill') == 0 && Util.isIOS()) {
        this.distorter.setActive(true);
      }
    }
    // Set the right mode.
    if (this.isFullscreenDisabled) {
      this.normalToMagicWindow();
      this.setMode_(Modes.MAGIC_WINDOW);
    } else {
      this.setMode_(Modes.NORMAL);
    }
    this.button.on('fs', this.onFSClick_.bind(this));
    this.button.on('vr', this.onVRClick_.bind(this));
    this.button.on('back', this.onBackClick_.bind(this));
  }.bind(this));

  // Save the input device for later sending timing data.
  this.getDeviceByType_(PositionSensorVRDevice).then(function(input) {
    this.input = input;
  }.bind(this));

  // Whenever we enter fullscreen, we are entering VR or immersive mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));
  window.addEventListener('orientationchange',
      this.onOrientationChange_.bind(this));
  window.addEventListener('resize',
      this.onResizeChange_.bind(this));

  // Create the necessary elements for wake lock to work.
  this.wakelock = new Wakelock();
}

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getDeviceByType_ = function(type) {
  return new Promise(function(resolve, reject) {
    navigator.getVRDevices().then(function(devices) {
      // Promise succeeds, but check if there are any devices actually.
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof type) {
          resolve(devices[i]);
          break;
        }
      }
      resolve(null);
    }, function() {
      // No devices are found.
      resolve(null);
    });
  });
};

WebVRManager.prototype.isVRMode = function() {
  return this.mode == Modes.VR;
};

WebVRManager.prototype.render = function(scene, camera, timestamp) {
  this.resizeIfNeeded_(camera);

  if (this.isVRMode()) {
    this.distorter.preRender();
    this.effect.render(scene, camera);
    this.distorter.postRender();
  } else {
    // Scene may be an array of two scenes, one for each eye.
    if (scene instanceof Array) {
      this.renderer.render(scene[0], camera);
    } else {
      this.renderer.render(scene, camera);
    }
  }
};


WebVRManager.prototype.setMode_ = function(mode) {
  console.log('Mode change: %s => %s', this.mode, mode);
  this.mode = mode;
  this.button.setMode(mode, this.isVRCompatible);

  if (this.mode == Modes.VR && Util.isLandscapeMode()) {
    // In landscape mode, temporarily show the "put into Cardboard"
    // interstitial. Otherwise, do the default thing.
    this.rotateInstructions.showTemporarily(3000);
  } else {
    this.updateRotateInstructions_();
  }
};

/**
 * Main button was clicked.
 */
WebVRManager.prototype.onFSClick_ = function() {
  switch (this.mode) {
    case Modes.NORMAL:
      // TODO: Remove this hack when iOS has fullscreen mode.
      // If this is an iframe on iOS, break out and open in no_fullscreen mode.
      if (Util.isIOS() && Util.isIFrame()) {
        var url = Util.appendQueryParameter('no_fullscreen', 'true');
        top.location.href = url;
        return;
      }
      this.normalToMagicWindow();
      this.setMode_(Modes.MAGIC_WINDOW);
      break;
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
      } else {
        this.anyModeToNormal();
        this.setMode_(Modes.NORMAL);
      }
      break;
  }
};

/**
 *
 */
WebVRManager.prototype.onVRClick_ = function() {
  this.anyModeToVR();
  this.setMode_(Modes.VR);
};

/**
 * Back button was clicked.
 */
WebVRManager.prototype.onBackClick_ = function() {
  switch (this.mode) {
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
      } else {
        this.anyModeToNormal();
        this.setMode_(Modes.NORMAL);
      }
      break;
    case Modes.VR:
      this.vrToMagicWindow();
      this.setMode_(Modes.MAGIC_WINDOW);
      break;
  }
};

/**
 *
 * Methods to go between modes.
 *
 */
WebVRManager.prototype.normalToMagicWindow = function() {
  // TODO: Re-enable pointer lock after debugging.
  //this.requestPointerLock_();
  this.requestFullscreen_();
  this.wakelock.request();
};

WebVRManager.prototype.anyModeToVR = function() {
  // Don't do orientation locking for consistency.
  //this.requestOrientationLock_();
  this.requestFullscreen_();
  //this.effect.setFullScreen(true);
  this.wakelock.request();
  this.distorter.patch();
};

WebVRManager.prototype.vrToMagicWindow = function() {
  //this.releaseOrientationLock_();
  this.distorter.unpatch();

  // Android bug: when returning from VR, resize the effect.
  this.resize_();
}

WebVRManager.prototype.anyModeToNormal = function() {
  //this.effect.setFullScreen(false);
  this.exitFullscreen_();
  //this.releaseOrientationLock_();
  this.releasePointerLock_();
  this.wakelock.release();
  this.distorter.unpatch();

  // Android bug: when returning from VR, resize the effect.
  this.resize_();
};

WebVRManager.prototype.resizeIfNeeded_ = function(camera) {
  // Only resize the canvas if it needs to be resized.
  var size = this.renderer.getSize();
  if (size.width != window.innerWidth || size.height != window.innerHeight) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    this.resize_()
  }
};

WebVRManager.prototype.resize_ = function() {
  this.effect.setSize(window.innerWidth, window.innerHeight);
};

WebVRManager.prototype.onOrientationChange_ = function(e) {
  this.updateRotateInstructions_();
};

WebVRManager.prototype.onResizeChange_ = function() {
  // Firefox does not yet support orientationchange events, so we look at the MediaQueryList
  // object to detect whether the device is in landscape or portrait orientation.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=920734
  if (window.matchMedia('(orientation: landscape)').matches) {
    this.updateRotateInstructions_();
  }
};

WebVRManager.prototype.updateRotateInstructions_ = function() {
  this.rotateInstructions.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape.
  if (this.mode == Modes.VR && !Util.isLandscapeMode()) {
    this.rotateInstructions.show();
  } else {
    this.rotateInstructions.hide();
  }
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, go back to normal mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.anyModeToNormal();
    this.setMode_(Modes.NORMAL);
  }
};

WebVRManager.prototype.requestPointerLock_ = function() {
  var canvas = this.renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;

  if (canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
};

WebVRManager.prototype.releasePointerLock_ = function() {
  document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
};

WebVRManager.prototype.requestOrientationLock_ = function() {
  if (screen.orientation && Util.isMobile()) {
    screen.orientation.lock('landscape');
  }
};

WebVRManager.prototype.releaseOrientationLock_ = function() {
  if (screen.orientation) {
    screen.orientation.unlock();
  }
};

WebVRManager.prototype.requestFullscreen_ = function() {
  var canvas = document.body;
  //var canvas = this.renderer.domElement;
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  }
};

WebVRManager.prototype.exitFullscreen_ = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

module.exports = WebVRManager;

},{"./button-manager.js":1,"./cardboard-distorter.js":2,"./modes.js":6,"./rotate-instructions.js":7,"./util.js":8,"./wakelock.js":9}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NC4xLjEvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2J1dHRvbi1tYW5hZ2VyLmpzIiwic3JjL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMiLCJzcmMvZGV2aWNlLWluZm8uanMiLCJzcmMvZW1pdHRlci5qcyIsInNyYy9tYWluLmpzIiwic3JjL21vZGVzLmpzIiwic3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMiLCJzcmMvdXRpbC5qcyIsInNyYy93YWtlbG9jay5qcyIsInNyYy93ZWJ2ci1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgTW9kZXMgPSByZXF1aXJlKCcuL21vZGVzLmpzJyk7XG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJy4vZW1pdHRlci5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuLyoqXG4gKiBFdmVyeXRoaW5nIGhhdmluZyB0byBkbyB3aXRoIHRoZSBXZWJWUiBidXR0b24uXG4gKiBFbWl0cyBhICdjbGljaycgZXZlbnQgd2hlbiBpdCdzIGNsaWNrZWQuXG4gKi9cbmZ1bmN0aW9uIEJ1dHRvbk1hbmFnZXIoKSB7XG4gIHRoaXMubG9hZEljb25zXygpO1xuXG4gIC8vIE1ha2UgdGhlIGZ1bGxzY3JlZW4gYnV0dG9uLlxuICB2YXIgZnNCdXR0b24gPSB0aGlzLmNyZWF0ZUJ1dHRvbigpO1xuICBmc0J1dHRvbi5zcmMgPSB0aGlzLklDT05TLmZ1bGxzY3JlZW47XG4gIGZzQnV0dG9uLnRpdGxlID0gJ0Z1bGxzY3JlZW4gbW9kZSc7XG4gIHZhciBzID0gZnNCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIGZzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDbGlja0hhbmRsZXJfKCdmcycpKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmc0J1dHRvbik7XG4gIHRoaXMuZnNCdXR0b24gPSBmc0J1dHRvbjtcblxuICAvLyBNYWtlIHRoZSBWUiBidXR0b24uXG4gIHZhciB2ckJ1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIHZyQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuY2FyZGJvYXJkO1xuICB2ckJ1dHRvbi50aXRsZSA9ICdWaXJ0dWFsIHJlYWxpdHkgbW9kZSc7XG4gIHZhciBzID0gdnJCdXR0b24uc3R5bGU7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5yaWdodCA9ICc0OHB4JztcbiAgdnJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNsaWNrSGFuZGxlcl8oJ3ZyJykpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHZyQnV0dG9uKTtcbiAgdGhpcy52ckJ1dHRvbiA9IHZyQnV0dG9uO1xuXG4gIC8vIE1ha2UgdGhlIGJhY2sgYnV0dG9uLlxuICB2YXIgYmFja0J1dHRvbiA9IHRoaXMuY3JlYXRlQnV0dG9uKCk7XG4gIGJhY2tCdXR0b24udGl0bGUgPSAnQmFjayB0byBwcmV2aW91cyBtb2RlJztcbiAgdmFyIHMgPSBiYWNrQnV0dG9uLnN0eWxlO1xuICBzLmxlZnQgPSAwO1xuICBzLnRvcCA9IDA7XG4gIGJhY2tCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5iYWNrO1xuICBiYWNrQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDbGlja0hhbmRsZXJfKCdiYWNrJykpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJhY2tCdXR0b24pO1xuICB0aGlzLmJhY2tCdXR0b24gPSBiYWNrQnV0dG9uO1xuXG4gIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcblxufVxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUgPSBuZXcgRW1pdHRlcigpO1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGVCdXR0b24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICB2YXIgcyA9IGJ1dHRvbi5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMud2lkdGggPSAnMjRweCdcbiAgcy5oZWlnaHQgPSAnMjRweCc7XG4gIHMuYmFja2dyb3VuZFNpemUgPSAnY292ZXInO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gIHMuYm9yZGVyID0gMDtcbiAgcy51c2VyU2VsZWN0ID0gJ25vbmUnO1xuICBzLndlYmtpdFVzZXJTZWxlY3QgPSAnbm9uZSc7XG4gIHMuTW96VXNlclNlbGVjdCA9ICdub25lJztcbiAgcy5jdXJzb3IgPSAncG9pbnRlcic7XG4gIHMucGFkZGluZyA9ICcxMnB4JztcbiAgcy56SW5kZXggPSAxO1xuICBzLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgLy8gUHJldmVudCBidXR0b24gZnJvbSBiZWluZyBzZWxlY3RlZCBhbmQgZHJhZ2dlZC5cbiAgYnV0dG9uLmRyYWdnYWJsZSA9IGZhbHNlO1xuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgLy8gU3R5bGUgaXQgb24gaG92ZXIuXG4gIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZSkge1xuICAgIC8qIC13ZWJraXQtZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgNXB4IHJnYmEoMjU1LDI1NSwyNTUsMSkpOyAqL1xuICAgIHMud2Via2l0RmlsdGVyID0gJ2Ryb3Atc2hhZG93KDAgMCA1cHggcmdiYSgyNTUsMjU1LDI1NSwxKSknO1xuICB9KTtcbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKSB7XG4gICAgcy53ZWJraXRGaWx0ZXIgPSAnJztcbiAgfSk7XG4gIHJldHVybiBidXR0b247XG59O1xuXG5CdXR0b25NYW5hZ2VyLnByb3RvdHlwZS5zZXRNb2RlID0gZnVuY3Rpb24obW9kZSwgaXNWUkNvbXBhdGlibGUpIHtcbiAgaWYgKCF0aGlzLmlzVmlzaWJsZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBzd2l0Y2ggKG1vZGUpIHtcbiAgICBjYXNlIE1vZGVzLk5PUk1BTDpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmZzQnV0dG9uLnNyYyA9IHRoaXMuSUNPTlMuZnVsbHNjcmVlbjtcbiAgICAgIC8vdGhpcy52ckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gKGlzVlJDb21wYXRpYmxlID8gJ2Jsb2NrJyA6ICdub25lJyk7XG4gICAgICAvLyBGb3Igbm93LCBqdXN0IGRpc2FibGUgZGlyZWN0LXRvLVZSIG1vZGUuXG4gICAgICB0aGlzLnZyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB0aGlzLmJhY2tCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTW9kZXMuTUFHSUNfV0lORE9XOlxuICAgICAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIHRoaXMuZnNCdXR0b24uc3JjID0gdGhpcy5JQ09OUy5leGl0RnVsbHNjcmVlbjtcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9IChpc1ZSQ29tcGF0aWJsZSA/ICdibG9jaycgOiAnbm9uZScpO1xuICAgICAgdGhpcy5iYWNrQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5WUjpcbiAgICAgIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMudnJCdXR0b24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgIHRoaXMuYmFja0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSGFjayBmb3IgU2FmYXJpIE1hYy9pT1MgdG8gZm9yY2UgcmVsYXlvdXQgKHN2Zy1zcGVjaWZpYyBpc3N1ZSlcbiAgLy8gaHR0cDovL2dvby5nbC9oamdSNnJcbiAgdmFyIG9sZFZhbHVlID0gdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5O1xuICB0aGlzLmZzQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbiAgdGhpcy5mc0J1dHRvbi5vZmZzZXRIZWlnaHQ7XG4gIHRoaXMuZnNCdXR0b24uc3R5bGUuZGlzcGxheSA9IG9sZFZhbHVlO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUuc2V0VmlzaWJpbGl0eSA9IGZ1bmN0aW9uKGlzVmlzaWJsZSkge1xuICB0aGlzLmlzVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgdGhpcy5mc0J1dHRvbi5zdHlsZS5kaXNwbGF5ID0gaXNWaXNpYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcbn07XG5cbkJ1dHRvbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUNsaWNrSGFuZGxlcl8gPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmVtaXQoZXZlbnROYW1lKTtcbiAgfS5iaW5kKHRoaXMpO1xufTtcblxuQnV0dG9uTWFuYWdlci5wcm90b3R5cGUubG9hZEljb25zXyA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcmVsb2FkIHNvbWUgaGFyZC1jb2RlZCBTVkcuXG4gIHRoaXMuSUNPTlMgPSB7fTtcbiAgdGhpcy5JQ09OUy5jYXJkYm9hcmQgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NakF1TnpRZ05rZ3pMakl4UXpJdU5UVWdOaUF5SURZdU5UY2dNaUEzTGpJNGRqRXdMalEwWXpBZ0xqY3VOVFVnTVM0eU9DQXhMakl6SURFdU1qaG9OQzQzT1dNdU5USWdNQ0F1T1RZdExqTXpJREV1TVRRdExqYzViREV1TkMwekxqUTRZeTR5TXkwdU5Ua3VOemt0TVM0d01TQXhMalEwTFRFdU1ERnpNUzR5TVM0ME1pQXhMalExSURFdU1ERnNNUzR6T1NBekxqUTRZeTR4T1M0ME5pNDJNeTQzT1NBeExqRXhMamM1YURRdU56bGpMamN4SURBZ01TNHlOaTB1TlRjZ01TNHlOaTB4TGpJNFZqY3VNamhqTUMwdU55MHVOVFV0TVM0eU9DMHhMakkyTFRFdU1qaDZUVGN1TlNBeE5DNDJNbU10TVM0eE55QXdMVEl1TVRNdExqazFMVEl1TVRNdE1pNHhNaUF3TFRFdU1UY3VPVFl0TWk0eE15QXlMakV6TFRJdU1UTWdNUzR4T0NBd0lESXVNVEl1T1RZZ01pNHhNaUF5TGpFemN5MHVPVFVnTWk0eE1pMHlMakV5SURJdU1USjZiVGtnTUdNdE1TNHhOeUF3TFRJdU1UTXRMamsxTFRJdU1UTXRNaTR4TWlBd0xURXVNVGN1T1RZdE1pNHhNeUF5TGpFekxUSXVNVE56TWk0eE1pNDVOaUF5TGpFeUlESXVNVE10TGprMUlESXVNVEl0TWk0eE1pQXlMakV5ZWlJdlBnb2dJQ0FnUEhCaGRHZ2dabWxzYkQwaWJtOXVaU0lnWkQwaVRUQWdNR2d5TkhZeU5FZ3dWakI2SWk4K0Nqd3ZjM1puUGdvPScpO1xuICB0aGlzLklDT05TLmZ1bGxzY3JlZW4gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk55QXhORWcxZGpWb05YWXRNa2czZGkwemVtMHRNaTAwYURKV04yZ3pWalZJTlhZMWVtMHhNaUEzYUMwemRqSm9OWFl0TldndE1uWXplazB4TkNBMWRqSm9NM1l6YURKV05XZ3ROWG9pTHo0S1BDOXpkbWMrQ2c9PScpO1xuICB0aGlzLklDT05TLmV4aXRGdWxsc2NyZWVuID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIZHBaSFJvUFNJeU5IQjRJaUJvWldsbmFIUTlJakkwY0hnaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaUkwWkdSa1pHUmlJK0NpQWdJQ0E4Y0dGMGFDQmtQU0pOTUNBd2FESTBkakkwU0RCNklpQm1hV3hzUFNKdWIyNWxJaTgrQ2lBZ0lDQThjR0YwYUNCa1BTSk5OU0F4Tm1nemRqTm9Nbll0TlVnMWRqSjZiVE10T0VnMWRqSm9OVlkxU0RoMk0zcHROaUF4TVdneWRpMHphRE4yTFRKb0xUVjJOWHB0TWkweE1WWTFhQzB5ZGpWb05WWTRhQzB6ZWlJdlBnbzhMM04yWno0SycpO1xuICB0aGlzLklDT05TLmJhY2sgPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhkcFpIUm9QU0l5TkhCNElpQm9aV2xuYUhROUlqSTBjSGdpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrQ2lBZ0lDQThjR0YwYUNCa1BTSk5NQ0F3YURJMGRqSTBTREI2SWlCbWFXeHNQU0p1YjI1bElpOCtDaUFnSUNBOGNHRjBhQ0JrUFNKTk1qQWdNVEZJTnk0NE0ydzFMalU1TFRVdU5UbE1NVElnTkd3dE9DQTRJRGdnT0NBeExqUXhMVEV1TkRGTU55NDRNeUF4TTBneU1IWXRNbm9pTHo0S1BDOXpkbWMrQ2c9PScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25NYW5hZ2VyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIERldmljZUluZm8gPSByZXF1aXJlKCcuL2RldmljZS1pbmZvLmpzJyk7XG5cbnZhciBkZXZpY2VJbmZvID0gbmV3IERldmljZUluZm8oKTtcblxudmFyIEJhcnJlbERpc3RvcnRpb24gPSB7XG4gIHVuaWZvcm1zOiB7XG4gICAgJ3REaWZmdXNlJzoge3R5cGU6ICd0JywgdmFsdWU6IG51bGx9LFxuICAgICdkaXN0b3J0aW9uJzoge3R5cGU6ICd2MicsIHZhbHVlOiBuZXcgVEhSRUUuVmVjdG9yMigwLjQ0MSwgMC4xNTYpfSxcbiAgICAnbGVmdENlbnRlcic6IHt0eXBlOiAndjInLCB2YWx1ZTogbmV3IFRIUkVFLlZlY3RvcjIoMC41LCAwLjUpfSxcbiAgICAncmlnaHRDZW50ZXInOiB7dHlwZTogJ3YyJywgdmFsdWU6IG5ldyBUSFJFRS5WZWN0b3IyKDAuNSwgMC41KX0sXG4gICAgJ2JhY2tncm91bmQnOiB7dHlwZTogJ3Y0JywgdmFsdWU6IG5ldyBUSFJFRS5WZWN0b3I0KDAuMCwgMC4wLCAwLjAsIDEuMCl9LFxuICB9LFxuXG4gIHZlcnRleFNoYWRlcjogW1xuICAgICd2YXJ5aW5nIHZlYzIgdlVWOycsXG5cbiAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAndlVWID0gdXY7JyxcbiAgICAgICdnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiBtb2RlbFZpZXdNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjApOycsXG4gICAgJ30nXG5cbiAgXS5qb2luKCdcXG4nKSxcblxuICBmcmFnbWVudFNoYWRlcjogW1xuICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0RGlmZnVzZTsnLFxuXG4gICAgJ3VuaWZvcm0gdmVjMiBkaXN0b3J0aW9uOycsXG4gICAgJ3VuaWZvcm0gdmVjMiBsZWZ0Q2VudGVyOycsXG4gICAgJ3VuaWZvcm0gdmVjMiByaWdodENlbnRlcjsnLFxuICAgICd1bmlmb3JtIHZlYzQgYmFja2dyb3VuZDsnLFxuXG4gICAgJ3ZhcnlpbmcgdmVjMiB2VVY7JyxcblxuICAgICdmbG9hdCBwb2x5KGZsb2F0IHZhbCkgeycsXG4gICAgICAncmV0dXJuIDEuMCArIChkaXN0b3J0aW9uLnggKyBkaXN0b3J0aW9uLnkgKiB2YWwpICogdmFsOycsXG4gICAgJ30nLFxuXG4gICAgJ3ZlYzIgYmFycmVsKHZlYzIgdiwgdmVjMiBjZW50ZXIpIHsnLFxuICAgICAgJ3ZlYzIgdyA9IHYgLSBjZW50ZXI7JyxcbiAgICAgICdyZXR1cm4gcG9seShkb3QodywgdykpICogdyArIGNlbnRlcjsnLFxuICAgICd9JyxcblxuICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICdib29sIGlzTGVmdCA9ICh2VVYueCA8IDAuNSk7JyxcbiAgICAgICdmbG9hdCBvZmZzZXQgPSBpc0xlZnQgPyAwLjAgOiAwLjU7JyxcbiAgICAgICd2ZWMyIGEgPSBiYXJyZWwodmVjMigodlVWLnggLSBvZmZzZXQpIC8gMC41LCB2VVYueSksIGlzTGVmdCA/IGxlZnRDZW50ZXIgOiByaWdodENlbnRlcik7JyxcbiAgICAgICdpZiAoYS54IDwgMC4wIHx8IGEueCA+IDEuMCB8fCBhLnkgPCAwLjAgfHwgYS55ID4gMS4wKSB7JyxcbiAgICAgICAgJ2dsX0ZyYWdDb2xvciA9IGJhY2tncm91bmQ7JyxcbiAgICAgICd9IGVsc2UgeycsXG4gICAgICAgICdnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodERpZmZ1c2UsIHZlYzIoYS54ICogMC41ICsgb2Zmc2V0LCBhLnkpKTsnLFxuICAgICAgJ30nLFxuICAgICd9J1xuXG4gIF0uam9pbignXFxuJylcbn07XG5cblxudmFyIFNoYWRlclBhc3MgPSBmdW5jdGlvbihzaGFkZXIpIHtcbiAgdGhpcy51bmlmb3JtcyA9IFRIUkVFLlVuaWZvcm1zVXRpbHMuY2xvbmUoc2hhZGVyLnVuaWZvcm1zKTtcblxuICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICBkZWZpbmVzOiBzaGFkZXIuZGVmaW5lcyB8fCB7fSxcbiAgICB1bmlmb3JtczogdGhpcy51bmlmb3JtcyxcbiAgICB2ZXJ0ZXhTaGFkZXI6IHNoYWRlci52ZXJ0ZXhTaGFkZXIsXG4gICAgZnJhZ21lbnRTaGFkZXI6IHNoYWRlci5mcmFnbWVudFNoYWRlclxuICB9KTtcblxuICB0aGlzLmNhbWVyYSA9IG5ldyBUSFJFRS5PcnRob2dyYXBoaWNDYW1lcmEoLTEsIDEsIDEsIC0xLCAwLCAxKTtcbiAgdGhpcy5zY2VuZSAgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgdGhpcy5xdWFkID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoMiwgMiksIG51bGwpO1xuICB0aGlzLnNjZW5lLmFkZCh0aGlzLnF1YWQpO1xuXG4gIHRoaXMucmVuZGVyID0gZnVuY3Rpb24ocmVuZGVyRnVuYywgYnVmZmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtc1sndERpZmZ1c2UnXS52YWx1ZSA9IGJ1ZmZlcjtcbiAgICB0aGlzLnF1YWQubWF0ZXJpYWwgPSB0aGlzLm1hdGVyaWFsO1xuICAgIHJlbmRlckZ1bmModGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVSZW5kZXJUYXJnZXQocmVuZGVyZXIpIHtcbiAgdmFyIHdpZHRoICA9IHJlbmRlcmVyLmNvbnRleHQuY2FudmFzLndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gcmVuZGVyZXIuY29udGV4dC5jYW52YXMuaGVpZ2h0O1xuICB2YXIgcGFyYW1ldGVycyA9IHttaW5GaWx0ZXI6IFRIUkVFLkxpbmVhckZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgbWFnRmlsdGVyOiBUSFJFRS5MaW5lYXJGaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdDogVEhSRUUuUkdCRm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICBzdGVuY2lsQnVmZmVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZGVwdGhCdWZmZXI6IGZhbHNlfTtcblxuICByZXR1cm4gbmV3IFRIUkVFLldlYkdMUmVuZGVyVGFyZ2V0KHdpZHRoLCBoZWlnaHQsIHBhcmFtZXRlcnMpO1xufVxuXG4vLyBUT0RPOiBSZWZhY3RvciBpbnRvIHByb3RvdHlwZS1zdHlsZSBjbGFzc2VzLlxuZnVuY3Rpb24gQ2FyZGJvYXJkRGlzdG9ydGVyKHJlbmRlcmVyKSB7XG4gIHZhciBsZWZ0ID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllQ2VudGVyKCk7XG4gIHZhciByaWdodCA9IGRldmljZUluZm8uZ2V0UmlnaHRFeWVDZW50ZXIoKTtcblxuICAvLyBQYXNzIGluIGxlZnQgYW5kIHJpZ2h0IGV5ZSBjZW50ZXJzIGludG8gdGhlIHNoYWRlci5cbiAgQmFycmVsRGlzdG9ydGlvbi5sZWZ0Q2VudGVyID0ge3R5cGU6ICd2MicsIHZhbHVlOiBuZXcgVEhSRUUuVmVjdG9yMihsZWZ0LngsIGxlZnQueSl9O1xuICBCYXJyZWxEaXN0b3J0aW9uLnJpZ2h0Q2VudGVyID0ge3R5cGU6ICd2MicsIHZhbHVlOiBuZXcgVEhSRUUuVmVjdG9yMihyaWdodC54LCByaWdodC55KX07XG5cbiAgLy8gQWxsb3cgY3VzdG9tIGJhY2tncm91bmQgY29sb3JzIGlmIHRoaXMgZ2xvYmFsIGlzIHNldC5cbiAgaWYgKHdpbmRvdy5XRUJWUl9CQUNLR1JPVU5EX0NPTE9SKSB7XG4gICAgQmFycmVsRGlzdG9ydGlvbi51bmlmb3Jtcy5iYWNrZ3JvdW5kID1cbiAgICAgIHt0eXBlOiAndjQnLCB2YWx1ZTogd2luZG93LldFQlZSX0JBQ0tHUk9VTkRfQ09MT1J9O1xuICB9XG5cbiAgdmFyIHNoYWRlclBhc3MgPSBuZXcgU2hhZGVyUGFzcyhCYXJyZWxEaXN0b3J0aW9uKTtcblxuICB2YXIgdGV4dHVyZVRhcmdldCA9IG51bGw7XG4gIHZhciBnZW51aW5lUmVuZGVyID0gcmVuZGVyZXIucmVuZGVyO1xuICB2YXIgZ2VudWluZVNldFNpemUgPSByZW5kZXJlci5zZXRTaXplO1xuICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICB0aGlzLnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0ZXh0dXJlVGFyZ2V0ID0gY3JlYXRlUmVuZGVyVGFyZ2V0KHJlbmRlcmVyKTtcblxuICAgIHJlbmRlcmVyLnJlbmRlciA9IGZ1bmN0aW9uKHNjZW5lLCBjYW1lcmEsIHJlbmRlclRhcmdldCwgZm9yY2VDbGVhcikge1xuICAgICAgZ2VudWluZVJlbmRlci5jYWxsKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhLCB0ZXh0dXJlVGFyZ2V0LCBmb3JjZUNsZWFyKTtcbiAgICB9XG5cbiAgICByZW5kZXJlci5zZXRTaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgIGdlbnVpbmVTZXRTaXplLmNhbGwocmVuZGVyZXIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgdGV4dHVyZVRhcmdldCA9IGNyZWF0ZVJlbmRlclRhcmdldChyZW5kZXJlcik7XG4gICAgfTtcbiAgfVxuXG4gIHRoaXMudW5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVuZGVyZXIucmVuZGVyID0gZ2VudWluZVJlbmRlcjtcbiAgICByZW5kZXJlci5zZXRTaXplID0gZ2VudWluZVNldFNpemU7XG4gIH1cblxuICB0aGlzLnByZVJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0KHRleHR1cmVUYXJnZXQpO1xuICB9XG5cbiAgdGhpcy5wb3N0UmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2l6ZSA9IHJlbmRlcmVyLmdldFNpemUoKTtcbiAgICByZW5kZXJlci5zZXRWaWV3cG9ydCgwLCAwLCBzaXplLndpZHRoLCBzaXplLmhlaWdodCk7XG4gICAgc2hhZGVyUGFzcy5yZW5kZXIoZ2VudWluZVJlbmRlci5iaW5kKHJlbmRlcmVyKSwgdGV4dHVyZVRhcmdldCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyBkaXN0b3J0aW9uLiBUaGlzIGlzIGNhbGxlZCBleHRlcm5hbGx5IGJ5IHRoZSBib2lsZXJwbGF0ZS5cbiAgICogSXQgc2hvdWxkIGJlIGVuYWJsZWQgb25seSBpZiBXZWJWUiBpcyBwcm92aWRlZCBieSBwb2x5ZmlsbC5cbiAgICovXG4gIHRoaXMuc2V0QWN0aXZlID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgICBpc0FjdGl2ZSA9IHN0YXRlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkRGlzdG9ydGVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuLy8gV2lkdGgsIGhlaWdodCBhbmQgYmV2ZWwgbWVhc3VyZW1lbnRzIGRvbmUgb24gcmVhbCBpUGhvbmVzLlxuLy8gUmVzb2x1dGlvbnMgZnJvbSBodHRwOi8vd3d3LnBhaW50Y29kZWFwcC5jb20vbmV3cy91bHRpbWF0ZS1ndWlkZS10by1pcGhvbmUtcmVzb2x1dGlvbnNcbi8vIE5vdGU6IGlQaG9uZSBwaXhlbHMgYXJlIG5vdCBzcXVhcmUsIHNvIHJlbHlpbmcgb24gZGlhZ29uYWwgaXMgbm90IGVub3VnaC5cbnZhciBEZXZpY2VzID0ge1xuICBpUGhvbmU1OiBuZXcgRGV2aWNlKHtcbiAgICB3aWR0aDogNjQwLFxuICAgIGhlaWdodDogMTEzNixcbiAgICB3aWR0aE1tOiA1MS4yNyxcbiAgICBoZWlnaHRNbTogOTAuMTEsXG4gICAgYmV2ZWxNbTogMy45NlxuICB9KSxcbiAgaVBob25lNjogbmV3IERldmljZSh7XG4gICAgd2lkdGg6IDc1MCxcbiAgICBoZWlnaHQ6IDEzMzQsXG4gICAgd2lkdGhNbTogNTguNCxcbiAgICBoZWlnaHRNbTogMTAzLjgsXG4gICAgYmV2ZWxNbTogMy43MVxuICB9KSxcbiAgaVBob25lNlBsdXM6IG5ldyBEZXZpY2Uoe1xuICAgIHdpZHRoOiAxMjQyLFxuICAgIGhlaWdodDogMjIwOCxcbiAgICB3aWR0aE1tOiA2OS41NCxcbiAgICBoZWlnaHRNbTogMTIyLjM1LFxuICAgIGJldmVsTW06IDQuNjJcbiAgfSlcbn07XG5cbnZhciBFbmNsb3N1cmVzID0ge1xuICBDYXJkYm9hcmRWMTogbmV3IENhcmRib2FyZEVuY2xvc3VyZSh7XG4gICAgaXBkTW06IDYxLFxuICAgIGJhc2VsaW5lTGVuc0NlbnRlck1tOiAzNy4yNlxuICB9KSxcbiAgRnVua3lNb25rZXk6IG5ldyBDYXJkYm9hcmRFbmNsb3N1cmUoe1xuICB9KVxufTtcblxuXG52YXIgREVGQVVMVF9MRUZUX0NFTlRFUiA9IHt4OiAwLjUsIHk6IDAuNX07XG52YXIgREVGQVVMVF9SSUdIVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xuXG4vKipcbiAqIEdpdmVzIHRoZSBjb3JyZWN0IGRldmljZSBEUEkgYmFzZWQgb24gc2NyZWVuIGRpbWVuc2lvbnMgYW5kIHVzZXIgYWdlbnQuXG4gKiBGb3Igbm93LCBvbmx5IGlPUyBpcyBzdXBwb3J0ZWQuXG4gKi9cbmZ1bmN0aW9uIERldmljZUluZm8oKSB7XG4gIHRoaXMuZGV2aWNlID0gdGhpcy5kZXRlcm1pbmVEZXZpY2VfKCk7XG4gIHRoaXMuZW5jbG9zdXJlID0gRW5jbG9zdXJlcy5DYXJkYm9hcmRWMTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBjb29yZGluYXRlcyAoaW4gWzAsIDFdKSBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllQ2VudGVyID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5kZXZpY2UpIHtcbiAgICByZXR1cm4gREVGQVVMVF9MRUZUX0NFTlRFUjtcbiAgfVxuICAvLyBHZXQgcGFyYW1ldGVycyBmcm9tIHRoZSBlbmNsb3N1cmUuXG4gIHZhciBleWVUb01pZCA9IHRoaXMuZW5jbG9zdXJlLmlwZE1tIC8gMjtcbiAgdmFyIGV5ZVRvQmFzZSA9IHRoaXMuZW5jbG9zdXJlLmJhc2VsaW5lTGVuc0NlbnRlck1tO1xuXG4gIC8vIEdldCBwYXJhbWV0ZXJzIGZyb20gdGhlIHBob25lLlxuICB2YXIgaGFsZldpZHRoTW0gPSB0aGlzLmRldmljZS5oZWlnaHRNbSAvIDI7XG4gIHZhciBoZWlnaHRNbSA9IHRoaXMuZGV2aWNlLndpZHRoTW07XG5cbiAgLy8gRG8gY2FsY3VsYXRpb25zLlxuICAvLyBNZWFzdXJlIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIGJvdHRvbSBvZiBzY3JlZW4gYW5kIGNlbnRlci5cbiAgdmFyIGV5ZVRvQmV2ZWwgPSBleWVUb0Jhc2UgLSB0aGlzLmRldmljZS5iZXZlbE1tO1xuICB2YXIgcHggPSAxIC0gKGV5ZVRvTWlkIC8gaGFsZldpZHRoTW0pO1xuICB2YXIgcHkgPSAxIC0gKGV5ZVRvQmV2ZWwgLyBoZWlnaHRNbSk7XG5cbiAgcmV0dXJuIHt4OiBweCwgeTogcHl9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0UmlnaHRFeWVDZW50ZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmRldmljZSkge1xuICAgIHJldHVybiBERUZBVUxUX1JJR0hUX0NFTlRFUjtcbiAgfVxuICB2YXIgbGVmdCA9IHRoaXMuZ2V0TGVmdEV5ZUNlbnRlcigpO1xuICByZXR1cm4ge3g6IDEgLSBsZWZ0LngsIHk6IGxlZnQueX07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5kZXRlcm1pbmVEZXZpY2VfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE9ubHkgc3VwcG9ydCBpUGhvbmVzLlxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gT24gaU9TLCB1c2Ugc2NyZWVuIGRpbWVuc2lvbnMgdG8gZGV0ZXJtaW5lIGlQaG9uZS9pUGFkIG1vZGVsLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcblxuICAvLyBDaGVjayBib3RoIHdpZHRoIGFuZCBoZWlnaHQgc2luY2UgdGhlIHBob25lIG1heSBiZSBpbiBsYW5kc2NhcGUuXG4gIHZhciB3aWR0aCA9IHNjcmVlbi5hdmFpbFdpZHRoO1xuICB2YXIgaGVpZ2h0ID0gc2NyZWVuLmF2YWlsSGVpZ2h0O1xuICB2YXIgcGl4ZWxXaWR0aCA9IHdpZHRoICogd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gIHZhciBwaXhlbEhlaWdodCA9IGhlaWdodCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuXG4gIC8vIE1hdGNoIHRoZSBzY3JlZW4gZGltZW5zaW9uIHRvIHRoZSBjb3JyZWN0IGRldmljZS5cbiAgZm9yICh2YXIgaWQgaW4gRGV2aWNlcykge1xuICAgIHZhciBkZXZpY2UgPSBEZXZpY2VzW2lkXTtcbiAgICAvLyBFeHBlY3QgYW4gZXhhY3QgbWF0Y2ggb24gd2lkdGguXG4gICAgaWYgKGRldmljZS53aWR0aCA9PSBwaXhlbFdpZHRoIHx8IGRldmljZS53aWR0aCA9PSBwaXhlbEhlaWdodCkge1xuICAgICAgY29uc29sZS5sb2coJ0RldGVjdGVkIGlQaG9uZTogJXMnLCBpZCk7XG4gICAgICAvLyBUaGlzIGlzIHRoZSByaWdodCBkZXZpY2UuXG4gICAgICByZXR1cm4gZGV2aWNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cblxuZnVuY3Rpb24gRGV2aWNlKHBhcmFtcykge1xuICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoO1xuICB0aGlzLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQ7XG4gIHRoaXMud2lkdGhNbSA9IHBhcmFtcy53aWR0aE1tO1xuICB0aGlzLmhlaWdodE1tID0gcGFyYW1zLmhlaWdodE1tO1xuICB0aGlzLmJldmVsTW0gPSBwYXJhbXMuYmV2ZWxNbTtcbn1cblxuXG5mdW5jdGlvbiBDYXJkYm9hcmRFbmNsb3N1cmUocGFyYW1zKSB7XG4gIC8vIERpc3RvcnRpb24gY29lZmZpY2llbnRzLlxuICB0aGlzLmsxID0gcGFyYW1zLmsxO1xuICB0aGlzLmsyID0gcGFyYW1zLmsyO1xuICAvLyBJUEQgaW4gbWlsbGltZXRlcnMuXG4gIHRoaXMuaXBkTW0gPSBwYXJhbXMuaXBkTW07XG4gIC8vIERpc3RhbmNlIGJldHdlZW4gYmFzZWxpbmUgYW5kIGxlbnMuXG4gIHRoaXMuYmFzZWxpbmVMZW5zQ2VudGVyTW0gPSBwYXJhbXMuYmFzZWxpbmVMZW5zQ2VudGVyTW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGV2aWNlSW5mbztcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gIHRoaXMuY2FsbGJhY2tzID0ge307XG59XG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV07XG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgY29uc29sZS5sb2coJ05vIHZhbGlkIGNhbGxiYWNrIHNwZWNpZmllZC4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgLy8gRWxpbWluYXRlIHRoZSBmaXJzdCBwYXJhbSAodGhlIGNhbGxiYWNrKS5cbiAgYXJncy5zaGlmdCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxufTtcblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbY2FsbGJhY2tdO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgV2ViVlJNYW5hZ2VyID0gcmVxdWlyZSgnLi93ZWJ2ci1tYW5hZ2VyLmpzJyk7XG5cbndpbmRvdy5XZWJWUk1hbmFnZXIgPSBXZWJWUk1hbmFnZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgTW9kZXMgPSB7XG4gIFVOS05PV046IDAsXG4gIC8vIE5vdCBmdWxsc2NyZWVuLCBqdXN0IHRyYWNraW5nLlxuICBOT1JNQUw6IDEsXG4gIC8vIE1hZ2ljIHdpbmRvdyBpbW1lcnNpdmUgbW9kZS5cbiAgTUFHSUNfV0lORE9XOiAyLFxuICAvLyBGdWxsIHNjcmVlbiBzcGxpdCBzY3JlZW4gVlIgbW9kZS5cbiAgVlI6IDMsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVzO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gUm90YXRlSW5zdHJ1Y3Rpb25zKCkge1xuICB0aGlzLmxvYWRJY29uXygpO1xuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMudG9wID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5sZWZ0ID0gMDtcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAnZ3JheSc7XG4gIHMuYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnO1xuICBzLmJhY2tncm91bmRQb3NpdGlvbiA9ICc1MCUgMjAlJztcbiAgcy5iYWNrZ3JvdW5kSW1hZ2UgPSAndXJsKCcgKyB0aGlzLmljb24gKyAnKSc7XG5cbiAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSB0ZXh0LnN0eWxlO1xuICBzLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICBzLmZvbnRTaXplID0gJzI0cHgnO1xuICBzLmZvbnRGYW1pbHkgPSAnc2Fucy1zZXJpZic7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLmJvdHRvbSA9IDA7XG4gIHMubWFyZ2luQm90dG9tID0gJzUlJztcbiAgcy5tYXJnaW5MZWZ0ID0gJ2F1dG8nO1xuICBzLm1hcmdpblJpZ2h0ID0gJ2F1dG8nO1xuICBzLndpZHRoID0gJzEwMCUnO1xuICB0ZXh0LmlubmVySFRNTCA9ICdQbGFjZSB5b3VyIHBob25lIGludG8geW91ciBDYXJkYm9hcmQgdmlld2VyLic7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgdGhpcy5vdmVybGF5ID0gb3ZlcmxheTtcbiAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdmVybGF5KTtcblxuICB0aGlzLmhpZGUoKTtcbn1cblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICB2YXIgc1RleHQgPSB0aGlzLnRleHQuc3R5bGU7XG4gIHZhciBzID0gdGhpcy5vdmVybGF5LnN0eWxlO1xuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgcy5iYWNrZ3JvdW5kU2l6ZSA9ICczMCUnO1xuICB9IGVsc2Uge1xuICAgIHMuYmFja2dyb3VuZFNpemUgPSAnNjAlJztcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbihtcykge1xuICB0aGlzLnNob3coKTtcbiAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQodGhpcy5oaWRlLmJpbmQodGhpcyksIG1zKTtcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUuZGlzYWJsZVNob3dUZW1wb3JhcmlseSA9IGZ1bmN0aW9uKCkge1xuICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmxvYWRJY29uXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmljb24gPSBVdGlsLmJhc2U2NCgnaW1hZ2Uvc3ZnK3htbCcsICdQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtDanh6ZG1jZ2QybGtkR2c5SWpFNU9IQjRJaUJvWldsbmFIUTlJakkwTUhCNElpQjJhV1YzUW05NFBTSXdJREFnTVRrNElESTBNQ0lnZG1WeWMybHZiajBpTVM0eElpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIaHRiRzV6T25oc2FXNXJQU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh4T1RrNUwzaHNhVzVySWlCNGJXeHVjenB6YTJWMFkyZzlJbWgwZEhBNkx5OTNkM2N1WW05b1pXMXBZVzVqYjJScGJtY3VZMjl0TDNOclpYUmphQzl1Y3lJK0NpQWdJQ0E4SVMwdElFZGxibVZ5WVhSdmNqb2dVMnRsZEdOb0lETXVNeTR6SUNneE1qQTRNU2tnTFNCb2RIUndPaTh2ZDNkM0xtSnZhR1Z0YVdGdVkyOWthVzVuTG1OdmJTOXphMlYwWTJnZ0xTMCtDaUFnSUNBOGRHbDBiR1UrZEhKaGJuTnBkR2x2Ymp3dmRHbDBiR1UrQ2lBZ0lDQThaR1Z6WXo1RGNtVmhkR1ZrSUhkcGRHZ2dVMnRsZEdOb0xqd3ZaR1Z6WXo0S0lDQWdJRHhrWldaelBqd3ZaR1ZtY3o0S0lDQWdJRHhuSUdsa1BTSlFZV2RsTFRFaUlITjBjbTlyWlQwaWJtOXVaU0lnYzNSeWIydGxMWGRwWkhSb1BTSXhJaUJtYVd4c1BTSnViMjVsSWlCbWFXeHNMWEoxYkdVOUltVjJaVzV2WkdRaUlITnJaWFJqYURwMGVYQmxQU0pOVTFCaFoyVWlQZ29nSUNBZ0lDQWdJRHhuSUdsa1BTSjBjbUZ1YzJsMGFXOXVJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTkJjblJpYjJGeVpFZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdQR2NnYVdROUlrbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVFF0S3kxSmJYQnZjblJsWkMxTVlYbGxjbk10UTI5d2VTMHJMVWx0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRJdFEyOXdlU0lnYzJ0bGRHTm9PblI1Y0dVOUlrMVRUR0Y1WlhKSGNtOTFjQ0krQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WnlCcFpEMGlTVzF3YjNKMFpXUXRUR0Y1WlhKekxVTnZjSGt0TkNJZ2RISmhibk5tYjNKdFBTSjBjbUZ1YzJ4aGRHVW9NQzR3TURBd01EQXNJREV3Tnk0d01EQXdNREFwSWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5UYUdGd1pVZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE1TGpZeU5Td3lMalV5TnlCRE1UUTVMall5TlN3eUxqVXlOeUF4TlRVdU9EQTFMRFl1TURrMklERTFOaTR6TmpJc05pNDBNVGdnVERFMU5pNHpOaklzTnk0ek1EUWdRekUxTmk0ek5qSXNOeTQwT0RFZ01UVTJMak0zTlN3M0xqWTJOQ0F4TlRZdU5DdzNMamcxTXlCRE1UVTJMalF4TERjdU9UTTBJREUxTmk0ME1pdzRMakF4TlNBeE5UWXVOREkzTERndU1EazFJRU14TlRZdU5UWTNMRGt1TlRFZ01UVTNMalF3TVN3eE1TNHdPVE1nTVRVNExqVXpNaXd4TWk0d09UUWdUREUyTkM0eU5USXNNVGN1TVRVMklFd3hOalF1TXpNekxERTNMakEyTmlCRE1UWTBMak16TXl3eE55NHdOallnTVRZNExqY3hOU3d4TkM0MU16WWdNVFk1TGpVMk9Dd3hOQzR3TkRJZ1F6RTNNUzR3TWpVc01UUXVPRGd6SURFNU5TNDFNemdzTWprdU1ETTFJREU1TlM0MU16Z3NNamt1TURNMUlFd3hPVFV1TlRNNExEZ3pMakF6TmlCRE1UazFMalV6T0N3NE15NDRNRGNnTVRrMUxqRTFNaXc0TkM0eU5UTWdNVGswTGpVNUxEZzBMakkxTXlCRE1UazBMak0xTnl3NE5DNHlOVE1nTVRrMExqQTVOU3c0TkM0eE56Y2dNVGt6TGpneE9DdzROQzR3TVRjZ1RERTJPUzQ0TlRFc056QXVNVGM1SUV3eE5qa3VPRE0zTERjd0xqSXdNeUJNTVRReUxqVXhOU3c0TlM0NU56Z2dUREUwTVM0Mk5qVXNPRFF1TmpVMUlFTXhNell1T1RNMExEZ3pMakV5TmlBeE16RXVPVEUzTERneExqa3hOU0F4TWpZdU56RTBMRGd4TGpBME5TQkRNVEkyTGpjd09TdzRNUzR3TmlBeE1qWXVOekEzTERneExqQTJPU0F4TWpZdU56QTNMRGd4TGpBMk9TQk1NVEl4TGpZMExEazRMakF6SUV3eE1UTXVOelE1TERFd01pNDFPRFlnVERFeE15NDNNVElzTVRBeUxqVXlNeUJNTVRFekxqY3hNaXd4TXpBdU1URXpJRU14TVRNdU56RXlMREV6TUM0NE9EVWdNVEV6TGpNeU5pd3hNekV1TXpNZ01URXlMamMyTkN3eE16RXVNek1nUXpFeE1pNDFNeklzTVRNeExqTXpJREV4TWk0eU5qa3NNVE14TGpJMU5DQXhNVEV1T1RreUxERXpNUzR3T1RRZ1REWTVMalV4T1N3eE1EWXVOVGN5SUVNMk9DNDFOamtzTVRBMkxqQXlNeUEyTnk0M09Ua3NNVEEwTGpZNU5TQTJOeTQzT1Rrc01UQXpMall3TlNCTU5qY3VOems1TERFd01pNDFOeUJNTmpjdU56YzRMREV3TWk0Mk1UY2dRelkzTGpJM0xERXdNaTR6T1RNZ05qWXVOalE0TERFd01pNHlORGtnTmpVdU9UWXlMREV3TWk0eU1UZ2dRelkxTGpnM05Td3hNREl1TWpFMElEWTFMamM0T0N3eE1ESXVNakV5SURZMUxqY3dNU3d4TURJdU1qRXlJRU0yTlM0Mk1EWXNNVEF5TGpJeE1pQTJOUzQxTVRFc01UQXlMakl4TlNBMk5TNDBNVFlzTVRBeUxqSXhPU0JETmpVdU1UazFMREV3TWk0eU1qa2dOalF1T1RjMExERXdNaTR5TXpVZ05qUXVOelUwTERFd01pNHlNelVnUXpZMExqTXpNU3d4TURJdU1qTTFJRFl6TGpreE1Td3hNREl1TWpFMklEWXpMalE1T0N3eE1ESXVNVGM0SUVNMk1TNDRORE1zTVRBeUxqQXlOU0EyTUM0eU9UZ3NNVEF4TGpVM09DQTFPUzR3T1RRc01UQXdMamc0TWlCTU1USXVOVEU0TERjekxqazVNaUJNTVRJdU5USXpMRGMwTGpBd05DQk1NaTR5TkRVc05UVXVNalUwSUVNeExqSTBOQ3cxTXk0ME1qY2dNaTR3TURRc05URXVNRE00SURNdU9UUXpMRFE1TGpreE9DQk1OVGt1T1RVMExERTNMalUzTXlCRE5qQXVOakkyTERFM0xqRTROU0EyTVM0ek5Td3hOeTR3TURFZ05qSXVNRFV6TERFM0xqQXdNU0JETmpNdU16YzVMREUzTGpBd01TQTJOQzQyTWpVc01UY3VOallnTmpVdU1qZ3NNVGd1T0RVMElFdzJOUzR5T0RVc01UZ3VPRFV4SUV3Mk5TNDFNVElzTVRrdU1qWTBJRXcyTlM0MU1EWXNNVGt1TWpZNElFTTJOUzQ1TURrc01qQXVNREF6SURZMkxqUXdOU3d5TUM0Mk9DQTJOaTQ1T0RNc01qRXVNamcySUV3Mk55NHlOaXd5TVM0MU5UWWdRelk1TGpFM05Dd3lNeTQwTURZZ056RXVOekk0TERJMExqTTFOeUEzTkM0ek56TXNNalF1TXpVM0lFTTNOaTR6TWpJc01qUXVNelUzSURjNExqTXlNU3d5TXk0NE5DQTRNQzR4TkRnc01qSXVOemcxSUVNNE1DNHhOakVzTWpJdU56ZzFJRGczTGpRMk55d3hPQzQxTmpZZ09EY3VORFkzTERFNExqVTJOaUJET0RndU1UTTVMREU0TGpFM09DQTRPQzQ0TmpNc01UY3VPVGswSURnNUxqVTJOaXd4Tnk0NU9UUWdRemt3TGpnNU1pd3hOeTQ1T1RRZ09USXVNVE00TERFNExqWTFNaUE1TWk0M09USXNNVGt1T0RRM0lFdzVOaTR3TkRJc01qVXVOemMxSUV3NU5pNHdOalFzTWpVdU56VTNJRXd4TURJdU9EUTVMREk1TGpZM05DQk1NVEF5TGpjME5Dd3lPUzQwT1RJZ1RERTBPUzQyTWpVc01pNDFNamNnVFRFME9TNDJNalVzTUM0NE9USWdRekUwT1M0ek5ETXNNQzQ0T1RJZ01UUTVMakEyTWl3d0xqazJOU0F4TkRndU9ERXNNUzR4TVNCTU1UQXlMalkwTVN3eU55NDJOallnVERrM0xqSXpNU3d5TkM0MU5ESWdURGswTGpJeU5pd3hPUzR3TmpFZ1F6a3pMak14TXl3eE55NHpPVFFnT1RFdU5USTNMREUyTGpNMU9TQTRPUzQxTmpZc01UWXVNelU0SUVNNE9DNDFOVFVzTVRZdU16VTRJRGczTGpVME5pd3hOaTQyTXpJZ09EWXVOalE1TERFM0xqRTFJRU00TXk0NE56Z3NNVGd1TnpVZ056a3VOamczTERJeExqRTJPU0EzT1M0ek56UXNNakV1TXpRMUlFTTNPUzR6TlRrc01qRXVNelV6SURjNUxqTTBOU3d5TVM0ek5qRWdOemt1TXpNc01qRXVNelk1SUVNM055NDNPVGdzTWpJdU1qVTBJRGMyTGpBNE5Dd3lNaTQzTWpJZ056UXVNemN6TERJeUxqY3lNaUJETnpJdU1EZ3hMREl5TGpjeU1pQTJPUzQ1TlRrc01qRXVPRGtnTmpndU16azNMREl3TGpNNElFdzJPQzR4TkRVc01qQXVNVE0xSUVNMk55NDNNRFlzTVRrdU5qY3lJRFkzTGpNeU15d3hPUzR4TlRZZ05qY3VNREEyTERFNExqWXdNU0JETmpZdU9UZzRMREU0TGpVMU9TQTJOaTQ1Tmpnc01UZ3VOVEU1SURZMkxqazBOaXd4T0M0ME56a2dURFkyTGpjeE9Td3hPQzR3TmpVZ1F6WTJMalk1TERFNExqQXhNaUEyTmk0Mk5UZ3NNVGN1T1RZZ05qWXVOakkwTERFM0xqa3hNU0JETmpVdU5qZzJMREUyTGpNek55QTJNeTQ1TlRFc01UVXVNelkySURZeUxqQTFNeXd4TlM0ek5qWWdRell4TGpBME1pd3hOUzR6TmpZZ05qQXVNRE16TERFMUxqWTBJRFU1TGpFek5pd3hOaTR4TlRnZ1RETXVNVEkxTERRNExqVXdNaUJETUM0ME1qWXNOVEF1TURZeElDMHdMall4TXl3MU15NDBORElnTUM0NE1URXNOVFl1TURRZ1RERXhMakE0T1N3M05DNDNPU0JETVRFdU1qWTJMRGMxTGpFeE15QXhNUzQxTXpjc056VXVNelV6SURFeExqZzFMRGMxTGpRNU5DQk1OVGd1TWpjMkxERXdNaTR5T1RnZ1F6VTVMalkzT1N3eE1ETXVNVEE0SURZeExqUXpNeXd4TURNdU5qTWdOak11TXpRNExERXdNeTQ0TURZZ1F6WXpMamd4TWl3eE1ETXVPRFE0SURZMExqSTROU3d4TURNdU9EY2dOalF1TnpVMExERXdNeTQ0TnlCRE5qVXNNVEF6TGpnM0lEWTFMakkwT1N3eE1ETXVPRFkwSURZMUxqUTVOQ3d4TURNdU9EVXlJRU0yTlM0MU5qTXNNVEF6TGpnME9TQTJOUzQyTXpJc01UQXpMamcwTnlBMk5TNDNNREVzTVRBekxqZzBOeUJETmpVdU56WTBMREV3TXk0NE5EY2dOalV1T0RJNExERXdNeTQ0TkRrZ05qVXVPRGtzTVRBekxqZzFNaUJETmpVdU9UZzJMREV3TXk0NE5UWWdOall1TURnc01UQXpMamcyTXlBMk5pNHhOek1zTVRBekxqZzNOQ0JETmpZdU1qZ3lMREV3TlM0ME5qY2dOamN1TXpNeUxERXdOeTR4T1RjZ05qZ3VOekF5TERFd055NDVPRGdnVERFeE1TNHhOelFzTVRNeUxqVXhJRU14TVRFdU5qazRMREV6TWk0NE1USWdNVEV5TGpJek1pd3hNekl1T1RZMUlERXhNaTQzTmpRc01UTXlMamsyTlNCRE1URTBMakkyTVN3eE16SXVPVFkxSURFeE5TNHpORGNzTVRNeExqYzJOU0F4TVRVdU16UTNMREV6TUM0eE1UTWdUREV4TlM0ek5EY3NNVEF6TGpVMU1TQk1NVEl5TGpRMU9DdzVPUzQwTkRZZ1F6RXlNaTQ0TVRrc09Ua3VNak0zSURFeU15NHdPRGNzT1RndU9EazRJREV5TXk0eU1EY3NPVGd1TkRrNElFd3hNamN1T0RZMUxEZ3lMamt3TlNCRE1UTXlMakkzT1N3NE15NDNNRElnTVRNMkxqVTFOeXc0TkM0M05UTWdNVFF3TGpZd055dzROaTR3TXpNZ1RERTBNUzR4TkN3NE5pNDROaklnUXpFME1TNDBOVEVzT0RjdU16UTJJREUwTVM0NU56Y3NPRGN1TmpFeklERTBNaTQxTVRZc09EY3VOakV6SUVNeE5ESXVOemswTERnM0xqWXhNeUF4TkRNdU1EYzJMRGczTGpVME1pQXhORE11TXpNekxEZzNMak01TXlCTU1UWTVMamcyTlN3M01pNHdOellnVERFNU15dzROUzQwTXpNZ1F6RTVNeTQxTWpNc09EVXVOek0xSURFNU5DNHdOVGdzT0RVdU9EZzRJREU1TkM0MU9TdzROUzQ0T0RnZ1F6RTVOaTR3T0Rjc09EVXVPRGc0SURFNU55NHhOek1zT0RRdU5qZzVJREU1Tnk0eE56TXNPRE11TURNMklFd3hPVGN1TVRjekxESTVMakF6TlNCRE1UazNMakUzTXl3eU9DNDBOVEVnTVRrMkxqZzJNU3d5Tnk0NU1URWdNVGsyTGpNMU5Td3lOeTQyTVRrZ1F6RTVOaTR6TlRVc01qY3VOakU1SURFM01TNDRORE1zTVRNdU5EWTNJREUzTUM0ek9EVXNNVEl1TmpJMklFTXhOekF1TVRNeUxERXlMalE0SURFMk9TNDROU3d4TWk0ME1EY2dNVFk1TGpVMk9Dd3hNaTQwTURjZ1F6RTJPUzR5T0RVc01USXVOREEzSURFMk9TNHdNRElzTVRJdU5EZ3hJREUyT0M0M05Ea3NNVEl1TmpJM0lFTXhOamd1TVRRekxERXlMamszT0NBeE5qVXVOelUyTERFMExqTTFOeUF4TmpRdU5ESTBMREUxTGpFeU5TQk1NVFU1TGpZeE5Td3hNQzQ0TnlCRE1UVTRMamM1Tml3eE1DNHhORFVnTVRVNExqRTFOQ3c0TGprek55QXhOVGd1TURVMExEY3VPVE0wSUVNeE5UZ3VNRFExTERjdU9ETTNJREUxT0M0d016UXNOeTQzTXprZ01UVTRMakF5TVN3M0xqWTBJRU14TlRndU1EQTFMRGN1TlRJeklERTFOeTQ1T1Rnc055NDBNU0F4TlRjdU9UazRMRGN1TXpBMElFd3hOVGN1T1RrNExEWXVOREU0SUVNeE5UY3VPVGs0TERVdU9ETTBJREUxTnk0Mk9EWXNOUzR5T1RVZ01UVTNMakU0TVN3MUxqQXdNaUJETVRVMkxqWXlOQ3cwTGpZNElERTFNQzQwTkRJc01TNHhNVEVnTVRVd0xqUTBNaXd4TGpFeE1TQkRNVFV3TGpFNE9Td3dMamsyTlNBeE5Ea3VPVEEzTERBdU9Ea3lJREUwT1M0Mk1qVXNNQzQ0T1RJaUlHbGtQU0pHYVd4c0xURWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVFl1TURJM0xESTFMall6TmlCTU1UUXlMall3TXl3MU1pNDFNamNnUXpFME15NDRNRGNzTlRNdU1qSXlJREUwTkM0MU9ESXNOVFF1TVRFMElERTBOQzQ0TkRVc05UVXVNRFk0SUV3eE5EUXVPRE0xTERVMUxqQTNOU0JNTmpNdU5EWXhMREV3TWk0d05UY2dURFl6TGpRMkxERXdNaTR3TlRjZ1F6WXhMamd3Tml3eE1ERXVPVEExSURZd0xqSTJNU3d4TURFdU5EVTNJRFU1TGpBMU55d3hNREF1TnpZeUlFd3hNaTQwT0RFc056TXVPRGN4SUV3NU5pNHdNamNzTWpVdU5qTTJJaUJwWkQwaVJtbHNiQzB5SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZekxqUTJNU3d4TURJdU1UYzBJRU0yTXk0ME5UTXNNVEF5TGpFM05DQTJNeTQwTkRZc01UQXlMakUzTkNBMk15NDBNemtzTVRBeUxqRTNNaUJETmpFdU56UTJMREV3TWk0d01UWWdOakF1TWpFeExERXdNUzQxTmpNZ05UZ3VPVGs0TERFd01DNDROak1nVERFeUxqUXlNaXczTXk0NU56TWdRekV5TGpNNE5pdzNNeTQ1TlRJZ01USXVNelkwTERjekxqa3hOQ0F4TWk0ek5qUXNOek11T0RjeElFTXhNaTR6TmpRc056TXVPRE1nTVRJdU16ZzJMRGN6TGpjNU1TQXhNaTQwTWpJc056TXVOemNnVERrMUxqazJPQ3d5TlM0MU16VWdRemsyTGpBd05Dd3lOUzQxTVRRZ09UWXVNRFE1TERJMUxqVXhOQ0E1Tmk0d09EVXNNalV1TlRNMUlFd3hOREl1TmpZeExEVXlMalF5TmlCRE1UUXpMamc0T0N3MU15NHhNelFnTVRRMExqWTRNaXcxTkM0d016Z2dNVFEwTGprMU55dzFOUzR3TXpjZ1F6RTBOQzQ1Tnl3MU5TNHdPRE1nTVRRMExqazFNeXcxTlM0eE16TWdNVFEwTGpreE5TdzFOUzR4TmpFZ1F6RTBOQzQ1TVRFc05UVXVNVFkxSURFME5DNDRPVGdzTlRVdU1UYzBJREUwTkM0NE9UUXNOVFV1TVRjM0lFdzJNeTQxTVRrc01UQXlMakUxT0NCRE5qTXVOVEF4TERFd01pNHhOamtnTmpNdU5EZ3hMREV3TWk0eE56UWdOak11TkRZeExERXdNaTR4TnpRZ1REWXpMalEyTVN3eE1ESXVNVGMwSUZvZ1RURXlMamN4TkN3M015NDROekVnVERVNUxqRXhOU3d4TURBdU5qWXhJRU0yTUM0eU9UTXNNVEF4TGpNME1TQTJNUzQzT0RZc01UQXhMamM0TWlBMk15NDBNelVzTVRBeExqa3pOeUJNTVRRMExqY3dOeXcxTlM0d01UVWdRekUwTkM0ME1qZ3NOVFF1TVRBNElERTBNeTQyT0RJc05UTXVNamcxSURFME1pNDFORFFzTlRJdU5qSTRJRXc1Tmk0d01qY3NNalV1TnpjeElFd3hNaTQzTVRRc056TXVPRGN4SUV3eE1pNDNNVFFzTnpNdU9EY3hJRm9pSUdsa1BTSkdhV3hzTFRNaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTRMak15Tnl3MU9DNDBOekVnUXpFME9DNHhORFVzTlRndU5EZ2dNVFEzTGprMk1pdzFPQzQwT0NBeE5EY3VOemd4TERVNExqUTNNaUJETVRRMUxqZzROeXcxT0M0ek9Ea2dNVFEwTGpRM09TdzFOeTQwTXpRZ01UUTBMall6Tml3MU5pNHpOQ0JETVRRMExqWTRPU3cxTlM0NU5qY2dNVFEwTGpZMk5DdzFOUzQxT1RjZ01UUTBMalUyTkN3MU5TNHlNelVnVERZekxqUTJNU3d4TURJdU1EVTNJRU0yTkM0d09Ea3NNVEF5TGpFeE5TQTJOQzQzTXpNc01UQXlMakV6SURZMUxqTTNPU3d4TURJdU1EazVJRU0yTlM0MU5qRXNNVEF5TGpBNUlEWTFMamMwTXl3eE1ESXVNRGtnTmpVdU9USTFMREV3TWk0d09UZ2dRelkzTGpneE9Td3hNREl1TVRneElEWTVMakl5Tnl3eE1ETXVNVE0ySURZNUxqQTNMREV3TkM0eU15Qk1NVFE0TGpNeU55dzFPQzQwTnpFaUlHbGtQU0pHYVd4c0xUUWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5Oamt1TURjc01UQTBMak0wTnlCRE5qa3VNRFE0TERFd05DNHpORGNnTmprdU1ESTFMREV3TkM0ek5DQTJPUzR3TURVc01UQTBMak15TnlCRE5qZ3VPVFk0TERFd05DNHpNREVnTmpndU9UUTRMREV3TkM0eU5UY2dOamd1T1RVMUxERXdOQzR5TVRNZ1F6WTVMREV3TXk0NE9UWWdOamd1T0RrNExERXdNeTQxTnpZZ05qZ3VOalU0TERFd015NHlPRGdnUXpZNExqRTFNeXd4TURJdU5qYzRJRFkzTGpFd015d3hNREl1TWpZMklEWTFMamt5TERFd01pNHlNVFFnUXpZMUxqYzBNaXd4TURJdU1qQTJJRFkxTGpVMk15d3hNREl1TWpBM0lEWTFMak00TlN3eE1ESXVNakUxSUVNMk5DNDNORElzTVRBeUxqSTBOaUEyTkM0d09EY3NNVEF5TGpJek1pQTJNeTQwTlN3eE1ESXVNVGMwSUVNMk15NHpPVGtzTVRBeUxqRTJPU0EyTXk0ek5UZ3NNVEF5TGpFek1pQTJNeTR6TkRjc01UQXlMakE0TWlCRE5qTXVNek0yTERFd01pNHdNek1nTmpNdU16VTRMREV3TVM0NU9ERWdOak11TkRBeUxERXdNUzQ1TlRZZ1RERTBOQzQxTURZc05UVXVNVE0wSUVNeE5EUXVOVE0zTERVMUxqRXhOaUF4TkRRdU5UYzFMRFUxTGpFeE15QXhORFF1TmpBNUxEVTFMakV5TnlCRE1UUTBMalkwTWl3MU5TNHhOREVnTVRRMExqWTJPQ3cxTlM0eE55QXhORFF1TmpjM0xEVTFMakl3TkNCRE1UUTBMamM0TVN3MU5TNDFPRFVnTVRRMExqZ3dOaXcxTlM0NU56SWdNVFEwTGpjMU1TdzFOaTR6TlRjZ1F6RTBOQzQzTURZc05UWXVOamN6SURFME5DNDRNRGdzTlRZdU9UazBJREUwTlM0d05EY3NOVGN1TWpneUlFTXhORFV1TlRVekxEVTNMamc1TWlBeE5EWXVOakF5TERVNExqTXdNeUF4TkRjdU56ZzJMRFU0TGpNMU5TQkRNVFEzTGprMk5DdzFPQzR6TmpNZ01UUTRMakUwTXl3MU9DNHpOak1nTVRRNExqTXlNU3cxT0M0ek5UUWdRekUwT0M0ek56Y3NOVGd1TXpVeUlERTBPQzQwTWpRc05UZ3VNemczSURFME9DNDBNemtzTlRndU5ETTRJRU14TkRndU5EVTBMRFU0TGpRNUlERTBPQzQwTXpJc05UZ3VOVFExSURFME9DNHpPRFVzTlRndU5UY3lJRXcyT1M0eE1qa3NNVEEwTGpNek1TQkROamt1TVRFeExERXdOQzR6TkRJZ05qa3VNRGtzTVRBMExqTTBOeUEyT1M0d055d3hNRFF1TXpRM0lFdzJPUzR3Tnl3eE1EUXVNelEzSUZvZ1RUWTFMalkyTlN3eE1ERXVPVGMxSUVNMk5TNDNOVFFzTVRBeExqazNOU0EyTlM0NE5ESXNNVEF4TGprM055QTJOUzQ1TXl3eE1ERXVPVGd4SUVNMk55NHhPVFlzTVRBeUxqQXpOeUEyT0M0eU9ETXNNVEF5TGpRMk9TQTJPQzQ0TXpnc01UQXpMakV6T1NCRE5qa3VNRFkxTERFd015NDBNVE1nTmprdU1UZzRMREV3TXk0M01UUWdOamt1TVRrNExERXdOQzR3TWpFZ1RERTBOeTQ0T0RNc05UZ3VOVGt5SUVNeE5EY3VPRFEzTERVNExqVTVNaUF4TkRjdU9ERXhMRFU0TGpVNU1TQXhORGN1TnpjMkxEVTRMalU0T1NCRE1UUTJMalV3T1N3MU9DNDFNek1nTVRRMUxqUXlNaXcxT0M0eElERTBOQzQ0Tmpjc05UY3VORE14SUVNeE5EUXVOVGcxTERVM0xqQTVNU0F4TkRRdU5EWTFMRFUyTGpjd055QXhORFF1TlRJc05UWXVNekkwSUVNeE5EUXVOVFl6TERVMkxqQXlNU0F4TkRRdU5UVXlMRFUxTGpjeE5pQXhORFF1TkRnNExEVTFMalF4TkNCTU5qTXVPRFEyTERFd01TNDVOeUJETmpRdU16VXpMREV3TWk0d01ESWdOalF1T0RZM0xERXdNaTR3TURZZ05qVXVNemMwTERFd01TNDVPRElnUXpZMUxqUTNNU3d4TURFdU9UYzNJRFkxTGpVMk9Dd3hNREV1T1RjMUlEWTFMalkyTlN3eE1ERXVPVGMxSUV3Mk5TNDJOalVzTVRBeExqazNOU0JhSWlCcFpEMGlSbWxzYkMwMUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUSXVNakE0TERVMUxqRXpOQ0JETVM0eU1EY3NOVE11TXpBM0lERXVPVFkzTERVd0xqa3hOeUF6TGprd05pdzBPUzQzT1RjZ1REVTVMamt4Tnl3eE55NDBOVE1nUXpZeExqZzFOaXd4Tmk0ek16TWdOalF1TWpReExERTJMamt3TnlBMk5TNHlORE1zTVRndU56TTBJRXcyTlM0ME56VXNNVGt1TVRRMElFTTJOUzQ0TnpJc01Ua3VPRGd5SURZMkxqTTJPQ3d5TUM0MU5pQTJOaTQ1TkRVc01qRXVNVFkxSUV3Mk55NHlNak1zTWpFdU5ETTFJRU0zTUM0MU5EZ3NNalF1TmpRNUlEYzFMamd3Tml3eU5TNHhOVEVnT0RBdU1URXhMREl5TGpZMk5TQk1PRGN1TkRNc01UZ3VORFExSUVNNE9TNHpOeXd4Tnk0ek1qWWdPVEV1TnpVMExERTNMamc1T1NBNU1pNDNOVFVzTVRrdU56STNJRXc1Tmk0d01EVXNNalV1TmpVMUlFd3hNaTQwT0RZc056TXVPRGcwSUV3eUxqSXdPQ3cxTlM0eE16UWdXaUlnYVdROUlrWnBiR3d0TmlJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1pNDBPRFlzTnpRdU1EQXhJRU14TWk0ME56WXNOelF1TURBeElERXlMalEyTlN3M015NDVPVGtnTVRJdU5EVTFMRGN6TGprNU5pQkRNVEl1TkRJMExEY3pMams0T0NBeE1pNHpPVGtzTnpNdU9UWTNJREV5TGpNNE5DdzNNeTQ1TkNCTU1pNHhNRFlzTlRVdU1Ua2dRekV1TURjMUxEVXpMak14SURFdU9EVTNMRFV3TGpnME5TQXpMamcwT0N3ME9TNDJPVFlnVERVNUxqZzFPQ3d4Tnk0ek5USWdRell3TGpVeU5Td3hOaTQ1TmpjZ05qRXVNamN4TERFMkxqYzJOQ0EyTWk0d01UWXNNVFl1TnpZMElFTTJNeTQwTXpFc01UWXVOelkwSURZMExqWTJOaXd4Tnk0ME5qWWdOalV1TXpJM0xERTRMalkwTmlCRE5qVXVNek0zTERFNExqWTFOQ0EyTlM0ek5EVXNNVGd1TmpZeklEWTFMak0xTVN3eE9DNDJOelFnVERZMUxqVTNPQ3d4T1M0d09EZ2dRelkxTGpVNE5Dd3hPUzR4SURZMUxqVTRPU3d4T1M0eE1USWdOalV1TlRreExERTVMakV5TmlCRE5qVXVPVGcxTERFNUxqZ3pPQ0EyTmk0ME5qa3NNakF1TkRrM0lEWTNMakF6TERJeExqQTROU0JNTmpjdU16QTFMREl4TGpNMU1TQkROamt1TVRVeExESXpMakV6TnlBM01TNDJORGtzTWpRdU1USWdOelF1TXpNMkxESTBMakV5SUVNM05pNHpNVE1zTWpRdU1USWdOemd1TWprc01qTXVOVGd5SURnd0xqQTFNeXd5TWk0MU5qTWdRemd3TGpBMk5Dd3lNaTQxTlRjZ09EQXVNRGMyTERJeUxqVTFNeUE0TUM0d09EZ3NNakl1TlRVZ1REZzNMak0zTWl3eE9DNHpORFFnUXpnNExqQXpPQ3d4Tnk0NU5Ua2dPRGd1TnpnMExERTNMamMxTmlBNE9TNDFNamtzTVRjdU56VTJJRU01TUM0NU5UWXNNVGN1TnpVMklEa3lMakl3TVN3eE9DNDBOeklnT1RJdU9EVTRMREU1TGpZM0lFdzVOaTR4TURjc01qVXVOVGs1SUVNNU5pNHhNemdzTWpVdU5qVTBJRGsyTGpFeE9Dd3lOUzQzTWpRZ09UWXVNRFl6TERJMUxqYzFOaUJNTVRJdU5UUTFMRGN6TGprNE5TQkRNVEl1TlRJMkxEY3pMams1TmlBeE1pNDFNRFlzTnpRdU1EQXhJREV5TGpRNE5pdzNOQzR3TURFZ1RERXlMalE0Tml3M05DNHdNREVnV2lCTk5qSXVNREUyTERFMkxqazVOeUJETmpFdU16RXlMREUyTGprNU55QTJNQzQyTURZc01UY3VNVGtnTlRrdU9UYzFMREUzTGpVMU5DQk1NeTQ1TmpVc05Ea3VPRGs1SUVNeUxqQTRNeXcxTUM0NU9EVWdNUzR6TkRFc05UTXVNekE0SURJdU16RXNOVFV1TURjNElFd3hNaTQxTXpFc056TXVOekl6SUV3NU5TNDRORGdzTWpVdU5qRXhJRXc1TWk0Mk5UTXNNVGt1TnpneUlFTTVNaTR3TXpnc01UZ3VOallnT1RBdU9EY3NNVGN1T1RrZ09Ea3VOVEk1TERFM0xqazVJRU00T0M0NE1qVXNNVGN1T1RrZ09EZ3VNVEU1TERFNExqRTRNaUE0Tnk0ME9Ea3NNVGd1TlRRM0lFdzRNQzR4TnpJc01qSXVOemN5SUVNNE1DNHhOakVzTWpJdU56YzRJRGd3TGpFME9Td3lNaTQzT0RJZ09EQXVNVE0zTERJeUxqYzROU0JETnpndU16UTJMREl6TGpneE1TQTNOaTR6TkRFc01qUXVNelUwSURjMExqTXpOaXd5TkM0ek5UUWdRemN4TGpVNE9Dd3lOQzR6TlRRZ05qa3VNRE16TERJekxqTTBOeUEyTnk0eE5ESXNNakV1TlRFNUlFdzJOaTQ0TmpRc01qRXVNalE1SUVNMk5pNHlOemNzTWpBdU5qTTBJRFkxTGpjM05Dd3hPUzQ1TkRjZ05qVXVNelkzTERFNUxqSXdNeUJETmpVdU16WXNNVGt1TVRreUlEWTFMak0xTml3eE9TNHhOemtnTmpVdU16VTBMREU1TGpFMk5pQk1OalV1TVRZekxERTRMamd4T1NCRE5qVXVNVFUwTERFNExqZ3hNU0EyTlM0eE5EWXNNVGd1T0RBeElEWTFMakUwTERFNExqYzVJRU0yTkM0MU1qVXNNVGN1TmpZM0lEWXpMak0xTnl3eE5pNDVPVGNnTmpJdU1ERTJMREUyTGprNU55Qk1Oakl1TURFMkxERTJMams1TnlCYUlpQnBaRDBpUm1sc2JDMDNJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFF5TGpRek5DdzBPQzQ0TURnZ1REUXlMalF6TkN3ME9DNDRNRGdnUXpNNUxqa3lOQ3cwT0M0NE1EY2dNemN1TnpNM0xEUTNMalUxSURNMkxqVTRNaXcwTlM0ME5ETWdRek0wTGpjM01TdzBNaTR4TXprZ016WXVNVFEwTERNM0xqZ3dPU0F6T1M0Mk5ERXNNelV1TnpnNUlFdzFNUzQ1TXpJc01qZ3VOamt4SUVNMU15NHhNRE1zTWpndU1ERTFJRFUwTGpReE15d3lOeTQyTlRnZ05UVXVOekl4TERJM0xqWTFPQ0JETlRndU1qTXhMREkzTGpZMU9DQTJNQzQwTVRnc01qZ3VPVEUySURZeExqVTNNeXd6TVM0d01qTWdRell6TGpNNE5Dd3pOQzR6TWpjZ05qSXVNREV5TERNNExqWTFOeUExT0M0MU1UUXNOREF1TmpjM0lFdzBOaTR5TWpNc05EY3VOemMxSUVNME5TNHdOVE1zTkRndU5EVWdORE11TnpReUxEUTRMamd3T0NBME1pNDBNelFzTkRndU9EQTRJRXcwTWk0ME16UXNORGd1T0RBNElGb2dUVFUxTGpjeU1Td3lPQzR4TWpVZ1F6VTBMalE1TlN3eU9DNHhNalVnTlRNdU1qWTFMREk0TGpRMk1TQTFNaTR4TmpZc01qa3VNRGsySUV3ek9TNDROelVzTXpZdU1UazBJRU16Tmk0MU9UWXNNemd1TURnM0lETTFMak13TWl3ME1pNHhNellnTXpZdU9Ua3lMRFExTGpJeE9DQkRNemd1TURZekxEUTNMakUzTXlBME1DNHdPVGdzTkRndU16UWdOREl1TkRNMExEUTRMak0wSUVNME15NDJOakVzTkRndU16UWdORFF1T0Rrc05EZ3VNREExSURRMUxqazVMRFEzTGpNM0lFdzFPQzR5T0RFc05EQXVNamN5SUVNMk1TNDFOaXd6T0M0ek56a2dOakl1T0RVekxETTBMak16SURZeExqRTJOQ3d6TVM0eU5EZ2dRell3TGpBNU1pd3lPUzR5T1RNZ05UZ3VNRFU0TERJNExqRXlOU0ExTlM0M01qRXNNamd1TVRJMUlFdzFOUzQzTWpFc01qZ3VNVEkxSUZvaUlHbGtQU0pHYVd4c0xUZ2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE1TGpVNE9Dd3lMalF3TnlCRE1UUTVMalU0T0N3eUxqUXdOeUF4TlRVdU56WTRMRFV1T1RjMUlERTFOaTR6TWpVc05pNHlPVGNnVERFMU5pNHpNalVzTnk0eE9EUWdRekUxTmk0ek1qVXNOeTR6TmlBeE5UWXVNek00TERjdU5UUTBJREUxTmk0ek5qSXNOeTQzTXpNZ1F6RTFOaTR6TnpNc055NDRNVFFnTVRVMkxqTTRNaXczTGpnNU5DQXhOVFl1TXprc055NDVOelVnUXpFMU5pNDFNeXc1TGpNNUlERTFOeTR6TmpNc01UQXVPVGN6SURFMU9DNDBPVFVzTVRFdU9UYzBJRXd4TmpVdU9Ea3hMREU0TGpVeE9TQkRNVFkyTGpBMk9Dd3hPQzQyTnpVZ01UWTJMakkwT1N3eE9DNDRNVFFnTVRZMkxqUXpNaXd4T0M0NU16UWdRekUyT0M0d01URXNNVGt1T1RjMElERTJPUzR6T0RJc01Ua3VOQ0F4TmprdU5EazBMREUzTGpZMU1pQkRNVFk1TGpVME15d3hOaTQ0TmpnZ01UWTVMalUxTVN3eE5pNHdOVGNnTVRZNUxqVXhOeXd4TlM0eU1qTWdUREUyT1M0MU1UUXNNVFV1TURZeklFd3hOamt1TlRFMExERXpMamt4TWlCRE1UY3dMamM0TERFMExqWTBNaUF4T1RVdU5UQXhMREk0TGpreE5TQXhPVFV1TlRBeExESTRMamt4TlNCTU1UazFMalV3TVN3NE1pNDVNVFVnUXpFNU5TNDFNREVzT0RRdU1EQTFJREU1TkM0M016RXNPRFF1TkRRMUlERTVNeTQzT0RFc09ETXVPRGszSUV3eE5URXVNekE0TERVNUxqTTNOQ0JETVRVd0xqTTFPQ3cxT0M0NE1qWWdNVFE1TGpVNE9DdzFOeTQwT1RjZ01UUTVMalU0T0N3MU5pNDBNRGdnVERFME9TNDFPRGdzTWpJdU16YzFJaUJwWkQwaVJtbHNiQzA1SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFNU5DNDFOVE1zT0RRdU1qVWdRekU1TkM0eU9UWXNPRFF1TWpVZ01UazBMakF4TXl3NE5DNHhOalVnTVRrekxqY3lNaXc0TXk0NU9UY2dUREUxTVM0eU5TdzFPUzQwTnpZZ1F6RTFNQzR5Tmprc05UZ3VPVEE1SURFME9TNDBOekVzTlRjdU5UTXpJREUwT1M0ME56RXNOVFl1TkRBNElFd3hORGt1TkRjeExESXlMak0zTlNCTU1UUTVMamN3TlN3eU1pNHpOelVnVERFME9TNDNNRFVzTlRZdU5EQTRJRU14TkRrdU56QTFMRFUzTGpRMU9TQXhOVEF1TkRVc05UZ3VOelEwSURFMU1TNHpOallzTlRrdU1qYzBJRXd4T1RNdU9ETTVMRGd6TGpjNU5TQkRNVGswTGpJMk15dzROQzR3TkNBeE9UUXVOalUxTERnMExqQTRNeUF4T1RRdU9UUXlMRGd6TGpreE55QkRNVGsxTGpJeU55dzRNeTQzTlRNZ01UazFMak00TkN3NE15NHpPVGNnTVRrMUxqTTROQ3c0TWk0NU1UVWdUREU1TlM0ek9EUXNNamd1T1RneUlFTXhPVFF1TVRBeUxESTRMakkwTWlBeE56SXVNVEEwTERFMUxqVTBNaUF4TmprdU5qTXhMREUwTGpFeE5DQk1NVFk1TGpZek5Dd3hOUzR5TWlCRE1UWTVMalkyT0N3eE5pNHdOVElnTVRZNUxqWTJMREUyTGpnM05DQXhOamt1TmpFc01UY3VOalU1SUVNeE5qa3VOVFUyTERFNExqVXdNeUF4TmprdU1qRTBMREU1TGpFeU15QXhOamd1TmpRM0xERTVMalF3TlNCRE1UWTRMakF5T0N3eE9TNDNNVFFnTVRZM0xqRTVOeXd4T1M0MU56Z2dNVFkyTGpNMk55d3hPUzR3TXpJZ1F6RTJOaTR4T0RFc01UZ3VPVEE1SURFMk5TNDVPVFVzTVRndU56WTJJREUyTlM0NE1UUXNNVGd1TmpBMklFd3hOVGd1TkRFM0xERXlMakEyTWlCRE1UVTNMakkxT1N3eE1TNHdNellnTVRVMkxqUXhPQ3c1TGpRek55QXhOVFl1TWpjMExEY3VPVGcySUVNeE5UWXVNalkyTERjdU9UQTNJREUxTmk0eU5UY3NOeTQ0TWpjZ01UVTJMakkwTnl3M0xqYzBPQ0JETVRVMkxqSXlNU3czTGpVMU5TQXhOVFl1TWpBNUxEY3VNelkxSURFMU5pNHlNRGtzTnk0eE9EUWdUREUxTmk0eU1Ea3NOaTR6TmpRZ1F6RTFOUzR6TnpVc05TNDRPRE1nTVRRNUxqVXlPU3d5TGpVd09DQXhORGt1TlRJNUxESXVOVEE0SUV3eE5Ea3VOalEyTERJdU16QTJJRU14TkRrdU5qUTJMREl1TXpBMklERTFOUzQ0TWpjc05TNDROelFnTVRVMkxqTTROQ3cyTGpFNU5pQk1NVFUyTGpRME1pdzJMakl6SUV3eE5UWXVORFF5TERjdU1UZzBJRU14TlRZdU5EUXlMRGN1TXpVMUlERTFOaTQwTlRRc055NDFNelVnTVRVMkxqUTNPQ3czTGpjeE55QkRNVFUyTGpRNE9TdzNMamdnTVRVMkxqUTVPU3czTGpnNE1pQXhOVFl1TlRBM0xEY3VPVFl6SUVNeE5UWXVOalExTERrdU16VTRJREUxTnk0ME5UVXNNVEF1T0RrNElERTFPQzQxTnpJc01URXVPRGcySUV3eE5qVXVPVFk1TERFNExqUXpNU0JETVRZMkxqRTBNaXd4T0M0MU9EUWdNVFkyTGpNeE9Td3hPQzQzTWlBeE5qWXVORGsyTERFNExqZ3pOeUJETVRZM0xqSTFOQ3d4T1M0ek16WWdNVFk0TERFNUxqUTJOeUF4TmpndU5UUXpMREU1TGpFNU5pQkRNVFk1TGpBek15d3hPQzQ1TlRNZ01UWTVMak15T1N3eE9DNDBNREVnTVRZNUxqTTNOeXd4Tnk0Mk5EVWdRekUyT1M0ME1qY3NNVFl1T0RZM0lERTJPUzQwTXpRc01UWXVNRFUwSURFMk9TNDBNREVzTVRVdU1qSTRJRXd4TmprdU16azNMREUxTGpBMk5TQk1NVFk1TGpNNU55d3hNeTQzTVNCTU1UWTVMalUzTWl3eE15NDRNU0JETVRjd0xqZ3pPU3d4TkM0MU5ERWdNVGsxTGpVMU9Td3lPQzQ0TVRRZ01UazFMalUxT1N3eU9DNDRNVFFnVERFNU5TNDJNVGdzTWpndU9EUTNJRXd4T1RVdU5qRTRMRGd5TGpreE5TQkRNVGsxTGpZeE9DdzRNeTQwT0RRZ01UazFMalF5TERnekxqa3hNU0F4T1RVdU1EVTVMRGcwTGpFeE9TQkRNVGswTGprd09DdzROQzR5TURZZ01UazBMamN6Tnl3NE5DNHlOU0F4T1RRdU5UVXpMRGcwTGpJMUlpQnBaRDBpUm1sc2JDMHhNQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TkRVdU5qZzFMRFUyTGpFMk1TQk1NVFk1TGpnc056QXVNRGd6SUV3eE5ETXVPREl5TERnMUxqQTRNU0JNTVRReUxqTTJMRGcwTGpjM05DQkRNVE0xTGpneU5pdzRNaTQyTURRZ01USTRMamN6TWl3NE1TNHdORFlnTVRJeExqTTBNU3c0TUM0eE5UZ2dRekV4Tmk0NU56WXNOemt1TmpNMElERXhNaTQyTnpnc09ERXVNalUwSURFeE1TNDNORE1zT0RNdU56YzRJRU14TVRFdU5UQTJMRGcwTGpReE5DQXhNVEV1TlRBekxEZzFMakEzTVNBeE1URXVOek15TERnMUxqY3dOaUJETVRFekxqSTNMRGc1TGprM015QXhNVFV1T1RZNExEazBMakEyT1NBeE1Ua3VOekkzTERrM0xqZzBNU0JNTVRJd0xqSTFPU3c1T0M0Mk9EWWdRekV5TUM0eU5pdzVPQzQyT0RVZ09UUXVNamd5TERFeE15NDJPRE1nT1RRdU1qZ3lMREV4TXk0Mk9ETWdURGN3TGpFMk55dzVPUzQzTmpFZ1RERTBOUzQyT0RVc05UWXVNVFl4SWlCcFpEMGlSbWxzYkMweE1TSWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDVOQzR5T0RJc01URXpMamd4T0NCTU9UUXVNakl6TERFeE15NDNPRFVnVERZNUxqa3pNeXc1T1M0M05qRWdURGN3TGpFd09DdzVPUzQyTmlCTU1UUTFMalk0TlN3MU5pNHdNallnVERFME5TNDNORE1zTlRZdU1EVTVJRXd4TnpBdU1ETXpMRGN3TGpBNE15Qk1NVFF6TGpnME1pdzROUzR5TURVZ1RERTBNeTQzT1Rjc09EVXVNVGsxSUVNeE5ETXVOemN5TERnMUxqRTVJREUwTWk0ek16WXNPRFF1T0RnNElERTBNaTR6TXpZc09EUXVPRGc0SUVNeE16VXVOemczTERneUxqY3hOQ0F4TWpndU56SXpMRGd4TGpFMk15QXhNakV1TXpJM0xEZ3dMakkzTkNCRE1USXdMamM0T0N3NE1DNHlNRGtnTVRJd0xqSXpOaXc0TUM0eE56Y2dNVEU1TGpZNE9TdzRNQzR4TnpjZ1F6RXhOUzQ1TXpFc09EQXVNVGMzSURFeE1pNDJNelVzT0RFdU56QTRJREV4TVM0NE5USXNPRE11T0RFNUlFTXhNVEV1TmpJMExEZzBMalF6TWlBeE1URXVOakl4TERnMUxqQTFNeUF4TVRFdU9EUXlMRGcxTGpZMk55QkRNVEV6TGpNM055dzRPUzQ1TWpVZ01URTJMakExT0N3NU15NDVPVE1nTVRFNUxqZ3hMRGszTGpjMU9DQk1NVEU1TGpneU5pdzVOeTQzTnprZ1RERXlNQzR6TlRJc09UZ3VOakUwSUVNeE1qQXVNelUwTERrNExqWXhOeUF4TWpBdU16VTJMRGs0TGpZeUlERXlNQzR6TlRnc09UZ3VOakkwSUV3eE1qQXVOREl5TERrNExqY3lOaUJNTVRJd0xqTXhOeXc1T0M0M09EY2dRekV5TUM0eU5qUXNPVGd1T0RFNElEazBMalU1T1N3eE1UTXVOak0xSURrMExqTTBMREV4TXk0M09EVWdURGswTGpJNE1pd3hNVE11T0RFNElFdzVOQzR5T0RJc01URXpMamd4T0NCYUlFMDNNQzQwTURFc09Ua3VOell4SUV3NU5DNHlPRElzTVRFekxqVTBPU0JNTVRFNUxqQTROQ3c1T1M0eU1qa2dRekV4T1M0Mk15dzVPQzQ1TVRRZ01URTVMamt6TERrNExqYzBJREV5TUM0eE1ERXNPVGd1TmpVMElFd3hNVGt1TmpNMUxEazNMamt4TkNCRE1URTFMamcyTkN3NU5DNHhNamNnTVRFekxqRTJPQ3c1TUM0d016TWdNVEV4TGpZeU1pdzROUzQzTkRZZ1F6RXhNUzR6T0RJc09EVXVNRGM1SURFeE1TNHpPRFlzT0RRdU5EQTBJREV4TVM0Mk16TXNPRE11TnpNNElFTXhNVEl1TkRRNExEZ3hMalV6T1NBeE1UVXVPRE0yTERjNUxqazBNeUF4TVRrdU5qZzVMRGM1TGprME15QkRNVEl3TGpJME5pdzNPUzQ1TkRNZ01USXdMamd3Tml3M09TNDVOellnTVRJeExqTTFOU3c0TUM0d05ESWdRekV5T0M0M05qY3NPREF1T1RNeklERXpOUzQ0TkRZc09ESXVORGczSURFME1pNHpPVFlzT0RRdU5qWXpJRU14TkRNdU1qTXlMRGcwTGpnek9DQXhORE11TmpFeExEZzBMamt4TnlBeE5ETXVOemcyTERnMExqazJOeUJNTVRZNUxqVTJOaXczTUM0d09ETWdUREUwTlM0Mk9EVXNOVFl1TWprMUlFdzNNQzQwTURFc09Ua3VOell4SUV3M01DNDBNREVzT1RrdU56WXhJRm9pSUdsa1BTSkdhV3hzTFRFeUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJOeTR5TXl3eE9DNDVOemtnVERFMk55NHlNeXcyT1M0NE5TQk1NVE01TGprd09TdzROUzQyTWpNZ1RERXpNeTQwTkRnc056RXVORFUySUVNeE16SXVOVE00TERZNUxqUTJJREV6TUM0d01pdzJPUzQzTVRnZ01USTNMamd5TkN3M01pNHdNeUJETVRJMkxqYzJPU3czTXk0eE5DQXhNalV1T1RNeExEYzBMalU0TlNBeE1qVXVORGswTERjMkxqQTBPQ0JNTVRFNUxqQXpOQ3c1Tnk0Mk56WWdURGt4TGpjeE1pd3hNVE11TkRVZ1REa3hMamN4TWl3Mk1pNDFOemtnVERFMk55NHlNeXd4T0M0NU56a2lJR2xrUFNKR2FXeHNMVEV6SWlCbWFXeHNQU0lqUmtaR1JrWkdJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRreExqY3hNaXd4TVRNdU5UWTNJRU01TVM0Mk9USXNNVEV6TGpVMk55QTVNUzQyTnpJc01URXpMalUyTVNBNU1TNDJOVE1zTVRFekxqVTFNU0JET1RFdU5qRTRMREV4TXk0MU15QTVNUzQxT1RVc01URXpMalE1TWlBNU1TNDFPVFVzTVRFekxqUTFJRXc1TVM0MU9UVXNOakl1TlRjNUlFTTVNUzQxT1RVc05qSXVOVE0zSURreExqWXhPQ3cyTWk0ME9Ua2dPVEV1TmpVekxEWXlMalEzT0NCTU1UWTNMakUzTWl3eE9DNDROemdnUXpFMk55NHlNRGdzTVRndU9EVTNJREUyTnk0eU5USXNNVGd1T0RVM0lERTJOeTR5T0Rnc01UZ3VPRGM0SUVNeE5qY3VNekkwTERFNExqZzVPU0F4TmpjdU16UTNMREU0TGprek55QXhOamN1TXpRM0xERTRMamszT1NCTU1UWTNMak0wTnl3Mk9TNDROU0JETVRZM0xqTTBOeXcyT1M0NE9URWdNVFkzTGpNeU5DdzJPUzQ1TXlBeE5qY3VNamc0TERZNUxqazFJRXd4TXprdU9UWTNMRGcxTGpjeU5TQkRNVE01TGprek9TdzROUzQzTkRFZ01UTTVMamt3TlN3NE5TNDNORFVnTVRNNUxqZzNNeXc0TlM0M016VWdRekV6T1M0NE5ESXNPRFV1TnpJMUlERXpPUzQ0TVRZc09EVXVOekF5SURFek9TNDRNRElzT0RVdU5qY3lJRXd4TXpNdU16UXlMRGN4TGpVd05DQkRNVE15TGprMk55dzNNQzQyT0RJZ01UTXlMakk0TERjd0xqSXlPU0F4TXpFdU5EQTRMRGN3TGpJeU9TQkRNVE13TGpNeE9TdzNNQzR5TWprZ01USTVMakEwTkN3M01DNDVNVFVnTVRJM0xqa3dPQ3czTWk0eE1TQkRNVEkyTGpnM05DdzNNeTR5SURFeU5pNHdNelFzTnpRdU5qUTNJREV5TlM0Mk1EWXNOell1TURneUlFd3hNVGt1TVRRMkxEazNMamN3T1NCRE1URTVMakV6Tnl3NU55NDNNemdnTVRFNUxqRXhPQ3c1Tnk0M05qSWdNVEU1TGpBNU1pdzVOeTQzTnpjZ1REa3hMamMzTERFeE15NDFOVEVnUXpreExqYzFNaXd4TVRNdU5UWXhJRGt4TGpjek1pd3hNVE11TlRZM0lEa3hMamN4TWl3eE1UTXVOVFkzSUV3NU1TNDNNVElzTVRFekxqVTJOeUJhSUUwNU1TNDRNamtzTmpJdU5qUTNJRXc1TVM0NE1qa3NNVEV6TGpJME9DQk1NVEU0TGprek5TdzVOeTQxT1RnZ1RERXlOUzR6T0RJc056WXVNREUxSUVNeE1qVXVPREkzTERjMExqVXlOU0F4TWpZdU5qWTBMRGN6TGpBNE1TQXhNamN1TnpNNUxEY3hMamsxSUVNeE1qZ3VPVEU1TERjd0xqY3dPQ0F4TXpBdU1qVTJMRFk1TGprNU5pQXhNekV1TkRBNExEWTVMams1TmlCRE1UTXlMak0zTnl3Mk9TNDVPVFlnTVRNekxqRXpPU3czTUM0ME9UY2dNVE16TGpVMU5DdzNNUzQwTURjZ1RERXpPUzQ1TmpFc09EVXVORFU0SUV3eE5qY3VNVEV6TERZNUxqYzRNaUJNTVRZM0xqRXhNeXd4T1M0eE9ERWdURGt4TGpneU9TdzJNaTQyTkRjZ1REa3hMamd5T1N3Mk1pNDJORGNnV2lJZ2FXUTlJa1pwYkd3dE1UUWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFk0TGpVME15d3hPUzR5TVRNZ1RERTJPQzQxTkRNc056QXVNRGd6SUV3eE5ERXVNakl4TERnMUxqZzFOeUJNTVRNMExqYzJNU3czTVM0Mk9Ea2dRekV6TXk0NE5URXNOamt1TmprMElERXpNUzR6TXpNc05qa3VPVFV4SURFeU9TNHhNemNzTnpJdU1qWXpJRU14TWpndU1EZ3lMRGN6TGpNM05DQXhNamN1TWpRMExEYzBMamd4T1NBeE1qWXVPREEzTERjMkxqSTRNaUJNTVRJd0xqTTBOaXc1Tnk0NU1Ea2dURGt6TGpBeU5Td3hNVE11TmpneklFdzVNeTR3TWpVc05qSXVPREV6SUV3eE5qZ3VOVFF6TERFNUxqSXhNeUlnYVdROUlrWnBiR3d0TVRVaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UTXVNREkxTERFeE15NDRJRU01TXk0d01EVXNNVEV6TGpnZ09USXVPVGcwTERFeE15NDNPVFVnT1RJdU9UWTJMREV4TXk0M09EVWdRemt5TGprek1Td3hNVE11TnpZMElEa3lMamt3T0N3eE1UTXVOekkxSURreUxqa3dPQ3d4TVRNdU5qZzBJRXc1TWk0NU1EZ3NOakl1T0RFeklFTTVNaTQ1TURnc05qSXVOemN4SURreUxqa3pNU3cyTWk0M016TWdPVEl1T1RZMkxEWXlMamN4TWlCTU1UWTRMalE0TkN3eE9TNHhNVElnUXpFMk9DNDFNaXd4T1M0d09TQXhOamd1TlRZMUxERTVMakE1SURFMk9DNDJNREVzTVRrdU1URXlJRU14TmpndU5qTTNMREU1TGpFek1pQXhOamd1TmpZc01Ua3VNVGN4SURFMk9DNDJOaXd4T1M0eU1USWdUREUyT0M0Mk5pdzNNQzR3T0RNZ1F6RTJPQzQyTml3M01DNHhNalVnTVRZNExqWXpOeXczTUM0eE5qUWdNVFk0TGpZd01TdzNNQzR4T0RRZ1RERTBNUzR5T0N3NE5TNDVOVGdnUXpFME1TNHlOVEVzT0RVdU9UYzFJREUwTVM0eU1UY3NPRFV1T1RjNUlERTBNUzR4T0RZc09EVXVPVFk0SUVNeE5ERXVNVFUwTERnMUxqazFPQ0F4TkRFdU1USTVMRGcxTGprek5pQXhOREV1TVRFMUxEZzFMamt3TmlCTU1UTTBMalkxTlN3M01TNDNNemdnUXpFek5DNHlPQ3czTUM0NU1UVWdNVE16TGpVNU15dzNNQzQwTmpNZ01UTXlMamN5TERjd0xqUTJNeUJETVRNeExqWXpNaXczTUM0ME5qTWdNVE13TGpNMU55dzNNUzR4TkRnZ01USTVMakl5TVN3M01pNHpORFFnUXpFeU9DNHhPRFlzTnpNdU5ETXpJREV5Tnk0ek5EY3NOelF1T0RneElERXlOaTQ1TVRrc056WXVNekUxSUV3eE1qQXVORFU0TERrM0xqazBNeUJETVRJd0xqUTFMRGszTGprM01pQXhNakF1TkRNeExEazNMams1TmlBeE1qQXVOREExTERrNExqQXhJRXc1TXk0d09ETXNNVEV6TGpjNE5TQkRPVE11TURZMUxERXhNeTQzT1RVZ09UTXVNRFExTERFeE15NDRJRGt6TGpBeU5Td3hNVE11T0NCTU9UTXVNREkxTERFeE15NDRJRm9nVFRrekxqRTBNaXcyTWk0NE9ERWdURGt6TGpFME1pd3hNVE11TkRneElFd3hNakF1TWpRNExEazNMamd6TWlCTU1USTJMalk1TlN3M05pNHlORGdnUXpFeU55NHhOQ3czTkM0M05UZ2dNVEkzTGprM055dzNNeTR6TVRVZ01USTVMakExTWl3M01pNHhPRE1nUXpFek1DNHlNekVzTnpBdU9UUXlJREV6TVM0MU5qZ3NOekF1TWpJNUlERXpNaTQzTWl3M01DNHlNamtnUXpFek15NDJPRGtzTnpBdU1qSTVJREV6TkM0ME5USXNOekF1TnpNeElERXpOQzQ0Tmpjc056RXVOalF4SUV3eE5ERXVNamMwTERnMUxqWTVNaUJNTVRZNExqUXlOaXczTUM0d01UWWdUREUyT0M0ME1qWXNNVGt1TkRFMUlFdzVNeTR4TkRJc05qSXVPRGd4SUV3NU15NHhORElzTmpJdU9EZ3hJRm9pSUdsa1BTSkdhV3hzTFRFMklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJPUzQ0TERjd0xqQTRNeUJNTVRReUxqUTNPQ3c0TlM0NE5UY2dUREV6Tmk0d01UZ3NOekV1TmpnNUlFTXhNelV1TVRBNExEWTVMalk1TkNBeE16SXVOVGtzTmprdU9UVXhJREV6TUM0ek9UTXNOekl1TWpZeklFTXhNamt1TXpNNUxEY3pMak0zTkNBeE1qZ3VOU3czTkM0NE1Ua2dNVEk0TGpBMk5DdzNOaTR5T0RJZ1RERXlNUzQyTURNc09UY3VPVEE1SUV3NU5DNHlPRElzTVRFekxqWTRNeUJNT1RRdU1qZ3lMRFl5TGpneE15Qk1NVFk1TGpnc01Ua3VNakV6SUV3eE5qa3VPQ3czTUM0d09ETWdXaUlnYVdROUlrWnBiR3d0TVRjaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UUXVNamd5TERFeE15NDVNVGNnUXprMExqSTBNU3d4TVRNdU9URTNJRGswTGpJd01Td3hNVE11T1RBM0lEazBMakUyTlN3eE1UTXVPRGcySUVNNU5DNHdPVE1zTVRFekxqZzBOU0E1TkM0d05EZ3NNVEV6TGpjMk55QTVOQzR3TkRnc01URXpMalk0TkNCTU9UUXVNRFE0TERZeUxqZ3hNeUJET1RRdU1EUTRMRFl5TGpjeklEazBMakE1TXl3Mk1pNDJOVElnT1RRdU1UWTFMRFl5TGpZeE1TQk1NVFk1TGpZNE15d3hPUzR3TVNCRE1UWTVMamMxTlN3eE9DNDVOamtnTVRZNUxqZzBOQ3d4T0M0NU5qa2dNVFk1TGpreE55d3hPUzR3TVNCRE1UWTVMams0T1N3eE9TNHdOVElnTVRjd0xqQXpNeXd4T1M0eE1qa2dNVGN3TGpBek15d3hPUzR5TVRJZ1RERTNNQzR3TXpNc056QXVNRGd6SUVNeE56QXVNRE16TERjd0xqRTJOaUF4TmprdU9UZzVMRGN3TGpJME5DQXhOamt1T1RFM0xEY3dMakk0TlNCTU1UUXlMalU1TlN3NE5pNHdOaUJETVRReUxqVXpPQ3c0Tmk0d09USWdNVFF5TGpRMk9TdzROaTR4SURFME1pNDBNRGNzT0RZdU1EZ2dRekUwTWk0ek5EUXNPRFl1TURZZ01UUXlMakk1TXl3NE5pNHdNVFFnTVRReUxqSTJOaXc0TlM0NU5UUWdUREV6TlM0NE1EVXNOekV1TnpnMklFTXhNelV1TkRRMUxEY3dMams1TnlBeE16UXVPREV6TERjd0xqVTRJREV6TXk0NU56Y3NOekF1TlRnZ1F6RXpNaTQ1TWpFc056QXVOVGdnTVRNeExqWTNOaXczTVM0eU5USWdNVE13TGpVMk1pdzNNaTQwTWpRZ1F6RXlPUzQxTkN3M015NDFNREVnTVRJNExqY3hNU3czTkM0NU16RWdNVEk0TGpJNE55dzNOaTR6TkRnZ1RERXlNUzQ0TWpjc09UY3VPVGMySUVNeE1qRXVPREVzT1RndU1ETTBJREV5TVM0M056RXNPVGd1TURneUlERXlNUzQzTWl3NU9DNHhNVElnVERrMExqTTVPQ3d4TVRNdU9EZzJJRU01TkM0ek5qSXNNVEV6TGprd055QTVOQzR6TWpJc01URXpMamt4TnlBNU5DNHlPRElzTVRFekxqa3hOeUJNT1RRdU1qZ3lMREV4TXk0NU1UY2dXaUJOT1RRdU5URTFMRFl5TGprME9DQk1PVFF1TlRFMUxERXhNeTR5TnprZ1RERXlNUzQwTURZc09UY3VOelUwSUV3eE1qY3VPRFFzTnpZdU1qRTFJRU14TWpndU1qa3NOelF1TnpBNElERXlPUzR4TXpjc056TXVNalEzSURFek1DNHlNalFzTnpJdU1UQXpJRU14TXpFdU5ESTFMRGN3TGpnek9DQXhNekl1TnprekxEY3dMakV4TWlBeE16TXVPVGMzTERjd0xqRXhNaUJETVRNMExqazVOU3czTUM0eE1USWdNVE0xTGpjNU5TdzNNQzQyTXpnZ01UTTJMakl6TERjeExqVTVNaUJNTVRReUxqVTROQ3c0TlM0MU1qWWdUREUyT1M0MU5qWXNOamt1T1RRNElFd3hOamt1TlRZMkxERTVMall4TnlCTU9UUXVOVEUxTERZeUxqazBPQ0JNT1RRdU5URTFMRFl5TGprME9DQmFJaUJwWkQwaVJtbHNiQzB4T0NJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1Ea3VPRGswTERreUxqazBNeUJNTVRBNUxqZzVOQ3c1TWk0NU5ETWdRekV3T0M0eE1pdzVNaTQ1TkRNZ01UQTJMalkxTXl3NU1pNHlNVGdnTVRBMUxqWTFMRGt3TGpneU15QkRNVEExTGpVNE15dzVNQzQzTXpFZ01UQTFMalU1TXl3NU1DNDJNU0F4TURVdU5qY3pMRGt3TGpVeU9TQkRNVEExTGpjMU15dzVNQzQwTkRnZ01UQTFMamc0TERrd0xqUTBJREV3TlM0NU56UXNPVEF1TlRBMklFTXhNRFl1TnpVMExEa3hMakExTXlBeE1EY3VOamM1TERreExqTXpNeUF4TURndU56STBMRGt4TGpNek15QkRNVEV3TGpBME55dzVNUzR6TXpNZ01URXhMalEzT0N3NU1DNDRPVFFnTVRFeUxqazRMRGt3TGpBeU55QkRNVEU0TGpJNU1TdzROaTQ1TmlBeE1qSXVOakV4TERjNUxqVXdPU0F4TWpJdU5qRXhMRGN6TGpReE5pQkRNVEl5TGpZeE1TdzNNUzQwT0RrZ01USXlMakUyT1N3Mk9TNDROVFlnTVRJeExqTXpNeXcyT0M0Mk9USWdRekV5TVM0eU5qWXNOamd1TmlBeE1qRXVNamMyTERZNExqUTNNeUF4TWpFdU16VTJMRFk0TGpNNU1pQkRNVEl4TGpRek5pdzJPQzR6TVRFZ01USXhMalUyTXl3Mk9DNHlPVGtnTVRJeExqWTFOaXcyT0M0ek5qVWdRekV5TXk0ek1qY3NOamt1TlRNM0lERXlOQzR5TkRjc056RXVOelEySURFeU5DNHlORGNzTnpRdU5UZzBJRU14TWpRdU1qUTNMRGd3TGpneU5pQXhNVGt1T0RJeExEZzRMalEwTnlBeE1UUXVNemd5TERreExqVTROeUJETVRFeUxqZ3dPQ3c1TWk0ME9UVWdNVEV4TGpJNU9DdzVNaTQ1TkRNZ01UQTVMamc1TkN3NU1pNDVORE1nVERFd09TNDRPVFFzT1RJdU9UUXpJRm9nVFRFd05pNDVNalVzT1RFdU5EQXhJRU14TURjdU56TTRMRGt5TGpBMU1pQXhNRGd1TnpRMUxEa3lMakkzT0NBeE1Ea3VPRGt6TERreUxqSTNPQ0JNTVRBNUxqZzVOQ3c1TWk0eU56Z2dRekV4TVM0eU1UVXNPVEl1TWpjNElERXhNaTQyTkRjc09URXVPVFV4SURFeE5DNHhORGdzT1RFdU1EZzBJRU14TVRrdU5EVTVMRGc0TGpBeE55QXhNak11Tnpnc09EQXVOakl4SURFeU15NDNPQ3czTkM0MU1qZ2dRekV5TXk0M09DdzNNaTQxTkRrZ01USXpMak14Tnl3M01DNDVNamtnTVRJeUxqUTFOQ3cyT1M0M05qY2dRekV5TWk0NE5qVXNOekF1T0RBeUlERXlNeTR3Tnprc056SXVNRFF5SURFeU15NHdOemtzTnpNdU5EQXlJRU14TWpNdU1EYzVMRGM1TGpZME5TQXhNVGd1TmpVekxEZzNMakk0TlNBeE1UTXVNakUwTERrd0xqUXlOU0JETVRFeExqWTBMRGt4TGpNek5DQXhNVEF1TVRNc09URXVOelF5SURFd09DNDNNalFzT1RFdU56UXlJRU14TURndU1EZ3pMRGt4TGpjME1pQXhNRGN1TkRneExEa3hMalU1TXlBeE1EWXVPVEkxTERreExqUXdNU0JNTVRBMkxqa3lOU3c1TVM0ME1ERWdXaUlnYVdROUlrWnBiR3d0TVRraUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMakE1Tnl3NU1DNHlNeUJETVRFNExqUTRNU3c0Tnk0eE1qSWdNVEl5TGpnME5TdzNPUzQxT1RRZ01USXlMamcwTlN3M015NDBNVFlnUXpFeU1pNDRORFVzTnpFdU16WTFJREV5TWk0ek5qSXNOamt1TnpJMElERXlNUzQxTWpJc05qZ3VOVFUySUVNeE1Ua3VOek00TERZM0xqTXdOQ0F4TVRjdU1UUTRMRFkzTGpNMk1pQXhNVFF1TWpZMUxEWTVMakF5TmlCRE1UQTRMamc0TVN3M01pNHhNelFnTVRBMExqVXhOeXczT1M0Mk5qSWdNVEEwTGpVeE55dzROUzQ0TkNCRE1UQTBMalV4Tnl3NE55NDRPVEVnTVRBMUxEZzVMalV6TWlBeE1EVXVPRFFzT1RBdU55QkRNVEEzTGpZeU5DdzVNUzQ1TlRJZ01URXdMakl4TkN3NU1TNDRPVFFnTVRFekxqQTVOeXc1TUM0eU15SWdhV1E5SWtacGJHd3RNakFpSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRBNExqY3lOQ3c1TVM0Mk1UUWdUREV3T0M0M01qUXNPVEV1TmpFMElFTXhNRGN1TlRneUxEa3hMall4TkNBeE1EWXVOVFkyTERreExqUXdNU0F4TURVdU56QTFMRGt3TGpjNU55QkRNVEExTGpZNE5DdzVNQzQzT0RNZ01UQTFMalkyTlN3NU1DNDRNVEVnTVRBMUxqWTFMRGt3TGpjNUlFTXhNRFF1TnpVMkxEZzVMalUwTmlBeE1EUXVNamd6TERnM0xqZzBNaUF4TURRdU1qZ3pMRGcxTGpneE55QkRNVEEwTGpJNE15dzNPUzQxTnpVZ01UQTRMamN3T1N3M01TNDVOVE1nTVRFMExqRTBPQ3cyT0M0NE1USWdRekV4TlM0M01qSXNOamN1T1RBMElERXhOeTR5TXpJc05qY3VORFE1SURFeE9DNDJNemdzTmpjdU5EUTVJRU14TVRrdU56Z3NOamN1TkRRNUlERXlNQzQzT1RZc05qY3VOelU0SURFeU1TNDJOVFlzTmpndU16WXlJRU14TWpFdU5qYzRMRFk0TGpNM055QXhNakV1TmprM0xEWTRMak01TnlBeE1qRXVOekV5TERZNExqUXhPQ0JETVRJeUxqWXdOaXcyT1M0Mk5qSWdNVEl6TGpBM09TdzNNUzR6T1NBeE1qTXVNRGM1TERjekxqUXhOU0JETVRJekxqQTNPU3czT1M0Mk5UZ2dNVEU0TGpZMU15dzROeTR4T1RnZ01URXpMakl4TkN3NU1DNHpNemdnUXpFeE1TNDJOQ3c1TVM0eU5EY2dNVEV3TGpFekxEa3hMall4TkNBeE1EZ3VOekkwTERreExqWXhOQ0JNTVRBNExqY3lOQ3c1TVM0Mk1UUWdXaUJOTVRBMkxqQXdOaXc1TUM0MU1EVWdRekV3Tmk0M09DdzVNUzR3TXpjZ01UQTNMalk1TkN3NU1TNHlPREVnTVRBNExqY3lOQ3c1TVM0eU9ERWdRekV4TUM0d05EY3NPVEV1TWpneElERXhNUzQwTnpnc09UQXVPRFk0SURFeE1pNDVPQ3c1TUM0d01ERWdRekV4T0M0eU9URXNPRFl1T1RNMUlERXlNaTQyTVRFc056a3VORGsySURFeU1pNDJNVEVzTnpNdU5EQXpJRU14TWpJdU5qRXhMRGN4TGpRNU5DQXhNakl1TVRjM0xEWTVMamc0SURFeU1TNHpOVFlzTmpndU56RTRJRU14TWpBdU5UZ3lMRFk0TGpFNE5TQXhNVGt1TmpZNExEWTNMamt4T1NBeE1UZ3VOak00TERZM0xqa3hPU0JETVRFM0xqTXhOU3cyTnk0NU1Ua2dNVEUxTGpnNE15dzJPQzR6TmlBeE1UUXVNemd5TERZNUxqSXlOeUJETVRBNUxqQTNNU3czTWk0eU9UTWdNVEEwTGpjMU1TdzNPUzQzTXpNZ01UQTBMamMxTVN3NE5TNDRNallnUXpFd05DNDNOVEVzT0RjdU56TTFJREV3TlM0eE9EVXNPRGt1TXpReklERXdOaTR3TURZc09UQXVOVEExSUV3eE1EWXVNREEyTERrd0xqVXdOU0JhSWlCcFpEMGlSbWxzYkMweU1TSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhORGt1TXpFNExEY3VNall5SUV3eE16a3VNek0wTERFMkxqRTBJRXd4TlRVdU1qSTNMREkzTGpFM01TQk1NVFl3TGpneE5pd3lNUzR3TlRrZ1RERTBPUzR6TVRnc055NHlOaklpSUdsa1BTSkdhV3hzTFRJeUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTJPUzQyTnpZc01UTXVPRFFnVERFMU9TNDVNamdzTVRrdU5EWTNJRU14TlRZdU1qZzJMREl4TGpVM0lERTFNQzQwTERJeExqVTRJREUwTmk0M09ERXNNVGt1TkRreElFTXhORE11TVRZeExERTNMalF3TWlBeE5ETXVNVGdzTVRRdU1EQXpJREUwTmk0NE1qSXNNVEV1T1NCTU1UVTJMak14Tnl3MkxqSTVNaUJNTVRRNUxqVTRPQ3d5TGpRd055Qk1OamN1TnpVeUxEUTVMalEzT0NCTU1URXpMalkzTlN3M05TNDVPVElnVERFeE5pNDNOVFlzTnpRdU1qRXpJRU14TVRjdU16ZzNMRGN6TGpnME9DQXhNVGN1TmpJMUxEY3pMak14TlNBeE1UY3VNemMwTERjeUxqZ3lNeUJETVRFMUxqQXhOeXcyT0M0eE9URWdNVEUwTGpjNE1TdzJNeTR5TnpjZ01URTJMalk1TVN3MU9DNDFOakVnUXpFeU1pNHpNamtzTkRRdU5qUXhJREUwTVM0eUxETXpMamMwTmlBeE5qVXVNekE1TERNd0xqUTVNU0JETVRjekxqUTNPQ3d5T1M0ek9EZ2dNVGd4TGprNE9Td3lPUzQxTWpRZ01Ua3dMakF4TXl3ek1DNDRPRFVnUXpFNU1DNDROalVzTXpFdU1ETWdNVGt4TGpjNE9Td3pNQzQ0T1RNZ01Ua3lMalF5TERNd0xqVXlPQ0JNTVRrMUxqVXdNU3d5T0M0M05TQk1NVFk1TGpZM05pd3hNeTQ0TkNJZ2FXUTlJa1pwYkd3dE1qTWlJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpZM05TdzNOaTQwTlRrZ1F6RXhNeTQxT1RRc056WXVORFU1SURFeE15NDFNVFFzTnpZdU5ETTRJREV4TXk0ME5ESXNOell1TXprM0lFdzJOeTQxTVRnc05Ea3VPRGd5SUVNMk55NHpOelFzTkRrdU56azVJRFkzTGpJNE5DdzBPUzQyTkRVZ05qY3VNamcxTERRNUxqUTNPQ0JETmpjdU1qZzFMRFE1TGpNeE1TQTJOeTR6TnpRc05Ea3VNVFUzSURZM0xqVXhPU3cwT1M0d056TWdUREUwT1M0ek5UVXNNaTR3TURJZ1F6RTBPUzQwT1Rrc01TNDVNVGtnTVRRNUxqWTNOeXd4TGpreE9TQXhORGt1T0RJeExESXVNREF5SUV3eE5UWXVOVFVzTlM0NE9EY2dRekUxTmk0M056UXNOaTR3TVRjZ01UVTJMamcxTERZdU16QXlJREUxTmk0M01qSXNOaTQxTWpZZ1F6RTFOaTQxT1RJc05pNDNORGtnTVRVMkxqTXdOeXcyTGpneU5pQXhOVFl1TURnekxEWXVOamsySUV3eE5Ea3VOVGczTERJdU9UUTJJRXcyT0M0Mk9EY3NORGt1TkRjNUlFd3hNVE11TmpjMUxEYzFMalExTWlCTU1URTJMalV5TXl3M015NDRNRGdnUXpFeE5pNDNNVFVzTnpNdU5qazNJREV4Tnk0eE5ETXNOek11TXprNUlERXhOaTQ1TlRnc056TXVNRE0xSUVNeE1UUXVOVFF5TERZNExqSTROeUF4TVRRdU15dzJNeTR5TWpFZ01URTJMakkxT0N3MU9DNHpPRFVnUXpFeE9TNHdOalFzTlRFdU5EVTRJREV5TlM0eE5ETXNORFV1TVRReklERXpNeTQ0TkN3ME1DNHhNaklnUXpFME1pNDBPVGNzTXpVdU1USTBJREUxTXk0ek5UZ3NNekV1TmpNeklERTJOUzR5TkRjc016QXVNREk0SUVNeE56TXVORFExTERJNExqa3lNU0F4T0RJdU1ETTNMREk1TGpBMU9DQXhPVEF1TURreExETXdMalF5TlNCRE1Ua3dMamd6TERNd0xqVTFJREU1TVM0Mk5USXNNekF1TkRNeUlERTVNaTR4T0RZc016QXVNVEkwSUV3eE9UUXVOVFkzTERJNExqYzFJRXd4TmprdU5EUXlMREUwTGpJME5DQkRNVFk1TGpJeE9Td3hOQzR4TVRVZ01UWTVMakUwTWl3eE15NDRNamtnTVRZNUxqSTNNU3d4TXk0Mk1EWWdRekUyT1M0MExERXpMak00TWlBeE5qa3VOamcxTERFekxqTXdOaUF4TmprdU9UQTVMREV6TGpRek5TQk1NVGsxTGpjek5Dd3lPQzR6TkRVZ1F6RTVOUzQ0Tnprc01qZ3VOREk0SURFNU5TNDVOamdzTWpndU5UZ3pJREU1TlM0NU5qZ3NNamd1TnpVZ1F6RTVOUzQ1Tmpnc01qZ3VPVEUySURFNU5TNDROemtzTWprdU1EY3hJREU1TlM0M016UXNNamt1TVRVMElFd3hPVEl1TmpVekxETXdMamt6TXlCRE1Ua3hMamt6TWl3ek1TNHpOU0F4T1RBdU9Ea3NNekV1TlRBNElERTRPUzQ1TXpVc016RXVNelEySUVNeE9ERXVPVGN5TERJNUxqazVOU0F4TnpNdU5EYzRMREk1TGpnMklERTJOUzR6TnpJc016QXVPVFUwSUVNeE5UTXVOakF5TERNeUxqVTBNeUF4TkRJdU9EWXNNelV1T1RreklERXpOQzR6TURjc05EQXVPVE14SUVNeE1qVXVOemt6TERRMUxqZzBOeUF4TVRrdU9EVXhMRFV5TGpBd05DQXhNVGN1TVRJMExEVTRMamN6TmlCRE1URTFMakkzTERZekxqTXhOQ0F4TVRVdU5UQXhMRFk0TGpFeE1pQXhNVGN1Tnprc056SXVOakV4SUVNeE1UZ3VNVFlzTnpNdU16TTJJREV4Tnk0NE5EVXNOelF1TVRJMElERXhOaTQ1T1N3M05DNDJNVGNnVERFeE15NDVNRGtzTnpZdU16azNJRU14TVRNdU9ETTJMRGMyTGpRek9DQXhNVE11TnpVMkxEYzJMalExT1NBeE1UTXVOamMxTERjMkxqUTFPU0lnYVdROUlrWnBiR3d0TWpRaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UVXpMak14Tml3eU1TNHlOemtnUXpFMU1DNDVNRE1zTWpFdU1qYzVJREUwT0M0ME9UVXNNakF1TnpVeElERTBOaTQyTmpRc01Ua3VOamt6SUVNeE5EUXVPRFEyTERFNExqWTBOQ0F4TkRNdU9EUTBMREUzTGpJek1pQXhORE11T0RRMExERTFMamN4T0NCRE1UUXpMamcwTkN3eE5DNHhPVEVnTVRRMExqZzJMREV5TGpjMk15QXhORFl1TnpBMUxERXhMalk1T0NCTU1UVTJMakU1T0N3MkxqQTVNU0JETVRVMkxqTXdPU3cyTGpBeU5TQXhOVFl1TkRVeUxEWXVNRFl5SURFMU5pNDFNVGdzTmk0eE56TWdRekUxTmk0MU9ETXNOaTR5T0RRZ01UVTJMalUwTnl3MkxqUXlOeUF4TlRZdU5ETTJMRFl1TkRreklFd3hORFl1T1RRc01USXVNVEF5SUVNeE5EVXVNalEwTERFekxqQTRNU0F4TkRRdU16RXlMREUwTGpNMk5TQXhORFF1TXpFeUxERTFMamN4T0NCRE1UUTBMak14TWl3eE55NHdOVGdnTVRRMUxqSXpMREU0TGpNeU5pQXhORFl1T0RrM0xERTVMakk0T1NCRE1UVXdMalEwTml3eU1TNHpNemdnTVRVMkxqSTBMREl4TGpNeU55QXhOVGt1T0RFeExERTVMakkyTlNCTU1UWTVMalUxT1N3eE15NDJNemNnUXpFMk9TNDJOeXd4TXk0MU56TWdNVFk1TGpneE15d3hNeTQyTVRFZ01UWTVMamczT0N3eE15NDNNak1nUXpFMk9TNDVORE1zTVRNdU9ETTBJREUyT1M0NU1EUXNNVE11T1RjM0lERTJPUzQzT1RNc01UUXVNRFF5SUV3eE5qQXVNRFExTERFNUxqWTNJRU14TlRndU1UZzNMREl3TGpjME1pQXhOVFV1TnpRNUxESXhMakkzT1NBeE5UTXVNekUyTERJeExqSTNPU0lnYVdROUlrWnBiR3d0TWpVaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMalkzTlN3M05TNDVPVElnVERZM0xqYzJNaXcwT1M0ME9EUWlJR2xrUFNKR2FXeHNMVEkySWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFeE15NDJOelVzTnpZdU16UXlJRU14TVRNdU5qRTFMRGMyTGpNME1pQXhNVE11TlRVMUxEYzJMak15TnlBeE1UTXVOU3czTmk0eU9UVWdURFkzTGpVNE55dzBPUzQzT0RjZ1F6WTNMalF4T1N3ME9TNDJPU0EyTnk0ek5qSXNORGt1TkRjMklEWTNMalExT1N3ME9TNHpNRGtnUXpZM0xqVTFOaXcwT1M0eE5ERWdOamN1Tnpjc05Ea3VNRGd6SURZM0xqa3pOeXcwT1M0eE9DQk1NVEV6TGpnMUxEYzFMalk0T0NCRE1URTBMakF4T0N3M05TNDNPRFVnTVRFMExqQTNOU3czTmlBeE1UTXVPVGM0TERjMkxqRTJOeUJETVRFekxqa3hOQ3czTmk0eU56a2dNVEV6TGpjNU5pdzNOaTR6TkRJZ01URXpMalkzTlN3M05pNHpORElpSUdsa1BTSkdhV3hzTFRJM0lpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWTNMamMyTWl3ME9TNDBPRFFnVERZM0xqYzJNaXd4TURNdU5EZzFJRU0yTnk0M05qSXNNVEEwTGpVM05TQTJPQzQxTXpJc01UQTFMamt3TXlBMk9TNDBPRElzTVRBMkxqUTFNaUJNTVRFeExqazFOU3d4TXpBdU9UY3pJRU14TVRJdU9UQTFMREV6TVM0MU1qSWdNVEV6TGpZM05Td3hNekV1TURneklERXhNeTQyTnpVc01USTVMams1TXlCTU1URXpMalkzTlN3M05TNDVPVElpSUdsa1BTSkdhV3hzTFRJNElpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXhNaTQzTWpjc01UTXhMalUyTVNCRE1URXlMalF6TERFek1TNDFOakVnTVRFeUxqRXdOeXd4TXpFdU5EWTJJREV4TVM0M09Dd3hNekV1TWpjMklFdzJPUzR6TURjc01UQTJMamMxTlNCRE5qZ3VNalEwTERFd05pNHhORElnTmpjdU5ERXlMREV3TkM0M01EVWdOamN1TkRFeUxERXdNeTQwT0RVZ1REWTNMalF4TWl3ME9TNDBPRFFnUXpZM0xqUXhNaXcwT1M0eU9TQTJOeTQxTmprc05Ea3VNVE0wSURZM0xqYzJNaXcwT1M0eE16UWdRelkzTGprMU5pdzBPUzR4TXpRZ05qZ3VNVEV6TERRNUxqSTVJRFk0TGpFeE15dzBPUzQwT0RRZ1REWTRMakV4TXl3eE1ETXVORGcxSUVNMk9DNHhNVE1zTVRBMExqUTBOU0EyT0M0NE1pd3hNRFV1TmpZMUlEWTVMalkxTnl3eE1EWXVNVFE0SUV3eE1USXVNVE1zTVRNd0xqWTNJRU14TVRJdU5EYzBMREV6TUM0NE5qZ2dNVEV5TGpjNU1Td3hNekF1T1RFeklERXhNeXd4TXpBdU56a3lJRU14TVRNdU1qQTJMREV6TUM0Mk56TWdNVEV6TGpNeU5Td3hNekF1TXpneElERXhNeTR6TWpVc01USTVMams1TXlCTU1URXpMak15TlN3M05TNDVPVElnUXpFeE15NHpNalVzTnpVdU56azRJREV4TXk0ME9ESXNOelV1TmpReElERXhNeTQyTnpVc056VXVOalF4SUVNeE1UTXVPRFk1TERjMUxqWTBNU0F4TVRRdU1ESTFMRGMxTGpjNU9DQXhNVFF1TURJMUxEYzFMams1TWlCTU1URTBMakF5TlN3eE1qa3VPVGt6SUVNeE1UUXVNREkxTERFek1DNDJORGdnTVRFekxqYzROaXd4TXpFdU1UUTNJREV4TXk0ek5Td3hNekV1TXprNUlFTXhNVE11TVRZeUxERXpNUzQxTURjZ01URXlMamsxTWl3eE16RXVOVFl4SURFeE1pNDNNamNzTVRNeExqVTJNU0lnYVdROUlrWnBiR3d0TWpraUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXlMamcyTERRd0xqVXhNaUJETVRFeUxqZzJMRFF3TGpVeE1pQXhNVEl1T0RZc05EQXVOVEV5SURFeE1pNDROVGtzTkRBdU5URXlJRU14TVRBdU5UUXhMRFF3TGpVeE1pQXhNRGd1TXpZc016a3VPVGtnTVRBMkxqY3hOeXd6T1M0d05ERWdRekV3TlM0d01USXNNemd1TURVM0lERXdOQzR3TnpRc016WXVOekkySURFd05DNHdOelFzTXpVdU1qa3lJRU14TURRdU1EYzBMRE16TGpnME55QXhNRFV1TURJMkxETXlMalV3TVNBeE1EWXVOelUwTERNeExqVXdOQ0JNTVRFNExqYzVOU3d5TkM0MU5URWdRekV5TUM0ME5qTXNNak11TlRnNUlERXlNaTQyTmprc01qTXVNRFU0SURFeU5TNHdNRGNzTWpNdU1EVTRJRU14TWpjdU16STFMREl6TGpBMU9DQXhNamt1TlRBMkxESXpMalU0TVNBeE16RXVNVFVzTWpRdU5UTWdRekV6TWk0NE5UUXNNalV1TlRFMElERXpNeTQzT1RNc01qWXVPRFExSURFek15NDNPVE1zTWpndU1qYzRJRU14TXpNdU56a3pMREk1TGpjeU5DQXhNekl1T0RReExETXhMakEyT1NBeE16RXVNVEV6TERNeUxqQTJOeUJNTVRFNUxqQTNNU3d6T1M0d01Ua2dRekV4Tnk0ME1ETXNNemt1T1RneUlERXhOUzR4T1Rjc05EQXVOVEV5SURFeE1pNDROaXcwTUM0MU1USWdUREV4TWk0NE5pdzBNQzQxTVRJZ1dpQk5NVEkxTGpBd055d3lNeTQzTlRrZ1F6RXlNaTQzT1N3eU15NDNOVGtnTVRJd0xqY3dPU3d5TkM0eU5UWWdNVEU1TGpFME5pd3lOUzR4TlRnZ1RERXdOeTR4TURRc016SXVNVEVnUXpFd05TNDJNRElzTXpJdU9UYzRJREV3TkM0M056UXNNelF1TVRBNElERXdOQzQzTnpRc016VXVNamt5SUVNeE1EUXVOemMwTERNMkxqUTJOU0F4TURVdU5UZzVMRE0zTGpVNE1TQXhNRGN1TURZM0xETTRMalF6TkNCRE1UQTRMall3TlN3ek9TNHpNak1nTVRFd0xqWTJNeXd6T1M0NE1USWdNVEV5TGpnMU9Td3pPUzQ0TVRJZ1RERXhNaTQ0Tml3ek9TNDRNVElnUXpFeE5TNHdOellzTXprdU9ERXlJREV4Tnk0eE5UZ3NNemt1TXpFMUlERXhPQzQzTWpFc016Z3VOREV6SUV3eE16QXVOell5TERNeExqUTJJRU14TXpJdU1qWTBMRE13TGpVNU15QXhNek11TURreUxESTVMalEyTXlBeE16TXVNRGt5TERJNExqSTNPQ0JETVRNekxqQTVNaXd5Tnk0eE1EWWdNVE15TGpJM09Dd3lOUzQ1T1NBeE16QXVPQ3d5TlM0eE16WWdRekV5T1M0eU5qRXNNalF1TWpRNElERXlOeTR5TURRc01qTXVOelU1SURFeU5TNHdNRGNzTWpNdU56VTVJRXd4TWpVdU1EQTNMREl6TGpjMU9TQmFJaUJwWkQwaVJtbHNiQzB6TUNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5qVXVOak1zTVRZdU1qRTVJRXd4TlRrdU9EazJMREU1TGpVeklFTXhOVFl1TnpJNUxESXhMak0xT0NBeE5URXVOakVzTWpFdU16WTNJREUwT0M0ME5qTXNNVGt1TlRVZ1F6RTBOUzR6TVRZc01UY3VOek16SURFME5TNHpNeklzTVRRdU56YzRJREUwT0M0ME9Ua3NNVEl1T1RRNUlFd3hOVFF1TWpNekxEa3VOak01SUV3eE5qVXVOak1zTVRZdU1qRTVJaUJwWkQwaVJtbHNiQzB6TVNJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5UUXVNak16TERFd0xqUTBPQ0JNTVRZMExqSXlPQ3d4Tmk0eU1Ua2dUREUxT1M0MU5EWXNNVGd1T1RJeklFTXhOVGd1TVRFeUxERTVMamMxSURFMU5pNHhPVFFzTWpBdU1qQTJJREUxTkM0eE5EY3NNakF1TWpBMklFTXhOVEl1TVRFNExESXdMakl3TmlBeE5UQXVNakkwTERFNUxqYzFOeUF4TkRndU9ERTBMREU0TGprME15QkRNVFEzTGpVeU5Dd3hPQzR4T1RrZ01UUTJMamd4TkN3eE55NHlORGtnTVRRMkxqZ3hOQ3d4Tmk0eU5qa2dRekUwTmk0NE1UUXNNVFV1TWpjNElERTBOeTQxTXpjc01UUXVNekUwSURFME9DNDROU3d4TXk0MU5UWWdUREUxTkM0eU16TXNNVEF1TkRRNElFMHhOVFF1TWpNekxEa3VOak01SUV3eE5EZ3VORGs1TERFeUxqazBPU0JETVRRMUxqTXpNaXd4TkM0M056Z2dNVFExTGpNeE5pd3hOeTQzTXpNZ01UUTRMalEyTXl3eE9TNDFOU0JETVRVd0xqQXpNU3d5TUM0ME5UVWdNVFV5TGpBNE5pd3lNQzQ1TURjZ01UVTBMakUwTnl3eU1DNDVNRGNnUXpFMU5pNHlNalFzTWpBdU9UQTNJREUxT0M0ek1EWXNNakF1TkRRM0lERTFPUzQ0T1RZc01Ua3VOVE1nVERFMk5TNDJNeXd4Tmk0eU1Ua2dUREUxTkM0eU16TXNPUzQyTXpraUlHbGtQU0pHYVd4c0xUTXlJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwTlM0ME5EVXNOekl1TmpZM0lFd3hORFV1TkRRMUxEY3lMalkyTnlCRE1UUXpMalkzTWl3M01pNDJOamNnTVRReUxqSXdOQ3czTVM0NE1UY2dNVFF4TGpJd01pdzNNQzQwTWpJZ1F6RTBNUzR4TXpVc056QXVNek1nTVRReExqRTBOU3czTUM0eE5EY2dNVFF4TGpJeU5TdzNNQzR3TmpZZ1F6RTBNUzR6TURVc05qa3VPVGcxSURFME1TNDBNeklzTmprdU9UUTJJREUwTVM0MU1qVXNOekF1TURFeElFTXhOREl1TXpBMkxEY3dMalUxT1NBeE5ETXVNak14TERjd0xqZ3lNeUF4TkRRdU1qYzJMRGN3TGpneU1pQkRNVFExTGpVNU9DdzNNQzQ0TWpJZ01UUTNMakF6TERjd0xqTTNOaUF4TkRndU5UTXlMRFk1TGpVd09TQkRNVFV6TGpnME1pdzJOaTQwTkRNZ01UVTRMakUyTXl3MU9DNDVPRGNnTVRVNExqRTJNeXcxTWk0NE9UUWdRekUxT0M0eE5qTXNOVEF1T1RZM0lERTFOeTQzTWpFc05Ea3VNek15SURFMU5pNDRPRFFzTkRndU1UWTRJRU14TlRZdU9ERTRMRFE0TGpBM05pQXhOVFl1T0RJNExEUTNMamswT0NBeE5UWXVPVEE0TERRM0xqZzJOeUJETVRVMkxqazRPQ3cwTnk0M09EWWdNVFUzTGpFeE5DdzBOeTQzTnpRZ01UVTNMakl3T0N3ME55NDROQ0JETVRVNExqZzNPQ3cwT1M0d01USWdNVFU1TGpjNU9DdzFNUzR5TWlBeE5Ua3VOems0TERVMExqQTFPU0JETVRVNUxqYzVPQ3cyTUM0ek1ERWdNVFUxTGpNM015dzJPQzR3TkRZZ01UUTVMamt6TXl3M01TNHhPRFlnUXpFME9DNHpOaXczTWk0d09UUWdNVFEyTGpnMUxEY3lMalkyTnlBeE5EVXVORFExTERjeUxqWTJOeUJNTVRRMUxqUTBOU3czTWk0Mk5qY2dXaUJOTVRReUxqUTNOaXczTVNCRE1UUXpMakk1TERjeExqWTFNU0F4TkRRdU1qazJMRGN5TGpBd01pQXhORFV1TkRRMUxEY3lMakF3TWlCRE1UUTJMamMyTnl3M01pNHdNRElnTVRRNExqRTVPQ3czTVM0MU5TQXhORGt1Tnl3M01DNDJPRElnUXpFMU5TNHdNU3cyTnk0Mk1UY2dNVFU1TGpNek1TdzJNQzR4TlRrZ01UVTVMak16TVN3MU5DNHdOalVnUXpFMU9TNHpNekVzTlRJdU1EZzFJREUxT0M0NE5qZ3NOVEF1TkRNMUlERTFPQzR3TURZc05Ea3VNamN5SUVNeE5UZ3VOREUzTERVd0xqTXdOeUF4TlRndU5qTXNOVEV1TlRNeUlERTFPQzQyTXl3MU1pNDRPVElnUXpFMU9DNDJNeXcxT1M0eE16UWdNVFUwTGpJd05TdzJOaTQzTmpjZ01UUTRMamMyTlN3Mk9TNDVNRGNnUXpFME55NHhPVElzTnpBdU9ERTJJREUwTlM0Mk9ERXNOekV1TWpneklERTBOQzR5TnpZc056RXVNamd6SUVNeE5ETXVOak0wTERjeExqSTRNeUF4TkRNdU1ETXpMRGN4TGpFNU1pQXhOREl1TkRjMkxEY3hJRXd4TkRJdU5EYzJMRGN4SUZvaUlHbGtQU0pHYVd4c0xUTXpJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwT0M0Mk5EZ3NOamt1TnpBMElFTXhOVFF1TURNeUxEWTJMalU1TmlBeE5UZ3VNemsyTERVNUxqQTJPQ0F4TlRndU16azJMRFV5TGpnNU1TQkRNVFU0TGpNNU5pdzFNQzQ0TXprZ01UVTNMamt4TXl3ME9TNHhPVGdnTVRVM0xqQTNOQ3cwT0M0d015QkRNVFUxTGpJNE9TdzBOaTQzTnpnZ01UVXlMalk1T1N3ME5pNDRNellnTVRRNUxqZ3hOaXcwT0M0MU1ERWdRekUwTkM0ME16TXNOVEV1TmpBNUlERTBNQzR3Tmpnc05Ua3VNVE0zSURFME1DNHdOamdzTmpVdU16RTBJRU14TkRBdU1EWTRMRFkzTGpNMk5TQXhOREF1TlRVeUxEWTVMakF3TmlBeE5ERXVNemt4TERjd0xqRTNOQ0JETVRRekxqRTNOaXczTVM0ME1qY2dNVFExTGpjMk5TdzNNUzR6TmprZ01UUTRMalkwT0N3Mk9TNDNNRFFpSUdsa1BTSkdhV3hzTFRNMElpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBOQzR5TnpZc056RXVNamMySUV3eE5EUXVNamMyTERjeExqSTNOaUJETVRRekxqRXpNeXczTVM0eU56WWdNVFF5TGpFeE9DdzNNQzQ1TmprZ01UUXhMakkxTnl3M01DNHpOalVnUXpFME1TNHlNellzTnpBdU16VXhJREUwTVM0eU1UY3NOekF1TXpNeUlERTBNUzR5TURJc056QXVNekV4SUVNeE5EQXVNekEzTERZNUxqQTJOeUF4TXprdU9ETTFMRFkzTGpNek9TQXhNemt1T0RNMUxEWTFMak14TkNCRE1UTTVMamd6TlN3MU9TNHdOek1nTVRRMExqSTJMRFV4TGpRek9TQXhORGt1Tnl3ME9DNHlPVGdnUXpFMU1TNHlOek1zTkRjdU16a2dNVFV5TGpjNE5DdzBOaTQ1TWprZ01UVTBMakU0T1N3ME5pNDVNamtnUXpFMU5TNHpNeklzTkRZdU9USTVJREUxTmk0ek5EY3NORGN1TWpNMklERTFOeTR5TURnc05EY3VPRE01SUVNeE5UY3VNakk1TERRM0xqZzFOQ0F4TlRjdU1qUTRMRFEzTGpnM015QXhOVGN1TWpZekxEUTNMamc1TkNCRE1UVTRMakUxTnl3ME9TNHhNemdnTVRVNExqWXpMRFV3TGpnMk5TQXhOVGd1TmpNc05USXVPRGt4SUVNeE5UZ3VOak1zTlRrdU1UTXlJREUxTkM0eU1EVXNOall1TnpZMklERTBPQzQzTmpVc05qa3VPVEEzSUVNeE5EY3VNVGt5TERjd0xqZ3hOU0F4TkRVdU5qZ3hMRGN4TGpJM05pQXhORFF1TWpjMkxEY3hMakkzTmlCTU1UUTBMakkzTml3M01TNHlOellnV2lCTk1UUXhMalUxT0N3M01DNHhNRFFnUXpFME1pNHpNekVzTnpBdU5qTTNJREUwTXk0eU5EVXNOekV1TURBMUlERTBOQzR5TnpZc056RXVNREExSUVNeE5EVXVOVGs0TERjeExqQXdOU0F4TkRjdU1ETXNOekF1TkRZM0lERTBPQzQxTXpJc05qa3VOaUJETVRVekxqZzBNaXcyTmk0MU16UWdNVFU0TGpFMk15dzFPUzR3TXpNZ01UVTRMakUyTXl3MU1pNDVNemtnUXpFMU9DNHhOak1zTlRFdU1ETXhJREUxTnk0M01qa3NORGt1TXpnMUlERTFOaTQ1TURjc05EZ3VNakl6SUVNeE5UWXVNVE16TERRM0xqWTVNU0F4TlRVdU1qRTVMRFEzTGpRd09TQXhOVFF1TVRnNUxEUTNMalF3T1NCRE1UVXlMamcyTnl3ME55NDBNRGtnTVRVeExqUXpOU3cwTnk0NE5ESWdNVFE1TGprek15dzBPQzQzTURrZ1F6RTBOQzQyTWpNc05URXVOemMxSURFME1DNHpNRElzTlRrdU1qY3pJREUwTUM0ek1ESXNOalV1TXpZMklFTXhOREF1TXpBeUxEWTNMakkzTmlBeE5EQXVOek0yTERZNExqazBNaUF4TkRFdU5UVTRMRGN3TGpFd05DQk1NVFF4TGpVMU9DdzNNQzR4TURRZ1dpSWdhV1E5SWtacGJHd3RNelVpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRVd0xqY3lMRFkxTGpNMk1TQk1NVFV3TGpNMU55dzJOUzR3TmpZZ1F6RTFNUzR4TkRjc05qUXVNRGt5SURFMU1TNDROamtzTmpNdU1EUWdNVFV5TGpVd05TdzJNUzQ1TXpnZ1F6RTFNeTR6TVRNc05qQXVOVE01SURFMU15NDVOemdzTlRrdU1EWTNJREUxTkM0ME9ESXNOVGN1TlRZeklFd3hOVFF1T1RJMUxEVTNMamN4TWlCRE1UVTBMalF4TWl3MU9TNHlORFVnTVRVekxqY3pNeXcyTUM0M05EVWdNVFV5TGpreExEWXlMakUzTWlCRE1UVXlMakkyTWl3Mk15NHlPVFVnTVRVeExqVXlOU3cyTkM0ek5qZ2dNVFV3TGpjeUxEWTFMak0yTVNJZ2FXUTlJa1pwYkd3dE16WWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEUxTGpreE55dzROQzQxTVRRZ1RERXhOUzQxTlRRc09EUXVNaklnUXpFeE5pNHpORFFzT0RNdU1qUTFJREV4Tnk0d05qWXNPREl1TVRrMElERXhOeTQzTURJc09ERXVNRGt5SUVNeE1UZ3VOVEVzTnprdU5qa3lJREV4T1M0eE56VXNOemd1TWpJZ01URTVMalkzT0N3M05pNDNNVGNnVERFeU1DNHhNakVzTnpZdU9EWTFJRU14TVRrdU5qQTRMRGM0TGpNNU9DQXhNVGd1T1RNc056a3VPRGs1SURFeE9DNHhNRFlzT0RFdU16STJJRU14TVRjdU5EVTRMRGd5TGpRME9DQXhNVFl1TnpJeUxEZ3pMalV5TVNBeE1UVXVPVEUzTERnMExqVXhOQ0lnYVdROUlrWnBiR3d0TXpjaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URTBMREV6TUM0ME56WWdUREV4TkN3eE16QXVNREE0SUV3eE1UUXNOell1TURVeUlFd3hNVFFzTnpVdU5UZzBJRXd4TVRRc056WXVNRFV5SUV3eE1UUXNNVE13TGpBd09DQk1NVEUwTERFek1DNDBOellpSUdsa1BTSkdhV3hzTFRNNElpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDJjK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFp5QnBaRDBpU1cxd2IzSjBaV1F0VEdGNVpYSnpMVU52Y0hraUlIUnlZVzV6Wm05eWJUMGlkSEpoYm5Oc1lYUmxLRFl5TGpBd01EQXdNQ3dnTUM0d01EQXdNREFwSWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5UYUdGd1pVZHliM1Z3SWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVGt1T0RJeUxETTNMalEzTkNCRE1Ua3VPRE01TERNM0xqTXpPU0F4T1M0M05EY3NNemN1TVRrMElERTVMalUxTlN3ek55NHdPRElnUXpFNUxqSXlPQ3d6Tmk0NE9UUWdNVGd1TnpJNUxETTJMamczTWlBeE9DNDBORFlzTXpjdU1ETTNJRXd4TWk0ME16UXNOREF1TlRBNElFTXhNaTR6TURNc05EQXVOVGcwSURFeUxqSTBMRFF3TGpZNE5pQXhNaTR5TkRNc05EQXVOemt6SUVNeE1pNHlORFVzTkRBdU9USTFJREV5TGpJME5TdzBNUzR5TlRRZ01USXVNalExTERReExqTTNNU0JNTVRJdU1qUTFMRFF4TGpReE5DQk1NVEl1TWpNNExEUXhMalUwTWlCRE9DNHhORGdzTkRNdU9EZzNJRFV1TmpRM0xEUTFMak15TVNBMUxqWTBOeXcwTlM0ek1qRWdRelV1TmpRMkxEUTFMak15TVNBekxqVTNMRFEyTGpNMk55QXlMamcyTERVd0xqVXhNeUJETWk0NE5pdzFNQzQxTVRNZ01TNDVORGdzTlRjdU5EYzBJREV1T1RZeUxEY3dMakkxT0NCRE1TNDVOemNzT0RJdU9ESTRJREl1TlRZNExEZzNMak15T0NBekxqRXlPU3c1TVM0Mk1Ea2dRek11TXpRNUxEa3pMakk1TXlBMkxqRXpMRGt6TGpjek5DQTJMakV6TERrekxqY3pOQ0JETmk0ME5qRXNPVE11TnpjMElEWXVPREk0TERrekxqY3dOeUEzTGpJeExEa3pMalE0TmlCTU9ESXVORGd6TERRNUxqa3pOU0JET0RRdU1qa3hMRFE0TGpnMk5pQTROUzR4TlN3ME5pNHlNVFlnT0RVdU5UTTVMRFF6TGpZMU1TQkRPRFl1TnpVeUxETTFMalkyTVNBNE55NHlNVFFzTVRBdU5qY3pJRGcxTGpJMk5Dd3pMamMzTXlCRE9EVXVNRFk0TERNdU1EZ2dPRFF1TnpVMExESXVOamtnT0RRdU16azJMREl1TkRreElFdzRNaTR6TVN3eExqY3dNU0JET0RFdU5UZ3pMREV1TnpJNUlEZ3dMamc1TkN3eUxqRTJPQ0E0TUM0M056WXNNaTR5TXpZZ1F6Z3dMall6Tml3eUxqTXhOeUEwTVM0NE1EY3NNalF1TlRnMUlESXdMakF6TWl3ek55NHdOeklnVERFNUxqZ3lNaXd6Tnk0ME56UWlJR2xrUFNKR2FXeHNMVEVpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT0RJdU16RXhMREV1TnpBeElFdzROQzR6T1RZc01pNDBPVEVnUXpnMExqYzFOQ3d5TGpZNUlEZzFMakEyT0N3ekxqQTRJRGcxTGpJMk5Dd3pMamMzTXlCRE9EY3VNakV6TERFd0xqWTNNeUE0Tmk0M05URXNNelV1TmpZZ09EVXVOVE01TERRekxqWTFNU0JET0RVdU1UUTVMRFEyTGpJeE5pQTROQzR5T1N3ME9DNDROallnT0RJdU5EZ3pMRFE1TGprek5TQk1OeTR5TVN3NU15NDBPRFlnUXpZdU9EazNMRGt6TGpZMk55QTJMalU1TlN3NU15NDNORFFnTmk0ek1UUXNPVE11TnpRMElFdzJMakV6TVN3NU15NDNNek1nUXpZdU1UTXhMRGt6TGpjek5DQXpMak0wT1N3NU15NHlPVE1nTXk0eE1qZ3NPVEV1TmpBNUlFTXlMalUyT0N3NE55NHpNamNnTVM0NU56Y3NPREl1T0RJNElERXVPVFl6TERjd0xqSTFPQ0JETVM0NU5EZ3NOVGN1TkRjMElESXVPRFlzTlRBdU5URXpJREl1T0RZc05UQXVOVEV6SUVNekxqVTNMRFEyTGpNMk55QTFMalkwTnl3ME5TNHpNakVnTlM0Mk5EY3NORFV1TXpJeElFTTFMalkwTnl3ME5TNHpNakVnT0M0eE5EZ3NORE11T0RnM0lERXlMakl6T0N3ME1TNDFORElnVERFeUxqSTBOU3cwTVM0ME1UUWdUREV5TGpJME5TdzBNUzR6TnpFZ1F6RXlMakkwTlN3ME1TNHlOVFFnTVRJdU1qUTFMRFF3TGpreU5TQXhNaTR5TkRNc05EQXVOemt6SUVNeE1pNHlOQ3cwTUM0Mk9EWWdNVEl1TXpBeUxEUXdMalU0TXlBeE1pNDBNelFzTkRBdU5UQTRJRXd4T0M0ME5EWXNNemN1TURNMklFTXhPQzQxTnpRc016WXVPVFl5SURFNExqYzBOaXd6Tmk0NU1qWWdNVGd1T1RJM0xETTJMamt5TmlCRE1Ua3VNVFExTERNMkxqa3lOaUF4T1M0ek56WXNNell1T1RjNUlERTVMalUxTkN3ek55NHdPRElnUXpFNUxqYzBOeXd6Tnk0eE9UUWdNVGt1T0RNNUxETTNMak0wSURFNUxqZ3lNaXd6Tnk0ME56UWdUREl3TGpBek15d3pOeTR3TnpJZ1F6UXhMamd3Tml3eU5DNDFPRFVnT0RBdU5qTTJMREl1TXpFNElEZ3dMamMzTnl3eUxqSXpOaUJET0RBdU9EazBMREl1TVRZNElEZ3hMalU0TXl3eExqY3lPU0E0TWk0ek1URXNNUzQzTURFZ1RUZ3lMak14TVN3d0xqY3dOQ0JNT0RJdU1qY3lMREF1TnpBMUlFTTRNUzQyTlRRc01DNDNNamdnT0RBdU9UZzVMREF1T1RRNUlEZ3dMakk1T0N3eExqTTJNU0JNT0RBdU1qYzNMREV1TXpjeklFTTRNQzR4TWprc01TNDBOVGdnTlRrdU56WTRMREV6TGpFek5TQXhPUzQzTlRnc016WXVNRGM1SUVNeE9TNDFMRE0xTGprNE1TQXhPUzR5TVRRc016VXVPVEk1SURFNExqa3lOeXd6TlM0NU1qa2dRekU0TGpVMk1pd3pOUzQ1TWprZ01UZ3VNakl6TERNMkxqQXhNeUF4Tnk0NU5EY3NNell1TVRjeklFd3hNUzQ1TXpVc016a3VOalEwSUVNeE1TNDBPVE1zTXprdU9EazVJREV4TGpJek5pdzBNQzR6TXpRZ01URXVNalEyTERRd0xqZ3hJRXd4TVM0eU5EY3NOREF1T1RZZ1REVXVNVFkzTERRMExqUTBOeUJETkM0M09UUXNORFF1TmpRMklESXVOakkxTERRMUxqazNPQ0F4TGpnM055dzFNQzR6TkRVZ1RERXVPRGN4TERVd0xqTTROQ0JETVM0NE5qSXNOVEF1TkRVMElEQXVPVFV4TERVM0xqVTFOeUF3TGprMk5TdzNNQzR5TlRrZ1F6QXVPVGM1TERneUxqZzNPU0F4TGpVMk9DdzROeTR6TnpVZ01pNHhNemNzT1RFdU56STBJRXd5TGpFek9TdzVNUzQzTXprZ1F6SXVORFEzTERrMExqQTVOQ0ExTGpZeE5DdzVOQzQyTmpJZ05TNDVOelVzT1RRdU56RTVJRXcyTGpBd09TdzVOQzQzTWpNZ1F6WXVNVEVzT1RRdU56TTJJRFl1TWpFekxEazBMamMwTWlBMkxqTXhOQ3c1TkM0M05ESWdRell1Tnprc09UUXVOelF5SURjdU1qWXNPVFF1TmpFZ055NDNNU3c1TkM0ek5TQk1PREl1T1RnekxEVXdMamM1T0NCRE9EUXVOemswTERRNUxqY3lOeUE0TlM0NU9ESXNORGN1TXpjMUlEZzJMalV5TlN3ME15NDRNREVnUXpnM0xqY3hNU3d6TlM0NU9EY2dPRGd1TWpVNUxERXdMamN3TlNBNE5pNHlNalFzTXk0MU1ESWdRemcxTGprM01Td3lMall3T1NBNE5TNDFNaXd4TGprM05TQTROQzQ0T0RFc01TNDJNaUJNT0RRdU56UTVMREV1TlRVNElFdzRNaTQyTmpRc01DNDNOamtnUXpneUxqVTFNU3d3TGpjeU5TQTRNaTQwTXpFc01DNDNNRFFnT0RJdU16RXhMREF1TnpBMElpQnBaRDBpUm1sc2JDMHlJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFkyTGpJMk55d3hNUzQxTmpVZ1REWTNMamMyTWl3eE1TNDVPVGtnVERFeExqUXlNeXcwTkM0ek1qVWlJR2xrUFNKR2FXeHNMVE1pSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRJdU1qQXlMRGt3TGpVME5TQkRNVEl1TURJNUxEa3dMalUwTlNBeE1TNDROaklzT1RBdU5EVTFJREV4TGpjMk9TdzVNQzR5T1RVZ1F6RXhMall6TWl3NU1DNHdOVGNnTVRFdU56RXpMRGc1TGpjMU1pQXhNUzQ1TlRJc09Ea3VOakUwSUV3ek1DNHpPRGtzTnpndU9UWTVJRU16TUM0Mk1qZ3NOemd1T0RNeElETXdMamt6TXl3M09DNDVNVE1nTXpFdU1EY3hMRGM1TGpFMU1pQkRNekV1TWpBNExEYzVMak01SURNeExqRXlOeXczT1M0Mk9UWWdNekF1T0RnNExEYzVMamd6TXlCTU1USXVORFV4TERrd0xqUTNPQ0JNTVRJdU1qQXlMRGt3TGpVME5TSWdhV1E5SWtacGJHd3ROQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TXk0M05qUXNOREl1TmpVMElFd3hNeTQyTlRZc05ESXVOVGt5SUV3eE15NDNNRElzTkRJdU5ESXhJRXd4T0M0NE16Y3NNemt1TkRVM0lFd3hPUzR3TURjc016a3VOVEF5SUV3eE9DNDVOaklzTXprdU5qY3pJRXd4TXk0NE1qY3NOREl1TmpNM0lFd3hNeTQzTmpRc05ESXVOalUwSWlCcFpEMGlSbWxzYkMwMUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUZ3VOVElzT1RBdU16YzFJRXc0TGpVeUxEUTJMalF5TVNCTU9DNDFPRE1zTkRZdU16ZzFJRXczTlM0NE5DdzNMalUxTkNCTU56VXVPRFFzTlRFdU5UQTRJRXczTlM0M056Z3NOVEV1TlRRMElFdzRMalV5TERrd0xqTTNOU0JNT0M0MU1pdzVNQzR6TnpVZ1dpQk5PQzQzTnl3ME5pNDFOalFnVERndU56Y3NPRGt1T1RRMElFdzNOUzQxT1RFc05URXVNelkxSUV3M05TNDFPVEVzTnk0NU9EVWdURGd1Tnpjc05EWXVOVFkwSUV3NExqYzNMRFEyTGpVMk5DQmFJaUJwWkQwaVJtbHNiQzAySWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRJMExqazROaXc0TXk0eE9ESWdRekkwTGpjMU5pdzRNeTR6TXpFZ01qUXVNemMwTERnekxqVTJOaUF5TkM0eE16Y3NPRE11TnpBMUlFd3hNaTQyTXpJc09UQXVOREEySUVNeE1pNHpPVFVzT1RBdU5UUTFJREV5TGpReU5pdzVNQzQyTlRnZ01USXVOeXc1TUM0Mk5UZ2dUREV6TGpJMk5TdzVNQzQyTlRnZ1F6RXpMalUwTERrd0xqWTFPQ0F4TXk0NU5UZ3NPVEF1TlRRMUlERTBMakU1TlN3NU1DNDBNRFlnVERJMUxqY3NPRE11TnpBMUlFTXlOUzQ1TXpjc09ETXVOVFkySURJMkxqRXlPQ3c0TXk0ME5USWdNall1TVRJMUxEZ3pMalEwT1NCRE1qWXVNVEl5TERnekxqUTBOeUF5Tmk0eE1Ua3NPRE11TWpJZ01qWXVNVEU1TERneUxqazBOaUJETWpZdU1URTVMRGd5TGpZM01pQXlOUzQ1TXpFc09ESXVOVFk1SURJMUxqY3dNU3c0TWk0M01Ua2dUREkwTGprNE5pdzRNeTR4T0RJaUlHbGtQU0pHYVd4c0xUY2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVE11TWpZMkxEa3dMamM0TWlCTU1USXVOeXc1TUM0M09ESWdRekV5TGpVc09UQXVOemd5SURFeUxqTTROQ3c1TUM0M01qWWdNVEl1TXpVMExEa3dMall4TmlCRE1USXVNekkwTERrd0xqVXdOaUF4TWk0ek9UY3NPVEF1TXprNUlERXlMalUyT1N3NU1DNHlPVGtnVERJMExqQTNOQ3c0TXk0MU9UY2dRekkwTGpNeExEZ3pMalExT1NBeU5DNDJPRGtzT0RNdU1qSTJJREkwTGpreE9DdzRNeTR3TnpnZ1RESTFMall6TXl3NE1pNDJNVFFnUXpJMUxqY3lNeXc0TWk0MU5UVWdNalV1T0RFekxEZ3lMalV5TlNBeU5TNDRPVGtzT0RJdU5USTFJRU15Tmk0d056RXNPREl1TlRJMUlESTJMakkwTkN3NE1pNDJOVFVnTWpZdU1qUTBMRGd5TGprME5pQkRNall1TWpRMExEZ3pMakUySURJMkxqSTBOU3c0TXk0ek1Ea2dNall1TWpRM0xEZ3pMak00TXlCTU1qWXVNalV6TERnekxqTTROeUJNTWpZdU1qUTVMRGd6TGpRMU5pQkRNall1TWpRMkxEZ3pMalV6TVNBeU5pNHlORFlzT0RNdU5UTXhJREkxTGpjMk15dzRNeTQ0TVRJZ1RERTBMakkxT0N3NU1DNDFNVFFnUXpFMExEa3dMalkyTlNBeE15NDFOalFzT1RBdU56Z3lJREV6TGpJMk5pdzVNQzQzT0RJZ1RERXpMakkyTml3NU1DNDNPRElnV2lCTk1USXVOalkyTERrd0xqVXpNaUJNTVRJdU55dzVNQzQxTXpNZ1RERXpMakkyTml3NU1DNDFNek1nUXpFekxqVXhPQ3c1TUM0MU16TWdNVE11T1RFMUxEa3dMalF5TlNBeE5DNHhNeklzT1RBdU1qazVJRXd5TlM0Mk16Y3NPRE11TlRrM0lFTXlOUzQ0TURVc09ETXVORGs1SURJMUxqa3pNU3c0TXk0ME1qUWdNalV1T1RrNExEZ3pMak00TXlCRE1qVXVPVGswTERnekxqSTVPU0F5TlM0NU9UUXNPRE11TVRZMUlESTFMams1TkN3NE1pNDVORFlnVERJMUxqZzVPU3c0TWk0M056VWdUREkxTGpjMk9DdzRNaTQ0TWpRZ1RESTFMakExTkN3NE15NHlPRGNnUXpJMExqZ3lNaXc0TXk0ME16Y2dNalF1TkRNNExEZ3pMalkzTXlBeU5DNHlMRGd6TGpneE1pQk1NVEl1TmprMUxEa3dMalV4TkNCTU1USXVOalkyTERrd0xqVXpNaUJNTVRJdU5qWTJMRGt3TGpVek1pQmFJaUJwWkQwaVJtbHNiQzA0SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFekxqSTJOaXc0T1M0NE56RWdUREV5TGpjc09Ea3VPRGN4SUVNeE1pNDFMRGc1TGpnM01TQXhNaTR6T0RRc09Ea3VPREUxSURFeUxqTTFOQ3c0T1M0M01EVWdRekV5TGpNeU5DdzRPUzQxT1RVZ01USXVNemszTERnNUxqUTRPQ0F4TWk0MU5qa3NPRGt1TXpnNElFd3lOQzR3TnpRc09ESXVOamcySUVNeU5DNHpNeklzT0RJdU5UTTFJREkwTGpjMk9DdzRNaTQwTVRnZ01qVXVNRFkzTERneUxqUXhPQ0JNTWpVdU5qTXlMRGd5TGpReE9DQkRNalV1T0RNeUxEZ3lMalF4T0NBeU5TNDVORGdzT0RJdU5EYzBJREkxTGprM09DdzRNaTQxT0RRZ1F6STJMakF3T0N3NE1pNDJPVFFnTWpVdU9UTTFMRGd5TGpnd01TQXlOUzQzTmpNc09ESXVPVEF4SUV3eE5DNHlOVGdzT0RrdU5qQXpJRU14TkN3NE9TNDNOVFFnTVRNdU5UWTBMRGc1TGpnM01TQXhNeTR5TmpZc09Ea3VPRGN4SUV3eE15NHlOallzT0RrdU9EY3hJRm9nVFRFeUxqWTJOaXc0T1M0Mk1qRWdUREV5TGpjc09Ea3VOakl5SUV3eE15NHlOallzT0RrdU5qSXlJRU14TXk0MU1UZ3NPRGt1TmpJeUlERXpMamt4TlN3NE9TNDFNVFVnTVRRdU1UTXlMRGc1TGpNNE9DQk1NalV1TmpNM0xEZ3lMalk0TmlCTU1qVXVOalkzTERneUxqWTJPQ0JNTWpVdU5qTXlMRGd5TGpZMk55Qk1NalV1TURZM0xEZ3lMalkyTnlCRE1qUXVPREUxTERneUxqWTJOeUF5TkM0ME1UZ3NPREl1TnpjMUlESTBMaklzT0RJdU9UQXhJRXd4TWk0Mk9UVXNPRGt1TmpBeklFd3hNaTQyTmpZc09Ea3VOakl4SUV3eE1pNDJOallzT0RrdU5qSXhJRm9pSUdsa1BTSkdhV3hzTFRraUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1USXVNemNzT1RBdU9EQXhJRXd4TWk0ek55dzRPUzQxTlRRZ1RERXlMak0zTERrd0xqZ3dNU0lnYVdROUlrWnBiR3d0TVRBaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk5pNHhNeXc1TXk0NU1ERWdRelV1TXpjNUxEa3pMamd3T0NBMExqZ3hOaXc1TXk0eE5qUWdOQzQyT1RFc09USXVOVEkxSUVNekxqZzJMRGc0TGpJNE55QXpMalUwTERnekxqYzBNeUF6TGpVeU5pdzNNUzR4TnpNZ1F6TXVOVEV4TERVNExqTTRPU0EwTGpReU15dzFNUzQwTWpnZ05DNDBNak1zTlRFdU5ESTRJRU0xTGpFek5DdzBOeTR5T0RJZ055NHlNU3cwTmk0eU16WWdOeTR5TVN3ME5pNHlNellnUXpjdU1qRXNORFl1TWpNMklEZ3hMalkyTnl3ekxqSTFJRGd5TGpBMk9Td3pMakF4TnlCRE9ESXVNamt5TERJdU9EZzRJRGcwTGpVMU5pd3hMalF6TXlBNE5TNHlOalFzTXk0NU5DQkRPRGN1TWpFMExERXdMamcwSURnMkxqYzFNaXd6TlM0NE1qY2dPRFV1TlRNNUxEUXpMamd4T0NCRE9EVXVNVFVzTkRZdU16Z3pJRGcwTGpJNU1TdzBPUzR3TXpNZ09ESXVORGd6TERVd0xqRXdNU0JNTnk0eU1TdzVNeTQyTlRNZ1F6WXVPREk0TERrekxqZzNOQ0EyTGpRMk1TdzVNeTQ1TkRFZ05pNHhNeXc1TXk0NU1ERWdRell1TVRNc09UTXVPVEF4SURNdU16UTVMRGt6TGpRMklETXVNVEk1TERreExqYzNOaUJETWk0MU5qZ3NPRGN1TkRrMUlERXVPVGMzTERneUxqazVOU0F4TGprMk1pdzNNQzQwTWpVZ1F6RXVPVFE0TERVM0xqWTBNU0F5TGpnMkxEVXdMalk0SURJdU9EWXNOVEF1TmpnZ1F6TXVOVGNzTkRZdU5UTTBJRFV1TmpRM0xEUTFMalE0T1NBMUxqWTBOeXcwTlM0ME9Ea2dRelV1TmpRMkxEUTFMalE0T1NBNExqQTJOU3cwTkM0d09USWdNVEl1TWpRMUxEUXhMalkzT1NCTU1UTXVNVEUyTERReExqVTJJRXd4T1M0M01UVXNNemN1TnpNZ1RERTVMamMyTVN3ek55NHlOamtnVERZdU1UTXNPVE11T1RBeElpQnBaRDBpUm1sc2JDMHhNU0lnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAyTGpNeE55dzVOQzR4TmpFZ1REWXVNVEF5TERrMExqRTBPQ0JNTmk0eE1ERXNPVFF1TVRRNElFdzFMamcxTnl3NU5DNHhNREVnUXpVdU1UTTRMRGt6TGprME5TQXpMakE0TlN3NU15NHpOalVnTWk0NE9ERXNPVEV1T0RBNUlFTXlMak14TXl3NE55NDBOamtnTVM0M01qY3NPREl1T1RrMklERXVOekV6TERjd0xqUXlOU0JETVM0Mk9Ua3NOVGN1TnpjeElESXVOakEwTERVd0xqY3hPQ0F5TGpZeE15dzFNQzQyTkRnZ1F6TXVNek00TERRMkxqUXhOeUExTGpRME5TdzBOUzR6TVNBMUxqVXpOU3cwTlM0eU5qWWdUREV5TGpFMk15dzBNUzQwTXprZ1RERXpMakF6TXl3ME1TNHpNaUJNTVRrdU5EYzVMRE0zTGpVM09DQk1NVGt1TlRFekxETTNMakkwTkNCRE1Ua3VOVEkyTERNM0xqRXdOeUF4T1M0Mk5EY3NNemN1TURBNElERTVMamM0Tml3ek55NHdNakVnUXpFNUxqa3lNaXd6Tnk0d016UWdNakF1TURJekxETTNMakUxTmlBeU1DNHdNRGtzTXpjdU1qa3pJRXd4T1M0NU5Td3pOeTQ0T0RJZ1RERXpMakU1T0N3ME1TNDRNREVnVERFeUxqTXlPQ3cwTVM0NU1Ua2dURFV1TnpjeUxEUTFMamN3TkNCRE5TNDNOREVzTkRVdU56SWdNeTQzT0RJc05EWXVOemN5SURNdU1UQTJMRFV3TGpjeU1pQkRNeTR3T1Rrc05UQXVOemd5SURJdU1UazRMRFUzTGpnd09DQXlMakl4TWl3M01DNDBNalFnUXpJdU1qSTJMRGd5TGprMk15QXlMamd3T1N3NE55NDBNaUF6TGpNM015dzVNUzQzTWprZ1F6TXVORFkwTERreUxqUXlJRFF1TURZeUxEa3lMamc0TXlBMExqWTRNaXc1TXk0eE9ERWdRelF1TlRZMkxEa3lMams0TkNBMExqUTROaXc1TWk0M056WWdOQzQwTkRZc09USXVOVGN5SUVNekxqWTJOU3c0T0M0MU9EZ2dNeTR5T1RFc09EUXVNemNnTXk0eU56WXNOekV1TVRjeklFTXpMakkyTWl3MU9DNDFNaUEwTGpFMk55dzFNUzQwTmpZZ05DNHhOellzTlRFdU16azJJRU0wTGprd01TdzBOeTR4TmpVZ055NHdNRGdzTkRZdU1EVTVJRGN1TURrNExEUTJMakF4TkNCRE55NHdPVFFzTkRZdU1ERTFJRGd4TGpVME1pd3pMakF6TkNBNE1TNDVORFFzTWk0NE1ESWdURGd4TGprM01pd3lMamM0TlNCRE9ESXVPRGMyTERJdU1qUTNJRGd6TGpZNU1pd3lMakE1TnlBNE5DNHpNeklzTWk0ek5USWdRemcwTGpnNE55d3lMalUzTXlBNE5TNHlPREVzTXk0d09EVWdPRFV1TlRBMExETXVPRGN5SUVNNE55NDFNVGdzTVRFZ09EWXVPVFkwTERNMkxqQTVNU0E0TlM0M09EVXNORE11T0RVMUlFTTROUzR5Tnpnc05EY3VNVGsySURnMExqSXhMRFE1TGpNM0lEZ3lMall4TERVd0xqTXhOeUJNTnk0ek16VXNPVE11T0RZNUlFTTJMams1T1N3NU5DNHdOak1nTmk0Mk5UZ3NPVFF1TVRZeElEWXVNekUzTERrMExqRTJNU0JNTmk0ek1UY3NPVFF1TVRZeElGb2dUVFl1TVRjc09UTXVOalUwSUVNMkxqUTJNeXc1TXk0Mk9TQTJMamMzTkN3NU15NDJNVGNnTnk0d09EVXNPVE11TkRNM0lFdzRNaTR6TlRnc05Ea3VPRGcySUVNNE5DNHhPREVzTkRndU9EQTRJRGcwTGprMkxEUTFMamszTVNBNE5TNHlPVElzTkRNdU56Z2dRemcyTGpRMk5pd3pOaTR3TkRrZ09EY3VNREl6TERFeExqQTROU0E0TlM0d01qUXNOQzR3TURnZ1F6ZzBMamcwTml3ekxqTTNOeUE0TkM0MU5URXNNaTQ1TnpZZ09EUXVNVFE0TERJdU9ERTJJRU00TXk0Mk5qUXNNaTQyTWpNZ09ESXVPVGd5TERJdU56WTBJRGd5TGpJeU55d3pMakl4TXlCTU9ESXVNVGt6TERNdU1qTTBJRU00TVM0M09URXNNeTQwTmpZZ055NHpNelVzTkRZdU5EVXlJRGN1TXpNMUxEUTJMalExTWlCRE55NHpNRFFzTkRZdU5EWTVJRFV1TXpRMkxEUTNMalV5TVNBMExqWTJPU3cxTVM0ME56RWdRelF1TmpZeUxEVXhMalV6SURNdU56WXhMRFU0TGpVMU5pQXpMamMzTlN3M01TNHhOek1nUXpNdU56a3NPRFF1TXpJNElEUXVNVFl4TERnNExqVXlOQ0EwTGprek5pdzVNaTQwTnpZZ1F6VXVNREkyTERreUxqa3pOeUExTGpReE1pdzVNeTQwTlRrZ05TNDVOek1zT1RNdU5qRTFJRU0yTGpBNE55dzVNeTQyTkNBMkxqRTFPQ3c1TXk0Mk5USWdOaTR4Tmprc09UTXVOalUwSUV3MkxqRTNMRGt6TGpZMU5DQk1OaTR4Tnl3NU15NDJOVFFnV2lJZ2FXUTlJa1pwYkd3dE1USWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OeTR6TVRjc05qZ3VPVGd5SUVNM0xqZ3dOaXcyT0M0M01ERWdPQzR5TURJc05qZ3VPVEkySURndU1qQXlMRFk1TGpRNE55QkRPQzR5TURJc056QXVNRFEzSURjdU9EQTJMRGN3TGpjeklEY3VNekUzTERjeExqQXhNaUJETmk0NE1qa3NOekV1TWprMElEWXVORE16TERjeExqQTJPU0EyTGpRek15dzNNQzQxTURnZ1F6WXVORE16TERZNUxqazBPQ0EyTGpneU9TdzJPUzR5TmpVZ055NHpNVGNzTmpndU9UZ3lJaUJwWkQwaVJtbHNiQzB4TXlJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswMkxqa3lMRGN4TGpFek15QkROaTQyTXpFc056RXVNVE16SURZdU5ETXpMRGN3TGprd05TQTJMalF6TXl3M01DNDFNRGdnUXpZdU5ETXpMRFk1TGprME9DQTJMamd5T1N3Mk9TNHlOalVnTnk0ek1UY3NOamd1T1RneUlFTTNMalEyTERZNExqa2dOeTQxT1RVc05qZ3VPRFl4SURjdU56RTBMRFk0TGpnMk1TQkRPQzR3TURNc05qZ3VPRFl4SURndU1qQXlMRFk1TGpBNUlEZ3VNakF5TERZNUxqUTROeUJET0M0eU1ESXNOekF1TURRM0lEY3VPREEyTERjd0xqY3pJRGN1TXpFM0xEY3hMakF4TWlCRE55NHhOelFzTnpFdU1EazBJRGN1TURNNUxEY3hMakV6TXlBMkxqa3lMRGN4TGpFek15Qk5OeTQzTVRRc05qZ3VOamMwSUVNM0xqVTFOeXcyT0M0Mk56UWdOeTR6T1RJc05qZ3VOekl6SURjdU1qSTBMRFk0TGpneU1TQkROaTQyTnpZc05qa3VNVE00SURZdU1qUTJMRFk1TGpnM09TQTJMakkwTml3M01DNDFNRGdnUXpZdU1qUTJMRGN3TGprNU5DQTJMalV4Tnl3M01TNHpNaUEyTGpreUxEY3hMak15SUVNM0xqQTNPQ3czTVM0ek1pQTNMakkwTXl3M01TNHlOekVnTnk0ME1URXNOekV1TVRjMElFTTNMamsxT1N3M01DNDROVGNnT0M0ek9Ea3NOekF1TVRFM0lEZ3VNemc1TERZNUxqUTROeUJET0M0ek9Ea3NOamt1TURBeElEZ3VNVEUzTERZNExqWTNOQ0EzTGpjeE5DdzJPQzQyTnpRaUlHbGtQU0pHYVd4c0xURTBJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFl1T1RJc056QXVPVFEzSUVNMkxqWTBPU3czTUM0NU5EY2dOaTQyTWpFc056QXVOalFnTmk0Mk1qRXNOekF1TlRBNElFTTJMall5TVN3M01DNHdNVGNnTmk0NU9ESXNOamt1TXpreUlEY3VOREV4TERZNUxqRTBOU0JETnk0MU1qRXNOamt1TURneUlEY3VOakkxTERZNUxqQTBPU0EzTGpjeE5DdzJPUzR3TkRrZ1F6Y3VPVGcyTERZNUxqQTBPU0E0TGpBeE5TdzJPUzR6TlRVZ09DNHdNVFVzTmprdU5EZzNJRU00TGpBeE5TdzJPUzQ1TnpnZ055NDJOVElzTnpBdU5qQXpJRGN1TWpJMExEY3dMamcxTVNCRE55NHhNVFVzTnpBdU9URTBJRGN1TURFc056QXVPVFEzSURZdU9USXNOekF1T1RRM0lFMDNMamN4TkN3Mk9DNDROakVnUXpjdU5UazFMRFk0TGpnMk1TQTNMalEyTERZNExqa2dOeTR6TVRjc05qZ3VPVGd5SUVNMkxqZ3lPU3cyT1M0eU5qVWdOaTQwTXpNc05qa3VPVFE0SURZdU5ETXpMRGN3TGpVd09DQkROaTQwTXpNc056QXVPVEExSURZdU5qTXhMRGN4TGpFek15QTJMamt5TERjeExqRXpNeUJETnk0d016a3NOekV1TVRNeklEY3VNVGMwTERjeExqQTVOQ0EzTGpNeE55dzNNUzR3TVRJZ1F6Y3VPREEyTERjd0xqY3pJRGd1TWpBeUxEY3dMakEwTnlBNExqSXdNaXcyT1M0ME9EY2dRemd1TWpBeUxEWTVMakE1SURndU1EQXpMRFk0TGpnMk1TQTNMamN4TkN3Mk9DNDROakVpSUdsa1BTSkdhV3hzTFRFMUlpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUY3VORFEwTERnMUxqTTFJRU0zTGpjd09DdzROUzR4T1RnZ055NDVNakVzT0RVdU16RTVJRGN1T1RJeExEZzFMall5TWlCRE55NDVNakVzT0RVdU9USTFJRGN1TnpBNExEZzJMakk1TWlBM0xqUTBOQ3c0Tmk0ME5EUWdRemN1TVRneExEZzJMalU1TnlBMkxqazJOeXc0Tmk0ME56VWdOaTQ1Tmpjc09EWXVNVGN6SUVNMkxqazJOeXc0TlM0NE56RWdOeTR4T0RFc09EVXVOVEF5SURjdU5EUTBMRGcxTGpNMUlpQnBaRDBpUm1sc2JDMHhOaUlnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAzTGpJekxEZzJMalV4SUVNM0xqQTNOQ3c0Tmk0MU1TQTJMamsyTnl3NE5pNHpPRGNnTmk0NU5qY3NPRFl1TVRjeklFTTJMamsyTnl3NE5TNDROekVnTnk0eE9ERXNPRFV1TlRBeUlEY3VORFEwTERnMUxqTTFJRU0zTGpVeU1TdzROUzR6TURVZ055NDFPVFFzT0RVdU1qZzBJRGN1TmpVNExEZzFMakk0TkNCRE55NDRNVFFzT0RVdU1qZzBJRGN1T1RJeExEZzFMalF3T0NBM0xqa3lNU3c0TlM0Mk1qSWdRemN1T1RJeExEZzFMamt5TlNBM0xqY3dPQ3c0Tmk0eU9USWdOeTQwTkRRc09EWXVORFEwSUVNM0xqTTJOeXc0Tmk0ME9Ea2dOeTR5T1RRc09EWXVOVEVnTnk0eU15dzROaTQxTVNCTk55NDJOVGdzT0RVdU1EazRJRU0zTGpVMU9DdzROUzR3T1RnZ055NDBOVFVzT0RVdU1USTNJRGN1TXpVeExEZzFMakU0T0NCRE55NHdNekVzT0RVdU16Y3pJRFl1TnpneExEZzFMamd3TmlBMkxqYzRNU3c0Tmk0eE56TWdRell1TnpneExEZzJMalE0TWlBMkxqazJOaXc0Tmk0Mk9UY2dOeTR5TXl3NE5pNDJPVGNnUXpjdU16TXNPRFl1TmprM0lEY3VORE16TERnMkxqWTJOaUEzTGpVek9DdzROaTQyTURjZ1F6Y3VPRFU0TERnMkxqUXlNaUE0TGpFd09DdzROUzQ1T0RrZ09DNHhNRGdzT0RVdU5qSXlJRU00TGpFd09DdzROUzR6TVRNZ055NDVNak1zT0RVdU1EazRJRGN1TmpVNExEZzFMakE1T0NJZ2FXUTlJa1pwYkd3dE1UY2lJR1pwYkd3OUlpTTRNRGszUVRJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OeTR5TXl3NE5pNHpNaklnVERjdU1UVTBMRGcyTGpFM015QkROeTR4TlRRc09EVXVPVE00SURjdU16TXpMRGcxTGpZeU9TQTNMalV6T0N3NE5TNDFNVElnVERjdU5qVTRMRGcxTGpRM01TQk1OeTQzTXpRc09EVXVOakl5SUVNM0xqY3pOQ3c0TlM0NE5UWWdOeTQxTlRVc09EWXVNVFkwSURjdU16VXhMRGcyTGpJNE1pQk1OeTR5TXl3NE5pNHpNaklnVFRjdU5qVTRMRGcxTGpJNE5DQkROeTQxT1RRc09EVXVNamcwSURjdU5USXhMRGcxTGpNd05TQTNMalEwTkN3NE5TNHpOU0JETnk0eE9ERXNPRFV1TlRBeUlEWXVPVFkzTERnMUxqZzNNU0EyTGprMk55dzROaTR4TnpNZ1F6WXVPVFkzTERnMkxqTTROeUEzTGpBM05DdzROaTQxTVNBM0xqSXpMRGcyTGpVeElFTTNMakk1TkN3NE5pNDFNU0EzTGpNMk55dzROaTQwT0RrZ055NDBORFFzT0RZdU5EUTBJRU0zTGpjd09DdzROaTR5T1RJZ055NDVNakVzT0RVdU9USTFJRGN1T1RJeExEZzFMall5TWlCRE55NDVNakVzT0RVdU5EQTRJRGN1T0RFMExEZzFMakk0TkNBM0xqWTFPQ3c0TlM0eU9EUWlJR2xrUFNKR2FXeHNMVEU0SWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRjM0xqSTNPQ3czTGpjMk9TQk1OemN1TWpjNExEVXhMalF6TmlCTU1UQXVNakE0TERrd0xqRTJJRXd4TUM0eU1EZ3NORFl1TkRreklFdzNOeTR5Tnpnc055NDNOamtpSUdsa1BTSkdhV3hzTFRFNUlpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXdMakE0TXl3NU1DNHpOelVnVERFd0xqQTRNeXcwTmk0ME1qRWdUREV3TGpFME5pdzBOaTR6T0RVZ1REYzNMalF3TXl3M0xqVTFOQ0JNTnpjdU5EQXpMRFV4TGpVd09DQk1OemN1TXpReExEVXhMalUwTkNCTU1UQXVNRGd6TERrd0xqTTNOU0JNTVRBdU1EZ3pMRGt3TGpNM05TQmFJRTB4TUM0ek16TXNORFl1TlRZMElFd3hNQzR6TXpNc09Ea3VPVFEwSUV3M055NHhOVFFzTlRFdU16WTFJRXczTnk0eE5UUXNOeTQ1T0RVZ1RERXdMak16TXl3ME5pNDFOalFnVERFd0xqTXpNeXcwTmk0MU5qUWdXaUlnYVdROUlrWnBiR3d0TWpBaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2Wno0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE1qVXVOek0zTERnNExqWTBOeUJNTVRFNExqQTVPQ3c1TVM0NU9ERWdUREV4T0M0d09UZ3NPRFFnVERFd05pNDJNemtzT0RndU56RXpJRXd4TURZdU5qTTVMRGsyTGprNE1pQk1PVGtzTVRBd0xqTXhOU0JNTVRFeUxqTTJPU3d4TURNdU9UWXhJRXd4TWpVdU56TTNMRGc0TGpZME55SWdhV1E5SWtsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUSWlJR1pwYkd3OUlpTTBOVFZCTmpRaUlITnJaWFJqYURwMGVYQmxQU0pOVTFOb1lYQmxSM0p2ZFhBaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdQQzluUGdvZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUR3dlp6NEtQQzl6ZG1jKycpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3RhdGVJbnN0cnVjdGlvbnM7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHt9O1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufTtcblxuVXRpbC5pc0lPUyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5VdGlsLmlzSUZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5zZWxmICE9PSB3aW5kb3cudG9wO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cblV0aWwuYXBwZW5kUXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgLy8gRGV0ZXJtaW5lIGRlbGltaXRlciBiYXNlZCBvbiBpZiB0aGUgVVJMIGFscmVhZHkgR0VUIHBhcmFtZXRlcnMgaW4gaXQuXG4gIHZhciBkZWxpbWl0ZXIgPSAodXJsLmluZGV4T2YoJz8nKSA8IDAgPyAnPycgOiAnJicpO1xuICB1cmwgKz0gZGVsaW1pdGVyICsga2V5ICsgJz0nICsgdmFsdWU7XG4gIHJldHVybiB1cmw7XG59O1xuXG4vLyBGcm9tIGh0dHA6Ly9nb28uZ2wvNFdYM3RnXG5VdGlsLmdldFF1ZXJ5UGFyYW1ldGVyID0gZnVuY3Rpb24obmFtZSkge1xuICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCB8fCB3aW5kb3cubWF0Y2hNZWRpYSgnKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJykubWF0Y2hlcyk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW5kcm9pZCBhbmQgaU9TIGNvbXBhdGlibGUgd2FrZWxvY2sgaW1wbGVtZW50YXRpb24uXG4gKlxuICogUmVmYWN0b3JlZCB0aGFua3MgdG8gZGtvdmFsZXZALlxuICovXG5mdW5jdGlvbiBBbmRyb2lkV2FrZUxvY2soKSB7XG4gIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG5cbiAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wbGF5KCk7XG4gIH0pO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh2aWRlby5wYXVzZWQpIHtcbiAgICAgIC8vIEJhc2U2NCB2ZXJzaW9uIG9mIHZpZGVvc19zcmMvbm8tc2xlZXAtNjBzLndlYm0uXG4gICAgICB2aWRlby5zcmMgPSBVdGlsLmJhc2U2NCgndmlkZW8vd2VibScsICdHa1hmb3dFQUFBQUFBQUFmUW9hQkFVTDNnUUZDOG9FRVF2T0JDRUtDaEhkbFltMUNoNEVDUW9XQkFoaFRnR2NCQUFBQUFBQUg0eEZObTNSQUxFMjdpMU9yaEJWSnFXWlRySUhmVGJ1TVU2dUVGbFN1YTFPc2dnRXdUYnVNVTZ1RUhGTzdhMU9zZ2dmRzdBRUFBQUFBQUFDa0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVZTYWxtQVFBQUFBQUFBRVVxMTdHREQwSkFUWUNOVEdGMlpqVTJMalF3TGpFd01WZEJqVXhoZG1ZMU5pNDBNQzR4TURGenBKQUdTSlRNYnNMcER0L3lTa2lwZ1gxZlJJbUlRTzFNQUFBQUFBQVdWSzVyQVFBQUFBQUFBRHV1QVFBQUFBQUFBRExYZ1FGenhZRUJuSUVBSXJXY2czVnVaSWFGVmw5V1VEbURnUUVqNDRPRU81cktBT0FCQUFBQUFBQUFCckNCc0xxQmtCOUR0blVCQUFBQUFBQUFvK2VCQUtPbWdRQUFnS0pKZzBJQUFWNEJIc0FIQklPRENvQUFDbUgyTUFBQVp4Z3o0ZFBTVEZpNUpBQ2psb0VENkFDbUFFQ1NuQUJNUUFBRFlBQUFXaTBxdW9DamxvRUgwQUNtQUVDU25BQk53QUFEWUFBQVdpMHF1b0NqbG9FTHVBQ21BRUNTbkFCTmdBQURZQUFBV2kwcXVvQ2psb0VQb0FDbUFFQ1NuQUJOWUFBRFlBQUFXaTBxdW9DamxvRVRpQUNtQUVDU25BQk5JQUFEWUFBQVdpMHF1b0FmUTdaMUFRQUFBQUFBQUpUbmdoZHdvNWFCQUFBQXBnQkFrcHdBVE9BQUEyQUFBRm90S3JxQW81YUJBK2dBcGdCQWtwd0FUTUFBQTJBQUFGb3RLcnFBbzVhQkI5QUFwZ0JBa3B3QVRJQUFBMkFBQUZvdEtycUFvNWFCQzdnQXBnQkFrcHdBVEVBQUEyQUFBRm90S3JxQW81YUJENkFBcGdEQWtwd0FRMkFBQTJBQUFGb3RLcnFBbzVhQkU0Z0FwZ0JBa3B3QVRDQUFBMkFBQUZvdEtycUFIME8yZFFFQUFBQUFBQUNVNTRJdTRLT1dnUUFBQUtZQVFKS2NBRXZBQUFOZ0FBQmFMU3E2Z0tPV2dRUG9BS1lBUUpLY0FFdGdBQU5nQUFCYUxTcTZnS09XZ1FmUUFLWUFRSktjQUVzQUFBTmdBQUJhTFNxNmdLT1dnUXU0QUtZQVFKS2NBRXFBQUFOZ0FBQmFMU3E2Z0tPV2dRK2dBS1lBUUpLY0FFb2dBQU5nQUFCYUxTcTZnS09XZ1JPSUFLWUFRSktjQUVuQUFBTmdBQUJhTFNxNmdCOUR0blVCQUFBQUFBQUFsT2VDUmxDamxvRUFBQUNtQUVDU25BQkpnQUFEWUFBQVdpMHF1b0NqbG9FRDZBQ21BRUNTbkFCSklBQURZQUFBV2kwcXVvQ2psb0VIMEFDbUFNQ1NuQUJEWUFBRFlBQUFXaTBxdW9DamxvRUx1QUNtQUVDU25BQkk0QUFEWUFBQVdpMHF1b0NqbG9FUG9BQ21BRUNTbkFCSW9BQURZQUFBV2kwcXVvQ2psb0VUaUFDbUFFQ1NuQUJJWUFBRFlBQUFXaTBxdW9BZlE3WjFBUUFBQUFBQUFKVG5nbDNBbzVhQkFBQUFwZ0JBa3B3QVNDQUFBMkFBQUZvdEtycUFvNWFCQStnQXBnQkFrcHdBU0FBQUEyQUFBRm90S3JxQW81YUJCOUFBcGdCQWtwd0FSOEFBQTJBQUFGb3RLcnFBbzVhQkM3Z0FwZ0JBa3B3QVI0QUFBMkFBQUZvdEtycUFvNWFCRDZBQXBnQkFrcHdBUjJBQUEyQUFBRm90S3JxQW81YUJFNGdBcGdCQWtwd0FSeUFBQTJBQUFGb3RLcnFBSDBPMmRRRUFBQUFBQUFDVTU0SjFNS09XZ1FBQUFLWUF3SktjQUVOZ0FBTmdBQUJhTFNxNmdLT1dnUVBvQUtZQVFKS2NBRWJnQUFOZ0FBQmFMU3E2Z0tPV2dRZlFBS1lBUUpLY0FFYWdBQU5nQUFCYUxTcTZnS09XZ1F1NEFLWUFRSktjQUVhQUFBTmdBQUJhTFNxNmdLT1dnUStnQUtZQVFKS2NBRVpBQUFOZ0FBQmFMU3E2Z0tPV2dST0lBS1lBUUpLY0FFWUFBQU5nQUFCYUxTcTZnQjlEdG5VQkFBQUFBQUFBbE9lQ2pLQ2psb0VBQUFDbUFFQ1NuQUJGNEFBRFlBQUFXaTBxdW9DamxvRUQ2QUNtQUVDU25BQkZ3QUFEWUFBQVdpMHF1b0NqbG9FSDBBQ21BRUNTbkFCRm9BQURZQUFBV2kwcXVvQ2psb0VMdUFDbUFFQ1NuQUJGZ0FBRFlBQUFXaTBxdW9DamxvRVBvQUNtQU1DU25BQkRZQUFEWUFBQVdpMHF1b0NqbG9FVGlBQ21BRUNTbkFCRllBQURZQUFBV2kwcXVvQWZRN1oxQVFBQUFBQUFBSlRuZ3FRUW81YUJBQUFBcGdCQWtwd0FSVUFBQTJBQUFGb3RLcnFBbzVhQkErZ0FwZ0JBa3B3QVJTQUFBMkFBQUZvdEtycUFvNWFCQjlBQXBnQkFrcHdBUlFBQUEyQUFBRm90S3JxQW81YUJDN2dBcGdCQWtwd0FSUUFBQTJBQUFGb3RLcnFBbzVhQkQ2QUFwZ0JBa3B3QVJPQUFBMkFBQUZvdEtycUFvNWFCRTRnQXBnQkFrcHdBUk1BQUEyQUFBRm90S3JxQUgwTzJkUUVBQUFBQUFBQ1U1NEs3Z0tPV2dRQUFBS1lBUUpLY0FFU2dBQU5nQUFCYUxTcTZnS09XZ1FQb0FLWUFRSktjQUVTQUFBTmdBQUJhTFNxNmdLT1dnUWZRQUtZQXdKS2NBRU5nQUFOZ0FBQmFMU3E2Z0tPV2dRdTRBS1lBUUpLY0FFUmdBQU5nQUFCYUxTcTZnS09XZ1ErZ0FLWUFRSktjQUVSQUFBTmdBQUJhTFNxNmdLT1dnUk9JQUtZQVFKS2NBRVFnQUFOZ0FBQmFMU3E2Z0I5RHRuVUJBQUFBQUFBQWxPZUMwdkNqbG9FQUFBQ21BRUNTbkFCRUlBQURZQUFBV2kwcXVvQ2psb0VENkFDbUFFQ1NuQUJFQUFBRFlBQUFXaTBxdW9DamxvRUgwQUNtQUVDU25BQkQ0QUFEWUFBQVdpMHF1b0NqbG9FTHVBQ21BRUNTbkFCRHdBQURZQUFBV2kwcXVvQ2psb0VQb0FDbUFFQ1NuQUJEb0FBRFlBQUFXaTBxdW9DamxvRVRpQUNtQUVDU25BQkRnQUFEWUFBQVdpMHF1b0FjVTd0ckFRQUFBQUFBQUJHN2o3T0JBTGVLOTRFQjhZSUJkL0NCQXc9PScpO1xuICAgICAgdmlkZW8ucGxheSgpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLnJlbGVhc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wYXVzZSgpO1xuICAgIHZpZGVvLnNyYyA9ICcnO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpT1NXYWtlTG9jaygpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICAgIHNldFRpbWVvdXQod2luZG93LnN0b3AsIDApO1xuICAgICAgfSwgMzAwMDApO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aW1lcikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0V2FrZUxvY2soKSB7XG4gIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICBpZiAodXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgdXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpKSB7XG4gICAgcmV0dXJuIGlPU1dha2VMb2NrO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBbmRyb2lkV2FrZUxvY2s7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRXYWtlTG9jaygpO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFdha2Vsb2NrID0gcmVxdWlyZSgnLi93YWtlbG9jay5qcycpO1xudmFyIENhcmRib2FyZERpc3RvcnRlciA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLWRpc3RvcnRlci5qcycpO1xudmFyIE1vZGVzID0gcmVxdWlyZSgnLi9tb2Rlcy5qcycpO1xudmFyIFJvdGF0ZUluc3RydWN0aW9ucyA9IHJlcXVpcmUoJy4vcm90YXRlLWluc3RydWN0aW9ucy5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBCdXR0b25NYW5hZ2VyID0gcmVxdWlyZSgnLi9idXR0b24tbWFuYWdlci5qcycpO1xuXG4vKipcbiAqIEhlbHBlciBmb3IgZ2V0dGluZyBpbiBhbmQgb3V0IG9mIFZSIG1vZGUuXG4gKiBIZXJlIHdlIGFzc3VtZSBWUiBtb2RlID09IGZ1bGwgc2NyZWVuIG1vZGUuXG4gKlxuICogMS4gRGV0ZWN0cyB3aGV0aGVyIG9yIG5vdCBWUiBtb2RlIGlzIHBvc3NpYmxlIGJ5IGZlYXR1cmUgZGV0ZWN0aW5nIGZvclxuICogV2ViVlIgKG9yIHBvbHlmaWxsKS5cbiAqXG4gKiAyLiBJZiBXZWJWUiBpcyBhdmFpbGFibGUsIHNob3dzIGEgYnV0dG9uIHRoYXQgbGV0cyB5b3UgZW50ZXIgVlIgbW9kZS5cbiAqXG4gKiAzLiBQcm92aWRlcyBDYXJkYm9hcmQtc3R5bGUgZGlzdG9ydGlvbiBpZiB0aGUgd2VidnItcG9seWZpbGwgaXMgYmVpbmcgdXNlZC5cbiAqXG4gKiA0LiBQcm92aWRlcyBiZXN0IHByYWN0aWNlcyB3aGlsZSBpbiBWUiBtb2RlLlxuICogLSBGdWxsIHNjcmVlblxuICogLSBXYWtlIGxvY2tcbiAqIC0gT3JpZW50YXRpb24gbG9jayAobW9iaWxlIG9ubHkpXG4gKi9cbmZ1bmN0aW9uIFdlYlZSTWFuYWdlcihyZW5kZXJlciwgZWZmZWN0LCBwYXJhbXMpIHtcbiAgdGhpcy5wYXJhbXMgPSBwYXJhbXMgfHwge307XG5cbiAgdGhpcy5tb2RlID0gTW9kZXMuVU5LTk9XTjtcblxuICAvLyBTZXQgb3B0aW9uIHRvIGhpZGUgdGhlIGJ1dHRvbi5cbiAgdmFyIGhpZGVCdXR0b24gPSB0aGlzLnBhcmFtcy5oaWRlQnV0dG9uIHx8IGZhbHNlO1xuXG4gIC8vIFNhdmUgdGhlIFRIUkVFLmpzIHJlbmRlcmVyIGFuZCBlZmZlY3QgZm9yIGxhdGVyLlxuICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gIHRoaXMuZWZmZWN0ID0gZWZmZWN0O1xuICB0aGlzLmRpc3RvcnRlciA9IG5ldyBDYXJkYm9hcmREaXN0b3J0ZXIocmVuZGVyZXIpO1xuICB0aGlzLmJ1dHRvbiA9IG5ldyBCdXR0b25NYW5hZ2VyKCk7XG4gIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zID0gbmV3IFJvdGF0ZUluc3RydWN0aW9ucygpO1xuXG4gIHRoaXMuaXNWUkNvbXBhdGlibGUgPSBmYWxzZTtcbiAgdGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCA9ICEhVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignbm9fZnVsbHNjcmVlbicpO1xuXG4gIGlmIChoaWRlQnV0dG9uKSB7XG4gICAgdGhpcy5idXR0b24uc2V0VmlzaWJpbGl0eShmYWxzZSk7XG4gIH1cblxuICAvLyBDaGVjayBpZiB0aGUgYnJvd3NlciBpcyBjb21wYXRpYmxlIHdpdGggV2ViVlIuXG4gIHRoaXMuZ2V0RGV2aWNlQnlUeXBlXyhITURWUkRldmljZSkudGhlbihmdW5jdGlvbihobWQpIHtcbiAgICAvLyBBY3RpdmF0ZSBlaXRoZXIgVlIgb3IgSW1tZXJzaXZlIG1vZGUuXG4gICAgaWYgKHdpbmRvdy5XRUJWUl9GT1JDRV9ESVNUT1JUSU9OKSB7XG4gICAgICB0aGlzLmRpc3RvcnRlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICB0aGlzLmlzVlJDb21wYXRpYmxlID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGhtZCkge1xuICAgICAgdGhpcy5pc1ZSQ29tcGF0aWJsZSA9IHRydWU7XG4gICAgICAvLyBPbmx5IGVuYWJsZSBkaXN0b3J0aW9uIGlmIHdlIGFyZSBkZWFsaW5nIHVzaW5nIHRoZSBwb2x5ZmlsbCBhbmQgdGhpcyBpcyBpT1MuXG4gICAgICBpZiAoaG1kLmRldmljZU5hbWUuaW5kZXhPZignd2VidnItcG9seWZpbGwnKSA9PSAwICYmIFV0aWwuaXNJT1MoKSkge1xuICAgICAgICB0aGlzLmRpc3RvcnRlci5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFNldCB0aGUgcmlnaHQgbW9kZS5cbiAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgdGhpcy5ub3JtYWxUb01hZ2ljV2luZG93KCk7XG4gICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk1BR0lDX1dJTkRPVyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTk9STUFMKTtcbiAgICB9XG4gICAgdGhpcy5idXR0b24ub24oJ2ZzJywgdGhpcy5vbkZTQ2xpY2tfLmJpbmQodGhpcykpO1xuICAgIHRoaXMuYnV0dG9uLm9uKCd2cicsIHRoaXMub25WUkNsaWNrXy5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmJ1dHRvbi5vbignYmFjaycsIHRoaXMub25CYWNrQ2xpY2tfLmJpbmQodGhpcykpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIC8vIFNhdmUgdGhlIGlucHV0IGRldmljZSBmb3IgbGF0ZXIgc2VuZGluZyB0aW1pbmcgZGF0YS5cbiAgdGhpcy5nZXREZXZpY2VCeVR5cGVfKFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UpLnRoZW4oZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgLy8gV2hlbmV2ZXIgd2UgZW50ZXIgZnVsbHNjcmVlbiwgd2UgYXJlIGVudGVyaW5nIFZSIG9yIGltbWVyc2l2ZSBtb2RlLlxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgIHRoaXMub25GdWxsc2NyZWVuQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsXG4gICAgICB0aGlzLm9uRnVsbHNjcmVlbkNoYW5nZV8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsXG4gICAgICB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJyxcbiAgICAgIHRoaXMub25SZXNpemVDaGFuZ2VfLmJpbmQodGhpcykpO1xuXG4gIC8vIENyZWF0ZSB0aGUgbmVjZXNzYXJ5IGVsZW1lbnRzIGZvciB3YWtlIGxvY2sgdG8gd29yay5cbiAgdGhpcy53YWtlbG9jayA9IG5ldyBXYWtlbG9jaygpO1xufVxuXG4vKipcbiAqIFByb21pc2UgcmV0dXJucyB0cnVlIGlmIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBITUQgZGV2aWNlIGF2YWlsYWJsZS5cbiAqL1xuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5nZXREZXZpY2VCeVR5cGVfID0gZnVuY3Rpb24odHlwZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgbmF2aWdhdG9yLmdldFZSRGV2aWNlcygpLnRoZW4oZnVuY3Rpb24oZGV2aWNlcykge1xuICAgICAgLy8gUHJvbWlzZSBzdWNjZWVkcywgYnV0IGNoZWNrIGlmIHRoZXJlIGFyZSBhbnkgZGV2aWNlcyBhY3R1YWxseS5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGV2aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGV2aWNlc1tpXSBpbnN0YW5jZW9mIHR5cGUpIHtcbiAgICAgICAgICByZXNvbHZlKGRldmljZXNbaV0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXNvbHZlKG51bGwpO1xuICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gTm8gZGV2aWNlcyBhcmUgZm91bmQuXG4gICAgICByZXNvbHZlKG51bGwpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuaXNWUk1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMubW9kZSA9PSBNb2Rlcy5WUjtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGNhbWVyYSwgdGltZXN0YW1wKSB7XG4gIHRoaXMucmVzaXplSWZOZWVkZWRfKGNhbWVyYSk7XG5cbiAgaWYgKHRoaXMuaXNWUk1vZGUoKSkge1xuICAgIHRoaXMuZGlzdG9ydGVyLnByZVJlbmRlcigpO1xuICAgIHRoaXMuZWZmZWN0LnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICB0aGlzLmRpc3RvcnRlci5wb3N0UmVuZGVyKCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gU2NlbmUgbWF5IGJlIGFuIGFycmF5IG9mIHR3byBzY2VuZXMsIG9uZSBmb3IgZWFjaCBleWUuXG4gICAgaWYgKHNjZW5lIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHNjZW5lWzBdLCBjYW1lcmEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICB9XG4gIH1cbn07XG5cblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5zZXRNb2RlXyA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgY29uc29sZS5sb2coJ01vZGUgY2hhbmdlOiAlcyA9PiAlcycsIHRoaXMubW9kZSwgbW9kZSk7XG4gIHRoaXMubW9kZSA9IG1vZGU7XG4gIHRoaXMuYnV0dG9uLnNldE1vZGUobW9kZSwgdGhpcy5pc1ZSQ29tcGF0aWJsZSk7XG5cbiAgaWYgKHRoaXMubW9kZSA9PSBNb2Rlcy5WUiAmJiBVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgLy8gSW4gbGFuZHNjYXBlIG1vZGUsIHRlbXBvcmFyaWx5IHNob3cgdGhlIFwicHV0IGludG8gQ2FyZGJvYXJkXCJcbiAgICAvLyBpbnRlcnN0aXRpYWwuIE90aGVyd2lzZSwgZG8gdGhlIGRlZmF1bHQgdGhpbmcuXG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnMuc2hvd1RlbXBvcmFyaWx5KDMwMDApO1xuICB9IGVsc2Uge1xuICAgIHRoaXMudXBkYXRlUm90YXRlSW5zdHJ1Y3Rpb25zXygpO1xuICB9XG59O1xuXG4vKipcbiAqIE1haW4gYnV0dG9uIHdhcyBjbGlja2VkLlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uRlNDbGlja18gPSBmdW5jdGlvbigpIHtcbiAgc3dpdGNoICh0aGlzLm1vZGUpIHtcbiAgICBjYXNlIE1vZGVzLk5PUk1BTDpcbiAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGhhY2sgd2hlbiBpT1MgaGFzIGZ1bGxzY3JlZW4gbW9kZS5cbiAgICAgIC8vIElmIHRoaXMgaXMgYW4gaWZyYW1lIG9uIGlPUywgYnJlYWsgb3V0IGFuZCBvcGVuIGluIG5vX2Z1bGxzY3JlZW4gbW9kZS5cbiAgICAgIGlmIChVdGlsLmlzSU9TKCkgJiYgVXRpbC5pc0lGcmFtZSgpKSB7XG4gICAgICAgIHZhciB1cmwgPSBVdGlsLmFwcGVuZFF1ZXJ5UGFyYW1ldGVyKCdub19mdWxsc2NyZWVuJywgJ3RydWUnKTtcbiAgICAgICAgdG9wLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMubm9ybWFsVG9NYWdpY1dpbmRvdygpO1xuICAgICAgdGhpcy5zZXRNb2RlXyhNb2Rlcy5NQUdJQ19XSU5ET1cpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFueU1vZGVUb05vcm1hbCgpO1xuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxufTtcblxuLyoqXG4gKlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uVlJDbGlja18gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5hbnlNb2RlVG9WUigpO1xuICB0aGlzLnNldE1vZGVfKE1vZGVzLlZSKTtcbn07XG5cbi8qKlxuICogQmFjayBidXR0b24gd2FzIGNsaWNrZWQuXG4gKi9cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25CYWNrQ2xpY2tfID0gZnVuY3Rpb24oKSB7XG4gIHN3aXRjaCAodGhpcy5tb2RlKSB7XG4gICAgY2FzZSBNb2Rlcy5NQUdJQ19XSU5ET1c6XG4gICAgICBpZiAodGhpcy5pc0Z1bGxzY3JlZW5EaXNhYmxlZCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFueU1vZGVUb05vcm1hbCgpO1xuICAgICAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIE1vZGVzLlZSOlxuICAgICAgdGhpcy52clRvTWFnaWNXaW5kb3coKTtcbiAgICAgIHRoaXMuc2V0TW9kZV8oTW9kZXMuTUFHSUNfV0lORE9XKTtcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuXG4vKipcbiAqXG4gKiBNZXRob2RzIHRvIGdvIGJldHdlZW4gbW9kZXMuXG4gKlxuICovXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm5vcm1hbFRvTWFnaWNXaW5kb3cgPSBmdW5jdGlvbigpIHtcbiAgLy8gVE9ETzogUmUtZW5hYmxlIHBvaW50ZXIgbG9jayBhZnRlciBkZWJ1Z2dpbmcuXG4gIC8vdGhpcy5yZXF1ZXN0UG9pbnRlckxvY2tfKCk7XG4gIHRoaXMucmVxdWVzdEZ1bGxzY3JlZW5fKCk7XG4gIHRoaXMud2FrZWxvY2sucmVxdWVzdCgpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5hbnlNb2RlVG9WUiA9IGZ1bmN0aW9uKCkge1xuICAvLyBEb24ndCBkbyBvcmllbnRhdGlvbiBsb2NraW5nIGZvciBjb25zaXN0ZW5jeS5cbiAgLy90aGlzLnJlcXVlc3RPcmllbnRhdGlvbkxvY2tfKCk7XG4gIHRoaXMucmVxdWVzdEZ1bGxzY3JlZW5fKCk7XG4gIC8vdGhpcy5lZmZlY3Quc2V0RnVsbFNjcmVlbih0cnVlKTtcbiAgdGhpcy53YWtlbG9jay5yZXF1ZXN0KCk7XG4gIHRoaXMuZGlzdG9ydGVyLnBhdGNoKCk7XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnZyVG9NYWdpY1dpbmRvdyA9IGZ1bmN0aW9uKCkge1xuICAvL3RoaXMucmVsZWFzZU9yaWVudGF0aW9uTG9ja18oKTtcbiAgdGhpcy5kaXN0b3J0ZXIudW5wYXRjaCgpO1xuXG4gIC8vIEFuZHJvaWQgYnVnOiB3aGVuIHJldHVybmluZyBmcm9tIFZSLCByZXNpemUgdGhlIGVmZmVjdC5cbiAgdGhpcy5yZXNpemVfKCk7XG59XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUuYW55TW9kZVRvTm9ybWFsID0gZnVuY3Rpb24oKSB7XG4gIC8vdGhpcy5lZmZlY3Quc2V0RnVsbFNjcmVlbihmYWxzZSk7XG4gIHRoaXMuZXhpdEZ1bGxzY3JlZW5fKCk7XG4gIC8vdGhpcy5yZWxlYXNlT3JpZW50YXRpb25Mb2NrXygpO1xuICB0aGlzLnJlbGVhc2VQb2ludGVyTG9ja18oKTtcbiAgdGhpcy53YWtlbG9jay5yZWxlYXNlKCk7XG4gIHRoaXMuZGlzdG9ydGVyLnVucGF0Y2goKTtcblxuICAvLyBBbmRyb2lkIGJ1Zzogd2hlbiByZXR1cm5pbmcgZnJvbSBWUiwgcmVzaXplIHRoZSBlZmZlY3QuXG4gIHRoaXMucmVzaXplXygpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5yZXNpemVJZk5lZWRlZF8gPSBmdW5jdGlvbihjYW1lcmEpIHtcbiAgLy8gT25seSByZXNpemUgdGhlIGNhbnZhcyBpZiBpdCBuZWVkcyB0byBiZSByZXNpemVkLlxuICB2YXIgc2l6ZSA9IHRoaXMucmVuZGVyZXIuZ2V0U2l6ZSgpO1xuICBpZiAoc2l6ZS53aWR0aCAhPSB3aW5kb3cuaW5uZXJXaWR0aCB8fCBzaXplLmhlaWdodCAhPSB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICBjYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICB0aGlzLnJlc2l6ZV8oKVxuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlc2l6ZV8gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5lZmZlY3Quc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUub25PcmllbnRhdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMudXBkYXRlUm90YXRlSW5zdHJ1Y3Rpb25zXygpO1xufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5vblJlc2l6ZUNoYW5nZV8gPSBmdW5jdGlvbigpIHtcbiAgLy8gRmlyZWZveCBkb2VzIG5vdCB5ZXQgc3VwcG9ydCBvcmllbnRhdGlvbmNoYW5nZSBldmVudHMsIHNvIHdlIGxvb2sgYXQgdGhlIE1lZGlhUXVlcnlMaXN0XG4gIC8vIG9iamVjdCB0byBkZXRlY3Qgd2hldGhlciB0aGUgZGV2aWNlIGlzIGluIGxhbmRzY2FwZSBvciBwb3J0cmFpdCBvcmllbnRhdGlvbi5cbiAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9OTIwNzM0XG4gIGlmICh3aW5kb3cubWF0Y2hNZWRpYSgnKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJykubWF0Y2hlcykge1xuICAgIHRoaXMudXBkYXRlUm90YXRlSW5zdHJ1Y3Rpb25zXygpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnVwZGF0ZVJvdGF0ZUluc3RydWN0aW9uc18gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnMuZGlzYWJsZVNob3dUZW1wb3JhcmlseSgpO1xuICAvLyBJbiBwb3J0cmFpdCBWUiBtb2RlLCB0ZWxsIHRoZSB1c2VyIHRvIHJvdGF0ZSB0byBsYW5kc2NhcGUuXG4gIGlmICh0aGlzLm1vZGUgPT0gTW9kZXMuVlIgJiYgIVV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9ucy5zaG93KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnMuaGlkZSgpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLm9uRnVsbHNjcmVlbkNoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIElmIHdlIGxlYXZlIGZ1bGwtc2NyZWVuLCBnbyBiYWNrIHRvIG5vcm1hbCBtb2RlLlxuICBpZiAoZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgPT09IG51bGwgfHxcbiAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBudWxsKSB7XG4gICAgdGhpcy5hbnlNb2RlVG9Ob3JtYWwoKTtcbiAgICB0aGlzLnNldE1vZGVfKE1vZGVzLk5PUk1BTCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVxdWVzdFBvaW50ZXJMb2NrXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FudmFzID0gdGhpcy5yZW5kZXJlci5kb21FbGVtZW50O1xuICBjYW52YXMucmVxdWVzdFBvaW50ZXJMb2NrID0gY2FudmFzLnJlcXVlc3RQb2ludGVyTG9jayB8fFxuICAgICAgY2FudmFzLm1velJlcXVlc3RQb2ludGVyTG9jayB8fFxuICAgICAgY2FudmFzLndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcblxuICBpZiAoY2FudmFzLnJlcXVlc3RQb2ludGVyTG9jaykge1xuICAgIGNhbnZhcy5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5yZWxlYXNlUG9pbnRlckxvY2tfID0gZnVuY3Rpb24oKSB7XG4gIGRvY3VtZW50LmV4aXRQb2ludGVyTG9jayA9IGRvY3VtZW50LmV4aXRQb2ludGVyTG9jayB8fFxuICAgICAgZG9jdW1lbnQubW96RXhpdFBvaW50ZXJMb2NrIHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRFeGl0UG9pbnRlckxvY2s7XG5cbiAgaWYgKGRvY3VtZW50LmV4aXRQb2ludGVyTG9jaykge1xuICAgIGRvY3VtZW50LmV4aXRQb2ludGVyTG9jaygpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlcXVlc3RPcmllbnRhdGlvbkxvY2tfID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzY3JlZW4ub3JpZW50YXRpb24gJiYgVXRpbC5pc01vYmlsZSgpKSB7XG4gICAgc2NyZWVuLm9yaWVudGF0aW9uLmxvY2soJ2xhbmRzY2FwZScpO1xuICB9XG59O1xuXG5XZWJWUk1hbmFnZXIucHJvdG90eXBlLnJlbGVhc2VPcmllbnRhdGlvbkxvY2tfID0gZnVuY3Rpb24oKSB7XG4gIGlmIChzY3JlZW4ub3JpZW50YXRpb24pIHtcbiAgICBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKCk7XG4gIH1cbn07XG5cbldlYlZSTWFuYWdlci5wcm90b3R5cGUucmVxdWVzdEZ1bGxzY3JlZW5fID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5ib2R5O1xuICAvL3ZhciBjYW52YXMgPSB0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gIGlmIChjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBjYW52YXMubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBjYW52YXMud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfVxufTtcblxuV2ViVlJNYW5hZ2VyLnByb3RvdHlwZS5leGl0RnVsbHNjcmVlbl8gPSBmdW5jdGlvbigpIHtcbiAgaWYgKGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJWUk1hbmFnZXI7XG4iXX0=

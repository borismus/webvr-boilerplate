var DeviceInfo = require('./device-info.js');

var BarrelDistortion = {
  uniforms: {
    "tDiffuse":   { type: "t", value: null },
    "distortion": { type: "v2", value: new THREE.Vector2(0.441, 0.156) },
    "background": { type: "v4", value: new THREE.Vector4(1.0, 0.0, 0.0, 1.0) },
  },

  vertexShader: [
    "varying vec2 vUV;",

    "void main() {",
      "vUV = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"

  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",

    "uniform vec2 distortion;",
    "uniform vec4 background;",

    "varying vec2 vUV;",

    "float poly(float val) {",
      "return 1.0 + (distortion.x + distortion.y * val) * val;",
    "}",

    "vec2 barrel(vec2 v) {",
      "vec2 w = v - vec2(0.5, 0.5);",
      "return poly(dot(w, w)) * w + vec2(0.5, 0.5);",
    "}",

    "void main() {",
      "vec2 a = barrel(vec2(vUV.x < 0.5 ? vUV.x / 0.5 : (vUV.x - 0.5) / 0.5, vUV.y));",
      "if (a.x < 0.0 || a.x > 1.0 || a.y < 0.0 || a.y > 1.0) {",
        "gl_FragColor = background;",
      "} else {",
        "gl_FragColor = texture2D(tDiffuse, vec2(vUV.x < 0.5 ? a.x * 0.5 : a.x * 0.5 + 0.5, a.y));",
      "}",
    "}"

  ].join("\n")
};


var ShaderPass = function (shader) {
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
                    stencilBuffer: false};

  return new THREE.WebGLRenderTarget(width, height, parameters);
}

function CardboardDistorter(renderer) {
  var shaderPass = new ShaderPass(BarrelDistortion);

  var textureTarget = null;
  var genuineRender = renderer.render;
  var genuineSetSize = renderer.setSize;

  this.patch = function() {
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
    renderer.render = genuineRender;
    renderer.setSize = genuineSetSize;
  }

  this.preRender = function() {
    renderer.setRenderTarget(textureTarget);
  }

  this.postRender = function() {
    var size = renderer.getSize();
    renderer.setViewport(0, 0, size.width, size.height);
    shaderPass.render(genuineRender.bind(renderer), textureTarget);
  }
}

module.exports = CardboardDistorter;

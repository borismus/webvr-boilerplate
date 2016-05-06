THREE.NormalShader = {

  shaderID: "normal",

    uniforms: THREE.UniformsUtils.merge( [
      THREE.UniformsLib[ "bumpmap" ],
      THREE.UniformsLib[ "normalmap" ],
      {

      }
   ] ),

    vertexShader: [

      THREE.ShaderChunk[ "common" ],
      THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
      THREE.ShaderChunk[ "skinning_pars_vertex" ],
      //THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],

      "varying vec3 vPosition;",
      "varying vec3 vNormal;",

      "void main() {",

        THREE.ShaderChunk[ "morphnormal_vertex" ],
        THREE.ShaderChunk[ "skinbase_vertex" ],
        THREE.ShaderChunk[ "skinnormal_vertex" ],
        THREE.ShaderChunk[ "defaultnormal_vertex" ],
        THREE.ShaderChunk[ "morphtarget_vertex" ],
        THREE.ShaderChunk[ "skinning_vertex" ],
        THREE.ShaderChunk[ "default_vertex" ],

        "vNormal = normalize( transformedNormal );",
        "vPosition = -mvPosition.xyz;",

      "}"

    ].join("\n"),

    fragmentShader: [

      "#include <common>",
      "#include <logdepthbuf_pars_fragment>",
      "#include <bumpmap_pars_fragment>",
      "#include <normalmap_pars_fragment>",
      "#include <packing>",

      "varying vec3 vPosition;",
      "varying vec3 vNormal;",

      "void main() {",

        "#ifdef USE_NORMALMAP",

          "normal = perturbNormal2Arb( -vPosition, normal );",

        "#endif",

        "#if defined( USE_BUMPMAP )",

          "normal = perturbNormalArb( -vPosition, normal, dHdxy_fwd() );",

        "#endif",

        "vec3 normal = vNormal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );",

        "gl_FragColor = packNormalToRGBA( normal );",

      "}"

    ].join("\n")

  };

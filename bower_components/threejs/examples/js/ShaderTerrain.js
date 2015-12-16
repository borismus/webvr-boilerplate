/**
 * @author alteredq / http://alteredqualia.com/
 *
 */

THREE.ShaderTerrain = {

	/* -------------------------------------------------------------------------
	//	Dynamic terrain shader
	//		- Blinn-Phong
	//		- height + normal + diffuse1 + diffuse2 + specular + detail maps
	//		- point, directional and hemisphere lights (use with "lights: true" material option)
	//		- shadow maps receiving
	 ------------------------------------------------------------------------- */

	'terrain' : {

		uniforms: THREE.UniformsUtils.merge( [

			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],

			{

				"enableDiffuse1"  : { type: "i", value: 0 },
				"enableDiffuse2"  : { type: "i", value: 0 },
				"enableSpecular"  : { type: "i", value: 0 },
				"enableReflection": { type: "i", value: 0 },

				"tDiffuse1"	   : { type: "t", value: null },
				"tDiffuse2"	   : { type: "t", value: null },
				"tDetail"	   : { type: "t", value: null },
				"tNormal"	   : { type: "t", value: null },
				"tSpecular"	   : { type: "t", value: null },
				"tDisplacement": { type: "t", value: null },

				"uNormalScale": { type: "f", value: 1.0 },

				"uDisplacementBias": { type: "f", value: 0.0 },
				"uDisplacementScale": { type: "f", value: 1.0 },

				"diffuse": { type: "c", value: new THREE.Color( 0xeeeeee ) },
				"specular": { type: "c", value: new THREE.Color( 0x111111 ) },
				"shininess": { type: "f", value: 30 },
				"opacity": { type: "f", value: 1 },

				"uRepeatBase"    : { type: "v2", value: new THREE.Vector2( 1, 1 ) },
				"uRepeatOverlay" : { type: "v2", value: new THREE.Vector2( 1, 1 ) },

				"uOffset" : { type: "v2", value: new THREE.Vector2( 0, 0 ) }

			}

		] ),

		fragmentShader: [

			"uniform vec3 diffuse;",
			"uniform vec3 specular;",
			"uniform float shininess;",
			"uniform float opacity;",

			"uniform bool enableDiffuse1;",
			"uniform bool enableDiffuse2;",
			"uniform bool enableSpecular;",

			"uniform sampler2D tDiffuse1;",
			"uniform sampler2D tDiffuse2;",
			"uniform sampler2D tDetail;",
			"uniform sampler2D tNormal;",
			"uniform sampler2D tSpecular;",
			"uniform sampler2D tDisplacement;",

			"uniform float uNormalScale;",

			"uniform vec2 uRepeatOverlay;",
			"uniform vec2 uRepeatBase;",

			"uniform vec2 uOffset;",

			"varying vec3 vTangent;",
			"varying vec3 vBinormal;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"uniform vec3 ambientLightColor;",

			"#if MAX_DIR_LIGHTS > 0",

				"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];",
				"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];",

			"#endif",

			"#if MAX_HEMI_LIGHTS > 0",

				"uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];",
				"uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];",

			"#endif",

			"#if MAX_POINT_LIGHTS > 0",

				"uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];",
				"uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];",
				"uniform float pointLightDistance[ MAX_POINT_LIGHTS ];",
				"uniform float pointLightDecay[ MAX_POINT_LIGHTS ];",

			"#endif",

			"varying vec3 vViewPosition;",

			THREE.ShaderChunk[ "common" ],
			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
			THREE.ShaderChunk[ "fog_pars_fragment" ],

			"void main() {",

				"vec3 outgoingLight = vec3( 0.0 );",	// outgoing light does not have an alpha, the surface does
				"vec4 diffuseColor = vec4( diffuse, opacity );",

				"vec3 specularTex = vec3( 1.0 );",

				"vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;",
				"vec2 uvBase = uRepeatBase * vUv;",

				"vec3 normalTex = texture2D( tDetail, uvOverlay ).xyz * 2.0 - 1.0;",
				"normalTex.xy *= uNormalScale;",
				"normalTex = normalize( normalTex );",

				"if( enableDiffuse1 && enableDiffuse2 ) {",

					"vec4 colDiffuse1 = texture2D( tDiffuse1, uvOverlay );",
					"vec4 colDiffuse2 = texture2D( tDiffuse2, uvOverlay );",

					"colDiffuse1.xyz = inputToLinear( colDiffuse1.xyz );",
					"colDiffuse2.xyz = inputToLinear( colDiffuse2.xyz );",

					"diffuseColor *= mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) );",

				" } else if( enableDiffuse1 ) {",

					"diffuseColor *= texture2D( tDiffuse1, uvOverlay );",

				"} else if( enableDiffuse2 ) {",

					"diffuseColor *= texture2D( tDiffuse2, uvOverlay );",

				"}",

				"if( enableSpecular )",
					"specularTex = texture2D( tSpecular, uvOverlay ).xyz;",

				"mat3 tsb = mat3( vTangent, vBinormal, vNormal );",
				"vec3 finalNormal = tsb * normalTex;",

				"vec3 normal = normalize( finalNormal );",
				"vec3 viewPosition = normalize( vViewPosition );",

				"vec3 totalDiffuseLight = vec3( 0.0 );",
				"vec3 totalSpecularLight = vec3( 0.0 );",

				// point lights

				"#if MAX_POINT_LIGHTS > 0",

					"for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {",

						"vec3 lVector = pointLightPosition[ i ] + vViewPosition.xyz;",

						"float attenuation = calcLightAttenuation( length( lVector ), pointLightDistance[ i ], pointLightDecay[i] );",

						"lVector = normalize( lVector );",

						"vec3 pointHalfVector = normalize( lVector + viewPosition );",

						"float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
						"float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );",

						"float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );",

						"totalDiffuseLight += attenuation * pointLightColor[ i ] * pointDiffuseWeight;",
						"totalSpecularLight += attenuation * pointLightColor[ i ] * specular * pointSpecularWeight * pointDiffuseWeight;",

					"}",

				"#endif",

				// directional lights

				"#if MAX_DIR_LIGHTS > 0",

					"vec3 dirDiffuse = vec3( 0.0 );",
					"vec3 dirSpecular = vec3( 0.0 );",

					"for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {",

						"vec3 dirVector = directionalLightDirection[ i ];",
						"vec3 dirHalfVector = normalize( dirVector + viewPosition );",

						"float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
						"float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );",

						"float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );",

						"totalDiffuseLight += directionalLightColor[ i ] * dirDiffuseWeight;",
						"totalSpecularLight += directionalLightColor[ i ] * specular * dirSpecularWeight * dirDiffuseWeight;",

					"}",

				"#endif",

				// hemisphere lights

				"#if MAX_HEMI_LIGHTS > 0",

					"vec3 hemiDiffuse  = vec3( 0.0 );",
					"vec3 hemiSpecular = vec3( 0.0 );",

					"for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {",

						"vec3 lVector = hemisphereLightDirection[ i ];",

						// diffuse

						"float dotProduct = dot( normal, lVector );",
						"float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",

						"totalDiffuseLight += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );",

						// specular (sky light)

						"float hemiSpecularWeight = 0.0;",

						"vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );",
						"float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;",
						"hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );",

						// specular (ground light)

						"vec3 lVectorGround = -lVector;",

						"vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );",
						"float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;",
						"hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );",

						"totalSpecularLight += specular * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight ) * hemiSpecularWeight * hemiDiffuseWeight;",

					"}",

				"#endif",

				"outgoingLight += diffuseColor.xyz * ( totalDiffuseLight + ambientLightColor + totalSpecularLight );",

				THREE.ShaderChunk[ "shadowmap_fragment" ],
				THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
				THREE.ShaderChunk[ "fog_fragment" ],

				"gl_FragColor = vec4( outgoingLight, diffuseColor.a );",	// TODO, this should be pre-multiplied to allow for bright highlights on very transparent objects

			"}"

		].join( "\n" ),

		vertexShader: [

			"attribute vec4 tangent;",

			"uniform vec2 uRepeatBase;",

			"uniform sampler2D tNormal;",

			"#ifdef VERTEX_TEXTURES",

				"uniform sampler2D tDisplacement;",
				"uniform float uDisplacementScale;",
				"uniform float uDisplacementBias;",

			"#endif",

			"varying vec3 vTangent;",
			"varying vec3 vBinormal;",
			"varying vec3 vNormal;",
			"varying vec2 vUv;",

			"varying vec3 vViewPosition;",

			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

			"void main() {",

				"vNormal = normalize( normalMatrix * normal );",

				// tangent and binormal vectors

				"vTangent = normalize( normalMatrix * tangent.xyz );",

				"vBinormal = cross( vNormal, vTangent ) * tangent.w;",
				"vBinormal = normalize( vBinormal );",

				// texture coordinates

				"vUv = uv;",

				"vec2 uvBase = uv * uRepeatBase;",

				// displacement mapping

				"#ifdef VERTEX_TEXTURES",

					"vec3 dv = texture2D( tDisplacement, uvBase ).xyz;",
					"float df = uDisplacementScale * dv.x + uDisplacementBias;",
					"vec3 displacedPosition = normal * df + position;",

					"vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );",
					"vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );",

				"#else",

					"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
					"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

				"#endif",

				"gl_Position = projectionMatrix * mvPosition;",

				"vViewPosition = -mvPosition.xyz;",

				"vec3 normalTex = texture2D( tNormal, uvBase ).xyz * 2.0 - 1.0;",
				"vNormal = normalMatrix * normalTex;",

				THREE.ShaderChunk[ "shadowmap_vertex" ],

			"}"

		].join( "\n" )

	}

};

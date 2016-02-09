(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {"arrow.position": "uniform float worldUnit;\nuniform float lineDepth;\nuniform float lineWidth;\nuniform float focusDepth;\n\nuniform vec4 geometryClip;\nuniform float arrowSize;\nuniform float arrowSpace;\n\nattribute vec4 position4;\nattribute vec3 arrow;\nattribute vec2 attach;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvoid getArrowGeometry(vec4 xyzw, float near, float far, out vec3 left, out vec3 right, out vec3 start) {\n  right = getPosition(xyzw, 1.0);\n  left  = getPosition(vec4(near, xyzw.yzw), 0.0);\n  start = getPosition(vec4(far, xyzw.yzw), 0.0);\n}\n\nmat4 getArrowMatrix(vec3 left, vec3 right, vec3 start) {\n\n  float depth = focusDepth;\n  if (lineDepth < 1.0) {\n    // Depth blending\n    float z = max(0.00001, -right.z);\n    depth = mix(z, focusDepth, lineDepth);\n  }\n    \n  vec3 diff = left - right;\n  float l = length(diff);\n  if (l == 0.0) {\n    return mat4(1.0, 0.0, 0.0, 0.0,\n                0.0, 1.0, 0.0, 0.0,\n                0.0, 0.0, 1.0, 0.0,\n                0.0, 0.0, 0.0, 1.0);\n  }\n\n  // Construct TBN matrix around shaft\n  vec3 t = normalize(diff);\n  vec3 n = normalize(cross(t, t.yzx + vec3(.1, .2, .3)));\n  vec3 b = cross(n, t);\n  \n  // Shrink arrows when vector gets too small\n  // Approach linear scaling with cubic ease the smaller we get\n  float size = arrowSize * lineWidth * worldUnit * depth * 1.25;\n  diff = right - start;\n  l = length(diff) * arrowSpace;\n  float mini = clamp(1.0 - l / size * .333, 0.0, 1.0);\n  float scale = 1.0 - mini * mini * mini;\n  float range = size * scale;\n  \n  // Size to 2.5:1 ratio\n  float rangeNB = range / 2.5;\n\n  // Anchor at end position\n  return mat4(vec4(n * rangeNB,  0),\n              vec4(b * rangeNB,  0),\n              vec4(t * range, 0),\n              vec4(right,  1.0));\n}\n\nvec3 getArrowPosition() {\n  vec3 left, right, start;\n  \n  vec4 p = min(geometryClip, position4);\n  \n  getArrowGeometry(p, attach.x, attach.y, left, right, start);\n  mat4 matrix = getArrowMatrix(left, right, start);\n  return (matrix * vec4(arrow.xyz, 1.0)).xyz;\n\n}\n",
"axis.position": "uniform vec4 axisStep;\nuniform vec4 axisPosition;\n\nvec4 getAxisPosition(vec4 xyzw, inout vec4 stpq) {\n  return axisStep * xyzw.x + axisPosition;\n}\n",
"cartesian.position": "uniform mat4 viewMatrix;\n\nvec4 getCartesianPosition(vec4 position, inout vec4 stpq) {\n  return viewMatrix * vec4(position.xyz, 1.0);\n}\n",
"cartesian4.position": "uniform vec4 basisScale;\nuniform vec4 basisOffset;\nuniform vec4 viewScale;\nuniform vec4 viewOffset;\n\nvec4 getCartesian4Position(vec4 position, inout vec4 stpq) {\n  return position * basisScale + basisOffset;\n}\n",
"color.opaque": "vec4 opaqueColor(vec4 color) {\n  return vec4(color.rgb, 1.0);\n}\n",
"face.position": "uniform vec4 geometryClip;\nattribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvec3 getFacePosition() {\n  vec4 p = min(geometryClip, position4);\n  return getPosition(p, 1.0);\n}\n",
"face.position.normal": "attribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvoid getFaceGeometry(vec4 xyzw, out vec3 pos, out vec3 normal) {\n  vec3 a, b, c;\n\n  a   = getPosition(vec4(xyzw.xyz, 0.0), 0.0);\n  b   = getPosition(vec4(xyzw.xyz, 1.0), 0.0);\n  c   = getPosition(vec4(xyzw.xyz, 2.0), 0.0);\n\n  pos = getPosition(xyzw, 1.0);\n  normal = normalize(cross(c - a, b - a));\n}\n\nvec3 getFacePositionNormal() {\n  vec3 center, normal;\n\n  getFaceGeometry(position4, center, normal);\n  vNormal   = normal;\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz);\n  vPosition = -center;\n\n  return center;\n}\n",
"float.encode": "/*\nFloat encoding technique by\nCarlos Scheidegger\nhttps://github.com/cscheid/lux/blob/master/src/shade/bits/encode_float.js\n\nConversion to GLSL by:\nhttp://concord-consortium.github.io/lab/experiments/webgl-gpgpu/script.js\n*/\n\nfloat shift_right(float v, float amt) { \n  v = floor(v) + 0.5; \n  return floor(v / exp2(amt)); \n}\n\nfloat shift_left(float v, float amt) { \n  return floor(v * exp2(amt) + 0.5); \n}\n\nfloat mask_last(float v, float bits) { \n  return mod(v, shift_left(1.0, bits)); \n}\n\nfloat extract_bits(float num, float from, float to) { \n  from = floor(from + 0.5); to = floor(to + 0.5); \n  return mask_last(shift_right(num, from), to - from); \n}\n\nvec4 encode_float(float val) { \n  if (val == 0.0) return vec4(0, 0, 0, 0); \n  float valuesign = val > 0.0 ? 0.0 : 1.0; \n  val = abs(val); \n  float exponent = floor(log2(val)); \n  float biased_exponent = exponent + 127.0; \n  float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0; \n  float t = biased_exponent / 2.0; \n  float last_bit_of_biased_exponent = fract(t) * 2.0; \n  float remaining_bits_of_biased_exponent = floor(t); \n  float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0; \n  float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0; \n  float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0; \n  float byte1 = (valuesign * 128.0 + remaining_bits_of_biased_exponent) / 255.0; \n  return vec4(byte4, byte3, byte2, byte1); \n}\n",
"float.index.pack": "uniform vec4 indexModulus;\n\nvec4 getSample(vec4 xyzw);\nvec4 getIndex(vec4 xyzw);\n\nvec4 floatPackIndex(vec4 xyzw) {\n  vec4 value = getSample(xyzw);\n  vec4 index = getIndex(xyzw);\n\n  vec4 offset = floor(index + .5) * indexModulus;\n  vec2 sum2 = offset.xy + offset.zw;\n  float sum = sum2.x + sum2.y;\n  return vec4(value.xyz, sum);\n}",
"float.stretch": "vec4 getSample(vec4 xyzw);\n\nfloat floatStretch(vec4 xyzw, float channelIndex) {\n  vec4 sample = getSample(xyzw);\n  vec2 xy = channelIndex > 1.5 ? sample.zw : sample.xy;\n  return mod(channelIndex, 2.0) > .5 ? xy.y : xy.x;\n}",
"fragment.clip.dashed": "varying float vClipStrokeWidth;\nvarying float vClipStrokeIndex;\nvarying vec3  vClipStrokeEven;\nvarying vec3  vClipStrokeOdd;\nvarying vec3  vClipStrokePosition;\n\nvoid clipStrokeFragment() {\n  bool odd = mod(vClipStrokeIndex, 2.0) >= 1.0;\n\n  vec3 tangent;\n  if (odd) {\n    tangent = vClipStrokeOdd;\n  }\n  else {\n    tangent = vClipStrokeEven;\n  }\n\n  float travel = dot(vClipStrokePosition, normalize(tangent)) / vClipStrokeWidth;\n  if (mod(travel, 16.0) > 8.0) {\n    discard;\n  }\n}\n",
"fragment.clip.dotted": "varying float vClipStrokeWidth;\nvarying float vClipStrokeIndex;\nvarying vec3  vClipStrokeEven;\nvarying vec3  vClipStrokeOdd;\nvarying vec3  vClipStrokePosition;\n\nvoid clipStrokeFragment() {\n  bool odd = mod(vClipStrokeIndex, 2.0) >= 1.0;\n\n  vec3 tangent;\n  if (odd) {\n    tangent = vClipStrokeOdd;\n  }\n  else {\n    tangent = vClipStrokeEven;\n  }\n\n  float travel = dot(vClipStrokePosition, normalize(tangent)) / vClipStrokeWidth;\n  if (mod(travel, 4.0) > 2.0) {\n    discard;\n  }\n}\n",
"fragment.clip.ends": "varying vec2 vClipEnds;\n\nvoid clipEndsFragment() {\n  if (vClipEnds.x < 0.0 || vClipEnds.y < 0.0) discard;\n}\n",
"fragment.clip.proximity": "varying float vClipProximity;\n\nvoid clipProximityFragment() {\n  if (vClipProximity >= 0.5) discard;\n}",
"fragment.color": "void setFragmentColor(vec4 color) {\n  gl_FragColor = color;\n}",
"fragment.map.rgba": "vec4 fragmentRGBA(vec4 rgba, vec4 stpq) {\n  return rgba;\n}",
"fragment.solid": "void setFragmentColor(vec4 color) {\n  if (color.a < 1.0) discard;\n  gl_FragColor = color;\n}",
"fragment.transparent": "void setFragmentColor(vec4 color) {\n  if (color.a >= 1.0) discard;\n  gl_FragColor = color;\n}",
"grid.position": "uniform vec4 gridPosition;\nuniform vec4 gridStep;\nuniform vec4 gridAxis;\n\nvec4 sampleData(vec2 xy);\n\nvec4 getGridPosition(vec4 xyzw) {\n  vec4 onAxis  = gridAxis * sampleData(vec2(xyzw.y, 0.0)).x;\n  vec4 offAxis = gridStep * xyzw.x + gridPosition;\n  return onAxis + offAxis;\n}\n",
"grow.position": "uniform float growScale;\nuniform vec4  growMask;\nuniform vec4  growAnchor;\n\nvec4 getSample(vec4 xyzw);\n\nvec4 getGrowSample(vec4 xyzw) {\n  vec4 anchor = xyzw * growMask + growAnchor;\n\n  vec4 position = getSample(xyzw);\n  vec4 center = getSample(anchor);\n\n  return mix(center, position, growScale);\n}",
"join.position": "uniform float joinStride;\nuniform float joinStrideInv;\n\nfloat getIndex(vec4 xyzw);\nvec4 getRest(vec4 xyzw);\nvec4 injectIndices(float a, float b);\n\nvec4 getJoinXYZW(vec4 xyzw) {\n\n  float a = getIndex(xyzw);\n  float b = a * joinStrideInv;\n\n  float integer  = floor(b);\n  float fraction = b - integer;\n  \n  return injectIndices(fraction * joinStride, integer) + getRest(xyzw);\n}\n",
"label.alpha": "varying float vPixelSize;\n\nvec4 getLabelAlphaColor(vec4 color, vec4 sample) {\n  float mask = clamp(sample.r * 1000.0, 0.0, 1.0);\n  float alpha = (sample.r - .5) * vPixelSize + .5;\n  float a = mask * alpha * color.a;\n  if (a <= 0.0) discard;\n  return vec4(color.xyz, a);\n}\n",
"label.map": "vec2 mapUV(vec4 uvwo, vec4 stpq) {\n  return uvwo.xy;\n}\n",
"label.outline": "uniform float outlineExpand;\nuniform float outlineStep;\nuniform vec3  outlineColor;\n\nvarying float vPixelSize;\n\nconst float PIXEL_STEP = 255.0 / 16.0;\n\nvec4 getLabelOutlineColor(vec4 color, vec4 sample) {\n  float ps = vPixelSize * PIXEL_STEP;\n  float os = outlineStep;\n\n  float sdf = sample.r - .5 + outlineExpand;\n  vec2  sdfs = vec2(sdf, sdf + os);\n  vec2  alpha = clamp(sdfs * ps + .5, 0.0, 1.0);\n\n  if (alpha.y <= 0.0) {\n    discard;\n  }\n\n  vec3 blend = color.xyz;\n  if (alpha.y > alpha.x) {\n    blend = sqrt(mix(outlineColor * outlineColor, blend * blend, alpha.x));\n  }\n  \n  return vec4(blend, alpha.y * color.a);\n}\n",
"layer.position": "uniform vec4 layerScale;\nuniform vec4 layerBias;\n\nvec4 layerPosition(vec4 position, inout vec4 stpq) {\n  return layerScale * position + layerBias;\n}\n",
"lerp.depth": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpDepth(vec4 xyzw) {\n  float x = xyzw.z * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.xy, i, xyzw.w);\n  vec4 xyzw2 = vec4(xyzw.xy, i + 1.0, xyzw.w);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.height": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpHeight(vec4 xyzw) {\n  float x = xyzw.y * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.x, i, xyzw.zw);\n  vec4 xyzw2 = vec4(xyzw.x, i + 1.0, xyzw.zw);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.items": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpItems(vec4 xyzw) {\n  float x = xyzw.w * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(xyzw.xyz, i);\n  vec4 xyzw2 = vec4(xyzw.xyz, i + 1.0);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"lerp.width": "uniform float sampleRatio;\n\n// External\nvec4 sampleData(vec4 xyzw);\n\nvec4 lerpWidth(vec4 xyzw) {\n  float x = xyzw.x * sampleRatio;\n  float i = floor(x);\n  float f = x - i;\n    \n  vec4 xyzw1 = vec4(i, xyzw.yzw);\n  vec4 xyzw2 = vec4(i + 1.0, xyzw.yzw);\n  \n  vec4 a = sampleData(xyzw1);\n  vec4 b = sampleData(xyzw2);\n\n  return mix(a, b, f);\n}\n",
"line.position": "uniform float worldUnit;\nuniform float lineWidth;\nuniform float lineDepth;\nuniform float focusDepth;\n\nuniform vec4 geometryClip;\nattribute vec2 line;\nattribute vec4 position4;\n\n#ifdef LINE_PROXIMITY\nuniform float lineProximity;\nvarying float vClipProximity;\n#endif\n\n#ifdef LINE_STROKE\nvarying float vClipStrokeWidth;\nvarying float vClipStrokeIndex;\nvarying vec3  vClipStrokeEven;\nvarying vec3  vClipStrokeOdd;\nvarying vec3  vClipStrokePosition;\n#endif\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\n#ifdef LINE_CLIP\nuniform float clipRange;\nuniform vec2  clipStyle;\nuniform float clipSpace;\n\nattribute vec2 strip;\n\nvarying vec2 vClipEnds;\n\nvoid clipEnds(vec4 xyzw, vec3 center, vec3 pos) {\n\n  // Sample end of line strip\n  vec4 xyzwE = vec4(strip.y, xyzw.yzw);\n  vec3 end   = getPosition(xyzwE, 0.0);\n\n  // Sample start of line strip\n  vec4 xyzwS = vec4(strip.x, xyzw.yzw);\n  vec3 start = getPosition(xyzwS, 0.0);\n\n  // Measure length\n  vec3 diff = end - start;\n  float l = length(diff) * clipSpace;\n\n  // Arrow length (=2.5x radius)\n  float arrowSize = 1.25 * clipRange * lineWidth * worldUnit;\n\n  vClipEnds = vec2(1.0);\n\n  if (clipStyle.y > 0.0) {\n    // Depth blend end\n    float depth = focusDepth;\n    if (lineDepth < 1.0) {\n      float z = max(0.00001, -end.z);\n      depth = mix(z, focusDepth, lineDepth);\n    }\n    \n    // Absolute arrow length\n    float size = arrowSize * depth;\n\n    // Adjust clip range\n    // Approach linear scaling with cubic ease the smaller we get\n    float mini = clamp(1.0 - l / size * .333, 0.0, 1.0);\n    float scale = 1.0 - mini * mini * mini; \n    float invrange = 1.0 / (size * scale);\n  \n    // Clip end\n    diff = normalize(end - center);\n    float d = dot(end - pos, diff);\n    vClipEnds.x = d * invrange - 1.0;\n  }\n\n  if (clipStyle.x > 0.0) {\n    // Depth blend start\n    float depth = focusDepth;\n    if (lineDepth < 1.0) {\n      float z = max(0.00001, -start.z);\n      depth = mix(z, focusDepth, lineDepth);\n    }\n    \n    // Absolute arrow length\n    float size = arrowSize * depth;\n\n    // Adjust clip range\n    // Approach linear scaling with cubic ease the smaller we get\n    float mini = clamp(1.0 - l / size * .333, 0.0, 1.0);\n    float scale = 1.0 - mini * mini * mini; \n    float invrange = 1.0 / (size * scale);\n  \n    // Clip start \n    diff = normalize(center - start);\n    float d = dot(pos - start, diff);\n    vClipEnds.y = d * invrange - 1.0;\n  }\n\n\n}\n#endif\n\nconst float epsilon = 1e-5;\nvoid fixCenter(vec3 left, inout vec3 center, vec3 right) {\n  if (center.z >= 0.0) {\n    if (left.z < 0.0) {\n      float d = (center.z - epsilon) / (center.z - left.z);\n      center = mix(center, left, d);\n    }\n    else if (right.z < 0.0) {\n      float d = (center.z - epsilon) / (center.z - right.z);\n      center = mix(center, right, d);\n    }\n  }\n}\n\n\nvoid getLineGeometry(vec4 xyzw, float edge, out vec3 left, out vec3 center, out vec3 right) {\n  vec4 delta = vec4(1.0, 0.0, 0.0, 0.0);\n\n  center =                 getPosition(xyzw, 1.0);\n  left   = (edge > -0.5) ? getPosition(xyzw - delta, 0.0) : center;\n  right  = (edge < 0.5)  ? getPosition(xyzw + delta, 0.0) : center;\n}\n\nvec3 getLineJoin(float edge, bool odd, vec3 left, vec3 center, vec3 right, float width) {\n  vec2 join = vec2(1.0, 0.0);\n\n  fixCenter(left, center, right);\n\n  vec4 a = vec4(left.xy, right.xy);\n  vec4 b = a / vec4(left.zz, right.zz);\n\n  vec2 l = b.xy;\n  vec2 r = b.zw;\n  vec2 c = center.xy / center.z;\n\n  vec4 d = vec4(l, c) - vec4(c, r);\n  float l1 = dot(d.xy, d.xy);\n  float l2 = dot(d.zw, d.zw);\n\n  if (l1 + l2 > 0.0) {\n    \n    if (edge > 0.5 || l2 == 0.0) {\n      vec2 nl = normalize(d.xy);\n      vec2 tl = vec2(nl.y, -nl.x);\n\n#ifdef LINE_PROXIMITY\n      vClipProximity = 1.0;\n#endif\n\n#ifdef LINE_STROKE\n      vClipStrokeEven = vClipStrokeOdd = normalize(left - center);\n#endif\n      join = tl;\n    }\n    else if (edge < -0.5 || l1 == 0.0) {\n      vec2 nr = normalize(d.zw);\n      vec2 tr = vec2(nr.y, -nr.x);\n\n#ifdef LINE_PROXIMITY\n      vClipProximity = 1.0;\n#endif\n\n#ifdef LINE_STROKE\n      vClipStrokeEven = vClipStrokeOdd = normalize(center - right);\n#endif\n      join = tr;\n    }\n    else {\n      // Limit join stretch for tiny segments\n      float lmin2 = min(l1, l2) / (width * width);\n\n      // Hide line segment if ratio of leg lengths exceeds promixity threshold\n#ifdef LINE_PROXIMITY\n      float lr     = l1 / l2;\n      float rl     = l2 / l1;\n      float ratio  = max(lr, rl);\n      float thresh = lineProximity + 1.0;\n      vClipProximity = (ratio > thresh * thresh) ? 1.0 : 0.0;\n#endif\n      \n      // Calculate normals/tangents\n      vec2 nl = normalize(d.xy);\n      vec2 nr = normalize(d.zw);\n\n      vec2 tl = vec2(nl.y, -nl.x);\n      vec2 tr = vec2(nr.y, -nr.x);\n\n#ifdef LINE_PROXIMITY\n      // Mix tangents according to leg lengths\n      vec2 tc = normalize(mix(tl, tr, l1/(l1+l2)));\n#else\n      // Average tangent\n      vec2 tc = normalize(tl + tr);\n#endif\n    \n      float cosA   = dot(nl, tc);\n      float sinA   = max(0.1, abs(dot(tl, tc)));\n      float factor = cosA / sinA;\n      float scale  = sqrt(1.0 + min(lmin2, factor * factor));\n\n#ifdef LINE_STROKE\n      vec3 stroke1 = normalize(left - center);\n      vec3 stroke2 = normalize(center - right);\n\n      if (odd) {\n        vClipStrokeEven = stroke1;\n        vClipStrokeOdd  = stroke2;\n      }\n      else {\n        vClipStrokeEven = stroke2;\n        vClipStrokeOdd  = stroke1;\n      }\n#endif\n      join = tc * scale;\n    }\n    return vec3(join, 0.0);\n  }\n  else {\n    return vec3(0.0);\n  }\n\n}\n\nvec3 getLinePosition() {\n  vec3 left, center, right, join;\n\n  float edge = line.x;\n  float offset = line.y;\n\n  vec4 p = min(geometryClip, position4);\n  edge += max(0.0, position4.x - geometryClip.x);\n\n  // Get position + adjacent neighbours\n  getLineGeometry(p, edge, left, center, right);\n\n#ifdef LINE_STROKE\n  // Set parameters for line stroke fragment shader\n  vClipStrokePosition = center;\n  vClipStrokeIndex = p.x;\n  bool odd = mod(p.x, 2.0) >= 1.0;\n#else\n  bool odd = true;\n#endif\n\n  // Divide line width up/down\n  float width = lineWidth * 0.5;\n\n  float depth = focusDepth;\n  if (lineDepth < 1.0) {\n    // Depth blending\n    float z = max(0.00001, -center.z);\n    depth = mix(z, focusDepth, lineDepth);\n  }\n  width *= depth;\n\n  // Convert to world units\n  width *= worldUnit;\n\n  join = getLineJoin(edge, odd, left, center, right, width);\n\n#ifdef LINE_STROKE\n  vClipStrokeWidth = width;\n#endif\n  \n  vec3 pos = center + join * offset * width;\n\n#ifdef LINE_CLIP\n  clipEnds(p, center, pos);\n#endif\n\n  return pos;\n}\n",
"map.2d.data": "uniform vec2 dataResolution;\nuniform vec2 dataPointer;\n\nvec2 map2DData(vec2 xy) {\n  return fract((xy + dataPointer) * dataResolution);\n}\n",
"map.xyzw.2dv": "void mapXyzw2DV(vec4 xyzw, out vec2 xy, out float z) {\n  xy = xyzw.xy;\n  z  = xyzw.z;\n}\n\n",
"map.xyzw.texture": "uniform float textureItems;\nuniform float textureHeight;\n\nvec2 mapXyzwTexture(vec4 xyzw) {\n  \n  float x = xyzw.x;\n  float y = xyzw.y;\n  float z = xyzw.z;\n  float i = xyzw.w;\n  \n  return vec2(i, y) + vec2(x, z) * vec2(textureItems, textureHeight);\n}\n\n",
"mesh.fragment.color": "varying vec4 vColor;\n\nvec4 getColor() {\n  return vColor;\n}\n",
"mesh.fragment.map": "#ifdef POSITION_STPQ\nvarying vec4 vSTPQ;\n#endif\n#ifdef POSITION_U\nvarying float vU;\n#endif\n#ifdef POSITION_UV\nvarying vec2 vUV;\n#endif\n#ifdef POSITION_UVW\nvarying vec3 vUVW;\n#endif\n#ifdef POSITION_UVWO\nvarying vec4 vUVWO;\n#endif\n\nvec4 getSample(vec4 uvwo, vec4 stpq);\n\nvec4 getMapColor() {\n  #ifdef POSITION_STPQ\n  vec4 stpq = vSTPQ;\n  #else\n  vec4 stpq = vec4(0.0);\n  #endif\n\n  #ifdef POSITION_U\n  vec4 uvwo = vec4(vU, 0.0, 0.0, 0.0);\n  #endif\n  #ifdef POSITION_UV\n  vec4 uvwo = vec4(vUV, 0.0, 0.0);\n  #endif\n  #ifdef POSITION_UVW\n  vec4 uvwo = vec4(vUVW, 0.0);\n  #endif\n  #ifdef POSITION_UVWO\n  vec4 uvwo = vec4(vUVWO);\n  #endif\n\n  return getSample(uvwo, stpq);\n}\n",
"mesh.fragment.mask": "varying float vMask;\n\nfloat ease(float t) {\n  t = clamp(t, 0.0, 1.0);\n  return t * t * (3.0 - 2.0 * t);\n}\n\nvec4 maskColor() {\n  if (vMask <= 0.0) discard;\n  return vec4(vec3(1.0), ease(vMask));\n}\n",
"mesh.fragment.shaded": "varying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvec3 offSpecular(vec3 color) {\n  vec3 c = 1.0 - color;\n  return 1.0 - c * c;\n}\n\nvec4 getShadedColor(vec4 rgba) {\n  \n  vec3 color = rgba.xyz;\n  vec3 color2 = offSpecular(rgba.xyz);\n\n  vec3 normal = normalize(vNormal);\n  vec3 light = normalize(vLight);\n  vec3 position = normalize(vPosition);\n  \n  float side    = gl_FrontFacing ? -1.0 : 1.0;\n  float cosine  = side * dot(normal, light);\n  float diffuse = mix(max(0.0, cosine), .5 + .5 * cosine, .1);\n  \n  vec3  halfLight = normalize(light + position);\n\tfloat cosineHalf = max(0.0, side * dot(normal, halfLight));\n\tfloat specular = pow(cosineHalf, 16.0);\n\t\n\treturn vec4(color * (diffuse * .9 + .05) + .25 * color2 * specular, rgba.a);\n}\n",
"mesh.fragment.texture": "",
"mesh.gamma.in": "vec4 getGammaInColor(vec4 rgba) {\n  return vec4(rgba.rgb * rgba.rgb, rgba.a);\n}\n",
"mesh.gamma.out": "vec4 getGammaOutColor(vec4 rgba) {\n  return vec4(sqrt(rgba.rgb), rgba.a);\n}\n",
"mesh.map.uvwo": "vec4 mapUVWO(vec4 uvwo, vec4 stpq) {\n  return uvwo;\n}\n",
"mesh.position": "uniform vec4 geometryClip;\nattribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvec3 getMeshPosition() {\n  vec4 p = min(geometryClip, position4);\n  return getPosition(p, 1.0);\n}\n",
"mesh.vertex.color": "attribute vec4 position4;\nuniform vec4 geometryClip;\nvarying vec4 vColor;\n\n// External\nvec4 getSample(vec4 xyzw);\n\nvoid vertexColor() {\n  vec4 p = min(geometryClip, position4);\n  vColor = getSample(p);\n}\n",
"mesh.vertex.mask": "attribute vec4 position4;\nuniform vec4 geometryResolution;\nuniform vec4 geometryClip;\nvarying float vMask;\n\n// External\nfloat getSample(vec4 xyzw);\n\nvoid maskLevel() {\n  vec4 p = min(geometryClip, position4);\n  vMask = getSample(p * geometryResolution);\n}\n",
"mesh.vertex.position": "uniform vec4 geometryResolution;\n\n#ifdef POSITION_STPQ\nvarying vec4 vSTPQ;\n#endif\n#ifdef POSITION_U\nvarying float vU;\n#endif\n#ifdef POSITION_UV\nvarying vec2 vUV;\n#endif\n#ifdef POSITION_UVW\nvarying vec3 vUVW;\n#endif\n#ifdef POSITION_UVWO\nvarying vec4 vUVWO;\n#endif\n\n// External\nvec3 getPosition(vec4 xyzw, vec4 stpq);\n\nvec3 getMeshPosition(vec4 xyzw, float canonical) {\n  vec4 stpq = xyzw * geometryResolution;\n  vec3 xyz = getPosition(xyzw, stpq);\n\n  #ifdef POSITION_MAP\n  if (canonical > 0.5) {\n    #ifdef POSITION_STPQ\n    vSTPQ = stpq;\n    #endif\n    #ifdef POSITION_U\n    vU = stpq.x;\n    #endif\n    #ifdef POSITION_UV\n    vUV = stpq.xy;\n    #endif\n    #ifdef POSITION_UVW\n    vUVW = stpq.xyz;\n    #endif\n    #ifdef POSITION_UVWO\n    vUVWO = stpq;\n    #endif\n  }\n  #endif\n  return xyz;\n}\n",
"move.position": "uniform float transitionEnter;\nuniform float transitionExit;\nuniform vec4  transitionScale;\nuniform vec4  transitionBias;\nuniform float transitionSkew;\nuniform float transitionActive;\n\nuniform vec4  moveFrom;\nuniform vec4  moveTo;\n\nfloat ease(float t) {\n  t = clamp(t, 0.0, 1.0);\n  return 1.0 - (2.0 - t) * t;\n}\n\nvec4 getTransitionPosition(vec4 xyzw, inout vec4 stpq) {\n  if (transitionActive < 0.5) return xyzw;\n\n  float enter   = transitionEnter;\n  float exit    = transitionExit;\n  float skew    = transitionSkew;\n  vec4  scale   = transitionScale;\n  vec4  bias    = transitionBias;\n\n  float factor  = 1.0 + skew;\n  float offset  = dot(vec4(1.0), stpq * scale + bias);\n\n  float a1 = ease(enter * factor - offset);\n  float a2 = ease(exit  * factor + offset - skew);\n\n  return xyzw + a1 * moveFrom + a2 * moveTo;\n}",
"object.mask.default": "vec4 getMask(vec4 xyzw) {\n  return vec4(1.0);\n}",
"point.alpha.circle": "varying float vPixelSize;\n\nfloat getDiscAlpha(float mask) {\n  // Approximation: 1 - x*x is approximately linear around x = 1 with slope 2\n  return vPixelSize * (1.0 - mask);\n  //  return vPixelSize * 2.0 * (1.0 - sqrt(mask));\n}\n",
"point.alpha.circle.hollow": "varying float vPixelSize;\n\nfloat getDiscHollowAlpha(float mask) {\n  return vPixelSize * (0.5 - 2.0 * abs(sqrt(mask) - .75));\n}\n",
"point.alpha.generic": "varying float vPixelSize;\n\nfloat getGenericAlpha(float mask) {\n  return vPixelSize * 2.0 * (1.0 - mask);\n}\n",
"point.alpha.generic.hollow": "varying float vPixelSize;\n\nfloat getGenericHollowAlpha(float mask) {\n  return vPixelSize * (0.5 - 2.0 * abs(mask - .75));\n}\n",
"point.edge": "varying vec2 vSprite;\n\nfloat getSpriteMask(vec2 xy);\nfloat getSpriteAlpha(float mask);\n\nvoid setFragmentColorFill(vec4 color) {\n  float mask = getSpriteMask(vSprite);\n  if (mask > 1.0) {\n    discard;\n  }\n  float alpha = getSpriteAlpha(mask);\n  if (alpha >= 1.0) {\n    discard;\n  }\n  gl_FragColor = vec4(color.rgb, alpha * color.a);\n}\n",
"point.fill": "varying vec2 vSprite;\n\nfloat getSpriteMask(vec2 xy);\nfloat getSpriteAlpha(float mask);\n\nvoid setFragmentColorFill(vec4 color) {\n  float mask = getSpriteMask(vSprite);\n  if (mask > 1.0) {\n    discard;\n  }\n  float alpha = getSpriteAlpha(mask);\n  if (alpha < 1.0) {\n    discard;\n  }\n  gl_FragColor = color;\n}\n\n",
"point.mask.circle": "varying float vPixelSize;\n\nfloat getCircleMask(vec2 uv) {\n  return dot(uv, uv);\n}\n",
"point.mask.diamond": "varying float vPixelSize;\n\nfloat getDiamondMask(vec2 uv) {\n  vec2 a = abs(uv);\n  return a.x + a.y;\n}\n",
"point.mask.down": "varying float vPixelSize;\n\nfloat getTriangleDownMask(vec2 uv) {\n  uv.y += .25;\n  return max(uv.y, abs(uv.x) * .866 - uv.y * .5 + .6);\n}\n",
"point.mask.left": "varying float vPixelSize;\n\nfloat getTriangleLeftMask(vec2 uv) {\n  uv.x += .25;\n  return max(uv.x, abs(uv.y) * .866 - uv.x * .5 + .6);\n}\n",
"point.mask.right": "varying float vPixelSize;\n\nfloat getTriangleRightMask(vec2 uv) {\n  uv.x -= .25;\n  return max(-uv.x, abs(uv.y) * .866 + uv.x * .5 + .6);\n}\n",
"point.mask.square": "varying float vPixelSize;\n\nfloat getSquareMask(vec2 uv) {\n  vec2 a = abs(uv);\n  return max(a.x, a.y);\n}\n",
"point.mask.up": "varying float vPixelSize;\n\nfloat getTriangleUpMask(vec2 uv) {\n  uv.y -= .25;\n  return max(-uv.y, abs(uv.x) * .866 + uv.y * .5 + .6);\n}\n",
"point.position": "uniform float pointDepth;\n\nuniform float pixelUnit;\nuniform float renderScale;\nuniform float renderScaleInv;\nuniform float focusDepth;\n\nuniform vec4 geometryClip;\nattribute vec4 position4;\nattribute vec2 sprite;\n\nvarying vec2 vSprite;\nvarying float vPixelSize;\n\nconst float pointScale = POINT_SHAPE_SCALE;\n\n// External\nfloat getPointSize(vec4 xyzw);\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvec3 getPointPosition() {\n  vec4 p = min(geometryClip, position4);\n  vec3 center = getPosition(p, 1.0);\n\n  // Depth blending\n  // TODO: orthographic camera\n  // Workaround: set depth = 0\n  float z = -center.z;\n  float depth = mix(z, focusDepth, pointDepth);\n  \n  // Match device/unit mapping \n  // Sprite goes from -1..1, width = 2.\n  float pointSize = getPointSize(p);\n  float size = pointScale * pointSize * pixelUnit * .5;\n  float depthSize = depth * size;\n  \n  // Pad sprite by half a pixel to make the anti-aliasing straddle the pixel edge\n  // Note: pixelsize measures radius\n  float pixelSize = .5 * (pointDepth > 0.0 ? depthSize / z : size);\n  float paddedSize = pixelSize + 0.5;\n  float padFactor = paddedSize / pixelSize;\n\n  vPixelSize = paddedSize;\n  vSprite    = sprite;\n\n  return center + vec3(sprite * depthSize * renderScaleInv * padFactor, 0.0);\n}\n",
"point.size.uniform": "uniform float pointSize;\n\nfloat getPointSize(vec4 xyzw) {\n  return pointSize;\n}",
"point.size.varying": "uniform float pointSize;\n\nvec4 getSample(vec4 xyzw);\n\nfloat getPointSize(vec4 xyzw) {\n  return pointSize * getSample(xyzw).x;\n}",
"polar.position": "uniform float polarBend;\nuniform float polarFocus;\nuniform float polarAspect;\nuniform float polarHelix;\n\nuniform mat4 viewMatrix;\n\nvec4 getPolarPosition(vec4 position, inout vec4 stpq) {\n  if (polarBend > 0.0) {\n\n    if (polarBend < 0.001) {\n      // Factor out large addition/subtraction of polarFocus\n      // to avoid numerical error\n      // sin(x) ~ x\n      // cos(x) ~ 1 - x * x / 2\n      vec2 pb = position.xy * polarBend;\n      float ppbbx = pb.x * pb.x;\n      return viewMatrix * vec4(\n        position.x * (1.0 - polarBend + (pb.y * polarAspect)),\n        position.y * (1.0 - .5 * ppbbx) - (.5 * ppbbx) * polarFocus / polarAspect,\n        position.z + position.x * polarHelix * polarBend,\n        1.0\n      );\n    }\n    else {\n      vec2 xy = position.xy * vec2(polarBend, polarAspect);\n      float radius = polarFocus + xy.y;\n      return viewMatrix * vec4(\n        sin(xy.x) * radius,\n        (cos(xy.x) * radius - polarFocus) / polarAspect,\n        position.z + position.x * polarHelix * polarBend,\n        1.0\n      );\n    }\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"project.position": "uniform float styleZBias;\nuniform float styleZIndex;\n\nvoid setPosition(vec3 position) {\n  vec4 pos = projectionMatrix * vec4(position, 1.0);\n\n  // Apply relative Z bias\n  float bias  = (1.0 - styleZBias / 32768.0);\n  pos.z *= bias;\n  \n  // Apply large scale Z index changes\n  if (styleZIndex > 0.0) {\n    float z = pos.z / pos.w;\n    pos.z = ((z + 1.0) / (styleZIndex + 1.0) - 1.0) * pos.w;\n  }\n  \n  gl_Position = pos;\n}",
"project.readback": "// This is three.js' global uniform, missing from fragment shaders.\nuniform mat4 projectionMatrix;\n\nvec4 readbackPosition(vec3 position) {\n  vec4 pos = projectionMatrix * vec4(position, 1.0);\n  vec3 final = pos.xyz / pos.w;\n  if (final.z < -1.0) {\n    return vec4(0.0, 0.0, 0.0, -1.0);\n  }\n  else {\n    return vec4(final, -position.z);\n  }\n}\n",
"raw.position.scale": "uniform vec4 geometryScale;\nattribute vec4 position4;\n\nvec4 getRawPositionScale() {\n  return geometryScale * position4;\n}\n",
"repeat.position": "uniform vec4 repeatModulus;\n\nvec4 getRepeatXYZW(vec4 xyzw) {\n  return mod(xyzw + .5, repeatModulus) - .5;\n}\n",
"resample.padding": "uniform vec4 resampleBias;\n\nvec4 resamplePadding(vec4 xyzw) {\n  return xyzw + resampleBias;\n}",
"resample.relative": "uniform vec4 resampleFactor;\n\nvec4 resampleRelative(vec4 xyzw) {\n  return xyzw * resampleFactor;\n}",
"reveal.mask": "uniform float transitionEnter;\nuniform float transitionExit;\nuniform vec4  transitionScale;\nuniform vec4  transitionBias;\nuniform float transitionSkew;\nuniform float transitionActive;\n\nfloat getTransitionSDFMask(vec4 stpq) {\n  if (transitionActive < 0.5) return 1.0;\n\n  float enter   = transitionEnter;\n  float exit    = transitionExit;\n  float skew    = transitionSkew;\n  vec4  scale   = transitionScale;\n  vec4  bias    = transitionBias;\n\n  float factor  = 1.0 + skew;\n  float offset  = dot(vec4(1.0), stpq * scale + bias);\n\n  vec2 d = vec2(enter, exit) * factor + vec2(-offset, offset - skew);\n  if (exit  == 1.0) return d.x;\n  if (enter == 1.0) return d.y;\n  return min(d.x, d.y);\n}",
"root.position": "vec3 getRootPosition(vec4 position, in vec4 stpq) {\n  return position.xyz;\n}",
"sample.2d": "uniform sampler2D dataTexture;\n\nvec4 sample2D(vec2 uv) {\n  return texture2D(dataTexture, uv);\n}\n",
"scale.position": "uniform vec4 scaleAxis;\nuniform vec4 scaleOffset;\n\nvec4 sampleData(float x);\n\nvec4 getScalePosition(vec4 xyzw) {\n  return scaleAxis * sampleData(xyzw.x).x + scaleOffset;\n}\n",
"screen.map.stpq": "uniform vec4 remapSTPQScale;\n\nvec4 screenMapSTPQ(vec4 xyzw, out vec4 stpq) {\n  stpq = xyzw * remapSTPQScale;\n  return xyzw;\n}\n",
"screen.map.xy": "uniform vec2 remapUVScale;\n\nvec4 screenMapXY(vec4 uvwo, vec4 stpq) {\n  return vec4(floor(remapUVScale * uvwo.xy), 0.0, 0.0);\n}\n",
"screen.map.xyzw": "uniform vec2 remapUVScale;\nuniform vec2 remapModulus;\nuniform vec2 remapModulusInv;\n\nvec4 screenMapXYZW(vec4 uvwo, vec4 stpq) {\n  vec2 st = floor(remapUVScale * uvwo.xy);\n  vec2 xy = st * remapModulusInv;\n  vec2 ixy = floor(xy);\n  vec2 fxy = xy - ixy;\n  vec2 zw = fxy * remapModulus;\n  return vec4(ixy.x, zw.y, ixy.y, zw.x);\n}\n",
"screen.pass.uv": "vec2 screenPassUV(vec4 uvwo, vec4 stpq) {\n  return uvwo.xy;\n}\n",
"screen.position": "void setScreenPosition(vec4 position) {\n  gl_Position = vec4(position.xy * 2.0 - 1.0, 0.5, 1.0);\n}\n",
"slice.position": "uniform vec4 sliceOffset;\n\nvec4 getSliceOffset(vec4 xyzw) {\n  return xyzw + sliceOffset;\n}\n",
"spherical.position": "uniform float sphericalBend;\nuniform float sphericalFocus;\nuniform float sphericalAspectX;\nuniform float sphericalAspectY;\nuniform float sphericalScaleY;\n\nuniform mat4 viewMatrix;\n\nvec4 getSphericalPosition(vec4 position, inout vec4 stpq) {\n  if (sphericalBend > 0.0001) {\n\n    vec3 xyz = position.xyz * vec3(sphericalBend, sphericalBend / sphericalAspectY * sphericalScaleY, sphericalAspectX);\n    float radius = sphericalFocus + xyz.z;\n    float cosine = cos(xyz.y) * radius;\n\n    return viewMatrix * vec4(\n      sin(xyz.x) * cosine,\n      sin(xyz.y) * radius * sphericalAspectY,\n      (cos(xyz.x) * cosine - sphericalFocus) / sphericalAspectX,\n      1.0\n    );\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"split.position": "uniform float splitStride;\n\nvec2 getIndices(vec4 xyzw);\nvec4 getRest(vec4 xyzw);\nvec4 injectIndex(float v);\n\nvec4 getSplitXYZW(vec4 xyzw) {\n  vec2 uv = getIndices(xyzw);\n  float offset = uv.x + uv.y * splitStride;\n  return injectIndex(offset) + getRest(xyzw);\n}\n",
"spread.position": "uniform vec4 spreadOffset;\nuniform mat4 spreadMatrix;\n\n// External\nvec4 getSample(vec4 xyzw);\n\nvec4 getSpreadSample(vec4 xyzw) {\n  vec4 sample = getSample(xyzw);\n  return sample + spreadMatrix * (spreadOffset + xyzw);\n}\n",
"sprite.fragment": "varying vec2 vSprite;\n\nvec4 getSample(vec2 xy);\n\nvec4 getSpriteColor() {\n  return getSample(vSprite);\n}",
"sprite.position": "uniform vec2 spriteOffset;\nuniform float spriteScale;\nuniform float spriteDepth;\nuniform float spriteSnap;\n\nuniform vec2 renderOdd;\nuniform float renderScale;\nuniform float renderScaleInv;\nuniform float pixelUnit;\nuniform float focusDepth;\n\nuniform vec4 geometryClip;\nattribute vec4 position4;\nattribute vec2 sprite;\n\nvarying float vPixelSize;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\nvec4 getSprite(vec4 xyzw);\n\nvec3 getSpritePosition() {\n  // Clip points\n  vec4 p = min(geometryClip, position4);\n  float diff = length(position4 - p);\n  if (diff > 0.0) {\n    return vec3(0.0, 0.0, 1000.0);\n  }\n\n  // Make sprites\n  vec3 center = getPosition(p, 1.0);\n  vec4 atlas = getSprite(p);\n\n  // Sprite goes from -1..1, width = 2.\n  // -1..1 -> -0.5..0.5\n  vec2 halfSprite = sprite * .5;\n  vec2 halfFlipSprite = vec2(halfSprite.x, -halfSprite.y);\n\n#ifdef POSITION_UV\n  // Assign UVs\n  vUV = atlas.xy + atlas.zw * (halfFlipSprite + .5);\n#endif\n\n  // Depth blending\n  // TODO: orthographic camera\n  // Workaround: set depth = 0\n  float depth = focusDepth, z;\n  z = -center.z;\n  if (spriteDepth < 1.0) {\n    depth = mix(z, focusDepth, spriteDepth);\n  }\n  \n  // Match device/unit mapping \n  float size = pixelUnit * spriteScale;\n  float depthSize = depth * size;\n\n  // Calculate pixelSize for anti-aliasing\n  float pixelSize = (spriteDepth > 0.0 ? depthSize / z : size);\n  vPixelSize = pixelSize;\n\n  // Position sprite\n  vec2 atlasOdd = fract(atlas.zw / 2.0);\n  vec2 offset = (spriteOffset + halfSprite * atlas.zw) * depthSize;\n  if (spriteSnap > 0.5) {\n    // Snap to pixel (w/ epsilon shift to avoid jitter)\n    return vec3(((floor(center.xy / center.z * renderScale + 0.001) + renderOdd + atlasOdd) * center.z + offset) * renderScaleInv, center.z);\n  }\n  else {\n    // Place directly\n    return center + vec3(offset * renderScaleInv, 0.0);\n  }\n\n}\n",
"stereographic.position": "uniform float stereoBend;\n\nuniform mat4 viewMatrix;\n\nvec4 getStereoPosition(vec4 position, inout vec4 stpq) {\n  if (stereoBend > 0.0001) {\n\n    vec3 pos = position.xyz;\n    float r = length(pos);\n    float z = r + pos.z;\n    vec3 project = vec3(pos.xy / z, r);\n    \n    vec3 lerped = mix(pos, project, stereoBend);\n\n    return viewMatrix * vec4(lerped, 1.0);\n  }\n  else {\n    return viewMatrix * vec4(position.xyz, 1.0);\n  }\n}",
"stereographic4.position": "uniform float stereoBend;\nuniform vec4 basisScale;\nuniform vec4 basisOffset;\nuniform mat4 viewMatrix;\nuniform vec2 view4D;\n\nvec4 getStereographic4Position(vec4 position, inout vec4 stpq) {\n  \n  vec4 transformed;\n  if (stereoBend > 0.0001) {\n\n    float r = length(position);\n    float w = r + position.w;\n    vec4 project = vec4(position.xyz / w, r);\n    \n    transformed = mix(position, project, stereoBend);\n  }\n  else {\n    transformed = position;\n  }\n\n  vec4 pos4 = transformed * basisScale - basisOffset;\n  vec3 xyz = (viewMatrix * vec4(pos4.xyz, 1.0)).xyz;\n  return vec4(xyz, pos4.w * view4D.y + view4D.x);\n}\n",
"stpq.sample.2d": "varying vec2 vST;\n\nvec4 getSample(vec2 st);\n\nvec4 getSTSample() {\n  return getSample(vST);\n}\n",
"stpq.xyzw.2d": "varying vec2 vUV;\n\nvoid setRawUV(vec4 xyzw) {\n  vUV = xyzw.xy;\n}\n",
"strip.position.normal": "uniform vec4 geometryClip;\nattribute vec4 position4;\nattribute vec3 strip;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvoid getStripGeometry(vec4 xyzw, vec3 strip, out vec3 pos, out vec3 normal) {\n  vec3 a, b, c;\n\n  a   = getPosition(xyzw, 1.0);\n  b   = getPosition(vec4(xyzw.xyz, strip.x), 0.0);\n  c   = getPosition(vec4(xyzw.xyz, strip.y), 0.0);\n\n  normal = normalize(cross(c - a, b - a)) * strip.z;\n  \n  pos = a;\n}\n\nvec3 getStripPositionNormal() {\n  vec3 center, normal;\n\n  vec4 p = min(geometryClip, position4);\n\n  getStripGeometry(p, strip, center, normal);\n  vNormal   = normal;\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz);\n  vPosition = -center;\n\n  return center;\n}\n",
"style.color": "uniform vec3 styleColor;\nuniform float styleOpacity;\n\nvec4 getStyleColor() {\n  return vec4(styleColor, styleOpacity);\n}\n",
"surface.mask.hollow": "attribute vec4 position4;\n\nfloat getSurfaceHollowMask(vec4 xyzw) {\n  vec4 df = abs(fract(position4) - .5);\n  vec2 df2 = min(df.xy, df.zw);\n  float df3 = min(df2.x, df2.y);\n  return df3;\n}",
"surface.position": "uniform vec4 geometryClip;\nuniform vec4 geometryResolution;\nuniform vec4 mapSize;\n\nattribute vec4 position4;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvec3 getSurfacePosition() {\n  vec4 p = min(geometryClip, position4);\n  vec3 xyz = getPosition(p, 1.0);\n\n  // Overwrite UVs\n#ifdef POSITION_UV\n#ifdef POSITION_UV_INT\n  vUV = -.5 + (position4.xy * geometryResolution.xy) * mapSize.xy;\n#else\n  vUV = position4.xy * geometryResolution.xy;\n#endif\n#endif\n\n  return xyz;\n}\n",
"surface.position.normal": "uniform vec4 mapSize;\nuniform vec4 geometryResolution;\nuniform vec4 geometryClip;\nattribute vec4 position4;\nattribute vec2 surface;\n\n// External\nvec3 getPosition(vec4 xyzw, float canonical);\n\nvoid getSurfaceGeometry(vec4 xyzw, float edgeX, float edgeY, out vec3 left, out vec3 center, out vec3 right, out vec3 up, out vec3 down) {\n  vec4 deltaX = vec4(1.0, 0.0, 0.0, 0.0);\n  vec4 deltaY = vec4(0.0, 1.0, 0.0, 0.0);\n\n  /*\n  // high quality, 5 tap\n  center =                  getPosition(xyzw, 1.0);\n  left   = (edgeX > -0.5) ? getPosition(xyzw - deltaX, 0.0) : center;\n  right  = (edgeX < 0.5)  ? getPosition(xyzw + deltaX, 0.0) : center;\n  down   = (edgeY > -0.5) ? getPosition(xyzw - deltaY, 0.0) : center;\n  up     = (edgeY < 0.5)  ? getPosition(xyzw + deltaY, 0.0) : center;\n  */\n  \n  // low quality, 3 tap\n  center =                  getPosition(xyzw, 1.0);\n  left   =                  center;\n  down   =                  center;\n  right  = (edgeX < 0.5)  ? getPosition(xyzw + deltaX, 0.0) : (2.0 * center - getPosition(xyzw - deltaX, 0.0));\n  up     = (edgeY < 0.5)  ? getPosition(xyzw + deltaY, 0.0) : (2.0 * center - getPosition(xyzw - deltaY, 0.0));\n}\n\nvec3 getSurfaceNormal(vec3 left, vec3 center, vec3 right, vec3 up, vec3 down) {\n  vec3 dx = right - left;\n  vec3 dy = up    - down;\n  vec3 n = cross(dy, dx);\n  if (length(n) > 0.0) {\n    return normalize(n);\n  }\n  return vec3(0.0, 1.0, 0.0);\n}\n\nvarying vec3 vNormal;\nvarying vec3 vLight;\nvarying vec3 vPosition;\n\nvec3 getSurfacePositionNormal() {\n  vec3 left, center, right, up, down;\n\n  vec4 p = min(geometryClip, position4);\n\n  getSurfaceGeometry(p, surface.x, surface.y, left, center, right, up, down);\n  vNormal   = getSurfaceNormal(left, center, right, up, down);\n  vLight    = normalize((viewMatrix * vec4(1.0, 2.0, 2.0, 0.0)).xyz); // hardcoded directional light\n  vPosition = -center;\n\n#ifdef POSITION_UV\n#ifdef POSITION_UV_INT\n  vUV = -.5 + (position4.xy * geometryResolution.xy) * mapSize.xy;\n#else\n  vUV = position4.xy * geometryResolution.xy;\n#endif\n#endif\n  \n  return center;\n}\n",
"ticks.position": "uniform float worldUnit;\nuniform float focusDepth;\nuniform float tickSize;\nuniform float tickEpsilon;\nuniform vec3  tickNormal;\nuniform vec2  tickStrip;\n\nvec4 getSample(vec4 xyzw);\n\nvec3 transformPosition(vec4 position, vec4 stpq);\n\nvec3 getTickPosition(vec4 xyzw, vec4 stpq) {\n\n  float epsilon = tickEpsilon;\n\n  // determine tick direction\n  float leftX  = max(tickStrip.x, xyzw.y - 1.0);\n  float rightX = min(tickStrip.y, xyzw.y + 1.0);\n  \n  vec4 left    = getSample(vec4(leftX,  xyzw.zw, 0.0));\n  vec4 right   = getSample(vec4(rightX, xyzw.zw, 0.0));\n  vec4 diff    = right - left;\n\n  vec3 normal  = cross(normalize(diff.xyz + vec3(diff.w)), tickNormal);\n  float bias   = max(0.0, 1.0 - length(normal) * 2.0);\n       normal  = mix(normal, tickNormal.yzx, bias * bias);\n  \n  // transform (point) and (point + delta)\n  vec4 center  = getSample(vec4(xyzw.yzw, 0.0));\n  vec4 delta   = vec4(normal, 0.0) * epsilon;\n\n  vec4 a = center;\n  vec4 b = center + delta;\n\n  vec3 c = transformPosition(a, stpq);\n  vec3 d = transformPosition(b, stpq);\n  \n  // sample on either side to create line\n  float line = xyzw.x - .5;\n  vec3  mid  = c;\n  vec3  side = normalize(d - c);\n\n  return mid + side * line * tickSize * worldUnit * focusDepth;\n}\n",
"transform3.position": "uniform mat4 transformMatrix;\n\nvec4 transformPosition(vec4 position, inout vec4 stpq) {\n  return transformMatrix * vec4(position.xyz, 1.0);\n}\n",
"transform4.position": "uniform mat4 transformMatrix;\nuniform vec4 transformOffset;\n\nvec4 transformPosition(vec4 position, inout vec4 stpq) {\n  return transformMatrix * position + transformOffset;\n}\n",
"view.position": "// Implicit three.js uniform\n// uniform mat4 viewMatrix;\n\nvec4 getViewPosition(vec4 position, inout vec4 stpq) {\n  return (viewMatrix * vec4(position.xyz, 1.0));\n}\n"};

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":3,"ieee754":4}],3:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var inherits = require('inherits');
var setImmediate = require('process/browser.js').nextTick;
var Readable = require('./readable.js');
var Writable = require('./writable.js');

inherits(Duplex, Readable);

Duplex.prototype.write = Writable.prototype.write;
Duplex.prototype.end = Writable.prototype.end;
Duplex.prototype._write = Writable.prototype._write;

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  var self = this;
  setImmediate(function () {
    self.end();
  });
}

},{"./readable.js":12,"./writable.js":14,"inherits":6,"process/browser.js":10}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('./readable.js');
Stream.Writable = require('./writable.js');
Stream.Duplex = require('./duplex.js');
Stream.Transform = require('./transform.js');
Stream.PassThrough = require('./passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"./duplex.js":8,"./passthrough.js":11,"./readable.js":12,"./transform.js":13,"./writable.js":14,"events":5,"inherits":6}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./transform.js');
var inherits = require('inherits');
inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./transform.js":13,"inherits":6}],12:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;
Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;
var Stream = require('./index.js');
var Buffer = require('buffer').Buffer;
var setImmediate = require('process/browser.js').nextTick;
var StringDecoder;

var inherits = require('inherits');
inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || n === null) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode &&
      !er) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    setImmediate(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    setImmediate(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    setImmediate(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  // check for listeners before emit removes one-time listeners.
  var errListeners = EE.listenerCount(dest, 'error');
  function onerror(er) {
    unpipe();
    if (errListeners === 0 && EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  dest.once('error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    setImmediate(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      setImmediate(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, function (x) {
      return self.emit.apply(self, ev, x);
    });
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    setImmediate(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require("+xKvab"))
},{"+xKvab":7,"./index.js":9,"buffer":2,"events":5,"inherits":6,"process/browser.js":10,"string_decoder":15}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./duplex.js');
var inherits = require('inherits');
inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./duplex.js":8,"inherits":6}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;
Writable.WritableState = WritableState;

var isUint8Array = typeof Uint8Array !== 'undefined'
  ? function (x) { return x instanceof Uint8Array }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'Uint8Array'
  }
;
var isArrayBuffer = typeof ArrayBuffer !== 'undefined'
  ? function (x) { return x instanceof ArrayBuffer }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'ArrayBuffer'
  }
;

var inherits = require('inherits');
var Stream = require('./index.js');
var setImmediate = require('process/browser.js').nextTick;
var Buffer = require('buffer').Buffer;

inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function Writable(options) {
  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Stream.Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  setImmediate(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    setImmediate(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (!Buffer.isBuffer(chunk) && isUint8Array(chunk))
    chunk = new Buffer(chunk);
  if (isArrayBuffer(chunk) && typeof Uint8Array !== 'undefined')
    chunk = new Buffer(new Uint8Array(chunk));
  
  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    setImmediate(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      setImmediate(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      setImmediate(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./index.js":9,"buffer":2,"inherits":6,"process/browser.js":10}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}

},{"buffer":2}],16:[function(require,module,exports){
module.exports = language

var tokenizer = require('./tokenizer')

function language(lookups) {
  return function(selector) {
    return parse(selector, remap(lookups))
  }
}

function remap(opts) {
  for(var key in opts) if(opt_okay(opts, key)) {
    opts[key] = Function(
        'return function(node, attr) { return node.' + opts[key] + ' }'
    )
    opts[key] = opts[key]()
  }

  return opts
}

function opt_okay(opts, key) {
  return opts.hasOwnProperty(key) && typeof opts[key] === 'string'
}

function parse(selector, options) {
  var stream = tokenizer()
    , default_subj = true
    , selectors = [[]]
    , traversal
    , bits

  bits = selectors[0]

  traversal = {
      '': any_parents
    , '>': direct_parent
    , '+': direct_sibling
    , '~': any_sibling
  }

  stream
    .on('data', group)
    .end(selector)

  function group(token) {
    var crnt

    if(token.type === 'comma') {
      selectors.unshift(bits = [])

      return
    }

    if(token.type === 'op' || token.type === 'any-child') {
      bits.unshift(traversal[token.data])
      bits.unshift(check())

      return
    }

    bits[0] = bits[0] || check()
    crnt = bits[0]

    if(token.type === '!') {
      crnt.subject =
      selectors[0].subject = true

      return
    }

    crnt.push(
        token.type === 'class' ? listContains(token.type, token.data) :
        token.type === 'attr' ? attr(token) :
        token.type === ':' || token.type === '::' ? pseudo(token) :
        token.type === '*' ? Boolean :
        matches(token.type, token.data)
    )
  }

  return selector_fn

  function selector_fn(node, as_boolean) {
    var current
      , length
      , orig
      , subj
      , set

    orig = node
    set = []

    for(var i = 0, len = selectors.length; i < len; ++i) {
      bits = selectors[i]
      current = entry
      length = bits.length
      node = orig
      subj = []

      for(var j = 0; j < length; j += 2) {
        node = current(node, bits[j], subj)

        if(!node) {
          break
        }

        current = bits[j + 1]
      }

      if(j >= length) {
        if(as_boolean) {
          return true
        }

        add(!bits.subject ? [orig] : subj)
      }
    }

    if(as_boolean) {
      return false
    }

    return !set.length ? false :
            set.length === 1 ? set[0] :
            set

    function add(items) {
      var next

      while(items.length) {
        next = items.shift()

        if(set.indexOf(next) === -1) {
          set.push(next)
        }
      }
    }
  }

  function check() {
    _check.bits = []
    _check.subject = false
    _check.push = function(token) {
      _check.bits.push(token)
    }

    return _check

    function _check(node, subj) {
      for(var i = 0, len = _check.bits.length; i < len; ++i) {
        if(!_check.bits[i](node)) {
          return false
        }
      }

      if(_check.subject) {
        subj.push(node)
      }

      return true
    }
  }

  function listContains(type, data) {
    return function(node) {
      var val = options[type](node)
      val =
        Array.isArray(val) ? val :
        val ? val.toString().split(/\s+/) :
        []
      return val.indexOf(data) >= 0
    }
  }

  function attr(token) {
    return token.data.lhs ?
      valid_attr(
          options.attr
        , token.data.lhs
        , token.data.cmp
        , token.data.rhs
      ) :
      valid_attr(options.attr, token.data)
  }

  function matches(type, data) {
    return function(node) {
      return options[type](node) == data
    }
  }

  function any_parents(node, next, subj) {
    do {
      node = options.parent(node)
    } while(node && !next(node, subj))

    return node
  }

  function direct_parent(node, next, subj) {
    node = options.parent(node)

    return node && next(node, subj) ? node : null
  }

  function direct_sibling(node, next, subj) {
    var parent = options.parent(node)
      , idx = 0
      , children

    children = options.children(parent)

    for(var i = 0, len = children.length; i < len; ++i) {
      if(children[i] === node) {
        idx = i

        break
      }
    }

    return children[idx - 1] && next(children[idx - 1], subj) ?
      children[idx - 1] :
      null
  }

  function any_sibling(node, next, subj) {
    var parent = options.parent(node)
      , children

    children = options.children(parent)

    for(var i = 0, len = children.length; i < len; ++i) {
      if(children[i] === node) {
        return null
      }

      if(next(children[i], subj)) {
        return children[i]
      }
    }

    return null
  }

  function pseudo(token) {
    return valid_pseudo(options, token.data)
  }

}

function entry(node, next, subj) {
  return next(node, subj) ? node : null
}

function valid_pseudo(options, match) {
  switch(match) {
    case 'empty': return valid_empty(options)
    case 'first-child': return valid_first_child(options)
    case 'last-child': return valid_last_child(options)
    case 'root': return valid_root(options)
  }

  if(match.indexOf('contains') === 0) {
    return valid_contains(options, match.slice(9, -1))
  }

  if(match.indexOf('any') === 0) {
    return valid_any_match(options, match.slice(4, -1))
  }

  if(match.indexOf('not') === 0) {
    return valid_not_match(options, match.slice(4, -1))
  }

  return function() {
    return false
  }
}

function valid_not_match(options, selector) {
  var fn = parse(selector, options)

  return not_function

  function not_function(node) {
    return !fn(node, true)
  }
}

function valid_any_match(options, selector) {
  var fn = parse(selector, options)

  return fn
}

function valid_attr(fn, lhs, cmp, rhs) {
  return function(node) {
    var attr = fn(node, lhs)

    if(!cmp) {
      return !!attr
    }

    if(cmp.length === 1) {
      return attr == rhs
    }

    if(attr === void 0 || attr === null) {
      return false
    }

    return checkattr[cmp.charAt(0)](attr, rhs)
  }
}

function valid_first_child(options) {
  return function(node) {
    return options.children(options.parent(node))[0] === node
  }
}

function valid_last_child(options) {
  return function(node) {
    var children = options.children(options.parent(node))

    return children[children.length - 1] === node
  }
}

function valid_empty(options) {
  return function(node) {
    return options.children(node).length === 0
  }
}

function valid_root(options) {
  return function(node) {
    return !options.parent(node)
  }
}

function valid_contains(options, contents) {
  return function(node) {
    return options.contents(node).indexOf(contents) !== -1
  }
}

var checkattr = {
    '$': check_end
  , '^': check_beg
  , '*': check_any
  , '~': check_spc
  , '|': check_dsh
}

function check_end(l, r) {
  return l.slice(l.length - r.length) === r
}

function check_beg(l, r) {
  return l.slice(0, r.length) === r
}

function check_any(l, r) {
  return l.indexOf(r) > -1
}

function check_spc(l, r) {
  return l.split(/\s+/).indexOf(r) > -1
}

function check_dsh(l, r) {
  return l.split('-').indexOf(r) > -1
}

},{"./tokenizer":18}],17:[function(require,module,exports){
(function (process){
var Stream = require('stream')

// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)

exports = module.exports = through
through.through = through

//create a readable writable stream.

function through (write, end, opts) {
  write = write || function (data) { this.queue(data) }
  end = end || function () { this.queue(null) }

  var ended = false, destroyed = false, buffer = [], _ended = false
  var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false

//  stream.autoPause   = !(opts && opts.autoPause   === false)
  stream.autoDestroy = !(opts && opts.autoDestroy === false)

  stream.write = function (data) {
    write.call(this, data)
    return !stream.paused
  }

  function drain() {
    while(buffer.length && !stream.paused) {
      var data = buffer.shift()
      if(null === data)
        return stream.emit('end')
      else
        stream.emit('data', data)
    }
  }

  stream.queue = stream.push = function (data) {
//    console.error(ended)
    if(_ended) return stream
    if(data === null) _ended = true
    buffer.push(data)
    drain()
    return stream
  }

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

  stream.on('end', function () {
    stream.readable = false
    if(!stream.writable && stream.autoDestroy)
      process.nextTick(function () {
        stream.destroy()
      })
  })

  function _end () {
    stream.writable = false
    end.call(stream)
    if(!stream.readable && stream.autoDestroy)
      stream.destroy()
  }

  stream.end = function (data) {
    if(ended) return
    ended = true
    if(arguments.length) stream.write(data)
    _end() // will emit or queue
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = true
    ended = true
    buffer.length = 0
    stream.writable = stream.readable = false
    stream.emit('close')
    return stream
  }

  stream.pause = function () {
    if(stream.paused) return
    stream.paused = true
    return stream
  }

  stream.resume = function () {
    if(stream.paused) {
      stream.paused = false
      stream.emit('resume')
    }
    drain()
    //may have become paused again,
    //as drain emits 'data'.
    if(!stream.paused)
      stream.emit('drain')
    return stream
  }
  return stream
}


}).call(this,require("+xKvab"))
},{"+xKvab":7,"stream":9}],18:[function(require,module,exports){
module.exports = tokenize

var through = require('through')

var PSEUDOSTART = 'pseudo-start'
  , ATTR_START = 'attr-start'
  , ANY_CHILD = 'any-child'
  , ATTR_COMP = 'attr-comp'
  , ATTR_END = 'attr-end'
  , PSEUDOPSEUDO = '::'
  , PSEUDOCLASS = ':'
  , READY = '(ready)'
  , OPERATION = 'op'
  , CLASS = 'class'
  , COMMA = 'comma'
  , ATTR = 'attr'
  , SUBJECT = '!'
  , TAG = 'tag'
  , STAR = '*'
  , ID = 'id'

function tokenize() {
  var escaped = false
    , gathered = []
    , state = READY 
    , data = []
    , idx = 0
    , stream
    , length
    , quote
    , depth
    , lhs
    , rhs
    , cmp
    , c

  return stream = through(ondata, onend)

  function ondata(chunk) {
    data = data.concat(chunk.split(''))
    length = data.length

    while(idx < length && (c = data[idx++])) {
      switch(state) {
        case READY: state_ready(); break
        case ANY_CHILD: state_any_child(); break
        case OPERATION: state_op(); break
        case ATTR_START: state_attr_start(); break
        case ATTR_COMP: state_attr_compare(); break
        case ATTR_END: state_attr_end(); break
        case PSEUDOCLASS:
        case PSEUDOPSEUDO: state_pseudo(); break
        case PSEUDOSTART: state_pseudostart(); break
        case ID:
        case TAG:
        case CLASS: state_gather(); break
      }
    }

    data = data.slice(idx)
  }

  function onend(chunk) {
    if(arguments.length) {
      ondata(chunk)
    }

    if(gathered.length) {
      stream.queue(token())
    }
  }

  function state_ready() {
    switch(true) {
      case '#' === c: state = ID; break
      case '.' === c: state = CLASS; break
      case ':' === c: state = PSEUDOCLASS; break
      case '[' === c: state = ATTR_START; break
      case '!' === c: subject(); break
      case '*' === c: star(); break
      case ',' === c: comma(); break
      case /[>\+~]/.test(c): state = OPERATION; break
      case /\s/.test(c): state = ANY_CHILD; break
      case /[\w\d\-_]/.test(c): state = TAG; --idx; break
    }
  }

  function subject() {
    state = SUBJECT
    gathered = ['!']
    stream.queue(token())
    state = READY
  }

  function star() {
    state = STAR
    gathered = ['*']
    stream.queue(token())
    state = READY
  }

  function comma() {
    state = COMMA
    gathered = [',']
    stream.queue(token())
    state = READY
  }

  function state_op() {
    if(/[>\+~]/.test(c)) {
      return gathered.push(c)
    }

    // chomp down the following whitespace.
    if(/\s/.test(c)) {
      return
    }

    stream.queue(token())
    state = READY
    --idx
  }

  function state_any_child() {
    if(/\s/.test(c)) {
      return
    }

    if(/[>\+~]/.test(c)) {
      return --idx, state = OPERATION
    }

    stream.queue(token())
    state = READY
    --idx
  }

  function state_pseudo() {
    rhs = state
    state_gather(true)

    if(state !== READY) {
      return
    }

    if(c === '(') {
      lhs = gathered.join('')
      state = PSEUDOSTART
      gathered.length = 0
      depth = 1
      ++idx

      return
    }

    state = PSEUDOCLASS
    stream.queue(token())
    state = READY
  }

  function state_pseudostart() {
    if(gathered.length === 0 && !quote) {
      quote = /['"]/.test(c) ? c : null

      if(quote) {
        return
      }
    }

    if(quote) {
      if(!escaped && c === quote) {
        quote = null

        return
      }

      if(c === '\\') {
        escaped ? gathered.push(c) : (escaped = true)

        return
      }

      escaped = false
      gathered.push(c)

      return
    }

    gathered.push(c)

    if(c === '(') {
      ++depth
    } else if(c === ')') {
      --depth
    }
    
    if(!depth) {
      gathered.pop()
      stream.queue({
          type: rhs 
        , data: lhs + '(' + gathered.join('') + ')'
      })

      state = READY
      lhs = rhs = cmp = null
      gathered.length = 0
    }

    return 
  }

  function state_attr_start() {
    state_gather(true)

    if(state !== READY) {
      return
    }

    if(c === ']') {
      state = ATTR
      stream.queue(token())
      state = READY

      return
    }

    lhs = gathered.join('')
    gathered.length = 0
    state = ATTR_COMP
  }

  function state_attr_compare() {
    if(/[=~|$^*]/.test(c)) {
      gathered.push(c)
    }

    if(gathered.length === 2 || c === '=') {
      cmp = gathered.join('')
      gathered.length = 0
      state = ATTR_END
      quote = null

      return
    }
  }

  function state_attr_end() {
    if(!gathered.length && !quote) {
      quote = /['"]/.test(c) ? c : null

      if(quote) {
        return
      }
    }

    if(quote) {
      if(!escaped && c === quote) {
        quote = null

        return
      }

      if(c === '\\') {
        if(escaped) {
          gathered.push(c)
        }

        escaped = !escaped

        return
      }

      escaped = false
      gathered.push(c)

      return
    }

    state_gather(true)

    if(state !== READY) {
      return
    }

    stream.queue({
        type: ATTR
      , data: {
            lhs: lhs
          , rhs: gathered.join('')
          , cmp: cmp
        }
    })

    state = READY
    lhs = rhs = cmp = null
    gathered.length = 0

    return 
  }

  function state_gather(quietly) {
    if(/[^\d\w\-_]/.test(c) && !escaped) {
      if(c === '\\') {
        escaped = true
      } else {
        !quietly && stream.queue(token())
        state = READY
        --idx
      }

      return
    }

    escaped = false
    gathered.push(c)
  }

  function token() {
    var data = gathered.join('')

    gathered.length = 0

    return {
        type: state
      , data: data
    }
  }
}

},{"through":17}],19:[function(require,module,exports){
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

exports.setOrigin = function(vec, dimensions, origin) {
  var w, x, y, z;
  if (+dimensions === dimensions) {
    dimensions = [dimensions];
  }
  x = __indexOf.call(dimensions, 1) >= 0 ? 0 : origin.x;
  y = __indexOf.call(dimensions, 2) >= 0 ? 0 : origin.y;
  z = __indexOf.call(dimensions, 3) >= 0 ? 0 : origin.z;
  w = __indexOf.call(dimensions, 4) >= 0 ? 0 : origin.w;
  return vec.set(x, y, z, w);
};

exports.addOrigin = (function() {
  var v;
  v = new THREE.Vector4;
  return function(vec, dimension, origin) {
    exports.setOrigin(v, dimension, origin);
    return vec.add(v);
  };
})();

exports.setDimension = function(vec, dimension) {
  var w, x, y, z;
  x = dimension === 1 ? 1 : 0;
  y = dimension === 2 ? 1 : 0;
  z = dimension === 3 ? 1 : 0;
  w = dimension === 4 ? 1 : 0;
  return vec.set(x, y, z, w);
};

exports.setDimensionNormal = function(vec, dimension) {
  var w, x, y, z;
  x = dimension === 1 ? 1 : 0;
  y = dimension === 2 ? 1 : 0;
  z = dimension === 3 ? 1 : 0;
  w = dimension === 4 ? 1 : 0;
  return vec.set(y, z + x, w, 0);
};

exports.recenterAxis = (function() {
  var axis;
  axis = [0, 0];
  return function(x, dx, bend, f) {
    var abs, fabs, max, min, x1, x2;
    if (f == null) {
      f = 0;
    }
    if (bend > 0) {
      x1 = x;
      x2 = x + dx;
      abs = Math.max(Math.abs(x1), Math.abs(x2));
      fabs = abs * f;
      min = Math.min(x1, x2);
      max = Math.max(x1, x2);
      x = min + (-abs + fabs - min) * bend;
      dx = max + (abs + fabs - max) * bend - x;
    }
    axis[0] = x;
    axis[1] = dx;
    return axis;
  };
})();


},{}],20:[function(require,module,exports){
var getSizes;

exports.getSizes = getSizes = function(data) {
  var array, sizes;
  sizes = [];
  array = data;
  while (typeof array !== 'string' && ((array != null ? array.length : void 0) != null)) {
    sizes.push(array.length);
    array = array[0];
  }
  return sizes;
};

exports.getDimensions = function(data, spec) {
  var channels, depth, dims, height, items, levels, n, nesting, sizes, width, _ref, _ref1, _ref2, _ref3, _ref4;
  if (spec == null) {
    spec = {};
  }
  items = spec.items, channels = spec.channels, width = spec.width, height = spec.height, depth = spec.depth;
  dims = {};
  if (!data || !data.length) {
    return {
      items: items,
      channels: channels,
      width: width != null ? width : 0,
      height: height != null ? height : 0,
      depth: depth != null ? depth : 0
    };
  }
  sizes = getSizes(data);
  nesting = sizes.length;
  dims.channels = channels !== 1 && sizes.length > 1 ? sizes.pop() : channels;
  dims.items = items !== 1 && sizes.length > 1 ? sizes.pop() : items;
  dims.width = width !== 1 && sizes.length > 1 ? sizes.pop() : width;
  dims.height = height !== 1 && sizes.length > 1 ? sizes.pop() : height;
  dims.depth = depth !== 1 && sizes.length > 1 ? sizes.pop() : depth;
  levels = nesting;
  if (channels === 1) {
    levels++;
  }
  if (items === 1 && levels > 1) {
    levels++;
  }
  if (width === 1 && levels > 2) {
    levels++;
  }
  if (height === 1 && levels > 3) {
    levels++;
  }
  n = (_ref = sizes.pop()) != null ? _ref : 1;
  if (levels <= 1) {
    n /= (_ref1 = dims.channels) != null ? _ref1 : 1;
  }
  if (levels <= 2) {
    n /= (_ref2 = dims.items) != null ? _ref2 : 1;
  }
  if (levels <= 3) {
    n /= (_ref3 = dims.width) != null ? _ref3 : 1;
  }
  if (levels <= 4) {
    n /= (_ref4 = dims.height) != null ? _ref4 : 1;
  }
  n = Math.floor(n);
  if (dims.width == null) {
    dims.width = n;
    n = 1;
  }
  if (dims.height == null) {
    dims.height = n;
    n = 1;
  }
  if (dims.depth == null) {
    dims.depth = n;
    n = 1;
  }
  return dims;
};

exports.repeatCall = function(call, times) {
  switch (times) {
    case 0:
      return function() {
        return true;
      };
    case 1:
      return function() {
        return call();
      };
    case 2:
      return function() {
        call();
        return call();
      };
    case 3:
      return function() {
        call();
        call();
        call();
        return call();
      };
    case 4:
      return function() {
        call();
        call();
        call();
        return call();
      };
    case 6:
      return function() {
        call();
        call();
        call();
        call();
        call();
        return call();
      };
    case 8:
      return function() {
        call();
        call();
        call();
        call();
        call();
        return call();
      };
  }
};

exports.makeEmitter = function(thunk, items, channels) {
  var inner, outer;
  inner = (function() {
    switch (channels) {
      case 0:
        return function() {
          return true;
        };
      case 1:
        return function(emit) {
          return emit(thunk());
        };
      case 2:
        return function(emit) {
          return emit(thunk(), thunk());
        };
      case 3:
        return function(emit) {
          return emit(thunk(), thunk(), thunk());
        };
      case 4:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk());
        };
      case 6:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk(), thunk(), thunk());
        };
      case 8:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk(), thunk(), thunk(), thunk(), thunk());
        };
    }
  })();
  outer = (function() {
    switch (items) {
      case 0:
        return function() {
          return true;
        };
      case 1:
        return function(emit) {
          return inner(emit);
        };
      case 2:
        return function(emit) {
          inner(emit);
          return inner(emit);
        };
      case 3:
        return function(emit) {
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 4:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 6:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 8:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
    }
  })();
  outer.reset = thunk.reset;
  outer.rebind = thunk.rebind;
  return outer;
};

exports.getThunk = function(data) {
  var a, b, c, d, done, first, fourth, i, j, k, l, m, nesting, second, sizes, third, thunk, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
  sizes = getSizes(data);
  nesting = sizes.length;
  a = sizes.pop();
  b = sizes.pop();
  c = sizes.pop();
  d = sizes.pop();
  done = false;
  switch (nesting) {
    case 0:
      thunk = function() {
        return 0;
      };
      thunk.reset = function() {};
      break;
    case 1:
      i = 0;
      thunk = function() {
        return data[i++];
      };
      thunk.reset = function() {
        return i = 0;
      };
      break;
    case 2:
      i = j = 0;
      first = (_ref = data[j]) != null ? _ref : [];
      thunk = function() {
        var x, _ref1;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          first = (_ref1 = data[j]) != null ? _ref1 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref1;
        i = j = 0;
        first = (_ref1 = data[j]) != null ? _ref1 : [];
      };
      break;
    case 3:
      i = j = k = 0;
      second = (_ref1 = data[k]) != null ? _ref1 : [];
      first = (_ref2 = second[j]) != null ? _ref2 : [];
      thunk = function() {
        var x, _ref3, _ref4;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            second = (_ref3 = data[k]) != null ? _ref3 : [];
          }
          first = (_ref4 = second[j]) != null ? _ref4 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref3, _ref4;
        i = j = k = 0;
        second = (_ref3 = data[k]) != null ? _ref3 : [];
        first = (_ref4 = second[j]) != null ? _ref4 : [];
      };
      break;
    case 4:
      i = j = k = l = 0;
      third = (_ref3 = data[l]) != null ? _ref3 : [];
      second = (_ref4 = third[k]) != null ? _ref4 : [];
      first = (_ref5 = second[j]) != null ? _ref5 : [];
      thunk = function() {
        var x, _ref6, _ref7, _ref8;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            if (k === c) {
              k = 0;
              l++;
              third = (_ref6 = data[l]) != null ? _ref6 : [];
            }
            second = (_ref7 = third[k]) != null ? _ref7 : [];
          }
          first = (_ref8 = second[j]) != null ? _ref8 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref6, _ref7, _ref8;
        i = j = k = l = 0;
        third = (_ref6 = data[l]) != null ? _ref6 : [];
        second = (_ref7 = third[k]) != null ? _ref7 : [];
        first = (_ref8 = second[j]) != null ? _ref8 : [];
      };
      break;
    case 5:
      i = j = k = l = m = 0;
      fourth = (_ref6 = data[m]) != null ? _ref6 : [];
      third = (_ref7 = fourth[l]) != null ? _ref7 : [];
      second = (_ref8 = third[k]) != null ? _ref8 : [];
      first = (_ref9 = second[j]) != null ? _ref9 : [];
      thunk = function() {
        var x, _ref10, _ref11, _ref12, _ref13;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            if (k === c) {
              k = 0;
              l++;
              if (l === d) {
                l = 0;
                m++;
                fourth = (_ref10 = data[m]) != null ? _ref10 : [];
              }
              third = (_ref11 = fourth[l]) != null ? _ref11 : [];
            }
            second = (_ref12 = third[k]) != null ? _ref12 : [];
          }
          first = (_ref13 = second[j]) != null ? _ref13 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref10, _ref11, _ref12, _ref13;
        i = j = k = l = m = 0;
        fourth = (_ref10 = data[m]) != null ? _ref10 : [];
        third = (_ref11 = fourth[l]) != null ? _ref11 : [];
        second = (_ref12 = third[k]) != null ? _ref12 : [];
        first = (_ref13 = second[j]) != null ? _ref13 : [];
      };
  }
  thunk.rebind = function(d) {
    data = d;
    sizes = getSizes(data);
    if (sizes.length) {
      a = sizes.pop();
    }
    if (sizes.length) {
      b = sizes.pop();
    }
    if (sizes.length) {
      c = sizes.pop();
    }
    if (sizes.length) {
      return d = sizes.pop();
    }
  };
  return thunk;
};

exports.getStreamer = function(array, samples, channels, items) {
  var consume, count, done, emit, i, j, limit, reset, skip;
  limit = i = j = 0;
  reset = function() {
    limit = samples * channels * items;
    return i = j = 0;
  };
  count = function() {
    return j;
  };
  done = function() {
    return limit - i <= 0;
  };
  skip = (function() {
    switch (channels) {
      case 1:
        return function(n) {
          i += n;
          j += n;
        };
      case 2:
        return function(n) {
          i += n * 2;
          j += n;
        };
      case 3:
        return function(n) {
          i += n * 3;
          j += n;
        };
      case 4:
        return function(n) {
          i += n * 4;
          j += n;
        };
    }
  })();
  consume = (function() {
    switch (channels) {
      case 1:
        return function(emit) {
          emit(array[i++]);
          ++j;
        };
      case 2:
        return function(emit) {
          emit(array[i++], array[i++]);
          ++j;
        };
      case 3:
        return function(emit) {
          emit(array[i++], array[i++], array[i++]);
          ++j;
        };
      case 4:
        return function(emit) {
          emit(array[i++], array[i++], array[i++], array[i++]);
          ++j;
        };
    }
  })();
  emit = (function() {
    switch (channels) {
      case 1:
        return function(x) {
          array[i++] = x;
          ++j;
        };
      case 2:
        return function(x, y) {
          array[i++] = x;
          array[i++] = y;
          ++j;
        };
      case 3:
        return function(x, y, z) {
          array[i++] = x;
          array[i++] = y;
          array[i++] = z;
          ++j;
        };
      case 4:
        return function(x, y, z, w) {
          array[i++] = x;
          array[i++] = y;
          array[i++] = z;
          array[i++] = w;
          ++j;
        };
    }
  })();
  consume.reset = reset;
  emit.reset = reset;
  reset();
  return {
    emit: emit,
    consume: consume,
    skip: skip,
    count: count,
    done: done,
    reset: reset
  };
};

exports.getLerpEmitter = function(expr1, expr2) {
  var args, emit1, emit2, emitter, lerp1, lerp2, p, q, r, s, scratch;
  scratch = new Float32Array(4096);
  lerp1 = lerp2 = 0.5;
  p = q = r = s = 0;
  emit1 = function(x, y, z, w) {
    r++;
    scratch[p++] = x * lerp1;
    scratch[p++] = y * lerp1;
    scratch[p++] = z * lerp1;
    return scratch[p++] = w * lerp1;
  };
  emit2 = function(x, y, z, w) {
    s++;
    scratch[q++] += x * lerp2;
    scratch[q++] += y * lerp2;
    scratch[q++] += z * lerp2;
    return scratch[q++] += w * lerp2;
  };
  args = Math.max(expr1.length, expr2.length);
  if (args <= 3) {
    emitter = function(emit, x, i) {
      var k, l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, i);
      expr2(emit2, x, i);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 5) {
    emitter = function(emit, x, y, i, j) {
      var k, l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, i, j);
      expr2(emit2, x, y, i, j);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 7) {
    emitter = function(emit, x, y, z, i, j, k) {
      var l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, z, i, j, k);
      expr2(emit2, x, y, z, i, j, k);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 9) {
    emitter = function(emit, x, y, z, w, i, j, k, l) {
      var n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, z, w, i, j, k, l);
      expr2(emit2, x, y, z, w, i, j, k, l);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else {
    emitter = function(emit, x, y, z, w, i, j, k, l, d, t) {
      var n, _i, _results;
      p = q = 0;
      expr1(emit1, x, y, z, w, i, j, k, l, d, t);
      expr2(emit2, x, y, z, w, i, j, k, l, d, t);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  }
  emitter.lerp = function(f) {
    var _ref;
    return _ref = [1 - f, f], lerp1 = _ref[0], lerp2 = _ref[1], _ref;
  };
  return emitter;
};


},{}],21:[function(require,module,exports){
var ease, π;

π = Math.PI;

ease = {
  clamp: function(x, a, b) {
    return Math.max(a, Math.min(b, x));
  },
  cosine: function(x) {
    return .5 - .5 * Math.cos(ease.clamp(x, 0, 1) * π);
  }
};

module.exports = ease;


},{}],22:[function(require,module,exports){
var index, letters, parseOrder, toFloatString, toType,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

letters = 'xyzw'.split('');

index = {
  0: -1,
  x: 0,
  y: 1,
  z: 2,
  w: 3
};

parseOrder = function(order) {
  if (order === "" + order) {
    order = order.split('');
  }
  if (order === +order) {
    order = [order];
  }
  return order;
};

toType = function(type) {
  if (type === +type) {
    type = 'vec' + type;
  }
  if (type === 'vec1') {
    type = 'float';
  }
  return type;
};

toFloatString = function(value) {
  value = "" + value;
  if (value.indexOf('.') < 0) {
    return value += '.0';
  }
};

exports.mapByte2FloatOffset = function(stretch) {
  var factor;
  if (stretch == null) {
    stretch = 4;
  }
  factor = toFloatString(stretch);
  return "vec4 float2ByteIndex(vec4 xyzw, out float channelIndex) {\n  float relative = xyzw.w / " + factor + ";\n  float w = floor(relative);\n  channelIndex = (relative - w) * " + factor + ";\n  return vec4(xyzw.xyz, w);\n}";
};

exports.sample2DArray = function(textures) {
  var body, divide;
  divide = function(a, b) {
    var mid, out;
    if (a === b) {
      out = "return texture2D(dataTextures[" + a + "], uv);";
    } else {
      mid = Math.ceil(a + (b - a) / 2);
      out = "if (z < " + (mid - .5) + ") {\n  " + (divide(a, mid - 1)) + "\n}\nelse {\n  " + (divide(mid, b)) + "\n}";
    }
    return out = out.replace(/\n/g, "\n  ");
  };
  body = divide(0, textures - 1);
  return "uniform sampler2D dataTextures[" + textures + "];\n\nvec4 sample2DArray(vec2 uv, float z) {\n  " + body + "\n}";
};

exports.binaryOperator = function(type, op, curry) {
  type = toType(type);
  if (curry != null) {
    return "" + type + " binaryOperator(" + type + " a) {\n  return a " + op + " " + curry + ";\n}";
  } else {
    return "" + type + " binaryOperator(" + type + " a, " + type + " b) {\n  return a " + op + " b;\n}";
  }
};

exports.extendVec = function(from, to, value) {
  var ctor, diff, parts, _i, _results;
  if (value == null) {
    value = 0;
  }
  if (from > to) {
    return exports.truncateVec(from, to);
  }
  diff = to - from;
  from = toType(from);
  to = toType(to);
  value = toFloatString(value);
  parts = (function() {
    _results = [];
    for (var _i = 0; 0 <= diff ? _i <= diff : _i >= diff; 0 <= diff ? _i++ : _i--){ _results.push(_i); }
    return _results;
  }).apply(this).map(function(x) {
    if (x) {
      return value;
    } else {
      return 'v';
    }
  });
  ctor = parts.join(',');
  return "" + to + " extendVec(" + from + " v) { return " + to + "(" + ctor + "); }";
};

exports.truncateVec = function(from, to) {
  var swizzle;
  if (from < to) {
    return exports.extendVec(from, to);
  }
  swizzle = '.' + ('xyzw'.substr(0, to));
  from = toType(from);
  to = toType(to);
  return "" + to + " truncateVec(" + from + " v) { return v" + swizzle + "; }";
};

exports.injectVec4 = function(order) {
  var args, channel, i, mask, swizzler, _i, _len;
  swizzler = ['0.0', '0.0', '0.0', '0.0'];
  order = parseOrder(order);
  order = order.map(function(v) {
    if (v === "" + v) {
      return index[v];
    } else {
      return v;
    }
  });
  for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
    channel = order[i];
    swizzler[channel] = ['a', 'b', 'c', 'd'][i];
  }
  mask = swizzler.slice(0, 4).join(', ');
  args = ['float a', 'float b', 'float c', 'float d'].slice(0, order.length);
  return "vec4 inject(" + args + ") {\n  return vec4(" + mask + ");\n}";
};

exports.swizzleVec4 = function(order, size) {
  var lookup, mask;
  if (size == null) {
    size = null;
  }
  lookup = ['0.0', 'xyzw.x', 'xyzw.y', 'xyzw.z', 'xyzw.w'];
  if (size == null) {
    size = order.length;
  }
  order = parseOrder(order);
  order = order.map(function(v) {
    if (__indexOf.call([0, 1, 2, 3, 4], +v) >= 0) {
      v = +v;
    }
    if (v === "" + v) {
      v = index[v] + 1;
    }
    return lookup[v];
  });
  while (order.length < size) {
    order.push('0.0');
  }
  mask = order.join(', ');
  return ("vec" + size + " swizzle(vec4 xyzw) {\n  return vec" + size + "(" + mask + ");\n}").replace(/vec1/g, 'float');
};

exports.invertSwizzleVec4 = function(order) {
  var i, j, letter, mask, src, swizzler, _i, _len;
  swizzler = ['0.0', '0.0', '0.0', '0.0'];
  order = parseOrder(order);
  order = order.map(function(v) {
    if (v === +v) {
      return letters[v - 1];
    } else {
      return v;
    }
  });
  for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
    letter = order[i];
    src = letters[i];
    j = index[letter];
    swizzler[j] = "xyzw." + src;
  }
  mask = swizzler.join(', ');
  return "vec4 invertSwizzle(vec4 xyzw) {\n  return vec4(" + mask + ");\n}";
};

exports.identity = function(type) {
  var args;
  args = [].slice.call(arguments);
  if (args.length > 1) {
    args = args.map(function(t, i) {
      return ['inout', t, String.fromCharCode(97 + i)].join(' ');
    });
    args = args.join(', ');
    return "void identity(" + args + ") { }";
  } else {
    return "" + type + " identity(" + type + " x) {\n  return x;\n}";
  }
};

exports.constant = function(type, value) {
  return "" + type + " constant() {\n  return " + value + ";\n}";
};

exports.toType = toType;


},{}],23:[function(require,module,exports){
exports.Axis = require('./axis');

exports.Data = require('./data');

exports.Ease = require('./ease');

exports.GLSL = require('./glsl');

exports.JS = require('./js');

exports.Pretty = require('./pretty');

exports.Three = require('./three');

exports.Ticks = require('./ticks');

exports.VDOM = require('./vdom');


},{"./axis":19,"./data":20,"./ease":21,"./glsl":22,"./js":24,"./pretty":25,"./three":26,"./ticks":27,"./vdom":28}],24:[function(require,module,exports){
exports.merge = function() {
  var k, obj, v, x, _i, _len;
  x = {};
  for (_i = 0, _len = arguments.length; _i < _len; _i++) {
    obj = arguments[_i];
    for (k in obj) {
      v = obj[k];
      x[k] = v;
    }
  }
  return x;
};

exports.clone = function(o) {
  return JSON.parse(JSON.serialize(o));
};

exports.parseQuoted = function(str) {
  var accum, char, chunk, list, munch, quote, token, unescape, _i, _len;
  accum = "";
  unescape = function(str) {
    return str = str.replace(/\\/g, '');
  };
  munch = function(next) {
    if (accum.length) {
      list.push(unescape(accum));
    }
    return accum = next != null ? next : "";
  };
  str = str.split(/(?=(?:\\.|["' ,]))/g);
  quote = false;
  list = [];
  for (_i = 0, _len = str.length; _i < _len; _i++) {
    chunk = str[_i];
    char = chunk[0];
    token = chunk.slice(1);
    switch (char) {
      case '"':
      case "'":
        if (quote) {
          if (quote === char) {
            quote = false;
            munch(token);
          } else {
            accum += chunk;
          }
        } else {
          if (accum !== '') {
            throw new Error("ParseError: String `" + str + "` does not contain comma-separated quoted tokens.");
          }
          quote = char;
          accum += token;
        }
        break;
      case ' ':
      case ',':
        if (!quote) {
          munch(token);
        } else {
          accum += chunk;
        }
        break;
      default:
        accum += chunk;
    }
  }
  munch();
  return list;
};


},{}],25:[function(require,module,exports){
var NUMBER_PRECISION, NUMBER_THRESHOLD, checkFactor, checkUnit, escapeHTML, formatFactors, formatFraction, formatMultiple, formatPrimes, prettyFormat, prettyJSXBind, prettyJSXPair, prettyJSXProp, prettyMarkup, prettyNumber, prettyPrint;

NUMBER_PRECISION = 5;

NUMBER_THRESHOLD = 0.0001;

checkFactor = function(v, f) {
  return Math.abs(v / f - Math.round(v / f)) < NUMBER_THRESHOLD;
};

checkUnit = function(v) {
  return checkFactor(v, 1);
};

formatMultiple = function(v, f, k, compact) {
  var d;
  d = Math.round(v / f);
  if (d === 1) {
    return "" + k;
  }
  if (d === -1) {
    return "-" + k;
  }
  if (k === '1') {
    return "" + d;
  }
  if (compact) {
    return "" + d + k;
  } else {
    return "" + d + "*" + k;
  }
};

formatFraction = function(v, f, k, compact) {
  var d;
  d = Math.round(v * f);
  if (Math.abs(d) === 1) {
    d = d < 0 ? "-" : "";
    d += k;
  } else if (k !== '1') {
    d += compact ? "" + k : "*" + k;
  }
  return "" + d + "/" + f;
};

formatFactors = [
  {
    1: 1
  }, {
    1: 1,
    τ: Math.PI * 2
  }, {
    1: 1,
    π: Math.PI
  }, {
    1: 1,
    τ: Math.PI * 2,
    π: Math.PI
  }, {
    1: 1,
    e: Math.E
  }, {
    1: 1,
    τ: Math.PI * 2,
    e: Math.E
  }, {
    1: 1,
    π: Math.PI,
    e: Math.E
  }, {
    1: 1,
    τ: Math.PI * 2,
    π: Math.PI,
    e: Math.E
  }
];

formatPrimes = [[2 * 2 * 3 * 5 * 7, [2, 3, 5, 7]], [2 * 2 * 2 * 3 * 3 * 5 * 5 * 7 * 7, [2, 3, 5, 7]], [2 * 2 * 3 * 5 * 7 * 11 * 13, [2, 3, 5, 7, 11, 13]], [2 * 2 * 17 * 19 * 23 * 29, [2, 17, 19, 23, 29]], [256 * 256, [2]], [1000000, [2, 5]]];

prettyNumber = function(options) {
  var cache, cacheIndex, compact, e, formatIndex, numberCache, pi, precision, tau, threshold;
  if (options) {
    cache = options.cache, compact = options.compact, tau = options.tau, pi = options.pi, e = options.e, threshold = options.threshold, precision = options.precision;
  }
  compact = +(!!(compact != null ? compact : true));
  tau = +(!!(tau != null ? tau : true));
  pi = +(!!(pi != null ? pi : true));
  e = +(!!(e != null ? e : true));
  cache = +(!!(cache != null ? cache : true));
  threshold = +(threshold != null ? threshold : NUMBER_THRESHOLD);
  precision = +(precision != null ? precision : NUMBER_PRECISION);
  formatIndex = tau + pi * 2 + e * 4;
  cacheIndex = formatIndex + threshold + precision;
  numberCache = cache ? {} : null;
  return function(v) {
    var best, cached, d, denom, f, k, list, match, n, numer, out, p, _i, _j, _len, _len1, _ref, _ref1;
    if (numberCache != null) {
      if ((cached = numberCache[v]) != null) {
        return cached;
      }
      if (v === Math.round(v)) {
        return numberCache[v] = "" + v;
      }
    }
    out = "" + v;
    best = out.length + out.indexOf('.') + 2;
    match = function(x) {
      var d;
      d = x.length;
      if (d <= best) {
        out = "" + x;
        return best = d;
      }
    };
    _ref = formatFactors[formatIndex];
    for (k in _ref) {
      f = _ref[k];
      if (checkUnit(v / f)) {
        match("" + (formatMultiple(v / f, 1, k, compact)));
      } else {
        for (_i = 0, _len = formatPrimes.length; _i < _len; _i++) {
          _ref1 = formatPrimes[_i], denom = _ref1[0], list = _ref1[1];
          numer = v / f * denom;
          if (checkUnit(numer)) {
            for (_j = 0, _len1 = list.length; _j < _len1; _j++) {
              p = list[_j];
              while (checkUnit(n = numer / p) && checkUnit(d = denom / p)) {
                numer = n;
                denom = d;
              }
            }
            match("" + (formatFraction(v / f, denom, k, compact)));
            break;
          }
        }
      }
    }
    if (("" + v).length > NUMBER_PRECISION) {
      match("" + (v.toPrecision(NUMBER_PRECISION)));
    }
    if (numberCache != null) {
      numberCache[v] = out;
    }
    return out;
  };
};

prettyPrint = function(markup, level) {
  if (level == null) {
    level = 'info';
  }
  markup = prettyMarkup(markup);
  return console[level].apply(console, markup);
};

prettyMarkup = function(markup) {
  var args, attr, nested, obj, quoted, str, tag, txt;
  tag = 'color:rgb(128,0,128)';
  attr = 'color:rgb(144,64,0)';
  str = 'color:rgb(0,0,192)';
  obj = 'color:rgb(0,70,156)';
  txt = 'color:inherit';
  quoted = false;
  nested = 0;
  args = [];
  markup = markup.replace(/(\\[<={}> "'])|(=>|[<={}> "'])/g, function(_, escape, char) {
    var res;
    if (escape != null ? escape.length : void 0) {
      return escape;
    }
    if (quoted && (char !== '"' && char !== "'")) {
      return char;
    }
    if (nested && (char !== '"' && char !== "'" && char !== '{' && char !== "}")) {
      return char;
    }
    return res = (function() {
      switch (char) {
        case '<':
          args.push(tag);
          return "%c<";
        case '>':
          args.push(tag);
          args.push(txt);
          return "%c>%c";
        case ' ':
          args.push(attr);
          return " %c";
        case '=':
        case '=>':
          args.push(tag);
          return "%c" + char;
        case '"':
        case "'":
          quoted = !quoted;
          if (quoted) {
            args.push(nested ? attr : str);
            return "" + char + "%c";
          } else {
            args.push(nested ? obj : tag);
            return "%c" + char;
          }
          break;
        case '{':
          if (nested++ === 0) {
            args.push(obj);
            return "%c" + char;
          } else {
            return char;
          }
          break;
        case '}':
          if (--nested === 0) {
            args.push(tag);
            return "" + char + "%c";
          } else {
            return char;
          }
          break;
        default:
          return char;
      }
    })();
  });
  return [markup].concat(args);
};

prettyJSXProp = function(k, v) {
  return prettyJSXPair(k, v, '=');
};

prettyJSXBind = function(k, v) {
  return prettyJSXPair(k, v, '=>');
};

prettyJSXPair = (function() {
  var formatNumber;
  formatNumber = prettyNumber({
    compact: false
  });
  return function(k, v, op) {
    var key, value, wrap;
    key = function(k) {
      if ((k === "" + +k) || k.match(/^[A-Za-z_][A-Za-z0-9]*$/)) {
        return k;
      } else {
        return JSON.stringify(k);
      }
    };
    wrap = function(v) {
      if (v.match('\n*"')) {
        return v;
      } else {
        return "{" + v + "}";
      }
    };
    value = function(v) {
      var kk, vv;
      if (v instanceof Array) {
        return "[" + (v.map(value).join(', ')) + "]";
      }
      switch (typeof v) {
        case 'string':
          if (v.match("\n")) {
            return "\"\n" + v + "\"\n";
          } else {
            return "\"" + v + "\"";
          }
          break;
        case 'function':
          v = "" + v;
          if (v.match("\n")) {
            "\n" + v + "\n";
          } else {
            "" + v;
          }
          v = v.replace(/^function (\([^)]+\))/, "$1 =>");
          return v = v.replace(/^(\([^)]+\)) =>\s*{\s*return\s*([^}]+)\s*;\s*}/, "$1 => $2");
        case 'number':
          return formatNumber(v);
        default:
          if ((v != null) && v !== !!v) {
            if (v._up != null) {
              return value(v.map(function(v) {
                return v;
              }));
            }
            if (v.toMarkup) {
              return v.toString();
            } else {
              return "{" + ((function() {
                var _results;
                _results = [];
                for (kk in v) {
                  vv = v[kk];
                  if (v.hasOwnProperty(kk)) {
                    _results.push("" + (key(kk)) + ": " + (value(vv)));
                  }
                }
                return _results;
              })()).join(", ") + "}";
            }
          } else {
            return "" + (JSON.stringify(v));
          }
      }
    };
    return [k, op, wrap(value(v))].join('');
  };
})();

escapeHTML = function(str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  return str = str.replace(/"/g, '&quot;');
};

prettyFormat = function(str) {
  var arg, args, out, _i, _len;
  args = [].slice.call(arguments);
  args.shift();
  out = "<span>";
  str = escapeHTML(str);
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    arg = args[_i];
    str = str.replace(/%([a-z])/, function(_, f) {
      var v;
      v = args.shift();
      switch (f) {
        case 'c':
          return "</span><span style=\"" + (escapeHTML(v)) + "\">";
        default:
          return escapeHTML(v);
      }
    });
  }
  out += str;
  return out += "</span>";
};

module.exports = {
  markup: prettyMarkup,
  number: prettyNumber,
  print: prettyPrint,
  format: prettyFormat,
  JSX: {
    prop: prettyJSXProp,
    bind: prettyJSXBind
  }
};


/*
for x in [1, 2, 1/2, 3, 1/3, Math.PI, Math.PI / 2, Math.PI * 2, Math.PI * 3, Math.PI * 4, Math.PI * 3 / 4, Math.E * 100, Math.E / 100]
  console.log prettyNumber({})(x)
 */


},{}],26:[function(require,module,exports){
exports.paramToGL = function(gl, p) {
  if (p === THREE.RepeatWrapping) {
    return gl.REPEAT;
  }
  if (p === THREE.ClampToEdgeWrapping) {
    return gl.CLAMP_TO_EDGE;
  }
  if (p === THREE.MirroredRepeatWrapping) {
    return gl.MIRRORED_REPEAT;
  }
  if (p === THREE.NearestFilter) {
    return gl.NEAREST;
  }
  if (p === THREE.NearestMipMapNearestFilter) {
    return gl.NEAREST_MIPMAP_NEAREST;
  }
  if (p === THREE.NearestMipMapLinearFilter) {
    return gl.NEAREST_MIPMAP_LINEAR;
  }
  if (p === THREE.LinearFilter) {
    return gl.LINEAR;
  }
  if (p === THREE.LinearMipMapNearestFilter) {
    return gl.LINEAR_MIPMAP_NEAREST;
  }
  if (p === THREE.LinearMipMapLinearFilter) {
    return gl.LINEAR_MIPMAP_LINEAR;
  }
  if (p === THREE.UnsignedByteType) {
    return gl.UNSIGNED_BYTE;
  }
  if (p === THREE.UnsignedShort4444Type) {
    return gl.UNSIGNED_SHORT_4_4_4_4;
  }
  if (p === THREE.UnsignedShort5551Type) {
    return gl.UNSIGNED_SHORT_5_5_5_1;
  }
  if (p === THREE.UnsignedShort565Type) {
    return gl.UNSIGNED_SHORT_5_6_5;
  }
  if (p === THREE.ByteType) {
    return gl.BYTE;
  }
  if (p === THREE.ShortType) {
    return gl.SHORT;
  }
  if (p === THREE.UnsignedShortType) {
    return gl.UNSIGNED_SHORT;
  }
  if (p === THREE.IntType) {
    return gl.INT;
  }
  if (p === THREE.UnsignedIntType) {
    return gl.UNSIGNED_INT;
  }
  if (p === THREE.FloatType) {
    return gl.FLOAT;
  }
  if (p === THREE.AlphaFormat) {
    return gl.ALPHA;
  }
  if (p === THREE.RGBFormat) {
    return gl.RGB;
  }
  if (p === THREE.RGBAFormat) {
    return gl.RGBA;
  }
  if (p === THREE.LuminanceFormat) {
    return gl.LUMINANCE;
  }
  if (p === THREE.LuminanceAlphaFormat) {
    return gl.LUMINANCE_ALPHA;
  }
  if (p === THREE.AddEquation) {
    return gl.FUNC_ADD;
  }
  if (p === THREE.SubtractEquation) {
    return gl.FUNC_SUBTRACT;
  }
  if (p === THREE.ReverseSubtractEquation) {
    return gl.FUNC_REVERSE_SUBTRACT;
  }
  if (p === THREE.ZeroFactor) {
    return gl.ZERO;
  }
  if (p === THREE.OneFactor) {
    return gl.ONE;
  }
  if (p === THREE.SrcColorFactor) {
    return gl.SRC_COLOR;
  }
  if (p === THREE.OneMinusSrcColorFactor) {
    return gl.ONE_MINUS_SRC_COLOR;
  }
  if (p === THREE.SrcAlphaFactor) {
    return gl.SRC_ALPHA;
  }
  if (p === THREE.OneMinusSrcAlphaFactor) {
    return gl.ONE_MINUS_SRC_ALPHA;
  }
  if (p === THREE.DstAlphaFactor) {
    return gl.DST_ALPHA;
  }
  if (p === THREE.OneMinusDstAlphaFactor) {
    return gl.ONE_MINUS_DST_ALPHA;
  }
  if (p === THREE.DstColorFactor) {
    return gl.DST_COLOR;
  }
  if (p === THREE.OneMinusDstColorFactor) {
    return gl.ONE_MINUS_DST_COLOR;
  }
  if (p === THREE.SrcAlphaSaturateFactor) {
    return gl.SRC_ALPHA_SATURATE;
  }
  return 0;
};

exports.paramToArrayStorage = function(type) {
  switch (type) {
    case THREE.UnsignedByteType:
      return Uint8Array;
    case THREE.ByteType:
      return Int8Array;
    case THREE.ShortType:
      return Int16Array;
    case THREE.UnsignedShortType:
      return Uint16Array;
    case THREE.IntType:
      return Int32Array;
    case THREE.UnsignedIntType:
      return Uint32Array;
    case THREE.FloatType:
      return Float32Array;
  }
};

exports.swizzleToEulerOrder = function(swizzle) {
  return swizzle.map(function(i) {
    return ['', 'X', 'Y', 'Z'][i];
  }).join('');
};

exports.transformComposer = function() {
  var euler, pos, quat, scl, transform;
  euler = new THREE.Euler;
  quat = new THREE.Quaternion;
  pos = new THREE.Vector3;
  scl = new THREE.Vector3;
  transform = new THREE.Matrix4;
  return function(position, rotation, quaternion, scale, matrix, eulerOrder) {
    if (eulerOrder == null) {
      eulerOrder = 'XYZ';
    }
    if (rotation != null) {
      if (eulerOrder instanceof Array) {
        eulerOrder = exports.swizzleToEulerOrder(eulerOrder);
      }
      euler.setFromVector3(rotation, eulerOrder);
      quat.setFromEuler(euler);
    } else {
      quat.set(0, 0, 0, 1);
    }
    if (quaternion != null) {
      quat.multiply(quaternion);
    }
    if (position != null) {
      pos.copy(position);
    } else {
      pos.set(0, 0, 0);
    }
    if (scale != null) {
      scl.copy(scale);
    } else {
      scl.set(1, 1, 1);
    }
    transform.compose(pos, quat, scl);
    if (matrix != null) {
      transform.multiplyMatrices(transform, matrix);
    }
    return transform;
  };
};


},{}],27:[function(require,module,exports){

/*
 Generate equally spaced ticks in a range at sensible positions.
 
 @param min/max - Minimum and maximum of range
 @param n - Desired number of ticks in range
 @param unit - Base unit of scale (e.g. 1 or π).
 @param scale - Division scale (e.g. 2 = binary division, or 10 = decimal division).
 @param bias - Integer to bias divisions one or more levels up or down (to create nested scales)
 @param start - Whether to include a tick at the start
 @param end - Whether to include a tick at the end
 @param zero - Whether to include zero as a tick
 @param nice - Whether to round to a more reasonable interval
 */
var LINEAR, LOG, linear, log, make;

linear = function(min, max, n, unit, base, factor, start, end, zero, nice) {
  var distance, f, factors, i, ideal, ref, span, step, steps, ticks;
  if (nice == null) {
    nice = true;
  }
  n || (n = 10);
  unit || (unit = 1);
  base || (base = 10);
  factor || (factor = 1);
  span = max - min;
  ideal = span / n;
  if (!nice) {
    ticks = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
        _results.push(min + i * ideal);
      }
      return _results;
    })();
    if (!start) {
      ticks.shift();
    }
    if (!end) {
      ticks.pop();
    }
    if (!zero) {
      ticks = ticks.filter(function(x) {
        return x !== 0;
      });
    }
    return ticks;
  }
  unit || (unit = 1);
  base || (base = 10);
  ref = unit * (Math.pow(base, Math.floor(Math.log(ideal / unit) / Math.log(base))));
  factors = base % 2 === 0 ? [base / 2, 1, 1 / 2] : base % 3 === 0 ? [base / 3, 1, 1 / 3] : [1];
  steps = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = factors.length; _i < _len; _i++) {
      f = factors[_i];
      _results.push(ref * f);
    }
    return _results;
  })();
  distance = Infinity;
  step = steps.reduce(function(ref, step) {
    var d;
    f = step / ideal;
    d = Math.max(f, 1 / f);
    if (d < distance) {
      distance = d;
      return step;
    } else {
      return ref;
    }
  }, ref);
  step *= factor;
  min = (Math.ceil((min / step) + +(!start))) * step;
  max = (Math.floor(max / step) - +(!end)) * step;
  n = Math.ceil((max - min) / step);
  ticks = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
      _results.push(min + i * step);
    }
    return _results;
  })();
  if (!zero) {
    ticks = ticks.filter(function(x) {
      return x !== 0;
    });
  }
  return ticks;
};


/*
 Generate logarithmically spaced ticks in a range at sensible positions.
 */

log = function(min, max, n, unit, base, bias, start, end, zero, nice) {
  throw new Error("Log ticks not yet implemented.");
};

LINEAR = 0;

LOG = 1;

make = function(type, min, max, n, unit, base, bias, start, end, zero, nice) {
  switch (type) {
    case LINEAR:
      return linear(min, max, n, unit, base, bias, start, end, zero, nice);
    case LOG:
      return log(min, max, n, unit, base, bias, start, end, zero, nice);
  }
};

exports.make = make;

exports.linear = linear;

exports.log = log;


},{}],28:[function(require,module,exports){
var HEAP, Types, apply, createClass, descriptor, element, hint, id, key, map, mount, prop, recycle, set, unmount, unset, _i, _len, _ref;

HEAP = [];

id = 0;

Types = {

  /*
   * el('example', props, children);
  example: MathBox.DOM.createClass({
    render: (el, props, children) ->
       * VDOM node
      return el('span', { className: "foo" }, "Hello World")
  })
   */
};

descriptor = function() {
  return {
    id: id++,
    type: null,
    props: null,
    children: null,
    rendered: null,
    instance: null
  };
};

hint = function(n) {
  var i, _i, _results;
  n *= 2;
  n = Math.max(0, HEAP.length - n);
  _results = [];
  for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
    _results.push(HEAP.push(descriptor()));
  }
  return _results;
};

element = function(type, props, children) {
  var el;
  el = HEAP.length ? HEAP.pop() : descriptor();
  el.type = type != null ? type : 'div';
  el.props = props != null ? props : null;
  el.children = children != null ? children : null;
  return el;
};

recycle = function(el) {
  var child, children, _i, _len;
  if (!el.type) {
    return;
  }
  children = el.children;
  el.type = el.props = el.children = el.instance = null;
  HEAP.push(el);
  if (children != null) {
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      recycle(child);
    }
  }
};

apply = function(el, last, node, parent, index) {
  var child, childNodes, children, comp, dirty, i, k, key, nextChildren, nextProps, nextState, prevProps, prevState, props, ref, same, should, type, v, value, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
  if (el != null) {
    if (last == null) {
      return mount(el, parent, index);
    } else {
      if (el instanceof Node) {
        same = el === last;
        if (same) {
          return;
        }
      } else {
        same = typeof el === typeof last && last !== null && el !== null && el.type === last.type;
      }
      if (!same) {
        unmount(last.instance, node);
        node.remove();
        return mount(el, parent, index);
      } else {
        el.instance = last.instance;
        type = ((_ref = el.type) != null ? _ref.isComponentClass : void 0) ? el.type : Types[el.type];
        props = last != null ? last.props : void 0;
        nextProps = el.props;
        children = (_ref1 = last != null ? last.children : void 0) != null ? _ref1 : null;
        nextChildren = el.children;
        if (nextProps != null) {
          nextProps.children = nextChildren;
        }
        if (type != null) {
          dirty = node._COMPONENT_DIRTY;
          if ((props != null) !== (nextProps != null)) {
            dirty = true;
          }
          if (children !== nextChildren) {
            dirty = true;
          }
          if ((props != null) && (nextProps != null)) {
            if (!dirty) {
              for (key in props) {
                if (!nextProps.hasOwnProperty(key)) {
                  dirty = true;
                }
              }
            }
            if (!dirty) {
              for (key in nextProps) {
                value = nextProps[key];
                if ((ref = props[key]) !== value) {
                  dirty = true;
                }
              }
            }
          }
          if (dirty) {
            comp = last.instance;
            if (el.props == null) {
              el.props = {};
            }
            _ref2 = comp.defaultProps;
            for (k in _ref2) {
              v = _ref2[k];
              if ((_base = el.props)[k] == null) {
                _base[k] = v;
              }
            }
            el.props.children = el.children;
            if (typeof comp.willReceiveProps === "function") {
              comp.willReceiveProps(el.props);
            }
            should = node._COMPONENT_FORCE || ((_ref3 = typeof comp.shouldUpdate === "function" ? comp.shouldUpdate(el.props) : void 0) != null ? _ref3 : true);
            if (should) {
              nextState = comp.getNextState();
              if (typeof comp.willUpdate === "function") {
                comp.willUpdate(el.props, nextState);
              }
            }
            prevProps = comp.props;
            prevState = comp.applyNextState();
            comp.props = el.props;
            comp.children = el.children;
            if (should) {
              el = el.rendered = typeof comp.render === "function" ? comp.render(element, el.props, el.children) : void 0;
              apply(el, last.rendered, node, parent, index);
              if (typeof comp.didUpdate === "function") {
                comp.didUpdate(prevProps, prevState);
              }
            }
          }
          return;
        } else {
          if (props != null) {
            for (key in props) {
              if (!nextProps.hasOwnProperty(key)) {
                unset(node, key, props[key]);
              }
            }
          }
          if (nextProps != null) {
            for (key in nextProps) {
              value = nextProps[key];
              if ((ref = props[key]) !== value && key !== 'children') {
                set(node, key, value, ref);
              }
            }
          }
          if (nextChildren != null) {
            if ((_ref4 = typeof nextChildren) === 'string' || _ref4 === 'number') {
              if (nextChildren !== children) {
                node.textContent = nextChildren;
              }
            } else {
              if (nextChildren.type != null) {
                apply(nextChildren, children, node.childNodes[0], node, 0);
              } else {
                childNodes = node.childNodes;
                if (children != null) {
                  for (i = _i = 0, _len = nextChildren.length; _i < _len; i = ++_i) {
                    child = nextChildren[i];
                    apply(child, children[i], childNodes[i], node, i);
                  }
                } else {
                  for (i = _j = 0, _len1 = nextChildren.length; _j < _len1; i = ++_j) {
                    child = nextChildren[i];
                    apply(child, null, childNodes[i], node, i);
                  }
                }
              }
            }
          } else if (children != null) {
            unmount(null, node);
            node.innerHTML = '';
          }
        }
        return;
      }
    }
  }
  if (last != null) {
    unmount(last.instance, node);
    return last.node.remove();
  }
};

mount = function(el, parent, index) {
  var child, children, comp, ctor, i, k, key, node, type, v, value, _base, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
  if (index == null) {
    index = 0;
  }
  type = ((_ref = el.type) != null ? _ref.isComponentClass : void 0) ? el.type : Types[el.type];
  if (el instanceof Node) {
    node = el;
  } else {
    if (type != null) {
      ctor = ((_ref1 = el.type) != null ? _ref1.isComponentClass : void 0) ? el.type : Types[el.type];
      if (!ctor) {
        el = el.rendered = element('noscript');
        node = mount(el, parent, index);
        return node;
      }
      el.instance = comp = new ctor(parent);
      if (el.props == null) {
        el.props = {};
      }
      _ref2 = comp.defaultProps;
      for (k in _ref2) {
        v = _ref2[k];
        if ((_base = el.props)[k] == null) {
          _base[k] = v;
        }
      }
      el.props.children = el.children;
      comp.props = el.props;
      comp.children = el.children;
      comp.setState(typeof comp.getInitialState === "function" ? comp.getInitialState() : void 0);
      if (typeof comp.willMount === "function") {
        comp.willMount();
      }
      el = el.rendered = typeof comp.render === "function" ? comp.render(element, el.props, el.children) : void 0;
      node = mount(el, parent, index);
      if (typeof comp.didMount === "function") {
        comp.didMount(el);
      }
      node._COMPONENT = comp;
      return node;
    } else if ((_ref3 = typeof el) === 'string' || _ref3 === 'number') {
      node = document.createTextNode(el);
    } else {
      node = document.createElement(el.type);
      _ref4 = el.props;
      for (key in _ref4) {
        value = _ref4[key];
        set(node, key, value);
      }
    }
    children = el.children;
    if (children != null) {
      if ((_ref5 = typeof children) === 'string' || _ref5 === 'number') {
        node.textContent = children;
      } else {
        if (children.type != null) {
          mount(children, node, 0);
        } else {
          for (i = _i = 0, _len = children.length; _i < _len; i = ++_i) {
            child = children[i];
            mount(child, node, i);
          }
        }
      }
    }
  }
  parent.insertBefore(node, parent.childNodes[index]);
  return node;
};

unmount = function(comp, node) {
  var child, k, _i, _len, _ref, _results;
  if (comp) {
    if (typeof comp.willUnmount === "function") {
      comp.willUnmount();
    }
    for (k in comp) {
      delete comp[k];
    }
  }
  _ref = node.childNodes;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    child = _ref[_i];
    unmount(child._COMPONENT, child);
    _results.push(delete child._COMPONENT);
  }
  return _results;
};

prop = function(key) {
  var prefix, prefixes, _i, _len;
  if (typeof document === 'undefined') {
    return true;
  }
  if (document.documentElement.style[key] != null) {
    return key;
  }
  key = key[0].toUpperCase() + key.slice(1);
  prefixes = ['webkit', 'moz', 'ms', 'o'];
  for (_i = 0, _len = prefixes.length; _i < _len; _i++) {
    prefix = prefixes[_i];
    if (document.documentElement.style[prefix + key] != null) {
      return prefix + key;
    }
  }
};

map = {};

_ref = ['transform'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  key = _ref[_i];
  map[key] = prop(key);
}

set = function(node, key, value, orig) {
  var k, v, _ref1;
  if (key === 'style') {
    for (k in value) {
      v = value[k];
      if ((orig != null ? orig[k] : void 0) !== v) {
        node.style[(_ref1 = map[k]) != null ? _ref1 : k] = v;
      }
    }
    return;
  }
  if (node[key] != null) {
    node[key] = value;
    return;
  }
  if (node instanceof Node) {
    node.setAttribute(key, value);
  }
};

unset = function(node, key, orig) {
  var k, v, _ref1;
  if (key === 'style') {
    for (k in orig) {
      v = orig[k];
      node.style[(_ref1 = map[k]) != null ? _ref1 : k] = '';
    }
    return;
  }
  if (node[key] != null) {
    node[key] = void 0;
  }
  if (node instanceof Node) {
    node.removeAttribute(key);
  }
};

createClass = function(prototype) {
  var Component, a, aliases, b, _ref1;
  aliases = {
    willMount: 'componentWillMount',
    didMount: 'componentDidMount',
    willReceiveProps: 'componentWillReceiveProps',
    shouldUpdate: 'shouldComponentUpdate',
    willUpdate: 'componentWillUpdate',
    didUpdate: 'componentDidUpdate',
    willUnmount: 'componentWillUnmount'
  };
  for (a in aliases) {
    b = aliases[a];
    if (prototype[a] == null) {
      prototype[a] = prototype[b];
    }
  }
  Component = (function() {
    function Component(node, props, state, children) {
      var bind, k, nextState, v;
      this.props = props != null ? props : {};
      this.state = state != null ? state : null;
      this.children = children != null ? children : null;
      bind = function(f, self) {
        if (typeof f === 'function') {
          return f.bind(self);
        } else {
          return f;
        }
      };
      for (k in prototype) {
        v = prototype[k];
        this[k] = bind(v, this);
      }
      nextState = null;
      this.setState = function(state) {
        if (nextState == null) {
          nextState = state ? nextState != null ? nextState : {} : null;
        }
        for (k in state) {
          v = state[k];
          nextState[k] = v;
        }
        node._COMPONENT_DIRTY = true;
      };
      this.forceUpdate = function() {
        var el, _results;
        node._COMPONENT_FORCE = node._COMPONENT_DIRTY = true;
        el = node;
        _results = [];
        while (el = el.parentNode) {
          if (el._COMPONENT) {
            _results.push(el._COMPONENT_FORCE = true);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      this.getNextState = function() {
        return nextState;
      };
      this.applyNextState = function() {
        var prevState, _ref1;
        node._COMPONENT_FORCE = node._COMPONENT_DIRTY = false;
        prevState = this.state;
        _ref1 = [null, nextState], nextState = _ref1[0], this.state = _ref1[1];
        return prevState;
      };
      return;
    }

    return Component;

  })();
  Component.isComponentClass = true;
  Component.prototype.defaultProps = (_ref1 = typeof prototype.getDefaultProps === "function" ? prototype.getDefaultProps() : void 0) != null ? _ref1 : {};
  return Component;
};

module.exports = {
  element: element,
  recycle: recycle,
  apply: apply,
  hint: hint,
  Types: Types,
  createClass: createClass
};


},{}],29:[function(require,module,exports){
var Context, Model, Overlay, Primitives, Render, Shaders, Stage, Util;

Model = require('./model');

Overlay = require('./overlay');

Primitives = require('./primitives');

Render = require('./render');

Shaders = require('./shaders');

Stage = require('./stage');

Util = require('./util');

Context = (function() {
  Context.Namespace = {
    Model: Model,
    Overlay: Overlay,
    Primitives: Primitives,
    Render: Render,
    Shaders: Shaders,
    Stage: Stage,
    Util: Util,
    DOM: Util.VDOM
  };

  function Context(renderer, scene, camera) {
    var canvas;
    if (scene == null) {
      scene = null;
    }
    if (camera == null) {
      camera = null;
    }
    this.canvas = canvas = renderer.domElement;
    this.element = null;
    this.shaders = new Shaders.Factory(Shaders.Snippets);
    this.renderables = new Render.Factory(Render.Classes, renderer, this.shaders);
    this.overlays = new Overlay.Factory(Overlay.Classes, canvas);
    this.scene = this.renderables.make('scene', {
      scene: scene
    });
    this.camera = this.defaultCamera = camera != null ? camera : new THREE.PerspectiveCamera();
    this.attributes = new Model.Attributes(Primitives.Types, this);
    this.primitives = new Primitives.Factory(Primitives.Types, this);
    this.root = this.primitives.make('root');
    this.model = new Model.Model(this.root);
    this.guard = new Model.Guard;
    this.controller = new Stage.Controller(this.model, this.primitives);
    this.animator = new Stage.Animator(this);
    this.api = new Stage.API(this);
    this.speed = 1;
    this.time = {
      now: +new Date() / 1000,
      time: 0,
      delta: 0,
      clock: 0,
      step: 0
    };
  }

  Context.prototype.init = function() {
    this.scene.inject();
    this.overlays.inject();
    return this;
  };

  Context.prototype.destroy = function() {
    this.scene.unject();
    this.overlays.unject();
    return this;
  };

  Context.prototype.resize = function(size) {

    /*
    {
      viewWidth, viewHeight, renderWidth, renderHeight, aspect, pixelRatio
    }
     */
    if (size == null) {
      size = {};
    }
    if (size.renderWidth == null) {
      size.renderWidth = size.viewWidth != null ? size.viewWidth : size.viewWidth = 1280;
    }
    if (size.renderHeight == null) {
      size.renderHeight = size.viewHeight != null ? size.viewHeight : size.viewHeight = 720;
    }
    if (size.pixelRatio == null) {
      size.pixelRatio = size.renderWidth / Math.max(.000001, size.viewWidth);
    }
    if (size.aspect == null) {
      size.aspect = size.viewWidth / Math.max(.000001, size.viewHeight);
    }
    this.root.controller.resize(size);
    return this;
  };

  Context.prototype.frame = function(time) {

    /*
    {
      now, clock, step
    }
     */
    this.pre(time);
    this.update();
    this.render();
    this.post();
    return this;
  };

  Context.prototype.pre = function(time) {
    var _base;
    if (!time) {
      time = {
        now: +new Date() / 1000,
        time: 0,
        delta: 0,
        clock: 0,
        step: 0
      };
      time.delta = this.time.now != null ? time.now - this.time.now : 0;
      if (time.delta > 1) {
        time.delta = 1 / 60;
      }
      time.step = time.delta * this.speed;
      time.time = this.time.time + time.delta;
      time.clock = this.time.clock + time.step;
    }
    this.time = time;
    if (typeof (_base = this.root.controller).pre === "function") {
      _base.pre();
    }
    return this;
  };

  Context.prototype.update = function() {
    var _base;
    this.animator.update(this.time);
    this.attributes.compute();
    this.guard.iterate({
      step: (function(_this) {
        return function() {
          var change;
          change = _this.attributes.digest();
          return change || (change = _this.model.digest());
        };
      })(this),
      last: function() {
        return {
          attribute: this.attributes.getLastTrigger(),
          model: this.model.getLastTrigger()
        };
      }
    });
    if (typeof (_base = this.root.controller).update === "function") {
      _base.update();
    }
    this.camera = this.root.controller.getCamera();
    this.speed = this.root.controller.getSpeed();
    return this;
  };

  Context.prototype.render = function() {
    var _base;
    if (typeof (_base = this.root.controller).render === "function") {
      _base.render();
    }
    this.scene.render();
    return this;
  };

  Context.prototype.post = function() {
    var _base;
    if (typeof (_base = this.root.controller).post === "function") {
      _base.post();
    }
    return this;
  };

  Context.prototype.setWarmup = function(n) {
    this.scene.warmup(n);
    return this;
  };

  Context.prototype.getPending = function() {
    return this.scene.pending.length;
  };

  return Context;

})();

module.exports = Context;


},{"./model":34,"./overlay":40,"./primitives":43,"./render":146,"./shaders":161,"./stage":166,"./util":172}],30:[function(require,module,exports){
var Context, k, mathBox, v, _ref;

mathBox = function(options) {
  var three, _ref;
  three = THREE.Bootstrap(options);
  if (!three.fallback) {
    if (!three.Time) {
      three.install('time');
    }
    if (!three.MathBox) {
      three.install(['mathbox', 'splash']);
    }
  }
  return (_ref = three.mathbox) != null ? _ref : three;
};

window.π = Math.PI;

window.τ = π * 2;

window.e = Math.E;

window.MathBox = exports;

window.mathBox = exports.mathBox = mathBox;

exports.version = '2';

exports.Context = Context = require('./context');

_ref = Context.Namespace;
for (k in _ref) {
  v = _ref[k];
  exports[k] = v;
}

require('./splash');

THREE.Bootstrap.registerPlugin('mathbox', {
  defaults: {
    init: true,
    warmup: 2,
    inspect: true,
    splash: true
  },
  listen: ['ready', 'pre', 'update', 'post', 'resize'],
  install: function(three) {
    var inited;
    inited = false;
    this.first = true;
    return three.MathBox = {
      init: (function(_this) {
        return function(options) {
          var camera, scene;
          if (inited) {
            return;
          }
          inited = true;
          scene = (options != null ? options.scene : void 0) || _this.options.scene || three.scene;
          camera = (options != null ? options.camera : void 0) || _this.options.camera || three.camera;
          _this.context = new Context(three.renderer, scene, camera);
          _this.context.api.three = three.three = three;
          _this.context.api.mathbox = three.mathbox = _this.context.api;
          _this.context.api.start = function() {
            return three.Loop.start();
          };
          _this.context.api.stop = function() {
            return three.Loop.stop();
          };
          _this.context.init();
          _this.context.resize(three.Size);
          _this.context.setWarmup(_this.options.warmup);
          _this.pending = 0;
          _this.warm = !_this.options.warmup;
          console.log('MathBox', MathBox.version);
          return three.trigger({
            type: 'mathbox/init',
            version: MathBox.version,
            context: _this.context
          });
        };
      })(this),
      destroy: (function(_this) {
        return function() {
          if (!inited) {
            return;
          }
          inited = false;
          three.trigger({
            type: 'mathbox/destroy',
            context: _this.context
          });
          _this.context.destroy();
          delete three.mathbox;
          delete _this.context.api.three;
          return delete _this.context;
        };
      })(this),
      object: (function(_this) {
        return function() {
          var _ref1;
          return (_ref1 = _this.context) != null ? _ref1.scene.root : void 0;
        };
      })(this)
    };
  },
  uninstall: function(three) {
    three.MathBox.destroy();
    return delete three.MathBox;
  },
  ready: function(event, three) {
    if (this.options.init) {
      three.MathBox.init();
      return setTimeout((function(_this) {
        return function() {
          if (_this.options.inspect) {
            return _this.inspect(three);
          }
        };
      })(this));
    }
  },
  inspect: function(three) {
    this.context.api.inspect();
    if (!this.options.warmup) {
      return this.info(three);
    }
  },
  info: function(three) {
    var fmt, info;
    fmt = function(x) {
      var out;
      out = [];
      while (x >= 1000) {
        out.unshift(("000" + (x % 1000)).slice(-3));
        x = Math.floor(x / 1000);
      }
      out.unshift(x);
      return out.join(',');
    };
    info = three.renderer.info.render;
    return console.log('Geometry  ', fmt(info.faces) + ' faces  ', fmt(info.vertices) + ' vertices  ', fmt(info.calls) + ' draw calls  ');
  },
  resize: function(event, three) {
    var _ref1;
    return (_ref1 = this.context) != null ? _ref1.resize(three.Size) : void 0;
  },
  pre: function(event, three) {
    var _ref1;
    return (_ref1 = this.context) != null ? _ref1.pre(three.Time) : void 0;
  },
  update: function(event, three) {
    var camera, _ref1, _ref2, _ref3;
    if ((_ref1 = this.context) != null) {
      _ref1.update();
    }
    if ((camera = (_ref2 = this.context) != null ? _ref2.camera : void 0) && camera !== three.camera) {
      three.camera = camera;
    }
    three.Time.set({
      speed: this.context.speed
    });
    this.progress(this.context.getPending(), three);
    return (_ref3 = this.context) != null ? _ref3.render() : void 0;
  },
  post: function(event, three) {
    var _ref1;
    return (_ref1 = this.context) != null ? _ref1.post() : void 0;
  },
  progress: function(remain, three) {
    var current, pending, total;
    if (!(remain || this.pending)) {
      return;
    }
    pending = Math.max(remain + this.options.warmup, this.pending);
    current = pending - remain;
    total = pending;
    three.trigger({
      type: 'mathbox/progress',
      current: pending - remain,
      total: pending
    });
    if (remain === 0) {
      pending = 0;
    }
    this.pending = pending;
    if (current === total && !this.warm) {
      this.warm = true;
      if (this.options.inspect) {
        return this.info(three);
      }
    }
  }
});


},{"./context":29,"./splash":162}],31:[function(require,module,exports){

/*
 Custom attribute model
 - Organizes attributes by trait in .attributes
 - Provides constant-time .props / .get() access to flat dictionary
 - Provides .get(key) with or without trait namespaces
 - Change attributes with .set(key) or .set(dictionary)
 - Validation is double-buffered and in-place to detect changes and nops
 - Change notifications are coalesced per object and per trait, digested later
 - Values are stored in three.js uniform-style objects so they can be bound as GL uniforms
 - Originally passed (unnormalized) values are preserved and can be fetched via .orig()
 - Attributes can be defined as final/const
 - Attributes can be computed from both public or private expressions with .bind(key, false/true)
 - Expressions are time-dependent, can be time-travelled with .evaluate()
 - This enables continous simulation and data logging despite choppy animation updates
 
  Actual type and trait definitions are injected from Primitives
 */
var Attributes, Data, shallowCopy;

Attributes = (function() {
  function Attributes(definitions, context) {
    this.context = context;
    this.traits = definitions.Traits;
    this.types = definitions.Types;
    this.pending = [];
    this.bound = [];
    this.last = null;
  }

  Attributes.prototype.make = function(type) {
    return {
      "enum": typeof type["enum"] === "function" ? type["enum"]() : void 0,
      type: typeof type.uniform === "function" ? type.uniform() : void 0,
      value: type.make()
    };
  };

  Attributes.prototype.apply = function(object, config) {
    return new Data(object, config, this);
  };

  Attributes.prototype.bind = function(callback) {
    return this.bound.push(callback);
  };

  Attributes.prototype.unbind = function(callback) {
    var cb;
    return this.bound = (function() {
      var _i, _len, _ref, _results;
      _ref = this.bound;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        if (cb !== callback) {
          _results.push(cb);
        }
      }
      return _results;
    }).call(this);
  };

  Attributes.prototype.queue = function(callback, object, key, value) {
    this.lastObject = object;
    this.lastKey = key;
    this.lastValue = value;
    return this.pending.push(callback);
  };

  Attributes.prototype.invoke = function(callback) {
    return callback(this.context.time.clock, this.context.time.step);
  };

  Attributes.prototype.compute = function() {
    var cb, _i, _len, _ref;
    if (this.bound.length) {
      _ref = this.bound;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        this.invoke(cb);
      }
    }
  };

  Attributes.prototype.digest = function() {
    var callback, calls, _i, _len, _ref;
    if (!this.pending.length) {
      return false;
    }
    _ref = [this.pending, []], calls = _ref[0], this.pending = _ref[1];
    for (_i = 0, _len = calls.length; _i < _len; _i++) {
      callback = calls[_i];
      callback();
    }
    return true;
  };

  Attributes.prototype.getTrait = function(name) {
    return this.traits[name];
  };

  Attributes.prototype.getLastTrigger = function() {
    return "" + (this.lastObject.toString()) + " - " + this.lastKey + "=`" + this.lastValue + "`";
  };

  return Attributes;

})();

shallowCopy = function(x) {
  var k, out, v;
  out = {};
  for (k in x) {
    v = x[k];
    out[k] = v;
  }
  return out;
};

Data = (function() {
  function Data(object, config, _attributes) {
    var addSpec, bind, change, changed, changes, constant, data, define, digest, dirty, equalors, equals, evaluate, event, expr, finals, flattened, freeform, get, getNS, key, list, makers, mapTo, name, ns, oldComputed, oldExpr, oldOrig, oldProps, originals, props, set, shorthand, spec, to, touched, touches, trait, traits, unbind, unique, validate, validators, value, values, _bound, _computed, _eval, _expr, _finals, _i, _len, _ref, _ref1;
    traits = config.traits, props = config.props, finals = config.finals, freeform = config.freeform;
    data = this;
    if ((object.props != null) && (object.expr != null) && (object.orig != null) && (object.computed != null) && (object.attributes != null)) {
      oldProps = shallowCopy(object.props);
      oldExpr = shallowCopy(object.expr);
      oldOrig = object.orig();
      oldComputed = object.computed();
      if ((_ref = object.attributes) != null) {
        _ref.dispose();
      }
    }
    flattened = {};
    originals = {};
    mapTo = {};
    to = function(name) {
      var _ref1;
      return (_ref1 = mapTo[name]) != null ? _ref1 : name;
    };
    define = function(name, alias) {
      if (mapTo[alias]) {
        throw new Error("" + (object.toString()) + " - Duplicate property `" + alias + "`");
      }
      return mapTo[alias] = name;
    };
    get = function(key) {
      var _ref1, _ref2, _ref3;
      return (_ref1 = (_ref2 = data[key]) != null ? _ref2.value : void 0) != null ? _ref1 : (_ref3 = data[to(key)]) != null ? _ref3.value : void 0;
    };
    set = function(key, value, ignore, initial) {
      var attr, short, valid, validated, _ref1;
      key = to(key);
      if ((attr = data[key]) == null) {
        if (!freeform) {
          throw new Error("" + (object.toString()) + " - Setting unknown property `" + key + "={" + value + "}`");
        }
        attr = data[key] = {
          short: key,
          type: null,
          last: null,
          value: null
        };
        validators[key] = function(v) {
          return v;
        };
      }
      if (!ignore) {
        if (_expr[key]) {
          throw new Error("" + (object.toString()) + " - Can't set bound property `" + key + "={" + value + "}`");
        }
        if (_computed[key]) {
          throw new Error("" + (object.toString()) + " - Can't set computed property `" + key + "={" + value + "}`");
        }
        if (_finals[key]) {
          throw new Error("" + (object.toString()) + " - Can't set final property `" + key + "={" + value + "}`");
        }
      }
      valid = true;
      validated = validate(key, value, attr.last, function() {
        valid = false;
        return null;
      });
      if (valid) {
        _ref1 = [validated, attr.value], attr.value = _ref1[0], attr.last = _ref1[1];
        short = attr.short;
        flattened[short] = validated;
        if (!ignore) {
          originals[short] = value;
        }
        if (!(initial || equals(key, attr.value, attr.last))) {
          change(key, value);
        }
      }
      return valid;
    };
    constant = function(key, value, initial) {
      key = to(key);
      set(key, value, true, initial);
      return finals[key] = true;
    };
    expr = {};
    _bound = {};
    _eval = {};
    _expr = {};
    _computed = {};
    _finals = {};
    bind = function(key, expression, computed) {
      var list, short;
      if (computed == null) {
        computed = false;
      }
      key = to(key);
      if (typeof expression !== 'function') {
        throw new Error("" + (object.toString()) + " - Expression `" + key + "=>{" + expr + "}` is not a function");
      }
      if (_expr[key]) {
        throw new Error("" + (object.toString()) + " - Property `" + key + "=>{" + expr + "}` is already bound");
      }
      if (_computed[key]) {
        throw new Error("" + (object.toString()) + " - Property `" + key + "` is computed");
      }
      if (_finals[key]) {
        throw new Error("" + (object.toString()) + " - Property `" + key + "` is final");
      }
      list = computed ? _computed : _expr;
      list[key] = expression;
      short = data[key] != null ? data[key].short : key;
      if (!computed) {
        expr[short] = expression;
      }
      _eval[key] = expression;
      expression = expression.bind(object);
      _bound[key] = function(t, d) {
        var clock, _ref1;
        if (clock = (_ref1 = object.clock) != null ? _ref1.getTime() : void 0) {
          t = clock.clock;
          d = clock.step;
        }
        return object.set(key, expression(t, d), true);
      };
      return _attributes.bind(_bound[key]);
    };
    unbind = function(key, computed) {
      var list;
      if (computed == null) {
        computed = false;
      }
      key = to(key);
      list = computed ? _computed : _expr;
      if (!list[key]) {
        return;
      }
      _attributes.unbind(_bound[key]);
      delete _bound[key];
      delete list[key];
      if (data[key] != null) {
        key = data[key].short;
      }
      return delete expr[key];
    };
    evaluate = function(key, time) {
      var _ref1;
      key = to(key);
      return (_ref1 = typeof _eval[key] === "function" ? _eval[key](time, 0) : void 0) != null ? _ref1 : data[key].value;
    };
    object.expr = expr;
    object.props = flattened;
    object.evaluate = function(key, time) {
      var out;
      if (key != null) {
        return evaluate(key, time);
      } else {
        out = {};
        for (key in props) {
          out[key] = evaluate(key, time);
        }
        return out;
      }
    };
    object.get = function(key) {
      if (key != null) {
        return get(key);
      } else {
        return flattened;
      }
    };
    object.set = function(key, value, ignore, initial) {
      var options;
      if (typeof key === 'string') {
        set(key, value, ignore, initial);
      } else {
        initial = ignore;
        ignore = value;
        options = key;
        for (key in options) {
          value = options[key];
          set(key, value, ignore, initial);
        }
      }
    };
    object.bind = function(key, expr, computed) {
      var binds;
      if (typeof key === 'string') {
        bind(key, expr, computed);
      } else {
        computed = expr;
        binds = key;
        for (key in binds) {
          expr = binds[key];
          bind(key, expr, computed);
        }
      }
    };
    object.unbind = function(key, computed) {
      var binds;
      if (typeof key === 'string') {
        unbind(key, computed);
      } else {
        computed = expr;
        binds = key;
        for (key in binds) {
          unbind(key, computed);
        }
      }
    };
    object.attribute = function(key) {
      if (key != null) {
        return data[to(key)];
      } else {
        return data;
      }
    };
    object.orig = function(key) {
      if (key != null) {
        return originals[to(key)];
      } else {
        return shallowCopy(originals);
      }
    };
    object.computed = function(key) {
      if (key != null) {
        return _computed[to(key)];
      } else {
        return shallowCopy(_computed);
      }
    };
    makers = {};
    validators = {};
    equalors = {};
    equals = function(key, value, target) {
      return equalors[key](value, target);
    };
    validate = function(key, value, target, invalid) {
      return validators[key](value, target, invalid);
    };
    object.validate = function(key, value) {
      var make, target;
      key = to(key);
      make = makers[key];
      if (make != null) {
        target = make();
      }
      return target = validate(key, value, target, function() {
        throw new Error("" + (object.toString()) + " - Invalid value `" + key + "={" + value + "}`");
      });
    };
    dirty = false;
    changes = {};
    touches = {};
    changed = {};
    touched = {};
    getNS = function(key) {
      return key.split('.')[0];
    };
    change = function(key, value) {
      var trait;
      if (!dirty) {
        dirty = true;
        _attributes.queue(digest, object, key, value);
      }
      trait = getNS(key);
      changes[key] = true;
      return touches[trait] = true;
    };
    event = {
      type: 'change',
      changed: null,
      touched: null
    };
    digest = function() {
      var k, trait, _results;
      event.changed = changes;
      event.touched = touches;
      changes = changed;
      touches = touched;
      changed = event.changed;
      touched = event.touched;
      dirty = false;
      for (k in changes) {
        changes[k] = false;
      }
      for (k in touches) {
        touches[k] = false;
      }
      event.type = 'change';
      object.trigger(event);
      _results = [];
      for (trait in event.touched) {
        event.type = "change:" + trait;
        _results.push(object.trigger(event));
      }
      return _results;
    };
    shorthand = function(name) {
      var parts, suffix;
      parts = name.split(/\./g);
      suffix = parts.pop();
      parts.pop();
      parts.unshift(suffix);
      return parts.reduce(function(a, b) {
        return a + b.charAt(0).toUpperCase() + b.substring(1);
      });
    };
    addSpec = function(name, spec) {
      var attr, key, short, type, value, _ref1, _ref2, _results;
      _results = [];
      for (key in spec) {
        type = spec[key];
        key = [name, key].join('.');
        short = shorthand(key);
        data[key] = attr = {
          T: type,
          ns: name,
          short: short,
          "enum": typeof type["enum"] === "function" ? type["enum"]() : void 0,
          type: typeof type.uniform === "function" ? type.uniform() : void 0,
          last: type.make(),
          value: value = type.make()
        };
        define(key, short);
        flattened[short] = value;
        makers[key] = type.make;
        validators[key] = (_ref1 = type.validate) != null ? _ref1 : function(a) {
          return a;
        };
        _results.push(equalors[key] = (_ref2 = type.equals) != null ? _ref2 : function(a, b) {
          return a === b;
        });
      }
      return _results;
    };
    list = [];
    values = {};
    for (_i = 0, _len = traits.length; _i < _len; _i++) {
      trait = traits[_i];
      _ref1 = trait.split(':'), trait = _ref1[0], ns = _ref1[1];
      name = ns ? [ns, trait].join('.') : trait;
      spec = _attributes.getTrait(trait);
      list.push(trait);
      if (spec != null) {
        addSpec(name, spec);
      }
    }
    if (props != null) {
      for (ns in props) {
        spec = props[ns];
        addSpec(ns, spec);
      }
    }
    unique = list.filter(function(object, i) {
      return list.indexOf(object) === i;
    });
    object.traits = unique;
    if (oldProps != null) {
      object.set(oldProps, true, true);
    }
    if (finals != null) {
      for (key in finals) {
        value = finals[key];
        constant(key, value);
      }
    }
    if (oldOrig != null) {
      object.set(oldOrig, false, true);
    }
    if (oldComputed != null) {
      object.bind(oldComputed, true);
    }
    if (oldExpr != null) {
      object.bind(oldExpr, false);
    }
    this.dispose = function() {
      for (key in _computed) {
        unbind(key, true);
      }
      for (key in _expr) {
        unbind(key, false);
      }
      props = {};
      delete object.attributes;
      delete object.get;
      return delete object.set;
    };
    null;
  }

  return Data;

})();

module.exports = Attributes;


},{}],32:[function(require,module,exports){
var Group, Node,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Node = require('./node');

Group = (function(_super) {
  __extends(Group, _super);

  function Group(type, defaults, options, binds, config, attributes) {
    Group.__super__.constructor.call(this, type, defaults, options, binds, config, attributes);
    this.children = [];
    this.on('reindex', (function(_this) {
      return function(event) {
        var child, _i, _len, _ref, _results;
        _ref = _this.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          _results.push(child.trigger(event));
        }
        return _results;
      };
    })(this));
  }

  Group.prototype.add = function(node) {
    var _ref;
    if ((_ref = node.parent) != null) {
      _ref.remove(node);
    }
    node._index(this.children.length, this);
    this.children.push(node);
    return node._added(this);
  };

  Group.prototype.remove = function(node) {
    var i, index, _i, _len, _ref, _ref1;
    if ((_ref = node.children) != null ? _ref.length : void 0) {
      node.empty();
    }
    index = this.children.indexOf(node);
    if (index === -1) {
      return;
    }
    this.children.splice(index, 1);
    node._index(null);
    node._removed(this);
    _ref1 = this.children;
    for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
      node = _ref1[i];
      if (i >= index) {
        node._index(i);
      }
    }
  };

  Group.prototype.empty = function() {
    var children, node, _i, _len;
    children = this.children.slice().reverse();
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      node = children[_i];
      this.remove(node);
    }
  };

  return Group;

})(Node);

module.exports = Group;


},{"./node":36}],33:[function(require,module,exports){
var Guard;

Guard = (function() {
  function Guard(limit) {
    this.limit = limit != null ? limit : 10;
  }

  Guard.prototype.iterate = function(options) {
    var last, limit, run, step;
    step = options.step, last = options.last;
    limit = this.limit;
    while (run = step()) {
      if (!--limit) {
        console.warn("Last iteration", typeof last === "function" ? last() : void 0);
        throw new Error("Exceeded iteration limit.");
      }
    }
    return null;
  };

  return Guard;

})();

module.exports = Guard;


},{}],34:[function(require,module,exports){
exports.Attributes = require('./attributes');

exports.Group = require('./group');

exports.Guard = require('./guard');

exports.Model = require('./model');

exports.Node = require('./node');


},{"./attributes":31,"./group":32,"./guard":33,"./model":35,"./node":36}],35:[function(require,module,exports){
var ALL, CLASS, ID, Model, TRAIT, TYPE, cssauron, language,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

cssauron = require('cssauron');

ALL = '*';

ID = /^#([A-Za-z0-9_])$/;

CLASS = /^\.([A-Za-z0-9_]+)$/;

TRAIT = /^\[([A-Za-z0-9_]+)\]$/;

TYPE = /^[A-Za-z0-9_]+$/;

language = null;


/*

  Model that wraps a root node and its children.
  
  Monitors adds, removals and ID/class changes.
  Enables CSS selectors, both querying and watching.

  Watchers are primed differentially as changes come in,
  and fired with digest().
 */

Model = (function() {
  function Model(root) {
    var add, addClasses, addID, addNode, addTags, addTraits, addType, adopt, check, dispose, force, hashTags, prime, remove, removeClasses, removeID, removeNode, removeTags, removeTraits, removeType, unhashTags, update;
    this.root = root;
    this.root.model = this;
    this.root.root = this.root;
    this.ids = {};
    this.classes = {};
    this.traits = {};
    this.types = {};
    this.nodes = [];
    this.watchers = [];
    this.fire = false;
    this.lastNode = null;
    this.event = {
      type: 'update'
    };
    if (language == null) {
      language = cssauron({
        tag: 'type',
        id: 'id',
        "class": "classes.join(' ')",
        parent: 'parent',
        children: 'children',
        attr: 'traits.hash[attr]'
      });
    }
    add = (function(_this) {
      return function(event) {
        return adopt(event.node);
      };
    })(this);
    remove = (function(_this) {
      return function(event) {
        return dispose(event.node);
      };
    })(this);
    this.root.on('add', add);
    this.root.on('remove', remove);
    adopt = (function(_this) {
      return function(node) {
        addNode(node);
        addType(node);
        addTraits(node);
        node.on('change:node', update);
        update(null, node, true);
        return force(node);
      };
    })(this);
    dispose = (function(_this) {
      return function(node) {
        removeNode(node);
        removeType(node);
        removeTraits(node);
        removeID(node.id, node);
        removeClasses(node.classes, node);
        node.off('change:node', update);
        return force(node);
      };
    })(this);
    prime = (function(_this) {
      return function(node) {
        var watcher, _i, _len, _ref;
        _ref = _this.watchers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          watcher = _ref[_i];
          watcher.match = watcher.matcher(node);
        }
        return null;
      };
    })(this);
    check = (function(_this) {
      return function(node) {
        var fire, watcher, _i, _len, _ref;
        _ref = _this.watchers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          watcher = _ref[_i];
          fire = watcher.fire || (watcher.fire = watcher.match !== watcher.matcher(node));
          if (fire) {
            _this.lastNode = node;
          }
          _this.fire || (_this.fire = fire);
        }
        return null;
      };
    })(this);
    force = (function(_this) {
      return function(node) {
        var fire, watcher, _i, _len, _ref;
        _ref = _this.watchers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          watcher = _ref[_i];
          fire = watcher.fire || (watcher.fire = watcher.matcher(node));
          if (fire) {
            _this.lastNode = node;
          }
          _this.fire || (_this.fire = fire);
        }
        return null;
      };
    })(this);
    this.digest = (function(_this) {
      return function() {
        var watcher, _i, _len, _ref;
        if (!_this.fire) {
          return false;
        }
        _ref = _this.watchers.slice();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          watcher = _ref[_i];
          if (!watcher.fire) {
            continue;
          }
          watcher.fire = false;
          watcher.handler();
        }
        _this.fire = false;
        return true;
      };
    })(this);
    update = (function(_this) {
      return function(event, node, init) {
        var classes, id, klass, primed, _id, _klass, _ref, _ref1;
        _id = init || event.changed['node.id'];
        _klass = init || event.changed['node.classes'];
        primed = false;
        if (_id) {
          id = node.get('node.id');
          if (id !== node.id) {
            if (!init) {
              prime(node);
            }
            primed = true;
            if (node.id != null) {
              removeID(node.id, node);
            }
            addID(id, node);
          }
        }
        if (_klass) {
          classes = (_ref = node.get('node.classes')) != null ? _ref : [];
          klass = classes.join(',');
          if (klass !== ((_ref1 = node.classes) != null ? _ref1.klass : void 0)) {
            classes = classes.slice();
            if (!(init || primed)) {
              prime(node);
            }
            primed = true;
            if (node.classes != null) {
              removeClasses(node.classes, node);
            }
            addClasses(classes, node);
            node.classes = classes;
            node.classes.klass = klass;
          }
        }
        if (!init && primed) {
          check(node);
        }
        return null;
      };
    })(this);
    addTags = function(sets, tags, node) {
      var k, list, _i, _len, _ref;
      if (tags == null) {
        return;
      }
      for (_i = 0, _len = tags.length; _i < _len; _i++) {
        k = tags[_i];
        list = (_ref = sets[k]) != null ? _ref : [];
        list.push(node);
        sets[k] = list;
      }
      return null;
    };
    removeTags = function(sets, tags, node) {
      var index, k, list, _i, _len;
      if (tags == null) {
        return;
      }
      for (_i = 0, _len = tags.length; _i < _len; _i++) {
        k = tags[_i];
        list = sets[k];
        index = list.indexOf(node);
        if (index >= 0) {
          list.splice(index, 1);
        }
        if (list.length === 0) {
          delete sets[k];
        }
      }
      return null;
    };
    hashTags = function(array) {
      var hash, klass, _i, _len, _results;
      if (!(array.length > 0)) {
        return;
      }
      hash = array.hash = {};
      _results = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        klass = array[_i];
        _results.push(hash[klass] = true);
      }
      return _results;
    };
    unhashTags = function(array) {
      return delete array.hash;
    };
    addID = (function(_this) {
      return function(id, node) {
        if (_this.ids[id]) {
          throw new Error("Duplicate node id `" + id + "`");
        }
        if (id != null) {
          _this.ids[id] = [node];
        }
        return node.id = id != null ? id : node._id;
      };
    })(this);
    removeID = (function(_this) {
      return function(id, node) {
        if (id != null) {
          delete _this.ids[id];
        }
        return node.id = node._id;
      };
    })(this);
    addClasses = (function(_this) {
      return function(classes, node) {
        addTags(_this.classes, classes, node);
        if (classes != null) {
          return hashTags(classes);
        }
      };
    })(this);
    removeClasses = (function(_this) {
      return function(classes, node) {
        removeTags(_this.classes, classes, node);
        if (classes != null) {
          return unhashTags(classes);
        }
      };
    })(this);
    addNode = (function(_this) {
      return function(node) {
        return _this.nodes.push(node);
      };
    })(this);
    removeNode = (function(_this) {
      return function(node) {
        return _this.nodes.splice(_this.nodes.indexOf(node), 1);
      };
    })(this);
    addType = (function(_this) {
      return function(node) {
        return addTags(_this.types, [node.type], node);
      };
    })(this);
    removeType = (function(_this) {
      return function(node) {
        return removeTags(_this.types, [node.type], node);
      };
    })(this);
    addTraits = (function(_this) {
      return function(node) {
        addTags(_this.traits, node.traits, node);
        return hashTags(node.traits);
      };
    })(this);
    removeTraits = (function(_this) {
      return function(node) {
        removeTags(_this.traits, node.traits, node);
        return unhashTags(node.traits);
      };
    })(this);
    adopt(this.root);
    this.root.trigger({
      type: 'added'
    });
  }

  Model.prototype.filter = function(nodes, selector) {
    var matcher, node, _i, _len, _results;
    matcher = this._matcher(selector);
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      if (matcher(node)) {
        _results.push(node);
      }
    }
    return _results;
  };

  Model.prototype.ancestry = function(nodes, parents) {
    var node, out, parent, _i, _len;
    out = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      parent = node.parent;
      while (parent != null) {
        if (__indexOf.call(parents, parent) >= 0) {
          out.push(node);
          break;
        }
        parent = parent.parent;
      }
    }
    return out;
  };

  Model.prototype.select = function(selector, parents) {
    var matches;
    matches = this._select(selector);
    if (parents != null) {
      matches = this.ancestry(matches, parents);
    }
    matches.sort(function(a, b) {
      return b.order - a.order;
    });
    return matches;
  };

  Model.prototype.watch = function(selector, handler) {
    var watcher;
    handler.unwatch = (function(_this) {
      return function() {
        return _this.unwatch(handler);
      };
    })(this);
    handler.watcher = watcher = {
      handler: handler,
      matcher: this._matcher(selector),
      match: false,
      fire: false
    };
    this.watchers.push(watcher);
    return this.select(selector);
  };

  Model.prototype.unwatch = function(handler) {
    var watcher;
    watcher = handler.watcher;
    if (watcher == null) {
      return;
    }
    this.watchers.splice(this.watchers.indexOf(watcher), 1);
    delete handler.unwatch;
    return delete handler.watcher;
  };

  Model.prototype._simplify = function(s) {
    var all, found, id, klass, trait, type, _ref, _ref1, _ref2, _ref3;
    s = s.replace(/^\s+/, '');
    s = s.replace(/\s+$/, '');
    found = all = s === ALL;
    if (!found) {
      found = id = (_ref = s.match(ID)) != null ? _ref[1] : void 0;
    }
    if (!found) {
      found = klass = (_ref1 = s.match(CLASS)) != null ? _ref1[1] : void 0;
    }
    if (!found) {
      found = trait = (_ref2 = s.match(TRAIT)) != null ? _ref2[1] : void 0;
    }
    if (!found) {
      found = type = (_ref3 = s.match(TYPE)) != null ? _ref3[0] : void 0;
    }
    return [all, id, klass, trait, type];
  };

  Model.prototype._matcher = function(s) {
    var all, id, klass, trait, type, _ref;
    _ref = this._simplify(s), all = _ref[0], id = _ref[1], klass = _ref[2], trait = _ref[3], type = _ref[4];
    if (all) {
      return (function(node) {
        return true;
      });
    }
    if (id) {
      return (function(node) {
        return node.id === id;
      });
    }
    if (klass) {
      return (function(node) {
        var _ref1, _ref2;
        return (_ref1 = node.classes) != null ? (_ref2 = _ref1.hash) != null ? _ref2[klass] : void 0 : void 0;
      });
    }
    if (trait) {
      return (function(node) {
        var _ref1, _ref2;
        return (_ref1 = node.traits) != null ? (_ref2 = _ref1.hash) != null ? _ref2[trait] : void 0 : void 0;
      });
    }
    if (type) {
      return (function(node) {
        return node.type === type;
      });
    }
    return language(s);
  };

  Model.prototype._select = function(s) {
    var all, id, klass, trait, type, _ref, _ref1, _ref2, _ref3, _ref4;
    _ref = this._simplify(s), all = _ref[0], id = _ref[1], klass = _ref[2], trait = _ref[3], type = _ref[4];
    if (all) {
      return this.nodes;
    }
    if (id) {
      return (_ref1 = this.ids[id]) != null ? _ref1 : [];
    }
    if (klass) {
      return (_ref2 = this.classes[klass]) != null ? _ref2 : [];
    }
    if (trait) {
      return (_ref3 = this.traits[trait]) != null ? _ref3 : [];
    }
    if (type) {
      return (_ref4 = this.types[type]) != null ? _ref4 : [];
    }
    return this.filter(this.nodes, s);
  };

  Model.prototype.getRoot = function() {
    return this.root;
  };

  Model.prototype.getLastTrigger = function() {
    return this.lastNode.toString();
  };

  return Model;

})();

module.exports = Model;


},{"cssauron":16}],36:[function(require,module,exports){
var Binder, Node, Util, nodeIndex;

Util = require('../util');

nodeIndex = 0;

Node = (function() {
  function Node(type, defaults, options, binds, config, attributes) {
    this.type = type;
    this._id = (++nodeIndex).toString();
    this.configure(config, attributes);
    this.parent = this.root = this.path = this.index = null;
    this.set(defaults, true, true);
    this.set(options, false, true);
    this.bind(binds, false);
  }

  Node.prototype.configure = function(config, attributes) {
    var finals, freeform, props, traits, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    traits = config.traits, props = config.props, finals = config.finals, freeform = config.freeform;
    if (traits == null) {
      traits = (_ref = (_ref1 = this._config) != null ? _ref1.traits : void 0) != null ? _ref : [];
    }
    if (props == null) {
      props = (_ref2 = (_ref3 = this._config) != null ? _ref3.props : void 0) != null ? _ref2 : {};
    }
    if (finals == null) {
      finals = (_ref4 = (_ref5 = this._config) != null ? _ref5.finals : void 0) != null ? _ref4 : {};
    }
    if (freeform == null) {
      freeform = (_ref6 = (_ref7 = this._config) != null ? _ref7.freeform : void 0) != null ? _ref6 : false;
    }
    this._config = {
      traits: traits,
      props: props,
      finals: finals,
      freeform: freeform
    };
    return this.attributes = attributes.apply(this, this._config);
  };

  Node.prototype.dispose = function() {
    this.attributes.dispose();
    return this.attributes = null;
  };

  Node.prototype._added = function(parent) {
    var event;
    this.parent = parent;
    this.root = parent.root;
    event = {
      type: 'add',
      node: this,
      parent: this.parent
    };
    if (this.root) {
      this.root.trigger(event);
    }
    event.type = 'added';
    return this.trigger(event);
  };

  Node.prototype._removed = function() {
    var event;
    event = {
      type: 'remove',
      node: this
    };
    if (this.root) {
      this.root.trigger(event);
    }
    event.type = 'removed';
    this.trigger(event);
    return this.root = this.parent = null;
  };

  Node.prototype._index = function(index, parent) {
    var path, _ref;
    if (parent == null) {
      parent = this.parent;
    }
    this.index = index;
    this.path = path = index != null ? ((_ref = parent != null ? parent.path : void 0) != null ? _ref : []).concat([index]) : null;
    this.order = path != null ? this._encode(path) : Infinity;
    if (this.root != null) {
      return this.trigger({
        type: 'reindex'
      });
    }
  };

  Node.prototype._encode = function(path) {
    var a, b, f, g, index, k, lerp, map, _i, _len, _ref;
    k = 3;
    map = function(x) {
      return k / (x + k);
    };
    lerp = function(t) {
      return b + (a - b) * t;
    };
    a = 1 + 1 / k;
    b = 0;
    for (_i = 0, _len = path.length; _i < _len; _i++) {
      index = path[_i];
      f = map(index + 1);
      g = map(index + 2);
      _ref = [lerp(f), lerp(g)], a = _ref[0], b = _ref[1];
    }
    return a;
  };

  Node.prototype.toString = function() {
    var count, id, tag, _id, _ref, _ref1, _ref2;
    _id = (_ref = this.id) != null ? _ref : this._id;
    tag = (_ref1 = this.type) != null ? _ref1 : 'node';
    id = tag;
    id += "#" + _id;
    if ((_ref2 = this.classes) != null ? _ref2.length : void 0) {
      id += "." + (this.classes.join('.'));
    }
    if (this.children != null) {
      if (count = this.children.length) {
        return "<" + id + ">…(" + count + ")…</" + tag + ">";
      } else {
        return "<" + id + "></" + tag + ">";
      }
    } else {
      return "<" + id + " />";
    }
  };

  Node.prototype.toMarkup = function(selector, indent) {
    var attr, child, children, close, expr, k, open, orig, props, recurse, tag, v, _ref, _ref1, _ref2, _ref3;
    if (selector == null) {
      selector = null;
    }
    if (indent == null) {
      indent = '';
    }
    if (selector && typeof selector !== 'function') {
      selector = (_ref = (_ref1 = this.root) != null ? _ref1.model._matcher(selector) : void 0) != null ? _ref : function() {
        return true;
      };
    }
    tag = (_ref2 = this.type) != null ? _ref2 : 'node';
    expr = this.expr;
    orig = {
      id: this._id
    };
    _ref3 = typeof this.orig === "function" ? this.orig() : void 0;
    for (k in _ref3) {
      v = _ref3[k];
      orig[k] = v;
    }
    props = (function() {
      var _results;
      _results = [];
      for (k in orig) {
        v = orig[k];
        if (!this.expr[k]) {
          _results.push(Util.Pretty.JSX.prop(k, v));
        }
      }
      return _results;
    }).call(this);
    expr = (function() {
      var _results;
      _results = [];
      for (k in expr) {
        v = expr[k];
        _results.push(Util.Pretty.JSX.bind(k, v));
      }
      return _results;
    })();
    attr = [''];
    if (props.length) {
      attr = attr.concat(props);
    }
    if (expr.length) {
      attr = attr.concat(expr);
    }
    attr = attr.join(' ');
    child = indent;
    recurse = (function(_this) {
      return function() {
        var children, _ref4;
        if (!((_ref4 = _this.children) != null ? _ref4.length : void 0)) {
          return '';
        }
        return children = _this.children.map(function(x) {
          return x.toMarkup(selector, child);
        }).filter(function(x) {
          return (x != null) && x.length;
        }).join("\n");
      };
    })(this);
    if (selector && !selector(this)) {
      return recurse();
    }
    if (this.children != null) {
      open = "<" + tag + attr + ">";
      close = "</" + tag + ">";
      child = indent + '  ';
      children = recurse();
      if (children.length) {
        children = "\n" + children + "\n" + indent;
      }
      if (children == null) {
        children = '';
      }
      return indent + open + children + close;
    } else {
      return "" + indent + "<" + tag + attr + " />";
    }
  };

  Node.prototype.print = function(selector, level) {
    return Util.Pretty.print(this.toMarkup(selector), level);
  };

  return Node;

})();

Binder = require('../util/binder');

Binder.apply(Node.prototype);

module.exports = Node;


},{"../util":172,"../util/binder":168}],37:[function(require,module,exports){
var Classes;

Classes = {
  dom: require('./dom')
};

module.exports = Classes;


},{"./dom":38}],38:[function(require,module,exports){
var DOM, Overlay, VDOM,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Overlay = require('./overlay');

VDOM = require('../util').VDOM;

DOM = (function(_super) {
  __extends(DOM, _super);

  function DOM() {
    return DOM.__super__.constructor.apply(this, arguments);
  }

  DOM.prototype.el = VDOM.element;

  DOM.prototype.hint = VDOM.hint;

  DOM.prototype.apply = VDOM.apply;

  DOM.prototype.recycle = VDOM.recycle;

  DOM.prototype.init = function(options) {
    return this.last = null;
  };

  DOM.prototype.dispose = function() {
    this.unmount();
    return DOM.__super__.dispose.apply(this, arguments);
  };

  DOM.prototype.mount = function() {
    var overlay;
    overlay = document.createElement('div');
    overlay.classList.add('mathbox-overlay');
    this.element.appendChild(overlay);
    return this.overlay = overlay;
  };

  DOM.prototype.unmount = function(overlay) {
    if (this.overlay.parentNode) {
      this.element.removeChild(this.overlay);
    }
    return this.overlay = null;
  };

  DOM.prototype.render = function(el) {
    var last, naked, node, overlay, parent, _ref;
    if (!this.overlay) {
      this.mount();
    }
    if ((_ref = typeof el) === 'string' || _ref === 'number') {
      el = this.el('div', null, el);
    }
    if (el instanceof Array) {
      el = this.el('div', null, el);
    }
    naked = el.type === 'div';
    last = this.last;
    overlay = this.overlay;
    node = naked ? overlay : overlay.childNodes[0];
    parent = naked ? overlay.parentNode : overlay;
    if (!last && node) {
      last = this.el('div');
    }
    this.apply(el, last, node, parent, 0);
    this.last = el;
    if (last != null) {
      this.recycle(last);
    }
  };

  return DOM;

})(Overlay);

module.exports = DOM;


},{"../util":172,"./overlay":41}],39:[function(require,module,exports){
var OverlayFactory;

OverlayFactory = (function() {
  function OverlayFactory(classes, canvas) {
    var div;
    this.classes = classes;
    this.canvas = canvas;
    div = document.createElement('div');
    div.classList.add('mathbox-overlays');
    this.div = div;
  }

  OverlayFactory.prototype.inject = function() {
    var element;
    element = this.canvas.parentNode;
    if (!element) {
      throw new Error("Canvas not inserted into document.");
    }
    return element.insertBefore(this.div, this.canvas);
  };

  OverlayFactory.prototype.unject = function() {
    var element;
    element = this.div.parentNode;
    return element.removeChild(this.div);
  };

  OverlayFactory.prototype.getTypes = function() {
    return Object.keys(this.classes);
  };

  OverlayFactory.prototype.make = function(type, options) {
    return new this.classes[type](this.div, options);
  };

  return OverlayFactory;

})();

module.exports = OverlayFactory;


},{}],40:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Classes = require('./classes');

exports.Overlay = require('./overlay');


},{"./classes":37,"./factory":39,"./overlay":41}],41:[function(require,module,exports){
var Overlay;

Overlay = (function() {
  function Overlay(element, options) {
    this.element = element;
    if (typeof this.init === "function") {
      this.init(options);
    }
  }

  Overlay.prototype.dispose = function() {};

  return Overlay;

})();

module.exports = Overlay;


},{}],42:[function(require,module,exports){
var PrimitiveFactory, Util;

Util = require('../util');

PrimitiveFactory = (function() {
  function PrimitiveFactory(definitions, context) {
    this.context = context;
    this.classes = definitions.Classes;
    this.helpers = definitions.Helpers;
  }

  PrimitiveFactory.prototype.getTypes = function() {
    return Object.keys(this.classes);
  };

  PrimitiveFactory.prototype.make = function(type, options, binds) {
    var klass, node, primitive;
    if (options == null) {
      options = {};
    }
    if (binds == null) {
      binds = null;
    }
    klass = this.classes[type];
    if (klass == null) {
      throw new Error("Unknown primitive class `" + type + "`");
    }
    node = new klass.model(type, klass.defaults, options, binds, klass, this.context.attributes);
    primitive = new klass(node, this.context, this.helpers);
    return node;
  };

  return PrimitiveFactory;

})();

module.exports = PrimitiveFactory;


},{"../util":172}],43:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Primitive = require('./primitive');

exports.Types = require('./types');


},{"./factory":42,"./primitive":44,"./types":72}],44:[function(require,module,exports){
var Binder, Model, Primitive,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Model = require('../model');

Primitive = (function() {
  Primitive.Node = Model.Node;

  Primitive.Group = Model.Group;

  Primitive.model = Primitive.Node;

  Primitive.defaults = null;

  Primitive.traits = null;

  Primitive.props = null;

  Primitive.finals = null;

  Primitive.freeform = false;

  function Primitive(node, _context, helpers) {
    this.node = node;
    this._context = _context;
    this._renderables = this._context.renderables;
    this._attributes = this._context.attributes;
    this._shaders = this._context.shaders;
    this._overlays = this._context.overlays;
    this._animator = this._context.animator;
    this._types = this._attributes.types;
    this.node.controller = this;
    this.node.on('added', (function(_this) {
      return function(event) {
        return _this._added();
      };
    })(this));
    this.node.on('removed', (function(_this) {
      return function(event) {
        return _this._removed();
      };
    })(this));
    this.node.on('change', (function(_this) {
      return function(event) {
        if (_this._root) {
          return _this.change(event.changed, event.touched);
        }
      };
    })(this));
    this.reconfigure();
    this._get = this.node.get.bind(this.node);
    this._helpers = helpers(this, this.node.traits);
    this._handlers = {
      inherit: {},
      listen: [],
      watch: [],
      compute: []
    };
    this._root = this._parent = null;
    this.init();
  }

  Primitive.prototype.is = function(trait) {
    return this.traits.hash[trait];
  };

  Primitive.prototype.init = function() {};

  Primitive.prototype.make = function() {};

  Primitive.prototype.made = function() {};

  Primitive.prototype.unmake = function(rebuild) {};

  Primitive.prototype.unmade = function() {};

  Primitive.prototype.change = function(changed, touched, init) {};

  Primitive.prototype.refresh = function() {
    return this.change({}, {}, true);
  };

  Primitive.prototype.rebuild = function() {
    if (this._root) {
      this._removed(true);
      return this._added();
    }
  };

  Primitive.prototype.reconfigure = function(config) {
    if (config != null) {
      this.node.configure(config, this._attributes);
    }
    this.traits = this.node.traits;
    return this.props = this.node.props;
  };

  Primitive.prototype._added = function() {
    var e, _ref, _ref1, _ref2;
    this._parent = (_ref = this.node.parent) != null ? _ref.controller : void 0;
    this._root = (_ref1 = this.node.root) != null ? _ref1.controller : void 0;
    this.node.clock = (_ref2 = this._inherit('clock')) != null ? _ref2 : this._root;
    try {
      try {
        this.make();
        this.refresh();
        return this.made();
      } catch (_error) {
        e = _error;
        this.node.print('warn');
        console.error(e);
        throw e;
      }
    } catch (_error) {
      e = _error;
      try {
        return this._removed();
      } catch (_error) {}
    }
  };

  Primitive.prototype._removed = function(rebuild) {
    if (rebuild == null) {
      rebuild = false;
    }
    this.unmake(rebuild);
    this._unlisten();
    this._unattach();
    this._uncompute();
    this._root = null;
    this._parent = null;
    return this.unmade(rebuild);
  };

  Primitive.prototype._listen = function(object, type, method, self) {
    var o, _i, _len;
    if (self == null) {
      self = this;
    }
    if (object instanceof Array) {
      for (_i = 0, _len = object.length; _i < _len; _i++) {
        o = object[_i];
        return this.__listen(o, type, method, self);
      }
    }
    return this.__listen(object, type, method, self);
  };

  Primitive.prototype.__listen = function(object, type, method, self) {
    var handler;
    if (self == null) {
      self = this;
    }
    if (typeof object === 'string') {
      object = this._inherit(object);
    }
    if (object != null) {
      handler = method.bind(self);
      handler.node = this.node;
      object.on(type, handler);
      this._handlers.listen.push([object, type, handler]);
    }
    return object;
  };

  Primitive.prototype._unlisten = function() {
    var handler, object, type, _i, _len, _ref, _ref1;
    if (!this._handlers.listen.length) {
      return;
    }
    _ref = this._handlers.listen;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], object = _ref1[0], type = _ref1[1], handler = _ref1[2];
      object.off(type, handler);
    }
    return this._handlers.listen = [];
  };

  Primitive.prototype._inherit = function(trait) {
    var cached, _ref;
    cached = this._handlers.inherit[trait];
    if (cached !== void 0) {
      return cached;
    }
    return this._handlers.inherit[trait] = (_ref = this._parent) != null ? _ref._find(trait != null ? trait : null) : void 0;
  };

  Primitive.prototype._find = function(trait) {
    var _ref;
    if (this.is(trait)) {
      return this;
    }
    return (_ref = this._parent) != null ? _ref._find(trait) : void 0;
  };

  Primitive.prototype._uninherit = function() {
    return this._handlers.inherit = {};
  };

  Primitive.prototype._attach = function(selector, trait, method, self, start, optional, multiple) {
    var controller, controllers, discard, filter, flatten, id, map, match, node, nodes, parent, previous, selection, watcher;
    if (self == null) {
      self = this;
    }
    if (start == null) {
      start = this;
    }
    if (optional == null) {
      optional = false;
    }
    if (multiple == null) {
      multiple = false;
    }
    filter = function(node) {
      if ((node != null) && __indexOf.call(node.traits, trait) >= 0) {
        return node.controller;
      }
    };
    map = function(node) {
      return node != null ? node.controller : void 0;
    };
    flatten = function(list) {
      var out, sub, _i, _len;
      out = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        sub = list[_i];
        if (sub instanceof Array) {
          out = out.concat(sub);
        } else {
          out.push(sub);
        }
      }
      return out;
    };
    if (typeof selector === 'object') {
      if (!multiple) {
        node = selector;
        if (node._up) {
          node = node[0];
        }
        if (node instanceof Array) {
          node = node[0];
        }
        if (node._up) {
          node = node[0];
        }
        if (filter(node)) {
          controller = map(node);
        }
        if (controller != null) {
          return controller;
        }
      } else {
        nodes = selector;
        if (nodes._up) {
          nodes = [].slice.call(nodes);
        }
        if (!(nodes instanceof Array)) {
          nodes = [nodes];
        }
        nodes = flatten(nodes.map(function(n) {
          if (n._up) {
            return n._targets;
          } else {
            return n;
          }
        }));
        controllers = nodes.filter(filter).map(map);
        if (controllers.length) {
          return controllers;
        }
      }
    }
    if (typeof selector === 'string' && selector[0] === '<') {
      discard = 0;
      if (match = selector.match(/^<([0-9])+$/)) {
        discard = +match[1] - 1;
      }
      if (selector.match(/^<+$/)) {
        discard = +selector.length - 1;
      }
      controllers = [];
      previous = start.node;
      while (previous) {
        parent = previous.parent;
        if (!parent) {
          break;
        }
        previous = parent.children[previous.index - 1];
        if (!(previous || controllers.length)) {
          previous = parent;
        }
        controller = null;
        if (filter(previous)) {
          controller = map(previous);
        }
        if ((controller != null) && discard-- <= 0) {
          controllers.push(controller);
        }
        if (!multiple && controllers.length) {
          return controllers[0];
        }
      }
      if (multiple && controllers.length) {
        return controllers;
      }
    } else if (typeof selector === 'string') {
      watcher = method.bind(self);
      this._handlers.watch.push(watcher);
      selection = this._root.watch(selector, watcher);
      if (!multiple) {
        if (filter(selection[0])) {
          controller = map(selection[0]);
        }
        if (controller != null) {
          return controller;
        }
      } else {
        controllers = selection.filter(filter).map(map);
        if (controllers.length) {
          return controllers;
        }
      }
    }
    if (this.node.id != null) {
      id = "#" + this.node.id;
    }
    if (!optional) {
      console.warn(this.node.toMarkup());
      throw new Error("" + (this.node.toString()) + " - Could not find " + trait + " `" + selector + "`");
    }
    if (multiple) {
      return [];
    } else {
      return null;
    }
  };

  Primitive.prototype._unattach = function() {
    var watcher, _i, _len, _ref;
    if (!this._handlers.watch.length) {
      return;
    }
    _ref = this._handlers.watch;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      watcher = _ref[_i];
      if (watcher != null) {
        watcher.unwatch();
      }
    }
    return this._handlers.watch = [];
  };

  Primitive.prototype._compute = function(key, expr) {
    this._handlers.compute.push(key);
    return this.node.bind(key, expr, true);
  };

  Primitive.prototype._uncompute = function() {
    var key, _i, _len, _ref;
    if (!this._handlers.compute.length) {
      return;
    }
    _ref = this._handlers.compute;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      this.node.unbind(key, true);
    }
    return this._handlers.compute = [];
  };

  return Primitive;

})();

Binder = require('../util/binder');

Binder.apply(Primitive.prototype);

module.exports = Primitive;


},{"../model":34,"../util/binder":168}],45:[function(require,module,exports){
var Group, Parent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('./parent');

Group = (function(_super) {
  __extends(Group, _super);

  function Group() {
    return Group.__super__.constructor.apply(this, arguments);
  }

  Group.traits = ['node', 'object', 'entity', 'visible', 'active'];

  Group.prototype.make = function() {
    this._helpers.visible.make();
    return this._helpers.active.make();
  };

  Group.prototype.unmake = function() {
    this._helpers.visible.unmake();
    return this._helpers.active.unmake();
  };

  return Group;

})(Parent);

module.exports = Group;


},{"./parent":47}],46:[function(require,module,exports){
var Inherit, Parent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Parent = require('./parent');

Inherit = (function(_super) {
  __extends(Inherit, _super);

  function Inherit() {
    return Inherit.__super__.constructor.apply(this, arguments);
  }

  Inherit.traits = ['node', 'bind'];

  Inherit.prototype.make = function() {
    return this._helpers.bind.make([
      {
        to: 'inherit.source',
        trait: 'node'
      }
    ]);
  };

  Inherit.prototype.unmake = function() {
    return this._helpers.bind.unmake();
  };

  Inherit.prototype._find = function(trait) {
    if (this.bind.source && (__indexOf.call(this.props.traits, trait) >= 0)) {
      return this.bind.source._inherit(trait);
    }
    return Inherit.__super__._find.apply(this, arguments);
  };

  return Inherit;

})(Parent);

module.exports = Inherit;


},{"./parent":47}],47:[function(require,module,exports){
var Parent, Primitive,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Parent = (function(_super) {
  __extends(Parent, _super);

  function Parent() {
    return Parent.__super__.constructor.apply(this, arguments);
  }

  Parent.model = Primitive.Group;

  Parent.traits = ['node'];

  return Parent;

})(Primitive);

module.exports = Parent;


},{"../../primitive":44}],48:[function(require,module,exports){
var Parent, Root, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('./parent');

Util = require('../../../util');

Root = (function(_super) {
  __extends(Root, _super);

  function Root() {
    return Root.__super__.constructor.apply(this, arguments);
  }

  Root.traits = ['node', 'root', 'clock', 'scene', 'vertex', 'unit'];

  Root.prototype.init = function() {
    this.size = null;
    this.cameraEvent = {
      type: 'root.camera'
    };
    this.preEvent = {
      type: 'root.pre'
    };
    this.updateEvent = {
      type: 'root.update'
    };
    this.renderEvent = {
      type: 'root.render'
    };
    this.postEvent = {
      type: 'root.post'
    };
    this.clockEvent = {
      type: 'clock.tick'
    };
    return this.camera = null;
  };

  Root.prototype.make = function() {
    return this._helpers.unit.make();
  };

  Root.prototype.unmake = function() {
    return this._helpers.unit.unmake();
  };

  Root.prototype.change = function(changed, touched, init) {
    if (changed['root.camera'] || init) {
      this._unattach();
      this._attach(this.props.camera, 'camera', this.setCamera, this, this, true);
      return this.setCamera();
    }
  };

  Root.prototype.adopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this._context.scene.add(object));
    }
    return _results;
  };

  Root.prototype.unadopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this._context.scene.remove(object));
    }
    return _results;
  };

  Root.prototype.select = function(selector) {
    return this.node.model.select(selector);
  };

  Root.prototype.watch = function(selector, handler) {
    return this.node.model.watch(selector, handler);
  };

  Root.prototype.unwatch = function(handler) {
    return this.node.model.unwatch(handler);
  };

  Root.prototype.resize = function(size) {
    this.size = size;
    return this.trigger({
      type: 'root.resize',
      size: size
    });
  };

  Root.prototype.getSize = function() {
    return this.size;
  };

  Root.prototype.getSpeed = function() {
    return this.props.speed;
  };

  Root.prototype.getUnit = function() {
    return this._helpers.unit.get();
  };

  Root.prototype.getUnitUniforms = function() {
    return this._helpers.unit.uniforms();
  };

  Root.prototype.pre = function() {
    this.getCamera().updateProjectionMatrix();
    this.trigger(this.clockEvent);
    return this.trigger(this.preEvent);
  };

  Root.prototype.update = function() {
    return this.trigger(this.updateEvent);
  };

  Root.prototype.render = function() {
    return this.trigger(this.renderEvent);
  };

  Root.prototype.post = function() {
    return this.trigger(this.postEvent);
  };

  Root.prototype.setCamera = function() {
    var camera, _ref;
    camera = (_ref = this.select(this.props.camera)[0]) != null ? _ref.controller : void 0;
    if (this.camera !== camera) {
      this.camera = camera;
      return this.trigger({
        type: 'root.camera'
      });
    }
  };

  Root.prototype.getCamera = function() {
    var _ref, _ref1;
    return (_ref = (_ref1 = this.camera) != null ? _ref1.getCamera() : void 0) != null ? _ref : this._context.defaultCamera;
  };

  Root.prototype.getTime = function() {
    return this._context.time;
  };

  Root.prototype.vertex = function(shader, pass) {
    if (pass === 2) {
      return shader.pipe('view.position');
    }
    if (pass === 3) {
      return shader.pipe('root.position');
    }
    return shader;
  };

  return Root;

})(Parent);

module.exports = Root;


},{"../../../util":172,"./parent":47}],49:[function(require,module,exports){
var Primitive, Source, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Source = (function(_super) {
  __extends(Source, _super);

  function Source() {
    return Source.__super__.constructor.apply(this, arguments);
  }

  Source.traits = ['node', 'source', 'index'];

  Source.prototype.made = function() {
    return this.trigger({
      type: 'source.rebuild'
    });
  };

  Source.prototype.indexShader = function(shader) {
    return shader.pipe(Util.GLSL.identity('vec4'));
  };

  Source.prototype.sourceShader = function(shader) {
    return shader.pipe(Util.GLSL.identity('vec4'));
  };

  Source.prototype.getDimensions = function() {
    return {
      items: 1,
      width: 1,
      height: 1,
      depth: 1
    };
  };

  Source.prototype.getActiveDimensions = function() {
    return this.getDimensions();
  };

  Source.prototype.getIndexDimensions = function() {
    return this.getActiveDimensions();
  };

  Source.prototype.getFutureDimensions = function() {
    return this.getActiveDimensions();
  };

  return Source;

})(Primitive);

module.exports = Source;


},{"../../../util":172,"../../primitive":44}],50:[function(require,module,exports){
var Parent, Unit, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('./parent');

Util = require('../../../util');

Unit = (function(_super) {
  __extends(Unit, _super);

  function Unit() {
    return Unit.__super__.constructor.apply(this, arguments);
  }

  Unit.traits = ['node', 'unit'];

  Unit.prototype.make = function() {
    return this._helpers.unit.make();
  };

  Unit.prototype.unmake = function() {
    return this._helpers.unit.unmake();
  };

  Unit.prototype.getUnit = function() {
    return this._helpers.unit.get();
  };

  Unit.prototype.getUnitUniforms = function() {
    return this._helpers.unit.uniforms();
  };

  return Unit;

})(Parent);

module.exports = Unit;


},{"../../../util":172,"./parent":47}],51:[function(require,module,exports){
var Camera, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Camera = (function(_super) {
  __extends(Camera, _super);

  function Camera() {
    return Camera.__super__.constructor.apply(this, arguments);
  }

  Camera.traits = ['node', 'camera'];

  Camera.prototype.init = function() {};

  Camera.prototype.make = function() {
    var camera;
    camera = this._context.defaultCamera;
    this.camera = this.props.proxy ? camera : camera.clone();
    this.euler = new THREE.Euler;
    return this.quat = new THREE.Quaternion;
  };

  Camera.prototype.unmake = function() {};

  Camera.prototype.getCamera = function() {
    return this.camera;
  };

  Camera.prototype.change = function(changed, touched, init) {
    var aspect, fov, lookAt, position, quaternion, rotation, up, _ref;
    if (changed['camera.position'] || changed['camera.quaternion'] || changed['camera.rotation'] || changed['camera.lookAt'] || changed['camera.up'] || changed['camera.fov'] || init) {
      _ref = this.props, position = _ref.position, quaternion = _ref.quaternion, rotation = _ref.rotation, lookAt = _ref.lookAt, up = _ref.up, fov = _ref.fov, aspect = _ref.aspect;
      if (position != null) {
        this.camera.position.copy(position);
      }
      if ((quaternion != null) || (rotation != null) || (lookAt != null)) {
        if (lookAt != null) {
          this.camera.lookAt(lookAt);
        } else {
          this.camera.quaternion.set(0, 0, 0, 1);
        }
        if (rotation != null) {
          this.euler.setFromVector3(rotation, Util.Three.swizzleToEulerOrder(this.props.eulerOrder));
          this.quat.setFromEuler(this.euler);
          this.camera.quaternion.multiply(this.quat);
        }
        if (quaternion != null) {
          this.camera.quaternion.multiply(quaternion);
        }
      }
      if ((fov != null) && (this.camera.fov != null)) {
        this.camera.fov = fov;
      }
      if (up != null) {
        this.camera.up.copy(up);
      }
      return this.camera.updateMatrix();
    }
  };

  return Camera;

})(Primitive);

module.exports = Camera;


},{"../../../util":172,"../../primitive":44}],52:[function(require,module,exports){
var Classes;

Classes = {
  axis: require('./draw/axis'),
  face: require('./draw/face'),
  grid: require('./draw/grid'),
  line: require('./draw/line'),
  point: require('./draw/point'),
  strip: require('./draw/strip'),
  surface: require('./draw/surface'),
  ticks: require('./draw/ticks'),
  vector: require('./draw/vector'),
  view: require('./view/view'),
  cartesian: require('./view/cartesian'),
  cartesian4: require('./view/cartesian4'),
  polar: require('./view/polar'),
  spherical: require('./view/spherical'),
  stereographic: require('./view/stereographic'),
  stereographic4: require('./view/stereographic4'),
  transform: require('./transform/transform3'),
  transform4: require('./transform/transform4'),
  vertex: require('./transform/vertex'),
  fragment: require('./transform/fragment'),
  layer: require('./transform/layer'),
  mask: require('./transform/mask'),
  array: require('./data/array'),
  interval: require('./data/interval'),
  matrix: require('./data/matrix'),
  area: require('./data/area'),
  voxel: require('./data/voxel'),
  volume: require('./data/volume'),
  scale: require('./data/scale'),
  html: require('./overlay/html'),
  dom: require('./overlay/dom'),
  text: require('./text/text'),
  format: require('./text/format'),
  label: require('./text/label'),
  retext: require('./text/retext'),
  grow: require('./operator/grow'),
  join: require('./operator/join'),
  lerp: require('./operator/lerp'),
  memo: require('./operator/memo'),
  resample: require('./operator/resample'),
  repeat: require('./operator/repeat'),
  swizzle: require('./operator/swizzle'),
  spread: require('./operator/spread'),
  split: require('./operator/split'),
  slice: require('./operator/slice'),
  transpose: require('./operator/transpose'),
  group: require('./base/group'),
  inherit: require('./base/inherit'),
  root: require('./base/root'),
  unit: require('./base/unit'),
  shader: require('./shader/shader'),
  camera: require('./camera/camera'),
  rtt: require('./rtt/rtt'),
  compose: require('./rtt/compose'),
  clock: require('./time/clock'),
  now: require('./time/now'),
  move: require('./present/move'),
  play: require('./present/play'),
  present: require('./present/present'),
  reveal: require('./present/reveal'),
  slide: require('./present/slide'),
  step: require('./present/step')
};

module.exports = Classes;


},{"./base/group":45,"./base/inherit":46,"./base/root":48,"./base/unit":50,"./camera/camera":51,"./data/area":53,"./data/array":54,"./data/interval":57,"./data/matrix":58,"./data/scale":59,"./data/volume":60,"./data/voxel":61,"./draw/axis":62,"./draw/face":63,"./draw/grid":64,"./draw/line":65,"./draw/point":66,"./draw/strip":67,"./draw/surface":68,"./draw/ticks":69,"./draw/vector":70,"./operator/grow":73,"./operator/join":74,"./operator/lerp":75,"./operator/memo":76,"./operator/repeat":78,"./operator/resample":79,"./operator/slice":80,"./operator/split":81,"./operator/spread":82,"./operator/swizzle":83,"./operator/transpose":84,"./overlay/dom":85,"./overlay/html":86,"./present/move":87,"./present/play":88,"./present/present":89,"./present/reveal":90,"./present/slide":91,"./present/step":92,"./rtt/compose":95,"./rtt/rtt":96,"./shader/shader":97,"./text/format":98,"./text/label":99,"./text/retext":100,"./text/text":101,"./time/clock":102,"./time/now":103,"./transform/fragment":105,"./transform/layer":106,"./transform/mask":107,"./transform/transform3":109,"./transform/transform4":110,"./transform/vertex":111,"./view/cartesian":113,"./view/cartesian4":114,"./view/polar":115,"./view/spherical":116,"./view/stereographic":117,"./view/stereographic4":118,"./view/view":119}],53:[function(require,module,exports){
var Area, Matrix, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Matrix = require('./matrix');

Util = require('../../../util');

Area = (function(_super) {
  __extends(Area, _super);

  function Area() {
    return Area.__super__.constructor.apply(this, arguments);
  }

  Area.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'matrix', 'texture', 'raw', 'span:x', 'span:y', 'area', 'sampler:x', 'sampler:y'];

  Area.prototype.updateSpan = function() {
    var centeredX, centeredY, dimensions, height, inverseX, inverseY, padX, padY, rangeX, rangeY, spanX, spanY, width;
    dimensions = this.props.axes;
    width = this.props.width;
    height = this.props.height;
    centeredX = this.props.centeredX;
    centeredY = this.props.centeredY;
    padX = this.props.paddingX;
    padY = this.props.paddingY;
    rangeX = this._helpers.span.get('x.', dimensions[0]);
    rangeY = this._helpers.span.get('y.', dimensions[1]);
    this.aX = rangeX.x;
    this.aY = rangeY.x;
    spanX = rangeX.y - rangeX.x;
    spanY = rangeY.y - rangeY.x;
    width += padX * 2;
    height += padY * 2;
    if (centeredX) {
      inverseX = 1 / Math.max(1, width);
      this.aX += spanX * inverseX / 2;
    } else {
      inverseX = 1 / Math.max(1, width - 1);
    }
    if (centeredY) {
      inverseY = 1 / Math.max(1, height);
      this.aY += spanY * inverseY / 2;
    } else {
      inverseY = 1 / Math.max(1, height - 1);
    }
    this.bX = spanX * inverseX;
    this.bY = spanY * inverseY;
    this.aX += padX * this.bX;
    return this.aY += padY * this.bY;
  };

  Area.prototype.callback = function(callback) {
    this.updateSpan();
    if (this.last === callback) {
      return this._callback;
    }
    this.last = callback;
    if (callback.length <= 5) {
      return this._callback = (function(_this) {
        return function(emit, i, j) {
          var x, y;
          x = _this.aX + _this.bX * i;
          y = _this.aY + _this.bY * j;
          return callback(emit, x, y, i, j);
        };
      })(this);
    } else {
      return this._callback = (function(_this) {
        return function(emit, i, j) {
          var x, y;
          x = _this.aX + _this.bX * i;
          y = _this.aY + _this.bY * j;
          return callback(emit, x, y, i, j, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Area.prototype.make = function() {
    Area.__super__.make.apply(this, arguments);
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateSpan);
  };

  Area.prototype.unmake = function() {
    Area.__super__.unmake.apply(this, arguments);
    return this._helpers.span.unmake();
  };

  return Area;

})(Matrix);

module.exports = Area;


},{"../../../util":172,"./matrix":58}],54:[function(require,module,exports){
var Array_, Buffer, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Buffer = require('./buffer');

Util = require('../../../util');

Array_ = (function(_super) {
  __extends(Array_, _super);

  function Array_() {
    return Array_.__super__.constructor.apply(this, arguments);
  }

  Array_.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'array', 'texture', 'raw'];

  Array_.prototype.init = function() {
    this.buffer = this.spec = null;
    this.space = {
      length: 0,
      history: 0
    };
    this.used = {
      length: 0
    };
    this.storage = 'arrayBuffer';
    this.passthrough = function(emit, x) {
      return emit(x, 0, 0, 0);
    };
    return Array_.__super__.init.apply(this, arguments);
  };

  Array_.prototype.sourceShader = function(shader) {
    return this.buffer.shader(shader);
  };

  Array_.prototype.getDimensions = function() {
    return {
      items: this.items,
      width: this.space.length,
      height: this.space.history,
      depth: 1
    };
  };

  Array_.prototype.getActiveDimensions = function() {
    return {
      items: this.items,
      width: this.used.length,
      height: this.buffer.getFilled(),
      depth: 1
    };
  };

  Array_.prototype.getFutureDimensions = function() {
    return {
      items: this.items,
      width: this.used.length,
      height: this.space.history,
      depth: 1
    };
  };

  Array_.prototype.getRawDimensions = function() {
    return {
      items: this.items,
      width: space.length,
      height: 1,
      depth: 1
    };
  };

  Array_.prototype.make = function() {
    var channels, data, dims, history, items, length, magFilter, minFilter, reserve, space, type, _base, _ref, _ref1, _ref2;
    Array_.__super__.make.apply(this, arguments);
    minFilter = (_ref = this.minFilter) != null ? _ref : this.props.minFilter;
    magFilter = (_ref1 = this.magFilter) != null ? _ref1 : this.props.magFilter;
    type = (_ref2 = this.type) != null ? _ref2 : this.props.type;
    length = this.props.length;
    history = this.props.history;
    reserve = this.props.bufferLength;
    channels = this.props.channels;
    items = this.props.items;
    dims = this.spec = {
      channels: channels,
      items: items,
      width: length
    };
    this.items = dims.items;
    this.channels = dims.channels;
    data = this.props.data;
    dims = Util.Data.getDimensions(data, dims);
    space = this.space;
    space.length = Math.max(reserve, dims.width || 1);
    space.history = history;
    if ((_base = this.spec).width == null) {
      _base.width = 1;
    }
    return this.buffer = this._renderables.make(this.storage, {
      length: space.length,
      history: space.history,
      channels: channels,
      items: items,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
  };

  Array_.prototype.unmake = function() {
    Array_.__super__.unmake.apply(this, arguments);
    if (this.buffer) {
      this.buffer.dispose();
      return this.buffer = this.spec = null;
    }
  };

  Array_.prototype.change = function(changed, touched, init) {
    var length;
    if (touched['texture'] || changed['history.history'] || changed['buffer.channels'] || changed['buffer.items'] || changed['array.bufferLength']) {
      return this.rebuild();
    }
    if (!this.buffer) {
      return;
    }
    if (changed['array.length']) {
      length = this.props.length;
      if (length > this.space.length) {
        return this.rebuild();
      }
    }
    if (changed['data.map'] || changed['data.data'] || changed['data.resolve'] || changed['data.expr'] || init) {
      return this.buffer.setCallback(this.emitter());
    }
  };

  Array_.prototype.callback = function(callback) {
    if (callback.length <= 2) {
      return callback;
    } else {
      return (function(_this) {
        return function(emit, i) {
          return callback(emit, i, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Array_.prototype.update = function() {
    var data, filled, l, space, used;
    if (!this.buffer) {
      return;
    }
    data = this.props.data;
    space = this.space, used = this.used;
    l = used.length;
    filled = this.buffer.getFilled();
    this.syncBuffer((function(_this) {
      return function(abort) {
        var dims, length, _base;
        if (data != null) {
          dims = Util.Data.getDimensions(data, _this.spec);
          if (dims.width > space.length) {
            abort();
            return _this.rebuild();
          }
          used.length = dims.width;
          _this.buffer.setActive(used.length);
          if (typeof (_base = _this.buffer.callback).rebind === "function") {
            _base.rebind(data);
          }
          return _this.buffer.update();
        } else {
          _this.buffer.setActive(_this.spec.width);
          length = _this.buffer.update();
          return used.length = length;
        }
      };
    })(this));
    if (used.length !== l || filled !== this.buffer.getFilled()) {
      return this.trigger({
        type: 'source.resize'
      });
    }
  };

  return Array_;

})(Buffer);

module.exports = Array_;


},{"../../../util":172,"./buffer":55}],55:[function(require,module,exports){
var Buffer, Data, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Data = require('./data');

Util = require('../../../util');

Buffer = (function(_super) {
  __extends(Buffer, _super);

  function Buffer() {
    return Buffer.__super__.constructor.apply(this, arguments);
  }

  Buffer.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'texture'];

  Buffer.prototype.init = function() {
    this.bufferSlack = 0;
    this.bufferFrames = 0;
    this.bufferTime = 0;
    this.bufferDelta = 0;
    this.bufferClock = 0;
    this.bufferStep = 0;
    return Buffer.__super__.init.apply(this, arguments);
  };

  Buffer.prototype.make = function() {
    Buffer.__super__.make.apply(this, arguments);
    return this.clockParent = this._inherit('clock');
  };

  Buffer.prototype.unmake = function() {
    return Buffer.__super__.unmake.apply(this, arguments);
  };

  Buffer.prototype.rawBuffer = function() {
    return this.buffer;
  };

  Buffer.prototype.emitter = function() {
    var channels, items, _ref;
    _ref = this.props, channels = _ref.channels, items = _ref.items;
    return Buffer.__super__.emitter.call(this, channels, items);
  };

  Buffer.prototype.change = function(changed, touched, init) {
    var fps;
    if (changed['buffer.fps'] || init) {
      fps = this.props.fps;
      return this.bufferSlack = fps ? .5 / fps : 0;
    }
  };

  Buffer.prototype.syncBuffer = function(callback) {
    var abort, delta, filled, fps, frame, frames, hurry, i, limit, live, observe, realtime, slack, speed, step, stop, time, _i, _ref, _results;
    if (!this.buffer) {
      return;
    }
    _ref = this.props, live = _ref.live, fps = _ref.fps, hurry = _ref.hurry, limit = _ref.limit, realtime = _ref.realtime, observe = _ref.observe;
    filled = this.buffer.getFilled();
    if (!(!filled || live)) {
      return;
    }
    time = this.clockParent.getTime();
    if (fps != null) {
      slack = this.bufferSlack;
      speed = time.step / time.delta;
      delta = realtime ? time.delta : time.step;
      frame = 1 / fps;
      step = realtime && observe ? speed * frame : frame;
      this.bufferSlack = Math.min(limit / fps, slack + delta);
      this.bufferDelta = delta;
      this.bufferStep = step;
      frames = Math.min(hurry, Math.floor(slack * fps));
      if (!filled) {
        frames = Math.max(1, frames);
      }
      stop = false;
      abort = function() {
        return stop = true;
      };
      _results = [];
      for (i = _i = 0; 0 <= frames ? _i < frames : _i > frames; i = 0 <= frames ? ++_i : --_i) {
        this.bufferTime += delta;
        this.bufferClock += step;
        if (stop) {
          break;
        }
        callback(abort, this.bufferFrames++, i, frames);
        _results.push(this.bufferSlack -= frame);
      }
      return _results;
    } else {
      this.bufferTime = time.time;
      this.bufferDelta = time.delta;
      this.bufferClock = time.clock;
      this.bufferStep = time.step;
      return callback((function() {}), this.bufferFrames++, 0, 1);
    }
  };

  return Buffer;

})(Data);

module.exports = Buffer;


},{"../../../util":172,"./data":56}],56:[function(require,module,exports){
var Data, Source, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Source = require('../base/source');

Util = require('../../../util');

Data = (function(_super) {
  __extends(Data, _super);

  function Data() {
    return Data.__super__.constructor.apply(this, arguments);
  }

  Data.traits = ['node', 'data', 'source', 'index', 'entity', 'active'];

  Data.prototype.init = function() {
    this.dataEmitter = null;
    return this.dataSizes = null;
  };

  Data.prototype.emitter = function(channels, items) {
    var bind, data, emitter, expr, last, resolve, sizes, thunk;
    data = this.props.data;
    bind = this.props.bind;
    expr = this.props.expr;
    if (data != null) {
      last = this.dataSizes;
      sizes = Util.Data.getSizes(data);
      if (!last || last.length !== sizes.length) {
        thunk = Util.Data.getThunk(data);
        this.dataEmitter = this.callback(Util.Data.makeEmitter(thunk, items, channels));
        this.dataSizes = sizes;
      }
      emitter = this.dataEmitter;
    } else if (typeof resolve !== "undefined" && resolve !== null) {
      resolve = this._inherit('resolve');
      emitter = this.callback(resolve.callback(bind));
    } else if (expr != null) {
      emitter = this.callback(expr);
    } else {
      emitter = this.callback(this.passthrough);
    }
    return emitter;
  };

  Data.prototype.callback = function(callback) {
    return callback != null ? callback : function() {};
  };

  Data.prototype.update = function() {};

  Data.prototype.make = function() {
    this._helpers.active.make();
    this.first = true;
    return this._listen('root', 'root.update', (function(_this) {
      return function() {
        if (_this.isActive || _this.first) {
          _this.update();
        }
        return _this.first = false;
      };
    })(this));
  };

  Data.prototype.unmake = function() {
    this._helpers.active.unmake();
    this.dataEmitter = null;
    return this.dataSizes = null;
  };

  return Data;

})(Source);

module.exports = Data;


},{"../../../util":172,"../base/source":49}],57:[function(require,module,exports){
var Interval, Util, _Array,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_Array = require('./array');

Util = require('../../../util');

Interval = (function(_super) {
  __extends(Interval, _super);

  function Interval() {
    return Interval.__super__.constructor.apply(this, arguments);
  }

  Interval.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'texture', 'array', 'span', 'interval', 'sampler', 'raw'];

  Interval.prototype.updateSpan = function() {
    var centered, dimension, inverse, length, pad, range, span;
    dimension = this.props.axis;
    length = this.props.length;
    centered = this.props.centered;
    pad = this.props.padding;
    range = this._helpers.span.get('', dimension);
    length += pad * 2;
    this.a = range.x;
    span = range.y - range.x;
    if (centered) {
      inverse = 1 / Math.max(1, length);
      this.a += span * inverse / 2;
    } else {
      inverse = 1 / Math.max(1, length - 1);
    }
    this.b = span * inverse;
    return this.a += pad * this.b;
  };

  Interval.prototype.callback = function(callback) {
    this.updateSpan();
    if (this.last === callback) {
      return this._callback;
    }
    this.last = callback;
    if (callback.length <= 3) {
      return this._callback = (function(_this) {
        return function(emit, i) {
          var x;
          x = _this.a + _this.b * i;
          return callback(emit, x, i);
        };
      })(this);
    } else {
      return this._callback = (function(_this) {
        return function(emit, i) {
          var x;
          x = _this.a + _this.b * i;
          return callback(emit, x, i, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Interval.prototype.make = function() {
    Interval.__super__.make.apply(this, arguments);
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateSpan);
  };

  Interval.prototype.unmake = function() {
    Interval.__super__.unmake.apply(this, arguments);
    return this._helpers.span.unmake();
  };

  return Interval;

})(_Array);

module.exports = Interval;


},{"../../../util":172,"./array":54}],58:[function(require,module,exports){
var Buffer, Matrix, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Buffer = require('./buffer');

Util = require('../../../util');

Matrix = (function(_super) {
  __extends(Matrix, _super);

  function Matrix() {
    return Matrix.__super__.constructor.apply(this, arguments);
  }

  Matrix.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'texture', 'matrix', 'raw'];

  Matrix.prototype.init = function() {
    this.buffer = this.spec = null;
    this.space = {
      width: 0,
      height: 0,
      history: 0
    };
    this.used = {
      width: 0,
      height: 0
    };
    this.storage = 'matrixBuffer';
    this.passthrough = function(emit, x, y) {
      return emit(x, y, 0, 0);
    };
    return Matrix.__super__.init.apply(this, arguments);
  };

  Matrix.prototype.sourceShader = function(shader) {
    return this.buffer.shader(shader);
  };

  Matrix.prototype.getDimensions = function() {
    return {
      items: this.items,
      width: this.space.width,
      height: this.space.height,
      depth: this.space.history
    };
  };

  Matrix.prototype.getActiveDimensions = function() {
    return {
      items: this.items,
      width: this.used.width,
      height: this.used.height,
      depth: this.buffer.getFilled()
    };
  };

  Matrix.prototype.getFutureDimensions = function() {
    return {
      items: this.items,
      width: this.used.width,
      height: this.used.height,
      depth: this.space.history
    };
  };

  Matrix.prototype.getRawDimensions = function() {
    return {
      items: this.items,
      width: this.space.width,
      height: this.space.height,
      depth: 1
    };
  };

  Matrix.prototype.make = function() {
    var channels, data, dims, height, history, items, magFilter, minFilter, reserveX, reserveY, space, type, width, _base, _base1, _ref, _ref1, _ref2;
    Matrix.__super__.make.apply(this, arguments);
    minFilter = (_ref = this.minFilter) != null ? _ref : this.props.minFilter;
    magFilter = (_ref1 = this.magFilter) != null ? _ref1 : this.props.magFilter;
    type = (_ref2 = this.type) != null ? _ref2 : this.props.type;
    width = this.props.width;
    height = this.props.height;
    history = this.props.history;
    reserveX = this.props.bufferWidth;
    reserveY = this.props.bufferHeight;
    channels = this.props.channels;
    items = this.props.items;
    dims = this.spec = {
      channels: channels,
      items: items,
      width: width,
      height: height
    };
    this.items = dims.items;
    this.channels = dims.channels;
    data = this.props.data;
    dims = Util.Data.getDimensions(data, dims);
    space = this.space;
    space.width = Math.max(reserveX, dims.width || 1);
    space.height = Math.max(reserveY, dims.height || 1);
    space.history = history;
    if ((_base = this.spec).width == null) {
      _base.width = 1;
    }
    if ((_base1 = this.spec).height == null) {
      _base1.height = 1;
    }
    return this.buffer = this._renderables.make(this.storage, {
      width: space.width,
      height: space.height,
      history: space.history,
      channels: channels,
      items: items,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
  };

  Matrix.prototype.unmake = function() {
    Matrix.__super__.unmake.apply(this, arguments);
    if (this.buffer) {
      this.buffer.dispose();
      return this.buffer = this.spec = null;
    }
  };

  Matrix.prototype.change = function(changed, touched, init) {
    var height, width;
    if (touched['texture'] || changed['matrix.history'] || changed['buffer.channels'] || changed['buffer.items'] || changed['matrix.bufferWidth'] || changed['matrix.bufferHeight']) {
      return this.rebuild();
    }
    if (!this.buffer) {
      return;
    }
    if (changed['matrix.width']) {
      width = this.props.width;
      if (width > this.space.width) {
        return this.rebuild();
      }
    }
    if (changed['matrix.height']) {
      height = this.props.height;
      if (height > this.space.height) {
        return this.rebuild();
      }
    }
    if (changed['data.map'] || changed['data.data'] || changed['data.resolve'] || changed['data.expr'] || init) {
      return this.buffer.setCallback(this.emitter());
    }
  };

  Matrix.prototype.callback = function(callback) {
    if (callback.length <= 3) {
      return callback;
    } else {
      return (function(_this) {
        return function(emit, i, j) {
          return callback(emit, i, j, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Matrix.prototype.update = function() {
    var data, filled, h, space, used, w;
    if (!this.buffer) {
      return;
    }
    data = this.props.data;
    space = this.space, used = this.used;
    w = used.width;
    h = used.height;
    filled = this.buffer.getFilled();
    this.syncBuffer((function(_this) {
      return function(abort) {
        var dims, length, _base, _w;
        if (data != null) {
          dims = Util.Data.getDimensions(data, _this.spec);
          if (dims.width > space.width || dims.height > space.height) {
            abort();
            return _this.rebuild();
          }
          used.width = dims.width;
          used.height = dims.height;
          _this.buffer.setActive(used.width, used.height);
          if (typeof (_base = _this.buffer.callback).rebind === "function") {
            _base.rebind(data);
          }
          return _this.buffer.update();
        } else {
          _this.buffer.setActive(_this.spec.width, _this.spec.height);
          length = _this.buffer.update();
          used.width = _w = _this.spec.width;
          used.height = Math.ceil(length / _w);
          if (used.height === 1) {
            return used.width = length;
          }
        }
      };
    })(this));
    if (used.width !== w || used.height !== h || filled !== this.buffer.getFilled()) {
      return this.trigger({
        type: 'source.resize'
      });
    }
  };

  return Matrix;

})(Buffer);

module.exports = Matrix;


},{"../../../util":172,"./buffer":55}],59:[function(require,module,exports){
var Scale, Source, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Source = require('../base/source');

Util = require('../../../util');

Scale = (function(_super) {
  __extends(Scale, _super);

  function Scale() {
    return Scale.__super__.constructor.apply(this, arguments);
  }

  Scale.traits = ['node', 'source', 'index', 'interval', 'span', 'scale', 'raw', 'origin'];

  Scale.prototype.init = function() {
    return this.used = this.space = this.scaleAxis = this.sampler = null;
  };

  Scale.prototype.rawBuffer = function() {
    return this.buffer;
  };

  Scale.prototype.sourceShader = function(shader) {
    return shader.pipe(this.sampler);
  };

  Scale.prototype.getDimensions = function() {
    return {
      items: 1,
      width: this.space,
      height: 1,
      depth: 1
    };
  };

  Scale.prototype.getActiveDimensions = function() {
    return {
      items: 1,
      width: this.used,
      height: this.buffer.getFilled(),
      depth: 1
    };
  };

  Scale.prototype.getRawDimensions = function() {
    return this.getDimensions();
  };

  Scale.prototype.make = function() {
    var p, positionUniforms, samples;
    this.space = samples = this._helpers.scale.divide('');
    this.buffer = this._renderables.make('dataBuffer', {
      width: samples,
      channels: 1,
      items: 1
    });
    positionUniforms = {
      scaleAxis: this._attributes.make(this._types.vec4()),
      scaleOffset: this._attributes.make(this._types.vec4())
    };
    this.scaleAxis = positionUniforms.scaleAxis.value;
    this.scaleOffset = positionUniforms.scaleOffset.value;
    p = this.sampler = this._shaders.shader();
    p.require(this.buffer.shader(this._shaders.shader(), 1));
    p.pipe('scale.position', positionUniforms);
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateRanges);
  };

  Scale.prototype.unmake = function() {
    this.scaleAxis = null;
    return this._helpers.span.unmake();
  };

  Scale.prototype.change = function(changed, touched, init) {
    if (changed['scale.divide']) {
      return this.rebuild();
    }
    if (touched['view'] || touched['interval'] || touched['span'] || touched['scale'] || init) {
      return this.updateRanges();
    }
  };

  Scale.prototype.updateRanges = function() {
    var axis, max, min, origin, range, ticks, used, _ref;
    used = this.used;
    _ref = this.props, axis = _ref.axis, origin = _ref.origin;
    range = this._helpers.span.get('', axis);
    min = range.x;
    max = range.y;
    ticks = this._helpers.scale.generate('', this.buffer, min, max);
    Util.Axis.setDimension(this.scaleAxis, axis);
    Util.Axis.setOrigin(this.scaleOffset, axis, origin);
    this.used = ticks.length;
    if (this.used !== used) {
      return this.trigger({
        type: 'source.resize'
      });
    }
  };

  return Scale;

})(Source);

module.exports = Scale;


},{"../../../util":172,"../base/source":49}],60:[function(require,module,exports){
var Util, Volume, Voxel,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Voxel = require('./voxel');

Util = require('../../../util');

Volume = (function(_super) {
  __extends(Volume, _super);

  function Volume() {
    return Volume.__super__.constructor.apply(this, arguments);
  }

  Volume.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'texture', 'voxel', 'span:x', 'span:y', 'span:z', 'volume', 'sampler:x', 'sampler:y', 'sampler:z', 'raw'];

  Volume.prototype.updateSpan = function() {
    var centeredX, centeredY, centeredZ, depth, dimensions, height, inverseX, inverseY, inverseZ, padX, padY, padZ, rangeX, rangeY, rangeZ, spanX, spanY, spanZ, width;
    dimensions = this.props.axes;
    width = this.props.width;
    height = this.props.height;
    depth = this.props.depth;
    centeredX = this.props.centeredX;
    centeredY = this.props.centeredY;
    centeredZ = this.props.centeredZ;
    padX = this.props.paddingX;
    padY = this.props.paddingY;
    padZ = this.props.paddingZ;
    rangeX = this._helpers.span.get('x.', dimensions[0]);
    rangeY = this._helpers.span.get('y.', dimensions[1]);
    rangeZ = this._helpers.span.get('z.', dimensions[2]);
    this.aX = rangeX.x;
    this.aY = rangeY.x;
    this.aZ = rangeZ.x;
    spanX = rangeX.y - rangeX.x;
    spanY = rangeY.y - rangeY.x;
    spanZ = rangeZ.y - rangeZ.x;
    width += padX * 2;
    height += padY * 2;
    depth += padZ * 2;
    if (centeredX) {
      inverseX = 1 / Math.max(1, width);
      this.aX += spanX * inverseX / 2;
    } else {
      inverseX = 1 / Math.max(1, width - 1);
    }
    if (centeredY) {
      inverseY = 1 / Math.max(1, height);
      this.aY += spanY * inverseY / 2;
    } else {
      inverseY = 1 / Math.max(1, height - 1);
    }
    if (centeredZ) {
      inverseZ = 1 / Math.max(1, depth);
      this.aZ += spanZ * inverseZ / 2;
    } else {
      inverseZ = 1 / Math.max(1, depth - 1);
    }
    this.bX = spanX * inverseX;
    this.bY = spanY * inverseY;
    this.bZ = spanZ * inverseZ;
    this.aX += this.bX * padX;
    this.aY += this.bY * padY;
    return this.aZ += this.bZ * padY;
  };

  Volume.prototype.callback = function(callback) {
    this.updateSpan();
    if (this.last === callback) {
      return this._callback;
    }
    this.last = callback;
    if (callback.length <= 7) {
      return this._callback = (function(_this) {
        return function(emit, i, j, k) {
          var x, y, z;
          x = _this.aX + _this.bX * i;
          y = _this.aY + _this.bY * j;
          z = _this.aZ + _this.bZ * k;
          return callback(emit, x, y, z, i, j, k);
        };
      })(this);
    } else {
      return this._callback = (function(_this) {
        return function(emit, i, j, k) {
          var x, y, z;
          x = _this.aX + _this.bX * i;
          y = _this.aY + _this.bY * j;
          z = _this.aZ + _this.bZ * k;
          return callback(emit, x, y, z, i, j, k, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Volume.prototype.make = function() {
    Volume.__super__.make.apply(this, arguments);
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateSpan);
  };

  Volume.prototype.unmake = function() {
    Volume.__super__.unmake.apply(this, arguments);
    return this._helpers.span.unmake();
  };

  return Volume;

})(Voxel);

module.exports = Volume;


},{"../../../util":172,"./voxel":61}],61:[function(require,module,exports){
var Buffer, Util, Voxel,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Buffer = require('./buffer');

Util = require('../../../util');

Voxel = (function(_super) {
  __extends(Voxel, _super);

  function Voxel() {
    this.update = __bind(this.update, this);
    return Voxel.__super__.constructor.apply(this, arguments);
  }

  Voxel.traits = ['node', 'buffer', 'active', 'data', 'source', 'index', 'texture', 'voxel', 'raw'];

  Voxel.prototype.init = function() {
    this.buffer = this.spec = null;
    this.space = {
      width: 0,
      height: 0,
      depth: 0
    };
    this.used = {
      width: 0,
      height: 0,
      depth: 0
    };
    this.storage = 'voxelBuffer';
    this.passthrough = function(emit, x, y, z) {
      return emit(x, y, z, 0);
    };
    return Voxel.__super__.init.apply(this, arguments);
  };

  Voxel.prototype.sourceShader = function(shader) {
    return this.buffer.shader(shader);
  };

  Voxel.prototype.getDimensions = function() {
    return {
      items: this.items,
      width: this.space.width,
      height: this.space.height,
      depth: this.space.depth
    };
  };

  Voxel.prototype.getActiveDimensions = function() {
    return {
      items: this.items,
      width: this.used.width,
      height: this.used.height,
      depth: this.used.depth * this.buffer.getFilled()
    };
  };

  Voxel.prototype.getRawDimensions = function() {
    return this.getDimensions();
  };

  Voxel.prototype.make = function() {
    var channels, data, depth, dims, height, items, magFilter, minFilter, reserveX, reserveY, reserveZ, space, type, width, _base, _base1, _base2, _ref, _ref1, _ref2;
    Voxel.__super__.make.apply(this, arguments);
    minFilter = (_ref = this.minFilter) != null ? _ref : this.props.minFilter;
    magFilter = (_ref1 = this.magFilter) != null ? _ref1 : this.props.magFilter;
    type = (_ref2 = this.type) != null ? _ref2 : this.props.type;
    width = this.props.width;
    height = this.props.height;
    depth = this.props.depth;
    reserveX = this.props.bufferWidth;
    reserveY = this.props.bufferHeight;
    reserveZ = this.props.bufferDepth;
    channels = this.props.channels;
    items = this.props.items;
    dims = this.spec = {
      channels: channels,
      items: items,
      width: width,
      height: height,
      depth: depth
    };
    this.items = dims.items;
    this.channels = dims.channels;
    data = this.props.data;
    dims = Util.Data.getDimensions(data, dims);
    space = this.space;
    space.width = Math.max(reserveX, dims.width || 1);
    space.height = Math.max(reserveY, dims.height || 1);
    space.depth = Math.max(reserveZ, dims.depth || 1);
    if ((_base = this.spec).width == null) {
      _base.width = 1;
    }
    if ((_base1 = this.spec).height == null) {
      _base1.height = 1;
    }
    if ((_base2 = this.spec).depth == null) {
      _base2.depth = 1;
    }
    return this.buffer = this._renderables.make(this.storage, {
      width: space.width,
      height: space.height,
      depth: space.depth,
      channels: channels,
      items: items,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
  };

  Voxel.prototype.unmake = function() {
    Voxel.__super__.unmake.apply(this, arguments);
    if (this.buffer) {
      this.buffer.dispose();
      return this.buffer = this.spec = null;
    }
  };

  Voxel.prototype.change = function(changed, touched, init) {
    var depth, height, width;
    if (touched['texture'] || changed['buffer.channels'] || changed['buffer.items'] || changed['voxel.bufferWidth'] || changed['voxel.bufferHeight'] || changed['voxel.bufferDepth']) {
      return this.rebuild();
    }
    if (!this.buffer) {
      return;
    }
    if (changed['voxel.width']) {
      width = this.props.width;
      if (width > this.space.width) {
        return this.rebuild();
      }
    }
    if (changed['voxel.height']) {
      height = this.props.height;
      if (height > this.space.height) {
        return this.rebuild();
      }
    }
    if (changed['voxel.depth']) {
      depth = this.props.depth;
      if (depth > this.space.depth) {
        return this.rebuild();
      }
    }
    if (changed['data.map'] || changed['data.data'] || changed['data.resolve'] || changed['data.expr'] || init) {
      return this.buffer.setCallback(this.emitter());
    }
  };

  Voxel.prototype.callback = function(callback) {
    if (callback.length <= 4) {
      return callback;
    } else {
      return (function(_this) {
        return function(emit, i, j, k) {
          return callback(emit, i, j, k, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  Voxel.prototype.update = function() {
    var d, data, filled, h, space, used, w;
    if (!this.buffer) {
      return;
    }
    data = this.props.data;
    space = this.space, used = this.used;
    w = used.width;
    h = used.height;
    d = used.depth;
    filled = this.buffer.getFilled();
    this.syncBuffer((function(_this) {
      return function(abort) {
        var dims, length, _base, _h, _w;
        if (data != null) {
          dims = Util.Data.getDimensions(data, _this.spec);
          if (dims.width > space.width || dims.height > space.height || dims.depth > space.depth) {
            abort();
            return _this.rebuild();
          }
          used.width = dims.width;
          used.height = dims.height;
          used.depth = dims.depth;
          _this.buffer.setActive(used.width, used.height, used.depth);
          if (typeof (_base = _this.buffer.callback).rebind === "function") {
            _base.rebind(data);
          }
          return _this.buffer.update();
        } else {
          _this.buffer.setActive(_this.spec.width, _this.spec.height, _this.spec.depth);
          length = _this.buffer.update();
          used.width = _w = _this.spec.width;
          used.height = _h = _this.spec.height;
          used.depth = Math.ceil(length / _w / _h);
          if (used.depth === 1) {
            used.height = Math.ceil(length / _w);
            if (used.height === 1) {
              return used.width = length;
            }
          }
        }
      };
    })(this));
    if (used.width !== w || used.height !== h || used.depth !== d || filled !== this.buffer.getFilled()) {
      return this.trigger({
        type: 'source.resize'
      });
    }
  };

  return Voxel;

})(Buffer);

module.exports = Voxel;


},{"../../../util":172,"./buffer":55}],62:[function(require,module,exports){
var Axis, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Axis = (function(_super) {
  __extends(Axis, _super);

  Axis.traits = ['node', 'object', 'visible', 'style', 'line', 'axis', 'span', 'interval', 'arrow', 'position', 'origin'];

  Axis.defaults = {
    end: true,
    zBias: -1,
    zOrder: -1
  };

  function Axis(node, context, helpers) {
    Axis.__super__.constructor.call(this, node, context, helpers);
    this.axisPosition = this.axisStep = this.resolution = this.line = this.arrows = null;
  }

  Axis.prototype.make = function() {
    var arrowUniforms, axis, crossed, detail, end, lineUniforms, mask, position, positionUniforms, samples, start, stroke, styleUniforms, swizzle, uniforms, unitUniforms, _ref, _ref1;
    positionUniforms = {
      axisPosition: this._attributes.make(this._types.vec4()),
      axisStep: this._attributes.make(this._types.vec4())
    };
    this.axisPosition = positionUniforms.axisPosition.value;
    this.axisStep = positionUniforms.axisStep.value;
    position = this._shaders.shader();
    position.pipe('axis.position', positionUniforms);
    position = this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    arrowUniforms = this._helpers.arrow.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    detail = this.props.detail;
    samples = detail + 1;
    this.resolution = 1 / detail;
    _ref = this.props, start = _ref.start, end = _ref.end;
    stroke = this.props.stroke;
    mask = this._helpers.object.mask();
    _ref1 = this.props, crossed = _ref1.crossed, axis = _ref1.axis;
    if (!crossed && (mask != null) && axis > 1) {
      swizzle = ['x000', 'y000', 'z000', 'w000'][axis];
      mask = this._helpers.position.swizzle(mask, swizzle);
    }
    uniforms = Util.JS.merge(arrowUniforms, lineUniforms, styleUniforms, unitUniforms);
    this.line = this._renderables.make('line', {
      uniforms: uniforms,
      samples: samples,
      position: position,
      clip: start || end,
      stroke: stroke,
      mask: mask
    });
    this.arrows = [];
    if (start) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        flip: true,
        samples: samples,
        position: position,
        mask: mask
      }));
    }
    if (end) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        samples: samples,
        position: position,
        mask: mask
      }));
    }
    this._helpers.visible.make();
    this._helpers.object.make(this.arrows.concat([this.line]));
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateRanges);
  };

  Axis.prototype.unmake = function() {
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this._helpers.span.unmake();
  };

  Axis.prototype.change = function(changed, touched, init) {
    if (changed['axis.detail'] || changed['line.stroke'] || changed['axis.crossed'] || (changed['interval.axis'] && this.props.crossed)) {
      return this.rebuild();
    }
    if (touched['interval'] || touched['span'] || touched['view'] || init) {
      return this.updateRanges();
    }
  };

  Axis.prototype.updateRanges = function() {
    var axis, max, min, origin, range, _ref;
    _ref = this.props, axis = _ref.axis, origin = _ref.origin;
    range = this._helpers.span.get('', axis);
    min = range.x;
    max = range.y;
    Util.Axis.setDimension(this.axisPosition, axis).multiplyScalar(min);
    Util.Axis.setDimension(this.axisStep, axis).multiplyScalar((max - min) * this.resolution);
    return Util.Axis.addOrigin(this.axisPosition, axis, origin);
  };

  return Axis;

})(Primitive);

module.exports = Axis;


},{"../../../util":172,"../../primitive":44}],63:[function(require,module,exports){
var Face, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Face = (function(_super) {
  __extends(Face, _super);

  Face.traits = ['node', 'object', 'visible', 'style', 'line', 'mesh', 'face', 'geometry', 'position', 'bind', 'shade'];

  function Face(node, context, helpers) {
    Face.__super__.constructor.call(this, node, context, helpers);
    this.face = null;
  }

  Face.prototype.resize = function() {
    var depth, dims, height, items, map, width;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    if (this.face) {
      this.face.geometry.clip(width, height, depth, items);
    }
    if (this.line) {
      this.line.geometry.clip(items, width, height, depth);
    }
    if (this.bind.map != null) {
      map = this.bind.map.getActiveDimensions();
      if (this.face) {
        return this.face.geometry.map(map.width, map.height, map.depth, map.items);
      }
    }
  };

  Face.prototype.make = function() {
    var color, depth, dims, fill, height, items, line, lineUniforms, map, mask, material, objects, position, shaded, styleUniforms, swizzle, uniforms, unitUniforms, width, wireUniforms, _ref;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }, {
        to: 'mesh.map',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this.bind.points.sourceShader(this._shaders.shader());
    position = this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    wireUniforms = {};
    wireUniforms.styleZBias = this._attributes.make(this._types.number());
    this.wireZBias = wireUniforms.styleZBias;
    dims = this.bind.points.getDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    line = this.props.line;
    shaded = this.props.shaded;
    fill = this.props.fill;
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    map = this._helpers.shade.map((_ref = this.bind.map) != null ? _ref.sourceShader(this._shaders.shader()) : void 0);
    material = this._helpers.shade.pipeline() || shaded;
    objects = [];
    if (line) {
      swizzle = this._shaders.shader();
      swizzle.pipe(Util.GLSL.swizzleVec4('yzwx'));
      swizzle.pipe(position);
      uniforms = Util.JS.merge(unitUniforms, lineUniforms, styleUniforms, wireUniforms);
      this.line = this._renderables.make('line', {
        uniforms: uniforms,
        samples: items,
        strips: width,
        ribbons: height,
        layers: depth,
        position: swizzle,
        color: color,
        mask: mask,
        closed: true
      });
      objects.push(this.line);
    }
    if (fill) {
      uniforms = Util.JS.merge(unitUniforms, styleUniforms, {});
      this.face = this._renderables.make('face', {
        uniforms: uniforms,
        width: width,
        height: height,
        depth: depth,
        items: items,
        position: position,
        color: color,
        material: material,
        mask: mask,
        map: map
      });
      objects.push(this.face);
    }
    this._helpers.visible.make();
    return this._helpers.object.make(objects);
  };

  Face.prototype.made = function() {
    return this.resize();
  };

  Face.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.face = this.line = null;
  };

  Face.prototype.change = function(changed, touched, init) {
    var fill, zBias, _ref;
    if (changed['geometry.points'] || touched['mesh']) {
      return this.rebuild();
    }
    if (changed['style.zBias'] || init) {
      _ref = this.props, fill = _ref.fill, zBias = _ref.zBias;
      return this.wireZBias.value = zBias + (fill ? 5 : 0);
    }
  };

  return Face;

})(Primitive);

module.exports = Face;


},{"../../../util":172,"../../primitive":44}],64:[function(require,module,exports){
var Grid, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Grid = (function(_super) {
  __extends(Grid, _super);

  Grid.traits = ['node', 'object', 'visible', 'style', 'line', 'grid', 'area', 'position', 'origin', 'axis:x', 'axis:y', 'scale:x', 'scale:y', 'span:x', 'span:y'];

  Grid.defaults = {
    width: 1,
    zBias: -2,
    zOrder: -2
  };

  function Grid(node, context, helpers) {
    Grid.__super__.constructor.call(this, node, context, helpers);
    this.axes = null;
  }

  Grid.prototype.make = function() {
    var axes, axis, crossed, lineX, lineY, lines, mask, stroke, transpose, _ref;
    mask = this._helpers.object.mask();
    axis = (function(_this) {
      return function(first, second, transpose) {
        var buffer, detail, line, lineUniforms, p, position, positionUniforms, resolution, samples, strips, styleUniforms, uniforms, unitUniforms, values;
        detail = _this._get(first + 'axis.detail');
        samples = detail + 1;
        resolution = 1 / detail;
        strips = _this._helpers.scale.divide(second);
        buffer = _this._renderables.make('dataBuffer', {
          width: strips,
          channels: 1
        });
        positionUniforms = {
          gridPosition: _this._attributes.make(_this._types.vec4()),
          gridStep: _this._attributes.make(_this._types.vec4()),
          gridAxis: _this._attributes.make(_this._types.vec4())
        };
        values = {
          gridPosition: positionUniforms.gridPosition.value,
          gridStep: positionUniforms.gridStep.value,
          gridAxis: positionUniforms.gridAxis.value
        };
        p = position = _this._shaders.shader();
        if ((transpose != null) && (mask != null)) {
          mask = _this._helpers.position.swizzle(mask, transpose);
        }
        p.require(buffer.shader(_this._shaders.shader(), 2));
        p.pipe('grid.position', positionUniforms);
        position = _this._helpers.position.pipeline(p);
        styleUniforms = _this._helpers.style.uniforms();
        lineUniforms = _this._helpers.line.uniforms();
        unitUniforms = _this._inherit('unit').getUnitUniforms();
        uniforms = Util.JS.merge(lineUniforms, styleUniforms, unitUniforms);
        line = _this._renderables.make('line', {
          uniforms: uniforms,
          samples: samples,
          strips: strips,
          position: position,
          stroke: stroke,
          mask: mask
        });
        return {
          first: first,
          second: second,
          resolution: resolution,
          samples: samples,
          line: line,
          buffer: buffer,
          values: values
        };
      };
    })(this);
    _ref = this.props, lineX = _ref.lineX, lineY = _ref.lineY, crossed = _ref.crossed, axes = _ref.axes;
    transpose = ['0000', 'x000', 'y000', 'z000', 'w000'][axes[1]];
    stroke = this.props.stroke;
    this.axes = [];
    lineX && this.axes.push(axis('x.', 'y.', null));
    lineY && this.axes.push(axis('y.', 'x.', crossed ? null : transpose));
    lines = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.axes;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        axis = _ref1[_i];
        _results.push(axis.line);
      }
      return _results;
    }).call(this);
    this._helpers.visible.make();
    this._helpers.object.make(lines);
    this._helpers.span.make();
    return this._listen(this, 'span.range', this.updateRanges);
  };

  Grid.prototype.unmake = function() {
    var axis, _i, _len, _ref;
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    this._helpers.span.unmake();
    _ref = this.axes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      axis = _ref[_i];
      axis.buffer.dispose();
    }
    return this.axes = null;
  };

  Grid.prototype.change = function(changed, touched, init) {
    if (changed['x.axis.detail'] || changed['y.axis.detail'] || changed['x.axis.factor'] || changed['y.axis.factor'] || changed['grid.lineX'] || changed['grid.lineY'] || changed['line.stroke'] || changed['grid.crossed'] || (changed['grid.axes'] && this.props.crossed)) {
      return this.rebuild();
    }
    if (touched['x'] || touched['y'] || touched['area'] || touched['grid'] || touched['view'] || init) {
      return this.updateRanges();
    }
  };

  Grid.prototype.updateRanges = function() {
    var axes, axis, lineX, lineY, origin, range1, range2, _ref, _ref1;
    axis = (function(_this) {
      return function(x, y, range1, range2, axis) {
        var buffer, first, line, max, min, n, resolution, samples, second, ticks, values;
        first = axis.first, second = axis.second, resolution = axis.resolution, samples = axis.samples, line = axis.line, buffer = axis.buffer, values = axis.values;
        min = range1.x;
        max = range1.y;
        Util.Axis.setDimension(values.gridPosition, x).multiplyScalar(min);
        Util.Axis.setDimension(values.gridStep, x).multiplyScalar((max - min) * resolution);
        Util.Axis.addOrigin(values.gridPosition, axes, origin);
        min = range2.x;
        max = range2.y;
        ticks = _this._helpers.scale.generate(second, buffer, min, max);
        Util.Axis.setDimension(values.gridAxis, y);
        n = ticks.length;
        return line.geometry.clip(samples, n, 1, 1);
      };
    })(this);
    _ref = this.props, axes = _ref.axes, origin = _ref.origin;
    range1 = this._helpers.span.get('x.', axes[0]);
    range2 = this._helpers.span.get('y.', axes[1]);
    _ref1 = this.props, lineX = _ref1.lineX, lineY = _ref1.lineY;
    if (lineX) {
      axis(axes[0], axes[1], range1, range2, this.axes[0]);
    }
    if (lineY) {
      return axis(axes[1], axes[0], range2, range1, this.axes[+lineX]);
    }
  };

  return Grid;

})(Primitive);

module.exports = Grid;


},{"../../../util":172,"../../primitive":44}],65:[function(require,module,exports){
var Line, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Line = (function(_super) {
  __extends(Line, _super);

  Line.traits = ['node', 'object', 'visible', 'style', 'line', 'arrow', 'geometry', 'position', 'bind'];

  function Line(node, context, helpers) {
    Line.__super__.constructor.call(this, node, context, helpers);
    this.line = this.arrows = null;
  }

  Line.prototype.resize = function() {
    var arrow, dims, layers, ribbons, samples, strips, _i, _len, _ref, _results;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    samples = dims.width;
    strips = dims.height;
    ribbons = dims.depth;
    layers = dims.items;
    this.line.geometry.clip(samples, strips, ribbons, layers);
    _ref = this.arrows;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arrow = _ref[_i];
      _results.push(arrow.geometry.clip(samples, strips, ribbons, layers));
    }
    return _results;
  };

  Line.prototype.make = function() {
    var arrowUniforms, color, dims, end, layers, lineUniforms, mask, position, proximity, ribbons, samples, start, strips, stroke, styleUniforms, uniforms, unitUniforms, _ref, _ref1;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this._shaders.shader();
    position = this.bind.points.sourceShader(position);
    position = this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    arrowUniforms = this._helpers.arrow.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    _ref = this.props, start = _ref.start, end = _ref.end;
    _ref1 = this.props, stroke = _ref1.stroke, proximity = _ref1.proximity;
    this.proximity = proximity;
    dims = this.bind.points.getDimensions();
    samples = dims.width;
    strips = dims.height;
    ribbons = dims.depth;
    layers = dims.items;
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    uniforms = Util.JS.merge(arrowUniforms, lineUniforms, styleUniforms, unitUniforms);
    this.line = this._renderables.make('line', {
      uniforms: uniforms,
      samples: samples,
      strips: strips,
      ribbons: ribbons,
      layers: layers,
      position: position,
      color: color,
      clip: start || end,
      stroke: stroke,
      proximity: proximity,
      mask: mask
    });
    this.arrows = [];
    if (start) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        flip: true,
        samples: samples,
        strips: strips,
        ribbons: ribbons,
        layers: layers,
        position: position,
        color: color,
        mask: mask
      }));
    }
    if (end) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        samples: samples,
        strips: strips,
        ribbons: ribbons,
        layers: layers,
        position: position,
        color: color,
        mask: mask
      }));
    }
    this._helpers.visible.make();
    return this._helpers.object.make(this.arrows.concat([this.line]));
  };

  Line.prototype.made = function() {
    return this.resize();
  };

  Line.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.line = this.arrows = null;
  };

  Line.prototype.change = function(changed, touched, init) {
    if (changed['geometry.points'] || changed['line.stroke'] || changed['arrow.start'] || changed['arrow.end']) {
      return this.rebuild();
    }
    if (changed['line.proximity']) {
      if ((this.proximity != null) !== (this.props.proximity != null)) {
        return this.rebuild();
      }
    }
  };

  return Line;

})(Primitive);

module.exports = Line;


},{"../../../util":172,"../../primitive":44}],66:[function(require,module,exports){
var Point, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Point = (function(_super) {
  __extends(Point, _super);

  Point.traits = ['node', 'object', 'visible', 'style', 'point', 'geometry', 'position', 'bind'];

  function Point(node, context, helpers) {
    Point.__super__.constructor.call(this, node, context, helpers);
    this.point = null;
  }

  Point.prototype.resize = function() {
    var depth, dims, height, items, width;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    return this.point.geometry.clip(width, height, depth, items);
  };

  Point.prototype.make = function() {
    var color, depth, dims, fill, height, items, mask, optical, pointUniforms, position, shape, size, styleUniforms, uniforms, unitUniforms, width;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }, {
        to: 'point.sizes',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this._shaders.shader();
    position = this.bind.points.sourceShader(position);
    position = this._helpers.position.pipeline(position);
    dims = this.bind.points.getDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    styleUniforms = this._helpers.style.uniforms();
    pointUniforms = this._helpers.point.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    if (this.bind.sizes) {
      size = this._shaders.shader();
      this.bind.sizes.sourceShader(size);
    }
    mask = this._helpers.object.mask();
    shape = this.props.shape;
    fill = this.props.fill;
    optical = this.props.optical;
    uniforms = Util.JS.merge(unitUniforms, pointUniforms, styleUniforms);
    this.point = this._renderables.make('point', {
      uniforms: uniforms,
      width: width,
      height: height,
      depth: depth,
      items: items,
      position: position,
      color: color,
      size: size,
      shape: shape,
      optical: optical,
      fill: fill,
      mask: mask
    });
    this._helpers.visible.make();
    return this._helpers.object.make([this.point]);
  };

  Point.prototype.made = function() {
    return this.resize();
  };

  Point.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.point = null;
  };

  Point.prototype.change = function(changed, touched, init) {
    if (changed['geometry.points'] || changed['point.shape'] || changed['point.fill']) {
      return this.rebuild();
    }
  };

  return Point;

})(Primitive);

module.exports = Point;


},{"../../../util":172,"../../primitive":44}],67:[function(require,module,exports){
var Primitive, Strip, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Strip = (function(_super) {
  __extends(Strip, _super);

  Strip.traits = ['node', 'object', 'visible', 'style', 'line', 'mesh', 'strip', 'geometry', 'position', 'bind', 'shade'];

  function Strip(node, context, helpers) {
    Strip.__super__.constructor.call(this, node, context, helpers);
    this.strip = null;
  }

  Strip.prototype.resize = function() {
    var depth, dims, height, items, map, width;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    if (this.strip) {
      this.strip.geometry.clip(width, height, depth, items);
    }
    if (this.line) {
      this.line.geometry.clip(items, width, height, depth);
    }
    if (this.bind.map != null) {
      map = this.bind.map.getActiveDimensions();
      if (this.strip) {
        return this.strip.geometry.map(map.width, map.height, map.depth, map.items);
      }
    }
  };

  Strip.prototype.make = function() {
    var color, depth, dims, fill, height, items, line, lineUniforms, mask, objects, position, shaded, styleUniforms, swizzle, uniforms, unitUniforms, width;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }, {
        to: 'mesh.map',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this._shaders.shader();
    position = this.bind.points.sourceShader(position);
    position = this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    line = this.props.line;
    shaded = this.props.shaded;
    fill = this.props.fill;
    dims = this.bind.points.getDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    if (this.bind.colors) {
      color = this._shaders.shader();
      color = this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    objects = [];
    if (line) {
      swizzle = this._shaders.shader();
      swizzle.pipe(Util.GLSL.swizzleVec4('yzwx'));
      swizzle.pipe(position);
      uniforms = Util.JS.merge(unitUniforms, lineUniforms, styleUniforms);
      this.line = this._renderables.make('line', {
        uniforms: uniforms,
        samples: items,
        strips: width,
        ribbons: height,
        layers: depth,
        position: swizzle,
        color: color,
        mask: mask
      });
      objects.push(this.line);
    }
    if (fill) {
      uniforms = Util.JS.merge(styleUniforms, {});
      this.strip = this._renderables.make('strip', {
        uniforms: uniforms,
        width: width,
        height: height,
        depth: depth,
        items: items,
        position: position,
        color: color,
        material: shaded
      });
      objects.push(this.strip);
    }
    this._helpers.visible.make();
    return this._helpers.object.make(objects);
  };

  Strip.prototype.made = function() {
    return this.resize();
  };

  Strip.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.strip = null;
  };

  Strip.prototype.change = function(changed, touched, init) {
    if (changed['geometry.points'] || touched['mesh']) {
      return this.rebuild();
    }
  };

  return Strip;

})(Primitive);

module.exports = Strip;


},{"../../../util":172,"../../primitive":44}],68:[function(require,module,exports){
var Primitive, Surface, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Surface = (function(_super) {
  __extends(Surface, _super);

  Surface.traits = ['node', 'object', 'visible', 'style', 'line', 'mesh', 'geometry', 'surface', 'position', 'grid', 'bind', 'shade'];

  Surface.defaults = {
    lineX: false,
    lineY: false
  };

  function Surface(node, context, helpers) {
    Surface.__super__.constructor.call(this, node, context, helpers);
    this.lineX = this.lineY = this.surface = null;
  }

  Surface.prototype.resize = function() {
    var depth, dims, height, items, map, width;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    width = dims.width, height = dims.height, depth = dims.depth, items = dims.items;
    if (this.surface) {
      this.surface.geometry.clip(width, height, depth, items);
    }
    if (this.lineX) {
      this.lineX.geometry.clip(width, height, depth, items);
    }
    if (this.lineY) {
      this.lineY.geometry.clip(height, width, depth, items);
    }
    if (this.bind.map != null) {
      map = this.bind.map.getActiveDimensions();
      if (this.surface) {
        return this.surface.geometry.map(map.width, map.height, map.depth, map.items);
      }
    }
  };

  Surface.prototype.make = function() {
    var closedX, closedY, color, crossed, depth, dims, fill, height, items, lineUniforms, lineX, lineY, map, mask, material, objects, position, proximity, shaded, stroke, styleUniforms, surfaceUniforms, swizzle, swizzle2, uniforms, unitUniforms, width, wireUniforms, zUnits, _ref, _ref1, _ref2;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }, {
        to: 'mesh.map',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this._shaders.shader();
    position = this.bind.points.sourceShader(position);
    position = this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    wireUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    surfaceUniforms = this._helpers.surface.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    wireUniforms.styleColor = this._attributes.make(this._types.color());
    wireUniforms.styleZBias = this._attributes.make(this._types.number());
    this.wireColor = wireUniforms.styleColor.value;
    this.wireZBias = wireUniforms.styleZBias;
    this.wireScratch = new THREE.Color;
    dims = this.bind.points.getDimensions();
    width = dims.width, height = dims.height, depth = dims.depth, items = dims.items;
    _ref = this.props, shaded = _ref.shaded, fill = _ref.fill, lineX = _ref.lineX, lineY = _ref.lineY, closedX = _ref.closedX, closedY = _ref.closedY, stroke = _ref.stroke, proximity = _ref.proximity, crossed = _ref.crossed;
    objects = [];
    this.proximity = proximity;
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    map = this._helpers.shade.map((_ref1 = this.bind.map) != null ? _ref1.sourceShader(this._shaders.shader()) : void 0);
    material = this._helpers.shade.pipeline() || shaded;
    _ref2 = this._helpers.position, swizzle = _ref2.swizzle, swizzle2 = _ref2.swizzle2;
    uniforms = Util.JS.merge(unitUniforms, lineUniforms, styleUniforms, wireUniforms);
    zUnits = lineX || lineY ? -50 : 0;
    if (lineX) {
      this.lineX = this._renderables.make('line', {
        uniforms: uniforms,
        samples: width,
        strips: height,
        ribbons: depth,
        layers: items,
        position: position,
        color: color,
        zUnits: -zUnits,
        stroke: stroke,
        mask: mask,
        proximity: proximity,
        closed: closedX || closed
      });
      objects.push(this.lineX);
    }
    if (lineY) {
      this.lineY = this._renderables.make('line', {
        uniforms: uniforms,
        samples: height,
        strips: width,
        ribbons: depth,
        layers: items,
        position: swizzle2(position, 'yxzw', 'yxzw'),
        color: swizzle(color, 'yxzw'),
        zUnits: -zUnits,
        stroke: stroke,
        mask: swizzle(mask, crossed ? 'xyzw' : 'yxzw'),
        proximity: proximity,
        closed: closedY || closed
      });
      objects.push(this.lineY);
    }
    if (fill) {
      uniforms = Util.JS.merge(unitUniforms, surfaceUniforms, styleUniforms);
      this.surface = this._renderables.make('surface', {
        uniforms: uniforms,
        width: width,
        height: height,
        surfaces: depth,
        layers: items,
        position: position,
        color: color,
        material: shaded,
        zUnits: zUnits,
        stroke: stroke,
        mask: mask,
        map: map,
        intUV: true,
        closedX: closedX || closed,
        closedY: closedY || closed
      });
      objects.push(this.surface);
    }
    this._helpers.visible.make();
    return this._helpers.object.make(objects);
  };

  Surface.prototype.made = function() {
    return this.resize();
  };

  Surface.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.lineX = this.lineY = this.surface = null;
  };

  Surface.prototype.change = function(changed, touched, init) {
    var c, color, fill, zBias, _ref;
    if (changed['geometry.points'] || changed['mesh.shaded'] || changed['mesh.fill'] || changed['line.stroke'] || touched['grid']) {
      return this.rebuild();
    }
    if (changed['style.color'] || changed['style.zBias'] || changed['mesh.fill'] || init) {
      _ref = this.props, fill = _ref.fill, color = _ref.color, zBias = _ref.zBias;
      this.wireZBias.value = zBias + (fill ? 5 : 0);
      this.wireColor.copy(color);
      if (fill) {
        c = this.wireScratch;
        c.setRGB(color.x, color.y, color.z);
        c.convertGammaToLinear().multiplyScalar(.75).convertLinearToGamma();
        this.wireColor.x = c.r;
        this.wireColor.y = c.g;
        this.wireColor.z = c.b;
      }
    }
    if (changed['line.proximity']) {
      if ((this.proximity != null) !== (this.props.proximity != null)) {
        return this.rebuild();
      }
    }
  };

  return Surface;

})(Primitive);

module.exports = Surface;


},{"../../../util":172,"../../primitive":44}],69:[function(require,module,exports){
var Primitive, Ticks, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Ticks = (function(_super) {
  __extends(Ticks, _super);

  function Ticks() {
    return Ticks.__super__.constructor.apply(this, arguments);
  }

  Ticks.traits = ['node', 'object', 'visible', 'style', 'line', 'ticks', 'geometry', 'position', 'bind'];

  Ticks.prototype.init = function() {
    return this.tickStrip = this.line = null;
  };

  Ticks.prototype.resize = function() {
    var active, dims, layers, ribbons, strips;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    active = +(dims.items > 0);
    strips = dims.width * active;
    ribbons = dims.height * active;
    layers = dims.depth * active;
    this.line.geometry.clip(2, strips, ribbons, layers);
    return this.tickStrip.set(0, strips - 1);
  };

  Ticks.prototype.make = function() {
    var color, dims, layers, lineUniforms, mask, p, position, positionUniforms, ribbons, strips, stroke, styleUniforms, swizzle, uniforms, unitUniforms;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    uniforms = Util.JS.merge(lineUniforms, styleUniforms, unitUniforms);
    positionUniforms = {
      tickEpsilon: this.node.attributes['ticks.epsilon'],
      tickSize: this.node.attributes['ticks.size'],
      tickNormal: this.node.attributes['ticks.normal'],
      tickStrip: this._attributes.make(this._types.vec2(0, 0)),
      worldUnit: uniforms.worldUnit,
      focusDepth: uniforms.focusDepth
    };
    this.tickStrip = positionUniforms.tickStrip.value;
    p = position = this._shaders.shader();
    p.require(this.bind.points.sourceShader(this._shaders.shader()));
    p.require(this._helpers.position.pipeline(this._shaders.shader()));
    p.pipe('ticks.position', positionUniforms);
    stroke = this.props.stroke;
    dims = this.bind.points.getDimensions();
    strips = dims.width;
    ribbons = dims.height;
    layers = dims.depth;
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    swizzle = this._helpers.position.swizzle;
    this.line = this._renderables.make('line', {
      uniforms: uniforms,
      samples: 2,
      strips: strips,
      ribbons: ribbons,
      layers: layers,
      position: position,
      color: color,
      stroke: stroke,
      mask: swizzle(mask, 'yzwx')
    });
    this._helpers.visible.make();
    return this._helpers.object.make([this.line]);
  };

  Ticks.prototype.made = function() {
    return this.resize();
  };

  Ticks.prototype.unmake = function() {
    this.line = null;
    this._helpers.visible.unmake();
    return this._helpers.object.unmake();
  };

  Ticks.prototype.change = function(changed, touched, init) {
    if (changed['geometry.points'] || changed['line.stroke']) {
      return this.rebuild();
    }
  };

  return Ticks;

})(Primitive);

module.exports = Ticks;


},{"../../../util":172,"../../primitive":44}],70:[function(require,module,exports){
var Primitive, Util, Vector,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Vector = (function(_super) {
  __extends(Vector, _super);

  Vector.traits = ['node', 'object', 'visible', 'style', 'line', 'arrow', 'geometry', 'position', 'bind'];

  function Vector(node, context, helpers) {
    Vector.__super__.constructor.call(this, node, context, helpers);
    this.line = this.arrows = null;
  }

  Vector.prototype.resize = function() {
    var arrow, dims, layers, ribbons, samples, strips, _i, _len, _ref, _results;
    if (this.bind.points == null) {
      return;
    }
    dims = this.bind.points.getActiveDimensions();
    samples = dims.items;
    strips = dims.width;
    ribbons = dims.height;
    layers = dims.depth;
    this.line.geometry.clip(samples, strips, ribbons, layers);
    _ref = this.arrows;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arrow = _ref[_i];
      _results.push(arrow.geometry.clip(samples, strips, ribbons, layers));
    }
    return _results;
  };

  Vector.prototype.make = function() {
    var arrowUniforms, color, dims, end, layers, lineUniforms, mask, position, proximity, ribbons, samples, start, strips, stroke, styleUniforms, swizzle, swizzle2, uniforms, unitUniforms, _ref, _ref1, _ref2;
    this._helpers.bind.make([
      {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    position = this._shaders.shader();
    this.bind.points.sourceShader(position);
    this._helpers.position.pipeline(position);
    styleUniforms = this._helpers.style.uniforms();
    lineUniforms = this._helpers.line.uniforms();
    arrowUniforms = this._helpers.arrow.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    _ref = this.props, start = _ref.start, end = _ref.end;
    _ref1 = this.props, stroke = _ref1.stroke, proximity = _ref1.proximity;
    this.proximity = proximity;
    dims = this.bind.points.getDimensions();
    samples = dims.items;
    strips = dims.width;
    ribbons = dims.height;
    layers = dims.depth;
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    _ref2 = this._helpers.position, swizzle = _ref2.swizzle, swizzle2 = _ref2.swizzle2;
    position = swizzle2(position, 'yzwx', 'yzwx');
    color = swizzle(color, 'yzwx');
    mask = swizzle(mask, 'yzwx');
    uniforms = Util.JS.merge(arrowUniforms, lineUniforms, styleUniforms, unitUniforms);
    this.line = this._renderables.make('line', {
      uniforms: uniforms,
      samples: samples,
      ribbons: ribbons,
      strips: strips,
      layers: layers,
      position: position,
      color: color,
      clip: start || end,
      stroke: stroke,
      proximity: proximity,
      mask: mask
    });
    this.arrows = [];
    if (start) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        flip: true,
        samples: samples,
        ribbons: ribbons,
        strips: strips,
        layers: layers,
        position: position,
        color: color,
        mask: mask
      }));
    }
    if (end) {
      this.arrows.push(this._renderables.make('arrow', {
        uniforms: uniforms,
        samples: samples,
        ribbons: ribbons,
        strips: strips,
        layers: layers,
        position: position,
        color: color,
        mask: mask
      }));
    }
    this._helpers.visible.make();
    return this._helpers.object.make(this.arrows.concat([this.line]));
  };

  Vector.prototype.made = function() {
    return this.resize();
  };

  Vector.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.line = this.arrows = null;
  };

  Vector.prototype.change = function(changed, touched, init) {
    if (changed['geometry.points'] || changed['line.stroke'] || changed['arrow.start'] || changed['arrow.end']) {
      return this.rebuild();
    }
    if (changed['line.proximity']) {
      if ((this.proximity != null) !== (this.props.proximity != null)) {
        return this.rebuild();
      }
    }
  };

  return Vector;

})(Primitive);

module.exports = Vector;


},{"../../../util":172,"../../primitive":44}],71:[function(require,module,exports){
var Util, View, helpers,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Util = require('../../util');

View = require('./view/view');


/*

This is the general dumping ground for trait behavior.

Helpers are auto-attached to primitives that have the matching trait
 */

helpers = {
  bind: {
    make: function(slots) {
      var callback, done, isUnique, multiple, name, optional, s, selector, slot, source, start, to, trait, unique, _i, _j, _len, _len1;
      if (this.bind == null) {
        this.bind = {};
      }
      if (this.bound == null) {
        this.bound = [];
      }
      for (_i = 0, _len = slots.length; _i < _len; _i++) {
        slot = slots[_i];
        to = slot.to, trait = slot.trait, optional = slot.optional, unique = slot.unique, multiple = slot.multiple, callback = slot.callback;
        if (callback == null) {
          callback = this.rebuild;
        }
        name = to.split(/\./g).pop();
        selector = this._get(to);
        source = null;
        if (selector != null) {
          start = this;
          done = false;
          while (!done) {
            start = source = this._attach(selector, trait, callback, this, start, optional, multiple);
            isUnique = unique && ((source == null) || this.bound.indexOf(source) < 0);
            done = multiple || optional || !unique || isUnique;
          }
        }
        if (source != null) {
          if (this.resize != null) {
            this._listen(source, 'source.resize', this.resize);
          }
          if (callback) {
            this._listen(source, 'source.rebuild', callback);
          }
          if (multiple) {
            for (_j = 0, _len1 = source.length; _j < _len1; _j++) {
              s = source[_j];
              this.bound.push(s);
            }
          } else {
            this.bound.push(source);
          }
        }
        this.bind[name] = source;
      }
      return null;
    },
    unmake: function() {
      if (!this.bind) {
        return;
      }
      delete this.bind;
      return delete this.bound;
    }
  },
  span: {
    make: function() {
      this.spanView = this._inherit('view');
      return this._listen('view', 'view.range', (function(_this) {
        return function() {
          return _this.trigger({
            type: 'span.range'
          });
        };
      })(this));
    },
    unmake: function() {
      return delete this.spanView;
    },
    get: (function() {
      var def;
      def = new THREE.Vector2(-1, 1);
      return function(prefix, dimension) {
        var range, _ref, _ref1;
        range = this._get(prefix + 'span.range');
        if (range != null) {
          return range;
        }
        return (_ref = (_ref1 = this.spanView) != null ? _ref1.axis(dimension) : void 0) != null ? _ref : def;
      };
    })()
  },
  scale: {
    divide: function(prefix) {
      var divide, factor;
      divide = this._get(prefix + 'scale.divide');
      factor = this._get(prefix + 'scale.factor');
      return Math.round(divide * 2.5 / factor);
    },
    generate: function(prefix, buffer, min, max) {
      var base, divide, end, factor, mode, nice, start, ticks, unit, zero;
      mode = this._get(prefix + 'scale.mode');
      divide = this._get(prefix + 'scale.divide');
      unit = this._get(prefix + 'scale.unit');
      base = this._get(prefix + 'scale.base');
      factor = this._get(prefix + 'scale.factor');
      start = this._get(prefix + 'scale.start');
      end = this._get(prefix + 'scale.end');
      zero = this._get(prefix + 'scale.zero');
      nice = this._get(prefix + 'scale.nice');
      ticks = Util.Ticks.make(mode, min, max, divide, unit, base, factor, start, end, zero, nice);
      buffer.copy(ticks);
      return ticks;
    }
  },
  style: {
    uniforms: function() {
      return {
        styleColor: this.node.attributes['style.color'],
        styleOpacity: this.node.attributes['style.opacity'],
        styleZBias: this.node.attributes['style.zBias'],
        styleZIndex: this.node.attributes['style.zIndex']
      };
    }
  },
  arrow: {
    uniforms: function() {
      var end, size, space, start, style;
      start = this.props.start;
      end = this.props.end;
      space = this._attributes.make(this._types.number(1.25 / (start + end)));
      style = this._attributes.make(this._types.vec2(+start, +end));
      size = this.node.attributes['arrow.size'];
      return {
        clipStyle: style,
        clipRange: size,
        clipSpace: space,
        arrowSpace: space,
        arrowSize: size
      };
    }
  },
  point: {
    uniforms: function() {
      return {
        pointSize: this.node.attributes['point.size'],
        pointDepth: this.node.attributes['point.depth']
      };
    }
  },
  line: {
    uniforms: function() {
      return {
        lineWidth: this.node.attributes['line.width'],
        lineDepth: this.node.attributes['line.depth'],
        lineProximity: this.node.attributes['line.proximity']
      };
    }
  },
  surface: {
    uniforms: function() {
      return {};
    }
  },
  shade: {
    pipeline: function(shader) {
      var pass, _i, _ref;
      if (!this._inherit('fragment')) {
        return shader;
      }
      if (shader == null) {
        shader = this._shaders.shader();
      }
      for (pass = _i = 0; _i <= 2; pass = ++_i) {
        shader = (_ref = this._inherit('fragment')) != null ? _ref.fragment(shader, pass) : void 0;
      }
      shader.pipe('fragment.map.rgba');
      return shader;
    },
    map: function(shader) {
      if (!shader) {
        return shader;
      }
      return shader = this._shaders.shader().pipe('mesh.map.uvwo').pipe(shader);
    }
  },
  position: {
    pipeline: function(shader) {
      var pass, _i, _ref;
      if (!this._inherit('vertex')) {
        return shader;
      }
      if (shader == null) {
        shader = this._shaders.shader();
      }
      for (pass = _i = 0; _i <= 3; pass = ++_i) {
        shader = (_ref = this._inherit('vertex')) != null ? _ref.vertex(shader, pass) : void 0;
      }
      return shader;
    },
    swizzle: function(shader, order) {
      if (shader) {
        return this._shaders.shader().pipe(Util.GLSL.swizzleVec4(order)).pipe(shader);
      }
    },
    swizzle2: function(shader, order1, order2) {
      if (shader) {
        return this._shaders.shader().split().pipe(Util.GLSL.swizzleVec4(order1)).next().pipe(Util.GLSL.swizzleVec4(order2)).join().pipe(shader);
      }
    }
  },
  visible: {
    make: function() {
      var e, onVisible, visible, visibleParent;
      e = {
        type: 'visible.change'
      };
      visible = null;
      this.setVisible = function(vis) {
        if (vis != null) {
          visible = vis;
        }
        return onVisible();
      };
      onVisible = (function(_this) {
        return function() {
          var last, self, _ref;
          last = _this.isVisible;
          self = (_ref = visible != null ? visible : _this._get('object.visible')) != null ? _ref : true;
          if (typeof visibleParent !== "undefined" && visibleParent !== null) {
            self && (self = visibleParent.isVisible);
          }
          _this.isVisible = self;
          if (last !== _this.isVisible) {
            return _this.trigger(e);
          }
        };
      })(this);
      visibleParent = this._inherit('visible');
      if (visibleParent) {
        this._listen(visibleParent, 'visible.change', onVisible);
      }
      if (this.is('object')) {
        this._listen(this.node, 'change:object', onVisible);
      }
      return onVisible();
    },
    unmake: function() {
      return delete this.isVisible;
    }
  },
  active: {
    make: function() {
      var active, activeParent, e, onActive;
      e = {
        type: 'active.change'
      };
      active = null;
      this.setActive = function(act) {
        if (act != null) {
          active = act;
        }
        return onActive();
      };
      onActive = (function(_this) {
        return function() {
          var last, self, _ref;
          last = _this.isActive;
          self = (_ref = active != null ? active : _this._get('entity.active')) != null ? _ref : true;
          if (typeof activeParent !== "undefined" && activeParent !== null) {
            self && (self = activeParent.isActive);
          }
          _this.isActive = self;
          if (last !== _this.isActive) {
            return _this.trigger(e);
          }
        };
      })(this);
      activeParent = this._inherit('active');
      if (activeParent) {
        this._listen(activeParent, 'active.change', onActive);
      }
      if (this.is('entity')) {
        this._listen(this.node, 'change:entity', onActive);
      }
      return onActive();
    },
    unmake: function() {
      return delete this.isActive;
    }
  },
  object: {
    make: function(objects) {
      var blending, hasStyle, last, object, objectScene, onChange, onVisible, opacity, zOrder, zTest, zWrite, _i, _len, _ref;
      this.objects = objects != null ? objects : [];
      this.renders = this.objects.reduce((function(a, b) {
        return a.concat(b.renders);
      }), []);
      objectScene = this._inherit('scene');
      opacity = blending = zOrder = null;
      hasStyle = __indexOf.call(this.traits, 'style') >= 0;
      opacity = 1;
      blending = THREE.NormalBlending;
      zWrite = true;
      zTest = true;
      if (hasStyle) {
        opacity = this.props.opacity;
        blending = this.props.blending;
        zOrder = this.props.zOrder;
        zWrite = this.props.zWrite;
        zTest = this.props.zTest;
      }
      onChange = (function(_this) {
        return function(event) {
          var changed, refresh;
          changed = event.changed;
          refresh = null;
          if (changed['style.opacity']) {
            refresh = opacity = _this.props.opacity;
          }
          if (changed['style.blending']) {
            refresh = blending = _this.props.blending;
          }
          if (changed['style.zOrder']) {
            refresh = zOrder = _this.props.zOrder;
          }
          if (changed['style.zWrite']) {
            refresh = zWrite = _this.props.zWrite;
          }
          if (changed['style.zTest']) {
            refresh = zTest = _this.props.zTest;
          }
          if (refresh != null) {
            return onVisible();
          }
        };
      })(this);
      last = null;
      onVisible = (function(_this) {
        return function() {
          var o, order, visible, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _results, _results1, _results2;
          order = zOrder != null ? zOrder : _this.node.order;
          visible = ((_ref = _this.isVisible) != null ? _ref : true) && opacity > 0;
          if (visible) {
            if (hasStyle) {
              _ref1 = _this.objects;
              _results = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                o = _ref1[_i];
                o.show(opacity < 1, blending, order);
                _results.push(o.depth(zWrite, zTest));
              }
              return _results;
            } else {
              _ref2 = _this.objects;
              _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                o = _ref2[_j];
                _results1.push(o.show(true, blending, order));
              }
              return _results1;
            }
          } else {
            _ref3 = _this.objects;
            _results2 = [];
            for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
              o = _ref3[_k];
              _results2.push(o.hide());
            }
            return _results2;
          }
        };
      })(this);
      this._listen(this.node, 'change:style', onChange);
      this._listen(this.node, 'reindex', onVisible);
      this._listen(this, 'visible.change', onVisible);
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        objectScene.adopt(object);
      }
      return onVisible();
    },
    unmake: function(dispose) {
      var object, objectScene, _i, _j, _len, _len1, _ref, _ref1, _results;
      if (dispose == null) {
        dispose = true;
      }
      if (!this.objects) {
        return;
      }
      objectScene = this._inherit('scene');
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        objectScene.unadopt(object);
      }
      if (dispose) {
        _ref1 = this.objects;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          object = _ref1[_j];
          _results.push(object.dispose());
        }
        return _results;
      }
    },
    mask: function() {
      var mask, shader;
      if (!(mask = this._inherit('mask'))) {
        return;
      }
      return shader = mask.mask(shader);
    }
  },
  unit: {
    make: function() {
      var bottom, focusDepth, handler, pixelRatio, pixelUnit, renderAspect, renderHeight, renderOdd, renderScale, renderScaleInv, renderWidth, root, top, viewHeight, viewWidth, worldUnit, π;
      π = Math.PI;
      this.unitUniforms = {
        renderScaleInv: renderScaleInv = this._attributes.make(this._types.number(1)),
        renderScale: renderScale = this._attributes.make(this._types.number(1)),
        renderAspect: renderAspect = this._attributes.make(this._types.number(1)),
        renderWidth: renderWidth = this._attributes.make(this._types.number(0)),
        renderHeight: renderHeight = this._attributes.make(this._types.number(0)),
        viewWidth: viewWidth = this._attributes.make(this._types.number(0)),
        viewHeight: viewHeight = this._attributes.make(this._types.number(0)),
        pixelRatio: pixelRatio = this._attributes.make(this._types.number(1)),
        pixelUnit: pixelUnit = this._attributes.make(this._types.number(1)),
        worldUnit: worldUnit = this._attributes.make(this._types.number(1)),
        focusDepth: focusDepth = this._attributes.make(this._types.number(1)),
        renderOdd: renderOdd = this._attributes.make(this._types.vec2())
      };
      top = new THREE.Vector3();
      bottom = new THREE.Vector3();
      handler = (function(_this) {
        return function() {
          var camera, dpr, focus, fov, fovtan, isAbsolute, m, measure, pixel, rscale, scale, size, world, _ref;
          if ((size = typeof root !== "undefined" && root !== null ? root.getSize() : void 0) == null) {
            return;
          }
          π = Math.PI;
          scale = _this.props.scale;
          fov = _this.props.fov;
          focus = (_ref = _this.props.focus) != null ? _ref : _this.inherit('unit').props.focus;
          isAbsolute = scale === null;
          measure = 1;
          if ((camera = typeof root !== "undefined" && root !== null ? root.getCamera() : void 0)) {
            m = camera.projectionMatrix;
            top.set(0, -.5, 1).applyProjection(m);
            bottom.set(0, .5, 1).applyProjection(m);
            top.sub(bottom);
            measure = top.y;
          }
          dpr = size.renderHeight / size.viewHeight;
          fovtan = fov != null ? measure * Math.tan(fov * π / 360) : 1;
          pixel = isAbsolute ? dpr : size.renderHeight / scale * fovtan;
          rscale = size.renderHeight * measure / 2;
          world = pixel / rscale;
          viewWidth.value = size.viewWidth;
          viewHeight.value = size.viewHeight;
          renderWidth.value = size.renderWidth;
          renderHeight.value = size.renderHeight;
          renderAspect.value = size.aspect;
          renderScale.value = rscale;
          renderScaleInv.value = 1 / rscale;
          pixelRatio.value = dpr;
          pixelUnit.value = pixel;
          worldUnit.value = world;
          focusDepth.value = focus;
          return renderOdd.value.set(size.renderWidth % 2, size.renderHeight % 2).multiplyScalar(.5);
        };
      })(this);
      root = this.is('root') ? this : this._inherit('root');
      this._listen(root, 'root.update', handler);
      return handler();
    },
    unmake: function() {
      return delete this.unitUniforms;
    },
    get: function() {
      var k, u, v, _ref;
      u = {};
      _ref = this.unitUniforms;
      for (k in _ref) {
        v = _ref[k];
        u[k] = v.value;
      }
      return u;
    },
    uniforms: function() {
      return this.unitUniforms;
    }
  }
};

module.exports = function(object, traits) {
  var h, key, method, methods, trait, _i, _len;
  h = {};
  for (_i = 0, _len = traits.length; _i < _len; _i++) {
    trait = traits[_i];
    if (!(methods = helpers[trait])) {
      continue;
    }
    h[trait] = {};
    for (key in methods) {
      method = methods[key];
      h[trait][key] = method.bind(object);
    }
  }
  return h;
};


},{"../../util":172,"./view/view":119}],72:[function(require,module,exports){
var Model;

Model = require('../../model');

exports.Classes = require('./classes');

exports.Types = require('./types');

exports.Traits = require('./traits');

exports.Helpers = require('./helpers');


},{"../../model":34,"./classes":52,"./helpers":71,"./traits":104,"./types":112}],73:[function(require,module,exports){
var Grow, Operator,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Grow = (function(_super) {
  __extends(Grow, _super);

  function Grow() {
    return Grow.__super__.constructor.apply(this, arguments);
  }

  Grow.traits = ['node', 'bind', 'operator', 'source', 'index', 'grow'];

  Grow.prototype.sourceShader = function(shader) {
    return shader.pipe(this.operator);
  };

  Grow.prototype.make = function() {
    var transform, uniforms;
    Grow.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    uniforms = {
      growScale: this.node.attributes['grow.scale'],
      growMask: this._attributes.make(this._types.vec4()),
      growAnchor: this._attributes.make(this._types.vec4())
    };
    this.growMask = uniforms.growMask.value;
    this.growAnchor = uniforms.growAnchor.value;
    transform = this._shaders.shader();
    transform.require(this.bind.source.sourceShader(this._shaders.shader()));
    transform.pipe('grow.position', uniforms);
    return this.operator = transform;
  };

  Grow.prototype.unmake = function() {
    return Grow.__super__.unmake.apply(this, arguments);
  };

  Grow.prototype.resize = function() {
    this.update();
    return Grow.__super__.resize.apply(this, arguments);
  };

  Grow.prototype.update = function() {
    var anchor, dims, i, key, m, order, _i, _len, _results;
    dims = this.bind.source.getFutureDimensions();
    order = ['width', 'height', 'depth', 'items'];
    m = function(d, anchor) {
      return -((d || 1) - 1) * (.5 - anchor * .5);
    };
    _results = [];
    for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
      key = order[i];
      anchor = this.props[key];
      this.growMask.setComponent(i, +(!anchor));
      _results.push(this.growAnchor.setComponent(i, m(dims[key], anchor)));
    }
    return _results;
  };

  Grow.prototype.change = function(changed, touched, init) {
    if (touched['operator']) {
      return this.rebuild();
    }
    if (touched['grow']) {
      return this.update();
    }
  };

  return Grow;

})(Operator);

module.exports = Grow;


},{"./operator":77}],74:[function(require,module,exports){
var Join, Operator, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');


/*
split:
  order:       Types.transpose('wxyz')
  axis:        Types.axis()
  overlap:     Types.int(0)
 */

Join = (function(_super) {
  __extends(Join, _super);

  function Join() {
    return Join.__super__.constructor.apply(this, arguments);
  }

  Join.traits = ['node', 'bind', 'operator', 'source', 'index', 'join'];

  Join.prototype.indexShader = function(shader) {
    shader.pipe(this.operator);
    return Join.__super__.indexShader.call(this, shader);
  };

  Join.prototype.sourceShader = function(shader) {
    shader.pipe(this.operator);
    return Join.__super__.sourceShader.call(this, shader);
  };

  Join.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Join.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Join.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Join.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Join.prototype._resample = function(dims) {
    var axis, dim, i, index, labels, length, mapped, order, out, overlap, product, set, stride, _i, _len, _ref;
    order = this.order;
    axis = this.axis;
    overlap = this.overlap;
    length = this.length;
    stride = this.stride;
    labels = ['width', 'height', 'depth', 'items'];
    mapped = order.map(function(x) {
      return labels[x - 1];
    });
    index = order.indexOf(axis);
    set = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = mapped.length; _i < _len; _i++) {
        dim = mapped[_i];
        _results.push(dims[dim]);
      }
      return _results;
    })();
    product = ((_ref = set[index + 1]) != null ? _ref : 1) * stride;
    set.splice(index, 2, product);
    set = set.slice(0, 3);
    set.push(1);
    out = {};
    for (i = _i = 0, _len = mapped.length; _i < _len; i = ++_i) {
      dim = mapped[i];
      out[dim] = set[i];
    }
    return out;
  };

  Join.prototype.make = function() {
    var axis, dims, index, labels, length, major, order, overlap, permute, rest, stride, transform, uniforms;
    Join.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    order = this.props.order;
    axis = this.props.axis;
    overlap = this.props.overlap;

    /*
    Calculate index transform
    
    order: wxyz
    length: 3
    overlap: 1
    
    axis: w
    index: 0
    rest: 00xy
    
    axis: x
    index: 1
    rest: w00y
    
    axis: y
    index: 2
    rest: wx00
    
    axis: z
    index: 3
    rest: wxy0
     */
    permute = order.join('');
    if (axis == null) {
      axis = order[0];
    }
    index = permute.indexOf(axis);
    rest = permute.replace(axis, '00').substring(0, 4);
    labels = [null, 'width', 'height', 'depth', 'items'];
    major = labels[axis];
    dims = this.bind.source.getDimensions();
    length = dims[major];
    overlap = Math.min(length - 1, overlap);
    stride = length - overlap;
    uniforms = {
      joinStride: this._attributes.make(this._types.number(stride)),
      joinStrideInv: this._attributes.make(this._types.number(1 / stride))
    };
    transform = this._shaders.shader();
    transform.require(Util.GLSL.swizzleVec4(axis, 1));
    transform.require(Util.GLSL.swizzleVec4(rest, 4));
    transform.require(Util.GLSL.injectVec4([index, index + 1]));
    transform.pipe('join.position', uniforms);
    transform.pipe(Util.GLSL.invertSwizzleVec4(order));
    this.operator = transform;
    this.order = order;
    this.axis = axis;
    this.overlap = overlap;
    this.length = length;
    return this.stride = stride;
  };

  Join.prototype.unmake = function() {
    return Join.__super__.unmake.apply(this, arguments);
  };

  Join.prototype.change = function(changed, touched, init) {
    if (touched['join'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Join;

})(Operator);

module.exports = Join;


},{"../../../util":172,"./operator":77}],75:[function(require,module,exports){
var Lerp, Operator,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Lerp = (function(_super) {
  __extends(Lerp, _super);

  function Lerp() {
    return Lerp.__super__.constructor.apply(this, arguments);
  }

  Lerp.traits = ['node', 'bind', 'operator', 'source', 'index', 'lerp', 'sampler:width', 'sampler:height', 'sampler:depth', 'sampler:items'];

  Lerp.prototype.indexShader = function(shader) {
    return shader.pipe(this.indexer);
  };

  Lerp.prototype.sourceShader = function(shader) {
    return shader.pipe(this.operator);
  };

  Lerp.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Lerp.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Lerp.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Lerp.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Lerp.prototype._resample = function(dims) {
    var r;
    r = this.resample;
    return {
      items: Math.floor(r.items * dims.items),
      width: Math.floor(r.width * dims.width),
      height: Math.floor(r.height * dims.height),
      depth: Math.floor(r.depth * dims.depth)
    };
  };

  Lerp.prototype.make = function() {
    var centered, dims, id, indexer, key, padding, ratio, size, transform, uniforms, _ref;
    Lerp.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    transform = this.bind.source.sourceShader(this._shaders.shader());
    indexer = this._shaders.shader();
    this.resample = {};
    dims = this.bind.source.getDimensions();
    for (key in dims) {
      id = "lerp." + key;
      size = (_ref = this.props[key]) != null ? _ref : dims[key];
      this.resample[key] = size / dims[key];
      centered = this._get("" + key + ".sampler.centered");
      padding = this._get("" + key + ".sampler.padding");
      size += padding * 2;
      if (size !== dims[key]) {
        ratio = centered ? dims[key] / Math.max(1, size) : Math.max(1, dims[key] - 1) / Math.max(1, size - 1);
        uniforms = {
          sampleRatio: this._attributes.make(this._types.number(ratio)),
          sampleBias: this._attributes.make(this._types.number(ratio * padding))
        };
        transform = this._shaders.shader().require(transform);
        transform.pipe(id, uniforms);
      }
    }
    this.operator = transform;
    return this.indexer = indexer;
  };

  Lerp.prototype.unmake = function() {
    return Lerp.__super__.unmake.apply(this, arguments);
  };

  Lerp.prototype.change = function(changed, touched, init) {
    if (touched['lerp'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Lerp;

})(Operator);

module.exports = Lerp;


},{"./operator":77}],76:[function(require,module,exports){
var Memo, Operator, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');

Memo = (function(_super) {
  __extends(Memo, _super);

  function Memo() {
    return Memo.__super__.constructor.apply(this, arguments);
  }

  Memo.traits = ['node', 'bind', 'active', 'operator', 'source', 'index', 'texture', 'memo'];

  Memo.prototype.sourceShader = function(shader) {
    return this.memo.shaderAbsolute(shader, 1);
  };

  Memo.prototype.make = function() {
    var depth, dims, height, items, magFilter, minFilter, operator, type, width, _ref;
    Memo.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    this._helpers.active.make();
    this._listen('root', 'root.update', (function(_this) {
      return function() {
        if (_this.isActive) {
          return _this.update();
        }
      };
    })(this));
    _ref = this.props, minFilter = _ref.minFilter, magFilter = _ref.magFilter, type = _ref.type;
    dims = this.bind.source.getDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    this.memo = this._renderables.make('memo', {
      items: items,
      width: width,
      height: height,
      depth: depth,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
    operator = this._shaders.shader();
    this.bind.source.sourceShader(operator);
    this.compose = this._renderables.make('memoScreen', {
      map: operator,
      items: items,
      width: width,
      height: height,
      depth: depth
    });
    this.memo.adopt(this.compose);
    this.objects = [this.compose];
    return this.renders = this.compose.renders;
  };

  Memo.prototype.unmake = function() {
    Memo.__super__.unmake.apply(this, arguments);
    if (this.bind.source != null) {
      this._helpers.active.unmake();
      this.memo.unadopt(this.compose);
      this.memo.dispose();
      return this.memo = this.compose = null;
    }
  };

  Memo.prototype.update = function() {
    var _ref;
    return (_ref = this.memo) != null ? _ref.render() : void 0;
  };

  Memo.prototype.resize = function() {
    var depth, dims, height, width;
    if (this.bind.source == null) {
      return;
    }
    dims = this.bind.source.getActiveDimensions();
    width = dims.width, height = dims.height, depth = dims.depth;
    this.compose.cover(width, height, depth);
    return Memo.__super__.resize.apply(this, arguments);
  };

  Memo.prototype.change = function(changed, touched, init) {
    if (touched['texture'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Memo;

})(Operator);

module.exports = Memo;


},{"../../../util":172,"./operator":77}],77:[function(require,module,exports){
var Operator, Source,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Source = require('../base/source');

Operator = (function(_super) {
  __extends(Operator, _super);

  function Operator() {
    return Operator.__super__.constructor.apply(this, arguments);
  }

  Operator.traits = ['node', 'bind', 'operator', 'source', 'index'];

  Operator.prototype.indexShader = function(shader) {
    var _ref;
    return (_ref = this.bind.source) != null ? typeof _ref.indexShader === "function" ? _ref.indexShader(shader) : void 0 : void 0;
  };

  Operator.prototype.sourceShader = function(shader) {
    var _ref;
    return (_ref = this.bind.source) != null ? typeof _ref.sourceShader === "function" ? _ref.sourceShader(shader) : void 0 : void 0;
  };

  Operator.prototype.getDimensions = function() {
    return this.bind.source.getDimensions();
  };

  Operator.prototype.getFutureDimensions = function() {
    return this.bind.source.getFutureDimensions();
  };

  Operator.prototype.getActiveDimensions = function() {
    return this.bind.source.getActiveDimensions();
  };

  Operator.prototype.getIndexDimensions = function() {
    return this.bind.source.getIndexDimensions();
  };

  Operator.prototype.init = function() {
    return this.sourceSpec = [
      {
        to: 'operator.source',
        trait: 'source'
      }
    ];
  };

  Operator.prototype.make = function() {
    Operator.__super__.make.apply(this, arguments);
    return this._helpers.bind.make(this.sourceSpec);
  };

  Operator.prototype.made = function() {
    this.resize();
    return Operator.__super__.made.apply(this, arguments);
  };

  Operator.prototype.unmake = function() {
    return this._helpers.bind.unmake();
  };

  Operator.prototype.resize = function(rebuild) {
    return this.trigger({
      type: 'source.resize'
    });
  };

  return Operator;

})(Source);

module.exports = Operator;


},{"../base/source":49}],78:[function(require,module,exports){
var Operator, Repeat,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Repeat = (function(_super) {
  __extends(Repeat, _super);

  function Repeat() {
    return Repeat.__super__.constructor.apply(this, arguments);
  }

  Repeat.traits = ['node', 'bind', 'operator', 'source', 'index', 'repeat'];

  Repeat.prototype.indexShader = function(shader) {
    shader.pipe(this.operator);
    return Repeat.__super__.indexShader.call(this, shader);
  };

  Repeat.prototype.sourceShader = function(shader) {
    shader.pipe(this.operator);
    return Repeat.__super__.sourceShader.call(this, shader);
  };

  Repeat.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Repeat.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Repeat.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Repeat.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Repeat.prototype._resample = function(dims) {
    var r;
    r = this.resample;
    return {
      items: r.items * dims.items,
      width: r.width * dims.width,
      height: r.height * dims.height,
      depth: r.depth * dims.depth
    };
  };

  Repeat.prototype.make = function() {
    var transform, uniforms;
    Repeat.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    this.resample = {};
    uniforms = {
      repeatModulus: this._attributes.make(this._types.vec4())
    };
    this.repeatModulus = uniforms.repeatModulus;
    transform = this._shaders.shader();
    transform.pipe('repeat.position', uniforms);
    return this.operator = transform;
  };

  Repeat.prototype.unmake = function() {
    return Repeat.__super__.unmake.apply(this, arguments);
  };

  Repeat.prototype.resize = function() {
    var dims;
    if (this.bind.source != null) {
      dims = this.bind.source.getActiveDimensions();
      this.repeatModulus.value.set(dims.width, dims.height, dims.depth, dims.items);
    }
    return Repeat.__super__.resize.apply(this, arguments);
  };

  Repeat.prototype.change = function(changed, touched, init) {
    var key, _i, _len, _ref, _results;
    if (touched['operator'] || touched['repeat']) {
      return this.rebuild();
    }
    if (init) {
      _ref = ['items', 'width', 'height', 'depth'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        _results.push(this.resample[key] = this.props[key]);
      }
      return _results;
    }
  };

  return Repeat;

})(Operator);

module.exports = Repeat;


},{"./operator":77}],79:[function(require,module,exports){
var Operator, Resample, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');

Resample = (function(_super) {
  __extends(Resample, _super);

  function Resample() {
    return Resample.__super__.constructor.apply(this, arguments);
  }

  Resample.traits = ['node', 'bind', 'operator', 'source', 'index', 'resample', 'sampler:width', 'sampler:height', 'sampler:depth', 'sampler:items', 'include'];

  Resample.prototype.indexShader = function(shader) {
    shader.pipe(this.indexer);
    return Resample.__super__.indexShader.call(this, shader);
  };

  Resample.prototype.sourceShader = function(shader) {
    return shader.pipe(this.operator);
  };

  Resample.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Resample.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Resample.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Resample.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Resample.prototype._resample = function(dims) {
    var r;
    r = this.resampled;
    if (this.relativeSize) {
      if (r.items != null) {
        dims.items *= r.items;
      }
      if (r.width != null) {
        dims.width *= r.width;
      }
      if (r.height != null) {
        dims.height *= r.height;
      }
      if (r.depth != null) {
        dims.depth *= r.depth;
      }
    } else {
      if (r.items != null) {
        dims.items = r.items;
      }
      if (r.width != null) {
        dims.width = r.width;
      }
      if (r.height != null) {
        dims.height = r.height;
      }
      if (r.depth != null) {
        dims.depth = r.depth;
      }
    }
    return dims;
  };

  Resample.prototype.make = function() {
    var any, centered, depth, dimensions, height, i, indexer, indices, items, key, operator, relativeSample, relativeSize, sample, shader, shifted, size, type, uniforms, vec, width, _i, _len, _ref;
    Resample.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    this._helpers.bind.make([
      {
        to: 'include.shader',
        trait: 'shader',
        optional: true
      }
    ]);
    indices = this._get('resample.indices');
    dimensions = this._get('resample.channels');
    shader = this.bind.shader;
    sample = this._get('resample.sample');
    size = this._get('resample.size');
    items = this._get('resample.items');
    width = this._get('resample.width');
    height = this._get('resample.height');
    depth = this._get('resample.depth');
    relativeSample = sample === this.node.attributes['resample.sample']["enum"].relative;
    relativeSize = size === this.node.attributes['resample.size']["enum"].relative;
    this.resampled = {};
    if (items != null) {
      this.resampled.items = items;
    }
    if (width != null) {
      this.resampled.width = width;
    }
    if (height != null) {
      this.resampled.height = height;
    }
    if (depth != null) {
      this.resampled.depth = depth;
    }
    operator = this._shaders.shader();
    indexer = this._shaders.shader();
    type = [null, this._types.number, this._types.vec2, this._types.vec3, this._types.vec4][indices];
    uniforms = {
      dataSize: this._attributes.make(type(0, 0, 0, 0)),
      dataResolution: this._attributes.make(type(0, 0, 0, 0)),
      dataOffset: this._attributes.make(this._types.vec2(.5, .5)),
      targetSize: this._attributes.make(type(0, 0, 0, 0)),
      targetResolution: this._attributes.make(type(0, 0, 0, 0)),
      targetOffset: this._attributes.make(this._types.vec2(.5, .5)),
      resampleFactor: this._attributes.make(this._types.vec4(0, 0, 0, 0)),
      resampleBias: this._attributes.make(this._types.vec4(0, 0, 0, 0))
    };
    this.dataResolution = uniforms.dataResolution;
    this.dataSize = uniforms.dataSize;
    this.targetResolution = uniforms.targetResolution;
    this.targetSize = uniforms.targetSize;
    this.resampleFactor = uniforms.resampleFactor;
    this.resampleBias = uniforms.resampleBias;
    shifted = false;
    operator.pipe('resample.padding', uniforms);
    vec = [];
    any = false;
    _ref = ['width', 'height', 'depth', 'items'];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      key = _ref[i];
      centered = this._get("" + key + ".sampler.centered");
      any || (any = centered);
      vec[i] = centered ? "0.5" : "0.0";
    }
    if (any) {
      shifted = true;
      vec = "vec4(" + vec + ")";
      operator.pipe(Util.GLSL.binaryOperator(4, '+', vec4));
    }
    if (relativeSample) {
      if ((items != null) || (width != null) || (height != null) || (depth != null)) {
        operator.pipe('resample.relative', uniforms);
        indexer.pipe('resample.relative', uniforms);
      } else {
        indexer.pipe(Util.GLSL.identity('vec4'));
      }
    }
    if (shader != null) {
      if (indices !== 4) {
        operator.pipe(Util.GLSL.truncateVec(4, indices));
      }
      operator.callback();
      if (indices !== 4) {
        operator.pipe(Util.GLSL.extendVec(indices, 4));
      }
      if (shifted) {
        operator.pipe(Util.GLSL.binaryOperator(4, '-', vec));
      }
      operator.pipe(this.bind.source.sourceShader(this._shaders.shader()));
      if (dimensions !== 4) {
        operator.pipe(Util.GLSL.truncateVec(4, dimensions));
      }
      operator.join();
      if (this.bind.shader != null) {
        operator.pipe(this.bind.shader.shaderBind(uniforms));
      }
      if (dimensions !== 4) {
        operator.pipe(Util.GLSL.extendVec(dimensions, 4));
      }
    } else {
      if (shifted) {
        operator.pipe(Util.GLSL.binaryOperator(4, '-', vec));
      }
      operator.pipe(this.bind.source.sourceShader(this._shaders.shader()));
    }
    this.operator = operator;
    this.indexer = indexer;
    this.indices = indices;
    this.relativeSample = relativeSample;
    return this.relativeSize = relativeSize;
  };

  Resample.prototype.unmake = function() {
    Resample.__super__.unmake.apply(this, arguments);
    return this.operator = null;
  };

  Resample.prototype.resize = function() {
    var axis, bd, bh, bi, bw, dims, rd, rh, ri, rw, target, _ref, _ref1, _ref2, _ref3;
    if (this.bind.source == null) {
      return;
    }
    dims = this.bind.source.getActiveDimensions();
    target = this.getActiveDimensions();
    axis = (function(_this) {
      return function(key) {
        var centered, pad, res;
        centered = _this._get("" + key + ".sampler.centered");
        pad = _this._get("" + key + ".sampler.padding");
        target[key] += pad * 2;
        res = centered ? dims[key] / Math.max(1, target[key]) : Math.max(1, dims[key] - 1) / Math.max(1, target[key] - 1);
        return [res, pad];
      };
    })(this);
    _ref = axis('width'), rw = _ref[0], bw = _ref[1];
    _ref1 = axis('height'), rh = _ref1[0], bh = _ref1[1];
    _ref2 = axis('depth'), rd = _ref2[0], bd = _ref2[1];
    _ref3 = axis('items'), ri = _ref3[0], bi = _ref3[1];
    if (this.indices === 1) {
      this.dataResolution.value = 1 / dims.width;
      this.targetResolution.value = 1 / target.width;
      this.dataSize.value = dims.width;
      this.targetSize.value = target.width;
      this.resampleFactor.value = rw;
      this.resampleBias.value = bw;
    } else {
      this.dataResolution.value.set(1 / dims.width, 1 / dims.height, 1 / dims.depth, 1 / dims.items);
      this.targetResolution.value.set(1 / target.width, 1 / target.height, 1 / target.depth, 1 / target.items);
      this.dataSize.value.set(dims.width, dims.height, dims.depth, dims.items);
      this.targetSize.value.set(target.width, target.height, target.depth, target.items);
      this.resampleFactor.value.set(rw, rh, rd, ri);
      this.resampleBias.value.set(bw, bh, bd, bi);
    }
    return Resample.__super__.resize.apply(this, arguments);
  };

  Resample.prototype.change = function(changed, touched, init) {
    if (touched['operator'] || touched['resample'] || touched['sampler'] || touched['include']) {
      return this.rebuild();
    }
  };

  return Resample;

})(Operator);

module.exports = Resample;


},{"../../../util":172,"./operator":77}],80:[function(require,module,exports){
var Operator, Slice, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');

Slice = (function(_super) {
  __extends(Slice, _super);

  function Slice() {
    return Slice.__super__.constructor.apply(this, arguments);
  }

  Slice.traits = ['node', 'bind', 'operator', 'source', 'index', 'slice'];

  Slice.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Slice.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Slice.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Slice.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Slice.prototype.sourceShader = function(shader) {
    shader.pipe('slice.position', this.uniforms);
    return this.bind.source.sourceShader(shader);
  };

  Slice.prototype._resolve = function(key, dims) {
    var dim, end, index, range, start;
    range = this.props[key];
    dim = dims[key];
    if (range == null) {
      return [0, dim];
    }
    index = function(i, dim) {
      if (i < 0) {
        return dim + i;
      } else {
        return i;
      }
    };
    start = index(Math.round(range.x), dim);
    end = index(Math.round(range.y), dim);
    end = Math.max(start, end);
    return [start, end - start];
  };

  Slice.prototype._resample = function(dims) {
    dims.width = this._resolve('width', dims)[1];
    dims.height = this._resolve('height', dims)[1];
    dims.depth = this._resolve('depth', dims)[1];
    dims.items = this._resolve('items', dims)[1];
    return dims;
  };

  Slice.prototype.make = function() {
    Slice.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    return this.uniforms = {
      sliceOffset: this._attributes.make(this._types.vec4())
    };
  };

  Slice.prototype.unmake = function() {
    return Slice.__super__.unmake.apply(this, arguments);
  };

  Slice.prototype.resize = function() {
    var dims;
    if (this.bind.source == null) {
      return;
    }
    dims = this.bind.source.getActiveDimensions();
    this.uniforms.sliceOffset.value.set(this._resolve('width', dims)[0], this._resolve('height', dims)[0], this._resolve('depth', dims)[0], this._resolve('items', dims)[0]);
    return Slice.__super__.resize.apply(this, arguments);
  };

  Slice.prototype.change = function(changed, touched, init) {
    if (touched['operator']) {
      return this.rebuild();
    }
    if (touched['slice']) {
      return this.resize();
    }
  };

  return Slice;

})(Operator);

module.exports = Slice;


},{"../../../util":172,"./operator":77}],81:[function(require,module,exports){
var Operator, Split, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');


/*
split:
  order:       Types.transpose('wxyz')
  axis:        Types.axis()
  length:      Types.int(1)
  overlap:     Types.int(0)
 */

Split = (function(_super) {
  __extends(Split, _super);

  function Split() {
    return Split.__super__.constructor.apply(this, arguments);
  }

  Split.traits = ['node', 'bind', 'operator', 'source', 'index', 'split'];

  Split.prototype.indexShader = function(shader) {
    shader.pipe(this.operator);
    return Split.__super__.indexShader.call(this, shader);
  };

  Split.prototype.sourceShader = function(shader) {
    shader.pipe(this.operator);
    return Split.__super__.sourceShader.call(this, shader);
  };

  Split.prototype.getDimensions = function() {
    return this._resample(this.bind.source.getDimensions());
  };

  Split.prototype.getActiveDimensions = function() {
    return this._resample(this.bind.source.getActiveDimensions());
  };

  Split.prototype.getFutureDimensions = function() {
    return this._resample(this.bind.source.getFutureDimensions());
  };

  Split.prototype.getIndexDimensions = function() {
    return this._resample(this.bind.source.getIndexDimensions());
  };

  Split.prototype._resample = function(dims) {
    var axis, dim, i, index, labels, length, mapped, order, out, overlap, remain, set, stride, _i, _len;
    order = this.order;
    axis = this.axis;
    overlap = this.overlap;
    length = this.length;
    stride = this.stride;
    labels = ['width', 'height', 'depth', 'items'];
    mapped = order.map(function(x) {
      return labels[x - 1];
    });
    index = order.indexOf(axis);
    set = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = mapped.length; _i < _len; _i++) {
        dim = mapped[_i];
        _results.push(dims[dim]);
      }
      return _results;
    })();
    remain = Math.floor((set[index] - overlap) / stride);
    set.splice(index, 1, length, remain);
    set = set.slice(0, 4);
    out = {};
    for (i = _i = 0, _len = mapped.length; _i < _len; i = ++_i) {
      dim = mapped[i];
      out[dim] = set[i];
    }
    return out;
  };

  Split.prototype.make = function() {
    var axis, index, length, order, overlap, permute, rest, split, stride, transform, uniforms, _ref;
    Split.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    order = this.props.order;
    axis = this.props.axis;
    overlap = this.props.overlap;
    length = this.props.length;

    /*
    Calculate index transform
    
    order: wxyz
    length: 3
    overlap: 1
    
    axis: w
    index: 0
    split: wx
    rest:  0yz0
           s
    
    axis: x
    index: 1
    split: xy
    rest:  w0z0
            s
    
    axis: y
    index: 2
    split: yz
    rest:  wx00
             s
    
    axis: z
    index: 3
    split: z0
    rest: wxy0
             s
     */
    permute = order.join('');
    if (axis == null) {
      axis = order[0];
    }
    index = permute.indexOf(axis);
    split = permute[index] + ((_ref = permute[index + 1]) != null ? _ref : 0);
    rest = permute.replace(split[1], '').replace(split[0], '0') + '0';
    overlap = Math.min(length - 1, overlap);
    stride = length - overlap;
    uniforms = {
      splitStride: this._attributes.make(this._types.number(stride))
    };
    transform = this._shaders.shader();
    transform.require(Util.GLSL.swizzleVec4(split, 2));
    transform.require(Util.GLSL.swizzleVec4(rest, 4));
    transform.require(Util.GLSL.injectVec4(index));
    transform.pipe('split.position', uniforms);
    transform.pipe(Util.GLSL.invertSwizzleVec4(order));
    this.operator = transform;
    this.order = order;
    this.axis = axis;
    this.overlap = overlap;
    this.length = length;
    return this.stride = stride;
  };

  Split.prototype.unmake = function() {
    return Split.__super__.unmake.apply(this, arguments);
  };

  Split.prototype.change = function(changed, touched, init) {
    if (changed['split.axis'] || changed['split.order'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Split;

})(Operator);

module.exports = Split;


},{"../../../util":172,"./operator":77}],82:[function(require,module,exports){
var Operator, Spread,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Spread = (function(_super) {
  __extends(Spread, _super);

  function Spread() {
    return Spread.__super__.constructor.apply(this, arguments);
  }

  Spread.traits = ['node', 'bind', 'operator', 'source', 'index', 'spread'];

  Spread.prototype.sourceShader = function(shader) {
    return shader.pipe(this.operator);
  };

  Spread.prototype.make = function() {
    var transform, uniforms;
    Spread.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    uniforms = {
      spreadMatrix: this._attributes.make(this._types.mat4()),
      spreadOffset: this._attributes.make(this._types.vec4())
    };
    this.spreadMatrix = uniforms.spreadMatrix;
    this.spreadOffset = uniforms.spreadOffset;
    transform = this._shaders.shader();
    transform.require(this.bind.source.sourceShader(this._shaders.shader()));
    transform.pipe('spread.position', uniforms);
    return this.operator = transform;
  };

  Spread.prototype.unmake = function() {
    return Spread.__super__.unmake.apply(this, arguments);
  };

  Spread.prototype.resize = function() {
    this.update();
    return Spread.__super__.resize.apply(this, arguments);
  };

  Spread.prototype.update = function() {
    var align, anchor, d, dims, els, i, k, key, map, matrix, offset, order, spread, unit, unitEnum, v, _i, _len, _ref, _results;
    dims = this.bind.source.getFutureDimensions();
    matrix = this.spreadMatrix.value;
    els = matrix.elements;
    order = ['width', 'height', 'depth', 'items'];
    align = ['alignWidth', 'alignHeight', 'alignDepth', 'alignItems'];
    unit = this.props.unit;
    unitEnum = this.node.attributes['spread.unit']["enum"];
    map = (function() {
      switch (unit) {
        case unitEnum.relative:
          return function(key, i, k, v) {
            return els[i * 4 + k] = v / Math.max(1, dims[key] - 1);
          };
        case unitEnum.absolute:
          return function(key, i, k, v) {
            return els[i * 4 + k] = v;
          };
      }
    })();
    _results = [];
    for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
      key = order[i];
      spread = this.props[key];
      anchor = this.props[align[i]];
      if (spread != null) {
        d = (_ref = dims[key]) != null ? _ref : 1;
        offset = -(d - 1) * (.5 - anchor * .5);
      } else {
        offset = 0;
      }
      this.spreadOffset.value.setComponent(i, offset);
      _results.push((function() {
        var _j, _ref1, _results1;
        _results1 = [];
        for (k = _j = 0; _j <= 3; k = ++_j) {
          v = (_ref1 = spread != null ? spread.getComponent(k) : void 0) != null ? _ref1 : 0;
          _results1.push(els[i * 4 + k] = map(key, i, k, v));
        }
        return _results1;
      })());
    }
    return _results;
  };

  Spread.prototype.change = function(changed, touched, init) {
    if (touched['operator']) {
      return this.rebuild();
    }
    if (touched['spread']) {
      return this.update();
    }
  };

  return Spread;

})(Operator);

module.exports = Spread;


},{"./operator":77}],83:[function(require,module,exports){
var Operator, Swizzle, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');

Swizzle = (function(_super) {
  __extends(Swizzle, _super);

  function Swizzle() {
    return Swizzle.__super__.constructor.apply(this, arguments);
  }

  Swizzle.traits = ['node', 'bind', 'operator', 'source', 'index', 'swizzle'];

  Swizzle.prototype.sourceShader = function(shader) {
    shader = Swizzle.__super__.sourceShader.call(this, shader);
    if (this.swizzler) {
      shader.pipe(this.swizzler);
    }
    return shader;
  };

  Swizzle.prototype.make = function() {
    var order;
    Swizzle.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    order = this.props.order;
    if (order.join() !== '1234') {
      return this.swizzler = Util.GLSL.swizzleVec4(order, 4);
    }
  };

  Swizzle.prototype.unmake = function() {
    Swizzle.__super__.unmake.apply(this, arguments);
    return this.swizzler = null;
  };

  Swizzle.prototype.change = function(changed, touched, init) {
    if (touched['swizzle'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Swizzle;

})(Operator);

module.exports = Swizzle;


},{"../../../util":172,"./operator":77}],84:[function(require,module,exports){
var Operator, Transpose, Util, labels,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('./operator');

Util = require('../../../util');

labels = {
  1: 'width',
  2: 'height',
  3: 'depth',
  4: 'items'
};

Transpose = (function(_super) {
  __extends(Transpose, _super);

  function Transpose() {
    return Transpose.__super__.constructor.apply(this, arguments);
  }

  Transpose.traits = ['node', 'bind', 'operator', 'source', 'index', 'transpose'];

  Transpose.prototype.indexShader = function(shader) {
    if (this.swizzler) {
      shader.pipe(this.swizzler);
    }
    return Transpose.__super__.indexShader.call(this, shader);
  };

  Transpose.prototype.sourceShader = function(shader) {
    if (this.swizzler) {
      shader.pipe(this.swizzler);
    }
    return Transpose.__super__.sourceShader.call(this, shader);
  };

  Transpose.prototype.getDimensions = function() {
    return this._remap(this.transpose, this.bind.source.getDimensions());
  };

  Transpose.prototype.getActiveDimensions = function() {
    return this._remap(this.transpose, this.bind.source.getActiveDimensions());
  };

  Transpose.prototype.getFutureDimensions = function() {
    return this._remap(this.transpose, this.bind.source.getFutureDimensions());
  };

  Transpose.prototype.getIndexDimensions = function() {
    return this._remap(this.transpose, this.bind.source.getIndexDimensions());
  };

  Transpose.prototype._remap = function(transpose, dims) {
    var dst, i, out, src, _i, _ref;
    out = {};
    for (i = _i = 0; _i <= 3; i = ++_i) {
      dst = labels[i + 1];
      src = labels[transpose[i]];
      out[dst] = (_ref = dims[src]) != null ? _ref : 1;
    }
    return out;
  };

  Transpose.prototype.make = function() {
    var order;
    Transpose.__super__.make.apply(this, arguments);
    if (this.bind.source == null) {
      return;
    }
    order = this.props.order;
    if (order.join() !== '1234') {
      this.swizzler = Util.GLSL.invertSwizzleVec4(order);
    }
    this.transpose = order;
    return this.trigger({
      type: 'source.rebuild'
    });
  };

  Transpose.prototype.unmake = function() {
    Transpose.__super__.unmake.apply(this, arguments);
    return this.swizzler = null;
  };

  Transpose.prototype.change = function(changed, touched, init) {
    if (touched['transpose'] || touched['operator']) {
      return this.rebuild();
    }
  };

  return Transpose;

})(Operator);

module.exports = Transpose;


},{"../../../util":172,"./operator":77}],85:[function(require,module,exports){
var DOM, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

DOM = (function(_super) {
  __extends(DOM, _super);

  function DOM() {
    return DOM.__super__.constructor.apply(this, arguments);
  }

  DOM.traits = ['node', 'bind', 'object', 'visible', 'overlay', 'dom', 'attach', 'position'];

  DOM.prototype.init = function() {
    this.emitter = this.root = null;
    return this.active = {};
  };

  DOM.prototype.make = function() {
    var depth, height, htmlDims, indexer, items, pointDims, position, projection, width;
    DOM.__super__.make.apply(this, arguments);
    this._helpers.bind.make([
      {
        to: 'dom.html',
        trait: 'html'
      }, {
        to: 'dom.points',
        trait: 'source'
      }
    ]);
    if (!((this.bind.points != null) && (this.bind.html != null))) {
      return;
    }
    this.root = this._inherit('root');
    this._listen('root', 'root.update', this.update);
    this._listen('root', 'root.post', this.post);
    pointDims = this.bind.points.getDimensions();
    htmlDims = this.bind.html.getDimensions();
    items = Math.min(pointDims.items, htmlDims.items);
    width = Math.min(pointDims.width, htmlDims.width);
    height = Math.min(pointDims.height, htmlDims.height);
    depth = Math.min(pointDims.depth, htmlDims.depth);
    position = this.bind.points.sourceShader(this._shaders.shader());
    position = this._helpers.position.pipeline(position);
    projection = this._shaders.shader({
      globals: ['projectionMatrix']
    });
    projection.pipe('project.readback');
    position.pipe(projection);
    indexer = this._shaders.shader();
    this.readback = this._renderables.make('readback', {
      map: position,
      indexer: indexer,
      items: items,
      width: width,
      height: height,
      depth: depth,
      channels: 4,
      stpq: true
    });
    this.dom = this._overlays.make('dom');
    this.dom.hint(items * width * height * depth * 2);
    this.readback.setCallback(this.emitter = this.callback(this.bind.html.nodes()));
    return this._helpers.visible.make();
  };

  DOM.prototype.unmake = function() {
    if (this.readback != null) {
      this.readback.dispose();
      this.dom.dispose();
      this.readback = this.dom = null;
      this.root = null;
      this.emitter = null;
      this.active = {};
    }
    this._helpers.bind.unmake();
    return this._helpers.visible.unmake();
  };

  DOM.prototype.update = function() {
    var _ref;
    if (this.readback == null) {
      return;
    }
    if (this.props.visible) {
      this.readback.update((_ref = this.root) != null ? _ref.getCamera() : void 0);
      this.readback.post();
      return this.readback.iterate();
    }
  };

  DOM.prototype.post = function() {
    if (this.readback == null) {
      return;
    }
    return this.dom.render(this.isVisible ? this.emitter.nodes() : []);
  };

  DOM.prototype.callback = function(data) {
    var attr, className, color, colorString, depth, el, f, height, nodes, offset, opacity, outline, pointer, size, snap, strideI, strideJ, strideK, styles, uniforms, width, zIndex, zoom;
    uniforms = this._inherit('unit').getUnitUniforms();
    width = uniforms.viewWidth;
    height = uniforms.viewHeight;
    attr = this.node.attributes['dom.attributes'];
    size = this.node.attributes['dom.size'];
    zoom = this.node.attributes['dom.zoom'];
    color = this.node.attributes['dom.color'];
    outline = this.node.attributes['dom.outline'];
    pointer = this.node.attributes['dom.pointerEvents'];
    opacity = this.node.attributes['overlay.opacity'];
    zIndex = this.node.attributes['overlay.zIndex'];
    offset = this.node.attributes['attach.offset'];
    depth = this.node.attributes['attach.depth'];
    snap = this.node.attributes['attach.snap'];
    el = this.dom.el;
    nodes = [];
    styles = null;
    className = null;
    strideI = strideJ = strideK = 0;
    colorString = '';
    f = function(x, y, z, w, i, j, k, l) {
      var a, alpha, children, clip, flatZ, index, iw, ox, oy, props, s, scale, v, xx, yy, _ref;
      index = l + strideI * i + strideJ * j + strideK * k;
      children = data[index];
      clip = w < 0;
      iw = 1 / w;
      flatZ = 1 + (iw - 1) * depth.value;
      scale = clip ? 0 : flatZ;
      ox = +offset.value.x * scale;
      oy = +offset.value.y * scale;
      xx = (x + 1) * width.value * .5 + ox;
      yy = (y - 1) * height.value * .5 + oy;
      xx /= zoom.value;
      yy /= zoom.value;
      if (snap.value) {
        xx = Math.round(xx);
        yy = Math.round(yy);
      }
      alpha = Math.min(.999, clip ? 0 : opacity.value);
      props = {
        className: className,
        style: {
          transform: "translate3d(" + xx + "px, " + (-yy) + "px, " + (1 - w) + "px) translate(-50%, -50%) scale(" + scale + "," + scale + ")",
          opacity: alpha
        }
      };
      for (k in styles) {
        v = styles[k];
        props.style[k] = v;
      }
      a = attr.value;
      if (a != null) {
        s = a.style;
        for (k in a) {
          v = a[k];
          if (k !== 'style' && k !== 'className') {
            props[k] = v;
          }
        }
        if (s != null) {
          for (k in s) {
            v = s[k];
            props.style[k] = v;
          }
        }
      }
      props.className += ' ' + ((_ref = a != null ? a.className : void 0) != null ? _ref : 'mathbox-label');
      return nodes.push(el('div', props, children));
    };
    f.reset = (function(_this) {
      return function() {
        var c, m, _ref;
        nodes = [];
        _ref = [_this.strideI, _this.strideJ, _this.strideK], strideI = _ref[0], strideJ = _ref[1], strideK = _ref[2];
        c = color.value;
        m = function(x) {
          return Math.floor(x * 255);
        };
        colorString = c ? "rgb(" + [m(c.x), m(c.y), m(c.z)] + ")" : '';
        className = "mathbox-outline-" + (Math.round(outline.value));
        styles = {};
        if (c) {
          styles.color = colorString;
        }
        styles.fontSize = "" + size.value + "px";
        if (zoom.value !== 1) {
          styles.zoom = zoom.value;
        }
        if (zIndex.value > 0) {
          styles.zIndex = zIndex.value;
        }
        if (pointer.value) {
          return styles.pointerEvents = 'auto';
        }
      };
    })(this);
    f.nodes = function() {
      return nodes;
    };
    return f;
  };

  DOM.prototype.resize = function() {
    var depth, height, htmlDims, items, pointDims, sI, sJ, sK, width;
    if (this.readback == null) {
      return;
    }
    pointDims = this.bind.points.getActiveDimensions();
    htmlDims = this.bind.html.getActiveDimensions();
    items = Math.min(pointDims.items, htmlDims.items);
    width = Math.min(pointDims.width, htmlDims.width);
    height = Math.min(pointDims.height, htmlDims.height);
    depth = Math.min(pointDims.depth, htmlDims.depth);
    this.readback.setActive(items, width, height, depth);
    this.strideI = sI = htmlDims.items;
    this.strideJ = sJ = sI * htmlDims.width;
    return this.strideK = sK = sJ * htmlDims.height;
  };

  DOM.prototype.change = function(changed, touched, init) {
    if (changed['dom.html'] || changed['dom.points']) {
      return this.rebuild();
    }
  };

  return DOM;

})(Primitive);

module.exports = DOM;


},{"../../../util":172,"../../primitive":44}],86:[function(require,module,exports){
var HTML, Util, Voxel,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Voxel = require('../data/voxel');

Util = require('../../../util');

HTML = (function(_super) {
  __extends(HTML, _super);

  function HTML() {
    return HTML.__super__.constructor.apply(this, arguments);
  }

  HTML.traits = ['node', 'buffer', 'active', 'data', 'voxel', 'html'];

  HTML.defaults = {
    channels: 1
  };

  HTML.prototype.init = function() {
    HTML.__super__.init.apply(this, arguments);
    return this.storage = 'pushBuffer';
  };

  HTML.prototype.make = function() {
    var depth, height, items, width, _ref;
    HTML.__super__.make.apply(this, arguments);
    _ref = this.getDimensions(), items = _ref.items, width = _ref.width, height = _ref.height, depth = _ref.depth;
    this.dom = this._overlays.make('dom');
    return this.dom.hint(items * width * height * depth);
  };

  HTML.prototype.unmake = function() {
    HTML.__super__.unmake.apply(this, arguments);
    if (this.dom != null) {
      this.dom.dispose();
      return this.dom = null;
    }
  };

  HTML.prototype.update = function() {
    return HTML.__super__.update.apply(this, arguments);
  };

  HTML.prototype.change = function(changed, touched, init) {
    if (touched['html']) {
      return this.rebuild();
    }
    return HTML.__super__.change.call(this, changed, touched, init);
  };

  HTML.prototype.nodes = function() {
    return this.buffer.read();
  };

  HTML.prototype.callback = function(callback) {
    var el;
    el = this.dom.el;
    if (callback.length <= 6) {
      return function(emit, i, j, k, l) {
        return callback(emit, el, i, j, k, l);
      };
    } else {
      return (function(_this) {
        return function(emit, i, j, k, l) {
          return callback(emit, el, i, j, k, l, _this.bufferClock, _this.bufferStep);
        };
      })(this);
    }
  };

  return HTML;

})(Voxel);

module.exports = HTML;


},{"../../../util":172,"../data/voxel":61}],87:[function(require,module,exports){
var Move, Transition,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transition = require('./transition');

Move = (function(_super) {
  __extends(Move, _super);

  function Move() {
    return Move.__super__.constructor.apply(this, arguments);
  }

  Move.traits = ['node', 'transition', 'vertex', 'move', 'visible', 'active'];

  Move.prototype.make = function() {
    var k, v, _ref;
    Move.__super__.make.apply(this, arguments);
    _ref = {
      moveFrom: this.node.attributes['move.from'],
      moveTo: this.node.attributes['move.to']
    };
    for (k in _ref) {
      v = _ref[k];
      this.uniforms[k] = v;
    }
  };

  Move.prototype.vertex = function(shader, pass) {
    var _ref, _ref1;
    if (pass === this.props.pass) {
      shader.pipe('move.position', this.uniforms);
    }
    return (_ref = (_ref1 = this._inherit('vertex')) != null ? _ref1.vertex(shader, pass) : void 0) != null ? _ref : shader;
  };

  return Move;

})(Transition);

module.exports = Move;


},{"./transition":94}],88:[function(require,module,exports){
var Play, Track,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Track = require('./track');

Play = (function(_super) {
  __extends(Play, _super);

  function Play() {
    return Play.__super__.constructor.apply(this, arguments);
  }

  Play.traits = ['node', 'track', 'trigger', 'play', 'bind'];

  Play.prototype.init = function() {
    Play.__super__.init.apply(this, arguments);
    return this.skew = null;
  };

  Play.prototype.reset = function(go) {
    if (go == null) {
      go = true;
    }
    return this.skew = go ? 0 : null;
  };

  Play.prototype.make = function() {
    var parentClock;
    Play.__super__.make.apply(this, arguments);
    this._listen('slide', 'slide.step', (function(_this) {
      return function(e) {
        var trigger;
        trigger = _this.props.trigger;
        if ((trigger != null) && e.index === trigger) {
          return _this.reset();
        }
        if ((trigger != null) && e.index === 0) {
          return _this.reset(false);
        }
      };
    })(this));
    if (!this.props.trigger || (this._inherit('slide') == null)) {
      this.reset();
    }
    parentClock = this._inherit('clock');
    return this._listen(parentClock, 'clock.tick', (function(_this) {
      return function() {
        var delay, delta, from, now, offset, pace, ratio, realtime, speed, time, to, _ref;
        _ref = _this.props, from = _ref.from, to = _ref.to, speed = _ref.speed, pace = _ref.pace, delay = _ref.delay, realtime = _ref.realtime;
        time = parentClock.getTime();
        _this.playhead = _this.skew != null ? (now = realtime ? time.time : time.clock, delta = realtime ? time.delta : time.step, ratio = speed / pace, _this.skew += delta * (ratio - 1), offset = Math.max(0, now + _this.skew - delay * ratio), _this.props.loop ? offset = offset % (to - from) : void 0, _this.playhead = Math.min(to, from + offset)) : 0;
        return _this.update();
      };
    })(this));
  };

  Play.prototype.update = function() {
    return Play.__super__.update.apply(this, arguments);
  };

  Play.prototype.change = function(changed, touched, init) {
    if (changed['trigger.trigger'] || changed['play.realtime']) {
      return this.rebuild();
    }
    return Play.__super__.change.call(this, changed, touched, init);
  };

  return Play;

})(Track);

module.exports = Play;


},{"./track":93}],89:[function(require,module,exports){
var Parent, Present, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Util = require('../../../util');

Present = (function(_super) {
  __extends(Present, _super);

  function Present() {
    return Present.__super__.constructor.apply(this, arguments);
  }

  Present.traits = ['node', 'present'];

  Present.prototype.init = function() {};

  Present.prototype.make = function() {
    this.nodes = [];
    this.steps = [];
    this.length = 0;
    this.last = [];
    this.index = 0;
    this.dirty = [];
    this._listen('root', 'root.update', this.update);
    return this._compute('present.length', (function(_this) {
      return function() {
        return _this.length;
      };
    })(this));
  };

  Present.prototype.adopt = function(controller) {
    var node;
    node = controller.node;
    if (this.nodes.indexOf(controller) < 0) {
      this.nodes.push(node);
    }
    return this.dirty.push(controller);
  };

  Present.prototype.unadopt = function(controller) {
    var node;
    node = controller.node;
    this.nodes = this.nodes.filter(function(x) {
      return x !== controller;
    });
    return this.dirty.push(controller);
  };

  Present.prototype.update = function() {
    var controller, _i, _len, _ref, _ref1;
    if (!this.dirty.length) {
      return;
    }
    _ref = this.dirty;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      controller = _ref[_i];
      this.slideReset(controller);
    }
    _ref1 = this.process(this.nodes), this.steps = _ref1[0], this.indices = _ref1[1];
    this.length = this.steps.length;
    this.index = null;
    this.go(this.props.index);
    return this.dirty = [];
  };

  Present.prototype.slideLatch = function(controller, enabled, step) {
    return controller.slideLatch(enabled, step);
  };

  Present.prototype.slideStep = function(controller, index, step) {
    return controller.slideStep(this.mapIndex(controller, index), step);
  };

  Present.prototype.slideRelease = function(controller, step) {
    return controller.slideRelease();
  };

  Present.prototype.slideReset = function(controller) {
    return controller.slideReset();
  };

  Present.prototype.mapIndex = function(controller, index) {
    return index - this.indices[controller.node._id];
  };

  Present.prototype.process = function(nodes) {
    var dedupe, expand, finalize, isSibling, isSlide, order, parents, paths, slides, split, steps, traverse;
    slides = function(nodes) {
      var el, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = nodes.length; _i < _len; _i++) {
        el = nodes[_i];
        _results.push(parents(el).filter(isSlide));
      }
      return _results;
    };
    traverse = function(map) {
      return function(el) {
        var ref, _ref, _results;
        _results = [];
        while (el && (_ref = [map(el), el], el = _ref[0], ref = _ref[1], _ref)) {
          _results.push(ref);
        }
        return _results;
      };
    };
    parents = traverse(function(el) {
      if (el.parent.traits.hash.present) {
        return null;
      } else {
        return el.parent;
      }
    });
    isSlide = function(el) {
      return nodes.indexOf(el) >= 0;
    };
    isSibling = function(a, b) {
      var c, d, e, i, _i, _ref;
      c = a.length;
      d = b.length;
      e = c - d;
      if (e !== 0) {
        return false;
      }
      e = Math.min(c, d);
      for (i = _i = _ref = e - 1; _ref <= 0 ? _i < 0 : _i > 0; i = _ref <= 0 ? ++_i : --_i) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    };
    order = function(paths) {
      return paths.sort(function(a, b) {
        var c, d, e, f, g, i, nodeA, nodeB, _i;
        c = a.length;
        d = b.length;
        e = Math.min(c, d);
        for (i = _i = 1; 1 <= e ? _i <= e : _i >= e; i = 1 <= e ? ++_i : --_i) {
          nodeA = a[c - i];
          nodeB = b[d - i];
          f = nodeA.props.order;
          g = nodeB.props.order;
          if ((f != null) || (g != null)) {
            if ((f != null) && (g != null) && ((e = f - g) !== 0)) {
              return e;
            }
            if (f != null) {
              return -1;
            }
            if (g != null) {
              return 1;
            }
          }
          if (nodeB.order !== nodeA.order) {
            return nodeB.order - nodeA.order;
          }
        }
        e = c - d;
        if (e !== 0) {
          return e;
        }
        return 0;
      });
    };
    split = function(steps) {
      var absolute, node, relative, step, _i, _len;
      relative = [];
      absolute = [];
      for (_i = 0, _len = steps.length; _i < _len; _i++) {
        step = steps[_i];
        ((node = step[0]).props.steps != null ? relative : absolute).push(step);
      }
      return [relative, absolute];
    };
    expand = function(lists) {
      var absolute, i, indices, limit, relative, slide, step, steps, _i, _j, _len, _len1;
      relative = lists[0], absolute = lists[1];
      limit = 100;
      indices = {};
      steps = [];
      slide = function(step, index) {
        var childIndex, from, i, node, parent, parentIndex, props, to, _i, _name;
        props = (node = step[0]).props;
        parent = step[1];
        parentIndex = parent != null ? indices[parent._id] : 0;
        childIndex = index;
        from = props.from != null ? parentIndex + props.from : childIndex - props.early;
        to = props.to != null ? parentIndex + props.to : childIndex + props.steps + props.late;
        from = Math.max(0, from);
        to = Math.min(limit, to);
        if (indices[_name = node._id] == null) {
          indices[_name] = from;
        }
        for (i = _i = from; from <= to ? _i < to : _i > to; i = from <= to ? ++_i : --_i) {
          steps[i] = (steps[i] != null ? steps[i] : steps[i] = []).concat(step);
        }
        return props.steps;
      };
      i = 0;
      for (_i = 0, _len = relative.length; _i < _len; _i++) {
        step = relative[_i];
        i += slide(step, i);
      }
      for (_j = 0, _len1 = absolute.length; _j < _len1; _j++) {
        step = absolute[_j];
        slide(step, 0);
      }
      steps = (function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = steps.length; _k < _len2; _k++) {
          step = steps[_k];
          _results.push(finalize(dedupe(step)));
        }
        return _results;
      })();
      return [steps, indices];
    };
    dedupe = function(step) {
      var i, node, _i, _len, _results;
      if (step) {
        _results = [];
        for (i = _i = 0, _len = step.length; _i < _len; i = ++_i) {
          node = step[i];
          if (step.indexOf(node) === i) {
            _results.push(node);
          }
        }
        return _results;
      } else {
        return [];
      }
    };
    finalize = function(step) {
      return step.sort(function(a, b) {
        return a.order - b.order;
      });
    };
    paths = slides(nodes);
    steps = order(paths);
    return expand(split(steps));
  };

  Present.prototype.go = function(index) {
    var active, ascend, descend, enter, exit, last, node, stay, step, toStr, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    index = Math.max(0, Math.min(this.length + 1, +index || 0));
    last = this.last;
    active = (_ref = this.steps[index - 1]) != null ? _ref : [];
    step = this.props.directed ? index - this.index : 1;
    this.index = index;
    enter = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = active.length; _i < _len; _i++) {
        node = active[_i];
        if (this.last.indexOf(node) < 0) {
          _results.push(node);
        }
      }
      return _results;
    }).call(this);
    exit = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.last;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
        if (active.indexOf(node) < 0) {
          _results.push(node);
        }
      }
      return _results;
    }).call(this);
    stay = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = active.length; _i < _len; _i++) {
        node = active[_i];
        if (enter.indexOf(node) < 0 && exit.indexOf(node) < 0) {
          _results.push(node);
        }
      }
      return _results;
    })();
    ascend = function(nodes) {
      return nodes.sort(function(a, b) {
        return a.order - b.order;
      });
    };
    descend = function(nodes) {
      return nodes.sort(function(a, b) {
        return b.order - a.order;
      });
    };
    toStr = function(x) {
      return x.toString();
    };
    _ref1 = ascend(enter);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      node = _ref1[_i];
      this.slideLatch(node.controller, true, step);
    }
    _ref2 = ascend(stay);
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      node = _ref2[_j];
      this.slideLatch(node.controller, null, step);
    }
    _ref3 = ascend(exit);
    for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
      node = _ref3[_k];
      this.slideLatch(node.controller, false, step);
    }
    for (_l = 0, _len3 = enter.length; _l < _len3; _l++) {
      node = enter[_l];
      this.slideStep(node.controller, index, step);
    }
    for (_m = 0, _len4 = stay.length; _m < _len4; _m++) {
      node = stay[_m];
      this.slideStep(node.controller, index, step);
    }
    for (_n = 0, _len5 = exit.length; _n < _len5; _n++) {
      node = exit[_n];
      this.slideStep(node.controller, index, step);
    }
    _ref4 = descend(enter);
    for (_o = 0, _len6 = _ref4.length; _o < _len6; _o++) {
      node = _ref4[_o];
      this.slideRelease(node.controller);
    }
    _ref5 = descend(stay);
    for (_p = 0, _len7 = _ref5.length; _p < _len7; _p++) {
      node = _ref5[_p];
      this.slideRelease(node.controller);
    }
    _ref6 = descend(exit);
    for (_q = 0, _len8 = _ref6.length; _q < _len8; _q++) {
      node = _ref6[_q];
      this.slideRelease(node.controller);
    }
    this.last = active;
  };

  Present.prototype.change = function(changed, touched, init) {
    if (changed['present.index'] || init) {
      return this.go(this.props.index);
    }
  };

  return Present;

})(Parent);

module.exports = Present;


},{"../../../util":172,"../base/parent":47}],90:[function(require,module,exports){
var Reveal, Transition, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transition = require('./transition');

Util = require('../../../util');

Reveal = (function(_super) {
  __extends(Reveal, _super);

  function Reveal() {
    return Reveal.__super__.constructor.apply(this, arguments);
  }

  Reveal.traits = ['node', 'transition', 'mask', 'visible', 'active'];

  Reveal.prototype.mask = function(shader) {
    var s, _ref, _ref1;
    if (shader) {
      s = this._shaders.shader();
      s.pipe(Util.GLSL.identity('vec4'));
      s.fan();
      s.pipe(shader, this.uniforms);
      s.next();
      s.pipe('reveal.mask', this.uniforms);
      s.end();
      s.pipe("float combine(float a, float b) { return min(a, b); }");
    } else {
      s = this._shaders.shader();
      s.pipe('reveal.mask', this.uniforms);
    }
    return (_ref = (_ref1 = this._inherit('mask')) != null ? _ref1.mask(s) : void 0) != null ? _ref : s;
  };

  return Reveal;

})(Transition);

module.exports = Reveal;


},{"../../../util":172,"./transition":94}],91:[function(require,module,exports){
var Parent, Slide,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Slide = (function(_super) {
  __extends(Slide, _super);

  function Slide() {
    return Slide.__super__.constructor.apply(this, arguments);
  }

  Slide.traits = ['node', 'slide', 'visible', 'active'];

  Slide.prototype.make = function() {
    this._helpers.visible.make();
    this._helpers.active.make();
    if (!this._inherit('present')) {
      throw new Error("" + (this.node.toString()) + " must be placed inside <present></present>");
    }
    return this._inherit('present').adopt(this);
  };

  Slide.prototype.unmake = function() {
    this._helpers.visible.unmake();
    this._helpers.active.unmake();
    return this._inherit('present')(unadopt(this));
  };

  Slide.prototype.change = function(changed, touched, init) {
    if (changed['slide.early'] || changed['slide.late'] || changed['slide.steps'] || changed['slide.from'] || changed['slide.to']) {
      return this.rebuild;
    }
  };

  Slide.prototype.slideLatch = function(enabled, step) {
    this.trigger({
      'type': 'transition.latch',
      'step': step
    });
    if (enabled != null) {
      return this._instant(enabled);
    }
  };

  Slide.prototype.slideStep = function(index, step) {
    return this.trigger({
      'type': 'slide.step',
      'index': index,
      'step': step
    });
  };

  Slide.prototype.slideRelease = function() {
    return this.trigger({
      'type': 'transition.release'
    });
  };

  Slide.prototype.slideReset = function() {
    this._instant(false);
    return this.trigger({
      'type': 'slide.reset'
    });
  };

  Slide.prototype._instant = function(enabled) {
    this.setVisible(enabled);
    return this.setActive(enabled);
  };

  return Slide;

})(Parent);

module.exports = Slide;


},{"../base/parent":47}],92:[function(require,module,exports){
var Step, Track,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Track = require('./track');

Step = (function(_super) {
  __extends(Step, _super);

  function Step() {
    return Step.__super__.constructor.apply(this, arguments);
  }

  Step.traits = ['node', 'track', 'step', 'trigger', 'bind'];

  Step.prototype.make = function() {
    var clock, _i, _ref, _ref1, _results;
    Step.__super__.make.apply(this, arguments);
    clock = this._inherit('clock');
    if (this.actualIndex == null) {
      this.actualIndex = null;
    }
    this.animateIndex = this._animator.make(this._types.number(0), {
      clock: clock,
      realtime: this.props.realtime,
      step: (function(_this) {
        return function(value) {
          return _this.actualIndex = value;
        };
      })(this)
    });
    if (this.lastIndex == null) {
      this.lastIndex = null;
    }
    this.animateStep = this._animator.make(this._types.number(0), {
      clock: clock,
      realtime: this.props.realtime,
      step: (function(_this) {
        return function(value) {
          _this.playhead = value;
          return _this.update();
        };
      })(this)
    });
    this.stops = (_ref = this.props.stops) != null ? _ref : (function() {
      _results = [];
      for (var _i = 0, _ref1 = this.script.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; 0 <= _ref1 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
    this._listen('slide', 'slide.reset', (function(_this) {
      return function(e) {
        return _this.lastIndex = null;
      };
    })(this));
    return this._listen('slide', 'slide.step', (function(_this) {
      return function(e) {
        var delay, duration, factor, free, from, i, last, pace, playback, rewind, skip, skips, speed, step, stop, to, trigger, _j, _len, _ref2, _ref3, _ref4;
        _ref2 = _this.props, delay = _ref2.delay, duration = _ref2.duration, pace = _ref2.pace, speed = _ref2.speed, playback = _ref2.playback, rewind = _ref2.rewind, skip = _ref2.skip, trigger = _ref2.trigger;
        i = Math.max(0, Math.min(_this.stops.length - 1, e.index - trigger));
        from = _this.playhead;
        to = _this.stops[i];
        if ((_this.lastIndex == null) && trigger) {
          _this.lastIndex = i;
          _this.animateStep.set(to);
          _this.animateIndex.set(i);
          return;
        }
        last = (_ref3 = (_ref4 = _this.actualIndex) != null ? _ref4 : _this.lastIndex) != null ? _ref3 : 0;
        step = i - last;
        skips = _this.stops.slice(Math.min(last, i), Math.max(last, i));
        free = 0;
        last = skips.shift();
        for (_j = 0, _len = skips.length; _j < _len; _j++) {
          stop = skips[_j];
          if (last === stop) {
            free++;
          }
          last = stop;
        }
        _this.lastIndex = i;
        factor = speed * (e.step >= 0 ? 1 : rewind);
        factor *= skip ? Math.max(1, Math.abs(step) - free) : 1;
        duration += Math.abs(to - from) * pace / factor;
        if (from !== to) {
          _this.animateIndex.immediate(i, {
            delay: delay,
            duration: duration,
            ease: playback
          });
          return _this.animateStep.immediate(to, {
            delay: delay,
            duration: duration,
            ease: playback
          });
        }
      };
    })(this));
  };

  Step.prototype.made = function() {
    return this.update();
  };

  Step.prototype.unmake = function() {
    this.animateIndex.dispose();
    this.animateStep.dispose();
    this.animateIndex = this.animateStep = null;
    return Step.__super__.unmake.apply(this, arguments);
  };

  Step.prototype.change = function(changed, touched, init) {
    if (changed['step.stops'] || changed['step.realtime']) {
      return this.rebuild();
    }
    return Step.__super__.change.call(this, changed, touched, init);
  };

  return Step;

})(Track);

module.exports = Step;


},{"./track":93}],93:[function(require,module,exports){
var Ease, Primitive, Track, deepCopy,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Ease = require('../../../util').Ease;

deepCopy = function(x) {
  var k, out, v;
  out = {};
  for (k in x) {
    v = x[k];
    if (v instanceof Array) {
      out[k] = v.slice();
    } else if ((v != null) && typeof v === 'object') {
      out[k] = deepCopy(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

Track = (function(_super) {
  __extends(Track, _super);

  function Track() {
    return Track.__super__.constructor.apply(this, arguments);
  }

  Track.traits = ['node', 'track', 'seek', 'bind'];

  Track.prototype.init = function() {
    this.handlers = {};
    this.script = null;
    this.values = null;
    this.playhead = 0;
    this.velocity = null;
    this.section = null;
    return this.expr = null;
  };

  Track.prototype.make = function() {
    var node, script, _ref;
    this._helpers.bind.make([
      {
        to: 'track.target',
        trait: 'node',
        callback: null
      }
    ]);
    script = this.props.script;
    node = this.bind.target.node;
    this.targetNode = node;
    return _ref = this._process(node, script), this.script = _ref[0], this.values = _ref[1], this.start = _ref[2], this.end = _ref[3], _ref;
  };

  Track.prototype.unmake = function() {
    this.unbindExpr();
    this._helpers.bind.unmake();
    this.script = this.values = this.start = this.end = this.section = this.expr = null;
    return this.playhead = 0;
  };

  Track.prototype.bindExpr = function(expr) {
    var clock;
    this.unbindExpr();
    this.expr = expr;
    this.targetNode.bind(expr, true);
    clock = this.targetNode.clock;
    return this._attributes.bind(this.measure = (function() {
      var playhead;
      playhead = null;
      return (function(_this) {
        return function() {
          var step;
          step = clock.getTime().step;
          if (playhead != null) {
            _this.velocity = (_this.playhead - playhead) / step;
          }
          return playhead = _this.playhead;
        };
      })(this);
    })());
  };

  Track.prototype.unbindExpr = function() {
    if (this.expr != null) {
      this.targetNode.unbind(this.expr, true);
    }
    if (this.measure != null) {
      this._attributes.unbind(this.measure);
    }
    return this.expr = this.measure = null;
  };

  Track.prototype._process = function(object, script) {
    var end, i, k, key, last, message, props, result, s, start, step, v, values, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (script instanceof Array) {
      s = {};
      for (i = _i = 0, _len = script.length; _i < _len; i = ++_i) {
        step = script[i];
        s[i] = step;
      }
      script = s;
    }
    s = [];
    for (key in script) {
      step = script[key];
      if (step == null) {
        step = [];
      }
      if (step instanceof Array) {
        step = {
          key: +key,
          props: step[0] != null ? deepCopy(step[0]) : {},
          expr: step[1] != null ? deepCopy(step[1]) : {}
        };
      } else {
        if ((step.key == null) && !step.props && !step.expr) {
          step = {
            props: deepCopy(step)
          };
        } else {
          step = deepCopy(step);
        }
        step.key = step.key != null ? +step.key : +key;
        if (step.props == null) {
          step.props = {};
        }
        if (step.expr == null) {
          step.expr = {};
        }
      }
      s.push(step);
    }
    script = s;
    if (!script.length) {
      return [[], {}, 0, 0];
    }
    script.sort(function(a, b) {
      return a.key - b.key;
    });
    start = script[0].key;
    end = script[script.length - 1].key;
    for (key in script) {
      step = script[key];
      if (typeof last !== "undefined" && last !== null) {
        last.next = step;
      }
      last = step;
    }
    last.next = last;
    script = s;
    props = {};
    values = {};
    for (key in script) {
      step = script[key];
      _ref = step.props;
      for (k in _ref) {
        v = _ref[k];
        props[k] = true;
      }
    }
    for (key in script) {
      step = script[key];
      _ref1 = step.expr;
      for (k in _ref1) {
        v = _ref1[k];
        props[k] = true;
      }
    }
    for (k in props) {
      props[k] = object.get(k);
    }
    try {
      for (k in props) {
        values[k] = [object.attribute(k).T.make(), object.attribute(k).T.make(), object.attribute(k).T.make()];
      }
    } catch (_error) {
      console.warn(this.node.toMarkup());
      message = "" + (this.node.toString()) + " - Target " + object + " has no `" + k + "` property";
      throw new Error(message);
    }
    result = [];
    for (_j = 0, _len1 = script.length; _j < _len1; _j++) {
      step = script[_j];
      for (k in props) {
        v = props[k];
        v = object.validate(k, (_ref2 = step.props[k]) != null ? _ref2 : v);
        props[k] = step.props[k] = v;
        if ((step.expr[k] != null) && typeof step.expr[k] !== 'function') {
          console.warn(this.node.toMarkup());
          message = "" + (this.node.toString()) + " - Expression `" + step.expr[k] + "` on property `" + k + "` is not a function";
          throw new Error(message);
        }
      }
      result.push(step);
    }
    return [result, values, start, end];
  };

  Track.prototype.update = function() {
    var clock, ease, easeMethod, end, expr, find, from, getLerpFactor, getPlayhead, k, live, node, playhead, script, section, seek, start, to, _ref;
    playhead = this.playhead, script = this.script;
    _ref = this.props, ease = _ref.ease, seek = _ref.seek;
    node = this.targetNode;
    if (seek != null) {
      playhead = seek;
    }
    if (script.length) {
      find = function() {
        var i, last, step, _i, _len;
        last = script[0];
        for (i = _i = 0, _len = script.length; _i < _len; i = ++_i) {
          step = script[i];
          if (step.key > playhead) {
            break;
          }
          last = step;
        }
        return last;
      };
      section = this.section;
      if (!section || playhead < section.key || playhead > section.next.key) {
        section = find(script, playhead);
      }
      if (section === this.section) {
        return;
      }
      this.section = section;
      from = section;
      to = section.next;
      start = from.key;
      end = to.key;
      easeMethod = (function() {
        switch (ease) {
          case 'linear':
          case 0:
            return Ease.clamp;
          case 'cosine':
          case 1:
            return Ease.cosine;
          default:
            return Ease.cosine;
        }
      })();
      clock = node.clock;
      getPlayhead = (function(_this) {
        return function(time) {
          var now;
          if (_this.velocity == null) {
            return _this.playhead;
          }
          now = clock.getTime();
          return _this.playhead + _this.velocity * (time - now.time);
        };
      })(this);
      getLerpFactor = (function() {
        var scale;
        scale = 1 / Math.max(0.0001, end - start);
        return function(time) {
          return easeMethod((getPlayhead(time) - start) * scale, 0, 1);
        };
      })();
      live = (function(_this) {
        return function(key) {
          var animator, attr, fromE, fromP, invalid, toE, toP, values;
          fromE = from.expr[key];
          toE = to.expr[key];
          fromP = from.props[key];
          toP = to.props[key];
          invalid = function() {
            console.warn(node.toMarkup());
            throw new Error("" + (this.node.toString()) + " - Invalid expression result on track `" + key + "`");
          };
          attr = node.attribute(key);
          values = _this.values[key];
          animator = _this._animator;
          if (fromE && toE) {
            return (function(values, from, to) {
              return function(time, delta) {
                var _from, _to;
                values[0] = _from = attr.T.validate(fromE(time, delta), values[0], invalid);
                values[1] = _to = attr.T.validate(toE(time, delta), values[1], invalid);
                return values[2] = animator.lerp(attr.T, _from, _to, getLerpFactor(time), values[2]);
              };
            })(values, from, to);
          } else if (fromE) {
            return (function(values, from, to) {
              return function(time, delta) {
                var _from;
                values[0] = _from = attr.T.validate(fromE(time, delta), values[0], invalid);
                return values[1] = animator.lerp(attr.T, _from, toP, getLerpFactor(time), values[1]);
              };
            })(values, from, to);
          } else if (toE) {
            return (function(values, from, to) {
              return function(time, delta) {
                var _to;
                values[0] = _to = attr.T.validate(toE(time, delta), values[0], invalid);
                return values[1] = animator.lerp(attr.T, fromP, _to, getLerpFactor(time), values[1]);
              };
            })(values, from, to);
          } else {
            return (function(values, from, to) {
              return function(time, delta) {
                return values[0] = animator.lerp(attr.T, fromP, toP, getLerpFactor(time), values[0]);
              };
            })(values, from, to);
          }
        };
      })(this);
      expr = {};
      for (k in from.expr) {
        if (expr[k] == null) {
          expr[k] = live(k);
        }
      }
      for (k in to.expr) {
        if (expr[k] == null) {
          expr[k] = live(k);
        }
      }
      for (k in from.props) {
        if (expr[k] == null) {
          expr[k] = live(k);
        }
      }
      for (k in to.props) {
        if (expr[k] == null) {
          expr[k] = live(k);
        }
      }
      return this.bindExpr(expr);
    }
  };

  Track.prototype.change = function(changed, touched, init) {
    if (changed['track.target'] || changed['track.script'] || changed['track.mode']) {
      return this.rebuild();
    }
    if (changed['seek.seek'] || init) {
      return this.update();
    }
  };

  return Track;

})(Primitive);

module.exports = Track;


},{"../../../util":172,"../../primitive":44}],94:[function(require,module,exports){
var Parent, Transition, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Util = require('../../../util');

Transition = (function(_super) {
  __extends(Transition, _super);

  function Transition() {
    return Transition.__super__.constructor.apply(this, arguments);
  }

  Transition.traits = ['node', 'transition', 'transform', 'mask', 'visible', 'active'];

  Transition.prototype.init = function() {
    this.animate = null;
    this.uniforms = null;
    this.state = {
      isVisible: true,
      isActive: true,
      enter: 1,
      exit: 1
    };
    this.latched = null;
    return this.locked = null;
  };

  Transition.prototype.make = function() {
    var activeParent, slideParent, visibleParent;
    this.uniforms = {
      transitionFrom: this._attributes.make(this._types.vec4()),
      transitionTo: this._attributes.make(this._types.vec4()),
      transitionActive: this._attributes.make(this._types.bool()),
      transitionScale: this._attributes.make(this._types.vec4()),
      transitionBias: this._attributes.make(this._types.vec4()),
      transitionEnter: this._attributes.make(this._types.number()),
      transitionExit: this._attributes.make(this._types.number()),
      transitionSkew: this._attributes.make(this._types.number())
    };
    slideParent = this._inherit('slide');
    visibleParent = this._inherit('visible');
    activeParent = this._inherit('active');
    this._listen(slideParent, 'transition.latch', (function(_this) {
      return function(e) {
        return _this.latch(e.step);
      };
    })(this));
    this._listen(slideParent, 'transition.release', (function(_this) {
      return function() {
        return _this.release();
      };
    })(this));
    this._listen(visibleParent, 'visible.change', (function(_this) {
      return function() {
        return _this.update((_this.state.isVisible = visibleParent.isVisible));
      };
    })(this));
    this._listen(activeParent, 'active.change', (function(_this) {
      return function() {
        return _this.update((_this.state.isActive = activeParent.isActive));
      };
    })(this));
    this.animate = this._animator.make(this._types.vec2(1, 1), {
      step: (function(_this) {
        return function(value) {
          _this.state.enter = value.x;
          _this.state.exit = value.y;
          return _this.update();
        };
      })(this),
      complete: (function(_this) {
        return function(done) {
          return _this.complete(done);
        };
      })(this)
    });
    return this.move = (this.props.from != null) || (this.props.to != null);
  };

  Transition.prototype.unmake = function() {
    return this.animate.dispose();
  };

  Transition.prototype.latch = function(step) {
    var enter, exit, forward, latched, visible, _ref;
    this.locked = null;
    this.latched = latched = {
      isVisible: this.state.isVisible,
      isActive: this.state.isActive,
      step: step
    };
    visible = this.isVisible;
    if (!visible) {
      forward = latched.step >= 0;
      _ref = forward ? [0, 1] : [1, 0], enter = _ref[0], exit = _ref[1];
      return this.animate.set(enter, exit);
    }
  };

  Transition.prototype.release = function() {
    var delay, delayEnter, delayExit, duration, durationEnter, durationExit, enter, exit, forward, latched, state, visible, _ref, _ref1, _ref2;
    latched = this.latched;
    state = this.state;
    this.latched = null;
    if (latched.isVisible !== state.isVisible) {
      forward = latched.step >= 0;
      visible = state.isVisible;
      _ref = visible ? [1, 1] : forward ? [1, 0] : [0, 1], enter = _ref[0], exit = _ref[1];
      _ref1 = this.props, duration = _ref1.duration, durationEnter = _ref1.durationEnter, durationExit = _ref1.durationExit;
      if (durationEnter == null) {
        durationEnter = duration;
      }
      if (durationExit == null) {
        durationExit = duration;
      }
      duration = visible * durationEnter + !visible * durationExit;
      _ref2 = this.props, delay = _ref2.delay, delayEnter = _ref2.delayEnter, delayExit = _ref2.delayExit;
      if (delayEnter == null) {
        delayEnter = delay;
      }
      if (delayExit == null) {
        delayExit = delay;
      }
      delay = visible * delayEnter + !visible * delayExit;
      this.animate.immediate({
        x: enter,
        y: exit
      }, {
        duration: duration,
        delay: delay,
        ease: 'linear'
      });
      this.locked = {
        isVisible: true,
        isActive: latched.isActive || state.isActive
      };
    }
    return this.update();
  };

  Transition.prototype.complete = function(done) {
    if (!done) {
      return;
    }
    this.locked = null;
    return this.update();
  };

  Transition.prototype.update = function() {
    var active, enter, exit, level, partial, visible, _ref, _ref1;
    if (this.latched != null) {
      return;
    }
    _ref = this.props, enter = _ref.enter, exit = _ref.exit;
    if (enter == null) {
      enter = this.state.enter;
    }
    if (exit == null) {
      exit = this.state.exit;
    }
    level = enter * exit;
    visible = level > 0;
    partial = level < 1;
    this.uniforms.transitionEnter.value = enter;
    this.uniforms.transitionExit.value = exit;
    this.uniforms.transitionActive.value = partial;
    if (visible) {
      visible = !!this.state.isVisible;
    }
    if (this.locked != null) {
      visible = this.locked.isVisible;
    }
    if (this.isVisible !== visible) {
      this.isVisible = visible;
      this.trigger({
        type: 'visible.change'
      });
    }
    active = !!(this.state.isActive || ((_ref1 = this.locked) != null ? _ref1.isActive : void 0));
    if (this.isActive !== active) {
      this.isActive = active;
      return this.trigger({
        type: 'active.change'
      });
    }
  };

  Transition.prototype.change = function(changed, touched, init) {
    var flipW, flipX, flipY, flipZ, stagger, staggerW, staggerX, staggerY, staggerZ;
    if (changed['transition.enter'] || changed['transition.exit'] || init) {
      this.update();
    }
    if (changed['transition.stagger'] || init) {
      stagger = this.props.stagger;
      flipX = stagger.x < 0;
      flipY = stagger.y < 0;
      flipZ = stagger.z < 0;
      flipW = stagger.w < 0;
      staggerX = Math.abs(stagger.x);
      staggerY = Math.abs(stagger.y);
      staggerZ = Math.abs(stagger.z);
      staggerW = Math.abs(stagger.w);
      this.uniforms.transitionSkew.value = staggerX + staggerY + staggerZ + staggerW;
      this.uniforms.transitionScale.value.set((1 - flipX * 2) * staggerX, (1 - flipY * 2) * staggerY, (1 - flipZ * 2) * staggerZ, (1 - flipW * 2) * staggerW);
      return this.uniforms.transitionBias.value.set(flipX * staggerX, flipY * staggerY, flipZ * staggerZ, flipW * staggerW);
    }
  };

  return Transition;

})(Parent);

module.exports = Transition;


},{"../../../util":172,"../base/parent":47}],95:[function(require,module,exports){
var Compose, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Compose = (function(_super) {
  __extends(Compose, _super);

  function Compose() {
    return Compose.__super__.constructor.apply(this, arguments);
  }

  Compose.traits = ['node', 'bind', 'object', 'visible', 'operator', 'style', 'compose'];

  Compose.defaults = {
    zWrite: false,
    zTest: false,
    color: '#ffffff'
  };

  Compose.prototype.init = function() {
    return this.compose = null;
  };

  Compose.prototype.resize = function() {
    var depth, dims, height, layers, width;
    if (!(this.compose && this.bind.source)) {
      return;
    }
    dims = this.bind.source.getActiveDimensions();
    width = dims.width;
    height = dims.height;
    depth = dims.depth;
    layers = dims.items;
    return this.remapUVScale.set(width, height);
  };

  Compose.prototype.make = function() {
    var alpha, composeUniforms, fragment, resampleUniforms;
    this._helpers.bind.make([
      {
        to: 'operator.source',
        trait: 'source'
      }
    ]);
    if (this.bind.source == null) {
      return;
    }
    resampleUniforms = {
      remapUVScale: this._attributes.make(this._types.vec2())
    };
    this.remapUVScale = resampleUniforms.remapUVScale.value;
    fragment = this._shaders.shader();
    alpha = this.props.alpha;
    if (this.bind.source.is('image')) {
      fragment.pipe('screen.pass.uv', resampleUniforms);
      fragment = this.bind.source.imageShader(fragment);
    } else {
      fragment.pipe('screen.map.xy', resampleUniforms);
      fragment = this.bind.source.sourceShader(fragment);
    }
    if (!alpha) {
      fragment.pipe('color.opaque');
    }
    composeUniforms = this._helpers.style.uniforms();
    this.compose = this._renderables.make('screen', {
      map: fragment,
      uniforms: composeUniforms,
      linear: true
    });
    this._helpers.visible.make();
    return this._helpers.object.make([this.compose]);
  };

  Compose.prototype.made = function() {
    return this.resize();
  };

  Compose.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    return this._helpers.object.unmake();
  };

  Compose.prototype.change = function(changed, touched, init) {
    if (changed['operator.source'] || changed['compose.alpha']) {
      return this.rebuild();
    }
  };

  return Compose;

})(Primitive);

module.exports = Compose;


},{"../../../util":172,"../../primitive":44}],96:[function(require,module,exports){
var Parent, RTT, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Util = require('../../../util');

RTT = (function(_super) {
  __extends(RTT, _super);

  function RTT() {
    return RTT.__super__.constructor.apply(this, arguments);
  }

  RTT.traits = ['node', 'root', 'scene', 'vertex', 'texture', 'rtt', 'source', 'index', 'image'];

  RTT.defaults = {
    minFilter: 'linear',
    magFilter: 'linear',
    type: 'unsignedByte'
  };

  RTT.prototype.init = function() {
    return this.rtt = this.scene = this.camera = this.width = this.height = this.history = this.rootSize = this.size = null;
  };

  RTT.prototype.indexShader = function(shader) {
    return shader;
  };

  RTT.prototype.imageShader = function(shader) {
    return this.rtt.shaderRelative(shader);
  };

  RTT.prototype.sourceShader = function(shader) {
    return this.rtt.shaderAbsolute(shader, this.history);
  };

  RTT.prototype.getDimensions = function() {
    return {
      items: 1,
      width: this.width,
      height: this.height,
      depth: this.history
    };
  };

  RTT.prototype.getActiveDimensions = function() {
    return this.getDimensions();
  };

  RTT.prototype.make = function() {
    var aspect, height, history, magFilter, minFilter, type, viewHeight, viewWidth, width;
    this.parentRoot = this._inherit('root');
    this.rootSize = this.parentRoot.getSize();
    this._listen(this.parentRoot, 'root.pre', this.pre);
    this._listen(this.parentRoot, 'root.update', this.update);
    this._listen(this.parentRoot, 'root.render', this.render);
    this._listen(this.parentRoot, 'root.post', this.post);
    this._listen(this.parentRoot, 'root.camera', this.setCamera);
    this._listen(this.parentRoot, 'root.resize', function(event) {
      return this.resize(event.size);
    });
    if (this.rootSize == null) {
      return;
    }
    minFilter = this.props.minFilter;
    magFilter = this.props.magFilter;
    type = this.props.type;
    width = this.props.width;
    height = this.props.height;
    history = this.props.history;
    this.width = width != null ? width : this.rootSize.renderWidth;
    this.height = height != null ? height : this.rootSize.renderHeight;
    this.history = history;
    this.aspect = aspect = this.width / this.height;
    if (this.scene == null) {
      this.scene = this._renderables.make('scene');
    }
    this.rtt = this._renderables.make('renderToTexture', {
      scene: this.scene,
      camera: this._context.defaultCamera,
      width: this.width,
      height: this.height,
      frames: this.history,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
    aspect = width || height ? aspect : this.rootSize.aspect;
    viewWidth = width != null ? width : this.rootSize.viewWidth;
    viewHeight = height != null ? height : this.rootSize.viewHeight;
    return this.size = {
      renderWidth: this.width,
      renderHeight: this.height,
      aspect: aspect,
      viewWidth: viewWidth,
      viewHeight: viewHeight,
      pixelRatio: this.height / viewHeight
    };
  };

  RTT.prototype.made = function() {
    this.trigger({
      type: 'source.rebuild'
    });
    if (this.size) {
      return this.trigger({
        type: 'root.resize',
        size: this.size
      });
    }
  };

  RTT.prototype.unmake = function(rebuild) {
    if (this.rtt == null) {
      return;
    }
    this.rtt.dispose();
    if (!rebuild) {
      this.scene.dispose();
    }
    return this.rtt = this.width = this.height = this.history = null;
  };

  RTT.prototype.change = function(changed, touched, init) {
    if (touched['texture'] || changed['rtt.width'] || changed['rtt.height']) {
      return this.rebuild();
    }
    if (changed['root.camera'] || init) {
      this._unattach();
      this._attach(this.props.camera, 'camera', this.setCamera, this, this, true);
      return this.setCamera();
    }
  };

  RTT.prototype.adopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this.scene.add(object));
    }
    return _results;
  };

  RTT.prototype.unadopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this.scene.remove(object));
    }
    return _results;
  };

  RTT.prototype.resize = function(size) {
    var height, width;
    this.rootSize = size;
    width = this.props.width;
    height = this.props.height;
    if (!this.rtt || (width == null) || (height == null)) {
      return this.rebuild();
    }
  };

  RTT.prototype.select = function(selector) {
    return this._root.node.model.select(selector, [this.node]);
  };

  RTT.prototype.watch = function(selector, handler) {
    return this._root.node.model.watch(selector, handler);
  };

  RTT.prototype.unwatch = function(handler) {
    return this._root.node.model.unwatch(handler);
  };

  RTT.prototype.pre = function(e) {
    return this.trigger(e);
  };

  RTT.prototype.update = function(e) {
    var camera;
    if ((camera = this.getOwnCamera()) != null) {
      camera.aspect = this.aspect || 1;
      camera.updateProjectionMatrix();
    }
    return this.trigger(e);
  };

  RTT.prototype.render = function(e) {
    var _ref;
    this.trigger(e);
    return (_ref = this.rtt) != null ? _ref.render(this.getCamera()) : void 0;
  };

  RTT.prototype.post = function(e) {
    return this.trigger(e);
  };

  RTT.prototype.setCamera = function() {
    var camera, _ref;
    camera = (_ref = this.select(this.props.camera)[0]) != null ? _ref.controller : void 0;
    if (this.camera !== camera) {
      this.camera = camera;
      this.rtt.camera = this.getCamera();
      return this.trigger({
        type: 'root.camera'
      });
    } else if (!this.camera) {
      return this.trigger({
        type: 'root.camera'
      });
    }
  };

  RTT.prototype.getOwnCamera = function() {
    var _ref;
    return (_ref = this.camera) != null ? _ref.getCamera() : void 0;
  };

  RTT.prototype.getCamera = function() {
    var _ref;
    return (_ref = this.getOwnCamera()) != null ? _ref : this._inherit('root').getCamera();
  };

  RTT.prototype.vertex = function(shader, pass) {
    if (pass === 2) {
      return shader.pipe('view.position');
    }
    if (pass === 3) {
      return shader.pipe('root.position');
    }
    return shader;
  };

  return RTT;

})(Parent);

module.exports = RTT;


},{"../../../util":172,"../base/parent":47}],97:[function(require,module,exports){
var Primitive, Shader, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Shader = (function(_super) {
  __extends(Shader, _super);

  function Shader() {
    return Shader.__super__.constructor.apply(this, arguments);
  }

  Shader.traits = ['node', 'bind', 'shader'];

  Shader.freeform = true;

  Shader.prototype.init = function() {
    return this.shader = null;
  };

  Shader.prototype.make = function() {
    var code, def, language, make, snippet, type, types, uniforms, _i, _len, _ref, _ref1;
    _ref = this.props, language = _ref.language, code = _ref.code;
    if (language !== 'glsl') {
      throw new Error("GLSL required");
    }
    this._helpers.bind.make([
      {
        to: 'shader.sources',
        trait: 'source',
        multiple: true
      }
    ]);
    snippet = this._shaders.fetch(code);
    types = this._types;
    uniforms = {};
    make = (function(_this) {
      return function(type) {
        var t;
        switch (type) {
          case 'i':
            return types.int();
          case 'f':
            return types.number();
          case 'v2':
            return types.vec2();
          case 'v3':
            return types.vec3();
          case 'v4':
            return types.vec4();
          case 'm3':
            return types.mat3();
          case 'm4':
            return types.mat4();
          case 't':
            return types.object();
          default:
            t = type.split('');
            if (t.pop() === 'v') {
              return types.array(make(t.join('')));
            } else {
              return null;
            }
        }
      };
    })(this);
    _ref1 = snippet._signatures.uniform;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      def = _ref1[_i];
      if (type = make(def.type)) {
        uniforms[def.name] = type;
      }
    }
    return this.reconfigure({
      props: {
        uniform: uniforms
      }
    });
  };

  Shader.prototype.made = function() {
    return this.trigger({
      type: 'source.rebuild'
    });
  };

  Shader.prototype.unmake = function() {
    return this.shader = null;
  };

  Shader.prototype.change = function(changed, touched, init) {
    if (changed['shader.uniforms'] || changed['shader.code'] || changed['shader.language']) {
      return this.rebuild();
    }
  };

  Shader.prototype.shaderBind = function(uniforms) {
    var code, k, language, s, source, u, v, _i, _len, _name, _ref, _ref1, _ref2;
    if (uniforms == null) {
      uniforms = {};
    }
    _ref = this.props, language = _ref.language, code = _ref.code;
    _ref1 = this.node.attributes;
    for (k in _ref1) {
      v = _ref1[k];
      if ((v.type != null) && (v.short != null) && v.ns === 'uniform') {
        if (uniforms[_name = v.short] == null) {
          uniforms[_name] = v;
        }
      }
    }
    if ((u = this.props.uniforms) != null) {
      for (k in u) {
        v = u[k];
        uniforms[k] = v;
      }
    }
    s = this._shaders.shader();
    if (this.bind.sources != null) {
      _ref2 = this.bind.sources;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        source = _ref2[_i];
        s.require(source.sourceShader(this._shaders.shader()));
      }
    }
    return s.pipe(code, uniforms);
  };

  return Shader;

})(Primitive);

module.exports = Shader;


},{"../../../util":172,"../../primitive":44}],98:[function(require,module,exports){
var Format, Operator, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Operator = require('../operator/operator');

Util = require('../../../util');

Format = (function(_super) {
  __extends(Format, _super);

  function Format() {
    return Format.__super__.constructor.apply(this, arguments);
  }

  Format.traits = ['node', 'bind', 'operator', 'texture', 'text', 'format'];

  Format.defaults = {
    minFilter: 'linear',
    magFilter: 'linear'
  };

  Format.prototype.init = function() {
    Format.__super__.init.apply(this, arguments);
    this.atlas = this.buffer = this.used = this.time = null;
    return this.filled = false;
  };

  Format.prototype.sourceShader = function(shader) {
    return this.buffer.shader(shader);
  };

  Format.prototype.textShader = function(shader) {
    return this.atlas.shader(shader);
  };

  Format.prototype.textIsSDF = function() {
    return this.props.expand > 0;
  };

  Format.prototype.textHeight = function() {
    return this.props.detail;
  };

  Format.prototype.make = function() {
    var atlas, depth, detail, dims, emit, expand, font, height, items, magFilter, minFilter, style, type, variant, weight, width, _ref, _ref1;
    this._helpers.bind.make([
      {
        to: 'operator.source',
        trait: 'raw'
      }
    ]);
    _ref = this.props, minFilter = _ref.minFilter, magFilter = _ref.magFilter, type = _ref.type;
    _ref1 = this.props, font = _ref1.font, style = _ref1.style, variant = _ref1.variant, weight = _ref1.weight, detail = _ref1.detail, expand = _ref1.expand;
    this.atlas = this._renderables.make('textAtlas', {
      font: font,
      size: detail,
      style: style,
      variant: variant,
      weight: weight,
      outline: expand,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
    minFilter = THREE.NearestFilter;
    magFilter = THREE.NearestFilter;
    type = THREE.FloatType;
    dims = this.bind.source.getDimensions();
    items = dims.items, width = dims.width, height = dims.height, depth = dims.depth;
    this.buffer = this._renderables.make('voxelBuffer', {
      width: width,
      height: height,
      depth: depth,
      channels: 4,
      items: items,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
    atlas = this.atlas;
    emit = this.buffer.streamer.emit;
    this.buffer.streamer.emit = function(t) {
      return atlas.map(t, emit);
    };
    this.clockParent = this._inherit('clock');
    return this._listen('root', 'root.update', this.update);
  };

  Format.prototype.made = function() {
    Format.__super__.made.apply(this, arguments);
    return this.resize();
  };

  Format.prototype.unmake = function() {
    Format.__super__.unmake.apply(this, arguments);
    if (this.buffer) {
      this.buffer.dispose();
      this.buffer = null;
    }
    if (this.atlas) {
      this.atlas.dispose();
      return this.atlas = null;
    }
  };

  Format.prototype.update = function() {
    var dst, src, used;
    src = this.bind.source.rawBuffer();
    dst = this.buffer;
    if ((this.filled && !this.props.live) || !this.through) {
      return;
    }
    this.time = this.clockParent.getTime();
    used = this.used;
    this.atlas.begin();
    this.used = this.through();
    this.buffer.write(this.used);
    this.atlas.end();
    this.filled = true;
    if (used !== this.used) {
      return this.trigger({
        type: 'source.resize'
      });
    }
  };

  Format.prototype.change = function(changed, touched, init) {
    var data, digits, expr, length, map, _ref;
    if (touched['text']) {
      return this.rebuild();
    }
    if (changed['format.expr'] || changed['format.digits'] || changed['format.data'] || init) {
      _ref = this.props, digits = _ref.digits, expr = _ref.expr, data = _ref.data;
      if (expr == null) {
        if (data != null) {
          expr = function(x, y, z, w, i) {
            return data[i];
          };
        } else {
          expr = function(x) {
            return x;
          };
        }
      }
      length = expr.length;
      if (digits != null) {
        expr = (function(expr) {
          return function(x, y, z, w, i, j, k, l, t, d) {
            return +(expr(x, y, z, w, i, j, k, l, t, d)).toPrecision(digits);
          };
        })(expr);
      }
      if (length > 8) {
        map = (function(_this) {
          return function(emit, x, y, z, w, i, j, k, l, t, d) {
            return emit(expr(x, y, z, w, i, j, k, l, _this.time.clock, _this.time.step));
          };
        })(this);
      } else {
        map = (function(_this) {
          return function(emit, x, y, z, w, i, j, k, l) {
            return emit(expr(x, y, z, w, i, j, k, l));
          };
        })(this);
      }
      return this.through = this.bind.source.rawBuffer().through(map, this.buffer);
    }
  };

  return Format;

})(Operator);

module.exports = Format;


},{"../../../util":172,"../operator/operator":77}],99:[function(require,module,exports){
var Label, Primitive, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Primitive = require('../../primitive');

Util = require('../../../util');

Label = (function(_super) {
  __extends(Label, _super);

  function Label() {
    return Label.__super__.constructor.apply(this, arguments);
  }

  Label.traits = ['node', 'bind', 'object', 'visible', 'style', 'label', 'attach', 'geometry', 'position'];

  Label.defaults = {
    color: '#000000'
  };

  Label.prototype.make = function() {
    var color, combine, depth, height, items, labelUniforms, map, mask, pointDims, position, snippet, sprite, styleUniforms, textDims, textIsSDF, uniforms, unitUniforms, width;
    Label.__super__.make.apply(this, arguments);
    this._helpers.bind.make([
      {
        to: 'label.text',
        trait: 'text'
      }, {
        to: 'geometry.points',
        trait: 'source'
      }, {
        to: 'geometry.colors',
        trait: 'source'
      }
    ]);
    if (this.bind.points == null) {
      return;
    }
    if (this.bind.text == null) {
      return;
    }
    pointDims = this.bind.points.getDimensions();
    textDims = this.bind.text.getDimensions();
    textIsSDF = this.bind.text.textIsSDF();
    items = Math.min(pointDims.items, textDims.items);
    width = Math.min(pointDims.width, textDims.width);
    height = Math.min(pointDims.height, textDims.height);
    depth = Math.min(pointDims.depth, textDims.depth);
    position = this.bind.points.sourceShader(this._shaders.shader());
    position = this._helpers.position.pipeline(position);
    sprite = this.bind.text.sourceShader(this._shaders.shader());
    map = this._shaders.shader().pipe('label.map');
    map.pipe(this.bind.text.textShader(this._shaders.shader()));
    labelUniforms = {
      spriteDepth: this.node.attributes['attach.depth'],
      spriteOffset: this.node.attributes['attach.offset'],
      spriteSnap: this.node.attributes['attach.snap'],
      spriteScale: this._attributes.make(this._types.number()),
      outlineStep: this._attributes.make(this._types.number()),
      outlineExpand: this._attributes.make(this._types.number()),
      outlineColor: this.node.attributes['label.background']
    };
    this.spriteScale = labelUniforms.spriteScale;
    this.outlineStep = labelUniforms.outlineStep;
    this.outlineExpand = labelUniforms.outlineExpand;
    snippet = textIsSDF ? 'label.outline' : 'label.alpha';
    combine = this._shaders.shader().pipe(snippet, labelUniforms);
    if (this.bind.colors) {
      color = this._shaders.shader();
      this.bind.colors.sourceShader(color);
    }
    mask = this._helpers.object.mask();
    styleUniforms = this._helpers.style.uniforms();
    unitUniforms = this._inherit('unit').getUnitUniforms();
    uniforms = Util.JS.merge(unitUniforms, styleUniforms, labelUniforms);
    this.sprite = this._renderables.make('sprite', {
      uniforms: uniforms,
      width: width,
      height: height,
      depth: depth,
      items: items,
      position: position,
      sprite: sprite,
      map: map,
      combine: combine,
      color: color,
      mask: mask,
      linear: true
    });
    this._helpers.visible.make();
    return this._helpers.object.make([this.sprite]);
  };

  Label.prototype.unmake = function() {
    this._helpers.bind.unmake();
    this._helpers.visible.unmake();
    this._helpers.object.unmake();
    return this.sprite = null;
  };

  Label.prototype.resize = function() {
    var depth, height, items, pointDims, textDims, width;
    pointDims = this.bind.points.getActiveDimensions();
    textDims = this.bind.text.getActiveDimensions();
    items = Math.min(pointDims.items, textDims.items);
    width = Math.min(pointDims.width, textDims.width);
    height = Math.min(pointDims.height, textDims.height);
    depth = Math.min(pointDims.depth, textDims.depth);
    return this.sprite.geometry.clip(width, height, depth, items);
  };

  Label.prototype.change = function(changed, touched, init) {
    var expand, height, outline, scale, size;
    if (touched['geometry'] || changed['label.text']) {
      return this.rebuild();
    }
    if (this.bind.points == null) {
      return;
    }
    size = this.props.size;
    outline = this.props.outline;
    expand = this.props.expand;
    height = this.bind.text.textHeight();
    scale = size / height;
    this.outlineExpand.value = expand / scale * 16 / 255;
    this.outlineStep.value = outline / scale * 16 / 255;
    return this.spriteScale.value = scale;
  };

  return Label;

})(Primitive);

module.exports = Label;


},{"../../../util":172,"../../primitive":44}],100:[function(require,module,exports){
var Resample, Retext, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Resample = require('../operator/resample');

Util = require('../../../util');

Retext = (function(_super) {
  __extends(Retext, _super);

  function Retext() {
    return Retext.__super__.constructor.apply(this, arguments);
  }

  Retext.traits = ['node', 'bind', 'operator', 'resample', 'sampler:width', 'sampler:height', 'sampler:depth', 'sampler:items', 'include', 'text'];

  Retext.prototype.init = function() {
    return this.sourceSpec = [
      {
        to: 'operator.source',
        trait: 'text'
      }
    ];
  };

  Retext.prototype.textShader = function(shader) {
    return this.bind.source.textShader(shader);
  };

  Retext.prototype.textIsSDF = function() {
    var _ref;
    return ((_ref = this.bind.source) != null ? _ref.props.expand : void 0) > 0;
  };

  Retext.prototype.textHeight = function() {
    var _ref;
    return (_ref = this.bind.source) != null ? _ref.props.detail : void 0;
  };

  return Retext;

})(Resample);

module.exports = Retext;


},{"../../../util":172,"../operator/resample":79}],101:[function(require,module,exports){
var Text, Util, Voxel,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Voxel = require('../data/voxel');

Util = require('../../../util');

Text = (function(_super) {
  __extends(Text, _super);

  function Text() {
    return Text.__super__.constructor.apply(this, arguments);
  }

  Text.traits = ['node', 'buffer', 'active', 'data', 'texture', 'voxel', 'text'];

  Text.defaults = {
    minFilter: 'linear',
    magFilter: 'linear'
  };

  Text.finals = {
    channels: 4
  };

  Text.prototype.init = function() {
    Text.__super__.init.apply(this, arguments);
    return this.atlas = null;
  };

  Text.prototype.textShader = function(shader) {
    return this.atlas.shader(shader);
  };

  Text.prototype.textIsSDF = function() {
    return this.props.expand > 0;
  };

  Text.prototype.textHeight = function() {
    return this.props.detail;
  };

  Text.prototype.make = function() {
    var atlas, detail, emit, expand, font, magFilter, minFilter, style, type, variant, weight, _ref, _ref1;
    _ref = this.props, minFilter = _ref.minFilter, magFilter = _ref.magFilter, type = _ref.type;
    _ref1 = this.props, font = _ref1.font, style = _ref1.style, variant = _ref1.variant, weight = _ref1.weight, detail = _ref1.detail, expand = _ref1.expand;
    this.atlas = this._renderables.make('textAtlas', {
      font: font,
      size: detail,
      style: style,
      variant: variant,
      weight: weight,
      outline: expand,
      minFilter: minFilter,
      magFilter: magFilter,
      type: type
    });
    this.minFilter = THREE.NearestFilter;
    this.magFilter = THREE.NearestFilter;
    this.type = THREE.FloatType;
    Text.__super__.make.apply(this, arguments);
    atlas = this.atlas;
    emit = this.buffer.streamer.emit;
    return this.buffer.streamer.emit = function(text) {
      return atlas.map(text, emit);
    };
  };

  Text.prototype.unmake = function() {
    Text.__super__.unmake.apply(this, arguments);
    if (this.atlas) {
      this.atlas.dispose();
      return this.atlas = null;
    }
  };

  Text.prototype.update = function() {
    this.atlas.begin();
    Text.__super__.update.apply(this, arguments);
    return this.atlas.end();
  };

  Text.prototype.change = function(changed, touched, init) {
    if (touched['text']) {
      return this.rebuild();
    }
    return Text.__super__.change.call(this, changed, touched, init);
  };

  return Text;

})(Voxel);

module.exports = Text;


},{"../../../util":172,"../data/voxel":61}],102:[function(require,module,exports){
var Clock, Parent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Clock = (function(_super) {
  __extends(Clock, _super);

  function Clock() {
    return Clock.__super__.constructor.apply(this, arguments);
  }

  Clock.traits = ['node', 'clock', 'seek', 'play'];

  Clock.prototype.init = function() {
    this.skew = 0;
    this.last = 0;
    return this.time = {
      now: +new Date() / 1000,
      time: 0,
      delta: 0,
      clock: 0,
      step: 0
    };
  };

  Clock.prototype.make = function() {
    return this._listen('clock', 'clock.tick', this.tick);
  };

  Clock.prototype.reset = function() {
    return this.skew = 0;
  };

  Clock.prototype.tick = function(e) {
    var clock, delay, delta, from, pace, parent, ratio, realtime, seek, speed, time, to, _ref;
    _ref = this.props, from = _ref.from, to = _ref.to, speed = _ref.speed, seek = _ref.seek, pace = _ref.pace, delay = _ref.delay, realtime = _ref.realtime;
    parent = this._inherit('clock').getTime();
    time = realtime ? parent.time : parent.clock;
    delta = realtime ? parent.delta : parent.step;
    ratio = speed / pace;
    this.skew += delta * (ratio - 1);
    if (this.last > time) {
      this.skew = 0;
    }
    this.time.now = parent.now + this.skew;
    this.time.time = parent.time;
    this.time.delta = parent.delta;
    clock = seek != null ? seek : parent.clock + this.skew;
    this.time.clock = Math.min(to, from + Math.max(0, clock - delay * ratio));
    this.time.step = delta * ratio;
    this.last = time;
    return this.trigger(e);
  };

  Clock.prototype.getTime = function() {
    return this.time;
  };

  return Clock;

})(Parent);

module.exports = Clock;


},{"../base/parent":47}],103:[function(require,module,exports){
var Now, Parent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Now = (function(_super) {
  __extends(Now, _super);

  function Now() {
    return Now.__super__.constructor.apply(this, arguments);
  }

  Now.traits = ['node', 'clock', 'now'];

  Now.prototype.init = function() {
    var now;
    this.now = now = +new Date() / 1000;
    this.skew = 0;
    return this.time = {
      now: now,
      time: 0,
      delta: 0,
      clock: 0,
      step: 0
    };
  };

  Now.prototype.make = function() {
    this.clockParent = this._inherit('clock');
    return this._listen('clock', 'clock.tick', this.tick);
  };

  Now.prototype.unmake = function() {
    return this.clockParent = null;
  };

  Now.prototype.change = function(changed, touched, init) {
    if (changed['date.now']) {
      return this.skew = 0;
    }
  };

  Now.prototype.tick = function(e) {
    var now, pace, parent, seek, speed, _ref, _ref1;
    _ref = this.props, now = _ref.now, seek = _ref.seek, pace = _ref.pace, speed = _ref.speed;
    parent = this.clockParent.getTime();
    this.skew += parent.step * pace / speed;
    if (seek != null) {
      this.skew = seek;
    }
    this.time.now = this.time.time = this.time.clock = ((_ref1 = this.props.now) != null ? _ref1 : this.now) + this.skew;
    this.time.delta = this.time.step = parent.delta;
    return this.trigger(e);
  };

  Now.prototype.getTime = function() {
    return this.time;
  };

  return Now;

})(Parent);

module.exports = Now;


},{"../base/parent":47}],104:[function(require,module,exports){
var Traits, Types;

Types = require('./types');

Traits = {
  node: {
    id: Types.nullable(Types.string()),
    classes: Types.classes()
  },
  entity: {
    active: Types.bool(true)
  },
  object: {
    visible: Types.bool(true)
  },
  unit: {
    scale: Types.nullable(Types.number()),
    fov: Types.nullable(Types.number()),
    focus: Types.nullable(Types.number(1), true)
  },
  span: {
    range: Types.nullable(Types.vec2(-1, 1))
  },
  view: {
    range: Types.array(Types.vec2(-1, 1), 4)
  },
  view3: {
    position: Types.vec3(),
    quaternion: Types.quat(),
    rotation: Types.vec3(),
    scale: Types.vec3(1, 1, 1),
    eulerOrder: Types.swizzle('xyz')
  },
  view4: {
    position: Types.vec4(),
    scale: Types.vec4(1, 1, 1, 1)
  },
  layer: {
    depth: Types.number(1),
    fit: Types.fit('y')
  },
  vertex: {
    pass: Types.vertexPass()
  },
  fragment: {
    pass: Types.fragmentPass()
  },
  transform3: {
    position: Types.vec3(),
    quaternion: Types.quat(),
    rotation: Types.vec3(),
    eulerOrder: Types.swizzle('xyz'),
    scale: Types.vec3(1, 1, 1),
    matrix: Types.mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
  },
  transform4: {
    position: Types.vec4(),
    scale: Types.vec4(1, 1, 1, 1),
    matrix: Types.mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
  },
  camera: {
    proxy: Types.bool(false),
    position: Types.nullable(Types.vec3()),
    quaternion: Types.nullable(Types.quat()),
    rotation: Types.nullable(Types.vec3()),
    lookAt: Types.nullable(Types.vec3()),
    up: Types.nullable(Types.vec3()),
    eulerOrder: Types.swizzle('xyz'),
    fov: Types.nullable(Types.number(1))
  },
  polar: {
    bend: Types.number(1),
    helix: Types.number(0)
  },
  spherical: {
    bend: Types.number(1)
  },
  stereographic: {
    bend: Types.number(1)
  },
  interval: {
    axis: Types.axis()
  },
  area: {
    axes: Types.swizzle([1, 2], 2)
  },
  volume: {
    axes: Types.swizzle([1, 2, 3], 3)
  },
  origin: {
    origin: Types.vec4()
  },
  scale: {
    divide: Types.number(10),
    unit: Types.number(1),
    base: Types.number(10),
    mode: Types.scale(),
    start: Types.bool(true),
    end: Types.bool(true),
    zero: Types.bool(true),
    factor: Types.positive(Types.number(1)),
    nice: Types.bool(true)
  },
  grid: {
    lineX: Types.bool(true),
    lineY: Types.bool(true),
    crossed: Types.bool(false),
    closedX: Types.bool(false),
    closedY: Types.bool(false)
  },
  axis: {
    detail: Types.int(1),
    crossed: Types.bool(false)
  },
  data: {
    data: Types.nullable(Types.object()),
    expr: Types.nullable(Types.emitter()),
    bind: Types.nullable(Types.func()),
    live: Types.bool(true)
  },
  buffer: {
    channels: Types["enum"](4, [1, 2, 3, 4]),
    items: Types.int(1),
    fps: Types.nullable(Types.int(60)),
    hurry: Types.int(5),
    limit: Types.int(60),
    realtime: Types.bool(false),
    observe: Types.bool(false)
  },
  sampler: {
    centered: Types.bool(false),
    padding: Types.number(0)
  },
  array: {
    length: Types.nullable(Types.positive(Types.int(1), true)),
    bufferLength: Types.int(1),
    history: Types.int(1)
  },
  matrix: {
    width: Types.nullable(Types.positive(Types.int(1), true)),
    height: Types.nullable(Types.positive(Types.int(1), true)),
    history: Types.int(1),
    bufferWidth: Types.int(1),
    bufferHeight: Types.int(1)
  },
  voxel: {
    width: Types.nullable(Types.positive(Types.int(1), true)),
    height: Types.nullable(Types.positive(Types.int(1), true)),
    depth: Types.nullable(Types.positive(Types.int(1), true)),
    bufferWidth: Types.int(1),
    bufferHeight: Types.int(1),
    bufferDepth: Types.int(1)
  },
  resolve: {
    expr: Types.nullable(Types.func()),
    items: Types.int(1)
  },
  style: {
    opacity: Types.positive(Types.number(1)),
    color: Types.color(),
    blending: Types.blending(),
    zWrite: Types.bool(true),
    zTest: Types.bool(true),
    zIndex: Types.positive(Types.round()),
    zBias: Types.number(0),
    zOrder: Types.nullable(Types.int())
  },
  geometry: {
    points: Types.select(),
    colors: Types.nullable(Types.select())
  },
  point: {
    size: Types.positive(Types.number(4)),
    sizes: Types.nullable(Types.select()),
    shape: Types.shape(),
    optical: Types.bool(true),
    fill: Types.bool(true),
    depth: Types.number(1)
  },
  line: {
    width: Types.positive(Types.number(2)),
    depth: Types.positive(Types.number(1)),
    stroke: Types.stroke(),
    proximity: Types.nullable(Types.number(Infinity)),
    closed: Types.bool(false)
  },
  mesh: {
    fill: Types.bool(true),
    shaded: Types.bool(false),
    map: Types.nullable(Types.select())
  },
  strip: {
    line: Types.bool(false)
  },
  face: {
    line: Types.bool(false)
  },
  arrow: {
    size: Types.number(3),
    start: Types.bool(false),
    end: Types.bool(false)
  },
  ticks: {
    normal: Types.vec3(0, 0, 1),
    size: Types.positive(Types.number(10)),
    epsilon: Types.positive(Types.number(0.001))
  },
  attach: {
    offset: Types.vec2(0, -20),
    snap: Types.bool(false),
    depth: Types.number(0)
  },
  format: {
    digits: Types.nullable(Types.positive(Types.number(3))),
    data: Types.nullable(Types.object()),
    expr: Types.nullable(Types.func()),
    live: Types.bool(true)
  },
  text: {
    font: Types.font('sans-serif'),
    style: Types.string(),
    variant: Types.string(),
    weight: Types.string(),
    detail: Types.number(24),
    expand: Types.number(5)
  },
  label: {
    text: Types.select(),
    size: Types.number(16),
    outline: Types.number(2),
    expand: Types.number(0),
    background: Types.color(1, 1, 1)
  },
  overlay: {
    opacity: Types.number(1),
    zIndex: Types.positive(Types.round(0))
  },
  dom: {
    points: Types.select(),
    html: Types.select(),
    size: Types.number(16),
    outline: Types.number(2),
    zoom: Types.number(1),
    color: Types.nullable(Types.color()),
    attributes: Types.nullable(Types.object()),
    pointerEvents: Types.bool(false)
  },
  texture: {
    minFilter: Types.filter('nearest'),
    magFilter: Types.filter('nearest'),
    type: Types.type('float')
  },
  shader: {
    sources: Types.nullable(Types.select()),
    language: Types.string('glsl'),
    code: Types.string(),
    uniforms: Types.nullable(Types.object())
  },
  include: {
    shader: Types.select()
  },
  operator: {
    source: Types.select()
  },
  spread: {
    unit: Types.mapping(),
    items: Types.nullable(Types.vec4()),
    width: Types.nullable(Types.vec4()),
    height: Types.nullable(Types.vec4()),
    depth: Types.nullable(Types.vec4()),
    alignItems: Types.anchor(),
    alignWidth: Types.anchor(),
    alignHeight: Types.anchor(),
    alignDepth: Types.anchor()
  },
  grow: {
    scale: Types.number(1),
    items: Types.nullable(Types.anchor()),
    width: Types.nullable(Types.anchor()),
    height: Types.nullable(Types.anchor()),
    depth: Types.nullable(Types.anchor())
  },
  split: {
    order: Types.transpose('wxyz'),
    axis: Types.nullable(Types.axis()),
    length: Types.int(1),
    overlap: Types.int(0)
  },
  join: {
    order: Types.transpose('wxyz'),
    axis: Types.nullable(Types.axis()),
    overlap: Types.int(0)
  },
  swizzle: {
    order: Types.swizzle()
  },
  transpose: {
    order: Types.transpose()
  },
  repeat: {
    items: Types.number(1),
    width: Types.number(1),
    height: Types.number(1),
    depth: Types.number(1)
  },
  slice: {
    items: Types.nullable(Types.vec2()),
    width: Types.nullable(Types.vec2()),
    height: Types.nullable(Types.vec2()),
    depth: Types.nullable(Types.vec2())
  },
  lerp: {
    items: Types.nullable(Types.int()),
    width: Types.nullable(Types.int()),
    height: Types.nullable(Types.int()),
    depth: Types.nullable(Types.int())
  },
  resample: {
    indices: Types.number(4),
    channels: Types.number(4),
    sample: Types.mapping(),
    size: Types.mapping('absolute'),
    items: Types.nullable(Types.int()),
    width: Types.nullable(Types.int()),
    height: Types.nullable(Types.int()),
    depth: Types.nullable(Types.int())
  },
  readback: {
    indexed: Types.bool()
  },
  root: {
    speed: Types.number(1),
    camera: Types.select('[camera]')
  },
  inherit: {
    source: Types.select(),
    traits: Types.array(Types.string())
  },
  rtt: {
    width: Types.nullable(Types.int()),
    height: Types.nullable(Types.int()),
    history: Types.int(1)
  },
  compose: {
    alpha: Types.bool(false)
  },
  present: {
    index: Types.int(1),
    directed: Types.bool(true),
    length: Types.number(0)
  },
  slide: {
    order: Types.nullable(Types.int(0)),
    steps: Types.number(1),
    early: Types.int(0),
    late: Types.int(0),
    from: Types.nullable(Types.int(0)),
    to: Types.nullable(Types.int(1))
  },
  transition: {
    stagger: Types.vec4(),
    enter: Types.nullable(Types.number(1)),
    exit: Types.nullable(Types.number(1)),
    delay: Types.number(0),
    delayEnter: Types.nullable(Types.number(0)),
    delayExit: Types.nullable(Types.number(0)),
    duration: Types.number(.3),
    durationEnter: Types.nullable(Types.number(0)),
    durationExit: Types.nullable(Types.number(0))
  },
  move: {
    from: Types.vec4(),
    to: Types.vec4()
  },
  seek: {
    seek: Types.nullable(Types.number(0))
  },
  track: {
    target: Types.select(),
    script: Types.object({}),
    ease: Types.ease('cosine')
  },
  trigger: {
    trigger: Types.nullable(Types.int(1), true)
  },
  step: {
    playback: Types.ease('linear'),
    stops: Types.nullable(Types.array(Types.number())),
    delay: Types.number(0),
    duration: Types.number(.3),
    pace: Types.number(0),
    speed: Types.number(1),
    rewind: Types.number(2),
    skip: Types.bool(true),
    realtime: Types.bool(false)
  },
  play: {
    delay: Types.number(0),
    pace: Types.number(1),
    speed: Types.number(1),
    from: Types.number(0),
    to: Types.number(Infinity),
    realtime: Types.bool(false),
    loop: Types.bool(false)
  },
  now: {
    now: Types.nullable(Types.timestamp()),
    seek: Types.nullable(Types.number(0)),
    pace: Types.number(1),
    speed: Types.number(1)
  }
};

module.exports = Traits;


},{"./types":112}],105:[function(require,module,exports){
var Fragment, Transform,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('./transform');

Fragment = (function(_super) {
  __extends(Fragment, _super);

  function Fragment() {
    return Fragment.__super__.constructor.apply(this, arguments);
  }

  Fragment.traits = ['node', 'include', 'fragment', 'bind'];

  Fragment.prototype.make = function() {
    return this._helpers.bind.make([
      {
        to: 'include.shader',
        trait: 'shader',
        optional: true
      }
    ]);
  };

  Fragment.prototype.unmake = function() {
    return this._helpers.bind.unmake();
  };

  Fragment.prototype.change = function(changed, touched, init) {
    if (touched['include']) {
      return this.rebuild();
    }
  };

  Fragment.prototype.fragment = function(shader, pass) {
    if (this.bind.shader != null) {
      if (pass === this.props.pass) {
        shader.pipe(this.bind.shader.shaderBind());
      }
    }
    return Fragment.__super__.fragment.call(this, shader, pass);
  };

  return Fragment;

})(Transform);

module.exports = Fragment;


},{"./transform":108}],106:[function(require,module,exports){
var Layer, Transform, π,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('./transform');

π = Math.PI;

Layer = (function(_super) {
  __extends(Layer, _super);

  function Layer() {
    return Layer.__super__.constructor.apply(this, arguments);
  }

  Layer.traits = ['node', 'vertex', 'layer'];

  Layer.prototype.make = function() {
    this._listen('root', 'root.resize', this.update);
    return this.uniforms = {
      layerScale: this._attributes.make(this._types.vec4()),
      layerBias: this._attributes.make(this._types.vec4())
    };
  };

  Layer.prototype.update = function() {
    var aspect, camera, depth, fit, fov, pitch, scale, size, _enum, _ref, _ref1, _ref2;
    camera = this._inherit('root').getCamera();
    size = this._inherit('root').getSize();
    aspect = (_ref = camera.aspect) != null ? _ref : 1;
    fov = (_ref1 = camera.fov) != null ? _ref1 : 1;
    pitch = Math.tan(fov * π / 360);
    _enum = this.node.attributes['layer.fit']["enum"];
    _ref2 = this.props, fit = _ref2.fit, depth = _ref2.depth, scale = _ref2.scale;
    switch (fit) {
      case _enum.contain:
        fit = aspect > 1 ? _enum.y : _enum.x;
        break;
      case _enum.cover:
        fit = aspect > 1 ? _enum.x : _enum.y;
    }
    switch (fit) {
      case _enum.x:
        this.uniforms.layerScale.value.set(pitch * aspect, pitch * aspect);
        break;
      case _enum.y:
        this.uniforms.layerScale.value.set(pitch, pitch);
    }
    return this.uniforms.layerBias.value.set(0, 0, -depth, 0);
  };

  Layer.prototype.change = function(changed, touched, init) {
    if (changed['layer.fit'] || changed['layer.depth'] || init) {
      return this.update();
    }
  };

  Layer.prototype.vertex = function(shader, pass) {
    if (pass === 2) {
      return shader.pipe('layer.position', this.uniforms);
    }
    if (pass === 3) {
      return shader.pipe('root.position');
    }
    return shader;
  };

  return Layer;

})(Transform);

module.exports = Layer;


},{"./transform":108}],107:[function(require,module,exports){
var Mask, Parent,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Mask = (function(_super) {
  __extends(Mask, _super);

  function Mask() {
    return Mask.__super__.constructor.apply(this, arguments);
  }

  Mask.traits = ['node', 'include', 'mask', 'bind'];

  Mask.prototype.make = function() {
    return this._helpers.bind.make([
      {
        to: 'include.shader',
        trait: 'shader',
        optional: true
      }
    ]);
  };

  Mask.prototype.unmake = function() {
    return this._helpers.bind.unmake();
  };

  Mask.prototype.change = function(changed, touched, init) {
    if (touched['include']) {
      return this.rebuild();
    }
  };

  Mask.prototype.mask = function(shader) {
    var s, _ref, _ref1;
    if (this.bind.shader != null) {
      if (shader) {
        s = this._shaders.shader();
        s.pipe(Util.GLSL.identity('vec4'));
        s.fan();
        s.pipe(shader);
        s.next();
        s.pipe(this.bind.shader.shaderBind());
        s.end();
        s.pipe("float combine(float a, float b) { return min(a, b); }");
      } else {
        s = this._shaders.shader();
        s.pipe(this.bind.shader.shaderBind());
      }
    } else {
      s = shader;
    }
    return (_ref = (_ref1 = this._inherit('mask')) != null ? _ref1.mask(s) : void 0) != null ? _ref : s;
  };

  return Mask;

})(Parent);

module.exports = Mask;


},{"../base/parent":47}],108:[function(require,module,exports){
var Parent, Transform,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parent = require('../base/parent');

Transform = (function(_super) {
  __extends(Transform, _super);

  function Transform() {
    return Transform.__super__.constructor.apply(this, arguments);
  }

  Transform.traits = ['node', 'vertex', 'fragment'];

  Transform.prototype.vertex = function(shader, pass) {
    var _ref, _ref1;
    return (_ref = (_ref1 = this._inherit('vertex')) != null ? _ref1.vertex(shader, pass) : void 0) != null ? _ref : shader;
  };

  Transform.prototype.fragment = function(shader, pass) {
    var _ref, _ref1;
    return (_ref = (_ref1 = this._inherit('fragment')) != null ? _ref1.fragment(shader, pass) : void 0) != null ? _ref : shader;
  };

  return Transform;

})(Parent);

module.exports = Transform;


},{"../base/parent":47}],109:[function(require,module,exports){
var Transform, Transform3, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('./transform');

Util = require('../../../util');

Transform3 = (function(_super) {
  __extends(Transform3, _super);

  function Transform3() {
    return Transform3.__super__.constructor.apply(this, arguments);
  }

  Transform3.traits = ['node', 'vertex', 'transform3'];

  Transform3.prototype.make = function() {
    this.uniforms = {
      transformMatrix: this._attributes.make(this._types.mat4())
    };
    return this.composer = Util.Three.transformComposer();
  };

  Transform3.prototype.unmake = function() {
    return delete this.uniforms;
  };

  Transform3.prototype.change = function(changed, touched, init) {
    var e, m, p, q, r, s;
    if (changed['transform3.pass']) {
      return this.rebuild();
    }
    if (!(touched['transform3'] || init)) {
      return;
    }
    p = this.props.position;
    q = this.props.quaternion;
    r = this.props.rotation;
    s = this.props.scale;
    m = this.props.matrix;
    e = this.props.eulerOrder;
    return this.uniforms.transformMatrix.value = this.composer(p, r, q, s, m, e);
  };

  Transform3.prototype.vertex = function(shader, pass) {
    if (pass === this.props.pass) {
      shader.pipe('transform3.position', this.uniforms);
    }
    return Transform3.__super__.vertex.call(this, shader, pass);
  };

  return Transform3;

})(Transform);

module.exports = Transform3;


},{"../../../util":172,"./transform":108}],110:[function(require,module,exports){
var Transform, Transform4,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('./transform');

Transform4 = (function(_super) {
  __extends(Transform4, _super);

  function Transform4() {
    return Transform4.__super__.constructor.apply(this, arguments);
  }

  Transform4.traits = ['node', 'vertex', 'transform4'];

  Transform4.prototype.make = function() {
    this.uniforms = {
      transformMatrix: this._attributes.make(this._types.mat4()),
      transformOffset: this.node.attributes['transform4.position']
    };
    return this.transformMatrix = this.uniforms.transformMatrix.value;
  };

  Transform4.prototype.unmake = function() {
    return delete this.uniforms;
  };

  Transform4.prototype.change = function(changed, touched, init) {
    var m, s, t;
    if (changed['transform4.pass']) {
      return this.rebuild();
    }
    if (!(touched['transform4'] || init)) {
      return;
    }
    s = this.props.scale;
    m = this.props.matrix;
    t = this.transformMatrix;
    t.copy(m);
    return t.scale(s);
  };

  Transform4.prototype.vertex = function(shader, pass) {
    if (pass === this.props.pass) {
      shader.pipe('transform4.position', this.uniforms);
    }
    return Transform4.__super__.vertex.call(this, shader, pass);
  };

  return Transform4;

})(Transform);

module.exports = Transform4;


},{"./transform":108}],111:[function(require,module,exports){
var Transform, Vertex,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('./transform');

Vertex = (function(_super) {
  __extends(Vertex, _super);

  function Vertex() {
    return Vertex.__super__.constructor.apply(this, arguments);
  }

  Vertex.traits = ['node', 'include', 'vertex', 'bind'];

  Vertex.prototype.make = function() {
    return this._helpers.bind.make([
      {
        to: 'include.shader',
        trait: 'shader',
        optional: true
      }
    ]);
  };

  Vertex.prototype.unmake = function() {
    return this._helpers.bind.unmake();
  };

  Vertex.prototype.change = function(changed, touched, init) {
    if (touched['include']) {
      return this.rebuild();
    }
  };

  Vertex.prototype.vertex = function(shader, pass) {
    if (this.bind.shader != null) {
      if (pass === this.props.pass) {
        shader.pipe(this.bind.shader.shaderBind());
      }
    }
    return Vertex.__super__.vertex.call(this, shader, pass);
  };

  return Vertex;

})(Transform);

module.exports = Vertex;


},{"./transform":108}],112:[function(require,module,exports){
var Types, Util, decorate,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Util = require('../../util');

Types = {
  array: function(type, size, value) {
    var lerp, op;
    if (value == null) {
      value = null;
    }
    lerp = type.lerp ? function(a, b, target, f) {
      var i, l, _i;
      l = Math.min(a.length, b.length);
      for (i = _i = 0; 0 <= l ? _i < l : _i > l; i = 0 <= l ? ++_i : --_i) {
        target[i] = type.lerp(a[i], b[i], target[i], f);
      }
      return target;
    } : void 0;
    op = type.op ? function(a, b, target, op) {
      var i, l, _i;
      l = Math.min(a.length, b.length);
      for (i = _i = 0; 0 <= l ? _i < l : _i > l; i = 0 <= l ? ++_i : --_i) {
        target[i] = type.op(a[i], b[i], target[i], op);
      }
      return target;
    } : void 0;
    if ((value != null) && !(value instanceof Array)) {
      value = [value];
    }
    return {
      uniform: function() {
        if (type.uniform) {
          return type.uniform() + 'v';
        } else {
          return void 0;
        }
      },
      make: function() {
        var i, _i, _results;
        if (value != null) {
          return value.slice();
        }
        if (!size) {
          return [];
        }
        _results = [];
        for (i = _i = 0; 0 <= size ? _i < size : _i > size; i = 0 <= size ? ++_i : --_i) {
          _results.push(type.make());
        }
        return _results;
      },
      validate: function(value, target, invalid) {
        var i, input, l, _i, _ref;
        if (!(value instanceof Array)) {
          value = [value];
        }
        l = target.length = size ? size : value.length;
        for (i = _i = 0; 0 <= l ? _i < l : _i > l; i = 0 <= l ? ++_i : --_i) {
          input = (_ref = value[i]) != null ? _ref : type.make();
          target[i] = type.validate(input, target[i], invalid);
        }
        return target;
      },
      equals: function(a, b) {
        var al, bl, i, l, _i;
        al = a.length;
        bl = b.length;
        if (al !== bl) {
          return false;
        }
        l = Math.min(al, bl);
        for (i = _i = 0; 0 <= l ? _i < l : _i > l; i = 0 <= l ? ++_i : --_i) {
          if (!(typeof type.equals === "function" ? type.equals(a[i], b[i]) : void 0)) {
            return false;
          }
        }
        return true;
      },
      lerp: lerp,
      op: op,
      clone: function(v) {
        var x, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = v.length; _i < _len; _i++) {
          x = v[_i];
          _results.push(type.clone(x));
        }
        return _results;
      }
    };
  },
  letters: function(type, size, value) {
    var array, i, v, _i, _len;
    if (value == null) {
      value = null;
    }
    if (value != null) {
      if (value === "" + value) {
        value = value.split('');
      }
      for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
        v = value[i];
        value[i] = type.validate(v, v);
      }
    }
    array = Types.array(type, size, value);
    return {
      uniform: function() {
        return array.uniform();
      },
      make: function() {
        return array.make();
      },
      validate: function(value, target, invalid) {
        if (value === "" + value) {
          value = value.split('');
        }
        return array.validate(value, target, invalid);
      },
      equals: function(a, b) {
        return array.equals(a, b);
      },
      clone: array.clone
    };
  },
  nullable: function(type, make) {
    var emitter, lerp, op, value;
    if (make == null) {
      make = false;
    }
    value = make ? type.make() : null;
    emitter = type.emitter ? function(expr1, expr2) {
      if (expr2 == null) {
        return expr1;
      }
      if (expr1 == null) {
        return expr2;
      }
      return type.emitter(expr1, expr2);
    } : void 0;
    lerp = type.lerp ? function(a, b, target, f) {
      if (a === null || b === null) {
        if (f < .5) {
          return a;
        } else {
          return b;
        }
      }
      if (target == null) {
        target = type.make();
      }
      value = type.lerp(a, b, target, f);
      return target;
    } : void 0;
    op = type.op ? function(a, b, target, op) {
      if (a === null || b === null) {
        return null;
      }
      if (target == null) {
        target = type.make();
      }
      value = type.op(a, b, target, op);
      return value;
    } : void 0;
    return {
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        if (value === null) {
          return value;
        }
        if (target === null) {
          target = type.make();
        }
        return type.validate(value, target, invalid);
      },
      uniform: function() {
        return typeof type.uniform === "function" ? type.uniform() : void 0;
      },
      equals: function(a, b) {
        var an, bn, _ref;
        an = a === null;
        bn = b === null;
        if (an && bn) {
          return true;
        }
        if (an ^ bn) {
          return false;
        }
        return (_ref = typeof type.equals === "function" ? type.equals(a, b) : void 0) != null ? _ref : a === b;
      },
      lerp: lerp,
      op: op,
      emitter: emitter
    };
  },
  "enum": function(value, keys, map) {
    var i, key, values, _i, _j, _len, _len1;
    if (keys == null) {
      keys = [];
    }
    if (map == null) {
      map = {};
    }
    i = 0;
    values = {};
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      if (key !== +key) {
        if (map[key] == null) {
          map[key] = i++;
        }
      }
    }
    for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
      key = keys[_j];
      if (key === +key) {
        values[key] = key;
      }
    }
    for (key in map) {
      i = map[key];
      values[i] = true;
    }
    if (values[value] == null) {
      value = map[value];
    }
    return {
      "enum": function() {
        return map;
      },
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        var v;
        v = values[value] ? value : map[value];
        if (v != null) {
          return v;
        }
        return invalid();
      }
    };
  },
  enumber: function(value, keys, map) {
    var _enum;
    if (map == null) {
      map = {};
    }
    _enum = Types["enum"](value, keys, map);
    return {
      "enum": _enum["enum"],
      uniform: function() {
        return 'f';
      },
      make: function() {
        var _ref;
        return (_ref = _enum.make()) != null ? _ref : +value;
      },
      validate: function(value, target, invalid) {
        if (value === +value) {
          return value;
        }
        return _enum.validate(value, target, invalid);
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  select: function(value) {
    if (value == null) {
      value = '<';
    }
    value;
    return {
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        if (typeof value === 'string') {
          return value;
        }
        if (typeof value === 'object') {
          return value;
        }
        return invalid();
      }
    };
  },
  bool: function(value) {
    value = !!value;
    return {
      uniform: function() {
        return 'f';
      },
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        return !!value;
      }
    };
  },
  int: function(value) {
    if (value == null) {
      value = 0;
    }
    value = +Math.round(value);
    return {
      uniform: function() {
        return 'i';
      },
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        var x;
        if (value !== (x = +value)) {
          return invalid();
        }
        return Math.round(x) || 0;
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  round: function(value) {
    if (value == null) {
      value = 0;
    }
    value = +Math.round(value);
    return {
      uniform: function() {
        return 'f';
      },
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        var x;
        if (value !== (x = +value)) {
          return invalid();
        }
        return Math.round(x) || 0;
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  number: function(value) {
    if (value == null) {
      value = 0;
    }
    return {
      uniform: function() {
        return 'f';
      },
      make: function() {
        return +value;
      },
      validate: function(value, target, invalid) {
        var x;
        if (value !== (x = +value)) {
          return invalid();
        }
        return x || 0;
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  positive: function(type, strict) {
    if (strict == null) {
      strict = false;
    }
    return {
      uniform: type.uniform,
      make: type.make,
      validate: function(value, target, invalid) {
        value = type.validate(value, target, invalid);
        if ((value < 0) || (strict && value <= 0)) {
          return invalid();
        }
        return value;
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  string: function(value) {
    if (value == null) {
      value = '';
    }
    return {
      make: function() {
        return "" + value;
      },
      validate: function(value, target, invalid) {
        var x;
        if (value !== (x = "" + value)) {
          return invalid();
        }
        return x;
      }
    };
  },
  func: function() {
    return {
      make: function() {
        return function() {};
      },
      validate: function(value, target, invalid) {
        if (typeof value === 'function') {
          return value;
        }
        return invalid();
      }
    };
  },
  emitter: function() {
    return {
      make: function() {
        return function(emit) {
          return emit(1, 1, 1, 1);
        };
      },
      validate: function(value, target, invalid) {
        if (typeof value === 'function') {
          return value;
        }
        return invalid();
      },
      emitter: function(a, b) {
        return Util.Data.getLerpEmitter(a, b);
      }
    };
  },
  object: function(value) {
    return {
      make: function() {
        return value != null ? value : {};
      },
      validate: function(value, target, invalid) {
        if (typeof value === 'object') {
          return value;
        }
        return invalid();
      },
      clone: function(v) {
        return JSON.parse(JSON.stringify(v));
      }
    };
  },
  timestamp: function(value) {
    if (value == null) {
      value = null;
    }
    if (typeof value === 'string') {
      value = Date.parse(value);
    }
    return {
      uniform: function() {
        return 'f';
      },
      make: function() {
        return value != null ? value : +new Date();
      },
      validate: function(value, target, invalid) {
        var x;
        value = Date.parse(value);
        if (value !== (x = +value)) {
          return invalid();
        }
        return value;
      },
      op: function(a, b, target, op) {
        return op(a, b);
      }
    };
  },
  vec2: function(x, y) {
    var defaults;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    defaults = [x, y];
    return {
      uniform: function() {
        return 'v2';
      },
      make: function() {
        return new THREE.Vector2(x, y);
      },
      validate: function(value, target, invalid) {
        var xx, yy, _ref, _ref1;
        if (value === +value) {
          value = [value];
        }
        if (value instanceof THREE.Vector2) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.set.apply(target, value);
        } else if (value != null) {
          xx = (_ref = value.x) != null ? _ref : x;
          yy = (_ref1 = value.y) != null ? _ref1 : y;
          target.set(xx, yy);
        } else {
          return invalid();
        }
        return target;
      },
      equals: function(a, b) {
        return a.x === b.x && a.y === b.y;
      },
      op: function(a, b, target, op) {
        target.x = op(a.x, b.x);
        target.y = op(a.y, b.y);
        return target;
      }
    };
  },
  ivec2: function(x, y) {
    var validate, vec2;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    vec2 = Types.vec2(x, y);
    validate = vec2.validate;
    vec2.validate = function(value, target, invalid) {
      validate(value, target, invalid);
      target.x = Math.round(target.x);
      target.y = Math.round(target.y);
      return target;
    };
    return vec2;
  },
  vec3: function(x, y, z) {
    var defaults;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (z == null) {
      z = 0;
    }
    defaults = [x, y, z];
    return {
      uniform: function() {
        return 'v3';
      },
      make: function() {
        return new THREE.Vector3(x, y, z);
      },
      validate: function(value, target, invalid) {
        var xx, yy, zz, _ref, _ref1, _ref2;
        if (value === +value) {
          value = [value];
        }
        if (value instanceof THREE.Vector3) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.set.apply(target, value);
        } else if (value != null) {
          xx = (_ref = value.x) != null ? _ref : x;
          yy = (_ref1 = value.y) != null ? _ref1 : y;
          zz = (_ref2 = value.z) != null ? _ref2 : z;
          target.set(xx, yy, zz);
        } else {
          return invalid();
        }
        return target;
      },
      equals: function(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
      },
      op: function(a, b, target, op) {
        target.x = op(a.x, b.x);
        target.y = op(a.y, b.y);
        target.z = op(a.z, b.z);
        return target;
      }
    };
  },
  ivec3: function(x, y, z) {
    var validate, vec3;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (z == null) {
      z = 0;
    }
    vec3 = Types.vec3(x, y, z);
    validate = vec3.validate;
    vec3.validate = function(value, target) {
      validate(value, target, invalid);
      target.x = Math.round(target.x);
      target.y = Math.round(target.y);
      target.z = Math.round(target.z);
      return target;
    };
    return vec3;
  },
  vec4: function(x, y, z, w) {
    var defaults;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (z == null) {
      z = 0;
    }
    if (w == null) {
      w = 0;
    }
    defaults = [x, y, z, w];
    return {
      uniform: function() {
        return 'v4';
      },
      make: function() {
        return new THREE.Vector4(x, y, z, w);
      },
      validate: function(value, target, invalid) {
        var ww, xx, yy, zz, _ref, _ref1, _ref2, _ref3;
        if (value === +value) {
          value = [value];
        }
        if (value instanceof THREE.Vector4) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.set.apply(target, value);
        } else if (value != null) {
          xx = (_ref = value.x) != null ? _ref : x;
          yy = (_ref1 = value.y) != null ? _ref1 : y;
          zz = (_ref2 = value.z) != null ? _ref2 : z;
          ww = (_ref3 = value.w) != null ? _ref3 : w;
          target.set(xx, yy, zz, ww);
        } else {
          return invalid();
        }
        return target;
      },
      equals: function(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
      },
      op: function(a, b, target, op) {
        target.x = op(a.x, b.x);
        target.y = op(a.y, b.y);
        target.z = op(a.z, b.z);
        target.w = op(a.w, b.w);
        return target;
      }
    };
  },
  ivec4: function(x, y, z, w) {
    var validate, vec4;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (z == null) {
      z = 0;
    }
    if (w == null) {
      w = 0;
    }
    vec4 = Types.vec4(x, y, z, w);
    validate = vec4.validate;
    vec4.validate = function(value, target) {
      validate(value, target, invalid);
      target.x = Math.round(target.x);
      target.y = Math.round(target.y);
      target.z = Math.round(target.z);
      target.w = Math.round(target.w);
      return target;
    };
    return vec4;
  },
  mat3: function(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    var defaults;
    if (n11 == null) {
      n11 = 1;
    }
    if (n12 == null) {
      n12 = 0;
    }
    if (n13 == null) {
      n13 = 0;
    }
    if (n21 == null) {
      n21 = 0;
    }
    if (n22 == null) {
      n22 = 1;
    }
    if (n23 == null) {
      n23 = 0;
    }
    if (n31 == null) {
      n31 = 0;
    }
    if (n32 == null) {
      n32 = 0;
    }
    if (n33 == null) {
      n33 = 1;
    }
    defaults = [n11, n12, n13, n21, n22, n23, n31, n32, n33];
    return {
      uniform: function() {
        return 'm4';
      },
      make: function() {
        var m;
        m = new THREE.Matrix3;
        m.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);
        return m;
      },
      validate: function(value, target, invalid) {
        if (value instanceof THREE.Matrix3) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.set.apply(target, value);
        } else {
          return invalid();
        }
        return target;
      }
    };
  },
  mat4: function(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    var defaults;
    if (n11 == null) {
      n11 = 1;
    }
    if (n12 == null) {
      n12 = 0;
    }
    if (n13 == null) {
      n13 = 0;
    }
    if (n14 == null) {
      n14 = 0;
    }
    if (n21 == null) {
      n21 = 0;
    }
    if (n22 == null) {
      n22 = 1;
    }
    if (n23 == null) {
      n23 = 0;
    }
    if (n24 == null) {
      n24 = 0;
    }
    if (n31 == null) {
      n31 = 0;
    }
    if (n32 == null) {
      n32 = 0;
    }
    if (n33 == null) {
      n33 = 1;
    }
    if (n34 == null) {
      n34 = 0;
    }
    if (n41 == null) {
      n41 = 0;
    }
    if (n42 == null) {
      n42 = 0;
    }
    if (n43 == null) {
      n43 = 0;
    }
    if (n44 == null) {
      n44 = 1;
    }
    defaults = [n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44];
    return {
      uniform: function() {
        return 'm4';
      },
      make: function() {
        var m;
        m = new THREE.Matrix4;
        m.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
        return m;
      },
      validate: function(value, target, invalid) {
        if (value instanceof THREE.Matrix4) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.set.apply(target, value);
        } else {
          return invalid();
        }
        return target;
      }
    };
  },
  quat: function(x, y, z, w) {
    var vec4;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (z == null) {
      z = 0;
    }
    if (w == null) {
      w = 1;
    }
    vec4 = Types.vec4(x, y, z, w);
    return {
      uniform: function() {
        return 'v4';
      },
      make: function() {
        return new THREE.Quaternion;
      },
      validate: function(value, target, invalid) {
        if (value instanceof THREE.Quaternion) {
          target.copy(value);
        } else {
          target = vec4.validate(value, target, invalid);
        }
        target.normalize();
        return target;
      },
      equals: function(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
      },
      op: function(a, b, target, op) {
        target.x = op(a.x, b.x);
        target.y = op(a.y, b.y);
        target.z = op(a.z, b.z);
        target.w = op(a.w, b.w);
        target.normalize();
        return target;
      },
      lerp: function(a, b, target, f) {
        THREE.Quaternion.slerp(a, b, target, f);
        return target;
      }
    };
  },
  color: function(r, g, b) {
    var defaults;
    if (r == null) {
      r = .5;
    }
    if (g == null) {
      g = .5;
    }
    if (b == null) {
      b = .5;
    }
    defaults = [r, g, b];
    return {
      uniform: function() {
        return 'c';
      },
      make: function() {
        return new THREE.Color(r, g, b);
      },
      validate: function(value, target, invalid) {
        var bb, gg, rr, _ref, _ref1, _ref2;
        if (value === "" + value) {
          value = new THREE.Color().setStyle(value);
        } else if (value === +value) {
          value = new THREE.Color(value);
        }
        if (value instanceof THREE.Color) {
          target.copy(value);
        } else if (value instanceof Array) {
          value = value.concat(defaults.slice(value.length));
          target.setRGB.apply(target, value);
        } else if (value != null) {
          rr = (_ref = value.r) != null ? _ref : r;
          gg = (_ref1 = value.g) != null ? _ref1 : g;
          bb = (_ref2 = value.b) != null ? _ref2 : b;
          target.set(rr, gg, bb);
        } else {
          return invalid();
        }
        return target;
      },
      equals: function(a, b) {
        return a.r === b.r && a.g === b.g && a.b === b.b;
      },
      op: function(a, b, target, op) {
        target.r = op(a.r, b.r);
        target.g = op(a.g, b.g);
        target.b = op(a.b, b.b);
        return target;
      }
    };
  },
  axis: function(value, allowZero) {
    var map, range, v;
    if (value == null) {
      value = 1;
    }
    if (allowZero == null) {
      allowZero = false;
    }
    map = {
      x: 1,
      y: 2,
      z: 3,
      w: 4,
      W: 1,
      H: 2,
      D: 3,
      I: 4,
      zero: 0,
      "null": 0,
      width: 1,
      height: 2,
      depth: 3,
      items: 4
    };
    range = allowZero ? [0, 1, 2, 3, 4] : [1, 2, 3, 4];
    if ((v = map[value]) != null) {
      value = v;
    }
    return {
      make: function() {
        return value;
      },
      validate: function(value, target, invalid) {
        var _ref;
        if ((v = map[value]) != null) {
          value = v;
        }
        value = (_ref = Math.round(value)) != null ? _ref : 0;
        if (__indexOf.call(range, value) >= 0) {
          return value;
        }
        return invalid();
      }
    };
  },
  transpose: function(order) {
    var axesArray, looseArray;
    if (order == null) {
      order = [1, 2, 3, 4];
    }
    looseArray = Types.letters(Types.axis(null, false), 0, order);
    axesArray = Types.letters(Types.axis(null, false), 4, order);
    return {
      make: function() {
        return axesArray.make();
      },
      validate: function(value, target, invalid) {
        var i, letter, missing, temp, unique;
        temp = [1, 2, 3, 4];
        looseArray.validate(value, temp, invalid);
        if (temp.length < 4) {
          missing = [1, 2, 3, 4].filter(function(x) {
            return temp.indexOf(x) === -1;
          });
          temp = temp.concat(missing);
        }
        unique = (function() {
          var _i, _len, _results;
          _results = [];
          for (i = _i = 0, _len = temp.length; _i < _len; i = ++_i) {
            letter = temp[i];
            _results.push(temp.indexOf(letter) === i);
          }
          return _results;
        })();
        if (unique.indexOf(false) < 0) {
          return axesArray.validate(temp, target, invalid);
        }
        return invalid();
      },
      equals: axesArray.equals,
      clone: axesArray.clone
    };
  },
  swizzle: function(order, size) {
    var axesArray, looseArray;
    if (order == null) {
      order = [1, 2, 3, 4];
    }
    if (size == null) {
      size = null;
    }
    if (size == null) {
      size = order.length;
    }
    order = order.slice(0, size);
    looseArray = Types.letters(Types.axis(null, false), 0, order);
    axesArray = Types.letters(Types.axis(null, true), size, order);
    return {
      make: function() {
        return axesArray.make();
      },
      validate: function(value, target, invalid) {
        var temp;
        temp = order.slice();
        looseArray.validate(value, temp, invalid);
        if (temp.length < size) {
          temp = temp.concat([0, 0, 0, 0]).slice(0, size);
        }
        return axesArray.validate(temp, target, invalid);
      },
      equals: axesArray.equals,
      clone: axesArray.clone
    };
  },
  classes: function() {
    var stringArray;
    stringArray = Types.array(Types.string());
    return {
      make: function() {
        return stringArray.make();
      },
      validate: function(value, target, invalid) {
        if (value === "" + value) {
          value = value.split(' ');
        }
        value = value.filter(function(x) {
          return !!x.length;
        });
        return stringArray.validate(value, target, invalid);
      },
      equals: stringArray.equals,
      clone: stringArray.clone
    };
  },
  blending: function(value) {
    var keys;
    if (value == null) {
      value = 'normal';
    }
    keys = ['no', 'normal', 'add', 'subtract', 'multiply', 'custom'];
    return Types["enum"](value, keys);
  },
  filter: function(value) {
    var map;
    if (value == null) {
      value = 'nearest';
    }
    map = {
      nearest: THREE.NearestFilter,
      nearestMipMapNearest: THREE.NearestMipMapNearestFilter,
      nearestMipMapLinear: THREE.NearestMipMapLinearFilter,
      linear: THREE.LinearFilter,
      linearMipMapNearest: THREE.LinearMipMapNearestFilter,
      linearMipmapLinear: THREE.LinearMipMapLinearFilter
    };
    return Types["enum"](value, [], map);
  },
  type: function(value) {
    var map;
    if (value == null) {
      value = 'unsignedByte';
    }
    map = {
      unsignedByte: THREE.UnsignedByteType,
      byte: THREE.ByteType,
      short: THREE.ShortType,
      unsignedShort: THREE.UnsignedShortType,
      int: THREE.IntType,
      unsignedInt: THREE.UnsignedIntType,
      float: THREE.FloatType
    };
    return Types["enum"](value, [], map);
  },
  scale: function(value) {
    var keys;
    if (value == null) {
      value = 'linear';
    }
    keys = ['linear', 'log'];
    return Types["enum"](value, keys);
  },
  mapping: function(value) {
    var keys;
    if (value == null) {
      value = 'relative';
    }
    keys = ['relative', 'absolute'];
    return Types["enum"](value, keys);
  },
  indexing: function(value) {
    var keys;
    if (value == null) {
      value = 'original';
    }
    keys = ['original', 'final'];
    return Types["enum"](value, keys);
  },
  shape: function(value) {
    var keys;
    if (value == null) {
      value = 'circle';
    }
    keys = ['circle', 'square', 'diamond', 'up', 'down', 'left', 'right'];
    return Types["enum"](value, keys);
  },
  stroke: function(value) {
    var keys;
    if (value == null) {
      value = 'solid';
    }
    keys = ['solid', 'dotted', 'dashed'];
    return Types["enum"](value, keys);
  },
  vertexPass: function(value) {
    var keys;
    if (value == null) {
      value = 'view';
    }
    keys = ['data', 'view', 'world', 'eye'];
    return Types["enum"](value, keys);
  },
  fragmentPass: function(value) {
    var keys;
    if (value == null) {
      value = 'light';
    }
    keys = ['color', 'light', 'rgba'];
    return Types["enum"](value, keys);
  },
  ease: function(value) {
    var keys;
    if (value == null) {
      value = 'linear';
    }
    keys = ['linear', 'cosine'];
    return Types["enum"](value, keys);
  },
  fit: function(value) {
    var keys;
    if (value == null) {
      value = 'contain';
    }
    keys = ['x', 'y', 'contain', 'cover'];
    return Types["enum"](value, keys);
  },
  anchor: function(value) {
    var map;
    if (value == null) {
      value = 'middle';
    }
    map = {
      first: 1,
      middle: 0,
      last: -1
    };
    return Types.enumber(value, [], map);
  },
  transitionState: function(value) {
    var map;
    if (value == null) {
      value = 'enter';
    }
    map = {
      enter: -1,
      visible: 0,
      exit: 1
    };
    return Types.enumber(value, [], map);
  },
  font: function(value) {
    var parse, stringArray;
    if (value == null) {
      value = 'sans-serif';
    }
    parse = Util.JS.parseQuoted;
    if (!(value instanceof Array)) {
      value = parse(value);
    }
    stringArray = Types.array(Types.string(), 0, value);
    return {
      make: function() {
        return stringArray.make();
      },
      validate: function(value, target, invalid) {
        try {
          if (!(value instanceof Array)) {
            value = parse(value);
          }
        } catch (_error) {
          return invalid();
        }
        value = value.filter(function(x) {
          return !!x.length;
        });
        return stringArray.validate(value, target, invalid);
      },
      equals: stringArray.equals,
      clone: stringArray.clone
    };
  }
};

decorate = function(types) {
  var k, type;
  for (k in types) {
    type = types[k];
    types[k] = (function(type) {
      return function() {
        var t;
        t = type.apply(type, arguments);
        if (t.validate == null) {
          t.validate = function(v) {
            return v != null;
          };
        }
        if (t.equals == null) {
          t.equals = function(a, b) {
            return a === b;
          };
        }
        if (t.clone == null) {
          t.clone = function(v) {
            var _ref;
            return (_ref = v != null ? typeof v.clone === "function" ? v.clone() : void 0 : void 0) != null ? _ref : v;
          };
        }
        return t;
      };
    })(type);
  }
  return types;
};

module.exports = decorate(Types);


},{"../../util":172}],113:[function(require,module,exports){
var Cartesian, Util, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Util = require('../../../util');

Cartesian = (function(_super) {
  __extends(Cartesian, _super);

  function Cartesian() {
    return Cartesian.__super__.constructor.apply(this, arguments);
  }

  Cartesian.traits = ['node', 'object', 'visible', 'view', 'view3', 'vertex'];

  Cartesian.prototype.make = function() {
    Cartesian.__super__.make.apply(this, arguments);
    this.uniforms = {
      viewMatrix: this._attributes.make(this._types.mat4())
    };
    this.viewMatrix = this.uniforms.viewMatrix.value;
    return this.composer = Util.Three.transformComposer();
  };

  Cartesian.prototype.unmake = function() {
    Cartesian.__super__.unmake.apply(this, arguments);
    delete this.viewMatrix;
    delete this.objectMatrix;
    return delete this.uniforms;
  };

  Cartesian.prototype.change = function(changed, touched, init) {
    var dx, dy, dz, e, g, p, q, r, s, sx, sy, sz, transformMatrix, x, y, z;
    if (!(touched['view'] || touched['view3'] || init)) {
      return;
    }
    p = this.props.position;
    s = this.props.scale;
    q = this.props.quaternion;
    r = this.props.rotation;
    g = this.props.range;
    e = this.props.eulerOrder;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    sx = s.x;
    sy = s.y;
    sz = s.z;
    this.viewMatrix.set(2 / dx, 0, 0, -(2 * x + dx) / dx, 0, 2 / dy, 0, -(2 * y + dy) / dy, 0, 0, 2 / dz, -(2 * z + dz) / dz, 0, 0, 0, 1);
    transformMatrix = this.composer(p, r, q, s, null, e);
    this.viewMatrix.multiplyMatrices(transformMatrix, this.viewMatrix);
    if (changed['view.range']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Cartesian.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('cartesian.position', this.uniforms);
    }
    return Cartesian.__super__.vertex.call(this, shader, pass);
  };

  return Cartesian;

})(View);

module.exports = Cartesian;


},{"../../../util":172,"./view":119}],114:[function(require,module,exports){
var Cartesian4, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Cartesian4 = (function(_super) {
  __extends(Cartesian4, _super);

  function Cartesian4() {
    return Cartesian4.__super__.constructor.apply(this, arguments);
  }

  Cartesian4.traits = ['node', 'object', 'visible', 'view', 'view4', 'vertex'];

  Cartesian4.prototype.make = function() {
    Cartesian4.__super__.make.apply(this, arguments);
    this.uniforms = {
      basisOffset: this._attributes.make(this._types.vec4()),
      basisScale: this._attributes.make(this._types.vec4())
    };
    this.basisScale = this.uniforms.basisScale.value;
    return this.basisOffset = this.uniforms.basisOffset.value;
  };

  Cartesian4.prototype.unmake = function() {
    Cartesian4.__super__.unmake.apply(this, arguments);
    delete this.basisScale;
    delete this.basisOffset;
    return delete this.uniforms;
  };

  Cartesian4.prototype.change = function(changed, touched, init) {
    var dw, dx, dy, dz, g, mult, p, s, w, x, y, z;
    if (!(touched['view'] || touched['view4'] || init)) {
      return;
    }
    p = this.props.position;
    s = this.props.scale;
    g = this.props.range;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    w = g[3].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    dw = (g[3].y - w) || 1;
    mult = function(a, b) {
      a.x *= b.x;
      a.y *= b.y;
      a.z *= b.z;
      return a.w *= b.w;
    };
    this.basisScale.set(2 / dx, 2 / dy, 2 / dz, 2 / dw);
    this.basisOffset.set(-(2 * x + dx) / dx, -(2 * y + dy) / dy, -(2 * z + dz) / dz, -(2 * w + dw) / dw);
    mult(this.basisScale, s);
    mult(this.basisOffset, s);
    this.basisOffset.add(p);
    if (changed['view.range']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Cartesian4.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('cartesian4.position', this.uniforms);
    }
    return Cartesian4.__super__.vertex.call(this, shader, pass);
  };

  return Cartesian4;

})(View);

module.exports = Cartesian4;


},{"./view":119}],115:[function(require,module,exports){
var Polar, Util, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Util = require('../../../util');

Polar = (function(_super) {
  __extends(Polar, _super);

  function Polar() {
    return Polar.__super__.constructor.apply(this, arguments);
  }

  Polar.traits = ['node', 'object', 'visible', 'view', 'view3', 'polar', 'vertex'];

  Polar.prototype.make = function() {
    var types;
    Polar.__super__.make.apply(this, arguments);
    types = this._attributes.types;
    this.uniforms = {
      polarBend: this.node.attributes['polar.bend'],
      polarHelix: this.node.attributes['polar.helix'],
      polarFocus: this._attributes.make(types.number()),
      polarAspect: this._attributes.make(types.number()),
      viewMatrix: this._attributes.make(types.mat4())
    };
    this.viewMatrix = this.uniforms.viewMatrix.value;
    this.composer = Util.Three.transformComposer();
    return this.aspect = 1;
  };

  Polar.prototype.unmake = function() {
    Polar.__super__.unmake.apply(this, arguments);
    delete this.viewMatrix;
    delete this.objectMatrix;
    delete this.aspect;
    return delete this.uniforms;
  };

  Polar.prototype.change = function(changed, touched, init) {
    var ady, aspect, bend, dx, dy, dz, e, fdx, focus, g, helix, idx, p, q, r, s, sdx, sdy, sx, sy, sz, transformMatrix, x, y, z, _ref;
    if (!(touched['view'] || touched['view3'] || touched['polar'] || init)) {
      return;
    }
    this.helix = helix = this.props.helix;
    this.bend = bend = this.props.bend;
    this.focus = focus = bend > 0 ? 1 / bend - 1 : 0;
    p = this.props.position;
    s = this.props.scale;
    q = this.props.quaternion;
    r = this.props.rotation;
    g = this.props.range;
    e = this.props.eulerOrder;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    sx = s.x;
    sy = s.y;
    sz = s.z;
    idx = dx > 0 ? 1 : -1;
    _ref = Util.Axis.recenterAxis(y, dy, bend), y = _ref[0], dy = _ref[1];
    ady = Math.abs(dy);
    fdx = dx + (ady * idx - dx) * bend;
    sdx = fdx / sx;
    sdy = dy / sy;
    this.aspect = aspect = Math.abs(sdx / sdy);
    this.uniforms.polarFocus.value = focus;
    this.uniforms.polarAspect.value = aspect;
    this.viewMatrix.set(2 / fdx, 0, 0, -(2 * x + dx) / dx, 0, 2 / dy, 0, -(2 * y + dy) / dy, 0, 0, 2 / dz, -(2 * z + dz) / dz, 0, 0, 0, 1);
    transformMatrix = this.composer(p, r, q, s, null, e);
    this.viewMatrix.multiplyMatrices(transformMatrix, this.viewMatrix);
    if (changed['view.range'] || touched['polar']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Polar.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('polar.position', this.uniforms);
    }
    return Polar.__super__.vertex.call(this, shader, pass);
  };

  Polar.prototype.axis = function(dimension) {
    var max, min, range;
    range = this.props.range[dimension - 1];
    min = range.x;
    max = range.y;
    if (dimension === 2 && this.bend > 0) {
      max = Math.max(Math.abs(max), Math.abs(min));
      min = Math.max(-this.focus / this.aspect, min);
    }
    return new THREE.Vector2(min, max);
  };

  return Polar;

})(View);

module.exports = Polar;


},{"../../../util":172,"./view":119}],116:[function(require,module,exports){
var Spherical, Util, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Util = require('../../../util');

Spherical = (function(_super) {
  __extends(Spherical, _super);

  function Spherical() {
    return Spherical.__super__.constructor.apply(this, arguments);
  }

  Spherical.traits = ['node', 'object', 'visible', 'view', 'view3', 'spherical', 'vertex'];

  Spherical.prototype.make = function() {
    var types;
    Spherical.__super__.make.apply(this, arguments);
    types = this._attributes.types;
    this.uniforms = {
      sphericalBend: this.node.attributes['spherical.bend'],
      sphericalFocus: this._attributes.make(this._types.number()),
      sphericalAspectX: this._attributes.make(this._types.number()),
      sphericalAspectY: this._attributes.make(this._types.number()),
      sphericalScaleY: this._attributes.make(this._types.number()),
      viewMatrix: this._attributes.make(this._types.mat4())
    };
    this.viewMatrix = this.uniforms.viewMatrix.value;
    this.composer = Util.Three.transformComposer();
    this.aspectX = 1;
    return this.aspectY = 1;
  };

  Spherical.prototype.unmake = function() {
    Spherical.__super__.unmake.apply(this, arguments);
    delete this.viewMatrix;
    delete this.objectMatrix;
    delete this.aspectX;
    delete this.aspectY;
    return delete this.uniforms;
  };

  Spherical.prototype.change = function(changed, touched, init) {
    var adz, aspectX, aspectY, aspectZ, bend, dx, dy, dz, e, fdx, fdy, focus, g, idx, idy, p, q, r, s, scaleY, sdx, sdy, sdz, sx, sy, sz, transformMatrix, x, y, z, _ref, _ref1;
    if (!(touched['view'] || touched['view3'] || touched['spherical'] || init)) {
      return;
    }
    this.bend = bend = this.props.bend;
    this.focus = focus = bend > 0 ? 1 / bend - 1 : 0;
    p = this.props.position;
    s = this.props.scale;
    q = this.props.quaternion;
    r = this.props.rotation;
    g = this.props.range;
    e = this.props.eulerOrder;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    sx = s.x;
    sy = s.y;
    sz = s.z;
    _ref = Util.Axis.recenterAxis(y, dy, bend), y = _ref[0], dy = _ref[1];
    _ref1 = Util.Axis.recenterAxis(z, dz, bend), z = _ref1[0], dz = _ref1[1];
    idx = dx > 0 ? 1 : -1;
    idy = dy > 0 ? 1 : -1;
    adz = Math.abs(dz);
    fdx = dx + (adz * idx - dx) * bend;
    fdy = dy + (adz * idy - dy) * bend;
    sdx = fdx / sx;
    sdy = fdy / sy;
    sdz = dz / sz;
    this.aspectX = aspectX = Math.abs(sdx / sdz);
    this.aspectY = aspectY = Math.abs(sdy / sdz / aspectX);
    aspectZ = dy / dx * sx / sy * 2;
    this.scaleY = scaleY = Math.min(aspectY / bend, 1 + (aspectZ - 1) * bend);
    this.uniforms.sphericalBend.value = bend;
    this.uniforms.sphericalFocus.value = focus;
    this.uniforms.sphericalAspectX.value = aspectX;
    this.uniforms.sphericalAspectY.value = aspectY;
    this.uniforms.sphericalScaleY.value = scaleY;
    this.viewMatrix.set(2 / fdx, 0, 0, -(2 * x + dx) / dx, 0, 2 / fdy, 0, -(2 * y + dy) / dy, 0, 0, 2 / dz, -(2 * z + dz) / dz, 0, 0, 0, 1);
    transformMatrix = this.composer(p, r, q, s, null, e);
    this.viewMatrix.multiplyMatrices(transformMatrix, this.viewMatrix);
    if (changed['view.range'] || touched['spherical']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Spherical.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('spherical.position', this.uniforms);
    }
    return Spherical.__super__.vertex.call(this, shader, pass);
  };

  Spherical.prototype.axis = function(dimension) {
    var max, min, range;
    range = this.props.range[dimension - 1];
    min = range.x;
    max = range.y;
    if (dimension === 3 && this.bend > 0) {
      max = Math.max(Math.abs(max), Math.abs(min));
      min = Math.max(-this.focus / this.aspectX + .001, min);
    }
    return new THREE.Vector2(min, max);
  };

  return Spherical;

})(View);

module.exports = Spherical;


},{"../../../util":172,"./view":119}],117:[function(require,module,exports){
var Stereographic, Util, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Util = require('../../../util');

Stereographic = (function(_super) {
  __extends(Stereographic, _super);

  function Stereographic() {
    return Stereographic.__super__.constructor.apply(this, arguments);
  }

  Stereographic.traits = ['node', 'object', 'visible', 'view', 'view3', 'stereographic', 'vertex'];

  Stereographic.prototype.make = function() {
    var types;
    Stereographic.__super__.make.apply(this, arguments);
    types = this._attributes.types;
    this.uniforms = {
      stereoBend: this.node.attributes['stereographic.bend'],
      viewMatrix: this._attributes.make(this._types.mat4())
    };
    this.viewMatrix = this.uniforms.viewMatrix.value;
    return this.composer = Util.Three.transformComposer();
  };

  Stereographic.prototype.unmake = function() {
    Stereographic.__super__.unmake.apply(this, arguments);
    delete this.viewMatrix;
    delete this.rotationMatrix;
    return delete this.uniforms;
  };

  Stereographic.prototype.change = function(changed, touched, init) {
    var bend, dx, dy, dz, e, g, p, q, r, s, sx, sy, sz, transformMatrix, x, y, z, _ref;
    if (!(touched['view'] || touched['view3'] || touched['stereographic'] || init)) {
      return;
    }
    this.bend = bend = this.props.bend;
    p = this.props.position;
    s = this.props.scale;
    q = this.props.quaternion;
    r = this.props.rotation;
    g = this.props.range;
    e = this.props.eulerOrder;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    sx = s.x;
    sy = s.y;
    sz = s.z;
    _ref = Util.Axis.recenterAxis(z, dz, bend, 1), z = _ref[0], dz = _ref[1];
    this.uniforms.stereoBend.value = bend;
    this.viewMatrix.set(2 / dx, 0, 0, -(2 * x + dx) / dx, 0, 2 / dy, 0, -(2 * y + dy) / dy, 0, 0, 2 / dz, -(2 * z + dz) / dz, 0, 0, 0, 1);
    transformMatrix = this.composer(p, r, q, s, null, e);
    this.viewMatrix.multiplyMatrices(transformMatrix, this.viewMatrix);
    if (changed['view.range'] || touched['stereographic']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Stereographic.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('stereographic.position', this.uniforms);
    }
    return Stereographic.__super__.vertex.call(this, shader, pass);
  };

  return Stereographic;

})(View);

module.exports = Stereographic;


},{"../../../util":172,"./view":119}],118:[function(require,module,exports){
var Stereographic4, Util, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

View = require('./view');

Util = require('../../../util');

Stereographic4 = (function(_super) {
  __extends(Stereographic4, _super);

  function Stereographic4() {
    return Stereographic4.__super__.constructor.apply(this, arguments);
  }

  Stereographic4.traits = ['node', 'object', 'visible', 'view', 'view4', 'stereographic', 'vertex'];

  Stereographic4.prototype.make = function() {
    Stereographic4.__super__.make.apply(this, arguments);
    this.uniforms = {
      basisOffset: this._attributes.make(this._types.vec4()),
      basisScale: this._attributes.make(this._types.vec4()),
      stereoBend: this.node.attributes['stereographic.bend']
    };
    this.basisScale = this.uniforms.basisScale.value;
    return this.basisOffset = this.uniforms.basisOffset.value;
  };

  Stereographic4.prototype.unmake = function() {
    Stereographic4.__super__.unmake.apply(this, arguments);
    delete this.basisScale;
    delete this.basisOffset;
    return delete this.uniforms;
  };

  Stereographic4.prototype.change = function(changed, touched, init) {
    var bend, dw, dx, dy, dz, g, mult, p, s, w, x, y, z, _ref;
    if (!(touched['view'] || touched['view4'] || touched['stereographic'] || init)) {
      return;
    }
    this.bend = bend = this.props.bend;
    p = this.props.position;
    s = this.props.scale;
    g = this.props.range;
    x = g[0].x;
    y = g[1].x;
    z = g[2].x;
    w = g[3].x;
    dx = (g[0].y - x) || 1;
    dy = (g[1].y - y) || 1;
    dz = (g[2].y - z) || 1;
    dw = (g[3].y - w) || 1;
    mult = function(a, b) {
      a.x *= b.x;
      a.y *= b.y;
      a.z *= b.z;
      return a.w *= b.w;
    };
    _ref = Util.Axis.recenterAxis(w, dw, bend, 1), w = _ref[0], dw = _ref[1];
    this.basisScale.set(2 / dx, 2 / dy, 2 / dz, 2 / dw);
    this.basisOffset.set(-(2 * x + dx) / dx, -(2 * y + dy) / dy, -(2 * z + dz) / dz, -(2 * w + dw) / dw);
    mult(this.basisScale, s);
    mult(this.basisOffset, s);
    this.basisOffset.add(p);
    if (changed['view.range'] || touched['stereographic']) {
      return this.trigger({
        type: 'view.range'
      });
    }
  };

  Stereographic4.prototype.vertex = function(shader, pass) {
    if (pass === 1) {
      shader.pipe('stereographic4.position', this.uniforms);
    }
    return Stereographic4.__super__.vertex.call(this, shader, pass);
  };

  return Stereographic4;

})(View);

module.exports = Stereographic4;


},{"../../../util":172,"./view":119}],119:[function(require,module,exports){
var Transform, View,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Transform = require('../transform/transform');

View = (function(_super) {
  __extends(View, _super);

  function View() {
    return View.__super__.constructor.apply(this, arguments);
  }

  View.traits = ['node', 'object', 'visible', 'view', 'vertex'];

  View.prototype.make = function() {
    return this._helpers.visible.make();
  };

  View.prototype.unmake = function() {
    return this._helpers.visible.unmake();
  };

  View.prototype.axis = function(dimension) {
    return this.props.range[dimension - 1];
  };

  return View;

})(Transform);

module.exports = View;


},{"../transform/transform":108}],120:[function(require,module,exports){
var ArrayBuffer_, DataBuffer, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DataBuffer = require('./databuffer');

Util = require('../../util');


/*
 * 1D + history array
 */

ArrayBuffer_ = (function(_super) {
  __extends(ArrayBuffer_, _super);

  function ArrayBuffer_(renderer, shaders, options) {
    this.length = options.length || 1;
    this.history = options.history || 1;
    this.samples = this.length;
    options.width = this.length;
    options.height = this.history;
    options.depth = 1;
    ArrayBuffer_.__super__.constructor.call(this, renderer, shaders, options);
  }

  ArrayBuffer_.prototype.build = function(options) {
    ArrayBuffer_.__super__.build.apply(this, arguments);
    this.index = 0;
    this.pad = 0;
    return this.streamer = this.generate(this.data);
  };

  ArrayBuffer_.prototype.setActive = function(i) {
    return this.pad = Math.max(0, this.length - i);
  };

  ArrayBuffer_.prototype.fill = function() {
    var callback, count, done, emit, i, limit, reset, skip, _ref;
    callback = this.callback;
    if (typeof callback.reset === "function") {
      callback.reset();
    }
    _ref = this.streamer, emit = _ref.emit, skip = _ref.skip, count = _ref.count, done = _ref.done, reset = _ref.reset;
    reset();
    limit = this.samples - this.pad;
    i = 0;
    while (!done() && i < limit && callback(emit, i++) !== false) {
      true;
    }
    return Math.floor(count() / this.items);
  };

  ArrayBuffer_.prototype.write = function(n) {
    if (n == null) {
      n = this.samples;
    }
    n *= this.items;
    this.texture.write(this.data, 0, this.index, n, 1);
    this.dataPointer.set(.5, this.index + .5);
    this.index = (this.index + this.history - 1) % this.history;
    return this.filled = Math.min(this.history, this.filled + 1);
  };

  ArrayBuffer_.prototype.through = function(callback, target) {
    var consume, done, dst, emit, i, pipe, src, _ref;
    _ref = src = this.streamer, consume = _ref.consume, done = _ref.done;
    emit = (dst = target.streamer).emit;
    i = 0;
    pipe = function() {
      return consume(function(x, y, z, w) {
        return callback(emit, x, y, z, w, i);
      });
    };
    pipe = Util.Data.repeatCall(pipe, this.items);
    return (function(_this) {
      return function() {
        var limit;
        src.reset();
        dst.reset();
        limit = _this.samples - _this.pad;
        i = 0;
        while (!done() && i < limit) {
          pipe();
          i++;
        }
        return src.count();
      };
    })(this);
  };

  return ArrayBuffer_;

})(DataBuffer);

module.exports = ArrayBuffer_;


},{"../../util":172,"./databuffer":123}],121:[function(require,module,exports){
var Atlas, BackedTexture, DataTexture, Renderable, Row, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

Util = require('../../util');

DataTexture = require('./texture/datatexture');

BackedTexture = require('./texture/backedtexture');


/*
 * Dynamic sprite atlas
 *
 * - Allocates variable-sized sprites in rows
 * - Will grow itself when full
 */

Atlas = (function(_super) {
  __extends(Atlas, _super);

  function Atlas(renderer, shaders, options) {
    if (this.width == null) {
      this.width = options.width || 512;
    }
    if (this.height == null) {
      this.height = options.height || 512;
    }
    if (this.channels == null) {
      this.channels = options.channels || 4;
    }
    if (this.backed == null) {
      this.backed = options.backed || false;
    }
    this.samples = this.width * this.height;
    Atlas.__super__.constructor.call(this, renderer, shaders);
    this.build(options);
  }

  Atlas.prototype.shader = function(shader) {
    shader.pipe("map.2d.data", this.uniforms);
    shader.pipe("sample.2d", this.uniforms);
    if (this.channels < 4) {
      shader.pipe(Util.GLSL.swizzleVec4(['0000', 'x000', 'xw00', 'xyz0'][this.channels]));
    }
    return shader;
  };

  Atlas.prototype.build = function(options) {
    var klass;
    this.klass = klass = this.backed ? BackedTexture : DataTexture;
    this.texture = new klass(this.gl, this.width, this.height, this.channels, options);
    this.uniforms = {
      dataPointer: {
        type: 'v2',
        value: new THREE.Vector2(0, 0)
      }
    };
    this._adopt(this.texture.uniforms);
    return this.reset();
  };

  Atlas.prototype.reset = function() {
    this.rows = [];
    return this.bottom = 0;
  };

  Atlas.prototype.resize = function(width, height) {
    if (!this.backed) {
      throw new Error("Cannot resize unbacked texture atlas");
    }
    if (width > 2048 && height > 2048) {
      console.warn("Giant text atlas " + width + "x" + height + ".");
    } else {
      console.info("Resizing text atlas " + width + "x" + height + ".");
    }
    this.texture.resize(width, height);
    this.width = width;
    this.height = height;
    return this.samples = width * height;
  };

  Atlas.prototype.collapse = function(row) {
    var rows;
    rows = this.rows;
    rows.splice(rows.indexOf(row), 1);
    this.bottom = rows[rows.length - 1].bottom;
    if (this.last === row) {
      return this.last = null;
    }
  };

  Atlas.prototype.allocate = function(key, width, height, emit) {
    var bottom, gap, h, i, index, max, row, top, w, _i, _len, _ref;
    w = this.width;
    h = this.height;
    max = height * 2;
    if (width > w) {
      this.resize(w * 2, h * 2);
      this.last = null;
      return this.allocate(key, width, height, emit);
    }
    row = this.last;
    if (row != null) {
      if (row.height >= height && row.height < max && row.width + width <= w) {
        row.append(key, width, height, emit);
        return;
      }
    }
    bottom = 0;
    index = -1;
    top = 0;
    _ref = this.rows;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      row = _ref[i];
      gap = row.top - bottom;
      if (gap >= height && index < 0) {
        index = i;
        top = bottom;
      }
      bottom = row.bottom;
      if (row.height >= height && row.height < max && row.width + width <= w) {
        row.append(key, width, height, emit);
        this.last = row;
        return;
      }
    }
    if (index >= 0) {
      row = new Row(top, height);
      this.rows.splice(index, 0, row);
    } else {
      top = bottom;
      bottom += height;
      if (bottom >= h) {
        this.resize(w * 2, h * 2);
        this.last = null;
        return this.allocate(key, width, height, emit);
      }
      row = new Row(top, height);
      this.rows.push(row);
      this.bottom = bottom;
    }
    row.append(key, width, height, emit);
    this.last = row;
  };

  Atlas.prototype.read = function() {
    return this.texture.textureObject;
  };

  Atlas.prototype.write = function(data, x, y, w, h) {
    return this.texture.write(data, x, y, w, h);
  };

  Atlas.prototype.dispose = function() {
    this.texture.dispose();
    this.data = null;
    return Atlas.__super__.dispose.apply(this, arguments);
  };

  return Atlas;

})(Renderable);

Row = (function() {
  function Row(top, height) {
    this.top = top;
    this.bottom = top + height;
    this.width = 0;
    this.height = height;
    this.alive = 0;
    this.keys = [];
  }

  Row.prototype.append = function(key, width, height, emit) {
    var x, y;
    x = this.width;
    y = this.top;
    this.alive++;
    this.width += width;
    this.keys.push(key);
    return emit(this, x, y);
  };

  return Row;

})();

module.exports = Atlas;


},{"../../util":172,"../renderable":158,"./texture/backedtexture":130,"./texture/datatexture":131}],122:[function(require,module,exports){
var Buffer, Renderable, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

Util = require('../../util');


/*
 * Base class for sample buffers
 */

Buffer = (function(_super) {
  __extends(Buffer, _super);

  function Buffer(renderer, shaders, options) {
    if (this.items == null) {
      this.items = options.items || 1;
    }
    if (this.samples == null) {
      this.samples = options.samples || 1;
    }
    if (this.channels == null) {
      this.channels = options.channels || 4;
    }
    if (this.callback == null) {
      this.callback = options.callback || function() {};
    }
    Buffer.__super__.constructor.call(this, renderer, shaders);
  }

  Buffer.prototype.dispose = function() {
    return Buffer.__super__.dispose.apply(this, arguments);
  };

  Buffer.prototype.update = function() {
    var n;
    n = this.fill();
    this.write(n);
    return n;
  };

  Buffer.prototype.setActive = function(i, j, k, l) {};

  Buffer.prototype.setCallback = function(callback) {
    this.callback = callback;
  };

  Buffer.prototype.write = function() {};

  Buffer.prototype.fill = function() {};

  Buffer.prototype.generate = function(data) {
    return Util.Data.getStreamer(data, this.samples, this.channels, this.items);
  };

  return Buffer;

})(Renderable);

module.exports = Buffer;


},{"../../util":172,"../renderable":158}],123:[function(require,module,exports){
var Buffer, DataBuffer, DataTexture, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Buffer = require('./buffer');

DataTexture = require('./texture/datatexture');

Util = require('../../util');


/*
 * Data buffer on the GPU
 * - Stores samples (1-n) x items (1-n) x channels (1-4)
 * - Provides generic sampler shader
 * - Provides generic copy/write handler
 * => specialized into Array/Matrix/VoxelBuffer
 */

DataBuffer = (function(_super) {
  __extends(DataBuffer, _super);

  function DataBuffer(renderer, shaders, options) {
    this.width = options.width || 1;
    this.height = options.height || 1;
    this.depth = options.depth || 1;
    if (this.samples == null) {
      this.samples = this.width * this.height * this.depth;
    }
    DataBuffer.__super__.constructor.call(this, renderer, shaders, options);
    this.build(options);
  }

  DataBuffer.prototype.shader = function(shader, indices) {
    if (indices == null) {
      indices = 4;
    }
    if (this.items > 1 || this.depth > 1) {
      if (indices !== 4) {
        shader.pipe(Util.GLSL.extendVec(indices, 4));
      }
      shader.pipe('map.xyzw.texture', this.uniforms);
    } else {
      if (indices !== 2) {
        shader.pipe(Util.GLSL.truncateVec(indices, 2));
      }
    }
    shader.pipe("map.2d.data", this.uniforms);
    shader.pipe("sample.2d", this.uniforms);
    if (this.channels < 4) {
      shader.pipe(Util.GLSL.swizzleVec4(['0000', 'x000', 'xw00', 'xyz0'][this.channels]));
    }
    return shader;
  };

  DataBuffer.prototype.build = function(options) {
    this.data = new Float32Array(this.samples * this.channels * this.items);
    this.texture = new DataTexture(this.gl, this.items * this.width, this.height * this.depth, this.channels, options);
    this.filled = 0;
    this.used = 0;
    this._adopt(this.texture.uniforms);
    this._adopt({
      dataPointer: {
        type: 'v2',
        value: new THREE.Vector2()
      },
      textureItems: {
        type: 'f',
        value: this.items
      },
      textureHeight: {
        type: 'f',
        value: this.height
      }
    });
    this.dataPointer = this.uniforms.dataPointer.value;
    return this.streamer = this.generate(this.data);
  };

  DataBuffer.prototype.dispose = function() {
    this.data = null;
    this.texture.dispose();
    return DataBuffer.__super__.dispose.apply(this, arguments);
  };

  DataBuffer.prototype.getFilled = function() {
    return this.filled;
  };

  DataBuffer.prototype.setCallback = function(callback) {
    this.callback = callback;
    return this.filled = 0;
  };

  DataBuffer.prototype.copy = function(data) {
    var d, i, n, _i;
    n = Math.min(data.length, this.samples * this.channels * this.items);
    d = this.data;
    for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
      d[i] = data[i];
    }
    return this.write(Math.ceil(n / this.channels / this.items));
  };

  DataBuffer.prototype.write = function(n) {
    var height, width;
    if (n == null) {
      n = this.samples;
    }
    height = n / this.width;
    n *= this.items;
    width = height < 1 ? n : this.items * this.width;
    height = Math.ceil(height);
    this.texture.write(this.data, 0, 0, width, height);
    this.dataPointer.set(.5, .5);
    this.filled = 1;
    return this.used = n;
  };

  DataBuffer.prototype.through = function(callback, target) {
    var consume, done, dst, emit, i, pipe, src, _ref;
    _ref = src = this.streamer, consume = _ref.consume, done = _ref.done;
    emit = (dst = target.streamer).emit;
    i = 0;
    pipe = function() {
      return consume(function(x, y, z, w) {
        return callback(emit, x, y, z, w, i);
      });
    };
    pipe = Util.Data.repeatCall(pipe, this.items);
    return (function(_this) {
      return function() {
        var limit;
        src.reset();
        dst.reset();
        limit = _this.used;
        i = 0;
        while (!done() && i < limit) {
          pipe();
          i++;
        }
        return src.count();
      };
    })(this);
  };

  return DataBuffer;

})(Buffer);

module.exports = DataBuffer;


},{"../../util":172,"./buffer":122,"./texture/datatexture":131}],124:[function(require,module,exports){
var DataBuffer, MatrixBuffer, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DataBuffer = require('./databuffer');

Util = require('../../util');


/*
 * 2D + history array
 */

MatrixBuffer = (function(_super) {
  __extends(MatrixBuffer, _super);

  function MatrixBuffer(renderer, shaders, options) {
    this.width = options.width || 1;
    this.height = options.height || 1;
    this.history = options.history || 1;
    this.samples = this.width * this.height;
    options.depth = this.history;
    MatrixBuffer.__super__.constructor.call(this, renderer, shaders, options);
  }

  MatrixBuffer.prototype.build = function(options) {
    MatrixBuffer.__super__.build.apply(this, arguments);
    this.index = 0;
    this.pad = {
      x: 0,
      y: 0
    };
    return this.streamer = this.generate(this.data);
  };

  MatrixBuffer.prototype.getFilled = function() {
    return this.filled;
  };

  MatrixBuffer.prototype.setActive = function(i, j) {
    var _ref;
    return _ref = [Math.max(0, this.width - i), Math.max(0, this.height - j)], this.pad.x = _ref[0], this.pad.y = _ref[1], _ref;
  };

  MatrixBuffer.prototype.fill = function() {
    var callback, count, done, emit, i, j, k, limit, n, pad, repeat, reset, skip, _ref;
    callback = this.callback;
    if (typeof callback.reset === "function") {
      callback.reset();
    }
    _ref = this.streamer, emit = _ref.emit, skip = _ref.skip, count = _ref.count, done = _ref.done, reset = _ref.reset;
    reset();
    n = this.width;
    pad = this.pad.x;
    limit = this.samples - this.pad.y * n;
    i = j = k = 0;
    if (pad) {
      while (!done() && k < limit) {
        k++;
        repeat = callback(emit, i, j);
        if (++i === n - pad) {
          skip(pad);
          i = 0;
          j++;
        }
        if (repeat === false) {
          break;
        }
      }
    } else {
      while (!done() && k < limit) {
        k++;
        repeat = callback(emit, i, j);
        if (++i === n) {
          i = 0;
          j++;
        }
        if (repeat === false) {
          break;
        }
      }
    }
    return Math.floor(count() / this.items);
  };

  MatrixBuffer.prototype.write = function(n) {
    var height, width;
    if (n == null) {
      n = this.samples;
    }
    n *= this.items;
    width = this.width * this.items;
    height = Math.ceil(n / width);
    this.texture.write(this.data, 0, this.index * this.height, width, height);
    this.dataPointer.set(.5, this.index * this.height + .5);
    this.index = (this.index + this.history - 1) % this.history;
    return this.filled = Math.min(this.history, this.filled + 1);
  };

  MatrixBuffer.prototype.through = function(callback, target) {
    var consume, done, dst, emit, i, j, pipe, src, _ref;
    _ref = src = this.streamer, consume = _ref.consume, done = _ref.done;
    emit = (dst = target.streamer).emit;
    i = j = 0;
    pipe = function() {
      return consume(function(x, y, z, w) {
        return callback(emit, x, y, z, w, i, j);
      });
    };
    pipe = Util.Data.repeatCall(pipe, this.items);
    return (function(_this) {
      return function() {
        var k, limit, n, pad;
        src.reset();
        dst.reset();
        n = _this.width;
        pad = _this.pad.x;
        limit = _this.samples - _this.pad.y * n;
        i = j = k = 0;
        if (pad) {
          while (!done() && k < limit) {
            k++;
            pipe();
            if (++i === n - pad) {
              skip(pad);
              i = 0;
              j++;
            }
          }
        } else {
          while (!done() && k < limit) {
            k++;
            pipe();
            if (++i === n) {
              i = 0;
              j++;
            }
          }
        }
        return src.count();
      };
    })(this);
  };

  return MatrixBuffer;

})(DataBuffer);

module.exports = MatrixBuffer;


},{"../../util":172,"./databuffer":123}],125:[function(require,module,exports){
var Memo, RenderToTexture, Renderable, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

RenderToTexture = require('./rendertotexture');

Util = require('../../util');


/*
 * Wrapped RTT for memoizing 4D arrays back to a 2D texture
 */

Memo = (function(_super) {
  __extends(Memo, _super);

  function Memo(renderer, shaders, options) {
    if (this.items == null) {
      this.items = options.items || 1;
    }
    if (this.channels == null) {
      this.channels = options.channels || 4;
    }
    if (this.width == null) {
      this.width = options.width || 1;
    }
    if (this.height == null) {
      this.height = options.height || 1;
    }
    if (this.depth == null) {
      this.depth = options.depth || 1;
    }
    options.format = THREE.RGBAFormat;
    options.width = this._width = this.items * this.width;
    options.height = this._height = this.height * this.depth;
    options.frames = 1;
    delete options.items;
    delete options.depth;
    delete options.channels;
    Memo.__super__.constructor.call(this, renderer, shaders, options);
    this._adopt({
      textureItems: {
        type: 'f',
        value: this.items
      },
      textureHeight: {
        type: 'f',
        value: this.height
      }
    });
  }

  Memo.prototype.shaderAbsolute = function(shader) {
    if (shader == null) {
      shader = this.shaders.shader();
    }
    shader.pipe('map.xyzw.texture', this.uniforms);
    return Memo.__super__.shaderAbsolute.call(this, shader, 1, 2);
  };

  return Memo;

})(RenderToTexture);

module.exports = Memo;


},{"../../util":172,"../renderable":158,"./rendertotexture":128}],126:[function(require,module,exports){
var Buffer, PushBuffer, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Buffer = require('./buffer');

Util = require('../../util');


/*
 * Buffer for CPU-side use
 */

PushBuffer = (function(_super) {
  __extends(PushBuffer, _super);

  function PushBuffer(renderer, shaders, options) {
    this.width = options.width || 1;
    this.height = options.height || 1;
    this.depth = options.depth || 1;
    if (this.samples == null) {
      this.samples = this.width * this.height * this.depth;
    }
    PushBuffer.__super__.constructor.call(this, renderer, shaders, options);
    this.build(options);
  }

  PushBuffer.prototype.build = function(options) {
    this.data = [];
    this.data.length = this.samples;
    this.filled = 0;
    this.pad = {
      x: 0,
      y: 0,
      z: 0
    };
    return this.streamer = this.generate(this.data);
  };

  PushBuffer.prototype.dispose = function() {
    this.data = null;
    return PushBuffer.__super__.dispose.apply(this, arguments);
  };

  PushBuffer.prototype.getFilled = function() {
    return this.filled;
  };

  PushBuffer.prototype.setActive = function(i, j, k) {
    var _ref;
    return _ref = [this.width - i, this.height - j, this.depth - k], this.pad.x = _ref[0], this.pad.y = _ref[1], this.pad.z = _ref[2], _ref;
  };

  PushBuffer.prototype.read = function() {
    return this.data;
  };

  PushBuffer.prototype.copy = function(data) {
    var d, i, n, _i, _results;
    n = Math.min(data.length, this.samples);
    d = this.data;
    _results = [];
    for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
      _results.push(d[i] = data[i]);
    }
    return _results;
  };

  PushBuffer.prototype.fill = function() {
    var callback, count, done, emit, i, j, k, l, limit, m, n, o, padX, padY, repeat, reset, skip, _ref;
    callback = this.callback;
    if (typeof callback.reset === "function") {
      callback.reset();
    }
    _ref = this.streamer, emit = _ref.emit, skip = _ref.skip, count = _ref.count, done = _ref.done, reset = _ref.reset;
    reset();
    n = this.width;
    m = this.height;
    o = this.depth;
    padX = this.pad.x;
    padY = this.pad.y;
    limit = this.samples - this.pad.z * n * m;
    i = j = k = l = 0;
    if (padX > 0 || padY > 0) {
      while (!done() && l < limit) {
        l++;
        repeat = callback(emit, i, j, k);
        if (++i === n - padX) {
          skip(padX);
          i = 0;
          if (++j === m - padY) {
            skip(n * padY);
            j = 0;
            k++;
          }
        }
        if (repeat === false) {
          break;
        }
      }
    } else {
      while (!done() && l < limit) {
        l++;
        repeat = callback(emit, i, j, k);
        if (++i === n) {
          i = 0;
          if (++j === m) {
            j = 0;
            k++;
          }
        }
        if (repeat === false) {
          break;
        }
      }
    }
    this.filled = 1;
    return count();
  };

  return PushBuffer;

})(Buffer);

module.exports = PushBuffer;


},{"../../util":172,"./buffer":122}],127:[function(require,module,exports){
var Buffer, Memo, MemoScreen, Readback, Renderable, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

Buffer = require('./buffer');

Memo = require('./memo');

MemoScreen = require('../meshes/memoscreen');

Util = require('../../util');


/*
 * Readback up to 4D array of up to 4D data from GL
 */

Readback = (function(_super) {
  __extends(Readback, _super);

  function Readback(renderer, shaders, options) {
    if (this.items == null) {
      this.items = options.items || 1;
    }
    if (this.channels == null) {
      this.channels = options.channels || 4;
    }
    if (this.width == null) {
      this.width = options.width || 1;
    }
    if (this.height == null) {
      this.height = options.height || 1;
    }
    if (this.depth == null) {
      this.depth = options.depth || 1;
    }
    if (this.type == null) {
      this.type = options.type || THREE.FloatType;
    }
    if (this.stpq == null) {
      this.stpq = options.stpq || false;
    }
    this.isFloat = this.type === THREE.FloatType;
    this.active = this.sampled = this.rect = this.pad = null;
    Readback.__super__.constructor.call(this, renderer, shaders);
    this.build(options);

    /*
     * log precision
    gl = @gl
    for name, pass of {Vertex: gl.VERTEX_SHADER, Fragment: gl.FRAGMENT_SHADER}
      bits = for prec in [gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT]
        gl.getShaderPrecisionFormat(pass, prec).precision
      console.log name, 'shader precision',  bits
     */
  }

  Readback.prototype.build = function(options) {
    var channels, depth, encoder, h, height, indexer, isIndexed, items, map, sampler, stpq, stretch, w, width;
    map = options.map;
    indexer = options.indexer;
    isIndexed = (indexer != null) && !indexer.empty();
    items = this.items, width = this.width, height = this.height, depth = this.depth, stpq = this.stpq;
    sampler = map;
    if (isIndexed) {
      this._adopt({
        indexModulus: {
          type: 'v4',
          value: new THREE.Vector4(items, items * width, items * width * height, 1)
        }
      });
      sampler = this.shaders.shader();
      sampler.require(map);
      sampler.require(indexer);
      sampler.pipe('float.index.pack', this.uniforms);
    }
    if (this.isFloat && this.channels > 1) {
      this.floatMemo = new Memo(this.renderer, this.shaders, {
        items: items,
        channels: 4,
        width: width,
        height: height,
        depth: depth,
        history: 0,
        type: THREE.FloatType
      });
      this.floatCompose = new MemoScreen(this.renderer, this.shaders, {
        map: sampler,
        items: items,
        width: width,
        height: height,
        depth: depth,
        stpq: stpq
      });
      this.floatMemo.adopt(this.floatCompose);
      stpq = false;
      sampler = this.shaders.shader();
      this.floatMemo.shaderAbsolute(sampler);
    }
    if (this.isFloat) {
      stretch = this.channels;
      channels = 4;
    } else {
      stretch = 1;
      channels = this.channels;
    }
    if (stretch > 1) {
      encoder = this.shaders.shader();
      encoder.pipe(Util.GLSL.mapByte2FloatOffset(stretch));
      encoder.require(sampler);
      encoder.pipe('float.stretch');
      encoder.pipe('float.encode');
      sampler = encoder;
    } else if (this.isFloat) {
      encoder = this.shaders.shader();
      encoder.pipe(sampler);
      encoder.pipe(Util.GLSL.truncateVec4(4, 1));
      encoder.pipe('float.encode');
      sampler = encoder;
    }
    this.byteMemo = new Memo(this.renderer, this.shaders, {
      items: items * stretch,
      channels: 4,
      width: width,
      height: height,
      depth: depth,
      history: 0,
      type: THREE.UnsignedByteType
    });
    this.byteCompose = new MemoScreen(this.renderer, this.shaders, {
      map: sampler,
      items: items * stretch,
      width: width,
      height: height,
      depth: depth,
      stpq: stpq
    });
    this.byteMemo.adopt(this.byteCompose);
    w = items * width * stretch;
    h = height * depth;
    this.samples = this.width * this.height * this.depth;
    this.bytes = new Uint8Array(w * h * 4);
    if (this.isFloat) {
      this.floats = new Float32Array(this.bytes.buffer);
    }
    this.data = this.isFloat ? this.floats : this.bytes;
    this.streamer = this.generate(this.data);
    this.active = {
      items: 0,
      width: 0,
      height: 0,
      depth: 0
    };
    this.sampled = {
      items: 0,
      width: 0,
      height: 0,
      depth: 0
    };
    this.rect = {
      w: 0,
      h: 0
    };
    this.pad = {
      x: 0,
      y: 0,
      z: 0,
      w: 0
    };
    this.stretch = stretch;
    this.isIndexed = isIndexed;
    return this.setActive(items, width, height, depth);
  };

  Readback.prototype.generate = function(data) {
    return Util.Data.getStreamer(data, this.samples, 4, this.items);
  };

  Readback.prototype.setActive = function(items, width, height, depth) {
    var h, w, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if (!(items !== this.active.items || width !== this.active.width || height !== this.active.height || depth !== this.active.depth)) {
      return;
    }
    _ref = [items, width, height, depth], this.active.items = _ref[0], this.active.width = _ref[1], this.active.height = _ref[2], this.active.depth = _ref[3];
    if ((_ref1 = this.floatCompose) != null) {
      _ref1.cover(width, height, depth);
    }
    if ((_ref2 = this.byteCompose) != null) {
      _ref2.cover(width * this.stretch, height, depth);
    }
    items = this.items;
    width = this.active.width;
    height = this.depth === 1 ? this.active.height : this.height;
    depth = this.active.depth;
    w = items * width * this.stretch;
    h = height * depth;
    _ref3 = [items, width, height, depth], this.sampled.items = _ref3[0], this.sampled.width = _ref3[1], this.sampled.height = _ref3[2], this.sampled.depth = _ref3[3];
    _ref4 = [w, h], this.rect.w = _ref4[0], this.rect.h = _ref4[1];
    return _ref5 = [this.sampled.width - this.active.width, this.sampled.height - this.active.height, this.sampled.depth - this.active.depth, this.sampled.items - this.active.items], this.pad.x = _ref5[0], this.pad.y = _ref5[1], this.pad.z = _ref5[2], this.pad.w = _ref5[3], _ref5;
  };

  Readback.prototype.update = function(camera) {
    var _ref, _ref1;
    if ((_ref = this.floatMemo) != null) {
      _ref.render(camera);
    }
    return (_ref1 = this.byteMemo) != null ? _ref1.render(camera) : void 0;
  };

  Readback.prototype.post = function() {
    this.renderer.setRenderTarget(this.byteMemo.target.write);
    return this.gl.readPixels(0, 0, this.rect.w, this.rect.h, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes);
  };

  Readback.prototype.readFloat = function(n) {
    var _ref;
    return (_ref = this.floatMemo) != null ? _ref.read(n) : void 0;
  };

  Readback.prototype.readByte = function(n) {
    var _ref;
    return (_ref = this.byteMemo) != null ? _ref.read(n) : void 0;
  };

  Readback.prototype.setCallback = function(callback) {
    return this.emitter = this.callback(callback);
  };

  Readback.prototype.callback = function(callback) {
    var f, m, n, o, p;
    if (!this.isIndexed) {
      return callback;
    }
    n = this.width;
    m = this.height;
    o = this.depth;
    p = this.items;
    f = function(x, y, z, w) {
      var idx, ii, jj, kk, ll;
      idx = w;
      ll = idx % p;
      idx = (idx - ll) / p;
      ii = idx % n;
      idx = (idx - ii) / n;
      jj = idx % m;
      idx = (idx - jj) / m;
      kk = idx;
      return callback(x, y, z, w, ii, jj, kk, ll);
    };
    f.reset = function() {
      return typeof callback.reset === "function" ? callback.reset() : void 0;
    };
    return f;
  };

  Readback.prototype.iterate = function() {
    var callback, consume, count, done, emit, i, j, k, l, limit, m, n, o, p, padW, padX, padY, padZ, repeat, reset, skip, _ref;
    emit = this.emitter;
    if (typeof emit.reset === "function") {
      emit.reset();
    }
    _ref = this.streamer, consume = _ref.consume, skip = _ref.skip, count = _ref.count, done = _ref.done, reset = _ref.reset;
    reset();
    n = this.sampled.width | 0;
    m = this.sampled.height | 0;
    o = this.sampled.depth | 0;
    p = this.sampled.items | 0;
    padX = this.pad.x | 0;
    padY = this.pad.y | 0;
    padZ = this.pad.z | 0;
    padW = this.pad.w | 0;
    limit = n * m * p * (o - padZ);
    if (!this.isIndexed) {
      callback = emit;
      emit = function(x, y, z, w) {
        return callback(x, y, z, w, i, j, k, l);
      };
    }
    i = j = k = l = m = 0;
    while (!done() && m < limit) {
      m++;
      repeat = consume(emit);
      if (++l === p - padW) {
        skip(padX);
        l = 0;
        if (++i === n - padX) {
          skip(p * padX);
          i = 0;
          if (++j === m - padY) {
            skip(p * n * padY);
            j = 0;
            k++;
          }
        }
      }
      if (repeat === false) {
        break;
      }
    }
    return Math.floor(count() / p);
  };

  Readback.prototype.dispose = function() {
    var _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if ((_ref = this.floatMemo) != null) {
      _ref.unadopt(this.floatCompose);
    }
    if ((_ref1 = this.floatMemo) != null) {
      _ref1.dispose();
    }
    if ((_ref2 = this.floatCompose) != null) {
      _ref2.dispose();
    }
    if ((_ref3 = this.byteMemo) != null) {
      _ref3.unadopt(this.byteCompose);
    }
    if ((_ref4 = this.byteMemo) != null) {
      _ref4.dispose();
    }
    if ((_ref5 = this.byteCompose) != null) {
      _ref5.dispose();
    }
    return this.floatMemo = this.byteMemo = this.floatCompose = this.byteCompose = null;
  };

  return Readback;

})(Renderable);

module.exports = Readback;


},{"../../util":172,"../meshes/memoscreen":152,"../renderable":158,"./buffer":122,"./memo":125}],128:[function(require,module,exports){
var RenderTarget, RenderToTexture, Renderable, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

RenderTarget = require('./texture/rendertarget');

Util = require('../../util');


/*
 * Render-To-Texture with history
 */

RenderToTexture = (function(_super) {
  __extends(RenderToTexture, _super);

  function RenderToTexture(renderer, shaders, options) {
    var _ref;
    this.scene = (_ref = options.scene) != null ? _ref : new THREE.Scene();
    this.camera = options.camera;
    RenderToTexture.__super__.constructor.call(this, renderer, shaders);
    this.build(options);
  }

  RenderToTexture.prototype.shaderRelative = function(shader) {
    if (shader == null) {
      shader = this.shaders.shader();
    }
    return shader.pipe("sample.2d", this.uniforms);
  };

  RenderToTexture.prototype.shaderAbsolute = function(shader, frames, indices) {
    var sample2DArray;
    if (frames == null) {
      frames = 1;
    }
    if (indices == null) {
      indices = 4;
    }
    if (shader == null) {
      shader = this.shaders.shader();
    }
    if (frames <= 1) {
      if (indices > 2) {
        shader.pipe(Util.GLSL.truncateVec(indices, 2));
      }
      shader.pipe("map.2d.data", this.uniforms);
      return shader.pipe("sample.2d", this.uniforms);
    } else {
      sample2DArray = Util.GLSL.sample2DArray(Math.min(frames, this.target.frames));
      if (indices < 4) {
        shader.pipe(Util.GLSL.extendVec(indices, 4));
      }
      shader.pipe("map.xyzw.2dv");
      shader.split();
      shader.pipe("map.2d.data", this.uniforms);
      shader.pass();
      return shader.pipe(sample2DArray, this.uniforms);
    }
  };

  RenderToTexture.prototype.build = function(options) {
    var _base;
    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera();
      this.camera.position.set(0, 0, 3);
      this.camera.lookAt(new THREE.Vector3());
    }
    if (typeof (_base = this.scene).inject === "function") {
      _base.inject();
    }
    this.target = new RenderTarget(this.gl, options.width, options.height, options.frames, options);
    this.target.warmup((function(_this) {
      return function(target) {
        return _this.renderer.setRenderTarget(target);
      };
    })(this));
    this.renderer.setRenderTarget(null);
    this._adopt(this.target.uniforms);
    this._adopt({
      dataPointer: {
        type: 'v2',
        value: new THREE.Vector2(.5, .5)
      }
    });
    return this.filled = 0;
  };

  RenderToTexture.prototype.adopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this.scene.add(object));
    }
    return _results;
  };

  RenderToTexture.prototype.unadopt = function(renderable) {
    var object, _i, _len, _ref, _results;
    _ref = renderable.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this.scene.remove(object));
    }
    return _results;
  };

  RenderToTexture.prototype.render = function(camera) {
    var _ref;
    if (camera == null) {
      camera = this.camera;
    }
    this.renderer.render((_ref = this.scene.scene) != null ? _ref : this.scene, camera, this.target.write);
    this.target.cycle();
    if (this.filled < this.target.frames) {
      return this.filled++;
    }
  };

  RenderToTexture.prototype.read = function(frame) {
    if (frame == null) {
      frame = 0;
    }
    return this.target.reads[Math.abs(frame)];
  };

  RenderToTexture.prototype.getFrames = function() {
    return this.target.frames;
  };

  RenderToTexture.prototype.getFilled = function() {
    return this.filled;
  };

  RenderToTexture.prototype.dispose = function() {
    var _base;
    if (typeof (_base = this.scene).unject === "function") {
      _base.unject();
    }
    this.scene = this.camera = null;
    this.target.dispose();
    return RenderToTexture.__super__.dispose.apply(this, arguments);
  };

  return RenderToTexture;

})(Renderable);

module.exports = RenderToTexture;


},{"../../util":172,"../renderable":158,"./texture/rendertarget":132}],129:[function(require,module,exports){
var Atlas, SCRATCH_SIZE, TextAtlas,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Atlas = require('./atlas');

SCRATCH_SIZE = 512 / 16;


/*
 * Dynamic text atlas
 * - Stores entire strings as sprites
 * - Renders alpha mask (fast) or signed distance field (slow)
 * - Emits (x,y,width,height) pointers into the atlas
 */

TextAtlas = (function(_super) {
  __extends(TextAtlas, _super);

  function TextAtlas(renderer, shaders, options) {
    var ua, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this.font = (_ref = options.font) != null ? _ref : ['sans-serif'];
    this.size = options.size || 24;
    this.style = (_ref1 = options.style) != null ? _ref1 : 'normal';
    this.variant = (_ref2 = options.variant) != null ? _ref2 : 'normal';
    this.weight = (_ref3 = options.weight) != null ? _ref3 : 'normal';
    this.outline = (_ref4 = +((_ref5 = options.outline) != null ? _ref5 : 5)) != null ? _ref4 : 0;
    options.width || (options.width = 256);
    options.height || (options.height = 256);
    options.type = THREE.UnsignedByteType;
    options.channels = 1;
    options.backed = true;
    this.gamma = 1;
    if (typeof navigator !== 'undefined') {
      ua = navigator.userAgent;
      if (ua.match(/Chrome/) && ua.match(/OS X/)) {
        this.gamma = .5;
      }
    }
    this.scratchW = this.scratchH = 0;
    TextAtlas.__super__.constructor.call(this, renderer, shaders, options);
  }

  TextAtlas.prototype.build = function(options) {
    var canvas, colors, context, dilate, font, hex, i, lineHeight, maxWidth, quote, scratch, _i;
    TextAtlas.__super__.build.call(this, options);
    lineHeight = 16;
    lineHeight = this.size;
    lineHeight += 4 + 2 * Math.min(1, this.outline);
    maxWidth = SCRATCH_SIZE * lineHeight;
    canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = lineHeight;
    quote = function(str) {
      return "\"" + (str.replace(/(['"\\])/g, '\\$1')) + "\"";
    };
    font = this.font.map(quote).join(", ");
    context = canvas.getContext('2d');
    context.font = "" + this.style + " " + this.variant + " " + this.weight + " " + this.size + "px " + this.font;
    context.fillStyle = '#FF0000';
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    context.lineJoin = 'round';

    /*
    document.body.appendChild canvas
    canvas.setAttribute('style', "position: absolute; top: 0; left: 0; z-index: 100; border: 1px solid red; background: rgba(255,0,255,.25);")
     */
    colors = [];
    dilate = this.outline * 3;
    for (i = _i = 0; 0 <= dilate ? _i < dilate : _i > dilate; i = 0 <= dilate ? ++_i : --_i) {
      hex = ('00' + Math.max(0, -i * 8 + 128 - (!i) * 8).toString(16)).slice(-2);
      colors.push('#' + hex + hex + hex);
    }
    scratch = new Uint8Array(maxWidth * lineHeight * 2);
    this.canvas = canvas;
    this.context = context;
    this.lineHeight = lineHeight;
    this.maxWidth = maxWidth;
    this.colors = colors;
    this.scratch = scratch;
    this._allocate = this.allocate.bind(this);
    return this._write = this.write.bind(this);
  };

  TextAtlas.prototype.reset = function() {
    TextAtlas.__super__.reset.apply(this, arguments);
    return this.mapped = {};
  };

  TextAtlas.prototype.begin = function() {
    var row, _i, _len, _ref, _results;
    _ref = this.rows;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      _results.push(row.alive = 0);
    }
    return _results;
  };

  TextAtlas.prototype.end = function() {
    var key, mapped, row, _i, _j, _len, _len1, _ref, _ref1;
    mapped = this.mapped;
    _ref = this.rows.slice();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      if (!(row.alive === 0)) {
        continue;
      }
      _ref1 = row.keys;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        key = _ref1[_j];
        delete mapped[key];
      }
      this.collapse(row);
    }
  };

  TextAtlas.prototype.map = function(text, emit) {
    var allocate, c, data, h, mapped, w, write;
    mapped = this.mapped;
    c = mapped[text];
    if (c != null) {
      c.row.alive++;
      return emit(c.x, c.y, c.w, c.h);
    }
    this.draw(text);
    data = this.scratch;
    w = this.scratchW;
    h = this.scratchH;
    allocate = this._allocate;
    write = this._write;
    return allocate(text, w, h, function(row, x, y) {
      mapped[text] = {
        x: x,
        y: y,
        w: w,
        h: h,
        row: row
      };
      write(data, x, y, w, h);
      return emit(x, y, w, h);
    });
  };

  TextAtlas.prototype.draw = function(text) {
    var a, b, c, colors, ctx, data, dst, gamma, h, i, imageData, j, m, mask, max, o, w, x, y, _i, _j, _k, _ref, _ref1, _ref2;
    w = this.width;
    h = this.lineHeight;
    o = this.outline;
    ctx = this.context;
    dst = this.scratch;
    max = this.maxWidth;
    colors = this.colors;
    x = o + 1;
    y = Math.round(h * 1.05 - 1);
    m = ctx.measureText(text);
    w = Math.min(max, Math.ceil(m.width + 2 * x + 1));
    ctx.clearRect(0, 0, w, h);
    if (this.outline === 0) {
      ctx.fillText(text, x, y);
      data = (imageData = ctx.getImageData(0, 0, w, h)).data;
      j = 3;
      for (i = _i = 0, _ref = data.length / 4; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        dst[i] = data[j];
        j += 4;
      }
      this.scratchW = w;
      return this.scratchH = h;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      for (i = _j = _ref1 = o + 1; _ref1 <= 1 ? _j <= 1 : _j >= 1; i = _ref1 <= 1 ? ++_j : --_j) {
        j = i > 1 ? i * 2 - 2 : i;
        ctx.strokeStyle = colors[j - 1];
        ctx.lineWidth = j;
        ctx.strokeText(text, x, y);
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillText(text, x, y);
      data = (imageData = ctx.getImageData(0, 0, w, h)).data;
      j = 0;
      gamma = this.gamma;
      for (i = _k = 0, _ref2 = data.length / 4; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
        a = data[j];
        mask = a ? data[j + 1] / a : 1;
        if (gamma === .5) {
          mask = Math.sqrt(mask);
        }
        mask = Math.min(1, Math.max(0, mask));
        b = 256 - a;
        c = b + (a - b) * mask;
        dst[i] = Math.max(0, Math.min(255, c + 2));
        j += 4;
      }

      /*
      j = 0
      for i in [0...data.length / 4]
        v = dst[i]
         *data[j] = v
         *data[j+1] = v
        data[j+2] = v
        data[j+3] = 255
        j += 4
      ctx.putImageData imageData, 0, 0
       */
      this.scratchW = w;
      return this.scratchH = h;
    }
  };

  return TextAtlas;

})(Atlas);

module.exports = TextAtlas;


},{"./atlas":121}],130:[function(require,module,exports){
var BackedTexture, DataTexture, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Util = require('../../../Util');

DataTexture = require('./datatexture');


/*
Manually allocated GL texture for data streaming, locally backed.

Allows partial updates via subImage.
Contains local copy of its data to allow quick resizing without gl.copyTexImage2d
(which requires render-to-framebuffer)
 */

BackedTexture = (function(_super) {
  __extends(BackedTexture, _super);

  function BackedTexture(gl, width, height, channels, options) {
    BackedTexture.__super__.constructor.call(this, gl, width, height, channels, options);
    this.data = new this.ctor(this.n);
  }

  BackedTexture.prototype.resize = function(width, height) {
    var gl, old, oldHeight, oldWidth;
    old = this.data;
    oldWidth = this.width;
    oldHeight = this.height;
    this.width = width;
    this.height = height;
    this.n = width * height * this.channels;
    this.data = new this.ctor(this.n);
    gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, this.data);
    this.uniforms.dataResolution.value.set(1 / width, 1 / height);
    return this.write(old, 0, 0, oldWidth, oldHeight);
  };

  BackedTexture.prototype.write = function(src, x, y, w, h) {
    var channels, dst, i, j, k, n, stride, width, ww, xx, yh, yy;
    width = this.width;
    dst = this.data;
    channels = this.channels;
    i = 0;
    if (width === w && x === 0) {
      j = y * w * channels;
      n = w * h * channels;
      while (i < n) {
        dst[j++] = src[i++];
      }
    } else {
      stride = width * channels;
      ww = w * channels;
      xx = x * channels;
      yy = y;
      yh = y + h;
      while (yy < yh) {
        k = 0;
        j = xx + yy * stride;
        while (k++ < ww) {
          dst[j++] = src[i++];
        }
        yy++;
      }
    }
    return BackedTexture.__super__.write.call(this, src, x, y, w, h);
  };

  BackedTexture.prototype.dispose = function() {
    this.data = null;
    return BackedTexture.__super__.dispose.apply(this, arguments);
  };

  return BackedTexture;

})(DataTexture);

module.exports = BackedTexture;


},{"../../../Util":23,"./datatexture":131}],131:[function(require,module,exports){
var DataTexture, Util;

Util = require('../../../Util');


/*
Manually allocated GL texture for data streaming.

Allows partial updates via subImage.
 */

DataTexture = (function() {
  function DataTexture(gl, width, height, channels, options) {
    var magFilter, minFilter, type, _ref, _ref1, _ref2;
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.channels = channels;
    this.n = this.width * this.height * this.channels;
    gl = this.gl;
    minFilter = (_ref = options.minFilter) != null ? _ref : THREE.NearestFilter;
    magFilter = (_ref1 = options.magFilter) != null ? _ref1 : THREE.NearestFilter;
    type = (_ref2 = options.type) != null ? _ref2 : THREE.FloatType;
    this.minFilter = Util.Three.paramToGL(gl, minFilter);
    this.magFilter = Util.Three.paramToGL(gl, minFilter);
    this.type = Util.Three.paramToGL(gl, type);
    this.ctor = Util.Three.paramToArrayStorage(type);
    this.build();
  }

  DataTexture.prototype.build = function() {
    var gl;
    gl = this.gl;
    this.texture = gl.createTexture();
    this.format = [null, gl.LUMINANCE, gl.LUMINANCE_ALPHA, gl.RGB, gl.RGBA][this.channels];
    this.format3 = [null, THREE.LuminanceFormat, THREE.LuminanceAlphaFormat, THREE.RGBFormat, THREE.RGBAFormat][this.channels];
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    this.data = new this.ctor(this.n);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, this.data);
    this.textureObject = new THREE.Texture(new Image(), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
    this.textureObject.__webglInit = true;
    this.textureObject.__webglTexture = this.texture;
    this.textureObject.format = this.format3;
    this.textureObject.type = THREE.FloatType;
    this.textureObject.unpackAlignment = 1;
    return this.uniforms = {
      dataResolution: {
        type: 'v2',
        value: new THREE.Vector2(1 / this.width, 1 / this.height)
      },
      dataTexture: {
        type: 't',
        value: this.textureObject
      }
    };
  };

  DataTexture.prototype.write = function(data, x, y, w, h) {
    var gl;
    gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    return gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, this.format, this.type, data);
  };

  DataTexture.prototype.dispose = function() {
    this.gl.deleteTexture(this.texture);
    this.textureObject.__webglInit = false;
    this.textureObject.__webglTexture = null;
    return this.textureObject = this.texture = null;
  };

  return DataTexture;

})();

module.exports = DataTexture;


},{"../../../Util":23}],132:[function(require,module,exports){

/*
Virtual RenderTarget that cycles through multiple frames
Provides easy access to past rendered frames
@reads[] and @write contain WebGLRenderTargets whose internal pointers are rotated automatically
 */
var RenderTarget;

RenderTarget = (function() {
  function RenderTarget(gl, width, height, frames, options) {
    this.gl = gl;
    if (options == null) {
      options = {};
    }
    if (options.minFilter == null) {
      options.minFilter = THREE.NearestFilter;
    }
    if (options.magFilter == null) {
      options.magFilter = THREE.NearestFilter;
    }
    if (options.format == null) {
      options.format = THREE.RGBAFormat;
    }
    if (options.type == null) {
      options.type = THREE.UnsignedByteType;
    }
    this.options = options;
    this.width = width || 1;
    this.height = height || 1;
    this.frames = frames || 1;
    this.buffers = this.frames + 1;
    this.build();
  }

  RenderTarget.prototype.build = function() {
    var i, make;
    make = (function(_this) {
      return function() {
        return new THREE.WebGLRenderTarget(_this.width, _this.height, _this.options);
      };
    })(this);
    this.targets = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.buffers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(make());
      }
      return _results;
    }).call(this);
    this.reads = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.buffers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(make());
      }
      return _results;
    }).call(this);
    this.write = make();
    this.index = 0;
    return this.uniforms = {
      dataResolution: {
        type: 'v2',
        value: new THREE.Vector2(1 / this.width, 1 / this.height)
      },
      dataTexture: {
        type: 't',
        value: this.reads[0]
      },
      dataTextures: {
        type: 'tv',
        value: this.reads
      }
    };
  };

  RenderTarget.prototype.cycle = function() {
    var add, buffers, copy, i, keys, read, _i, _len, _ref;
    keys = ['__webglTexture', '__webglFramebuffer', '__webglRenderbuffer'];
    buffers = this.buffers;
    copy = function(a, b) {
      var key, _i, _len;
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        b[key] = a[key];
      }
      return null;
    };
    add = function(i, j) {
      return (i + j + buffers * 2) % buffers;
    };
    copy(this.write, this.targets[this.index]);
    _ref = this.reads;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      read = _ref[i];
      copy(this.targets[add(this.index, -i)], read);
    }
    this.index = add(this.index, 1);
    return copy(this.targets[this.index], this.write);
  };

  RenderTarget.prototype.warmup = function(callback) {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.buffers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      callback(this.write);
      _results.push(this.cycle());
    }
    return _results;
  };

  RenderTarget.prototype.dispose = function() {
    var target, _i, _len, _ref;
    _ref = this.targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      target.dispose();
    }
    return this.targets = this.reads = this.write = null;
  };

  return RenderTarget;

})();

module.exports = RenderTarget;


},{}],133:[function(require,module,exports){
var DataBuffer, Util, VoxelBuffer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DataBuffer = require('./databuffer');

Util = require('../../util');

VoxelBuffer = (function(_super) {
  __extends(VoxelBuffer, _super);

  function VoxelBuffer() {
    return VoxelBuffer.__super__.constructor.apply(this, arguments);
  }

  VoxelBuffer.prototype.build = function(options) {
    VoxelBuffer.__super__.build.apply(this, arguments);
    this.pad = {
      x: 0,
      y: 0,
      z: 0
    };
    return this.streamer = this.generate(this.data);
  };

  VoxelBuffer.prototype.setActive = function(i, j, k) {
    var _ref;
    return _ref = [Math.max(0, this.width - i), Math.max(0, this.height - j), Math.max(0, this.depth - k)], this.pad.x = _ref[0], this.pad.y = _ref[1], this.pad.z = _ref[2], _ref;
  };

  VoxelBuffer.prototype.fill = function() {
    var callback, count, done, emit, i, j, k, l, limit, m, n, o, padX, padY, repeat, reset, skip, _ref;
    callback = this.callback;
    if (typeof callback.reset === "function") {
      callback.reset();
    }
    _ref = this.streamer, emit = _ref.emit, skip = _ref.skip, count = _ref.count, done = _ref.done, reset = _ref.reset;
    reset();
    n = this.width;
    m = this.height;
    o = this.depth;
    padX = this.pad.x;
    padY = this.pad.y;
    limit = this.samples - this.pad.z * n * m;
    i = j = k = l = 0;
    if (padX > 0 || padY > 0) {
      while (!done() && l < limit) {
        l++;
        repeat = callback(emit, i, j, k);
        if (++i === n - padX) {
          skip(padX);
          i = 0;
          if (++j === m - padY) {
            skip(n * padY);
            j = 0;
            k++;
          }
        }
        if (repeat === false) {
          break;
        }
      }
    } else {
      while (!done() && l < limit) {
        l++;
        repeat = callback(emit, i, j, k);
        if (++i === n) {
          i = 0;
          if (++j === m) {
            j = 0;
            k++;
          }
        }
        if (repeat === false) {
          break;
        }
      }
    }
    return Math.floor(count() / this.items);
  };

  VoxelBuffer.prototype.through = function(callback, target) {
    var consume, done, dst, emit, i, j, k, pipe, src, _ref;
    _ref = src = this.streamer, consume = _ref.consume, done = _ref.done;
    emit = (dst = target.streamer).emit;
    i = j = k = 0;
    pipe = function() {
      return consume(function(x, y, z, w) {
        return callback(emit, x, y, z, w, i, j, k);
      });
    };
    pipe = Util.Data.repeatCall(pipe, this.items);
    return (function(_this) {
      return function() {
        var l, limit, m, n, o, padX, padY;
        src.reset();
        dst.reset();
        n = _this.width;
        m = _this.height;
        o = _this.depth;
        padX = _this.pad.x;
        padY = _this.pad.y;
        limit = _this.samples - _this.pad.z * n * m;
        i = j = k = l = 0;
        if (padX > 0 || padY > 0) {
          while (!done() && l < limit) {
            l++;
            pipe();
            if (++i === n - padX) {
              skip(padX);
              i = 0;
              if (++j === m - padY) {
                skip(n * padY);
                j = 0;
                k++;
              }
            }
          }
        } else {
          while (!done() && l < limit) {
            l++;
            pipe();
            if (++i === n) {
              i = 0;
              if (++j === m) {
                j = 0;
                k++;
              }
            }
          }
        }
        return src.count();
      };
    })(this);
  };

  return VoxelBuffer;

})(DataBuffer);

module.exports = VoxelBuffer;


},{"../../util":172,"./databuffer":123}],134:[function(require,module,exports){
var Classes;

Classes = {
  sprite: require('./meshes/sprite'),
  point: require('./meshes/point'),
  line: require('./meshes/line'),
  surface: require('./meshes/surface'),
  face: require('./meshes/face'),
  strip: require('./meshes/strip'),
  arrow: require('./meshes/arrow'),
  screen: require('./meshes/screen'),
  memoScreen: require('./meshes/memoscreen'),
  debug: require('./meshes/debug'),
  dataBuffer: require('./buffer/databuffer'),
  arrayBuffer: require('./buffer/arraybuffer'),
  matrixBuffer: require('./buffer/matrixbuffer'),
  voxelBuffer: require('./buffer/voxelbuffer'),
  pushBuffer: require('./buffer/pushbuffer'),
  renderToTexture: require('./buffer/rendertotexture'),
  memo: require('./buffer/memo'),
  readback: require('./buffer/readback'),
  atlas: require('./buffer/atlas'),
  textAtlas: require('./buffer/textatlas'),
  scene: require('./scene')
};

module.exports = Classes;


},{"./buffer/arraybuffer":120,"./buffer/atlas":121,"./buffer/databuffer":123,"./buffer/matrixbuffer":124,"./buffer/memo":125,"./buffer/pushbuffer":126,"./buffer/readback":127,"./buffer/rendertotexture":128,"./buffer/textatlas":129,"./buffer/voxelbuffer":133,"./meshes/arrow":147,"./meshes/debug":149,"./meshes/face":150,"./meshes/line":151,"./meshes/memoscreen":152,"./meshes/point":153,"./meshes/screen":154,"./meshes/sprite":155,"./meshes/strip":156,"./meshes/surface":157,"./scene":159}],135:[function(require,module,exports){
var RenderFactory;

RenderFactory = (function() {
  function RenderFactory(classes, renderer, shaders) {
    this.classes = classes;
    this.renderer = renderer;
    this.shaders = shaders;
  }

  RenderFactory.prototype.getTypes = function() {
    return Object.keys(this.classes);
  };

  RenderFactory.prototype.make = function(type, options) {
    return new this.classes[type](this.renderer, this.shaders, options);
  };

  return RenderFactory;

})();

module.exports = RenderFactory;


},{}],136:[function(require,module,exports){
var ArrowGeometry, ClipGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
Cones to attach as arrowheads on line strips

.....> .....> .....> .....>

.....> .....> .....> .....>

.....> .....> .....> .....>
 */

ArrowGeometry = (function(_super) {
  __extends(ArrowGeometry, _super);

  function ArrowGeometry(options) {
    var a, anchor, angle, arrow, arrows, attach, b, back, base, c, circle, far, flip, i, index, k, l, layers, near, points, position, ribbons, samples, sides, step, strips, tip, triangles, x, y, z, _i, _j, _k, _l, _m, _n, _o, _ref, _ref1;
    ArrowGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.sides = sides = +options.sides || 12;
    this.samples = samples = +options.samples || 2;
    this.strips = strips = +options.strips || 1;
    this.ribbons = ribbons = +options.ribbons || 1;
    this.layers = layers = +options.layers || 1;
    this.flip = flip = (_ref = options.flip) != null ? _ref : false;
    this.anchor = anchor = (_ref1 = options.anchor) != null ? _ref1 : flip ? 0 : samples - 1;
    arrows = strips * ribbons * layers;
    points = (sides + 2) * arrows;
    triangles = (sides * 2) * arrows;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this.addAttribute('arrow', new THREE.BufferAttribute(new Float32Array(points * 3), 3));
    this.addAttribute('attach', new THREE.BufferAttribute(new Float32Array(points * 2), 2));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    arrow = this._emitter('arrow');
    attach = this._emitter('attach');
    circle = [];
    for (k = _i = 0; 0 <= sides ? _i < sides : _i > sides; k = 0 <= sides ? ++_i : --_i) {
      angle = k / sides * τ;
      circle.push([Math.cos(angle), Math.sin(angle), 1]);
    }
    base = 0;
    for (i = _j = 0; 0 <= arrows ? _j < arrows : _j > arrows; i = 0 <= arrows ? ++_j : --_j) {
      tip = base++;
      back = tip + sides + 1;
      for (k = _k = 0; 0 <= sides ? _k < sides : _k > sides; k = 0 <= sides ? ++_k : --_k) {
        a = base + k % sides;
        b = base + (k + 1) % sides;
        index(tip);
        index(a);
        index(b);
        index(b);
        index(a);
        index(back);
      }
      base += sides + 1;
    }
    step = flip ? 1 : -1;
    far = flip ? samples - 1 : 0;
    near = anchor + step;
    x = anchor;
    for (l = _l = 0; 0 <= layers ? _l < layers : _l > layers; l = 0 <= layers ? ++_l : --_l) {
      for (z = _m = 0; 0 <= ribbons ? _m < ribbons : _m > ribbons; z = 0 <= ribbons ? ++_m : --_m) {
        for (y = _n = 0; 0 <= strips ? _n < strips : _n > strips; y = 0 <= strips ? ++_n : --_n) {
          position(x, y, z, l);
          arrow(0, 0, 0);
          attach(near, far);
          for (k = _o = 0; 0 <= sides ? _o < sides : _o > sides; k = 0 <= sides ? ++_o : --_o) {
            position(x, y, z, l);
            c = circle[k];
            arrow(c[0], c[1], c[2]);
            attach(near, far);
          }
          position(x, y, z, l);
          arrow(0, 0, 1);
          attach(near, far);
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  ArrowGeometry.prototype.clip = function(samples, strips, ribbons, layers) {
    var dims, maxs, quads, segments;
    if (samples == null) {
      samples = this.samples;
    }
    if (strips == null) {
      strips = this.strips;
    }
    if (ribbons == null) {
      ribbons = this.ribbons;
    }
    if (layers == null) {
      layers = this.layers;
    }
    segments = Math.max(0, samples - 1);
    this._clipGeometry(samples, strips, ribbons, layers);
    if (samples > this.anchor) {
      dims = [layers, ribbons, strips];
      maxs = [this.layers, this.ribbons, this.strips];
      quads = this.sides * this._reduce(dims, maxs);
    } else {
      quads = 0;
    }
    return this._offsets([
      {
        start: 0,
        count: quads * 6
      }
    ]);
  };

  return ArrowGeometry;

})(ClipGeometry);

module.exports = ArrowGeometry;


},{"./clipgeometry":137}],137:[function(require,module,exports){
var ClipGeometry, Geometry, debug, tick,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Geometry = require('./geometry');

debug = false;

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

ClipGeometry = (function(_super) {
  __extends(ClipGeometry, _super);

  function ClipGeometry() {
    return ClipGeometry.__super__.constructor.apply(this, arguments);
  }

  ClipGeometry.prototype._clipUniforms = function() {
    this.geometryClip = new THREE.Vector4(1e10, 1e10, 1e10, 1e10);
    this.geometryResolution = new THREE.Vector4;
    this.mapSize = new THREE.Vector4;
    if (this.uniforms == null) {
      this.uniforms = {};
    }
    this.uniforms.geometryClip = {
      type: 'v4',
      value: this.geometryClip
    };
    this.uniforms.geometryResolution = {
      type: 'v4',
      value: this.geometryResolution
    };
    return this.uniforms.mapSize = {
      type: 'v4',
      value: this.mapSize
    };
  };

  ClipGeometry.prototype._clipGeometry = function(width, height, depth, items) {
    var c, r;
    c = function(x) {
      return Math.max(0, x - 1);
    };
    r = function(x) {
      return 1 / Math.max(1, x - 1);
    };
    this.geometryClip.set(c(width), c(height), c(depth), c(items));
    return this.geometryResolution.set(r(width), r(height), r(depth), r(items));
  };

  ClipGeometry.prototype._clipMap = function(mapWidth, mapHeight, mapDepth, mapItems) {
    return this.mapSize.set(mapWidth, mapHeight, mapDepth, mapItems);
  };

  ClipGeometry.prototype._clipOffsets = function(factor, width, height, depth, items, _width, _height, _depth, _items) {
    var dims, elements, maxs;
    dims = [depth, height, width, items];
    maxs = [_depth, _height, _width, _items];
    elements = this._reduce(dims, maxs);
    return this._offsets([
      {
        start: 0,
        count: elements * factor
      }
    ]);
  };

  return ClipGeometry;

})(Geometry);

module.exports = ClipGeometry;


},{"./geometry":139}],138:[function(require,module,exports){
var ClipGeometry, FaceGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
(flat) Triangle fans arranged in items, columns and rows

+-+     +-+     +-+     +-+     
|\\\    |\\\    |\\\    |\\\    
+-+-+   +-+-+   +-+-+   +-+-+   

+-+     +-+     +-+     +-+     
|\\\    |\\\    |\\\    |\\\    
+-+-+   +-+-+   +-+-+   +-+-+   

+-+     +-+     +-+     +-+     
|\\\    |\\\    |\\\    |\\\    
+-+-+   +-+-+   +-+-+   +-+-+
 */

FaceGeometry = (function(_super) {
  __extends(FaceGeometry, _super);

  function FaceGeometry(options) {
    var base, depth, height, i, index, items, j, l, points, position, samples, sides, triangles, width, x, y, z, _i, _j, _k, _l, _m, _n;
    FaceGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.items = items = +options.items || 2;
    this.width = width = +options.width || 1;
    this.height = height = +options.height || 1;
    this.depth = depth = +options.depth || 1;
    this.sides = sides = Math.max(0, items - 2);
    samples = width * height * depth;
    points = items * samples;
    triangles = sides * samples;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    base = 0;
    for (i = _i = 0; 0 <= samples ? _i < samples : _i > samples; i = 0 <= samples ? ++_i : --_i) {
      for (j = _j = 0; 0 <= sides ? _j < sides : _j > sides; j = 0 <= sides ? ++_j : --_j) {
        index(base);
        index(base + j + 1);
        index(base + j + 2);
      }
      base += items;
    }
    for (z = _k = 0; 0 <= depth ? _k < depth : _k > depth; z = 0 <= depth ? ++_k : --_k) {
      for (y = _l = 0; 0 <= height ? _l < height : _l > height; y = 0 <= height ? ++_l : --_l) {
        for (x = _m = 0; 0 <= width ? _m < width : _m > width; x = 0 <= width ? ++_m : --_m) {
          for (l = _n = 0; 0 <= items ? _n < items : _n > items; l = 0 <= items ? ++_n : --_n) {
            position(x, y, z, l);
          }
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  FaceGeometry.prototype.clip = function(width, height, depth, items) {
    var sides;
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (depth == null) {
      depth = this.depth;
    }
    if (items == null) {
      items = this.items;
    }
    sides = Math.max(0, items - 2);
    this._clipGeometry(width, height, depth, items);
    return this._clipOffsets(3, width, height, depth, sides, this.width, this.height, this.depth, this.sides);
  };

  return FaceGeometry;

})(ClipGeometry);

module.exports = FaceGeometry;


},{"./clipgeometry":137}],139:[function(require,module,exports){
var Geometry, debug, tick,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

debug = false;

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

Geometry = (function(_super) {
  __extends(Geometry, _super);

  function Geometry() {
    THREE.BufferGeometry.call(this);
    if (this.uniforms == null) {
      this.uniforms = {};
    }
    if (this.offsets == null) {
      this.offsets = [];
    }
    if (debug) {
      this.tock = tick();
    }
    this.chunked = false;
    this.limit = 0xFFFF;
  }

  Geometry.prototype._reduce = function(dims, maxs) {
    var dim, i, max, multiple, quads, _i, _len;
    multiple = false;
    for (i = _i = 0, _len = dims.length; _i < _len; i = ++_i) {
      dim = dims[i];
      max = maxs[i];
      if (multiple) {
        dims[i] = max;
      }
      if (dim > 1) {
        multiple = true;
      }
    }
    return quads = dims.reduce(function(a, b) {
      return a * b;
    });
  };

  Geometry.prototype._emitter = function(name) {
    var array, attribute, dimensions, four, offset, one, three, two;
    attribute = this.attributes[name];
    dimensions = attribute.itemSize;
    array = attribute.array;
    offset = 0;
    one = function(a) {
      return array[offset++] = a;
    };
    two = function(a, b) {
      array[offset++] = a;
      return array[offset++] = b;
    };
    three = function(a, b, c) {
      array[offset++] = a;
      array[offset++] = b;
      return array[offset++] = c;
    };
    four = function(a, b, c, d) {
      array[offset++] = a;
      array[offset++] = b;
      array[offset++] = c;
      return array[offset++] = d;
    };
    return [null, one, two, three, four][dimensions];
  };

  Geometry.prototype._autochunk = function() {
    var array, attribute, indexed, name, numItems, _ref;
    indexed = this.attributes.index;
    _ref = this.attributes;
    for (name in _ref) {
      attribute = _ref[name];
      if (name !== 'index' && indexed) {
        numItems = attribute.array.length / attribute.itemSize;
        if (numItems > this.limit) {
          this.chunked = true;
        }
        break;
      }
    }
    if (this.chunked && !indexed.u16) {
      indexed.u16 = array = indexed.array;
      return indexed.array = new Uint32Array(array.length);
    }
  };

  Geometry.prototype._finalize = function() {
    var attrib;
    if (!this.chunked) {
      return;
    }
    attrib = this.attributes.index;
    this.chunks = this._chunks(attrib.array, this.limit);
    this._chunkify(attrib, this.chunks);
    if (debug) {
      return this.tock(this.constructor.name);
    }
  };

  Geometry.prototype._chunks = function(array, limit) {
    var a, b, chunks, end, i, j1, j2, j3, jmax, jmin, last, n, o, push, start, _i;
    chunks = [];
    last = 0;
    start = array[0];
    end = array[0];
    push = function(i) {
      var _count, _end, _start;
      _start = last * 3;
      _end = i * 3;
      _count = _end - _start;
      return chunks.push({
        index: start,
        start: _start,
        count: _count,
        end: _end
      });
    };
    n = Math.floor(array.length / 3);
    o = 0;
    for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
      j1 = array[o++];
      j2 = array[o++];
      j3 = array[o++];
      jmin = Math.min(j1, j2, j3);
      jmax = Math.max(j1, j2, j3);
      a = Math.min(start, jmin);
      b = Math.max(end, jmax);
      if (b - a > limit) {
        push(i);
        a = jmin;
        b = jmax;
        last = i;
      }
      start = a;
      end = b;
    }
    push(n);
    return chunks;
  };

  Geometry.prototype._chunkify = function(attrib, chunks) {
    var chunk, from, i, offset, to, _i, _j, _len, _ref, _ref1;
    if (!attrib.u16) {
      return;
    }
    from = attrib.array;
    to = attrib.u16;
    for (_i = 0, _len = chunks.length; _i < _len; _i++) {
      chunk = chunks[_i];
      offset = chunk.index;
      for (i = _j = _ref = chunk.start, _ref1 = chunk.end; _ref <= _ref1 ? _j < _ref1 : _j > _ref1; i = _ref <= _ref1 ? ++_j : --_j) {
        to[i] = from[i] - offset;
      }
    }
    attrib.array = attrib.u16;
    return delete attrib.u16;
  };

  Geometry.prototype._offsets = function(offsets) {
    var chunk, chunks, end, offset, out, start, _end, _i, _j, _len, _len1, _start;
    if (!this.chunked) {
      this.offsets = offsets;
    } else {
      chunks = this.chunks;
      out = this.offsets;
      out.length = null;
      for (_i = 0, _len = offsets.length; _i < _len; _i++) {
        offset = offsets[_i];
        start = offset.start;
        end = offset.count - start;
        for (_j = 0, _len1 = chunks.length; _j < _len1; _j++) {
          chunk = chunks[_j];
          _start = chunk.start;
          _end = chunk.end;
          if (start <= _start && end > _start || start < _end && end >= _end || start > _start && end < _end) {
            _start = Math.max(start, _start);
            _end = Math.min(end, _end);
            out.push({
              index: chunk.index,
              start: _start,
              count: _end - _start
            });
          }
        }
      }
    }
    return null;
  };

  return Geometry;

})(THREE.BufferGeometry);

module.exports = Geometry;


},{}],140:[function(require,module,exports){
exports.Geometry = require('./geometry');

exports.ArrowGeometry = require('./arrowgeometry');

exports.FaceGeometry = require('./facegeometry');

exports.LineGeometry = require('./linegeometry');

exports.ScreenGeometry = require('./screengeometry');

exports.SpriteGeometry = require('./spritegeometry');

exports.StripGeometry = require('./stripgeometry');

exports.SurfaceGeometry = require('./surfacegeometry');


},{"./arrowgeometry":136,"./facegeometry":138,"./geometry":139,"./linegeometry":141,"./screengeometry":142,"./spritegeometry":143,"./stripgeometry":144,"./surfacegeometry":145}],141:[function(require,module,exports){
var ClipGeometry, LineGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
Line strips arranged in columns and rows

+----+ +----+ +----+ +----+

+----+ +----+ +----+ +----+

+----+ +----+ +----+ +----+
 */

LineGeometry = (function(_super) {
  __extends(LineGeometry, _super);

  function LineGeometry(options) {
    var base, closed, edge, edger, i, index, j, k, l, layers, line, points, position, quads, ribbons, samples, segments, strip, strips, triangles, wrap, x, y, z, _i, _j, _k, _l, _m, _n, _o, _ref;
    LineGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.closed = closed = options.closed || false;
    this.samples = samples = (+options.samples || 2) + (closed ? 1 : 0);
    this.strips = strips = +options.strips || 1;
    this.ribbons = ribbons = +options.ribbons || 1;
    this.layers = layers = +options.layers || 1;
    this.segments = segments = samples - 1;
    wrap = samples - (closed ? 1 : 0);
    points = samples * strips * ribbons * layers * 2;
    quads = segments * strips * ribbons * layers;
    triangles = quads * 2;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this.addAttribute('line', new THREE.BufferAttribute(new Float32Array(points * 2), 2));
    this.addAttribute('strip', new THREE.BufferAttribute(new Float32Array(points * 2), 2));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    line = this._emitter('line');
    strip = this._emitter('strip');
    base = 0;
    for (i = _i = 0, _ref = ribbons * layers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (j = _j = 0; 0 <= strips ? _j < strips : _j > strips; j = 0 <= strips ? ++_j : --_j) {
        for (k = _k = 0; 0 <= segments ? _k < segments : _k > segments; k = 0 <= segments ? ++_k : --_k) {
          index(base);
          index(base + 1);
          index(base + 2);
          index(base + 2);
          index(base + 1);
          index(base + 3);
          base += 2;
        }
        base += 2;
      }
    }
    edger = closed ? function() {
      return 0;
    } : function(x) {
      if (x === 0) {
        return -1;
      } else if (x === segments) {
        return 1;
      } else {
        return 0;
      }
    };
    for (l = _l = 0; 0 <= layers ? _l < layers : _l > layers; l = 0 <= layers ? ++_l : --_l) {
      for (z = _m = 0; 0 <= ribbons ? _m < ribbons : _m > ribbons; z = 0 <= ribbons ? ++_m : --_m) {
        for (y = _n = 0; 0 <= strips ? _n < strips : _n > strips; y = 0 <= strips ? ++_n : --_n) {
          for (x = _o = 0; 0 <= samples ? _o < samples : _o > samples; x = 0 <= samples ? ++_o : --_o) {
            if (closed) {
              x = x % wrap;
            }
            edge = edger(x);
            position(x, y, z, l);
            position(x, y, z, l);
            line(edge, 1);
            line(edge, -1);
            strip(0, segments);
            strip(0, segments);
          }
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  LineGeometry.prototype.clip = function(samples, strips, ribbons, layers) {
    var segments;
    if (samples == null) {
      samples = this.samples - this.closed;
    }
    if (strips == null) {
      strips = this.strips;
    }
    if (ribbons == null) {
      ribbons = this.ribbons;
    }
    if (layers == null) {
      layers = this.layers;
    }
    segments = Math.max(0, samples - (this.closed ? 0 : 1));
    this._clipGeometry(samples, strips, ribbons, layers);
    return this._clipOffsets(6, segments, strips, ribbons, layers, this.segments, this.strips, this.ribbons, this.layers);
  };

  return LineGeometry;

})(ClipGeometry);

module.exports = LineGeometry;


},{"./clipgeometry":137}],142:[function(require,module,exports){
var ScreenGeometry, SurfaceGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

SurfaceGeometry = require('./surfacegeometry');


/*
Grid Surface in normalized screen space

+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+

+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
 */

ScreenGeometry = (function(_super) {
  __extends(ScreenGeometry, _super);

  function ScreenGeometry(options) {
    var _ref, _ref1;
    if (this.uniforms == null) {
      this.uniforms = {};
    }
    this.uniforms.geometryScale = {
      type: 'v4',
      value: new THREE.Vector4
    };
    options.width = Math.max(2, (_ref = +options.width) != null ? _ref : 2);
    options.height = Math.max(2, (_ref1 = +options.height) != null ? _ref1 : 2);
    this.cover();
    ScreenGeometry.__super__.constructor.call(this, options);
  }

  ScreenGeometry.prototype.cover = function(scaleX, scaleY, scaleZ, scaleW) {
    this.scaleX = scaleX != null ? scaleX : 1;
    this.scaleY = scaleY != null ? scaleY : 1;
    this.scaleZ = scaleZ != null ? scaleZ : 1;
    this.scaleW = scaleW != null ? scaleW : 1;
  };

  ScreenGeometry.prototype.clip = function(width, height, surfaces, layers) {
    var invert;
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (surfaces == null) {
      surfaces = this.surfaces;
    }
    if (layers == null) {
      layers = this.layers;
    }
    ScreenGeometry.__super__.clip.call(this, width, height, surfaces, layers);
    invert = function(x) {
      return 1 / Math.max(1, x - 1);
    };
    return this.uniforms.geometryScale.value.set(invert(width) * this.scaleX, invert(height) * this.scaleY, invert(surfaces) * this.scaleZ, invert(layers) * this.scaleW);
  };

  return ScreenGeometry;

})(SurfaceGeometry);

module.exports = ScreenGeometry;


},{"./surfacegeometry":145}],143:[function(require,module,exports){
var ClipGeometry, SpriteGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
Render points as quads

+----+  +----+  +----+  +----+
|    |  |    |  |    |  |    |
+----+  +----+  +----+  +----+

+----+  +----+  +----+  +----+
|    |  |    |  |    |  |    |
+----+  +----+  +----+  +----+

+----+  +----+  +----+  +----+
|    |  |    |  |    |  |    |
+----+  +----+  +----+  +----+
 */

SpriteGeometry = (function(_super) {
  __extends(SpriteGeometry, _super);

  function SpriteGeometry(options) {
    var base, depth, height, i, index, items, l, points, position, quad, samples, sprite, triangles, v, width, x, y, z, _i, _j, _k, _l, _len, _m, _n;
    SpriteGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.items = items = +options.items || 2;
    this.width = width = +options.width || 1;
    this.height = height = +options.height || 1;
    this.depth = depth = +options.depth || 1;
    samples = items * width * height * depth;
    points = samples * 4;
    triangles = samples * 2;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this.addAttribute('sprite', new THREE.BufferAttribute(new Float32Array(points * 2), 2));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    sprite = this._emitter('sprite');
    quad = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    base = 0;
    for (i = _i = 0; 0 <= samples ? _i < samples : _i > samples; i = 0 <= samples ? ++_i : --_i) {
      index(base);
      index(base + 1);
      index(base + 2);
      index(base + 1);
      index(base + 2);
      index(base + 3);
      base += 4;
    }
    for (z = _j = 0; 0 <= depth ? _j < depth : _j > depth; z = 0 <= depth ? ++_j : --_j) {
      for (y = _k = 0; 0 <= height ? _k < height : _k > height; y = 0 <= height ? ++_k : --_k) {
        for (x = _l = 0; 0 <= width ? _l < width : _l > width; x = 0 <= width ? ++_l : --_l) {
          for (l = _m = 0; 0 <= items ? _m < items : _m > items; l = 0 <= items ? ++_m : --_m) {
            for (_n = 0, _len = quad.length; _n < _len; _n++) {
              v = quad[_n];
              position(x, y, z, l);
              sprite(v[0], v[1]);
            }
          }
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  SpriteGeometry.prototype.clip = function(width, height, depth, items) {
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (depth == null) {
      depth = this.depth;
    }
    if (items == null) {
      items = this.items;
    }
    this._clipGeometry(width, height, depth, items);
    return this._clipOffsets(6, width, height, depth, items, this.width, this.height, this.depth, this.items);
  };

  return SpriteGeometry;

})(ClipGeometry);

module.exports = SpriteGeometry;


},{"./clipgeometry":137}],144:[function(require,module,exports){
var ClipGeometry, StripGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
Triangle strips arranged in items, columns and rows

+--+--+--+  +--+--+--+  +--+--+--+  +--+--+--+  
| /| /| /   | /| /| /   | /| /| /   | /| /| / 
+--+--+/    +--+--+/    +--+--+/    +--+--+/  

+--+--+--+  +--+--+--+  +--+--+--+  +--+--+--+  
| /| /| /   | /| /| /   | /| /| /   | /| /| / 
+--+--+/    +--+--+/    +--+--+/    +--+--+/  

+--+--+--+  +--+--+--+  +--+--+--+  +--+--+--+  
| /| /| /   | /| /| /   | /| /| /   | /| /| / 
+--+--+/    +--+--+/    +--+--+/    +--+--+/
 */

StripGeometry = (function(_super) {
  __extends(StripGeometry, _super);

  function StripGeometry(options) {
    var base, depth, f, height, i, index, items, j, l, last, o, points, position, samples, sides, strip, triangles, width, x, y, z, _i, _j, _k, _l, _m, _n;
    StripGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.items = items = +options.items || 2;
    this.width = width = +options.width || 1;
    this.height = height = +options.height || 1;
    this.depth = depth = +options.depth || 1;
    this.sides = sides = Math.max(0, items - 2);
    samples = width * height * depth;
    points = items * samples;
    triangles = sides * samples;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this.addAttribute('strip', new THREE.BufferAttribute(new Float32Array(points * 3), 3));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    strip = this._emitter('strip');
    base = 0;
    for (i = _i = 0; 0 <= samples ? _i < samples : _i > samples; i = 0 <= samples ? ++_i : --_i) {
      o = base;
      for (j = _j = 0; 0 <= sides ? _j < sides : _j > sides; j = 0 <= sides ? ++_j : --_j) {
        if (j & 1) {
          index(o + 1);
          index(o);
          index(o + 2);
        } else {
          index(o);
          index(o + 1);
          index(o + 2);
        }
        o++;
      }
      base += items;
    }
    last = items - 1;
    for (z = _k = 0; 0 <= depth ? _k < depth : _k > depth; z = 0 <= depth ? ++_k : --_k) {
      for (y = _l = 0; 0 <= height ? _l < height : _l > height; y = 0 <= height ? ++_l : --_l) {
        for (x = _m = 0; 0 <= width ? _m < width : _m > width; x = 0 <= width ? ++_m : --_m) {
          f = 1;
          position(x, y, z, 0);
          strip(1, 2, f);
          for (l = _n = 1; 1 <= last ? _n < last : _n > last; l = 1 <= last ? ++_n : --_n) {
            position(x, y, z, l);
            strip(l - 1, l + 1, f = -f);
          }
          position(x, y, z, last);
          strip(last - 2, last - 1, -f);
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  StripGeometry.prototype.clip = function(width, height, depth, items) {
    var sides;
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (depth == null) {
      depth = this.depth;
    }
    if (items == null) {
      items = this.items;
    }
    sides = Math.max(0, items - 2);
    this._clipGeometry(width, height, depth, items);
    return this._clipOffsets(3, width, height, depth, sides, this.width, this.height, this.depth, this.sides);
  };

  return StripGeometry;

})(ClipGeometry);

module.exports = StripGeometry;


},{"./clipgeometry":137}],145:[function(require,module,exports){
var ClipGeometry, SurfaceGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ClipGeometry = require('./clipgeometry');


/*
Grid Surface

+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+

+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
 */

SurfaceGeometry = (function(_super) {
  __extends(SurfaceGeometry, _super);

  function SurfaceGeometry(options) {
    var base, closedX, closedY, edgeX, edgeY, edgerX, edgerY, height, i, index, j, k, l, layers, points, position, quads, segmentsX, segmentsY, surface, surfaces, triangles, width, wrapX, wrapY, x, y, z, _i, _j, _k, _l, _m, _n, _o, _ref;
    SurfaceGeometry.__super__.constructor.call(this, options);
    this._clipUniforms();
    this.closedX = closedX = options.closedX || false;
    this.closedY = closedY = options.closedY || false;
    this.width = width = (+options.width || 2) + (closedX ? 1 : 0);
    this.height = height = (+options.height || 2) + (closedY ? 1 : 0);
    this.surfaces = surfaces = +options.surfaces || 1;
    this.layers = layers = +options.layers || 1;
    wrapX = width - (closedX ? 1 : 0);
    wrapY = height - (closedY ? 1 : 0);
    this.segmentsX = segmentsX = Math.max(0, width - 1);
    this.segmentsY = segmentsY = Math.max(0, height - 1);
    points = width * height * surfaces * layers;
    quads = segmentsX * segmentsY * surfaces * layers;
    triangles = quads * 2;
    this.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1));
    this.addAttribute('position4', new THREE.BufferAttribute(new Float32Array(points * 4), 4));
    this.addAttribute('surface', new THREE.BufferAttribute(new Float32Array(points * 2), 2));
    this._autochunk();
    index = this._emitter('index');
    position = this._emitter('position4');
    surface = this._emitter('surface');
    base = 0;
    for (i = _i = 0, _ref = surfaces * layers; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      for (j = _j = 0; 0 <= segmentsY ? _j < segmentsY : _j > segmentsY; j = 0 <= segmentsY ? ++_j : --_j) {
        for (k = _k = 0; 0 <= segmentsX ? _k < segmentsX : _k > segmentsX; k = 0 <= segmentsX ? ++_k : --_k) {
          index(base);
          index(base + 1);
          index(base + width);
          index(base + width);
          index(base + 1);
          index(base + width + 1);
          base++;
        }
        base++;
      }
      base += width;
    }
    edgerX = closedX ? function() {
      return 0;
    } : function(x) {
      if (x === 0) {
        return -1;
      } else if (x === segmentsX) {
        return 1;
      } else {
        return 0;
      }
    };
    edgerY = closedY ? function() {
      return 0;
    } : function(y) {
      if (y === 0) {
        return -1;
      } else if (y === segmentsY) {
        return 1;
      } else {
        return 0;
      }
    };
    for (l = _l = 0; 0 <= layers ? _l < layers : _l > layers; l = 0 <= layers ? ++_l : --_l) {
      for (z = _m = 0; 0 <= surfaces ? _m < surfaces : _m > surfaces; z = 0 <= surfaces ? ++_m : --_m) {
        for (y = _n = 0; 0 <= height ? _n < height : _n > height; y = 0 <= height ? ++_n : --_n) {
          if (closedY) {
            y = y % wrapY;
          }
          edgeY = edgerY(y);
          for (x = _o = 0; 0 <= width ? _o < width : _o > width; x = 0 <= width ? ++_o : --_o) {
            if (closedX) {
              x = x % wrapX;
            }
            edgeX = edgerX(x);
            position(x, y, z, l);
            surface(edgeX, edgeY);
          }
        }
      }
    }
    this._finalize();
    this.clip();
    return;
  }

  SurfaceGeometry.prototype.clip = function(width, height, surfaces, layers) {
    var segmentsX, segmentsY;
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (surfaces == null) {
      surfaces = this.surfaces;
    }
    if (layers == null) {
      layers = this.layers;
    }
    segmentsX = Math.max(0, width - 1);
    segmentsY = Math.max(0, height - 1);
    this._clipGeometry(width, height, surfaces, layers);
    return this._clipOffsets(6, segmentsX, segmentsY, surfaces, layers, this.segmentsX, this.segmentsY, this.surfaces, this.layers);
  };

  SurfaceGeometry.prototype.map = function(width, height, surfaces, layers) {
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (surfaces == null) {
      surfaces = this.surfaces;
    }
    if (layers == null) {
      layers = this.layers;
    }
    return this._clipMap(width, height, surfaces, layers);
  };

  return SurfaceGeometry;

})(ClipGeometry);

module.exports = SurfaceGeometry;


},{"./clipgeometry":137}],146:[function(require,module,exports){
exports.Scene = require('./scene');

exports.Factory = require('./factory');

exports.Renderable = require('./scene');

exports.Classes = require('./classes');


},{"./classes":134,"./factory":135,"./scene":159}],147:[function(require,module,exports){
var Arrow, ArrowGeometry, Base,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

ArrowGeometry = require('../geometry').ArrowGeometry;

Arrow = (function(_super) {
  __extends(Arrow, _super);

  function Arrow(renderer, shaders, options) {
    var color, combine, f, factory, hasStyle, linear, map, mask, material, object, position, stpq, uniforms, v;
    Arrow.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, mask = options.mask, map = options.map, combine = options.combine, stpq = options.stpq, linear = options.linear;
    if (uniforms == null) {
      uniforms = {};
    }
    hasStyle = uniforms.styleColor != null;
    this.geometry = new ArrowGeometry({
      sides: options.sides,
      samples: options.samples,
      strips: options.strips,
      ribbons: options.ribbons,
      layers: options.layers,
      anchor: options.anchor,
      flip: options.flip
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 1, stpq));
    v.pipe('arrow.position', this.uniforms);
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 1, stpq, combine, linear);
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({}));
    object = new THREE.Mesh(this.geometry, this.material);
    object.frustumCulled = false;
    object.matrixAutoUpdate = false;
    this._raw(object);
    this.renders = [object];
  }

  Arrow.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Arrow.__super__.dispose.apply(this, arguments);
  };

  return Arrow;

})(Base);

module.exports = Arrow;


},{"../geometry":140,"./base":148}],148:[function(require,module,exports){
var Base, Renderable, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Renderable = require('../renderable');

Util = require('../../util');

Base = (function(_super) {
  __extends(Base, _super);

  function Base(renderer, shaders, options) {
    var _ref;
    Base.__super__.constructor.call(this, renderer, shaders, options);
    this.zUnits = (_ref = options.zUnits) != null ? _ref : 0;
  }

  Base.prototype.raw = function() {
    var object, _i, _len, _ref;
    _ref = this.renders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this._raw(object);
    }
    return null;
  };

  Base.prototype.depth = function(write, test) {
    var object, _i, _len, _ref;
    _ref = this.renders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this._depth(object, write, test);
    }
    return null;
  };

  Base.prototype.polygonOffset = function(factor, units) {
    var object, _i, _len, _ref;
    _ref = this.renders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this._polygonOffset(object, factor, units);
    }
    return null;
  };

  Base.prototype.show = function(transparent, blending, order) {
    var object, _i, _len, _ref, _results;
    _ref = this.renders;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      _results.push(this._show(object, transparent, blending, order));
    }
    return _results;
  };

  Base.prototype.hide = function() {
    var object, _i, _len, _ref;
    _ref = this.renders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this._hide(object);
    }
    return null;
  };

  Base.prototype._material = function(options) {
    var fragmentPrefix, key, material, precision, vertexPrefix, _i, _len, _ref;
    precision = this.renderer.getPrecision();
    vertexPrefix = "    precision " + precision + " float;\n    precision " + precision + " int;\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\nuniform vec3 cameraPosition;";
    fragmentPrefix = "    precision " + precision + " float;\n    precision " + precision + " int;\nuniform mat4 viewMatrix;\nuniform vec3 cameraPosition;";
    material = new THREE.RawShaderMaterial(options);
    _ref = ['vertexGraph', 'fragmentGraph'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      material[key] = options[key];
    }
    material.vertexShader = [vertexPrefix, material.vertexShader].join('\n');
    material.fragmentShader = [fragmentPrefix, material.fragmentShader].join('\n');
    return material;
  };

  Base.prototype._raw = function(object) {
    object.rotationAutoUpdate = false;
    object.frustumCulled = false;
    object.matrixAutoUpdate = false;
    return object.material.defaultAttributeValues = void 0;
  };

  Base.prototype._depth = function(object, write, test) {
    var m;
    m = object.material;
    m.depthWrite = write;
    return m.depthTest = test;
  };

  Base.prototype._polygonOffset = function(object, factor, units) {
    var enabled, m;
    units -= this.zUnits;
    enabled = units !== 0;
    m = object.material;
    m.polygonOffset = enabled;
    if (enabled) {
      m.polygonOffsetFactor = factor;
      return m.polygonOffsetUnits = units;
    }
  };

  Base.prototype._show = function(object, transparent, blending, order) {
    var m;
    transparent = true;
    m = object.material;
    object.renderOrder = -order;
    object.visible = true;
    m.transparent = transparent;
    m.blending = blending;
    return null;
  };

  Base.prototype._hide = function(object) {
    return object.visible = false;
  };

  Base.prototype._vertexColor = function(color, mask) {
    var v;
    if (!(color || mask)) {
      return;
    }
    v = this.shaders.shader();
    if (color) {
      v.require(color);
      v.pipe('mesh.vertex.color', this.uniforms);
    }
    if (mask) {
      v.require(mask);
      v.pipe('mesh.vertex.mask', this.uniforms);
    }
    return v;
  };

  Base.prototype._vertexPosition = function(position, material, map, channels, stpq) {
    var defs, v;
    v = this.shaders.shader();
    if (map || (material && material !== true)) {
      defs = {};
      if (channels > 0 || stpq) {
        defs.POSITION_MAP = '';
      }
      if (channels > 0) {
        defs[['POSITION_U', 'POSITION_UV', 'POSITION_UVW', 'POSITION_UVWO'][channels - 1]] = '';
      }
      if (stpq) {
        defs.POSITION_STPQ = '';
      }
    }
    v.require(position);
    return v.pipe('mesh.vertex.position', this.uniforms, defs);
  };

  Base.prototype._fragmentColor = function(hasStyle, material, color, mask, map, channels, stpq, combine, linear) {
    var defs, f, gamma, join;
    f = this.shaders.shader();
    join = false;
    gamma = false;
    defs = {};
    if (channels > 0) {
      defs[['POSITION_U', 'POSITION_UV', 'POSITION_UVW', 'POSITION_UVWO'][channels - 1]] = '';
    }
    if (stpq) {
      defs.POSITION_STPQ = '';
    }
    if (hasStyle) {
      f.pipe('style.color', this.uniforms);
      join = true;
      if (color || map || material) {
        if (!linear || color) {
          f.pipe('mesh.gamma.in');
        }
        gamma = true;
      }
    }
    if (color) {
      f.isolate();
      f.pipe('mesh.fragment.color', this.uniforms);
      if (!linear || join) {
        f.pipe('mesh.gamma.in');
      }
      f.end();
      if (join) {
        f.pipe(Util.GLSL.binaryOperator('vec4', '*'));
      }
      if (linear && join) {
        f.pipe('mesh.gamma.out');
      }
      join = true;
      gamma = true;
    }
    if (map) {
      if (!join && combine) {
        f.pipe(Util.GLSL.constant('vec4', 'vec4(1.0)'));
      }
      f.isolate();
      f.require(map);
      f.pipe('mesh.fragment.map', this.uniforms, defs);
      if (!linear) {
        f.pipe('mesh.gamma.in');
      }
      f.end();
      if (combine) {
        f.pipe(combine);
      } else {
        if (join) {
          f.pipe(Util.GLSL.binaryOperator('vec4', '*'));
        }
      }
      join = true;
      gamma = true;
    }
    if (material) {
      if (!join) {
        f.pipe(Util.GLSL.constant('vec4', 'vec4(1.0)'));
      }
      if (material === true) {
        f.pipe('mesh.fragment.shaded', this.uniforms);
      } else {
        f.require(material);
        f.pipe('mesh.fragment.map', this.uniforms, defs);
      }
      join = true;
      gamma = true;
    }
    if (gamma && !linear) {
      f.pipe('mesh.gamma.out');
    }
    if (mask) {
      f.pipe('mesh.fragment.mask', this.uniforms);
      if (join) {
        f.pipe(Util.GLSL.binaryOperator('vec4', '*'));
      }
    }
    return f;
  };

  return Base;

})(Renderable);

module.exports = Base;


},{"../../util":172,"../renderable":158}],149:[function(require,module,exports){
var Base, Debug,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

Debug = (function(_super) {
  __extends(Debug, _super);

  function Debug(renderer, shaders, options) {
    var object;
    Debug.__super__.constructor.call(this, renderer, shaders, options);
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({
      map: options.map
    });
    this.material.side = THREE.DoubleSide;
    object = new THREE.Mesh(this.geometry, this.material);
    object.position.x += options.x || 0;
    object.position.y += options.y || 0;
    object.frustumCulled = false;
    object.scale.set(2, 2, 2);
    object.__debug = true;
    this.objects = [object];
  }

  Debug.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.objects = this.geometry = this.material = null;
    return Debug.__super__.dispose.apply(this, arguments);
  };

  return Debug;

})(Base);

module.exports = Debug;


},{"./base":148}],150:[function(require,module,exports){
var Base, Face, FaceGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

FaceGeometry = require('../geometry').FaceGeometry;

Face = (function(_super) {
  __extends(Face, _super);

  function Face(renderer, shaders, options) {
    var color, combine, f, factory, hasStyle, linear, map, mask, material, object, position, stpq, uniforms, v;
    Face.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, mask = options.mask, map = options.map, combine = options.combine, stpq = options.stpq, linear = options.linear;
    if (uniforms == null) {
      uniforms = {};
    }
    if (material == null) {
      material = true;
    }
    hasStyle = uniforms.styleColor != null;
    this.geometry = new FaceGeometry({
      items: options.items,
      width: options.width,
      height: options.height,
      depth: options.depth
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    if (!material) {
      v.pipe('face.position', this.uniforms);
    }
    if (material) {
      v.pipe('face.position.normal', this.uniforms);
    }
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear);
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({
      side: THREE.DoubleSide
    }));
    object = new THREE.Mesh(this.geometry, this.material);
    this._raw(object);
    this.renders = [object];
  }

  Face.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Face.__super__.dispose.apply(this, arguments);
  };

  return Face;

})(Base);

module.exports = Face;


},{"../geometry":140,"./base":148}],151:[function(require,module,exports){
var Base, Line, LineGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

LineGeometry = require('../geometry').LineGeometry;

Line = (function(_super) {
  __extends(Line, _super);

  function Line(renderer, shaders, options) {
    var clip, color, combine, defs, f, factory, hasStyle, linear, map, mask, material, object, position, proximity, stpq, stroke, uniforms, v;
    Line.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, mask = options.mask, map = options.map, combine = options.combine, stpq = options.stpq, linear = options.linear, clip = options.clip, stroke = options.stroke, proximity = options.proximity;
    if (uniforms == null) {
      uniforms = {};
    }
    stroke = [null, 'dotted', 'dashed'][stroke];
    hasStyle = uniforms.styleColor != null;
    this.geometry = new LineGeometry({
      samples: options.samples,
      strips: options.strips,
      ribbons: options.ribbons,
      layers: options.layers,
      anchor: options.anchor,
      closed: options.closed
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    defs = {};
    if (stroke) {
      defs.LINE_STROKE = '';
    }
    if (clip) {
      defs.LINE_CLIP = '';
    }
    if (proximity != null) {
      defs.LINE_PROXIMITY = '';
    }
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    v.pipe('line.position', this.uniforms, defs);
    v.pipe('project.position', this.uniforms);
    f = factory.fragment;
    if (stroke) {
      f.pipe("fragment.clip." + stroke, this.uniforms);
    }
    if (clip) {
      f.pipe('fragment.clip.ends', this.uniforms);
    }
    if (proximity != null) {
      f.pipe('fragment.clip.proximity', this.uniforms);
    }
    f.pipe(this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear));
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({
      side: THREE.DoubleSide
    }));
    object = new THREE.Mesh(this.geometry, this.material);
    this._raw(object);
    this.renders = [object];
  }

  Line.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Line.__super__.dispose.apply(this, arguments);
  };

  return Line;

})(Base);

module.exports = Line;


},{"../geometry":140,"./base":148}],152:[function(require,module,exports){
var MemoScreen, Screen, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Screen = require('./screen');

Util = require('../../util');

MemoScreen = (function(_super) {
  __extends(MemoScreen, _super);

  function MemoScreen(renderer, shaders, options) {
    var depth, height, inv, inv1, items, map, object, stpq, width, _i, _len, _ref;
    this.memo = (items = options.items, width = options.width, height = options.height, depth = options.depth, stpq = options.stpq, options);
    inv = function(x) {
      return 1 / Math.max(1, x);
    };
    inv1 = function(x) {
      return 1 / Math.max(1, x - 1);
    };
    this.uniforms = {
      remapUVScale: {
        type: 'v2',
        value: new THREE.Vector2(items * width, height * depth)
      },
      remapModulus: {
        type: 'v2',
        value: new THREE.Vector2(items, height)
      },
      remapModulusInv: {
        type: 'v2',
        value: new THREE.Vector2(inv(items), inv(height))
      },
      remapSTPQScale: {
        type: 'v4',
        value: new THREE.Vector4(inv1(width), inv1(height), inv1(depth), inv1(items))
      }
    };
    map = shaders.shader();
    map.pipe('screen.map.xyzw', this.uniforms);
    if (options.map != null) {
      if (stpq) {
        map.pipe('screen.map.stpq', this.uniforms);
      }
      map.pipe(options.map);
    }
    MemoScreen.__super__.constructor.call(this, renderer, shaders, {
      map: map,
      linear: true
    });
    _ref = this.renders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      object.transparent = false;
    }
    null;
  }

  MemoScreen.prototype.cover = function(width, height, depth, items) {
    var inv1, x, y;
    if (width == null) {
      width = this.memo.width;
    }
    if (height == null) {
      height = this.memo.height;
    }
    if (depth == null) {
      depth = this.memo.depth;
    }
    if (items == null) {
      items = this.memo.items;
    }
    inv1 = function(x) {
      return 1 / Math.max(1, x - 1);
    };
    this.uniforms.remapSTPQScale.value.set(inv1(width), inv1(height), inv1(depth), inv1(items));
    x = width / this.memo.width;
    y = depth / this.memo.depth;
    if (this.memo.depth === 1) {
      y = height / this.memo.height;
    }
    return this.geometry.cover(x, y);
  };

  return MemoScreen;

})(Screen);

module.exports = MemoScreen;


},{"../../util":172,"./screen":154}],153:[function(require,module,exports){
var Base, Point, SpriteGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

SpriteGeometry = require('../geometry').SpriteGeometry;

Point = (function(_super) {
  __extends(Point, _super);

  function Point(renderer, shaders, options) {
    var alpha, color, combine, defines, edgeFactory, f, factory, fill, fillFactory, hasStyle, linear, map, mask, material, optical, pass, passes, position, scales, shape, shapes, size, stpq, uniforms, v, _ref, _ref1, _ref2, _scale, _shape;
    Point.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, size = options.size, mask = options.mask, map = options.map, combine = options.combine, linear = options.linear, shape = options.shape, optical = options.optical, fill = options.fill, stpq = options.stpq;
    if (uniforms == null) {
      uniforms = {};
    }
    shape = +shape != null ? +shape : 0;
    if (fill == null) {
      fill = true;
    }
    hasStyle = uniforms.styleColor != null;
    shapes = ['circle', 'square', 'diamond', 'up', 'down', 'left', 'right'];
    passes = ['circle', 'generic', 'generic', 'generic', 'generic', 'generic', 'generic'];
    scales = [1.2, 1, 1.414, 1.16, 1.16, 1.16, 1.16];
    pass = (_ref = passes[shape]) != null ? _ref : passes[0];
    _shape = (_ref1 = shapes[shape]) != null ? _ref1 : shapes[0];
    _scale = (_ref2 = optical && scales[shape]) != null ? _ref2 : 1;
    alpha = fill ? pass : "" + pass + ".hollow";
    this.geometry = new SpriteGeometry({
      items: options.items,
      width: options.width,
      height: options.height,
      depth: options.depth
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    defines = {
      POINT_SHAPE_SCALE: +(_scale + .00001)
    };
    factory = shaders.material();
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    if (size) {
      v.isolate();
      v.require(size);
      v.require('point.size.varying', this.uniforms);
      v.end();
    } else {
      v.require('point.size.uniform', this.uniforms);
    }
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    v.pipe('point.position', this.uniforms, defines);
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear);
    edgeFactory = shaders.material();
    edgeFactory.vertex.pipe(v);
    f = edgeFactory.fragment.pipe(factory.fragment);
    f.require("point.mask." + _shape, this.uniforms);
    f.require("point.alpha." + alpha, this.uniforms);
    f.pipe('point.edge', this.uniforms);
    fillFactory = shaders.material();
    fillFactory.vertex.pipe(v);
    f = fillFactory.fragment.pipe(factory.fragment);
    f.require("point.mask." + _shape, this.uniforms);
    f.require("point.alpha." + alpha, this.uniforms);
    f.pipe('point.fill', this.uniforms);
    this.fillMaterial = this._material(fillFactory.link({
      side: THREE.DoubleSide
    }));
    this.edgeMaterial = this._material(edgeFactory.link({
      side: THREE.DoubleSide
    }));
    this.fillObject = new THREE.Mesh(this.geometry, this.fillMaterial);
    this.edgeObject = new THREE.Mesh(this.geometry, this.edgeMaterial);
    this._raw(this.fillObject);
    this._raw(this.edgeObject);
    this.renders = [this.fillObject, this.edgeObject];
  }

  Point.prototype.show = function(transparent, blending, order, depth) {
    this._show(this.edgeObject, true, blending, order, depth);
    return this._show(this.fillObject, transparent, blending, order, depth);
  };

  Point.prototype.dispose = function() {
    this.geometry.dispose();
    this.edgeMaterial.dispose();
    this.fillMaterial.dispose();
    this.renders = this.edgeObject = this.fillObject = this.geometry = this.edgeMaterial = this.fillMaterial = null;
    return Point.__super__.dispose.apply(this, arguments);
  };

  return Point;

})(Base);

module.exports = Point;


},{"../geometry":140,"./base":148}],154:[function(require,module,exports){
var Base, Screen, ScreenGeometry, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

ScreenGeometry = require('../geometry').ScreenGeometry;

Util = require('../../util');

Screen = (function(_super) {
  __extends(Screen, _super);

  function Screen(renderer, shaders, options) {
    var combine, f, factory, hasStyle, linear, map, object, stpq, uniforms, v;
    Screen.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, map = options.map, combine = options.combine, stpq = options.stpq, linear = options.linear;
    if (uniforms == null) {
      uniforms = {};
    }
    hasStyle = uniforms.styleColor != null;
    this.geometry = new ScreenGeometry({
      width: options.width,
      height: options.height
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    v.pipe('raw.position.scale', this.uniforms);
    v.fan();
    v.pipe('stpq.xyzw.2d', this.uniforms);
    v.next();
    v.pipe('screen.position', this.uniforms);
    v.join();
    factory.fragment = f = this._fragmentColor(hasStyle, false, null, null, map, 2, stpq, combine, linear);
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({
      side: THREE.DoubleSide
    }));
    object = new THREE.Mesh(this.geometry, this.material);
    object.frustumCulled = false;
    this._raw(object);
    this.renders = [object];
  }

  Screen.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Screen.__super__.dispose.apply(this, arguments);
  };

  return Screen;

})(Base);

module.exports = Screen;


},{"../../util":172,"../geometry":140,"./base":148}],155:[function(require,module,exports){
var Base, Sprite, SpriteGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

SpriteGeometry = require('../geometry').SpriteGeometry;

Sprite = (function(_super) {
  __extends(Sprite, _super);

  function Sprite(renderer, shaders, options) {
    var color, combine, edgeFactory, f, factory, fillFactory, hasStyle, linear, map, mask, material, position, sprite, stpq, uniforms, v;
    Sprite.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, sprite = options.sprite, map = options.map, combine = options.combine, linear = options.linear, color = options.color, mask = options.mask, stpq = options.stpq;
    if (uniforms == null) {
      uniforms = {};
    }
    hasStyle = uniforms.styleColor != null;
    this.geometry = new SpriteGeometry({
      items: options.items,
      width: options.width,
      height: options.height,
      depth: options.depth
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    v.require(sprite);
    v.pipe('sprite.position', this.uniforms);
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear);
    edgeFactory = shaders.material();
    edgeFactory.vertex.pipe(v);
    edgeFactory.fragment.pipe(f);
    edgeFactory.fragment.pipe('fragment.transparent', this.uniforms);
    fillFactory = shaders.material();
    fillFactory.vertex.pipe(v);
    fillFactory.fragment.pipe(f);
    fillFactory.fragment.pipe('fragment.solid', this.uniforms);
    this.fillMaterial = this._material(fillFactory.link({
      side: THREE.DoubleSide
    }));
    this.edgeMaterial = this._material(edgeFactory.link({
      side: THREE.DoubleSide
    }));
    this.fillObject = new THREE.Mesh(this.geometry, this.fillMaterial);
    this.edgeObject = new THREE.Mesh(this.geometry, this.edgeMaterial);
    this._raw(this.fillObject);
    this._raw(this.edgeObject);
    this.renders = [this.fillObject, this.edgeObject];
  }

  Sprite.prototype.show = function(transparent, blending, order, depth) {
    this._show(this.edgeObject, true, blending, order, depth);
    return this._show(this.fillObject, transparent, blending, order, depth);
  };

  Sprite.prototype.dispose = function() {
    this.geometry.dispose();
    this.edgeMaterial.dispose();
    this.fillMaterial.dispose();
    this.nreders = this.geometry = this.edgeMaterial = this.fillMaterial = this.edgeObject = this.fillObject = null;
    return Sprite.__super__.dispose.apply(this, arguments);
  };

  return Sprite;

})(Base);

module.exports = Sprite;


},{"../geometry":140,"./base":148}],156:[function(require,module,exports){
var Base, Strip, StripGeometry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

StripGeometry = require('../geometry').StripGeometry;

Strip = (function(_super) {
  __extends(Strip, _super);

  function Strip(renderer, shaders, options) {
    var color, combine, f, factory, hasStyle, linear, map, mask, material, object, position, stpq, uniforms, v;
    Strip.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, mask = options.mask, map = options.map, combine = options.combine, linear = options.linear, stpq = options.stpq;
    if (uniforms == null) {
      uniforms = {};
    }
    if (material == null) {
      material = true;
    }
    hasStyle = uniforms.styleColor != null;
    this.geometry = new StripGeometry({
      items: options.items,
      width: options.width,
      height: options.height,
      depth: options.depth
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    if (!material) {
      v.pipe('mesh.position', this.uniforms);
    }
    if (material) {
      v.pipe('strip.position.normal', this.uniforms);
    }
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear);
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({
      side: THREE.DoubleSide
    }));
    object = new THREE.Mesh(this.geometry, this.material);
    this._raw(object);
    this.renders = [object];
  }

  Strip.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Strip.__super__.dispose.apply(this, arguments);
  };

  return Strip;

})(Base);

module.exports = Strip;


},{"../geometry":140,"./base":148}],157:[function(require,module,exports){
var Base, Surface, SurfaceGeometry, Util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

SurfaceGeometry = require('../geometry').SurfaceGeometry;

Util = require('../../util');

Surface = (function(_super) {
  __extends(Surface, _super);

  function Surface(renderer, shaders, options) {
    var color, combine, defs, f, factory, hasHollow, hasStyle, intUV, linear, map, mask, material, object, position, stpq, uniforms, v;
    Surface.__super__.constructor.call(this, renderer, shaders, options);
    uniforms = options.uniforms, material = options.material, position = options.position, color = options.color, mask = options.mask, map = options.map, combine = options.combine, linear = options.linear, stpq = options.stpq, intUV = options.intUV;
    if (uniforms == null) {
      uniforms = {};
    }
    if (material == null) {
      material = true;
    }
    hasStyle = uniforms.styleColor != null;
    hasHollow = uniforms.surfaceHollow != null;
    this.geometry = new SurfaceGeometry({
      width: options.width,
      height: options.height,
      surfaces: options.surfaces,
      layers: options.layers,
      closedX: options.closedX,
      closedY: options.closedY
    });
    this._adopt(uniforms);
    this._adopt(this.geometry.uniforms);
    factory = shaders.material();
    v = factory.vertex;
    if (intUV) {
      defs = {
        POSITION_UV_INT: ''
      };
    }
    v.pipe(this._vertexColor(color, mask));
    v.require(this._vertexPosition(position, material, map, 2, stpq));
    if (!material) {
      v.pipe('surface.position', this.uniforms, defs);
    }
    if (material) {
      v.pipe('surface.position.normal', this.uniforms, defs);
    }
    v.pipe('project.position', this.uniforms);
    factory.fragment = f = this._fragmentColor(hasStyle, material, color, mask, map, 2, stpq, combine, linear);
    f.pipe('fragment.color', this.uniforms);
    this.material = this._material(factory.link({
      side: THREE.DoubleSide
    }));
    object = new THREE.Mesh(this.geometry, this.material);
    this._raw(object);
    this.renders = [object];
  }

  Surface.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose();
    this.renders = this.geometry = this.material = null;
    return Surface.__super__.dispose.apply(this, arguments);
  };

  return Surface;

})(Base);

module.exports = Surface;


},{"../../util":172,"../geometry":140,"./base":148}],158:[function(require,module,exports){
var Renderable;

Renderable = (function() {
  function Renderable(renderer, shaders) {
    this.renderer = renderer;
    this.shaders = shaders;
    this.gl = this.renderer.context;
    if (this.uniforms == null) {
      this.uniforms = {};
    }
  }

  Renderable.prototype.dispose = function() {
    return this.uniforms = null;
  };

  Renderable.prototype._adopt = function(uniforms) {
    var key, value;
    for (key in uniforms) {
      value = uniforms[key];
      this.uniforms[key] = value;
    }
  };

  Renderable.prototype._set = function(uniforms) {
    var key, value;
    for (key in uniforms) {
      value = uniforms[key];
      if (this.uniforms[key] != null) {
        this.uniforms[key].value = value;
      }
    }
  };

  return Renderable;

})();

module.exports = Renderable;


},{}],159:[function(require,module,exports){
var MathBox, Renderable, Scene,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Renderable = require('./renderable');


/*
 All MathBox renderables sit inside this root, to keep things tidy.
 */

MathBox = (function(_super) {
  __extends(MathBox, _super);

  function MathBox() {
    MathBox.__super__.constructor.apply(this, arguments);
    this.rotationAutoUpdate = false;
    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
  }

  return MathBox;

})(THREE.Object3D);


/*
 Holds the root and binds to a THREE.Scene

 Will hold objects and inject them a few at a time
 to avoid long UI blocks.

 Will render injected objects to a 1x1 scratch buffer to ensure availability
 */

Scene = (function(_super) {
  __extends(Scene, _super);

  function Scene(renderer, shaders, options) {
    Scene.__super__.constructor.call(this, renderer, shaders, options);
    this.root = new MathBox;
    if ((options != null ? options.scene : void 0) != null) {
      this.scene = options.scene;
    }
    if (this.scene == null) {
      this.scene = new THREE.Scene;
    }
    this.pending = [];
    this.async = 0;
    this.scratch = new THREE.WebGLRenderTarget(1, 1);
    this.camera = new THREE.PerspectiveCamera;
  }

  Scene.prototype.inject = function(scene) {
    if (scene != null) {
      this.scene = scene;
    }
    return this.scene.add(this.root);
  };

  Scene.prototype.unject = function() {
    var _ref;
    return (_ref = this.scene) != null ? _ref.remove(this.root) : void 0;
  };

  Scene.prototype.add = function(object) {
    if (this.async) {
      return this.pending.push(object);
    } else {
      return this._add(object);
    }
  };

  Scene.prototype.remove = function(object) {
    this.pending = this.pending.filter(function(o) {
      return o !== object;
    });
    if (object.parent != null) {
      return this._remove(object);
    }
  };

  Scene.prototype._add = function(object) {
    return this.root.add(object);
  };

  Scene.prototype._remove = function(object) {
    return this.root.remove(object);
  };

  Scene.prototype.dispose = function() {
    if (this.root.parent != null) {
      return this.unject();
    }
  };

  Scene.prototype.warmup = function(n) {
    return this.async = +n || 0;
  };

  Scene.prototype.render = function() {
    var added, children, i, pending, visible, _i, _ref;
    if (!this.pending.length) {
      return;
    }
    children = this.root.children;
    added = [];
    for (i = _i = 0, _ref = this.async; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      pending = this.pending.shift();
      if (!pending) {
        break;
      }
      this._add(pending);
      added.push(added);
    }
    visible = children.map(function(o) {
      var v;
      return v = o.visible;
    });
    children.map(function(o) {
      return o.visible = __indexOf.call(added, o) < 0;
    });
    this.renderer.render(this.scene, this.camera, this.scratch);
    return children.map(function(o, i) {
      return o.visible = visible[i];
    });
  };

  Scene.prototype.toJSON = function() {
    return this.root.toJSON();
  };

  return Scene;

})(Renderable);

module.exports = Scene;


},{"./renderable":158}],160:[function(require,module,exports){
var Factory, ShaderGraph;

ShaderGraph = require('../../vendor/shadergraph/src');

Factory = function(snippets) {
  var fetch;
  fetch = function(name) {
    var element, ref, s, sel, _ref;
    s = snippets[name];
    if (s != null) {
      return s;
    }
    ref = (_ref = name[0]) === '#' || _ref === '.' || _ref === ':' || _ref === '[';
    sel = ref ? name : "#" + name;
    element = document.querySelector(sel);
    if ((element != null) && element.tagName === 'SCRIPT') {
      return element.textContent || element.innerText;
    }
    throw new Error("Unknown shader `" + name + "`");
  };
  return new ShaderGraph(fetch, {
    autoInspect: true
  });
};

module.exports = Factory;


},{"../../vendor/shadergraph/src":205}],161:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Snippets = require('../../build/shaders');


},{"../../build/shaders":1,"./factory":160}],162:[function(require,module,exports){
THREE.Bootstrap.registerPlugin('splash', {
  defaults: {
    color: 'mono',
    fancy: true
  },
  listen: ['ready', 'mathbox/init:init', 'mathbox/progress:progress', 'mathbox/destroy:destroy'],
  uninstall: function() {
    return this.destroy();
  },
  ready: function(event, three) {
    if (three.MathBox && !this.div) {
      return init(event, three);
    }
  },
  init: function(event, three) {
    var color, div, html, l, x, y, z;
    this.destroy();
    color = this.options.color;
    html = "<div class=\"mathbox-loader mathbox-splash-" + color + "\">\n  <div class=\"mathbox-logo\">\n    <div> <div></div><div></div><div></div> </div>\n    <div> <div></div><div></div><div></div> </div>\n  </div>\n  <div class=\"mathbox-progress\"><div></div></div>\n</div>";
    this.div = div = document.createElement('div');
    div.innerHTML = html;
    three.element.appendChild(div);
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    l = 1 / Math.sqrt(x * x + y * y + z * z);
    this.loader = div.querySelector('.mathbox-loader');
    this.bar = div.querySelector('.mathbox-progress > div');
    this.gyro = div.querySelectorAll('.mathbox-logo > div');
    this.transforms = ["rotateZ(22deg) rotateX(24deg) rotateY(30deg)", "rotateZ(11deg) rotateX(12deg) rotateY(15deg) scale3d(.6, .6, .6)"];
    this.random = [x * l, y * l, z * l];
    this.start = three.Time.now;
    return this.timer = null;
  },
  progress: function(event, three) {
    var current, el, f, i, increment, t, total, visible, weights, width, _i, _len, _ref, _results;
    if (!this.div) {
      return;
    }
    current = event.current, total = event.total;
    visible = current < total;
    clearTimeout(this.timer);
    if (visible) {
      this.loader.classList.remove('mathbox-exit');
      this.loader.style.display = 'block';
    } else {
      this.loader.classList.add('mathbox-exit');
      this.timer = setTimeout(((function(_this) {
        return function() {
          return _this.loader.style.display = 'none';
        };
      })(this)), 150);
    }
    width = current < total ? (Math.round(1000 * current / total) * .1) + '%' : '100%';
    this.bar.style.width = width;
    if (this.options.fancy) {
      weights = this.random;
      f = Math.max(0, Math.min(1, three.Time.now - this.start));
      increment = function(transform, j) {
        if (j == null) {
          j = 0;
        }
        return transform.replace(/(-?[0-9.e]+)deg/g, function(_, n) {
          return (+n + weights[j++] * f * three.Time.step * 60) + 'deg';
        });
      };
      _ref = this.gyro;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        el = _ref[i];
        this.transforms[i] = t = increment(this.transforms[i]);
        _results.push(el.style.transform = el.style.WebkitTransform = t);
      }
      return _results;
    }
  },
  destroy: function() {
    var _ref;
    if ((_ref = this.div) != null) {
      _ref.remove();
    }
    return this.div = null;
  }
});


},{}],163:[function(require,module,exports){
var Animation, Animator, Ease;

Ease = require('../util').Ease;

Animator = (function() {
  function Animator(context) {
    this.context = context;
    this.anims = [];
  }

  Animator.prototype.make = function(type, options) {
    var anim;
    anim = new Animation(this, this.context.time, type, options);
    this.anims.push(anim);
    return anim;
  };

  Animator.prototype.unmake = function(anim) {
    var a;
    return this.anims = (function() {
      var _i, _len, _ref, _results;
      _ref = this.anims;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        if (a !== anim) {
          _results.push(a);
        }
      }
      return _results;
    }).call(this);
  };

  Animator.prototype.update = function() {
    var anim, time;
    time = this.context.time;
    return this.anims = (function() {
      var _i, _len, _ref, _results;
      _ref = this.anims;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anim = _ref[_i];
        if (anim.update(time) !== false) {
          _results.push(anim);
        }
      }
      return _results;
    }).call(this);
  };

  Animator.prototype.lerp = function(type, from, to, f, value) {
    var emitter, fromE, lerp, toE;
    if (value == null) {
      value = type.make();
    }
    if (type.lerp) {
      value = type.lerp(from, to, value, f);
    } else if (type.emitter) {
      fromE = from.emitterFrom;
      toE = to.emitterTo;
      if ((fromE != null) && (toE != null) && fromE === toE) {
        fromE.lerp(f);
        return fromE;
      } else {
        emitter = type.emitter(from, to);
        from.emitterFrom = emitter;
        to.emitterTo = emitter;
      }
    } else if (type.op) {
      lerp = function(a, b) {
        if (a === +a && b === +b) {
          return a + (b - a) * f;
        } else {
          if (f > .5) {
            return b;
          } else {
            return a;
          }
        }
      };
      value = type.op(from, to, value, lerp);
    } else {
      value = f > .5 ? to : from;
    }
    return value;
  };

  return Animator;

})();

Animation = (function() {
  function Animation(animator, time, type, options) {
    this.animator = animator;
    this.time = time;
    this.type = type;
    this.options = options;
    this.value = this.type.make();
    this.target = this.type.make();
    this.queue = [];
  }

  Animation.prototype.dispose = function() {
    return this.animator.unmake(this);
  };

  Animation.prototype.set = function() {
    var invalid, target, value;
    target = this.target;
    value = arguments.length > 1 ? [].slice.call(arguments) : arguments[0];
    invalid = false;
    value = this.type.validate(value, target, function() {
      return invalid = true;
    });
    if (!invalid) {
      target = value;
    }
    this.cancel();
    this.target = this.value;
    this.value = target;
    return this.notify();
  };

  Animation.prototype.getTime = function() {
    var clock, time;
    clock = this.options.clock;
    time = clock ? clock.getTime() : this.time;
    if (this.options.realtime) {
      return time.time;
    } else {
      return time.clock;
    }
  };

  Animation.prototype.cancel = function(from) {
    var cancelled, queue, stage, _base, _i, _len;
    if (from == null) {
      from = this.getTime();
    }
    queue = this.queue;
    cancelled = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = queue.length; _i < _len; _i++) {
        stage = queue[_i];
        if (stage.end >= from) {
          _results.push(stage);
        }
      }
      return _results;
    })();
    this.queue = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = queue.length; _i < _len; _i++) {
        stage = queue[_i];
        if (stage.end < from) {
          _results.push(stage);
        }
      }
      return _results;
    })();
    for (_i = 0, _len = cancelled.length; _i < _len; _i++) {
      stage = cancelled[_i];
      if (typeof stage.complete === "function") {
        stage.complete(false);
      }
    }
    if (typeof (_base = this.options).complete === "function") {
      _base.complete(false);
    }
  };

  Animation.prototype.notify = function() {
    var _base;
    return typeof (_base = this.options).step === "function" ? _base.step(this.value) : void 0;
  };

  Animation.prototype.immediate = function(value, options) {
    var complete, delay, duration, ease, end, invalid, start, step, target, time;
    duration = options.duration, delay = options.delay, ease = options.ease, step = options.step, complete = options.complete;
    time = this.getTime();
    start = time + delay;
    end = start + duration;
    invalid = false;
    target = this.type.make();
    value = this.type.validate(value, target, function() {
      invalid = true;
      return null;
    });
    if (value !== void 0) {
      target = value;
    }
    this.cancel(start);
    return this.queue.push({
      from: null,
      to: target,
      start: start,
      end: end,
      ease: ease,
      step: step,
      complete: complete
    });
  };

  Animation.prototype.update = function(time) {
    var active, clock, complete, ease, end, f, from, method, queue, stage, start, step, to, value, _base, _ref;
    this.time = time;
    if (this.queue.length === 0) {
      return true;
    }
    clock = this.getTime();
    value = this.value, queue = this.queue;
    active = false;
    while (!active) {
      _ref = stage = queue[0], from = _ref.from, to = _ref.to, start = _ref.start, end = _ref.end, step = _ref.step, complete = _ref.complete, ease = _ref.ease;
      if (from == null) {
        from = stage.from = this.type.clone(this.value);
      }
      f = Ease.clamp(((clock - start) / Math.max(0.00001, end - start)) || 0, 0, 1);
      if (f === 0) {
        return;
      }
      method = (function() {
        switch (ease) {
          case 'linear':
          case 0:
            return null;
          case 'cosine':
          case 1:
            return Ease.cosine;
          default:
            return Ease.cosine;
        }
      })();
      if (method != null) {
        f = method(f);
      }
      active = f < 1;
      value = active ? this.animator.lerp(this.type, from, to, f, value) : to;
      if (typeof step === "function") {
        step(value);
      }
      if (!active) {
        if (typeof complete === "function") {
          complete(true);
        }
        if (typeof (_base = this.options).complete === "function") {
          _base.complete(true);
        }
        queue.shift();
        if (queue.length === 0) {
          break;
        }
      }
    }
    this.value = value;
    return this.notify();
  };

  return Animation;

})();

module.exports = Animator;


},{"../util":172}],164:[function(require,module,exports){
var API, Util;

Util = require('../util');

API = (function() {
  API.prototype.v2 = function() {
    return this;
  };

  function API(_context, _up, _targets) {
    var i, root, t, type, _i, _j, _len, _len1, _ref, _ref1;
    this._context = _context;
    this._up = _up;
    this._targets = _targets;
    root = this._context.controller.getRoot();
    if (this._targets == null) {
      this._targets = [root];
    }
    this.isRoot = this._targets.length === 1 && this._targets[0] === root;
    this.isLeaf = this._targets.length === 1 && (this._targets[0].children == null);
    _ref = this._targets;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      t = _ref[i];
      this[i] = t;
    }
    this.length = this._targets.length;
    _ref1 = this._context.controller.getTypes();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      type = _ref1[_j];
      if (type !== 'root') {
        (function(_this) {
          return (function(type) {
            return _this[type] = function(options, binds) {
              return _this.add(type, options, binds);
            };
          });
        })(this)(type);
      }
    }
  }

  API.prototype.select = function(selector) {
    var targets;
    targets = this._context.model.select(selector, !this.isRoot ? this._targets : null);
    return this._push(targets);
  };

  API.prototype.eq = function(index) {
    if (this._targets.length > index) {
      return this._push([this._targets[index]]);
    }
    return this._push([]);
  };

  API.prototype.filter = function(callback) {
    var matcher;
    if (typeof callback === 'string') {
      matcher = this._context.model._matcher(callback);
      callback = function(x) {
        return matcher(x);
      };
    }
    return this._push(this._targets.filter(callback));
  };

  API.prototype.map = function(callback) {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(callback(this[i], i, this));
    }
    return _results;
  };

  API.prototype.each = function(callback) {
    var i, _i, _ref;
    for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      callback(this[i], i, this);
    }
    return this;
  };

  API.prototype.add = function(type, options, binds) {
    var controller, node, nodes, target, _i, _len, _ref;
    controller = this._context.controller;
    if (this.isLeaf) {
      return this._pop().add(type, options, binds);
    }
    nodes = [];
    _ref = this._targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      node = controller.make(type, options, binds);
      controller.add(node, target);
      nodes.push(node);
    }
    return this._push(nodes);
  };

  API.prototype.remove = function(selector) {
    var target, _i, _len, _ref;
    if (selector) {
      return this.select(selector).remove();
    }
    _ref = this._targets.slice().reverse();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      this._context.controller.remove(target);
    }
    return this._pop();
  };

  API.prototype.set = function(key, value) {
    var target, _i, _len, _ref;
    _ref = this._targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      this._context.controller.set(target, key, value);
    }
    return this;
  };

  API.prototype.getAll = function(key) {
    var target, _i, _len, _ref, _results;
    _ref = this._targets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      _results.push(this._context.controller.get(target, key));
    }
    return _results;
  };

  API.prototype.get = function(key) {
    var _ref;
    return (_ref = this._targets[0]) != null ? _ref.get(key) : void 0;
  };

  API.prototype.evaluate = function(key, time) {
    var _ref;
    return (_ref = this._targets[0]) != null ? _ref.evaluate(key, time) : void 0;
  };

  API.prototype.bind = function(key, value) {
    var target, _i, _len, _ref;
    _ref = this._targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      this._context.controller.bind(target, key, value);
    }
    return this;
  };

  API.prototype.unbind = function(key) {
    var target, _i, _len, _ref;
    _ref = this._targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      this._context.controller.unbind(target, key);
    }
    return this;
  };

  API.prototype.end = function() {
    return (this.isLeaf ? this._pop() : this)._pop();
  };

  API.prototype._push = function(targets) {
    return new API(this._context, this, targets);
  };

  API.prototype._pop = function() {
    var _ref;
    return (_ref = this._up) != null ? _ref : this;
  };

  API.prototype._reset = function() {
    var _ref, _ref1;
    return (_ref = (_ref1 = this._up) != null ? _ref1.reset() : void 0) != null ? _ref : this;
  };

  API.prototype.map = function(callback) {
    return this._targets.map(callback);
  };

  API.prototype["on"] = function() {
    var args;
    args = arguments;
    this._targets.map(function(x) {
      return x.on.apply(x, args);
    });
    return this;
  };

  API.prototype["off"] = function() {
    var args;
    args = arguments;
    this._targets.map(function(x) {
      return x.on.apply(x, args);
    });
    return this;
  };

  API.prototype.toString = function() {
    var tags;
    tags = this._targets.map(function(x) {
      return x.toString();
    });
    if (this._targets.length > 1) {
      return "[" + (tags.join(", ")) + "]";
    } else {
      return tags[0];
    }
  };

  API.prototype.toMarkup = function() {
    var tags;
    tags = this._targets.map(function(x) {
      return x.toMarkup();
    });
    return tags.join("\n\n");
  };

  API.prototype.print = function() {
    Util.Pretty.print(this._targets.map(function(x) {
      return x.toMarkup();
    }).join("\n\n"));
    return this;
  };

  API.prototype.debug = function() {
    var getName, info, name, shader, shaders, _i, _len, _ref;
    info = this.inspect();
    console.log('Renderables: ', info.renderables);
    console.log('Renders: ', info.renders);
    console.log('Shaders: ', info.shaders);
    getName = function(owner) {
      return owner.constructor.toString().match('function +([^(]*)')[1];
    };
    shaders = [];
    _ref = info.shaders;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shader = _ref[_i];
      name = getName(shader.owner);
      shaders.push("" + name + " - Vertex");
      shaders.push(shader.vertex);
      shaders.push("" + name + " - Fragment");
      shaders.push(shader.fragment);
    }
    return ShaderGraph.inspect(shaders);
  };

  API.prototype.inspect = function(selector, print) {
    var flatten, info, k, make, map, recurse, renderables, self, target, trait, _i, _info, _len, _ref;
    if (typeof trait === 'boolean') {
      print = trait;
      trait = null;
    }
    if (print == null) {
      print = true;
    }
    map = function(node) {
      var _ref, _ref1;
      return (_ref = (_ref1 = node.controller) != null ? _ref1.objects : void 0) != null ? _ref : [];
    };
    recurse = self = function(node, list) {
      var child, _i, _len, _ref;
      if (list == null) {
        list = [];
      }
      if (!trait || node.traits.hash[trait]) {
        list.push(map(node));
      }
      if (node.children != null) {
        _ref = node.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          self(child, list);
        }
      }
      return list;
    };
    flatten = function(list) {
      list = list.reduce((function(a, b) {
        return a.concat(b);
      }), []);
      return list = list.filter(function(x, i) {
        return (x != null) && list.indexOf(x) === i;
      });
    };
    make = function(renderable, render) {
      var d;
      d = {};
      d.owner = renderable;
      d.geometry = render.geometry;
      d.material = render.material;
      d.vertex = render.material.vertexGraph;
      d.fragment = render.material.fragmentGraph;
      return d;
    };
    info = {
      nodes: this._targets.slice(),
      renderables: [],
      renders: [],
      shaders: []
    };
    _ref = this._targets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      target = _ref[_i];
      if (print) {
        target.print(selector, 'info');
      }
      _info = {
        renderables: renderables = flatten(recurse(target)),
        renders: flatten(renderables.map(function(x) {
          return x.renders;
        })),
        shaders: flatten(renderables.map(function(x) {
          var _ref1;
          return (_ref1 = x.renders) != null ? _ref1.map(function(r) {
            return make(x, r);
          }) : void 0;
        }))
      };
      for (k in _info) {
        info[k] = info[k].concat(_info[k]);
      }
    }
    return info;
  };

  return API;

})();

module.exports = API;


},{"../util":172}],165:[function(require,module,exports){
var Controller, Util;

Util = require('../util');

Controller = (function() {
  function Controller(model, primitives) {
    this.model = model;
    this.primitives = primitives;
  }

  Controller.prototype.getRoot = function() {
    return this.model.getRoot();
  };

  Controller.prototype.getTypes = function() {
    return this.primitives.getTypes();
  };

  Controller.prototype.make = function(type, options, binds) {
    return this.primitives.make(type, options, binds);
  };

  Controller.prototype.get = function(node, key) {
    return node.get(key);
  };

  Controller.prototype.set = function(node, key, value) {
    var e;
    try {
      return node.set(key, value);
    } catch (_error) {
      e = _error;
      node.print(null, 'warn');
      return console.error(e);
    }
  };

  Controller.prototype.bind = function(node, key, expr) {
    var e;
    try {
      return node.bind(key, expr);
    } catch (_error) {
      e = _error;
      node.print(null, 'warn');
      return console.error(e);
    }
  };

  Controller.prototype.unbind = function(node, key) {
    var e;
    try {
      return node.unbind(key);
    } catch (_error) {
      e = _error;
      node.print(null, 'warn');
      return console.error(e);
    }
  };

  Controller.prototype.add = function(node, target) {
    if (target == null) {
      target = this.model.getRoot();
    }
    return target.add(node);
  };

  Controller.prototype.remove = function(node) {
    var target;
    target = node.parent;
    if (target) {
      return target.remove(node);
    }
  };

  return Controller;

})();

module.exports = Controller;


},{"../util":172}],166:[function(require,module,exports){
exports.Animator = require('./animator');

exports.API = require('./api');

exports.Controller = require('./controller');


},{"./animator":163,"./api":164,"./controller":165}],167:[function(require,module,exports){
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

exports.setOrigin = function(vec, dimensions, origin) {
  var w, x, y, z;
  if (+dimensions === dimensions) {
    dimensions = [dimensions];
  }
  x = __indexOf.call(dimensions, 1) >= 0 ? 0 : origin.x;
  y = __indexOf.call(dimensions, 2) >= 0 ? 0 : origin.y;
  z = __indexOf.call(dimensions, 3) >= 0 ? 0 : origin.z;
  w = __indexOf.call(dimensions, 4) >= 0 ? 0 : origin.w;
  return vec.set(x, y, z, w);
};

exports.addOrigin = (function() {
  var v;
  v = new THREE.Vector4;
  return function(vec, dimension, origin) {
    exports.setOrigin(v, dimension, origin);
    return vec.add(v);
  };
})();

exports.setDimension = function(vec, dimension) {
  var w, x, y, z;
  x = dimension === 1 ? 1 : 0;
  y = dimension === 2 ? 1 : 0;
  z = dimension === 3 ? 1 : 0;
  w = dimension === 4 ? 1 : 0;
  return vec.set(x, y, z, w);
};

exports.setDimensionNormal = function(vec, dimension) {
  var w, x, y, z;
  x = dimension === 1 ? 1 : 0;
  y = dimension === 2 ? 1 : 0;
  z = dimension === 3 ? 1 : 0;
  w = dimension === 4 ? 1 : 0;
  return vec.set(y, z + x, w, 0);
};

exports.recenterAxis = (function() {
  var axis;
  axis = [0, 0];
  return function(x, dx, bend, f) {
    var abs, fabs, max, min, x1, x2;
    if (f == null) {
      f = 0;
    }
    if (bend > 0) {
      x1 = x;
      x2 = x + dx;
      abs = Math.max(Math.abs(x1), Math.abs(x2));
      fabs = abs * f;
      min = Math.min(x1, x2);
      max = Math.max(x1, x2);
      x = min + (-abs + fabs - min) * bend;
      dx = max + (abs + fabs - max) * bend - x;
    }
    axis[0] = x;
    axis[1] = dx;
    return axis;
  };
})();


},{}],168:[function(require,module,exports){
// Recycled from threestrap

module.exports = self = {
  bind: function (context, globals) {
    return function (key, object) {

      // Prepare object
      if (!object.__binds) {
        object.__binds = [];
      }

      // Set base target
      var fallback = context;
      if (_.isArray(key)) {
        fallback = key[0];
        key = key[1];
      }

      // Match key
      var match = /^([^.:]*(?:\.[^.:]+)*)?(?:\:(.*))?$/.exec(key);
      var path = match[1].split(/\./g);

      var name = path.pop();
      var dest = match[2] || name;

      // Whitelisted objects
      var selector = path.shift();
      var target = {
        'this': object,
      }[selector] || globals[selector] || context[selector] || fallback;

      // Look up keys
      while (target && (key = path.shift())) { target = target[key] };

      // Attach event handler at last level
      if (target && (target.on || target.addEventListener)) {
        var callback = function (event) {
          object[dest] && object[dest](event, context);
        };

        // Polyfill for both styles of event listener adders
        self._polyfill(target, [ 'addEventListener', 'on' ], function (method) {
          target[method](name, callback);
        });

        // Store bind for removal later
        var bind = { target: target, name: name, callback: callback };
        object.__binds.push(bind);

        // Return callback
        return callback;
      }
      else {
        throw "Cannot bind '" + key + "' in " + this.__name;
      }
    };
  },

  unbind: function () {
    return function (object) {
      // Remove all binds belonging to object
      if (object.__binds) {

        object.__binds.forEach(function (bind) {

          // Polyfill for both styles of event listener removers
          self._polyfill(bind.target, [ 'removeEventListener', 'off' ], function (method) {
            bind.target[method](bind.name, bind.callback);
          });
        }.bind(this));

        object.__binds = [];
      }
    }
  },

  apply: function ( object ) {

    THREE.EventDispatcher.prototype.apply(object);

    object.trigger     = self._trigger;
    object.triggerOnce = self._triggerOnce;

    object.on = object.addEventListener;
    object.off = object.removeEventListener;
    object.dispatchEvent = object.trigger;

  },

  ////

  _triggerOnce: function (event) {
    this.trigger(event);
    if (this._listeners) {
      delete this._listeners[event.type]
    }
  },

  _trigger: function (event) {

    if (this._listeners === undefined) return;

    var type = event.type;
    var listeners = this._listeners[type];
    if (listeners !== undefined) {

      listeners = listeners.slice()
      var length = listeners.length;

      event.target = this;
      for (var i = 0; i < length; i++) {
        // add original target as parameter for convenience
        listeners[i].call(this, event, this);
      }
    }
  },

  _polyfill: function (object, methods, callback) {
    methods.map(function (method) { return object.method });
    if (methods.length) callback(methods[0]);
  },

};

},{}],169:[function(require,module,exports){
var getSizes;

exports.getSizes = getSizes = function(data) {
  var array, sizes;
  sizes = [];
  array = data;
  while (typeof array !== 'string' && ((array != null ? array.length : void 0) != null)) {
    sizes.push(array.length);
    array = array[0];
  }
  return sizes;
};

exports.getDimensions = function(data, spec) {
  var channels, depth, dims, height, items, levels, n, nesting, sizes, width, _ref, _ref1, _ref2, _ref3, _ref4;
  if (spec == null) {
    spec = {};
  }
  items = spec.items, channels = spec.channels, width = spec.width, height = spec.height, depth = spec.depth;
  dims = {};
  if (!data || !data.length) {
    return {
      items: items,
      channels: channels,
      width: width != null ? width : 0,
      height: height != null ? height : 0,
      depth: depth != null ? depth : 0
    };
  }
  sizes = getSizes(data);
  nesting = sizes.length;
  dims.channels = channels !== 1 && sizes.length > 1 ? sizes.pop() : channels;
  dims.items = items !== 1 && sizes.length > 1 ? sizes.pop() : items;
  dims.width = width !== 1 && sizes.length > 1 ? sizes.pop() : width;
  dims.height = height !== 1 && sizes.length > 1 ? sizes.pop() : height;
  dims.depth = depth !== 1 && sizes.length > 1 ? sizes.pop() : depth;
  levels = nesting;
  if (channels === 1) {
    levels++;
  }
  if (items === 1 && levels > 1) {
    levels++;
  }
  if (width === 1 && levels > 2) {
    levels++;
  }
  if (height === 1 && levels > 3) {
    levels++;
  }
  n = (_ref = sizes.pop()) != null ? _ref : 1;
  if (levels <= 1) {
    n /= (_ref1 = dims.channels) != null ? _ref1 : 1;
  }
  if (levels <= 2) {
    n /= (_ref2 = dims.items) != null ? _ref2 : 1;
  }
  if (levels <= 3) {
    n /= (_ref3 = dims.width) != null ? _ref3 : 1;
  }
  if (levels <= 4) {
    n /= (_ref4 = dims.height) != null ? _ref4 : 1;
  }
  n = Math.floor(n);
  if (dims.width == null) {
    dims.width = n;
    n = 1;
  }
  if (dims.height == null) {
    dims.height = n;
    n = 1;
  }
  if (dims.depth == null) {
    dims.depth = n;
    n = 1;
  }
  return dims;
};

exports.repeatCall = function(call, times) {
  switch (times) {
    case 0:
      return function() {
        return true;
      };
    case 1:
      return function() {
        return call();
      };
    case 2:
      return function() {
        call();
        return call();
      };
    case 3:
      return function() {
        call();
        call();
        call();
        return call();
      };
    case 4:
      return function() {
        call();
        call();
        call();
        return call();
      };
    case 6:
      return function() {
        call();
        call();
        call();
        call();
        call();
        return call();
      };
    case 8:
      return function() {
        call();
        call();
        call();
        call();
        call();
        return call();
      };
  }
};

exports.makeEmitter = function(thunk, items, channels) {
  var inner, outer;
  inner = (function() {
    switch (channels) {
      case 0:
        return function() {
          return true;
        };
      case 1:
        return function(emit) {
          return emit(thunk());
        };
      case 2:
        return function(emit) {
          return emit(thunk(), thunk());
        };
      case 3:
        return function(emit) {
          return emit(thunk(), thunk(), thunk());
        };
      case 4:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk());
        };
      case 6:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk(), thunk(), thunk());
        };
      case 8:
        return function(emit) {
          return emit(thunk(), thunk(), thunk(), thunk(), thunk(), thunk(), thunk(), thunk());
        };
    }
  })();
  outer = (function() {
    switch (items) {
      case 0:
        return function() {
          return true;
        };
      case 1:
        return function(emit) {
          return inner(emit);
        };
      case 2:
        return function(emit) {
          inner(emit);
          return inner(emit);
        };
      case 3:
        return function(emit) {
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 4:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 6:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
      case 8:
        return function(emit) {
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          inner(emit);
          return inner(emit);
        };
    }
  })();
  outer.reset = thunk.reset;
  outer.rebind = thunk.rebind;
  return outer;
};

exports.getThunk = function(data) {
  var a, b, c, d, done, first, fourth, i, j, k, l, m, nesting, second, sizes, third, thunk, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
  sizes = getSizes(data);
  nesting = sizes.length;
  a = sizes.pop();
  b = sizes.pop();
  c = sizes.pop();
  d = sizes.pop();
  done = false;
  switch (nesting) {
    case 0:
      thunk = function() {
        return 0;
      };
      thunk.reset = function() {};
      break;
    case 1:
      i = 0;
      thunk = function() {
        return data[i++];
      };
      thunk.reset = function() {
        return i = 0;
      };
      break;
    case 2:
      i = j = 0;
      first = (_ref = data[j]) != null ? _ref : [];
      thunk = function() {
        var x, _ref1;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          first = (_ref1 = data[j]) != null ? _ref1 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref1;
        i = j = 0;
        first = (_ref1 = data[j]) != null ? _ref1 : [];
      };
      break;
    case 3:
      i = j = k = 0;
      second = (_ref1 = data[k]) != null ? _ref1 : [];
      first = (_ref2 = second[j]) != null ? _ref2 : [];
      thunk = function() {
        var x, _ref3, _ref4;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            second = (_ref3 = data[k]) != null ? _ref3 : [];
          }
          first = (_ref4 = second[j]) != null ? _ref4 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref3, _ref4;
        i = j = k = 0;
        second = (_ref3 = data[k]) != null ? _ref3 : [];
        first = (_ref4 = second[j]) != null ? _ref4 : [];
      };
      break;
    case 4:
      i = j = k = l = 0;
      third = (_ref3 = data[l]) != null ? _ref3 : [];
      second = (_ref4 = third[k]) != null ? _ref4 : [];
      first = (_ref5 = second[j]) != null ? _ref5 : [];
      thunk = function() {
        var x, _ref6, _ref7, _ref8;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            if (k === c) {
              k = 0;
              l++;
              third = (_ref6 = data[l]) != null ? _ref6 : [];
            }
            second = (_ref7 = third[k]) != null ? _ref7 : [];
          }
          first = (_ref8 = second[j]) != null ? _ref8 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref6, _ref7, _ref8;
        i = j = k = l = 0;
        third = (_ref6 = data[l]) != null ? _ref6 : [];
        second = (_ref7 = third[k]) != null ? _ref7 : [];
        first = (_ref8 = second[j]) != null ? _ref8 : [];
      };
      break;
    case 5:
      i = j = k = l = m = 0;
      fourth = (_ref6 = data[m]) != null ? _ref6 : [];
      third = (_ref7 = fourth[l]) != null ? _ref7 : [];
      second = (_ref8 = third[k]) != null ? _ref8 : [];
      first = (_ref9 = second[j]) != null ? _ref9 : [];
      thunk = function() {
        var x, _ref10, _ref11, _ref12, _ref13;
        x = first[i++];
        if (i === a) {
          i = 0;
          j++;
          if (j === b) {
            j = 0;
            k++;
            if (k === c) {
              k = 0;
              l++;
              if (l === d) {
                l = 0;
                m++;
                fourth = (_ref10 = data[m]) != null ? _ref10 : [];
              }
              third = (_ref11 = fourth[l]) != null ? _ref11 : [];
            }
            second = (_ref12 = third[k]) != null ? _ref12 : [];
          }
          first = (_ref13 = second[j]) != null ? _ref13 : [];
        }
        return x;
      };
      thunk.reset = function() {
        var _ref10, _ref11, _ref12, _ref13;
        i = j = k = l = m = 0;
        fourth = (_ref10 = data[m]) != null ? _ref10 : [];
        third = (_ref11 = fourth[l]) != null ? _ref11 : [];
        second = (_ref12 = third[k]) != null ? _ref12 : [];
        first = (_ref13 = second[j]) != null ? _ref13 : [];
      };
  }
  thunk.rebind = function(d) {
    data = d;
    sizes = getSizes(data);
    if (sizes.length) {
      a = sizes.pop();
    }
    if (sizes.length) {
      b = sizes.pop();
    }
    if (sizes.length) {
      c = sizes.pop();
    }
    if (sizes.length) {
      return d = sizes.pop();
    }
  };
  return thunk;
};

exports.getStreamer = function(array, samples, channels, items) {
  var consume, count, done, emit, i, j, limit, reset, skip;
  limit = i = j = 0;
  reset = function() {
    limit = samples * channels * items;
    return i = j = 0;
  };
  count = function() {
    return j;
  };
  done = function() {
    return limit - i <= 0;
  };
  skip = (function() {
    switch (channels) {
      case 1:
        return function(n) {
          i += n;
          j += n;
        };
      case 2:
        return function(n) {
          i += n * 2;
          j += n;
        };
      case 3:
        return function(n) {
          i += n * 3;
          j += n;
        };
      case 4:
        return function(n) {
          i += n * 4;
          j += n;
        };
    }
  })();
  consume = (function() {
    switch (channels) {
      case 1:
        return function(emit) {
          emit(array[i++]);
          ++j;
        };
      case 2:
        return function(emit) {
          emit(array[i++], array[i++]);
          ++j;
        };
      case 3:
        return function(emit) {
          emit(array[i++], array[i++], array[i++]);
          ++j;
        };
      case 4:
        return function(emit) {
          emit(array[i++], array[i++], array[i++], array[i++]);
          ++j;
        };
    }
  })();
  emit = (function() {
    switch (channels) {
      case 1:
        return function(x) {
          array[i++] = x;
          ++j;
        };
      case 2:
        return function(x, y) {
          array[i++] = x;
          array[i++] = y;
          ++j;
        };
      case 3:
        return function(x, y, z) {
          array[i++] = x;
          array[i++] = y;
          array[i++] = z;
          ++j;
        };
      case 4:
        return function(x, y, z, w) {
          array[i++] = x;
          array[i++] = y;
          array[i++] = z;
          array[i++] = w;
          ++j;
        };
    }
  })();
  consume.reset = reset;
  emit.reset = reset;
  reset();
  return {
    emit: emit,
    consume: consume,
    skip: skip,
    count: count,
    done: done,
    reset: reset
  };
};

exports.getLerpEmitter = function(expr1, expr2) {
  var args, emit1, emit2, emitter, lerp1, lerp2, p, q, r, s, scratch;
  scratch = new Float32Array(4096);
  lerp1 = lerp2 = 0.5;
  p = q = r = s = 0;
  emit1 = function(x, y, z, w) {
    r++;
    scratch[p++] = x * lerp1;
    scratch[p++] = y * lerp1;
    scratch[p++] = z * lerp1;
    return scratch[p++] = w * lerp1;
  };
  emit2 = function(x, y, z, w) {
    s++;
    scratch[q++] += x * lerp2;
    scratch[q++] += y * lerp2;
    scratch[q++] += z * lerp2;
    return scratch[q++] += w * lerp2;
  };
  args = Math.max(expr1.length, expr2.length);
  if (args <= 3) {
    emitter = function(emit, x, i) {
      var k, l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, i);
      expr2(emit2, x, i);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 5) {
    emitter = function(emit, x, y, i, j) {
      var k, l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, i, j);
      expr2(emit2, x, y, i, j);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 7) {
    emitter = function(emit, x, y, z, i, j, k) {
      var l, n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, z, i, j, k);
      expr2(emit2, x, y, z, i, j, k);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else if (args <= 9) {
    emitter = function(emit, x, y, z, w, i, j, k, l) {
      var n, _i, _results;
      p = q = r = s = 0;
      expr1(emit1, x, y, z, w, i, j, k, l);
      expr2(emit2, x, y, z, w, i, j, k, l);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  } else {
    emitter = function(emit, x, y, z, w, i, j, k, l, d, t) {
      var n, _i, _results;
      p = q = 0;
      expr1(emit1, x, y, z, w, i, j, k, l, d, t);
      expr2(emit2, x, y, z, w, i, j, k, l, d, t);
      n = Math.min(r, s);
      l = 0;
      _results = [];
      for (k = _i = 0; 0 <= n ? _i < n : _i > n; k = 0 <= n ? ++_i : --_i) {
        _results.push(emit(scratch[l++], scratch[l++], scratch[l++], scratch[l++]));
      }
      return _results;
    };
  }
  emitter.lerp = function(f) {
    var _ref;
    return _ref = [1 - f, f], lerp1 = _ref[0], lerp2 = _ref[1], _ref;
  };
  return emitter;
};


},{}],170:[function(require,module,exports){
var ease, π;

π = Math.PI;

ease = {
  clamp: function(x, a, b) {
    return Math.max(a, Math.min(b, x));
  },
  cosine: function(x) {
    return .5 - .5 * Math.cos(ease.clamp(x, 0, 1) * π);
  }
};

module.exports = ease;


},{}],171:[function(require,module,exports){
var index, letters, parseOrder, toFloatString, toType,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

letters = 'xyzw'.split('');

index = {
  0: -1,
  x: 0,
  y: 1,
  z: 2,
  w: 3
};

parseOrder = function(order) {
  if (order === "" + order) {
    order = order.split('');
  }
  if (order === +order) {
    order = [order];
  }
  return order;
};

toType = function(type) {
  if (type === +type) {
    type = 'vec' + type;
  }
  if (type === 'vec1') {
    type = 'float';
  }
  return type;
};

toFloatString = function(value) {
  value = "" + value;
  if (value.indexOf('.') < 0) {
    return value += '.0';
  }
};

exports.mapByte2FloatOffset = function(stretch) {
  var factor;
  if (stretch == null) {
    stretch = 4;
  }
  factor = toFloatString(stretch);
  return "vec4 float2ByteIndex(vec4 xyzw, out float channelIndex) {\n  float relative = xyzw.w / " + factor + ";\n  float w = floor(relative);\n  channelIndex = (relative - w) * " + factor + ";\n  return vec4(xyzw.xyz, w);\n}";
};

exports.sample2DArray = function(textures) {
  var body, divide;
  divide = function(a, b) {
    var mid, out;
    if (a === b) {
      out = "return texture2D(dataTextures[" + a + "], uv);";
    } else {
      mid = Math.ceil(a + (b - a) / 2);
      out = "if (z < " + (mid - .5) + ") {\n  " + (divide(a, mid - 1)) + "\n}\nelse {\n  " + (divide(mid, b)) + "\n}";
    }
    return out = out.replace(/\n/g, "\n  ");
  };
  body = divide(0, textures - 1);
  return "uniform sampler2D dataTextures[" + textures + "];\n\nvec4 sample2DArray(vec2 uv, float z) {\n  " + body + "\n}";
};

exports.binaryOperator = function(type, op, curry) {
  type = toType(type);
  if (curry != null) {
    return "" + type + " binaryOperator(" + type + " a) {\n  return a " + op + " " + curry + ";\n}";
  } else {
    return "" + type + " binaryOperator(" + type + " a, " + type + " b) {\n  return a " + op + " b;\n}";
  }
};

exports.extendVec = function(from, to, value) {
  var ctor, diff, parts, _i, _results;
  if (value == null) {
    value = 0;
  }
  if (from > to) {
    return exports.truncateVec(from, to);
  }
  diff = to - from;
  from = toType(from);
  to = toType(to);
  value = toFloatString(value);
  parts = (function() {
    _results = [];
    for (var _i = 0; 0 <= diff ? _i <= diff : _i >= diff; 0 <= diff ? _i++ : _i--){ _results.push(_i); }
    return _results;
  }).apply(this).map(function(x) {
    if (x) {
      return value;
    } else {
      return 'v';
    }
  });
  ctor = parts.join(',');
  return "" + to + " extendVec(" + from + " v) { return " + to + "(" + ctor + "); }";
};

exports.truncateVec = function(from, to) {
  var swizzle;
  if (from < to) {
    return exports.extendVec(from, to);
  }
  swizzle = '.' + ('xyzw'.substr(0, to));
  from = toType(from);
  to = toType(to);
  return "" + to + " truncateVec(" + from + " v) { return v" + swizzle + "; }";
};

exports.injectVec4 = function(order) {
  var args, channel, i, mask, swizzler, _i, _len;
  swizzler = ['0.0', '0.0', '0.0', '0.0'];
  order = parseOrder(order);
  order = order.map(function(v) {
    if (v === "" + v) {
      return index[v];
    } else {
      return v;
    }
  });
  for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
    channel = order[i];
    swizzler[channel] = ['a', 'b', 'c', 'd'][i];
  }
  mask = swizzler.slice(0, 4).join(', ');
  args = ['float a', 'float b', 'float c', 'float d'].slice(0, order.length);
  return "vec4 inject(" + args + ") {\n  return vec4(" + mask + ");\n}";
};

exports.swizzleVec4 = function(order, size) {
  var lookup, mask;
  if (size == null) {
    size = null;
  }
  lookup = ['0.0', 'xyzw.x', 'xyzw.y', 'xyzw.z', 'xyzw.w'];
  if (size == null) {
    size = order.length;
  }
  order = parseOrder(order);
  order = order.map(function(v) {
    if (__indexOf.call([0, 1, 2, 3, 4], +v) >= 0) {
      v = +v;
    }
    if (v === "" + v) {
      v = index[v] + 1;
    }
    return lookup[v];
  });
  while (order.length < size) {
    order.push('0.0');
  }
  mask = order.join(', ');
  return ("vec" + size + " swizzle(vec4 xyzw) {\n  return vec" + size + "(" + mask + ");\n}").replace(/vec1/g, 'float');
};

exports.invertSwizzleVec4 = function(order) {
  var i, j, letter, mask, src, swizzler, _i, _len;
  swizzler = ['0.0', '0.0', '0.0', '0.0'];
  order = parseOrder(order);
  order = order.map(function(v) {
    if (v === +v) {
      return letters[v - 1];
    } else {
      return v;
    }
  });
  for (i = _i = 0, _len = order.length; _i < _len; i = ++_i) {
    letter = order[i];
    src = letters[i];
    j = index[letter];
    swizzler[j] = "xyzw." + src;
  }
  mask = swizzler.join(', ');
  return "vec4 invertSwizzle(vec4 xyzw) {\n  return vec4(" + mask + ");\n}";
};

exports.identity = function(type) {
  var args;
  args = [].slice.call(arguments);
  if (args.length > 1) {
    args = args.map(function(t, i) {
      return ['inout', t, String.fromCharCode(97 + i)].join(' ');
    });
    args = args.join(', ');
    return "void identity(" + args + ") { }";
  } else {
    return "" + type + " identity(" + type + " x) {\n  return x;\n}";
  }
};

exports.constant = function(type, value) {
  return "" + type + " constant() {\n  return " + value + ";\n}";
};

exports.toType = toType;


},{}],172:[function(require,module,exports){
exports.Axis = require('./axis');

exports.Data = require('./data');

exports.Ease = require('./ease');

exports.GLSL = require('./glsl');

exports.JS = require('./js');

exports.Pretty = require('./pretty');

exports.Three = require('./three');

exports.Ticks = require('./ticks');

exports.VDOM = require('./vdom');


},{"./axis":167,"./data":169,"./ease":170,"./glsl":171,"./js":173,"./pretty":174,"./three":175,"./ticks":176,"./vdom":177}],173:[function(require,module,exports){
exports.merge = function() {
  var k, obj, v, x, _i, _len;
  x = {};
  for (_i = 0, _len = arguments.length; _i < _len; _i++) {
    obj = arguments[_i];
    for (k in obj) {
      v = obj[k];
      x[k] = v;
    }
  }
  return x;
};

exports.clone = function(o) {
  return JSON.parse(JSON.serialize(o));
};

exports.parseQuoted = function(str) {
  var accum, char, chunk, list, munch, quote, token, unescape, _i, _len;
  accum = "";
  unescape = function(str) {
    return str = str.replace(/\\/g, '');
  };
  munch = function(next) {
    if (accum.length) {
      list.push(unescape(accum));
    }
    return accum = next != null ? next : "";
  };
  str = str.split(/(?=(?:\\.|["' ,]))/g);
  quote = false;
  list = [];
  for (_i = 0, _len = str.length; _i < _len; _i++) {
    chunk = str[_i];
    char = chunk[0];
    token = chunk.slice(1);
    switch (char) {
      case '"':
      case "'":
        if (quote) {
          if (quote === char) {
            quote = false;
            munch(token);
          } else {
            accum += chunk;
          }
        } else {
          if (accum !== '') {
            throw new Error("ParseError: String `" + str + "` does not contain comma-separated quoted tokens.");
          }
          quote = char;
          accum += token;
        }
        break;
      case ' ':
      case ',':
        if (!quote) {
          munch(token);
        } else {
          accum += chunk;
        }
        break;
      default:
        accum += chunk;
    }
  }
  munch();
  return list;
};


},{}],174:[function(require,module,exports){
var NUMBER_PRECISION, NUMBER_THRESHOLD, checkFactor, checkUnit, escapeHTML, formatFactors, formatFraction, formatMultiple, formatPrimes, prettyFormat, prettyJSXBind, prettyJSXPair, prettyJSXProp, prettyMarkup, prettyNumber, prettyPrint;

NUMBER_PRECISION = 5;

NUMBER_THRESHOLD = 0.0001;

checkFactor = function(v, f) {
  return Math.abs(v / f - Math.round(v / f)) < NUMBER_THRESHOLD;
};

checkUnit = function(v) {
  return checkFactor(v, 1);
};

formatMultiple = function(v, f, k, compact) {
  var d;
  d = Math.round(v / f);
  if (d === 1) {
    return "" + k;
  }
  if (d === -1) {
    return "-" + k;
  }
  if (k === '1') {
    return "" + d;
  }
  if (compact) {
    return "" + d + k;
  } else {
    return "" + d + "*" + k;
  }
};

formatFraction = function(v, f, k, compact) {
  var d;
  d = Math.round(v * f);
  if (Math.abs(d) === 1) {
    d = d < 0 ? "-" : "";
    d += k;
  } else if (k !== '1') {
    d += compact ? "" + k : "*" + k;
  }
  return "" + d + "/" + f;
};

formatFactors = [
  {
    1: 1
  }, {
    1: 1,
    τ: Math.PI * 2
  }, {
    1: 1,
    π: Math.PI
  }, {
    1: 1,
    τ: Math.PI * 2,
    π: Math.PI
  }, {
    1: 1,
    e: Math.E
  }, {
    1: 1,
    τ: Math.PI * 2,
    e: Math.E
  }, {
    1: 1,
    π: Math.PI,
    e: Math.E
  }, {
    1: 1,
    τ: Math.PI * 2,
    π: Math.PI,
    e: Math.E
  }
];

formatPrimes = [[2 * 2 * 3 * 5 * 7, [2, 3, 5, 7]], [2 * 2 * 2 * 3 * 3 * 5 * 5 * 7 * 7, [2, 3, 5, 7]], [2 * 2 * 3 * 5 * 7 * 11 * 13, [2, 3, 5, 7, 11, 13]], [2 * 2 * 17 * 19 * 23 * 29, [2, 17, 19, 23, 29]], [256 * 256, [2]], [1000000, [2, 5]]];

prettyNumber = function(options) {
  var cache, cacheIndex, compact, e, formatIndex, numberCache, pi, precision, tau, threshold;
  if (options) {
    cache = options.cache, compact = options.compact, tau = options.tau, pi = options.pi, e = options.e, threshold = options.threshold, precision = options.precision;
  }
  compact = +(!!(compact != null ? compact : true));
  tau = +(!!(tau != null ? tau : true));
  pi = +(!!(pi != null ? pi : true));
  e = +(!!(e != null ? e : true));
  cache = +(!!(cache != null ? cache : true));
  threshold = +(threshold != null ? threshold : NUMBER_THRESHOLD);
  precision = +(precision != null ? precision : NUMBER_PRECISION);
  formatIndex = tau + pi * 2 + e * 4;
  cacheIndex = formatIndex + threshold + precision;
  numberCache = cache ? {} : null;
  return function(v) {
    var best, cached, d, denom, f, k, list, match, n, numer, out, p, _i, _j, _len, _len1, _ref, _ref1;
    if (numberCache != null) {
      if ((cached = numberCache[v]) != null) {
        return cached;
      }
      if (v === Math.round(v)) {
        return numberCache[v] = "" + v;
      }
    }
    out = "" + v;
    best = out.length + out.indexOf('.') + 2;
    match = function(x) {
      var d;
      d = x.length;
      if (d <= best) {
        out = "" + x;
        return best = d;
      }
    };
    _ref = formatFactors[formatIndex];
    for (k in _ref) {
      f = _ref[k];
      if (checkUnit(v / f)) {
        match("" + (formatMultiple(v / f, 1, k, compact)));
      } else {
        for (_i = 0, _len = formatPrimes.length; _i < _len; _i++) {
          _ref1 = formatPrimes[_i], denom = _ref1[0], list = _ref1[1];
          numer = v / f * denom;
          if (checkUnit(numer)) {
            for (_j = 0, _len1 = list.length; _j < _len1; _j++) {
              p = list[_j];
              while (checkUnit(n = numer / p) && checkUnit(d = denom / p)) {
                numer = n;
                denom = d;
              }
            }
            match("" + (formatFraction(v / f, denom, k, compact)));
            break;
          }
        }
      }
    }
    if (("" + v).length > NUMBER_PRECISION) {
      match("" + (v.toPrecision(NUMBER_PRECISION)));
    }
    if (numberCache != null) {
      numberCache[v] = out;
    }
    return out;
  };
};

prettyPrint = function(markup, level) {
  if (level == null) {
    level = 'info';
  }
  markup = prettyMarkup(markup);
  return console[level].apply(console, markup);
};

prettyMarkup = function(markup) {
  var args, attr, nested, obj, quoted, str, tag, txt;
  tag = 'color:rgb(128,0,128)';
  attr = 'color:rgb(144,64,0)';
  str = 'color:rgb(0,0,192)';
  obj = 'color:rgb(0,70,156)';
  txt = 'color:inherit';
  quoted = false;
  nested = 0;
  args = [];
  markup = markup.replace(/(\\[<={}> "'])|(=>|[<={}> "'])/g, function(_, escape, char) {
    var res;
    if (escape != null ? escape.length : void 0) {
      return escape;
    }
    if (quoted && (char !== '"' && char !== "'")) {
      return char;
    }
    if (nested && (char !== '"' && char !== "'" && char !== '{' && char !== "}")) {
      return char;
    }
    return res = (function() {
      switch (char) {
        case '<':
          args.push(tag);
          return "%c<";
        case '>':
          args.push(tag);
          args.push(txt);
          return "%c>%c";
        case ' ':
          args.push(attr);
          return " %c";
        case '=':
        case '=>':
          args.push(tag);
          return "%c" + char;
        case '"':
        case "'":
          quoted = !quoted;
          if (quoted) {
            args.push(nested ? attr : str);
            return "" + char + "%c";
          } else {
            args.push(nested ? obj : tag);
            return "%c" + char;
          }
          break;
        case '{':
          if (nested++ === 0) {
            args.push(obj);
            return "%c" + char;
          } else {
            return char;
          }
          break;
        case '}':
          if (--nested === 0) {
            args.push(tag);
            return "" + char + "%c";
          } else {
            return char;
          }
          break;
        default:
          return char;
      }
    })();
  });
  return [markup].concat(args);
};

prettyJSXProp = function(k, v) {
  return prettyJSXPair(k, v, '=');
};

prettyJSXBind = function(k, v) {
  return prettyJSXPair(k, v, '=>');
};

prettyJSXPair = (function() {
  var formatNumber;
  formatNumber = prettyNumber({
    compact: false
  });
  return function(k, v, op) {
    var key, value, wrap;
    key = function(k) {
      if ((k === "" + +k) || k.match(/^[A-Za-z_][A-Za-z0-9]*$/)) {
        return k;
      } else {
        return JSON.stringify(k);
      }
    };
    wrap = function(v) {
      if (v.match('\n*"')) {
        return v;
      } else {
        return "{" + v + "}";
      }
    };
    value = function(v) {
      var kk, vv;
      if (v instanceof Array) {
        return "[" + (v.map(value).join(', ')) + "]";
      }
      switch (typeof v) {
        case 'string':
          if (v.match("\n")) {
            return "\"\n" + v + "\"\n";
          } else {
            return "\"" + v + "\"";
          }
          break;
        case 'function':
          v = "" + v;
          if (v.match("\n")) {
            "\n" + v + "\n";
          } else {
            "" + v;
          }
          v = v.replace(/^function (\([^)]+\))/, "$1 =>");
          return v = v.replace(/^(\([^)]+\)) =>\s*{\s*return\s*([^}]+)\s*;\s*}/, "$1 => $2");
        case 'number':
          return formatNumber(v);
        default:
          if ((v != null) && v !== !!v) {
            if (v._up != null) {
              return value(v.map(function(v) {
                return v;
              }));
            }
            if (v.toMarkup) {
              return v.toString();
            } else {
              return "{" + ((function() {
                var _results;
                _results = [];
                for (kk in v) {
                  vv = v[kk];
                  if (v.hasOwnProperty(kk)) {
                    _results.push("" + (key(kk)) + ": " + (value(vv)));
                  }
                }
                return _results;
              })()).join(", ") + "}";
            }
          } else {
            return "" + (JSON.stringify(v));
          }
      }
    };
    return [k, op, wrap(value(v))].join('');
  };
})();

escapeHTML = function(str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  return str = str.replace(/"/g, '&quot;');
};

prettyFormat = function(str) {
  var arg, args, out, _i, _len;
  args = [].slice.call(arguments);
  args.shift();
  out = "<span>";
  str = escapeHTML(str);
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    arg = args[_i];
    str = str.replace(/%([a-z])/, function(_, f) {
      var v;
      v = args.shift();
      switch (f) {
        case 'c':
          return "</span><span style=\"" + (escapeHTML(v)) + "\">";
        default:
          return escapeHTML(v);
      }
    });
  }
  out += str;
  return out += "</span>";
};

module.exports = {
  markup: prettyMarkup,
  number: prettyNumber,
  print: prettyPrint,
  format: prettyFormat,
  JSX: {
    prop: prettyJSXProp,
    bind: prettyJSXBind
  }
};


/*
for x in [1, 2, 1/2, 3, 1/3, Math.PI, Math.PI / 2, Math.PI * 2, Math.PI * 3, Math.PI * 4, Math.PI * 3 / 4, Math.E * 100, Math.E / 100]
  console.log prettyNumber({})(x)
 */


},{}],175:[function(require,module,exports){
exports.paramToGL = function(gl, p) {
  if (p === THREE.RepeatWrapping) {
    return gl.REPEAT;
  }
  if (p === THREE.ClampToEdgeWrapping) {
    return gl.CLAMP_TO_EDGE;
  }
  if (p === THREE.MirroredRepeatWrapping) {
    return gl.MIRRORED_REPEAT;
  }
  if (p === THREE.NearestFilter) {
    return gl.NEAREST;
  }
  if (p === THREE.NearestMipMapNearestFilter) {
    return gl.NEAREST_MIPMAP_NEAREST;
  }
  if (p === THREE.NearestMipMapLinearFilter) {
    return gl.NEAREST_MIPMAP_LINEAR;
  }
  if (p === THREE.LinearFilter) {
    return gl.LINEAR;
  }
  if (p === THREE.LinearMipMapNearestFilter) {
    return gl.LINEAR_MIPMAP_NEAREST;
  }
  if (p === THREE.LinearMipMapLinearFilter) {
    return gl.LINEAR_MIPMAP_LINEAR;
  }
  if (p === THREE.UnsignedByteType) {
    return gl.UNSIGNED_BYTE;
  }
  if (p === THREE.UnsignedShort4444Type) {
    return gl.UNSIGNED_SHORT_4_4_4_4;
  }
  if (p === THREE.UnsignedShort5551Type) {
    return gl.UNSIGNED_SHORT_5_5_5_1;
  }
  if (p === THREE.UnsignedShort565Type) {
    return gl.UNSIGNED_SHORT_5_6_5;
  }
  if (p === THREE.ByteType) {
    return gl.BYTE;
  }
  if (p === THREE.ShortType) {
    return gl.SHORT;
  }
  if (p === THREE.UnsignedShortType) {
    return gl.UNSIGNED_SHORT;
  }
  if (p === THREE.IntType) {
    return gl.INT;
  }
  if (p === THREE.UnsignedIntType) {
    return gl.UNSIGNED_INT;
  }
  if (p === THREE.FloatType) {
    return gl.FLOAT;
  }
  if (p === THREE.AlphaFormat) {
    return gl.ALPHA;
  }
  if (p === THREE.RGBFormat) {
    return gl.RGB;
  }
  if (p === THREE.RGBAFormat) {
    return gl.RGBA;
  }
  if (p === THREE.LuminanceFormat) {
    return gl.LUMINANCE;
  }
  if (p === THREE.LuminanceAlphaFormat) {
    return gl.LUMINANCE_ALPHA;
  }
  if (p === THREE.AddEquation) {
    return gl.FUNC_ADD;
  }
  if (p === THREE.SubtractEquation) {
    return gl.FUNC_SUBTRACT;
  }
  if (p === THREE.ReverseSubtractEquation) {
    return gl.FUNC_REVERSE_SUBTRACT;
  }
  if (p === THREE.ZeroFactor) {
    return gl.ZERO;
  }
  if (p === THREE.OneFactor) {
    return gl.ONE;
  }
  if (p === THREE.SrcColorFactor) {
    return gl.SRC_COLOR;
  }
  if (p === THREE.OneMinusSrcColorFactor) {
    return gl.ONE_MINUS_SRC_COLOR;
  }
  if (p === THREE.SrcAlphaFactor) {
    return gl.SRC_ALPHA;
  }
  if (p === THREE.OneMinusSrcAlphaFactor) {
    return gl.ONE_MINUS_SRC_ALPHA;
  }
  if (p === THREE.DstAlphaFactor) {
    return gl.DST_ALPHA;
  }
  if (p === THREE.OneMinusDstAlphaFactor) {
    return gl.ONE_MINUS_DST_ALPHA;
  }
  if (p === THREE.DstColorFactor) {
    return gl.DST_COLOR;
  }
  if (p === THREE.OneMinusDstColorFactor) {
    return gl.ONE_MINUS_DST_COLOR;
  }
  if (p === THREE.SrcAlphaSaturateFactor) {
    return gl.SRC_ALPHA_SATURATE;
  }
  return 0;
};

exports.paramToArrayStorage = function(type) {
  switch (type) {
    case THREE.UnsignedByteType:
      return Uint8Array;
    case THREE.ByteType:
      return Int8Array;
    case THREE.ShortType:
      return Int16Array;
    case THREE.UnsignedShortType:
      return Uint16Array;
    case THREE.IntType:
      return Int32Array;
    case THREE.UnsignedIntType:
      return Uint32Array;
    case THREE.FloatType:
      return Float32Array;
  }
};

exports.swizzleToEulerOrder = function(swizzle) {
  return swizzle.map(function(i) {
    return ['', 'X', 'Y', 'Z'][i];
  }).join('');
};

exports.transformComposer = function() {
  var euler, pos, quat, scl, transform;
  euler = new THREE.Euler;
  quat = new THREE.Quaternion;
  pos = new THREE.Vector3;
  scl = new THREE.Vector3;
  transform = new THREE.Matrix4;
  return function(position, rotation, quaternion, scale, matrix, eulerOrder) {
    if (eulerOrder == null) {
      eulerOrder = 'XYZ';
    }
    if (rotation != null) {
      if (eulerOrder instanceof Array) {
        eulerOrder = exports.swizzleToEulerOrder(eulerOrder);
      }
      euler.setFromVector3(rotation, eulerOrder);
      quat.setFromEuler(euler);
    } else {
      quat.set(0, 0, 0, 1);
    }
    if (quaternion != null) {
      quat.multiply(quaternion);
    }
    if (position != null) {
      pos.copy(position);
    } else {
      pos.set(0, 0, 0);
    }
    if (scale != null) {
      scl.copy(scale);
    } else {
      scl.set(1, 1, 1);
    }
    transform.compose(pos, quat, scl);
    if (matrix != null) {
      transform.multiplyMatrices(transform, matrix);
    }
    return transform;
  };
};


},{}],176:[function(require,module,exports){

/*
 Generate equally spaced ticks in a range at sensible positions.
 
 @param min/max - Minimum and maximum of range
 @param n - Desired number of ticks in range
 @param unit - Base unit of scale (e.g. 1 or π).
 @param scale - Division scale (e.g. 2 = binary division, or 10 = decimal division).
 @param bias - Integer to bias divisions one or more levels up or down (to create nested scales)
 @param start - Whether to include a tick at the start
 @param end - Whether to include a tick at the end
 @param zero - Whether to include zero as a tick
 @param nice - Whether to round to a more reasonable interval
 */
var LINEAR, LOG, linear, log, make;

linear = function(min, max, n, unit, base, factor, start, end, zero, nice) {
  var distance, f, factors, i, ideal, ref, span, step, steps, ticks;
  if (nice == null) {
    nice = true;
  }
  n || (n = 10);
  unit || (unit = 1);
  base || (base = 10);
  factor || (factor = 1);
  span = max - min;
  ideal = span / n;
  if (!nice) {
    ticks = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
        _results.push(min + i * ideal);
      }
      return _results;
    })();
    if (!start) {
      ticks.shift();
    }
    if (!end) {
      ticks.pop();
    }
    if (!zero) {
      ticks = ticks.filter(function(x) {
        return x !== 0;
      });
    }
    return ticks;
  }
  unit || (unit = 1);
  base || (base = 10);
  ref = unit * (Math.pow(base, Math.floor(Math.log(ideal / unit) / Math.log(base))));
  factors = base % 2 === 0 ? [base / 2, 1, 1 / 2] : base % 3 === 0 ? [base / 3, 1, 1 / 3] : [1];
  steps = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = factors.length; _i < _len; _i++) {
      f = factors[_i];
      _results.push(ref * f);
    }
    return _results;
  })();
  distance = Infinity;
  step = steps.reduce(function(ref, step) {
    var d;
    f = step / ideal;
    d = Math.max(f, 1 / f);
    if (d < distance) {
      distance = d;
      return step;
    } else {
      return ref;
    }
  }, ref);
  step *= factor;
  min = (Math.ceil((min / step) + +(!start))) * step;
  max = (Math.floor(max / step) - +(!end)) * step;
  n = Math.ceil((max - min) / step);
  ticks = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
      _results.push(min + i * step);
    }
    return _results;
  })();
  if (!zero) {
    ticks = ticks.filter(function(x) {
      return x !== 0;
    });
  }
  return ticks;
};


/*
 Generate logarithmically spaced ticks in a range at sensible positions.
 */

log = function(min, max, n, unit, base, bias, start, end, zero, nice) {
  throw new Error("Log ticks not yet implemented.");
};

LINEAR = 0;

LOG = 1;

make = function(type, min, max, n, unit, base, bias, start, end, zero, nice) {
  switch (type) {
    case LINEAR:
      return linear(min, max, n, unit, base, bias, start, end, zero, nice);
    case LOG:
      return log(min, max, n, unit, base, bias, start, end, zero, nice);
  }
};

exports.make = make;

exports.linear = linear;

exports.log = log;


},{}],177:[function(require,module,exports){
var HEAP, Types, apply, createClass, descriptor, element, hint, id, key, map, mount, prop, recycle, set, unmount, unset, _i, _len, _ref;

HEAP = [];

id = 0;

Types = {

  /*
   * el('example', props, children);
  example: MathBox.DOM.createClass({
    render: (el, props, children) ->
       * VDOM node
      return el('span', { className: "foo" }, "Hello World")
  })
   */
};

descriptor = function() {
  return {
    id: id++,
    type: null,
    props: null,
    children: null,
    rendered: null,
    instance: null
  };
};

hint = function(n) {
  var i, _i, _results;
  n *= 2;
  n = Math.max(0, HEAP.length - n);
  _results = [];
  for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
    _results.push(HEAP.push(descriptor()));
  }
  return _results;
};

element = function(type, props, children) {
  var el;
  el = HEAP.length ? HEAP.pop() : descriptor();
  el.type = type != null ? type : 'div';
  el.props = props != null ? props : null;
  el.children = children != null ? children : null;
  return el;
};

recycle = function(el) {
  var child, children, _i, _len;
  if (!el.type) {
    return;
  }
  children = el.children;
  el.type = el.props = el.children = el.instance = null;
  HEAP.push(el);
  if (children != null) {
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      recycle(child);
    }
  }
};

apply = function(el, last, node, parent, index) {
  var child, childNodes, children, comp, dirty, i, k, key, nextChildren, nextProps, nextState, prevProps, prevState, props, ref, same, should, type, v, value, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
  if (el != null) {
    if (last == null) {
      return mount(el, parent, index);
    } else {
      if (el instanceof Node) {
        same = el === last;
        if (same) {
          return;
        }
      } else {
        same = typeof el === typeof last && last !== null && el !== null && el.type === last.type;
      }
      if (!same) {
        unmount(last.instance, node);
        node.remove();
        return mount(el, parent, index);
      } else {
        el.instance = last.instance;
        type = ((_ref = el.type) != null ? _ref.isComponentClass : void 0) ? el.type : Types[el.type];
        props = last != null ? last.props : void 0;
        nextProps = el.props;
        children = (_ref1 = last != null ? last.children : void 0) != null ? _ref1 : null;
        nextChildren = el.children;
        if (nextProps != null) {
          nextProps.children = nextChildren;
        }
        if (type != null) {
          dirty = node._COMPONENT_DIRTY;
          if ((props != null) !== (nextProps != null)) {
            dirty = true;
          }
          if (children !== nextChildren) {
            dirty = true;
          }
          if ((props != null) && (nextProps != null)) {
            if (!dirty) {
              for (key in props) {
                if (!nextProps.hasOwnProperty(key)) {
                  dirty = true;
                }
              }
            }
            if (!dirty) {
              for (key in nextProps) {
                value = nextProps[key];
                if ((ref = props[key]) !== value) {
                  dirty = true;
                }
              }
            }
          }
          if (dirty) {
            comp = last.instance;
            if (el.props == null) {
              el.props = {};
            }
            _ref2 = comp.defaultProps;
            for (k in _ref2) {
              v = _ref2[k];
              if ((_base = el.props)[k] == null) {
                _base[k] = v;
              }
            }
            el.props.children = el.children;
            if (typeof comp.willReceiveProps === "function") {
              comp.willReceiveProps(el.props);
            }
            should = node._COMPONENT_FORCE || ((_ref3 = typeof comp.shouldUpdate === "function" ? comp.shouldUpdate(el.props) : void 0) != null ? _ref3 : true);
            if (should) {
              nextState = comp.getNextState();
              if (typeof comp.willUpdate === "function") {
                comp.willUpdate(el.props, nextState);
              }
            }
            prevProps = comp.props;
            prevState = comp.applyNextState();
            comp.props = el.props;
            comp.children = el.children;
            if (should) {
              el = el.rendered = typeof comp.render === "function" ? comp.render(element, el.props, el.children) : void 0;
              apply(el, last.rendered, node, parent, index);
              if (typeof comp.didUpdate === "function") {
                comp.didUpdate(prevProps, prevState);
              }
            }
          }
          return;
        } else {
          if (props != null) {
            for (key in props) {
              if (!nextProps.hasOwnProperty(key)) {
                unset(node, key, props[key]);
              }
            }
          }
          if (nextProps != null) {
            for (key in nextProps) {
              value = nextProps[key];
              if ((ref = props[key]) !== value && key !== 'children') {
                set(node, key, value, ref);
              }
            }
          }
          if (nextChildren != null) {
            if ((_ref4 = typeof nextChildren) === 'string' || _ref4 === 'number') {
              if (nextChildren !== children) {
                node.textContent = nextChildren;
              }
            } else {
              if (nextChildren.type != null) {
                apply(nextChildren, children, node.childNodes[0], node, 0);
              } else {
                childNodes = node.childNodes;
                if (children != null) {
                  for (i = _i = 0, _len = nextChildren.length; _i < _len; i = ++_i) {
                    child = nextChildren[i];
                    apply(child, children[i], childNodes[i], node, i);
                  }
                } else {
                  for (i = _j = 0, _len1 = nextChildren.length; _j < _len1; i = ++_j) {
                    child = nextChildren[i];
                    apply(child, null, childNodes[i], node, i);
                  }
                }
              }
            }
          } else if (children != null) {
            unmount(null, node);
            node.innerHTML = '';
          }
        }
        return;
      }
    }
  }
  if (last != null) {
    unmount(last.instance, node);
    return last.node.remove();
  }
};

mount = function(el, parent, index) {
  var child, children, comp, ctor, i, k, key, node, type, v, value, _base, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
  if (index == null) {
    index = 0;
  }
  type = ((_ref = el.type) != null ? _ref.isComponentClass : void 0) ? el.type : Types[el.type];
  if (el instanceof Node) {
    node = el;
  } else {
    if (type != null) {
      ctor = ((_ref1 = el.type) != null ? _ref1.isComponentClass : void 0) ? el.type : Types[el.type];
      if (!ctor) {
        el = el.rendered = element('noscript');
        node = mount(el, parent, index);
        return node;
      }
      el.instance = comp = new ctor(parent);
      if (el.props == null) {
        el.props = {};
      }
      _ref2 = comp.defaultProps;
      for (k in _ref2) {
        v = _ref2[k];
        if ((_base = el.props)[k] == null) {
          _base[k] = v;
        }
      }
      el.props.children = el.children;
      comp.props = el.props;
      comp.children = el.children;
      comp.setState(typeof comp.getInitialState === "function" ? comp.getInitialState() : void 0);
      if (typeof comp.willMount === "function") {
        comp.willMount();
      }
      el = el.rendered = typeof comp.render === "function" ? comp.render(element, el.props, el.children) : void 0;
      node = mount(el, parent, index);
      if (typeof comp.didMount === "function") {
        comp.didMount(el);
      }
      node._COMPONENT = comp;
      return node;
    } else if ((_ref3 = typeof el) === 'string' || _ref3 === 'number') {
      node = document.createTextNode(el);
    } else {
      node = document.createElement(el.type);
      _ref4 = el.props;
      for (key in _ref4) {
        value = _ref4[key];
        set(node, key, value);
      }
    }
    children = el.children;
    if (children != null) {
      if ((_ref5 = typeof children) === 'string' || _ref5 === 'number') {
        node.textContent = children;
      } else {
        if (children.type != null) {
          mount(children, node, 0);
        } else {
          for (i = _i = 0, _len = children.length; _i < _len; i = ++_i) {
            child = children[i];
            mount(child, node, i);
          }
        }
      }
    }
  }
  parent.insertBefore(node, parent.childNodes[index]);
  return node;
};

unmount = function(comp, node) {
  var child, k, _i, _len, _ref, _results;
  if (comp) {
    if (typeof comp.willUnmount === "function") {
      comp.willUnmount();
    }
    for (k in comp) {
      delete comp[k];
    }
  }
  _ref = node.childNodes;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    child = _ref[_i];
    unmount(child._COMPONENT, child);
    _results.push(delete child._COMPONENT);
  }
  return _results;
};

prop = function(key) {
  var prefix, prefixes, _i, _len;
  if (typeof document === 'undefined') {
    return true;
  }
  if (document.documentElement.style[key] != null) {
    return key;
  }
  key = key[0].toUpperCase() + key.slice(1);
  prefixes = ['webkit', 'moz', 'ms', 'o'];
  for (_i = 0, _len = prefixes.length; _i < _len; _i++) {
    prefix = prefixes[_i];
    if (document.documentElement.style[prefix + key] != null) {
      return prefix + key;
    }
  }
};

map = {};

_ref = ['transform'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  key = _ref[_i];
  map[key] = prop(key);
}

set = function(node, key, value, orig) {
  var k, v, _ref1;
  if (key === 'style') {
    for (k in value) {
      v = value[k];
      if ((orig != null ? orig[k] : void 0) !== v) {
        node.style[(_ref1 = map[k]) != null ? _ref1 : k] = v;
      }
    }
    return;
  }
  if (node[key] != null) {
    node[key] = value;
    return;
  }
  if (node instanceof Node) {
    node.setAttribute(key, value);
  }
};

unset = function(node, key, orig) {
  var k, v, _ref1;
  if (key === 'style') {
    for (k in orig) {
      v = orig[k];
      node.style[(_ref1 = map[k]) != null ? _ref1 : k] = '';
    }
    return;
  }
  if (node[key] != null) {
    node[key] = void 0;
  }
  if (node instanceof Node) {
    node.removeAttribute(key);
  }
};

createClass = function(prototype) {
  var Component, a, aliases, b, _ref1;
  aliases = {
    willMount: 'componentWillMount',
    didMount: 'componentDidMount',
    willReceiveProps: 'componentWillReceiveProps',
    shouldUpdate: 'shouldComponentUpdate',
    willUpdate: 'componentWillUpdate',
    didUpdate: 'componentDidUpdate',
    willUnmount: 'componentWillUnmount'
  };
  for (a in aliases) {
    b = aliases[a];
    if (prototype[a] == null) {
      prototype[a] = prototype[b];
    }
  }
  Component = (function() {
    function Component(node, props, state, children) {
      var bind, k, nextState, v;
      this.props = props != null ? props : {};
      this.state = state != null ? state : null;
      this.children = children != null ? children : null;
      bind = function(f, self) {
        if (typeof f === 'function') {
          return f.bind(self);
        } else {
          return f;
        }
      };
      for (k in prototype) {
        v = prototype[k];
        this[k] = bind(v, this);
      }
      nextState = null;
      this.setState = function(state) {
        if (nextState == null) {
          nextState = state ? nextState != null ? nextState : {} : null;
        }
        for (k in state) {
          v = state[k];
          nextState[k] = v;
        }
        node._COMPONENT_DIRTY = true;
      };
      this.forceUpdate = function() {
        var el, _results;
        node._COMPONENT_FORCE = node._COMPONENT_DIRTY = true;
        el = node;
        _results = [];
        while (el = el.parentNode) {
          if (el._COMPONENT) {
            _results.push(el._COMPONENT_FORCE = true);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      this.getNextState = function() {
        return nextState;
      };
      this.applyNextState = function() {
        var prevState, _ref1;
        node._COMPONENT_FORCE = node._COMPONENT_DIRTY = false;
        prevState = this.state;
        _ref1 = [null, nextState], nextState = _ref1[0], this.state = _ref1[1];
        return prevState;
      };
      return;
    }

    return Component;

  })();
  Component.isComponentClass = true;
  Component.prototype.defaultProps = (_ref1 = typeof prototype.getDefaultProps === "function" ? prototype.getDefaultProps() : void 0) != null ? _ref1 : {};
  return Component;
};

module.exports = {
  element: element,
  recycle: recycle,
  apply: apply,
  hint: hint,
  Types: Types,
  createClass: createClass
};


},{}],178:[function(require,module,exports){

/*
  Graph of nodes with outlets
 */
var Graph;

Graph = (function() {
  Graph.index = 0;

  Graph.id = function(name) {
    return ++Graph.index;
  };

  Graph.IN = 0;

  Graph.OUT = 1;

  function Graph(nodes, parent) {
    this.parent = parent != null ? parent : null;
    this.id = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  Graph.prototype.inputs = function() {
    var inputs, node, outlet, _i, _j, _len, _len1, _ref, _ref1;
    inputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.inputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.input === null) {
          inputs.push(outlet);
        }
      }
    }
    return inputs;
  };

  Graph.prototype.outputs = function() {
    var node, outlet, outputs, _i, _j, _len, _len1, _ref, _ref1;
    outputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.outputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.output.length === 0) {
          outputs.push(outlet);
        }
      }
    }
    return outputs;
  };

  Graph.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.add = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.add(_node);
      }
      return;
    }
    if (node.graph && !ignore) {
      throw new Error("Adding node to two graphs at once");
    }
    node.graph = this;
    return this.nodes.push(node);
  };

  Graph.prototype.remove = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.remove(_node);
      }
      return;
    }
    if (node.graph !== this) {
      throw new Error("Removing node from wrong graph.");
    }
    ignore || node.disconnect();
    this.nodes.splice(this.nodes.indexOf(node), 1);
    return node.graph = null;
  };

  Graph.prototype.adopt = function(node) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.adopt(_node);
      }
      return;
    }
    node.graph.remove(node, true);
    return this.add(node, true);
  };

  return Graph;

})();

module.exports = Graph;


},{}],179:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":178,"./node":180,"./outlet":181}],180:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in graph.
 */

Node = (function() {
  Node.index = 0;

  Node.id = function(name) {
    return ++Node.index;
  };

  function Node(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = Node.id();
    this.setOutlets(outlets);
  }

  Node.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.get = function(name) {
    return this.getIn(name) || this.getOut(name);
  };

  Node.prototype.setOutlets = function(outlets) {
    var existing, hash, key, match, outlet, _i, _j, _k, _len, _len1, _len2, _ref;
    if (outlets != null) {
      if (this.outlets == null) {
        this.outlets = {};
        for (_i = 0, _len = outlets.length; _i < _len; _i++) {
          outlet = outlets[_i];
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }
      hash = function(outlet) {
        return [outlet.name, outlet.inout, outlet.type].join('-');
      };
      match = {};
      for (_j = 0, _len1 = outlets.length; _j < _len1; _j++) {
        outlet = outlets[_j];
        match[hash(outlet)] = true;
      }
      _ref = this.outlets;
      for (key in _ref) {
        outlet = _ref[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }
      for (_k = 0, _len2 = outlets.length; _k < _len2; _k++) {
        outlet = outlets[_k];
        existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          this._morph(existing, outlet);
        } else {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }
      this;
    }
    return this.outlets;
  };

  Node.prototype.connect = function(node, empty, force) {
    var dest, dests, hint, hints, list, outlets, source, sources, type, typeHint, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    outlets = {};
    hints = {};
    typeHint = function(outlet) {
      return type + '/' + outlet.hint;
    };
    _ref = node.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dest = _ref[_i];
      if (!force && dest.input) {
        continue;
      }
      type = dest.type;
      hint = typeHint(dest);
      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }
    sources = this.outputs;
    sources = sources.filter(function(outlet) {
      return !(empty && outlet.output.length);
    });
    _ref1 = sources.slice();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      source = _ref1[_j];
      type = source.type;
      hint = typeHint(source);
      dests = outlets[type];
      if (dest = hints[hint]) {
        source.connect(dest);
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }
    if (!sources.length) {
      return this;
    }
    _ref2 = sources.slice();
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      source = _ref2[_k];
      type = source.type;
      dests = outlets[type];
      if (dests && dests.length) {
        source.connect(dests.shift());
      }
    }
    return this;
  };

  Node.prototype.disconnect = function(node) {
    var outlet, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      outlet.disconnect();
    }
    _ref1 = this.outputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      outlet.disconnect();
    }
    return this;
  };

  Node.prototype._key = function(outlet) {
    return [outlet.name, outlet.inout].join('-');
  };

  Node.prototype._add = function(outlet) {
    var key;
    key = this._key(outlet);
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error("Adding two identical outlets to same node. (" + key + ")");
    }
    outlet.node = this;
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._morph = function(existing, outlet) {
    var key;
    key = this._key(outlet);
    delete this.outlets[key];
    existing.morph(outlet);
    key = this._key(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._remove = function(outlet) {
    var inout, key;
    key = this._key(outlet);
    inout = outlet.inout;
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }
    outlet.disconnect();
    outlet.node = null;
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  };

  return Node;

})();

module.exports = Node;


},{"./graph":178,"./outlet":181}],181:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');


/*
  In/out outlet on node
 */

Outlet = (function() {
  Outlet.make = function(outlet, extra) {
    var key, meta, value, _ref;
    if (extra == null) {
      extra = {};
    }
    meta = extra;
    if (outlet.meta != null) {
      _ref = outlet.meta;
      for (key in _ref) {
        value = _ref[key];
        meta[key] = value;
      }
    }
    return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, meta);
  };

  Outlet.index = 0;

  Outlet.id = function(name) {
    return "_io_" + (++Outlet.index) + "_" + name;
  };

  Outlet.hint = function(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  };

  function Outlet(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta != null ? meta : {};
    this.id = id;
    if (this.hint == null) {
      this.hint = Outlet.hint(name);
    }
    this.node = null;
    this.input = null;
    this.output = [];
    if (this.id == null) {
      this.id = Outlet.id(this.hint);
    }
  }

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return this.meta = outlet.meta;
  };

  Outlet.prototype.dupe = function(name) {
    var outlet;
    if (name == null) {
      name = this.id;
    }
    outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  };

  Outlet.prototype.connect = function(outlet) {
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw new Error("Can only connect out to in.");
    }
    if (outlet.input === this) {
      return;
    }
    outlet.disconnect();
    outlet.input = this;
    return this.output.push(outlet);
  };

  Outlet.prototype.disconnect = function(outlet) {
    var index, _i, _len, _ref;
    if (this.input) {
      this.input.disconnect(this);
    }
    if (this.output.length) {
      if (outlet) {
        index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }
      } else {
        _ref = this.output;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          outlet = _ref[_i];
          outlet.input = null;
        }
        return this.output = [];
      }
    }
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":178}],182:[function(require,module,exports){
var Block, Graph, Layout, OutletError, Program, debug;

Graph = require('../graph');

Program = require('../linker').Program;

Layout = require('../linker').Layout;

debug = false;

Block = (function() {
  Block.previous = function(outlet) {
    var _ref;
    return (_ref = outlet.input) != null ? _ref.node.owner : void 0;
  };

  function Block() {
    var _ref;
    if (this.namespace == null) {
      this.namespace = Program.entry();
    }
    this.node = new Graph.Node(this, (_ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? _ref : {});
  }

  Block.prototype.refresh = function() {
    var _ref;
    return this.node.setOutlets((_ref = typeof this.makeOutlets === "function" ? this.makeOutlets() : void 0) != null ? _ref : {});
  };

  Block.prototype.clone = function() {
    return new Block;
  };

  Block.prototype.compile = function(language, namespace) {
    var program;
    program = new Program(language, namespace != null ? namespace : Program.entry(), this.node.graph);
    this.call(program, 0);
    return program.assemble();
  };

  Block.prototype.link = function(language, namespace) {
    var layout, module;
    module = this.compile(language, namespace);
    layout = new Layout(language, this.node.graph);
    this._include(module, layout, 0);
    this["export"](layout, 0);
    return layout.link(module);
  };

  Block.prototype.call = function(program, depth) {};

  Block.prototype.callback = function(layout, depth, name, external, outlet) {};

  Block.prototype["export"] = function(layout, depth) {};

  Block.prototype._info = function(suffix) {
    var string, _ref, _ref1;
    string = (_ref = (_ref1 = this.node.owner.snippet) != null ? _ref1._name : void 0) != null ? _ref : this.node.owner.namespace;
    if (suffix != null) {
      return string += '.' + suffix;
    }
  };

  Block.prototype._outlet = function(def, props) {
    var outlet;
    outlet = Graph.Outlet.make(def, props);
    outlet.meta.def = def;
    return outlet;
  };

  Block.prototype._call = function(module, program, depth) {
    return program.call(this.node, module, depth);
  };

  Block.prototype._require = function(module, program) {
    return program.require(this.node, module);
  };

  Block.prototype._inputs = function(module, program, depth) {
    var arg, outlet, _i, _len, _ref, _ref1, _results;
    _ref = module.main.signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      outlet = this.node.get(arg.name);
      _results.push((_ref1 = Block.previous(outlet)) != null ? _ref1.call(program, depth + 1) : void 0);
    }
    return _results;
  };

  Block.prototype._callback = function(module, layout, depth, name, external, outlet) {
    return layout.callback(this.node, module, depth, name, external, outlet);
  };

  Block.prototype._include = function(module, layout, depth) {
    return layout.include(this.node, module, depth);
  };

  Block.prototype._link = function(module, layout, depth) {
    var block, ext, key, orig, outlet, parent, _i, _len, _ref, _ref1, _ref2, _results;
    debug && console.log('block::_link', this.toString(), module.namespace);
    _ref = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      ext = module.externals[key];
      outlet = this.node.get(ext.name);
      if (!outlet) {
        throw new OutletError("External not found on " + (this._info(ext.name)));
      }
      if (outlet.meta.child != null) {
        continue;
      }
      _ref1 = [outlet, outlet, null], orig = _ref1[0], parent = _ref1[1], block = _ref1[2];
      while (!block && parent) {
        _ref2 = [outlet.meta.parent, parent], parent = _ref2[0], outlet = _ref2[1];
      }
      block = Block.previous(outlet);
      if (!block) {
        throw new OutletError("Missing connection on " + (this._info(ext.name)));
      }
      debug && console.log('callback -> ', this.toString(), ext.name, outlet);
      block.callback(layout, depth + 1, key, ext, outlet.input);
      _results.push(block != null ? block["export"](layout, depth + 1) : void 0);
    }
    return _results;
  };

  Block.prototype._trace = function(module, layout, depth) {
    var arg, outlet, _i, _len, _ref, _ref1, _results;
    debug && console.log('block::_trace', this.toString(), module.namespace);
    _ref = module.main.signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      arg = _ref[_i];
      outlet = this.node.get(arg.name);
      _results.push((_ref1 = Block.previous(outlet)) != null ? _ref1["export"](layout, depth + 1) : void 0);
    }
    return _results;
  };

  return Block;

})();

OutletError = function(message) {
  var e;
  e = new Error(message);
  e.name = 'OutletError';
  return e;
};

OutletError.prototype = new Error;

module.exports = Block;


},{"../graph":202,"../linker":207}],183:[function(require,module,exports){
var Block, Call,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Block = require('./block');

Call = (function(_super) {
  __extends(Call, _super);

  function Call(snippet) {
    this.snippet = snippet;
    this.namespace = this.snippet.namespace;
    Call.__super__.constructor.apply(this, arguments);
  }

  Call.prototype.clone = function() {
    return new Call(this.snippet);
  };

  Call.prototype.makeOutlets = function() {
    var callbacks, externals, key, main, outlet, params, symbols;
    main = this.snippet.main.signature;
    externals = this.snippet.externals;
    symbols = this.snippet.symbols;
    params = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = main.length; _i < _len; _i++) {
        outlet = main[_i];
        _results.push(this._outlet(outlet, {
          callback: false
        }));
      }
      return _results;
    }).call(this);
    callbacks = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = symbols.length; _i < _len; _i++) {
        key = symbols[_i];
        _results.push(this._outlet(externals[key], {
          callback: true
        }));
      }
      return _results;
    }).call(this);
    return params.concat(callbacks);
  };

  Call.prototype.call = function(program, depth) {
    this._call(this.snippet, program, depth);
    return this._inputs(this.snippet, program, depth);
  };

  Call.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.snippet, layout, depth);
    return this._trace(this.snippet, layout, depth);
  };

  return Call;

})(Block);

module.exports = Call;


},{"./block":182}],184:[function(require,module,exports){
var Block, Callback, Graph,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Graph = require('../graph');

Block = require('./block');


/*
  Re-use a subgraph as a callback
 */

Callback = (function(_super) {
  __extends(Callback, _super);

  function Callback(graph) {
    this.graph = graph;
    Callback.__super__.constructor.apply(this, arguments);
  }

  Callback.prototype.refresh = function() {
    Callback.__super__.refresh.apply(this, arguments);
    return delete this.subroutine;
  };

  Callback.prototype.clone = function() {
    return new Callback(this.graph);
  };

  Callback.prototype.makeOutlets = function() {
    var handle, ins, outlet, outlets, outs, type, _i, _j, _len, _len1, _ref, _ref1;
    this.make();
    outlets = [];
    ins = [];
    outs = [];
    handle = (function(_this) {
      return function(outlet, list) {
        var dupe, _base;
        if (outlet.meta.callback) {
          if (outlet.inout === Graph.IN) {
            dupe = outlet.dupe();
            if ((_base = dupe.meta).child == null) {
              _base.child = outlet;
            }
            outlet.meta.parent = dupe;
            return outlets.push(dupe);
          }
        } else {
          return list.push(outlet.type);
        }
      };
    })(this);
    _ref = this.graph.inputs();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      handle(outlet, ins);
    }
    _ref1 = this.graph.outputs();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      handle(outlet, outs);
    }
    ins = ins.join(',');
    outs = outs.join(',');
    type = "(" + ins + ")(" + outs + ")";
    outlets.push({
      name: 'callback',
      type: type,
      inout: Graph.OUT,
      meta: {
        callback: true,
        def: this.subroutine.main
      }
    });
    return outlets;
  };

  Callback.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Callback.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.subroutine, layout, depth);
    return this.graph["export"](layout, depth);
  };

  Callback.prototype.call = function(program, depth) {
    return this._require(this.subroutine, program, depth);
  };

  Callback.prototype.callback = function(layout, depth, name, external, outlet) {
    this._include(this.subroutine, layout, depth);
    return this._callback(this.subroutine, layout, depth, name, external, outlet);
  };

  return Callback;

})(Block);

module.exports = Callback;


},{"../graph":202,"./block":182}],185:[function(require,module,exports){
exports.Block = require('./block');

exports.Call = require('./call');

exports.Callback = require('./callback');

exports.Isolate = require('./isolate');

exports.Join = require('./join');


},{"./block":182,"./call":183,"./callback":184,"./isolate":186,"./join":187}],186:[function(require,module,exports){
var Block, Graph, Isolate,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Graph = require('../graph');

Block = require('./block');


/*
  Isolate a subgraph as a single node
 */

Isolate = (function(_super) {
  __extends(Isolate, _super);

  function Isolate(graph) {
    this.graph = graph;
    Isolate.__super__.constructor.apply(this, arguments);
  }

  Isolate.prototype.refresh = function() {
    Isolate.__super__.refresh.apply(this, arguments);
    return delete this.subroutine;
  };

  Isolate.prototype.clone = function() {
    return new Isolate(this.graph);
  };

  Isolate.prototype.makeOutlets = function() {
    var done, dupe, name, outlet, outlets, seen, set, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    this.make();
    outlets = [];
    seen = {};
    done = {};
    _ref = ['inputs', 'outputs'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      set = _ref[_i];
      _ref1 = this.graph[set]();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        name = void 0;
        if (((_ref2 = outlet.hint) === 'return' || _ref2 === 'callback') && outlet.inout === Graph.OUT) {
          name = outlet.hint;
        }
        if (seen[name] != null) {
          name = void 0;
        }
        dupe = outlet.dupe(name);
        if ((_base = dupe.meta).child == null) {
          _base.child = outlet;
        }
        outlet.meta.parent = dupe;
        if (name != null) {
          seen[name] = true;
        }
        done[outlet.name] = dupe;
        outlets.push(dupe);
      }
    }
    return outlets;
  };

  Isolate.prototype.make = function() {
    return this.subroutine = this.graph.compile(this.namespace);
  };

  Isolate.prototype.call = function(program, depth) {
    this._call(this.subroutine, program, depth);
    return this._inputs(this.subroutine, program, depth);
  };

  Isolate.prototype["export"] = function(layout, depth) {
    if (!layout.visit(this.namespace, depth)) {
      return;
    }
    this._link(this.subroutine, layout, depth);
    this._trace(this.subroutine, layout, depth);
    return this.graph["export"](layout, depth);
  };

  Isolate.prototype.callback = function(layout, depth, name, external, outlet) {
    outlet = outlet.meta.child;
    return outlet.node.owner.callback(layout, depth, name, external, outlet);
  };

  return Isolate;

})(Block);

module.exports = Isolate;


},{"../graph":202,"./block":182}],187:[function(require,module,exports){
var Block, Join,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Block = require('./block');


/*
  Join multiple disconnected nodes
 */

Join = (function(_super) {
  __extends(Join, _super);

  function Join(nodes) {
    this.nodes = nodes;
    Join.__super__.constructor.apply(this, arguments);
  }

  Join.prototype.clone = function() {
    return new Join(this.nodes);
  };

  Join.prototype.makeOutlets = function() {
    return [];
  };

  Join.prototype.call = function(program, depth) {
    var block, node, _i, _len, _ref, _results;
    _ref = this.nodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      block = node.owner;
      _results.push(block.call(program, depth));
    }
    return _results;
  };

  Join.prototype["export"] = function(layout, depth) {
    var block, node, _i, _len, _ref, _results;
    _ref = this.nodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      block = node.owner;
      _results.push(block["export"](layout, depth));
    }
    return _results;
  };

  return Join;

})(Block);

module.exports = Join;


},{"./block":182}],188:[function(require,module,exports){

/*
  Cache decorator  
  Fetches snippets once, clones for reuse
  Inline code is hashed to avoid bloat
 */
var cache, hash, queue;

queue = require('./queue');

hash = require('./hash');

cache = function(fetch) {
  var cached, push;
  cached = {};
  push = queue(100);
  return function(name) {
    var expire, key;
    key = name.length > 32 ? '##' + hash(name).toString(16) : name;
    expire = push(key);
    if (expire != null) {
      delete cached[expire];
    }
    if (cached[key] == null) {
      cached[key] = fetch(name);
    }
    return cached[key].clone();
  };
};

module.exports = cache;


},{"./hash":190,"./queue":194}],189:[function(require,module,exports){
var Block, Factory, Graph, State, Visualize;

Graph = require('../graph').Graph;

Block = require('../block');

Visualize = require('../visualize');


/*
  Chainable factory
  
  Exposes methods to build a graph incrementally
 */

Factory = (function() {
  function Factory(language, fetch, config) {
    this.language = language;
    this.fetch = fetch;
    this.config = config;
    this.graph();
  }

  Factory.prototype.pipe = function(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._concat(name);
    } else if (name != null) {
      this._call(name, uniforms, namespace, defines);
    }
    return this;
  };

  Factory.prototype.call = function(name, uniforms, namespace, defines) {
    return this.pipe(name, uniforms, namespace, defines);
  };

  Factory.prototype.require = function(name, uniforms, namespace, defines) {
    if (name instanceof Factory) {
      this._import(name);
    } else if (name != null) {
      this.callback();
      this._call(name, uniforms, namespace, defines);
      this.end();
    }
    return this;
  };

  Factory.prototype["import"] = function(name, uniforms, namespace, defines) {
    return this.require(name, uniforms, namespace, defines);
  };

  Factory.prototype.split = function() {
    this._group('_combine', true);
    return this;
  };

  Factory.prototype.fan = function() {
    this._group('_combine', false);
    return this;
  };

  Factory.prototype.isolate = function() {
    this._group('_isolate');
    return this;
  };

  Factory.prototype.callback = function() {
    this._group('_callback');
    return this;
  };

  Factory.prototype.next = function() {
    this._next();
    return this;
  };

  Factory.prototype.pass = function() {
    var pass;
    pass = this._stack[2].end;
    this.end();
    this._state.end = this._state.end.concat(pass);
    return this;
  };

  Factory.prototype.end = function() {
    var main, op, sub, _ref;
    _ref = this._exit(), sub = _ref[0], main = _ref[1];
    op = sub.op;
    if (this[op]) {
      this[op](sub, main);
    }
    return this;
  };

  Factory.prototype.join = function() {
    return this.end();
  };

  Factory.prototype.graph = function() {
    var graph, _ref;
    while (((_ref = this._stack) != null ? _ref.length : void 0) > 1) {
      this.end();
    }
    if (this._graph) {
      this._tail(this._state, this._graph);
    }
    graph = this._graph;
    this._graph = new Graph;
    this._state = new State;
    this._stack = [this._state];
    return graph;
  };

  Factory.prototype.compile = function(namespace) {
    if (namespace == null) {
      namespace = 'main';
    }
    return this.graph().compile(namespace);
  };

  Factory.prototype.link = function(namespace) {
    if (namespace == null) {
      namespace = 'main';
    }
    return this.graph().link(namespace);
  };

  Factory.prototype.serialize = function() {
    return Visualize.serialize(this._graph);
  };

  Factory.prototype.empty = function() {
    return this._graph.nodes.length === 0;
  };

  Factory.prototype._concat = function(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      return this;
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Isolate(factory._graph);
    } catch (_error) {
      error = _error;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  };

  Factory.prototype._import = function(factory) {
    var block, error;
    if (factory._state.nodes.length === 0) {
      throw "Can't import empty callback";
    }
    this._tail(factory._state, factory._graph);
    try {
      block = new Block.Callback(factory._graph);
    } catch (_error) {
      error = _error;
      if (this.config.autoInspect) {
        Visualize.inspect(error, this._graph, factory);
      }
      throw error;
    }
    this._auto(block);
    return this;
  };

  Factory.prototype._combine = function(sub, main) {
    var from, to, _i, _j, _len, _len1, _ref, _ref1;
    _ref = sub.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      to = _ref[_i];
      _ref1 = main.end;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        from = _ref1[_j];
        from.connect(to, sub.multi);
      }
    }
    main.end = sub.end;
    return main.nodes = main.nodes.concat(sub.nodes);
  };

  Factory.prototype._isolate = function(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Isolate(subgraph);
      } catch (_error) {
        error = _error;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  };

  Factory.prototype._callback = function(sub, main) {
    var block, error, subgraph;
    if (sub.nodes.length) {
      subgraph = this._subgraph(sub);
      this._tail(sub, subgraph);
      try {
        block = new Block.Callback(subgraph);
      } catch (_error) {
        error = _error;
        if (this.config.autoInspect) {
          Visualize.inspect(error, this._graph, subgraph);
        }
        throw error;
      }
      return this._auto(block);
    }
  };

  Factory.prototype._call = function(name, uniforms, namespace, defines) {
    var block, snippet;
    snippet = this.fetch(name);
    snippet.bind(this.config, uniforms, namespace, defines);
    block = new Block.Call(snippet);
    return this._auto(block);
  };

  Factory.prototype._subgraph = function(sub) {
    var subgraph;
    subgraph = new Graph(null, this._graph);
    subgraph.adopt(sub.nodes);
    return subgraph;
  };

  Factory.prototype._tail = function(state, graph) {
    var tail;
    tail = state.end.concat(state.tail);
    tail = tail.filter(function(node, i) {
      return tail.indexOf(node) === i;
    });
    if (tail.length > 1) {
      tail = new Block.Join(tail);
      tail = [tail.node];
      this._graph.add(tail);
    }
    graph.tail = tail[0];
    state.end = tail;
    state.tail = [];
    if (!graph.tail) {
      throw new Error("Cannot finalize empty graph");
    }
    graph.compile = (function(_this) {
      return function(namespace) {
        var error;
        if (namespace == null) {
          namespace = 'main';
        }
        try {
          return graph.tail.owner.compile(_this.language, namespace);
        } catch (_error) {
          error = _error;
          if (_this.config.autoInspect) {
            graph.inspect(error);
          }
          throw error;
        }
      };
    })(this);
    graph.link = (function(_this) {
      return function(namespace) {
        var error;
        if (namespace == null) {
          namespace = 'main';
        }
        try {
          return graph.tail.owner.link(_this.language, namespace);
        } catch (_error) {
          error = _error;
          if (_this.config.autoInspect) {
            graph.inspect(error);
          }
          throw error;
        }
      };
    })(this);
    graph["export"] = (function(_this) {
      return function(layout, depth) {
        return graph.tail.owner["export"](layout, depth);
      };
    })(this);
    return graph.inspect = function(message) {
      if (message == null) {
        message = null;
      }
      return Visualize.inspect(message, graph);
    };
  };

  Factory.prototype._group = function(op, multi) {
    this._push(op, multi);
    this._push();
    return this;
  };

  Factory.prototype._next = function() {
    var sub;
    sub = this._pop();
    this._state.start = this._state.start.concat(sub.start);
    this._state.end = this._state.end.concat(sub.end);
    this._state.nodes = this._state.nodes.concat(sub.nodes);
    this._state.tail = this._state.tail.concat(sub.tail);
    return this._push();
  };

  Factory.prototype._exit = function() {
    this._next();
    this._pop();
    return [this._pop(), this._state];
  };

  Factory.prototype._push = function(op, multi) {
    this._stack.unshift(new State(op, multi));
    return this._state = this._stack[0];
  };

  Factory.prototype._pop = function() {
    var _ref;
    this._state = this._stack[1];
    if (this._state == null) {
      this._state = new State;
    }
    return (_ref = this._stack.shift()) != null ? _ref : new State;
  };

  Factory.prototype._auto = function(block) {
    if (block.node.inputs.length) {
      return this._append(block);
    } else {
      return this._insert(block);
    }
  };

  Factory.prototype._append = function(block) {
    var end, node, _i, _len, _ref;
    node = block.node;
    this._graph.add(node);
    _ref = this._state.end;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      end = _ref[_i];
      end.connect(node);
    }
    if (!this._state.start.length) {
      this._state.start = [node];
    }
    this._state.end = [node];
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  };

  Factory.prototype._prepend = function(block) {
    var node, start, _i, _len, _ref;
    node = block.node;
    this._graph.add(node);
    _ref = this._state.start;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      start = _ref[_i];
      node.connect(start);
    }
    if (!this._state.end.length) {
      this._state.end = [node];
    }
    this._state.start = [node];
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  };

  Factory.prototype._insert = function(block) {
    var node;
    node = block.node;
    this._graph.add(node);
    this._state.start.push(node);
    this._state.end.push(node);
    this._state.nodes.push(node);
    if (!node.outputs.length) {
      return this._state.tail.push(node);
    }
  };

  return Factory;

})();

State = (function() {
  function State(op, multi, start, end, nodes, tail) {
    this.op = op != null ? op : null;
    this.multi = multi != null ? multi : false;
    this.start = start != null ? start : [];
    this.end = end != null ? end : [];
    this.nodes = nodes != null ? nodes : [];
    this.tail = tail != null ? tail : [];
  }

  return State;

})();

module.exports = Factory;


},{"../block":185,"../graph":202,"../visualize":213}],190:[function(require,module,exports){
var c1, c2, c3, c4, c5, hash, imul, test;

c1 = 0xcc9e2d51;

c2 = 0x1b873593;

c3 = 0xe6546b64;

c4 = 0x85ebca6b;

c5 = 0xc2b2ae35;

imul = function(a, b) {
  var ah, al, bh, bl;
  ah = (a >>> 16) & 0xffff;
  al = a & 0xffff;
  bh = (b >>> 16) & 0xffff;
  bl = b & 0xffff;
  return (al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0;
};

if (Math.imul != null) {
  test = Math.imul(0xffffffff, 5);
  if (test === -5) {
    imul = Math.imul;
  }
}

hash = function(string) {
  var h, iterate, j, m, n, next;
  n = string.length;
  m = Math.floor(n / 2);
  j = h = 0;
  next = function() {
    return string.charCodeAt(j++);
  };
  iterate = function(a, b) {
    var k;
    k = a | (b << 16);
    k ^= k << 9;
    k = imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = imul(k, c2);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = imul(h, 5);
    return h = (h + c3) | 0;
  };
  while (m--) {
    iterate(next(), next());
  }
  if (n & 1) {
    iterate(next(), 0);
  }
  h ^= n;
  h ^= h >>> 16;
  h = imul(h, c4);
  h ^= h >>> 13;
  h = imul(h, c5);
  return h ^= h >>> 16;
};

module.exports = hash;


},{}],191:[function(require,module,exports){
exports.Factory = require('./factory');

exports.Material = require('./material');

exports.library = require('./library');

exports.cache = require('./cache');

exports.queue = require('./queue');

exports.hash = require('./hash');


},{"./cache":188,"./factory":189,"./hash":190,"./library":192,"./material":193,"./queue":194}],192:[function(require,module,exports){

/*
  Snippet library
  
  Takes:
    - Hash of snippets: named library
    - (name) -> getter: dynamic lookup
    - nothing:          no library, only pass in inline source code
  
  If 'name' contains any of "{;(#" it is assumed to be direct GLSL code.
 */
var library;

library = function(language, snippets, load) {
  var callback, fetch, inline, used;
  callback = null;
  used = {};
  if (snippets != null) {
    if (typeof snippets === 'function') {
      callback = function(name) {
        return load(language, name, snippets(name));
      };
    } else if (typeof snippets === 'object') {
      callback = function(name) {
        if (snippets[name] == null) {
          throw new Error("Unknown snippet `" + name + "`");
        }
        return load(language, name, snippets[name]);
      };
    }
  }
  inline = function(code) {
    return load(language, '', code);
  };
  if (callback == null) {
    return inline;
  }
  fetch = function(name) {
    if (name.match(/[{;]/)) {
      return inline(name);
    }
    used[name] = true;
    return callback(name);
  };
  fetch.used = function(_used) {
    if (_used == null) {
      _used = used;
    }
    return used = _used;
  };
  return fetch;
};

module.exports = library;


},{}],193:[function(require,module,exports){
var Material, Visualize, debug, tick;

debug = false;

Visualize = require('../visualize');

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

Material = (function() {
  function Material(vertex, fragment) {
    this.vertex = vertex;
    this.fragment = fragment;
    if (debug) {
      this.tock = tick();
    }
  }

  Material.prototype.build = function(options) {
    return this.link(options);
  };

  Material.prototype.link = function(options) {
    var attributes, fragment, key, shader, uniforms, value, varyings, vertex, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (options == null) {
      options = {};
    }
    uniforms = {};
    varyings = {};
    attributes = {};
    vertex = this.vertex.link('main');
    fragment = this.fragment.link('main');
    _ref = [vertex, fragment];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      shader = _ref[_i];
      _ref1 = shader.uniforms;
      for (key in _ref1) {
        value = _ref1[key];
        uniforms[key] = value;
      }
      _ref2 = shader.varyings;
      for (key in _ref2) {
        value = _ref2[key];
        varyings[key] = value;
      }
      _ref3 = shader.attributes;
      for (key in _ref3) {
        value = _ref3[key];
        attributes[key] = value;
      }
    }
    options.vertexShader = vertex.code;
    options.vertexGraph = vertex.graph;
    options.fragmentShader = fragment.code;
    options.fragmentGraph = fragment.graph;
    options.attributes = attributes;
    options.uniforms = uniforms;
    options.varyings = varyings;
    options.inspect = function() {
      return Visualize.inspect('Vertex Shader', vertex, 'Fragment Shader', fragment.graph);
    };
    if (debug) {
      this.tock('Material build');
    }
    return options;
  };

  Material.prototype.inspect = function() {
    return Visualize.inspect('Vertex Shader', this.vertex, 'Fragment Shader', this.fragment.graph);
  };

  return Material;

})();

module.exports = Material;


},{"../visualize":213}],194:[function(require,module,exports){
var queue;

queue = function(limit) {
  var add, count, head, map, remove, tail;
  if (limit == null) {
    limit = 100;
  }
  map = {};
  head = null;
  tail = null;
  count = 0;
  add = function(item) {
    item.prev = null;
    item.next = head;
    if (head != null) {
      head.prev = item;
    }
    head = item;
    if (tail == null) {
      return tail = item;
    }
  };
  remove = function(item) {
    var next, prev;
    prev = item.prev;
    next = item.next;
    if (prev != null) {
      prev.next = next;
    }
    if (next != null) {
      next.prev = prev;
    }
    if (head === item) {
      head = next;
    }
    if (tail === item) {
      return tail = prev;
    }
  };
  return function(key) {
    var dead, item;
    if (item = map[key] && item !== head) {
      remove(item);
      add(item);
    } else {
      if (count === limit) {
        dead = tail.key;
        remove(tail);
        delete map[dead];
      } else {
        count++;
      }
      item = {
        next: head,
        prev: null,
        key: key
      };
      add(item);
      map[key] = item;
    }
    return dead;
  };
};

module.exports = queue;


},{}],195:[function(require,module,exports){

/*
  Compile snippet back into GLSL, but with certain symbols replaced by prefixes / placeholders
 */
var compile, replaced, string_compiler, tick;

compile = function(program) {
  var assembler, ast, code, placeholders, signatures;
  ast = program.ast, code = program.code, signatures = program.signatures;
  placeholders = replaced(signatures);
  assembler = string_compiler(code, placeholders);
  return [signatures, assembler];
};

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

replaced = function(signatures) {
  var key, out, s, sig, _i, _j, _len, _len1, _ref, _ref1;
  out = {};
  s = function(sig) {
    return out[sig.name] = true;
  };
  s(signatures.main);
  _ref = ['external', 'internal', 'varying', 'uniform', 'attribute'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    _ref1 = signatures[key];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      sig = _ref1[_j];
      s(sig);
    }
  }
  return out;
};


/*
String-replacement based compiler
 */

string_compiler = function(code, placeholders) {
  var key, re;
  re = new RegExp('\\b(' + ((function() {
    var _results;
    _results = [];
    for (key in placeholders) {
      _results.push(key);
    }
    return _results;
  })()).join('|') + ')\\b', 'g');
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/\/\*([^*]|\*[^\/])*\*\//g, '');
  return function(prefix, exceptions, defines) {
    var compiled, defs, replace, value;
    if (prefix == null) {
      prefix = '';
    }
    if (exceptions == null) {
      exceptions = {};
    }
    if (defines == null) {
      defines = {};
    }
    replace = {};
    for (key in placeholders) {
      replace[key] = exceptions[key] != null ? key : prefix + key;
    }
    compiled = code.replace(re, function(key) {
      return replace[key];
    });
    defs = (function() {
      var _results;
      _results = [];
      for (key in defines) {
        value = defines[key];
        _results.push("#define " + key + " " + value);
      }
      return _results;
    })();
    if (defs.length) {
      defs.push('');
    }
    return defs.join("\n") + compiled;
  };
};

module.exports = compile;


},{}],196:[function(require,module,exports){
module.exports = {
  SHADOW_ARG: '_i_o',
  RETURN_ARG: 'return'
};


},{}],197:[function(require,module,exports){
var Definition, decl, defaults, get, three, threejs, win;

module.exports = decl = {};

decl["in"] = 0;

decl.out = 1;

decl.inout = 2;

get = function(n) {
  return n.token.data;
};

decl.node = function(node) {
  var _ref, _ref1;
  if (((_ref = node.children[5]) != null ? _ref.type : void 0) === 'function') {
    return decl["function"](node);
  } else if (((_ref1 = node.token) != null ? _ref1.type : void 0) === 'keyword') {
    return decl.external(node);
  }
};

decl.external = function(node) {
  var c, i, ident, list, next, out, quant, storage, struct, type, _i, _len, _ref;
  c = node.children;
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  list = c[5];
  if (storage !== 'attribute' && storage !== 'uniform' && storage !== 'varying') {
    storage = 'global';
  }
  out = [];
  _ref = list.children;
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    c = _ref[i];
    if (c.type === 'ident') {
      ident = get(c);
      next = list.children[i + 1];
      quant = (next != null ? next.type : void 0) === 'quantifier';
      out.push({
        decl: 'external',
        storage: storage,
        type: type,
        ident: ident,
        quant: !!quant,
        count: quant
      });
    }
  }
  return out;
};

decl["function"] = function(node) {
  var args, body, c, child, decls, func, ident, storage, struct, type;
  c = node.children;
  storage = get(c[1]);
  struct = get(c[3]);
  type = get(c[4]);
  func = c[5];
  ident = get(func.children[0]);
  args = func.children[1];
  body = func.children[2];
  decls = (function() {
    var _i, _len, _ref, _results;
    _ref = args.children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(decl.argument(child));
    }
    return _results;
  })();
  return [
    {
      decl: 'function',
      storage: storage,
      type: type,
      ident: ident,
      body: !!body,
      args: decls
    }
  ];
};

decl.argument = function(node) {
  var c, count, ident, inout, list, quant, storage, type;
  c = node.children;
  storage = get(c[1]);
  inout = get(c[2]);
  type = get(c[4]);
  list = c[5];
  ident = get(list.children[0]);
  quant = list.children[1];
  count = quant ? quant.children[0].token.data : void 0;
  return {
    decl: 'argument',
    storage: storage,
    inout: inout,
    type: type,
    ident: ident,
    quant: !!quant,
    count: count
  };
};

decl.param = function(dir, storage, spec, quant, count) {
  var f, prefix, suffix;
  prefix = [];
  if (storage != null) {
    prefix.push(storage);
  }
  if (spec != null) {
    prefix.push(spec);
  }
  prefix.push('');
  prefix = prefix.join(' ');
  suffix = quant ? '[' + count + ']' : '';
  if (dir !== '') {
    dir += ' ';
  }
  f = function(name, long) {
    return (long ? dir : '') + ("" + prefix + name + suffix);
  };
  f.split = function(dir) {
    return decl.param(dir, storage, spec, quant, count);
  };
  return f;
};

win = typeof window !== 'undefined';

threejs = win && !!window.THREE;

defaults = {
  int: 0,
  float: 0,
  vec2: threejs ? THREE.Vector2 : null,
  vec3: threejs ? THREE.Vector3 : null,
  vec4: threejs ? THREE.Vector4 : null,
  mat2: null,
  mat3: threejs ? THREE.Matrix3 : null,
  mat4: threejs ? THREE.Matrix4 : null,
  sampler2D: 0,
  samplerCube: 0
};

three = {
  int: 'i',
  float: 'f',
  vec2: 'v2',
  vec3: 'v3',
  vec4: 'v4',
  mat2: 'm2',
  mat3: 'm3',
  mat4: 'm4',
  sampler2D: 't',
  samplerCube: 't'
};

decl.type = function(name, spec, quant, count, dir, storage) {
  var dirs, inout, param, storages, type, value, _ref;
  dirs = {
    "in": decl["in"],
    out: decl.out,
    inout: decl.inout
  };
  storages = {
    "const": 'const'
  };
  type = three[spec];
  if (quant) {
    type += 'v';
  }
  value = defaults[spec];
  if (value != null ? value.call : void 0) {
    value = new value;
  }
  if (quant) {
    value = [value];
  }
  inout = (_ref = dirs[dir]) != null ? _ref : dirs["in"];
  storage = storages[storage];
  param = decl.param(dir, storage, spec, quant, count);
  return new Definition(name, type, spec, param, value, inout);
};

Definition = (function() {
  function Definition(name, type, spec, param, value, inout, meta) {
    this.name = name;
    this.type = type;
    this.spec = spec;
    this.param = param;
    this.value = value;
    this.inout = inout;
    this.meta = meta;
  }

  Definition.prototype.split = function() {
    var dir, inout, isIn, param;
    isIn = this.meta.shadowed != null;
    dir = isIn ? 'in' : 'out';
    inout = isIn ? decl["in"] : decl.out;
    param = this.param.split(dir);
    return new Definition(this.name, this.type, this.spec, param, this.value, inout);
  };

  Definition.prototype.copy = function(name, meta) {
    var def;
    return def = new Definition(name != null ? name : this.name, this.type, this.spec, this.param, this.value, this.inout, meta);
  };

  return Definition;

})();


},{}],198:[function(require,module,exports){
var $, Graph, _;

Graph = require('../graph');

$ = require('./constants');


/*
 GLSL code generator for compiler and linker stubs
 */

module.exports = _ = {
  unshadow: function(name) {
    var real;
    real = name.replace($.SHADOW_ARG, '');
    if (real !== name) {
      return real;
    } else {
      return null;
    }
  },
  lines: function(lines) {
    return lines.join('\n');
  },
  list: function(lines) {
    return lines.join(', ');
  },
  statements: function(lines) {
    return lines.join(';\n');
  },
  body: function(entry) {
    return {
      entry: entry,
      type: 'void',
      params: [],
      signature: [],
      "return": '',
      vars: {},
      calls: [],
      post: [],
      chain: {}
    };
  },
  define: function(a, b) {
    return "#define " + a + " " + b;
  },
  "function": function(type, entry, params, vars, calls) {
    return "" + type + " " + entry + "(" + params + ") {\n" + vars + calls + "}";
  },
  invoke: function(ret, entry, args) {
    ret = ret ? "" + ret + " = " : '';
    args = _.list(args);
    return "  " + ret + entry + "(" + args + ")";
  },
  same: function(a, b) {
    var A, B, i, _i, _len;
    for (i = _i = 0, _len = a.length; _i < _len; i = ++_i) {
      A = a[i];
      B = b[i];
      if (!B) {
        return false;
      }
      if (A.type !== B.type) {
        return false;
      }
      if ((A.name === $.RETURN_ARG) !== (B.name === $.RETURN_ARG)) {
        return false;
      }
    }
    return true;
  },
  call: function(lookup, dangling, entry, signature, body) {
    var arg, args, copy, id, inout, isReturn, meta, name, omit, op, other, ret, rets, shadow, _i, _len, _ref, _ref1;
    args = [];
    ret = '';
    rets = 1;
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      name = arg.name;
      copy = id = lookup(name);
      other = null;
      meta = null;
      omit = false;
      inout = arg.inout;
      isReturn = name === $.RETURN_ARG;
      if (shadow = (_ref = arg.meta) != null ? _ref.shadowed : void 0) {
        other = lookup(shadow);
        if (other) {
          body.vars[other] = "  " + arg.param(other);
          body.calls.push("  " + other + " = " + id);
          if (!dangling(shadow)) {
            arg = arg.split();
          } else {
            meta = {
              shadowed: other
            };
          }
        }
      }
      if (shadow = (_ref1 = arg.meta) != null ? _ref1.shadow : void 0) {
        other = lookup(shadow);
        if (other) {
          if (!dangling(shadow)) {
            arg = arg.split();
            omit = true;
          } else {
            meta = {
              shadow: other
            };
            continue;
          }
        }
      }
      if (isReturn) {
        ret = id;
      } else if (!omit) {
        args.push(other != null ? other : id);
      }
      if (dangling(name)) {
        op = 'push';
        if (isReturn) {
          if (body["return"] === '') {
            op = 'unshift';
            copy = name;
            body.type = arg.spec;
            body["return"] = "  return " + id;
            body.vars[id] = "  " + arg.param(id);
          } else {
            body.vars[id] = "  " + arg.param(id);
            body.params.push(arg.param(id, true));
          }
        } else {
          body.params.push(arg.param(id, true));
        }
        arg = arg.copy(copy, meta);
        body.signature[op](arg);
      } else {
        body.vars[id] = "  " + arg.param(id);
      }
    }
    return body.calls.push(_.invoke(ret, entry, args));
  },
  build: function(body, calls) {
    var a, b, code, decl, entry, params, post, ret, type, v, vars;
    entry = body.entry;
    code = null;
    if (calls && calls.length === 1 && entry !== 'main') {
      a = body;
      b = calls[0].module;
      if (_.same(body.signature, b.main.signature)) {
        code = _.define(entry, b.entry);
      }
    }
    if (code == null) {
      vars = (function() {
        var _ref, _results;
        _ref = body.vars;
        _results = [];
        for (v in _ref) {
          decl = _ref[v];
          _results.push(decl);
        }
        return _results;
      })();
      calls = body.calls;
      post = body.post;
      params = body.params;
      type = body.type;
      ret = body["return"];
      calls = calls.concat(post);
      if (ret !== '') {
        calls.push(ret);
      }
      calls.push('');
      if (vars.length) {
        vars.push('');
        vars = _.statements(vars) + '\n';
      } else {
        vars = '';
      }
      calls = _.statements(calls);
      params = _.list(params);
      code = _["function"](type, entry, params, vars, calls);
    }
    return {
      signature: body.signature,
      code: code,
      name: entry
    };
  },
  links: function(links) {
    var l, out, _i, _len;
    out = {
      defs: [],
      bodies: []
    };
    for (_i = 0, _len = links.length; _i < _len; _i++) {
      l = links[_i];
      _.link(l, out);
    }
    out.defs = _.lines(out.defs);
    out.bodies = _.statements(out.bodies);
    if (out.defs === '') {
      delete out.defs;
    }
    if (out.bodies === '') {
      delete out.bodies;
    }
    return out;
  },
  link: (function(_this) {
    return function(link, out) {
      var arg, entry, external, inner, ins, list, main, map, module, name, other, outer, outs, returnVar, wrapper, _dangling, _i, _j, _len, _len1, _lookup, _name, _ref, _ref1;
      module = link.module, name = link.name, external = link.external;
      main = module.main;
      entry = module.entry;
      if (_.same(main.signature, external.signature)) {
        return out.defs.push(_.define(name, entry));
      }
      ins = [];
      outs = [];
      map = {};
      returnVar = [module.namespace, $.RETURN_ARG].join('');
      _ref = external.signature;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        list = arg.inout === Graph.IN ? ins : outs;
        list.push(arg);
      }
      _ref1 = main.signature;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        arg = _ref1[_j];
        list = arg.inout === Graph.IN ? ins : outs;
        other = list.shift();
        _name = other.name;
        if (_name === $.RETURN_ARG) {
          _name = returnVar;
        }
        map[arg.name] = _name;
      }
      _lookup = function(name) {
        return map[name];
      };
      _dangling = function() {
        return true;
      };
      inner = _.body();
      _.call(_lookup, _dangling, entry, main.signature, inner);
      inner.entry = entry;
      map = {
        "return": returnVar
      };
      _lookup = function(name) {
        var _ref2;
        return (_ref2 = map[name]) != null ? _ref2 : name;
      };
      outer = _.body();
      wrapper = _.call(_lookup, _dangling, entry, external.signature, outer);
      outer.calls = inner.calls;
      outer.entry = name;
      out.bodies.push(_.build(inner).code.split(' {')[0]);
      return out.bodies.push(_.build(outer).code);
    };
  })(this),
  defuse: function(code) {
    var b, blocks, hash, head, i, j, level, line, re, rest, strip, _i, _j, _len, _len1;
    re = /([A-Za-z0-9_]+\s+)?[A-Za-z0-9_]+\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*;\s*/mg;
    strip = function(code) {
      return code.replace(re, function(m) {
        return '';
      });
    };
    blocks = code.split(/(?=[{}])/g);
    level = 0;
    for (i = _i = 0, _len = blocks.length; _i < _len; i = ++_i) {
      b = blocks[i];
      switch (b[0]) {
        case '{':
          level++;
          break;
        case '}':
          level--;
      }
      if (level === 0) {
        hash = b.split(/^[ \t]*#/m);
        for (j = _j = 0, _len1 = hash.length; _j < _len1; j = ++_j) {
          line = hash[j];
          if (j > 0) {
            line = line.split(/\n/);
            head = line.shift();
            rest = line.join("\n");
            hash[j] = [head, strip(rest)].join('\n');
          } else {
            hash[j] = strip(line);
          }
        }
        blocks[i] = hash.join('#');
      }
    }
    return code = blocks.join('');
  },
  dedupe: function(code) {
    var map, re;
    map = {};
    re = /((attribute|uniform|varying)\s+)[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[[^\]]*\]\s*)?;\s*/mg;
    return code.replace(re, function(m, qual, type, name, struct) {
      if (map[name]) {
        return '';
      }
      map[name] = true;
      return m;
    });
  },
  hoist: function(code) {
    var defs, line, lines, list, out, re, _i, _len;
    re = /^#define ([^ ]+ _pg_[0-9]+_|_pg_[0-9]+_ [^ ]+)$/;
    lines = code.split(/\n/g);
    defs = [];
    out = [];
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      list = line.match(re) ? defs : out;
      list.push(line);
    }
    return defs.concat(out).join("\n");
  }
};


},{"../graph":202,"./constants":196}],199:[function(require,module,exports){
var k, v, _i, _len, _ref;

exports.compile = require('./compile');

exports.parse = require('./parse');

exports.generate = require('./generate');

_ref = require('./constants');
for (v = _i = 0, _len = _ref.length; _i < _len; v = ++_i) {
  k = _ref[v];
  exports[k] = v;
}


},{"./compile":195,"./constants":196,"./generate":198,"./parse":200}],200:[function(require,module,exports){
var $, collect, debug, decl, extractSignatures, mapSymbols, parse, parseGLSL, parser, processAST, sortSymbols, tick, tokenizer, walk;

tokenizer = require('../../vendor/glsl-tokenizer');

parser = require('../../vendor/glsl-parser');

decl = require('./decl');

$ = require('./constants');

debug = false;


/*
parse GLSL into AST
extract all global symbols and make type signatures
 */

parse = function(name, code) {
  var ast, program;
  ast = parseGLSL(name, code);
  return program = processAST(ast, code);
};

parseGLSL = function(name, code) {
  var ast, e, error, errors, fmt, tock, _i, _len, _ref, _ref1;
  if (debug) {
    tock = tick();
  }
  try {
    _ref = tokenizer().process(parser(), code), (_ref1 = _ref[0], ast = _ref1[0]), errors = _ref[1];
  } catch (_error) {
    e = _error;
    errors = [
      {
        message: e
      }
    ];
  }
  if (debug) {
    tock('GLSL Tokenize & Parse');
  }
  fmt = function(code) {
    var max, pad;
    code = code.split("\n");
    max = ("" + code.length).length;
    pad = function(v) {
      if ((v = "" + v).length < max) {
        return ("       " + v).slice(-max);
      } else {
        return v;
      }
    };
    return code.map(function(line, i) {
      return "" + (pad(i + 1)) + ": " + line;
    }).join("\n");
  };
  if (!ast || errors.length) {
    if (!name) {
      name = '(inline code)';
    }
    console.warn(fmt(code));
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      console.error("" + name + " -", error.message);
    }
    throw new Error("GLSL parse error");
  }
  return ast;
};

processAST = function(ast, code) {
  var externals, internals, main, signatures, symbols, tock, _ref;
  if (debug) {
    tock = tick();
  }
  symbols = [];
  walk(mapSymbols, collect(symbols), ast, '');
  _ref = sortSymbols(symbols), main = _ref[0], internals = _ref[1], externals = _ref[2];
  signatures = extractSignatures(main, internals, externals);
  if (debug) {
    tock('GLSL AST');
  }
  return {
    ast: ast,
    code: code,
    signatures: signatures
  };
};

mapSymbols = function(node, collect) {
  switch (node.type) {
    case 'decl':
      collect(decl.node(node));
      return false;
  }
  return true;
};

collect = function(out) {
  return function(value) {
    var obj, _i, _len, _results;
    if (value != null) {
      _results = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        obj = value[_i];
        _results.push(out.push(obj));
      }
      return _results;
    }
  };
};

sortSymbols = function(symbols) {
  var e, externals, found, internals, main, maybe, s, _i, _len;
  main = null;
  internals = [];
  externals = [];
  maybe = {};
  found = false;
  for (_i = 0, _len = symbols.length; _i < _len; _i++) {
    s = symbols[_i];
    if (!s.body) {
      if (s.storage === 'global') {
        internals.push(s);
      } else {
        externals.push(s);
        maybe[s.ident] = true;
      }
    } else {
      if (maybe[s.ident]) {
        externals = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = externals.length; _j < _len1; _j++) {
            e = externals[_j];
            if (e.ident !== s.ident) {
              _results.push(e);
            }
          }
          return _results;
        })();
        delete maybe[s.ident];
      }
      internals.push(s);
      if (s.ident === 'main') {
        main = s;
        found = true;
      } else if (!found) {
        main = s;
      }
    }
  }
  return [main, internals, externals];
};

extractSignatures = function(main, internals, externals) {
  var def, defn, func, sigs, symbol, _i, _j, _len, _len1;
  sigs = {
    uniform: [],
    attribute: [],
    varying: [],
    external: [],
    internal: [],
    global: [],
    main: null
  };
  defn = function(symbol) {
    return decl.type(symbol.ident, symbol.type, symbol.quant, symbol.count, symbol.inout, symbol.storage);
  };
  func = function(symbol, inout) {
    var a, arg, b, d, def, inTypes, outTypes, signature, type, _i, _len;
    signature = (function() {
      var _i, _len, _ref, _results;
      _ref = symbol.args;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        _results.push(defn(arg));
      }
      return _results;
    })();
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      d = signature[_i];
      if (!(d.inout === decl.inout)) {
        continue;
      }
      a = d;
      b = d.copy();
      a.inout = decl["in"];
      b.inout = decl.out;
      b.meta = {
        shadow: a.name
      };
      b.name += $.SHADOW_ARG;
      a.meta = {
        shadowed: b.name
      };
      signature.push(b);
    }
    if (symbol.type !== 'void') {
      signature.unshift(decl.type($.RETURN_ARG, symbol.type, false, '', 'out'));
    }
    inTypes = ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = signature.length; _j < _len1; _j++) {
        d = signature[_j];
        if (d.inout === decl["in"]) {
          _results.push(d.type);
        }
      }
      return _results;
    })()).join(',');
    outTypes = ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = signature.length; _j < _len1; _j++) {
        d = signature[_j];
        if (d.inout === decl.out) {
          _results.push(d.type);
        }
      }
      return _results;
    })()).join(',');
    type = "(" + inTypes + ")(" + outTypes + ")";
    return def = {
      name: symbol.ident,
      type: type,
      signature: signature,
      inout: inout,
      spec: symbol.type
    };
  };
  sigs.main = func(main, decl.out);
  for (_i = 0, _len = internals.length; _i < _len; _i++) {
    symbol = internals[_i];
    sigs.internal.push({
      name: symbol.ident
    });
  }
  for (_j = 0, _len1 = externals.length; _j < _len1; _j++) {
    symbol = externals[_j];
    switch (symbol.decl) {
      case 'external':
        def = defn(symbol);
        sigs[symbol.storage].push(def);
        break;
      case 'function':
        def = func(symbol, decl["in"]);
        sigs.external.push(def);
    }
  }
  return sigs;
};

debug = false;

walk = function(map, collect, node, indent) {
  var child, i, recurse, _i, _len, _ref, _ref1, _ref2;
  debug && console.log(indent, node.type, (_ref = node.token) != null ? _ref.data : void 0, (_ref1 = node.token) != null ? _ref1.type : void 0);
  recurse = map(node, collect);
  if (recurse) {
    _ref2 = node.children;
    for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
      child = _ref2[i];
      walk(map, collect, child, indent + '  ', debug);
    }
  }
  return null;
};

tick = function() {
  var now;
  now = +(new Date);
  return function(label) {
    var delta;
    delta = +new Date() - now;
    console.log(label, delta + " ms");
    return delta;
  };
};

module.exports = walk;

module.exports = parse;


},{"../../vendor/glsl-parser":216,"../../vendor/glsl-tokenizer":220,"./constants":196,"./decl":197}],201:[function(require,module,exports){

/*
  Graph of nodes with outlets
 */
var Graph;

Graph = (function() {
  Graph.index = 0;

  Graph.id = function(name) {
    return ++Graph.index;
  };

  Graph.IN = 0;

  Graph.OUT = 1;

  function Graph(nodes, parent) {
    this.parent = parent != null ? parent : null;
    this.id = Graph.id();
    this.nodes = [];
    nodes && this.add(nodes);
  }

  Graph.prototype.inputs = function() {
    var inputs, node, outlet, _i, _j, _len, _len1, _ref, _ref1;
    inputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.inputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.input === null) {
          inputs.push(outlet);
        }
      }
    }
    return inputs;
  };

  Graph.prototype.outputs = function() {
    var node, outlet, outputs, _i, _j, _len, _len1, _ref, _ref1;
    outputs = [];
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _ref1 = node.outputs;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        outlet = _ref1[_j];
        if (outlet.output.length === 0) {
          outputs.push(outlet);
        }
      }
    }
    return outputs;
  };

  Graph.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Graph.prototype.add = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.add(_node);
      }
      return;
    }
    if (node.graph && !ignore) {
      throw new Error("Adding node to two graphs at once");
    }
    node.graph = this;
    return this.nodes.push(node);
  };

  Graph.prototype.remove = function(node, ignore) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.remove(_node);
      }
      return;
    }
    if (node.graph !== this) {
      throw new Error("Removing node from wrong graph.");
    }
    ignore || node.disconnect();
    this.nodes.splice(this.nodes.indexOf(node), 1);
    return node.graph = null;
  };

  Graph.prototype.adopt = function(node) {
    var _i, _len, _node;
    if (node.length) {
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        _node = node[_i];
        this.adopt(_node);
      }
      return;
    }
    node.graph.remove(node, true);
    return this.add(node, true);
  };

  return Graph;

})();

module.exports = Graph;


},{}],202:[function(require,module,exports){
exports.Graph = require('./graph');

exports.Node = require('./node');

exports.Outlet = require('./outlet');

exports.IN = exports.Graph.IN;

exports.OUT = exports.Graph.OUT;


},{"./graph":201,"./node":203,"./outlet":204}],203:[function(require,module,exports){
var Graph, Node, Outlet;

Graph = require('./graph');

Outlet = require('./outlet');


/*
 Node in graph.
 */

Node = (function() {
  Node.index = 0;

  Node.id = function(name) {
    return ++Node.index;
  };

  function Node(owner, outlets) {
    this.owner = owner;
    this.graph = null;
    this.inputs = [];
    this.outputs = [];
    this.all = [];
    this.outlets = null;
    this.id = Node.id();
    this.setOutlets(outlets);
  }

  Node.prototype.getIn = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.inputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.getOut = function(name) {
    var outlet;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.outputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        outlet = _ref[_i];
        if (outlet.name === name) {
          _results.push(outlet);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Node.prototype.get = function(name) {
    return this.getIn(name) || this.getOut(name);
  };

  Node.prototype.setOutlets = function(outlets) {
    var existing, hash, key, match, outlet, _i, _j, _k, _len, _len1, _len2, _ref;
    if (outlets != null) {
      if (this.outlets == null) {
        this.outlets = {};
        for (_i = 0, _len = outlets.length; _i < _len; _i++) {
          outlet = outlets[_i];
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
        return;
      }
      hash = function(outlet) {
        return [outlet.name, outlet.inout, outlet.type].join('-');
      };
      match = {};
      for (_j = 0, _len1 = outlets.length; _j < _len1; _j++) {
        outlet = outlets[_j];
        match[hash(outlet)] = true;
      }
      _ref = this.outlets;
      for (key in _ref) {
        outlet = _ref[key];
        key = hash(outlet);
        if (match[key]) {
          match[key] = outlet;
        } else {
          this._remove(outlet);
        }
      }
      for (_k = 0, _len2 = outlets.length; _k < _len2; _k++) {
        outlet = outlets[_k];
        existing = match[hash(outlet)];
        if (existing instanceof Outlet) {
          this._morph(existing, outlet);
        } else {
          if (!(outlet instanceof Outlet)) {
            outlet = Outlet.make(outlet);
          }
          this._add(outlet);
        }
      }
      this;
    }
    return this.outlets;
  };

  Node.prototype.connect = function(node, empty, force) {
    var dest, dests, hint, hints, list, outlets, source, sources, type, typeHint, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    outlets = {};
    hints = {};
    typeHint = function(outlet) {
      return type + '/' + outlet.hint;
    };
    _ref = node.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dest = _ref[_i];
      if (!force && dest.input) {
        continue;
      }
      type = dest.type;
      hint = typeHint(dest);
      if (!hints[hint]) {
        hints[hint] = dest;
      }
      outlets[type] = list = outlets[type] || [];
      list.push(dest);
    }
    sources = this.outputs;
    sources = sources.filter(function(outlet) {
      return !(empty && outlet.output.length);
    });
    _ref1 = sources.slice();
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      source = _ref1[_j];
      type = source.type;
      hint = typeHint(source);
      dests = outlets[type];
      if (dest = hints[hint]) {
        source.connect(dest);
        delete hints[hint];
        dests.splice(dests.indexOf(dest), 1);
        sources.splice(sources.indexOf(source), 1);
      }
    }
    if (!sources.length) {
      return this;
    }
    _ref2 = sources.slice();
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      source = _ref2[_k];
      type = source.type;
      dests = outlets[type];
      if (dests && dests.length) {
        source.connect(dests.shift());
      }
    }
    return this;
  };

  Node.prototype.disconnect = function(node) {
    var outlet, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.inputs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      outlet = _ref[_i];
      outlet.disconnect();
    }
    _ref1 = this.outputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      outlet.disconnect();
    }
    return this;
  };

  Node.prototype._key = function(outlet) {
    return [outlet.name, outlet.inout].join('-');
  };

  Node.prototype._add = function(outlet) {
    var key;
    key = this._key(outlet);
    if (outlet.node) {
      throw new Error("Adding outlet to two nodes at once.");
    }
    if (this.outlets[key]) {
      throw new Error("Adding two identical outlets to same node. (" + key + ")");
    }
    outlet.node = this;
    if (outlet.inout === Graph.IN) {
      this.inputs.push(outlet);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.push(outlet);
    }
    this.all.push(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._morph = function(existing, outlet) {
    var key;
    key = this._key(outlet);
    delete this.outlets[key];
    existing.morph(outlet);
    key = this._key(outlet);
    return this.outlets[key] = outlet;
  };

  Node.prototype._remove = function(outlet) {
    var inout, key;
    key = this._key(outlet);
    inout = outlet.inout;
    if (outlet.node !== this) {
      throw new Error("Removing outlet from wrong node.");
    }
    outlet.disconnect();
    outlet.node = null;
    delete this.outlets[key];
    if (outlet.inout === Graph.IN) {
      this.inputs.splice(this.inputs.indexOf(outlet), 1);
    }
    if (outlet.inout === Graph.OUT) {
      this.outputs.splice(this.outputs.indexOf(outlet), 1);
    }
    this.all.splice(this.all.indexOf(outlet), 1);
    return this;
  };

  return Node;

})();

module.exports = Node;


},{"./graph":201,"./outlet":204}],204:[function(require,module,exports){
var Graph, Outlet;

Graph = require('./graph');


/*
  In/out outlet on node
 */

Outlet = (function() {
  Outlet.make = function(outlet, extra) {
    var key, meta, value, _ref;
    if (extra == null) {
      extra = {};
    }
    meta = extra;
    if (outlet.meta != null) {
      _ref = outlet.meta;
      for (key in _ref) {
        value = _ref[key];
        meta[key] = value;
      }
    }
    return new Outlet(outlet.inout, outlet.name, outlet.hint, outlet.type, meta);
  };

  Outlet.index = 0;

  Outlet.id = function(name) {
    return "_io_" + (++Outlet.index) + "_" + name;
  };

  Outlet.hint = function(name) {
    name = name.replace(/^_io_[0-9]+_/, '');
    name = name.replace(/_i_o$/, '');
    return name = name.replace(/(In|Out|Inout|InOut)$/, '');
  };

  function Outlet(inout, name, hint, type, meta, id) {
    this.inout = inout;
    this.name = name;
    this.hint = hint;
    this.type = type;
    this.meta = meta != null ? meta : {};
    this.id = id;
    if (this.hint == null) {
      this.hint = Outlet.hint(name);
    }
    this.node = null;
    this.input = null;
    this.output = [];
    if (this.id == null) {
      this.id = Outlet.id(this.hint);
    }
  }

  Outlet.prototype.morph = function(outlet) {
    this.inout = outlet.inout;
    this.name = outlet.name;
    this.hint = outlet.hint;
    this.type = outlet.type;
    return this.meta = outlet.meta;
  };

  Outlet.prototype.dupe = function(name) {
    var outlet;
    if (name == null) {
      name = this.id;
    }
    outlet = Outlet.make(this);
    outlet.name = name;
    return outlet;
  };

  Outlet.prototype.connect = function(outlet) {
    if (this.inout === Graph.IN && outlet.inout === Graph.OUT) {
      return outlet.connect(this);
    }
    if (this.inout !== Graph.OUT || outlet.inout !== Graph.IN) {
      throw new Error("Can only connect out to in.");
    }
    if (outlet.input === this) {
      return;
    }
    outlet.disconnect();
    outlet.input = this;
    return this.output.push(outlet);
  };

  Outlet.prototype.disconnect = function(outlet) {
    var index, _i, _len, _ref;
    if (this.input) {
      this.input.disconnect(this);
    }
    if (this.output.length) {
      if (outlet) {
        index = this.output.indexOf(outlet);
        if (index >= 0) {
          this.output.splice(index, 1);
          return outlet.input = null;
        }
      } else {
        _ref = this.output;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          outlet = _ref[_i];
          outlet.input = null;
        }
        return this.output = [];
      }
    }
  };

  return Outlet;

})();

module.exports = Outlet;


},{"./graph":201}],205:[function(require,module,exports){
var Block, Factory, GLSL, Graph, Linker, ShaderGraph, Snippet, Visualize, cache, inspect, library, merge, visualize;

Block = require('./block');

Factory = require('./factory');

GLSL = require('./glsl');

Graph = require('./graph');

Linker = require('./linker');

Visualize = require('./visualize');

library = Factory.library;

cache = Factory.cache;

visualize = Visualize.visualize;

inspect = Visualize.inspect;

Snippet = Linker.Snippet;

merge = function(a, b) {
  var key, out, value, _ref;
  if (b == null) {
    b = {};
  }
  out = {};
  for (key in a) {
    value = a[key];
    out[key] = (_ref = b[key]) != null ? _ref : a[key];
  }
  return out;
};

ShaderGraph = (function() {
  function ShaderGraph(snippets, config) {
    var defaults;
    if (!(this instanceof ShaderGraph)) {
      return new ShaderGraph(snippets, config);
    }
    defaults = {
      globalUniforms: false,
      globalVaryings: true,
      globalAttributes: true,
      globals: [],
      autoInspect: false
    };
    this.config = merge(defaults, config);
    this.fetch = cache(library(GLSL, snippets, Snippet.load));
  }

  ShaderGraph.prototype.shader = function(config) {
    var _config;
    if (config == null) {
      config = {};
    }
    _config = merge(this.config, config);
    return new Factory.Factory(GLSL, this.fetch, _config);
  };

  ShaderGraph.prototype.material = function(config) {
    return new Factory.Material(this.shader(config), this.shader(config));
  };

  ShaderGraph.prototype.overlay = function(shader) {
    return ShaderGraph.overlay(shader);
  };

  ShaderGraph.prototype.visualize = function(shader) {
    return ShaderGraph.visualize(shader);
  };

  ShaderGraph.Block = Block;

  ShaderGraph.Factory = Factory;

  ShaderGraph.GLSL = GLSL;

  ShaderGraph.Graph = Graph;

  ShaderGraph.Linker = Linker;

  ShaderGraph.Visualize = Visualize;

  ShaderGraph.inspect = function(shader) {
    return inspect(shader);
  };

  ShaderGraph.visualize = function(shader) {
    return visualize(shader);
  };

  return ShaderGraph;

})();

module.exports = ShaderGraph;

if (typeof window !== 'undefined') {
  window.ShaderGraph = ShaderGraph;
}


},{"./block":185,"./factory":191,"./glsl":199,"./graph":202,"./linker":207,"./visualize":213}],206:[function(require,module,exports){
var Graph, Priority, assemble;

Graph = require('../graph');

Priority = require('./priority');


/*
  Program assembler

  Builds composite program that can act as new module/snippet
  Unconnected input/outputs and undefined callbacks are exposed in the new global/main scope
  If there is only one call with an identical call signature, a #define is output instead.
 */

assemble = function(language, namespace, calls, requires) {
  var adopt, attributes, externals, generate, handle, include, isDangling, library, lookup, process, required, symbols, uniforms, varyings;
  generate = language.generate;
  externals = {};
  symbols = [];
  uniforms = {};
  varyings = {};
  attributes = {};
  library = {};
  process = function() {
    var body, code, includes, lib, main, ns, r, sorted, _ref;
    for (ns in requires) {
      r = requires[ns];
      required(r.node, r.module);
    }
    _ref = handle(calls), body = _ref[0], calls = _ref[1];
    if (namespace != null) {
      body.entry = namespace;
    }
    main = generate.build(body, calls);
    sorted = ((function() {
      var _results;
      _results = [];
      for (ns in library) {
        lib = library[ns];
        _results.push(lib);
      }
      return _results;
    })()).sort(function(a, b) {
      return Priority.compare(a.priority, b.priority);
    });
    includes = sorted.map(function(x) {
      return x.code;
    });
    includes.push(main.code);
    code = generate.lines(includes);
    return {
      namespace: main.name,
      library: library,
      body: main.code,
      code: code,
      main: main,
      entry: main.name,
      symbols: symbols,
      externals: externals,
      uniforms: uniforms,
      varyings: varyings,
      attributes: attributes
    };
  };
  handle = (function(_this) {
    return function(calls) {
      var body, c, call, ns, _i, _len;
      calls = (function() {
        var _results;
        _results = [];
        for (ns in calls) {
          c = calls[ns];
          _results.push(c);
        }
        return _results;
      })();
      calls.sort(function(a, b) {
        return b.priority - a.priority;
      });
      call = function(node, module, priority) {
        var entry, main, _dangling, _lookup;
        include(node, module, priority);
        main = module.main;
        entry = module.entry;
        _lookup = function(name) {
          return lookup(node, name);
        };
        _dangling = function(name) {
          return isDangling(node, name);
        };
        return generate.call(_lookup, _dangling, entry, main.signature, body);
      };
      body = generate.body();
      for (_i = 0, _len = calls.length; _i < _len; _i++) {
        c = calls[_i];
        call(c.node, c.module, c.priority);
      }
      return [body, calls];
    };
  })(this);
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {
        code: code,
        priority: priority
      };
    }
  };
  include = function(node, module, priority) {
    var def, key, lib, ns, _ref, _ref1, _ref2, _ref3;
    priority = Priority.make(priority);
    _ref = module.library;
    for (ns in _ref) {
      lib = _ref[ns];
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    adopt(module.namespace, module.body, priority);
    _ref1 = module.uniforms;
    for (key in _ref1) {
      def = _ref1[key];
      uniforms[key] = def;
    }
    _ref2 = module.varyings;
    for (key in _ref2) {
      def = _ref2[key];
      varyings[key] = def;
    }
    _ref3 = module.attributes;
    for (key in _ref3) {
      def = _ref3[key];
      attributes[key] = def;
    }
    return required(node, module);
  };
  required = function(node, module) {
    var copy, ext, k, key, v, _i, _len, _ref, _results;
    _ref = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        copy = {};
        for (k in ext) {
          v = ext[k];
          copy[k] = v;
        }
        copy.name = lookup(node, ext.name);
        externals[key] = copy;
        _results.push(symbols.push(key));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  isDangling = function(node, name) {
    var outlet;
    outlet = node.get(name);
    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };
  lookup = function(node, name) {
    var outlet;
    outlet = node.get(name);
    if (!outlet) {
      return null;
    }
    if (outlet.input) {
      outlet = outlet.input;
    }
    name = outlet.name;
    return outlet.id;
  };
  return process();
};

module.exports = assemble;


},{"../graph":202,"./priority":210}],207:[function(require,module,exports){
exports.Snippet = require('./snippet');

exports.Program = require('./program');

exports.Layout = require('./layout');

exports.assemble = require('./assemble');

exports.link = require('./link');

exports.priority = require('./priority');

exports.load = exports.Snippet.load;


},{"./assemble":206,"./layout":208,"./link":209,"./priority":210,"./program":211,"./snippet":212}],208:[function(require,module,exports){
var Layout, Snippet, debug, link;

Snippet = require('./snippet');

link = require('./link');

debug = false;


/*
  Program linkage layout
  
  Entry points are added to its dependency graph
  Callbacks are linked either with a go-between function
  or a #define if the signatures are identical.
 */

Layout = (function() {
  function Layout(language, graph) {
    this.language = language;
    this.graph = graph;
    this.links = [];
    this.includes = [];
    this.modules = {};
    this.visits = {};
  }

  Layout.prototype.callback = function(node, module, priority, name, external) {
    return this.links.push({
      node: node,
      module: module,
      priority: priority,
      name: name,
      external: external
    });
  };

  Layout.prototype.include = function(node, module, priority) {
    var m;
    if ((m = this.modules[module.namespace]) != null) {
      return m.priority = Math.max(priority, m.priority);
    } else {
      this.modules[module.namespace] = true;
      return this.includes.push({
        node: node,
        module: module,
        priority: priority
      });
    }
  };

  Layout.prototype.visit = function(namespace) {
    debug && console.log('Visit', namespace, !this.visits[namespace]);
    if (this.visits[namespace]) {
      return false;
    }
    return this.visits[namespace] = true;
  };

  Layout.prototype.link = function(module) {
    var data, key, snippet;
    data = link(this.language, this.links, this.includes, module);
    snippet = new Snippet;
    for (key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  };

  return Layout;

})();

module.exports = Layout;


},{"./link":209,"./snippet":212}],209:[function(require,module,exports){
var Graph, Priority, link;

Graph = require('../graph');

Priority = require('./priority');


/*
 Callback linker
 
 Imports given modules and generates linkages for registered callbacks.

 Builds composite program with single module as exported entry point
 */

link = function(language, links, modules, exported) {
  var adopt, attributes, externals, generate, include, includes, isDangling, library, process, symbols, uniforms, varyings;
  generate = language.generate;
  includes = [];
  symbols = [];
  externals = {};
  uniforms = {};
  attributes = {};
  varyings = {};
  library = {};
  process = function() {
    var code, e, exports, header, lib, m, ns, sorted, _i, _len;
    exports = generate.links(links);
    header = [];
    if (exports.defs != null) {
      header.push(exports.defs);
    }
    if (exports.bodies != null) {
      header.push(exports.bodies);
    }
    for (_i = 0, _len = modules.length; _i < _len; _i++) {
      m = modules[_i];
      include(m.node, m.module, m.priority);
    }
    sorted = ((function() {
      var _results;
      _results = [];
      for (ns in library) {
        lib = library[ns];
        _results.push(lib);
      }
      return _results;
    })()).sort(function(a, b) {
      return Priority.compare(a.priority, b.priority);
    });
    includes = sorted.map(function(x) {
      return x.code;
    });
    code = generate.lines(includes);
    code = generate.defuse(code);
    if (header.length) {
      code = [generate.lines(header), code].join("\n");
    }
    code = generate.hoist(code);
    code = generate.dedupe(code);
    e = exported;
    return {
      namespace: e.main.name,
      code: code,
      main: e.main,
      entry: e.main.name,
      externals: externals,
      uniforms: uniforms,
      attributes: attributes,
      varyings: varyings
    };
  };
  adopt = function(namespace, code, priority) {
    var record;
    record = library[namespace];
    if (record != null) {
      return record.priority = Priority.max(record.priority, priority);
    } else {
      return library[namespace] = {
        code: code,
        priority: priority
      };
    }
  };
  include = function(node, module, priority) {
    var def, ext, key, lib, ns, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _results;
    priority = Priority.make(priority);
    _ref = module.library;
    for (ns in _ref) {
      lib = _ref[ns];
      adopt(ns, lib.code, Priority.nest(priority, lib.priority));
    }
    adopt(module.namespace, module.body, priority);
    _ref1 = module.uniforms;
    for (key in _ref1) {
      def = _ref1[key];
      uniforms[key] = def;
    }
    _ref2 = module.varyings;
    for (key in _ref2) {
      def = _ref2[key];
      varyings[key] = def;
    }
    _ref3 = module.attributes;
    for (key in _ref3) {
      def = _ref3[key];
      attributes[key] = def;
    }
    _ref4 = module.symbols;
    _results = [];
    for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
      key = _ref4[_i];
      ext = module.externals[key];
      if (isDangling(node, ext.name)) {
        externals[key] = ext;
        _results.push(symbols.push(key));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  isDangling = function(node, name) {
    var module, outlet, _ref, _ref1;
    outlet = node.get(name);
    if (!outlet) {
      module = (_ref = (_ref1 = node.owner.snippet) != null ? _ref1._name : void 0) != null ? _ref : node.owner.namespace;
      throw new Error("Unable to link program. Unlinked callback `" + name + "` on `" + module + "`");
    }
    if (outlet.inout === Graph.IN) {
      return outlet.input === null;
    } else if (outlet.inout === Graph.OUT) {
      return outlet.output.length === 0;
    }
  };
  return process();
};

module.exports = link;


},{"../graph":202,"./priority":210}],210:[function(require,module,exports){
exports.make = function(x) {
  if (x == null) {
    x = [];
  }
  if (!(x instanceof Array)) {
    x = [+x != null ? +x : 0];
  }
  return x;
};

exports.nest = function(a, b) {
  return a.concat(b);
};

exports.compare = function(a, b) {
  var i, n, p, q, _i;
  n = Math.min(a.length, b.length);
  for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
    p = a[i];
    q = b[i];
    if (p > q) {
      return -1;
    }
    if (p < q) {
      return 1;
    }
  }
  a = a.length;
  b = b.length;
  if (a > b) {
    return -1;
  } else if (a < b) {
    return 1;
  } else {
    return 0;
  }
};

exports.max = function(a, b) {
  if (exports.compare(a, b) > 0) {
    return b;
  } else {
    return a;
  }
};


},{}],211:[function(require,module,exports){
var Program, Snippet, assemble;

Snippet = require('./snippet');

assemble = require('./assemble');


/*
  Program assembly model
  
  Snippets are added to its queue, registering calls and code includes.
  Calls are de-duped and scheduled at the earliest point required for correct data flow.
  
  When assemble() is called, it builds a main() function to
  execute all calls in final order.
  
  The result is a new instance of Snippet that acts as if it
  was parsed from the combined source of the component
  nodes.
 */

Program = (function() {
  Program.index = 0;

  Program.entry = function() {
    return "_pg_" + (++Program.index) + "_";
  };

  function Program(language, namespace, graph) {
    this.language = language;
    this.namespace = namespace;
    this.graph = graph;
    this.calls = {};
    this.requires = {};
  }

  Program.prototype.call = function(node, module, priority) {
    var exists, ns;
    ns = module.namespace;
    if (exists = this.calls[ns]) {
      exists.priority = Math.max(exists.priority, priority);
    } else {
      this.calls[ns] = {
        node: node,
        module: module,
        priority: priority
      };
    }
    return this;
  };

  Program.prototype.require = function(node, module) {
    var ns;
    ns = module.namespace;
    return this.requires[ns] = {
      node: node,
      module: module
    };
  };

  Program.prototype.assemble = function() {
    var data, key, snippet, _ref;
    data = assemble(this.language, (_ref = this.namespace) != null ? _ref : Program.entry, this.calls, this.requires);
    snippet = new Snippet;
    for (key in data) {
      snippet[key] = data[key];
    }
    snippet.graph = this.graph;
    return snippet;
  };

  return Program;

})();

module.exports = Program;


},{"./assemble":206,"./snippet":212}],212:[function(require,module,exports){
var Snippet;

Snippet = (function() {
  Snippet.index = 0;

  Snippet.namespace = function() {
    return "_sn_" + (++Snippet.index) + "_";
  };

  Snippet.load = function(language, name, code) {
    var compiler, program, sigs, _ref;
    program = language.parse(name, code);
    _ref = language.compile(program), sigs = _ref[0], compiler = _ref[1];
    return new Snippet(language, sigs, compiler, name, code);
  };

  function Snippet(language, _signatures, _compiler, _name, _original) {
    var _ref;
    this.language = language;
    this._signatures = _signatures;
    this._compiler = _compiler;
    this._name = _name;
    this._original = _original;
    this.namespace = null;
    this.code = null;
    this.main = null;
    this.entry = null;
    this.uniforms = null;
    this.externals = null;
    this.symbols = null;
    this.attributes = null;
    this.varyings = null;
    if (!this.language) {
      delete this.language;
    }
    if (!this._signatures) {
      delete this._signatures;
    }
    if (!this._compiler) {
      delete this._compiler;
    }
    if (!this._original) {
      delete this._original;
    }
    if (!this._name) {
      this._name = (_ref = this._signatures) != null ? _ref.main.name : void 0;
    }
  }

  Snippet.prototype.clone = function() {
    return new Snippet(this.language, this._signatures, this._compiler, this._name, this._original);
  };

  Snippet.prototype.bind = function(config, uniforms, namespace, defines) {
    var a, def, defs, e, exceptions, exist, global, k, key, local, name, redef, u, v, x, _a, _e, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _u, _v;
    if (uniforms === '' + uniforms) {
      _ref = [uniforms, namespace != null ? namespace : {}, defines != null ? defines : {}], namespace = _ref[0], uniforms = _ref[1], defines = _ref[2];
    } else if (namespace !== '' + namespace) {
      _ref1 = [namespace != null ? namespace : {}, void 0], defines = _ref1[0], namespace = _ref1[1];
    }
    this.main = this._signatures.main;
    this.namespace = (_ref2 = namespace != null ? namespace : this.namespace) != null ? _ref2 : Snippet.namespace();
    this.entry = this.namespace + this.main.name;
    this.uniforms = {};
    this.varyings = {};
    this.attributes = {};
    this.externals = {};
    this.symbols = [];
    exist = {};
    exceptions = {};
    global = function(name) {
      exceptions[name] = true;
      return name;
    };
    local = (function(_this) {
      return function(name) {
        return _this.namespace + name;
      };
    })(this);
    if (config.globals) {
      _ref3 = config.globals;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        key = _ref3[_i];
        global(key);
      }
    }
    _u = config.globalUniforms ? global : local;
    _v = config.globalVaryings ? global : local;
    _a = config.globalAttributes ? global : local;
    _e = local;
    x = (function(_this) {
      return function(def) {
        return exist[def.name] = true;
      };
    })(this);
    u = (function(_this) {
      return function(def, name) {
        return _this.uniforms[_u(name != null ? name : def.name)] = def;
      };
    })(this);
    v = (function(_this) {
      return function(def) {
        return _this.varyings[_v(def.name)] = def;
      };
    })(this);
    a = (function(_this) {
      return function(def) {
        return _this.attributes[_a(def.name)] = def;
      };
    })(this);
    e = (function(_this) {
      return function(def) {
        var name;
        name = _e(def.name);
        _this.externals[name] = def;
        return _this.symbols.push(name);
      };
    })(this);
    redef = function(def) {
      return {
        type: def.type,
        name: def.name,
        value: def.value
      };
    };
    _ref4 = this._signatures.uniform;
    for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
      def = _ref4[_j];
      x(def);
    }
    _ref5 = this._signatures.uniform;
    for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
      def = _ref5[_k];
      u(redef(def));
    }
    _ref6 = this._signatures.varying;
    for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
      def = _ref6[_l];
      v(redef(def));
    }
    _ref7 = this._signatures.external;
    for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
      def = _ref7[_m];
      e(def);
    }
    _ref8 = this._signatures.attribute;
    for (_n = 0, _len5 = _ref8.length; _n < _len5; _n++) {
      def = _ref8[_n];
      a(redef(def));
    }
    for (name in uniforms) {
      def = uniforms[name];
      if (exist[name]) {
        u(def, name);
      }
    }
    this.body = this.code = this._compiler(this.namespace, exceptions, defines);
    if (defines) {
      defs = ((function() {
        var _results;
        _results = [];
        for (k in defines) {
          v = defines[k];
          _results.push("#define " + k + " " + v);
        }
        return _results;
      })()).join('\n');
      if (defs.length) {
        this._original = [defs, "//----------------------------------------", this._original].join("\n");
      }
    }
    return null;
  };

  return Snippet;

})();

module.exports = Snippet;


},{}],213:[function(require,module,exports){
var Graph, markup, merge, resolve, serialize, visualize;

Graph = require('../Graph').Graph;

exports.serialize = serialize = require('./serialize');

exports.markup = markup = require('./markup');

visualize = function(graph) {
  var data;
  if (!graph) {
    return;
  }
  if (!graph.nodes) {
    return graph;
  }
  data = serialize(graph);
  return markup.process(data);
};

resolve = function(arg) {
  if (arg == null) {
    return arg;
  }
  if (arg instanceof Array) {
    return arg.map(resolve);
  }
  if ((arg.vertex != null) && (arg.fragment != null)) {
    return [resolve(arg.vertex, resolve(arg.fragment))];
  }
  if (arg._graph != null) {
    return arg._graph;
  }
  if (arg.graph != null) {
    return arg.graph;
  }
  return arg;
};

merge = function(args) {
  var arg, out, _i, _len;
  out = [];
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    arg = args[_i];
    if (arg instanceof Array) {
      out = out.concat(merge(arg));
    } else if (arg != null) {
      out.push(arg);
    }
  }
  return out;
};

exports.visualize = function() {
  var graph, list;
  list = merge(resolve([].slice.call(arguments)));
  return markup.merge((function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      graph = list[_i];
      if (graph) {
        _results.push(visualize(graph));
      }
    }
    return _results;
  })());
};

exports.inspect = function() {
  var contents, el, element, _i, _len, _ref;
  contents = exports.visualize.apply(null, arguments);
  element = markup.overlay(contents);
  _ref = document.querySelectorAll('.shadergraph-overlay');
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    el = _ref[_i];
    el.remove();
  }
  document.body.appendChild(element);
  contents.update();
  return element;
};


},{"../Graph":179,"./markup":214,"./serialize":215}],214:[function(require,module,exports){
var connect, cssColor, escapeText, hash, hashColor, makeSVG, merge, overlay, path, process, sqr, trim, wrap, _activate, _markup, _order;

hash = require('../factory/hash');

trim = function(string) {
  return ("" + string).replace(/^\s+|\s+$/g, '');
};

cssColor = function(r, g, b, alpha) {
  return 'rgba(' + [r, g, b, alpha].join(', ') + ')';
};

hashColor = function(string, alpha) {
  var b, color, g, max, min, norm, r;
  if (alpha == null) {
    alpha = 1;
  }
  color = hash(string) ^ 0x123456;
  r = color & 0xFF;
  g = (color >>> 8) & 0xFF;
  b = (color >>> 16) & 0xFF;
  max = Math.max(r, g, b);
  norm = 140 / max;
  min = Math.round(max / 3);
  r = Math.min(255, Math.round(norm * Math.max(r, min)));
  g = Math.min(255, Math.round(norm * Math.max(g, min)));
  b = Math.min(255, Math.round(norm * Math.max(b, min)));
  return cssColor(r, g, b, alpha);
};

escapeText = function(string) {
  string = string != null ? string : "";
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
};

process = function(data) {
  var el, links;
  links = [];
  el = _markup(data, links);
  el.update = function() {
    return connect(el, links);
  };
  _activate(el);
  return el;
};

_activate = function(el) {
  var code, codes, _i, _len, _results;
  codes = el.querySelectorAll('.shadergraph-code');
  _results = [];
  for (_i = 0, _len = codes.length; _i < _len; _i++) {
    code = codes[_i];
    _results.push((function() {
      var popup;
      popup = code;
      popup.parentNode.classList.add('shadergraph-has-code');
      return popup.parentNode.addEventListener('click', function(event) {
        return popup.style.display = {
          block: 'none',
          none: 'block'
        }[popup.style.display || 'none'];
      });
    })());
  }
  return _results;
};

_order = function(data) {
  var link, linkMap, node, nodeMap, recurse, _i, _j, _k, _len, _len1, _len2, _name, _ref, _ref1, _ref2;
  nodeMap = {};
  linkMap = {};
  _ref = data.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    nodeMap[node.id] = node;
  }
  _ref1 = data.links;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    link = _ref1[_j];
    if (linkMap[_name = link.from] == null) {
      linkMap[_name] = [];
    }
    linkMap[link.from].push(link);
  }
  recurse = function(node, depth) {
    var next, _k, _len2, _ref2;
    if (depth == null) {
      depth = 0;
    }
    node.depth = Math.max((_ref2 = node.depth) != null ? _ref2 : 0, depth);
    if (next = linkMap[node.id]) {
      for (_k = 0, _len2 = next.length; _k < _len2; _k++) {
        link = next[_k];
        recurse(nodeMap[link.to], depth + 1);
      }
    }
    return null;
  };
  _ref2 = data.nodes;
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    node = _ref2[_k];
    if (node.depth == null) {
      recurse(node);
    }
  }
  return null;
};

_markup = function(data, links) {
  var addOutlet, block, clear, color, column, columns, div, link, node, outlet, outlets, wrapper, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3;
  _order(data);
  wrapper = document.createElement('div');
  wrapper.classList.add('shadergraph-graph');
  columns = [];
  outlets = {};
  _ref = data.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    block = document.createElement('div');
    block.classList.add("shadergraph-node");
    block.classList.add("shadergraph-node-" + node.type);
    block.innerHTML = "<div class=\"shadergraph-header\">" + (escapeText(node.name)) + "</div>";
    addOutlet = function(outlet, inout) {
      var color, div;
      color = hashColor(outlet.type);
      div = document.createElement('div');
      div.classList.add('shadergraph-outlet');
      div.classList.add("shadergraph-outlet-" + inout);
      div.innerHTML = "<div class=\"shadergraph-point\" style=\"background: " + color + "\"></div>\n<div class=\"shadergraph-type\" style=\"color: " + color + "\">" + (escapeText(outlet.type)) + "</div>\n<div class=\"shadergraph-name\">" + (escapeText(outlet.name)) + "</div>";
      block.appendChild(div);
      return outlets[outlet.id] = div.querySelector('.shadergraph-point');
    };
    _ref1 = node.inputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      addOutlet(outlet, 'in');
    }
    _ref2 = node.outputs;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      outlet = _ref2[_k];
      addOutlet(outlet, 'out');
    }
    if (node.graph != null) {
      block.appendChild(_markup(node.graph, links));
    } else {
      clear = document.createElement('div');
      clear.classList.add('shadergraph-clear');
      block.appendChild(clear);
    }
    if (node.code != null) {
      div = document.createElement('div');
      div.classList.add('shadergraph-code');
      div.innerHTML = escapeText(trim(node.code));
      block.appendChild(div);
    }
    column = columns[node.depth];
    if (column == null) {
      column = document.createElement('div');
      column.classList.add('shadergraph-column');
      columns[node.depth] = column;
    }
    column.appendChild(block);
  }
  for (_l = 0, _len3 = columns.length; _l < _len3; _l++) {
    column = columns[_l];
    if (column != null) {
      wrapper.appendChild(column);
    }
  }
  _ref3 = data.links;
  for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
    link = _ref3[_m];
    color = hashColor(link.type);
    links.push({
      color: color,
      out: outlets[link.out],
      "in": outlets[link["in"]]
    });
  }
  return wrapper;
};

sqr = function(x) {
  return x * x;
};

path = function(x1, y1, x2, y2) {
  var d, dx, dy, f, h, mx, my, vert;
  dx = x2 - x1;
  dy = y2 - y1;
  d = Math.sqrt(sqr(dx) + sqr(dy));
  vert = Math.abs(dy) > Math.abs(dx);
  if (vert) {
    mx = (x1 + x2) / 2;
    my = (y1 + y2) / 2;
    f = dy > 0 ? .3 : -.3;
    h = Math.min(Math.abs(dx) / 2, 20 + d / 8);
    return ['M', x1, y1, 'C', x1 + h, y1 + ',', mx, my - d * f, mx, my, 'C', mx, my + d * f, x2 - h, y2 + ',', x2, y2].join(' ');
  } else {
    h = Math.min(Math.abs(dx) / 2.5, 20 + d / 4);
    return ['M', x1, y1, 'C', x1 + h, y1 + ',', x2 - h, y2 + ',', x2, y2].join(' ');
  }
};

makeSVG = function(tag) {
  if (tag == null) {
    tag = 'svg';
  }
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
};

connect = function(element, links) {
  var a, b, box, c, line, link, ref, svg, _i, _j, _len, _len1;
  if (element.parentNode == null) {
    return;
  }
  ref = element.getBoundingClientRect();
  for (_i = 0, _len = links.length; _i < _len; _i++) {
    link = links[_i];
    a = link.out.getBoundingClientRect();
    b = link["in"].getBoundingClientRect();
    link.coords = {
      x1: (a.left + a.right) / 2 - ref.left,
      y1: (a.top + a.bottom) / 2 - ref.top,
      x2: (b.left + b.right) / 2 - ref.left,
      y2: (b.top + b.bottom) / 2 - ref.top
    };
  }
  svg = element.querySelector('svg');
  if (svg != null) {
    element.removeChild(svg);
  }
  box = element;
  while (box.parentNode && box.offsetHeight === 0) {
    box = box.parentNode;
  }
  svg = makeSVG();
  svg.setAttribute('width', box.offsetWidth);
  svg.setAttribute('height', box.offsetHeight);
  for (_j = 0, _len1 = links.length; _j < _len1; _j++) {
    link = links[_j];
    c = link.coords;
    line = makeSVG('path');
    line.setAttribute('d', path(c.x1, c.y1, c.x2, c.y2));
    line.setAttribute('stroke', link.color);
    line.setAttribute('stroke-width', 3);
    line.setAttribute('fill', 'transparent');
    svg.appendChild(line);
  }
  return element.appendChild(svg);
};

overlay = function(contents) {
  var close, div, inside, view;
  div = document.createElement('div');
  div.setAttribute('class', 'shadergraph-overlay');
  close = document.createElement('div');
  close.setAttribute('class', 'shadergraph-close');
  close.innerHTML = '&times;';
  view = document.createElement('div');
  view.setAttribute('class', 'shadergraph-view');
  inside = document.createElement('div');
  inside.setAttribute('class', 'shadergraph-inside');
  inside.appendChild(contents);
  view.appendChild(inside);
  div.appendChild(view);
  div.appendChild(close);
  close.addEventListener('click', function() {
    return div.parentNode.removeChild(div);
  });
  return div;
};

wrap = function(markup) {
  var p;
  if (markup instanceof Node) {
    return markup;
  }
  p = document.createElement('span');
  p.innerText = markup != null ? markup : '';
  return p;
};

merge = function(markup) {
  var div, el, _i, _len;
  if (markup.length !== 1) {
    div = document.createElement('div');
    for (_i = 0, _len = markup.length; _i < _len; _i++) {
      el = markup[_i];
      div.appendChild(wrap(el));
    }
    div.update = function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = markup.length; _j < _len1; _j++) {
        el = markup[_j];
        _results.push(typeof el.update === "function" ? el.update() : void 0);
      }
      return _results;
    };
    return div;
  } else {
    return wrap(markup[0]);
  }
};

module.exports = {
  process: process,
  merge: merge,
  overlay: overlay
};


},{"../factory/hash":190}],215:[function(require,module,exports){
var Block, isCallback, serialize;

Block = require('../block');

isCallback = function(outlet) {
  return outlet.type[0] === '(';
};

serialize = function(graph) {
  var block, format, inputs, links, node, nodes, other, outlet, outputs, record, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
  nodes = [];
  links = [];
  _ref = graph.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    record = {
      id: node.id,
      name: null,
      type: null,
      depth: null,
      graph: null,
      inputs: [],
      outputs: []
    };
    nodes.push(record);
    inputs = record.inputs;
    outputs = record.outputs;
    block = node.owner;
    if (block instanceof Block.Call) {
      record.name = block.snippet._name;
      record.type = 'call';
      record.code = block.snippet._original;
    } else if (block instanceof Block.Callback) {
      record.name = "Callback";
      record.type = 'callback';
      record.graph = serialize(block.graph);
    } else if (block instanceof Block.Isolate) {
      record.name = 'Isolate';
      record.type = 'isolate';
      record.graph = serialize(block.graph);
    } else if (block instanceof Block.Join) {
      record.name = 'Join';
      record.type = 'join';
    }
    format = function(type) {
      type = type.replace(")(", ")→(");
      return type = type.replace("()", "");
    };
    _ref1 = node.inputs;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      outlet = _ref1[_j];
      inputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: outlet.input == null
      });
    }
    _ref2 = node.outputs;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      outlet = _ref2[_k];
      outputs.push({
        id: outlet.id,
        name: outlet.name,
        type: format(outlet.type),
        open: !outlet.output.length
      });
      _ref3 = outlet.output;
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        other = _ref3[_l];
        links.push({
          from: node.id,
          out: outlet.id,
          to: other.node.id,
          "in": other.id,
          type: format(outlet.type)
        });
      }
    }
  }
  return {
    nodes: nodes,
    links: links
  };
};

module.exports = serialize;


},{"../block":185}],216:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":218}],217:[function(require,module,exports){
var state
  , token
  , tokens
  , idx

var original_symbol = {
    nud: function() { return this.children && this.children.length ? this : fail('unexpected')() }
  , led: fail('missing operator')
}

var symbol_table = {}

function itself() {
  return this
}

symbol('(ident)').nud = itself
symbol('(keyword)').nud = itself
symbol('(builtin)').nud = itself
symbol('(literal)').nud = itself
symbol('(end)')

symbol(':')
symbol(';')
symbol(',')
symbol(')')
symbol(']')
symbol('}')

infixr('&&', 30)
infixr('||', 30)
infix('|', 43)
infix('^', 44)
infix('&', 45)
infix('==', 46)
infix('!=', 46)
infix('<', 47)
infix('<=', 47)
infix('>', 47)
infix('>=', 47)
infix('>>', 48)
infix('<<', 48)
infix('+', 50)
infix('-', 50)
infix('*', 60)
infix('/', 60)
infix('%', 60)
infix('?', 20, function(left) {
  this.children = [left, expression(0), (advance(':'), expression(0))]
  this.type = 'ternary'
  return this
})
infix('.', 80, function(left) {
  token.type = 'literal'
  state.fake(token)
  this.children = [left, token]
  advance()
  return this
})
infix('[', 80, function(left) {
  this.children = [left, expression(0)]
  this.type = 'binary'
  advance(']')
  return this
})
infix('(', 80, function(left) {
  this.children = [left]
  this.type = 'call'

  if(token.data !== ')') while(1) {
    this.children.push(expression(0))
    if(token.data !== ',') break
    advance(',')
  }
  advance(')')
  return this
})

prefix('-')
prefix('+')
prefix('!')
prefix('~')
prefix('defined')
prefix('(', function() {
  this.type = 'group'
  this.children = [expression(0)]
  advance(')')
  return this 
})
prefix('++')
prefix('--')
suffix('++')
suffix('--')

assignment('=')
assignment('+=')
assignment('-=')
assignment('*=')
assignment('/=')
assignment('%=')
assignment('&=')
assignment('|=')
assignment('^=')
assignment('>>=')
assignment('<<=')

module.exports = function(incoming_state, incoming_tokens) {
  state = incoming_state
  tokens = incoming_tokens
  idx = 0
  var result

  if(!tokens.length) return

  advance()
  result = expression(0)
  result.parent = state[0]
  emit(result)

  if(idx < tokens.length) {
    throw new Error('did not use all tokens')
  }

  result.parent.children = [result]

  function emit(node) {
    state.unshift(node, false)
    for(var i = 0, len = node.children.length; i < len; ++i) {
      emit(node.children[i])
    }
    state.shift()
  }

}

function symbol(id, binding_power) {
  var sym = symbol_table[id]
  binding_power = binding_power || 0
  if(sym) {
    if(binding_power > sym.lbp) {
      sym.lbp = binding_power
    }
  } else {
    sym = Object.create(original_symbol)
    sym.id = id 
    sym.lbp = binding_power
    symbol_table[id] = sym
  }
  return sym
}

function expression(rbp) {
  var left, t = token
  advance()

  left = t.nud()
  while(rbp < token.lbp) {
    t = token
    advance()
    left = t.led(left)
  }
  return left
}

function infix(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp)]
    this.type = 'binary'
    return this
  }
}

function infixr(id, bp, led) {
  var sym = symbol(id, bp)
  sym.led = led || function(left) {
    this.children = [left, expression(bp - 1)]
    this.type = 'binary'
    return this
  }
  return sym
}

function prefix(id, nud) {
  var sym = symbol(id)
  sym.nud = nud || function() {
    this.children = [expression(70)]
    this.type = 'unary'
    return this
  }
  return sym
}

function suffix(id) {
  var sym = symbol(id, 150)
  sym.led = function(left) {
    this.children = [left]
    this.type = 'suffix'
    return this
  }
}

function assignment(id) {
  return infixr(id, 10, function(left) {
    this.children = [left, expression(9)]
    this.assignment = true
    this.type = 'assign'
    return this
  })
}

function advance(id) {
  var next
    , value
    , type
    , output

  if(id && token.data !== id) {
    return state.unexpected('expected `'+ id + '`, got `'+token.data+'`')
  }

  if(idx >= tokens.length) {
    token = symbol_table['(end)']
    return
  }

  next = tokens[idx++]
  value = next.data
  type = next.type

  if(type === 'ident') {
    output = state.scope.find(value) || state.create_node()
    type = output.type
  } else if(type === 'builtin') {
    output = symbol_table['(builtin)']
  } else if(type === 'keyword') {
    output = symbol_table['(keyword)']
  } else if(type === 'operator') {
    output = symbol_table[value]
    if(!output) {
      return state.unexpected('unknown operator `'+value+'`')
    }
  } else if(type === 'float' || type === 'integer') {
    type = 'literal'
    output = symbol_table['(literal)']
  } else {
    return state.unexpected('unexpected token.')
  }

  if(output) {
    if(!output.nud) { output.nud = itself }
    if(!output.children) { output.children = [] }
  }

  output = Object.create(output)
  output.token = next
  output.type = type
  if(!output.data) output.data = value

  return token = output
}

function fail(message) {
  return function() { return state.unexpected(message) }
}

},{}],218:[function(require,module,exports){
module.exports = parser

var through = require('../../through')
  , full_parse_expr = require('./expr')
  , Scope = require('./scope')

// singleton!
var Advance = new Object

var DEBUG = false

var _ = 0
  , IDENT = _++
  , STMT = _++
  , STMTLIST = _++
  , STRUCT = _++
  , FUNCTION = _++
  , FUNCTIONARGS = _++
  , DECL = _++
  , DECLLIST = _++
  , FORLOOP = _++
  , WHILELOOP = _++
  , IF = _++
  , EXPR = _++
  , PRECISION = _++
  , COMMENT = _++
  , PREPROCESSOR = _++
  , KEYWORD = _++
  , KEYWORD_OR_IDENT = _++
  , RETURN = _++
  , BREAK = _++
  , CONTINUE = _++
  , DISCARD = _++
  , DOWHILELOOP = _++
  , PLACEHOLDER = _++
  , QUANTIFIER = _++

var DECL_ALLOW_ASSIGN = 0x1
  , DECL_ALLOW_COMMA = 0x2
  , DECL_REQUIRE_NAME = 0x4
  , DECL_ALLOW_INVARIANT = 0x8
  , DECL_ALLOW_STORAGE = 0x10
  , DECL_NO_INOUT = 0x20
  , DECL_ALLOW_STRUCT = 0x40
  , DECL_STATEMENT = 0xFF
  , DECL_FUNCTION = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_COMMA | DECL_NO_INOUT | DECL_ALLOW_INVARIANT | DECL_REQUIRE_NAME)
  , DECL_STRUCT = DECL_STATEMENT & ~(DECL_ALLOW_ASSIGN | DECL_ALLOW_INVARIANT | DECL_ALLOW_STORAGE | DECL_ALLOW_STRUCT)

var QUALIFIERS = ['const', 'attribute', 'uniform', 'varying']

var NO_ASSIGN_ALLOWED = false
  , NO_COMMA_ALLOWED = false

// map of tokens to stmt types
var token_map = {
    'block-comment': COMMENT
  , 'line-comment': COMMENT
  , 'preprocessor': PREPROCESSOR
}

// map of stmt types to human
var stmt_type = _ = [ 
    'ident'
  , 'stmt'
  , 'stmtlist'
  , 'struct'
  , 'function'
  , 'functionargs'
  , 'decl'
  , 'decllist'
  , 'forloop'
  , 'whileloop'
  , 'i'+'f'
  , 'expr'
  , 'precision'
  , 'comment'
  , 'preprocessor'
  , 'keyword'
  , 'keyword_or_ident'
  , 'return'
  , 'break'
  , 'continue'
  , 'discard'
  , 'do-while'
  , 'placeholder'
  , 'quantifier'
]

function parser() {
  var stmtlist = n(STMTLIST)
    , stmt = n(STMT)
    , decllist = n(DECLLIST)
    , precision = n(PRECISION)
    , ident = n(IDENT)
    , keyword_or_ident = n(KEYWORD_OR_IDENT)
    , fn = n(FUNCTION)
    , fnargs = n(FUNCTIONARGS)
    , forstmt = n(FORLOOP)
    , ifstmt = n(IF)
    , whilestmt = n(WHILELOOP)
    , returnstmt = n(RETURN)
    , dowhilestmt = n(DOWHILELOOP)
    , quantifier = n(QUANTIFIER)

  var parse_struct
    , parse_precision
    , parse_quantifier
    , parse_forloop
    , parse_if
    , parse_return
    , parse_whileloop
    , parse_dowhileloop
    , parse_function
    , parse_function_args

  var stream = through(write, end)
    , check = arguments.length ? [].slice.call(arguments) : []
    , depth = 0
    , state = []
    , tokens = []
    , whitespace = []
    , errored = false
    , program
    , token
    , node

  // setup state
  state.shift = special_shift
  state.unshift = special_unshift
  state.fake = special_fake
  state.unexpected = unexpected
  state.scope = new Scope(state)
  state.create_node = function() {
    var n = mknode(IDENT, token)
    n.parent = stream.program
    return n
  }

  setup_stative_parsers()

  // setup root node
  node = stmtlist()
  node.expecting = '(eof)'
  node.mode = STMTLIST
  node.token = {type: '(program)', data: '(program)'}
  program = node

  stream.program = program
  stream.scope = function(scope) {
    if(arguments.length === 1) {
      state.scope = scope
    }
    return state.scope
  }

  state.unshift(node)
  return stream

  // stream functions ---------------------------------------------

  function write(input) {
    if(input.type === 'whitespace' || input.type === 'line-comment' || input.type === 'block-comment') {

      whitespace.push(input)
      return
    }
    tokens.push(input)
    token = token || tokens[0]

    if(token && whitespace.length) {
      token.preceding = token.preceding || []
      token.preceding = token.preceding.concat(whitespace)
      whitespace = []
    }

    while(take()) switch(state[0].mode) {
      case STMT: parse_stmt(); break
      case STMTLIST: parse_stmtlist(); break
      case DECL: parse_decl(); break
      case DECLLIST: parse_decllist(); break
      case EXPR: parse_expr(); break
      case STRUCT: parse_struct(true, true); break
      case PRECISION: parse_precision(); break
      case IDENT: parse_ident(); break
      case KEYWORD: parse_keyword(); break
      case KEYWORD_OR_IDENT: parse_keyword_or_ident(); break
      case FUNCTION: parse_function(); break
      case FUNCTIONARGS: parse_function_args(); break
      case FORLOOP: parse_forloop(); break
      case WHILELOOP: parse_whileloop(); break
      case DOWHILELOOP: parse_dowhileloop(); break
      case RETURN: parse_return(); break
      case IF: parse_if(); break
      case QUANTIFIER: parse_quantifier(); break
    }
  }
  
  function end(tokens) {
    if(arguments.length) {
      write(tokens)
    }

    if(state.length > 1) {
      unexpected('unexpected EOF')
      return
    }

    stream.emit('end')
  }

  function take() {
    if(errored || !state.length)
      return false

    return (token = tokens[0]) && !stream.paused
  }

  // ----- state manipulation --------

  function special_fake(x) {
    state.unshift(x)
    state.shift()
  }

  function special_unshift(_node, add_child) {
    _node.parent = state[0]

    var ret = [].unshift.call(this, _node)

    add_child = add_child === undefined ? true : add_child

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length - 1; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '\\'+_node.type, _node.token.data)
    }

    if(add_child && node !== _node) node.children.push(_node)
    node = _node

    return ret
  }

  function special_shift() {
    var _node = [].shift.call(this)
      , okay = check[this.length]
      , emit = false

    if(DEBUG) {
      var pad = ''
      for(var i = 0, len = this.length; i < len; ++i) {
        pad += ' |'
      }
      console.log(pad, '/'+_node.type)
    }

    if(check.length) { 
      if(typeof check[0] === 'function') {
        emit = check[0](_node)
      } else if(okay !== undefined) {
        emit = okay.test ? okay.test(_node.type) : okay === _node.type
      }
    } else {
      emit = true
    }

    if(emit) stream.emit('data', _node) 
  
    node = _node.parent
    return _node
  }

  // parse states ---------------

  function parse_stmtlist() {
    // determine the type of the statement
    // and then start parsing
    return stative(
      function() { state.scope.enter(); return Advance }
    , normal_mode
    )()

    function normal_mode() {
      if(token.data === state[0].expecting) {
        return state.scope.exit(), state.shift()
      }
      switch(token.type) {
        case 'preprocessor':
          state.fake(adhoc())
          tokens.shift()
        return
        default:
          state.unshift(stmt())
        return 
      }
    }
  }

  function parse_stmt() {
    if(state[0].brace) {
      if(token.data !== '}') {
        return unexpected('expected `}`, got '+token.data)
      }
      state[0].brace = false
      return tokens.shift(), state.shift()
    }
    switch(token.type) {
      case 'eof': return state.shift()
      case 'keyword': 
        switch(token.data) {
          case 'for': return state.unshift(forstmt());
          case 'if': return state.unshift(ifstmt());
          case 'while': return state.unshift(whilestmt());
          case 'do': return state.unshift(dowhilestmt());
          case 'break': return state.fake(mknode(BREAK, token)), tokens.shift()
          case 'continue': return state.fake(mknode(CONTINUE, token)), tokens.shift()
          case 'discard': return state.fake(mknode(DISCARD, token)), tokens.shift()
          case 'return': return state.unshift(returnstmt());
          case 'precision': return state.unshift(precision());
        }
        return state.unshift(decl(DECL_STATEMENT))
      case 'ident':
        var lookup
        if(lookup = state.scope.find(token.data)) {
          if(lookup.parent.type === 'struct') {
            // this is strictly untrue, you could have an
            // expr that starts with a struct constructor.
            //      ... sigh
            return state.unshift(decl(DECL_STATEMENT))
          }
          return state.unshift(expr(';'))
        }
      case 'operator':
        if(token.data === '{') {
          state[0].brace = true
          var n = stmtlist()
          n.expecting = '}'
          return tokens.shift(), state.unshift(n)
        }
        if(token.data === ';') {
          return tokens.shift(), state.shift()
        }
      default: return state.unshift(expr(';'))
    }
  }

  function parse_decl() {
    var stmt = state[0]

    return stative(
      invariant_or_not,
      storage_or_not,
      parameter_or_not,
      precision_or_not,
      struct_or_type,
      maybe_name,
      maybe_lparen,     // lparen means we're a function
      is_decllist,
      done
    )()

    function invariant_or_not() {
      if(token.data === 'invariant') {
        if(stmt.flags & DECL_ALLOW_INVARIANT) {
          state.unshift(keyword())
          return Advance
        } else {
          return unexpected('`invariant` is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function storage_or_not() {
      if(is_storage(token)) {
        if(stmt.flags & DECL_ALLOW_STORAGE) {
          state.unshift(keyword()) 
          return Advance
        } else {
          return unexpected('storage is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function parameter_or_not() {
      if(is_parameter(token)) {
        if(!(stmt.flags & DECL_NO_INOUT)) {
          state.unshift(keyword()) 
          return Advance
        } else {
          return unexpected('parameter is not allowed here') 
        }
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function precision_or_not() {
      if(is_precision(token)) {
        state.unshift(keyword())
        return Advance
      } else {
        state.fake(mknode(PLACEHOLDER, {data: '', position: token.position}))
        return Advance
      }
    }

    function struct_or_type() {
      if(token.data === 'struct') {
        if(!(stmt.flags & DECL_ALLOW_STRUCT)) {
          return unexpected('cannot nest structs')
        }
        state.unshift(struct())
        return Advance
      }

      if(token.type === 'keyword') {
        state.unshift(keyword())
        return Advance
      }

      var lookup = state.scope.find(token.data)

      if(lookup) {
        state.fake(Object.create(lookup))
        tokens.shift()
        return Advance  
      }
      return unexpected('expected user defined type, struct or keyword, got '+token.data)
    }

    function maybe_name() {
      if(token.data === ',' && !(stmt.flags & DECL_ALLOW_COMMA)) {
        return state.shift()
      }

      if(token.data === '[') {
        // oh lord.
        state.unshift(quantifier())
        return
      }

      if(token.data === ')') return state.shift()

      if(token.data === ';') {
        return stmt.stage + 3
      }

      if(token.type !== 'ident') {
        console.log(token);
        return unexpected('expected identifier, got '+token.data)
      }

      stmt.collected_name = tokens.shift()
      return Advance      
    }

    function maybe_lparen() {
      if(token.data === '(') {
        tokens.unshift(stmt.collected_name)
        delete stmt.collected_name
        state.unshift(fn())
        return stmt.stage + 2 
      }
      return Advance
    }

    function is_decllist() {
      tokens.unshift(stmt.collected_name)
      delete stmt.collected_name
      state.unshift(decllist())
      return Advance
    }

    function done() {
      return state.shift()
    }
  }
  
  function parse_decllist() {
    // grab ident

    if(token.type === 'ident') {
      var name = token.data
      state.unshift(ident())
      state.scope.define(name)
      return
    }

    if(token.type === 'operator') {

      if(token.data === ',') {
        // multi-decl!
        if(!(state[1].flags & DECL_ALLOW_COMMA)) {
          return state.shift()
        }

        return tokens.shift()
      } else if(token.data === '=') {
        if(!(state[1].flags & DECL_ALLOW_ASSIGN)) return unexpected('`=` is not allowed here.')

        tokens.shift()

        state.unshift(expr(',', ';'))
        return
      } else if(token.data === '[') {
        state.unshift(quantifier())
        return
      }
    }
    return state.shift()
  }

  function parse_keyword_or_ident() {
    if(token.type === 'keyword') {
      state[0].type = 'keyword'
      state[0].mode = KEYWORD
      return
    }

    if(token.type === 'ident') {
      state[0].type = 'ident'
      state[0].mode = IDENT
      return
    }

    return unexpected('expected keyword or user-defined name, got '+token.data)
  }

  function parse_keyword() {
    if(token.type !== 'keyword') {
      return unexpected('expected keyword, got '+token.data)
    }

    return state.shift(), tokens.shift()
  }

  function parse_ident() {
    if(token.type !== 'ident') {
      return unexpected('expected user-defined name, got '+token.data)
    }

    state[0].data = token.data
    return state.shift(), tokens.shift()
  }


  function parse_expr() {
    var expecting = state[0].expecting

    state[0].tokens = state[0].tokens || []

    if(state[0].parenlevel === undefined) {
      state[0].parenlevel = 0
      state[0].bracelevel = 0
    }
    if(state[0].parenlevel < 1 && expecting.indexOf(token.data) > -1) {
      return parseexpr(state[0].tokens)
    }
    if(token.data === '(') {
      ++state[0].parenlevel
    } else if(token.data === ')') {
      --state[0].parenlevel
    }

    switch(token.data) {
      case '{': ++state[0].bracelevel; break
      case '}': --state[0].bracelevel; break
      case '(': ++state[0].parenlevel; break
      case ')': --state[0].parenlevel; break
    }

    if(state[0].parenlevel < 0) return unexpected('unexpected `)`')
    if(state[0].bracelevel < 0) return unexpected('unexpected `}`')

    state[0].tokens.push(tokens.shift())
    return

    function parseexpr(tokens) {
      return full_parse_expr(state, tokens), state.shift()
    }
  }

  // node types ---------------

  function n(type) {
    // this is a function factory that suffices for most kinds of expressions and statements
    return function() {
      return mknode(type, token)
    }
  }

  function adhoc() {
    return mknode(token_map[token.type], token, node)
  }

  function decl(flags) {
    var _ = mknode(DECL, token, node)
    _.flags = flags

    return _
  }

  function struct(allow_assign, allow_comma) {
    var _ = mknode(STRUCT, token, node)
    _.allow_assign = allow_assign === undefined ? true : allow_assign
    _.allow_comma = allow_comma === undefined ? true : allow_comma
    return _
  }

  function expr() {
    var n = mknode(EXPR, token, node)

    n.expecting = [].slice.call(arguments)
    return n
  }
  
  function keyword(default_value) {
    var t = token
    if(default_value) {
      t = {'type': '(implied)', data: '(default)', position: t.position} 
    }
    return mknode(KEYWORD, t, node)
  }

  // utils ----------------------------

  function unexpected(str) {
    errored = true
    stream.emit('error', new Error(
      (str || 'unexpected '+state) +
      ' at line '+state[0].token.line
    ))
  }

  function assert(type, data) {
    return 1,
      assert_null_string_or_array(type, token.type) && 
      assert_null_string_or_array(data, token.data)
  }

  function assert_null_string_or_array(x, y) {
    switch(typeof x) {
      case 'string': if(y !== x) {
        unexpected('expected `'+x+'`, got '+y+'\n'+token.data);
      } return !errored

      case 'object': if(x && x.indexOf(y) === -1) {
        unexpected('expected one of `'+x.join('`, `')+'`, got '+y);
      } return !errored
    }
    return true
  }

  // stative ----------------------------

  function stative() {
    var steps = [].slice.call(arguments)
      , step
      , result

    return function() {
      var current = state[0]

      current.stage || (current.stage = 0)

      step = steps[current.stage]
      if(!step) return unexpected('parser in undefined state!')

      result = step()

      if(result === Advance) return ++current.stage
      if(result === undefined) return
      current.stage = result
    } 
  }

  function advance(op, t) {
    t = t || 'operator'
    return function() {
      if(!assert(t, op)) return

      var last = tokens.shift()
        , children = state[0].children
        , last_node = children[children.length - 1]

      if(last_node && last_node.token && last.preceding) {
        last_node.token.succeeding = last_node.token.succeeding || []
        last_node.token.succeeding = last_node.token.succeeding.concat(last.preceding)
      }
      return Advance
    }
  }

  function advance_expr(until) {
    return function() { return state.unshift(expr(until)), Advance }
  }

  function advance_ident(declare) {
    return declare ? function() {
      var name = token.data
      return assert('ident') && (state.unshift(ident()), state.scope.define(name), Advance)
    } :  function() {
      if(!assert('ident')) return

      var s = Object.create(state.scope.find(token.data))
      s.token = token

      return (tokens.shift(), Advance)
    }
  }

  function advance_stmtlist() {
    return function() {
      var n = stmtlist()
      n.expecting = '}'
      return state.unshift(n), Advance
    }
  }

  function maybe_stmtlist(skip) {
    return function() {
      var current = state[0].stage
      if(token.data !== '{') { return state.unshift(stmt()), current + skip }
      return tokens.shift(), Advance
    }
  }

  function popstmt() {
    return function() { return state.shift(), state.shift() }
  }


  function setup_stative_parsers() {

    // could also be
    // struct { } decllist
    parse_struct =
        stative(
          advance('struct', 'keyword')
        , function() {
            if(token.data === '{') {
              state.fake(mknode(IDENT, {data:'', position: token.position, type:'ident'}))
              return Advance
            }

            return advance_ident(true)()
          }
        , function() { state.scope.enter(); return Advance }
        , advance('{')
        , function() {
            if(token.data === '}') {
              state.scope.exit()
              tokens.shift()
              return state.shift()
            }
            if(token.data === ';') { tokens.shift(); return }
            state.unshift(decl(DECL_STRUCT))
          }
        )

    parse_precision =
        stative(
          function() { return tokens.shift(), Advance }
        , function() { 
            return assert(
            'keyword', ['lowp', 'mediump', 'highp']
            ) && (state.unshift(keyword()), Advance) 
          }
        , function() { return (state.unshift(keyword()), Advance) }
        , function() { return state.shift() } 
        )

    parse_quantifier =
        stative(
          advance('[')
        , advance_expr(']')
        , advance(']')
        , function() { return state.shift() }
        )

    parse_forloop = 
        stative(
          advance('for', 'keyword')
        , advance('(')
        , function() {
            var lookup
            if(token.type === 'ident') {
              if(!(lookup = state.scope.find(token.data))) {
                lookup = state.create_node()
              }
             
              if(lookup.parent.type === 'struct') {
                return state.unshift(decl(DECL_STATEMENT)), Advance
              }
            } else if(token.type === 'builtin' || token.type === 'keyword') {
              return state.unshift(decl(DECL_STATEMENT)), Advance
            }
            return advance_expr(';')()
          }
        , advance(';')
        , advance_expr(';')
        , advance(';')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_if = 
        stative(
          advance('if', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , function() {
            if(token.data === 'else') {
              return tokens.shift(), state.unshift(stmt()), Advance
            }
            return popstmt()()
          }
        , popstmt()
        )

    parse_return =
        stative(
          advance('return', 'keyword')
        , function() {
            if(token.data === ';') return Advance
            return state.unshift(expr(';')), Advance
          }
        , function() { tokens.shift(), popstmt()() } 
        )

    parse_whileloop =
        stative(
          advance('while', 'keyword')
        , advance('(')
        , advance_expr(')')
        , advance(')')
        , maybe_stmtlist(3)
        , advance_stmtlist()
        , advance('}')
        , popstmt()
        )

    parse_dowhileloop = 
      stative(
        advance('do', 'keyword')
      , maybe_stmtlist(3)
      , advance_stmtlist()
      , advance('}')
      , advance('while', 'keyword')
      , advance('(')
      , advance_expr(')')
      , advance(')')
      , popstmt()
      )

    parse_function =
      stative(
        function() {
          for(var i = 1, len = state.length; i < len; ++i) if(state[i].mode === FUNCTION) {
            return unexpected('function definition is not allowed within another function')
          }

          return Advance
        }
      , function() {
          if(!assert("ident")) return

          var name = token.data
            , lookup = state.scope.find(name)

          state.unshift(ident())
          state.scope.define(name)

          state.scope.enter(lookup ? lookup.scope : null)
          return Advance
        }
      , advance('(')
      , function() { return state.unshift(fnargs()), Advance }
      , advance(')')
      , function() { 
          // forward decl
          if(token.data === ';') {
            return state.scope.exit(), state.shift(), state.shift()
          }
          return Advance
        }
      , advance('{')
      , advance_stmtlist()
      , advance('}')
      , function() { state.scope.exit(); return Advance } 
      , function() { return state.shift(), state.shift(), state.shift() }
      )

    parse_function_args =
      stative(
        function() {
          if(token.data === 'void') { state.fake(keyword()); tokens.shift(); return Advance }
          if(token.data === ')') { state.shift(); return }
          if(token.data === 'struct') {
            state.unshift(struct(NO_ASSIGN_ALLOWED, NO_COMMA_ALLOWED))
            return Advance
          }
          state.unshift(decl(DECL_FUNCTION))
          return Advance
        }
      , function() {
          if(token.data === ',') { tokens.shift(); return 0 }
          if(token.data === ')') { state.shift(); return }
          unexpected('expected one of `,` or `)`, got '+token.data)
        }
      )
  }
}

function mknode(mode, sourcetoken) {
  return {
      mode: mode
    , token: sourcetoken
    , children: []
    , type: stmt_type[mode]
//    , id: (Math.random() * 0xFFFFFFFF).toString(16)
  }
}

function is_storage(token) {
  return token.data === 'const' ||
         token.data === 'attribute' ||
         token.data === 'uniform' ||
         token.data === 'varying'
}

function is_parameter(token) {
  return token.data === 'in' ||
         token.data === 'inout' ||
         token.data === 'out'
}

function is_precision(token) {
  return token.data === 'highp' ||
         token.data === 'mediump' ||
         token.data === 'lowp'
}

},{"../../through":224,"./expr":217,"./scope":219}],219:[function(require,module,exports){
module.exports = scope

function scope(state) {
  if(this.constructor !== scope)
    return new scope(state)

  this.state = state
  this.scopes = []
  this.current = null
}

var cons = scope
  , proto = cons.prototype

proto.enter = function(s) {
  this.scopes.push(
    this.current = this.state[0].scope = s || {}
  )
}

proto.exit = function() {
  this.scopes.pop()
  this.current = this.scopes[this.scopes.length - 1]
}

proto.define = function(str) {
  this.current[str] = this.state[0]
}

proto.find = function(name, fail) {
  for(var i = this.scopes.length - 1; i > -1; --i) {
    if(this.scopes[i].hasOwnProperty(name)) {
      return this.scopes[i][name]
    }
  }

  return null
}

},{}],220:[function(require,module,exports){
module.exports = tokenize

var through = require('../through')

var literals = require('./lib/literals')
  , operators = require('./lib/operators')
  , builtins = require('./lib/builtins')

var NORMAL = 999          // <-- never emitted
  , TOKEN = 9999          // <-- never emitted 
  , BLOCK_COMMENT = 0 
  , LINE_COMMENT = 1
  , PREPROCESSOR = 2
  , OPERATOR = 3
  , INTEGER = 4
  , FLOAT = 5
  , IDENT = 6
  , BUILTIN = 7
  , KEYWORD = 8
  , WHITESPACE = 9
  , EOF = 10 
  , HEX = 11

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
]

function tokenize() {
  var stream = through(write, end)

  var i = 0
    , total = 0
    , mode = NORMAL 
    , c
    , last
    , content = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len

  return stream

  function token(data) {
    if(data.length) {
      stream.queue({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      })
    }
  }

  function write(chunk) {
    i = 0
    input += chunk.toString()
    len = input.length

    while(c = input[i], i < len) switch(mode) {
      case BLOCK_COMMENT: i = block_comment(); break
      case LINE_COMMENT: i = line_comment(); break
      case PREPROCESSOR: i = preprocessor(); break 
      case OPERATOR: i = operator(); break
      case INTEGER: i = integer(); break
      case HEX: i = hex(); break
      case FLOAT: i = decimal(); break
      case TOKEN: i = readtoken(); break
      case WHITESPACE: i = whitespace(); break
      case NORMAL: i = normal(); break
    }

    total += i
    input = input.slice(i)
  } 

  function end(chunk) {
    if(content.length) {
      token(content.join(''))
    }

    mode = EOF
    token('(eof)')

    stream.queue(null)
  }

  function normal() {
    content = content.length ? [] : content

    if(last === '/' && c === '*') {
      start = total + i - 1
      mode = BLOCK_COMMENT
      last = c
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1
      mode = LINE_COMMENT
      last = c
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR
      start = total + i
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE
      start = total + i
      return i
    }

    isnum = /\d/.test(c)
    isoperator = /[^\w_]/.test(c)

    start = total + i
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN
    return i
  }

  function whitespace() {
    if(c === '\n') ++line

    if(/[^\s]/g.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function preprocessor() {
    if(c === '\n') ++line

    if(c === '\n' && last !== '\\') {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c)
      token(content.join(''))
      mode = NORMAL
      return i + 1
    }

    if(c === '\n') ++line

    content.push(c)
    last = c
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));
      
      mode = FLOAT
      return i
    }

    if(c === ';') {
      if(content.length) while(determine_operator(content));
      token(c)
      mode = NORMAL
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '='
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , k = buf.length
      , idx

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''))
      if(idx === -1) { 
        j -= 1
        k -= 1
        if (k < 0) return 0
        continue
      }
      
      token(operators[idx])

      start += operators[idx].length
      content = content.slice(operators[idx].length)
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1    
  }

  function integer() {
    if(c === '.') {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c)
      last = c
      i += 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('')
      if(literals.indexOf(contentstr) > -1) {
        mode = KEYWORD
      } else if(builtins.indexOf(contentstr) > -1) {
        mode = BUILTIN
      } else {
        mode = IDENT
      }
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }
}

},{"../through":224,"./lib/builtins":221,"./lib/literals":222,"./lib/operators":223}],221:[function(require,module,exports){
module.exports = [
    'gl_Position'
  , 'gl_PointSize'
  , 'gl_ClipVertex'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragColor'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_Normal'
  , 'gl_Vertex'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_FogCoord'
  , 'gl_MaxLights'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxDrawBuffers'
  , 'gl_ModelViewMatrix'
  , 'gl_ProjectionMatrix'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_TextureMatrix'
  , 'gl_NormalMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_TextureMatrixInverse'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_NormalScale'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'
  , 'gl_ClipPlane'
  , 'gl_PointParameters'
  , 'gl_Point'
  , 'gl_MaterialParameters'
  , 'gl_FrontMaterial'
  , 'gl_BackMaterial'
  , 'gl_LightSourceParameters'
  , 'gl_LightSource'
  , 'gl_LightModelParameters'
  , 'gl_LightModel'
  , 'gl_LightModelProducts'
  , 'gl_FrontLightModelProduct'
  , 'gl_BackLightModelProduct'
  , 'gl_LightProducts'
  , 'gl_FrontLightProduct'
  , 'gl_BackLightProduct'
  , 'gl_FogParameters'
  , 'gl_Fog'
  , 'gl_TextureEnvColor'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneQ'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneQ'
  , 'gl_FrontColor'
  , 'gl_BackColor'
  , 'gl_FrontSecondaryColor'
  , 'gl_BackSecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_Color'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_FogFragCoord'
  , 'gl_PointCoord'
  , 'radians'
  , 'degrees'
  , 'sin'
  , 'cos'
  , 'tan'
  , 'asin'
  , 'acos'
  , 'atan'
  , 'pow'
  , 'exp'
  , 'log'
  , 'exp2'
  , 'log2'
  , 'sqrt'
  , 'inversesqrt'
  , 'abs'
  , 'sign'
  , 'floor'
  , 'ceil'
  , 'fract'
  , 'mod'
  , 'min'
  , 'max'
  , 'clamp'
  , 'mix'
  , 'step'
  , 'smoothstep'
  , 'length'
  , 'distance'
  , 'dot'
  , 'cross'
  , 'normalize'
  , 'faceforward'
  , 'reflect'
  , 'refract'
  , 'matrixCompMult'
  , 'lessThan'
  , 'lessThanEqual'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'equal'
  , 'notEqual'
  , 'any'
  , 'all'
  , 'not'
  , 'texture2D'
  , 'texture2DProj'
  , 'texture2DLod'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
]

},{}],222:[function(require,module,exports){
module.exports = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'fo'+'r'
  , 'whi'+'le'
  , 'i'+'f'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
]

},{}],223:[function(require,module,exports){
module.exports = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
]

},{}],224:[function(require,module,exports){
var through;

through = function(write, end) {
  var errors, output;
  output = [];
  errors = [];
  return {
    output: output,
    parser: null,
    write: write,
    end: end,
    process: function(parser, data) {
      this.parser = parser;
      write(data);
      this.flush();
      return this.parser.flush();
    },
    flush: function() {
      end();
      return [output, errors];
    },
    queue: function(obj) {
      var _ref;
      if (obj != null) {
        return (_ref = this.parser) != null ? _ref.write(obj) : void 0;
      }
    },
    emit: function(type, node) {
      if (type === 'data') {
        if (node.parent == null) {
          output.push(node);
        }
      }
      if (type === 'error') {
        return errors.push(node);
      }
    }
  };
};

module.exports = through;


},{}]},{},[30])
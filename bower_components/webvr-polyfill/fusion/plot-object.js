// Create a three.js scene in which the camera is controlled by the orientation
// from the complementary filter.

var co = new ComplementaryOrientation();

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = -1;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.SphereGeometry( 1, 16, 16 );
var material = new THREE.MeshBasicMaterial( {color: 'red', wireframe: true} );
var sphereX = new THREE.Mesh( geometry, material );
sphereX.position.set(5, 0, 0);
scene.add( sphereX );

var geometry = new THREE.SphereGeometry( 1, 16, 16 );
var material = new THREE.MeshBasicMaterial( {color: 'green', wireframe: true} );
var sphereY = new THREE.Mesh( geometry, material );
sphereY.position.set(0, 5, 0);
scene.add( sphereY );

var geometry = new THREE.SphereGeometry( 1, 16, 16 );
var material = new THREE.MeshBasicMaterial( {color: 'blue', wireframe: true} );
var sphereZ = new THREE.Mesh( geometry, material );
sphereZ.position.set(0, 0, 5);
scene.add( sphereZ );

var geometry = new THREE.SphereGeometry( 1, 16, 16 );
var material = new THREE.MeshBasicMaterial( {color: 'cyan', wireframe: true} );
var sphereBottom = new THREE.Mesh( geometry, material );
sphereBottom.position.set(0, -5, 0);
scene.add( sphereBottom );

// Add a repeating grid as a skybox.
var boxWidth = 10;
var texture = THREE.ImageUtils.loadTexture(
  'img/box.png'
);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(boxWidth, boxWidth);

var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);
var material = new THREE.MeshBasicMaterial({
  map: texture,
  color: 0xffffff,
  side: THREE.BackSide
});

var skybox = new THREE.Mesh(geometry, material);
scene.add(skybox);

function render() {
  camera.quaternion.copy(co.getOrientation());

  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();


window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
});

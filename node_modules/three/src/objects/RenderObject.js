/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.RenderObject = function () {

	THREE.Object3D.call( this );

	this.type = 'RenderObject';

};

Object.extend( THREE.RenderObject.prototype, THREE.Object3D.prototype, {

	render: function () {}

} );

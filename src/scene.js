VR_APP['screens']['main'] = (function() {

    var framesBetween = 5000,
        currentFrame = 0,
        canAdd = false,
        PLANE_SIZE = 20,
        colors = [];

    function createPlane(size, position, rotation, color){
        var geometry = new THREE.PlaneGeometry(size, size);
        var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide} );
        var plane = new THREE.Mesh( geometry, material );
        plane.position.set(position.x, position.y, position.z);
        plane.rotation.set(rotation.x, rotation.y, rotation.z);
        VR_APP['scene'].add( plane );
    }

    function randomInArray(array){
        return array[Math.floor(Math.random() * array.length)];
    }

    function randomColor(colors, isUsed){
        var colorObj;
        var unused = colors.filter(function(obj){
            return obj.used === isUsed;
        });

        if(unused.length < 1){
            colorObj = randomInArray(colors);
        } else {
            colorObj = randomInArray(unused);
            colorObj.used = true;
        }

        return colorObj.color;
    }

    function onMouseDown(event){
        event.preventDefault();
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(VR_APP.camera.position, VR_APP.camera);

        var intersects = raycaster.intersectObjects(VR_APP.scene.children);
        for(var i = 0; i < intersects.length; i++){
            if(intersects[i].object.material.color.equals(VR_APP.target.material.color)){
                var reset = colors.filter(function(obj){
                    return obj.color === intersects[i].object.material.color.getHex();
                });
                for (var j = 0; j < reset.length; j++){
                    reset[j].used = false;
                }
                VR_APP.scene.remove(intersects[i]['object']);
                VR_APP.target.material.color.setHex(randomColor(colors, true));

                // Add scoring, more colors, levels, game over, etc.
            }
        }
    }

    function initialize(){
        colors.push(
            {color: 0x00ff00, used: false},
            {color: 0xff0000, used: false},
            {color: 0x0000ff, used: false},
            {color: 0xff3399, used: false},
            {color: 0x00ffff, used: false},
            {color: 0x009999, used: false},
            {color: 0x009900, used: false}
        );

        window.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('resize', onResize, true);
        window.addEventListener('vrdisplaypresentchange', onResize, true);

        // ALL OF THESE WILL HAVE A MATHEMATICAL BASIS (allow for tiles, etc.)
        // z plane
        createPlane(PLANE_SIZE, {'x':0, 'y':0, 'z':-PLANE_SIZE / 2}, {'x': 0, 'y': 0, 'z': 0}, randomColor(colors, false));
        createPlane(PLANE_SIZE, {'x':0, 'y':0, 'z':PLANE_SIZE / 2}, {'x': 0, 'y': 0, 'z': 0}, randomColor(colors, false));

        // y plane
        createPlane(PLANE_SIZE, {'x':0, 'y':-PLANE_SIZE / 2, 'z':0}, {'x': Math.PI / 2, 'y': 0, 'z': 0}, randomColor(colors, false));
        createPlane(PLANE_SIZE, {'x':0, 'y':PLANE_SIZE / 2, 'z':0}, {'x': Math.PI / 2, 'y': 0, 'z': 0}, randomColor(colors, false));

        // x plane
        createPlane(PLANE_SIZE, {'x':-PLANE_SIZE / 2, 'y':0, 'z':0}, {'x': 0, 'y': Math.PI / 2, 'z': 0}, randomColor(colors, false));
        createPlane(PLANE_SIZE, {'x':PLANE_SIZE / 2, 'y':0, 'z':0}, {'x': 0, 'y': Math.PI / 2, 'z': 0}, randomColor(colors, false));

        var geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        var material = new THREE.MeshBasicMaterial({color: randomColor(colors, true)});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -PLANE_SIZE / 4;
        VR_APP.target = mesh;
        VR_APP.camera.add( mesh );

        //VR_APP.target.material.color.setHex(0xffffff);

        VR_APP['lastRender'] = 0;
        /*
        object.position.set(0, 0, -1);
        VR_APP.camera.add(object);

        var loader = new THREE.TextureLoader();
        loader.load('img/box.png', onTextureLoaded);

        function onTextureLoaded(texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(boxWidth, boxWidth);

            var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                //color: 0x01BE00,
                side: THREE.BackSide
            });

            var skybox = new THREE.Mesh(geometry, material);
            VR_APP['scene'].add(skybox);
        }
        */
    }

    function onResize(e) {
        VR_APP['effect'].setSize(window.innerWidth, window.innerHeight);
        VR_APP['camera'].aspect = window.innerWidth / window.innerHeight;
        VR_APP['camera'].updateProjectionMatrix();
    }

    function createMessageText(index){
        if(VR_APP['font']){
            var textGeo = new THREE.TextGeometry(VR_APP['messages'][index]['text'], {
                font: VR_APP['font'],
                size: 0.25,
                height: 0.05,
                curveSegments: 0
            });

            var mesh = new THREE.Mesh( textGeo, textMaterial );
            console.log(mesh);
            mesh.position.set( -5, 10, -15 );
            //mesh.rotation.y = Math.PI;
            VR_APP['messages'][index]['mesh'] = mesh;
            VR_APP['scene'].add( mesh );
            return true;
        }

        return false;
    }

    function createMessageText2d(index){
        var canvas = document.createElement('canvas');
        var size = 512; // CHANGED
        canvas.width = size;
        canvas.height = size;
        var context = canvas.getContext('2d');
        context.fillStyle = '#ff0000'; // CHANGED
        context.textAlign = 'center';
        context.font = '16px Arial';
        var str = VR_APP['messages'][index]['text'];
        context.fillText(str.substring(0, str.length / 2), size / 2, size / 2);
        context.fillText(str.substring(str.length / 2, str.length), size / 2, size / 2 + 20);

        var amap = new THREE.Texture(canvas);
        amap.needsUpdate = true;

        var mat = new THREE.SpriteMaterial({
            map: amap,
            transparent: false,
            color: 0xffffff // CHANGED
        });

        var sp = new THREE.Sprite(mat);
        sp.scale.set( 5, 5, 1 ); // CHANGED
        sp.position.set(0, 10, -3);
        VR_APP['scene'].add(sp);
        VR_APP['messages'][index]['mesh'] = sp;
        return true;
    }

    function updateMessages(){
        var numberOfMesseges = 0;
        for(var i = VR_APP['messages'].length - 1; i >= 0; i--){
            if(VR_APP['messages'][i]['initialized']){

                numberOfMesseges += 1;
                VR_APP['messages'][i]['mesh'].position.y -= 0.02;
                if(VR_APP['messages'][i]['mesh'].position.y < -10){
                    VR_APP['scene'].remove(VR_APP['messages'][i]['mesh']);
                    VR_APP['messages'].splice(i, 1);
                    currentFrame = 0;
                }

            } else {
                if(canAdd){
                    currentFrame += 1;
                    if(currentFrame >= framesBetween){
                        currentFrame = 0;
                        VR_APP['messages'][i]['initialized'] = createMessageText2d(i);
                        canAdd = false;
                        console.log('ADDING...')
                    }
                } else {
                    currentFrame = 0;
                }
            }
        }

        if(numberOfMesseges < VR_APP['MAX_MESSAGES'] && canAdd === false){
            currentFrame = 0;
            canAdd = true;
        }
    }

    function animate(timestamp) {
        var delta = Math.min(timestamp - VR_APP['lastRender'], 500);
        VR_APP['lastRender'] = timestamp;

        //updateMessages();

        // Update VR headset position and apply to camera.
        VR_APP['controls'].update();

        // Render the scene through the manager.
        VR_APP['manager'].render(VR_APP['scene'], VR_APP['camera'], VR_APP['lastRender']);

        requestAnimationFrame(animate);
    }

    function show(){
        // Kick off animation loop
        animate(performance ? performance.now() : Date.now());
    }

    function destroy(){
        // remove all objects from the scene
    }

    return {
        initialize: initialize,
        show: show
    }
}());

VR_APP['screens']['main'].initialize();
VR_APP['screens']['main'].show();

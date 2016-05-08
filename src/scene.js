VR_APP['screens']['main'] = (function() {

    var framesBetween = 5000,
        currentFrame = 0,
        canAdd = false;

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

    function initialize(){
        VR_APP['lastRender'] = 0;

        window.addEventListener('resize', onResize, true);
        window.addEventListener('vrdisplaypresentchange', onResize, true);

        // Add a repeating grid as a skybox.
        var boxWidth = 20;
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

        updateMessages();

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

VR_APP['screens']['main'] = (function() {

    var framesBetween = 5000,
        currentFrame = 0,
        canAdd = false,
        loader = new THREE.TextureLoader();

    function onResize(e) {
        VR_APP.effect.setSize(window.innerWidth, window.innerHeight);
        VR_APP.camera.aspect = window.innerWidth / window.innerHeight;
        VR_APP.camera.updateProjectionMatrix();
    }

    function initialize(){
        VR_APP.lastRender = 0;

        window.addEventListener('resize', onResize, true);
        window.addEventListener('vrdisplaypresentchange', onResize, true);

        // Add a repeating grid as a skybox.
        var boxWidth = 20;
        //loader.load('/img/box.png', onTextureLoaded);
        //loader.load('/img/white.png', onTextureLoaded);
        loader.load('/img/background.png', onTextureLoaded);

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
            VR_APP.scene.add(skybox);
        }
    }

    function drawText(context, text, x, y, fillStyle) {
        context.fillStyle = fillStyle;
        context.fillText(text, x, y);
    }

    function drawLongText(context, text, x, y, fillStyle, size) {
        //text.replace(/https?:.*/, '')
        var words = text.split(' ');
        var currentWidth = 0;
        var currentWord = '';
        for(var i = 0; i < words.length; i++) {
            currentWidth += context.measureText(words[i]).width;
            console.log(currentWidth);
            if(currentWidth > size) {
                drawText(context, currentWord, x, y, fillStyle);
                currentWidth = 0;
                currentWord = words[i];
                y += 20;
            } else {
                currentWord += ' ' + words[i];
            }
        }

        if(currentWord != '') {
            drawText(context, currentWord, x, y, fillStyle);
        }
    }

    // Create a canvas object and draw text on it
    function createMessageText2d(index){
        var canvas = document.createElement('canvas');
        var size = 512;
        var context = canvas.getContext('2d');
        var tweet = VR_APP.messages[index];
        var img = new Image();
        var padding = 10;
        var spacing = 20;

        canvas.width = size;
        canvas.height = size;

        img.crossOrigin = 'anonymous';
        img.onload = function() {
            context.drawImage(img, 0, 0);
            VR_APP.messages[index].initialized = true;

            context.fillStyle = '#' + tweet.user.text_color;
            context.textAlign = 'left';
            context.font = '16px Arial';

            drawText(context, tweet.user.name, img.width + padding, 15, '#000000');
            drawText(context, '@' + tweet.user.screen_name, img.width + context.measureText(tweet.user.name).width + 15, 15, '#707070');

            drawLongText(context, tweet.text, img.width + padding, 45, '#000000', size / 2);

            var textureMap = new THREE.Texture(canvas);
            textureMap.needsUpdate = true;

            var material = new THREE.SpriteMaterial({
                map: textureMap,
                transparent: false,
                color: 0xffffff
            });

            var sprite = new THREE.Sprite(material);
            sprite.scale.set( 5, 5, 1 );
            sprite.position.set(0, 10, -3);

            VR_APP.scene.add(sprite);
            VR_APP.messages[index].mesh = sprite;
        };
        img.src = tweet.user.profile_image_url;
    }

    function updateMessages(){
        var numberOfMesseges = 0;
        for(var i = VR_APP.messages.length - 1; i >= 0; i--){
            if(VR_APP.messages[i].initialized){
                numberOfMesseges += 1;
                VR_APP.messages[i].mesh.position.y -= 0.02;
                if(VR_APP.messages[i].mesh.position.y < -10){
                    VR_APP.scene.remove(VR_APP.messages[i].mesh);
                    VR_APP.messages.splice(i, 1);
                    currentFrame = 0;
                }

            } else {
                if(canAdd){
                    currentFrame += 1;
                    if(currentFrame >= framesBetween){
                        currentFrame = 0;
                        createMessageText2d(i);
                        canAdd = false;
                    }
                } else {
                    currentFrame = 0;
                }
            }
        }

        if(numberOfMesseges < VR_APP.MAX_MESSAGES && canAdd === false){
            currentFrame = 0;
            canAdd = true;
        }
    }

    function animate(timestamp) {
        var delta = Math.min(timestamp - VR_APP.lastRender, 500);
        VR_APP.lastRender = timestamp;

        updateMessages();

        // Update VR headset position and apply to camera.
        VR_APP.controls.update();

        // Render the scene through the manager.
        VR_APP.manager.render(VR_APP.scene, VR_APP.camera, VR_APP.lastRender);

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

VR_APP.screens.main.initialize();
VR_APP.screens.main.show();

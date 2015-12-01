default:
	browserify src/main.js | derequire > build/webvr-manager.js

watch:
	watchify src/main.js -v -d -o build/webvr-manager.js

lint:
	jscs src/*.js

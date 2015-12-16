default:
	mkdir -p build
	browserify src/main.js > build/webvr-polyfill.js
	cp build/webvr-polyfill.js ../webvr-boilerplate/bower_components/webvr-polyfill/build/webvr-polyfill.js

watch:
	watchify src/main.js -v -d -o build/webvr-polyfill.js

lint:
	jscs src/*.js

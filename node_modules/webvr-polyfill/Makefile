OUT=build/webvr-polyfill.js

default:
	mkdir -p `dirname $(OUT)`
	browserify src/main.js | derequire > $(OUT)
	cp build/webvr-polyfill.js ../webvr-boilerplate/bower_components/webvr-polyfill/build/webvr-polyfill.js

watch:
	watchify src/main.js -v -d -o build/webvr-polyfill.js

lint:
	jscs src/*.js

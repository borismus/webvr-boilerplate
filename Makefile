default:
	browserify src/main.js | derequire > build/webvr-manager.js

watch:
	watchify src/main.js -v -d -o build/webvr-manager.js

test: test/*
	browserify test/device-info-test.js  > build/device-info-test.js

lint:
	jscs src/*.js

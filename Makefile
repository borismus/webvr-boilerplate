default:
		mkdir -p build
		browserify src/main.js > build/webvr-manager.js

device:
		browserify test/device-info-test.js > build/device-info-test.js

clean:
		rm build/webvr-manager.js
		rm build/device-info-test.js
		rmdir build

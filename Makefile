default:
	mkdir -p build
	browserify src/main.js > build/webvr-manager.js

clean:
	rm build/webvr-manager.js
	rmdir build

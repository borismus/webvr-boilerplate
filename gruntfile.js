module.exports = function(grunt) {

	/**
	 * grunt
	 * npm install -g grunt-cli
	 * @link http://sixrevisions.com/javascript/grunt-tutorial-01/
	 * @link https://www.npmjs.com/package/jsdoc
	 * @link http://gruntjs.com/getting-started
	 * grunt-jsdoc
	 * @link https://github.com/krampstudio/grunt-jsdoc
	 * grunt-contrib-copy
	 * @link https://www.npmjs.com/package/grunt-contrib-copy
	 * @link http://gruntjs.com/plugins
	 * grunt-ftp-push
	 * @link https://github.com/Robert-W/grunt-ftp-push
	 */

	//configure tasks
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		ftp_push : {
			plyo: {
				options: {
					username: 'plyojump@indiespace.com',
					password: 'E^k$&bs=nU8O',
					host: 'server57.web-hosting.com',
					dest: '/projects/webvr-boilerplate',
					port: 21
				},
				files: [
					{expand: true, cwd: 'asset_src', src:['*.*'], dest: './asset_src'},
					{expand: true, cwd: 'bower_components', src:['**'], dest: './bower_components'},
					{expand: true, cwd: 'build', src:['*.*'], dest: './build'},
					{expand: true, cwd: 'content_images', src:['*.*'], dest: './content_images'},
					{expand: true, cwd: 'img', src:['*.*'], dest: './img'},
					{expand: true, cwd: 'src', src:['*.*'], dest: './src'},
					{expand: true, cwd: 'test', src:['*.*'], dest: './test'},
					{expand: true, cwd: '.', src:['*.html'], dest: '.'}
				]
			}
		}
	});

	//load the plugin that provides the jsdoc task
	grunt.loadNpmTasks('grunt-ftp-push');

	// Default task(s).
	grunt.registerTask('default', ['ftp_push']);

};

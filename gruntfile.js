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
		jsdoc : {
			dist : {
				src: ['src/*.js', 'test/*.js'], 
				options: {
					destination: 'doc',
					template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/",
					configure : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
				}
			}
		},
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
					{
						expand: true,
						cwd: '.',
						src: ['/build/*.js', '!**/*.db']
					}
				]
			}
		}
	});

	//load the plugin that provides the jsdoc task
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-ftp-push');

	// Default task(s).
	grunt.registerTask('default', ['jsdoc', 'copy', 'ftp_push']);

};

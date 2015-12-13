/**
 * @author Michael Guerrero / http://realitymeltdown.com
 */

function BlendCharacterGui( blendMesh ) {

	var controls = {

		gui: null,
		"Show Model": true,
		"Show Skeleton": false,
		"Time Scale": 1.0,
		"Step Size": 0.016,
		"Crossfade Time": 3.5,
		"idle": 0.33,
		"walk": 0.33,
		"run": 0.33

	};

	var blendMesh = blendMesh;

	this.showModel = function() {

		return controls[ 'Show Model' ];

	};

	this.showSkeleton = function() {

		return controls[ 'Show Skeleton' ];

	};

	this.getTimeScale = function() {

		return controls[ 'Time Scale' ];

	};

	this.update = function( time ) {

		var getWeight = function( actionName ) {
			for( var i = 0; i < blendMesh.mixer.actions.length; i ++ ) {
				var action = blendMesh.mixer.actions[i];
				if( action.clip.name === actionName ) {
					return action.getWeightAt( time );	
				}
			}
			return 0;
		}
		controls[ 'idle' ] = getWeight( 'idle' );
		controls[ 'walk' ] = getWeight( 'walk' );
		controls[ 'run' ] = getWeight( 'run' );

	};

	var init = function() {

		controls.gui = new dat.GUI();

		var settings = controls.gui.addFolder( 'Settings' );
		var playback = controls.gui.addFolder( 'Playback' );
		var blending = controls.gui.addFolder( 'Blend Tuning' );

		settings.add( controls, "Show Model" ).onChange( controls.showModelChanged );
		settings.add( controls, "Show Skeleton" ).onChange( controls.showSkeletonChanged );
		settings.add( controls, "Time Scale", 0, 1, 0.01 );
		settings.add( controls, "Step Size", 0.01, 0.1, 0.01 );
		settings.add( controls, "Crossfade Time", 0.1, 6.0, 0.05 );

		// These controls execute functions
		playback.add( controls, "start" );
		playback.add( controls, "pause" );
		playback.add( controls, "step" );
		playback.add( controls, "idle to walk" );
		playback.add( controls, "walk to run" );
		playback.add( controls, "warp walk to run" );

		blending.add( controls, "idle", 0, 1, 0.01 ).listen().onChange( controls.weight );
		blending.add( controls, "walk", 0, 1, 0.01 ).listen().onChange( controls.weight );
		blending.add( controls, "run", 0, 1, 0.01 ).listen().onChange( controls.weight );

		settings.open();
		playback.open();
		blending.open();

	};

	var getAnimationData = function() {

		return {

			detail: {

				anims: [ "idle", "walk", "run" ],

				weights: [ controls[ 'idle' ],
						   controls[ 'walk' ],
						   controls[ 'run' ] ]
			}

		};

	};

	controls.start = function() {

		var startEvent = new CustomEvent( 'start-animation', getAnimationData() );
		window.dispatchEvent( startEvent );

	};

	controls.stop = function() {

		var stopEvent = new CustomEvent( 'stop-animation' );
		window.dispatchEvent( stopEvent );

	};

	controls.pause = function() {

		var pauseEvent = new CustomEvent( 'pause-animation' );
		window.dispatchEvent( pauseEvent );

	};

	controls.step = function() {

		var stepData = { detail: { stepSize: controls[ 'Step Size' ] } };
		window.dispatchEvent( new CustomEvent( 'step-animation', stepData ) );

	};

	controls.weight = function() {

		// renormalize
		var sum = controls[ 'idle' ] + controls[ 'walk' ] + controls[ 'run' ];
		controls[ 'idle' ] /= sum;
		controls[ 'walk' ] /= sum;
		controls[ 'run' ] /= sum;

		var weightEvent = new CustomEvent( 'weight-animation', getAnimationData() );
		window.dispatchEvent( weightEvent );

	};

	controls.crossfade = function( from, to ) {

		var fadeData = getAnimationData();
		fadeData.detail.from = from;
		fadeData.detail.to = to;
		fadeData.detail.time = controls[ "Crossfade Time" ];

		window.dispatchEvent( new CustomEvent( 'crossfade', fadeData ) );

	};

	controls.warp = function( from, to ) {

		var warpData = getAnimationData();
		warpData.detail.from = 'walk';
		warpData.detail.to = 'run';
		warpData.detail.time = controls[ "Crossfade Time" ];

		window.dispatchEvent( new CustomEvent( 'warp', warpData ) );

	};

	controls[ 'idle to walk' ] = function() {

		controls.crossfade( 'idle', 'walk' );

	};

	controls[ 'walk to run' ] = function() {

		controls.crossfade( 'walk', 'run' );

	};

	controls[ 'warp walk to run' ] = function() {

		controls.warp( 'walk', 'run' );

	};

	controls.showSkeletonChanged = function() {

		var data = {
			detail: {
				shouldShow: controls[ 'Show Skeleton' ]
			}
		};

		window.dispatchEvent( new CustomEvent( 'toggle-show-skeleton', data ) );

	};


	controls.showModelChanged = function() {

		var data = {
			detail: {
				shouldShow: controls[ 'Show Model' ]
			}
		};

		window.dispatchEvent( new CustomEvent( 'toggle-show-model', data ) );

	};


	init.call( this );

}

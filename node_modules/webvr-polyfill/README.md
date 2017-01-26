# WebVR Polyfill

A JavaScript implementation of the [WebVR spec][spec]. This project lets you use
WebVR today, without requiring a [special][moz] [browser][cr] build. It also
lets you view the same content without requiring a virtual reality viewer.

Take a look at [basic WebVR samples][samples] that use this polyfill.

[moz]: http://mozvr.com/
[cr]: https://drive.google.com/folderview?id=0BzudLt22BqGRbW9WTHMtOWMzNjQ
[samples]: https://toji.github.io/webvr-samples/
[spec]: https://mozvr.github.io/webvr-spec/

## Implementation

The polyfill decides which VRDisplays to provide, depending on the configuration
of your browser. Mobile devices provide the `CardboardVRDisplay`. Desktop devices
use the `MouseKeyboardVRDisplay`.

`CardboardVRDisplay` uses DeviceMotionEvents to implement a complementary
filter which does [sensor fusion and pose prediction][fusion] to provide
orientation tracking. It can also render in stereo mode, and includes mesh-based
lens distortion. This display also includes user interface elements in VR mode
to make the VR experience more intuitive, including:

- A gear icon to select your VR viewer.
- A back button to exit VR mode.
- An interstitial which only appears in portrait orientation, requesting you switch
  into landscape orientation (if [orientation lock][ol] is not available).

`MouseKeyboardVRDisplay` uses mouse events to allow you to do the equivalent of
mouselook. It also uses keyboard arrows keys to look around the scene
with the keyboard.

[fusion]: http://smus.com/sensor-fusion-prediction-webvr/
[ol]: https://www.w3.org/TR/screen-orientation/


## Configuration

The polyfill can be configured and debugged with various options. The following
are supported:

```javascript
WebVRConfig = {
  // Flag to disabled the UI in VR Mode.
  CARDBOARD_UI_DISABLED: false, // Default: false

  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: true, // Default: false.

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98, // Default: 0.98.

  // Flag to disable the instructions to rotate your device.
  ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040, // Default: 0.040.

  // Flag to disable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: false, // Default: true.

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: true, // Default: false.

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: true, // Default: false.

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: true, // Default: false.

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: true, // Default: false.

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  BUFFER_SCALE: 0.5, // Default: 0.5.

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: true // Default: false.
}
```

## Performance

Performance is critical for VR. If you find your application is too sluggish,
consider tweaking some of the above parameters. In particular, keeping
`BUFFER_SCALE` at 0.5 (the default) will likely help a lot.

## Development

If you'd like to contribute to the `webvr-poyfill` library, check out
the repository and install
[Node](https://nodejs.org/en/download/package-manager/) and the dependencies:

```bash
git clone https://github.com/borismus/webvr-polyfill
cd webvr-polyfill
npm install
```


## License

This program is free software for both commercial and non-commercial use,
distributed under the [Apache 2.0 License](COPYING).

# WebVR Polyfill

This project provides a JavaScript implementation of the [WebVR
spec][spec].

The goal of this project is two fold:

1. Use WebVR today, without requiring a special browser build.
2. View (mono) content without a virtual reality headset.

[spec]: http://mozvr.github.io/webvr-spec/webvr.html

## Implementation

The polyfill decides which VRDevices to provide, depending on the configuration
of your browser. Mobile devices provide both the FusedPositionSensorVRDevice and
the CardboardHMDVRDevice. Desktop devices use the
MouseKeyboardPositionSensorVRDevice.

`CardboardHMDVRDevice` provides default parameters for Cardboard's
interpupillary distance and headset.

`MouseKeyboardPositionSensorVRDevice` uses mouse events to allow you to do the
equivalent of mouselook. It also uses keyboard arrows and WASD keys to look
around the scene with the keyboard.

`FusedPositionSensorVRDevice` uses DeviceMotionEvents and implements a
complementary filter which does sensor fusion. This device also implements pose
prediction, which greatly improves head tracking performance.

**Deprecated**: `OrientationPositionSensorVRDevice` uses DeviceOrientationEvents
to polyfill head-tracking on mobile devices.

**Experimental**: `WebcamPositionSensorVRDevice` uses your laptop's webcam in
order to introduce translational degrees of freedom.

[ss]: https://play.google.com/store/apps/details?id=com.motorola.avatar

## Configuration

The polyfill can be configured and debugged with various options. The following
are supported:

    WebVRConfig = {
      // Forces availability of VR mode.
      //FORCE_ENABLE_VR: true, // Default: false.
      // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
      //K_FILTER: 0.98, // Default: 0.98.
      // How far into the future to predict during fast motion.
      //PREDICTION_TIME_S: 0.050, // Default: 0.050s.
      // Flag to disable touch panner. In case you have your own touch controls
      //TOUCH_PANNER_DISABLED: true, // Default: false.
    }

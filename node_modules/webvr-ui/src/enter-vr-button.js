// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

import WebVRManager from './webvr-manager';
import {createDefaultView} from './dom';
import State from './states';
import EventEmitter from 'eventemitter3';

/**
 * A button to allow easy-entry and messaging around a WebVR experience
 * @class
 */
export default class EnterVRButton extends EventEmitter {
  /**
   * Construct a new Enter VR Button
   * @constructor
   * @param {HTMLCanvasElement} sourceCanvas the canvas that you want to present in WebVR
   * @param {Object} [options] optional parameters
   * @param {HTMLElement} [options.domElement] provide your own domElement to bind to
   * @param {Boolean} [options.injectCSS=true] set to false if you want to write your own styles
   * @param {Function} [options.beforeEnter] should return a promise, opportunity to intercept request to enter
   * @param {Function} [options.beforeExit] should return a promise, opportunity to intercept request to exit
   * @param {Function} [options.onRequestStateChange] set to a function returning false to prevent default state changes
   * @param {string} [options.textEnterVRTitle] set the text for Enter VR
   * @param {string} [options.textVRNotFoundTitle] set the text for when a VR display is not found
   * @param {string} [options.textExitVRTitle] set the text for exiting VR
   * @param {string} [options.color] text and icon color
   * @param {string} [options.background] set to false for no brackground or a color
   * @param {string} [options.corners] set to 'round', 'square' or pixel value representing the corner radius
   * @param {string} [options.disabledOpacity] set opacity of button dom when disabled
   * @param {string} [options.cssprefix] set to change the css prefix from default 'webvr-ui'
   */
  constructor(sourceCanvas, options) {
    super();
    options = options || {};

    options.color = options.color || 'rgb(80,168,252)';
    options.background = options.background || false;
    options.disabledOpacity = options.disabledOpacity || 0.5;
    options.height = options.height || 55;
    options.corners = options.corners || 'square';
    options.cssprefix = options.cssprefix || 'webvr-ui';

    options.textEnterVRTitle = options.textEnterVRTitle || 'ENTER VR';
    options.textVRNotFoundTitle = options.textVRNotFoundTitle || 'VR NOT FOUND';
    options.textExitVRTitle = options.textExitVRTitle || 'EXIT VR';

    options.onRequestStateChange = options.onRequestStateChange || (() => true);
    options.beforeEnter = options.beforeEnter || (()=> new Promise((resolve)=> resolve()));
    options.beforeExit = options.beforeExit || (()=> new Promise((resolve)=> resolve()));

    options.injectCSS = options.injectCSS !== false;

    this.options = options;


    this.sourceCanvas = sourceCanvas;

    // Pass in your own domElement if you really dont want to use ours
    this.domElement = options.domElement || createDefaultView(options);
    this.__defaultDisplayStyle = this.domElement.style.display || 'initial';

    // Create WebVR Manager
    this.manager = new WebVRManager();
    this.manager.checkDisplays();
    this.manager.addListener('change', (state)=> this.__onStateChange(state));

    // Bind button click events to __onClick
    this.domElement.addEventListener('click', ()=> this.__onEnterVRClick());

    this.__forceDisabled = false;
    this.setTitle(this.options.textEnterVRTitle);
  }

  /**
   * Set the title of the button
   * @param {string} text
   * @return {EnterVRButton}
   */
  setTitle(text) {
    this.domElement.title = text;
    ifChild(this.domElement, this.options.cssprefix, 'title', (title)=> {
      if (!text) {
        title.style.display = 'none';
      } else {
        title.innerText = text;
        title.style.display = 'initial';
      }
    });

    return this;
  }

  /**
   * Set the tooltip of the button
   * @param {string} tooltip
   * @return {EnterVRButton}
   */
  setTooltip(tooltip) {
    this.domElement.title = tooltip;
    return this;
  }

  /**
   * Show the button
   * @return {EnterVRButton}
   */
  show() {
    this.domElement.style.display = this.__defaultDisplayStyle;
    this.emit('show');
    return this;
  }

  /**
   * Hide the button
   * @return {EnterVRButton}
   */
  hide() {
    this.domElement.style.display = 'none';
    this.emit('hide');
    return this;
  }

  /**
   * Enable the button
   * @return {EnterVRButton}
   */
  enable() {
    this.__setDisabledAttribute(false);
    this.__forceDisabled = false;
    return this;
  }

  /**
   * Disable the button from being clicked
   * @return {EnterVRButton}
   */
  disable() {
    this.__setDisabledAttribute(true);
    this.__forceDisabled = true;
    return this;
  }

  /**
   * clean up object for garbage collection
   */
  remove() {
    this.manager.remove();

    if (this.domElement.parentElement) {
      this.domElement.parentElement.removeChild(this.domElement);
    }
  }

  /**
   * Returns a promise getting the VRDisplay used
   * @return {Promise.<VRDisplay>}
   */
  getVRDisplay() {
    return WebVRManager.getVRDisplay();
  }

  /**
   * Check if the canvas the button is connected to is currently presenting
   * @return {boolean}
   */
  isPresenting() {
    return this.state === State.PRESENTING || this.state == State.PRESENTING_FULLSCREEN;
  }

  /**
   * Request entering VR
   * @return {Promise}
   */
  requestEnterVR() {
    return new Promise((resolve, reject)=> {
      if (this.options.onRequestStateChange(State.PRESENTING)) {
        return this.options.beforeEnter()
          .then(()=> this.manager.enterVR(this.manager.defaultDisplay, this.sourceCanvas))
          .then(resolve);
      } else {
        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
      }
    });
  }

  /**
   * Request exiting presentation mode
   * @return {Promise}
   */
  requestExit() {
    const initialState = this.state;

    return new Promise((resolve, reject)=> {
      if (this.options.onRequestStateChange(State.READY_TO_PRESENT)) {
        return this.options.beforeExit()
          .then(()=>
            // if we were presenting VR, exit VR, if we are
            // exiting fullscreen, exit fullscreen
            initialState === State.PRESENTING ?
              this.manager.exitVR(this.manager.defaultDisplay) :
              this.manager.exitFullscreen())
          .then(resolve);
      } else {
        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
      }
    });
  }

  /**
   * Request entering the site in fullscreen, but not VR
   * @return {Promise}
   */
  requestEnterFullscreen() {
    return new Promise((resolve, reject)=> {
      if (this.options.onRequestStateChange(State.PRESENTING_FULLSCREEN)) {
        return this.options.beforeEnter()
          .then(()=>this.manager.enterFullscreen(this.sourceCanvas))
          .then(resolve);
      } else {
        reject(new Error(State.ERROR_REQUEST_STATE_CHANGE_REJECTED));
      }
    });
  }

  /**
   * Set the disabled attribute
   * @param {boolean} disabled
   * @private
   */
  __setDisabledAttribute(disabled) {
    if (disabled || this.__forceDisabled) {
      this.domElement.setAttribute('disabled', 'true');
    } else {
      this.domElement.removeAttribute('disabled');
    }
  }

  /**
   * Handling click event from button
   * @private
   */
  __onEnterVRClick() {
    if (this.state == State.READY_TO_PRESENT) {
      this.requestEnterVR();
    } else if (this.isPresenting()) {
      this.requestExit();
    }
  }

  /**
   * @param {State} state the state that its transitioning to
   * @private
   */
  __onStateChange(state) {
    if (state != this.state) {
      if (this.state === State.PRESENTING || this.state === State.PRESENTING_FULLSCREEN) {
        this.emit('exit');
      }
      this.state = state;

      switch (state) {
        case State.READY_TO_PRESENT:
          this.show();
          this.setTitle(this.options.textEnterVRTitle);
          if (this.manager.defaultDisplay) {
            this.setTooltip('Enter VR using ' + this.manager.defaultDisplay.displayName);
          }
          this.__setDisabledAttribute(false);
          this.emit('ready');
          break;

        case State.PRESENTING:
        case State.PRESENTING_FULLSCREEN:
          if (!this.manager.defaultDisplay ||
            !this.manager.defaultDisplay.capabilities.hasExternalDisplay ||
            state == State.PRESENTING_FULLSCREEN) {
            this.hide();
          }
          this.setTitle(this.options.textExitVRTitle);
          this.__setDisabledAttribute(false);
          this.emit('enter');
          break;

        // Error states
        case State.ERROR_BROWSER_NOT_SUPPORTED:
          this.show();
          this.setTitle(this.options.textVRNotFoundTitle);
          this.setTooltip('Browser not supported');
          this.__setDisabledAttribute(true);
          this.emit('error', new Error(state));
          break;

        case State.ERROR_NO_PRESENTABLE_DISPLAYS:
          this.show();
          this.setTitle(this.options.textVRNotFoundTitle);
          this.setTooltip('No VR headset found.');
          this.__setDisabledAttribute(true);
          this.emit('error', new Error(state));
          break;

        case State.ERROR_REQUEST_TO_PRESENT_REJECTED:
          this.show();
          this.setTitle(this.options.textVRNotFoundTitle);
          this.setTooltip('Something went wrong trying to start presenting to your headset.');
          this.__setDisabledAttribute(true);
          this.emit('error', new Error(state));
          break;

        case State.ERROR_EXIT_PRESENT_REJECTED:
        default:
          this.show();
          this.setTitle(this.options.textVRNotFoundTitle);
          this.setTooltip('Unknown error.');
          this.__setDisabledAttribute(true);
          this.emit('error', new Error(state));
      }
    }
  }
}

/**
 * Function checking if a specific css class exists as child of element.
 *
 * @param {HTMLElement} el element to find child in
 * @param {string} cssPrefix css prefix of button
 * @param {string} suffix class name
 * @param {function} fn function to call if child is found
 * @private
 */
const ifChild = (el, cssPrefix, suffix, fn)=> {
  const c = el.querySelector('.' + cssPrefix + '-' + suffix);
  c && fn(c);
};

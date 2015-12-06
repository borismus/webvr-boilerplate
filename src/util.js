/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isFirefox = function() {
  return /firefox/i.test(navigator.userAgent);
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Set ID and classes on Player elements and settings dialog.
// TODO: change name to Util.playerSelectors
Util.containerClasses = {
  prefix: 'webvr-',
  dom: 'webvr-dom-container',
  player: 'webvr-player',
  caption: 'webvr-player-caption',
  controls: 'webvr-controls',
  back: 'webvr-button-back',
  backId: 'webvr-button-back-id',
  fullscreen: 'webvr-button-fullscreen',
  vr: 'webvr-button-vr',
  settings: 'webvr-settings',
  canvas: 'webvr-canvas',
  caption: 'webvr-player-caption',
  placeholderId: 'webvr-placeholder-id'
};

// Get a unique, incrementing Id value for objects.
// This implies that Util should be shared among multiple WebVRManager objects on the same page.
Util.getUniqueId = (function(prefix) {
  var i = Math.floor(Math.random() * 999) + 100;
  var pfx = prefix;
  function inc(pfx) {
    if (!pfx) {
      pfx = ''; 
    } else {
      pfx += '-';
    }
    return pfx + i++;
  }
  return inc;
})();

Util.hasClass = function(elem, selector) {
  if (elem.className.indexOf(selector) >= 0) {
    return true;
  }
  return false;
};

Util.addClass = function(elem, selector) {
  if (!this.hasClass(elem, selector)) {
    if (elem.className == '') {
      elem.className = selector;
    } else {
      elem.className += ' ' + selector;
    }
  }
};

// Get all current DOM children (not descendants) of document.body.
Util.getDOMChildren = function() {
  return document.querySelectorAll('body > *');
};

// Find child elements by their tag type.
Util.findChildrenByType = function(elem, types) {
  var typeStr;
  var arr = [];
  if (Array.isArray(types)) {
    typeStr = types.toString();
  } else {
    typeStr = types;
  }
  typeStr = typeStr.toUpperCase();
  var children = elem.children;
  var len = children.length;
  for (var i = 0; i < len; i++) {
    if (typeStr.indexOf(children[i].tagName) >= 0) {
      arr.push(children[i]);
    }
  }
  return arr;
};

// Need something more general than Element.querySelector.
Util.findChildrenByTitle = function(elem, titleStr) {
  var arr = [];
  var children = elem.children;
  var len = children.length;
  for (var i = 0; i < len; i++) {
    console.log("title:" + children[i].title + " str:" + titleStr);
    if(children[i].title == titleStr) {
      arr.push(children[i]);
    }
  }
  return arr;
}

// Check to see if there are any tags other than <canvas>, <script>, <img> in document.body.
// Used to keep boilerplate default separate canvas embedded in page layout.
// Note: this will return TRUE after the Player wraps a 'naked' canvas during initialization!
// TODO: change name to isThereALayout()
Util.isThereALayout = function() {
  console.log('running istheradom');
  var n = this.getDOMChildren();
  if (n && n.length > 0) {
    //these three tags are used by default WebVR boilerplate
    var len = n.length;
    for (var i = 0; i < len; i++) {
      if (n[i].tagName != 'CANVAS' && n[i].tagName != 'SCRIPT' && n[i].tagName != 'IMG') {
        //TODO: check for placeholder elements (not considered part of layout DOM).
        console.log('found a dom');
        return true;
      }
    }
  }
  console.log('no dom besides canvas');
  return false;
};

// Wrap the entire DOM in a container tag (if not present), and add classes.
Util.wrapDOM = function(selector) {
  var n = this.getDOMChildren();
  var domCount = 0;
  var len;

  // Assign default CSS selector if necessary
  if (!selector) {
    selector = Util.containerClasses.dom;
  }

  //if we have a container,there is only one DOM child, plus <scripts>
  if (n && n[0]) {
    len = n.length;
    for (var i = 0; i < len; i++) {
      if (n[i].tagName != 'SCRIPT') {
        domCount++;
      }
    }

    if (domCount == 1) {
      console.log('only one element visible, don\'t need to wrap');
      //only one child of document.body -which can be a container
      if (!(n.className.indexOf(selector) >= 0)) {
        //add our WebVR class to the container
        console.log('adding webvr class' + selector + to);
        n[0].className += ' ' + selector; //faster than regex
        return true;
      }
    } else {
      //catch incorrect manual wrapping (e.g. bad HTML markup)
      var container = document.getElementsByClassName(Util.containerClasses.dom)[0];
      if (container) {
        console.log('Warning: defined container class doesn\'t enclose all non-script DOM elements');
        for (i = 0; i < len; i++) {
          if (n[i] != container && n[i].tagName != 'SCRIPT') {
            container.appendChild(n[i]);
          }
        }
        return false;
      }
      console.log('need to wrap stuff');
      var container = document.createElement('div');
      container.className = selector; i = 1;
      document.body.appendChild(container);
      if (container.parentNode == document.body) {
        for (i = 1; i < len; i++) {
          if (n[i].tagName != 'SCRIPT') {
            container.appendChild(n[i]);
          }
        }
        return true;
      }
    }
  }
  return false;
};

// Swap two nodes in the DOM, preserving event handlers.
// From: http://stackoverflow.com/questions/9732624/how-to-swap-dom-child-nodes-in-javascript
Util.swapNodes = function(elem1, elem2) {
  if (elem1 && elem2) {
    var p1 = elem1.parentNode;
    var t1 = document.createElement('span');
    p1.insertBefore(t1, elem1);

    var p2 = elem2.parentNode;
    var t2 = document.createElement('span');
    p2.insertBefore(t2, elem2);

    p1.insertBefore(elem2, t1);
    p2.insertBefore(elem1, t2);

    p1.removeChild(t1);
    p2.removeChild(t2);
  }
};


// Get more CSS-related properties for an element (non-integer).
Util.getDOMStyles = function(elem) {
  var styles = elem.getBoundingClientRect();
  if (!styles.width) {
    styles.width = parseFloat(getComputedStyle(elem).getPropertyValue('width'));
  }
  if (!styles.height) {
    styles.height = parseFloat(getComputedStyle(elem).getPropertyValue('height'));
  }
  styles.position = getComputedStyle(elem.domElement).getPropertyValue('position');
  styles.zIndex = getComputedStyle(elem).getPropertyValue('zIndex');
  return styles;
};

Util.isFullScreen = function() {
  if (document.fullscreen ||
    document.mozFullScreen ||
    document.webkitIsFullScreen ||
    document.msFullscreenElement) {
    return true;
  }
  return false;
};

Util.appendQueryParameter = function(url, key, value) {
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};


module.exports = Util;

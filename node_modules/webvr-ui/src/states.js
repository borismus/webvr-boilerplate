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

// Not yet presenting, but ready to present
const READY_TO_PRESENT = 'ready';

// In presentation mode
const PRESENTING = 'presenting';
const PRESENTING_FULLSCREEN = 'presenting-fullscreen';

// Checking device availability
const PREPARING = 'preparing';

// Errors
const ERROR_NO_PRESENTABLE_DISPLAYS = 'error-no-presentable-displays';
const ERROR_BROWSER_NOT_SUPPORTED = 'error-browser-not-supported';
const ERROR_REQUEST_TO_PRESENT_REJECTED = 'error-request-to-present-rejected';
const ERROR_EXIT_PRESENT_REJECTED = 'error-exit-present-rejected';
const ERROR_REQUEST_STATE_CHANGE_REJECTED = 'error-request-state-change-rejected';
const ERROR_UNKOWN = 'error-unkown';

export default {
  READY_TO_PRESENT,
  PRESENTING,
  PRESENTING_FULLSCREEN,
  PREPARING,
  ERROR_NO_PRESENTABLE_DISPLAYS,
  ERROR_BROWSER_NOT_SUPPORTED,
  ERROR_REQUEST_TO_PRESENT_REJECTED,
  ERROR_EXIT_PRESENT_REJECTED,
  ERROR_REQUEST_STATE_CHANGE_REJECTED,
  ERROR_UNKOWN,
};

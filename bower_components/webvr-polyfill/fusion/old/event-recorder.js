function EventRecorder(eventName, fields) {
  this.log = {
    eventName: eventName,
    fields: fields,
    startTime: (new Date()).valueOf(),
    data: []
  };

  this.eventName = eventName;
  this.fields = fields;
}

EventRecorder.prototype.start = function() {
  this.eventHandler = this.onEvent_.bind(this);
  window.addEventListener(this.eventName, this.eventHandler);
};

EventRecorder.prototype.stop = function() {
  window.removeEventListener(this.eventHandler);
};

EventRecorder.prototype.save = function() {
  return this.log;
};

EventRecorder.prototype.onEvent_ = function(e) {
  var datum = {};

  // Copy all of the fields.
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    if (e[field]) {
      datum[field] = e[field];
    }
  }
  
  // Timestamp it with the current time.
  datum.eventTimestamp = (new Date().valueOf());
  this.log.data.push(datum);
};

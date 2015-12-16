function SensorHistory() {
  this.data = new CBuffer(100);
}

SensorHistory.prototype.push = function(sensorSample) {
  this.data.push(sensorSample);
};

SensorHistory.prototype.sd = function() {
};

SensorHistory.prototype.mean = function() {
};

SensorHistory.prototype.last = function() {
};

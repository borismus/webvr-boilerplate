/**
 * Responsible for showing the vertical alignment UI that separates left and
 * right eye images.
 */
function Aligner() {
  var el = document.createElement('div');
  var s = el.style;
  s.position = 'fixed';
  s.background = 'white';
  s.width = '2px';
  s.top = '0px';
  s.bottom = '48px';
  s.left = '50%';
  s.display = 'none';
  s.marginLeft = '-2px';
  s.border = '1px solid black';
  s.borderTop = '0px';
  this.el = el;

  document.body.appendChild(el);
}

Aligner.prototype.show = function() {
  this.el.style.display = 'block';
};

Aligner.prototype.hide = function() {
  this.el.style.display = 'none';
};

module.exports = Aligner;

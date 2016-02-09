module.exports = function test(name, setup, fn) {
	var itter = 1;
	if (!fn) {
		fn = setup;
		setup = false;
	}
	// first generate reliable number of itterations for test
	(function genItter() {
		var iniT = exec(fn, setup, itter);
		if (iniT > 300) {
			setTimeout(function () {
				runTest(name, itter, fn, setup);
			}, 100);
		} else {
			if (iniT < 10) itter *= 10;
			else itter *= 2;
			setTimeout(genItter, 30);
		}
	}());
};

function runTest(name, itter, fn, setup) {
	var iniT = exec(fn, setup, itter);
	console.log(name, ':', (itter / iniT * 1000).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'), 'op/s');
};

function exec(fn, setup, i) {
	var cum = 0,
	    iniT;
	while (--i >= 0) {
		if (setup) setup();
		iniT = -Date.now();
		fn();
		iniT += Date.now();
		cum += iniT;
	}
	return cum;
}

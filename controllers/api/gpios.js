/**
 * GpioController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */



var sleep = require('sleep');
var Device = require('../../services/device');

var localDevice = null;

if (!localDevice) {
  Device.getDeviceModel().then(function(device) {
    localDevice = device;
  });
}

var self = {


  reset: function(req, res) {
    console.log('begin reset');
    var GpioObj = self._getGpoObj();
    var errorMessage;
    var gpios = [];
    var direction = req.param('direction') || 'in';
    var value = req.param('value') || '0';

    if (direction !== 'in' && direction !== 'out') {
      errorMessage = 'The direction should be "in" or "out"';
      console.log(errorMessage);
      console.log('end reset');
      return res.json({
        status: 'failed',
        message: errorMessage
      });
    }

    if (value !== '1' && value !== '0') {
      errorMessage = 'The value should be "1" or "0"';
      console.log(errorMessage);
      console.log('end reset');
      return res.json({
        status: 'failed',
        message: errorMessage
      });
    }

    for (var i = 1; i < localDevice.gpios.length; i++) {
      try {
        var gpio = new GpioObj(localDevice.gpios[i].number, 'in');
        //gpio.writeSync(0);

        gpios.push(localDevice.gpios[i]);
        console.log('+set alls gpios to "in" direction');

      } catch (e) {
        console.log(e);
        console.log('end reset');
      }
    }

    console.log('end reset');
    return res.json({
      status: 'ok',
      gpios: gpios
    });
  },
  changeState: function(req, res) {
    if (process.env.DEBUG === "*") {
      console.log('begin changeState');
    }
    var type = 'inOut';
    var GpioObj = self._getGpoObj();
    var lowTime = 7500000;
    var mediunTime = 6000000;
    var hightTime = 4500000;

    var number = req.param('number');
    var state = req.param('state');
    var reqType = req.param('type');
    var errorMessage;
    var value = 0;
    var currentValue = 0;

    if (reqType && reqType !== 'inOut' && reqType !== 'in01' && reqType !== 'out01' && reqType !== 'out10') {
      errorMessage = 'The type should be "inOut", "in01", "out10" or "out01"';
      console.log(errorMessage);
      if (process.env.DEBUG === "*") {
        console.log('end changeState');
      }
      return res.json({
        status: 'failed',
        message: errorMessage
      });
    }
    if (reqType) {
      type = reqType;
    }

    if (state !== 'on' && state !== 'off' && state !== 'onDimmer' && state !== 'offDimmer' && state !== 'onoff' && state !== 'start' && state !== 'stop' && state !== 'low' && state !== 'mediun' && state !== 'hight') {
      errorMessage = 'The state should be "on","off","onDimmer","offDimmer","change","start","stop","low","mediun" or "hight"';
      console.log(errorMessage);
      console.log('end changeState');
      return res.json({
        status: 'failed',
        message: errorMessage
      });
    }
    if (!number) {
      errorMessage = 'The "number" is required.';
      console.log(errorMessage);
      if (process.env.DEBUG === "*") {
        console.log('end changeState');
      }
      return res.json({
        status: 'failed',
        message: errorMessage
      });
    }

    var error = self._checkNumber(number);
    if (error) {
      console.log(error.message);
      if (process.env.DEBUG === "*") {
        console.log('end changeState');
      }
      return res.json(error);
    }

    try {



      if (type === 'inOut') {

        if (state === 'start') {
          self._setOut(number);
          direction = 'out';
        }

        if (state === 'stop') {
          self._setIn(number);
          direction = 'in';
        }

        if (state === 'on') {
          self._setOut(number);
          direction = 'out';
        }

        if (state === 'off') {
          self._setIn(number);
          direction = 'in';
        }

        if (state === 'onDimer') {

          self._setOut(number);
          sleep.usleep(2000000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          direction = 'in';
        }

        if (state === 'offDimer') {
          self._setOut(number);
          sleep.usleep(2000000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          direction = 'in';
        }
        if (state === 'low') {
          self._setOut(number);
          sleep.usleep(2000000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(lowTime);
          self._setIn(number);

          direction = 'in';
        }

        if (state === 'mediun') {
          self._setOut(number);
          sleep.usleep(3500000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(mediunTime);
          self._setIn(number);

          direction = 'in';
        }

        if (state === 'hight') {
          self._setOut(number);
          sleep.usleep(2000000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(500000);
          self._setIn(number);

          sleep.usleep(1000000);

          self._setOut(number);
          sleep.usleep(hightTime);
          self._setIn(number);

          direction = 'in';
        }

        if (state === 'onoff') {
          var waitMicroseconds = parseInt(req.param('wait')) || 500000;
          self._setOut(number);
          sleep.usleep(waitMicroseconds);
          self._setIn(number);
          direction = 'out';
        }
      } else if (type === 'out01') {
        if (state === 'on') {
          self._setOut(number, 1);
          direction = 'out';
          value = 1;
        }

        if (state === 'off') {
          self._setOut(number, 0);
          direction = 'out';
          value = 0;
        }

        if (state === 'onoff') {
          var waitMicroseconds = parseInt(req.param('wait')) || 500000;
          self._setOut(number, 1);
          sleep.usleep(waitMicroseconds);
          self._setOut(number, 0);
          direction = 'out';
          value = 0;
        }
      } else if (type === 'out10') {
        if (state === 'off') {
          self._setOut(number, 1);
          direction = 'out';
          value = 1;
        }

        if (state === 'on') {
          self._setOut(number, 0);
          direction = 'out';
          value = 0;
        }

        if (state === 'onoff') {
          var waitMicroseconds = parseInt(req.param('wait')) || 500000;
          self._setOut(number, 1);
          sleep.usleep(waitMicroseconds);
          self._setOut(number, 0);
          direction = 'out';
          value = 0;
        }
      }




    } catch (e) {
      console.log(e);
      console.log('end changeState');
    }
    if (process.env.DEBUG === "*") {
      console.log('end changeState');
    }
    return res.json({
      status: 'ok',
      gpio: {
        number: number,
        direction: direction,
        value: value
      }
    });

  },
  set: function(req, res) {
    if (process.env.DEBUG === "*") {
      console.log('begin setGpio');
    }
    var GpioObj = self._getGpoObj();
    var errorMessage;
    var number = req.param('number');
    var error = self._checkNumber(number);
    if (error) {
      console.log(error.message);
      if (process.env.DEBUG === "*") {
        console.log('end setGpio');
      }
      return res.json(error);
    }

    var direction = 'out';

    if (req.param('direction')) {
      direction = req.param('direction');
    }
    var value = null;
    if (direction === 'out') {
      value = req.param('value');


      if (value !== '1' && value !== '0') {
        errorMessage = 'The value should be "1" or "0"';
        console.log(errorMessage);
        if (process.env.DEBUG === "*") {
          console.log('end setGpio');
        }
        return res.json({
          status: 'failed',
          message: errorMessage
        });
      }

      if (value === 'on' || value === '1') {
        value = 1;
      }
      if (value === 'off' || value === '0') {
        value = 0;
      }

      try {
        var gpio = new GpioObj(number, direction);
        gpio.writeSync(value);
        if (process.env.DEBUG === "*") {
          console.log('+set(' + direction + ') gpio' + number + ' to ' + value);
        }


      } catch (e) {
        console.log(e);
        if (process.env.DEBUG === "*") {
          console.log('end setGpio');
        }
      }
    } else {
      try {
        var gpioForRead = new GpioObj(number, direction);
        value = gpioForRead.readSync(value);
        if (process.env.DEBUG === "*") {
          console.log('+get(' + direction + ') gpio' + number + ' -> ' + value);
        }

      } catch (e) {
        console.log(e);
        if (process.env.DEBUG === "*") {
          console.log('end setGpio');
        }
      }
    }

    if (process.env.DEBUG === "*") {
      console.log('end setGpio');
    }
    return res.json({
      status: 'ok',
      gpio: {
        number: number,
        direction: direction,
        value: value
      }
    });
  },
  get: function(req, res) {

    var number = req.param('number');
    var gpioValue = 0;
    var error = self._checkNumber(number);
    if (error) {
      console.log(error.message);
      if (process.env.DEBUG === "*") {
        console.log('end get');
      }
      return res.json(error);
    }
    Device.getGpioInfo(number).then(function(gpio) {
      if (process.env.DEBUG === "*") {
        console.log('+the gpio ' + number + ': ');
        console.log(gpio);
        console.log('end get');
      }

      return res.json({
        status: 'ok',
        gpio: gpio
      });
    });
  },
  getDhtSensor: function(req, res) {
    if (process.env.DEBUG === "*") {
      console.log('start getDhtSensor');
    }
    var number = parseInt(req.param('number'));
    var error = self._checkNumber(number);
    if (error) {
      console.log(error.message);
      if (process.env.DEBUG === "*") {
        console.log('end getDhtSensor');
      }
      return res.json(error);
    }
    var sensorLib = require('node-dht-sensor');
    var sensor = {
      initialize: function() {
        return sensorLib.initialize(22, number);
      },
      read: function() {
        var readout;
        var counter = 0;
        do {
          readout = sensorLib.read();
          counter = counter + 1;
        } while (readout && readout.temperature <= 0 && counter < 1000);

        if (process.env.DEBUG === "*") {
          console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
          'humidity: ' + readout.humidity.toFixed(2) + '%');
        }
        if (process.env.DEBUG === "*") {
          console.log('end getDhtSensor');
        }
        return res.json({
          temperature: readout.temperature,
          humidity: readout.humidity
        });
      }
    };
    if (sensor.initialize()) {
      sensor.read();
    } else {
      console.warn('Failed to initialize sensor');
      if (process.env.DEBUG === "*") {
        console.log('end getDhtSensor');
      }
    }
  },
  getAnalogValue: function(req, res) {
    var luminance = -1;
    try {

      var number = parseInt(req.param('number'));
      var ArduinoFirmata = require('arduino-firmata');
      var arduino = new ArduinoFirmata();

      var responseSend = false;


      arduino.connect(); // use default arduino
      //arduino.connect('/dev/tty.usb-device-name');

      arduino.on('connect', function() {
        console.log('board version' + arduino.boardVersion);
        luminance = arduino.analogRead(number);
        return res.json({
          luminance: luminance
        });
      });
    } catch (e) {
      return res.json({
        luminance: luminance
      });
    }

  },
  getAvailablesGpios: function(req, res) {
    var where = req.param('where');
    where.owner = null;
    Gpio.find(where).populate('owner')
      .then(function(result) {
        res.json(result.map(function(gpio) {
          return {
            number: gpio.number,
            ip: gpio.ip
          };
        }));
      });

  },
  getDeviceGpios: function(req, res) {
    Device.getDeviceModel().then(function(device) {
      res.json(device.gpios);
    });
  },
  updateVirtualGpio: function(req, res) {
    var ip = req.param('ip');
    var number = req.param('number');
    var direction = req.param('direction');
    var value = req.param('value');
    Gpio.update({
        ip: ip,
        number: number
      }, {
        direction: direction,
        value: value
      })
      .exec(function afterwards(err, updated) {
        if (err) {
          // handle error here- e.g. `res.serverError(err);`
          return;
        }
        res.json(updated[0]);
        console.log('Updated gpio:' + updated[0]);
      });
  },
  _setOut: function(number, value) {
    var GpioObj = self._getGpoObj();
    var error = self._checkNumber(number);
    var _value = 0;
    if (value) {
      _value = value;
    }
    if (error) {
      return error;
    }
    try {

      var gpio = new GpioObj(number, 'out');
      gpio.writeSync(_value);
      if (process.env.DEBUG === "*") {
        console.log('+set gpio' + number + 'to direction "out" and value ' + _value);
      }
    } catch (e) {
      console.log(e);
      return e;
    }
    return null;
  },
  _setIn: function(number) {
    var GpioObj = self._getGpoObj();
    var error = self._checkNumber(number);

    if (error) {
      return error;
    }
    try {

      new GpioObj(number, 'in');
      //gpio.writeSync(_value);
      console.log('+set gpio' + number + ' to direction "in"');

    } catch (e) {
      console.log(e);
      return e;
    }
    return null;
  },
  _setOutValue: function(ip, number, value) {
    var GpioObj = self._getGpoObj();
    var error = self._checkNumber(number);
    if (error) {
      return error;
    }
    try {

      var gpio = new GpioObj(number, 'out');
      gpio.writeSync(value);
      if (process.env.DEBUG === "*") {
        console.log('+set gpio' + number + ' to ' + value);
      }

    } catch (e) {
      console.log(e);
      return e;
    }
    return null;

  },
  _checkNumber: function(number) {
    number = parseInt(number);
    var gpiosNumber = localDevice.gpios.map(function(item1) {
      return parseInt(item1.number);
    });

    gpiosNumber = gpiosNumber.sort(function(a, b) {
      return a < b;
    });


    if (!number) {
      return {
        status: 'failed',
        message: 'The value should be ' + gpiosNumber.toString()
      };
    }
    var items = gpiosNumber.filter(function(item) {
      return item == number;
    });

    if (items.length <= 0) {
      return {
        status: 'failed',
        message: 'The value should be ' + gpiosNumber.toString()
      };
    }

    return null;
  },
  _getGpoObj: function() {
    return require('onoff').Gpio;
  },

};


module.exports = self;

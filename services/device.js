var exec = require('child_process').exec;
var os = require('os');
var Promise = require('bluebird');
var rp = require('request-promise');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
require('../models/gpio');
const Gpio = mongoose.model('Gpio');


var gpiosRpiBPlus = [
    { number: 2, position: 3, wPi: 8, type: 'digital' },
    { number: 3, position: 5, wPi: 9, type: 'digital' },
    { number: 4, position: 7, wPi: 7, type: 'digital' },
    { number: 14, position: 8, wPi: 15, type: 'digital' },
    { number: 15, position: 10, wPi: 16, type: 'digital' },
    { number: 17, position: 11, wPi: 0, type: 'digital' },
    { number: 18, position: 12, wPi: 1, type: 'digital' },
    { number: 27, position: 13, wPi: 2, type: 'digital' },
    { number: 22, position: 15, wPi: 3, type: 'digital' },
    { number: 23, position: 16, wPi: 4, type: 'digital' },
    { number: 24, position: 18, wPi: 5, type: 'digital' },
    { number: 10, position: 19, wPi: 12, type: 'digital' },
    { number: 9, position: 21, wPi: 13, type: 'digital' },
    { number: 25, position: 22, wPi: 6, type: 'digital'},
    { number: 11, position: 23, wPi: 14, type: 'digital' },
    { number: 8, position: 24, wPi: 10, type: 'digital'},
    { number: 7, position: 26, wPi: 11, type: 'digital' },
    { number: 5, position: 29, wPi: 21, type: 'digital' },
    { number: 6, position: 31, wPi: 22, type: 'digital'},
    { number: 12, position: 32, wPi: 26, type: 'digital'},
    { number: 13, position: 33, wPi: 23, type: 'digital'},
    { number: 19, position: 35, wPi: 24, type: 'digital' },
    { number: 16, position: 36, wPi: 27, type: 'digital' },
    { number: 26, position: 37, wPi: 25, type: 'digital' },
    { number: 20, position: 38, wPi: 28, type: 'digital' },
    { number: 21, position: 40, wPi: 29, type: 'digital' },
    { number: 0, position: 0, type: 'analog' },
    { number: 1, position: 1, type: 'analog' },
    { number: 2, position: 2, type: 'analog' },
    { number: 3, position: 3, type: 'analog' },
    { number: 4, position: 4, type: 'analog' },
    { number: 5, position: 5, type: 'analog' },
    { number: 6, position: 6, type: 'analog' }
];
var gpiosRpiBRev2 = [

    { number: 2, position: 3, type: 'digital' },
    { number: 3, position: 5 , type: 'digital'},
    { number: 4, position: 7, type: 'digital' },
    { number: 14, position: 8 , type: 'digital'},
    { number: 15, position: 10, type: 'digital' },
    { number: 17, position: 11, type: 'digital' },
    { number: 18, position: 12, type: 'digital' },
    { number: 27, position: 13, type: 'digital' },
    { number: 22, position: 15, type: 'digital' },
    { number: 23, position: 16, type: 'digital' },
    { number: 24, position: 18 , type: 'digital'},
    { number: 10, position: 19, type: 'digital' },
    { number: 9, position: 21, type: 'digital' },
    { number: 25, position: 22, type: 'digital' },
    { number: 11, position: 23 , type: 'digital'},
    { number: 8, position: 24 , type: 'digital'},
    { number: 7, position: 26, type: 'digital' },
    { number: 0, position: 0, type: 'analog' },
    { number: 1, position: 1, type: 'analog' },
    { number: 2, position: 2, type: 'analog' },
    { number: 3, position: 3, type: 'analog' },
    { number: 4, position: 4, type: 'analog' },
    { number: 5, position: 5, type: 'analog' },
    { number: 6, position: 6, type: 'analog' }
];

var gpiosRpiBRev1 = [

    { number: 0, position: 3, type: 'digital' },
    { number: 1, position: 5, type: 'digital' },
    { number: 4, position: 7 , type: 'digital'},
    { number: 14, position: 8, type: 'digital' },
    { number: 15, position: 10, type: 'digital' },
    { number: 17, position: 11, type: 'digital' },
    { number: 18, position: 12 , type: 'digital'},
    { number: 21, position: 13, type: 'digital' },
    { number: 22, position: 15, type: 'digital' },
    { number: 23, position: 16, type: 'digital' },
    { number: 24, position: 18, type: 'digital' },
    { number: 10, position: 19, type: 'digital' },
    { number: 9, position: 21, type: 'digital' },
    { number: 25, position: 22, type: 'digital'},
    { number: 11, position: 23, type: 'digital' },
    { number: 8, position: 24, type: 'digital' },
    { number: 7, position: 26, type: 'digital' },
    { number: 0, position: 0, type: 'analog' },
    { number: 1, position: 1, type: 'analog' },
    { number: 2, position: 2, type: 'analog' },
    { number: 3, position: 3, type: 'analog' },
    { number: 4, position: 4, type: 'analog' },
    { number: 5, position: 5, type: 'analog' },
    { number: 6, position: 6, type: 'analog' }
];

module.exports = {
  register: function(ip, port) {

    return rp({
      method: 'Get',
      uri: 'http://' + ip + ':'+ port +'/api/gpios/device' ,
      resolveWithFullResponse: true
    }).then(function(response){
      var gpios = JSON.parse(response.body);
      console.log(gpios);
      return Promise.all(gpios.map(function(gpio){
        return new Promise(function(resolve, reject) {
          Gpio.findOne({ ip: ip, number: gpio.number}, function(err, found){
            if (err) {
              console.log(err);
              reject(err);
            }
            if(!found){
              var gpioObj = {
                number: gpio.number,
                ip: ip,
                type: gpio.type
              };
              Gpio.create(gpioObj, function(err){
                if (err) {
                  console.log(err);
                  reject(err);
                }
                resolve(gpioObj);
              });
            }
          });
        });
      }));
    })
    .then(function(){
      return { status: 'ok'}
    });
  },
  getIp: function(){
    var os = require('os');

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
                console.log(address);
            }
        }
    }

    return addresses[0];
  },

  getGpioWPi: function(gpioNumber, type){

    return this.getDeviceModel().then(function(obj){
      var gpios = obj.gpios;
      var wPi= 0;

      if(gpios){
        for (var i = 0; i < gpios.length; i++) {
          if(gpios[i].number === parseInt(gpioNumber) && gpios[i].type === type){

            wPi = gpios[i].wPi;
            return wPi;
            break;
          }
        }
      }

      return wPi;
    });

  },
  getGpioInfo: function(number){

    return new Promise(function(resolve, reject) {
      exec('gpio readall ', function (err, stdout) {
          var gpio;
          if(err) {
            reject(err);
          }
          var gpios = [];
          var lines = stdout.split(os.EOL);
          if(lines.length > 0){
            for (var i = 1; i <= lines.length; i++) {
              if(i>3 && i<lines.length -4){
                var tempArr = lines[i].split('|');

                var gpio1Number = tempArr[1].trim();
                if(gpio1Number){
                  gpios.push({
                    number: parseInt(gpio1Number),
                    value: parseInt(tempArr[5].trim()),
                    mode: tempArr[4].trim().toLowerCase(),
                    name: tempArr[3].trim().toLowerCase(),
                    wPi: tempArr[2].trim().toLowerCase(),
                  });
                }
              var gpio2Number = tempArr[13].trim();
                if(gpio2Number){
                  gpios.push({
                    number: parseInt(gpio2Number),
                    value: parseInt(tempArr[9].trim()),
                    mode: tempArr[10].trim().toLowerCase(),
                    name: tempArr[11].trim().toLowerCase(),
                    wPi: tempArr[12].trim().toLowerCase(),
                  });
                }

              }

            }

            gpio = gpios.find(function(item){
              return item.number === parseInt(number);
            });
          }

          resolve(gpio);
        });
      });

  },
  getPinValue: function(number){

    return new Promise(function(resolve, reject) {
      exec('gpio -g read ' + number, function (err, stdout) {
          var value;
          if(err) {
            reject(err);
          }
          var lines = stdout.split(os.EOL);
          if(lines.length > 0){
            value = parseInt(lines[0]);
          }

          resolve(value);
        });
      });

  },
  getAppPort: function(req){
    return process.env.PORT || 3000;
  },
  getDeviceModel: function(){

      return new Promise(function(resolve, reject) {



        exec('cat /proc/cpuinfo',
          function (err, stdout) {
            var revision, serial, model, gpios = [];
            if(err) {
              //reject(err);
              revision= 'a01041';
            } else {
              var lines = stdout.split(os.EOL);

              lines.forEach(function(line){

                var arr = line.split(':');
                if(arr[0].indexOf('Revision') === 0){
                  revision = arr[1];
                }
                if(arr[0].indexOf('Serial') === 0){
                  serial = arr[1];
                }
              });
            }



            if(revision!=null){
              switch (revision.trim()) {
                case '0002','0003':
                  model= 'PiModelBRev1';
                  break;
                case '0004':
                case '0005':
                case '0006':
                case '000d':
                case '000e':
                case '000f':
                  model= 'PiModelBRev2';
                  break;
                case '0010':
                  model= 'PiModelBPlus';
                  break;
                case 'a01041':
                  model= 'Pi2';
                case 'a02082':
                  model= 'Pi3'
                  break;

              }
              switch (model) {
                case 'PiModelBPlus':
                case 'Pi2':
                case 'Pi3':
                  gpios = gpiosRpiBPlus;
                  break;
                case 'PiModelBRev2':
                  gpios = gpiosRpiBRev2;
                  break;
                case 'PiModelBRev1':
                  gpios = gpiosRpiBRev1;
                  break;
              }


              resolve({
                serial: serial,
                model: model ,
                gpios: gpios
              });
            }
          });

    });

  }
};

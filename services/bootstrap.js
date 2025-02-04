var DeviceService = require('./device');
var rp = require('request-promise');
var request = require('sync-request');
var http = require('http');
const mongoose = require('mongoose');
require('../models/device');
const Device = mongoose.model('Device');
const Component = mongoose.model('Component');
const suspend = require('suspend');
var os = require("os");
var fs = require('fs')
var hapPath = '/Users/roberto/Documents/Source/HAP-NodeJS';
//var hapPath = '/home/pi/HAP-NodeJS';


var self = {
  init: function*(cb) {
    var totalRequest = 0;
    var completeRequest = 0;
    var errorRequest = 0;
    var number = 0;
    var totalRetry = 100000;
    var ip = DeviceService.getIp();

    var hostname = os.hostname();
    console.log('Device ip: ' + ip);
    console.log('Device hostname: ' + hostname);
    if(hostname.indexOf('.local')<0){
      hostname += '.local'
    }
    var masterDevice = yield Device.find({
      isMaster: true,
      name: hostname
    }).exec();

    this.buildHomeKit();
    /*
    if (masterDevice.length>0) {
      var responseLogin = yield rp({
        method: 'POST',
        uri: "http://" + hostname + "/login" ,
        resolveWithFullResponse: true,
        body: {
          email: process.env.SYSTEM_EMAIL,
          password:  process.env.SYSTEM_PWD
        },
        json: true
      });
      var token = responseLogin.body.token;


      var switchComponents = yield Component.find({
        type: 'switch'
      }).populate('gpios').exec();

      if (switchComponents && switchComponents.length > 0) {

        totalRequest = switchComponents.length;
        number = 0;
        console.log("Trying to start the switch components...");
        var id = setInterval(function() {

          suspend(function*() {

            completeRequest = 0;
            errorRequest = 0;

            for (var i = 0; i < switchComponents.length; i++) {
              var component = switchComponents[i];
              if (component.gpios) {
                for (var k = 0; k < component.gpios.length; k++) {
                  if (component.gpios[k].action === 'switch') {
                    try {

                      var response = yield rp({
                        method: 'Get',
                        uri: "http://" + component.gpios[k].ip + ":" + DeviceService.getAppPort() + "/api/gpios/" + component.gpios[k].number,
                        resolveWithFullResponse: true,
                        headers: {
                           'authorization': 'Bearer ' + token
                        }
                      });
                      var data = JSON.parse(response.body);
                      var gpio = data.gpio;
                      if (gpio.mode === 'in') {
                        console.log( "http://" + component.gpios[k].ip + ":" + DeviceService.getAppPort() + "/api/gpios/" + component.gpios[k].number);
                        var responseActon = yield rp({
                          method: 'Put',
                          uri: "http://" + component.gpios[k].ip + ":" + DeviceService.getAppPort() + "/api/gpios/" + component.gpios[k].number + "/action",
                          resolveWithFullResponse: true,
                          body: {
                            state: 'on',
                            type: 'inOut'
                          },
                          json: true,
                          headers: {
                             'authorization': 'Bearer ' + token
                          }
                        });
                        var data1 = esponseActon.body;
                        console.log(data1);
                        completeRequest++;
                        break;
                      } else {
                        completeRequest = totalRequest;
                        break;
                      }

                    } catch (e) {
                      console.log(e);
                    }
                  }
                }
              }
            };
            if (completeRequest === totalRequest || number === totalRetry) {
              console.log("Switches initialized successfully");
              number = totalRetry + 1;
              clearInterval(id);
              id = 0;
            } else {
              console.log("Retry " + number + " of " + totalRetry);
            }

          })();

          number++;
        }, 5 * 1000);
      }
    }
    */
  },
  buildHomeKit: function(){
    var self= this;
    suspend(function*() {
      var self= this;
      var components = yield Component.find({}).populate('gpios').exec();
      debugger;

      components.forEach(function(component){

        var file = hapPath+'/templates/'+component.type+'.js';
        var mac = component.mac.split(':').join('-');
        if(fs.existsSync(file)){
          var content = fs.readFileSync(file, 'utf8');
          content = content.replace('###name###', component.name);
          content = content.replace('###mac###', mac);
          content = content.replace('###componentid###', component._id);
          var accessoryFile = hapPath+'/accessories/'+mac+'_accessory.js'
          fs.writeFileSync(accessoryFile, content, 'utf8');
          console.log('Created or updated '+ accessoryFile);
        }
      })


    })();
  }
  
}

module.exports = self;

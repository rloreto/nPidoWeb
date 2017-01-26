var rp = require('request-promise');
var Device = require('./device');

require('array.prototype.find');

module.exports = {
  getComponentCurrentState: function*(component, token){
    if (!component) {
      throw new Error('The component is required.');
    }

    if (component.gpios.length === 0) {
      throw new Error('Almost one gpio is required by the component with id:"' + component.id + '".');
    }
    var targetGpio = component.gpios[0];

    var result = yield rp({
      method: 'Get',
      uri: "http://" + targetGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + targetGpio.number ,
      resolveWithFullResponse: true,
      headers: {
        'authorization': 'Bearer ' + token
      }
    });

    if (result.statusCode !== 200) {
    throw new Error("Failed 'onSocker' in " + id + " component.");
    }
    if (result.body.status === 'failed') {
      throw new Error("Failed 'onSocker' in " + id + " component.");
    }
    var resultObj =JSON.parse(result.body);

    if(component.type==='socket'){
      return !resultObj.gpio.value;
    }
    if(component.type==='switchAudio'){
      return (resultObj.gpio.value===1)? 1:0;
    }

    return 0;
  },
  changeOnOffState: function*(component, state, type, token) {

    var outGpio = null;
    var id = null;
    var formatData = {
      state: state
    };
    if (type) {
      formatData.type = type;
    }

    if (!component) {
      throw new Error('The component is required.');
    }
    id = component.id;

    if (state !== 'on' && state !== 'off' && state !== 'onDimmer' && state !== 'offDimmer' &&
          state !== 'onoff' && state !== 'start' && state !== 'stop' && state !== 'low' && state !== 'mediun' && state !== 'hight') {
      throw new Error('The state should be "on","off","onDimmer","offDimmer","change","start","stop","low","mediun" or "hight"');
    }

    outGpio = component.gpios.find(function(gpio) {
      return gpio.direction === 'out';
    })


    if (!outGpio) {
      throw new Error('Almost one "out-gpio" is required by the component with id:"' + id + '".');
    }

    var result = yield rp({
      method: 'Put',
      uri: "http://" + outGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + outGpio.number + "/action",
      resolveWithFullResponse: true,
      body: {
        state: state,
        type: type
      },
      headers: {
         'authorization': 'Bearer ' + token
      },
      json: true
    })

    if (result.statusCode !== 200) {
      throw new Error("Failed 'onSocker' in " + id + " component.");
    }
    if (result.body.status === 'failed') {
      throw new Error("Failed 'onSocker' in " + id + " component.");
    }

    component.value = (state === 'on'?1:0);
    return component;
    //return result.body;


  },
  changeSwitchState: function(component, state, token) {
    var inGpio = null;
    var outGpio = null;
    var id = null;


    if (!component) {
      throw new Error("The component is required.");
    }
    id = component.id;

    if (state !== 'on' && state !== 'off') {
      throw new Error('The state should be "on" or "off"');
    }

    inGpio = component.gpios.find(function(gpio) {
      return gpio.action === 'testAC';
    })


    outGpios = component.gpios.filter(function(gpio) {
      return gpio.action === 'switch';
    })

    var out1 = outGpios[0];
    var out2 = outGpios[1];

    var in1Value = 0;
    var out2Value = 0;
    var out2Value = 0;

    console.log(out1);


    if (!inGpio) {
      throw new Error("Almost one 'in gpio' is required by the component with id:''" + id + "'.");
    }
    if (!outGpios || (outGpios && outGpios.length !== 2)) {
      throw new Error("Almost one 'out gpio' is required by the component with id:''" + id + "'.");
    }

    return rp({
        method: 'Get',
        uri: "http://" + inGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + inGpio.number,
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      })
      .then(function(response) {
        var body = JSON.parse(response.body);
        in1Value = body.gpio.value;
        if (state === 'on' && in1Value === 1) {
          throw new Error("The component with id:''" + id + "'. is already on");
        }
        if (state === 'off' && in1Value === 0) {
          throw new Error("The component with id:''" + id + "'. is already off");
        }

        return rp({
          method: 'Get',
          uri: "http://" + out1.ip + ":" + Device.getAppPort() + "/api/gpios/" + out1.number,
          resolveWithFullResponse: true,
          headers: {
            'authorization': 'Bearer ' + token
          }
        }).then(function(response) {
          var body = JSON.parse(response.body);
          switchGpio1 = body.gpio;
          return rp({
            method: 'Get',
            uri: "http://" + out2.ip + ":" + Device.getAppPort() + "/api/gpios/" + out2.number,
            resolveWithFullResponse: true,
            headers: {
              'authorization': 'Bearer ' + token
            }
          }).then(function(response) {
            var body = JSON.parse(response.body);
            switchGpio2 = body.gpio;

            var target1, target2;


            if (switchGpio1.mode === 'out' && switchGpio2.mode === 'out') {
              target1 = switchGpio2;
              target2 = switchGpio1;
            } else if (switchGpio1.mode === 'in' && switchGpio2.mode === 'out') {
              target1 = switchGpio1;
              target2 = switchGpio2;
            } else if (switchGpio1.mode === 'out' && switchGpio2.mode === 'in') {
              target1 = switchGpio2;
              target2 = switchGpio1;
            } else {
              target1 = switchGpio2;
              target2 = switchGpio1;
            }

            var temGpio1 = component.gpios.find(function(gpio) {
              return gpio.number === target1.number;
            })
            target1.ip = temGpio1.ip;

            var temGpio2 = component.gpios.find(function(gpio) {
              return gpio.number === target2.number;
            })
            target2.ip = temGpio2.ip;

            console.log("http://" + target1.ip + ":" + Device.getAppPort() + "/api/gpios/" + target1.number + "/action");
            return rp({
              method: 'Put',
              uri: "http://" + target1.ip + ":" + Device.getAppPort() + "/api/gpios/" + target1.number + "/action",
              resolveWithFullResponse: true,
              body: {
                state: 'off',
                type: 'inOut'
              },
              headers: {
                'authorization': 'Bearer ' + token
              },
              json: true
            }).then(function(response) {
              console.log("http://" + target2.ip + ":" + Device.getAppPort() + "/api/gpios/" + target2.number + "/action");
              return rp({
                method: 'Put',
                uri: "http://" + target2.ip + ":" + Device.getAppPort() + "/api/gpios/" + target2.number + "/action",
                resolveWithFullResponse: true,
                body: {
                  state: 'on',
                  type: 'inOut'
                },
                headers: {
                  'authorization': 'Bearer ' + token
                },
                json: true
              }).then(function(response) {
                if (response.statusCode !== 200) {
                  throw new Error("Failed 'changeSwitchState' in " + id + " component.");
                }
                if (response.body.status === 'failed') {
                  throw new Error("Failed 'changeSwitchState' in " + id + " component.");
                }
                return response.body.status;
              });
            });
          });
        })

      });

  },
  changeDimmerState: function(component, state, token) {
    var dimmerGpio = null;
    var id = null;
    var requestState;
    switch (state) {
      case 'gradualOn':
        requestState = 'gradualOn';
        break;
      case 'start':
        requestState = 'start';
        break;
      case 'stop':
        requestState = 'stop';
        break;
      case 'low':
        requestState = 'low';
        break;
      case 'mediun':
        requestState = 'mediun';
        break;
      case 'hight':
        requestState = 'hight';
        break;
      case 'on':
        requestState = 'on';
        break;
      case 'off':
        requestState = 'off';
        break;
      case 'change':
        requestState = 'onoff';
        break;
    }

    if (!component) {
      throw new Error("The component is required.");
    }
    id = component.id;

    if (state !== 'on' && state !== 'off' && state !== 'change' && state !== 'start' && state !== 'stop' && state !== 'low' && state !== 'mediun' && state !== 'hight') {
      throw new Error('The state should be "on","off","change","start","stop","low","mediun" or "hight"');
    }


    dimmerGpio = component.gpios.find(function(gpio) {
      return gpio.action === 'dimmer';
    })

    if (!dimmerGpio) {
      throw new Error("Almost one 'dimmer Gpio' is required by the component with id:''" + id + "'.");
    }

    return rp({
        method: 'Put',
        uri: "http://" + dimmerGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + dimmerGpio.number + "/action",
        resolveWithFullResponse: true,
        body: {
          state: requestState
        },
        headers: {
          'authorization': 'Bearer ' + token
        },
        json: true
      })
      .then(function(response) {
        if (response.statusCode !== 200) {
          throw new Error("Failed 'onSocker' in " + id + " component.");
        }
        if (response.body.status === 'failed') {
          throw new Error("Failed 'onSocker' in " + id + " component.");
        }
        return response.body.status;
      });

  },
  changeBlindPosition: function*(component, state, token) {

    var totalMilliseconds = 26 * 1000000;
    var id = null;
    var state;
    var currentBlindTime = 0;
    var requestWait;

    if (!component) {
      throw new Error("The component is required.");
    }

    if (state !== 'up' && state !== 'down' && state !== 'upStart' && state !== 'upStop' && state !== 'downStart' && state !== 'downStop' && state !== '0' && state !== '25' && state !== '50' && state !== '75' && state !== '100') {
      throw new Error('The state should be "up", "down", "upStart",  "upStop", "downStart", "downStop","0", "25", "50", "75" or "100"');
    }

    id = component.id;

    if (component.value) {
      currentBlindTime = component.value;
    }
    console.log('currentBlindTime->' + currentBlindTime);


    var ip, number;
    var requestState = 'onoff';
    var action;
    var requestTime = 0;
    var targetGpio;

    if (state === 'up') {
      action = 'up';
      requestWait = totalMilliseconds / 8.0;
    } else if (state === 'down') {
      action = 'down';
      requestWait = totalMilliseconds / 8.0;
    } else if (state === 'upStart') {
      action = 'up';
      requestState = 'on';
    } else if (state === 'upStop') {
      action = 'up';
      requestState = 'off';
    } else if (state === 'downStart') {
      action = 'down';
      requestState = 'on';
    } else if (state === 'downStop') {
      action = 'down';
      requestState = 'off';
    } else {
      if (state === '0') {
        requestTime = 0;
      }
      if (state === '25') {
        requestTime = 0.25 * totalMilliseconds;
      }
      if (state === '50') {
        requestTime = 0.5 * totalMilliseconds;
      }
      if (state === '75') {
        requestTime = 0.75 * totalMilliseconds;
      }
      if (state === '100') {
        requestTime = totalMilliseconds;
      }

      if (currentBlindTime > requestTime && requestTime >= 0) {
        action = 'down';
        requestWait = currentBlindTime - requestTime;
      } else if (currentBlindTime < requestTime && requestTime <= totalMilliseconds) {
        action = 'up';
        requestWait = currentBlindTime + requestTime;
      }
    }
    if (!action) {
      return;
    }

    var resultGpios = component.gpios.filter(function(gpio) {
      return gpio.action === action;
    });

    var formData = {
      state: requestState,
      type: 'out01'
    };
    if (requestWait) {
      formData.wait = requestWait;
    }


    if(resultGpios && resultGpios.length>0){
        targetGpio = resultGpios[0];
    }
    var result = yield rp({
      method: 'Put',
      uri: "http://" + targetGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + targetGpio.number + "/action",
      resolveWithFullResponse: true,
      body: formData,
      headers: {
        'authorization': 'Bearer ' + token
      },
      json: true
    });

    return result.body;
  },
  changeSwitchAudio: function() {

  },
  getDhtSensorTemperature: function(component, token) {
    var outGpio = null;
    var id = null;

    if (!component) {
      throw new Error("The component is required.");
    }
    id = component.id;


    outGpio = component.gpios.find(function(gpio) {
      return gpio.direction === 'out';
    })

    if (!outGpio) {
      throw new Error("The outGpio is required.");
    }

    return rp({
        method: 'Get',
        uri: "http://" + outGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + outGpio.number + '/dht',
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      })
      .then(function(response) {
        var data = JSON.parse(response.body);
        return data;
      })
  },
  getLuminanceSensor: function(component, token) {
    var outGpio = null;
    var id = null;

    if (!component) {
      throw new Error("The component is required.");
    }
    id = component.id;


    outGpio = component.gpios.find(function(gpio) {
      return gpio.direction === 'out';
    })

    if (!outGpio) {
      throw new Error("The outGpio is required.");
    }

    return rp({
        method: 'Get',
        uri: "http://" + outGpio.ip + ":" + Device.getAppPort() + "/api/gpios/" + outGpio.number + '/analog',
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      })
      .then(function(response) {
        var data = JSON.parse(response.body);
        return data;
      })
  },
  onDimmer: function(id, options) {
    if (options.percent) {

    }
  },
  offDimmer: function(id) {

  },
  updateGpiosValues: function(component, token) {

    var Promise = require('q');
    var actions = [];
    if (component.gpios && component.gpios.length === 1) {
      return rp({
        method: 'Get',
        uri: "http://" + component.gpios[0].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[0].number,
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      }).then(function(response) {
        var data = JSON.parse(response.body);
        component.gpios[0].value = data.gpio.value;
        return component;
      });
    }
    if (component.gpios && component.gpios.length === 2) {
      return rp({
        method: 'Get',
        uri: "http://" + component.gpios[0].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[0].number,
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      }).then(function(response) {
        var data = JSON.parse(response.body);
        component.gpios[0].value = data.gpio.value;
        return rp({
          method: 'Get',
          uri: "http://" + component.gpios[1].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[1].number,
          resolveWithFullResponse: true,
          headers: {
            'authorization': 'Bearer ' + token
          }
        }).then(function(response) {
          var data = JSON.parse(response.body);
          component.gpios[1].value = data.gpio.value;
          return component;
        });
      });

    }

    if (component.gpios && component.gpios.length === 3) {
      return rp({
        method: 'Get',
        uri: "http://" + component.gpios[0].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[0].number,
        resolveWithFullResponse: true,
        headers: {
          'authorization': 'Bearer ' + token
        }
      }).then(function(response) {
        var data = JSON.parse(response.body);
        component.gpios[0].value = data.gpio.value;
        return rp({
          method: 'Get',
          uri: "http://" + component.gpios[1].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[1].number,
          resolveWithFullResponse: true,
          headers: {
             'authorization': 'Bearer ' + token
          }
        }).then(function(response) {
          var data = JSON.parse(response.body);
          component.gpios[1].value = data.gpio.value;
          return rp({
            method: 'Get',
            uri: "http://" + component.gpios[2].ip + ":" + Device.getAppPort() + "/api/gpios/" + component.gpios[2].number,
            resolveWithFullResponse: true,
            headers: {
               'authorization': 'Bearer ' + token
            }
          }).then(function(response) {
            var data = JSON.parse(response.body);
            component.gpios[2].value = data.gpio.value;
            return component;
          });
        });
      })
    }

  }

};

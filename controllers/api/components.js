/**
 * ComponentController
 * @description :: Server-side logic for managing components
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var ComponentActions = require('../../services/componentActions');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const Component = mongoose.model('Component');
const Gpio = mongoose.model('Gpio');
const wrap = require('co-express');

var self = {
  getById: wrap(function*(req, res) {
    var id = req.query.id;
    var token = req.get('token') || req.cookies.token;
    if (!id) {
      res.json(self._getJsonFailedMessage('The id "' + id + '" is required.'));
      return;
    }
    try {
      var component = yield Component.findOne({
        id: id
      }).populate('gpios').exec();
      if (!component) {
        throw new Error('The component ' + id + ' not found');
      }
      var result = yield ComponentActions.updateGpiosValues(component, token);
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  socket: wrap(function*(req, res) {
    var state = req.param('state');
    var type = req.param('type');
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    if (state !== 'on' && state !== 'off') {
      res.json(self._getJsonFailedMessage('The state should be "on" or "off"'));
    }

    if (type !== 'hight' && type !== 'low') {
      res.json(self._getJsonFailedMessage('The type should be "hight" or "low"'));
    }

    try {
      var result = yield self._changeOnOffState(token, id, state, 'socket', 1, type==='hight'?'out01':'out10');
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  dimmer: wrap(function*(req, res) {
    var state = req.param('state');
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    if (state !== 'on' && state !== 'off' && state !== 'change' && state !== 'start' && state !== 'stop' && state !== 'low' && state !== 'mediun' && state !== 'hight') {
      res.json(self._getJsonFailedMessage('The state should be "on","off","change","start","stop","low","mediun" or "hight"'));
    }

    try {
      var result = yield self._changeOnOffState(token, id, state, 'dimmer', 1);
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  switch: wrap(function*(req, res) {
    var state = req.param('state');
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    if (state !== 'on' && state !== 'off') {
      res.json(self._getJsonFailedMessage('The state should be "on" or "off"'));
    }

    try {
      var result = yield self._changeOnOffState(token, id, state, 'switch', 3);
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  switchBlind: wrap(function*(req, res) {
    var state = req.param('state');
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    if (state !== 'up' && state !== 'down' && state !== 'upStart' && state !== 'upStop' && state !== 'downStart' && state !== 'downStop' && state !== '0' && state !== '25' && state !== '50' && state !== '75' && state !== '100') {
      res.json(self._getJsonFailedMessage('The state should be "up", "down", "upStart",  "upStop", "downStart", "downStop", "0", "25", "50", "75" or "100"'));
    }

    try {
      var component = yield Component.findOne({_id: id}).populate('gpios').exec();
      var result = yield ComponentActions.changeBlindPosition(component, state, token);
      component = yield Component.findOne({_id: id}).populate('gpios').exec();
      res.json(component);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  switchAudio: wrap(function*(req, res) {
    var state = req.param('state');
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    if (state !== 'on' && state !== 'off') {
      res.json(self._getJsonFailedMessage('The state should be "on" or "off"'));
    }
    try {
      var result = yield self._changeOnOffState(token, id, state, 'switchAudio', 1, 'out01');
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  testAC: function(req, res) {
    res.json(true);
  },
  temperatureSensor: wrap(function*(req, res) {
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    try {
      var result = yield self._changeOnOffState(token, id, state, 'temperatureSensor', 1);
      res.json(result);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }

  }),
  luminanceSensor: wrap(function*(req, res) {
    var id = req.param('id');
    var token = req.get('token') || req.cookies.token;
    try {
      var result = yield self._changeOnOffState(token, id, state, 'luminanceSensor', 1);
      res.json(result);
    } catch (e) {
      res.json();
    }

  }),
  _changeOnOffState: function*(token, id, state, requestedType, gpioNumber, type) {
    type = type || 'inOut';
    var component = yield Component.findOne({
      _id: id
    }).populate('gpios').exec();

    if (!component) {
      return self._getJsonFailedMessage('The component' + id + ' not found');
    }
    if (component && component.type !== requestedType) {
      return self._getJsonFailedMessage('The component type should be "' + requestedType + '" not "' + component.type + '".');
    }
    if (component && !component.gpios) {
      return self._getJsonFailedMessage('The component' + id + ' not found');
    }
    if (component && component.gpios && component.gpios.length !== gpioNumber) {
      return self._getJsonFailedMessage('The number of gpios fos the component with id:"' + id + '"should be "' + gpioNumber + '".');
    }

    return yield ComponentActions.changeOnOffState(component, state, type, token);
  },
  get: wrap(function*(req, res) {
    var filter = req.params.filter || {};
    var token = req.get('token') || req.cookies.token;
    try {
      var components = yield Component.find(filter).populate('gpios').exec();

      yield self._asyncEach(components, function*(component, i) {
        component.value = yield ComponentActions.getComponentCurrentState(component, token);
      })
      res.json(components);
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  _asyncEach:function* (array, fn) {
   for (var i = 0; i < array.length; i++) yield fn(array[i], i);
  },
  create: function(req, res) {
    var obj = req.body;
    var type = obj.type;
    var ip = obj.ip;
    var name = obj.name;
    var number1 = obj.number1;
    var number2 = obj.number2;
    var number3 = obj.number3;
    var number1Type = 'digital';
    var number2Type = 'digital';
    var number3Type = 'digital';
    var token = req.get('token');

    if (obj.number1Type) {
      number1Type = obj.number1Type;
    }
    if (obj.number2Type) {
      number2Type = obj.number2Type;
    }
    if (obj.number1Type) {
      number3Type = obj.number3Type;
    }

    if (!type) {
      res.json({
        status: 'failed',
        error: 'The "{type:<switch|switchBlind|switchAudio|dimmer|socket|testAC|temperatureSensor|motionSensor|luminanceSensor>}" is required.'
      });
      return;
    }

    if (!ip) {
      res.json({
        status: 'failed',
        error: 'The "{ip:<ip>}" is required.'
      });
      return;
    }

    var gpios = {
      ip: ip,
      number1: number1,
      number2: number2,
      number3: number3,
      name: name
    };
    switch (obj.type) {
      case 'socket':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        self._createSocket(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'dimmer':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        /*if(!number2){
        	res.json({ status: 'failed', error: 'The "{number2:<number2>}" is required.'});
        	return;
        }*/
        self._createDimmer(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'testAC':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        self._createTestAC(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'temperatureSensor':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        self._createTemperatureSensor(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'motionSensor':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        self._createMovementSensor(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'switch':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        if (!number2) {
          res.json({
            status: 'failed',
            error: 'The "{number2:<number2>}" is required.'
          });
          return;
        }
        if (!number3) {
          res.json({
            status: 'failed',
            error: 'The "{number3:<number3>}" is required.'
          });
          return;
        }
        self._createSwitch(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'switchBlind':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" for up mode is required.'
          });
          return;
        }
        if (!number2) {
          res.json({
            status: 'failed',
            error: 'The "{number2:<number2>}" for down mode is required.'
          });
          return;
        }
        self._createSwitchBlind(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'luminanceSensor':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        if (number1Type !== 'analog') {
          res.json({
            status: 'failed',
            error: 'The "number1Type" should be "analog" .'
          });
          return;
        }



        self._createLuminanceSensor(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;
      case 'switchAudio':
        if (!number1) {
          res.json({
            status: 'failed',
            error: 'The "{number1:<number1>}" is required.'
          });
          return;
        }
        self._createSwitchAudio(gpios, token)
          .catch(function(e) {
            res.json({
              status: 'failed',
              error: e.message
            });
          })
          .then(function(result) {
            res.json(result);
          });
        break;

    }
  },
  remove: wrap(function*(req, res) {
    var id = req.params.id;

    if (!id) {
      res.json(self._getJsonFailedMessage('The id "' + id + '" is required.'));
      return;
    }
    try {
      var component = yield Component.findOne({_id: id}).populate('gpios').exec();

      if (component && component.gpios) {
        component.gpios.forEach(wrap(function*(gpio) {
          yield Gpio.update({
            _id: gpio.id
          }, {
            owner: null
          });
        }));
        var result = yield component.remove();
      } else{
        res.json(self._getJsonFailedMessage('Component "'+ id +'" not found.'));
        return;
      }
      res.json({
        status: 'ok',
        error: 'The component "'+ id +'" was removed.'
      });
    } catch (e) {
      res.json(self._getJsonFailedMessage(e.message));
    }
  }),
  //{ip, number1, number2}
  _createSwitch: function(obj, token) {
    return self._createComponentGpio(token, 'switch', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital',
      action: 'switch'
    }, {
      number: obj.number2,
      direction: 'out',
      type: 'digital',
      action: 'switch'
    }, {
      number: obj.number3,
      direction: 'in',
      type: 'digital',
      action: 'testAC'
    });
  },
  //{ip, number1, number2}
  _createSwitchBlind: function(obj, token) {
    return self._createComponentGpio(token, 'switchBlind', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital',
      action: 'up'
    }, {
      number: obj.number2,
      direction: 'out',
      type: 'digital',
      action: 'down'
    });
  },
  //{ip, number1}
  _createSwitchAudio: function(obj, token) {
    return self._createComponentGpio(token, 'switchAudio', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital'
    });
  },
  //{ip, number1}
  _createDimmer: function(obj, token) {
    //return self._createComponentGpio('dimmer', obj.name, obj.ip, {number: obj.number1, direction:'out', type: 'digital', action: 'dimmer'}, {number: obj.number2, direction:'in', type: 'digital', action: 'testAC'});
    return self._createComponentGpio(token, 'dimmer', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital',
      action: 'dimmer'
    });
  },
  //{ip, number1}
  _createSocket: function(obj, token) {
    return self._createComponentGpio(token, 'socket', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital'
    });
  },
  //{ip, number1}
  _createTestAC: function(obj, token) {
    return self._createComponentGpio(token, 'testAC', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'in',
      type: 'digital',
      action: 'testAC'
    });
  },
  //{ip, number1}
  _createTemperatureSensor: function(obj, token) {
    return self._createComponentGpio(token, 'temperatureSensor', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital'
    });
  },
  _createMotionSensor: function(obj, token) {
    return self._createComponentGpio(token, 'motionSensor', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'digital'
    });
  },
  _createLuminanceSensor: function(obj, token) {
    return self._createComponentGpio(token, 'luminanceSensor', obj.name, obj.ip, {
      number: obj.number1,
      direction: 'out',
      type: 'analog'
    });
  },
  _createComponentGpio: function(token, componentType, name, ip, gpio1, gpio2, gpio3) {


    var componentId;
    var number1 = null;

    if (gpio1 && gpio1.number) {
      number1 = gpio1.number;
    }
    var type1 = null;
    if (gpio1 && gpio1.type) {
      type1 = gpio1.type;
    }
    var number2 = null;
    if (gpio2 && gpio2.number) {
      number2 = gpio2.number;
    }
    var type2 = null;
    if (gpio2 && gpio2.type) {
      type2 = gpio2.type;
    }

    var number3 = null;
    if (gpio3 && gpio3.number) {
      number3 = gpio3.number;
    }
    var type3 = null;
    if (gpio3 && gpio3.type) {
      type3 = gpio3.type;
    }

    var direction1 = null;
    if (gpio1 && gpio1.direction) {
      direction1 = gpio1.direction;
    }
    var direction2 = null;
    if (gpio2 && gpio2.direction) {
      direction2 = gpio2.direction;
    }

    var direction3 = null;
    if (gpio3 && gpio3.direction) {
      direction3 = gpio3.direction;
    }

    var action1 = null;
    if (gpio1 && gpio1.action) {
      action1 = gpio1.action;
    }
    var action2 = null;
    if (gpio2 && gpio2.action) {
      action2 = gpio2.action;
    }

    var action3 = null;
    if (gpio3 && gpio3.action) {
      action3 = gpio3.action;
    }

    return self._checkGpios(ip, gpio1, gpio2, gpio3)
      .then(function() {
        if ((number1 && number2 && (number1 === number2)) ||
          (number2 && number3 && (number2 === number3)) ||
          (number1 && number3 && (number1 === number3))) {
          throw new Error('The gpios should be distints.');
        }

        var objectToCreate = {
          type: componentType,
          name: name
        };

        return Component.create(objectToCreate);
      })
      .then(function(item) {
        componentId = item.id;

        if (number1 && !number2 && !number3) {
          return Gpio.findOne({
              number: number1,
              ip: ip,
              type: type1
            })
            .then(function(found) {

              var objToUpdate = {
                direction: direction1,
                action: action1,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            });
        }
        if (number1 && number2 && !number3) {
          return Gpio.findOne({
              number: number1,
              ip: ip,
              type: type1
            })
            .then(function(found) {
              if (!found) {
                throw new Error('The gpio' + found.number + ' (' + found.ip + ')  not found.');
              }
              var objToUpdate = {
                direction: direction1,
                action: action1,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            })
            .then(function() {
              return Gpio.findOne({
                number: number2,
                ip: ip,
                type: type2
              });
            })
            .then(function(found) {
              if (!found) {
                throw new Error('The gpio' + found.number + ' (' + found.ip + ')  not found.');
              }
              var objToUpdate = {
                direction: direction2,
                action: action2,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            });
        }
        if (number1 && number2 && number3) {
          return Gpio.findOne({
              number: number1,
              ip: ip,
              type: type1
            })
            .then(function(found) {
              if (!found) {
                throw new Error('The gpio' + found.number + ' (' + found.ip + ')  not found.');
              }
              var objToUpdate = {
                direction: direction1,
                action: action1,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            })
            .then(function() {
              return Gpio.findOne({
                number: number2,
                ip: ip,
                type: type2
              });
            })
            .then(function(found) {
              if (!found) {
                throw new Error('The gpio' + found.number + ' (' + found.ip + ')  not found.');
              }
              var objToUpdate = {
                direction: direction2,
                action: action2,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            })
            .then(function() {
              return Gpio.findOne({
                number: number3,
                ip: ip,
                type: type3
              });
            })
            .then(function(found) {
              if (!found) {
                throw new Error('The gpio' + found.number + ' (' + found.ip + ')  not found.');
              }
              var objToUpdate = {
                direction: direction3,
                action: action3,
                owner: componentId
              }
              return Gpio.update({
                _id: found.id
              }, objToUpdate);
            });
        }


      })
      .catch(function(e) {
        throw e;
      })
      .then(function(a) {
        return Gpio.find({
          owner: componentId
        }, "_id").then(function(result) {
          var gpios = [];
          if (gpios) {
            result.forEach(function(gpio) {
              gpios.push(gpio._id);
            });
          }
          return Component.update({
            _id: componentId
          }, {
            gpios: gpios
          }).then(function() {
            return Component.findOne({_id: componentId}).populate('gpios');
          });
        });
      });
  },
  _getJsonFailedMessage(message) {
    return {
      status: 'failed',
      error: message
    };
  },
  _checkGpios: function(ip, gpio1, gpio2, gpio3) {
    var numberToCheck1;
    var numberToCheck2;
    var numberToCheck3;
    var gpio1Type;
    var gpio2Type;
    var gpio3Type;

    if (gpio1 && !gpio2 && !gpio3) {
      numberToCheck1 = gpio1.number;
      gpio1Type = gpio1.type;
    }
    if (gpio1 && gpio2 && !gpio3) {
      numberToCheck1 = gpio1.number;
      gpio1Type = gpio1.type;
      numberToCheck2 = gpio2.number;
      gpio2Type = gpio2.type;
    }
    if (gpio1 && gpio2 && gpio3) {
      numberToCheck1 = gpio1.number;
      gpio1Type = gpio1.type;
      numberToCheck2 = gpio2.number;
      gpio2Type = gpio2.type;
      numberToCheck2 = gpio3.number;
      gpio3Type = gpio3.type;
    }


    if (numberToCheck1 && !numberToCheck2 && !numberToCheck3) {

      return Gpio.findOne({
          ip: ip,
          number: numberToCheck1,
          type: gpio1Type
        })
        .then(function(gpio) {
          if (!gpio) {
            throw new Error('The gpio ' + numberToCheck1 + ' (' + ip + ') not found.');
          }
          if (gpio && gpio.owner) {
            throw new Error('The gpio ' + numberToCheck1 + ' (' + ip + ') is used by ' + gpio.owner);
          }
        });

    }

    if (numberToCheck1 && numberToCheck2 && !numberToCheck3) {
      return Gpio.findOne({
          ip: ip,
          number: numberToCheck1,
          type: gpio1Type
        })
        .then(function(gpio1) {
          if (!gpio1) {
            throw new Error('The gpio' + numberToCheck1 + ' (' + ip + ') not found.');
          }
          if (gpio1 && gpio1.owner) {
            throw new Error('The gpio' + numberToCheck1 + ' (' + ip + ') is used by ' + gpio1.owner);
          }

          return Gpio.findOne({
            ip: ip,
            number: numberToCheck2,
            type: gpio2Type
          });
        })
        .then(function(gpio2) {
          if (!gpio2) {
            throw new Error('The gpio' + numberToCheck2 + ' (' + ip + ') not found.');
          }
          if (gpio2 && gpio2.owner) {
            throw new Error('The gpio' + numberToCheck2 + ' (' + ip + ') is used by ' + gpio2.owner);
          }
        });
    }


    if (numberToCheck1 && numberToCheck2 && numberToCheck3) {
      return Gpio.findOne({
          ip: ip,
          number: numberToCheck1,
          type: gpio1Type
        })
        .then(function(gpio1) {
          if (!gpio1) {
            throw new Error('The gpio' + numberToCheck1 + ' (' + ip + ') not found.');
          }
          if (gpio1 && gpio1.owner) {
            throw new Error('The gpio' + numberToCheck1 + ' (' + ip + ') is used by ' + gpio1.owner);
          }

          return Gpio.findOne({
            ip: ip,
            number: numberToCheck2,
            type: gpio2Type
          });
        })
        .then(function(gpio2) {
          if (!gpio2) {
            throw new Error('The gpio' + numberToCheck2 + ' (' + ip + ') not found.');
          }
          if (gpio2 && gpio2.owner) {
            throw new Error('The gpio' + numberToCheck2 + ' (' + ip + ') is used by ' + gpio2.owner);
          }
          return Gpio.findOne({
            ip: ip,
            number: numberToCheck3,
            type: gpio3Type
          });
        })
        .then(function(gpio3) {
          if (!gpio3) {
            throw new Error('The gpio' + numberToCheck3 + ' (' + ip + ') not found.');
          }
          if (gpio3 && gpio3.owner) {
            throw new Error('The gpio' + numberToCheck3 + ' (' + ip + ') is used by ' + gpio3.owner);
          }
        });
    }

  }
};


module.exports = self;

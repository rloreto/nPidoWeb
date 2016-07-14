'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');

// const Imager = require('imager');
// const config = require('../../config/config');
// const imagerConfig = require(config.root + '/config/imager.js');

const Schema = mongoose.Schema;



/**
 * Article Schema
 */

const ComponentSchema = new Schema({
  type: { type : String, enum: ['switch', 'dimmer', 'socket', 'switchBlind', 'switchAudio', 'temperatureSensor','motionSensor', 'luminanceSensor', 'testAC'] },
  name: { type : String, default : '', trim : true },
  currentState: { type : String, default : '', trim : true },
  value: { type : Number, default : 0},
  gpios  : [{ type: Schema.Types.ObjectId, ref: 'Gpio' }]
});

/**
 * Validations
 */



/**
 * Pre-remove hook
 */

ComponentSchema.pre('remove', function (next) {
  next();
});

/**
 * Methods
 */

ComponentSchema.methods = {


};

/**
 * Statics
 */

ComponentSchema.statics = {


};

mongoose.model('Component', ComponentSchema);

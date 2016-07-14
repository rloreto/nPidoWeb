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

const DeviceSchema = new Schema({
  ip: { type : String, default : '', trim : true },
  name: { type : String, default : '', trim : true },
  state: { type : String, default : '', trim : true },
  isMaster: { type : Boolean},

});

/**
 * Validations
 */



/**
 * Pre-remove hook
 */

DeviceSchema.pre('remove', function (next) {
  next();
});

/**
 * Methods
 */

DeviceSchema.methods = {


};

/**
 * Statics
 */

DeviceSchema.statics = {



};

mongoose.model('Device', DeviceSchema);

'use strict';

/**
 * Module dependencies.
 */
const component = require('./component');
const mongoose = require('mongoose');

// const Imager = require('imager');
// const config = require('../../config/config');
// const imagerConfig = require(config.root + '/config/imager.js');

const Schema = mongoose.Schema;



/**
 * Article Schema
 */

const GpioSchema = new Schema({
  ip: { type : String, default : '', trim : true },
  number: { type : Number, default : 0},
  type: { type : String, default : '', trim : true },
  direction: { type : String, default : 'out'},
  action: { type : String, default : '', trim : true },
  owner:  { type: Schema.Types.ObjectId }
});

/**
 * Validations
 */

GpioSchema.path('ip').required(true, 'Gpio ip cannot be blank');
GpioSchema.path('number').required(true, 'Gpio number cannot be blank');
GpioSchema.path('type').required(true, 'Gpio type cannot be blank');

/**
 * Pre-remove hook
 */

GpioSchema.pre('remove', function (next) {
  // const imager = new Imager(imagerConfig, 'S3');
  // const files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  // imager.remove(files, function (err) {
  //   if (err) return next(err);
  // }, 'article');

  next();
});



GpioSchema.methods = {


};



GpioSchema.statics = {

};

mongoose.model('Gpio', GpioSchema);

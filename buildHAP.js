var DeviceService = require('./services/device');
var rp = require('request-promise');
var request = require('sync-request');
var http = require('http');
const mongoose = require('mongoose');
require('./models/device');
const Device = mongoose.model('Device');
const Component = mongoose.model('Component');
const suspend = require('suspend');
var os = require("os");
var fs = require('fs');
var dotenv = require('dotenv');
var hapPath = '/Users/roberto/Documents/Source/HAP-NodeJS';
//var hapPath = '/home/pi/HAP-NodeJS';

dotenv.load();
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

suspend(function*() {
    var self= this;
   
    var components = yield Component.find({}).populate('gpios').exec();

    components.forEach(function(component){

        var file = hapPath+'/templates/'+component.type+'.js';
        var mac = component.mac.split(':').join('-');
        if(fs.existsSync(file)){
                console.log(component.type);
            var content = fs.readFileSync(file, 'utf8');
            content = content.replace('###name###', component.name);
            content = content.replace('###mac###', mac);
            content = content.replace('###componentid###', component._id);
            var accessoryFile = hapPath+'/accessories/'+mac+'_accessory.js'
            fs.writeFileSync(accessoryFile, content, 'utf8');
            console.log('Created or updated '+ accessoryFile);
        }
    });
  process.exit(1);
})();


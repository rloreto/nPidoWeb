/**
 * DevicesController
 * @description :: Server-side logic for managing devices
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
 var DeviceService = require('../../services/device');


 const mongoose = require('mongoose');
 mongoose.Promise = require('bluebird');
 require('../../models/device');
 const Device = mongoose.model('Device');

module.exports = {
      join: function(req, res){
        var port= DeviceService.getAppPort(req);
        var ip = req.body.ip;
      	var name = req.body.ip;
      		if(!ip){
      			res.json({ status: 'failed', error: 'The "{ip:'<ip>'}" is required.'});
            return;
      		}
      		if(req.body.name) {
      			name = req.body.name;
      		}
    		Device.findOne({ ip: ip })
        .exec()
    		.then(function(found){
    			if(found){
    				throw new Error('The devices is already joined.');
    			}
    			return Device.create({ ip: ip, name: name, state: 'joined'});

    		})
    		.then(function(){
    			return DeviceService.register(ip, port);
    		})
    		.catch(function(e){
    			res.json({ status: 'failed', error: e.message});
          return;
    		})
    		.then(function(result){
    			res.json(result);
    		});
    	}
};

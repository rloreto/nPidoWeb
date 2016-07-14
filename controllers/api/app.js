/**
 * AppController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */



module.exports = {


    ping: function(req, res){
        return res.json({
          status: 'ok',
          name: 'PiDo',
          version: '0.1'
        });
    }

};

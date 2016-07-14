/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


module.exports = {

    start: function (req, res) {

        var options = {
          host: '10.0.2.44',
          port: 1337,
          path: '/api/devices',
          method: 'POST',
          header: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
          }
        };
        http.request(options, function(resp){
          resp.setEncoding('utf8');
          var arr = '';
          resp.on('data', function (chunk){
            arr += chunk;
          });
          resp.on('end', function (){
            var data = JSON.parse(arr);
            res.writeHead(200, {'Content-Type': 'application/json',});
            res.end(JSON.stringify(data));
          });
        }).end(JSON.stringify(postData));

	    return findService.findRecords(req, res);
    },
    ping: function(){
        return res.json({
          status: 'ok',
          name: 'PiDo',
          version: '0.1'
        });
    }

};

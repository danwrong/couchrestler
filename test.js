var sys = require('sys'),
    couch = require('./lib/couchrestler');
    
var db = couch.server().db('testies');

sys.p(db.view('test/sum').wait());
Couch Restler
=============

(c) Dan Webb (dan@danwebb.net/@danwrong) 2009, licensed under an MIT License

A CouchDB library for node.js based on top of Restler (http://github.com/danwrong/restler).  Mostly
just created as a sample application of the Restler library but with the intention of being
a solid, well tested couchDB wrapper.

Usage
-----

To use couchrestler make sure that you have restler somewhere in your require.paths.


    var couch = require('couchrestler');
    
    var db = couch.server('http://mycouch.local:3545').db('mydb');
    
    db.create().addCallback(function(result) {
      if (result.ok) {
        db.put({
          name: 'Dan Webb',
          twitter: 'danwrong',
          url: 'http://danwebb.net'
        }).addCallback(function(result) {
          sys.puts('Doc created with id: ' + result.id);
        });
      }
    });
    
Have a look at the tests to find out more.  Just kicking stuff about at the moment really.
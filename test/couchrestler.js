var test = require('./nodetest'),
    couch = require('../lib/couchrestler'),
    sys  = require('sys');
    
// NB: Make sure you have couchDB running at localhost:5984
    
test.testcase('CouchRestler', {
  setupOnce: function() {
    this.db = couch.server().db('couchrestlertest');
    try {
      this.db.drop().wait();
    } catch(e) {}
    this.db.create().wait();
  },
  testShouldGetListOfDbs: function(test) {
    var result = couch.server().allDbs().wait();
    test.assertInstanceof(result, Array);
  },
  testShouldGenerateUUIDs: function(test) {
    couch.uuidCacheSize = 5;
    var uuid;
    
    for (var i=0; i < 20; i++) {
      uuid = couch.server().getUUID();
      test.assertTrue(typeof uuid == 'string', uuid);
    }
  },
  testShouldCreateAndDropDBSuccessfully: function(test) {
    var db = couch.server().db('test' + (new Date).getTime());
    var result = db.create().wait();
    test.assertTrue(result.ok);
    var result = db.drop().wait();
    test.assertTrue(result.ok);
  },
  testShouldGetInfoSuccessfully: function(test) {
    var result = this.db.info().wait();
    test.assertEquals('couchrestlertest', result.db_name);
  },
  testShouldCreateAndRetrieveDocumentSuccessfully: function(test) {
    var result = this.db.put({ test: true, text: 'Some stuff' }).wait();
    test.assertTrue(result.ok, result);
    result = this.db.get(result.id).wait();
    test.assertTrue(result.test, result);
  },
  testShouldRetrieveAndUpdateDocumentSuccessfully: function(test) {
    var result = this.db.put({ test: true, text: 'Some stuff' }).wait();
    test.assertTrue(result.ok, result);
    
    var id = result.id;
    var doc = this.db.get(id).wait();
    doc.booyah = 'hello';
    
    result = this.db.put(doc).wait();
    test.assertTrue(result.ok);
    
    var doc = this.db.get(id).wait();
    test.assertEquals('hello', doc.booyah);
  }
});
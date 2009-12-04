var rest = require('restler'),
    sys  = require('sys');

function Server(uri) {
  this.uri = uri || exports.options.defaultServerURL;
  this._uuidCache = [];
}

Server.prototype =  {
  db: function(name) {
    return new Database(this, name);
  },
  allDbs: function() {
    return this.request('_all_dbs');
  },
  request: function(url, options) {
    var p = new process.Promise;
    
    options = options || {};
    options.headers = options.headers || {};
    options.headers = {
      'Accept': 'application/json',
      'User-Agent': 'CouchRestler',
      'Content-Type': 'application/json'
    };
    
    if (options.data) options.data = JSON.stringify(options.data);
  
    options.parser = rest.parsers.json;
  
    rest.request(this.url(url), options).addListener('success', function(data) {
      p.emitSuccess(data);
    }).addListener('error', function(data) {
      p.emitError(data);
    });
  
    return p;
  },
  url: function(path) {
    return [this.uri, path].join('/');
  },
  getUUID: function() {
    if (this._uuidCache.length == 0) {
      this._uuidCache = this.request('_uuids?count=' + exports.options.uuidCacheSize).wait().uuids;
    }
    
    return this._uuidCache.pop();
  }
}
    
function Database(server, name) {
  this.name = name;
  this.server = server; 
}

Database.prototype = {
  info: function() {
    return this._request();
  },
  create: function() {
    return this._request('put');
  },
  drop: function() {
    return this._request('del');
  },
  get: function(id) {
    return this._request('get', id);
  },
  put: function(doc) {
    var id;
    
    if (doc.id || doc._id) {
      id = doc.id || doc._id;
      delete doc.id;
      delete doc._id;
    } else id = this.server.getUUID();
    
    return this._request('put', id, { data: doc });
  },
  remove: function(id) {
    return this._request('del', id);
  },
  view: function(name, options) {
    name = name.split('/');
    return this._request('get', 
                        ['_design', name[0], '_view', name[1]].join('/'), { query: options });
  },
  _url: function(path) {
    return [this.name, path].join('/');
  },
  _request: function(method, path, options) {
    options = options || {};
    options.method = method;
    return this.server.request(this._url(path), options);
  }
};

process.mixin(exports, {
  options : {
    defaultServerURL: 'http://localhost:5984',
    uuidCacheSize: 100
  },
  server: function(host, port) {
    return new Server(host, port);
  },
});
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
  replicate: function(source, target) {
    return this.request('_replication', { body: { soruce: source, target: target } });
  },
  request: function(url, options) {
    var p = new process.Promise;
    
    options = options || {};
    options.headers = options.headers || {};
    options.headers = {
      'Accept': 'application/json',
      'User-Agent': 'CouchRestler'
    };
    
    if (options.data) {
      options.data = JSON.stringify(options.data);
      options.headers['Content-Type'] = 'application/json';
    }
  
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
      this._uuidCache = this.request('_uuids?count=' + 
        exports.options.uuidCacheSize).wait().uuids;
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
  update: function(id, attributes) {
    var p = new process.Promise;
    var self = this;
    
    this.get(id).addCallback(function(doc) {
      process.mixin(doc, attributes);
      
      self.put(doc).addCallback(function(result) {
        p.emitSuccess(result);
      }).addErrback(function(result) {
        p.emitError(result);
      });
    }).addErrback(function(result) {
      p.emitError(result);
    });
    
    return p;
  },
  remove: function(id) {
    return this._request('del', id);
  },
  design: function(name) {
    return new Design(this, name);
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

function Design(database, name) {
  this.database = database;
  this.name = name;
  this.id = "_design/" + this.name;
}

Design.prototype = {
  put: function(doc) {
    doc.id = this.id;
    doc.language = doc.language || 'javascript';
    return this.database.put(doc);
  },
  get: function() {
    return this.database.get(this.id);
  },
  del: function() {
    return this.database.del(this.id);
  },
  update: function(attributes) {
    return this.database.update(this.id, attributes);
  },
  view: function(name, options) {
    if (options) {
      for (var key in options) {
        options[key] = JSON.stringify(options[key]);
      }
    }
    
    return this.database._request('get', [this.id, '_view', name].join('/'), 
      { query: options });
  } 
};

var design = {
  view: function(map, reduce) {
    var view = {};
    if (map) view.map = map.toString();
    if (reduce) view.reduce = reduce.toString();
    return view;
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
  design: design
});
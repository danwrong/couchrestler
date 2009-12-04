var mjsunit = require('mjsunit');
var sys = require('sys');

sys.red = function(message) { sys.puts("\033[0;31m" + message + "\033[1;37m"); }
sys.green = function(message) { sys.puts("\033[0;32m" + message + "\033[1;37m"); }

function TestCase(name, test) {
  this.name = name;
  this.test = test;
  this.tests = [];
}

TestCase.prototype = {
  run: function() {
    var self = this;
    
    if (typeof this.test.setupOnce == 'function') 
      this.test.setupOnce();
     
    for (var name in this.test) {
      if (name.match(/^test/)) {
        var t = new Test(name, this.test[name]);
        this.tests.push(t);
        t.run(this.test);
      }
    }
    
    process.addListener("exit", function() {
      var totalAssertions = 0;
      var failed = [], passed = [];
      
      self.tests.forEach(function(t) {
        if (t.passed) { 
          totalAssertions += t.assertionsPassed;
          passed.push(t);
        } else {
          failed.push(t);
        }
      });
      
      sys.puts('');
      
      if (failed.length > 0) {
        sys.red(self.name + ' Tests Failed');
        failed.forEach(function(fail) {
          sys.puts(fail.name + ': ' + fail.reason);
        });
      } else {
        sys.green(self.name + ' Tests Passed');
      }
            
      sys.puts("\n" + (passed.length + failed.length) + " tests, " + totalAssertions + ' assertions ran');
      sys.puts(passed.length + ' tests passed, ' + failed.length + ' failed');
    });
  }
}

function Test(name, body) {
  this.name = name;
  this.body = body;
  this.assertionsPassed = 0;
  this.passed = true;
}

/* Wrap the MJSUnit tests */
for (var method in mjsunit) {
  if (/^assert/.test(method)) { 
    (function() {
      var m = method;
      Test.prototype[m] = function() {
        try {
          mjsunit[m].apply(this, arguments);
          this.assertionsPassed += 1;
        } catch(e) {
          this.reason = e.message;
          this.passed = false;
        }
      }
      sys.print('.');
    })();
  }
}

Test.prototype.run = function(context) {
  if (typeof context.setup == 'function') context.setup(this);
  this.body.call(context, this);
}

process.mixin(exports, {
  testcase: function(name, testcase) {
    var test = new TestCase(name, testcase);
    test.run();
  }
});
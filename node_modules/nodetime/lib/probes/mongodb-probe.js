'use strict';


var internalCommands = [
  '_executeQueryCommand', 
  '_executeInsertCommand', 
  '_executeUpdateCommand', 
  '_executeRemoveCommand'
];

var commandMap = {
  '_executeQueryCommand': 'find', 
  '_executeInsertCommand': 'insert', 
  '_executeUpdateCommand': 'update', 
  '_executeRemoveCommand': 'remove'
};



function MongodbProbe(agent) {
  this.agent = agent;

  this.packages = ['mongodb'];
}
exports.MongodbProbe = MongodbProbe;



MongodbProbe.prototype.attach = function(obj) {
  var self = this;

  if(obj.__nodetimeProbeAttached__) return;
  obj.__nodetimeProbeAttached__ = true;

  var proxy = self.agent.proxy;
  var profiler = self.agent.profiler;
  var counter = profiler.createSkipCounter();
  var metrics = profiler.createCallMetricsGroups();
  var type = 'MongoDB';


  var collsCount = 0;
  var colls = {};
  var collNameRegex = /[^\.\$]+\.([^\.\$]+)/;

  function monitorCollection(host, port, dbName, collName) {
    if(!self.agent.features.mongodbMetrics) return;

    var m = collNameRegex.exec(collName);
    if(!m || !m[1]) return;
    collName = m[1];

    var address = host + ':' + port + ':' + dbName + ':' + collName;
    if(colls[address] || ++collsCount > 40) return;

    colls[address] = {
      host: host, 
      port: port, 
      dbName: dbName,
      collName: collName
    };
  }


  function metric(stats, scope, name, key, unit) {
    var numVal = parseFloat(stats[key]);
    if(typeof(numVal) !== 'number') return;
    if(unit === 'KB') numVal /= 1024;

    self.agent.metric(
      scope,
      name, 
      numVal, 
      unit,
      'gauge'
    );
  }


  function done(mClient, err) {
    try {
      if(mClient) mClient.close()
    }
    catch(err2) {
      self.agent.logger.error(err2);
    }

    if(err) {
      self.agent.logger.error(err);  
    }   
  }


  function loadStats(coll) {
    var mClient = new obj.Db(
      coll.dbName, 
      new obj.Server(coll.host, coll.port, {'auto_reconnect': false, 'poolSize': 1}), 
      {safe: false});
    
    mClient.open(function(err) {
      if(err) return done(mClient, err);

      try {
        mClient.collection(coll.collName, function(err, collection) {
          if(err) return done(mClient, err);

          try {
            collection.stats(function(err, stats) {
              if(err) return done(mClient, err);
              if(!stats) return done(mClient);

              try {
                var scope = 
                  'MongoDB Collection/' +
                  coll.host + ':' + coll.port + '/' + 
                  coll.dbName + '/' + 
                  coll.collName;

                metric(stats, scope, 'Object count' ,'count', null);
                metric(stats, scope, 'Collection size' ,'size' , 'KB');
                metric(stats, scope, 'Average object size' ,'avgObjSize' , 'KB');
                metric(stats, scope, 'Storage size' ,'storageSize' , 'KB');
                metric(stats, scope, 'Index size' ,'totalIndexSize' , 'KB');
                metric(stats, scope, 'Padding factor' ,'paddingFactor' , null);

                done(mClient);
              }
              catch(err) {
                done(mClient, err);
              }
            });
          }
          catch(err) {
            done(mClient, err);
          }
        });
      }
      catch(err) {
        done(mClient, err);
      }
    });
  }

  self.agent.timers.setInterval(function() {
    for(var address in colls) {
      try {
        loadStats(colls[address]);
      }
      catch(err) {
        self.agent.logger.error(err);
      }
    }
  }, 60000);

  internalCommands.forEach(function(internalCommand) {
    var commandName = commandMap[internalCommand];

    proxy.before(obj.Db.prototype, internalCommand, function(obj, args) {
      var trace = profiler.stackTrace();
      var command = (args && args.length > 0) ? args[0] : undefined;
      var time = profiler.time(type, commandName);
      metrics.callStart(type, null, time);
      metrics.callStart(type, commandName, time);

      proxy.callback(args, -1, function(obj, args) {
        if(!time.done()) return;
        metrics.callDone(type, null, time);
        metrics.callDone(type, commandName, time);
        if(counter.skip(time)) return;

        var conn = {};
        if(command.db) {
          var servers = command.db.serverConfig;
          if(servers) {
            if(Array.isArray(servers)) {
              conn.servers = [];
              servers.forEach(function(server) {
                conn.servers.push({host: server.host, port: server.port});

                monitorCollection(server.host, server.port, command.db.databaseName, command.collectionName);
              }); 
            }
            else {
              conn.host = servers.host;
              conn.port = servers.port;

              monitorCollection(servers.host, servers.port, command.db.databaseName, command.collectionName);
            }
          }
          
          conn.database = command.db.databaseName;
        }

        var query = command.query ? profiler.truncate(JSON.stringify(command.query)) : '{}';
        var error = proxy.getErrorMessage(args);

        var sample = profiler.createSample();
        sample['Type'] = type;
        sample['Connection'] = conn;
        sample['Command'] = {
          collectionName: command.collectionName, 
          commandName: commandName, 
          query: query, 
          queryOptions: command.queryOptions, 
          numberToSkip: command.numberToSkip,
          numberToReturn: command.numberToReturn};
        sample['Stack trace'] = trace;
        sample['Error'] = error;
        sample._group = type + ': ' + commandName;
        sample._label = type + ': ' + commandName;

        profiler.addSample(time, sample);
      });
    });
  });
};


'use strict';


var commands = [
    "append",
    "auth",
    "bgrewriteaof",
    "bgsave",
    "blpop",
    "brpop",
    "brpoplpush",
    "config",
    "dbsize",
    "debug",
    "decr",
    "decrby",
    "del",
    "discard",
    "echo",
    "exec",
    "exists",
    "expire",
    "expireat",
    "flushall",
    "flushdb",
    "get",
    "getbit",
    "getrange",
    "getset",
    "hdel",
    "hexists",
    "hget",
    "hgetall",
    "hincrby",
    "hkeys",
    "hlen",
    "hmget",
    "hmset",
    "hset",
    "hsetnx",
    "hvals",
    "incr",
    "incrby",
    "info",
    "keys",
    "lastsave",
    "lindex",
    "linsert",
    "llen",
    "lpop",
    "lpush",
    "lpushx",
    "lrange",
    "lrem",
    "lset",
    "ltrim",
    "mget",
    "monitor",
    "move",
    "mset",
    "msetnx",
    "multi",
    "object",
    "persist",
    "ping",
    "psubscribe",
    "publish",
    "punsubscribe",
    "quit",
    "randomkey",
    "rename",
    "renamenx",
    "rpop",
    "rpoplpush",
    "rpush",
    "rpushx",
    "sadd",
    "save",
    "scard",
    "sdiff",
    "sdiffstore",
    "select",
    "set",
    "setbit",
    "setex",
    "setnx",
    "setrange",
    "shutdown",
    "sinter",
    "sinterstore",
    "sismember",
    "slaveof",
    "smembers",
    "smove",
    "sort",
    "spop",
    "srandmember",
    "srem",
    "strlen",
    "subscribe",
    "sunion",
    "sunionstore",
    "sync",
    "ttl",
    "type",
    "unsubscribe",
    "unwatch",
    "watch",
    "zadd",
    "zcard",
    "zcount",
    "zincrby",
    "zinterstore",
    "zrange",
    "zrangebyscore",
    "zrank",
    "zrem",
    "zremrangebyrank",
    "zremrangebyscore",
    "zrevrange",
    "zrevrangebyscore",
    "zrevrank",
    "zscore",
    "zunionstore"
];


function RedisProbe(agent) {
  this.agent = agent;

  this.packages = ['redis'];
}
exports.RedisProbe = RedisProbe;



RedisProbe.prototype.attach = function(obj) {
  var self = this;

  if(obj.__nodetimeProbeAttached__) return;
  obj.__nodetimeProbeAttached__ = true;

  var logger = self.agent.logger;
  var proxy = self.agent.proxy;
  var profiler = self.agent.profiler;
  var counter = profiler.createSkipCounter();
  var metrics = profiler.createCallMetricsGroups();
  var type = 'Redis';

  var clientsCount = 0;
  var clients = {};

  function monitorServer(host, port, password) {
    if(!self.agent.features.redisMetrics) return;

    var address = host + ':' + port;
    if(clients[address]) {
      if(password) {
       clients[address].password = password;
      }
    }
    else if(++clientsCount <= 10) {
      clients[address] = {
        host: host, 
        port: port, 
        password: password,
        lastValues: {}
      };
    }
  }


  function metric(client, info, scope, name, key, unit, isRelative) {
    var numVal = parseFloat(info[key]);
    if(typeof(numVal) !== 'number') return; 
    if(unit === 'KB') numVal /= 1024;

    if(isRelative) {
      if(client.lastValues[key]) {
        self.agent.metric(
          scope, 
          name, 
          numVal - client.lastValues[key], 
          unit, 
          'gauge');
      }

      client.lastValues[key] = numVal;
    }
    else {
      self.agent.metric(
        scope, 
        name, 
        numVal, 
        unit,
        'gauge');
    }
  }


  function done(rClient, err) {
    try {
      rClient.quit();
    }
    catch(err2) {
      try {
        rClient.end();
      }
      catch(err3) {
        logger.error(err3);
      }

      logger.error(err2);
    }

    logger.error(err);      
  }


  function loadInfo(client) {
    var rClient = obj.createClient(client.port, client.host);
    
    rClient.on('error', function(err) {
      done(rClient, err);
    });

    if(client.password) {
      rClient.auth(client.password, function(err) {
        if(err) done(rClient, err);
      });
    }

    rClient.on('ready', function() {
      try {
        var info = rClient.server_info;
        var scope = 'Redis Server/' + client.host + ':' + client.port;

        metric(client, info, scope, 'Used CPU sys' ,'used_cpu_sys' , null, true);
        metric(client, info, scope, 'Used CPU user' ,'used_cpu_user' , null, true);
        metric(client, info, scope, 'Connected clients' ,'connected_clients' , null, false);
        metric(client, info, scope, 'Connected slaves' ,'connected_slaves' , null, false);
        metric(client, info, scope, 'Blocked clients' ,'blocked_clients' , null, false);
        metric(client, info, scope, 'Expired keys', 'expired_keys' , null, true);
        metric(client, info, scope, 'Evicted keys' ,'evicted_keys' , null, true);
        metric(client, info, scope, 'Keyspace hits' ,'keyspace_hits' , null, true);
        metric(client, info, scope, 'Keyspace misses' ,'keyspace_misses' , null, true);
        metric(client, info, scope, 'Connections received' ,'total_connections_received' , null, true);
        metric(client, info, scope, 'Commands processed' ,'total_commands_processed' , null, true);
        metric(client, info, scope, 'Rejected connections' ,'rejected_connections' , null, true);
        metric(client, info, scope, 'Used memory', 'used_memory', 'KB', false);
        metric(client, info, scope, 'Used memory RSS' , 'used_memory_rss', 'KB', false);
        metric(client, info, scope, 'Memory fragmentation ratio' , 'mem_fragmentation_ratio', null, false);
        metric(client, info, scope, 'PubSub channels' ,'pubsub_channels' , null, false);

        done(rClient);
      }
      catch(err) {
        done(rClient, err);
      }
    });
  }

  self.agent.timers.setInterval(function() {
    for(var address in clients) {
      try {
        loadInfo(clients[address]);
      }
      catch(err) {
        logger.error(err);
      }
    }
  }, 60000);


  proxy.after(obj, 'createClient', function(obj, args, ret) {
    var client = ret;

    monitorServer(client.host, client.port);

    commands.forEach(function(command) {
      proxy.before(ret, command, function(obj, args) {
        var trace = profiler.stackTrace();
        var time = profiler.time(type, command);
        metrics.callStart(type, null, time);
        metrics.callStart(type, command, time);
        var params = args;

        if(command === 'auth' && args.length > 0) {
          monitorServer(client.host, client.port, args[0]);
        }

        proxy.callback(args, -1, function(obj, args) {
          if(!time.done(proxy.hasError(args))) return;
          metrics.callDone(type, null, time);
          metrics.callDone(type, command, time);
          if(counter.skip(time)) return;

          var error = proxy.getErrorMessage(args);
          var sample = profiler.createSample();
          sample['Type'] = type;
          sample['Connection'] = {host: client.host, port: client.port};
          sample['Command'] = command;
          sample['Arguments'] = profiler.truncate(params);
          sample['Stack trace'] = trace;
          sample['Error'] = error;
          sample._group = type + ': ' + command;
          sample._label = type + ': ' + command;

          profiler.addSample(time, sample);
        });
      });
    });
  });
};


//global
secret = require('./get_secret');
///////////

//libs
var knox = require('knox'),
    domain = require('domain'),
    program = require('commander'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    s3Lister = require('s3-lister'),
    util = require('util'),
    split = require('split'),
    walk = require('walk');
///////////
var logfile = fs.createWriteStream('s3.log');

var load_bucket = function(bucket){
    secret.bucket = bucket;
    var s3 = knox.createClient(secret);
    return s3;
};

var indicator = function(count) {
    if (count % 1000 === 0) {
        process.stderr.clearLine();
        process.stderr.cursorTo(0);
        process.stderr.write(count.toString());
    }
};

var list_local = function(bucket_name, local_file, cb) {
    var bucket = load_bucket(bucket_name);
    var rs = fs.createReadStream(local_file, 
                                 { highWaterMark: 2 });
    var counter = 0;
    rs.pipe(split())
        .on('data', function(key){
                indicator(counter);
                cb(key, bucket);
                counter ++;
            });
};

    

var list_map = function(bucket_name, options, cb) {
    var bucket = load_bucket(bucket_name);
    var filter_exp = new RegExp(options.filter);
    var lister = new s3Lister(bucket, {
        prefix: options.prefix,
        start: options.start,
        maxKeys: options.maxKeys
    });
    var counter = 0;
    lister
        .on('error', function (err){
            logfile.write('[ERROR] ' + err + '\n');
        })
        .on('data', function(data) {
            var key = data.Key;
            if (options.filter) {
                if (key.match(filter_exp)) {
                    indicator(counter);
                    cb(key, bucket);
                    counter++;
                }
            } else {
                indicator(counter);
                cb(key, bucket);
                counter++;
            }
        })
        .on('end', function () {
            console.log('done.. there were %s matching results', counter);
    });
};

var listing = function(k, b) {
    logfile.write(util.format(k,'\n'));
};

var upload = function(bucket_name, dir) {
    if (!dir) {
        console.log("please specify an input directory");
        process.exit();
    }
    var bucket = load_bucket(bucket_name);
    var walk_options = {
        followLinks: true
    };
    var walker = walk.walk(dir, walk_options);
    var counter = 0;
    walker.on('file', function(root, fileStats, next) {
        var file_name = path.join(root, fileStats.name);
        //console.log("begin reading ", file_name);
        bucket.putFile(file_name, file_name, function(err, res) {
            if (err) {
                logfile.write('[ERROR] ' + err + '\n');
            }
            //console.log("finish reading ", file_name);
            indicator(counter);
            counter ++;
        });
        next();
    });
    walker.on('end', function() {
        console.log('done');
    });
};

var download = function(k, b) {
    b.getFile(k, function(err, res) {
        if (err) logfile.write('[ERROR] ' + err + '\n');
        if (res) {
            var dir = path.join(process.cwd() , (program.output || ''));
            var full_path = path.resolve(dir, k);
            fs.exists(path.dirname(full_path), function(e) {
                if (e) {
                    var ws = fs.createWriteStream(full_path);
                    //console.log("writing in ", full_path);
                    res.pipe(ws).on('finish', function() {
                        //console.log(" finished writing ", full_path);
                    });
                } else {
                    mkdirp(path.dirname(full_path), function(err) {
                        if (err) {
                            logfile.write('[ERROR] ' + err + '\n');
                            return;
                        }
                        var ws = fs.createWriteStream(full_path);
                        console.log("writing in ", full_path);
                        res.pipe(ws).on('finish', function() {
                            console.log(" finished writing ", full_path);
                        });
                    });
                }
            });
        }
    });
};

var del = function(k, b) {
    b.del(k).on('response', function(res) {
        console.log("DELETE:", res.statusCode, k);
    }).end();
};

var copy = function(bucket_from, bucket_to, options) {
    var dest_options = {bucket: bucket_to};
    return list_map(bucket_from, options, function(k, b) {
        logfile.write(util.format("copying", k, "to", bucket_to, '\n'));
        b.copyTo(k, dest_options, k, function(err, ret) {
            if (err) {
                console.log(err);
            } else {
                logfile.write(util.format("finished copying", k, '\n'));
            }
        }).end();
    });
};


var do_with_retry = function(fn, tryCount, delay, cb) {
  var tryIndex = 0;

  tryOnce();

  function tryOnce() {
    fn(function(err, result) {
      if (err) {
        if (err.retryable === false) {
          cb(err);
        } else {
          tryIndex += 1;
          if (tryIndex >= tryCount) {
            cb(err);
          } else {
            setTimeout(tryOnce, delay);
          }
        }
      } else {
        cb(null, result);
      }
    });
  }
}

module.exports = {
    load_bucket: load_bucket,
    list_map: list_map,
    list_local: list_local,
    listing: listing,
    download: download,
    del: del,
    upload: upload,
    copy: copy,
    logfile: logfile
};

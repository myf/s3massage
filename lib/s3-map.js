//global
secret = require('../sec');
///////////

//libs
var knox = require('knox'),
    program = require('commander'),
    find =require('findit'),
    _ = require('underscore'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    s3Lister = require('s3-lister'),
    walk = require('walk');
///////////
var logfile = fs.createWriteStream('s3.log');

var load_bucket = function(bucket){
    secret.bucket = bucket;
    var s3 = knox.createClient(secret);
    return s3;
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
                    cb(key, bucket);
                    counter++;
                }
            } else {
                cb(key, bucket);
                counter++;
            }
        })
        .on('end', function () {
            console.log('done.. there were %s matching results', counter);
    });
};

var listing = function(k, b) {
    console.log(k);
};

var upload_old = function(bucket_name, dir) {
    if (!dir) {
        console.log("please specify an input directory");
        process.exit();
    }
    var bucket = load_bucket(bucket_name);
    var finder = find(dir);
    finder.on('file', function(file, stat) {
        bucket.putFile(file, file, function(err, res) {
            if (err) {
                logfile.write('[ERROR] ' + err + '\n');
            }
            console.log(file);
        });
    });
    finder.on('end', function() {
        console.log('done');
    });
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
    walker.on('file', function(root, fileStats, next) {
        console.log(path.join(root, fileStats.name));
        next();
        /*
        bucket.putFile(file, file, function(err, res) {
            if (err) {
                logfile.write('[ERROR] ' + err + '\n');
            }
            console.log(file);
        });
        */
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
                    console.log("writing in ", full_path);
                    res.pipe(ws).on('finish', function() {
                        console.log(" finished writing ", full_path);
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

module.exports = {
    load_bucket: load_bucket,
    list_map: list_map,
    listing: listing,
    download: download,
    del: del,
    upload: upload
};

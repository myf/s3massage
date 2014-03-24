//global
secret = require('../sec');
///////////

//libs
var knox = require('knox'),
    find =require('findit'),
    _ = require('underscore'),
    fs = require('fs'),
    s3Lister = require('s3-lister');
///////////

var load_bucket = function(bucket){
    var credentials = {};
    credentials.bucket = bucket;
    _.map(secret, function(val, key){
        credentials[key] = val;
    });
    var s3 = knox.createClient(credentials);
    return s3;
};

var upload = function(bucket_name, dir) {
    if (!dir) {
        console.log("please specify an input directory");
        process.exit();
    }
    var bucket = load_bucket(bucket_name);
    var finder = find(dir);
    finder.on('file', function(file, stat) {
        bucket.putFile(file, file, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(file);
        });
    });
};

var list_map = function(bucket_name, prefix, start, filter, cb) {
    var bucket = load_bucket(bucket_name);
    var filter_exp = new RegExp(filter);
    var lister = new s3Lister(bucket, {
        prefix: prefix,
        start: start
    });
    var counter = 0;
    lister
        .on('error', function (err){
            console.log(err);
        })
        .on('data', function(data) {
            var key = data.Key;
            if (filter) {
                if (key.match(filter_exp)) {
                    cb(key, bucket);
                }
            } else {
                cb(key, bucket);
            }
            counter++;
        })
        .on('end', function () {
            console.log('done.. there were %s matching results', counter);
    });
};

var listing = function(k, b) {
    console.log(k);
};

var download = function(k, b) {
    b.get(k).on('response', function(res) {
        var dir = process.output || process.cwd();
        var ws = fs.createWriteStream(dir +'/' + k);
        res.pipe(ws);
    }).end();
};

var del = function(k, b) {
    b.del(k).on('response', function(res) {
        console.log(res.statusCode, k);
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

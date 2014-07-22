//global
secret = require('./sec');
///////////

//libs
var knox = require('knox'),
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

var list_map = function(bucket_name, prefix, start, cb) {
    var bucket = load_bucket(bucket_name);
    start = start || '';
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
            cb(data.Key, bucket);
            counter++;
            console.log(counter, data.Key);
        })
        .on('end', function () {
            console.log('done');
    });
};

var copy_data_formhub = function(origin_key, bucket){
    var re = /^ossap\/attachments\//;
    var photo_file = origin_key.replace(re, '');
    var photo_id = photo_file.replace(/\.jpg$/, '');
    var id_list = photo_id.split('-');
    var id = id_list[0];
    var size = id_list[1] ? id_list[1] : 'original';
    var dest_key = size + '/' + photo_file;
    console.log(origin_key, dest_key);
    bucket.copyTo(origin_key, 'nmisfac', dest_key, function(err, ret) {
        if (err) {
            console.log(err);
        }
    }).end();
};


var change_size = function(size) {
    return list_map('nmisfac', size, 'small/1347107879751-small.jpg', function(k, b) {
        var re = new RegExp(size + '\/');
        var photo_file = k.replace(re, '');
        if (!photo_file.match(size)) return;
        var photo_id = photo_file.replace(/\.jpg$/, '');
        var id_list = photo_id.split('-');
        var id = id_list[0];
        var dest_key = size + '/' + id + '.jpg';
        b.copy(k, dest_key, function(err, res) {
            if (err) { console.log(err); }
        }).end();
    });
};



var size_sel = function(size) {
    switch(size) {
        case "200":
            return "medium";
        case "90":
            return "small";
        case "0":
            return "";
    }
};

var copy_data_nmisstatic =  function(original_key, bucket) {
    //format is: facimg/0/0/1305196040042_1.jpg
    var re = /^facimg\/([0-9a-f])\/([0-9]+)\/([0-9_]+)\.jpg$/;
    var match = re.exec(original_key);
    if (match) {
        var size = size_sel(match[2]);
        var photo = match[3];
        var dest_photo = size == "" ? photo + '.jpg' : photo + '-' + size + '.jpg';
        var dest_key = 'formhub-ossap/ossap/attachments/' + dest_photo;
        console.log(dest_key)
        bucket.copyTo(original_key, dest_key, function(err, ret) {
            if (err) {
                console.log(err);
            }
            console.log(dest_key, 'registered')
        }).end();
    }
};

var run_delete = function(bucket_name, prefix){
    var bucket = load_bucket(bucket_name);
    var lister = new s3Lister(bucket, {prefix: '' + prefix});
    var counter = 0;
    lister
        .on('error', function (err){
            console.log(err);
        })
        .on('data', function (data){
            bucket.del(data.Key, function(err, ret) {
                if (err) {
                    console.log(err);
                }
            }).end();
            counter++;
            console.log(counter);
        })
        .on('end', function () {
            console.log('done');
    });

};

list_map('nmisstatic', 'facimg/', '', function(k, b){
    copy_data_nmisstatic(k, b)
});

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


var copy_data = function(origin_key, bucket){
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

var size_sel = function(size) {
    switch(size) {
        case "200":
            return "medium";
        case "90":
            return "small";
        case "0":
            return "original";
    }
};

var copy_data_nmisstatic =  function(original_key, bucket) {
    //format is: facimg/0/0/1305196040042_1.jpg
    var re = /^facimg\/([0-9a-f])\/([0-9]+)\/([0-9_]+\.jpg)$/;
    var match = re.exec(original_key);
    if (match) {
        var size = size_sel(match[2]);
        var photo = match[3];
        var dest_key = size + '/' + photo;
        bucket.copyTo(original_key, 'nmisfac', dest_key, function(err, ret) {
            if (err) {
                console.log(err);
            }
        }).end();
    }
};

var run_copy = function(start){
    if (!start) {
        start = '';
    }
    var formhub = load_bucket('formhub');
    var lister = new s3Lister(formhub, {
        prefix: 'ossap',
        start: start
    });
    var counter = 0;
    lister
        .on('error', function (err){
            console.log(err);
        })
        .on('data', function (data){
            copy_data(data.Key, formhub);
            counter++;
            console.log(counter, data.Key);
        })
        .on('end', function () {
            console.log('done');
    });
};

var run_copy_nmisstatic = function(start) {
    var nmisstatic = load_bucket('nmisstatic');
    var lister = new s3Lister(nmisstatic, {
        prefix: 'facimg',
        start: start
    });
    var counter = 0;
    lister
        .on('error', function (err){
            console.log(err);
        })
        .on('data', function(data) {
            copy_data_nmisstatic(data.Key, nmisstatic);
            counter++;
            console.log(counter, data.Key);
        })
        .on('end', function () {
            console.log('done');
    });
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

//run_copy();
//run_copy_nmisstatic('facimg/8/200/1300983641327.jpg');
//run_delete('nmisfac', '');

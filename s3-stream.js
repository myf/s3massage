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
    return knox.createClient(credentials);
};


var copy_data = function(origin_key, bucket){
    var re = /^ossap\/attachments\//;
    var photo_file = origin_key.replace(re, '');
    var photo_id = photo_file.replace(/\.jpg$/, '');
    var id_list = photo_id.split('-');
    var id = id_list[0];
    var size = id_list[1] ? id_list[1] : 'original';
    var dest_key = size + '/' + photo_file;
    bucket.copyTo(origin_key, 'nmisfac', dest_key).end();

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
    //facimg/0/0/1305196040042_1.jpg
    var re = /^facimg\/([0-9a-f])\/([0-9]+)\/([0-9_]+\.jpg)$/;
    var match = re.exec(original_key);
    if (match) {
        var size = size_sel(match[2]);
        var photo = match[3];
        var dest_key = size + '/' + photo;
        bucket.copyTo(original_key, 'nmisfac', dest_key).end();
    }
};

var run_copy = function(){
    var formhub = load_bucket('formhub');
    var lister = new s3Lister(formhub, {prefix: 'ossap'});
    var counter = 0;
    lister
        .on('data', function (data){
            copy_data(data.Key, formhub);
            counter++;
            console.log(counter);
        })
        .on('error', function (err){
            console.log(err);
        })
        .on('end', function () {
            console.log('done');
    });
};

var run_copy_nmisstatic = function() {
    var nmisstatic = load_bucket('nmisstatic');
    var lister = new s3Lister(nmisstatic, {prefix: 'facimg'});
    var counter = 0;
    lister
        .on('data', function(data) {
            copy_data_nmisstatic(data.Key, nmisstatic);
            counter++;
            console.log(counter);
        })
        .on('error', function (err){
            console.log(err);
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
        .on('data', function (data){
            bucket.del(data.Key).end();
            counter++;
            console.log(counter);
        })
        .on('error', function (err){
            console.log(err);
        })
        .on('end', function () {
            console.log('done');
    });

};

run_copy_nmisstatic();

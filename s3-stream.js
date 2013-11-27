//global
secret = require('./sec').secret;
///////////

var knox = require('knox'),
    _ = require('underscore'),
    fs = require('fs'),
    s3Lister = require('s3-lister');

var load_bucket = function(bucket){
    var credentials = {};
    credentials.bucket = bucket;
    credentials.secure = false;
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

var run_delete = function(){
    var nmisfac= load_bucket('nmisfac');
    var lister = new s3Lister(nmisfac, {prefix: ''});
    var counter = 0;
    lister
        .on('data', function (data){
            nmisfac.del(data.Key).end();
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

run_delete();

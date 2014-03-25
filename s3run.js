#!/usr/bin/env node
var program = require('commander');
var s3 = require('./lib/s3-map');


var bucket_curry = function(bucket, func) {
    var prefix = program.prefix || '';
    var start = program.start || '';
    var filter = program.filter || null;
    return s3.list_map(bucket, prefix, start, filter, function(k,b){
        return func(k, b);
    });
};

var add_list_command = function(name, desc, action) {
    return program
        .command(name + ' <bucket>')
        .description(desc)
        .action(function(bucket) {
            return bucket_curry(bucket, action);
        });
};

program
    .version('0.0.1')
    .option('-p, --prefix <prefix>', 'select a prefix')
    .option('-s, --start <start>', 'select a start string')
    .option('-f, --filter <filter>', 'select a filter string')
    .option('-o, --output <output>', 'specific directory for download output')
    .option('-i, --input <input>', 'specific directory for upload input');


add_list_command('ls', 'list a bucket with corresponding options', s3.listing);
add_list_command( 'rm', 'delete a bucket with corresponding options', s3.del);
add_list_command('pull', 'download a bucket with options', s3.download);

program
    .command('push <bucket>')
    .description('uploading a directory to a bucket')
    .action(function(bucket) {
        var dir = program.input;
        return s3.upload(bucket, dir);
    });


program.parse(process.argv);

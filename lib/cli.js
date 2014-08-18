#!/usr/bin/env node
var program = require('commander');
var s3 = require('./s3-map');
var fs = require('fs');
var domain = require('domain');
var util = require('util');


var bucket_curry = function(bucket, func) {
    var opts = {};
    opts.prefix = program.prefix || '';
    opts.start = program.start || '';
    opts.filter = program.filter || null;
    opts.maxKeys = program.maxkeys || 1000;
    return s3.list_map(bucket, opts, function(k,b){
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
    .option('-i, --input <input>', 'specific directory for upload input')
    .option('-m, --maxkeys <maxkeys>', 'specific maxkeys per stream');


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

program
    .command('cp <bucket_from> <bucket_to>')
    .description('copying bucket from one directory to another')
    .action(function(bucket_from, bucket_to) {
        var opts = {};
        opts.prefix = program.prefix || '';
        opts.start = program.start || '';
        opts.filter = program.filter || null;
        opts.maxKeys = program.maxkeys || 1000;
        return s3.copy(bucket_from, bucket_to, opts)
    });

program
    .command('cpl <local_file> <bucket_from> <bucket_to>')
    .description('copying directory from one bucket to another with local_file')
    .action(function(local_file, bucket_from, bucket_to) {
        var dest_options = {bucket: bucket_to};
        return s3.list_local(bucket_from, local_file, function(k,b) {
                s3.logfile.write(util.format("copying", k, "to", bucket_to, '\n'));
                b.copyTo(k, bucket_to, k).on('response', function(res) {
                    //s3.logfile.write(util.format(res, '\n')); 
                }).end();
            });
    });


program
    .command('pl <bucket> <local_file>')
    .description('download bucket from a local log')
    .action(function(bucket, local_file) {
        return s3.list_local(bucket, local_file, function(k,b) {
            return s3.download(k,b);
        })
    })


var d = domain.create();

var sys_err = fs.createWriteStream('../sys_error.log');
d.on('error', function(err) {
    sys_err.write(err + '\n');
});

d.run(function() {
    program.parse(process.argv);
});


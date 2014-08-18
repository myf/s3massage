s3 massage
===========
Yet another commandline tool interfacing Amazon S3 service. It aims to deal
with giant S3 buckets with node streams to pack more I/O power.
    npm install s3m -g
```
  Usage: s3m [options] [command]

  Commands:

    ls <bucket>            list a bucket with corresponding options
    rm <bucket>            delete a bucket with corresponding options
    pull <bucket>          download a bucket with options
    push <bucket>          uploading a directory to a bucket
    cp <bucket_from> <bucket_to> copying directory from one bucket to another
    cpl <local_file> <bucket_from> <bucket_to> copying directory from one bucket to another with local_file
    pl <bucket> <local_file> download bucket from a local line separated file

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -p, --prefix <prefix>    select a prefix
    -s, --start <start>      select a start string
    -f, --filter <filter>    select a filter string
    -o, --output <output>    specific directory for download output
    -i, --input <input>      specific directory for upload input
    -m, --maxkeys <maxkeys>  specific max concurrent connections  per stream
```

s3 massage
===========
```

  Usage: node . [options] [command]

  Commands:

    ls <bucket>            list a bucket with corresponding options
    rm <bucket>            delete a bucket with corresponding options
    pull <bucket>          download a bucket with options
    push <bucket>          uploading a directory to a bucket

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -p, --prefix <prefix>    select a prefix
    -s, --start <start>      select a start string
    -f, --filter <filter>    select a filter string
    -o, --output <output>    specific directory for download output
    -i, --input <input>      specific directory for upload input
    -m, --maxkeys <maxkeys>  specific maxkeys per stream
```

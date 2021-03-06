'use strict';

let express = require('express');
let app = express();
let http = require('http');
let server = http.Server(app);

let cluster = require('cluster');
let numCPUs = require('os').cpus().length;

let fs = require('fs');
let path = require('path');

// start up express server with a number of clusters
if (cluster.isMaster) {
    console.log(`Master is running: ${process.pid}`);
    
    // fork a worker for each cpu
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        // a process has stopped for whatever reason, so fork a new
        // worked to replace it.
        console.log(`Worked ${worker.process_pid} died`);
        cluster.fork();
    });

    cluster.on('error', (error) => {
        // something happened. let's find out.
        console.log(error);
    });

    cluster.on('listening', (worker, address) => {
        // a process has started.
        console.log(`Worker ${worker.process.pid} started`);
    });
} else {
    // share port between workers    
    app.set('view', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    
    app.use(require('morgan')('dev'));
    app.use(require('compression')());
    
    app.use('/', express.static(path.join(__dirname, 'public')));
    
    app.use('/', (req, res, next) => {
        res.send('<!DOCTYPE html><html><head></head><body><script>window.location.href="https://glaciate.net/";</script></body></html>');
        //res.send('Hello world! Right now, I am still working on this site, but you can check out a prototype at << http://i-am-car.im/prototype.html >>, visit my GitHub repository at << https://github.com/CarimA >>, see my personal blog that details some of my projects at << http://glaciate.net >>, or send me an email at << hello@i-am-car.im >>!');
    })
    
    let port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Worked ${process.pid} has started a server, listening on port ${port}`);
    });

    process.on('SIGINT', () => {
        // on program close, stop all workers
        server.close();
        process.exit();
    })
}

const express = require("express");
const bodyParser = require("body-parser");
const xmlparser = require('express-xml-bodyparser');

//custom modules
const middleware = require("./helpers/middleware");
const logger = require('./helpers/logger');

//routes
const documentRoutes = require('./documents');
const serverRoutes = require('./server');
const contractsRoutes = require('./contracts');
const emailRoutes = require('./email');

//app definitions
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(xmlparser());
app.use((req, res, next) => {
    middleware.process(req, res, next)
})

//route definitions
app.use('/documents', documentRoutes);
app.use('/server', serverRoutes);
app.use('/contracts',contractsRoutes);
app.use('/email', emailRoutes);


//server init
const port = process.env.PORT || 8080;
var server = app.listen(port, function () {
    const host = server.address().address;
    const port = server.address().port;
    const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
    console.log("Blub Blub Benchmark server running at http://%s:%s in %s env", host, port,env);
    logger.log("info","Benchmark "+env+" server started",{
        host:host,
        port:port,
        env:env
    })
});
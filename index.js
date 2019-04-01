console.log('Loading Server ...')
//console.log(__dirname)

//load core modules
const express = require('express')
let socket = require('socket.io')

//load expess middleware
// const compression = require('compression');
// const logger = require('morgan');
// const favicon = require('serve-favicon');
// const path = require('path');
// const bodyParser = require('body-parser');

// const MongoClient = require('mongodb').MongoClient;
// const helmet = require('helmet');

let app = express();
//app.use(express.static(`${__dirname}/src/html`))
// app.use(express.static(`${__dirname}/web`));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing 
// app.use(logger("short"));

//use the middleware
// app.use(logger('dev'));

// app.use(compression());

// app.use(favicon(`${__dirname}/web/img/favicon.ico`))

app.get('/', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/index.html`)
})

app.get('/intro', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/intro.html`)
})

app.get('/player', function(req, res) {
 res.status(200).sendFile(`${__dirname}/src/html/player.html`);
 //res.status(200).send("Players gon play");
})

app.get('/screen', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/screen.html`);
  //res.status(200).send("Players gon play");
 })

app.get('*', function(req, res) {
//   res.status(404).sendFile(`${__dirname}/web/html/404.html`);
    res.status(404).send("wat?")
});

// Wasap

//start the server
if (!process.env.PORT) { process.env.PORT = 8080 }
if (!process.env.IP) { process.env.IP = "0.0.0.0" }
const server = app.listen(process.env.PORT, process.env.IP, 511, function() {
  console.log(`Server listening on port ${process.env.IP}:${process.env.PORT}`)
})

//start the socket
let io = socket(server)
<<<<<<< HEAD
//let introio = socket(server)
=======
>>>>>>> dd285628d76a4b36cffac4901bd3f3e655069e58

//Server Side
io.on('connection', (socket) => {
  console.log('Connection connected!: ', socket.id)
  socket.emit('message', {chris: 'Hi, how are you?'})
  socket.on('another event', (data) => {
    console.log(data)
  })
<<<<<<< HEAD

  socket.on('addPlayer', (data) => {
    console.log("Player: ", data)
  })
})

//Server side for intro.html
introio.on('connection', (socket) => {
  console.log('We have a player!')
  socket.emit('message', {server: 'Are you the new player?'})
  socket.on('player event', (data) => {
    console.log(data)
    let players = []
    players.forEach(function(data){
      console.log(data)
    })

=======

  socket.on('addPlayer', (data) => {
    console.log("Player: ", data, socket.id)
>>>>>>> dd285628d76a4b36cffac4901bd3f3e655069e58
  })
})

/* var playerArray = new Vue ({
  el: '#app',
  data:{
    players:[
      
    ]
  }
}) */


//server close functions
function gracefulShutdown() {
  console.log();
  console.log('Starting Shutdown ...')
  server.close(function() {
    console.log('Shutdown complete')
    process.exit(0);
  })
}

process.on('SIGTERM', gracefulShutdown)

process.on('SIGINT', gracefulShutdown)
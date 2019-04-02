console.log('Loading Server ...')
//console.log(__dirname)

//load core modules
const express = require('express')
let socket = require('socket.io')
const axios = require('axios')

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
  // if (!homeSocket) {
    res.status(200).sendFile(`${__dirname}/src/html/index.html`)
  // } else {
  //   res.redirect('/intro')
  // }
})

app.get('/intro', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/intro.html`)
})

app.get('/player', function(req, res) {
 res.status(200).sendFile(`${__dirname}/src/html/player.html`)
 //res.status(200).send("Players gon play");
})

app.get('/screen', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/screen.html`)
  //res.status(200).send("Players gon play");
})

app.get('/subwords', function(req, res) {
  res.status(200).sendFile(`${__dirname}/subwordsSmall.json`)
})

app.get('/test', function(req, res) {
  axios.get(`http://${process.env.IP}:${process.env.PORT}/subwords`).then(data => {
    console.log("DAT: ", data)
  })
  .catch(err => {
    console.log("ERR: ", err)
  })
  res.status(200).send("Woot")
})

app.get('*', function(req, res) {
//   res.status(404).sendFile(`${__dirname}/web/html/404.html`);
    res.status(404).send("wat?")
})

// Wasap

//start the server
if (!process.env.PORT) { process.env.PORT = 8080 }
if (!process.env.IP) { process.env.IP = "0.0.0.0" }
const server = app.listen(process.env.PORT, process.env.IP, 511, function() {
  console.log(`Server listening on port ${process.env.IP}:${process.env.PORT}`)
})

//start the socket
let io = socket(server)
let homeSocket;
let roomCode
let players = {}
let current = ''
let subwords = []
let allWords = []

//Server Side
io.on('connection', (socket) => {
  console.log("Socket Connected: ", socket.id)
  if (!homeSocket) {
    homeSocket = socket
  }

  socket.on('authenticate', (data) => {
    console.log(data)
    if (data.Code != roomCode){
      socket.emit('badCode')
    } else if (players[data.Name]) {
      socket.emit('badName')
    } else {
      players[data.Name] = {name: data.Name, pts: 0, socketId: socket.id}
      homeSocket.emit("players", Object.keys(players))
      socket.emit('goodName')
    }
  })

  socket.on('roomCode', (data) => {
    roomCode = data
    socket.broadcast.emit('newRoomCode', roomCode)
  })

  socket.on('start', () => {
    socket.broadcast.emit('startGame')
  })

  socket.on('nextWord', () => {
    if (allWords.length){
      let newSubs = []
      let rand, rand2
      while (!newSubs.length){
        rand = randomIndex(2, allWords.length)
        rand2 = randomIndex(0, allWords[rand].length)
        newSubs = []
        allWords[rand][rand2].subwords.forEach(subs => {
          newSubs.push(...subs)
        })
      }
      socket.broadcast.emit('newWord', { word: allWords[rand][rand2].word, subwords: newSubs})
      current = allWords[rand][rand2].word
      subwords = newSubs
    } else {
      axios.get(`http://${process.env.IP}:${process.env.PORT}/subwords`).then(words => {
        allWords = words.data
        let newSubs = []
        let rand, rand2
        while (!newSubs.length){
          rand = randomIndex(2, allWords.length)
          rand2 = randomIndex(0, allWords[rand].length)
          newSubs = []
          allWords[rand][rand2].subwords.forEach(subs => {
            newSubs.push(...subs)
          })
        }
        socket.broadcast.emit('newWord', { word: allWords[rand][rand2].word, subwords: newSubs})
        current = allWords[rand][rand2].word
        subwords = newSubs
      }).then(err => {
        console.error(err)
      })
    }
  })

  socket.on('guess', (data) => {
    if (subwords.includes(data)){
      subwords.splice(subwords.indexOf(data), 1)
      socket.emit('addPoints', data.length) 
    } else {
      socket.emit('badGuess')
    }
  })

  if (roomCode) {
    socket.emit('newRoomCode', roomCode)
  }

})

function randomIndex(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

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

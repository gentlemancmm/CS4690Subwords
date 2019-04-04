console.log('Loading Server ...')

//load core modules
const express = require('express')
let socket = require('socket.io')
const axios = require('axios')

//load expess middleware
const compression = require('compression')
const logger = require('morgan')

let app = express()

//use the middleware
app.use(logger('dev'))
app.use(compression())

app.get('/', function(req, res) {
  if (!homeSocket) {
    res.status(200).sendFile(`${__dirname}/src/html/index.html`)
  } else {
    res.redirect('/intro')
  }
})

app.get('/intro', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/intro.html`)
})

app.get('/player', function(req, res) {
 res.status(200).sendFile(`${__dirname}/src/html/player.html`)
})

app.get('/screen', function(req, res) {
  res.status(200).sendFile(`${__dirname}/src/html/screen.html`)
})

app.get('/subwords', function(req, res) {
  res.status(200).sendFile(`${__dirname}/subwords.json`)
})

app.get('*', function(req, res) {
    res.status(404).send('wat?')
})

// Wasap

//start the server
if (!process.env.PORT) { process.env.PORT = 8080 }
if (!process.env.IP) { process.env.IP = '0.0.0.0' }
const server = app.listen(process.env.PORT, process.env.IP, 511, function() {
  console.log(`Server listening on port ${process.env.IP}:${process.env.PORT}`)
})

//start the socket
let io = socket(server)
let homeSocket
let roomCode
let players = {}
let current = ''
let subwords = []
let allWords = []

//Server Side
io.on('connection', (socket) => {
  console.log('Socket Connected: ', socket.id)
  if (!homeSocket) {
    homeSocket = socket
  }

  socket.on('authenticate', (data) => {
    if (data.Code != roomCode){
      socket.emit('badCode')
    } else if (players[data.Name]) {
      socket.emit('badName')
    } else {
      players[data.Name] = {name: data.Name, pts: 0, socketId: socket.id}
      homeSocket.emit('players', Object.keys(players))
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
      homeSocket.broadcast.emit('newWord', { word: allWords[rand][rand2].word, subwords: newSubs})
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
        homeSocket.broadcast.emit('newWord', { word: allWords[rand][rand2].word, subwords: newSubs})
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
  return Math.floor(Math.random() * (max - min) + min)
}

//server close functions
function gracefulShutdown() {
  console.log()
  console.log('Starting Shutdown ...')
  server.close(function() {
    console.log('Shutdown complete')
    process.exit(0)
  })
}

process.on('SIGTERM', gracefulShutdown)

process.on('SIGINT', gracefulShutdown)

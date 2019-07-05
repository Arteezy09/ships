var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var BattleshipGame = require('./game/main.js');

var GameStatus = {
  inProgress: 1,
  gameOver: 2
};

var port = 9000;

var users = {};
var gameIdCounter = 1;

app.use(express.static(__dirname + '/client'));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket) {
  console.log(' ID ' + socket.id + ' connected.');

  // создать объект пользователя для дополнительных данных
  users[socket.id] = {
    inGame: null,
    player: null
  }; 

  // присоединяйтесь к комнате ожидания, пока не будет достаточно игроков, чтобы начать новую игру
  socket.join('waiting room');

  // сообщения чата
  socket.on('chat', function(msg) {
    if(users[socket.id].inGame !== null && msg) {
      
      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
        name: 'Оппонент',
        message: entities.encode(msg),
      });
 
      io.to(socket.id).emit('chat', {
        name: 'Я',
        message: entities.encode(msg),
      });
    }
  });

  // обработка хода клиента
  socket.on('shot', function(position) {
    var game = users[socket.id].inGame, opponent;

    if(game !== null) {
      
      if(game.currentPlayer === users[socket.id].player) {
        opponent = game.currentPlayer === 0 ? 1 : 0;

        if(game.shoot(position)) {
          // действительный выстрел
          checkGameOver(game);

          // обновление состояния игры на обоих клиентах
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });
  
  // обработка запроса на выход из игры
  socket.on('leave', function() {
    if(users[socket.id].inGame !== null) {
      leaveGame(socket);

      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });


  // пользователь отключился
  socket.on('disconnect', function() {
    console.log(' ID ' + socket.id + ' disconnected.');
    
    leaveGame(socket);

    delete users[socket.id];
  });

  joinWaitingPlayers();

});

// создание игры для игроков "в ожидании игры"
function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');
  
  if(players.length >= 2) {
    // 2 игрока зашли, время создавать игру
    var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    // создание новой комнаты для этой игры
    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;
    
    io.to('game' + game.id).emit('join', game.id);

    // отправить расположение кораблей
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log(players[0].id + " and " + players[1].id + " have joined game ID " + game.id);
  }
}

// выход из игры
function leaveGame(socket) {
  if(users[socket.id].inGame !== null) {
    console.log(' ID ' + socket.id + ' left game ID ' + users[socket.id].inGame.id);

    // уведомление противника
    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
      message: 'Opponent has left the game'
    });

    if(users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      // игра не закончена, отменить её
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

// проверка на завершение игры
function checkGameOver(game) {
  if(game.gameStatus === GameStatus.gameOver) {
    console.log(' Game ID ' + game.id + ' ended.');
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

// получить клиентов в комнате
function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}

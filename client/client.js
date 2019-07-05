var socket = io();

$(function() {

  // успешно подключен к серверу
  socket.on('connect', function() {
    console.log('Connected to server.');
    $('#disconnected').hide();
    $('#waiting-room').show();   
  });

  // отключен от сервера
  socket.on('disconnect', function() {
    console.log('Disconnected from server.');
    $('#waiting-room').hide();
    $('#game').hide();
    $('#disconnected').show();
  });

  // пользователь присоединился к игре
  socket.on('join', function(gameId) {
    Game.initGame();
    $('#messages').empty();
    $('#disconnected').hide();
    $('#waiting-room').hide();
    $('#game').show();
    $('#game-number').html(gameId);
  })

  // обновить состояние игры 
  socket.on('update', function(gameState) {
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

  // чат в игре
  socket.on('chat', function(msg) {
    $('#messages').append('<li><strong>' + msg.name + ':</strong> ' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  // уведомления
  socket.on('notification', function(msg) {
    $('#messages').append('<li>' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  // изменить статус игры на игра закончена
  socket.on('gameover', function(isWinner) {
    Game.setGameOver(isWinner);
  });
  
  // выйти из игры и войти в режим ожидания
  socket.on('leave', function() {
    $('#game').hide();
    $('#waiting-room').show();
  });

  // отправить сообщение чата на сервер
  $('#message-form').submit(function() {
    socket.emit('chat', $('#message').val());
    $('#message').val('');
    return false;
  });

});


function sendLeaveRequest(e) {
  e.preventDefault();
  socket.emit('leave');
}


function sendShot(square) {
  socket.emit('shot', square);
}

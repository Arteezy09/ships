var Player = require('./player.js');

var GameStatus = { // статус игры
  inProgress: 1,
  gameOver: 2
};


// конструктор игры
function BattleshipGame(id, idPlayer1, idPlayer2) {
  this.id = id; // id игры
  this.currentPlayer = Math.floor(Math.random() * 2); // определяем текущего игрока
  this.winningPlayer = null;
  this.gameStatus = GameStatus.inProgress;

  this.players = [new Player(idPlayer1), new Player(idPlayer2)]; // создание игроков
}


// получить ID игрока
BattleshipGame.prototype.getPlayerId = function(player) {
  return this.players[player].id;
};


// получить ID победителя
BattleshipGame.prototype.getWinnerId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  return this.players[this.winningPlayer].id;
};


// получить ID проигравшего игрока
BattleshipGame.prototype.getLoserId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  var loser = this.winningPlayer === 0 ? 1 : 0;
  return this.players[loser].id;
};


// переключить игрока
BattleshipGame.prototype.switchPlayer = function() {
  this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
};


// игрок вышел
BattleshipGame.prototype.abortGame = function(player) {

  this.gameStatus = GameStatus.gameOver; // статус - игра завершена
  this.winningPlayer = player === 0 ? 1 : 0; // победитель - другой игрок
}


// выстрел (ход) текущего игрока
BattleshipGame.prototype.shoot = function(position) {
  var opponent = this.currentPlayer === 0 ? 1 : 0, // определяем игрока-противника
      gridIndex = position.y * 10 + position.x;

  // проверяем был ли проведен выстрел в данный квадрат сетки ранее
  if(this.players[opponent].shots[gridIndex] === 0 && this.gameStatus === GameStatus.inProgress) {
    // производим выстрел
    if(!this.players[opponent].shoot(gridIndex)) {
      // промахнулся, сменить игрока
      this.switchPlayer();
    }

    // проверка на сбитие всех кораблей противника (завершение игры)
    if(this.players[opponent].getShipsLeft() <= 0) {
      this.gameStatus = GameStatus.gameOver;
      this.winningPlayer = opponent === 0 ? 1 : 0;
    }
    
    return true;
  }

  return false;
};


// получить обновление состояния игры (для одной сетки)
BattleshipGame.prototype.getGameState = function(player, gridOwner) {
  return {
    turn: this.currentPlayer === player,                 // этот ход - игрока?
    gridIndex: player === gridOwner ? 0 : 1,             // какую сетку обновить 
    grid: this.getGrid(gridOwner, player !== gridOwner)  // скрыть незатопленные корабли, если это не собственная сетка
  };
};


// получить сетку с кораблями для игрока
BattleshipGame.prototype.getGrid = function(player, hideShips) {
  return {
    shots: this.players[player].shots,
    ships: hideShips ? this.players[player].getSunkShips() : this.players[player].ships
  };
};

module.exports = BattleshipGame;

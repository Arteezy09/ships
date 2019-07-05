var Ship = require('./ship.js');

var all_ships = [ 4, 3, 3, 2, 2, 2, 1, 1, 1, 1 ]; // все корабли


// конструктор игрока
function Player(id) {

  this.id = id; // id игрока
  this.shots = new Array(100);  // массив выстрелов (10х10)
  this.shipGrid = new Array(100); // расположение кораблей по сетке (10х10)
  this.ships = [];

  for(var i = 0; i < 100; i++) { // (10х10)
    this.shots[i] = 0;
    this.shipGrid[i] = -1;
  }

  if(!this.createRandomShips()) { // создание кораблей
    this.ships = [];
    this.createRandomShips();
  }
};


// выстрел по сетке
Player.prototype.shoot = function(gridIndex) {
  if(this.shipGrid[gridIndex] >= 0) { // попадание
    this.ships[this.shipGrid[gridIndex]].hits++; // добавить попадание по кораблю
    this.shots[gridIndex] = 2;
    return true;
  } else { // промахнулся

    this.shots[gridIndex] = 1;
    return false;
  }
};


// потопленные корабли
Player.prototype.getSunkShips = function() {
  var sunkShips = [];

  for(var i = 0; i < this.ships.length; i++) {
    if(this.ships[i].isSunk()) { // проверяем потоплен ли корабль
      sunkShips.push(this.ships[i]);
    }
  }

  return sunkShips;
};


// количество не потопленных кораблей
Player.prototype.getShipsLeft = function() {
  var shipCount = 0;

  for(var i = 0; i < this.ships.length; i++) {
    if(!this.ships[i].isSunk()) {
      shipCount++;
    }
  }

  return shipCount;
}


// создание кораблей
Player.prototype.createRandomShips = function() {

  for(var i = 0; i < all_ships.length; i++) {
    ship = new Ship(all_ships[i]); // создание одного корабля
  
    if(!this.placeShipRandom(ship, i)) {
      return false;
    }

    this.ships.push(ship); // добавление корабля
  }
  
  return true;
};


// случайное расположение корабля
Player.prototype.placeShipRandom = function(ship, shipIndex) {
  var gridIndex, xMax, yMax;
  var tryMax = 100;

  for(var i = 0; i < tryMax; i++) {
    ship.horizontal = Math.random() < 0.5; // вертикальное/горизонтальное расположение

    xMax = ship.horizontal ? 10 - ship.size + 1 : 10;
    yMax = ship.horizontal ? 10 : 10 - ship.size + 1;

    ship.x = Math.floor(Math.random() * xMax); // начальная x точка на сетке (расположение корабля)
    ship.y = Math.floor(Math.random() * yMax); // начальная y точка на сетке (расположение корабля)

    if(!this.checkShipOverlap(ship) && !this.checkShipAdjacent(ship)) { // проверка

      gridIndex = ship.y * 10 + ship.x;
      for(var j = 0; j < ship.size; j++) {
        this.shipGrid[gridIndex] = shipIndex;
        gridIndex += ship.horizontal ? 1 : 10;
      }
      return true;
    }
  }
  
  return false;
}


// проверка на пересечение кораблей в одном месте
Player.prototype.checkShipOverlap = function(ship) {
  var gridIndex = ship.y * 10 + ship.x;

  for(var i = 0; i < ship.size; i++) {
    if(this.shipGrid[gridIndex] >= 0) {
      return true;
    }
    gridIndex += ship.horizontal ? 1 : 10;
  }

  return false;
}


// проверка на попадание корабля рядом с другими кораблями
Player.prototype.checkShipAdjacent = function(ship) {
  var i, j, 
      x1 = ship.x - 1,
      y1 = ship.y - 1,
      x2 = ship.horizontal ? ship.x + ship.size : ship.x + 1,
      y2 = ship.horizontal ? ship.y + 1 : ship.y + ship.size;

  for(i = x1; i <= x2; i++) {
    if(i < 0 || i > 10 - 1) continue;
    for(j = y1; j <= y2; j++) {
      if(j < 0 || j > 10 - 1) continue;
      if(this.shipGrid[j * 10 + i] >= 0) {
        return true;
      }
    }
  }

  return false;
}



module.exports = Player;

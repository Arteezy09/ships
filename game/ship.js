// конструктор корабля
function Ship(size) {
  this.x = 0; 
  this.y = 0;
  this.size = size; // размер корабля
  this.hits = 0; // количество выстрелов по кораблю
  this.horizontal = false;
}

// потоплен корабль или нет?
Ship.prototype.isSunk = function() {
  return this.hits >= this.size;
};

module.exports = Ship;



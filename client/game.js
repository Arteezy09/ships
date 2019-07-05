var GameStatus = { // статус игры
  inProgress: 1,
  gameOver: 2
}

var Game = (function() {
  var canvas = [], 
      context = [], 
      grid = [],
      gridHeight = 311, gridWidth = 311, gridBorder = 1,
      gridRows = 10, gridCols = 10, 
      markPadding = 7, shipPadding = 4,
      squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows, // высота одного квадрата сетки
      squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols, // ширина одного квадрата сетки
      turn = false, 
      gameStatus, 
      squareHover = { x: -1, y: -1 };

  canvas[0] = document.getElementById('canvas-grid1');    // поле игрока
  canvas[1] = document.getElementById('canvas-grid2');    // поле противника
  context[0] = canvas[0].getContext('2d');
  context[1] = canvas[1].getContext('2d');

  // выделение квадрата противника при наведении
  canvas[1].addEventListener('mousemove', function(e) {
    var pos = getCanvasCoordinates(e, canvas[1]);
    squareHover = getSquare(pos.x, pos.y);
    drawGrid(1);
  });

  // мышь вышла за пределы поля противника
  canvas[1].addEventListener('mouseout', function(e) {
    squareHover = { x: -1, y: -1 };
    drawGrid(1);
  });

  // выстрел по противнику (если твой ход)
  canvas[1].addEventListener('click', function(e) {
    if(turn) {
      var pos = getCanvasCoordinates(e, canvas[1]);
      var square = getSquare(pos.x, pos.y);
      sendShot(square);
    }
  });
  
  // получить квадрат сетки
  function getSquare(x, y) {
    return {
      x: Math.floor(x / (gridWidth / gridCols)),
      y: Math.floor(y / (gridHeight / gridRows))
    };
  };

  // получить положение мыши на сетке
  function getCanvasCoordinates(event, canvas) {
    rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  };


  // инициализация новой игры
  function initGame() {

    gameStatus = GameStatus.inProgress;
    
    // создание пустых полей для двух игроков
    grid[0] = { shots: new Array(100), ships: [] };
    grid[1] = { shots: new Array(100), ships: [] };

    for(var i = 0; i < 100; i++) {
      grid[0].shots[i] = 0;
      grid[1].shots[i] = 0;
    }

    // сброс статусов
    $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
                     .removeClass('alert-winner').removeClass('alert-loser');

    drawGrid(0);
    drawGrid(1);
  };


  // обновление сетки игрока
  function updateGrid(player, gridState) {
    grid[player] = gridState;
    drawGrid(player);
  };

 
  // устанавливаем классы в зависимости от хода игроков
  function setTurn(turnState) {
    if(gameStatus !== GameStatus.gameOver) {
      turn = turnState;

      if(turn) {
        $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('Твой ход!');
      } else {
        $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('Ход оппонента, подождите ...');
      }
    }
  };

  
  // устанавливаем классы при завершении игры
  function setGameOver(isWinner) {
    gameStatus = GameStatus.gameOver;
    turn = false;
    
    if(isWinner) {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-winner').html('Вы выйграли! <a href="#" class="btn-leave-game">Играть заново</a>.');
    } else {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-loser').html('Вы проиграли. <a href="#" class="btn-leave-game">Играть заново</a>.');
    }
    $('.btn-leave-game').click(sendLeaveRequest);
  }


  // нарисовать сетку
  function drawGrid(gridIndex) {
    drawSquares(gridIndex);
    drawShips(gridIndex);
    drawMarks(gridIndex);
  };

 
  // нарисовать квадраты сетки
  function drawSquares(gridIndex) {
    var i, j, squareX, squareY;

    context[gridIndex].fillStyle = '#EDE7F6'
    context[gridIndex].fillRect(0, 0, gridWidth, gridHeight);

    for(i = 0; i < gridRows; i++) {
      for(j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        context[gridIndex].fillStyle = '#03A9F4'

        // выделение квадрата при наведении на сетку противника (при ходе игрока)
        if(j === squareHover.x && i === squareHover.y &&
                gridIndex === 1 && grid[gridIndex].shots[i * gridCols + j] === 0 && turn) {
          context[gridIndex].fillStyle = '#E57373';
        }

        context[gridIndex].fillRect(squareX, squareY, squareWidth, squareHeight);
      }
    }
  };

  
  // нарисовать видимые корабли
  function drawShips(gridIndex) {
    var ship, i, x, y,
        shipWidth, shipLength;

    context[gridIndex].fillStyle = '#0D47A1';
    
    for(i = 0; i < grid[gridIndex].ships.length; i++) {
      ship = grid[gridIndex].ships[i];

      x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;
      shipWidth = squareWidth - shipPadding * 2;
      shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;

      if(ship.horizontal) {
        context[gridIndex].fillRect(x, y, shipLength, shipWidth);
      } else {
        context[gridIndex].fillRect(x, y, shipWidth, shipLength);
      }
    }
  };
  
  
  // нарисовать метки выстрелов
  function drawMarks(gridIndex) {
    var squareX, squareY;

    for(var i = 0; i < gridRows; i++) {
      for(var j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        // нарисовать черный крест, если выстрел не попал по кораблю
        if(grid[gridIndex].shots[i * gridCols + j] === 1) {
          context[gridIndex].beginPath();
          context[gridIndex].moveTo(squareX + markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + squareWidth - markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].moveTo(squareX + squareWidth - markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].strokeStyle = '#000000';
          context[gridIndex].stroke();
        }
        // нарисовать красный круг, если выстрел попал по кораблю
        else if(grid[gridIndex].shots[i * gridCols + j] === 2) {
          context[gridIndex].beginPath();
          context[gridIndex].arc(squareX + squareWidth / 2, squareY + squareWidth / 2,
                                 squareWidth / 2 - markPadding, 0, 2 * Math.PI, false);
          context[gridIndex].fillStyle = '#E62E2E';
          context[gridIndex].fill();
        }
      }
    }
  };

  return {
    'initGame': initGame,
    'updateGrid': updateGrid,
    'setTurn': setTurn,
    'setGameOver': setGameOver
  };
})();

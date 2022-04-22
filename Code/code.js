function getSvg() {
  return document.querySelector("#mySvg");
}

function downloadSvg() {
  var svgData = getSvg().outerHTML;
  var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "coolsvg.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
function eraseSvg() {
  const svg = getSvg();

  svg.innerHTML = "";
}
function svgBackground(color = "white") {
  const svg = getSvg();
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", 100);
  rect.setAttribute("height", 100);
  rect.setAttribute("style", `fill:${color};stroke-width:0;stroke:rgb(0,0,0)`);
  svg.appendChild(rect);
}
function addToSvg(elem) {
  getSvg().appendChild(elem);
}

class EdgeSquare {
  makeCopy() {
    let newlyMade = new EdgeSquare();
    newlyMade.top = this.top;
    newlyMade.bottom = this.bottom;
    newlyMade.right = this.right;
    newlyMade.left = this.left;
    return newlyMade;
  }
  combine(other) {
    let newSquare = this.makeCopy();
    newSquare.top ||= other.top;
    newSquare.bottom ||= other.bottom;
    newSquare.left ||= other.left;
    newSquare.right ||= other.right;
    return newSquare;
  }
  firstUnlessSecond(second) {
    if (second.top || second.bottom || second.right || second.left) {
      return second.makeCopy();
    }
    return this.makeCopy();
  }
  constructor() {
    this.top = false;
    this.bottom = false;
    this.left = false;
    this.right = false;
  }
  drawAt(leftC, rightC, bottomC, topC) {
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let lines = [];
    if (this.top) {
      lines.push(`M ${leftC} ${topC} H ${rightC}`);
    }
    if (this.bottom) {
      lines.push(`M ${leftC} ${bottomC} H ${rightC}`);
    }
    if (this.left) {
      lines.push(`M ${leftC} ${topC} V ${bottomC}`);
    }
    if (this.right) {
      lines.push(`M ${rightC} ${topC} V ${bottomC}`);
    }
    let pathStr = lines.join(" ");
    path.setAttribute("fill", "red");
    path.setAttribute("stroke", "black");
    path.setAttribute("pathLength", "200");
    path.setAttribute("stroke-width", "0.3");
    path.setAttribute("d", pathStr);
    addToSvg(path);
  }
}
let topLine = new EdgeSquare();
topLine.top = true;
topLine = Object.freeze(topLine);

let bottomLine = new EdgeSquare();
bottomLine.bottom = true;
bottomLine = Object.freeze(bottomLine);

let rightLine = new EdgeSquare();
rightLine.right = true;
rightLine = Object.freeze(rightLine);

let leftLine = new EdgeSquare();
leftLine.left = true;
leftLine = Object.freeze(leftLine);

let boxLine = topLine.combine(bottomLine).combine(rightLine).combine(leftLine);
boxLine = Object.freeze(boxLine);

class EdgeBoard {
  constructor(startX, stopX, startY, stopY) {
    this.startX = startX;
    this.stopX = stopX;
    this.startY = startY;
    this.stopY = stopY;
    this.width = stopX - startX;
    this.height = stopY - startY;
    if (this.width < 0 || this.height < 0) {
      throw new Exception("Bad position params.");
    }
    this.grid = makeArray(this.width, this.height);
    this.grid.dimensionalFill(() => new EdgeSquare());
  }
  static _blankSlate(first, second) {
    let startX = Math.min(first.startX, second.startX);
    let startY = Math.min(first.startY, second.startY);
    let stopX = Math.max(first.stopX, second.stopX);
    let stopY = Math.max(first.stopY, second.stopY);
    let newBoard = new EdgeBoard(startX, stopX, startY, stopY);
    return newBoard;
  }
  getCoord(x, y) {
    let xInArray = x - this.startX;
    let yInArray = y - this.startY;
    return this.grid[xInArray][yInArray];
  }
  setCoord(x, y, value) {
    let xInArray = x - this.startX;
    let yInArray = y - this.startY;
    return (this.grid[xInArray][yInArray] = value);
  }
  combineCoord(x, y, value) {
    this.setCoord(x, y, this.getCoord(x, y).combine(value));
  }
  static _mergeInto(from, to) {
    for (let x = from.startX; x < from.stopX; x++) {
      for (let y = from.startY; y < from.stopY; y++) {
        to.setCoord(x, y, to.getCoord(x, y).combine(from.getCoord(x, y)));
      }
    }
  }
  static _overwriteInto(from, to) {
    for (let x = from.startX; x < from.stopX; x++) {
      for (let y = from.startY; y < from.stopY; y++) {
        to.setCoord(
          x,
          y,
          to.getCoord(x, y).firstUnlessSecond(from.getCoord(x, y))
        );
      }
    }
  }
  firstUnlessSecond(second) {
    let newBoard = EdgeBoard._blankSlate(this, second);
    EdgeBoard._overwriteInto(this, newBoard);
    EdgeBoard._overwriteInto(second, newBoard);
    return newBoard;
  }
  combine(other) {
    let newBoard = EdgeBoard._blankSlate(this, other);
    EdgeBoard._mergeInto(this, newBoard);
    EdgeBoard._mergeInto(other, newBoard);
    return newBoard;
  }
  loopAndSetSquares(callable, thisArg) {
    if (thisArg != undefined) {
      callable.bind(thisArg);
    }
    for (let x = this.startX; x < this.stopX; x++) {
      for (let y = this.startY; y < this.stopY; y++) {
        this.setCoord(x, y, callable(this.getCoord(x, y), x, y));
      }
    }
  }
  loopSquares(callable, thisArg) {
    if (thisArg != undefined) {
      callable.bind(thisArg);
    }
    for (let x = this.startX; x < this.stopX; x++) {
      for (let y = this.startY; y < this.stopY; y++) {
        callable(this.getCoord(x, y), x, y);
      }
    }
  }
  draw() {
    eraseSvg();
    svgBackground();
    let squareWidth = 100 / this.width;
    let squareHeight = 100 / this.height;
    //let square = new EdgeSquare();
    this.loopSquares((square, x, y) => {
      x -= this.startX;
      y -= this.startY;
      square.drawAt(
        x * squareWidth,
        (x + 1) * squareWidth,
        100 - y * squareHeight,
        100 - (y + 1) * squareHeight
      );
    });
    //square.drawAt(0, 10, 0, 10);
  }
}
function isOdd(num) {
  return num & 1;
}
function isEven(num) {
  return !isOdd(num);
}
function centerALengthOnZero(length) {
  let start = 0 - Math.floor(length / 2);
  let stop = start + length;
  return { start: start, stop: stop };
}
/*A rectangle, only the top and bottom edges protrude one square on each side*/
function createDesignPartA(size) {
  if (size < 3) {
    throw Exception("3 is the lowest size supported");
  }
  if (isEven(size)) {
    throw Exception("size must be odd");
  }
  xDim = centerALengthOnZero(size);
  yDim = centerALengthOnZero(size);
  let board = new EdgeBoard(xDim.start, xDim.stop, yDim.start, yDim.stop);
  for (let x = xDim.start; x < xDim.stop; x++) {
    board.setCoord(x, yDim.stop - 1, topLine);
    board.setCoord(x, yDim.start, bottomLine);
  }

  for (let y = yDim.start; y < yDim.stop; y++) {
    board.combineCoord(xDim.start + 1, y, leftLine);
    //board.setCoord(xDim.start + 1, y, leftLine);
    board.combineCoord(xDim.stop - 2, y, rightLine);
  }

  return board;
}
/**Creates the outer shell */
function createDesignPartB(size) {
  let board = new EdgeBoard(xDim.start, xDim.stop, yDim.start, yDim.stop);
  xDim = centerALengthOnZero(size);
  yDim = centerALengthOnZero(size);
  //console.log(xStart);
  for (let y = yDim.start; y < yDim.stop; y++) {
    board.setCoord(xDim.start, y, leftLine);
    board.setCoord(xDim.stop - 1, y, rightLine);
  }
  return board;
}
//Creates the Cross
function createDesignPartC(size) {
  let board = new EdgeBoard(xDim.start, xDim.stop, yDim.start, yDim.stop);
  xDim = centerALengthOnZero(size);
  yDim = centerALengthOnZero(size);
  //The square at the center
  for (let y = yDim.start; y < yDim.stop; y++) {
    let tile = leftLine.combine(rightLine);
    if (y == yDim.start) {
      tile = tile.combine(bottomLine);
    }
    if (y == yDim.stop - 1) {
      tile = tile.combine(topLine);
    }
    board.setCoord(0, y, tile);
  }
  for (let x = xDim.start; x < xDim.stop; x++) {
    let tile = topLine.combine(bottomLine);
    if (x == xDim.start) {
      tile = tile.combine(leftLine);
    }
    if (x == xDim.stop - 1) {
      tile = tile.combine(rightLine);
    }
    board.setCoord(x, 0, tile);
  }
  board.setCoord(0, 0, boxLine);
  return board;
}
function createDesign(layers = 7) {
  let board = undefined;
  let size = 0;
  for (let i = 0; i < layers; i++) {
    size = 5 + i * 2;
    if (board == undefined) {
      board = createDesignPartA(size);
    }
    board = board.combine(createDesignPartA(size));
  }
  board = board.combine(createDesignPartB(size));
  board = board.firstUnlessSecond(createDesignPartC(size));
  return board;
}

function createDesignC() {}
let board = createDesign();

/*
board.grid.dimensionalFill(
  rightLine.combine(leftLine).combine(topLine).combine(bottomLine)
);
*/
document
  .querySelector("#input-number")
  .addEventListener("change", function (e) {
    let num = e.target.value;
    let board = createDesign(num);
    board.draw();
  });
board.draw();
downloadSvg();

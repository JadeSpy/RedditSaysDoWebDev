function makeArrayChildren(parent, firstDimension, ...dimensions) {
  for (let i = 0; i < parent.length; i++) {
    parent[i] = new Array(firstDimension);
    if (dimensions.length != 0) {
      makeArrayChildren(parent[i], ...dimensions);
    }
  }
}
function makeArray(firstDimension, ...dimensions) {
  if (firstDimension == undefined) {
    throw Exception("Too few dimensions");
  }
  let topArray = new Array(firstDimension);
  if (dimensions.length != 0) makeArrayChildren(topArray, ...dimensions);
  return topArray;
}

Array.prototype.dimensionalFill = function (value) {
  for (let i = 0; i < this.length; i++) {
    const elem = this[i];
    if (elem instanceof Array) {
      elem.dimensionalFill(value);
    } else {
      if (typeof value == "function") {
        this[i] = value();
      } else {
        this[i] = value;
      }
    }
  }
};
/*Unlike forEach, this also loops over undefined values. */
Array.prototype.dimensionalForEach = function (callableFunc, thisArg) {
  if (thisArg != undefined) {
    return this.dimensionalForEach(callableFunc.bind(thisArg));
  }
  for (let i = 0; i < this.length; i++) {
    const elem = this[i];
    if (elem instanceof Array) {
      elem.dimensionalForEach(callableFunc);
    } else {
      callableFunc(elem, i, this);
    }
  }
};
let count = 1;
let arr = makeArray(3, 4, 5, 6);
arr.dimensionalFill(() => {
  return count++ * 2;
});
let sum = 0;
arr.dimensionalForEach((elem) => {
  sum += elem;
});
x = {};
x.y = 2;
console.log((x.y = 3));

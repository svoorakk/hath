/**
 * New node file
 */
"option strict";

var Game = function (tag, pwd, maxNo) {

    this.maxNo = maxNo;
    this.pwd = pwd;
    this.tag = tag;
    if (!maxNo)  //use default
    	this.maxNo = 90;
    this.gameFinished = false;
    this.gameStarted = false;
    this.gamePctFinished = 0;
    this.drawnArr = new Array();
    this.pendingArr = new Array();
    for (var i = 0; i < this.maxNo; i++) {
        this.pendingArr[i] = (i + 1);
    }
    return this;
};

Game.prototype.drawNumber = function () {
	var result = {tag: this.tag};
    //Draw number from remaining numbers
    if (!this.gameFinished) {
        var idx = Math.floor(Math.random() * this.pendingArr.length);
        var num = this.pendingArr.splice(idx, 1)[0];
        this.drawnArr[num - 1] = num;
        this.gamePctFinished = Math.round((1 - this.pendingArr.length / this.maxNo) * 100);
        this.gameStarted = true;
        if (this.pendingArr.length == 0)
            this.gameFinished = true;
        result.number = num;
    }
    result.pendingNumbers = this.pendingArr;
    result.drawnNumbers = this.drawnArr;
    result.gameFinished = this.gameFinished;
    return result;
};

module.exports = Game;
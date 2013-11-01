/**
 * New node file
 */
"option strict";

var Game = function (tag, adminPwd, playPwd, maxNo) {

    this.maxNo = maxNo;
    this.adminPwd = adminPwd;
    this.playPwd = playPwd;
    this.tag = tag;
    this.maxNo = maxNo||90;
    this.finished = false;
    this.gameStarted = false;
    this.gamePctFinished = 0;
    this.drawnNumbers = [];
    this.pendingNumbers = [];
    for (var i = 0; i < this.maxNo; i++) {
        this.pendingNumbers[i] = (i + 1);
    }
    return this;
};

Game.prototype.drawNumber = function (callback) {
    //Draw number from remaining numbers
    if (!this.finished) {
        var idx = Math.floor(Math.random() * this.pendingNumbers.length);
        var num = this.pendingNumbers.splice(idx, 1)[0];
        this.drawnNumbers[num - 1] = num;
        this.gamePctFinished = Math.round((1 - this.pendingNumbers.length / this.maxNo) * 100);
        this.gameStarted = true;
        if (this.pendingNumbers.length === 0)
            this.finished = true;
        this.number = num;
    }
    callback(null, this);
};

module.exports = Game;
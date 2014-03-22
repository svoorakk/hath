/**
 * New node file
 */
"option strict";

var Game = function (gameTag, adminPwd, playPwd, maxNo) {

    this.maxNo = maxNo;
    this.adminPwd = adminPwd;
    this.playPwd = playPwd;
    this.gameTag = gameTag;
    this.maxNo = maxNo||90;
    this.finished = false;
    this.gameStarted = false;
    this.gamePctFinished = 0;
    this.drawnNumbers = [];
    this.pendingNumbers = [];
    for (var i = 0; i < this.maxNo; i++) {
        this.pendingNumbers[i] = (i + 1);
    }
    this.createDate = new Date();
    this.lastAccessDate = new Date();
    return this;
};

module.exports = Game;
/**
 * New node file
 */
"option strict";
//////////////////////////////////////////////////////////////////
//Bingo ticket generator (Also for Tambola / Housie)            //
//Inputs :                                                      //
//1.maximum number in the draw                                 //
//2.number of rows on the ticket                               //
//3.number of columns on the ticket                            //
//4.count of numbers required on the ticket                    //
//Output                                                        //
//Two dimensional array with numbers for the Bingo ticket      //
//                                                            //
//COPYRIGHT : This code is authored by Sridhar Voorakkara       //
//and cannot be copied/used/re-produced in part or full without //
//explicit permission of the Author.                            //
//////////////////////////////////////////////////////////////////
//Ticket
function Ticket(maxNo, rows, columns, numberCount) {
  this.rows = rows||3;
  this.cols = columns||9;
  this.maxNo = maxNo || 90;
  this.numberCount = numberCount || 15;
  this.numCollection = new Array(columns);
  var nums_per_row = Math.ceil(numberCount / this.rows);
  var columns = new Array(this.cols);
  for (var i = 0; i < this.cols; i++)
      columns[i] = new Array(this.rows);
  var fact = Math.ceil(this.maxNo / this.cols);
  var j = 0;
  while (j < this.numberCount) {
      num = Math.ceil(Math.random() * this.maxNo);
      col = Math.floor(num / fact);
      if (num % fact == 0)
          col = col - 1;
      vacancy = false;
      duplicate = false;
      home = 0;
      for (var k = 0; k < this.rows; k++) {
          if (columns[col][k] == num)
              duplicate = true;
          if (!(columns[col][k]) > 0) {
              vacancy = true;
              home = k;
              break;
          }
      }
      if (vacancy && !duplicate) {
          columns[col][home] = num;
          j = j + 1;
      }
  }

  for (var i = 0; i < this.cols; i++) {
      for (var j = columns[i].length; j > -1; j--) {
          if (!(columns[i][j] > 0))
              columns[i].splice(j, 1);
      }
      columns[i].sort(function (a, b) { return a - b;});
      var blanks = this.rows - columns[i].length;
      columns[i].NumCount = columns[i].length;
      for (j = 0; j < blanks; j++) {
          pos = Math.round(Math.random() * columns[i].length);
          var l = 0
          for (var k = 0; k < columns.length; k++) {
              if (columns[pos][k] > 0)
                  l = l + 1;
          }
          columns[i].splice(pos, 0, "");
      }
  }
  //num_per_row = Math.floor(numberCount / this.Rows);
  //alert(num_per_row);
  //return;

  for (i = 0; i < this.Rows-1; i++) {

      counter = 0;
      push_count = 0;
      pull_count = 0;
      for (j = 0; j < this.cols; j++) {
          if (columns[j][i] > 0)
              counter = counter + 1;
          if (columns[j][i] > 0 && columns[j][i+1] === "")
              push_count = push_count + 1;
          if (columns[j][i] === "" && columns[j][i+1] > 0)
              pull_count = pull_count + 1;
      }
      //alert(counter + " " +i+ " " + columns[j-1].NumCount + " " + (j-1));
      if (counter > nums_per_row)
          //create blank;
          {
              excess = counter - nums_per_row;
              if (push_count < excess)
                  l = 2;
              else
                  l = 1;
              itcnt = 0;
              while (excess>0) {
                  n = Math.floor(Math.random()*this.cols);
                  if (columns[n][i] > 0 && columns[n][i+l] === "") {
                      columns[n][i + l] = columns[n][i];
                      columns[n][i] = "";
                      excess = excess - 1;
                  }
                  itcnt = itcnt + 1
                  if (itcnt > 1000)
                      break;
              }
          }
      if (counter < nums_per_row)
          //remove blank
      {
          deficit = nums_per_row - counter;
          if (pull_count < deficit)
              l = 2;
          else
              l = 1;
          itcnt = 0;
          while (deficit > 0) {
              n = Math.floor(Math.random() * this.cols);
              if (columns[n][i] === "" && columns[n][i+l] > 0) {
                  columns[n][i] = columns[n][i + l];
                  columns[n][i+l] = "";
                  deficit = deficit - 1;
              }
              itcnt = itcnt + 1
              if (itcnt > 1000)
                  break;
          }
      }
  }

  this.numCollection = columns;
  return this;
}

module.exports = Ticket;
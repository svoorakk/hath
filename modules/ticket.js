/**
 * New node file
 */
"option strict";
var generateTicket = function (maxNo, rows, cols, numberCount, callback) {
	//set defaults
	maxNo = maxNo||90;
	rows = rows||3;
	cols = cols||9;
	numberCount = numberCount||15;
	numsPerRow = Math.ceil(numberCount / rows);
	var mult = maxNo / cols; //calculate the multiple 
	
	var mandArr = [];
	var controlArr = [];
	
	for (var i = 0; i < cols; i++) {
		var mNum = i * mult + getRandomWholeNo(mult);
		mandArr.push([mNum]);
		controlArr.push(i);
	}
	
	numberCount = numberCount - mandArr.length;
	
	var maxCountRows = Math.ceil(rows * 0.2);
	var iCount = 0;
	
	while (numberCount > 0) {
		/////////////////////////////
		//Redundant check - can be removed
		iCount++;
		//console.log('iCount', iCount);
		if (iCount > 100) {
			callback({'error':{'message':'Too many iterations in the loop'}});
			return;
		}
		///////////////////////////////////
		var num1 = getRandomWholeNo(controlArr.length)-1;  //get a random column number
		var num2 = getRandomWholeNo(mult); //get a random number 
		var num3 = controlArr[num1];  //get column position
		var num = num3 * mult + num2; //calculate the number to add to the ticket
		var arr = mandArr[num3]; //get the array for the column
		
		if (maxCountRows === 0 && (arr.length+1) === rows) //if already have enough columns with numbers in all rows, don't allow any more.
			continue;
		
		var dup = false;
		for (var i = 0; i < arr.length; i++) {  //check for duplication
			if (num === arr[i]) {
				dup = true;
			}
		}
		
		if (!dup) { //if not duplicate
			arr.push(num);  //add number to the column
			mandArr[num3] = arr;  
			numberCount = numberCount-1;  //reduce the numbers to be added by 1
			if (mandArr[num3].length >= rows)  { //if column is full
				controlArr.splice(num1, 1);  //remove the number from control array
				maxCountRows = maxCountRows - 1; //reduce the number of full columns allowed by 1
			}
		}
	}
	//sort all arrays
	for (var i = 0; i < mandArr.length; i++) {
		mandArr[i].sort(function(a,b) {
			return a > b;
		});
	}
	//console.log(mandArr);
	
	//now fill the ticket
	var arrRowCount = [];
	for (var i = 0; i < rows; i++) 
		arrRowCount[i] = 0;
	var arrColCount = [];
	for (var i = 0; i < cols; i++) 
		arrColCount[i] = i;
	var ticketArr = [];
	
	//first handle cols which are full
	for (var i = 0; i < mandArr.length; i++)  {
		if (mandArr[i].length === rows) {
			ticketArr[i] = mandArr[i];
			//increment the row counts
			for (var j = 0; j < rows; j++)
				arrRowCount[j] = arrRowCount[j] + 1;
			//remove from column control array
			arrColCount.splice(i, 1);
			mandArr[i] = [];
		}
	}
	iCount = 0;
	//console.log('arrRowCount',arrRowCount);
	while (arrColCount.length > 0) {
		////////////////////////////////////
		//redundant check - can be removed
		iCount++;
		//console.log('iCount', iCount);
		if (iCount > 100) {
			callback({'error':{'message':'Too many iterations in the loop'}});
			return;
		}
		////////////////////////////////////
		var num1 = getRandomWholeNo(arrColCount.length)-1;  //get a random column number
		var num2 = arrColCount[num1];
		var maxLeft = 0;
		var rowsLeft = 0;
		for (var i=0; i < mandArr.length; i++)
			if (mandArr[i].length > maxLeft)
				maxLeft = mandArr[i].length; 
		
		var sArr = mandArr[num2];
		var tArr = ticketArr[num2];
		if (!tArr)
			tArr = [];
		//first get available rows
		var availRows = [];
		for (var i = 0; i < arrRowCount.length; i++) {
			if (arrRowCount[i] < numsPerRow) {
				rowsLeft = rowsLeft + 1;
				if (i > (tArr.length-1))
					availRows.push(i);
			}
		}

		//to reduce the risk of hanging
		if (arrColCount.length < (cols * 0.4)) {
			if (sArr.length < rowsLeft && sArr.length < maxLeft) {
				console.log('Leaving at 1');
				continue;
			}
		}
		
		if (maxLeft > rowsLeft) {
			console.log('Abandoning at 1');
			callback({'error':{'message':'Error placing the numbers'}});
			return;
		}

		for (var i = sArr.length-1; i > 0; i--) {
			availRows.splice(availRows.length-1,1);
		}
		var range = availRows.length;// - (sArr.length-1);
		var rowIdx = getRandomWholeNo(range)-1;
		var row = availRows[rowIdx];
		if (row == null) {
			console.log('range', range, 'rowIdx', rowIdx, 'sArr', sArr, 'tArr', tArr, 'arrRowCount', arrRowCount);
			console.log('maxLeft', maxLeft, 'rowsLeft', rowsLeft, 'arrColCount', arrColCount);
			//fix the column
			var fixed = false;
			for (var i = 0; i < rows; i++)
				if (!tArr[i] && tArr[i+1] && arrRowCount[i] < numsPerRow) {
					tArr[i] = tArr[i+1];
					tArr[i+1] = sArr[0];
					sArr.splice(0,1);
					arrRowCount[i] = arrRowCount[i]+1;
					arrRowCount[i+1] = arrRowCount[i+1]-1;
					fixed = true;
				}
			if (!fixed) {  // try something different, free up last row in another column
				var surrogateCol = num2;
				var iCountLocal = 0;
				while (surrogateCol === num2) {
					/////////////////////////////////
					//Redundant check - can be removed
					iCountLocal++;
					if (iCountLocal > maxNo) {
						console.log('Abandoning at 4');
						callback({'error':{'message':'Error placing the numbers'}});	
						return;
					}
					//////////////////////////////////
					var newCol = getRandomWholeNo(cols)-1;
					newTArr = ticketArr[newCol];
					if (newCol == num2 || !newTArr)
						continue;
					for (var i = 0; i < newTArr.length; i++) {
						if (!newTArr[i] && newTArr[i+1] && arrRowCount[i] < numsPerRow) {
							newTArr[i] = newTArr[i+1];
							newTArr[i+1] = null;
							arrRowCount[i] = arrRowCount[i]+1;
							arrRowCount[i+1] = arrRowCount[i+1]-1;
							surrogateCol = newCol;
							var cleanArr = [];
							for (var j = 0; j < newTArr.length; j++) {
								if (newTArr[j])
									cleanArr[j] = newTArr[j];
							}
							ticketArr[newCol] = cleanArr;							
						}
					}
				}
				console.log('Last fix tried');
				continue;				
			}
		}
		else {
			if (arrRowCount[row]+1 == numsPerRow && rowsLeft == maxLeft)
				if (sArr.length != maxLeft) {
					console.log('Continue 3');
					continue;
				}
			tArr[row] = sArr[0];
			ticketArr[num2] = tArr;
			arrRowCount[row] = arrRowCount[row] + 1;
			sArr.splice(0,1);
			mandArr[num2] = sArr;
		}
		if (sArr.length === 0) {
			arrColCount.splice(num1,1);
			//console.log(ticketArr);
		}
		//console.log('---------------------');
	}
	//console.log(ticketArr);
	//normalize all the columns
	for (var i = 0; i < ticketArr.length; i++)  {
		ticketArr[i][rows] = null;
		ticketArr[i].splice(rows,1);
	}
	callback(null,ticketArr);
};

var getRandomWholeNo = function (range) {
	return Math.ceil(Math.random()*range);
};

var ticket = function (maxNo, rows, cols, numberCount, callback) {
	var generationCounter = 0;
	generateTicket(maxNo, rows, cols, numberCount, function(err, result) {
		generationCounter++;
		console.log('generationCounter',generationCounter);
		if (err || !validTicket(result, rows, numberCount)) {
			console.log('Error', err);
			ticket(maxNo, rows, cols, numberCount, callback);
			return;
		}
		else {
			//console.log('Success', result);
			callback(null, result);
		}
	});
};

var validTicket = function (ticket, rows, numberCount) {
	var cols = ticket.length;
	rows = rows||ticket[0].length;
	var validCount = (numberCount||15)/(rows);
	for (var i = 0; i < rows; i++) {
		var counter = 0;
		for (var j = 0; j < cols; j++) {
			if (ticket[j][i]) 
				counter++;
		}
		if (counter != validCount) {
			console.log("Invalid Ticket : ", ticket);
			console.log("Row : ", i+1);
			console.log("Counter : ", counter);
			console.log("Valid Count : ", validCount);
			return false;
		}
	}
	return true;
};

module.exports = ticket;
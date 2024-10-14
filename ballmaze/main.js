
let gridSize = [5,5];
let gridArr = [];
let startDir = parseInt(Math.random() * gridSize.length);
let startSide = [0,gridSize[startDir]-1][parseInt(Math.random() * 2)];
let startPos = parseInt(Math.random() * gridSize[startDir]);

console.log(startDir,startSide,startPos)

for (let i = 0; i < gridSize[0]; i++){
    let newRow = [];
    for (let j= 0; j < gridSize[1]; j++){
        newRow.push('0');
    }
    gridArr.push(newRow);
}

console.log(gridArr);

let wheresOne = []
if (startDir == 0){
gridArr[startSide][startPos] = '1';
wheresOne=[startSide,startPos];
}
if (startDir == 1){
    gridArr[startPos][startSide] = '1';
    wheresOne=[startPos,startSide];
}

console.log(gridArr);
console.log(wheresOne)

let stepsLeft = 5;
while (stepsLeft > 0){
    let direction;
    // up right down left
    while (true){
        direction = parseInt(Math.random() * 4);
        if(direction == 0 && wheresOne[0] == 0){
            continue
        }
        if(direction == 1 && wheresOne[1] == gridSize[1]-1){
            continue
        }
        if(direction == 2 && wheresOne[0] == gridSize[0]-1){
            continue
        }
        if(direction == 3 && wheresOne[1] == 0){
            continue
        }
        break
    }
    
    if (direction == 0){
        if (gridArr[wheresOne[0]-1][wheresOne[1]] == '0'){
            gridArr[wheresOne[0]-1][wheresOne[1]] = '2'
            wheresOne=[wheresOne[0]-1,wheresOne[1]];
            stepsLeft -= 1;
        } 
    }
    if (direction == 1){
        if (gridArr[wheresOne[0]][wheresOne[1]+1] == '0'){
            gridArr[wheresOne[0]][wheresOne[1]+1] = '2'
            wheresOne=[wheresOne[0],wheresOne[1]+1];
            stepsLeft -= 1;
        }
    }
    if (direction == 2){
        if (gridArr[wheresOne[0]+1][wheresOne[1]] == '0'){
            gridArr[wheresOne[0]+1][wheresOne[1]] = '2'
            wheresOne=[wheresOne[0]+1,wheresOne[1]];
            stepsLeft -= 1;
        }
    }
    if (direction == 3){
        if (gridArr[wheresOne[0]][wheresOne[1]-1] == '0'){
            gridArr[wheresOne[0]][wheresOne[1]-1] = '2'
            wheresOne=[wheresOne[0],wheresOne[1]-1];
            stepsLeft -= 1;
        }
    }
}
gridArr[wheresOne[0]][wheresOne[1]] = '3'
console.log(gridArr);

// 0 =wall
// 1 = start
// 2 = path
// 3 = end
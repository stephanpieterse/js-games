// this can be another seedable generator in future
// need to solidify it before writing seeded map tests
var seed = 1; // 1, 200
function srandom() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let parts = [{
    tags: ["start"],
    size: [1, 1],
    linkpos: [
        {d:'s',p:[0, 0]}
    ],
    uses: 1,
    externalRef: '/smallhome.part',
    noRotation: false
}, {
    tags: ["start"],
    size: [2, 3],
    linkpos: [
        {d:'s',p:[0, 0]}
    ],
    uses: 1,
    externalRef: '/bighome.blend',
    noRotation: false
}, {
    tags: ['interior'],
    size: [2, 1],
    linkpos: [
        {d:'n',p:[1, 0]}
    ],
    uses: -1, // infinit
    externalRef: 'thingy.xcf',
    noRotation: false
}, {
    tags: ['interior', 'bunker'],
    size: [3, 2],
    linkpos: [
        {d:'e',p:[0, 2]}
    ],
    uses: -1, // infinit
    externalRef: 'thingy.xcf',
    noRotation: false
}];

let facecycle = [
    ['n', 'e', 's', 'w'],
    ['n', 't', 's', 'b'],
    ['w', 't', 'e', 'b']
]


function rotatePart(part, turns, axis) {
    const face = facecycle[0];
    if (turns % 4 == 0) {
        return parts;
    }
    turns = turns % 4;

    for (let n in part.linkpos) {
        let npos = face[(face.indexOf(part.linkpos[n][0]) + turns) % 4];
        part.linkpos[n] = npos;
        // swap pos axis and pos axis + 1 // with wraparound
    }
    let ts = part.size[axis];
    part.size[axis] = part.size[(axis + 1) % part.size.length];
    // swap sizes in n space 
    // move linkpos around 
}


function setGrid(g, data) {
    for (let i in g) {
        if (g[i] instanceof Array) {
            setGrid(g[i], data);
        } else {
            g[i] = data;
        }
    }
    return g;
}

function generatePartIdFunc() {
    let cpid = 0;
    return function () {
        cpid += 1;
        return cpid;
    }
}

let generatePartId = generatePartIdFunc();

function setObjFit(grid, start, part) {
    // todo expansion needs to be over size of parts
    if (start[0] > grid.length) {
        expandNGrid(grid, '', 1, 1)
    }
    if (start[1] > grid[start[0]].length) {
        expandNGrid(grid, '', 1, 2)
    }
    if (start[0] < 0) {
        expandNGrid(grid, '', 0, 1)
    }
    if (start[1] < grid[start[0]].length) {
        expandNGrid(grid, '', 0, 2)
    }
}

function checkObjFit(grid, start, part) {
    // check if start is in grid
    // -- resize grid if not, by part size,
    // -- return true
    if (start[0] > grid.length) {
        return true;
    }
    if (start[1] > grid[start[0]].length) {
        return true;
    }
    // check if end is in grid
    // -- resize if not
    // for loop of part size, offset by start
    // -- check pos in grid if empty
    // -- if any is full , return false
    // -- if none full, return true

}

function expandNGrid(grid, data, lr, depth) {
    //console.log(arguments);
    if (depth == 0) {
        if (lr == 0) {
            grid.unshift(setGrid(cclone(grid[0]), data));
        }
        if (lr == 1) {
            grid.push(setGrid(cclone(grid[0]), data));
        }
        return;
    }
    for (let d = 0; d < depth; d++) {
        for (let ob of grid) {
            expandNGrid(ob, data, lr, depth - 1);
        }
    }
}

function cclone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function shuffle(array) {
    const result = [],
        itemsLeft = array.concat([]);

    while (itemsLeft.length) {
        const randomIndex = Math.floor(srandom() * itemsLeft.length);
        const [randomItem] = itemsLeft.splice(randomIndex, 1); // take out a random item from itemsLeft
        result.push(randomItem); // ...and add it to the result
    }

    return result;
}

// MAIN
function generateGrid(parts, options) {
    let partGrid = [];
    let exposedExits = [];

    let minParts = options.minParts;
    // get start parts
    let eligibleParts = [];
    //    for (let p of parts) {
    //        if (p.tags.indexOf('start') > -1) {
    //            eligibleParts.push(cclone(p));
    //        }
    //    }
    eligibleParts = parts.filter(function (p) {
        return p.tags.indexOf('start') >= 0;
    }).map(function(ob){
        return cclone(ob);
    });

    console.log(eligibleParts);
    // randomize them
    eligibleParts = shuffle(eligibleParts);
    console.log(eligibleParts);

    let chosenParts = [];
    let startpart = eligibleParts.pop();
    startpart.id = generatePartId();
    chosenParts.push(startpart);
    exposedExits.push(startpart.linkpos)

    for (let i = 0; i < startpart.size[0]; i++) {
        let sg = [];
        for (let j = 0; j < startpart.size[1]; j++) {
            sg.push([startpart.id]);
        }
        partGrid.push(sg);
    }
    console.log(partGrid);
    expandNGrid(partGrid, '-', 0, 1);
    expandNGrid(partGrid, '+', 1, 1);
    expandNGrid(partGrid, '-', 0, 0);
    expandNGrid(partGrid, 'r', 1, 0);
    console.log(partGrid);


    while (chosenParts.length < minParts) {
        eligibleParts = parts.filter(function (p) {
            return p.tags.indexOf('start') == -1;
        }).map(function(ob){
            return cclone(ob);
        });
        eligibleParts = shuffle(eligibleParts);
        for (var p of eligibleParts) {
            if (p.uses == 0){
                continue;
            }
            let canfit = checkObjFit(partGrid, exposedExits[0], p);
            if (!canfit) {
                rotatePart(part, 1, 0);
            }
            if (canfit) {
                exposedExits.shift();
                p.id = generatePartId();
                p.uses -= 1; 
                chosenParts.push(p);
                eligibleParts = shuffle(eligibleParts);
            }
        }
        // until min parts reached; do:
        // get a part
        //   does part fit in current expanded grid
        //     place (1)
        //   ? rotate, recheck
        //  next part
        // all parts done, move to next linkpos
    }


    // 1
    // expand grid, make mark where each block is taking up space
    // decrements uses
    // if 0, remove from pool
    // add block to chosenparts with new id
}

generateGrid(parts, {
    minParts: 4
});

//#region access html
const url_input = document.getElementById("url");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 2000;
canvas.height = canvas.width;
//#endregion

//#region globals
code_grid = []
//#endregion

//#region listeners
url_input.addEventListener(
    "change", function(event) {
        generateCode()
    }
);
//#endregion

function reset(){
    code_grid = []
    for (let i=0; i<25; i++){
        code_grid.push([]);
        for (let j=0; j<25; j++){
            code_grid[i].push(0);
        }
    }

    //top-left
    for (let i=0; i<7; i++){
        code_grid[0][i] = 1;
    }
    for (let i=1; i<6; i++){
        code_grid[i][0] = 1;
        code_grid[i][6] = 1;
    }
    for (let i=0; i<7; i++){
        code_grid[6][i] = 1;
    }

    //top right
    for (let i=0; i<7; i++){
        code_grid[0][24-i] = 1;
    }
    for (let i=1; i<6; i++){
        code_grid[i][24] = 1;
        code_grid[i][18] = 1;
    }
    for (let i=0; i<7; i++){
        code_grid[6][24-i] = 1;
    }

    //bottom left
    for (let i=0; i<7; i++){
        code_grid[24][i] = 1;
    }
    for (let i=1; i<6; i++){
        code_grid[24-i][0] = 1;
        code_grid[24-i][6] = 1;
    }
    for (let i=0; i<7; i++){
        code_grid[18][i] = 1;
    }
}

function generateCode(){
    reset();

    console.log(code_grid);
    // url = url_input.value;
    // for (let i = 0; i < url.length; i++){
    //     console.log(url.charCodeAt(i))
    // }
}
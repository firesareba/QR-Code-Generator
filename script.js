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
    for (let i=0; i<27; i++){
        code_grid.push([]);
        for (let j=0; j<27; j++){
            code_grid[i].push(0);
        }
    }

    //#region top-left
    //outline
    for (let i=1; i<8; i++){
        code_grid[1][i] = 1;
    }
    for (let i=2; i<7; i++){
        code_grid[i][1] = 1;
        code_grid[i][7] = 1;
    }
    for (let i=3; i<8; i++){
        code_grid[1][i] = 1;
    }

    //middle
    for (let i=3; i<=5; i++){
        for (let j=3; j<=5; j++){
            code_grid[i][j] = 1;
        }
    }
    //#endregion

    //#region top right
    //outline
    for (let i=1; i<8; i++){
        code_grid[1][25-i] = 1;
    }
    for (let i=1; i<7; i++){
        code_grid[i][25] = 1;
        code_grid[i][19] = 1;
    }
    for (let i=1; i<8; i++){
        code_grid[7][25-i] = 1;
    }

    //middle
    for (let i=3; i<=5; i++){
        for (let j=23; j<=20; j--){
            code_grid[i][j] = 1;
        }
    }
    //#endregion

    //#region bottom left
    //outline
    for (let i=1; i<8; i++){
        code_grid[25][i] = 1;
    }
    for (let i=2; i<7; i++){
        code_grid[25-i][1] = 1;
        code_grid[25-i][7] = 1;
    }
    for (let i=1; i<8; i++){
        code_grid[19][i] = 1;
    }

    //middle
    for (let i=23; i<=20; i--){
        for (let j=3; j<=5; j++){
            code_grid[i][j] = 1;
        }
    }
    //#endregion
}

function generateCode(){
    reset();

    console.log(code_grid);
    // url = url_input.value;
    // for (let i = 0; i < url.length; i++){
    //     console.log(url.charCodeAt(i))
    // }
}
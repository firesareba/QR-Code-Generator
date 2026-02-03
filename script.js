cell_size = 100

//#region access html
const url_input = document.getElementById("url");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 27*cell_size;
canvas.height = canvas.width;
//#endregion

code_grid = []

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

    //#region top-left
    //outline
    for (let i=0; i<7; i++){
        code_grid[0][i] = 1;//top row
        code_grid[i][0] = 1;//left column
        code_grid[i][6] = 1;//right column
        code_grid[6][i] = 1;//bottom column
    }

    //middle
    for (let i=2; i<=4; i++){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 1;
        }
    }
    //#endregion

    //#region top right
    //outline
    for (let i=0; i<7; i++){
        code_grid[0][24-i] = 1;//top row
        code_grid[i][24] = 1;//right column
        code_grid[i][18] = 1;//left column
        code_grid[6][24-i] = 1;//bottom row
    }

    //middle
    for (let i=2; i<=4; i++){
        for (let j=22; j>=20; j--){
            code_grid[i][j] = 1;
        }
    }
    //#endregion

    //#region bottom left
    //outline
    for (let i=0; i<7; i++){
        code_grid[24][i] = 1;//bottom row
        code_grid[24-i][0] = 1;//left column
        code_grid[24-i][6] = 1;//right column
        code_grid[18][i] = 1;//top row
    }

    //middle
    for (let i=22; i>=20; i--){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 1;
        }
    }
    //#endregion

    //#region smaller extra
    for (let i=0; i<=4; i++){
        code_grid[16][16+i] = 1;//top row
        code_grid[16+i][16] = 1;//left column
        code_grid[16+i][20] = 1;//right column
        code_grid[20][16+i] = 1;//bottom row
    }
    code_grid[18][18] = 1;//center
    //#endregion

    //#region timing strips
    for (let i=8; i<=16; i+=2){
        code_grid[8][i] = 1;
        code_grid[i][8] = 1;
    }
    //#endregion

    drawable_canvas.fillStyle = "white";
    drawable_canvas.fillRect(0, 0, 27*cell_size, 27*cell_size);
    drawable_canvas.fillStyle = "black";
}

function generateCode(){
    reset();

    displayCode();
    url = url_input.value;
    for (let i = 0; i < url.length; i++){
        console.log(url.charCodeAt(i))
    }
}

function displayCode(){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (code_grid[i][j] == 1){
                
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }
        }
    }
}
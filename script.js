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
        code_grid[0][i] = 2;//top row
        code_grid[i][0] = 2;//left column
        code_grid[i][6] = 2;//right column
        code_grid[6][i] = 2;//bottom column
    }

    //middle
    for (let i=2; i<=4; i++){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 2;
        }
    }
    //#endregion

    //#region top right
    //outline
    for (let i=0; i<7; i++){
        code_grid[0][24-i] = 2;//top row
        code_grid[i][24] = 2;//right column
        code_grid[i][18] = 2;//left column
        code_grid[6][24-i] = 2;//bottom row
    }

    //middle
    for (let i=2; i<=4; i++){
        for (let j=22; j>=20; j--){
            code_grid[i][j] = 2;
        }
    }
    //#endregion

    //#region bottom left
    //outline
    for (let i=0; i<7; i++){
        code_grid[24][i] = 2;//bottom row
        code_grid[24-i][0] = 2;//left column
        code_grid[24-i][6] = 2;//right column
        code_grid[18][i] = 2;//top row
    }

    //middle
    for (let i=22; i>=20; i--){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 2;
        }
    }
    //#endregion

    //#region smaller extra
    for (let i=0; i<=4; i++){
        code_grid[16][16+i] = 2;//top row
        code_grid[16+i][16] = 2;//left column
        code_grid[16+i][20] = 2;//right column
        code_grid[20][16+i] = 2;//bottom row
    }
    code_grid[18][18] = 2;//center
    //#endregion

    //#region timing strips
    for (let i=8; i<=16; i+=2){
        code_grid[6][i] = 2;
        code_grid[i][6] = 2;
    }
    //#endregion

    code_grid[17][8] = 2;//random one in all qr codes
    code_grid[24][23] = 2; //mode indicator 0100 for binary mode(goes right ot left, bottom to top.)

    drawable_canvas.fillStyle = "white";
    drawable_canvas.fillRect(0, 0, 27*cell_size, 27*cell_size);
    drawable_canvas.fillStyle = "black";
}

function generateCode(){
    reset();

    url = url_input.value;
    console.log((url.length).toString(2));

    for (let i = 0; i < url.length; i++){
        console.log(url.charCodeAt(i))
    }
    displayCode();
}

function writeByte(byte, start){
    row_offset = 0;
    col_offset = 0;
    for (let i = 8; i>0; i--){
        if (byte.length-i >= 0){
            bit = parseInt(byte[byte.length-i]);
        } else {
            bit = 0;
        }
    }
}

function displayCode(){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (code_grid[i][j] == 1){
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }else if (code_grid[i][j] == 2){
                drawable_canvas.fillStyle = "blue";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
                drawable_canvas.fillStyle = "black";
            }
        }
    }
}
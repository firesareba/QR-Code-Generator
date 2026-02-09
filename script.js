cell_size = 100

//#region access html
const url_input = document.getElementById("url");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 27*cell_size;
canvas.height = canvas.width;
//#endregion

code_grid = []
direction = -1;
col_offset = 0;
position = [22, 24];

//#region listeners
url_input.addEventListener(
    "change", function(event) {
        generateCode()
    }
);
//#endregion

function reset(){
    code_grid = []
    direction = -1;
    col_offset = 0;
    position = [22, 24];
    for (let i=0; i<25; i++){
        code_grid.push([]);
        for (let j=0; j<25; j++){
            code_grid[i].push(-1);
        }
    }

    //#region format strips
    outline(0, 0, 9, 3);
    for (let i=24; i >= 17; i--){
        code_grid[8][i] = 3;
        code_grid[i][8] = 3;
    }
    //#endregion

    //#region top-left
    outline(0, 0, 8, 2);//outside
    outline(1, 1, 5, 2);//inside
    outline(0, 0, 7, 3);//middle

    //middle
    for (let i=2; i<=4; i++){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 3;
        }
    }
    //#endregion

    //#region top right
    outline(0, 17, 8, 2);//outside
    outline(1, 19, 5, 2);//inside
    outline(0, 18, 7, 3);//middle

    //middle
    for (let i=2; i<=4; i++){
        for (let j=22; j>=20; j--){
            code_grid[i][j] = 3;
        }
    }
    //#endregion

    //#region bottom left
    outline(17, 0, 8, 2);//outside
    outline(19, 1, 5, 2);//inside
    outline(18, 0, 7, 3);//middle
    
    //middle
    for (let i=22; i>=20; i--){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 3;
        }
    }
    //#endregion

    //#region smaller extra
    outline(17, 17, 3, 2);//white
    outline(16, 16, 5, 3);

    code_grid[18][18] = 3;//center
    //#endregion

    //#region timing strips
    for (let i=8; i<=16; i++){
        code_grid[6][i] = (i%2==0)+2;
        code_grid[i][6] = (i%2==0)+2;
    }
    //#endregion

    code_grid[17][8] = 3;//random one in all qr codes
    //mode indicator 0100(+2 at each cause it's base not data) for binary mode(goes right to left, bottom to top.)
    code_grid[24][24] = 2; 
    code_grid[24][23] = 3;
    code_grid[23][24] = 2;
    code_grid[23][23] = 2; 

    drawable_canvas.fillStyle = "white";
    drawable_canvas.fillRect(0, 0, 27*cell_size, 27*cell_size);
    drawable_canvas.fillStyle = "black";

    for (let i=0; i<27; i++){
        draw_line(0, i*cell_size, 27*cell_size, i*cell_size);
        draw_line(i*cell_size, 0, i*cell_size, 27*cell_size,);
    }
}

function outline(start_r, start_c, size, value){
    for (let i=0; i<size; i++){
        code_grid[start_r][start_c+i] = value;//top row
        code_grid[start_r+i][start_c] = value;//left column
        code_grid[start_r+i][start_c+size-1] = value;//right column
        code_grid[start_r+size-1][start_c+i] = value;//bottom row
    }
}

function generateCode(){
    url = url_input.value;
    if (url.length > 255){
        alert("too big");
        return;
    }
    
    reset();
    writeByte((url.length).toString(2), position);//length

    for (let i = 0; i < url.length; i++){
        writeByte(url.charCodeAt(i).toString(2), position);//main data
    }

    for (let i=0; i<4; i++){
        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = 0;//padded endbits
    }

    //error correction
    position = [22, 24];
    col_offset = 0;
    direction = -1;

    coefficients = [];
    currByte = "0100";
    
    while (code_grid[position[0]][position[1]-col_offset] != -1){
        if (code_grid[position[0]][position[1]-col_offset] == 0 || code_grid[position[0]][position[1]-col_offset] == 1){
            currByte += code_grid[position[0]][position[1]-col_offset];
            if (currByte.length == 8){
                coefficients.push(parseInt(currByte, 2));
                currByte = "";
            }
            code_grid[position[0]][position[1]-col_offset] += 2;
        }
        nextPos(true);
    }

    console.log(coefficients)
    displayCode();
}

function nextPos(codeReading){
    while (true){
        if (codeReading && !(code_grid[position[0]][position[1]-col_offset] == 2 || code_grid[position[0]][position[1]-col_offset] == 3)){
            return;
        }

        if (code_grid[position[0]][position[1]-col_offset] == -1){
            return;
        } else if (col_offset == 0){//right cell
            col_offset = 1;
        } else {//move up/down
            position[0] += direction;
            col_offset = 0;
        }

        if (position[0] < 0 || 24 < position[0]){
            direction = -direction;
            position[0] += direction;
            position[1] -= 2;
            col_offset = 0;
        }
    }
}

function writeByte(byte){
    bit_idx = 8
    while (bit_idx > 0){
        if (byte.length-bit_idx >= 0){//pad 0
            bit = parseInt(byte[byte.length-bit_idx]);
        } else {
            bit = 0;
        }

        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = bit;
        bit_idx -= 1
    }
}

function displayCode(){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (code_grid[i][j] == 1){
                drawable_canvas.fillStyle = "black";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }else if (code_grid[i][j] == 2){
                drawable_canvas.fillStyle = "antiquewhite";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }else if (code_grid[i][j] == 3){
                drawable_canvas.fillStyle = "grey";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }else if (code_grid[i][j] == -1){
                drawable_canvas.fillStyle = "red";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }
        }
    }
}

function draw_line(x1, y1, x2, y2, type) {
    drawable_canvas.strokeStyle = 'rgb(0, 0, 255)';
    drawable_canvas.beginPath();
    drawable_canvas.moveTo(x1, y1);
    drawable_canvas.lineTo(x2, y2);
    drawable_canvas.stroke();
}


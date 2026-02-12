cell_size = 100

//#region access html
const url_input = document.getElementById("url");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 27*cell_size;
canvas.height = canvas.width;
//#endregion

code_grid = [];
direction = -1;
col_offset = 0;
position = [22, 24];

available_bits = 25**2; 
n_per_block = 16;
num_blocks = 1;

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
    for (let i=0; i < 8; i++){
        //topleft
        code_grid[8][i] = 3;    
        code_grid[i][8] = 3;

        code_grid[8][24-i] = 3;//top right
        code_grid[24-i][8] = 3;//bottom left
        
        available_bits -= 4;
    }
    code_grid[8][8] = 3;//corner in top left
    available_bits -= 1;
    console.log("format", (25**2-available_bits));
    //#endregion

    //#region top-left
    outline(0, 0, 8, 2);//outside
    outline(1, 1, 5, 2);//inside
    outline(0, 0, 7, 3);//middle

    //middle
    for (let i=2; i<=4; i++){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 3;
            available_bits -= 1;
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
            available_bits -= 1;
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
            available_bits -= 1;
        }
    }
    //#endregion

    //#region smaller extra
    outline(17, 17, 3, 2);//white
    outline(16, 16, 5, 3);

    code_grid[18][18] = 3;//center
    available_bits -= 1;
    //#endregion

    //#region timing strips
    for (let i=8; i<=16; i++){
        available_bits -= (code_grid[6][i] == -1) + (code_grid[i][6] == -1);
        code_grid[6][i] = (i%2==0)+2;
        code_grid[i][6] = (i%2==0)+2;
    }
    //#endregion

    available_bits -= (code_grid[17][8] == -1);
    code_grid[17][8] = 3;//random one in all qr codes
    //mode indicator 0100(+2 at each cause it's base not data) for binary mode(goes right to left, bottom to top.)
    code_grid[24][24] = 2; 
    code_grid[24][23] = 3;
    code_grid[23][24] = 2;
    code_grid[23][23] = 2;
    available_bits -= 4;

    drawable_canvas.fillStyle = "white";
    drawable_canvas.fillRect(0, 0, 27*cell_size, 27*cell_size);
    drawable_canvas.fillStyle = "black";
}

function drawGrid(){
    for (let i=0; i<27; i++){
        draw_line(0, i*cell_size, 27*cell_size, i*cell_size);
        draw_line(i*cell_size, 0, i*cell_size, 27*cell_size,);
    }
}

function outline(start_r, start_c, size, value){
    available_bits -= (code_grid[start_r][start_c] == -1) + (code_grid[start_r+size-1][start_c] == -1) + (code_grid[start_r][start_c+size-1] == -1) + (code_grid[start_r+size-1][start_c+size-1] == -1);
    code_grid[start_r][start_c] = value;
    code_grid[start_r+size-1][start_c] = value;
    code_grid[start_r][start_c+size-1] = value;
    code_grid[start_r+size-1][start_c+size-1] = value;

    for (let i=1; i<size-1; i++){
        available_bits -= (code_grid[start_r][start_c+i] == -1) + (code_grid[start_r+i][start_c] == -1) + (code_grid[start_r+i][start_c+size-1] == -1) + (code_grid[start_r+size-1][start_c+i] == -1);
        code_grid[start_r][start_c+i] = value;//top row
        code_grid[start_r+i][start_c] = value;//left column
        code_grid[start_r+i][start_c+size-1] = value;//right column
        code_grid[start_r+size-1][start_c+i] = value;//bottom row
    }
}

function polynomialDivision(dividend, divisor){
    quotient = []

    for (calcIdx = 0; calcIdx <= (dividend.length - divisor.length); calcIdx++){
        multiplier = Math.floor(dividend[calcIdx]/divisor[0]);
        quotient.push(multiplier);
        for (let i=0; i < divisor.length; i++){
            dividend[calcIdx+i] -= divisor[i]*multiplier;
        }
    }
    while (dividend[0] == 0){
        dividend.shift();
    }
    // console.log("quotient: "+quotient)
    // console.log("remainder: "+dividend)
    return dividend;
}

function generateCode(){
    url = url_input.value;
    if (url.length > 255){
        alert("too big");
        return;
    }
    
    reset();
    console.log(available_bits, 25**2-available_bits);
    
    //#region main data
    writeByte((url.length).toString(2));//length

    for (let i = 0; i < url.length; i++){
        writeByte(url.charCodeAt(i).toString(2));
    }
    //#endregion

    //#region padding
    for (let i=0; i<4; i++){
        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = 0;//padded terminator bits
        available_bits -= 1;
    }

    num = 1;
    while (available_bits > 8*(n_per_block*num_blocks)+7){//8 bits per byte, n/block*block = n = # of bytes, 7 for version info
        writeByte((17+(219*num)).toString(2));
        num = Math.abs(num-1);
    }

    //#endregion

    //#region error correction coefficients
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
            code_grid[position[0]][position[1]-col_offset] += 4;
        }
        nextPos(true);
    }
    // console.log("coefficients: "+coefficients);
    //#endregion

    //#region write error correction bytes
    remainder = polynomialDivision([3, -4, 0, -3, -1], [1, -1]);//GET DIVISOR LATER FROM DOCS
    //remainder coefficients are the error correction bytes.
    //#endregion

    displayCode();
}

function nextPos(codeReading){
    while (true){
        if (codeReading && code_grid[position[0]][position[1]-col_offset] < 2){
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
        available_bits -= 1;
    }
}

function displayCode(){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (code_grid[i][j] == 5){
                drawable_canvas.fillStyle = "black";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 2){
                drawable_canvas.fillStyle = "antiquewhite";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 3){
                drawable_canvas.fillStyle = "grey";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 10){
                drawable_canvas.fillStyle = "green";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 11){
                drawable_canvas.fillStyle = "limegreen";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == -1){
                drawable_canvas.fillStyle = "red";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }
        }
    }
    drawGrid();
}

function draw_line(x1, y1, x2, y2, type) {
    drawable_canvas.strokeStyle = 'rgb(0, 0, 255)';
    drawable_canvas.beginPath();
    drawable_canvas.moveTo(x1, y1);
    drawable_canvas.lineTo(x2, y2);
    drawable_canvas.stroke();
}


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
vertical_format = 6;

exponent_table = [1, 2, 4, 8, 16, 32, 64, 128, 29, 58, 116, 232, 205, 135, 19, 38, 76, 152, 45, 90, 180, 117, 234, 201, 143, 3, 6, 12, 24, 48, 96, 192, 157, 39, 78, 156, 37, 74, 148, 53, 106, 212, 181, 119, 238, 193, 159, 35, 70, 140, 5, 10, 20, 40, 80, 160, 93, 186, 105, 210, 185, 111, 222, 161, 95, 190, 97, 194, 153, 47, 94, 188, 101, 202, 137, 15, 30, 60, 120, 240, 253, 231, 211, 187, 107, 214, 177, 127, 254, 225, 223, 163, 91, 182, 113, 226, 217, 175, 67, 134, 17, 34, 68, 136, 13, 26, 52, 104, 208, 189, 103, 206, 129, 31, 62, 124, 248, 237, 199, 147, 59, 118, 236, 197, 151, 51, 102, 204, 133, 23, 46, 92, 184, 109, 218, 169, 79, 158, 33, 66, 132, 21, 42, 84, 168, 77, 154, 41, 82, 164, 85, 170, 73, 146, 57, 114, 228, 213, 183, 115, 230, 209, 191, 99, 198, 145, 63, 126, 252, 229, 215, 179, 123, 246, 241, 255, 227, 219, 171, 75, 150, 49, 98, 196, 149, 55, 110, 220, 165, 87, 174, 65, 130, 25, 50, 100, 200, 141, 7, 14, 28, 56, 112, 224, 221, 167, 83, 166, 81, 162, 89, 178, 121, 242, 249, 239, 195, 155, 43, 86, 172, 69, 138, 9, 18, 36, 72, 144, 61, 122, 244, 245, 247, 243, 251, 235, 203, 139, 11, 22, 44, 88, 176, 125, 250, 233, 207, 131, 27, 54, 108, 216, 173, 71, 142, 1]
log_table = [-1, 0, 1, 25, 2, 50, 26, 198, 3, 223, 51, 238, 27, 104, 199, 75, 4, 100, 224, 14, 52, 141, 239, 129, 28, 193, 105, 248, 200, 8, 76, 113, 5, 138, 101, 47, 225, 36, 15, 33, 53, 147, 142, 218, 240, 18, 130, 69, 29, 181, 194, 125, 106, 39, 249, 185, 201, 154, 9, 120, 77, 228, 114, 166, 6, 191, 139, 98, 102, 221, 48, 253, 226, 152, 37, 179, 16, 145, 34, 136, 54, 208, 148, 206, 143, 150, 219, 189, 241, 210, 19, 92, 131, 56, 70, 64, 30, 66, 182, 163, 195, 72, 126, 110, 107, 58, 40, 84, 250, 133, 186, 61, 202, 94, 155, 159, 10, 21, 121, 43, 78, 212, 229, 172, 115, 243, 167, 87, 7, 112, 192, 247, 140, 128, 99, 13, 103, 74, 222, 237, 49, 197, 254, 24, 227, 165, 153, 119, 38, 184, 180, 124, 17, 68, 146, 217, 35, 32, 137, 46, 55, 63, 209, 91, 149, 188, 207, 205, 144, 135, 151, 178, 220, 252, 190, 97, 242, 86, 211, 171, 20, 42, 93, 158, 132, 60, 57, 83, 71, 109, 65, 162, 31, 45, 67, 216, 183, 123, 164, 118, 196, 23, 73, 236, 127, 12, 111, 246, 108, 161, 59, 82, 41, 157, 85, 170, 251, 96, 134, 177, 187, 204, 62, 90, 203, 89, 95, 176, 156, 169, 160, 81, 11, 245, 22, 235, 122, 117, 44, 215, 79, 174, 213, 233, 230, 231, 173, 232, 116, 214, 244, 234, 168, 80, 88, 175, ]//idx 0 is placeholder
//idx 0 is placeholder

available_bits = 25**2; 
alpha = 2;
n_per_block = 16;
num_blocks = 1;

//#region listeners
url_input.addEventListener(
    "change", function(event) {
        generateCode()
    }
);
//#endregion

//main func
function generateCode(){
    url = url_input.value;
    if (url.length > 255){
        alert("too big");
        return;
    }
    
    reset();
    
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
    remainder = dividePolynomial(coefficients, generatorPolynomial());
    for (let i=0; i<remainder.length; i++){
        byte = ""

        //make green
        for (let j=0; j < remainder[i].toString(2).length; j++){
            byte += (parseInt(remainder[i].toString(2)[j])+6).toString();
        }
        while (byte.length < 8){
            byte = '6'+byte;
        }

        writeByte(byte);
    }

    //Left over 7 bits are just 0s, after version 10 or smth they start holding info about verison num
    for (let i=0; i<7; i++){
        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = 2;//should be done in reset func, but don't want to hard code starting pos
    }
    //#endregion

    //#region format strips
    //medium error correction
    format_main = "01100";

    format_error = padRight(format_main, 15);
    format_error = extend_format(format_error);
    format_combined = format_main+format_error;

    format_final = stringXOR(format_combined, "101010000010010");
    console.log(format_final);

    for (let i=0; i<6; i++){//top left
        code_grid[8][i] =  parseInt(format_final[i])+8;
    }
    code_grid[8][7] =  parseInt(format_final[6])+8;
    code_grid[8][8] =  parseInt(format_final[7])+8;
    code_grid[7][8] =  parseInt(format_final[8])+8;
    for (let i=0; i<6; i++){
        code_grid[5-i][8] =  parseInt(format_final[i+9])+8;
    }

    for (let i=0; i<7; i++){//botom left
        code_grid[24-i][8] = parseInt(format_final[i])+8;
    }
    for (let i=0; i<8; i++){//top right
        code_grid[8][24-7+i] = parseInt(format_final[7+i])+8;
    }
    //#endregion

    displayCode();
}



//#region independent of data
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
//#endregion


//#region writing info
function nextPos(codeReading){
    while (true){
        if (codeReading && code_grid[position[0]][position[1]-col_offset] < 2){
            return;
        }

        if (position[1] == vertical_format){
            position[1] -= 1;
            col_offset = 0;
        } else if (code_grid[position[0]][position[1]-col_offset] == -1){
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
//#endregion


//#region math
//#region reed-solomon
function galois_Add(addend_1, addend_2){
    return addend_1 ^ addend_2;
}

function galois_Subtract(minuend, subtrahend){
    return galois_Add(minuend, subtrahend);//same thing bc of the way math works, cause needs to be finite or smth
}

function galois_Multiply(multiplicand, multiplier){
    if (multiplicand*multiplier == 0){
        return 0;
    }

    log_multiplicand = galois_Log(multiplicand);
    log_multiplier = galois_Log(multiplier);
    return galois_Exponentiate((log_multiplicand + log_multiplier)%255);
}

function galois_Divide(dividend, divisor){
    return galois_Multiply(dividend, divisor**254);
}

function galois_Exponentiate(exponent){//base is alpha(2 bc binary)
    return exponent_table[exponent];
}

function galois_Log(power){//base is alpha(2 bc binary)
    return log_table[power];
}


function dividePolynomial(dividend, divisor){
    quotient = []

    for (calcIdx = 0; calcIdx <= (dividend.length - divisor.length); calcIdx++){
        multiplier = Math.floor(galois_Divide(dividend[calcIdx], divisor[0]));
        quotient.push(multiplier);
        for (let i=0; i < divisor.length; i++){
            dividend[calcIdx+i] = galois_Subtract(dividend[calcIdx+i], galois_Multiply(divisor[i], multiplier));
        }
    }
    while (dividend[0] == 0){
        dividend.shift();
    }
    // console.log("quotient: "+quotient)
    // console.log("remainder: "+dividend)
    return dividend;
}

function multiplyPolynomial(multiplicand, multiplier){
    product = new Array(multiplicand.length+multiplier.length-1).fill(0);

    for (let i=0; i < multiplicand.length; i++){
        for (let j=0; j < multiplier.length; j++){
            multiplicand_degree = (multiplicand.length-i) -1;
            multiplier_degree = (multiplier.length-j) -1;
            product_degree = multiplicand_degree + multiplier_degree;

            product_idx = (product.length-product_degree) -1;

            product[product_idx] = galois_Add(product[product_idx], galois_Multiply(multiplicand[i], multiplier[j]));
        }
    }

    return product;
}

function generatorPolynomial(){
    curr = [1];
    for (let i=0; i<n_per_block*num_blocks; i++){
        curr = multiplyPolynomial(curr, [1, galois_Exponentiate(i)]);//actually 1-exponentialte(i), but add and sub is same
    }
    
    return curr;
}
//#endregion

function padRight(binaryString, targetLen){
    while (binaryString.length < targetLen){
        binaryString = binaryString + '0';
    }
    return binaryString;
}

function padLeft(binaryString, targetLen){
    while (binaryString.length < targetLen){
        binaryString = '0'+binaryString;
    }
    return binaryString;
}

function removeLeadingZeros(binaryString){
    while (binaryString[0] == 0){
        binaryString = binaryString.substring(1);
    }

    return binaryString;
}

function stringXOR(a, b){
    result = "";
    for (let i=0; i < a.length; i++){//b.len = a.len
            bit = (parseInt(a[i]) + parseInt(b[i]))%2;
            result += bit.toString();
    }
    return result;
}

function extend_format(format){
    format = removeLeadingZeros(format);

    generator = padRight("10100110111", format.length);
    
    format = stringXOR(format, generator);
    format = removeLeadingZeros(format);

    if (format.length > 10){
        return extend_format(format);
    }
    return padLeft(format, 10);
}

//#endregion


//#region draw
function displayCode(){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (code_grid[i][j] == 5 || code_grid[i][j] == 1){
                drawable_canvas.fillStyle = "black";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 2){
                drawable_canvas.fillStyle = "antiquewhite";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 3){
                drawable_canvas.fillStyle = "grey";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 6){
                drawable_canvas.fillStyle = "green";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 7){
                drawable_canvas.fillStyle = "limegreen";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }  else if (code_grid[i][j] == 8){
                drawable_canvas.fillStyle = "yellow";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == 9){
                drawable_canvas.fillStyle = "blue";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            } else if (code_grid[i][j] == -1){
                drawable_canvas.fillStyle = "red";
                drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
            }
        }
    }
    drawGrid();
}

function drawGrid(){
    for (let i=0; i<27; i++){
        draw_line(0, i*cell_size, 27*cell_size, i*cell_size);
        draw_line(i*cell_size, 0, i*cell_size, 27*cell_size,);
    }
}

function draw_line(x1, y1, x2, y2, type) {
    drawable_canvas.strokeStyle = 'rgb(0, 0, 255)';
    drawable_canvas.beginPath();
    drawable_canvas.moveTo(x1, y1);
    drawable_canvas.lineTo(x2, y2);
    drawable_canvas.stroke();
}
//#endregion
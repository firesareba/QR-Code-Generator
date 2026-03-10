//#region Vars
const cell_size = 100
const vertical_format = 6;

let code_grid = [];
let errorLevelMap;

const alpha = 2;
let version = 2;
//#endregion

//#region access html
const url_input = document.getElementById("url");
const mask_input = document.getElementById("mask");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 27*cell_size;
canvas.height = canvas.width;
//#endregion

//#region listeners
url_input.addEventListener(
    "change", function(event) {
        generateCode()
    }
);

mask_input.addEventListener(
    "change", function(event) {
        generateCode()
    }
);

document.querySelectorAll('input[name="error-correction"]').forEach(radio => {
    radio.addEventListener("change", function(event) {
        generateCode();
    });
});
//#endregion

//#region steps
function mainData(){
    writeByte(padLeft((url.length).toString(2)));//length

    for (let i = 0; i < url.length; i++){
        if (!writeByte(padLeft(url.charCodeAt(i).toString(2)))){
            return false;
        }
    }
    return true;
}

function padding(errorLevel){
     for (let i=0; i<4; i++){
        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = 0;//padded terminator bits
        available_bits -= 1;
    }

    num = 1;
    while (available_bits > 8*(errorLevelMap.get(errorLevel).get('n_per_block')[version]*errorLevelMap.get(errorLevel).get('num_blocks')[version])+7){//8 bits per byte, n/block*block = n = # of bytes, 7 for version info
        writeByte(padLeft((17+(219*num)).toString(2)));
        num = Math.abs(num-1);
    }
}

function messageCoefficients(){
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
    console.log("message: "+coefficients);

    return coefficients
}

function ErrorCorrection(coefficients, errorLevel){
    coefficients.push(...new Array(errorLevelMap.get(errorLevel).get('n_per_block')[version] * errorLevelMap.get(errorLevel).get('num_blocks')[version]).fill(0));
    remainder = dividePolynomial(coefficients, generatorPolynomial(errorLevel));
    for (let i=0; i<remainder.length; i++){
        byte = ""

        //make green
        for (let j=0; j < remainder[i].toString(2).length; j++){
            byte += (parseInt(remainder[i].toString(2)[j])+6).toString();
        }

        writeByte(padLeft(byte));
    }

    //Left over 7 bits are just 0s, after version 10 or smth they start holding info about verison num
    for (let i=0; i<7; i++){
        nextPos(false);
        code_grid[position[0]][position[1]-col_offset] = 0;//should be done in resetGrid func, but don't want to hard code starting pos
    }
}

//#region mask
function mask0(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((row + col) % 2 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask1(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((row) % 2 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask2(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((col) % 3 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask3(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((row + col) % 3 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask4(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((Math.floor(row / 2) + Math.floor(col / 3) ) % 2 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask5(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if (((row * col) % 2) + ((row * col) % 3) == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask6(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((((row * col) % 2) + ((row * col) % 3)) % 2 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask7(){
    for (let row=0; row <= 24; row++){
        for (let col=0; col <= 24; col++){
            if ((((row + col) % 2) + ((row * col) % 3)) % 2 == 0 && Math.floor(code_grid[row][col]/2) != 1){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask(maskingMethod){
    switch (maskingMethod){
        case 0:
            mask0();
            break;
        case 1:
            mask1();
            break;
        case 2:
            mask2();
            break;
        case 3:
            mask3();
            break;
        case 4:
            mask4();
            break;
        case 5:
            mask5();
            break;
        case 6:
            mask6();
            break;
        case 7:
            mask7();
            break;
    }
}
//#endregion


function format(maskingMethod, errorLevel){
    format_main = errorLevelMap.get(errorLevel).get('formatBits')+padLeft(maskingMethod.toString(2), 3);

    format_error = padRight(format_main, 15);
    format_error = extend_format(format_error);
    format_combined = format_main+format_error;

    format_final = stringXOR(format_combined, "101010000010010");

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
}
//#endregion

//main func
function generateCode(){
    url = url_input.value;
    errorLevel = getErrorLevel();

    resetGrid();
    
    if (!mainData()){
        return;
    }

    padding(errorLevel);

    coeffiecients = messageCoefficients();

    ErrorCorrection(coeffiecients, errorLevel);

    maskingMethod = parseInt(mask_input.value)
    mask(maskingMethod);

    format(maskingMethod, errorLevel);

    displayCode();
}


//#region independent of data
function mapSetup(){
    errorLevelMap = new Map();
    errorLevelMap.set('L', new Map());
    errorLevelMap.set('M', new Map());
    errorLevelMap.set('Q', new Map());
    errorLevelMap.set('H', new Map());

    LMap = errorLevelMap.get('L');
    MMap = errorLevelMap.get('M');
    QMap = errorLevelMap.get('Q');
    HMap = errorLevelMap.get('H');

    LMap.set('formatBits', '01');
    LMap.set('n_per_block', [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]);
    LMap.set('num_blocks', [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25]);

    MMap.set('formatBits', '00');
    MMap.set('n_per_block', [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]);
    MMap.set('num_blocks', [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 50]);

    QMap.set('formatBits', '11');
    QMap.set('n_per_block', [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]);
    QMap.set('num_blocks', [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68]);

    HMap.set('formatBits', '10');
    HMap.set('n_per_block', [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]);
    HMap.set('num_blocks', [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]);
}

function resetGrid(){
    code_grid = []
    direction = -1;
    col_offset = 0;
    position = [22, 24];
    available_bits = 25**2; 

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

function getErrorLevel(){
    for (let levelOption of document.getElementsByClassName("error-correction")){
        if (levelOption.checked){
            return levelOption.value;
        }
    }
}
//#endregion


//#region writing info
function nextPos(codeReading){
    while (true){
        if (position[1] < 0){
            alert('Too much text! Chose lower Error Correction Level or higher Version');
            return false;
        }

        if (codeReading && code_grid[position[0]][position[1]-col_offset] < 2){
            return true;
        }

        if (position[1] == vertical_format){
            position[1] -= 1;
            col_offset = 0;
        } else if (code_grid[position[0]][position[1]-col_offset] == -1){
            return true;
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
    for (let idx=0; idx<8; idx++){
        bit = parseInt(byte[idx]);

        if (!nextPos(false)){
            return false;
        }

        code_grid[position[0]][position[1]-col_offset] = bit;
        available_bits -= 1;
    }
    return true;
}
//#endregion


//#region math
//#region reed-solomon
//#region lookup tables
// QR codes use primitive polynomial x^8+x^4+x^3+x^2+1 = 0x11D
const gf_exp = new Array(512);
const gf_log = new Array(256);

// Build lookup tables
gf_exp[0] = 1;
for (let i = 1; i < 256; i++){
    let val = gf_exp[i-1] * 2;
    if (val >= 256) val ^= 0x11D;
    gf_exp[i] = val;
}
for (let i = 256; i < 512; i++){
    gf_exp[i] = gf_exp[i - 255]; // extend to avoid mod in multiply
}
for (let i = 0; i < 255; i++){
    gf_log[gf_exp[i]] = i;
}
//#endregion

function gf_add(a, b){
    return a ^ b; 
}
function gf_sub(a, b){
    return gf_add(a, b); 
}
function gf_mul(a, b){ 
    if (a === 0 || b === 0) return 0;
    return gf_exp[gf_log[a] + gf_log[b]]; // no mod needed due to extended table
}
function gf_div(a, b){
    if (b === 0) throw new Error("Division by zero in GF(256)");
    if (a === 0) return 0;
    return gf_exp[(gf_log[a] - gf_log[b] + 255) % 255];
}
function gf_pow(a, n){
    return gf_exp[(gf_log[a] * n) % 255]; 
}
function gf_log_of(a){
    if (a === 0) throw new Error("log(0) undefined in GF(256)");
    return gf_log[a];
}


function dividePolynomial(dividend, divisor){
    quotient = []

    for (calcIdx = 0; calcIdx <= (dividend.length - divisor.length); calcIdx++){
        multiplier = Math.floor(gf_div(dividend[calcIdx], divisor[0]));
        quotient.push(multiplier);
        for (let i=0; i < divisor.length; i++){
            dividend[calcIdx+i] = gf_sub(dividend[calcIdx+i], gf_mul(divisor[i], multiplier));
        }
    }
    while (dividend[0] == 0){
        dividend.shift();
    }
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

            product[product_idx] = gf_add(product[product_idx], gf_mul(multiplicand[i], multiplier[j]));
        }
    }

    return product;
}

function generatorPolynomial(errorLevel){
    curr = [1];
    for (let i=0; i<errorLevelMap.get(errorLevel).get('n_per_block')[version]*errorLevelMap.get(errorLevel).get('num_blocks')[version]; i++){
        curr = multiplyPolynomial(curr, [1, gf_pow(alpha, i)]);//actually 1-exponentialte(i), but add and sub is same
    }
    
    return curr;
}
//#endregion

function padRight(binaryString, targetLen=8){
    while (binaryString.length < targetLen){
        binaryString = binaryString + (Math.floor(binaryString[0]/2)*2).toString();
    }
    return binaryString;
}

function padLeft(binaryString, targetLen=8){
    while (binaryString.length < targetLen){
        binaryString = (Math.floor(binaryString[0]/2)*2).toString()+binaryString;
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
function displayCode(debug=false){
    for (let i=0; i<25; i++){
        for (let j=0; j<25; j++){
            if (debug){
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
            } else {
                if (code_grid[i][j]%2 == 1){
                    drawable_canvas.fillStyle = "black";
                    drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
                }
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

mapSetup();

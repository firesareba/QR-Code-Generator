//#region Vars
const baseOffset = 0;
const dataOffset = 1;
const paddingOffset = 2;
const errorOffset = 3;
const formatOffset = 4;
const versionOffset = 5;
const debugColors = ["antiquewhite", "grey", "white", "black", "violet", "purple", "limegreen", "green", "yellow", "orange", "cyan", "blue"]

const leftoverBits = [0,0,7,7,7,7,7,0,0,0,0,0,0,0,3,3,3,3,3,3,3,4,4,4,4,4,4,4,3,3,3,3,3,3,3,0,0,0,0,0,0];

let code_grid = [];
let errorLevelMap;

const mode = "0100";
const cell_size = 50;
const vertical_format = 6;
const alpha = 2;
//#endregion

//#region access html
const url_input = document.getElementById("url");
const mask_input = document.getElementById("mask");
const error_level_input = document.getElementById("error-correction");
const version_label = document.getElementById("version-label");
const version_input = document.getElementById("version");
const debug_input = document.getElementById("debug");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
//#endregion

//#region listeners
url_input.addEventListener(
    "input", function(event) {
        generateCode();
    }
);

mask_input.addEventListener(
    "input", function(event) {
        generateCode();
    }
);

error_level_input.addEventListener(
    "change", function(event) {
        generateCode();
    }
);

version_input.addEventListener("input", function(e){
    version_label.innerHTML = "Version: "+ version_input.value;
    generateCode();
});

debug_input.addEventListener(
    "change", function(event) {
        generateCode();
    }
);
//#endregion


//#region steps
function basePatterns(version, size){
    code_grid = [];
    direction = -1;
    col_offset = 0;
    position = [size-1, size-1];
    available_bits = size**2; 

    for (let i=0; i<size; i++){
        code_grid.push([]);
        for (let j=0; j<size; j++){
            code_grid[i].push(-1);
        }
    }

    //#region format strips
    for (let i=0; i < 8; i++){
        //topleft
        code_grid[8][i] = 1+baseOffset*2;    
        code_grid[i][8] = 1+baseOffset*2;

        code_grid[8][size-1-i] = 1+baseOffset*2;//top right
        code_grid[size-1-i][8] = 1+baseOffset*2;//bottom left
        
        available_bits -= 4;
    }
    code_grid[8][8] = 1+baseOffset*2;//corner in top left
    available_bits -= 1;
    //#endregion

    //#region alignment patterns
    if (version > 1){
        alignmentPatterns(version, size);
    }
    //#endregion

    //#region finder patterns
    //#region top-left
    outline(0, 0, 8, 0+baseOffset*2);//outside
    outline(1, 1, 5, 0+baseOffset*2);//inside
    outline(0, 0, 7, 1+baseOffset*2);//middle

    //middle
    for (let i=2; i<=4; i++){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 1+baseOffset*2;
            available_bits -= 1;
        }
    }
    //#endregion

    //#region top right
    outline(0, size-8, 8, 0+baseOffset*2);//outside
    outline(1, size-6, 5, 0+baseOffset*2);//inside
    outline(0, size-7, 7, 1+baseOffset*2);//middle

    //middle
    for (let i=2; i<=4; i++){
        for (let j=size-3; j>=size-5; j--){
            code_grid[i][j] = 1+baseOffset*2;
            available_bits -= 1;
        }
    }
    //#endregion

    //#region bottom left
    outline(size-8, 0, 8, 0+baseOffset*2);//outside
    outline(size-6, 1, 5, 0+baseOffset*2);//inside
    outline(size-7, 0, 7, 1+baseOffset*2);//middle
    
    //middle
    for (let i=size-3; i>=size-5; i--){
        for (let j=2; j<=4; j++){
            code_grid[i][j] = 1+baseOffset*2;
            available_bits -= 1;
        }
    }
    //#endregion
    //#endregion
   
    //#region timing strips
    for (let i=8; i<=size-9; i++){
        available_bits -= (code_grid[6][i] == -1) + (code_grid[i][6] == -1);
        code_grid[6][i] = (i%2==0)+baseOffset*2;
        code_grid[i][6] = (i%2==0)+baseOffset*2;
    }
    //#endregion

    code_grid[size-8][8] = 1+baseOffset*2;//random one in all qr codes
    
    if (version >= 7){
        writeVersionBits("111111111111111111", size, baseOffset);
    }
}

function alignmentPatterns(version, size){
    let numLines = Math.floor(version/7)+2;
    let lastLine = size-7;
    let lineSpacing = Math.ceil((lastLine-6)/(numLines-1));
    lineSpacing = Math.ceil(lineSpacing/2)*2;

    for (let j=2; j<=numLines; j++){
        if (validAlignmentPattern([6, lastLine-(numLines-j)*lineSpacing])){
            setAlignmentPattern([6, lastLine-(numLines-j)*lineSpacing]);
        }
    }

    for (let i=2; i<=numLines; i++){
        if (validAlignmentPattern([lastLine-(numLines-i)*lineSpacing, 6])){
            setAlignmentPattern([lastLine-(numLines-i)*lineSpacing, 6]);
        }
        for (let j=2; j<=numLines; j++){
            if (validAlignmentPattern([lastLine-(numLines-i)*lineSpacing, lastLine-(numLines-j)*lineSpacing])){
                setAlignmentPattern([lastLine-(numLines-i)*lineSpacing, lastLine-(numLines-j)*lineSpacing]);
            }
        }
    }
}

function getErrorLevel(version){
    return [error_level_input.value, 8*(errorLevelMap.get(error_level_input.value).get('n_per_block')[version]*errorLevelMap.get(error_level_input.value).get('num_blocks')[version])+leftoverBits[version]]; //8 bits per byte, n/block*block = n = # of bytes, 7 for version info
}

function getBitStream(url, terminators, paddingBytes, version){
    let bitStream = [...mode];

    if (version < 10){
        bitStream.push(...offsetString(padLeft((url.length).toString(2)), dataOffset));//length
    } else {
        bitStream.push(...offsetString(padLeft((url.length).toString(2), 16), dataOffset));//length
    }

    for (let i = 0; i < url.length; i++){
        bitStream.push(...offsetString(padLeft(url.charCodeAt(i).toString(2)), dataOffset));
    }

    for (let i=0; i<terminators; i++){
        bitStream.push(paddingOffset*2);
    }
    for (let i=1; i<=paddingBytes; i++){
        bitStream.push(...offsetString(padLeft((17+(219*(i%2))).toString(2)), paddingOffset));
    }

    return bitStream
}

function messageCoefficients(url, terminators, paddingBytes, errorLevel, version){
    let codewords = [];
    let bitStream = getBitStream(url, terminators, paddingBytes, version);

    let currByte = [];
    for (let i=0; i<bitStream.length; i++){
        currByte.push(bitStream[i]);
        if (currByte.length == 8){
            codewords.push(currByte);
            currByte = [];
        }
    }

    let coefficients = [[]];
    let num_blocks = errorLevelMap.get(errorLevel).get("num_blocks")[version];
    let bytesPerBlock = Math.floor(codewords.length/num_blocks);
    for (let b=0; b<codewords.length; b++){
        if (coefficients[coefficients.length-1].length == bytesPerBlock){
            if (bytesPerBlock == Math.floor(codewords.length/num_blocks) && num_blocks-coefficients.length == codewords.length%num_blocks){
                bytesPerBlock += 1;
            }
            coefficients.push([])
        }
        coefficients[coefficients.length-1].push(parseInt(unoffsetString(codewords[b]).join(""), 2));
    }

    return coefficients;
}

function writeData(coefficients, size){
    for (let b=0; b<coefficients[coefficients.length-1].length; b++){
        for (let block=0; block<coefficients.length; block++){
            if (coefficients[block].length > b){
                writeByte(padLeft(coefficients[block][b].toString(2)), size, dataOffset);
            }
        }
    }
}

function ErrorCorrection(coefficients, errorLevel, version, size){
    let errorCoefficients = [];
    let blockCoefficients;
    for (let block = 0; block<coefficients.length; block++){
        blockCoefficients = coefficients[block];
        blockCoefficients.push(...new Array(errorLevelMap.get(errorLevel).get('n_per_block')[version]).fill(0));
        let remainder = dividePolynomial(blockCoefficients, generatorPolynomial(errorLevel, version));
        while (remainder.length < errorLevelMap.get(errorLevel).get('n_per_block')[version]){
            remainder.unshift(0);
        }
        errorCoefficients.push(remainder);
    }

    for (let b=0; b<errorCoefficients[0].length; b++){
        for (let block=0; block<errorCoefficients.length; block++){
            writeByte(padLeft(errorCoefficients[block][b].toString(2)), size, errorOffset);
        }
    }

    //Left over bits are just 0s
    for (let i=0; i<leftoverBits[version]; i++){
        nextPos(size);
        code_grid[position[0]][position[1]-col_offset] = dataOffset*2;//should be done in resetCode func, but don't want to hard code starting pos
    }
}

//#region mask
function importantBit(row, col){
    return Math.floor(code_grid[row][col]/2) == baseOffset || Math.floor(code_grid[row][col]/2) == formatOffset || Math.floor(code_grid[row][col]/2) == versionOffset;
}

function mask0(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((row + col) % 2 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask1(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((row) % 2 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask2(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((col) % 3 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask3(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((row + col) % 3 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask4(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((Math.floor(row / 2) + Math.floor(col / 3) ) % 2 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask5(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if (((row * col) % 2) + ((row * col) % 3) == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask6(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((((row * col) % 2) + ((row * col) % 3)) % 2 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask7(size){
    for (let row=0; row <= size-1; row++){
        for (let col=0; col <= size-1; col++){
            if ((((row + col) % 2) + ((row * col) % 3)) % 2 == 0 && !importantBit(row, col)){
                code_grid[row][col] = (code_grid[row][col]-(Math.floor(code_grid[row][col]/2)*2) + 1)%2 + (Math.floor(code_grid[row][col]/2)*2);
            }
        }
    }
}

function mask(maskingMethod, size){
    switch (maskingMethod){
        case 0:
            mask0(size);
            break;
        case 1:
            mask1(size);
            break;
        case 2:
            mask2(size);
            break;
        case 3:
            mask3(size);
            break;
        case 4:
            mask4(size);
            break;
        case 5:
            mask5(size);
            break;
        case 6:
            mask6(size);
            break;
        case 7:
            mask7(size);
            break;
    }
}
//#endregion


function format(maskingMethod, errorLevel, size){
    let format_main = errorLevelMap.get(errorLevel).get('formatBits')+padLeft(maskingMethod.toString(2), 3);

    let format_error = padRight(format_main, 15);
    format_error = errorString(format_error, "10100110111", 10);
    let format_combined = format_main+format_error;

    let format_final = stringXOR(format_combined, "101010000010010");
    format_final = offsetString(format_final, formatOffset)

    for (let i=0; i<6; i++){//top left
        code_grid[8][i] =  parseInt(format_final[i]);
    }
    code_grid[8][7] =  parseInt(format_final[6]);
    code_grid[8][8] =  parseInt(format_final[7]);
    code_grid[7][8] =  parseInt(format_final[8]);
    for (let i=0; i<6; i++){
        code_grid[5-i][8] =  parseInt(format_final[i+9]);
    }

    for (let i=0; i<7; i++){//botom left
        code_grid[size-1-i][8] = parseInt(format_final[i]);
    }
    for (let i=0; i<8; i++){//top right
        code_grid[8][size-1-7+i] = parseInt(format_final[7+i]);
    }
}

function versionInfo(version, size){
    let version_main = padLeft(version.toString(2), 6);
    let version_error = removeLeadingZeros(padRight(version_main, 18));
    let generator = "1111100100101";

    version_error = errorString(version_error, generator, 12);

    let version_combined = version_main+version_error;
    version_combined = version_combined.split('').reverse().join('');
    console.log(version, version_combined);

    writeVersionBits(version_combined, size, versionOffset); 
}

function writeVersionBits(versionBits, size, offset){
    versionBits = offsetString(versionBits, offset);
    
    for(let i=0; i<6; i++){
        for(let j=0; j<3; j++){
            available_bits -= (code_grid[i][size-11+j] == -1);
            available_bits -= (code_grid[size-11+j][i] == -1);
            code_grid[i][size-11+j] = parseInt(versionBits[i*3+j]);//think of like a base 6 number sys, j is units place and i is unit^2
            code_grid[size-11+j][i] = parseInt(versionBits[i*3+j]);
        }
    }
}
//#endregion


//main func
function generateCode(){
    let url = url_input.value;
    
    let version = parseInt(version_input.value);
    let size = getSize(version);
    let [errorLevel, errorBits] = getErrorLevel(version);

    basePatterns(version, size);
    console.clear();
    

    if (available_bits-errorBits < url.length*8+8){
        alert("Too much text. Use lower ERROR CORRECTION LEVEL or higher VERSION");
        return;
    }

    let terminators = (8-((available_bits-4-errorBits)%8))%8;//4 mode bits, url data is a multiple of 8
    let dataBitsLeft = (available_bits-4-8-8*(version >= 10)-(8*url.length)-terminators)-errorBits;//in order: available_bits-mode-minimumLengthByte-extraLengthByte-dataBytes-terminators-errorBits
    let paddingBytes = dataBitsLeft/8;//bits to bytes

    let coefficients = messageCoefficients(url, terminators, paddingBytes, errorLevel, version);

    writeData(coefficients, size);

    ErrorCorrection(coefficients, errorLevel, version, size);

    let maskingMethod = parseInt(mask_input.value)
    mask(maskingMethod, size);

    format(maskingMethod, errorLevel, size);

    if (version >= 7){
        versionInfo(version, size);
    }

    displayCode(size, debug_input.checked);
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

function getSize(version){
    return 4*version+17
}

function validAlignmentPattern(center){
    for (let i=center[0]-2; i<=center[0]+2; i++){
        for (let j=center[1]-2; j<=center[1]+2; j++){
            if (code_grid[i][j] != -1){
                return false;
            }
        }
    }
    
    return true;
}

function setAlignmentPattern(center){
    outline(center[0]-1, center[1]-1, 3, 0+baseOffset*2);//white
    outline(center[0]-2, center[1]-2, 5, 1+baseOffset*2);

    code_grid[center[0]][center[1]] = 1+baseOffset*2;//center
    available_bits -= 1;
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

function offsetString(binaryString, offset){
    let offsetedArray = [];
    for (let i=0; i<binaryString.length; i++){
        offsetedArray.push((parseInt(binaryString[i])%2)+offset*2);
    }

    return offsetedArray;
}

function unoffsetString(binaryString){
    let unoffsetedArray = [];
    for (let i=0; i<binaryString.length; i++){
        unoffsetedArray.push((parseInt(binaryString[i])%2));
    }

    return unoffsetedArray;
}

//#endregion


//#region writing info
function nextPos(size){
    while (position[0] >=0 && position[1] >= 0){
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

        if (position[0] < 0 || size-1 < position[0]){
            direction = -direction;
            position[0] += direction;
            position[1] -= 2;
            col_offset = 0;
        }
    }
    if (position[0] < 0 || position[1] < 0){
        console.log("OUT OF SPACE");
    }
}

function writeByte(byte, size, offset=0){
    byte = offsetString(byte, offset);
    let bit;
    for (let idx=0; idx<8; idx++){
        bit = parseInt(byte[idx]);

        nextPos(size);
        code_grid[position[0]][position[1]-col_offset] = bit;
        available_bits -= 1;
    }
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
    let quotient = []

    for (calcIdx = 0; calcIdx <= (dividend.length - divisor.length); calcIdx++){
        var multiplier = Math.floor(gf_div(dividend[calcIdx], divisor[0]));
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
    let product = new Array(multiplicand.length+multiplier.length-1).fill(0);

    for (let i=0; i < multiplicand.length; i++){
        for (let j=0; j < multiplier.length; j++){
            var multiplicand_degree = (multiplicand.length-i) -1;
            multiplier_degree = (multiplier.length-j) -1;
            var product_degree = multiplicand_degree + multiplier_degree;

            var product_idx = (product.length-product_degree) -1;

            product[product_idx] = gf_add(product[product_idx], gf_mul(multiplicand[i], multiplier[j]));
        }
    }

    return product;
}

function generatorPolynomial(errorLevel, version){
    let curr = [1];
    for (let i=0; i<errorLevelMap.get(errorLevel).get('n_per_block')[version]; i++){
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
    let result = "";
    for (let i=0; i < a.length; i++){//b.len = a.len
            var bit = (parseInt(a[i]) + parseInt(b[i]))%2;
            result += bit.toString();
    }
    return result;
}

function errorString(mainString, generatorString, targLen){
    mainString = removeLeadingZeros(mainString);

    let generator = padRight(generatorString, mainString.length);
    
    mainString = stringXOR(mainString, generator);
    mainString = removeLeadingZeros(mainString);

    if (mainString.length > targLen){
        return errorString(mainString, generatorString, targLen);
    }
    return padLeft(mainString, targLen);
}

//#endregion


//#region draw
function displayCode(size, debug){
    canvas.width = (size+2)*cell_size;
    canvas.height = canvas.width;
    drawable_canvas.fillStyle = "white";
    drawable_canvas.fillRect(0, 0, (size+2)*cell_size, (size+2)*cell_size);
    drawable_canvas.fillStyle = "black";

    for (let i=0; i<size; i++){
        for (let j=0; j<size; j++){
            if (debug){
                if (code_grid[i][j] == -1){
                    drawable_canvas.fillStyle = "red";
                } else {
                    drawable_canvas.fillStyle = debugColors[code_grid[i][j]];
                }
            } else {
                if (code_grid[i][j]%2 == 1){
                    drawable_canvas.fillStyle = "black";
                } else {
                    drawable_canvas.fillStyle = "white";
                }
            }
            drawable_canvas.fillRect((j+1)*cell_size, (i+1)*cell_size, cell_size, cell_size);
        }
    }
    drawGrid(size);
}

function drawGrid(size){
    for (let i=0; i<size+2; i++){
        draw_line(0, i*cell_size, (size+2)*cell_size, i*cell_size);
        draw_line(i*cell_size, 0, i*cell_size, (size+2)*cell_size,);
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

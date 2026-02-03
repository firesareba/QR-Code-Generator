//#region access html
const url = document.getElementById("url");

const canvas = document.getElementById("code-canvas")
const drawable_canvas = canvas.getContext("2d");
canvas.width = 2000;
canvas.height = canvas.width;
//#endregion

//#region globals
code_grid = []
//#endregion

//#region listeners
url.addEventListener(
    "change", function(event) {
        console.log('new url')
    }
);
//#endregion
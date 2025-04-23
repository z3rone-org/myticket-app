const canvas = document.getElementById('canvas');
const textElement = document.getElementById('text');
const personNameElement = document.getElementById('personName');  // Added reference to person name element
const validFromElement = document.getElementById('firstDay');
const validToElement = document.getElementById('lastDay');
const ctx = canvas.getContext('2d');
let longPressTimer = null;

// Get the first day of the current year
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const firstDay = new Date(currentYear, currentMonth, 1); // 1st day of current month
const lastDay = new Date(currentYear, currentMonth+1, 1); // 1st day of next month

if (hasLocalStorage('validFrom')) {
    validFromElement.textContent = getLocalStorage('validFrom');
} else {
    validFromElement.textContent = `${firstDay.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}
if (hasLocalStorage('validTo')) {
    validToElement.textContent = getLocalStorage('validTo');
} else {
    validToElement.textContent = `${lastDay.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

if (hasLocalStorage('textValue')) {
    textElement.textContent = getLocalStorage('textValue');
}

if (hasLocalStorage('personName')) {
    personNameElement.textContent = getLocalStorage('personName'); // Set person name from local storage if available
}

// Default size for the grid
GRID_SIZE = 71;
if (hasLocalStorage('size')) {
    GRID_SIZE = getLocalStorage('size');
}

if (hasLocalStorage('qrArray')) {
    const qrArray = base64ToGrid(getLocalStorage('qrArray'));
    renderBinaryGrid(qrArray);
} else {
    const alternatingGrid = createAlternatingPattern(GRID_SIZE);
    renderBinaryGrid(alternatingGrid);
}

// Add long press and double-click listeners to the canvas
canvas.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(triggerUpload, 500); // Long press: 500ms
});
canvas.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
});
canvas.addEventListener('dblclick', triggerUpload);

// Add double-click and long-press listeners to the text
textElement.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(editText, 500);
});
textElement.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
});
textElement.addEventListener('dblclick', editText);

// Add double-click and long-press listeners to the person name
personNameElement.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(editPersonName, 500);
});
personNameElement.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
});
personNameElement.addEventListener('dblclick', editPersonName);
// Add double-click and long-press listeners to valid dates
validFromElement.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(editValidFrom, 500);
})
validFromElement.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
})
validFromElement.addEventListener('dblclick', editValidFrom);
validToElement.addEventListener('dblclick', editValidTo);

function getLocalStorage(key) {
    let local_data = {}
    try {
        const item = localStorage.getItem('data');
        local_data = item ? JSON.parse(item) : {};
    } catch (error) { }
    return local_data[key]
}

function hasLocalStorage(key) {
    let local_data = {}
    try {
        const item = localStorage.getItem('data');
        local_data = item ? JSON.parse(item) : {};
    } catch (error) { }
    return Object.keys(local_data).includes(key)
}

function setLocalStorage(key, value) {
    let local_data = {}
    try {
        const item = localStorage.getItem('data');
        local_data = item ? JSON.parse(item) : {};
    } catch (error) { }
    local_data[key] = value
    localStorage.setItem('data', JSON.stringify(local_data))
}

function editText() {
    const newText = prompt("Enter new text:", textElement.textContent);
    if (newText !== null) {
        textElement.textContent = newText;

        // Update the new text value
        setLocalStorage('textValue', newText);
    }
}

function editPersonName() {
    const newName = prompt("Enter new name:", personNameElement.textContent);
    if (newName !== null) {
        personNameElement.textContent = newName;

        // Update the new name value
        setLocalStorage('personName', newName);
    }
}

function editValidFrom() {
    const newFrom = prompt("Enter date:", validFromElement.textContent);
    if (newFrom !== null) {
        validFromElement.textContent = newFrom;

        // Update the new name value
        setLocalStorage('validFrom', newFrom);
    }
}

function editValidTo() {
    const newTo = prompt("Enter date:", validToElement.textContent);
    if (newTo !== null) {
        validToElement.textContent = newTo;

        // Update the new name value
        setLocalStorage('validTo', newTo);
    }
}

function triggerUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            // Draw the image onto the canvas
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const trimmedCanvas = trimWhiteBorder(canvas);
            if (!trimmedCanvas) return;
            canvas.width = trimmedCanvas.width;
            canvas.height = trimmedCanvas.height;
            ctx.putImageData(trimmedCanvas.imageData, 0, 0);

            const qrArray = convertToBinaryArray(canvas, GRID_SIZE);
            const qrArrayString = gridToBase64(qrArray);

            setLocalStorage('qrArray', qrArrayString);

            renderBinaryGrid(qrArray);
        };
    };
    input.click();
}

function detectSize(canvas) {
    const ctx = canvas.getContext('2d'); // Get the canvas context
    const width = canvas.width;         // Canvas width
    const height = canvas.height;       // Canvas height
    const y = Math.floor(height / 2);   // Middle horizontal line (y-coordinate)

    let count = 1;                      // Start counting squares, assuming there's at least one
    let lastColor = null;               // To store the last pixel's color
    const tolerance = 200;               // Fuzziness tolerance (0-255 scale for RGB)

    function colorsAreSimilar(color1, color2) {
        // Compare two RGB colors with tolerance
        return Math.abs(color1[0] - color2[0]) <= tolerance &&
            Math.abs(color1[1] - color2[1]) <= tolerance &&
            Math.abs(color1[2] - color2[2]) <= tolerance;
    }

    // Loop through the middle horizontal line pixel by pixel
    for (let x = 0; x < width; x++) {
        // Get the color of the current pixel
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const currentColor = [pixelData[0], pixelData[1], pixelData[2]]; // Extract RGB array

        // If this is the first pixel, initialize the lastColor
        if (lastColor === null) {
            lastColor = currentColor;
            continue;
        }

        // If the color changes significantly, it's a new square
        if (!colorsAreSimilar(currentColor, lastColor)) {
            count++;
            lastColor = currentColor; // Update the lastColor
        }
    }

    return count; // Return the total number of squares
}

function trimWhiteBorder(canvas) {
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let top = canvas.height, bottom = 0, left = canvas.width, right = 0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index], g = data[index + 1], b = data[index + 2];
            if (r < 100 || g < 100 || b < 100) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }

    if (top > bottom || left > right) return null;

    const trimmedWidth = right - left + 1;
    const trimmedHeight = bottom - top + 1;
    const trimmedImageData = ctx.getImageData(left, top, trimmedWidth, trimmedHeight);

    return { imageData: trimmedImageData, width: trimmedWidth, height: trimmedHeight };
}

function convertToBinaryArray(canvas) {
    GRID_SIZE = detectSize(canvas)
    setLocalStorage('size', GRID_SIZE)
    const ctx = canvas.getContext('2d');
    const cellWidth = canvas.width / GRID_SIZE;
    const cellHeight = canvas.height / GRID_SIZE;
    const qrArray = [];

    for (let row = 0; row < GRID_SIZE; row++) {
        const rowArray = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            const x = Math.floor(col * cellWidth);
            const y = Math.floor(row * cellHeight);
            const cellData = ctx.getImageData(x, y, Math.ceil(cellWidth), Math.ceil(cellHeight));

            const meanBrightness = calculateMeanBrightness(cellData.data);
            rowArray.push(meanBrightness < 128 ? 1 : 0);
        }
        qrArray.push(rowArray);
    }

    return qrArray;
}

function calculateMeanBrightness(data) {
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        totalBrightness += (r + g + b) / 3;
    }
    return totalBrightness / (data.length / 4);
}

function renderBinaryGrid(qrArray) {
    const gridSize = qrArray.length;
    const gridWidth = 500;
    const cellSize = gridWidth / gridSize;

    canvas.width = gridWidth;
    canvas.height = gridWidth;
    ctx.clearRect(0, 0, gridWidth, gridWidth);

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const value = qrArray[row][col];
            ctx.fillStyle = value === 1 ? 'black' : 'white';
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}

function createAlternatingPattern(size) {
    const pattern = [];
    for (let row = 0; row < size; row++) {
        const rowArray = [];
        for (let col = 0; col < size; col++) {
            rowArray.push((row + col) % 2);
        }
        pattern.push(rowArray);
    }
    return pattern;
}

function gridToBase64(grid) {
    if (grid.length !== GRID_SIZE || grid.some(row => row.length !== GRID_SIZE)) {
        throw new Error("Grid must be 71x71.");
    }
    const binaryString = grid.flat().join('');
    const bigIntValue = BigInt('0b' + binaryString);
    const bytes = bigIntToBytes(bigIntValue);
    return btoa(String.fromCharCode(...bytes));
}

function base64ToGrid(base64) {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const bigIntValue = bytesToBigInt(bytes);
    const binaryString = bigIntValue.toString(2).padStart(GRID_SIZE * GRID_SIZE, '0');
    const grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        grid.push(binaryString.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE).split('').map(Number));
    }
    return grid;
}

function bigIntToBytes(bigInt) {
    const bytes = [];
    while (bigInt > 0) {
        bytes.unshift(Number(bigInt % 256n));
        bigInt /= 256n;
    }
    return new Uint8Array(bytes);
}

function bytesToBigInt(bytes) {
    return bytes.reduce((acc, byte) => (acc << 8n) | BigInt(byte), 0n);
}
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const field = document.getElementById('field')
const purpleBtn = document.getElementById('purple')
const greenBtn = document.getElementById('green')
const orangeBtn = document.getElementById('orange')
const disconnectBtn = document.getElementById('disconnect')

canvas.width = 800
canvas.height = 800
ctx.lineWidth = 1

let currentElement
let offsetX, offsetY, globalOffsetX, globalOffsetY
let newX, newY
let dx, dy
let isConnecting = false
let isDragging = false
let fieldCords = getCoords(field)
let isDisconnect = false
let targetCoords



let elements = [
    createElement(200, 200, 50, 'rgb(120,24,196)', 'rgba(120,24,196,0.3)'),
    createElement(400, 200, 70, 'rgb(42,176,163)', 'rgba(42,176,163,0.3)'),
    createElement(200, 500, 60, 'rgb(231,142,76)', 'rgba(231,142,76,0.3)')
]

let getOffset = function() {
    let canvasOffset = canvas.getBoundingClientRect()
    globalOffsetX = canvasOffset.left
    globalOffsetY = canvasOffset.top
}

getOffset()
window.onscroll = function() {
    getOffset()
}
window.onresize = function() {
    getOffset()
}
canvas.onresize = function() {
    getOffset()
}

function createElement(x, y, size, borderColor, color) {
    return {
        x: x,
        y: y,
        size: size,
        borderColor: borderColor,
        color: color,
        connectedElements: []
    }
}

canvas.addEventListener('mousedown', (event) => {
    // let startX = event.clientX - fieldCords.x
    // let startY = event.clientY - fieldCords.y
    let startX = event.clientX - globalOffsetX
    let startY = event.clientY - globalOffsetY
    currentElement = elements.find(element => isMouseOnElement(startX, startY, element))
    if (currentElement) {
        isDragging = true
        offsetX = startX - currentElement.x
        offsetY = startY - currentElement.y
        newX = startX - offsetX
        newY = startY - offsetY
    } else {
        isDragging = false
    }
})

document.addEventListener('mousemove', (event) => {
    if (isConnecting) {
        return
    }
    if (!isDragging) {
        return 
    }
    let mouseX = event.clientX - globalOffsetX
    let mouseY = event.clientY - globalOffsetY
    newX = mouseX - offsetX
    newY = mouseY - offsetY
})

document.addEventListener('mouseup', (event) => {
    if (!isDragging) {
        return
    }
    isDragging = false
})

drawAll()

function drawAll() {
    clear()
    if (isDragging) {
        updateElementsPosition()
    }
    if (currentElement) {
        connectElements()
    }
    if (isDisconnect) {
        disconnect()
    } 
    drawElements()
    window.requestAnimationFrame(drawAll)
}

function updateElementsPosition() {
    if (!currentElement) {
        return
    }
    newX = Math.max(currentElement.size / 2, Math.min(newX, canvas.width - currentElement.size / 2))
    newY = Math.max(currentElement.size / 2, Math.min(newY, canvas.height - currentElement.size / 2))
    let dx = newX - currentElement.x
    let dy = newY - currentElement.y
    if (currentElement.connectedElements.length > 0) {
        
        currentElement.connectedElements.forEach(element => {
            const minX = element.size / 2
            const maxX = canvas.width - element.size / 2
            const minY = element.size / 2
            const maxY = canvas.height - element.size / 2
            const maxNewX = Math.max(minX, Math.min(element.x + dx, maxX))
            const maxNewY = Math.max(minY, Math.min(element.y + dy, maxY))
            dx = Math.min(dx, maxNewX - element.x)
            dx = Math.max(dx, minX - element.x)
            dy = Math.min(dy, maxNewY - element.y)
            dy = Math.max(dy, minY - element.y)
        })
        currentElement.x += dx
        currentElement.y += dy
        currentElement.connectedElements.forEach(element => {
            element.x += dx
            element.y += dy
        })
    } else {
        currentElement.x = newX
        currentElement.y = newY
    }
}

function connectElements() {
    if (!currentElement) {
        return
    }
    elements.forEach(element => {
        if (currentElement == element) {
            return
        }
        if (currentElement.connectedElements.find(elem => elem == element)) {
            return
        }
        let distance = getDistanceBetween(currentElement, element)
        let connectionDistance = currentElement.size * 2 + ctx.lineWidth
        let speed = Math.pow(connectionDistance / distance, 2)
        if (distance <= connectionDistance && !isIntersecting(currentElement, element)) {
            isDragging = false
            isConnecting = true
            let dx = currentElement.x - element.x
            let dy = currentElement.y - element.y
            if (Math.abs(dx) > Math.abs(dy)) {
                element.x += dx / distance * speed * 2
            } else if ((Math.abs(dy) > Math.abs(dx))) {
                element.y += dy / distance * speed * 2
            }
        }
        if (isIntersecting(currentElement, element)) {
            currentElement.connectedElements.push(element)
            element.connectedElements.push(currentElement)
            disconnectBtn.style.visibility = `visible`
            isConnecting = false
            return
        }
    })
}

function disconnect() {
    currentElement = null
    const allElementsAtTarget = elements.every((element, index) => {
        if (element.connectedElements.length === 0) return true

        const target = targetCoords[index]
        element.x = lerp(element.x, target.x, 0.05)
        element.y = lerp(element.y, target.y, 0.05)
        return Math.abs(element.x - target.x) < 1 && Math.abs(element.y - target.y) < 1
    })
    if (allElementsAtTarget) {
        isDisconnect = false
        disconnectBtn.style.visibility = 'hidden'
        elements.forEach(element => element.connectedElements = [])
    } else {
        window.requestAnimationFrame(disconnect)
    }
}

disconnectBtn.onclick = function () {
    isDisconnect = true
    targetCoords = randomCoords(elements, canvas.width, canvas.height)
}

function drawElements() {
    elements.forEach(element => {
        ctx.beginPath()
        ctx.strokeStyle = element.borderColor
        ctx.fillStyle = element.color
        
        if (currentElement && currentElement.connectedElements.find(elem => elem == element)) {
            ctx.setLineDash([15, 5])
        } else if (element == currentElement) {
            ctx.setLineDash([15, 5])
        } else {
            ctx.setLineDash([])
        }
        ctx.rect(element.x - element.size / 2, element.y - element.size / 2, element.size, element.size)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = null
        ctx.fillStyle = null
    })
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function getRandomCoord(min, max) {
    return Math.random() * (max - min) + min
}

function isIntersecting(element1, element2) {
    return !(element1.x + ctx.lineWidth + element1.size / 2 < element2.x - ctx.lineWidth - element2.size / 2 || 
             element1.x - ctx.lineWidth - element1.size / 2 > element2.x + ctx.lineWidth + element2.size / 2 || 
             element1.y + ctx.lineWidth + element1.size / 2 < element2.y - ctx.lineWidth - element2.size / 2 || 
             element1.y - ctx.lineWidth - element1.size / 2 > element2.y + ctx.lineWidth + element2.size / 2 )
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t
}

function isMouseOnElement(x, y, element) {
    if (x > element.x - element.size / 2 && x < element.x + element.size / 2 && y > element.y - element.size / 2 && y < element.y + element.size / 2) {
        return true
    } else {
        return false
    }
}

function randomCoords() {
    const newCoords = []
    elements.forEach(element => {
        if (element.connectedElements.length > 0) {
            let randX, randY, isTooClose
            do {
                randX = getRandomCoord(element.size, canvas.width - element.size)
                randY = getRandomCoord(element.size, canvas.height - element.size)
                isTooClose = newCoords.some(coord => getDistanceBetweenCoords(coord.x, coord.y, randX, randY) < element.size * 2 + 20)
            } while (isTooClose)
            newCoords.push({x: randX, y: randY})
        } else {
            newCoords.push({x: element.x, y: element.y})
        }
    })
    return newCoords
}

function getCoords(element) {
    var coords = element.getBoundingClientRect()
    return {
        x: coords.left,
        y: coords.top,
        r: coords.right,
        b: coords.bottom
    }
}

function getDistanceBetweenCoords(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1)
}

function getDistanceBetween(element1, element2) {
    return Math.hypot(element1.x - element2.x, element1.y - element2.y)
}

function changeColor(borderColor, color) {
    if (currentElement == null) {
        alert('Элемент не выбран!')
        return
    }
    elements.forEach(element => {
        if (element.connectedElements.length > 0) {
            element.connectedElements.forEach(elem => {
                element.borderColor = borderColor
                element.color = color
                elem.borderColor = borderColor
                elem.color = color
            })
        } else {
            if (element !== currentElement) {
                return
            }
            element.borderColor = borderColor
            element.color = color
        }
    })
}

purpleBtn.onclick = function () {
    changeColor(`rgb(120,24,196)`, 'rgba(120,24,196,0.3)')
}

greenBtn.onclick = function () {
    changeColor(`rgb(42,176,163)`, 'rgba(42,176,163,0.3)')
}

orangeBtn.onclick = function () {
    changeColor(`rgb(231,142,76)`, 'rgba(231,142,76,0.3)')
}
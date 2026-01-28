/**
 *  @author Cody
 *  @date 2025.01.06
 *  earliest mechanic: Utopian Sky from FRU P1
 *  latest mechanic: Diamond Dust from FRU P2 (in-progress)
 *  Some encapsulations might not be included in certain places, making the code
 *   messier than it can be.
 */

/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.visible = true
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 7*scalingFactor*fontScalingFactor)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 7*scalingFactor*fontScalingFactor)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}

/* arriving 2D variable. Caution: modes may be difficult to use. Different
modes:
  Faster at Intercards (default): Moves in cardinal directions
   independently, resulting in possibly curved lines.
  Straight Line: Moves directly in a straight line.
  Ice: Basically the same as Straight Line, except you move slightly more randomly.
  Radial: Moves in radius and angle independently, resulting in possibly curved lines.
    Designed for no radius changes.
    Significantly faster when further away from center.
*/
class ArrivingVector {
    constructor(x, y, targetX, targetY, speed, slowdown) {
        this.x = x
        this.y = y
        this.targetX = targetX
        this.targetY = targetY
        this.speed = speed
        this.slowdown = slowdown
        this.mode = defaultMovementMode
    }

    // update x and y.
    update() {
        let angleBetween
        let distanceBetween
        switch (this.mode) {
            case "Faster at Intercards":
                if (this.x > this.targetX) {
                    let diffX = this.x - this.targetX
                    this.x -= map(diffX, 0, this.slowdown, 0, this.speed, true)
                } if (this.x < this.targetX) { // simply reverse the code earlier
                let diffX = this.targetX - this.x
                this.x += map(diffX, 0, this.slowdown, 0, this.speed, true)
            }
                if (this.y > this.targetY) {
                    let diffY = this.y - this.targetY
                    this.y -= map(diffY, 0, this.slowdown, 0, this.speed, true)
                } if (this.y < this.targetY) { // simply reverse the code earlier
                let diffY = this.targetY - this.y
                this.y += map(diffY, 0, this.slowdown, 0, this.speed, true)
            }
                break
            case "Straight Line":
                // figure out the angle and distance, and move that direction
                angleBetween = atan2(this.targetY - this.y, this.targetX - this.x)
                distanceBetween = sqrt((this.targetY - this.y)**2 + (this.targetX - this.x)**2)
                this.x += cos(angleBetween)*map(distanceBetween, 0, this.slowdown, 0, this.speed, true)
                this.y += sin(angleBetween)*map(distanceBetween, 0, this.slowdown, 0, this.speed, true)
                break
            case "Ice":
                // figure out the angle and distance, and move that direction
                angleBetween = atan2(this.targetY - this.y, this.targetX - this.x)
                distanceBetween = sqrt((this.targetY - this.y)**2 + (this.targetX - this.x)**2)
                this.x += cos(angleBetween)*map(distanceBetween, 0, this.slowdown, 0, (this.speed + sin(frameCount/10)*this.speed/4)*2, true)
                this.y += sin(angleBetween)*map(distanceBetween, 0, this.slowdown, 0, (this.speed + sin(frameCount/10)*this.speed/4)*2, true)
                break
            case "Radial":
                let currentAngle = atan2(this.y, this.x)
                let currentDistance = sqrt(this.y**2 + this.x**2)
                let targetAngle = atan2(this.targetY, this.targetX)
                let targetDistance = sqrt(this.targetY**2 + this.targetX**2)
                let angleDiff = (targetAngle - currentAngle + PI*3) % TWO_PI - PI
                let distanceDiff = targetDistance - currentDistance
                let nextAngle = currentAngle + map(angleDiff, -radians(this.slowdown/scalingFactor), radians(this.slowdown/scalingFactor), -radians(this.speed/scalingFactor)/2, radians(this.speed/scalingFactor)/2, true)
                let nextDistance = currentDistance + map(distanceDiff, -this.slowdown, this.slowdown, -this.speed, this.speed, true)
                // console.log("Current xy:", this.y, this.x)
                // console.log("Target xy:", this.targetY, this.targetX)
                // console.log("Current ad:", currentAngle, currentDistance)
                // console.log("Target ad:", targetAngle, targetDistance)
                // console.log("Diff ad:", angleDiff, distanceDiff)
                // console.log("Diff from next ad:", map(angleDiff, -radians(this.slowdown), radians(this.slowdown), -radians(this.speed), radians(this.speed), true), map(distanceDiff, -this.slowdown, this.slowdown, -this.speed, this.speed, true))
                // console.log("Next ad:", nextAngle, nextDistance)
                // console.log("———————————————")
                this.x = cos(nextAngle)*nextDistance
                this.y = sin(nextAngle)*nextDistance
                break
        }
    }
}

//————————————————————————————initialize variables————————————————————————————\\
let cnv // in case we want to update more later
let defaultMovementMode = "Straight Line"

// initial variables from template
let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

// displaying the windows
let baseScalingFactor = 1.5
let fontScalingFactor = 1
let scalingFactor = 1
let scalingFactorFetch = localStorage.getItem("scalingFactor")
if (!scalingFactorFetch) {
    localStorage.setItem("scalingFactor", "1")
    scalingFactorFetch = "1"
}
scalingFactor = baseScalingFactor*parseFloat(scalingFactorFetch)
scalingFactorFetch = parseFloat(scalingFactorFetch)

let textPadding = 3.5*scalingFactor
let topSquareSize = 40*scalingFactor // the size of the top corner squares
let topWidth = 270*scalingFactor  // the width of the window at the top, not
// including the top corner squares
let mechanicSelectionRows = 1 // the number of rows in "mechanic selection"
let mechanicSelectionHeight = mechanicSelectionRows*20*scalingFactor + textPadding*2
let middleTopHeight = 60*scalingFactor // the height of the window just above the main body
let bottomHeight = 50*scalingFactor // the height of the window at the bottom
let holeSize = 3*scalingFactor
let cornerRounding = 5*scalingFactor
let mainBodyHeight = topSquareSize*2 + 40*scalingFactor + topWidth // the height of the main window. since the main window has to be square, a different calculation is used.
let scalingAdjustHeight = 55*scalingFactor
let windowWidth = topSquareSize*2 + holeSize*2 + topWidth
let mainBodyWidth = mainBodyHeight
let middleTopWidth = windowWidth
let bottomWidth = windowWidth
let selectionWidth = windowWidth
let scalingAdjustWidth = windowWidth
let mousePressedLastFrame = false // used sometimes

// used in initialization of mechanics. also a great thing for me to refer
// back to for version changes
let updates = `<strong>Updates</strong>:
+
+Add version updates—crucial if changes are made to local storage processes, I don't want to erase all your streaks, wins, and losses
+Add Silence/Stillness
+Add puddle-dropping phase (no puddles included)
+Add time tracker
+Add win/loss, streak, purge data, & coin tracking
+Make character paths straight lines
+<strong>First half of Diamond Dust</strong>
+Scaling factor adjust window
+Smoother character position changes
+<strong>FRU P2 background & Diamond Dust setup</strong>
+Background image through CSS
+Customization through code
+Resizing through code
+<strong>Utopian Sky</strong>
<strong>Initialization</strong>
    
<strong>Future updates</strong>:
KUDOS 🎉 (for a certain number streak, a certain number of total wins, a certain amount of time, or a high score on time)
Mobile-compatible version? Not sure
Make default text bigger
Customization of window positions from the user. +local storage
More currencies! But you've got to spend them somehow...although the dopamine hit is nice. 😉
`

// your role
let role = "MT"

// positions: used for displaying (relative to center of arena)
let MT = [0, 0]
let OT = [0, 0]
let H1 = [0, 0]
let H2 = [0, 0]
let M1 = [0, 0]
let M2 = [0, 0]
let R1 = [0, 0]
let R2 = [0, 0]
let realMT = new ArrivingVector(MT[0], MT[1], MT[0], MT[1], scalingFactor, 20*scalingFactor)
let realOT = new ArrivingVector(OT[0], OT[1], OT[0], OT[1], scalingFactor, 20*scalingFactor)
let realH1 = new ArrivingVector(H1[0], H1[1], H1[0], H1[1], scalingFactor, 20*scalingFactor)
let realH2 = new ArrivingVector(H2[0], H2[1], H2[0], H2[1], scalingFactor, 20*scalingFactor)
let realM1 = new ArrivingVector(M1[0], M1[1], M1[0], M1[1], scalingFactor, 20*scalingFactor)
let realM2 = new ArrivingVector(M2[0], M2[1], M2[0], M2[1], scalingFactor, 20*scalingFactor)
let realR1 = new ArrivingVector(R1[0], R1[1], R1[0], R1[1], scalingFactor, 20*scalingFactor)
let realR2 = new ArrivingVector(R2[0], R2[1], R2[0], R2[1], scalingFactor, 20*scalingFactor)

let speedrun = false
if (speedrun) {
    realMT.slowdown = 100000*scalingFactor
    realOT.slowdown = 100000*scalingFactor
    realH1.slowdown = 100000*scalingFactor
    realH2.slowdown = 100000*scalingFactor
    realM1.slowdown = 100000*scalingFactor
    realM2.slowdown = 100000*scalingFactor
    realR1.slowdown = 100000*scalingFactor
    realR2.slowdown = 100000*scalingFactor
    realMT.speed = 100000*scalingFactor
    realOT.speed = 100000*scalingFactor
    realH1.speed = 100000*scalingFactor
    realH2.speed = 100000*scalingFactor
    realM1.speed = 100000*scalingFactor
    realM2.speed = 100000*scalingFactor
    realR1.speed = 100000*scalingFactor
    realR2.speed = 100000*scalingFactor
}

// window positions
let greenSquareX = 0
let greenSquareY = 0
let redSquareX = 0
let redSquareY = 0
let topWindowX = 0
let topWindowY = 0
let selectionX = 0
let selectionY = 0
let middleTopX = 0
let middleTopY = 0
let mainBodyX = 0
let mainBodyY = 0
let bottomWindowX = 0
let bottomWindowY = 0
let scalingAdjustX = 0
let scalingAdjustY = 0

// other variables
let currentlySelectedMechanic = "Idyllic Dream"
let currentlySelectedBackground = "M12S P2"
let stage = 0 // the current step you're on. always defaults to 0
let mechanicStarted = 0
let stageStarted = 0
let textAtTop = ""
let textAtBottom = ""
let centerOfBoard
let script = [] // the timeline for the current mechanic
let numWinsPerCoinIncrease = 1 // num streak required per each accelerated earnings

// sometimes the code will change and require a system update like a local storage rename.
let version = "0.000"
// Version 0.00
//  - Initial release
//  - FRU support for Utopian Sky (do not use), Diamond Dust, Mirror Mirror
//    - nothing changed to support these
//  - Currency coin tracking via local storage
//  - Time tracking without local storage

// Version 0.10
//  - Updates implemented
//  - M8S support for Millennial Decay
//    - nothing changed to support these
//  - Huge hotbar revamp!
//  - FRU support for Light Rampant
//    - nothing changed to support these

// version format:
//  first number: expansion number
//  first number after decimal: tier implementation number, starts at 0
//  second number after decimal: 0 = main, 1-9 = more fights
//  third number after decimal: 0 = main, 1-9 = mechanic


//——————————————————————————your everyday functions——————————————————————————\\

function preload() {
    font = loadFont('data/meiryo.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
}


function setup() {
    let bonusWidth = 400*scalingFactor
    cnv = createCanvas(topSquareSize*2 + holeSize*4 + topWidth + bonusWidth,
        topSquareSize + mechanicSelectionHeight + middleTopHeight + mainBodyHeight + bottomHeight + scalingAdjustHeight + holeSize*7)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 7*scalingFactor*fontScalingFactor)

    // by the time I realized I was using "rectMode(CORNERS)" I was too lazy
    // to change everything back
    rectMode(CORNERS)

    // I prefer this mode, although I almost never input something into the
    // fourth or fifth parameters anyway
    imageMode(CORNER)

    // just making sure nothing goes wrong
    angleMode(RADIANS)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)
    debugCorner.visible = false

    reset()

    // there is a padding of holeSize on the sides. To remove this padding,
    // subtract holeSize from greenSquareX, greenSquareY, redSquareY, topWindowX,
    // topWindowY, middleTopX, mainBodyX, bottomWindowX, and selectionX; add holeSize
    // to redSquareX; and remove holeSize*2 from the width and height.

    // there is a padding of bonusWidth/2 on the left and right. To remove
    // this padding, remove all instances of bonusWidth and bonusWidth/2.
    // to add back the padding, add bonusWidth to the width, initialize
    // bonusWidth as 200*scalingFactor, and add bonusWidth/2 to
    // greenSquareX, topWindowX, middleTopX, mainBodyX, bottomWindowX,
    // selectionX, and scalingAdjustX. Also subtract bonusWidth/2 from
    // redSquareX.

    greenSquareX = holeSize + bonusWidth/2
    greenSquareY = holeSize
    redSquareX = width - topSquareSize - holeSize - bonusWidth/2
    redSquareY = holeSize
    topWindowX = topSquareSize + holeSize*2 + bonusWidth/2
    topWindowY = holeSize
    middleTopX = holeSize + bonusWidth/2
    middleTopY = topWindowY + topSquareSize + holeSize
    mainBodyX = bonusWidth/2 - 2*(10*scalingFactor - holeSize) // the main body width assumes a hole size of 10*scalingFactor
    mainBodyY = middleTopY + middleTopHeight + holeSize
    bottomWindowX = holeSize + bonusWidth/2
    bottomWindowY = mainBodyY + mainBodyHeight + holeSize
    selectionX = holeSize + bonusWidth/2
    selectionY = bottomWindowY + bottomHeight + holeSize
    scalingAdjustX = holeSize + bonusWidth/2
    scalingAdjustY = selectionY + mechanicSelectionHeight + holeSize

    // greenSquareX = 0
    // greenSquareY = 0
    // redSquareX = width - topSquareSize
    // redSquareY = 0
    // topWindowX = topSquareSize + holeSize
    // topWindowY = 0
    // middleTopX = 0
    // middleTopY = topWindowY + topSquareSize + holeSize
    // mainBodyX = 0
    // mainBodyY = middleTopY + middleTopHeight + holeSize
    // bottomWindowX = 0
    // bottomWindowY = mainBodyY + mainBodyHeight + holeSize
    // selectionX = 0
    // selectionY = bottomWindowY + bottomHeight + holeSize

    centerOfBoard = [mainBodyX + mainBodyWidth/2, mainBodyY + mainBodyHeight/2]

    textAlign(CENTER, CENTER)

    if (parseInt(localStorage.getItem("coins")) > 9) {
        let link = document.getElementById('coin')
        let newFavicon = 'data/Gold coins/Gold Coin Bag.ico'
        let timestamp = new Date().getTime()
        link.href = `${newFavicon}?${timestamp}`
    } else {
        let link = document.getElementById('coin')
        let newFavicon = 'data/Gold coins/Gold Coin.ico'
        let timestamp = new Date().getTime()
        link.href = `${newFavicon}?${timestamp}`
    }
    if (parseInt(localStorage.getItem("coins")) > 249) {
        let link = document.getElementById('coin')
        let newFavicon = 'data/Gold coins/Gold Coin Medium Bag.ico'
        let timestamp = new Date().getTime()
        link.href = `${newFavicon}?${timestamp}`
    } if (parseInt(localStorage.getItem("coins")) > 499) {
        let link = document.getElementById('coin')
        let newFavicon = 'data/Gold coins/Gold Coin Large Bag.ico'
        let timestamp = new Date().getTime()
        link.href = `${newFavicon}?${timestamp}`
    } if (parseInt(localStorage.getItem("coins")) > 999) {
        let link = document.getElementById('coin')
        let newFavicon = 'data/Gold coins/Gold Coin Giant Heap.ico'
        let timestamp = new Date().getTime()
        link.href = `${newFavicon}?${timestamp}`
    }

    if (localStorage.getItem("version")) {
        version = localStorage.getItem("version")
    }

    // make sure your version is up-to-date and do any updates required
    switch (version) {
        case "0.000":
            version = "0.100"
            break
        default:
            print("Your version is up to date")
    }
    while (true) {
        let uptodate = false
        switch (version) {
            case "0.000":
                version = "0.100"
                break
            default:
                uptodate = true
        }
        if (uptodate) break
    }
    localStorage.setItem("version", version)
}

function draw() {
    frameRate(1000)
    updateVectors()

    // translate(-width/2, -height/2)
    // orbitControl()
    //
    // background(0)
    //
    // fill(0, 0, 50)
    // push()
    // translate(mouseX, mouseY, 0)
    // sphere(10)
    // pop()
    //
    // ambientLight(0, 0, 100)

    // the main body window, DO NOT DISPLAY BACKGROUND
    fill(234, 34, 24, 0.5)
    noStroke()
    // rect(mainBodyX, mainBodyY, mainBodyX + mainBodyWidth, mainBodyY + mainBodyHeight, cornerRounding)
    displayMainBodyContent()

    // party list!!! this only gets displayed sometimes
    fill(234, 34, 24)
    noStroke()
    displayPartyList()

    // the green square at the top-left
    fill(120, 80, 50)
    noStroke()
    rect(greenSquareX, greenSquareY, greenSquareX + topSquareSize, greenSquareY + topSquareSize, cornerRounding)
    displayWinContent()

    // the top window
    fill(234, 34, 24)
    noStroke()
    rect(topWindowX, topWindowY, topWindowX + topWidth, topWindowY + topSquareSize, cornerRounding)
    displayTopWindowContent()

    // the red square at the top-right
    fill(350, 80, 50)
    noStroke()
    rect(redSquareX, redSquareY, redSquareX + topSquareSize, redSquareY + topSquareSize, cornerRounding)
    displayLossContent()

    // the mechanic selection window
    fill(234, 34, 24)
    noStroke()
    rect(selectionX, selectionY, selectionX + selectionWidth, selectionY + mechanicSelectionHeight, cornerRounding)
    displayMechanicSelection()

    // the middle-top window
    fill(234, 34, 24)
    noStroke()
    rect(middleTopX, middleTopY, middleTopX + middleTopWidth, middleTopY + middleTopHeight, cornerRounding)
    textAlign(LEFT, TOP)
    displayMiddleTopWindowContent()

    // the bottom window
    fill(234, 34, 24)
    noStroke()
    rect(bottomWindowX, bottomWindowY, bottomWindowX + bottomWidth, bottomWindowY + bottomHeight, cornerRounding)
    displayBottomWindowContent()

    // the scaling adjustment window
    fill(234, 34, 24)
    noStroke()
    rect(scalingAdjustX, scalingAdjustY, scalingAdjustX + scalingAdjustWidth, scalingAdjustY + scalingAdjustHeight, cornerRounding)
    displayScalingAdjustContent()

    // used in emergencies. also a nice treat for those who accidentally
    // pressed backtick
    displayDebugCorner()

    // make sure mousePressedLastFrame is updated
    mousePressedLastFrame = mouseIsPressed
}

//——————————————————————————display window contents——————————————————————————\\

function displayWinContent() {
    let wins = parseInt(localStorage.getItem(currentlySelectedMechanic + " wins"))
    let streak = parseInt(localStorage.getItem(currentlySelectedMechanic + " streak"))
    if (isNaN(wins)) {
        localStorage.setItem(currentlySelectedMechanic + " wins", "0")
    }
    if (isNaN(streak)) {
        localStorage.setItem(currentlySelectedMechanic + " streak", "0")
    }

    // display in the form of:
    // 🟩🟩🟩🟩🟩🟩🟩🟩
    // 🟩              🟩
    // 🟩     WINS     🟩
    // 🟩      20      🟩
    // 🟩  STREAK: 0   🟩
    // 🟩  COINS: 0    🟩
    // 🟩              🟩
    // 🟩🟩🟩🟩🟩🟩🟩🟩
    // ...or something like that. lol
    fill(0, 0, 100)
    noStroke()
    textAlign(CENTER, CENTER)
    textSize(12*scalingFactor*fontScalingFactor)
    text("WINS", greenSquareX + topSquareSize/2, greenSquareY + topSquareSize/5)
    textSize(7*scalingFactor*fontScalingFactor)
    text(wins + "\nSTREAK: " + streak, +
        greenSquareX + topSquareSize/2, +
        greenSquareY + 7*topSquareSize/12)
}

function displayLossContent() {
    let wipes = parseInt(localStorage.getItem(currentlySelectedMechanic + " wipes"))
    let coins = parseInt(localStorage.getItem("coins"))
    if (isNaN(wipes)) {
        localStorage.setItem(currentlySelectedMechanic + " wipes", "0")
    }
    if (isNaN(coins)) {
        localStorage.setItem("coins", "0")
    }

    // display in the form of:
    // 🟥🟥🟥🟥🟥🟥🟥🟥
    // 🟥              🟥
    // 🟥    WIPES     🟥
    // 🟥      0       🟥
    // 🟥  COINS: 290  🟥
    // 🟥              🟥
    // 🟥              🟥
    // 🟥🟥🟥🟥🟥🟥🟥🟥
    // ...or something like that. lol
    // *brags about how he's had situations like these many times in the
    // past*

    push()
    textSize(7*scalingFactor*fontScalingFactor)

    fill(0, 0, 100)
    noStroke()
    textAlign(CENTER, CENTER)
    textSize(11*scalingFactor*fontScalingFactor)
    text("WIPES", redSquareX + topSquareSize/2, redSquareY + topSquareSize/5)
    textSize(7*scalingFactor*fontScalingFactor)
    text(wipes/* + "\nSTREAK\nCOINS: " + coins*/ + "\n", redSquareX +
        topSquareSize/2, redSquareY + 7*topSquareSize/12)
    pop()

}

function displayTopWindowContent() {
    textAlign(LEFT, TOP)
    noStroke()

    // make buttons look like buttons

    textFont(font)

    // text needs to be translated up to be centered
    let textTranslation = -1.2*scalingFactor

    push()
    translate(0, 4*scalingFactor) // currently, this just needs to be moved
    // a little bit down
    translate((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4, 0) // center it too

    // add the underside
    fill(120, 50, 30)
    if (stage > 98) fill(120, 50, 30+sin(frameCount/50)*20)
    rect(topWindowX + textPadding, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("Restart") + textPadding*3, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)
    fill(0, 100, 30)
    rect(topWindowX + textWidth("Restart") + textPadding*4, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("RestartPurge data") + textPadding*6, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)
    fill(240, 50, 35)
    if (DPSOrSupports(role) === "DPS") if (meleeOrRanged(role) === "melee") {fill(0, 80, 30); stroke(0, 80, 30)}
    else {fill(320, 80, 30); stroke(320, 80, 30)}
    else if (meleeOrRanged(role) === "melee") {fill(220, 70, 30); stroke(220, 70, 30)}
    else {fill(120, 70, 30); stroke(120, 70, 30)}
    noStroke()
    rect(topWindowX + textWidth("RestartPurge data") + textPadding*7, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("RestartPurge dataChange role from " + role) + textPadding*9, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)


    // then the part where you can press. move down if pressed on

    push()
    translate(0, -2.6*scalingFactor) // distance of surface and base of button

    push()
    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textPadding, topWindowY + 20*scalingFactor,
            (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("Restart") + textPadding*3,
            topWindowY + 22*scalingFactor + textAscent() + textPadding) &&
        mouseIsPressed) {translate(0, scalingFactor)}
    fill(120, 50, 50)
    if (stage > 98) fill(120, 50, 60+sin(frameCount/50)*30) // make it more noticeable if you should restart
    rect(topWindowX + textPadding, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("Restart") + textPadding*3, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)
    fill(0, 0, 100)
    noStroke()
    translate(0, textTranslation)
    text("Restart", topWindowX + textPadding*2, topWindowY + 22*scalingFactor + (textPadding)/2)
    pop()

    push()
    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("Restart") + textPadding*4, topWindowY + 20*scalingFactor,
            (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge data") + textPadding*6,
            topWindowY + 22*scalingFactor + textAscent() + textPadding) &&
        mouseIsPressed) {translate(0, scalingFactor)}
    fill(0, 100, 50)
    rect(topWindowX + textWidth("Restart") + textPadding*4, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("RestartPurge data") + textPadding*6, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)
    fill(0, 0, 100)
    translate(0, textTranslation)
    text("Purge data", topWindowX + textWidth("Restart") + textPadding*5, topWindowY + 22*scalingFactor + (textPadding)/2)
    pop()

    push()
    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge data") + textPadding*7, topWindowY + 20*scalingFactor,
            (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge dataChange role from " + role) + textPadding*9,
            topWindowY + 22*scalingFactor + textAscent() + textPadding) &&
        mouseIsPressed) {translate(0, scalingFactor)}
    fill(240, 50, 50)

    // the button's color is the color of the role you are on
    if (DPSOrSupports(role) === "DPS") if (meleeOrRanged(role) === "melee") {fill(0, 80, 60); stroke(0, 80, 60)}
    else {fill(320, 80, 60); stroke(320, 80, 60)}
    else if (meleeOrRanged(role) === "melee") {fill(220, 70, 50); stroke(220, 70, 50)}
    else {fill(120, 70, 50); stroke(120, 70, 50)}

    noStroke()
    rect(topWindowX + textWidth("RestartPurge data") + textPadding*7, topWindowY + 22*scalingFactor,
        topWindowX + textWidth("RestartPurge dataChange role from " + role) + textPadding*9, topWindowY + 22*scalingFactor + textAscent() + textPadding, cornerRounding/2)
    fill(0, 0, 100)
    translate(0, textTranslation)
    text("Change role from " + role, topWindowX + textWidth("RestartPurge data") + textPadding*8, topWindowY + 22*scalingFactor + (textPadding)/2)
    stroke(0, 0, 100)

    // bold the role that you are on
    strokeWeight(scalingFactor*0.3)
    text(role, topWindowX + textWidth("RestartPurge dataChange role from ") + textPadding*8, topWindowY + 22*scalingFactor + (textPadding)/2)
    pop()
    pop()
    pop()


    // since the buttons at the bottom are useful, just...make them useful XD
    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textPadding, topWindowY + 20*scalingFactor,
        (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("Restart") + textPadding*3,
        topWindowY + 22*scalingFactor + textAscent() + textPadding)) {
        if (mousePressedButNotHeldDown()) // so long as the mouse wasn't held down, reset the mechanic
            reset()
    }

    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("Restart") + textPadding*4, topWindowY + 20*scalingFactor,
        (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge data") + textPadding*6,
        topWindowY + 22*scalingFactor + textAscent() + textPadding)) {
        if (mousePressedButNotHeldDown()) {
            localStorage.setItem(currentlySelectedMechanic + " wins", "0")
            localStorage.setItem(currentlySelectedMechanic + " wipes", "0")
            localStorage.setItem(currentlySelectedMechanic + " streak", "0")
            return
        }
    }

    if (mouseInBoundingBox((textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge data") + textPadding*7, topWindowY + 20*scalingFactor,
        (textWidth("RestartPurge dataChange role from " + role) + textPadding*5)/4 + topWindowX + textWidth("RestartPurge dataChange role from " + role) + textPadding*9,
        topWindowY + 22*scalingFactor + textAscent() + textPadding)) {
        if (mousePressedButNotHeldDown()) {
            // so long as the mouse wasn't held down, change roles
            switch (role) {
                case "MT":
                    role = "OT"
                    break
                case "OT":
                    role = "H1"
                    break
                case "H1":
                    role = "H2"
                    break
                case "H2":
                    role = "M1"
                    break
                case "M1":
                    role = "M2"
                    break
                case "M2":
                    role = "R1"
                    break
                case "R1":
                    role = "R2"
                    break
                case "R2":
                    role = "MT"
                    break
            }
            // you can't cheat by switching roles mid-mech!
            reset()
            return
        }
    }

    textFont(font)



    textAlign(LEFT, BASELINE)
    fill(0, 0, 100)
    text("Hi! I'm Codybear, and I like making simulations when it's not raid" +
        " night. Scroll down for a list of mechanics! It's at the very bottom.",
        topWindowX + textPadding, topWindowY + textPadding + textAscent(), topWidth - textPadding*2)



    textAlign(CENTER, CENTER)
}

function displayMiddleTopWindowContent() {
    fill(0, 0, 100)
    textWrap(WORD)
    text(textAtTop, middleTopX + textPadding, middleTopY + textPadding, middleTopWidth - textPadding*2)

    // display how long it's been since the mechanic started
    fill(0, 0, 100)
    noStroke()
    textSize(7*scalingFactor*fontScalingFactor)
    textAlign(LEFT, TOP)
    text("It's been " + formatSeconds((millis() - mechanicStarted)/1000) + " since" +
        " the mechanic started.", middleTopX + textPadding, middleTopY + middleTopHeight -
        textPadding - textAscent() - textDescent())
}

function displayMainBodyContent() {
    if (script[stage]) {
        // scriptAtStage has 6 parts, generally:
        // 1. arena. just contains the arena image
        // 2. functions. these are called as display.
        // 3. greendots. contains necessary data about all dots.
        // 4. onArrive. if true, auto-advances on character arrival.
        // 5. instantAdvance. if true, auto-advances as soon as executed.
        // 6. delayedAdvance. if true, auto-advances after a delay.

        // retrieve the script
        let scriptAtStage = script[stage]

        // arena part—just display
        let arena = scriptAtStage.arena

        tint(0, 0, 100, 10)
        displayRotatedImage(arena, mainBodyX, mainBodyY, mainBodyWidth, mainBodyHeight, scriptAtStage.arenaRotation)
        tint(0, 0, 100, 100)

        // function part. execute all functions listed
        for (let funcData of scriptAtStage.functions) {
            // retrieve the function
            let func = window[funcData.name];

            // check if it's an actual function. if it is, call it!
            if (typeof func === "function") {
                func(...funcData.args);
            } else {
                console.warn(`No function found for: ${funcData.name}`);
            }
        }

        // green dots.
        for (let greenDotData of scriptAtStage.greendots) {
            if (inBoardCenterFormatClickingRange(
                    [greenDotData.x, greenDotData.y],
                    greenDotData.small ? 5*scalingFactor : 7.5*scalingFactor
                ) && mousePressedButNotHeldDown()) {
                stage = greenDotData.onclick.advanceStageTo
                stageStarted = millis()

                if (greenDotData.onclick.positions.MT) setPosition("MT", ...greenDotData.onclick.positions.MT)
                if (greenDotData.onclick.positions.OT) setPosition("OT", ...greenDotData.onclick.positions.OT)
                if (greenDotData.onclick.positions.H1) setPosition("H1", ...greenDotData.onclick.positions.H1)
                if (greenDotData.onclick.positions.H2) setPosition("H2", ...greenDotData.onclick.positions.H2)
                if (greenDotData.onclick.positions.M1) setPosition("M1", ...greenDotData.onclick.positions.M1)
                if (greenDotData.onclick.positions.M2) setPosition("M2", ...greenDotData.onclick.positions.M2)
                if (greenDotData.onclick.positions.R1) setPosition("R1", ...greenDotData.onclick.positions.R1)
                if (greenDotData.onclick.positions.R2) setPosition("R2", ...greenDotData.onclick.positions.R2)
                if (greenDotData.onclick.yourPosition) setPosition(role, ...greenDotData.onclick.yourPosition)

                if (greenDotData.onclick.changeMovementType) setMovementMode(greenDotData.onclick.changeMovementType)

                if (greenDotData.onclick.textAtTop) textAtTop = greenDotData.onclick.textAtTop
                if (greenDotData.onclick.textAtBottom) textAtBottom = greenDotData.onclick.textAtBottom

                if (greenDotData.onclick.backgroundChange) {
                    let css = select("html")
                    css.style("background-image", "url(\"" + greenDotData.onclick.backgroundChange + "\")")
                    css = select("body")
                    css.style("background-image", "url(\"" + greenDotData.onclick.backgroundChange + "\")")
                }
            }
        }

        if (belowPositioningThreshold(scalingFactor, [
            [MT, realMT],
            [OT, realOT],
            [H1, realH1],
            [H2, realH2],
            [M1, realM1],
            [M2, realM2],
            [R1, realR1],
            [R2, realR2]
        ]) && scriptAtStage.onArrive) {
            let onArrive = scriptAtStage.onArrive

            stage = onArrive.advanceStageTo
            stageStarted = millis()

            if (onArrive.positions.MT) setPosition("MT", ...onArrive.positions.MT)
            if (onArrive.positions.OT) setPosition("OT", ...onArrive.positions.OT)
            if (onArrive.positions.H1) setPosition("H1", ...onArrive.positions.H1)
            if (onArrive.positions.H2) setPosition("H2", ...onArrive.positions.H2)
            if (onArrive.positions.M1) setPosition("M1", ...onArrive.positions.M1)
            if (onArrive.positions.M2) setPosition("M2", ...onArrive.positions.M2)
            if (onArrive.positions.R1) setPosition("R1", ...onArrive.positions.R1)
            if (onArrive.positions.R2) setPosition("R2", ...onArrive.positions.R2)
            if (onArrive.yourPosition) setPosition(role, ...onArrive.yourPosition)

            if (onArrive.changeMovementType) setMovementMode(onArrive.changeMovementType)

            if (onArrive.textAtTop) textAtTop = onArrive.textAtTop
            if (onArrive.textAtBottom) textAtBottom = (onArrive.textAtBottom === "cleared") ? "[CLEARED, " + formatSeconds((millis() - mechanicStarted)/1000) + "]" : onArrive.textAtBottom

            if (onArrive.backgroundChange) {
                let css = select("html")
                css.style("background-image", "url(\"" + onArrive.backgroundChange + "\")")
                css = select("body")
                css.style("background-image", "url(\"" + onArrive.backgroundChange + "\")")
            }
        }

        if (scriptAtStage.delayedAdvance && millis() - stageStarted > scriptAtStage.delayedAdvance.delayMillis) {
            let delayedAdvance = scriptAtStage.delayedAdvance

            stage = delayedAdvance.advanceStageTo
            stageStarted = millis()

            if (delayedAdvance.positions.MT) setPosition("MT", ...delayedAdvance.positions.MT)
            if (delayedAdvance.positions.OT) setPosition("OT", ...delayedAdvance.positions.OT)
            if (delayedAdvance.positions.H1) setPosition("H1", ...delayedAdvance.positions.H1)
            if (delayedAdvance.positions.H2) setPosition("H2", ...delayedAdvance.positions.H2)
            if (delayedAdvance.positions.M1) setPosition("M1", ...delayedAdvance.positions.M1)
            if (delayedAdvance.positions.M2) setPosition("M2", ...delayedAdvance.positions.M2)
            if (delayedAdvance.positions.R1) setPosition("R1", ...delayedAdvance.positions.R1)
            if (delayedAdvance.positions.R2) setPosition("R2", ...delayedAdvance.positions.R2)
            if (delayedAdvance.yourPosition) setPosition(role, ...delayedAdvance.yourPosition)

            if (delayedAdvance.changeMovementType) setMovementMode(delayedAdvance.changeMovementType)

            if (delayedAdvance.textAtTop) textAtTop = delayedAdvance.textAtTop
            if (delayedAdvance.textAtBottom) textAtBottom = (delayedAdvance.textAtBottom === "cleared") ? "[CLEARED, " + formatSeconds((millis() - mechanicStarted)/1000) + "]" : onArrive.textAtBottom

            if (delayedAdvance.backgroundChange) {
                let css = select("html")
                css.style("background-image", "url(\"" + onArrive.backgroundChange + "\")")
                css = select("body")
                css.style("background-image", "url(\"" + onArrive.backgroundChange + "\")")
            }
        }

    } else console.warn(`Stage ${stage} not found.`)
}

function displayPartyList() {
    // party list is automatically placed to the right of main body window.
    let partyListX = mainBodyX + mainBodyWidth + holeSize
    let partyListWidth = 150*scalingFactor
    let partyListHeight = 200*scalingFactor
    let partyListY = mainBodyY + mainBodyWidth/2 - partyListHeight/2

    // if (currentlySelectedMechanic === "Ultimate Relativity") {
    //     rect(partyListX, partyListY, partyListX + partyListWidth,
    //         partyListY + partyListHeight, cornerRounding)
    //     fill(0, 0, 100)
    //     textAlign(LEFT, TOP)
    //     textSize(30*fontScalingFactor*scalingFactor)
    //     text("Party List", partyListX + textPadding, partyListY)
    //
    //     for (let i = 0; i < 8; i++) {
    //         let y = partyListY + 35*scalingFactor + i*20*scalingFactor
    //
    //         let playerName = ""
    //         if (i === 0) {
    //             playerName = "MT"
    //             fill(220, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 1) {
    //             playerName = "OT"
    //             fill(220, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 2) {
    //             playerName = "H1"
    //             fill(120, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 3) {
    //             playerName = "H2"
    //             fill(120, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 4) {
    //             playerName = "M1"
    //             fill(0, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 5) {
    //             playerName = "M2"
    //             fill(0, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 6) {
    //             playerName = "R1"
    //             fill(0, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         } if (i === 7) {
    //             playerName = "R2"
    //             fill(0, 70, 80)
    //             noStroke()
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         }
    //         if (playerName === role) {
    //             fill(50, 100, 60)
    //             stroke(0, 0, 100)
    //             strokeWeight(1.5*scalingFactor)
    //             circle(partyListX + textPadding + 10*scalingFactor, y + 10*scalingFactor, 15*scalingFactor)
    //         }
    //
    //         textAlign(CENTER, CENTER)
    //         fill(0, 0, 100)
    //         textSize(7.5*fontScalingFactor*scalingFactor)
    //         stroke(0, 0, 100)
    //         strokeWeight(0.25*scalingFactor)
    //         text(playerName, partyListX + textPadding + 10*scalingFactor, y + 9*scalingFactor)
    //
    //         let currentX = partyListX + textPadding + 20*scalingFactor
    //         let debuffs = ultimateRelativityDebuffList[playerName]
    //         for (let debuff of debuffs) {
    //             if ((stage%100) >= debuff.application && (stage%100) <= debuff.resolves) {
    //                 switch (debuff.name) {
    //                     case "Dark Eruption":
    //                         image(ultimateRelativityDebuffIcons[0], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[0].height/ultimateRelativityDebuffIcons[0].width)
    //                         break
    //                     case "Dark Fire III":
    //                         image(ultimateRelativityDebuffIcons[1], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[1].height/ultimateRelativityDebuffIcons[1].width)
    //                         break
    //                     case "Dark Ice III":
    //                         image(ultimateRelativityDebuffIcons[2], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[2].height/ultimateRelativityDebuffIcons[2].width)
    //                         break
    //                     case "Dark Water III":
    //                         image(ultimateRelativityDebuffIcons[3], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[3].height/ultimateRelativityDebuffIcons[3].width)
    //                         break
    //                     case "Return":
    //                         image(ultimateRelativityDebuffIcons[4], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[4].height/ultimateRelativityDebuffIcons[4].width)
    //                         break
    //                     case "Rewind":
    //                         image(ultimateRelativityDebuffIcons[5], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[5].height/ultimateRelativityDebuffIcons[5].width)
    //                         break
    //                     case "Shadoweye":
    //                         image(ultimateRelativityDebuffIcons[6], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[6].height/ultimateRelativityDebuffIcons[6].width)
    //                         break
    //                     case "Stun":
    //                         image(ultimateRelativityDebuffIcons[7], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[7].height/ultimateRelativityDebuffIcons[7].width)
    //                         break
    //                     case "Unholy Darkness":
    //                         image(ultimateRelativityDebuffIcons[8], currentX - 2.5*scalingFactor, y, 15*scalingFactor,
    //                             15*scalingFactor*ultimateRelativityDebuffIcons[8].height/ultimateRelativityDebuffIcons[8].width)
    //                         break
    //                 }
    //                 fill(0, 0, 100)
    //                 stroke(0, 0, 100)
    //                 strokeWeight(scalingFactor/2)
    //                 textSize(8*fontScalingFactor*scalingFactor)
    //                 textAlign(CENTER, CENTER)
    //                 if (debuff.resolves - (stage%100) > 0.5) text(round(debuff.resolves - stage%100), currentX + 5*scalingFactor, y + 16*scalingFactor)
    //                 currentX += 15*scalingFactor
    //             }
    //         }
    //     }
    //     // stage = ((millis() - mechanicStarted)/1000)
    // }
}

function displayMechanicSelection() {
    // each row is 20*scalingFactor. currently, there are 2 rows.
    // I will count the rows from bottom to top—bottom is row 1, top is row
    // ∞ or however many rows there are.


    let rowBottom = mechanicSelectionHeight + selectionY - textPadding - 3*scalingFactor
    let rowTop = mechanicSelectionHeight + selectionY - textPadding - 18*scalingFactor

    // variable used to track how far we are in to the mechanics window
    let currentX = 0
}

function displayBottomWindowContent() {
    // before we display any text, we should set the background
    if (stage < 99) { // stage < 99 indicates you're still on track
        fill(120, 100, 50, 50)
    } if (stage === 99) { // if stage is 99, you've completed the mechanic
        fill(240, 100, 50, 50)
    } if (stage > 99) { // if stage is greater than 99, you failed the mechanic in some way
        fill(0, 100, 50, 50)
    }
    noStroke()
    rect(bottomWindowX, bottomWindowY, bottomWindowX + bottomWidth, bottomWindowY + bottomHeight, cornerRounding)

    fill(0, 0, 100)
    text(textAtBottom, bottomWindowX + textPadding, bottomWindowY + textPadding, bottomWidth - textPadding*2)
}

function displayScalingAdjustContent() {
    // display whatever the current scaling factor is
    textAlign(LEFT, TOP)
    fill(0, 0, 100)
    noStroke()
    textSize(10*scalingFactor*fontScalingFactor)
    text("Scaling factor adjust. Current: " + parseInt(scalingFactorFetch*100) + "%",
        scalingAdjustX + textPadding, scalingAdjustY + textPadding)
    textAlign(RIGHT, TOP)
    text("Reload to take effect",
        scalingAdjustX + scalingAdjustWidth - textPadding, scalingAdjustY + textPadding)
    textAlign(CENTER, TOP)
    textSize(7*scalingFactor*fontScalingFactor)

    // now that we're done with the text, display the buttons
    // row 1: "-50%", "-25%", "+25%", "+50%"
    fill(0, 50, 30)
    noStroke()
    push()
    translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    rect(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    fill(120, 50, 30)
    rect(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    rect(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)

    translate(0, -2*scalingFactor)
    fill(0, 50, 50)
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent()) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    fill(0, 0, 100)
    noStroke()
    text("-50%", scalingAdjustX + textPadding*1.5 + textWidth("-%%%")/2, scalingAdjustY + textPadding*2.5 + 13*scalingFactor)
    pop()
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent()) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    fill(0, 0, 100)
    text("-25%", scalingAdjustX + textPadding*3.5 + textWidth("-%%%")*1.5, scalingAdjustY + textPadding*2.5 + 13*scalingFactor)
    pop()
    fill(120, 50, 50)
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent()) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    fill(0, 0, 100)
    text("+25%", scalingAdjustX + textPadding*5.5 + textWidth("-%%%")*2.5, scalingAdjustY + textPadding*2.5 + 13*scalingFactor)
    pop()
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent()) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent(), cornerRounding)
    fill(0, 0, 100)
    text("+50%", scalingAdjustX + textPadding*7.5 + textWidth("-%%%")*3.5, scalingAdjustY + textPadding*2.5 + 13*scalingFactor)
    pop()
    pop()
    // -50%
    if (mouseInBoundingBox(scalingAdjustX + textPadding, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent())) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch -= 0.5
            scalingFactorFetch = max(scalingFactorFetch, 0.25)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // -25%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent())) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch -= 0.25
            scalingFactorFetch = max(scalingFactorFetch, 0.25)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // +25%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent())) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch += 0.25
            scalingFactorFetch = min(scalingFactorFetch, 10)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // +50%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*2 + 13*scalingFactor,
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*3 + 13*scalingFactor + textAscent() + textDescent())) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch += 0.5
            scalingFactorFetch = min(scalingFactorFetch, 10)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }


    // row 2: "-10%", "-1%", "+1%", "+10%"
    fill(0, 50, 30)
    push()
    translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    rect(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    fill(120, 50, 30)
    rect(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    rect(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)

    translate(0, -2*scalingFactor)
    fill(0, 50, 50)
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    fill(0, 0, 100)
    text("-10%", scalingAdjustX + textPadding*1.5 + textWidth("-%%%")/2, scalingAdjustY + textPadding*4.5 + 13*scalingFactor + textAscent() + textDescent())
    pop()
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    fill(0, 0, 100)
    text("-1%", scalingAdjustX + textPadding*3.5 + textWidth("-%%%")*1.5, scalingAdjustY + textPadding*4.5 + 13*scalingFactor + textAscent() + textDescent())
    pop()
    fill(120, 50, 50)
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    fill(0, 0, 100)
    text("+1%", scalingAdjustX + textPadding*5.5 + textWidth("-%%%")*2.5, scalingAdjustY + textPadding*4.5 + 13*scalingFactor + textAscent() + textDescent())
    pop()
    push()
    if (mouseInBoundingBox(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2) && mouseIsPressed)
        translate(0, scalingFactor)
    rect(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2, cornerRounding)
    fill(0, 0, 100)
    text("+10%", scalingAdjustX + textPadding*7.5 + textWidth("-%%%")*3.5, scalingAdjustY + textPadding*4.5 + 13*scalingFactor + textAscent() + textDescent())
    pop()
    pop()
    // -10%
    if (mouseInBoundingBox(scalingAdjustX + textPadding, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*2 + textWidth("-%%%"), scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2)) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch -= 0.1
            scalingFactorFetch = max(scalingFactorFetch, 0.25)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // -1%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*3 + textWidth("-%%%"), scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*4 + textWidth("-%%%")*2, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2)) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch -= 0.01
            scalingFactorFetch = max(scalingFactorFetch, 0.25)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // +1%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*5 + textWidth("-%%%")*2, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*6 + textWidth("-%%%")*3, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2)) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch += 0.01
            scalingFactorFetch = min(scalingFactorFetch, 10)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
    // +10%
    if (mouseInBoundingBox(scalingAdjustX + textPadding*7 + textWidth("-%%%")*3, scalingAdjustY + textPadding*4 + 13*scalingFactor + textAscent() + textDescent(),
        scalingAdjustX + textPadding*8 + textWidth("-%%%")*4, scalingAdjustY + textPadding*5 + 13*scalingFactor + textAscent()*2 + textDescent()*2)) {
        if (mousePressedButNotHeldDown()) {
            scalingFactorFetch += 0.1
            scalingFactorFetch = min(scalingFactorFetch, 10)
            localStorage.setItem("scalingFactor", scalingFactorFetch)
            return
        }
    }
}

// since all the other things that display something on top of the separate
// sections are in functions, this should be in a function too for consistency
function displayDebugCorner() {
    textAlign(LEFT, BOTTOM)
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.showBottom()
    textAlign(CENTER, CENTER)
}

//—————————————————————————————utility functions—————————————————————————————\\

function updateWins(winsPerCoinIncrease) {
    localStorage.setItem(currentlySelectedMechanic + " streak", parseInt(localStorage.getItem(currentlySelectedMechanic + " streak")) + 1)
    localStorage.setItem(currentlySelectedMechanic + " wins", parseInt(localStorage.getItem(currentlySelectedMechanic + " wins")) + 1)
    localStorage.setItem("coins", parseInt(ceil(parseFloat(localStorage.getItem(currentlySelectedMechanic + " streak")/numWinsPerCoinIncrease))) + parseInt(localStorage.getItem("coins")))
}

function updateLosses(winsPerCoinIncrease) {
    localStorage.setItem("coins", -parseInt(ceil(parseFloat(localStorage.getItem(currentlySelectedMechanic + " streak")/numWinsPerCoinIncrease + 1/numWinsPerCoinIncrease))) - 1 + parseInt(localStorage.getItem("coins")))
    localStorage.setItem("coins", max(parseInt(localStorage.getItem("coins")), 0))
    localStorage.setItem(currentlySelectedMechanic + " streak", 0)
    localStorage.setItem(currentlySelectedMechanic + " wipes", parseInt(localStorage.getItem(currentlySelectedMechanic + " wipes")) + 1)
}

// aside from it being easy to mess up with this, it's more convenient to
// call a short function
function radius(x, y) {
    return sqrt(x**2 + y**2)
}

// did you know that atan2 uses [y, x] so you can't ... a position onto it?
// it's annoying
function goodAtan2(x, y) {
    return atan2(y, x)
}

function formatSeconds(s) {
    let seconds = floor(s) % 60
    let minutes = floor(s/60) % 60
    let hours = floor(s/3600)

    if (hours) return hours + ":" + addLeadingZero(minutes, 2) + ":" + addLeadingZero(seconds, 2)
    else if (minutes) return minutes + ":" + addLeadingZero(seconds, 2)
    else return seconds + "s"
}

function setMovementMode(mode) {
    realMT.mode = mode
    realOT.mode = mode
    realH1.mode = mode
    realH2.mode = mode
    realM1.mode = mode
    realM2.mode = mode
    realR1.mode = mode
    realR2.mode = mode
}

// adds leading zeros to "string" until it reaches targetLen (blunt-force
// strategy. wait, is it even called "blunt force"?
// 4 months later: "NVM IT'S CALLED BRUTE FORCE OH MY FUCKING GOD
// ARRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRGH)
function addLeadingZero(string, targetLen) {
    let s = string + ""
    while (s.length < targetLen) {
        s = "0" + s
    }
    return s
}

// in range of clicking something (circle radius)
function inClickingRange(position, range) {
    return (sqrt((mouseX - position[0])**2 +
        (mouseY - position[1])**2) < range)
}

// inClickingRange but everything is in 0,0 = center of board format.
function inBoardCenterFormatClickingRange(position, range) {
    return inClickingRange(translateXYPositionToBoardCenterFormat(position), range)
}

// in range of clicking multiple things (circle radius), returns the position
// still counts as true in boolean functions
function inClickingRanges(positions, range) {
    for (let position of positions) {
        if (inClickingRange(position, range)) return position
    }
    return false
}

// inClickingRanges but everything is in 0,0 = center of board format. still
// returns original position, not translated one
function inBoardCenterFormatClickingRanges(positions, range) {
    for (let position of positions) {
        if (inClickingRange(translateXYPositionToBoardCenterFormat(position), range)) return position
    }
    return false
}

// encapsulation function. makes code less messy
function translateToCenterOfBoard() {
    translate(mainBodyX + mainBodyWidth/2, mainBodyY + mainBodyHeight/2);
}

// translates a position from 0,0 = center of board format to 0,0 = top-left
// of screen format
function translateXYPositionToStandardFormat(position) {
    return [position[0] - centerOfBoard[0], position[1] - centerOfBoard[1]]
}

// translates a position from 0,0 = top-left of screen format to 0,0 =
// center of board format
function translateXYPositionToBoardCenterFormat(position) {
    return [position[0] + centerOfBoard[0], position[1] + centerOfBoard[1]]
}

// translates a position from x,y to r,θ format
function translateXYPositionToRθFormat(position) {
    return [sqrt(position[0]**2 + position[1]**2), atan2(position[1], position[0])]
}

// translates a position from r,θ to x,y format
function translateRθPositionToXYFormat(position) {
    return [cos(position[1])*position[0], sin(position[1])*position[0]]
}

function mousePressedButNotHeldDown() {
    return mouseIsPressed && !mousePressedLastFrame
}

// update all the position vectors
function updateVectors() {
    realMT.targetX = MT[0]
    realMT.targetY = MT[1]
    realMT.update()
    realOT.targetX = OT[0]
    realOT.targetY = OT[1]
    realOT.update()
    realH1.targetX = H1[0]
    realH1.targetY = H1[1]
    realH1.update()
    realH2.targetX = H2[0]
    realH2.targetY = H2[1]
    realH2.update()
    realM1.targetX = M1[0]
    realM1.targetY = M1[1]
    realM1.update()
    realM2.targetX = M2[0]
    realM2.targetY = M2[1]
    realM2.update()
    realR1.targetX = R1[0]
    realR1.targetY = R1[1]
    realR1.update()
    realR2.targetX = R2[0]
    realR2.targetY = R2[1]
    realR2.update()
}

// when all the people are within threshold of their spot, this returns true
function belowPositioningThreshold(threshold, peopleToCheck) {
    for (let person of peopleToCheck) {
        if (sqrt((person[0][0] - person[1].x)**2 + (person[0][1] - person[1].y)**2) > threshold) return false
    }
    return true
}

// this is just useful. basically returns (x === y[0] || x === y[1] || x ===
// y[2]) and so on.
function checkEqualities(x, y) {
    for (let current of y) {
        if (x === current) return true
    }
}

// I'm sick and tired of trying to set someone's position but I only have a
// string containing their name
function setPosition(role, x, y) {
    switch (role) {
        case "MT":
            MT = [x, y]
            break
        case "OT":
            OT = [x, y]
            break
        case "M1":
            M1 = [x, y]
            break
        case "M2":
            M2 = [x, y]
            break
        case "H1":
            H1 = [x, y]
            break
        case "H2":
            H2 = [x, y]
            break
        case "R1":
            R1 = [x, y]
            break
        case "R2":
            R2 = [x, y]
            break
    }
}

// What if you want to set someone's position relative to their current
// position? That's right. Sometiimes. That's why this function exists.
function movePosition(role, x, y) {
    setPosition(role, currentPosition(role)[0] + x, currentPosition(role)[1] + y)
}

// Why not have a function to just set a certain amount of people to a
// certain place?
// warning: variance is the length of the range of people. an x of 20 with a
// variance of 10 will return 15-25, not 10-30
function setPositionsWithVariance(roles, x, y, xVariance, yVariance) {
    for (let role of roles) {
        setPosition(role, x + random(-xVariance/2, xVariance/2), y + random(-yVariance/2, yVariance/2))
    }
}

// uses identical parameters as rect, currently. x1 must be left of x2, y1
// must be up of y2.
function mouseInBoundingBox(x1, y1, x2, y2) {
    if (mouseX > x1 && mouseX < x2 && mouseY > y1 && mouseY < y2) return true
}

// random() function on a list that permamently removes that from the list
function randomWithoutReplacement(array) {
    let result = random(array)
    array.splice(array.indexOf(result), 1)
    return result
}

//—————————————————————————————display functions—————————————————————————————\\

// spaces don't matter & remember to use capital casing on the first letter
// of each word.
function display(n, args) {
    // inspired by ChatGPT generated response—makes me no longer have to
    // make a separate function call each time. spaces don't matter.
    let setupFunctionName = "display" + currentlySelectedMechanic.replace(/\s/g, '');
    let setupFunction = window[setupFunctionName];

    if (typeof setupFunction === "function") {
        setupFunction(...args);
    } else {
        console.warn(`No setup function found for: ${currentlySelectedMechanic}`);
    }
}

// spaces don't matter & remember to use capital casing on the first letter
// of each word.
function displayGlow(n, args) {
    // inspired by ChatGPT generated response—makes me no longer have to
    // make a separate function call each time. spaces don't matter.
    let setupFunctionName = "glow" + currentlySelectedMechanic.replace(/\s/g, '');
    let setupFunction = window[setupFunctionName];

    if (typeof setupFunction === "function") {
        setupFunction(...args);
    } else {
        console.warn(`No setup function found for: ${currentlySelectedMechanic}`);
    }
}

function displayUtopianSkySpreadOrStack(spreadOrStack) {
    push()
    translateToCenterOfBoard()
    if (spreadOrStack === "spread") {
        for (let position of [MT, OT, H1, H2, M1, M2, R1, R2]) {
            fill(240, 100, 50, min(1000-(millis()-stageStarted), 50))
            circle(...position, 70*scalingFactor)
        }
        for (let position of [MT, OT, H1, H2, M1, M2, R1, R2]) {
            noFill()
            glowCircle(200, 100, 100, min(1000-(millis()-stageStarted), 50), 5*scalingFactor, ...position, 70*scalingFactor)
            push()
            translate(...position)
            let angles1 = [random(PI/8, 3*PI/8) + millis()-stageStarted, random(PI/8, 3*PI/8) + millis()-stageStarted, random(PI/8, 3*PI/8) + millis()-stageStarted]
            let angles2 = [random(5*PI/8, 7*PI/8) + millis()-stageStarted, random(5*PI/8, 7*PI/8) + millis()-stageStarted, random(5*PI/8, 7*PI/8) + millis()-stageStarted]
            let angles3 = [random(9*PI/8, 11*PI/8) + millis()-stageStarted, random(9*PI/8, 11*PI/8) + millis()-stageStarted, random(9*PI/8, 11*PI/8) + millis()-stageStarted]
            let angles4 = [random(13*PI/8, 15*PI/8) + millis()-stageStarted, random(13*PI/8, 15*PI/8) + millis()-stageStarted, random(13*PI/8, 15*PI/8) + millis()-stageStarted]
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, 0, 0, cos(angles1[0])*11*scalingFactor, sin(angles1[0])*11*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles1[0])*11*scalingFactor, sin(angles1[0])*11*scalingFactor, cos(angles1[1])*24*scalingFactor, sin(angles1[1])*24*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles1[1])*24*scalingFactor, sin(angles1[1])*24*scalingFactor, cos(angles1[2])*35*scalingFactor, sin(angles1[2])*35*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, 0, 0, cos(angles2[0])*11*scalingFactor, sin(angles2[0])*11*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles2[0])*11*scalingFactor, sin(angles2[0])*11*scalingFactor, cos(angles2[1])*24*scalingFactor, sin(angles2[1])*24*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles2[1])*24*scalingFactor, sin(angles2[1])*24*scalingFactor, cos(angles2[2])*35*scalingFactor, sin(angles2[2])*35*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, 0, 0, cos(angles3[0])*11*scalingFactor, sin(angles3[0])*11*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles3[0])*11*scalingFactor, sin(angles3[0])*11*scalingFactor, cos(angles3[1])*24*scalingFactor, sin(angles3[1])*24*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles3[1])*24*scalingFactor, sin(angles3[1])*24*scalingFactor, cos(angles3[2])*35*scalingFactor, sin(angles3[2])*35*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, 0, 0, cos(angles4[0])*11*scalingFactor, sin(angles4[0])*11*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles4[0])*11*scalingFactor, sin(angles4[0])*11*scalingFactor, cos(angles4[1])*24*scalingFactor, sin(angles4[1])*24*scalingFactor)
            glowLine(200, 100, 100, min(1000-(millis()-stageStarted), 50), 3*scalingFactor, cos(angles4[1])*24*scalingFactor, sin(angles4[1])*24*scalingFactor, cos(angles4[2])*35*scalingFactor, sin(angles4[2])*35*scalingFactor)
            pop()
        }
    }
    if (spreadOrStack === "stack") {
        for (let position of [H1, H2]) {
            fill(0, 100, 50, min(1000-(millis()-stageStarted), 50))
            circle(...position, 70*scalingFactor)
        }
        for (let position of [H1, H2]) {
            noFill()
            glowCircle(0, 100, 100, min(1000-(millis()-stageStarted), 50), 5*scalingFactor, ...position, 70*scalingFactor)
            push()
            translate(...position)
            pop()
        }
    }
    pop()
}

function displayUtopianSkyBlastingZone(unsafeClones) {
    push()
    translateToCenterOfBoard()
    for (let clone of unsafeClones) {
        let angle
        switch (clone) {
            case "R2":
                angle = 0
                break
            case "OT":
                angle = 7*PI/4
                break
            case "MT":
                angle = 3*PI/2
                break
            case "R1":
                angle = 5*PI/4
                break
            case "H1":
                angle = PI
                break
            case "M1":
                angle = 3*PI/4
                break
            case "H2":
                angle = PI/2
                break
            case "M2":
                angle = PI/4
                break
        }
        push()
        rotate(angle)
        let x = mainBodyWidth/2 + (stageStarted - millis())*scalingFactor
        if (x > -3*mainBodyWidth/2) {
            x = max(x, -mainBodyWidth/2)
            let r = 2*mainBodyWidth/9 // radius of blasting zone
            strokeWeight(5*scalingFactor)
            stroke(0, 0, 100)
            line(mainBodyWidth/2, -r, x, -r)
            line(mainBodyWidth/2, r, x, r)
            fill(0, 0, 100, 1)
            noStroke()
            rect(mainBodyWidth/2, -r, x, r)
            stroke(240, 70, 100)
            line(mainBodyWidth/2, 0, x, 0)
        }
        pop()
    }
    pop()
}

// these puddles are always given in the format of [x, y, millisAppeared,
// radius]
function displayPuddle(puddleInfo) {
    push()
    translateToCenterOfBoard()
    let puddleX = puddleInfo[0]
    let puddleY = puddleInfo[1]
    let millisSinceAppeared = millis() - puddleInfo[2]
    let radius = puddleInfo[3]
    let color = [0, 0, 80, 50]
    if (puddleInfo.length === 5) color = puddleInfo[4]

    fill(...color)
    circle(puddleX, puddleY, map(millisSinceAppeared, 0, 250, 0, radius, true))
    pop()
}

// displayStarAoE but infinitely expanded
function displayExpandedStarAoE(x, y) {
    push()
    translateToCenterOfBoard()
    translate(x, y)
    fill(30, 100, 100, 60)
    stroke(0, 0, 100, 100)
    strokeWeight(1)
    rect(-mainBodyWidth/2, -10*scalingFactor, mainBodyWidth/2, 10*scalingFactor)
    rotate(PI/4)
    rect(-mainBodyWidth/2, -10*scalingFactor, mainBodyWidth/2, 10*scalingFactor)
    rotate(PI/4)
    rect(-mainBodyWidth/2, -10*scalingFactor, mainBodyWidth/2, 10*scalingFactor)
    rotate(PI/4)
    rect(-mainBodyWidth/2, -10*scalingFactor, mainBodyWidth/2, 10*scalingFactor)
    pop()
}

// displays a star AoE in the specified location. since it is conditional,
// it will never be done in a translation, so this has to translate itself.
function displayStarAoE(x, y) {
    push()
    translateToCenterOfBoard()
    translate(x, y)
    fill(30, 100, 100, 4)
    stroke(0, 0, 100, 100)
    strokeWeight(1)
    rect(-30*scalingFactor, -10*scalingFactor, 30*scalingFactor, 10*scalingFactor)
    rotate(PI/4)
    rect(-30*scalingFactor, -10*scalingFactor, 30*scalingFactor, 10*scalingFactor)
    rotate(PI/4)
    rect(-30*scalingFactor, -10*scalingFactor, 30*scalingFactor, 10*scalingFactor)
    rotate(PI/4)
    rect(-30*scalingFactor, -10*scalingFactor, 30*scalingFactor, 10*scalingFactor)
    pop()
}

// target symbol is orange plus above player, and a semicircle connecting to
// the top of the arc.   ◡
//                       |
//                       +
function displayTargetSymbol(x, y) {
    stroke(30, 100, 70)
    strokeWeight(2*scalingFactor)
    noFill()
    line(x, y - 10*scalingFactor, x, y - 20*scalingFactor)
    line(x - 3*scalingFactor, y - 15*scalingFactor, x + 3*scalingFactor, y - 15*scalingFactor)
    arc(x, y - 24*scalingFactor, 8*scalingFactor, 8*scalingFactor, -PI/8, 9*PI/8)
}

// spread marker, display via gray background and then a bunch of 10-opacity
// different-stroke-weight circles to provide a gradient effect towards the middle
function displaySpreadMarker(x, y, d, h, s, b) {
    noFill()
    stroke(0, 0, b/2)
    strokeWeight(7.5*scalingFactor)
    circle(x, y, d)
    stroke(h, s, b, 10)
    strokeWeight(7*scalingFactor)
    circle(x, y, d)
    strokeWeight(6.5*scalingFactor)
    circle(x, y, d)
    strokeWeight(6*scalingFactor)
    circle(x, y, d)
    strokeWeight(5.5*scalingFactor)
    circle(x, y, d)
    strokeWeight(5*scalingFactor)
    circle(x, y, d)
    strokeWeight(4.5*scalingFactor)
    circle(x, y, d)
    strokeWeight(4*scalingFactor)
    circle(x, y, d)
    strokeWeight(3.5*scalingFactor)
    circle(x, y, d)
    strokeWeight(3*scalingFactor)
    circle(x, y, d)
    strokeWeight(2.5*scalingFactor)
    circle(x, y, d)
    strokeWeight(2*scalingFactor)
    circle(x, y, d)
    strokeWeight(1.5*scalingFactor)
    circle(x, y, d)

    let millisPerIteration = 1500
    if (millis() % millisPerIteration < millisPerIteration*3/4) {
        stroke(h, s, b, 30)
        strokeWeight(3 * scalingFactor)
        circle(x, y, (millis()%millisPerIteration)*d*4/3/millisPerIteration)
    }
}

function displayShiva(position, type, messageBox, sizeOfTorso) {
    push()
    translateToCenterOfBoard()
    noFill()
    let x = position[0]
    let y = position[1]
    if (type === "clone") {
        stroke(0, 0, 80)
    } else {
        stroke(220, 50, 100)
    }

    strokeWeight(sizeOfTorso/2)
    // torso
    line(x, y - sizeOfTorso, x, y)

    strokeWeight(sizeOfTorso/4)
    // legs
    line(x - sizeOfTorso/3, y + sizeOfTorso, x - sizeOfTorso/8, y)
    line(x + sizeOfTorso/3, y + sizeOfTorso, x + sizeOfTorso/8, y)


    // head
    circle(x, y - sizeOfTorso*5/3, sizeOfTorso)

    // arms
    line(x - sizeOfTorso*2/3, y - sizeOfTorso*2/3, x, y - sizeOfTorso)
    line(x - sizeOfTorso/3, y - sizeOfTorso/3, x - sizeOfTorso*2/3, y - sizeOfTorso*2/3)
    line(x + sizeOfTorso*2/3, y - sizeOfTorso*2/3, x, y - sizeOfTorso)
    line(x + sizeOfTorso/3, y - sizeOfTorso/3, x + sizeOfTorso*2/3, y - sizeOfTorso*2/3)


    // message box
    strokeWeight(sizeOfTorso/5)
    if (messageBox) {
        fill(0, 0, 100)
        rect(x - textWidth("   " + messageBox)/2, y - sizeOfTorso*15/4, x + textWidth("   " + messageBox)/2, y - sizeOfTorso*5/2)

        noStroke()
        fill(0, 0, 0)
        textAlign(CENTER, CENTER)
        text(messageBox, x, y - sizeOfTorso*13/4)
        textAlign(LEFT, BOTTOM)
    }



    pop()
}

function displayFatebreaker(position, raisedArm) {
    push()
    translateToCenterOfBoard()
    noFill()
    let x = position[0]
    let y = position[1]
    let sizeOfTorso = 15*scalingFactor

    // now just display a person

    // legs
    strokeWeight(sizeOfTorso/4)
    line(x - sizeOfTorso/3, y + sizeOfTorso, x - sizeOfTorso/8, y)
    line(x + sizeOfTorso/3, y + sizeOfTorso, x + sizeOfTorso/8, y)

    // body
    strokeWeight(sizeOfTorso/2)
    line(x, y - sizeOfTorso, x, y)

    // arms
    strokeWeight(sizeOfTorso/5)
    line(x - sizeOfTorso*2/3, y - sizeOfTorso*5/6, x, y - sizeOfTorso)
    line(x - sizeOfTorso/3, y - sizeOfTorso/3, x - sizeOfTorso*2/3, y - sizeOfTorso*5/6)

    // for the right arm, it could be raised and carrying a sword
    if (raisedArm) {
        line(x, y - sizeOfTorso, x + sizeOfTorso/2, y - sizeOfTorso)
        line(x + sizeOfTorso/4, y - sizeOfTorso*19/16, x + sizeOfTorso/2, y - sizeOfTorso)

        // sword
        strokeWeight(sizeOfTorso/10)
        line(x, y - sizeOfTorso*6.5/3, x, y - sizeOfTorso*7/3)
        triangle(x - sizeOfTorso/6, y - sizeOfTorso*7/3, x + sizeOfTorso/6, y - sizeOfTorso*7/3, x, y - sizeOfTorso*10/3)
    } else {
        line(x + sizeOfTorso*2/3, y - sizeOfTorso*5/6, x, y - sizeOfTorso)
        line(x + sizeOfTorso/3, y - sizeOfTorso/3, x + sizeOfTorso*2/3, y - sizeOfTorso*5/6)
    }

    // head
    strokeWeight(sizeOfTorso/6)
    circle(x, y - sizeOfTorso*5/3, sizeOfTorso)

    pop()
}

// this green dot is basically displayGreenDot, but the size is tweakable
// use the other functions if you are lazy and do not want to specify a size
function displayCustomizableGreenDot(x, y, size) {
    push()
    translateToCenterOfBoard()
    stroke(120, 100, 100)

    // if you mouse over it, dim it
    if (sqrt((mouseX - x - (mainBodyX + mainBodyWidth/2))**2 +
        (mouseY - y - (mainBodyY + mainBodyHeight/2))**2) < size*1/2) {
        stroke(120, 100, 80)
    }
    noFill()
    strokeWeight(scalingFactor)
    circle(x, y, size)
    pop()
}

// display a green dot for where to go
function displayGreenDot(x, y) {
    push()
    translateToCenterOfBoard()
    stroke(120, 100, 100)

    // if you mouse over it, dim it
    if (sqrt((mouseX - x - (mainBodyX + mainBodyWidth/2))**2 +
        (mouseY - y - (mainBodyY + mainBodyHeight/2))**2) < 7.5*scalingFactor) {
        stroke(120, 100, 80)
    }
    fill(120, 100, 100, 0)
    strokeWeight(scalingFactor)
    circle(x, y, 15*scalingFactor)
    pop()
}

// displays- a smaller green dot if you're in a tight spot
function displaySmallGreenDot(x, y) {
    push()
    translateToCenterOfBoard()
    stroke(120, 100, 100)

    // if you mouse over it, dim it
    if (sqrt((mouseX - x - (mainBodyX + mainBodyWidth/2))**2 +
        (mouseY - y - (mainBodyY + mainBodyHeight/2))**2) < 5*scalingFactor) {
        stroke(120, 100, 80)
    }
    fill(120, 100, 100, 0)
    strokeWeight(scalingFactor)
    circle(x, y, 10*scalingFactor)
    pop()
}

function displayCharacterPositions() {
    fill(220, 70, 80)
    noStroke()
    let size = 16*scalingFactor
    circle(realMT.x, realMT.y, size)
    circle(realOT.x, realOT.y, size)
    fill(120, 70, 80)
    circle(realH1.x, realH1.y, size)
    circle(realH2.x, realH2.y, size)
    fill(0, 70, 80)
    circle(realM1.x, realM1.y, size)
    circle(realM2.x, realM2.y, size)
    circle(realR1.x, realR1.y, size)
    circle(realR2.x, realR2.y, size)

    // display your role
    fill(50, 100, 60)
    stroke(0, 0, 100)
    strokeWeight(scalingFactor*1.5)
    switch (role) {
        case "MT":
            circle(realMT.x, realMT.y, size)
            break
        case "OT":
            circle(realOT.x, realOT.y, size)
            break
        case "H1":
            circle(realH1.x, realH1.y, size)
            break
        case "H2":
            circle(realH2.x, realH2.y, size)
            break
        case "M1":
            circle(realM1.x, realM1.y, size)
            break
        case "M2":
            circle(realM2.x, realM2.y, size)
            break
        case "R1":
            circle(realR1.x, realR1.y, size)
            break
        case "R2":
            circle(realR2.x, realR2.y, size)
            break
    }

    fill(0, 0, 100)
    stroke(0, 0, 100)
    strokeWeight(size/30)
    textSize(size*fontScalingFactor/2)
    textAlign(CENTER, CENTER)
    text("MT", realMT.x, realMT.y - scalingFactor)
    text("OT", realOT.x, realOT.y - scalingFactor)
    text("H1", realH1.x, realH1.y - scalingFactor)
    text("H2", realH2.x, realH2.y - scalingFactor)
    text("M1", realM1.x, realM1.y - scalingFactor)
    text("M2", realM2.x, realM2.y - scalingFactor)
    text("R1", realR1.x, realR1.y - scalingFactor)
    text("R2", realR2.x, realR2.y - scalingFactor)
}

// an image that is rotated. it's that simple
function displayRotatedImage(i, x, y, width=i.width, height=i.height, rotation) {
    push()
    translate(x + width/2, y + width/2)
    rotate(rotation)
    image(i, -width/2, -height/2, width, height)
    pop()
}

function displayLavaPuddle(i, x, y, spawnTime, size) {

}

function displayBoss(i, x, y, size, facing) {
    displayRotatedImage(i, centerOfBoard[0] + x - size/2, centerOfBoard[1] + y - size/2, size, size, goodAtan2(facing[0]-x, facing[1]-y) + PI/2 + 0.01)
}

function displayArenaTransition() {
    push()
    fill(0, 0, 100)
    noStroke()
    translateToCenterOfBoard()
    if (millis() - stageStarted < 10) {
        erase()
        rect(-10000, -10000, 10000, 10000)
        noErase()
        rect(-mainBodyWidth/2, -mainBodyWidth/2, mainBodyWidth/2, mainBodyWidth/2)
    }
    pop()
}

function displayIncomingArenaTransition() {
    push()
    translateToCenterOfBoard()
    stroke(0, 0, 100, 20)
    strokeWeight(10*scalingFactor)
    noFill()
    circle(0, 0, ((millis() - stageStarted)%1000)*mainBodyWidth/700)
    circle(0, 0, ((millis() - stageStarted+500)%1000)*mainBodyWidth/700)
    pop()
}

function displayM12SP2PlayerClones(stage, cardinalsFirst, tethers) {
    let radius = 100*scalingFactor
    let diagXY = radius*sqrt(2)/2
    let positions = cardinalsFirst ? [[0, -radius], [radius, 0], [0, radius], [-radius, 0]]
                                   : [[diagXY, -diagXY], [diagXY, diagXY], [-diagXY, diagXY], [-diagXY, -diagXY]]
    let people = cardinalsFirst ? [tethers[0], tethers[2], tethers[4], tethers[6]]
                                : [tethers[1], tethers[3], tethers[5], tethers[7]]
    for (let i = 0; i < 4; i++) {
        push()
        translateToCenterOfBoard()
        translate(...positions[i])
        let person = people[i]
        let size = 50*scalingFactor
        let actualSize = 30*scalingFactor
        noStroke()
        fill(0, 0, 50)
        circle(0, 0, actualSize)
        fill(0, 0, 100)
        textSize(actualSize)
        if (stage < 3) {
            text("?", 0, -actualSize / 5)
        } else {
            textSize(actualSize/2)
            text(person, 0, -actualSize / 10)
        }
        if (stage === 0 && millis() - stageStarted < 2000) {
            glowLine(200, 50, 100, 40, 10, -size/2, size/2-(millis()-stageStarted)*(size/2000), size/2, size/2-(millis()-stageStarted)*(size/2000))
        }
        if (stage === 2) {
            glowLine(60, 20, 100, 30, 5, 0, 0, currentRealPosition(person)[0] - positions[i][0], currentPosition(person)[1] - positions[i][1])
        }
        pop()
    }
}

function displayConeTelegraph(h, s, b, a, x, y, angle, size) {
    push()
    noStroke()
    fill(h, s, b, a)
    stroke(h, s, b, a*2)
    translate(x, y)
    translateToCenterOfBoard()
    rotate(angle)
    arc(0, 0, 10000, 10000, -size/2, size/2, PIE)
    strokeWeight(10*scalingFactor)
    stroke(h, s, b, a*4)
    noFill()
    arc(0, 0, ((millis() - stageStarted) % 1000) * (mainBodyWidth/500), ((millis() - stageStarted) % 1000) * (mainBodyWidth/500), -size/2, size/2, OPEN)

    pop()
}

function displayCircleTelegraph(h, s, b, a, x, y, d) {
    push()
    noStroke()
    fill(h, s, b, a)
    stroke(h, s, b, a*2)
    translate(x, y)
    translateToCenterOfBoard()
    circle(0, 0, d)

    strokeWeight(d/20)
    stroke(h, s, b, a*4)
    noFill()
    circle(0, 0, ((millis() - stageStarted) % 1000) * (d/1000))

    pop()
}



//———————————————————————————————find your role———————————————————————————————\\

function meleeOrRanged(role) {
    if (role === "MT" || role === "OT" || role === "M1" || role === "M2") {return "melee"}
    return "ranged"
} // melee/ranged

function DPSOrSupports(role) {
    if (role === "MT" || role === "OT" || role === "H1" || role === "H2") {return "supports"}
    return "DPS"
} // DPS/supports

function DPSOrSupport(role) {
    if (role === "MT" || role === "OT" || role === "H1" || role === "H2") {return "support"}
    return "DPS"
} // DPS/support

function lightParty() {
    if (role === "MT" || role === "R1" || role === "H1" || role === "M1") {return 1}
    return 2
} // 1/2

// FRU color:
// MT, R1 = red
// OT, R2 = yellow
// H2, M2 = blue
// M1, H1 = purple
//     MT
//   R1  R2
// OT      H1
//   M1  M2
//     H2
function FRUColor(role) {
    switch (role) {
        case "MT":
            return "red"
        case "OT":
            return "yellow"
        case "M1":
            return "purple"
        case "M2":
            return "blue"
        case "R1":
            return "red"
        case "R2":
            return "yellow"
        case "H1":
            return "purple"
        case "H2":
            return "blue"
    }
} // red/yellow/blue/purple (FRU)

// FRU waymarks:
//       A
//   1   MT   2
//     R1  R2
// D OT      H1 B
//     M1  M2
//   4   H2   3
//        C
function FRUWaymark(role) {
    switch (role) {
        case "MT":
            return "A"
        case "OT":
            return "B"
        case "M1":
            return "4"
        case "M2":
            return "3"
        case "R1":
            return "1"
        case "R2":
            return "2"
        case "H1":
            return "D"
        case "H2":
            return "C"
    }
} // any waymark (FRU)

//—————————————————————————————find your position—————————————————————————————\\

// because it's super annoying when you have to write a switch statement
function yourPosition() {
    return currentPosition(role)
}

function yourRealPosition() {
    return currentRealPosition(role)
}

function currentPosition(role) {
    switch (role) {
        case "MT":
            return MT
        case "OT":
            return OT
        case "M1":
            return M1
        case "M2":
            return M2
        case "R1":
            return R1
        case "R2":
            return R2
        case "H1":
            return H1
        case "H2":
            return H2
    }
}

function currentRealPosition(role) {
    switch (role) {
        case "MT":
            return [realMT.x, realMT.y]
        case "OT":
            return [realOT.x, realOT.y]
        case "M1":
            return [realM1.x, realM1.y]
        case "M2":
            return [realM2.x, realM2.y]
        case "R1":
            return [realR1.x, realR1.y]
        case "R2":
            return [realR2.x, realR2.y]
        case "H1":
            return [realH1.x, realH1.y]
        case "H2":
            return [realH2.x, realH2.y]
    }
}

//——————————————————————————setup mechanic functions——————————————————————————\\

function reset() {
    // switch (currentlySelectedMechanic) {
    //     case "Utopian Sky":
    //         setupUtopianSky()
    //         break
    //     case "Diamond Dust":
    //         setupDiamondDust()
    //         break
    //     case "Mirror Mirror":
    //         setupMirrorMirror()
    //         break
    //     case "Millennial Decay":
    //         setupMillennialDecay()
    //         break
    //     case "Wingmark":
    //         setupWingmark()
    //         break
    // }


    // ChatGPT generated response—now I don't have to update "reset" every time
    let setupFunctionName = "setup" + currentlySelectedMechanic.replace(/\s/g, '');
    let setupFunction = window[setupFunctionName];

    if (typeof setupFunction === "function") {
        setupFunction();
    } else {
        console.warn(`No setup function found for: ${currentlySelectedMechanic}`);
    }
}

// function setupUtopianSky() {
//     erase()
//     rect(0, 0, width, height)
//     noErase()
//
//     setMovementMode(defaultMovementMode)
//
//     mechanicStarted = millis()
//
//     fruP1Image = loadImage('data/FRU P1/Floor.png')
//     utopianSkyFog = loadImage('data/FRU P1/Utopian Sky fogGrain2.jpg')
//
//     stage = 0
//     currentlySelectedMechanic = "Utopian Sky"
//     currentlySelectedBackground = "FRU P1"
//
//     numWinsPerCoinIncrease = 4
//
//     MT = [0, -50*scalingFactor]
//     OT = [50*scalingFactor, 0]
//     H1 = [-50*scalingFactor, 0]
//     H2 = [0, 50*scalingFactor]
//     M1 = [-35*scalingFactor, 35*scalingFactor]
//     M2 = [35*scalingFactor, 35*scalingFactor]
//     R1 = [-35*scalingFactor, -35*scalingFactor]
//     R2 = [35*scalingFactor, -35*scalingFactor]
//
//     // now we'll have to set up which clones are unsafe
//     unsafeClones = []
//     // that'll start with which direction is safe, represented by which
//     // people will stay at the edge
//     safeDirections = random(["MT H2", "OT M1", "R2 H1", "M2 R1"])
//     // then, from each unsafe direction, choose which side (or, rather,
//     // which person) has the unsafe clone
//     if (safeDirections === "MT H2") {
//         unsafeClones = [random(["OT", "M1"]), random(["R2", "H1"]), random(["M2", "R1"])]
//     } if (safeDirections === "OT M1") {
//         unsafeClones = [random(["MT", "H2"]), random(["R2", "H1"]), random(["M2", "R1"])]
//     } if (safeDirections === "R2 H1") {
//         unsafeClones = [random(["MT", "H2"]), random(["OT", "M1"]), random(["M2", "R1"])]
//     } if (safeDirections === "M2 R1") {
//         unsafeClones = [random(["MT", "H2"]), random(["OT", "M1"]), random(["R2", "H1"])]
//     }
//
//     spreadOrStack = random(["spread", "stack"])
//
//     // make the background.
//     let css = select("html")
//     css.style("background-image", "url(\"data/FRU P1/BG.png\")")
//     css = select("body")
//     css.style("background-image", "url(\"data/FRU P1/BG.png\")")
//
//     textAtTop = "This is my first simulation and it is sloppy. Also," +
//         " please remember that it's " + spreadOrStack +
//         "s first.\n\nThe way the simulation works can be a bit confusing." +
//         " You'll get the hang of it eventually. Ready? Click on the green" +
//         " dot in the center."
//     textAtBottom = "You went to your default starting spot for this" +
//         " simulation. \n[PASS] — You got to this page."
//
//     instructions.html(`<pre>
// numpad 1 → freeze sketch
//
// Click on one of the buttons at the top to do what it says.
//     Purge Data will purge the win/loss data for this mechanic and only the currently
//      selected mechanic.
//
// Want your coin count back?
// 1. Open Devtools with F12 (on Windows, please search if using Mac)
// 2. Use the command "localStorage.getItem("coins")". I won't tell you how to set coins.
// Coins are still affecting your favicon.
//
// You are currently on the mechanic Utopian Sky.
// Click on any green dot to move to that location.
// Your time can be found at the bottom of the rectangle just above the simulation arena.
// The time that you cleared can be found on the bottom window after you have cleared.
// This is a quiz, so make sure you've studied.
//
// ${updates}
// </pre>`)
// }

function setupUtopianSky() {
    erase()
    rect(0, 0, width, height)
    noErase()

    setMovementMode(defaultMovementMode)

    mechanicStarted = millis()

    let fruP1Image = loadImage('data/FRU P1/Floor.png')

    stage = 0
    currentlySelectedMechanic = "Utopian Sky"
    currentlySelectedBackground = "FRU P1"

    numWinsPerCoinIncrease = 4

    // position everyone in clock spots
    MT = [0, -50*scalingFactor]
    OT = [50*scalingFactor, 0]
    H1 = [-50*scalingFactor, 0]
    H2 = [0, 50*scalingFactor]
    M1 = [-35*scalingFactor, 35*scalingFactor]
    M2 = [35*scalingFactor, 35*scalingFactor]
    R1 = [-35*scalingFactor, -35*scalingFactor]
    R2 = [35*scalingFactor, -35*scalingFactor]

    // now we'll have to set up which clones are unsafe
    let unsafeClones = []
    // that'll start with which direction is safe, represented by which
    // people will stay at the edge
    let safeDirections = random(["MT H2", "OT M1", "R2 H1", "M2 R1"])
    // then, from each unsafe direction, choose which side (or, rather,
    // which person) has the unsafe clone
    if (safeDirections === "MT H2") {
        unsafeClones = [random(["OT", "M1"]), random(["R2", "H1"]), random(["M2", "R1"])]
    } if (safeDirections === "OT M1") {
        unsafeClones = [random(["MT", "H2"]), random(["R2", "H1"]), random(["M2", "R1"])]
    } if (safeDirections === "R2 H1") {
        unsafeClones = [random(["MT", "H2"]), random(["OT", "M1"]), random(["M2", "R1"])]
    } if (safeDirections === "M2 R1") {
        unsafeClones = [random(["MT", "H2"]), random(["OT", "M1"]), random(["R2", "H1"])]
    }

    let spreadOrStack = random(["spread", "stack"])

    // make the background.
    let css = select("html")
    css.style("background-image", "url(\"data/FRU P1/BG.png\")")
    css = select("body")
    css.style("background-image", "url(\"data/FRU P1/BG.png\")")

    textAtTop = "This is my first simulation and it is designed for testing," +
        " not actual use. It will likely be deleted soon. Also," +
        " please remember that it's " + spreadOrStack +
        "s first. If you're ready, click on the green dot in the center."
    textAtBottom = "You went to your default starting spot for this" +
        " simulation. \n[PASS] — You got to this page."

    let yourAngle
    switch (role) {
        case "R2":
            yourAngle = 0
            break
        case "OT":
            yourAngle = 7*PI/4
            break
        case "MT":
            yourAngle = 3*PI/2
            break
        case "R1":
            yourAngle = 5*PI/4
            break
        case "H1":
            yourAngle = PI
            break
        case "M1":
            yourAngle = 3*PI/4
            break
        case "H2":
            yourAngle = PI/2
            break
        case "M2":
            yourAngle = PI/4
            break
    }

    let yourOpposite
    switch (role) {
        case "R2":
            yourOpposite = "H1"
            break
        case "OT":
            yourOpposite = "M1"
            break
        case "MT":
            yourOpposite = "H2"
            break
        case "R1":
            yourOpposite = "M2"
            break
        case "H1":
            yourOpposite = "R2"
            break
        case "M1":
            yourOpposite = "OT"
            break
        case "H2":
            yourOpposite = "MT"
            break
        case "M2":
            yourOpposite = "R1"
            break
    }

    let arenaRotation = 0.02
    script = {
        // stage 0: at the beginning
        0: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display a mini fatebreaker that's blue if it's spread and
                // red if it's stack
                {"name": "stroke", "args": spreadOrStack === "spread" ? [240, 60, 100] : [5, 60, 100]},
                {"name": "displayFatebreaker", "args": [[0, 0], false]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [0, 0]}
            ],
            "greendots": [
                {
                    "x": 0,
                    "y": 0,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": 0.5,
                        "positions": {
                            // position at the edge of the arena
                            "MT": [0, -160*scalingFactor],
                            "R2": [160*scalingFactor, 0],
                            "H1": [-160*scalingFactor, 0],
                            "H2": [0, 160*scalingFactor],
                            "M1": [-113*scalingFactor, 113*scalingFactor],
                            "M2": [113*scalingFactor, 113*scalingFactor],
                            "R1": [-113*scalingFactor, -113*scalingFactor],
                            "OT": [113*scalingFactor, -113*scalingFactor]
                        },
                        "yourPosition": false,
                        "changeMovementType": false,
                        "textAtTop": "Wait for everyone to get to their spot.",
                        "textAtBottom": "[PASS] — You clicked on the dot in the center.",
                        "backgroundChange": false,
                        "fail": false,
                        "pass": false
                    }
                }
            ],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 0.5: going to the spot
        0.5: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display a mini fatebreaker that's blue if it's spread and
                // red if it's stack
                {"name": "stroke", "args": spreadOrStack === "spread" ? [240, 60, 100] : [5, 60, 100]},
                {"name": "displayFatebreaker", "args": [[0, 0], false]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": 1,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Select whether to go in or stay out based on whether your clone has a raised sword or not.",
                "textAtBottom": false,
                "backgroundChange": 'data/FRU P1/Utopian Sky fogGrain2.jpg',
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 1: display clone & go in if you need to
        1: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor]},
                {"name": "displayGreenDot", "args": [cos(yourAngle)*160*scalingFactor, sin(yourAngle)*160*scalingFactor]}
            ],
            "greendots": [
                {
                    "x": cos(yourAngle)*100*scalingFactor,
                    "y": sin(yourAngle)*100*scalingFactor,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": (unsafeClones.includes(role) ? 2.5 : 101),
                        "positions": {
                            // move in if needed
                            "MT": [0, -(unsafeClones.includes("MT") || unsafeClones.includes("H2") ? 100 : 165)*scalingFactor],
                            "R2": [(unsafeClones.includes("R2") || unsafeClones.includes("H1") ? 100 : 165)*scalingFactor, 0],
                            "H1": [-(unsafeClones.includes("H1") || unsafeClones.includes("R2") ? 100 : 165)*scalingFactor, 0],
                            "H2": [0, (unsafeClones.includes("H2") || unsafeClones.includes("MT") ? 100 : 165)*scalingFactor],
                            "M1": [-(unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor],
                            "M2": [(unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor],
                            "R1": [-(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor],
                            "OT": [(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor]
                        },
                        "yourPosition": [cos(yourAngle)*100*scalingFactor,
                            sin(yourAngle)*100*scalingFactor],
                        "changeMovementType": false,
                        "textAtTop": (unsafeClones.includes(role) ?
                            "Wait for everyone to move in." :
                            "You moved in when your clone's arm wasn't raised. This may not directly cause a wipe but it causes confusion."),
                        "textAtBottom": "You moved in.\n" + (unsafeClones.includes(role) ?
                            "[PASS] — Your clone's arm is raised." :
                            "[FAIL] — Your clone's arm isn't raised."),
                        "backgroundChange": false,
                        "fail": !unsafeClones.includes(role),
                        "pass": false
                    }
                },
                {
                    "x": cos(yourAngle)*160*scalingFactor,
                    "y": sin(yourAngle)*160*scalingFactor,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": (!unsafeClones.includes(role) ? 1.5 : 101),
                        "positions": {
                            // move in if needed
                            "MT": [0, -(unsafeClones.includes("MT") ? 100 : 160)*scalingFactor],
                            "R2": [(unsafeClones.includes("R2") ? 100 : 160)*scalingFactor, 0],
                            "H1": [-(unsafeClones.includes("H1") ? 100 : 160)*scalingFactor, 0],
                            "H2": [0, (unsafeClones.includes("H2") ? 100 : 160)*scalingFactor],
                            "M1": [-(unsafeClones.includes("M1") ? 71 : 113)*scalingFactor, (unsafeClones.includes("M1") ? 71 : 113)*scalingFactor],
                            "M2": [(unsafeClones.includes("M2") ? 71 : 113)*scalingFactor, (unsafeClones.includes("M2") ? 71 : 113)*scalingFactor],
                            "R1": [-(unsafeClones.includes("R1") ? 71 : 113)*scalingFactor, -(unsafeClones.includes("R1") ? 71 : 113)*scalingFactor],
                            "OT": [(unsafeClones.includes("OT") ? 71 : 113)*scalingFactor, -(unsafeClones.includes("OT") ? 71 : 113)*scalingFactor]
                        },
                        "yourPosition": [cos(yourAngle)*160*scalingFactor,
                            sin(yourAngle)*160*scalingFactor],
                        "changeMovementType": false,
                        "textAtTop": (!unsafeClones.includes(role) ?
                            "Wait for everyone to move in." :
                            "You forgot to move in when your clone's arm was raised. This may not directly cause a wipe but it causes confusion."),
                        "textAtBottom": "You stayed out.\n" + (!unsafeClones.includes(role) ?
                            "[PASS] — Your clone's arm isn't raised." :
                            "[FAIL] — Your clone's arm is raised."),
                        "backgroundChange": false,
                        "fail": unsafeClones.includes(role),
                        "pass": false
                    }
                }
            ],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 101: wrong place
        101: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 1.5: going to the spot
        1.5: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": 2,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "There's still another possibility where you have to move in.",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 2: display clone & go in if you need to
        2: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor]},
                {"name": "displayGreenDot", "args": [cos(yourAngle)*160*scalingFactor, sin(yourAngle)*160*scalingFactor]}
            ],
            "greendots": [
                {
                    "x": cos(yourAngle)*100*scalingFactor,
                    "y": sin(yourAngle)*100*scalingFactor,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": (unsafeClones.includes(yourOpposite) ? 2.5 : 102),
                        "positions": {
                            // move in if needed
                            "MT": [0, -(unsafeClones.includes("MT") || unsafeClones.includes("H2") ? 100 : 165)*scalingFactor],
                            "R2": [(unsafeClones.includes("R2") || unsafeClones.includes("H1") ? 100 : 165)*scalingFactor, 0],
                            "H1": [-(unsafeClones.includes("H1") || unsafeClones.includes("R2") ? 100 : 165)*scalingFactor, 0],
                            "H2": [0, (unsafeClones.includes("H2") || unsafeClones.includes("MT") ? 100 : 165)*scalingFactor],
                            "M1": [-(unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor],
                            "M2": [(unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor],
                            "R1": [-(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor],
                            "OT": [(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor]
                        },
                        "yourPosition": [cos(yourAngle)*100*scalingFactor,
                            sin(yourAngle)*100*scalingFactor],
                        "changeMovementType": false,
                        "textAtTop": (unsafeClones.includes(yourOpposite) ?
                            "Wait for everyone to move in." :
                            "You moved in when the opposite person didn't. This may not directly cause a wipe but it causes confusion."),
                        "textAtBottom": "You moved in.\n" + (unsafeClones.includes(yourOpposite) ?
                            "[PASS] — The person opposite you did move in." :
                            "[FAIL] — The person opposite you didn't move in."),
                        "backgroundChange": false,
                        "fail": !unsafeClones.includes(yourOpposite),
                        "pass": false
                    }
                },
                {
                    "x": cos(yourAngle)*160*scalingFactor,
                    "y": sin(yourAngle)*160*scalingFactor,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": (!unsafeClones.includes(yourOpposite) ? 2.5 : 102),
                        "positions": {
                            // move in if needed
                            "MT": [0, -(unsafeClones.includes("MT") || unsafeClones.includes("H2") ? 100 : 165)*scalingFactor],
                            "R2": [(unsafeClones.includes("R2") || unsafeClones.includes("H1") ? 100 : 165)*scalingFactor, 0],
                            "H1": [-(unsafeClones.includes("H1") || unsafeClones.includes("R2") ? 100 : 165)*scalingFactor, 0],
                            "H2": [0, (unsafeClones.includes("H2") || unsafeClones.includes("MT") ? 100 : 165)*scalingFactor],
                            "M1": [-(unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M1") || unsafeClones.includes("OT") ? 71 : 116.5)*scalingFactor],
                            "M2": [(unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor, (unsafeClones.includes("M2") || unsafeClones.includes("R1") ? 71 : 116.5)*scalingFactor],
                            "R1": [-(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("R1") || unsafeClones.includes("M2") ? 71 : 116.5)*scalingFactor],
                            "OT": [(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor, -(unsafeClones.includes("OT") || unsafeClones.includes("M1") ? 71 : 116.5)*scalingFactor]
                        },
                        "yourPosition": [cos(yourAngle)*165*scalingFactor,
                            sin(yourAngle)*165*scalingFactor],
                        "changeMovementType": false,
                        "textAtTop": (unsafeClones.includes(yourOpposite) ?
                            "Wait for everyone to move in." :
                            "You forgot to move in when the opposite person didn't. This may not directly cause a wipe but it causes confusion."),
                        "textAtBottom": "You moved in.\n" + (!unsafeClones.includes(yourOpposite) ?
                            "[PASS] — The person opposite you didn't move in." :
                            "[FAIL] — The person opposite you did move in."),
                        "backgroundChange": false,
                        "fail": unsafeClones.includes(yourOpposite),
                        "pass": false
                    }
                }
            ],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 102: wrong place
        102: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 2.5: going to the spot
        2.5: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // display clone with arm raised or not
                {"name": "stroke", "args": [0, 0, 80]},
                {"name": "displayFatebreaker", "args": [[cos(yourAngle)*100*scalingFactor, sin(yourAngle)*100*scalingFactor], unsafeClones.includes(role)]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": 3,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Where's your spread/stack spot?",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 3: spread/stack spot
        3: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // everything ordinary except there are 40 instances of
                // displayGreenDot added later in this function via a loop
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 103: wrong place
        103: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // just normal
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": 104,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 104: wrong place, display spread spots
        104: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // just normal
                {"name": "displayUtopianSkyBlastingZone", "args": [unsafeClones]},
                {"name": "displayUtopianSkySpreadOrStack", "args": [spreadOrStack]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 3.5: going to spread spots
        3.5: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // just normal
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": 99,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Congrats! You cleared this test mechanic.",
                "textAtBottom": "cleared",
                "backgroundChange": false,
                "pass": true
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 99: mechanic complete, display spread spots
        99: {
            "arena": fruP1Image,
            "arenaRotation": arenaRotation,
            "functions": [
                // spread/stack too
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayUtopianSkyBlastingZone", "args": [unsafeClones]},
                {"name": "displayUtopianSkySpreadOrStack", "args": [spreadOrStack]}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
    }

    // for stage 3 (spread/stack spot), there are 40 dots—5 for each angle.
    // there are 8 angles, corresponding to each clock spot spaced evenly
    // around the arena, and then there are 4 spread spots in each angle and
    // 1 stack spot.
    let greenDotsStage3 = []
    for (let angle = 0; angle < TWO_PI-PI/8; angle += PI/4) {
        greenDotsStage3.push(
            [cos(angle)*165*scalingFactor, sin(angle)*165*scalingFactor], // stack spot
            [cos(angle)*140*scalingFactor, sin(angle)*140*scalingFactor], // inner spread spot (tanks)
            [cos(angle)*190*scalingFactor, sin(angle)*190*scalingFactor], // outer spread spot (healers)
            [cos(angle - PI/12)*190*scalingFactor, sin(angle - PI/12)*190*scalingFactor], // left spread spot facing wall (ranged)
            [cos(angle + PI/12)*190*scalingFactor, sin(angle + PI/12)*190*scalingFactor] // right spread spot facing wall (melee)
        )
    }

    // add the green dots to the display
    for (let greenDot of greenDotsStage3) {
        script[3].functions.push({"name": "displayGreenDot", "args": greenDot})
    }

    // then, we're going to add the green dot data that makes for what
    // happens when you click on it. 3 variables (LP, clockspot, & safespot)
    // are constantly updated with each angle to ensure correct treatment is
    // given.
    let greendots = []
    let LP = 2
    let clockspot = "R2"
    let safespot = "R2 H1"
    let safeAngleLP2 = safeDirections === "OT M1" ? -PI/4 : safeDirections === "R2 H1" ? 0 : safeDirections === "M2 R1" ? PI/4 : PI/2
    let safeAngleLP1 = safeAngleLP2 - PI
    for (let angle = 0; angle < TWO_PI-PI/8; angle += PI/4) {
        greendots.push(
            // stack spot
            // valid if:
            // 1. you are in the correct light party
            // 2. you are on the correct side
            // 3. it's stacks
            {
                "x": cos(angle)*165*scalingFactor,
                "y": sin(angle)*165*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": spreadOrStack === "spread" ? 103 : (safespot === safeDirections ? (lightParty() === LP ? 3.5 : 103) : 103),
                    "positions": spreadOrStack === "spread" ? {
                        "MT": [cos(safeAngleLP1)*140*scalingFactor, sin(safeAngleLP1)*140*scalingFactor],
                        "H1": [cos(safeAngleLP1)*190*scalingFactor, sin(safeAngleLP1)*190*scalingFactor],
                        "M1": [cos(safeAngleLP1 + PI/12)*190*scalingFactor, sin(safeAngleLP1 + PI/12)*190*scalingFactor],
                        "R1": [cos(safeAngleLP1 - PI/12)*190*scalingFactor, sin(safeAngleLP1 - PI/12)*190*scalingFactor],
                        "OT": [cos(safeAngleLP2)*140*scalingFactor, sin(safeAngleLP2)*140*scalingFactor],
                        "H2": [cos(safeAngleLP2)*190*scalingFactor, sin(safeAngleLP2)*190*scalingFactor],
                        "M2": [cos(safeAngleLP2 + PI/12)*190*scalingFactor, sin(safeAngleLP2 + PI/12)*190*scalingFactor],
                        "R2": [cos(safeAngleLP2 - PI/12)*190*scalingFactor, sin(safeAngleLP2 - PI/12)*190*scalingFactor],
                    } : {
                        "MT": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "OT": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                    },
                    "yourPosition": [cos(angle)*165*scalingFactor, sin(angle)*165*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": spreadOrStack === "stack" && lightParty() === LP && safespot === safeDirections ?
                        "Waiting for everyone to get into position." :
                        "You went to the wrong spot. You need to make sure:\n" +
                        (lightParty() === LP ? "☒" : "☐") + " You are on the correct LP/side.\n" +
                        (safespot === safeDirections ? "☒" : "☐") + " You are on the person who hasn't moved in.\n" +
                        (spreadOrStack === "stack" ? "☒" : "☐") + " It's stacks. This specific spot is for stacking.",
                    "textAtBottom": "You went to the stack position at " + clockspot + "'s clockspot.\n" + (lightParty() === LP ?
                        "[PASS] — You are from LP" + LP + "." :
                        "[FAIL] — You are from LP" + lightParty() + ", but you went to an LP" + LP + " spot.") + "\n" + (safespot === safeDirections ?
                        "[PASS] — " + clockspot + "'s clockspot doesn't get hit by AoEs." :
                        "[FAIL] — " + clockspot + "'s clockspot does get hit by AoEs.") + "\n" + (spreadOrStack === "stack" ?
                        "[PASS] — It's stacks." :
                        "[FAIL] — It's spreads."),
                    "backgroundChange": false,
                    "fail": spreadOrStack === "spread" || lightParty() !== LP || safespot !== safeDirections,
                    "pass": false,
                }
            },

            // ranged spread spot
            // valid if:
            // 1. you are in the correct light party
            // 2. you are on the correct side
            // 3. it's spreads
            // 4. you're a ranged
            {
                "x": cos(angle - PI/12)*190*scalingFactor,
                "y": sin(angle - PI/12)*190*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": spreadOrStack === "stack" ? 103 : (safespot === safeDirections ? (lightParty() === LP ? ((role === "R1" || role === "R2") ? 3.5 : 103) : 103) : 103),
                    "positions": spreadOrStack === "spread" ? {
                        "MT": [cos(safeAngleLP1)*140*scalingFactor, sin(safeAngleLP1)*140*scalingFactor],
                        "H1": [cos(safeAngleLP1)*190*scalingFactor, sin(safeAngleLP1)*190*scalingFactor],
                        "M1": [cos(safeAngleLP1 + PI/12)*190*scalingFactor, sin(safeAngleLP1 + PI/12)*190*scalingFactor],
                        "R1": [cos(safeAngleLP1 - PI/12)*190*scalingFactor, sin(safeAngleLP1 - PI/12)*190*scalingFactor],
                        "OT": [cos(safeAngleLP2)*140*scalingFactor, sin(safeAngleLP2)*140*scalingFactor],
                        "H2": [cos(safeAngleLP2)*190*scalingFactor, sin(safeAngleLP2)*190*scalingFactor],
                        "M2": [cos(safeAngleLP2 + PI/12)*190*scalingFactor, sin(safeAngleLP2 + PI/12)*190*scalingFactor],
                        "R2": [cos(safeAngleLP2 - PI/12)*190*scalingFactor, sin(safeAngleLP2 - PI/12)*190*scalingFactor],
                    } : {
                        "MT": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "OT": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                    },
                    "yourPosition": [cos(angle - PI/12)*190*scalingFactor, sin(angle - PI/12)*190*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": spreadOrStack === "spread" && lightParty() === LP && safespot === safeDirections && (role === "R1" || role === "R2") ?
                        "Waiting for everyone to get into position." :
                        "You went to the wrong spot. You need to make sure:\n" +
                        (lightParty() === LP ? "☒" : "☐") + " You are on the correct LP/side.\n" +
                        (safespot === safeDirections ? "☒" : "☐") + " You are on the person who hasn't moved in.\n" +
                        (spreadOrStack === "spread" ? "☒" : "☐") + " It's spreads. This specific spot is for spreading.\n" +
                        ((role === "R1" || role === "R2") ? "☒" : "☐") + " You are a ranged. The spot that's left facing the wall is for ranged.",
                    "textAtBottom": "You went to the stack position at " + clockspot + "'s clockspot.\n" + (lightParty() === LP ?
                        "[PASS] — You are from LP" + LP + "." :
                        "[FAIL] — You are from LP" + lightParty() + ", but you went to an LP" + LP + " spot.") + "\n" + (safespot === safeDirections ?
                        "[PASS] — " + clockspot + "'s clockspot doesn't get hit by AoEs." :
                        "[FAIL] — " + clockspot + "'s clockspot does get hit by AoEs.") + "\n" + (spreadOrStack === "spread" ?
                        "[PASS] — It's spreads." :
                        "[FAIL] — It's stacks.") + "\n" + ((role === "R1" || role === "R2") ?
                        "[PASS] — You're a ranged." :
                        "[FAIL] — You're not a ranged."),
                    "backgroundChange": false,
                    "fail": spreadOrStack === "stack" || lightParty() !== LP || safespot !== safeDirections || (role !== "R1" && role !== "R2"),
                    "pass": false,
                }
            },

            // melee spread spot
            // valid if:
            // 1. you are in the correct light party
            // 2. you are on the correct side
            // 3. it's spreads
            // 4. you're a melee
            {
                "x": cos(angle + PI/12)*190*scalingFactor,
                "y": sin(angle + PI/12)*190*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": spreadOrStack === "stack" ? 103 : (safespot === safeDirections ? (lightParty() === LP ? ((role === "M1" || role === "M2") ? 3.5 : 103) : 103) : 103),
                    "positions": spreadOrStack === "spread" ? {
                        "MT": [cos(safeAngleLP1)*140*scalingFactor, sin(safeAngleLP1)*140*scalingFactor],
                        "H1": [cos(safeAngleLP1)*190*scalingFactor, sin(safeAngleLP1)*190*scalingFactor],
                        "M1": [cos(safeAngleLP1 + PI/12)*190*scalingFactor, sin(safeAngleLP1 + PI/12)*190*scalingFactor],
                        "R1": [cos(safeAngleLP1 - PI/12)*190*scalingFactor, sin(safeAngleLP1 - PI/12)*190*scalingFactor],
                        "OT": [cos(safeAngleLP2)*140*scalingFactor, sin(safeAngleLP2)*140*scalingFactor],
                        "H2": [cos(safeAngleLP2)*190*scalingFactor, sin(safeAngleLP2)*190*scalingFactor],
                        "M2": [cos(safeAngleLP2 + PI/12)*190*scalingFactor, sin(safeAngleLP2 + PI/12)*190*scalingFactor],
                        "R2": [cos(safeAngleLP2 - PI/12)*190*scalingFactor, sin(safeAngleLP2 - PI/12)*190*scalingFactor],
                    } : {
                        "MT": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "OT": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                    },
                    "yourPosition": [cos(angle + PI/12)*190*scalingFactor, sin(angle + PI/12)*190*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": spreadOrStack === "spread" && lightParty() === LP && safespot === safeDirections && (role === "M1" || role === "M2") ?
                        "Waiting for everyone to get into position." :
                        "You went to the wrong spot. You need to make sure:\n" +
                        (lightParty() === LP ? "☒" : "☐") + " You are on the correct LP/side.\n" +
                        (safespot === safeDirections ? "☒" : "☐") + " You are on the person who hasn't moved in.\n" +
                        (spreadOrStack === "spread" ? "☒" : "☐") + " It's spreads. This specific spot is for spreading.\n" +
                        ((role === "M1" || role === "M2") ? "☒" : "☐") + " You are a melee. The spot that's right facing the wall is for melee.",
                    "textAtBottom": "You went to the stack position at " + clockspot + "'s clockspot.\n" + (lightParty() === LP ?
                        "[PASS] — You are from LP" + LP + "." :
                        "[FAIL] — You are from LP" + lightParty() + ", but you went to an LP" + LP + " spot.") + "\n" + (safespot === safeDirections ?
                        "[PASS] — " + clockspot + "'s clockspot doesn't get hit by AoEs." :
                        "[FAIL] — " + clockspot + "'s clockspot does get hit by AoEs.") + "\n" + (spreadOrStack === "spread" ?
                        "[PASS] — It's spreads." :
                        "[FAIL] — It's stacks.") + "\n" + ((role === "M1" || role === "M2") ?
                        "[PASS] — You're a melee." :
                        "[FAIL] — You're not a melee."),
                    "backgroundChange": false,
                    "fail": spreadOrStack === "stack" || lightParty() !== LP || safespot !== safeDirections || (role !== "M1" && role !== "M2"),
                    "pass": false,
                }
            },

            // tank spread spot
            // valid if:
            // 1. you are in the correct light party
            // 2. you are on the correct side
            // 3. it's spreads
            // 4. you're a tank
            {
                "x": cos(angle)*140*scalingFactor,
                "y": sin(angle)*140*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": spreadOrStack === "stack" ? 103 : (safespot === safeDirections ? (lightParty() === LP ? ((role === "MT" || role === "OT") ? 3.5 : 103) : 103) : 103),
                    "positions": spreadOrStack === "spread" ? {
                        "MT": [cos(safeAngleLP1)*140*scalingFactor, sin(safeAngleLP1)*140*scalingFactor],
                        "H1": [cos(safeAngleLP1)*190*scalingFactor, sin(safeAngleLP1)*190*scalingFactor],
                        "M1": [cos(safeAngleLP1 + PI/12)*190*scalingFactor, sin(safeAngleLP1 + PI/12)*190*scalingFactor],
                        "R1": [cos(safeAngleLP1 - PI/12)*190*scalingFactor, sin(safeAngleLP1 - PI/12)*190*scalingFactor],
                        "OT": [cos(safeAngleLP2)*140*scalingFactor, sin(safeAngleLP2)*140*scalingFactor],
                        "H2": [cos(safeAngleLP2)*190*scalingFactor, sin(safeAngleLP2)*190*scalingFactor],
                        "M2": [cos(safeAngleLP2 + PI/12)*190*scalingFactor, sin(safeAngleLP2 + PI/12)*190*scalingFactor],
                        "R2": [cos(safeAngleLP2 - PI/12)*190*scalingFactor, sin(safeAngleLP2 - PI/12)*190*scalingFactor],
                    } : {
                        "MT": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "OT": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                    },
                    "yourPosition": [cos(angle)*140*scalingFactor, sin(angle)*140*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": spreadOrStack === "spread" && lightParty() === LP && safespot === safeDirections && (role === "MT" || role === "OT") ?
                        "Waiting for everyone to get into position." :
                        "You went to the wrong spot. You need to make sure:\n" +
                        (lightParty() === LP ? "☒" : "☐") + " You are on the correct LP/side.\n" +
                        (safespot === safeDirections ? "☒" : "☐") + " You are on the person who hasn't moved in.\n" +
                        (spreadOrStack === "spread" ? "☒" : "☐") + " It's spreads. This specific spot is for spreading.\n" +
                        ((role === "MT" || role === "OT") ? "☒" : "☐") + " You are a tank. The spot that's in is for tanks.",
                    "textAtBottom": "You went to the stack position at " + clockspot + "'s clockspot.\n" + (lightParty() === LP ?
                        "[PASS] — You are from LP" + LP + "." :
                        "[FAIL] — You are from LP" + lightParty() + ", but you went to an LP" + LP + " spot.") + "\n" + (safespot === safeDirections ?
                        "[PASS] — " + clockspot + "'s clockspot doesn't get hit by AoEs." :
                        "[FAIL] — " + clockspot + "'s clockspot does get hit by AoEs.") + "\n" + (spreadOrStack === "spread" ?
                        "[PASS] — It's spreads." :
                        "[FAIL] — It's stacks.") + "\n" + ((role === "MT" || role === "OT") ?
                        "[PASS] — You're a tank." :
                        "[FAIL] — You're not a tank."),
                    "backgroundChange": false,
                    "fail": spreadOrStack === "stack" || lightParty() !== LP || safespot !== safeDirections || (role !== "MT" && role !== "OT"),
                    "pass": false,
                }
            },

            // healer spread spot
            // valid if:
            // 1. you are in the correct light party
            // 2. you are on the correct side
            // 3. it's spreads
            // 4. you're a healer
            {
                "x": cos(angle)*190*scalingFactor,
                "y": sin(angle)*190*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": spreadOrStack === "stack" ? 103 : (safespot === safeDirections ? (lightParty() === LP ? ((role === "H1" || role === "H2") ? 3.5 : 103) : 103) : 103),
                    "positions": spreadOrStack === "spread" ? {
                        "MT": [cos(safeAngleLP1)*140*scalingFactor, sin(safeAngleLP1)*140*scalingFactor],
                        "H1": [cos(safeAngleLP1)*190*scalingFactor, sin(safeAngleLP1)*190*scalingFactor],
                        "M1": [cos(safeAngleLP1 + PI/12)*190*scalingFactor, sin(safeAngleLP1 + PI/12)*190*scalingFactor],
                        "R1": [cos(safeAngleLP1 - PI/12)*190*scalingFactor, sin(safeAngleLP1 - PI/12)*190*scalingFactor],
                        "OT": [cos(safeAngleLP2)*140*scalingFactor, sin(safeAngleLP2)*140*scalingFactor],
                        "H2": [cos(safeAngleLP2)*190*scalingFactor, sin(safeAngleLP2)*190*scalingFactor],
                        "M2": [cos(safeAngleLP2 + PI/12)*190*scalingFactor, sin(safeAngleLP2 + PI/12)*190*scalingFactor],
                        "R2": [cos(safeAngleLP2 - PI/12)*190*scalingFactor, sin(safeAngleLP2 - PI/12)*190*scalingFactor],
                    } : {
                        "MT": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R1": [cos(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP1)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "OT": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "H2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "M2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                        "R2": [cos(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor, sin(safeAngleLP2)*165*scalingFactor + random()*30*scalingFactor - 15*scalingFactor],
                    },
                    "yourPosition": [cos(angle)*190*scalingFactor, sin(angle)*190*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": spreadOrStack === "spread" && lightParty() === LP && safespot === safeDirections && (role === "H1" || role === "H2") ?
                        "Waiting for everyone to get into position." :
                        "You went to the wrong spot. You need to make sure:\n" +
                        (lightParty() === LP ? "☒" : "☐") + " You are on the correct LP/side.\n" +
                        (safespot === safeDirections ? "☒" : "☐") + " You are on the person who hasn't moved in.\n" +
                        (spreadOrStack === "spread" ? "☒" : "☐") + " It's spreads. This specific spot is for spreading.\n" +
                        ((role === "H1" || role === "H2") ? "☒" : "☐") + " You are a healer. The spot that's at the wall is for healers.",
                    "textAtBottom": "You went to the stack position at " + clockspot + "'s clockspot.\n" + (lightParty() === LP ?
                        "[PASS] — You are from LP" + LP + "." :
                        "[FAIL] — You are from LP" + lightParty() + ", but you went to an LP" + LP + " spot.") + "\n" + (safespot === safeDirections ?
                        "[PASS] — " + clockspot + "'s clockspot doesn't get hit by AoEs." :
                        "[FAIL] — " + clockspot + "'s clockspot does get hit by AoEs.") + "\n" + (spreadOrStack === "spread" ?
                        "[PASS] — It's spreads." :
                        "[FAIL] — It's stacks.") + "\n" + ((role === "H1" || role === "H2") ?
                        "[PASS] — You're a healer." :
                        "[FAIL] — You're not a healer."),
                    "backgroundChange": false,
                    "fail": spreadOrStack === "stack" || lightParty() !== LP || safespot !== safeDirections || (role !== "H1" && role !== "H2"),
                    "pass": false,
                }
            }
        )







        if (LP === 2 && clockspot === "H2") LP = 1
        else if (LP === 1 && clockspot === "MT") LP = 2

        switch (clockspot) {
            case "R2":
                clockspot = "M2"
                break
            case "M2":
                clockspot = "H2"
                break
            case "H2":
                clockspot = "M1"
                break
            case "M1":
                clockspot = "H1"
                break
            case "H1":
                clockspot = "R1"
                break
            case "R1":
                clockspot = "MT"
                break
            case "MT":
                clockspot = "OT"
                break
            case "OT":
                clockspot = "R2"
                break
        }

        switch (safespot) {
            case "R2 H1":
                safespot = "M2 R1"
                break
            case "M2 R1":
                safespot = "MT H2"
                break
            case "MT H2":
                safespot = "OT M1"
                break
            case "OT M1":
                safespot = "R2 H1"
                break
        }
    }

    script[3].greendots.push(...greendots)

    instructions.html(`<pre>
numpad 1 → freeze sketch

Click on one of the buttons at the top to do what it says.
    Purge Data will purge the win/loss data for this mechanic and only the currently
     selected mechanic.

Want your coin count back?
1. Open Devtools with F12 (on Windows, please search if using Mac)
2. Use the command "localStorage.getItem("coins")". I won't tell you how to set coins.
Coins are still affecting your favicon.

You are currently on the mechanic ${currentlySelectedMechanic} of ${currentlySelectedBackground}.
Click on any green dot to move to that location.
Your time can be found at the bottom of the rectangle just above the simulation arena.
The time that you cleared can be found on the bottom window after you have cleared.
This is a quiz, so make sure you've studied.

${updates}
</pre>`)
}

function setupEclipticStampede() {
    erase()
    rect(0, 0, width, height)
    noErase()

    setMovementMode(defaultMovementMode)

    mechanicStarted = millis()

    let arena = loadImage('data/M11S/arena.webp')
    let hitbox = loadImage('data/hitbox.png')

    stage = 0
    currentlySelectedMechanic = "Ecliptic Stampede"
    currentlySelectedBackground = "M11S"

    numWinsPerCoinIncrease = 2

    // position everyone in clock spots
    MT = [0, -50*scalingFactor]
    OT = [0, 50*scalingFactor]
    H1 = [-50*scalingFactor, 0]
    H2 = [50*scalingFactor, 0]
    M1 = [-35*scalingFactor, 35*scalingFactor]
    M2 = [35*scalingFactor, 35*scalingFactor]
    R1 = [-35*scalingFactor, -35*scalingFactor]
    R2 = [35*scalingFactor, -35*scalingFactor]

    realMT.x = MT[0]
    realMT.y = MT[1]
    realOT.x = OT[0]
    realOT.y = OT[1]
    realH1.x = H1[0]
    realH1.y = H1[1]
    realH2.x = H2[0]
    realH2.y = H2[1]
    realM1.x = M1[0]
    realM1.y = M1[1]
    realM2.x = M2[0]
    realM2.y = M2[1]
    realR1.x = R1[0]
    realR1.y = R1[1]
    realR2.x = R2[0]
    realR2.y = R2[1]

    let ranged = ["H1", "H2", "R1", "R2"]
    let meteors = [randomWithoutReplacement(ranged)]
    meteors.push(randomWithoutReplacement(ranged))
    meteors.sort()

    let northernMeteor
    let southernMeteor

    let meteorCorners = random([PI/4, 5*PI/4], [3*PI/4, 7*PI/4])
    // meteors on both ranged = ranged closer to the north goes east
    if (meteors === ["R1", "R2"]) {
        if (meteorCorners === [PI/4, 5*PI/4]) {
            northernMeteor = "R2"
            southernMeteor = "R1"
        } else {
            northernMeteor = "R1"
            southernMeteor = "R2"
        }
    }
    else if (meteors === ["R1", "R2"]) {
        if (meteorCorners === [PI/4, 5*PI/4]) {
            northernMeteor = "R2"
            southernMeteor = "R1"
        } else {
            northernMeteor = "R1"
            southernMeteor = "R2"
        }
    }

    // make the background.
    let css = select("html")
    css.style("background-image", "url(\"data/M11S/arena.webp\")")
    css = select("body")
    css.style("background-image", "url(\"data/M11S/arena.webp\")")

    textAtTop = "Hi! This sim uses a separate Ecliptic Stampede" +
        " raidplan—one that, in my opinion, and a lot of other people's" +
        " opinion, is a lot easier to execute properly, at least easier than" +
        " the PF strat (\"use eyes lmao one guy in one guy out two guy left" +
        " two guy right\"). https://raidplan.io/plan/2fukj83wfa63xgcg" +
        " (scroll down for an actual link, & this is someone else's raidplan" +
        " and I take no credit)"
    textAtBottom = "You went to your default starting spot for this" +
        " simulation. \n[PASS] — You got to this page."

    let arenaRotation = 0
    script = {
        // stage 0: start
        0: {
            "arena": arena,
            "arenaRotation": arenaRotation,
            "functions": [
                // display tyrant at center
                {"name": "displayBoss", "args": [hitbox, 0, 0, 130*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [0, 0]}
            ],
            "greendots": [
                {
                    "x": 0,
                    "y": 0,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": 0.5,
                        "positions": {
                            // position out in LPs
                            "MT": [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                            "OT": [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                            "M1": [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                            "M2": [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                            "H1": [-60*scalingFactor, 60*scalingFactor],
                            "H2": [60*scalingFactor, 60*scalingFactor],
                            "R1": [-60*scalingFactor, -60*scalingFactor],
                            "R2": [60*scalingFactor, -60*scalingFactor]
                        },
                        "yourPosition": false,
                        "changeMovementType": false,
                        "textAtTop": "Wait for everyone to get to their spot.",
                        "textAtBottom": "[PASS] — You clicked on the dot in the center.",
                        "backgroundChange": false,
                        "fail": false,
                        "pass": false
                    }
                }
            ],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 0.5: going to the spot
        0.5: {
            "arena": arena,
            "arenaRotation": arenaRotation,
            "functions": [
                // display tyrant at center
                {"name": "displayBoss", "args": [hitbox, 0, 0, 130*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": meleeOrRanged(role) === "melee" ? 2 : northernMeteor === role ? 1 : southernMeteor === role ? 1 : 2,
                "positions": {
                    // ranged CAN go in
                    "H1": !(ranged.includes("H1")) ? [-60*scalingFactor, 60*scalingFactor] : [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                    "H2": !(ranged.includes("H2")) ? [60*scalingFactor, 60*scalingFactor] : [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                    "R1": !(ranged.includes("R1")) ? [-60*scalingFactor, -60*scalingFactor] : [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor],
                    "R2": !(ranged.includes("R2")) ? [60*scalingFactor, -60*scalingFactor] : [random()*20*scalingFactor - 10*scalingFactor, random()*20*scalingFactor - 10*scalingFactor]
                },
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Please select where you're going to bait your puddles.",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 1: meteor baits
        1: {
            "arena": arena,
            "arenaRotation": arenaRotation,
            "functions": [
                // display tyrant at center
                {"name": "displayBoss", "args": [hitbox, 0, 0, 130*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": {
                "advanceStageTo": meleeOrRanged(role) === "melee" ? 2 : northernMeteor === role ? 1 : southernMeteor === role ? 1 : 2,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Please select where you're going to bait your puddles.",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            },
            "instantAdvance": false,
            "delayedAdvance": false
        },
    }


    instructions.html(`<pre>
numpad 1 → freeze sketch

Strategy: <a href="https://raidplan.io/plan/2fukj83wfa63xgcg">https://raidplan.io/plan/2fukj83wfa63xgcg</a>

Click on one of the buttons at the top to do what it says.
    Purge Data will purge the win/loss data for this mechanic and only the currently
     selected mechanic.

Want your coin count back?
1. Open Devtools with F12 (on Windows, please search if using Mac)
2. Use the command "localStorage.getItem("coins")". I won't tell you how to set coins.
Coins are still affecting your favicon.

You are currently on the mechanic ${currentlySelectedMechanic} of ${currentlySelectedBackground}.
Click on any green dot to move to that location.
Your time can be found at the bottom of the rectangle just above the simulation arena.
The time that you cleared can be found on the bottom window after you have cleared.
This is a quiz, so make sure you've studied.

${updates}
</pre>`)
}

function setupIdyllicDream() {
    erase()
    rect(0, 0, width, height)
    noErase()

    setMovementMode(defaultMovementMode)

    mechanicStarted = millis()

    let M12SP2Floor = loadImage('data/M12S P2/Floor.webp')
    let M12SP2Floor2 = loadImage('data/M12S P2/Dimension 1.jpg')
    let M12SP2Floor3 = loadImage('data/M12S P2/Dimension 2.jpg')
    let hitbox = loadImage('data/hitbox.png')

    stage = 0
    currentlySelectedMechanic = "Idyllic Dream"
    currentlySelectedBackground = "M12S P2"

    numWinsPerCoinIncrease = 0.2

    // position everyone in clock spots
    MT = [0, -50*scalingFactor]
    OT = [50*scalingFactor, 0]
    H1 = [-50*scalingFactor, 0]
    H2 = [0, 50*scalingFactor]
    M1 = [-35*scalingFactor, 35*scalingFactor]
    M2 = [35*scalingFactor, 35*scalingFactor]
    R1 = [-35*scalingFactor, -35*scalingFactor]
    R2 = [35*scalingFactor, -35*scalingFactor]

    let cardinalsFirst = random([true, false])

    let shuffledPlayers = ["MT", "OT", "H1", "H2", "M1", "M2", "R1", "R2"]
    shuffledPlayers.sort((a, b) => random() - 0.5)

    let NTether = shuffledPlayers[0]
    let NETether = shuffledPlayers[1]
    let ETether = shuffledPlayers[2]
    let SETether = shuffledPlayers[3]
    let STether = shuffledPlayers[4]
    let SWTether = shuffledPlayers[5]
    let WTether = shuffledPlayers[6]
    let NWTether = shuffledPlayers[7]

    let yourTetherNumber = shuffledPlayers.indexOf(role)
    let yourTether = {
        0: "N",
        1: "NE",
        2: "E",
        3: "SE",
        4: "S",
        5: "SW",
        6: "W",
        7: "NW"
    }[yourTetherNumber]
    print(yourTether)

    let circleAoECloneNorth = random([true, false])
    let northSidesSafe = random([true, false])
    let southSidesSafe = !northSidesSafe

    let stacksFirst = random([true, false])


    // make the background.
    let css = select("html")
    css.style("background-image", "url(\"data/M12S P2/background.jpg\")")
    css = select("body")
    css.style("background-image", "url(\"data/M12S P2/background.jpg\")")

    textAtTop = "Hi! Idyllic Dream is a complex, brain-melting mech. If" +
        " you've studied for it, then here's a sim for it! This sim uses DN" +
        " strats, linked at the bottom."
    textAtBottom = "You went to your default starting spot for this" +
        " simulation. \n[PASS] — You got to this page."


    let arenaRotation = 0
    script = {
        // stage 0: at the beginning
        0: {
            "arena": M12SP2Floor,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [0, 0]}
            ],
            "greendots": [
                {
                    "x": 0,
                    "y": 0,
                    "small": false,
                    "onclick": {
                        "advanceStageTo": 1,
                        "positions": {},
                        "yourPosition": false,
                        "changeMovementType": false,
                        "textAtTop": "You will be fed information for 16 seconds.",
                        "textAtBottom": "[PASS] — You clicked on the dot in the center.",
                        "backgroundChange": false,
                        "fail": false,
                        "pass": false
                    }
                }
            ],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // stage 1: first clones appear
        1: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayArenaTransition", "args": []},
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [0, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 3000,
                "advanceStageTo": 1.25,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.25: second clones appear
        1.25: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [1, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [0, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 3000,
                "advanceStageTo": 1.5,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.5: tethers appear
        1.5: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [2, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [2, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 1.65,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.65: people go to spot
        1.65: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [2, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [2, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 1.75,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.75: brief display of clones
        1.75: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayIncomingArenaTransition", "args": []},
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 2000,
                "advanceStageTo": 1.8,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.8: dimension 2
        1.8: {
            "arena": M12SP2Floor3,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayArenaTransition", "args": []},
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 1.85,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.85: clone hitboxes
        1.85: {
            "arena": M12SP2Floor3,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, circleAoECloneNorth ? -50*scalingFactor : 50*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, 100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 2000,
                "advanceStageTo": 1.9,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.9: clone telegraphs
        1.9: {
            "arena": M12SP2Floor3,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, circleAoECloneNorth ? -50*scalingFactor : 50*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, 100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, -100*scalingFactor, northSidesSafe ? -PI/2 : 0, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, -100*scalingFactor, northSidesSafe ? PI/2 : PI, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, 100*scalingFactor, southSidesSafe ? -PI/2 : 0, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, 100*scalingFactor, southSidesSafe ? PI/2 : PI, PI/2]},
                {"name": "displayCircleTelegraph", "args": [20, 80, 100, 5, 0, circleAoECloneNorth ? -50*scalingFactor : 50*scalingFactor, 200*scalingFactor]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 1.95,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 1.95: clone telegraphs + incoming arena transition
        1.95: {
            "arena": M12SP2Floor3,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayIncomingArenaTransition", "args": []},
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, circleAoECloneNorth ? -50*scalingFactor : 50*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, 100*scalingFactor, 50*scalingFactor, [0, -1000*scalingFactor]]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, -100*scalingFactor, northSidesSafe ? -PI/2 : 0, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, -100*scalingFactor, northSidesSafe ? PI/2 : PI, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, 100*scalingFactor, southSidesSafe ? -PI/2 : 0, PI/2]},
                {"name": "displayConeTelegraph", "args": [20, 80, 100, 5, 0, 100*scalingFactor, southSidesSafe ? PI/2 : PI, PI/2]},
                {"name": "displayCircleTelegraph", "args": [20, 80, 100, 5, 0, circleAoECloneNorth ? -50*scalingFactor : 50*scalingFactor, 200*scalingFactor]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 2000,
                "advanceStageTo": 2,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Which intercardinal should you preposition at to grab your boss clone?",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // stage 2: intercardinal preposition
        2: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayArenaTransition", "args": []},
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []},
                {"name": "displayGreenDot", "args": [50*scalingFactor, 50*scalingFactor]},
                {"name": "displayGreenDot", "args": [-50*scalingFactor, 50*scalingFactor]},
                {"name": "displayGreenDot", "args": [-50*scalingFactor, -50*scalingFactor]},
                {"name": "displayGreenDot", "args": [50*scalingFactor, -50*scalingFactor]}
            ],
            "greendots": [{
                "x": 50*scalingFactor,
                "y": -50*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": (role === NTether || role === STether) ? 2.2 : 102,
                    "positions": {},
                    "yourPosition": [40*scalingFactor + random()*20*scalingFactor, -40*scalingFactor - random()*20*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": (role === NTether || role === STether) ?
                    "Wait for boss clones to appear." :
                    `This spot is for the N tether player or the S tether player, not the ${yourTether} tether player.`,
                    "textAtBottom": ((role === NTether || role === STether) ? "[PASS] — " : "[FAIL] — ") +
                    `You are the ${yourTether} tether player.`,
                    "backgroundChange": false,
                    "fail": false,
                    "pass": false
                }
            }, {
                "x": 50*scalingFactor,
                "y": 50*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": (role === NETether || role === SWTether) ? 2.2 : 102,
                    "positions": {},
                    "yourPosition": [40*scalingFactor + random()*20*scalingFactor, 40*scalingFactor + random()*20*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": (role === NETether || role === SWTether) ?
                        "Wait for boss clones to appear." :
                        `This spot is for the NE tether player or the SW tether player, not the ${yourTether} tether player.`,
                    "textAtBottom": ((role === NETether || role === SWTether) ? "[PASS] — " : "[FAIL] — ") +
                        `You are the ${yourTether} tether player.`,
                    "backgroundChange": false,
                    "fail": false,
                    "pass": false
                }
            }, {
                "x": -50*scalingFactor,
                "y": 50*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": (role === ETether || role === WTether) ? 2.2 : 102,
                    "positions": {},
                    "yourPosition": [-40*scalingFactor - random()*20*scalingFactor, 40*scalingFactor + random()*20*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": (role === ETether || role === WTether) ?
                        "Wait for boss clones to appear." :
                        `This spot is for the E tether player or the W tether player, not the ${yourTether} tether player.`,
                    "textAtBottom": ((role === ETether || role === WTether) ? "[PASS] — " : "[FAIL] — ") +
                        `You are the ${yourTether} tether player.`,
                    "backgroundChange": false,
                    "fail": false,
                    "pass": false
                }
            }, {
                "x": -50*scalingFactor,
                "y": -50*scalingFactor,
                "small": false,
                "onclick": {
                    "advanceStageTo": (role === SETether || role === NWTether) ? 2.2 : 102,
                    "positions": {},
                    "yourPosition": [-40*scalingFactor - random()*20*scalingFactor, -40*scalingFactor - random()*20*scalingFactor],
                    "changeMovementType": false,
                    "textAtTop": (role === SETether || role === NWTether) ?
                        "Wait for boss clones to appear." :
                        `This spot is for the SE tether player or the NW tether player, not the ${yourTether} tether player.`,
                    "textAtBottom": ((role === SETether || role === NWTether) ? "[PASS] — " : "[FAIL] — ") +
                        `You are the ${yourTether} tether player.`,
                    "backgroundChange": false,
                    "fail": false,
                    "pass": false
                }
            }],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // 102: wrong preposition spot
        102: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": false
        },
        // 2.2: first boss clones spawn
        2.2: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 0, 160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 2.4,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // 2.4: second boss clones spawn
        2.4: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 0, 160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 2.6,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // 2.6: third boss clones spawn
        2.6: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 0, 160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 2.8,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": false,
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // 2.8: fourth boss clones spawn
        2.8: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 0, 160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 3,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Select which tether you are going to take.",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
        // 3: Select your tether.
        3: {
            "arena": M12SP2Floor2,
            "arenaRotation": arenaRotation,
            "functions": [
                {"name": "displayBoss", "args": [hitbox, 0, 0, 100*scalingFactor, [0, -10*scalingFactor]]},
                {"name": "displayBoss", "args": [hitbox, 0, -160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 0, 160*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -160*scalingFactor, 0, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, 113*scalingFactor, 113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayBoss", "args": [hitbox, -113*scalingFactor, -113*scalingFactor, 50*scalingFactor, [0, 0]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "displayM12SP2PlayerClones", "args": [3, !cardinalsFirst, [NTether, NETether, ETether, SETether, STether, SWTether, WTether, NWTether]]},
                {"name": "push", "args": []},
                {"name": "translateToCenterOfBoard", "args": []},
                {"name": "displayCharacterPositions", "args": []},
                {"name": "pop", "args": []}
            ],
            "greendots": [],
            "onArrive": false,
            "instantAdvance": false,
            "delayedAdvance": {
                "delayMillis": 1000,
                "advanceStageTo": 3,
                "positions": {},
                "yourPosition": false,
                "changeMovementType": false,
                "textAtTop": "Select which tether you are going to take.",
                "textAtBottom": false,
                "backgroundChange": false,
                "pass": false
            }
        },
    }

    script[1.5].delayedAdvance.positions[NTether] = [0, -50*scalingFactor]
    script[1.5].delayedAdvance.positions[ETether] = [50*scalingFactor, 0]
    script[1.5].delayedAdvance.positions[WTether] = [-50*scalingFactor, 0]
    script[1.5].delayedAdvance.positions[STether] = [0, 50*scalingFactor]
    script[1.5].delayedAdvance.positions[SWTether] = [-35*scalingFactor, 35*scalingFactor]
    script[1.5].delayedAdvance.positions[SETether] = [35*scalingFactor, 35*scalingFactor]
    script[1.5].delayedAdvance.positions[NWTether] = [-35*scalingFactor, -35*scalingFactor]
    script[1.5].delayedAdvance.positions[NETether] = [35*scalingFactor, -35*scalingFactor]

    script[2].greendots[0].onclick.positions[NTether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[NETether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[ETether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[SETether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[STether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[SWTether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[WTether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[0].onclick.positions[NWTether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]

    script[2].greendots[1].onclick.positions[NTether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[NETether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[ETether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[SETether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[STether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[SWTether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[WTether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[1].onclick.positions[NWTether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]

    script[2].greendots[2].onclick.positions[NTether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[NETether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[ETether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[SETether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[STether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[SWTether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[WTether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[2].onclick.positions[NWTether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]

    script[2].greendots[3].onclick.positions[NTether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[NETether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[ETether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[SETether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[STether] = [(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[SWTether] = [(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[WTether] = [-(40*scalingFactor + random()*20*scalingFactor), (40*scalingFactor + random()*20*scalingFactor)]
    script[2].greendots[3].onclick.positions[NWTether] = [-(40*scalingFactor + random()*20*scalingFactor), -(40*scalingFactor + random()*20*scalingFactor)]

    instructions.html(`<pre>
numpad 1 → freeze sketch

Strategy: <a href="https://raidplan.io/plan/zoeminUT6l2gaOWp">https://raidplan.io/plan/zoeminUT6l2gaOWp</a>

Click on one of the buttons at the top to do what it says.
    Purge Data will purge the win/loss data for this mechanic and only the currently
     selected mechanic.

Want your coin count back?
1. Open Devtools with F12 (on Windows, please search if using Mac)
2. Use the command "localStorage.getItem("coins")". I won't tell you how to set coins.
Coins are still affecting your favicon.

You are currently on the mechanic ${currentlySelectedMechanic} of ${currentlySelectedBackground}.
Click on any green dot to move to that location.
Your time can be found at the bottom of the rectangle just above the simulation arena.
The time that you cleared can be found on the bottom window after you have cleared.
This is a quiz, so make sure you've studied.

${updates}
</pre>`)
}


//———————————————————————————————glow functions———————————————————————————————\\

function glowRect(h, s, b, a, weight, param1, param2, param3, param4, param5 = 0, param6 = param5, param7 = param6, param8 = param7) {
    strokeWeight(weight)
    stroke(h, s, b, a)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*9/10)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a/2)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*4/5)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*7/10)
    stroke(h, s*1/4, b*1/4 + 300/4, a/2)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*3/5)
    stroke(h, s*1/4, b*1/4 + 300/4, a)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*1/2)
    stroke(h, 0, 100, a/2)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)

    strokeWeight(weight*2/5)
    stroke(h, 0, 100, a)
    rect(param1, param2, param3, param4, param5, param6, param7, param8)
}

function glowCircle(h, s, b, a, weight, param1, param2, param3) {
    strokeWeight(weight)
    stroke(h, s, b, a)
    circle(param1, param2, param3)

    strokeWeight(weight*9/10)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a/2)
    circle(param1, param2, param3)

    strokeWeight(weight*4/5)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a)
    circle(param1, param2, param3)

    strokeWeight(weight*7/10)
    stroke(h, s*1/4, b*1/4 + 300/4, a/2)
    circle(param1, param2, param3)

    strokeWeight(weight*3/5)
    stroke(h, s*1/4, b*1/4 + 300/4, a)
    circle(param1, param2, param3)

    strokeWeight(weight*1/2)
    stroke(h, 0, 100, a/2)
    circle(param1, param2, param3)

    strokeWeight(weight*2/5)
    stroke(h, 0, 100, a)
    circle(param1, param2, param3)
}

function glowLine(h, s, b, a, weight, param1, param2, param3, param4) {
    strokeWeight(weight)
    stroke(h, s, b, a)
    line(param1, param2, param3, param4)

    strokeWeight(weight*9/10)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a/2)
    line(param1, param2, param3, param4)

    strokeWeight(weight*4/5)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a)
    line(param1, param2, param3, param4)

    strokeWeight(weight*7/10)
    stroke(h, s*1/4, b*1/4 + 300/4, a/2)
    line(param1, param2, param3, param4)

    strokeWeight(weight*3/5)
    stroke(h, s*1/4, b*1/4 + 300/4, a)
    line(param1, param2, param3, param4)

    strokeWeight(weight*1/2)
    stroke(h, 0, 100, a/2)
    line(param1, param2, param3, param4)

    strokeWeight(weight*2/5)
    stroke(h, 0, 100, a)
    line(param1, param2, param3, param4)
}

function glowText(h, s, b, a, weight, param1, param2, param3) {
    strokeWeight(weight)
    stroke(h, s, b, a)
    fill(h, s, b, a)
    text(param1, param2, param3)

    strokeWeight(weight*9/10)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a/2)
    fill(h, s*1.5/3, b*1.5/3 + 100/2, a/2)
    text(param1, param2, param3)

    strokeWeight(weight*4/5)
    stroke(h, s*1.5/3, b*1.5/3 + 100/2, a)
    fill(h, s*1.5/3, b*1.5/3 + 100/2, a)
    text(param1, param2, param3)

    strokeWeight(weight*7/10)
    stroke(h, s*1/4, b*1/4 + 300/4, a/2)
    fill(h, s*1/4, b*1/4 + 300/4, a/2)
    text(param1, param2, param3)

    strokeWeight(weight*3/5)
    stroke(h, s*1/4, b*1/4 + 300/4, a)
    fill(h, s*1/4, b*1/4 + 300/4, a)
    text(param1, param2, param3)

    strokeWeight(weight*1/2)
    stroke(h, 0, 100, a/2)
    fill(h, 0, 100, a/2)
    text(param1, param2, param3)

    strokeWeight(weight*2/5)
    stroke(h, 0, 100, a)
    fill(h, 0, 100, a)
    text(param1, param2, param3)
}

function glowWaymark(h, s, b, a, rectOrCircle, weight, x, y, width, text) {
    noFill()
    if (rectOrCircle === "rect") {
        glowRect(h, s, b, a, weight, x - width/2, y - width/2, x + width/2, y + width/2)
    }
    if (rectOrCircle === "circle") {
        glowCircle(h, s, b, a, weight, x, y, width)
    }
    textAlign(CENTER, CENTER)
    textSize(2*scalingFactor*fontScalingFactor*width/4)
    glowText(h, s, b, a, weight/2, text, x, y - width/8)
}

//—————————————————————————————————miscellany—————————————————————————————————\\
function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }
}
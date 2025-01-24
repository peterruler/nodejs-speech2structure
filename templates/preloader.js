let addLoader = () => {
    removeLoader();
    let outDiv = document.getElementById("output");
    let div = document.createElement('div');
    div.style = "position:absolute;width:200px;height:200px;margin: 0 0 0 -100px;left:50%;top:20%;color:#fff;z-index: 100000000;text-align:center;";
    div.className = "ps-loader";
    let img = document.createElement('img');
    img.width = "150";
    img.height = "300";
    img.src = './bubbles.gif';
    div.appendChild(img);
    if (outDiv === null) {
        let elem = document.createElement('div');
        elem.id = 'output';
        document.body.appendChild(elem);
        outDiv = document.getElementById("output");
    }
    let span = document.createElement('span');
    span.innerText = "moment, ki rechnet...";
    span.style = "position: absolute;top: 50%;width: 250px;margin: 0 auto 0 -125px;display: flex;left: 50%;justify-content: center;align-items: center;height: 20px;color: rgb(255, 255, 255);z-index: 100000001;";
    span.className = "blink_me";
    outDiv.appendChild(span);
    outDiv.appendChild(div);
}

let  removeLoader = () => {
    let wrap = document.getElementById('output');
    let child = document.querySelector(".ps-loader");
    let span = document.querySelector(".blink_me");
    if (wrap != null && child != null && span != null) {
        wrap.removeChild(child);
        wrap.removeChild(span);
    }
}
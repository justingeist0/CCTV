let imgIdx = 0
let isInSynceWithOtherDevices = false
let media = []

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const urlDeviceId = urlParams.get('deviceId');

let requestDeviceId = urlDeviceId

let imageChangeTimeout;

const mediaContainer = document.getElementById('media-container');

function updateImageUrls(newUrls) {
    if (newUrls.length == 0) return console.log("No images found")
    if (newUrls.length == media.length) {
        let allEqual = true
        for (var i = 0; i < newUrls.length; i++) 
            if (newUrls[i].url != media[i].url || newUrls[i].duration != media[i].duration) {
                allEqual = false
            }
        if (allEqual) return 
    }

    media = newUrls
    imageCache = []
    mediaContainer.innerHTML = ''
    media.forEach((m, index) => {
        const url = m.url
        if (url.includes('.mp4')) {
            const video = document.createElement("video");
            video.src = url;
            video.id = `nextVideo${index}`;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.controls = false;
            video.width = "1920";
            video.height = "1080";
            mediaContainer.appendChild(video);
        } else {
            const image = document.createElement("img");
            image.src = url;
            image.id = `nextImage${index}`;
            image.alt = "Image";
            image.style.width = "1920px";
            image.style.height = "1080px";
            mediaContainer.appendChild(image);
        }
    })

    if (imgIdx >= media.length)
        imgIdx = 0
    
    setTimerForNextImage()

    if (isInSynceWithOtherDevices)
        initWs()
}


function changeImage(index) {
    if (index >= 0 && index < media.length) {
        const elementsInDivArray = Array.from(mediaContainer.children);
        const futureElement = elementsInDivArray[index];
        elementsInDivArray.forEach((element, i) => {
            if (i == index) {
                element.style.zIndex = 1;
            } else {
                element.style.zIndex = 0;
            }
        });
        const isVideo = futureElement.src.includes('.mp4')
        if (isVideo){
            futureElement.currentTime = 0
            futureElement.play()
        }
        const animationDuration = 1000; 
        const startTime = performance.now();
        function animate() {
            const currentTime = performance.now();
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / animationDuration, 1);

            futureElement.style.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                elementsInDivArray.forEach((element, i) => {
                    if (i == index) {
                        element.style.opacity = 1;
                    } else {
                        if (element.tagName === 'VIDEO') {
                            element.pause();
                        }
                        element.style.opacity = 0;
                    }
                });
            }
        }

        requestAnimationFrame(animate);
    }
}

async function fetchLatestImages() {
    fetch('/device/' + requestDeviceId)
        .then(response => response.json())
        .then(data => {
            const mirrorDeviceId = data[0].mirrorDeviceId

            if (mirrorDeviceId != null && mirrorDeviceId != requestDeviceId) {
                requestDeviceId = mirrorDeviceId
                fetchLatestImages()
                return
            }

            if (mirrorDeviceId == null && requestDeviceId != urlDeviceId) {
                requestDeviceId = urlDeviceId
                fetchLatestImages()
                return
            }
        
            isInSynceWithOtherDevices = mirrorDeviceId == requestDeviceId

            updateImageUrls(data[0].images)
        })
        .catch(error => {
            console.error("Error fetching data: ", error);
        });
}

function setTimerForNextImage(serverIdx = imgIdx) {
    imgIdx = serverIdx

    if (imgIdx >= media.length) {
        imgIdx = 0;
    }

    clearTimeout(imageChangeTimeout)
    changeImage(imgIdx);

    let nextImageDuration = parseInt(media[imgIdx].duration) * 1000;
    if (isInSynceWithOtherDevices)
        nextImageDuration += 3000
    imageChangeTimeout = setTimeout(setTimerForNextImage, nextImageDuration);

    imgIdx += 1;
}

async function getVersion() {
    return await fetch('/get-version')
        .then(response => response.json())
        .then(data => {
            return data.version;
        })
        .catch(error => {
            console.error("Error fetching data: ", error);
            throw error; // Optionally re-throw the error if needed. 
        });
}

fetchLatestImages() 

let version = 0
setTimeout(async () => {
    version = await getVersion()
})

//Check for updates every 60 seconds
setInterval(async () => {
    if (version != await getVersion()) {
        location.reload()
    }
    await fetchLatestImages()
}, 600000)


let ws;
const websocketURL = "wss://cc-tv.onrender.com"//`ws://${window.location.hostname}:8080`;//
let isConnected = false

function initWs() {
    if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
    }
    ws = new WebSocket(websocketURL);
    ws.onopen = () => {
        isConnected = true
        ws.send(JSON.stringify({deviceId: requestDeviceId}));
    }
    ws.onmessage = ({ data }) => {
        // Messages is Json that is {  }
        let json = JSON.parse(data);
        updateImageUrls(json.images)
        setTimerForNextImage(json.currentIdx)
        // Message to display a new image and update the image lists to the newest. Hot refresh is possible here.
    };
    ws.onclose = async () => {
        isConnected = false
        while (!isConnected) {
            await new Promise(resolve => setTimeout(resolve, 4000))
            initWs()
        }
    }
}

setTimeout(() => {
    const elementsInDivArray = Array.from(mediaContainer.children);
    const isEmpty = elementsInDivArray.length == 0
    if (isEmpty || media.length == 0) {
        location.reload()
    }
}, 10000)

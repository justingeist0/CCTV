let imageUrls = [];
let imageCache = [];
let imgIdx = 0
let isInSynceWithOtherDevices = false

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const urlDeviceId = urlParams.get('deviceId');

let requestDeviceId = urlDeviceId

let imageChangeTimeout;

function updateImageUrls(newUrls) {
    if (newUrls.length == 0) return console.log("No images found")
    if (newUrls.length == imageUrls.length) {
        let allEqual = true
        for (var i = 0; i < newUrls.length; i++) 
            if (newUrls[i].url != imageUrls[i].url || newUrls[i].duration != imageUrls[i].duration) {
                allEqual = false
            }
        if (allEqual) return 
    }
    imageUrls = newUrls
    imageCache = []
    imageUrls.forEach(image => {
        const url = image.url
        if (url.includes('.mp4')) {
            const preloadVideo = document.createElement("video");
            preloadVideo.src = url;
            imageCache.push(preloadVideo)
        } else {
            const image = new Image();
            image.src = url;
            imageCache.push(image);
        }
    });
    if (imgIdx >= imageUrls.length)
        imgIdx = 0
    
    setTimerForNextImage()
    if (isInSynceWithOtherDevices)
        initWs()
}

const videoElement = document.getElementById('video');
const nextVideoElement = document.getElementById('nextVideo');

function changeImage(index) {
    if (index >= 0 && index < imageCache.length) {
        const imageElement = document.getElementById('image');
        const nextImage = document.getElementById('nextImage');
        const newSrc = imageCache[index].src
        const isVideo = newSrc.includes('.mp4')
        if (isVideo){
            nextVideoElement.style.opacity = 1
            nextImage.style.opacity = 0
            nextVideoElement.src = newSrc;
        }
        else {
            nextVideoElement.style.opacity = 0
            nextImage.style.opacity = 1
            nextImage.src = newSrc;
        }

        const animationDuration = 1000; 
        const startTime = performance.now();
        function animate() {
            const currentTime = performance.now();
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / animationDuration, 1);

            if (imageElement.style.opacity == 0)
                videoElement.style.opacity = 1 - progress;
            else
                imageElement.style.opacity = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (isVideo) {
                videoElement.src = newSrc;
                imageElement.style.opacity = 0;
            } else {
                imageElement.src = newSrc;
                imageElement.style.opacity = 1;
                videoElement.style.opacity = 0;
            }
        }

        requestAnimationFrame(animate);
    }
}

videoElement.addEventListener('loadeddata', function() {
    // Code to execute when the video has fully loaded
    videoElement.currentTime = nextVideoElement.currentTime
    videoElement.style.opacity = 1;
});

async function fetchLatestImages() {
    fetch('/device/' + requestDeviceId)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            const images = data[0].images
            const mirrorDeviceId = data[0].mirrorDeviceId

            if (mirrorDeviceId != null && mirrorDeviceId != requestDeviceId) {
                requestDeviceId = mirrorDeviceId
                fetchLatestImages()
            }

            if (mirrorDeviceId == null && requestDeviceId != urlDeviceId) {
                requestDeviceId = urlDeviceId
                fetchLatestImages()
            }
        
            console.log(mirrorDeviceId, requestDeviceId)
            isInSynceWithOtherDevices = mirrorDeviceId == requestDeviceId

            updateImageUrls(images)
        })
        .catch(error => {
            location.reload()
        });
}

function setTimerForNextImage(serverIdx = imgIdx) {
    imgIdx = serverIdx
    if (imgIdx >= imageCache.length) {
        imgIdx = 0;
    }
    
    clearTimeout(imageChangeTimeout)
    changeImage(imgIdx);

    let nextImageDuration = parseInt(imageUrls[imgIdx].duration) * 1000;
    if (isInSynceWithOtherDevices) //Add a buffer
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
    console.log("init ws")
    if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
    }
    ws = new WebSocket(websocketURL);
    ws.onopen = () => {
        console.log("Connected")
        isConnected = true
        ws.send(JSON.stringify({deviceId: requestDeviceId}));
    }
    ws.onmessage = ({ data }) => {
        // Messages is Json that is {  }
        let json = JSON.parse(data);
        console.log(json)
        updateImageUrls(json.images)
        setTimerForNextImage(json.currentIdx)
        // Message to display a new image and update the image lists to the newest. Hot refresh is possible here.
    };
    ws.onclose = async () => {
        console.log("Disconnected")
        isConnected = false
        while (!isConnected) {
            await new Promise(resolve => setTimeout(resolve, 4000))
            initWs()
        }
    }
}

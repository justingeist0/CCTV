import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8gcLnkEkvZ4osnSoUcBY1ZoizleHSLsw",
    authDomain: "adtv-64129.firebaseapp.com",
    projectId: "adtv-64129",
    storageBucket: "adtv-64129.appspot.com",
    messagingSenderId: "1051852504406",
    appId: "1:1051852504406:web:cfa882fc070b7de844aaf7"
};

function toggleFullScreen() {
    const elem = document.documentElement;

    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        // If not in fullscreen mode, enter fullscreen mode
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    } else {
        // If in fullscreen mode, exit fullscreen mode
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }
}

document.addEventListener('fullscreenchange', (event) => {
    const container = document.getElementById('media-container');

    if (document.fullscreenElement) {
        console.log(`Entered fullscreen mode`);

        // Apply styles to make the container fill the screen and appear on top of everything else
        container.style.position = 'fixed';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '99';
    } else {
        console.log(`Exited fullscreen mode`);

        // Remove the styles when exiting fullscreen mode
        container.style.position = '';
        container.style.width = '';
        container.style.height = '';
        container.style.top = '';
        container.style.left = '';
        container.style.zIndex = '';
    }
});

document.getElementById('media-container').addEventListener('click', toggleFullScreen);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

function downloadVideo(url, video) {
    const httpsReference = ref(storage, url);

    getDownloadURL(httpsReference)
        .then((url) => {
            console.log("downloading")
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
                const blob = xhr.response;
                const downloadUrl = URL.createObjectURL(blob);
                if (video)
                    video.src = downloadUrl;
                // Create an anchor tag to download the blob
                // const a = document.createElement('a');
                // a.href = downloadUrl;
                // a.download = "video1.mp4";  // Set the desired file name for download

                // // Append anchor to body, trigger download, and remove anchor
                // document.body.appendChild(a);
                // a.click();
                // document.body.removeChild(a);

                // // Optionally, revoke the blob URL to free up resources
                // URL.revokeObjectURL(downloadUrl);
            };
            xhr.open('GET', url);
            xhr.send();
        })
        .catch((error) => {
            console.error('Error downloading the file: ', error);
        });
}

let imgIdx = 0
let isInSynceWithOtherDevices = false
let media = []

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const urlDeviceId = urlParams.get('deviceId');

let requestDeviceId = urlDeviceId

let imageChangeTimeout;

const mediaContainer = document.getElementById('media-container');
let youtubeVideo = []

function updateImageUrls(serverUrls) {
    const newUrls = serverUrls.filter(url => !url.url.includes("https://www.youtube.com/watch?v="))
    const youtubeUrls = serverUrls.filter(url => url.url.includes("https://www.youtube.com/watch?v="))
    initYouTubeVideos(youtubeUrls)
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
    //imageCache = []
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
            video.style.width = "100vw";
            video.style.height = "100vh";
            downloadVideo(url, video)
            mediaContainer.appendChild(video);
        } else {
            const image = document.createElement("img");
            image.src = url;
            image.id = `nextImage${index}`;
            image.alt = "Image";
            image.style.width = "100vw";
            image.style.height = "100vh";
            mediaContainer.appendChild(image);
        }
    })

    if (imgIdx >= media.length)
        imgIdx = 0
    
    setTimerForNextImage()

    if (isInSynceWithOtherDevices)
        initWs()
}

let youtubeJob
let currentYoutubeIdx = 0

function initYouTubeVideos(youtubeUrls) {
    youtubeUrls.forEach((url, index) => {
        const videoId = url.url.split("v=")[1]
        url.url = `https://www.youtube.com/embed/${videoId}?autoplay=1&cc_load_policy=1&mute=1`;
    })
    youtubeVideo = youtubeUrls
    console.log(youtubeVideo)
    if (youtubeVideo.length == 0) {
        return
    }
    if (youtubeJob) {
        clearTimeout(youtubeJob)
    }
    currentYoutubeIdx = 0
    startPlayingVideos(true)
}

function startPlayingVideos(playInstantly = false) {
    const current = youtubeVideo[currentYoutubeIdx]
    youtubeJob = setTimeout(() => {
        document.getElementById('entertainment').src = current.url
        currentYoutubeIdx = (currentYoutubeIdx + 1) % youtubeVideo.length
        startPlayingVideos()
    }, playInstantly ? 0 : current.duration * 1000)
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
        try {
            futureElement.currentTime = 0
        } catch (e) {}
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
let hostname = window.location.hostname;
const isLocal = hostname === 'localhost';
const websocketURL = (isLocal ? "ws" : "wss") + `://${hostname}${isLocal ? ':8080' : ''}`;
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
        console.log("Received new images from server")
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

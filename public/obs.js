let imageUrls = [];
let imageCache = [];
let imgIdx = 0

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const deviceId = urlParams.get('deviceId');
let imageChangeTimeout;

function updateImageUrls(newUrls) {
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
    fetch('/device/' + deviceId)
        .then(response => response.json())
        .then(data => {
            clients = data
            const images = data[0].images
            updateImageUrls(images)
        })
        .catch(error => {
            console.error("Error fetching data: ", error);
        });
}

function setTimerForNextImage() {
    clearTimeout(imageChangeTimeout)
    changeImage(imgIdx);
    const nextImageDuration = parseInt(imageUrls[imgIdx].duration) * 1000;
    imageChangeTimeout = setTimeout(setTimerForNextImage, nextImageDuration);
    imgIdx += 1;
    if (imgIdx >= imageCache.length) {
        imgIdx = 0;
    }
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
}, 60000)

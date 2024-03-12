import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// const firebaseConfig = {
//     apiKey: "AIzaSyC8gcLnkEkvZ4osnSoUcBY1ZoizleHSLsw",
//     authDomain: "adtv-64129.firebaseapp.com",
//     projectId: "adtv-64129",
//     storageBucket: "adtv-64129.appspot.com",
//     messagingSenderId: "1051852504406",
//     appId: "1:1051852504406:web:cfa882fc070b7de844aaf7"
// };
const firebaseConfig = {
    apiKey: "AIzaSyDdChm6HnT3sU99CGfEncHBfSRlU9lUPJY",
    authDomain: "linklocal-c5d8f.firebaseapp.com",
    projectId: "linklocal-c5d8f",
    storageBucket: "linklocal-c5d8f.appspot.com",
    messagingSenderId: "1081605742554",
    appId: "1:1081605742554:web:ba6886c4fff72bfa1d2ae3",
    measurementId: "G-ZQEN9XEX3R"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const signInText = document.getElementById('sign-in')

function signInWithGoogle() {
    var provider = new GoogleAuthProvider();  
    signInWithPopup(auth, provider)
        .then(function (result) {
            var user = result.user;
            console.log('Signed in as: ' + user.displayName);
        })
        .catch(function (error) {
            console.error('Google Sign-In Error:', error);
        });
}

auth.onAuthStateChanged(user => {
        if (!user) {
            console.log("logged out")
            signInText.innerText = `Click here to sign in`
        } else {
            console.log("logged in", user)
            signInText.innerText = `${user.email} ${user.displayName} Admin ${user.displayName} Top G`
            init()
        }
    });

async function getToken() {
    return await getAuth().currentUser?.getIdToken()
}

signInText.addEventListener('click', () => {
    signInWithGoogle()
})

let clients = []
let devices = []
let deviceIdx = -1
let defaultDuration = 12;
const defaultInput = document.getElementById('default');
defaultInput.addEventListener('input', function () {
    defaultDuration = parseInt(this.value);
});


async function init() {
    const dropdown = document.getElementById("client-dropdown");
    const deviceDropdown = document.getElementById("dropdown");
    const deviceURL = document.getElementById("device-url")

    function updateDeviceDropDown(clientId) {
        fetch(`/devices/${clientId}`, {
            headers: {
                "Authorization": token
            }
        })
        .then(response => response.json())
        .then(data => {
            devices = data
            deviceDropdown.innerHTML = '<option value="" disabled selected>Select an option</option>'
            data.forEach(c => {
                const optionElement = document.createElement("option");
                optionElement.value = c._id; // Replace with the appropriate property from your data
                optionElement.textContent = c.name; // Replace with the appropriate property from your data
                deviceDropdown.appendChild(optionElement);
            });
        })
        .catch(error => {
            console.error("Error fetching data: ", error);
        });
    }

    const token = await getToken()
    fetch('/clients', {
        headers: {
            "Authorization": token
        }
    })
    .then(response => response.json())
    .then(data => {
        clients = data
        console.log(data)
        data.forEach(c => {
            const optionElement = document.createElement("option");
            optionElement.value = c._id; // Replace with the appropriate property from your data
            optionElement.textContent = c.name; // Replace with the appropriate property from your data
            dropdown.appendChild(optionElement);
        });
    })
    .catch(error => {
        console.error("Error fetching data: ", error);
    });

    dropdown.addEventListener('change', () => {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        const clientId = selectedOption.value;
        const clientName = selectedOption.text;
        const url = `add-device?clientId=${clientId}&clientName=${clientName}`;
        document.getElementById('add-device').href = url;
        updateDeviceDropDown(clientId)
    })

    deviceDropdown.addEventListener('change', () => {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        const clientId = selectedOption.value;
        const clientName = selectedOption.text;
        deviceIdx = deviceDropdown.selectedIndex - 1
        imageURLS = devices[deviceIdx].images ? devices[deviceIdx].images : []
        // let temp = []
        // for (var i in imageURLS) {
        //     temp.push({ "url": imageURLS[i], "duration": defaultDuration })
        // }
        // imageURLS = temp
        console.log(imageURLS)

        deviceURL.innerHTML = window.location.origin + '/obs?deviceId=' + devices[deviceIdx]._id
        updateImages()
    })

};

let imageURLS = []
const imagesDiv = document.getElementById("images")

function updateImages() {
    let newHtml = ""
    for (var i in imageURLS) {
        const url = imageURLS[i].url
        const imageDuration = imageURLS[i].duration
        newHtml += `<div class="d-flex justify-content-center align-items-center">`
        newHtml += `<label for="duration${i}">Duration</label>`
        newHtml += `<input type="number" id="duration${i}" name="duration${i}" required value="${imageDuration}">`
        if (`${url}`.includes(".mp4"))
            newHtml += `<a href="${url}" target="_blank"><video id="nextVideo" autoplay muted loop controls height="200" src="${url}"></video></a>`
        else
            newHtml += `<a href="${url}" target="_blank"><img src="${url}" alt="Click to view image, this url is probably wrong" style="height:200px"/></a>`
        newHtml += `<button id="${i}">Remove Media</button>`
        newHtml += `</div>`
        newHtml += '<br>'
        newHtml += '<br>'
    }
    imagesDiv.innerHTML = newHtml
    for (i in imageURLS) {
        document.getElementById(i).addEventListener('click', () => {
            imageURLS.pop(i)
            updateImages()
        })
    }
}

const userForm = document.getElementById("userForm");

userForm.addEventListener("submit", function(event) {
    if (deviceIdx == -1) {
        alert("Select a device before adding images")
        return
    }
    event.preventDefault();
    const nameElement = document.getElementById("name")
    const name = nameElement.value
    imageURLS.push({ "url": name, "duration": defaultDuration })
    nameElement.value = ""
    updateImages()
})

const mediaForm = document.getElementById("mediaForm")
console.log(mediaForm)

mediaForm.addEventListener("submit", async function(event) {
    if (deviceIdx == -1) {
        alert("Please select a device to change images.")
        return
    }
    event.preventDefault();
    for (var i in imageURLS) {
        imageURLS[i]['duration'] = document.getElementById(`duration${i}`).value
    }
    const token = await getToken()
    fetch(`/device-images/${devices[deviceIdx]._id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(imageURLS)
    })
    .then(response => {
        if (response.ok) {
            alert("Success!")
        } else {
            alert("There was an error adding this client. Please try again.")
        }
    })
    .catch(error => {
        console.error("Fetch error: ", error);
    });
})
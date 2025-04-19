console.log("Welcome in java script");

let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            // Get only the file name (with %20 etc.)
            const fileName = element.href.split(`/${folder}/`)[1];
            songs.push(fileName);
        }
    }

    // show all the songs in the playlist
    let SongUL = document.querySelector(".songList ul");
    SongUL.innerHTML = ""; // Clear before populating

    for (const song of songs) {
        let cleanName = song
            .replaceAll("%20", " ")
            .replace(/128 Kbps/gi, "")
            .replace(".mp3", "")
            .trim();

        SongUL.innerHTML += `
            <li data-song="${song}">
                <img class="invert" src="img/music.svg" alt="">
                <div class="info">
                    <div>${cleanName}</div>
                    
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
    }
    // Re-select all the list items after they've been inserted into the DOM
    let listItems = document.querySelectorAll(".songList ul li");

    listItems.forEach(li => {
        li.addEventListener("click", () => {
            let originalFileName = li.getAttribute("data-song");
            playMusic(originalFileName);
        });
    });
    return songs;

}

const playMusic = (track, pause = false) => {
    console.log("Trying to play:", track);
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play().catch(e => console.error("Play error:", e));
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track.replace(/%20|128 kbps/gi, " ");
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
};

async function DisplayAlbums() {
    console.log("Displaying albums...");

    // Get the directory listing
    let a = await fetch(`/songs/`);
    let response = await a.text();

    // Create a temporary div to parse the HTML
    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const element = array[index];

        if (element.pathname.includes("/songs/")) {
            // Get the folder name from the URL
            let folder = element.pathname.split("/").filter(Boolean).slice(-1)[0];

            try {
                // Fetch metadata
                let res = await fetch(`/songs/${folder}/info.json`);
                if (!res.ok) {
                    console.warn(`Skipping ${folder}, info.json not found.`);
                    continue;
                }

                let info = await res.json();
                console.log("Loaded album:", info.title);

                // Create album card
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="img/playicon.svg" alt="">
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="cover">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading info.json for ${folder}`, error);
            }
        }
    }
    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        console.log(e);
        e.addEventListener("click", async item => {
            console.log(item, item.currentTarget.dataset);
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            playMusic(songs[0]);
        })
    })

}
async function main() {
    songs = await getSongs("songs/honey_singh");
    playMusic(songs[0], true);

    // Display all the albums on the page
    DisplayAlbums();

    // now attach an event listener to play previous next 
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    })

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    // add an event listener to the seekbar

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })

    // now add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    // now add an event listener for close icon
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-125%";
    })

    // add event listener for previous
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("previous clicked")
        console.log(currentSong);
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })
    // add event listener for next
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked")
        console.log(currentSong);
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })

    // add an event listener to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("img/mute.svg", "img/volume.svg")
        }
    })

    // add an event listener to mute the volume track

    document.querySelector(".volume>img").addEventListener("click", e => {
        console.log(e.target);
        console.log("changing", e.target.src);
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })



}

main();

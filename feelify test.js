const clientId = 'ad214a9fb9bf4aa682af14a54371ea50';
const clientSecret = 'f7247cd5ff234cd7849f41a874b4325e';
const authEndpoint = 'https://accounts.spotify.com/api/token';
const youtubeApiKey = 'AIzaSyAEABWuIAofSQUFvNocoAgBJ6f9iNQvXjI';
let player;

async function fetchAccessToken() {
    const response = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
}

async function fetchWebApi(endpoint, method, body) {
    const token = await fetchAccessToken();
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method,
        body: JSON.stringify(body),
    });
    return await res.json();
}

async function getTopTracks() {
    return (await fetchWebApi(
        'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
    )).items;
}

async function getPlaylist() {
    const moodSelect = document.getElementById('moodSelect');
    const selectedMood = moodSelect.value;

    let moodParameter;
    switch (selectedMood) {
        case 'happy':
            moodParameter = 'energetic';
            break;
        case 'sad':
            moodParameter = 'acoustic';
            break;
        case 'energetic':
            moodParameter = 'dance';
            break;
        default:
            moodParameter = 'acoustic';
    }
    const topTracks = await fetchWebApi(
        `v1/recommendations?seed_genres=${moodParameter}&limit=5`, 'GET'
    );

    displayPlaylist(topTracks.tracks);
}

function displayPlaylist(tracks) {
    const playlistResult = document.getElementById('playlistResult');
    playlistResult.innerHTML = '';

    if (tracks.length === 0) {
        playlistResult.innerHTML = '<p>No playlist found.</p>';
        return;
    }

    const ul = document.createElement('ul');

    tracks.forEach(track => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${track.album.images[0].url}" alt="Playlist Cover" />
            <p>${track.name} by ${track.artists.map(artist => artist.name).join(', ')}</p>
            <button onclick="playTopSong('${track.external_urls.spotify}')">Play on YouTube</button>
        `;
        ul.appendChild(li);
    });

    playlistResult.appendChild(ul);
}

// Function to play the top song on YouTube
function playTopSong(spotifyUrl) {
    // Extract the Spotify track ID from the Spotify URL
    const trackId = spotifyUrl.split('/').pop();
    
    // Call the function to search for the related YouTube videos
    searchRelatedVideosOnYouTube(`Spotify ${trackId}`)
        .then(videos => {
            if (videos && videos.length > 0) {
                // Embed the YouTube player with the top video
                embedYouTubePlayer(videos[0].videoId);
            }
        });
}
document.getElementById('searchButton').addEventListener('click', () => {
    const songName = document.getElementById('songInput').value;
    searchRelatedVideosOnYouTube(songName)
        .then(videos => {
            if (videos) {
                const resultElement = document.getElementById('result');
                resultElement.innerHTML = '<p>Related YouTube videos:</p>';
                videos.forEach(video => {
                    resultElement.innerHTML += `<p>- ${video.title} (Video ID: ${video.videoId})</p>`;
                });
                if (videos.length > 0) {
                    // Embed the YouTube player with the first video
                    embedYouTubePlayer(videos[0].videoId);
                }
            }
        });
});

function embedYouTubePlayer(videoId) {
    const youtubePlayerElement = document.getElementById('youtubePlayer');
    youtubePlayerElement.innerHTML = `
        <iframe
            width="640"
            height="360"
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen
            origin-when-cross-origin
            gesture="media" 
            allow="encrypted-media"
        ></iframe>
        <p><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Watch on YouTube</a></p>
    `;
}

async function searchRelatedVideosOnYouTube(songName) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&q=${encodeURIComponent(songName)}&part=snippet&type=video&maxResults=5`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const videos = data.items.map(item => ({
                title: item.snippet.title,
                videoId: item.id.videoId,
            }));
            return videos;
        } else {
            console.log('No related YouTube videos found');
            return null;
        }
    } catch (error) {
        console.error('Error searching for related videos on YouTube:', error);
        return null;
    }
}

function fetchQuote() {
    const quoteTextElement = document.getElementById('quote-text');

    fetch("https://type.fit/api/quotes")
        .then(response => response.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * data.length);
            const randomQuote = data[randomIndex].text;

            quoteTextElement.textContent = `"${randomQuote}"`;
        })
        .catch(error => {
            console.error('Error fetching quote:', error);
            quoteTextElement.textContent = 'Failed to fetch a quote. Please try again.';
        });
}

const apiKey = "b20646194c5d77e03a9d334a4f69d8b6";

// Initialisation de la carte Leaflet
const map = L.map('map').setView([35.678, 10.096], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker([35.678, 10.096]).addTo(map);

// Éléments du DOM
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const recentSearchesContainer = document.getElementById('recent-searches');
const forecastContainer = document.getElementById('forecast-container');
const loader = document.getElementById('loader');

let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Fonction principale pour récupérer météo actuelle + prévisions 5 jours
async function fetchWeather(city) {
    if (!city.trim()) return;

    loader.classList.remove('hidden');

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=fr`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=fr`;

    try {
        // Exécution des deux requêtes API en parallèle
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);
        
        if (!weatherRes.ok || !forecastRes.ok) {
            alert("Ville non trouvée. Veuillez vérifier l'orthographe !");
            return;
        }

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        // 1. Mettre à jour la météo actuelle
        cityNameEl.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
        tempEl.textContent = Math.round(weatherData.main.temp);
        descEl.textContent = weatherData.weather[0].description;
        humidityEl.textContent = weatherData.main.humidity;
        windEl.textContent = Math.round(weatherData.wind.speed * 3.6);

        // 2. Mettre à jour la carte
        const { lat, lon } = weatherData.coord;
        map.setView([lat, lon], 12);
        marker.setLatLng([lat, lon])
              .bindPopup(`<b>${weatherData.name}</b><br>${Math.round(weatherData.main.temp)}°C - ${weatherData.weather[0].description}`)
              .openPopup();

        // 3. Mettre à jour les prévisions 5 jours
        renderForecast(forecastData.list);

        // 4. Ajouter à l'historique
        saveToHistory(weatherData.name);

    } catch (error) {
        console.error("Erreur de récupération météo :", error);
        alert("Une erreur s'est produite lors de la connexion au service météo.");
    } finally {
        loader.classList.add('hidden');
    }
}

// Fonction pour afficher les prévisions (1 relevé par jour vers 12:00)
function renderForecast(list) {
    forecastContainer.innerHTML = '';

    // Filtrer pour obtenir une prévision par jour (vers midi)
    const dailyForecasts = list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const card = document.createElement('div');
        card.classList.add('forecast-card');
        card.innerHTML = `
            <h3>${date}</h3>
            <img src="${iconUrl}" alt="${item.weather[0].description}">
            <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
            <div class="forecast-desc">${item.weather[0].description}</div>
        `;

        forecastContainer.appendChild(card);
    });
}

function saveToHistory(cityName) {
    if (!recentCities.includes(cityName)) {
        recentCities.unshift(cityName);
        if (recentCities.length > 4) recentCities.pop();
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        renderHistory();
    }
}

function renderHistory() {
    recentSearchesContainer.innerHTML = '';
    recentCities.forEach(city => {
        const btn = document.createElement('button');
        btn.classList.add('recent-btn');
        btn.textContent = city;
        btn.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeather(city);
        });
        recentSearchesContainer.appendChild(btn);
    });
}

searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') fetchWeather(cityInput.value);
});

renderHistory();
fetchWeather('Kairouan');
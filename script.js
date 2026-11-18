const BASE_URL = "https://api.weatherapi.com/v1";

const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const message = document.getElementById("message");

async function getWeather(query) {
  showMessage("Loading...");
  try {
    const url = `${BASE_URL}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=3&aqi=no&alerts=no`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ? data.error.message : "Something went wrong");
    }

    updateUI(data);
    showMessage("");
  } catch (err) {
    showMessage(err.message === "Failed to fetch" ? "Network error, check your connection" : err.message);
    console.error(err);
  }
}

function updateUI(data) {
  const { location, current, forecast } = data;

  document.getElementById("cityName").innerText = location.name;
  document.getElementById("country").innerText = `${location.region ? location.region + ", " : ""}${location.country}`;
  document.getElementById("temp").innerText = Math.round(current.temp_c) + "°C";
  document.getElementById("desc").innerText = current.condition.text;
  document.getElementById("humidity").innerText = current.humidity;
  document.getElementById("wind").innerText = current.wind_kph;
  document.getElementById("feels").innerText = Math.round(current.feelslike_c);

  const iconEl = document.getElementById("icon");
  iconEl.src = "https:" + current.condition.icon;
  iconEl.alt = current.condition.text;
  iconEl.hidden = false;

  document.getElementById("mapFrame").src =
    `https://www.google.com/maps?q=${location.lat},${location.lon}&z=10&output=embed`;

  document.getElementById("forecastStrip").innerHTML = forecast.forecastday
    .map((d, i) => {
      const dayName = i === 0
        ? "Today"
        : new Date(d.date).toLocaleDateString("en-US", { weekday: "short" });
      return `
        <div class="item">
          <div>${dayName}</div>
          <img src="https:${d.day.condition.icon}" alt="${d.day.condition.text}" />
          <div class="main">${Math.round(d.day.maxtemp_c)}°</div>
          <div class="sub">${Math.round(d.day.mintemp_c)}°</div>
          <div class="sub">🌧️ ${d.day.daily_chance_of_rain}%</div>
        </div>`;
    })
    .join("");

  const nowEpoch = location.localtime_epoch;
  const allHours = forecast.forecastday.flatMap(d => d.hour);
  const startIndex = Math.max(0, allHours.findIndex(h => h.time_epoch + 3600 > nowEpoch));
  const hours = allHours.slice(startIndex, startIndex + 24);

  document.getElementById("hourlyStrip").innerHTML = hours
    .map((h, i) => `
      <div class="item ${i === 0 ? "now" : ""}">
        <div>${i === 0 ? "Now" : h.time.split(" ")[1]}</div>
        <img src="https:${h.condition.icon}" alt="${h.condition.text}" />
        <div class="main">${Math.round(h.temp_c)}°</div>
        <div class="sub">🌧️ ${h.chance_of_rain}%</div>
      </div>`)
    .join("");
}

function showMessage(text) {
  message.innerText = text;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const city = input.value.trim();
  if (city) getWeather(city);
});

if (API_KEY === "PUT_YOUR_API_KEY_HERE") {
  showMessage("Add your WeatherAPI key in config.js first");
} else if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => getWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
    () => getWeather("Cairo")
  );
} else {
  getWeather("Cairo");
}

document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-container');
    const stationInput = document.getElementById('station-input');
    const suggestionList = document.getElementById('suggestion-list');
    const loadButton = document.getElementById('load-button');
    const loadingIndicator = document.getElementById('loading-indicator');

    let selectedStation = {
        name: 'Bamberg, Marienstraße',
        coordData: 'coord:4421153.17:630856.29:NAV4:Bamberg,+Marienstraße',
    };

    let debounceTimer;

    // Event listeners
    stationInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchBusStations(stationInput.value);
        }, 300); // debounced searches prevents too many requests
    });

    loadButton.addEventListener('click', () => {
        loadBusSchedule();
    });

    // Handle suggestion selection
    suggestionList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('suggestion-item')) {
            selectedStation = {
                name: e.target.dataset.name,
                coordData: e.target.dataset.coord,
            };

            stationInput.value = selectedStation.name;
            suggestionList.innerHTML = ''; // clear suggestions after selection
        }
    });

    // Close suggestion when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== stationInput && e.target !== suggestionList) {
            suggestionList.innerHTML = '';
        }
    });

    loadBusSchedule();

    // Search bus stations using OpenStreetMap with coordniate transformation
    async function searchBusStations(query) {
        if (!query || query.length < 2) {
            suggestionList.innerHTML = '';
            return;
        }

        try {
            // Focus on German address (viewbox around Germany)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=de&addressdetails=1&limit=5&viewbox=8.5,48.5,12.5,50.5&bounded=1`, {
                headers: {
                    'User-Agent': 'VGN-Bus-Schedule-App',
                },
            });

            const data = await response.json();
            suggestionList.innerHTML = ''; // clear previous suggestions

            if (data && data.length > 0) {
                data.forEach(place => {
                    const town = place.address?.town || place.address?.city || place.address?.village || 'Unknown';
                    const road = place.address?.road || place.address?.pedestrian || 'Unknown Street';
                    const name = `${town}, ${road}`;

                    /**
                     * Transform WGS84 coordinates to approximate NAV4
                     * This is a very simplified transformation, not exact.
                     */
                    const approxX = transformToNAV4X(parseFloat(place.lon), parseFloat(place.lat));
                    const approxY = transformToNAV4Y(parseFloat(place.lon), parseFloat(place.lat));

                    const coordData = `coord:${approxX}:${approxY}:NAV4:${encodeURIComponent(name)}`;

                    const item = document.createElement('div');
                    item.className = 'suggestion-item osm-result';
                    item.textContent = name;
                    item.dataset.name = name;
                    item.dataset.coord = coordData;

                    suggestionList.appendChild(item);
                });
            } else {
                // Show "no results" message
                const noResults = document.createElement('div');
                noResults.className = 'suggestion-item';
                noResults.textContent = 'No results found';
                suggestionList.appendChild(noResults);
            }
        } catch (error) {
            console.error('Error in OSM search: ', error);
            // Show error message in suggestion list
            suggestionList.innerHTML = '';
            const errorItem = document.createElement('div');
            errorItem.className = 'suggestion-item';
            errorItem.textContent = 'Error searching for locations';
            suggestionList.appendChild(errorItem);
        }
    }

    // Simplified transformation from WGS84 to approximate NAV4 coordinates
    // Note: This is a rough approximation for the Nuremberg/Bavaria region
    function transformToNAV4X(lon, lat) {
        // Center point reference: Nuremberg
        const centerLon = 11.0767;
        const centerLat = 49.4521;
        const scaleFactor = 111320; // Approx meters per degree at this latitude

        // Basic transformation - would need proper equations for production use
        return Math.round(4400000 + (lon - centerLon) * scaleFactor * Math.cos(centerLat * Math.PI/180));
    }

    function transformToNAV4Y(lon, lat) {
        // Center point reference: Nuremberg
        const centerLat = 49.4521;
        const scaleFactor = 111320; // Approx meters per degree

        // Basic transformation - would need proper equations for production use
        return Math.round(630000 + (lat - centerLat) * scaleFactor);
    }

    function loadBusSchedule() {
        const stationName = selectedStation.name || 'Bamberg, Marienstraße 7';
        const coordData = selectedStation.coordData || 'coord:4421153.17:630856.29:NAV4:Bamberg,+Marienstraße';
        const encodedTitle = encodeURIComponent(`Departs from ${stationName}`);

        loadingIndicator.style.display = 'block';
        scheduleContainer.innerHTML = '';

        const webview = document.createElement('webview');
        webview.src = 'https://www.vgn.de/atafel?'
            + `name=${encodeURIComponent(stationName)}`
            + `&dm=${encodeURIComponent(coordData)}`
            + `&layout=2`
            + `&title=${encodedTitle}`
            + '&means=5';
        webview.style.width = '100%';
        webview.style.height = '350px';
        webview.style.border = 'none';
        webview.allowpopups = false;
        webview.partition = 'vgn-schedule';
        webview.disablewebsecurity = false;

        webview.addEventListener('did-start-loading', () => {
            loadingIndicator.style.display = 'block';
        });

        webview.addEventListener('did-finish-load', () => {
            loadingIndicator.style.display = 'none';
        });

        webview.addEventListener('did-fail-load', (event) => {
            console.error('Failed to load content: ', event);
            loadingIndicator.style.display = 'none';
            scheduleContainer.innerHTML = `<p>Failed to load schedule. Error: ${event.errorDescription}</p>`;
        });

        scheduleContainer.appendChild(webview);
    }
});

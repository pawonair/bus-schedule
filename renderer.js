document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-container');
    const stationInput = document.getElementById('station-input');
    const suggestionList = document.getElementById('suggestion-list');
    const loadButton = document.getElementById('load-button');
    // const loadingIndicator = document.getElementById('loading-indicator');

    let selectedStation = {
        name: 'Bamberg, ZOB',
        nameInfo: 'de:09461:20200',
        coordData: 'coord:4420478.90:630830.91:NAV4:Bamberg,+ZOB',
        type: 'stopID',
        availableTransportModes: ['5'] // Default to Bus
    };

    let debounceTimer;

    // Event listeners
    stationInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchVGNStations(stationInput.value);
        }, 300); // debounced searches prevents too many requests
    });

    loadButton.addEventListener('click', () => {
        loadBusSchedule();
    });

    // Handle suggestion selection
    suggestionList.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('suggestion-item')) {
            const suggestionData = JSON.parse(e.target.dataset.suggestion);

            await handleSuggestionSelection(suggestionData, e.target.textContent);

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

    // Search VGN stations
    async function searchVGNStations(query) {
        if (!query || query.length < 2) {
            suggestionList.innerHTML = '';
            return;
        }

        try {
            suggestionList.innerHTML = '<div class="suggestion-item loading">🔍 Searching stops...</div>';

            const response = await fetch(
                `https://www.vgn.de/ib/site/tools/EFA_Suggest_v3.php?` +
                // `https://www.vgn.de/ib/site/tools/DEFAS_Suggest.php?` +
                `query=${encodeURIComponent(query)}` +
                `&minChars=2`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'VGN-Bus-Schedule-App/1.0',
                    },
                },
            );

            if (!response.ok) throw new Error('VGN API request failed.');

            const data = await response.json();
            parseVGNSuggestions(data || {});
            
        } catch (error) {
            console.error('VGN search failed: ', error);
            searchOSMLocations(query);
        }
    }

    function parseVGNSuggestions(dataObj) {
        let parsedData = [];

        Object.keys(dataObj).forEach(key => {
            const keyArr = dataObj[key];
            if (Array.isArray(keyArr)) {
                keyArr.forEach((val, i) => {
                    if (!parsedData[i]) parsedData[i] = {};
                    parsedData[i][key] = val;
                });
            }
        });

        displayVGNSuggestions(parsedData);
    }

    function displayVGNSuggestions(suggestions) {
        suggestionList.innerHTML = '';

        if (suggestions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'suggestion-item no-results';
            noResults.textContent = 'No VGN stations found.';
            suggestionList.appendChild(noResults);
            return;
        }

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item vgn-result';
            item.dataset.suggestion = JSON.stringify(suggestion); // store complete suggestion data

            const typeIndicator = document.createElement('div');
            typeIndicator.className = suggestion.data.type ? `suggestion-type ${getTypeDescription(suggestion.data.type)}` : 'map';
            
            const itemText = document.createElement('div');
            itemText.textContent = suggestion.suggestions;

            item.appendChild(typeIndicator);
            item.appendChild(itemText);

            suggestionList.appendChild(item);
        });
    }

    async function handleSuggestionSelection(data, value) {
        try {
            selectedStation.nameInfo = data.data.name || data.id;
            selectedStation.nameInfoBackup =  data.data.name || data.id;
            selectedStation.name = value;
            selectedStation.nameBackup = value;
            selectedStation.place = data.data.place;
            selectedStation.type = data.data.type;

            if (selectedStation.type === 'coord') selectedStation.coordData = `coord:${data.data.name}`;

        } catch (error) {
            console.error('Error handling suggestion selection: ', error);
        }
    }

    // Search bus stations using OpenStreetMap with coordniate transformation
    async function searchOSMLocations(query) {
        try {
            suggestionList.innerHTML = '<div class="suggestion-item loading">📍 Searching location...</div>';

            // Focus on German address (viewbox around Germany)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&q=${encodeURIComponent(query)}&` +
                `countrycodes=de&addressdetails=1&limit=3&` +
                `viewbox=10.3,49.2,11.8,50.2&bounded=1`,
                {
                    headers: {
                        'User-Agent': 'VGN-Bus-Schedule-App',
                    },
                },
            );

            const data = await response.json();
            displayOSMSuggestions(data);

        } catch (error) {
            console.error('OSM search failed: ', error);
            suggestionList.innerHTML = '<div class="suggestion-item error">Search failed.</div>';
        }
    }

    function displayOSMSuggestions(places) {
        suggestionList.innerHTML = ''; // clear previous suggestions

        if (places.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'suggestion-item';
            noResults.textContent = 'No results found';
            suggestionList.appendChild(noResults);
        }

        data.forEach(place => {
            const town = place.address?.town || place.address?.city || place.address?.village || 'Unknown';
            const road = place.address?.road || place.address?.pedestrian || 'Unknown Street';
            const name = `${town}, ${road}`;

            /**
             * Transform WGS84 coordinates to approximate NAV4
             * This is a very simplified transformation, not exact.
             */
            const approxX = transformToNAV4X(parseFloat(place.lon));
            const approxY = transformToNAV4Y(parseFloat(place.lat));

            const osmData = {
                name: name,
                coord: `${approxX}:${approxY}`,
                type: 'address',
                stateless: `coord:${approxX}:${approxY}:NAV4:${encodeURIComponent(name)}`,
            };

            const item = document.createElement('div');
            item.className = 'suggestion-item osm-result';
            item.textContent = name;
            item.dataset.suggestion = JSON.stringify(osmData);

            const typeIndicator = document.createElement('span');
            typeIndicator.className = 'suggestion-type';
            type.textContent = ' (Address)';
            item.appendChild(typeIndicator);

            suggestionList.appendChild(item);
        });
    }

    // Get type descriptions
    function getTypeDescription(type) {
        const typeMap = {
            'stopID': 'h_mobiledata_badge',
            'poiID': 'location_on',
            'coord': 'home',
        };

        return typeMap[type] || type;
    }

    // Simplified transformation from WGS84 to approximate NAV4 coordinates
    // Note: This is a rough approximation for the Nuremberg/Bavaria region
    function transformToNAV4X(lon) {
        // Center point reference: Nuremberg
        const centerLon = 11.0767;
        const centerLat = 49.4521;
        const scaleFactor = 111320; // Approx meters per degree at this latitude

        // Basic transformation - would need proper equations for production use
        return Math.round(4400000 + (lon - centerLon) * scaleFactor * Math.cos(centerLat * Math.PI/180));
    }

    function transformToNAV4Y(lat) {
        // Center point reference: Nuremberg
        const centerLat = 49.4521;
        const scaleFactor = 111320; // Approx meters per degree

        // Basic transformation - would need proper equations for production use
        return Math.round(630000 + (lat - centerLat) * scaleFactor);
    }

    function loadBusSchedule() {
        const stationName = selectedStation.name || 'Bamberg, ZOB';
        const coordData = selectedStation.coordData || selectedStation.nameInfo || 'coord:4420478.90:630830.91:NAV4:Bamberg,+ZOB';
        const encodedTitle = encodeURIComponent(`Departures near ${stationName}`);

        loadButton.className.replace = 'load-button is-loading';
        loadButton.innerText = 'Loading...';
        scheduleContainer.innerHTML = '';

        const vgnUrl = 'https://www.vgn.de/atafel?' +
            `name=${encodeURIComponent(stationName)}` +
            `&dm=${encodeURIComponent(coordData)}` +
            `&layout=2` +
            `&title=${encodedTitle}` +
            '&means=5';
        
        // console.log('Loading VGN URL: ', vgnUrl);

        const webview = document.createElement('webview');
        webview.src = vgnUrl;
        webview.style.width = '100%';
        webview.style.height = '350px';
        webview.style.border = 'none';
        webview.allowpopups = false;
        webview.partition = 'vgn-schedule';
        // webview.disablewebsecurity = false;

        webview.addEventListener('did-start-loading', () => {
            loadButton.className = 'load-button is-loading';
            loadButton.innerText = 'Loading...';
        });

        webview.addEventListener('did-finish-load', () => {
            loadButton.className = 'load-button';
            loadButton.innerText = 'Load Schedule';
        });

        webview.addEventListener('did-fail-load', (event) => {
            console.error('Failed to load content: ', event);
            loadButton.className = 'load-button';
            loadButton.innerText = 'Load Schedule';
            scheduleContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load schedule for ${stationname}</p>
                    <p>Error: ${error.errorDescription}</p>
                    <button onClick="loadBusSchedule()">Retry</button>
                    <details style="margin-top: 10px;">
                        <summary>Debug Info:</summary>
                        <p>URL: ${vgnUrl}</p>
                        <p>Station: ${JSON.stringify(selectedStation, null, 2)}</p>
                    </details>
                </div>
            `;
        });

        scheduleContainer.appendChild(webview);
    }

    // Initialize backup values
    selectedStation.nameInfoBackup = selectedStation.nameInfo;
    selectedStation.nameBackup = selectedStation.name;
});

document.addEventListener('DOMContentLoaded', () => {
    const scheduleContainer = document.getElementById('schedule-container');
    const stationInput = document.getElementById('station-input');
    const loadButton = document.getElementById('load-button');
    const titleInput = document.getElementById('title-input');
    const loadingIndicator = document.getElementById('loading-indicator');

    loadButton.addEventListener('click', () => {
        loadBusSchedule();
    });

    loadBusSchedule();

    function loadBusSchedule() {
        const station = stationInput.value || 'Bamberg, Marienstraße 7';
        const encodedStation = encodeURIComponent(station);
        const coordination = 'coord:4421153.17:630856.29:NAV4:Bamberg,+Marienstraße';
        const encodedCoordination = encodeURIComponent(coordination);
        const encodedTitle = encodeURIComponent(titleInput.value || 'Departures');

        loadingIndicator.style.display = 'block';
        scheduleContainer.innerHTML = '';

        const webview = document.createElement('webview');
        webview.src = 'https://www.vgn.de/atafel?'
            + `name=${encodedStation}`
            + `&dm=${encodedCoordination}`
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

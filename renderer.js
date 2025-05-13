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
        const encodedTitle = encodeURIComponent(titleInput);

        loadingIndicator.style.display = 'block';
        scheduleContainer.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.vgn.de/atafel?'
            + `name=${encodedStation}`
            + `&dm=${encodedCoordination}`
            + `&layout=2`
            + `&title=${encodedTitle}`
            + '&means=5';
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';

        iframe.onload = () => {
            loadingIndicator.style.display = 'none';
        };

        scheduleContainer.appendChild(iframe);
    }
});

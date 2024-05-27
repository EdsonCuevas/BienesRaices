(function () {
    const lat = 19.1134727;
    const lng = -104.3426422;
    const mapa = L.map('mapa').setView([lat, lng], 14);


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);


})()
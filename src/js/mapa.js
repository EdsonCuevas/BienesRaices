(function () {
    const lat = 19.1134727;
    const lng = -104.3426422;
    const mapa = L.map('mapa').setView([lat, lng], 14);
    let marker;

    // Utilizar Provider y Geocoder
    const geocodeService = L.esri.Geocoding.geocodeService();


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // Pin
    marker = new L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
        .addTo(mapa)

    // Detectar movimiento del pin
    marker.on('moveend', function (e) {
        marker = e.target;
        const posicion = marker.getLatLng();
        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

        //Obtener nombre de las calles al soltar pin
        geocodeService.reverse().latlng(posicion, 14).run(function (error, res) {
            marker.bindPopup(res.address.LongLabel)

            // Llenar los campos
            document.querySelector('.calle').textContent = res?.address?.Address ?? '';
            document.querySelector('#calle').value = res?.address?.Address ?? '';
            document.querySelector('#lat').value = res?.latlng?.lat ?? '';
            document.querySelector('#lng').value = res?.latlng?.lng ?? '';
        })
    })

})()
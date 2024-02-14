import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return null;
}

const Dashboard = () => {
    // Anfangsposition auf einen zentralen Punkt in Deutschland gesetzt und Zoom angepasst
    const [position, setPosition] = useState([51.1657, 10.4515]); // Geographische Mitte Deutschlands
    const [zoom] = useState(6); // Angepasster Zoom-Wert für eine Übersicht über Deutschland
    const [pollenData, setPollenData] = useState(null);
    const [regionName, setRegionName] = useState('');

    const updateLocationInfo = useCallback(async (latitude, longitude) => {
        const region = await getRegionNameFromCoords(latitude, longitude);
        setRegionName(region);
        if (region) {
            fetchPollenDataForRegion(region);
        }
    }, []);

    const getRegionNameFromCoords = async (latitude, longitude) => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=6&addressdetails=1`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.address.state || data.address.city;
        } catch (error) {
            console.error('Fehler beim Abrufen des Ortsnamens:', error);
            return null;
        }
    };

    const fetchPollenDataForRegion = async (regionName) => {
        const response = await fetch('/api/pollendata');
        const data = await response.json();
        console.info(data.content); // Ausgabe der gesamten Inhalte zur Überprüfung

        // Suchen nach einer Region, deren Name den übergebenen regionName-String enthält
        const dataForRegion = data.content.find(region =>
            region.region_name.toLowerCase().includes(regionName.toLowerCase())
        );

        if (dataForRegion) {
            setPollenData(dataForRegion);
        } else {
            console.log(`Keine Daten für Region: ${regionName} gefunden.`);
            setPollenData(null); // Setzen von null oder einem leeren Objekt, falls keine Übereinstimmung gefunden wurde
        }
    };

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                setPosition([position.coords.latitude, position.coords.longitude]);
                updateLocationInfo(position.coords.latitude, position.coords.longitude);
            }, () => {
                alert('Standortzugriff wurde verweigert oder es ist ein Fehler aufgetreten.');
            });
        } else {
            alert('Geolocation wird von Ihrem Browser nicht unterstützt.');
        }
    }, [updateLocationInfo]);

    useEffect(() => {
        updateLocationInfo(position[0], position[1]);
    }, [position, updateLocationInfo]);

    return (
        <div>
            <h2 style={{ padding: 25 }}><b>Willkommen auf der PollenMap</b></h2>
            <MapContainer center={position} zoom={zoom} style={{ height: '88vh', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker setPosition={setPosition} />
                <Marker position={position}>
                    <Popup>
                        {pollenData ? (
                            <div>
                                <h3>{pollenData.region_name}</h3>
                                <p>{pollenData.partregion_name}</p>
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Pollenart</th>
                                        <th>Heute</th>
                                        <th>Morgen</th>
                                        <th>Übermorgen</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(pollenData.Pollen).map(([pollenName, pollenValues]) => (
                                        <tr key={pollenName}>
                                            <td>{pollenName}</td>
                                            <td>{pollenValues.today}</td>
                                            <td>{pollenValues.tomorrow}</td>
                                            <td>{pollenValues.dayafter_to}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Lade Pollendaten...</p>
                        )}
                    </Popup>
                </Marker>
            </MapContainer>
            {/*<div style={{ padding: 25 }}>*/}
            {/*    <h3>Region</h3>*/}
            {/*    <p>{regionName || 'Lade Region...'}</p>*/}
            {/*</div>*/}
            {/*<div style={{ padding: 25 }}>*/}
            {/*    <h3>Pollendaten</h3>*/}
            {/*    {pollenData ? (*/}
            {/*        <pre>{JSON.stringify(pollenData, null, 2)}</pre>*/}
            {/*    ) : (*/}
            {/*        <p>Lade Daten...</p>*/}
            {/*    )}*/}
            {/*</div>*/}
        </div>
    );
};

export default Dashboard;

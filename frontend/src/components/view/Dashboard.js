import React, {useState, useEffect, useCallback} from 'react';
import {MapContainer, TileLayer, Marker, Popup, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Bar} from 'react-chartjs-2';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import logo from './logo_final.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({setPosition}) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return null;
}

const AdsensePopup = ({onClose}) => {
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'grey',
            padding: '20px',
            zIndex: 1000,
        }}>
            <h2>Google Adsense Werbung</h2>
            <p>Dies ist ein simuliertes Adsense-Ad für Demonstrationszwecke.</p>
            <button onClick={onClose}>Schließen</button>
        </div>
    );
};

const Legend = () => (
    <div style={{marginTop: '20px', textAlign: 'center'}}>
        <div><span style={{color: 'lightgray'}}>■</span> Stufe 0</div>
        <div><span style={{color: 'green'}}>■</span> Stufe 1-2</div>
        <div><span style={{color: 'orange'}}>■</span> Stufe 3-4</div>
        <div><span style={{color: 'red'}}>■</span> Stufe 5 und darüber</div>
    </div>
);

const Dashboard = () => {
    const [position, setPosition] = useState([51.1657, 10.4515]);
    const [zoom] = useState(6);
    const [pollenData, setPollenData] = useState(null);
    const [regionName, setRegionName] = useState('');
    const [view, setView] = useState('data'); // 'data' für Pollendaten, 'chart' für den Graphen
    const [currentDay, setCurrentDay] = useState('today');
    const [selectedPollenTypes, setSelectedPollenTypes] = useState([]);
    const [searchAddress, setSearchAddress] = useState('');

    const updateLocationInfo = useCallback(async (latitude, longitude) => {
        const region = await getRegionNameFromCoords(latitude, longitude);
        setRegionName(region);
        if (region) {
            fetchPollenDataForRegion(region);
        }
    }, []);

    const [showAdPopup, setShowAdPopup] = useState(true); // Zustand für die Anzeige des Popups

    const handleCloseAdPopup = () => {
        setShowAdPopup(false); // Schließt das Popup
    };

    const getColorForLevel = (level) => {
        if (level >= 5) {
            return 'red'; // Für Stufe 5 und darüber
        } else if (level >= 3) {
            return 'orange'; // Für Stufe 3 und 4
        } else if (level >= 1) {
            return 'green'; // Für Stufe 1 und 2
        } else {
            return 'lightgray'; // Für Stufe 0
        }
    };

    const searchLocation = async () => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchAddress}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.length > 0) {
                const {lat, lon} = data[0];
                setPosition([parseFloat(lat), parseFloat(lon)]);
                updateLocationInfo(parseFloat(lat), parseFloat(lon));
            } else {
                alert('Kein Ort gefunden.');
            }
        } catch (error) {
            console.error('Fehler beim Suchen des Ortes:', error);
        }
    };

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

    const extractHigherValue = (value) => {
        // Prüfen, ob der Wert ein String mit einem Bindestrich ist, was auf einen Bereich hinweist
        if (typeof value === 'string' && value.includes('-')) {
            // Aufteilen des Strings am Bindestrich und Umwandlung in Zahlen
            const parts = value.split('-').map(Number);
            // Rückgabe des höheren Werts
            return Math.max(...parts);
        }
        // Ist der Wert kein Bereich, wird er direkt zurückgegeben
        return value;
    };

    // Zusätzliche Funktion zum Rendern des Graphen
    const renderChart = () => {
        if (selectedPollenTypes.length === 0) {
            return <p>Bitte wählen Sie mindestens einen Pollentyp aus.</p>;
        }

        const allLabels = pollenData ? Object.keys(pollenData.Pollen) : [];
        const labels = allLabels.filter(label => selectedPollenTypes.includes(label)); // Filter basierend auf ausgewählten Typen

        let dayData = [];
        switch (currentDay) {
            case 'today':
                dayData = labels.map(label => extractHigherValue(pollenData.Pollen[label].today));
                break;
            case 'tomorrow':
                dayData = labels.map(label => extractHigherValue(pollenData.Pollen[label].tomorrow));
                break;
            case 'dayafter_to':
                dayData = labels.map(label => extractHigherValue(pollenData.Pollen[label].dayafter_to));
                break;
            default:
                dayData = []; // Fallback, sollte nicht erreicht werden
        }

        const backgroundColors = dayData.map(level => getColorForLevel(level));

        const data = {
            labels,
            datasets: [
                {
                    label: `Pollenbelastung ${currentDay === 'today' ? 'heute' : currentDay === 'tomorrow' ? 'morgen' : 'übermorgen'}`,
                    data: dayData,
                    backgroundColor: backgroundColors,
                },
            ],
        };
        return (<div>
            <Bar data={data}/>
            <Legend/>
        </div>);
    };

    // Tabelle für Pollendaten
    const renderDataTable = () => {
        if (selectedPollenTypes.length === 0) {
            return <p>Bitte wählen Sie mindestens einen Pollentyp aus.</p>;
        }

        return (
            <div>
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
                    {pollenData && Object.entries(pollenData.Pollen)
                        .filter(([pollenType]) => selectedPollenTypes.includes(pollenType))
                        .map(([pollenType, data]) => (
                            <tr key={pollenType}>
                                <td>{pollenType}</td>
                                <td style={{backgroundColor: getColorForLevel(data.today)}}>{data.today}</td>
                                <td style={{backgroundColor: getColorForLevel(data.today)}}>{data.tomorrow}</td>
                                <td style={{backgroundColor: getColorForLevel(data.today)}}>{data.dayafter_to}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Legend/>
            </div>
        );
    };

    // Funktion zum Aktualisieren der ausgewählten Pollenarten basierend auf Checkbox-Änderungen
    const handlePollenTypeChange = (pollenType) => {
        setSelectedPollenTypes(prevSelected => {
            if (prevSelected.includes(pollenType)) {
                // Entferne die Pollenart, wenn sie bereits ausgewählt war
                return prevSelected.filter(pt => pt !== pollenType);
            } else {
                // Füge die Pollenart hinzu, wenn sie noch nicht ausgewählt war
                return [...prevSelected, pollenType];
            }
        });
    };

    // Checkboxen für die Auswahl von Pollenarten
    const renderPollenTypeCheckboxes = () => {
        if (!pollenData) return null;

        return (
            <div style={{marginLeft: '50px'}}>
                <p style={{color: 'white', margin: '0 0 10px 0', textAlign: 'center'}}>Typen</p>
                <div style={{border: '1px solid white', padding: '10px', display: 'inline-flex'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap'}}>
                        {Object.keys(pollenData.Pollen).map(pollenType => (
                            <div key={pollenType} style={{marginRight: '20px', display: 'flex', alignItems: 'center'}}>
                                <input
                                    type="checkbox"
                                    style={{marginRight: '10px'}} // Abstand zwischen Checkbox und Text
                                    checked={selectedPollenTypes.includes(pollenType)}
                                    onChange={() => handlePollenTypeChange(pollenType)}
                                />
                                <label style={{color: 'white'}}>{pollenType}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {showAdPopup && <AdsensePopup onClose={handleCloseAdPopup}/>}
            <div className="header-container">
                <div style={{position: 'absolute', top: '0px', left: '550px', padding: '10px'}}>
                    <img src={logo} alt="Logo" className="App-logo" style={{height: '150px'}}/>
                </div>
                <h2 style={{padding: 25}}><b>Willkommen auf der PollenMap</b></h2>
            </div>
            <div style={{display: 'flex', justifyContent: 'center', margin: '20px 0'}}>
                <div className="search-container">
                    <input
                        type="text"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        placeholder="Ort suchen..."
                        className="custom-input"
                        style={{marginRight: '10px'}}
                    />
                    <button onClick={searchLocation}>Suchen</button>
                </div>
                {renderPollenTypeCheckboxes()}
            </div>
            <MapContainer center={position} zoom={zoom} style={{height: '88vh', width: '100%'}}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker setPosition={setPosition}/>
                <Marker position={position}>
                    <Popup>
                        {view === 'data' ? (
                            <div>
                                <h3>{pollenData ? pollenData.region_name : 'Keine Daten vorhanden'}</h3>
                                <button onClick={() => setView('chart')}>Zum Graphen wechseln</button>
                                {/* Hier wird die Tabelle eingefügt */}
                                {renderDataTable()}
                            </div>
                        ) : (
                            <div>
                                <h3>Graph der Pollenbelastung</h3>
                                <button onClick={() => setView('data')}>Zurück zu den Daten</button>
                                <div>
                                    {/* Umschalt-Buttons für die Tage */}
                                    <button onClick={() => setCurrentDay('today')}>Heute</button>
                                    <button onClick={() => setCurrentDay('tomorrow')}>Morgen</button>
                                    <button onClick={() => setCurrentDay('dayafter_to')}>Übermorgen</button>
                                    {/* Bedingte Darstellung des Charts oder der Daten */}
                                    {view === 'data' ? (
                                        <div>
                                            {renderChart()}
                                        </div>
                                    ) : (
                                        <div>
                                            {pollenData ? renderChart() : <p>Lade Daten...</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default Dashboard;

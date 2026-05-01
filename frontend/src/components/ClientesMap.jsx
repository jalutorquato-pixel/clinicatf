import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícones Customizados SVG (Cores solicitadas)
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const iconBlack = createIcon('#000000');
const iconBlue = createIcon('#3b82f6');
const iconYellow = createIcon('#eab308');
const iconTeal = createIcon('#1D9E75');

// Função auxiliar para determinar a cor do pino
const getPinColor = (client) => {
  const isInactive = client.is_active !== undefined ? !client.is_active : client.status === 'inativo';
  if (isInactive) {
    return iconBlack;
  }

  if (!client.created_at) return iconTeal;

  const createdDate = new Date(client.created_at);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 90) {
    return iconBlue; // 0 a 90 dias
  } else if (diffDays <= 180) {
    return iconYellow; // 91 a 180 dias
  } else {
    return iconTeal; // mais de 180 dias
  }
};

export default function ClientesMap({ clientes }) {
  // Coordenadas centrais padrão (Ex: São Paulo) caso não haja clientes
  const defaultCenter = [-23.550520, -46.633308];
  
  // Filtra clientes que possuem latitude e longitude válidas
  const mapClients = clientes.filter(c => c.latitude && c.longitude);

  return (
    <div className="map-wrapper" style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer 
        center={mapClients.length > 0 ? [mapClients[0].latitude, mapClients[0].longitude] : defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {mapClients.map((client) => (
          <Marker 
            key={client.id} 
            position={[client.latitude, client.longitude]} 
            icon={getPinColor(client)}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#1D9E75' }}>{client.full_name || client.nome}</h4>
                <p style={{ margin: '0 0 3px 0' }}><strong>Telefone:</strong> {client.phone || client.telefone || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>Cidade:</strong> {client.city || client.cidade || 'N/A'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

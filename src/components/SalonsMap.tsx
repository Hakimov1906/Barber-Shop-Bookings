import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Salon } from "@/data/salons";

let markerIconsConfigured = false;

function ensureMarkerIconsConfigured() {
  if (markerIconsConfigured) return;

  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });

  markerIconsConfigured = true;
}

const SalonsMap = ({ locations }: { locations: Salon[] }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) return;

    ensureMarkerIconsConfigured();

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const group = L.featureGroup();

    locations.forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude]).bindPopup(
        `<strong>${location.name}</strong><br/>${location.address}`,
      );
      marker.addTo(group);
    });

    group.addTo(map);

    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 14);
    } else {
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      map.remove();
    };
  }, [locations]);

  if (!locations.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground sm:h-[360px]">
        Нет координат для отображения на карте
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
      <div ref={mapContainerRef} className="h-[360px] w-full sm:h-[420px]" aria-label="Salons map" />
    </div>
  );
};

export default SalonsMap;

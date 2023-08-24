'use client';

import type { DirectionsResponseData, FindPlaceFromTextResponseData } from "@googlemaps/google-maps-services-js";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useMap } from "../hooks/useMap";
import useSWR from "swr";
import { fetcher } from "../utils/http";
import { Route } from "../utils/model";
import { socket } from "../utils/socket-io";

export function DriverPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);
  const [directionsData, setDirectionsData] = useState<DirectionsResponseData & { request: any }>();
  
  const { data: routes, error, isLoading } = useSWR<Route[]>('http://localhost:3000/routes', fetcher, {
    fallbackData: []
  });
  
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    }
  }, []);
  
  useEffect(() => {
    console.log(routes)
  }, [routes])
  
  const searchPlaces = async (event: FormEvent) => {
    event.preventDefault();
    const source = (document.getElementById("source") as HTMLInputElement).value;
    const destination = (document.getElementById("destination") as HTMLInputElement).value;
    
    const [ sourceResponse, destinationResponse ] = await Promise.all([
      fetch(`http://localhost:3000/places?text=${source}`),
      fetch(`http://localhost:3000/places?text=${destination}`)
    ]);
    
    const [sourcePlace, destinationPlace]: FindPlaceFromTextResponseData[] = await Promise.all([
      sourceResponse.json(),
      destinationResponse.json()
    ]);
    
    if (sourcePlace.status !== "OK") {
      console.error(sourcePlace);
      alert('Não foi possível encontrar a origem');
      return;
    }
    
    if (destinationPlace.status !== "OK") {
      console.error(destinationPlace);
      alert('Não foi possível encontrar o destino');
      return;
    }
    
    const placeSourceId = sourcePlace.candidates[0].place_id;
    const placeDestinationId = destinationPlace.candidates[0].place_id;
    
    const directionsResponse = await fetch(`http://localhost:3000/directions?originId=${placeSourceId}&destinationId=${placeDestinationId}`);
    const directionsData: DirectionsResponseData & { request: any } = await directionsResponse.json();
    setDirectionsData(directionsData);
    console.log('route gere')
    map?.removeAllRoutes();
    await map?.addRouteWithIcons({
      routeId: '1',
      startMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location
      },
      endMarkerOptions: {
        position: directionsData.routes[0].legs[0].end_location
      },
      carMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location
      }
    });
  }
  
  const createRoute = async () => {
    const startAddress = directionsData!.routes[0].legs[0].start_address;
    const endAddress = directionsData!.routes[0].legs[0].end_address;
    
    const response = await fetch('http://localhost:3000/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${startAddress} - ${endAddress}`,
        source_id: directionsData!.request.origin.place_id,
        destination_id: directionsData!.request.destination.place_id,
      })
    });
    
    const route = await response.json();
  }
  
  const startRoute = async () => {
    const routeId = (document.getElementById('route') as HTMLSelectElement).value;
    const response = await fetch(`http://localhost:3000/routes/${routeId}`);
    const route: Route = await response.json();
    
    map?.removeAllRoutes();
    await map?.addRouteWithIcons({
      routeId: routeId,
      startMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location
      },
      endMarkerOptions: {
        position: route.directions.routes[0].legs[0].end_location
      },
      carMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location
      }
    });
    
    const { steps } = route.directions.routes[0].legs[0];
    
    for (const step of steps) {
      await sleep(2000);
      map?.moveCar(routeId, step.start_location);
      socket.emit('new-points', {
        route_id: routeId,
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      })
      
      await sleep(2000);
      map?.moveCar(routeId, step.end_location);
      socket.emit('new-points', {
        route_id: routeId,
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      })
    }
  }
  
  return (
    <div style={{display: 'flex', flexDirection: 'row', height: '100%', width: '100%'}}>
      <div>
        <h1>Minha viagem</h1>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <select name="" id="route">
            {isLoading && <option>Carregando rotas...</option>}
            {routes!.map((route) => (
              <option key={route.id} value={route.id}>{route.name}</option>
            ))}
          </select>
          
          <button type="submit" onClick={startRoute}>Iniciar a viagem</button>
        </div>
        
      </div>
      <div id="map" style={{height: '100%', width: '100%'}} ref={mapContainerRef}></div>
    </div>
  )
}

export default DriverPage;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
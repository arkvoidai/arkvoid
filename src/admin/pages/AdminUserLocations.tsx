import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Map, Flag, Users, Activity, Globe } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

function getFlag(cc: string): string {
  if (!cc) return '';
  return cc.toUpperCase().split('').map(
    c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('');
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function AdminUserLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('user_locations').select('*');
      if (data) setLocations(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Aggregations
  const totalUsers = new Set(locations.map(l => l.user_id)).size;
  
  const byCountry: Record<string, {cc: string, count: number}> = {};
  const byCity: Record<string, {city: string, country: string, count: number}> = {};
  const mapData: Record<string, {lat: number, lon: number, count: number, cc: string, city: string}> = {};

  locations.forEach(loc => {
    // We only count unique users per location or just all logins?
    // Let's count all records as "activity" or aggregate by unique users.
    // For simplicity, aggregate by record count as "user visits"
    if (loc.country_name && loc.country_code) {
       if(!byCountry[loc.country_name]) byCountry[loc.country_name] = { cc: loc.country_code, count: 0 };
       byCountry[loc.country_name].count++;
    }
    
    if (loc.city && loc.country_code) {
      const cityKey = `${loc.city}, ${loc.country_code}`;
      if(!byCity[cityKey]) byCity[cityKey] = { city: loc.city, country: loc.country_code, count: 0 };
      byCity[cityKey].count++;
    }

    if (loc.latitude && loc.longitude) {
      const key = `${Math.round(loc.latitude*10)/10},${Math.round(loc.longitude*10)/10}`;
      if(!mapData[key]) mapData[key] = { lat: loc.latitude, lon: loc.longitude, count: 0, cc: loc.country_code, city: loc.city };
      mapData[key].count++;
    }
  });

  const topCountries = Object.entries(byCountry).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.count - a.count);
  const topCities = Object.values(byCity).sort((a,b) => b.count - a.count).slice(0, 20);
  const markers = Object.values(mapData);

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-2">
          <Globe className="h-6 w-6 text-emerald-500" />
          Global User Presence
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Geographic distribution of user logins and sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2">
            <Flag className="h-4 w-4" /> Countries Represented
          </div>
          <div className="text-2xl font-mono text-white">{topCountries.length}</div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Top Country
          </div>
          <div className="text-2xl font-mono text-white flex items-center gap-2">
             {topCountries[0] ? <>{getFlag(topCountries[0].cc)} {topCountries[0].name}</> : '-'}
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1 flex items-center gap-2">
            <Map className="h-4 w-4" /> Top City
          </div>
          <div className="text-2xl font-mono text-white">
             {topCities[0] ? `${topCities[0].city}, ${topCities[0].country}` : '-'}
          </div>
        </div>
      </div>
      
      {/* MAP */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-4 relative overflow-hidden flex justify-center items-center h-[500px]">
         <ComposableMap projection="geoMercator" projectionConfig={{ scale: 130 }} width={800} height={450}>
           <Geographies geography={geoUrl}>
             {({ geographies }) =>
               geographies.map((geo) => (
                 <Geography 
                   key={geo.rsmKey} 
                   geography={geo} 
                   fill="#1F2937" 
                   stroke="#374151" 
                   strokeWidth={0.5} 
                   style={{
                     default: { outline: 'none' },
                     hover: { outline: 'none', fill: '#374151' },
                     pressed: { outline: 'none' }
                   }}
                 />
               ))
             }
           </Geographies>
           {markers.map((m, i) => (
             <Marker key={i} coordinates={[m.lon, m.lat]}>
               <circle 
                 r={Math.min(2 + m.count * 1.5, 12)} 
                 fill="#F59E0B" 
                 opacity={0.7} 
                 className="animate-pulse"
               />
               <title>{m.city}, {m.cc}: {m.count} visits</title>
             </Marker>
           ))}
         </ComposableMap>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Countries Table */}
         <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] font-bold text-white">Country Breakdown</div>
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[var(--text-secondary)]">
                 <tr>
                    <th className="p-4 font-medium">Country</th>
                    <th className="p-4 font-medium text-right">Users</th>
                    <th className="p-4 font-medium text-right">% of Total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border-default)]">
                 {topCountries.map(c => (
                   <tr key={c.name} className="hover:bg-[var(--bg-elevated)]">
                     <td className="p-4 text-white flex items-center gap-2">
                       <span className="text-xl">{getFlag(c.cc)}</span> {c.name}
                     </td>
                     <td className="p-4 text-white text-right font-mono">{c.count}</td>
                     <td className="p-4 text-[var(--text-secondary)] text-right font-mono">
                       {locations.length > 0 ? Math.round((c.count / locations.length)*100) : 0}%
                     </td>
                   </tr>
                 ))}
                 {topCountries.length === 0 && (
                   <tr><td colSpan={3} className="p-8 text-center text-[var(--text-secondary)]">No location data.</td></tr>
                 )}
               </tbody>
            </table>
         </div>

         {/* Cities Table */}
         <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] font-bold text-white">Top 20 Cities</div>
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[var(--text-secondary)]">
                 <tr>
                    <th className="p-4 font-medium">City</th>
                    <th className="p-4 font-medium text-right">Visits</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border-default)]">
                 {topCities.map(c => (
                   <tr key={`${c.city}-${c.country}`} className="hover:bg-[var(--bg-elevated)]">
                     <td className="p-4 text-white flex items-center gap-2">
                       <span className="text-lg">{getFlag(c.country)}</span> {c.city || 'Unknown'}, {c.country}
                     </td>
                     <td className="p-4 text-white text-right font-mono">{c.count}</td>
                   </tr>
                 ))}
                 {topCities.length === 0 && (
                   <tr><td colSpan={2} className="p-8 text-center text-[var(--text-secondary)]">No location data.</td></tr>
                 )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

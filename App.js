import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Thermometer, Droplets, Wind, Mic, Users, Sun } from 'lucide-react-native';
//import * as ScreenOrientation from 'expo-screen-orientation';
import { supabase } from './supabase';

// --- COMPONENTE: Tarjeta de Sensor (Diseño Premium) ---
const SensorCard = ({ title, value, unit, icon, colors }) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.card}
  >
    <View style={styles.cardHeader}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  </LinearGradient>
);

// --- COMPONENTE: Barra de Ocupación (Moderna) ---
const OccupancyBar = ({ count }) => {
  const MAX_CAPACITY = 20;
  const TOTAL_ICONS = 10; // Usamos 10 iconos para una barra más fluida
  let activeIcons = Math.ceil((count / MAX_CAPACITY) * TOTAL_ICONS);
  if (activeIcons > TOTAL_ICONS) activeIcons = TOTAL_ICONS;
  if (count > 0 && activeIcons === 0) activeIcons = 1;

  const isCrowded = count > (MAX_CAPACITY * 0.7);
  const activeColor = isCrowded ? '#ff5252' : '#69f0ae'; // Rojo o Verde Neón

  return (
    <LinearGradient
      colors={['#263238', '#37474F']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={styles.occupancyBar}
    >
      <View style={styles.occupancyHeader}>
        <Users color="white" size={22} style={{ marginRight: 10 }} />
        <Text style={styles.occupancyTitle}>Nivel de Ocupación</Text>
      </View>
      
      <View style={styles.occupancyBody}>
        {/* Fila de Iconos */}
        <View style={styles.iconsRow}>
          {[...Array(TOTAL_ICONS)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.personIcon, 
                { backgroundColor: i < activeIcons ? activeColor : 'rgba(255,255,255,0.1)' }
              ]} 
            />
          ))}
        </View>
        <Text style={styles.occupancyCount}>
          <Text style={{color: activeColor}}>{count}</Text>
          <Text style={{fontSize: 18, color: 'rgba(255,255,255,0.5)'}}> / {MAX_CAPACITY}</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

export default function App() {
  const [data, setData] = useState({
    temperature: 0, humidity: 0, noise_level: 0, gas_level: 0, light_level: 0, people_count: 0
  });

  useEffect(() => {
    //ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    
    const fetchLatestData = async () => {
      const { data: initialData } = await supabase
        .from('sensor_readings') 
        .select('*')
        .order('created_at', { ascending: false }).limit(1).single();
      if (initialData) setData(initialData);
    };
    fetchLatestData();

    const subscription = supabase
      .channel('dashboard-iot')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, 
        (payload) => setData(payload.new)
      ).subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} />
        
        <View style={styles.dashboardFrame}>
          {/* HEADER: Título y Luz Ambiental */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Monitor de Área</Text>
            <View style={styles.lightIndicator}>
              <Sun color="#FFD54F" size={20} />
              <Text style={styles.lightValue}>{data.light_level?.toFixed(0)} Lx</Text>
            </View>
          </View>
          
          <View style={styles.gridContainer}>
            {/* Fila 1 */}
            <View style={styles.row}>
              <SensorCard title="Temperatura" value={data.temperature?.toFixed(1)} unit="°C" icon={<Thermometer color="white" size={24} />} colors={['#ff758c', '#ff7eb3']} />
              <SensorCard title="Humedad" value={data.humidity?.toFixed(0)} unit="%" icon={<Droplets color="white" size={24} />} colors={['#4facfe', '#00f2fe']} />
            </View>
            {/* Fila 2 */}
            <View style={styles.row}>
              <SensorCard title="Nivel de CO2" value={data.gas_level?.toFixed(0)} unit="ppm" icon={<Wind color="white" size={24} />} colors={['#00c6fb', '#005bea']} />
              <SensorCard title="Ruido" value={data.noise_level?.toFixed(0)} unit="dB" icon={<Mic color="white" size={24} />} colors={['#a18cd1', '#fbc2eb']} />
            </View>
          </View>

          <OccupancyBar count={data.people_count} />

        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dashboardFrame: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 960,
    borderRadius: 24,
    padding: 25,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
  },
  lightIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  lightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginLeft: 8,
  },
  gridContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%',
    height: 135,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  cardValue: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
  },
  cardUnit: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  occupancyBar: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  occupancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  occupancyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  occupancyBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    marginRight: 20,
  },
  personIcon: {
    width: 10,
    height: 24,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  occupancyCount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  }
});
import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, Dimensions 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Thermometer, Droplets, Wind, Mic, Users, Sun, Activity } from 'lucide-react-native';
import { supabase } from './supabase'; 

const { width } = Dimensions.get('window');

// --- COMPONENTE VISUAL: TARJETA DE SENSOR ---
const SensorCard = ({ title, value, unit, icon, colors }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardUnit}>{unit}</Text>
    </View>
  </LinearGradient>
);

// --- COMPONENTE VISUAL: BARRA DE AFORO (Adaptada al nuevo layout) ---
const OccupancyPanel = ({ count }) => {
    // Lógica de color según aforo
    let bgColors = ['#10B981', '#059669']; // Verde (Normal)
    let statusText = "CAPACIDAD NORMAL";
    
    if (count > 5) { 
        bgColors = ['#F59E0B', '#D97706']; // Naranja
        statusText = "AFORO MEDIO";
    }
    if (count > 10) {
        bgColors = ['#EF4444', '#B91C1C']; // Rojo
        statusText = "CAPACIDAD EXCEDIDA";
    }

    return (
        <LinearGradient colors={bgColors} style={styles.occupancyPanel}>
            <View style={styles.occupancyHeader}>
                <Users color="white" size={40} />
                <Text style={styles.occupancyTitle}>OCUPACIÓN</Text>
            </View>
            <View style={styles.occupancyBody}>
                <Text style={styles.occupancyValue}>{count}</Text>
                <Text style={styles.occupancyUnit}>Personas</Text>
            </View>
            <View style={styles.occupancyFooter}>
                <Text style={styles.occupancyStatus}>{statusText}</Text>
            </View>
        </LinearGradient>
    );
};

export default function App() {
  const [data, setData] = useState({ 
      temperature: 0, humidity: 0, noise_level: 0, gas_level: 0, light_level: 0, people_count: 0 
  });
  
  // --- LÓGICA DE DATOS (Solo Lectura) ---
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
          const { data: initialData } = await supabase
            .from('sensor_readings')
            .select('*')
            .eq('room_id', 'espera') // Ajusta esto si quieres que sea dinámico o fijo
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (initialData) setData(initialData);
      } catch(e) { console.log("Esperando datos..."); }
    };
    fetchLatestData();

    const sub = supabase
        .channel('odroid-display')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `room_id=eq.espera` }, 
            (payload) => setData(payload.new)
        )
        .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} />
        
        {/* HEADER */}
        <View style={styles.header}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <Activity color="#0984e3" size={28} style={{marginRight: 10}} />
                <View>
                    <Text style={styles.headerTitle}>Monitor de Área</Text>
                    <Text style={styles.headerSubtitle}>SISTEMA SMARTHOSP - EN VIVO</Text>
                </View>
            </View>
            {/* Indicador de Estado (Solo visual) */}
            <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>ONLINE</Text>
            </View>
        </View>

        {/* LAYOUT PRINCIPAL (Horizontal) */}
        <View style={styles.mainContent}>
            
            {/* COLUMNA IZQUIERDA: SENSORES (Grid 2x2 + Luz abajo) */}
            <View style={styles.sensorsColumn}>
                
                <View style={styles.sensorRow}>
                    <SensorCard 
                        title="Temperatura" value={data.temperature?.toFixed(1)} unit="°C" 
                        icon={<Thermometer color="white" size={24} />} 
                        colors={['#ff758c', '#ff7eb3']} 
                    />
                    <SensorCard 
                        title="Humedad" value={data.humidity?.toFixed(0)} unit="%" 
                        icon={<Droplets color="white" size={24} />} 
                        colors={['#4facfe', '#00f2fe']} 
                    />
                </View>

                <View style={styles.sensorRow}>
                    <SensorCard 
                        title="Calidad CO2" value={data.gas_level?.toFixed(0)} unit="ppm" 
                        icon={<Wind color="white" size={24} />} 
                        colors={['#00c6fb', '#005bea']} 
                    />
                    <SensorCard 
                        title="Ruido" value={data.noise_level?.toFixed(0)} unit="dB" 
                        icon={<Mic color="white" size={24} />} 
                        colors={['#a18cd1', '#fbc2eb']} 
                    />
                </View>

                {/* TARJETA DE LUZ (Ahora integrada) */}
                <View style={styles.sensorRow}>
                    <SensorCard 
                        title="Iluminación" value={data.light_level?.toFixed(0)} unit="Lux" 
                        icon={<Sun color="white" size={24} />} 
                        colors={['#F2994A', '#F2C94C']} 
                    />
                    {/* Espacio vacío para mantener simetría o logo */}
                    <View style={[styles.card, {backgroundColor:'transparent', elevation:0}]} />
                </View>

            </View>

            {/* COLUMNA DERECHA: AFORO (Panel Vertical Completo) */}
            <View style={styles.peopleColumn}>
                <OccupancyPanel count={data.people_count} />
            </View>

        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F6', padding: 20 },
  
  // HEADER
  header: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 20, paddingHorizontal: 10, paddingBottom: 15,
      borderBottomWidth: 1, borderBottomColor: '#E0E0E0'
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#2d3436' },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#636e72', letterSpacing: 1 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00B894', marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#00695C' },

  // LAYOUT PRINCIPAL
  mainContent: { flex: 1, flexDirection: 'row', gap: 20 },

  // COLUMNA IZQUIERDA (Sensores)
  sensorsColumn: { flex: 2, flexDirection: 'column', gap: 15 },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  
  // TARJETA SENSOR (Estilo original mantenido)
  card: { flex: 1, height: 110, borderRadius: 20, padding: 15, justifyContent: 'space-between', elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10, marginRight: 10 },
  cardTitle: { color: 'white', fontSize: 14, fontWeight: '600', opacity: 0.9 },
  cardBody: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' },
  cardValue: { fontSize: 42, fontWeight: '700', color: 'white' },
  cardUnit: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginLeft: 5, fontWeight: '500', marginBottom: 6 },

  // COLUMNA DERECHA (Aforo)
  peopleColumn: { flex: 1 },
  occupancyPanel: { 
      flex: 1, borderRadius: 25, padding: 20, 
      alignItems: 'center', justifyContent: 'space-between', 
      elevation: 8 
  },
  occupancyHeader: { alignItems: 'center', marginTop: 10 },
  occupancyTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 10, letterSpacing: 1 },
  
  occupancyBody: { alignItems: 'center' },
  occupancyValue: { fontSize: 100, fontWeight: '900', color: 'white', lineHeight: 100 },
  occupancyUnit: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' },
  
  occupancyFooter: { 
      backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 15, paddingVertical: 8, 
      borderRadius: 15, marginBottom: 10 
  },
  occupancyStatus: { color: 'white', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 }
});
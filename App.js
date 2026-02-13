import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, StatusBar, Dimensions 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Thermometer, Droplets, Wind, Mic, Users, Sun, Activity } from 'lucide-react-native';
import { supabase } from './supabase'; 

// --- COMPONENTE VISUAL: TARJETA DE SENSOR ---
// Añadimos la prop 'style' para poder personalizar anchos específicos
const SensorCard = ({ title, value, unit, icon, colors, style }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, style]}>
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

// --- COMPONENTE VISUAL: BARRA DE AFORO ---
const OccupancyPanel = ({ count }) => {
    let bgColors = ['#10B981', '#059669']; // Verde
    let statusText = "NORMAL";
    
    if (count > 5) { 
        bgColors = ['#F59E0B', '#D97706']; // Naranja
        statusText = "MEDIO";
    }
    if (count > 10) {
        bgColors = ['#EF4444', '#B91C1C']; // Rojo
        statusText = "LLENO";
    }

    return (
        <LinearGradient colors={bgColors} style={styles.occupancyPanel}>
            <View style={styles.occupancyTop}>
                <Text style={styles.occupancyTitle}>OCUPACIÓN</Text>
                <Users color="rgba(255,255,255,0.8)" size={32} />
            </View>
            
            <View style={styles.occupancyCenter}>
                <Text style={styles.occupancyValue}>{count}</Text>
                <Text style={styles.occupancyUnit}>Personas</Text>
            </View>
            
            <View style={styles.occupancyFooter}>
                <View style={[styles.statusIndicator, {backgroundColor: 'white'}]} />
                <Text style={styles.occupancyStatus}>{statusText}</Text>
            </View>
        </LinearGradient>
    );
};

export default function App() {
  const [data, setData] = useState({ 
      temperature: 0, humidity: 0, noise_level: 0, gas_level: 0, light_level: 0, people_count: 0 
  });
  
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
          const { data: initialData } = await supabase
            .from('sensor_readings')
            .select('*')
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
            { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, 
            (payload) => setData(payload.new)
        )
        .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} />
        
        {/* HEADER COMPACTO */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.logoContainer}>
                    <Activity color="white" size={24} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>SmartHosp</Text>
                    <Text style={styles.headerSubtitle}>MONITOR DE ÁREA</Text>
                </View>
            </View>
            <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>EN VIVO</Text>
            </View>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <View style={styles.mainGrid}>
            
            {/* IZQUIERDA: SENSORES (Flex 2.5) */}
            <View style={styles.leftColumn}>
                
                {/* FILA 1 */}
                <View style={styles.row}>
                    <SensorCard 
                        title="Temperatura" value={data.temperature?.toFixed(1)} unit="°C" 
                        icon={<Thermometer color="white" size={22} />} 
                        colors={['#FF6B6B', '#EE5253']} 
                    />
                    <SensorCard 
                        title="Humedad" value={data.humidity?.toFixed(0)} unit="%" 
                        icon={<Droplets color="white" size={22} />} 
                        colors={['#48DBFB', '#0ABDE3']} 
                    />
                </View>

                {/* FILA 2 */}
                <View style={styles.row}>
                    <SensorCard 
                        title="Calidad CO2" value={data.gas_level?.toFixed(0)} unit="ppm" 
                        icon={<Wind color="white" size={22} />} 
                        colors={['#54A0FF', '#2E86DE']} 
                    />
                    <SensorCard 
                        title="Ruido" value={data.noise_level?.toFixed(0)} unit="dB" 
                        icon={<Mic color="white" size={22} />} 
                        colors={['#A29BFE', '#6C5CE7']} 
                    />
                </View>

                {/* FILA 3 - ILUMINACIÓN (OCUPA TODO EL ANCHO) */}
                <View style={styles.row}>
                    <SensorCard 
                        title="Iluminación Ambiental" value={data.light_level?.toFixed(0)} unit="Lux" 
                        icon={<Sun color="white" size={22} />} 
                        colors={['#FECA57', '#FF9F43']} 
                        style={{ width: '100%' }} // Truco visual: Ancho completo
                    />
                </View>

            </View>

            {/* DERECHA: OCUPACIÓN (Flex 1.2) */}
            <View style={styles.rightColumn}>
                <OccupancyPanel count={data.people_count} />
            </View>

        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6', // Gris muy suave para fondo profesional
    padding: 16 
  },
  
  // HEADER
  header: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 16, backgroundColor: 'white', padding: 12, borderRadius: 16,
      elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoContainer: { 
      backgroundColor: '#2E86DE', padding: 8, borderRadius: 10, marginRight: 12 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#2d3436' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#b2bec3', letterSpacing: 1 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F9E7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ED573', marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#2ED573' },

  // GRID PRINCIPAL
  mainGrid: { flex: 1, flexDirection: 'row', gap: 16 },

  // COLUMNA IZQUIERDA
  leftColumn: { flex: 2.5, flexDirection: 'column', gap: 16 },
  row: { flex: 1, flexDirection: 'row', gap: 16 }, // flex: 1 aquí es clave para altura igual
  
  // COLUMNA DERECHA
  rightColumn: { flex: 1.2 }, // Un poco más ancho para dar importancia

  // TARJETAS SENSORES
  card: { 
      flex: 1, borderRadius: 18, padding: 16, 
      justifyContent: 'space-between', elevation: 4 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconContainer: { backgroundColor: 'rgba(255,255,255,0.25)', padding: 6, borderRadius: 8 },
  cardTitle: { color: 'white', fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 },
  cardBody: { alignItems: 'flex-end' },
  cardValue: { fontSize: 36, fontWeight: '800', color: 'white' },
  cardUnit: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  // PANEL OCUPACIÓN
  occupancyPanel: { 
      flex: 1, borderRadius: 24, padding: 20, 
      alignItems: 'center', justifyContent: 'space-between', 
      elevation: 6 
  },
  occupancyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  occupancyTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  
  occupancyCenter: { alignItems: 'center', justifyContent: 'center' },
  occupancyValue: { fontSize: 90, fontWeight: '900', color: 'white', lineHeight: 90 },
  occupancyUnit: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: -5 },
  
  occupancyFooter: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', 
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  occupancyStatus: { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }
});
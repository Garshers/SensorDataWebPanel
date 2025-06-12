<template>
  <div class="sensor-data">
    <h2>Aktualne dane z czujników</h2>
    <p v-if="loading && !sensorData">Ładowanie danych...</p>
    <div v-else-if="error" class="error-message">
      <p>Wystąpił błąd podczas pobierania danych:</p>
      <p>{{ error.message }}</p>
      <button @click="fetchData" v-if="!sensorData">Spróbuj ponownie</button>
    </div>
    <div v-else-if="!sensorData">
      <p>Brak danych do wyświetlenia.</p>
    </div>
    <div v-else>
      <h3>Odebrane dane:</h3>
      <p>Data i czas: {{ formatTimestamp(sensorData["Timestamp (RFC3339)"]) }}</p>
      <p>Temperatura: {{ scaleValue(sensorData.Y[0], 'temperature') ? scaleValue(sensorData.Y[0], 'temperature').toFixed(2) : 'N/A' }} °C</p>
      <p>Ciśnienie: {{ scaleValue(sensorData.Y[1], 'pressure') ? scaleValue(sensorData.Y[1], 'pressure').toFixed(2) : 'N/A' }} hPa</p>
      <p>Wilgotność: {{ scaleValue(sensorData.Y[2], 'humidity') ? scaleValue(sensorData.Y[2], 'humidity').toFixed(2) : 'N/A' }} %</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import './styles.css';

export default {
  setup() {
    const sensorData = ref(null);
    const loading = ref(true); 
    const error = ref(null);
    let intervalId = null;

    // Configuration for scaling sensor values
    const scalingConfig = {
      // Input range for data from LabVIEW is -0.2 to 1.2
      // Define real-world output ranges below
      temperature: {
        inputMin: -0.2,
        inputMax: 1.2,
        outputMin: 20,
        outputMax: 25
      },
      pressure: {
        inputMin: -0.2,
        inputMax: 1.2,
        outputMin: 950,
        outputMax: 1000
      },
      humidity: {
        inputMin: -0.2,
        inputMax: 1.2,
        outputMin: 45,
        outputMax: 55
      }
    };

    // Function to linearly scale a value from its input range to a desired output range
    const scaleValue = (value, type) => {
      if (typeof value !== 'number' || !scalingConfig[type]) {
        return value;
      }

      const config = scalingConfig[type];
      
      // Prevent division by zero if input range is zero
      if (config.inputMax === config.inputMin) {
        return config.outputMin;
      }

      // Linear scaling formula
      const scaled = (value - config.inputMin) * (config.outputMax - config.outputMin) / 
                     (config.inputMax - config.inputMin) + 
                     config.outputMin;
      
      // Clamp the output to the defined output range
      return Math.max(config.outputMin, Math.min(config.outputMax, scaled));
    };

    const fetchData = async () => {
      // Show loading only on the initial fetch or if an error occurred before any data loaded
      if (!sensorData.value && !error.value) {
        loading.value = true;
      }
      error.value = null;

      try {
        const response = await axios.get('http://127.0.0.1/WebService1/czujniki/HTTPMethod_2');
        sensorData.value = response.data;
        
        console.log("Odebrane dane z LabVIEW:", sensorData.value);

      } catch (err) {
        error.value = err;
        console.error("Błąd podczas pobierania danych:", err);
      } finally {
        loading.value = false;
      }
    };

    // Formats the RFC3339 timestamp string into a human-readable local date/time string
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A';
      try {
        const date = new Date(timestamp);
        return date.toLocaleString('pl-PL', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      } catch (e) {
        console.error("Błąd formatowania daty:", e);
        return timestamp;
      }
    };

    onMounted(() => {
      fetchData(); // Fetch data initially when the component is mounted
      intervalId = setInterval(fetchData, 1000); // Set up interval for refreshing data every 1 second
    });

    onUnmounted(() => {
      // Clear the interval when the component is unmounted to prevent memory leaks
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    return {
      sensorData,
      loading,
      error,
      fetchData,
      formatTimestamp,
      scaleValue
    };
  }
};
</script>
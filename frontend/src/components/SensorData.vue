<template>
  <div class="sensor-data">
    <h2>Aktualne dane z czujników</h2>
    
    <!-- Display loading message when data is being fetched and no data is present yet -->
    <p v-if="loading && !sensorData">Ładowanie danych...</p>
    
    <!-- Display error message if an error occurred while fetching data -->
    <div v-else-if="error" class="error-message">
      <p>Wystąpił błąd podczas pobierania danych:</p>
      <p>{{ error.message }}</p>
      <!-- Show retry button if there is no data loaded yet -->
      <button @click="fetchData" v-if="!sensorData">Spróbuj ponownie</button>
    </div>
    
    <!-- Display message if there is no data to show -->
    <div v-else-if="!sensorData">
      <p>Brak danych do wyświetlenia.</p>
    </div>
    
    <!-- Display sensor data if available -->
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

export default {
  setup() {
    // Reactive reference to hold the latest sensor data
    const sensorData = ref(null);
    // Boolean indicating if data is currently being loaded
    const loading = ref(true); 
    // Holds any error that occurs during the data fetch
    const error = ref(null);
    // Interval ID for clearing the timer on component unmount
    let intervalId = null;

    // Configuration for scaling raw sensor values to meaningful output ranges
    const scalingConfig = {
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

    // Function to linearly scale a value from its input range to the desired output range
    const scaleValue = (value, type) => {
      if (typeof value !== 'number' || !scalingConfig[type]) {
        return value; // Return original value if it's invalid or no config exists
      }

      const config = scalingConfig[type];
      
      // Avoid division by zero if the input range is invalid
      if (config.inputMax === config.inputMin) {
        return config.outputMin;
      }

      // Linear scaling formula
      const scaled = (value - config.inputMin) * (config.outputMax - config.outputMin) / 
                     (config.inputMax - config.inputMin) + config.outputMin;
      
      // Clamp the scaled value to stay within the output range
      return Math.max(config.outputMin, Math.min(config.outputMax, scaled));
    };

    // Function to fetch sensor data from the backend service
    const fetchData = async () => {
      // Show loading only on the first fetch or after an error with no data
      if (!sensorData.value && !error.value) {
        loading.value = true;
      }
      error.value = null; // Reset previous error state

      try {
        const response = await axios.get('http://127.0.0.1/WebService1/czujniki/HTTPMethod_2');
        sensorData.value = response.data; // Update sensor data with the fetched response
        
        console.log("Odebrane dane z LabVIEW:", sensorData.value); // Log received data for debugging

      } catch (err) {
        error.value = err; // Store the error for display
        console.error("Błąd podczas pobierania danych:", err); // Log the error
      } finally {
        loading.value = false; // Stop loading indicator
      }
    };

    // Function to format the RFC3339 timestamp to a human-readable local date/time string
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A'; // Return 'N/A' if timestamp is missing
      try {
        const date = new Date(timestamp);
        return date.toLocaleString('pl-PL', { // Format to Polish locale
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
        return timestamp; // Return original timestamp if formatting fails
      }
    };

    // Lifecycle hook: called when component is mounted
    onMounted(() => {
      fetchData(); // Fetch data immediately when component mounts
      intervalId = setInterval(fetchData, 1000); // Set up polling every 1 second
    });

    // Lifecycle hook: called when component is unmounted
    onUnmounted(() => {
      // Clear the polling interval to avoid memory leaks
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    // Expose variables and functions to the template
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

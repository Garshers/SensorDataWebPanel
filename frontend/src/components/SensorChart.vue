<template>
  <div class="sensor-chart card-container">
    <h2>Wykresy danych z czujników (w czasie)</h2>

    <!-- Display loading message if data is being fetched and no historical data is present -->
    <p v-if="loading && historicalData.length === 0">Ładowanie danych...</p>
    
    <!-- Display error message if data fetching failed -->
    <div v-else-if="error" class="error-message">
      <p>Wystąpił błąd podczas pobierania danych:</p>
      <p>{{ error.message }}</p>
    </div>
    
    <!-- Display message if there is no data to show -->
    <div v-else-if="historicalData.length === 0">
      <p>Brak danych do wyświetlenia. Oczekiwanie na dane z czujników.</p>
    </div>
    
    <!-- If data is available, display charts -->
    <div v-else>
      <div class="charts-grid">
        <!-- Temperature chart -->
        <div class="chart-item">
          <h3>Temperatura (°C)</h3>
          <div class="chart-container">
            <canvas ref="tempChartCanvas"></canvas>
          </div>
        </div>

        <!-- Pressure chart -->
        <div class="chart-item">
          <h3>Ciśnienie (hPa)</h3>
          <div class="chart-container">
            <canvas ref="pressureChartCanvas"></canvas>
          </div>
        </div>

        <!-- Humidity chart -->
        <div class="chart-item">
          <h3>Wilgotność (%)</h3>
          <div class="chart-container">
            <canvas ref="humidityChartCanvas"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Show number of data points -->
      <p class="data-point-count">Liczba punktów danych: {{ historicalData.length }}</p>
      <!-- Button to clear all chart data -->
      <button @click="clearChartData" class="button-common danger-button">Wyczyść wykresy</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  setup() {
    // Reactive variables for chart data, loading state, and error
    const historicalData = ref([]);
    const loading = ref(true);
    const error = ref(null);
    let intervalId = null;

    // References to canvas elements for Chart.js
    const tempChartCanvas = ref(null);
    const pressureChartCanvas = ref(null);
    const humidityChartCanvas = ref(null);

    // Instances of Chart.js charts
    let tempChartInstance = null;
    let pressureChartInstance = null;
    let humidityChartInstance = null;

    const maxDataPoints = 10; // Maximum number of data points to store/display

    // Configuration for scaling sensor data
    const scalingConfig = {
      temperature: { inputMin: -0.2, inputMax: 1.2, outputMin: 20, outputMax: 25 },
      pressure: { inputMin: -0.2, inputMax: 1.2, outputMin: 950, outputMax: 1000 },
      humidity: { inputMin: -0.2, inputMax: 1.2, outputMin: 45, outputMax: 55 }
    };

    // Function to scale raw sensor values to display range
    const scaleValue = (value, type) => {
      if (typeof value !== 'number' || !scalingConfig[type]) {
        return value; // Return original if invalid
      }
      const config = scalingConfig[type];
      if (config.inputMax === config.inputMin) {
        return config.outputMin; // Avoid division by zero
      }
      // Linear scaling formula
      const scaled = (value - config.inputMin) * (config.outputMax - config.outputMin) / 
                     (config.inputMax - config.inputMin) + 
                     config.outputMin;
      // Clamp to output range
      return Math.max(config.outputMin, Math.min(config.outputMax, scaled));
    };

    // Function to create or update a single Chart.js chart
    const updateSingleChart = (chartRef, chartInstanceVar, label, data, borderColor, backgroundColor, yAxisText) => {
      if (!chartRef.value) {
        return null; // Skip if canvas not ready
      }

      // Create labels (time format)
      const labels = historicalData.value.map(d => 
        new Date(d["Timestamp (RFC3339)"]).toLocaleTimeString('pl-PL')
      );

      // Prepare Chart.js data
      const chartJsData = {
        labels: labels,
        datasets: [
          {
            label: label,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            data: data,
            tension: 0.3, // Smoothness of line
            fill: false,
          }
        ]
      };

      // Chart.js options
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Czas' },
            ticks: { autoSkip: true, maxTicksLimit: 10 }
          },
          y: {
            title: { display: true, text: yAxisText }
          }
        },
        animation: false
      };

      let currentChartInstance = chartInstanceVar;

      // Update existing chart instance
      if (currentChartInstance) {
        currentChartInstance.data = chartJsData;
        currentChartInstance.update();
      } 
      // Or create new chart instance
      else if (historicalData.value.length > 0) {
        const ctx = chartRef.value.getContext('2d');
        currentChartInstance = new Chart(ctx, {
          type: 'line',
          data: chartJsData,
          options: chartOptions,
        });
      }
      return currentChartInstance;
    };

    // Function to update all three charts (temperature, pressure, humidity)
    const updateAllCharts = () => {
      // Destroy charts if no data
      if (historicalData.value.length === 0) {
        if (tempChartInstance) { tempChartInstance.destroy(); tempChartInstance = null; }
        if (pressureChartInstance) { pressureChartInstance.destroy(); pressureChartInstance = null; }
        if (humidityChartInstance) { humidityChartInstance.destroy(); humidityChartInstance = null; }
        return;
      }

      // Scale and map data for each chart
      const temperatures = historicalData.value.map(d => scaleValue(d.Y[0], 'temperature'));
      const pressures = historicalData.value.map(d => scaleValue(d.Y[1], 'pressure'));
      const humidities = historicalData.value.map(d => scaleValue(d.Y[2], 'humidity'));

      // Update individual charts
      tempChartInstance = updateSingleChart(
        tempChartCanvas, 
        tempChartInstance, 
        'Temperatura (°C)', 
        temperatures, 
        'rgb(255, 99, 132)', 
        'rgba(255, 99, 132, 0.5)',
        'Temperatura (°C)'
      );

      pressureChartInstance = updateSingleChart(
        pressureChartCanvas, 
        pressureChartInstance, 
        'Ciśnienie (hPa)', 
        pressures, 
        'rgb(54, 162, 235)', 
        'rgba(54, 162, 235, 0.5)',
        'Ciśnienie (hPa)'
      );
      
      humidityChartInstance = updateSingleChart(
        humidityChartCanvas, 
        humidityChartInstance, 
        'Wilgotność (%)', 
        humidities, 
        'rgb(75, 192, 192)', 
        'rgba(75, 192, 192, 0.5)',
        'Wilgotność (%)'
      );
    };

    // Function to fetch data from API endpoint
    const fetchData = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await axios.get('http://127.0.0.1/WebService1/czujniki/HTTPMethod_2');
        const newData = response.data;
        
        console.log("Odebrane dane z LabVIEW dla wykresu:", newData);

        // Push new data into historical array
        historicalData.value.push(newData);
        // Maintain max data points
        if (historicalData.value.length > maxDataPoints) {
          historicalData.value.shift();
        }

      } catch (err) {
        // Handle error during fetching
        error.value = err;
        console.error("Błąd podczas pobierania danych dla wykresu:", err);
      } finally {
        loading.value = false;
      }
    };

    // Function to clear all chart data and reset charts
    const clearChartData = () => {
      historicalData.value = [];
      if (tempChartInstance) { tempChartInstance.destroy(); tempChartInstance = null; }
      if (pressureChartInstance) { pressureChartInstance.destroy(); pressureChartInstance = null; }
      if (humidityChartInstance) { humidityChartInstance.destroy(); humidityChartInstance = null; }
      
      error.value = null;
      loading.value = true;
      fetchData(); // Fetch fresh data after clearing
    };

    // Lifecycle hook - on component mount
    onMounted(() => {
      fetchData(); // Initial fetch
      intervalId = setInterval(fetchData, 1000); // Fetch data every 1 second

      // Watch for data changes to update charts
      watch(historicalData, () => {
        updateAllCharts();
      }, { deep: true });
    });

    // Lifecycle hook - on component unmount
    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Destroy chart instances
      if (tempChartInstance) { tempChartInstance.destroy(); }
      if (pressureChartInstance) { pressureChartInstance.destroy(); }
      if (humidityChartInstance) { humidityChartInstance.destroy(); }
    });

    // Return variables and functions to the template
    return {
      historicalData,
      loading,
      error,
      clearChartData,
      tempChartCanvas,
      pressureChartCanvas,
      humidityChartCanvas
    };
  }
};
</script>

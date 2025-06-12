<template>
  <div class="sensor-data">
    <h2>Dane z endpointa LabVIEW (surowe)</h2>
    <p v-if="loading">Ładowanie danych...</p>
    <div v-else-if="error" class="error-message">
      <p>Wystąpił błąd podczas pobierania danych:</p>
      <p>{{ error.message }}</p>
      <button @click="fetchData">Spróbuj ponownie</button>
    </div>
    <div v-else>
      <h3>Odebrana surowa odpowiedź z endpointa:</h3>
      <pre class="raw-data">{{ typeof receivedData === 'object' ? JSON.stringify(receivedData, null, 2) : receivedData }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  setup() {
    const receivedData = ref(null); // Tutaj będą przechowywane *surowe* pobrane dane
    const loading = ref(true);
    const error = ref(null);

    const fetchData = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await axios.get('http://127.0.0.1/WebService1/czujniki/HTTPMethod_2');
        
        // Axios domyślnie próbuje sparsować JSON-a, jeśli nagłówek Content-Type jest 'application/json'.
        // Jeśli nie jest, response.data będzie już stringiem.
        // Jeśli jest obiektem, JSON.stringify przekonwertuje go z powrotem na string JSON.
        receivedData.value = response.data;
        
        // Możesz też użyć response.request.responseText, aby pobrać ABSOLUTNIE surowy string,
        // niezależnie od nagłówków, ale response.data jest zazwyczaj wystarczające
        // receivedData.value = response.request.responseText;

      } catch (err) {
        error.value = err;
        console.error("Błąd podczas pobierania danych:", err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchData);

    return {
      receivedData,
      loading,
      error,
      fetchData,
      JSON // Udostępniamy obiekt JSON, na wypadek gdybyś chciał użyć JSON.stringify w template
    };
  }
};
</script>

<style scoped>
.sensor-data {
  font-family: Arial, sans-serif;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  max-width: 600px;
  margin: 20px auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

h2 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

h3 {
  color: #555;
  margin-top: 25px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

p {
  font-size: 1.1em;
  line-height: 1.6;
}

.raw-data {
  background-color: #e8e8e8;
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  text-align: left;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-message {
  color: red;
  background-color: #ffebeb;
  border: 1px solid red;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #0056b3;
}
</style>
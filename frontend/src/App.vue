<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <SensorData />
</template>

<script>
import SensorData from './components/SensorData.vue'; // Importuj komponent

export default {
  name: 'App',
  components: {
    SensorData // Zarejestruj komponent
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
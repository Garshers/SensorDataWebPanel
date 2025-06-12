import { createRouter, createWebHistory } from 'vue-router';
import SensorData from '../components/SensorData.vue';
import SensorChart from '../components/SensorChart.vue';
import './styles.css';

const routes = [
  {
    path: '/',
    name: 'SensorData',
    component: SensorData
  },
  {
    path: '/chart',
    name: 'SensorChart',
    component: SensorChart
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
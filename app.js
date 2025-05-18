import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBoMoD-XBP7Rl5rmX__nh04O6c6xZsMkN4",
  authDomain: "iotjuan.firebaseapp.com",
  databaseURL: "https://iotjuan-default-rtdb.firebaseio.com",
  projectId: "iotjuan",
  storageBucket: "iotjuan.firebasestorage.app",
  messagingSenderId: "953082830486",
  appId: "1:953082830486:web:08e0bc2f6c317efd29acb7",
  measurementId: "G-17G6BX6LP5"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referencias
const tempRef = ref(database, "sensores/temperatura");
const humRef = ref(database, "sensores/humedad");

const tempElement = document.getElementById("temp");
const humElement = document.getElementById("hum");

// Inicializar gráfico
const chart = Highcharts.chart('chart-container', {
  chart: { type: 'spline' },
  title: { text: 'Datos en Tiempo Real' },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150
  },
  yAxis: {
    title: { text: 'Valores' },
    min: 0
  },
  series: [{
    name: 'Temperatura (°C)',
    data: []
  }, {
    name: 'Humedad (%)',
    data: []
  }]
});

// Escuchar temperatura
onValue(tempRef, (snapshot) => {
  const temp = parseFloat(snapshot.val());
  const time = new Date().getTime();
  tempElement.innerText = `${temp} °C`;
  chart.series[0].addPoint([time, temp], true, chart.series[0].data.length > 20);
});

// Escuchar humedad
onValue(humRef, (snapshot) => {
  const hum = parseFloat(snapshot.val());
  const time = new Date().getTime();
  humElement.innerText = `${hum} %`;
  chart.series[1].addPoint([time, hum], true, chart.series[1].data.length > 20);
});

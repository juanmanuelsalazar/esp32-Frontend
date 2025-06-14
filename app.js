import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBoMoD-XBP7Rl5rmX__nh04O6c6xZsMkN4",
  authDomain: "iotjuan.firebaseapp.com",
  databaseURL: "https://iotjuan-default-rtdb.firebaseio.com",
  projectId: "iotjuan",
  storageBucket: "iotjuan.appspot.com",
  messagingSenderId: "953082830486",
  appId: "1:953082830486:web:08e0bc2f6c317efd29acb7",
  measurementId: "G-17G6BX6LP5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referencias para datos en tiempo real
const tempRef = ref(db, "sensor/temperatura");
const humRef = ref(db, "sensor/humedad");

// DOM
const tempVal = document.getElementById("temp-val");
const humVal = document.getElementById("hum-val");

// Series para tiempo real
let tempSeries = [];
let humSeries = [];

// Función para actualizar datos en gráfico tiempo real
function updateChartData(chart, series, newVal) {
  const x = (new Date()).getTime();
  series.push([x, newVal]);
  if (series.length > 20) series.shift();
  chart.series[0].setData(series, true);
}

// Configuración gráficos

const chartTemp = Highcharts.chart("chart-temp", {
  chart: { type: 'spline' },
  title: { text: 'Temperatura Tiempo Real' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: '°C' }},
  series: [{ name: 'Temperatura', data: [] }]
});

const chartHum = Highcharts.chart("chart-hum", {
  chart: { type: 'spline' },
  title: { text: 'Humedad Tiempo Real' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: '%' }},
  series: [{ name: 'Humedad', data: [] }]
});

const chartHistTemp = Highcharts.chart("chart-hist-temp", {
  chart: { type: 'line' },
  title: { text: 'Histórico de Temperatura' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: '°C' }},
  series: [{ name: 'Hist. Temperatura', data: [] }]
});

const chartHistHum = Highcharts.chart("chart-hist-hum", {
  chart: { type: 'line' },
  title: { text: 'Histórico de Humedad' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: '%' }},
  series: [{ name: 'Hist. Humedad', data: [] }]
});

const chartComparativo = Highcharts.chart("chart-comparativo", {
  chart: { type: 'areaspline' },
  title: { text: 'Comparativo Temp vs Humedad' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: 'Valor' }},
  series: [
    { name: 'Temperatura', data: [] },
    { name: 'Humedad', data: [] }
  ]
});

// Escuchar datos en tiempo real y actualizar gráficos
onValue(tempRef, snapshot => {
  const val = snapshot.val();
  const time = (new Date()).getTime();
  tempVal.innerText = val + " °C";
  updateChartData(chartTemp, tempSeries, val);
  // Actualizamos también en gráfico comparativo en tiempo real
  chartComparativo.series[0].addPoint([time, val], true, chartComparativo.series[0].data.length > 20);
});

onValue(humRef, snapshot => {
  const val = snapshot.val();
  const time = (new Date()).getTime();
  humVal.innerText = val + " %";
  updateChartData(chartHum, humSeries, val);
  chartComparativo.series[1].addPoint([time, val], true, chartComparativo.series[1].data.length > 20);
});

// Tabs
const tabButtons = document.querySelectorAll(".tab-button");
const tabs = document.querySelectorAll(".tab");
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");
    tabButtons.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(tab).classList.add("active");
  });
});

// --- Función para convertir string timestamp ISO a milisegundos ---
function isoToTimestamp(isoString) {
  return new Date(isoString).getTime();
}

function loadHistoricalData(start, end) {
  const startTs = isoToTimestamp(start);
  const endTs = isoToTimestamp(end);

  const historialRef = ref(db, "historial");

  get(historialRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      alert("No hay datos en historial");
      return;
    }

    let tempData = [];
    let humData = [];

    // Recorremos cada nodo (ID aleatorio)
    Object.values(data).forEach(entry => {
      const fecha = entry.fecha;
      if (!fecha) return;

      const timeMs = isoToTimestamp(fecha);
      if (timeMs >= startTs && timeMs <= endTs) {
        tempData.push([timeMs, entry.temperatura]);
        humData.push([timeMs, entry.humedad]);
      }
    });

    // Ordenamos por fecha
    tempData.sort((a, b) => a[0] - b[0]);
    humData.sort((a, b) => a[0] - b[0]);

    // Actualizar gráficos históricos y comparativo
    chartHistTemp.series[0].setData(tempData);
    chartHistHum.series[0].setData(humData);

    chartHistTemp.setTitle({ text: `Histórico Temperatura (${start} → ${end})` });
    chartHistHum.setTitle({ text: `Histórico Humedad (${start} → ${end})` });

    chartComparativo.series[0].setData(tempData);
    chartComparativo.series[1].setData(humData);
    chartComparativo.setTitle({ text: `Comparativo Temp vs Humedad (${start} → ${end})` });
  }).catch(error => {
    console.error("Error al cargar historial:", error);
  });
}


// Listeners para filtros
document.getElementById("filter-temp").addEventListener("click", () => {
  const start = document.getElementById("start-date-temp").value;
  const end = document.getElementById("end-date-temp").value;
  if (start && end) {
    loadHistoricalData(start, end);
  } else {
    alert("Por favor selecciona ambas fechas para Temperatura");
  }
});

document.getElementById("filter-hum").addEventListener("click", () => {
  const start = document.getElementById("start-date-hum").value;
  const end = document.getElementById("end-date-hum").value;
  if (start && end) {
    loadHistoricalData(start, end);
  } else {
    alert("Por favor selecciona ambas fechas para Humedad");
  }
});

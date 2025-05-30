import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Configuración Firebase
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
const db = getDatabase(app);

// Referencias
const tempRef = ref(db, "sensor/temperatura");
const humRef = ref(db, "sensor/humedad");

// Elementos DOM
const tempVal = document.getElementById("temp-val");
const humVal = document.getElementById("hum-val");

// Inicializa series
let tempSeries = [];
let humSeries = [];

function updateChartData(chart, series, newVal) {
  const x = (new Date()).getTime();
  series.push([x, newVal]);
  if (series.length > 20) series.shift();
  chart.series[0].setData(series, true);
}

// Gráficas
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

// Firebase listeners
onValue(tempRef, snapshot => {
  const val = snapshot.val();
  tempVal.innerText = val + " °C";
  const time = (new Date()).getTime();
  updateChartData(chartTemp, tempSeries, val);
  updateChartData(chartHistTemp, chartHistTemp.series[0].data, val);
  chartComparativo.series[0].addPoint([time, val], true, chartComparativo.series[0].data.length > 20);
});

onValue(humRef, snapshot => {
  const val = snapshot.val();
  humVal.innerText = val + " %";
  const time = (new Date()).getTime();
  updateChartData(chartHum, humSeries, val);
  updateChartData(chartHistHum, chartHistHum.series[0].data, val);
  chartComparativo.series[1].addPoint([time, val], true, chartComparativo.series[1].data.length > 20);
});

// Navegación entre tabs
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

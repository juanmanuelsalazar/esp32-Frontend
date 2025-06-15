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

const chartTempInternas = Highcharts.chart("chart-hist-temp-internas", {
  chart: { type: 'line' },
  title: { text: 'Temperaturas Internas' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: '°C' }},
  series: []
});

const chartAmoniaco = Highcharts.chart("chart-amoniaco", {
  chart: { type: 'line' },
  title: { text: 'Amoniaco en Aire (ppm)' },
  xAxis: { type: 'datetime' },
  yAxis: { title: { text: 'ppm' }},
  series: [{ name: 'Amoniaco', data: [] }]
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

    const tempSeriesData = {};
    const humSeriesData = {};
    const internasData = {};
    const amoniacoData = [];

    Object.values(data).forEach(entry => {
      const fecha = entry.fecha;
      if (!fecha) return;

      const timeMs = isoToTimestamp(fecha);
      if (timeMs >= startTs && timeMs <= endTs) {
        Object.entries(entry).forEach(([key, value]) => {
          if (typeof value !== 'number') return;

          if (key.includes("temperatura") && !key.includes("temperaturaInterna")) {
            if (!tempSeriesData[key]) tempSeriesData[key] = [];
            tempSeriesData[key].push([timeMs, value]);
          }

          if (key.includes("humedad")) {
            if (!humSeriesData[key]) humSeriesData[key] = [];
            humSeriesData[key].push([timeMs, value]);
          }

          if (key.includes("temperaturaInterna")) {
            if (!internasData[key]) internasData[key] = [];
            internasData[key].push([timeMs, value]);
          }
          if (key === "amoniaco") {
            amoniacoData.push([timeMs, value]);
          }
        });
      }
    });


    Object.values(data).forEach(entry => {
      const fecha = entry.fecha;
      if (!fecha) return;

      const timeMs = isoToTimestamp(fecha);
      if (timeMs >= startTs && timeMs <= endTs) {
        for (const key in tempSeriesData) {
          if (entry[key] !== undefined) {
            tempSeriesData[key].push([timeMs, entry[key]]);
          }
        }
        for (const key in humSeriesData) {
          if (entry[key] !== undefined) {
            humSeriesData[key].push([timeMs, entry[key]]);
          }
        }
      }
    });

    // Ordenamos los datos
    for (const key in tempSeriesData) {
      tempSeriesData[key].sort((a, b) => a[0] - b[0]);
    }

    for (const key in humSeriesData) {
      humSeriesData[key].sort((a, b) => a[0] - b[0]);
    }

    chartHistTemp.update({ series: [] }, false);  // 🔄 Limpia series anteriores
    chartHistHum.update({ series: [] }, false);


    // Actualizar gráfico histórico de temperatura
    while (chartHistTemp.series.length) {
      chartHistTemp.series[0].remove(false);
    }
    Object.keys(tempSeriesData).forEach(name => {
      chartHistTemp.addSeries({ name, data: tempSeriesData[name] }, false);
    });
    chartHistTemp.redraw();


    // Actualizar gráfico histórico de humedad
    while (chartHistHum.series.length) {
      chartHistHum.series[0].remove(false);
    }
    Object.keys(humSeriesData).forEach(name => {
      chartHistHum.addSeries({ name, data: humSeriesData[name] }, false);
    });
    chartHistHum.redraw();

    // Temperaturas internas
    chartTempInternas.update({ series: [] }, false);
    while (chartTempInternas.series.length) {
      chartTempInternas.series[0].remove(false);
    }
    Object.entries(internasData).forEach(([name, data]) => {
      chartTempInternas.addSeries({ name, data }, false);
    });
    chartTempInternas.redraw();

// Amoniaco
    chartAmoniaco.series[0].setData(amoniacoData, true);




    // Comparativo (solo primera temperatura y humedad)
    const compTemp = tempSeriesData["temperatura"] || [];
    const compHum = humSeriesData["humedad"] || [];

    chartComparativo.update({
      series: [
        ...Object.entries(tempSeriesData).map(([name, data]) => ({ name, data })),
        ...Object.entries(humSeriesData).map(([name, data]) => ({ name, data }))
      ]
    });

    chartHistTemp.setTitle({ text: `Histórico Temperaturas (${start} → ${end})` });
    chartHistHum.setTitle({ text: `Histórico Humedades (${start} → ${end})` });
    chartComparativo.setTitle({ text: `Comparativo Temperatura vs Humedad (${start} → ${end})` });

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

// Temperaturas Internas - Filtro por fecha
document.getElementById("filter-temp-internas").addEventListener("submit", function (e) {
  e.preventDefault();
  const desde = document.getElementById("start-date-temp-int").value;
  const hasta = document.getElementById("end-date-temp-int").value;
  if (desde && hasta) {
    loadHistoricalData(desde, hasta);
  } else {
    alert("Por favor selecciona ambas fechas para Temperaturas");
  }
});

// Amoniaco - Filtro por fecha
document.getElementById("filter-amoniaco").addEventListener("submit", function (e) {
  e.preventDefault();
  const desde = document.getElementById("start-date-amoniaco").value;
  const hasta = document.getElementById("end-date-amoniaco").value;
  if (desde && hasta) {
    loadHistoricalData(desde, hasta);
  } else {
    alert("Por favor selecciona ambas fechas para Amoniaco");
  }
});


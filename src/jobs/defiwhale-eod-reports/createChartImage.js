'use strict';

const axios = require('axios')
const fs = require('fs')

async function getBase64(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => new Buffer(response.data, 'binary').toString('base64'))
}

async function getChartImageForUniswapReport(currencies, volumeUsd) {
  let chartConfig = {
    type: 'bar',

    data: {
      labels: currencies,
      datasets: [{
        data: volumeUsd
      }]
    },
    options: {
      title: {
        display: true,
        text: '24hr Stablecoin Transfer Report',
        fontColor: 'black',
        fontSize: 24,
        fontFamily: 'Arial'
      },
      scales: {
        yAxes: [{
          name: 'Daily Volume ($)',
          type: 'linear',
          position: 'left',
          scaleLabel: {
            display: true,
            labelString: 'Daily Volume ($)'
          },
          gridLines: {
            display: true
          }
        }]
      },
      plugins: {
        legend: false
      }
    }
  }
  let urlText = `https://quickchart.io/chart?bkg=white&width=640&height=360&c=${JSON.stringify(chartConfig)}`
  let url = encodeURI(urlText)
  let bytecodeChart = await getBase64(url)

  return bytecodeChart
}

module.exports.start = async (currencies, volumeUsd) => {
  let chartImage = await getChartImageForUniswapReport(currencies, volumeUsd)

  return chartImage
  // let result = fs.writeFileSync('./tmp/temp.png', chartImage, {encoding: 'base64'})
};

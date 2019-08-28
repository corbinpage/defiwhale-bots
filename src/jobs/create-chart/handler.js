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

  // let chartConfig = {
  //   type: 'bar',

  //   data: {
  //     labels: currencies,
  //     datasets: [{
  //       label: 'Daily Volume ($)',
  //       data: volumeUsd,
  //       yAxisID: 'a'
  //     }]
  //   },
  //   options: {
  //     title: {
  //       display: true,
  //       text: '24hr Uniswap Report',
  //       fontColor: 'black',
  //       fontSize: 24,
  //       fontFamily: 'Arial'
  //     },
  //     scales: {
  //       yAxes: [{
  //         name: 'Daily Volume ($)',
  //         id: 'a',
  //         type: 'linear',
  //         position: 'left',
  //         scaleLabel: {
  //           display: true,
  //           labelString: 'Daily Volume ($)'
  //         },
  //         gridLines: {
  //           display: true
  //         }
  //       }]
  //     }
  //   }
  // }


  // let chartConfig = {
  //   type: 'bar',

  //   data: {
  //     labels: ['DAI', 'MKR', 'USDC', 'BAT', 'WBTC'],
  //     datasets: [{
  //       label: 'Daily Volume ($)',
  //       data: [ 322499, 112688, 61947, 56113, 16357 ],
  //       yAxisID: 'a'
  //     }, {
  //       label: 'Pool Size ($)',
  //       data: [ 1269286, 2123338, 184195, 288043, 511628 ],
  //       yAxisID: 'b',
  //       backgroundColor: 'rgb(204, 179, 255, 1)'
  //     }]
  //   },
  //   options: {
  //     title: {
  //       display: true,
  //       text: '24hr Uniswap Report',
  //       fontColor: 'black',
  //       fontSize: 24,
  //       fontFamily: 'Arial'
  //     },
  //     scales: {
  //       yAxes: [{
  //         name: 'Daily Volume ($)',
  //         id: 'a',
  //         type: 'linear',
  //         position: 'left',
  //         scaleLabel: {
  //           display: true,
  //           labelString: 'Daily Volume ($)'
  //         },
  //         gridLines: {
  //           display: true
  //         }
  //       }, {
  //         name: 'Pool Size ($)',
  //         id: 'b',
  //         type: 'linear',
  //         position: 'right',
  //         scaleLabel: {
  //           display: true,
  //           labelString: 'Pool Size ($)'
  //         },
  //         gridLines: {
  //           display: false
  //         }
  //       }]
  //     }
  //   }
  // }

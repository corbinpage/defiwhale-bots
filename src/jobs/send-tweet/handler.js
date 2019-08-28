'use strict';

const { getMessageFromSNS } = require('./utils');

const Path = require('path');
const fs = require('fs');
const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const axios = require('axios');

async function sendTweet(params) {
	var T = new Twit({
	  consumer_key: process.env.TWITTER_CONSUMER_KEY,
	  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	  access_token: process.env.TWITTER_ACCESS_TOKEN,
	  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	})

	return T.post('statuses/update', params)
}

module.exports.start2 = async (event) => {
	let params = getMessageFromSNS(event)
	let response

  if(params.mediaUrl) {

  }

	console.log('Params')
	console.log(params)

	if(params.message && params.media_ids) {
		response = await sendTweet({
			status: params.message,
      media_ids: params.media_ids
    })
  } else if(params.message) {
    response = await sendTweet({
      status: params.message
    })
  }

	return responses
};


module.exports.start = async (event) => {
  let mediaUrl = 'https://quickchart.io/chart?width=500&height=300&c={type:%27bar%27,data:{labels:[%27January%27,%27February%27,%27March%27,%27April%27,%20%27May%27],%20datasets:[{label:%27Dogs%27,data:[50,60,70,180,190]},{label:%27Cats%27,data:[100,200,300,400,500]}]}}'


  //Include the exporter module
  const chartExporter = require('highcharts-export-server');

  chartExporter.initPool();
  // Chart details object specifies chart type and data to plot
  const chartDetails = {
     type: "png",
     options: {
         chart: {
             type: "pie"
         },
         title: {
             text: "Heading of Chart"
         },
         plotOptions: {
             pie: {
                 dataLabels: {
                     enabled: true,
                     format: "<b>{point.name}</b>: {point.y}"
                 }
             }
         },
         series: [
             {
                 data: [
                     {
                         name: "a",
                         y: 100
                     },
                     {
                         name: "b",
                         y: 20
                     },
                     {
                         name: "c",
                         y: 50
                     }
                 ]
             }
         ]
     }
  };

  chartExporter.export(chartDetails, (err, res) => {
     // Get the image data (base64)
     let imageb64 = res.data;
     // Filename of the output
     let outputFile = "./tmp/bar.png";
     // Save the image to file
     fs.writeFileSync(outputFile, imageb64, "base64", function(err) {
         if (err) console.log(err);
     });
     console.log("Saved image!");
     chartExporter.killPool();
  });


  // const b64content = fs.readFileSync(mediaUrl, { encoding: 'base64' })

  // const file = fs.createWriteStream("tmp/temp.jpg");
  // const request = http.get(mediaUrl, function(response) {
  //   response.pipe(file);
  // });

  // const path = Path.resolve(__dirname, '/tmp', 'temp.jpg')
  // const writer = fs.createWriteStream(path)

  // const tmpFile = await getImage(mediaUrl)

  // console.log(tmpFile)


// 600x600 canvas size
// var chartNode = new ChartjsNode(600, 600);
// return chartNode.drawChart(chartJsOptions)
// .then(() => {
//     // chart is created
 
//     // get image as png buffer
//     return chartNode.getImageBuffer('image/png');
// })
// .then(buffer => {
//     Array.isArray(buffer) // => true
//     // as a stream
//     return chartNode.getImageStream('image/png');
// })
// .then(streamResult => {
//     // using the length property you can do things like
//     // directly upload the image to s3 by using the
//     // stream and length properties
//     streamResult.stream // => Stream object
//     streamResult.length // => Integer length of stream
//     // write to a file
//     return chartNode.writeImageToFile('image/png', './testimage.png');
// })
// .then(() => {
//     // chart is now written to the file path
//     // ./testimage.png
// });



};


//
// post a tweet with media
//
// var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })

// // first we must post the media to Twitter
// T.post('media/upload', { media_data: b64content }, function (err, data, response) {
//   // now we can assign alt text to the media, for use by screen readers and
//   // other text-based presentations and interpreters
//   var mediaIdStr = data.media_id_string
//   var altText = "Small flowers in a planter on a sunny balcony, blossoming."
//   var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

//   T.post('media/metadata/create', meta_params, function (err, data, response) {
//     if (!err) {
//       // now we can reference the media and post a tweet (media will attach to the tweet)
//       var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }

//       T.post('statuses/update', params, function (err, data, response) {
//         console.log(data)
//       })
//     }
//   })
// })







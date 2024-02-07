const notification = function (data, setup) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Basic ${setup.apiKey}`,
  };

  const options = {
    host: 'onesignal.com',
    port: 443,
    path: '/api/v1/notifications',
    method: 'POST',
    headers,
  };

  const https = require('https');
  const req = https.request(options, async (res) => {
    res.on('data', async (data) => {
      const res = JSON.parse(data);
      // add response in model
    });
  });

  req.on('error', (error) => {
    console.log('ERROR:');
    console.log(error);
  });

  req.write(JSON.stringify(data));
  req.end();
};

const sendNotification = async (data) => {
  const setup = { apiKey: process.env.ONE_SIGNAL_API_KEY, };
  const message = {
    app_id: process.env.ONE_SIGNAL_APP_ID,
    contents: { en: data.message },
    include_player_ids: data.playerId,
  };
  notification(message, setup);
};
module.exports = { sendNotification, };

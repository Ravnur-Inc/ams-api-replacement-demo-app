const readline = require('readline');
const VodProvider = require('./VodProvider');

require('dotenv').config()

const RMSOptions = {
  SubscriptionId: process.env.SUBSCRIPTION_ID,
  ResourceGroupName: process.env.RESOURCE_GROUP_NAME,
  MediaServicesAccountName: process.env.MEDIA_SERVICES_ACCOUNT_NAME,
  ApiEndpoint: process.env.API_ENDPOINT,
  ApiKey: process.env.API_KEY
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const inputFile = args.length > 0 ? args[0] : './input/sample.mp4'
    const vodProvider = new VodProvider(RMSOptions);
    await vodProvider.createVod(inputFile);
  } catch (err) {
    console.error(err.message);
  }

  console.log('Press any key to exit...');
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', () => {
    process.exit();
  });
}

main();

const sdk = require('transbank-sdk');
const WebpayPlus = sdk.WebpayPlus;
const Options = sdk.Options;
const IntegrationCommerceCodes = sdk.IntegrationCommerceCodes;
const IntegrationApiKeys = sdk.IntegrationApiKeys;
const Environment = sdk.Environment;

const options = new Options(
  IntegrationCommerceCodes.WEBPAY_PLUS,
  IntegrationApiKeys.WEBPAY,
  Environment.Integration
);

const transaction = new WebpayPlus.Transaction(options);

const create = async () => {
  try {
    const res = await transaction.create(
      "ORD-TEST-456", 
      "SES-TEST-456", 
      10000, 
      "CLP", 
      "https://webpay3gint.transbank.cl/opengate/callback"
    );
    console.log('SUCCESS!');
    console.log('Token:', res.token);
    console.log('URL:', res.url);
  } catch(err) {
    console.log('Error:', err.message);
    if (err.response?.data) {
      console.log('Response:', err.response.data);
    }
  }
};

create();
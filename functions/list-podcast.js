const dynamoDb = require('./libs/dynamodb-lib');

const { PODCASTS_TABLE } = process.env;

module.exports.handler = async () => {
  let params;
  params = {
    TableName: PODCASTS_TABLE,
    Limit: 25
  };

  let response;

  try {
    const result = await dynamoDb.scan(params);
    const podcasts = result.Items;
    response = {
      statusCode: 200,
      body: JSON.stringify(podcasts)
    };
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: error.message
      })
    };
  }

  return response;
};

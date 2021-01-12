const dynamoDb = require('./libs/dynamodb-lib');

const { FEEDS_TABLE } = process.env;

module.exports.handler = async (event) => {
  const { id } = event.pathParameters;

  const params = {
    TableName: FEEDS_TABLE,
    IndexName: 'byItunesId',
    KeyConditionExpression: 'itunes_id = :itunesID',
    ExpressionAttributeValues: {
      ':itunesID': id
    },
    Limit: 25
  };

  let response;

  try {
    const result = await dynamoDb.query(params);
    console.log(result);
    const episodes = result.Items;
    response = {
      statusCode: 200,
      body: JSON.stringify(episodes)
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

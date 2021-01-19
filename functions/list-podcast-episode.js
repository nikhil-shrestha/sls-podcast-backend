const dynamoDb = require('./libs/dynamodb-lib');
const commonMiddleware = require('./libs/middleware');

const { FEEDS_TABLE } = process.env;

const main = async (event) => {
  const { id } = event.pathParameters;

  const params = {
    TableName: FEEDS_TABLE,
    IndexName: 'byItunesId',
    KeyConditionExpression: 'itunes_id = :itunesID',
    ExpressionAttributeValues: {
      ':itunesID': id
    },
    Limit: 25,
    ScanIndexForward: false //DESC ORDER, Set 'true' if u want asc order
  };

  let response;

  try {
    const result = await dynamoDb.query(params);
    console.log(result);
    response = {
      statusCode: 200,
      body: JSON.stringify(result)
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

module.exports.handler = commonMiddleware(main);

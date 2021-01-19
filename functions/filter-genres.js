const dynamoDb = require('./libs/dynamodb-lib');
const commonMiddleware = require('./libs/middleware');

const { PODCASTS_TABLE } = process.env;

const main = async (event) => {
  const { genre } = event.pathParameters;

  const params = {
    TableName: PODCASTS_TABLE,
    FilterExpression: 'contains(#genres, :name)',
    ExpressionAttributeNames: {
      '#genres': 'genres'
    },
    ExpressionAttributeValues: {
      ':name': genre
    },
    Limit: 25
  };

  let response;

  try {
    const result = await dynamoDb.scan(params);
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

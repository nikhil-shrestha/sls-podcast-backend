const DynamoDB = require('aws-sdk/clients/dynamodb');
const client = new DynamoDB.DocumentClient();

module.exports = {
  get: (params) => client.get(params).promise(),
  put: (params) => client.put(params).promise(),
  query: (params) => client.query(params).promise(),
  scan: (params) => client.scan(params).promise(),
  update: (params) => client.update(params).promise(),
  delete: (params) => client.delete(params).promise(),
  batchGet: (params) => client.batchGet(params).promise(),
  batchWrite: (params) => client.batchWrite(params).promise()
};

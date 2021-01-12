const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const _ = require('lodash');

const dynamoDb = require('./libs/dynamodb-lib');

const { TABLE_NAME } = process.env;

const readFile = () => {
  const filePath = path.join(__dirname, '../data/test.csv');
  const csvData = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .on('error', () => {
        // handle error
        reject('Error');
      })
      .pipe(csv())
      .on('data', (row) => {
        // use row data
        csvData.push(row);
      })
      .on('end', () => {
        // handle end of CSV
        csvData.shift();
        resolve(csvData);
      });
  });
};

function sixMonthsPrior(date) {
  // Copy date so don't affect original
  const b = new Date(date);
  const d = new Date();
  // Get the current month number
  const m = d.getMonth();
  // Subtract 6 months
  d.setMonth(m - 6);

  if (b > d) {
    return true;
  } else {
    return false;
  }
}

module.exports.handler = async () => {
  const csvData = await readFile();
  console.log('Csv file successfully processed!');

  const filtered_data = csvData
    .map((row) => {
      const d = parseInt(row['newest_item_pubdate']) * 1000;
      if (sixMonthsPrior(d)) {
        return row;
      }
    })
    .filter((x) => x && !_.isEmpty(x.itunes_id) && x.language.includes('en'));

  const itemsArray = [];

  for (const obj of filtered_data) {
    const {
      url,
      itunes_id,
      original_url,
      newest_item_pubdate,
      oldest_item_pubdate,
      language
    } = obj;

    const item = {
      PutRequest: {
        Item: {
          id: itunes_id,
          itunes_id,
          url,
          original_url,
          newest_item_pubdate,
          oldest_item_pubdate,
          language
        }
      }
    };

    if (item) {
      itemsArray.push(item);
    }
  }

  const batches = _.chunk(itemsArray, 25).map((batch) => {
    const params = {
      RequestItems: {
        [`${TABLE_NAME}`]: batch
      }
    };

    return dynamoDb.batchWrite(params);
  });

  const finalrslt = await Promise.all(batches);
  console.log({ finalrslt });

  return {
    statusCode: 200,
    body: JSON.stringify(filtered_data)
  };
};

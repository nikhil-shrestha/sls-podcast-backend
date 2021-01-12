const rp = require('request-promise');
const Parser = require('rss-parser');
const _ = require('lodash');

const dynamoDb = require('./libs/dynamodb-lib');

const {
  TABLE_NAME,
  PODCASTS_TABLE,
  FEEDS_TABLE,
  PODCAST_INDEX_API_KEY,
  PODCAST_INDEX_SECRET_KEY
} = process.env;

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

const getPodcast = async (podcastID) => {
  let podcast;
  console.log('itunesID::', podcastID);

  try {
    const { results } = await rp.get(`https://itunes.apple.com/lookup`, {
      qs: {
        id: podcastID
      },
      json: true
    });
    console.log(JSON.stringify(results));

    if (results.length) {
      podcast = results[0];
      podcast = {
        ...podcast,
        id: podcastID,
        author: podcast.artistName,
        cover: podcast.artworkUrl600,
        title: podcast.collectionName,
        lastUpdate: podcast.releaseDate
      };
    }
  } catch (e) {
    console.log(e);
  }

  return podcast;
};

const getPodcastEpisodeByFeedUrl = async (url) => {
  const feedStr = await rp.get(`${url}?format=xml`);
  console.log(JSON.stringify(feedStr));

  const parsedFeed = await new Parser().parseString(feedStr);
  console.log(JSON.stringify(parsedFeed));

  const episodes = parsedFeed.items
    .map((episode) => {
      try {
        return {
          ...episode,
          author: podcast.author,
          src: toHttps(episode.enclosure.url),
          type: episode.enclosure.type,
          cover: episode.itunes.image || podcast.cover,
          description: episode.contentSnippet || episode.content,
          size: episode.enclosure.length,
          releaseDate: episode.pubDate,
          podcastTitle: podcast.title,
          duration: episode.itunes.duration,
          podcastId: podcast.id
        };
      } catch (e) {
        return undefined;
      }
    })
    .filter((v) => v);
  console.log(JSON.stringify(episodes));

  return episodes;
};

async function getPodcastEpisodes(podcastID) {
  console.log('itunesID::', podcastID);

  const api = require('podcast-index-api')(
    PODCAST_INDEX_API_KEY,
    PODCAST_INDEX_SECRET_KEY
  );

  let episodes;
  try {
    const result = await api.episodesByItunesId(podcastID);
    episodes = result.items;
  } catch (err) {
    console.log(err);
  }
  return episodes;
}

module.exports.handler = async () => {
  let params;
  params = {
    TableName: TABLE_NAME,
    Limit: 100
  };

  let response;

  let podcasts;
  try {
    const result = await dynamoDb.scan(params);
    console.log({ result });
    podcasts = result.Items;
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

  const randItems = getRandom(podcasts, 20);

  console.log(JSON.stringify(randItems));

  const podcastItemsArray = [];
  const episodeItemsArray = [];

  for (const rand of randItems) {
    const [podcast, episodes] = await Promise.all([
      getPodcast(rand.id),
      getPodcastEpisodes(rand.id)
    ]);

    if (podcast) {
      const item = {
        PutRequest: {
          Item: {
            ...podcast
          }
        }
      };
      if (item) {
        podcastItemsArray.push(item);
      }
    }

    if (podcast && episodes && episodes.length) {
      for (const obj of episodes) {
        const item = {
          PutRequest: {
            Item: {
              ...obj,
              itunes_id: `${rand.id}`
            }
          }
        };

        if (item) {
          episodeItemsArray.push(item);
        }
      }
    }
  }

  const batches1 = _.chunk(podcastItemsArray, 20).map((batch) => {
    const params = {
      RequestItems: {
        [`${PODCASTS_TABLE}`]: batch
      }
    };

    return dynamoDb.batchWrite(params);
  });

  const batches2 = _.chunk(episodeItemsArray, 25).map((batch) => {
    const params = {
      RequestItems: {
        [`${FEEDS_TABLE}`]: batch
      }
    };

    return dynamoDb.batchWrite(params);
  });

  await Promise.all([...batches1, ...batches2]);

  return response;
};

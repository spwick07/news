const express = require('express');
const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const app = express();
const parser = new Parser();
const cache = new NodeCache({ stdTTL: 300 }); // cache for 5 minutes
const cors = require('cors');
app.use(cors());


const feeds = {
  world: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  tech: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  business: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
  all: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
};

app.get('/news', async (req, res) => {
  const keyword = req.query.q?.toLowerCase();
  const category = req.query.category || 'all';

  const feedUrl = feeds[category] || feeds['all'];

  if (cache.has(feedUrl)) {
    return res.json(filterResults(cache.get(feedUrl), keyword));
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    cache.set(feedUrl, feed.items);
    res.json(filterResults(feed.items, keyword));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RSS feed', details: err.message });
  }
});

function filterResults(items, keyword) {
  if (!keyword) return items;
  return items.filter(item =>
    item.title.toLowerCase().includes(keyword) ||
    item.contentSnippet?.toLowerCase().includes(keyword)
  );
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`RSS API running at http://localhost:${port}`);
});

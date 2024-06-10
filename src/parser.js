import { uniqueId } from 'lodash';

const parsePosts = (parsedData, feedID) => {
  const posts = [];

  parsedData.querySelectorAll('item').forEach((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const id = uniqueId();
    const newPost = {
      id, feedID, title, description, link,
    };

    posts.push(newPost);
  });

  return posts;
};

const parseResponse = (state, response) => {
  const responseContent = response.data.contents;
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(responseContent, 'text/xml');

  if (parsedData.querySelector('parsererror')) {
    throw new Error('notRss');
  }

  const feedID = state.feeds.map((feed) => feed.link).indexOf(state.form.input.value);
  const feedTitle = parsedData.querySelector('title').textContent;
  const feedDescription = parsedData.querySelector('description').textContent;
  const feed = {
    link: state.form.input.value,
    title: feedTitle,
    description: feedDescription,
  };
  const posts = parsePosts(parsedData, feedID);

  return {
    feed, posts,
  };
};

export default parseResponse;

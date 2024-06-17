import { uniqueId } from 'lodash';

const parsePost = (postData, feedID) => {
  const title = postData.querySelector('title').textContent;
  const description = postData.querySelector('description').textContent;
  const link = postData.querySelector('link').textContent;
  const id = uniqueId();
  return {
    id, feedID, title, description, link,
  };
};

const makePosts = (parsedData, feedID) => {
  const posts = [];

  parsedData.querySelectorAll('item').forEach((item) => {
    posts.push(parsePost(item, feedID));
  });

  return posts;
};

const parseResponse = (state, response, elements) => {
  const responseContent = response.data.contents;
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(responseContent, 'text/xml');
  const errorNode = parsedData.querySelector('parsererror');

  if (errorNode) {
    console.error(errorNode.querySelector('div').textContent);
    throw new Error('notRss');
  }

  const feedID = state.feeds.map((feed) => feed.link).indexOf(elements.input.value);
  const feedTitle = parsedData.querySelector('title').textContent;
  const feedDescription = parsedData.querySelector('description').textContent;
  const feed = {
    link: elements.input.value,
    title: feedTitle,
    description: feedDescription,
  };
  const posts = makePosts(parsedData, feedID);

  return {
    feed, posts,
  };
};

export default parseResponse;

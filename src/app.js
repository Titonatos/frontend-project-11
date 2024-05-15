import onChange from 'on-change';
import i18n from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import { uniqueId } from 'lodash';
import resources from './locales/index.js';
import { render, renderPosts } from './render.js';

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

const addProxy = (url) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');

  proxyUrl.searchParams.append('disableCache', 'true');
  proxyUrl.searchParams.append('url', url);

  return proxyUrl.toString();
};

const makeRequest = (link) => axios.get(addProxy(link), { timeout: 5000 })
  .catch(() => {
    throw Error('networkError');
  });

const parseResponse = (state, response) => {
  const responseContent = response.data.contents;
  const parser = new DOMParser();
  const parsedData = parser.parseFromString(responseContent, 'text/xml');

  if (parsedData.querySelector('parsererror')) {
    throw new Error('notRss');
  }

  console.log(response.data.status.url);
  console.log(response.data.contents);
  console.log(response.data);

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

const updating = (state, i18nInstance) => {
  if (state.feeds.length === 0) return null;

  return Promise.all(state.feeds.map((feed) => makeRequest(feed.link)))
    .then((responses) => {
      responses.forEach((response) => {
        const oldLinks = state.posts.map((post) => post.link);
        const { posts } = parseResponse(state, response);
        const newPosts = posts.filter((post) => !oldLinks.includes(post.link));
        state.posts = [...newPosts, ...state.posts];
      });
      renderPosts(state, i18nInstance);
    })
    .catch((err) => {
      console.log(`updating: ${i18nInstance.t(`errors.${err.message}`)}`);
    });
};

export default () => {
  const state = {
    form: {
      isSuccess: null,
      isValide: null,
      input: {
        value: null,
      },
      error: '',
    },
    elements: {
      input: document.querySelector('#url-input'),
      button: document.querySelector('.col-auto>.btn-primary'),
      form: document.querySelector('.rss-form'),
      feedback: document.querySelector('.feedback'),
      postsList: document.querySelector('.posts'),
      feedsList: document.querySelector('.feeds'),
      modal: document.querySelector('.modal'),
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalHref: document.querySelector('.full-article'),
    },
    feeds: [],
    viewedPostIds: [],
    posts: [],
  };

  yup.setLocale({
    string: {
      url: () => ('notUrl'),
      required: () => ('empty'),
    },
    mixed: {
      notOneOf: () => ('empty'),
    },
  });

  const i18nInstance = i18n.createInstance();
  const makeSchema = (validatedLinks) => yup.string()
    .required()
    .url()
    .notOneOf(validatedLinks);

  const watcher = onChange(state, ((path, value) => {
    if (path === 'form.input.value') {
      const schema = makeSchema(state.feeds.map((feed) => feed.link));

      schema.validate(value)
        .then(() => makeRequest(value))
        .then((response) => {
          state.form.isValide = true;
          state.form.isSuccess = true;
          const { feed, posts } = parseResponse(watcher, response);
          state.posts = [...posts, ...state.posts];
          state.feeds.push(feed);
        }).catch((err) => {
          console.log(`Input value when error: ${state.form.input.value}`);
          state.form.error = i18nInstance.t(`errors.${err.message}`);
          state.form.isValide = false;
        })
        .finally(() => {
          render(state, i18nInstance);
          state.form.error = '';
          state.form.input.value = '';
        });
    }
  }));

  const submitHandler = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputValue = formData.get('url');

    watcher.form.input.value = inputValue;
  };

  i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => {
    state.elements.form.addEventListener('submit', submitHandler);
  });

  setInterval(updating, 5000, state, i18nInstance);
};

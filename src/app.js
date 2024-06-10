import onChange from 'on-change';
import i18n from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import resources from './locales/index.js';
import { render, renderPosts } from './render.js';
import parseResponse from './parser.js';

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
      console.error(`updating: ${i18nInstance.t(`errors.${err.message}`)}`);
    });
};

export default () => {
  const state = {
    form: {
      state: 'filling',
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
      notOneOf: () => ('alreadyInList'),
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
          const { feed, posts } = parseResponse(watcher, response);
          state.posts = [...posts, ...state.posts];
          state.feeds.push(feed);
          state.form.state = 'processed';
        })
        .catch((err) => {
          state.form.error = i18nInstance.t(`errors.${err.message}`);
          state.form.state = 'failed';
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

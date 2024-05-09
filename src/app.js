import onChange from 'on-change';
import i18n from 'i18next';
import resources from './locales/index.js';
import * as yup from 'yup';
import axios from 'axios';

axios.defaults.cache = false;

const validation = (url, links, i18Instance) => {
  const schema = yup
    .string()
    .trim()
    .required()
    .url(i18Instance.t('invalidURLMsg'))
    .notOneOf(links, i18Instance.t('duplicateErrorMsg'))
    .validate(url);
  return schema;
};

const render = (state) => {
  if (!state.form.isValide) {
    state.elementsUI.errorMsg.textContent = state.form.error;
    state.elementsUI.input.classList.add('isInvalid');
    
  } else {
    state.elementsUI.input.classList.remove('isInvalid');
    state.elementsUI.errorMsg.textContent = '';
    
    state.elementsUI.form.reset();
  }
  
  if (state.posts.length > 0) {
    const ul = document.createElement('ul');
    const container = document.querySelector('.feeds-container');
    
    state.posts.forEach(post => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = post.title;
      a.href = post.link;
      li.append(a);
      ul.append(li);
    });
    
    container.innerHTML = '';
    container.append(ul);
  }
};

const init = (instance, state) => {
  state.elementsUI.button.textContent = instance.t('buttonText');
};

const normolizePosts = (parsedPosts, feedID) => {
  const posts = [];
  
  parsedPosts.forEach(item => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    
    posts.push({ feedID, title, description, link });
  });
  
  return posts;
};

const addProxy = (url) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.append('disableCache', 'true');
  proxyUrl.searchParams.append('url', url);
  return proxyUrl.toString();
};

const makeRequest = (link) => {
  console.log(addProxy(link));
  return axios.get(addProxy(link))
    .catch(err => {
      throw Error('invalidResourceMsg')
    });
};

const getFeedPosts = (state, response) => {
  const responseContent = response.data.contents;
  const parser = new DOMParser();
  const parsedPosts = parser.parseFromString(responseContent, 'text/xml').querySelectorAll('item');
  const feedID = state.links.indexOf(response.data.status.url);
  return normolizePosts(parsedPosts, feedID);
};

export default () => {
  const state = {
    form: {
      state: 'filling',
      isValide: null,
      input: {
          value: null,
      },
      error: '',
    },
    elementsUI: {
      input: document.querySelector('input'),
      button: document.querySelector('button'),
      form: document.querySelector('form'),
      errorMsg: document.querySelector('p.errorMsg'),
    },
    feeds: [],
    links: [],
    posts: [],
  };

  const watcher = onChange(state, ((path, value) => {
    if (path === 'form.input.value') {
      Promise.resolve(() => {
        validation(value, state.feeds.map(feed => feed.link), i18nInstance);
      })
      .then(() => {
        return makeRequest(value);
      })
      .then((response) => {
        state.form.isValide = true;
        state.links.push(value);
        const normolizedPosts = getFeedPosts(watcher, response);

        state.posts = state.posts.concat(normolizedPosts);
      }).catch((err) => {
        state.form.error = i18nInstance.t(err.message);
        state.form.isValide = false;
      })
      .finally(() => {
          render(state);
          state.form.error = '';
          state.form.input.value = '';
      })
      ;
    }
  }));

  const updating = () => {
    if (state.links.length > 0) {
      Promise.all(state.links.map(link => makeRequest(link)))
        .then((responses) => {
          responses.forEach((response) => {
            const oldLinks = state.posts.map(post => post.link);
            const normolizedPosts = getFeedPosts(watcher, response);
            const newPosts = normolizedPosts.filter(post => !oldLinks.includes(post.link));
            state.posts = [...newPosts, ...state.posts];
          });
          render(state);
        })
        .catch((err) => {
          console.log(`updating: ${i18nInstance.t(err.message)}`);
        });
    }
  };

  const i18nInstance = i18n.createInstance();

  i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => {
    init(i18nInstance, state);

    const form = document.querySelector('form');

    const handler = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const inputValue = formData.get('input');
      
      watcher.form.input.value = inputValue;
    }
    
    form.addEventListener('submit', handler);
    
    
  });

  setInterval(updating, 5000);
};
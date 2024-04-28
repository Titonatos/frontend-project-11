import onChange from 'on-change';
import i18n from 'i18next';
import resources from './locales/index.js';
import * as yup from 'yup';
import { setLocale } from 'yup';
import axios from 'axios';

const schema = yup.string().trim().required().url().matches(/^https:\/\/.*feed$/);

const render = (state) => {
  if (!state.form.isValide) {
    state.elementsUI.errorMsg.textContent = state.form.error;
    state.elementsUI.input.classList.add('isInvalid');

  } else {
    state.elementsUI.input.classList.remove('isInvalid');
    state.elementsUI.errorMsg.textContent = '';

    state.elementsUI.form.reset();
  }
  
  if (!state.feeds.length) {
    const news = [];
    const ul = document.createElement('ul');
    const container = document.querySelector('.feeds-container');
    
    state.feeds.forEach(feed => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = feed.title;
      a.href = feed.link;
      li.prepend(a);
      news.push(li);
    });

    ul.prepend(news.join(''));
    container.prepend(ul);
  }
};

const init = (instance, state) => {
  setLocale({
    mixed: {
      default: instance.t('invalidURLMsg'),
    },
  });

  state.elementsUI.button.textContent = instance.t('buttonText');
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
  };

  const watcher = onChange(state, ((path, value, preiousValue) => {
    if (path === 'form.input.value') {
      console.log('if path');
      Promise.resolve(state.form.isValide = schema.validate(value))
        .then(() => {
          state.form.error = (state.form.isValide) ? '' : i18nInstance.t('duplicateErrorMsg');

          if (state.form.isValide) {
            axios.get(`https://allorigins.hexlet.app/get?charset=UTF-8&url=${value}`)
              .then((response) => {
                const responseContent = response.data.contents;
                const parser = new DOMParser();
                const parsedItems = parser.parseFromString(responseContent, 'text/xml').querySelectorAll('item');
                const newFeed = {
                  link: value,
                  news: [],
                };
                
                parsedItems.forEach(item => {
                  const title = item.querySelector('title').textContent;
                  const description = item.querySelector('description').textContent;
                  const link = item.querySelector('link').textContent;
  
                  const newsData = { title, description, link };
                  newFeed.news.push(newsData);
                });

                state.feeds.push(newFeed);

                console.log(state.feeds);
              })
              .then()
              .catch((response) => {
                console.log(`Error:\n${response}`);
              });
          }
        })
        .catch((err) => {
          state.form.error = i18nInstance.t('invalidResourceMsg');
          state.form.isValide = false;
        })
        .finally(() => {
          render(state);
          state.form.error = '';
          state.form.input.value = '';
        });
    }
  }));

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
};
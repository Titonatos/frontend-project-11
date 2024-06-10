const createButton = (id, state, instance) => {
  const button = document.createElement('button');
  const modalHadler = (e) => {
    const currentPost = state.posts.find((post) => post.id === e.target.dataset.id);
    const { modalBody, modalTitle, modalHref } = state.elements;

    modalTitle.textContent = currentPost.title;
    modalBody.textContent = currentPost.description;
    modalHref.href = state.feeds[currentPost.feedID];

    e.target.previousSibling.classList.remove('fw-bold');
    e.target.previousSibling.classList.add('fw-normal');

    state.viewedPostIds.push(currentPost.id);
  };

  button.setAttribute('type', 'button');
  button.setAttribute('data-id', id);
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.textContent = instance.t('buttons.view');
  button.addEventListener('click', modalHadler);

  return button;
};

const createPosts = (state, instance) => {
  const posts = [];

  state.posts.forEach((post) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const button = createButton(post.id, state, instance);
    const linkHandler = ({ target }) => {
      target.classList.remove('fw-bold');
      target.classList.add('fw-normal');
    };

    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    a.setAttribute('href', post.link);
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;

    if (state.viewedPostIds.includes(post.id)) {
      a.classList.add('fw-normal');
    } else {
      a.classList.add('fw-bold');
    }

    a.addEventListener('click', linkHandler);
    li.append(a);
    li.append(button);
    posts.push(li);
  });

  return posts;
};

const createFeeds = (state) => {
  const feeds = [];

  state.feeds.forEach((feed) => {
    const li = document.createElement('li');
    const feedTitle = document.createElement('h3');
    const p = document.createElement('p');

    feedTitle.textContent = feed.title;
    feedTitle.classList.add('h6', 'm-0');
    p.classList.add('m-0', 'small', 'text-black-50');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    p.textContent = feed.description;

    li.append(feedTitle);
    li.append(p);
    feeds.push(li);
  });

  return feeds;
};

const createList = (itemsType, state, i18next) => {
  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const cardTitle = document.createElement('h2');
  const list = document.createElement('ul');

  list.classList.add('list-group', 'border-0', 'rounded-0');
  cardTitle.classList.add('card-title', 'h4');
  cardBody.classList.add('card-body');
  card.classList.add('card', 'border-0');

  cardBody.append(cardTitle);
  card.append(cardBody);

  cardTitle.textContent = i18next.t(`items.${itemsType}`);

  switch (itemsType) {
    case 'feeds':
      list.append(...createFeeds(state));
      break;
    case 'posts':
      list.append(...createPosts(state, i18next));
      break;
    default:
      break;
  }

  card.append(list);

  return card;
};

const renderFeeds = (state, i18next) => {
  const feeds = createList('feeds', state, i18next);

  state.elements.feedsList.innerHTML = '';
  state.elements.feedsList.append(feeds);
};

export const renderPosts = (state, i18next) => {
  const posts = createList('posts', state, i18next);

  state.elements.postsList.innerHTML = '';
  state.elements.postsList.append(posts);
};

export const render = (state, instance) => {
  const { feedback } = state.elements;

  if (state.form.state === 'processed') {
    state.elements.form.reset();
    feedback.textContent = instance.t('status.success');
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  } else if (state.form.state === 'failed') {
    feedback.textContent = state.form.error;
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
  }

  if (state.posts.length > 0) {
    renderFeeds(state, instance);
    renderPosts(state, instance);
  }
};

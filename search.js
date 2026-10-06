(() => {
  const form = document.getElementById('site-search');
  const input = document.getElementById('site-query');
  const output = document.getElementById('search-output');
  const status = document.getElementById('search-status');
  const list = document.getElementById('search-results');
  const more = document.getElementById('more-results');
  let currentQuery = '', page = 0, controller, busy = false;
  const seen = new Set();
  async function search(query, append = false) {
    if (append && busy) return;
    if (!append) {
      controller?.abort();
      currentQuery = query;
      page = 0;
      seen.clear();
      list.replaceChildren();
      more.hidden = true;
    }
    const request = new AbortController();
    controller = request;
    busy = true;
    more.disabled = true;
    output.hidden = false;
    status.textContent = 'Searching…';
    try {
      const response = await fetch('/api/search?' + new URLSearchParams({q: currentQuery, page}), {signal: request.signal});
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.results)) throw new Error('Search failed');
      for (const site of data.results) {
      let url;
      try { url = new URL(site.url); } catch { continue; }
      if (!['http:', 'https:'].includes(url.protocol) || seen.has(url.href)) continue;
      seen.add(url.href);
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = url.href;
      link.textContent = site.title || url.hostname;
      const address = document.createElement('small');
      address.textContent = site.url;
      const description = document.createElement('p');
      const snippet = new DOMParser().parseFromString(site.description || '', 'text/html');
      description.textContent = snippet.body.textContent;
      li.append(link, address, description);
      list.append(li);
    }
      page += 1;
      more.hidden = !data.moreResultsAvailable || page > 9;
      status.textContent = seen.size ? `${seen.size} results for “${currentQuery}”` : 'No results found. Try another search.';
    } catch (error) {
      if (request.signal.aborted) return;
      status.textContent = 'Search is unavailable right now. Please try again.';
    } finally {
      if (controller === request) {busy = false; more.disabled = false;}
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    history.replaceState(null, '', url);
    search(query);
  });
  more.addEventListener('click', () => search(currentQuery, true));
  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {input.value = initial; search(initial);}
})();

(async () => {
  const CLIENT_ID = '4900eb1f-0c10-4bd9-99c3-c59e6c1ecebf';
  const BASE = 'https://api.digital.costco.com/baskets/lists/';

  // Auto-grab a valid JWT from storage (no cookies needed — Bearer token does all auth)
  const findToken = () => {
    const jwtRe = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const v = store.getItem(store.key(i));
        if (!v) continue;

        for (const m of v.matchAll(jwtRe)) {
          try {
            const payload = JSON.parse(
              atob(
                m[0]
                  .split('.')[1]
                  .replace(/-/g, '+')
                  .replace(/_/g, '/')
              )
            );

            if (payload.aud === CLIENT_ID && payload.exp * 1000 > Date.now()) {
              return m[0];
            }
          } catch {}
        }
      }
    }

    return null;
  };

  const token = findToken();

  if (!token) {
    console.error('❌ No valid Costco JWT in storage. Log in on costco.com first.');
    return;
  }

  // Cookieless fetch helper
  const api = async (path = '', { method = 'GET', body } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      credentials: 'omit',
      headers: {
        accept: 'application/json',
        authorization: token,
        'client-id': CLIENT_ID,
        ...(body ? { 'content-type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      throw Object.assign(new Error(`HTTP ${res.status}`), {
        status: res.status,
        data
      });
    }

    return data;
  };

  // Expose operations
  const costco = {
    listWishlists: () => api(),

    createWishlist: (title, description = '') =>
      api('', {
        method: 'POST',
        body: {
          title,
          description,
          type: 'WishList'
        }
      }),

    addItem: (listId, itemNumber, quantity = '1') =>
      api(`${listId}/entries`, {
        method: 'POST',
        body: {
          comment: '',
          itemNumber: String(itemNumber),
          quantity: String(quantity),
          type: 'CostcoItemListEntry'
        }
      })
  };

  window.costco = costco;

  console.log('✅ Ready. window.costco available:');
  console.log('   await costco.listWishlists()');
  console.log('   await costco.createWishlist("pokemon")');
  console.log('   await costco.addItem("<listId>", "1992235")');

  // Demo run
  const SKU = '1992235';
  const TARGET_TITLE = 'pokemon';

  const lists = await costco.listWishlists();
  console.log('📋 Existing lists:', lists);

  const items = Array.isArray(lists)
    ? lists
    : (lists.items || lists.lists || lists.data || []);

  let target = items.find(
    l => (l.title || '').toLowerCase() === TARGET_TITLE
  );

  if (!target) {
    console.log(`📝 Creating "${TARGET_TITLE}"...`);
    target = await costco.createWishlist(TARGET_TITLE);
    console.log('   created:', target);
  }

  const listId = target.id || target.listId || target.uuid;

  if (!listId) {
    console.error('❌ Could not extract list id from:', target);
    return;
  }

  console.log(`➕ Adding SKU ${SKU} to list ${listId}...`);
  console.log(await costco.addItem(listId, SKU));
})();
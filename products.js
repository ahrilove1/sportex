// SPORTEX Product Data
// Data loaded from data/products.json — editable via CMS

let allProducts = [];
let productsLoaded = (async () => {
  try {
    const r = await fetch('data/products.json');
    const data = await r.json();
    // Transform CMS format to site format
    allProducts = (data.products_list || []).map(p => ({
      ...p,
      images: (p.images || []).map(i => typeof i === 'string' ? i : (i.url || i.image || '')),
      features: (p.features || []).map(f => typeof f === 'string' ? f : (f.text || f.feature || '')),
    }));
  } catch (e) {
    console.error('Failed to load products data', e);
  }
})();

// 按品类获取产品
function getProductsByCategory(cat) {
  return allProducts.filter(p => p.category === cat);
}

// 按ID获取产品
function getProductById(id) {
  return allProducts.find(p => p.id === id);
}

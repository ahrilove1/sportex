// SPORTEX Product Data
// Data loaded from data/products.json — editable via CMS

const PLACEHOLDER = 'images/placeholder.svg';

let allProducts = [];
let productsLoaded = (async () => {
  try {
    const r = await fetch('data/products.json');
    const data = await r.json();
    // Transform CMS format to site format + apply placeholder for empty images
    allProducts = (data.products_list || []).map(p => ({
      ...p,
      thumbnail: p.thumbnail || PLACEHOLDER,
      images: (p.images || []).map(i => typeof i === 'string' ? i : (i.url || i.image || '')).filter(u => u),
      features: (p.features || []).map(f => typeof f === 'string' ? f : (f.text || f.feature || '')),
    }));
    // If all gallery images are empty, use placeholder
    allProducts.forEach(p => { if (!p.images.length) p.images = [PLACEHOLDER]; });
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

// Helper: img tag with placeholder fallback
function imgTag(src, alt, cls) {
  return '<img src="' + (src || PLACEHOLDER) + '" alt="' + (alt || '') + '" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'"' + (cls ? ' class="' + cls + '"' : '') + ' loading="lazy">';
}

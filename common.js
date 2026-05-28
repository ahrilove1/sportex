// SPORTEX Shared Components
// 梓豪 — 修改公司信息只需改这里

const COMPANY = {
  name: 'SPORTEX',
  fullName: 'Nanjing Sportex Clothing Co., Ltd.',
  address: 'Nanjing, Jiangsu, China',
  email: 'info@sportex.com',
  phone: '+86 25 XXXX XXXX',
};

function renderNav(currentPage) {
  const pages = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'men', label: 'Men', href: 'men.html' },
    { id: 'women', label: 'Women', href: 'women.html' },
    { id: 'about', label: 'About', href: 'about.html' },
    { id: 'contact', label: 'Contact', href: 'contact.html' },
  ];

  const links = pages.map(p => {
    const active = currentPage === p.id ? ' class="active"' : '';
    return `<li><a href="${p.href}"${active}>${p.label}</a></li>`;
  }).join('');

  document.getElementById('siteNav').innerHTML = `
    <div class="top-bar" data-lkey="topBar">Premium Outdoor Apparel Manufacturer | AATCC Certified | Jiangsu, China</div>
    <nav class="nav">
      <a href="index.html" class="nav-logo">SPORTEX</a>
      <ul class="nav-links">
        ${links}
        <li class="lang-toggle"><button onclick="toggleLang()" data-lkey="langToggle">中文</button></li>
      </ul>
    </nav>
  `;
}

function renderFooter() {
  document.getElementById('siteFooter').innerHTML = `
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">SPORTEX</div>
        <p data-lkey="footerTagline">Premium outdoor resort wear.<br>Designed in Nanjing. Made for the world.</p>
      </div>
      <div class="footer-col">
        <h4 data-lkey="footerCollections">Collections</h4>
        <a href="men.html" data-lkey="footerMen">Men's Wear</a>
        <a href="women.html" data-lkey="footerWomen">Women's Wear</a>
      </div>
      <div class="footer-col">
        <h4 data-lkey="footerCompany">Company</h4>
        <a href="about.html" data-lkey="footerAbout">About Us</a>
        <a href="contact.html" data-lkey="footerContact">Contact</a>
      </div>
      <div class="footer-col">
        <h4 data-lkey="footerInfo">Info</h4>
        <p>${COMPANY.address}</p>
        <p>${COMPANY.email}</p>
        <p>${COMPANY.phone}</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 SPORTEX. All rights reserved.</span>
      <span>${COMPANY.fullName}</span>
    </div>
  `;
}

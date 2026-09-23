export const PYTHON_SCRAPER_CODE = `# =============================================================================
# Zooplus.gr Scraper — Dog Food Database Pipeline
# Author: Lambros (No-Code AI Engineer)
# Purpose: Crawl dry food & treats categories, extract one row per flavor,
#          check shipping to Greece, map to COLUMNS schema, output CSV.
# =============================================================================

# ─── LIBRARIES ───────────────────────────────────────────────────────────────
import requests
from bs4 import BeautifulSoup
import csv
import json
import re
import time
import logging
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ─── LOGGING ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('zooplus_gr_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ─── CONSTANTS ───────────────────────────────────────────────────────────────
BASE_URL = "https://www.zooplus.gr"
SHIPPING_URL = "https://www.zooplus.gr/html/shipping"
CATEGORIES = {
    "dry_food": "/shop/dogs/dry_food",
    "treats": "/shop/dogs/treats",
}
DELAY_BETWEEN_REQUESTS = 2  # seconds — be polite
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "el-GR,el;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─── COLUMNS SCHEMA (Single Source of Truth) ─────────────────────────────────
COLUMNS = [
    {"group": "Identity", "header": "Brand", "key": "brand"},
    {"group": "Identity", "header": "Product Name", "key": "product_name"},
    {"group": "Identity", "header": "Product Line/Range", "key": "product_line"},
    {"group": "Identity", "header": "Product Type", "key": "product_type"},
    {"group": "Identity", "header": "Flavor Variant", "key": "flavor_variant"},
    {"group": "Identity", "header": "SKU/Product Code", "key": "sku"},
    {"group": "Identity", "header": "Product URL", "key": "product_url"},
    {"group": "Identity", "header": "Image URL", "key": "image_url"},
    {"group": "Identity", "header": "Back Label Image URL", "key": "back_label_image_url"},
    {"group": "Target", "header": "Life Stage", "key": "life_stage"},
    {"group": "Target", "header": "Breed Size", "key": "breed_size"},
    {"group": "Target", "header": "Special Condition", "key": "special_condition"},
    {"group": "Protein", "header": "Main Meat Category", "key": "main_meat_category"},
    {"group": "Protein", "header": "Named Protein Sources", "key": "named_protein_sources"},
    {"group": "Protein", "header": "Fresh Meat Inclusion %", "key": "fresh_meat_inclusion_pct"},
    {"group": "Ingredients", "header": "Full Ingredient List", "key": "full_ingredient_list"},
    {"group": "Ingredients", "header": "Contains Grains", "key": "contains_grains"},
    {"group": "Ingredients", "header": "Grain-Free", "key": "grain_free"},
    {"group": "Ingredients", "header": "Additives/Preservatives", "key": "additives_preservatives"},
    {"group": "Ingredients", "header": "Artificial Colors/Flavors", "key": "artificial_colors_flavors"},
    {"group": "Analytical", "header": "Crude Protein %", "key": "crude_protein_pct"},
    {"group": "Analytical", "header": "Crude Fat %", "key": "crude_fat_pct"},
    {"group": "Analytical", "header": "Crude Fiber %", "key": "crude_fiber_pct"},
    {"group": "Analytical", "header": "Crude Ash %", "key": "crude_ash_pct"},
    {"group": "Analytical", "header": "Moisture/Water %", "key": "moisture_pct"},
    {"group": "Analytical", "header": "Calcium %", "key": "calcium_pct"},
    {"group": "Analytical", "header": "Phosphorus %", "key": "phosphorus_pct"},
    {"group": "Analytical", "header": "Omega-3 %", "key": "omega3_pct"},
    {"group": "Analytical", "header": "Omega-6 %", "key": "omega6_pct"},
    {"group": "Analytical", "header": "Carbohydrates %", "key": "carbohydrates_pct"},
    {"group": "Additives", "header": "Vitamin A", "key": "vitamin_a"},
    {"group": "Additives", "header": "Vitamin D3", "key": "vitamin_d3"},
    {"group": "Additives", "header": "Vitamin E", "key": "vitamin_e"},
    {"group": "Additives", "header": "Other Vitamins & Minerals", "key": "other_vitamins_minerals"},
    {"group": "Energy", "header": "Metabolizable Energy kcal/kg", "key": "metabolizable_energy_kcal"},
    {"group": "Commercial", "header": "Price", "key": "price"},
    {"group": "Commercial", "header": "Currency", "key": "currency"},
    {"group": "Commercial", "header": "Package Weight(s)", "key": "package_weight"},
    {"group": "Commercial", "header": "Price per kg", "key": "price_per_kg"},
    {"group": "Commercial", "header": "Country of Origin", "key": "country_of_origin"},
    {"group": "Commercial", "header": "Source Retailer", "key": "source_retailer"},
    {"group": "Commercial", "header": "Date Scraped", "key": "date_scraped"},
    {"group": "Shipping", "header": "Ships To Greece", "key": "ships_to_greece"},
    {"group": "Shipping", "header": "Retailer Name", "key": "retailer_name"},
    {"group": "Shipping", "header": "Retailer URL", "key": "retailer_url"},
    {"group": "Shipping", "header": "Brand Site URL", "key": "brand_site_url"},
    {"group": "Monetization", "header": "Affiliate URL", "key": "affiliate_url"},
]

# ─── MEAT CATEGORY AUTO-TAGGER ──────────────────────────────────────────────
MEAT_KEYWORDS = {
    "chicken": ["chicken", "poultry", "huhn", "poulet", "pollo"],
    "duck": ["duck", "ente", "canard"],
    "rabbit": ["rabbit", "kaninchen", "lapin", "coniglio"],
    "lamb": ["lamb", "lamm", "agneau", "agnello"],
    "pork": ["pork", "schwein", "porc", "maiale"],
    "veal": ["veal", "kalb", "veau", "vitello"],
    "venison": ["venison", "hirsch", "cerf", "cervo", "deer"],
    "vegetarian": ["vegetarian", "veggie", "plant-based"],
}

def auto_tag_meat_category(product_name: str, ingredients: str) -> str:
    """Auto-tag the main meat category from product name + ingredients."""
    combined = (product_name + " " + ingredients).lower()
    for category, keywords in MEAT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in combined:
                return category
    return "other meats"

# ─── DATA CLASS ──────────────────────────────────────────────────────────────
@dataclass
class ProductRow:
    brand: str = ""
    product_name: str = ""
    product_line: str = ""
    product_type: str = ""
    flavor_variant: str = ""
    sku: str = ""
    product_url: str = ""
    image_url: str = ""
    back_label_image_url: str = ""
    life_stage: str = ""
    breed_size: str = ""
    special_condition: str = ""
    main_meat_category: str = ""
    named_protein_sources: str = ""
    fresh_meat_inclusion_pct: str = ""
    full_ingredient_list: str = ""
    contains_grains: str = ""
    grain_free: str = ""
    additives_preservatives: str = ""
    artificial_colors_flavors: str = ""
    crude_protein_pct: str = ""
    crude_fat_pct: str = ""
    crude_fiber_pct: str = ""
    crude_ash_pct: str = ""
    moisture_pct: str = ""
    calcium_pct: str = ""
    phosphorus_pct: str = ""
    omega3_pct: str = ""
    omega6_pct: str = ""
    carbohydrates_pct: str = ""
    vitamin_a: str = ""
    vitamin_d3: str = ""
    vitamin_e: str = ""
    other_vitamins_minerals: str = ""
    metabolizable_energy_kcal: str = ""
    price: str = ""
    currency: str = ""
    package_weight: str = ""
    price_per_kg: str = ""
    country_of_origin: str = ""
    source_retailer: str = "Zooplus.gr"
    date_scraped: str = ""
    ships_to_greece: str = ""
    retailer_name: str = "Zooplus"
    retailer_url: str = "https://www.zooplus.gr"
    brand_site_url: str = ""
    affiliate_url: str = ""

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)

# ─── SHIPPING CHECKER ────────────────────────────────────────────────────────
class ShippingChecker:
    """Checks if Zooplus ships to Greece."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self._ships_to_greece: Optional[bool] = None
    
    def check(self) -> bool:
        if self._ships_to_greece is not None:
            return self._ships_to_greece
        
        try:
            response = self.session.get(SHIPPING_URL, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            page_text = soup.get_text().lower()
            
            # Check for Greece mentions
            greece_indicators = [
                "ελλάδα", "ελλάδος", "greece", "greek",
                "ελληνικά", "hellas", "gr"
            ]
            
            for indicator in greece_indicators:
                if indicator in page_text:
                    self._ships_to_greece = True
                    logger.info("✅ Zooplus ships to Greece (found: '%s')", indicator)
                    return True
            
            self._ships_to_greece = False
            logger.warning("❌ Could not confirm Zooplus ships to Greece")
            return False
            
        except Exception as e:
            logger.error("Error checking shipping: %s", e)
            self._ships_to_greece = False
            return False

# ─── CATEGORY CRAWLER ────────────────────────────────────────────────────────
class CategoryCrawler:
    """Crawls category pages and collects product URLs."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.product_urls: List[str] = []
    
    def crawl_category(self, category_path: str, max_pages: int = 50) -> List[str]:
        """Crawl all pages of a category and collect product URLs."""
        urls = []
        page = 1
        
        while page <= max_pages:
            url = f"{BASE_URL}{category_path}?page={page}"
            logger.info("Crawling page %d: %s", page, url)
            
            try:
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Find product links
                product_links = soup.find_all('a', href=True)
                page_urls = []
                
                for link in product_links:
                    href = link['href']
                    # Product URLs typically contain product identifiers
                    if '/shop/dogs/' in href and href.count('/') > 4:
                        full_url = urljoin(BASE_URL, href)
                        if full_url not in urls:
                            page_urls.append(full_url)
                
                if not page_urls:
                    logger.info("No more products found on page %d. Stopping.", page)
                    break
                
                urls.extend(page_urls)
                logger.info("Found %d products on page %d (total: %d)", 
                           len(page_urls), page, len(urls))
                
                page += 1
                time.sleep(DELAY_BETWEEN_REQUESTS)
                
            except Exception as e:
                logger.error("Error crawling page %d: %s", page, e)
                break
        
        self.product_urls = urls
        return urls

# ─── PRODUCT EXTRACTOR ───────────────────────────────────────────────────────
class ProductExtractor:
    """Extracts product data from a product page."""
    
    def __init__(self, ships_to_greece: bool):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.ships_to_greece = ships_to_greece
    
    def extract(self, product_url: str) -> Optional[ProductRow]:
        """Extract all data from a single product page."""
        try:
            response = self.session.get(product_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            row = ProductRow()
            row.product_url = product_url
            row.date_scraped = time.strftime("%Y-%m-%d")
            row.ships_to_greece = str(self.ships_to_greece).lower()
            
            # ── Extract Brand ──
            brand_el = soup.find(class_=re.compile(r'brand|manufacturer', re.I))
            if brand_el:
                row.brand = brand_el.get_text(strip=True)
            else:
                # Try breadcrumbs
                breadcrumbs = soup.find(class_=re.compile(r'breadcrumb', re.I))
                if breadcrumbs:
                    links = breadcrumbs.find_all('a')
                    if len(links) > 1:
                        row.brand = links[1].get_text(strip=True)
            
            # ── Extract Product Name ──
            title_el = soup.find('h1') or soup.find(class_=re.compile(r'product.*title|title', re.I))
            if title_el:
                row.product_name = title_el.get_text(strip=True)
            
            # ── Extract Image URL ──
            img_el = soup.find('img', class_=re.compile(r'product.*image|main.*image', re.I))
            if img_el:
                row.image_url = img_el.get('src', '') or img_el.get('data-src', '')
            else:
                img_el = soup.find('img', src=re.compile(r'product|media'))
                if img_el:
                    row.image_url = img_el.get('src', '')
            
            # ── Extract Price ──
            price_el = soup.find(class_=re.compile(r'price|cost', re.I))
            if price_el:
                price_text = price_el.get_text(strip=True)
                price_match = re.search(r'([\\d,]+\\.?\\d*)', price_text.replace(',', '.'))
                if price_match:
                    row.price = price_match.group(1)
                    row.currency = "EUR"
            
            # ── Extract Package Weight ──
            weight_el = soup.find(string=re.compile(r'\\d+\\s*(kg|g)', re.I))
            if weight_el:
                weight_match = re.search(r'(\\d+\\.?\\d*\\s*(?:kg|g))', weight_el, re.I)
                if weight_match:
                    row.package_weight = weight_match.group(1)
            
            # ── Calculate Price per kg ──
            if row.price and row.package_weight:
                try:
                    price_val = float(row.price)
                    weight_match = re.search(r'(\\d+\\.?\\d*)\\s*(kg|g)', 
                                            row.package_weight, re.I)
                    if weight_match:
                        weight = float(weight_match.group(1))
                        if weight_match.group(2).lower() == 'g':
                            weight = weight / 1000
                        if weight > 0:
                            row.price_per_kg = f"{price_val / weight:.2f}"
                except (ValueError, ZeroDivisionError):
                    pass
            
            # ── Extract Product Type from URL ──
            if '/dry_food/' in product_url:
                row.product_type = "Dry Food"
            elif '/treats/' in product_url:
                row.product_type = "Treat"
            elif '/wet_food/' in product_url:
                row.product_type = "Wet Food"
            
            # ── Extract Flavor Variant from product name ──
            if row.product_name:
                # Common patterns: "Brand Product - Flavor" or "Brand Product Flavor"
                flavor_patterns = [
                    r'[-–]\\s*([A-Z][a-z]+(?:\\s*&\\s*[A-Z][a-z]+)?)\\s*$',
                    r'\\b(\\w+\\s*(?:&|and)\\s*\\w+)\\s*$',
                ]
                for pattern in flavor_patterns:
                    match = re.search(pattern, row.product_name)
                    if match:
                        row.flavor_variant = match.group(1).strip()
                        break
            
            # ── Auto-tag meat category ──
            row.main_meat_category = auto_tag_meat_category(
                row.product_name, row.full_ingredient_list
            )
            
            # ── Try to extract structured data from JSON-LD ──
            self._extract_json_ld(soup, row)
            
            # ── Try to extract from product detail sections ──
            self._extract_detail_sections(soup, row)
            
            logger.info("✅ Extracted: %s - %s", row.brand, row.product_name)
            return row
            
        except Exception as e:
            logger.error("Error extracting %s: %s", product_url, e)
            return None
    
    def _extract_json_ld(self, soup: BeautifulSoup, row: ProductRow):
        """Extract data from JSON-LD structured data."""
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    if not row.product_name:
                        row.product_name = data.get('name', '')
                    if not row.image_url:
                        row.image_url = data.get('image', '')
                    if 'offers' in data:
                        offers = data['offers']
                        if isinstance(offers, dict):
                            row.price = str(offers.get('price', ''))
                            row.currency = offers.get('priceCurrency', 'EUR')
                        elif isinstance(offers, list) and offers:
                            row.price = str(offers[0].get('price', ''))
                            row.currency = offers[0].get('priceCurrency', 'EUR')
                    if 'sku' in data:
                        row.sku = data['sku']
            except (json.JSONDecodeError, TypeError):
                continue
    
    def _extract_detail_sections(self, soup: BeautifulSoup, row: ProductRow):
        """Extract nutritional and ingredient data from detail sections."""
        # Look for ingredient tables/lists
        ingredient_section = soup.find(string=re.compile(r'ingredients|συστατικά', re.I))
        if ingredient_section:
            parent = ingredient_section.find_parent(['div', 'section', 'table'])
            if parent:
                row.full_ingredient_list = parent.get_text(strip=True)
        
        # Look for nutritional analysis
        nutritional_section = soup.find(string=re.compile(r'analytical|nutritional|ανάλυση', re.I))
        if nutritional_section:
            parent = nutritional_section.find_parent(['div', 'section', 'table'])
            if parent:
                text = parent.get_text()
                # Extract individual values
                protein_match = re.search(r'(?:protein|πρωτεΐνη)\\s*[:\\-]?\\s*(\\d+\\.?\\d*)\\s*%', text, re.I)
                if protein_match:
                    row.crude_protein_pct = protein_match.group(1)
                
                fat_match = re.search(r'(?:fat|λίπος|fett)\\s*[:\\-]?\\s*(\\d+\\.?\\d*)\\s*%', text, re.I)
                if fat_match:
                    row.crude_fat_pct = fat_match.group(1)
                
                fiber_match = re.search(r'(?:fiber|fibre|fibers)\\s*[:\\-]?\\s*(\\d+\\.?\\d*)\\s*%', text, re.I)
                if fiber_match:
                    row.crude_fiber_pct = fiber_match.group(1)
                
                ash_match = re.search(r'(?:ash|τέφρα)\\s*[:\\-]?\\s*(\\d+\\.?\\d*)\\s*%', text, re.I)
                if ash_match:
                    row.crude_ash_pct = ash_match.group(1)

# ─── CSV EXPORTER ────────────────────────────────────────────────────────────
class CSVExporter:
    """Exports product data to CSV following the COLUMNS schema."""
    
    def __init__(self, filename: str = "zooplus_gr_dogfood.csv"):
        self.filename = filename
    
    def export(self, products: List[ProductRow]):
        """Export products to CSV."""
        headers = [col['header'] for col in COLUMNS]
        keys = [col['key'] for col in COLUMNS]
        
        with open(self.filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            
            for product in products:
                product_dict = product.to_dict()
                row = {}
                for key, header in zip(keys, headers):
                    row[header] = product_dict.get(key, '')
                writer.writerow(row)
        
        logger.info("📁 Exported %d products to %s", len(products), self.filename)

# ─── MAIN SCRAPER ORCHESTRATOR ───────────────────────────────────────────────
class ZooplusGRScraper:
    """Main orchestrator for the Zooplus.gr scraping pipeline."""
    
    def __init__(self):
        self.shipping_checker = ShippingChecker()
        self.crawler = CategoryCrawler()
        self.products: List[ProductRow] = []
        self.exporter = CSVExporter("zooplus_gr_dogfood.csv")
    
    def run(self):
        """Execute the full scraping pipeline."""
        logger.info("=" * 60)
        logger.info("🐕 Zooplus.gr Dog Food Scraper — Starting")
        logger.info("=" * 60)
        
        # Step 1: Check shipping to Greece
        logger.info("\\n📦 Step 1: Checking shipping to Greece...")
        ships_to_greece = self.shipping_checker.check()
        
        # Step 2: Initialize product extractor
        extractor = ProductExtractor(ships_to_greece)
        
        # Step 3: Crawl each category
        all_product_urls = []
        for category_name, category_path in CATEGORIES.items():
            logger.info("\\n📂 Step 2: Crawling category '%s'...", category_name)
            urls = self.crawler.crawl_category(category_path)
            all_product_urls.extend(urls)
            logger.info("Found %d product URLs in '%s'", len(urls), category_name)
        
        # Remove duplicates
        all_product_urls = list(set(all_product_urls))
        logger.info("\\n📋 Total unique product URLs: %d", len(all_product_urls))
        
        # Step 4: Extract data from each product
        logger.info("\\n🔍 Step 3: Extracting product data...")
        for i, url in enumerate(all_product_urls, 1):
            logger.info("[%d/%d] Processing: %s", i, len(all_product_urls), url)
            product = extractor.extract(url)
            if product:
                self.products.append(product)
            time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Step 5: Deduplicate by flavor (one row = one flavor)
        logger.info("\\n🔄 Step 4: Deduplicating by flavor...")
        self.products = self._deduplicate_by_flavor(self.products)
        logger.info("After deduplication: %d unique flavors", len(self.products))
        
        # Step 6: Export to CSV
        logger.info("\\n📁 Step 5: Exporting to CSV...")
        self.exporter.export(self.products)
        
        # Summary
        logger.info("\\n" + "=" * 60)
        logger.info("✅ SCRAPING COMPLETE")
        logger.info("   Total products: %d", len(self.products))
        logger.info("   Output file: zooplus_gr_dogfood.csv")
        logger.info("=" * 60)
    
    def _deduplicate_by_flavor(self, products: List[ProductRow]) -> List[ProductRow]:
        """Keep only one row per unique flavor (brand + flavor + product type)."""
        seen = set()
        unique = []
        
        for p in products:
            key = f"{p.brand}|{p.flavor_variant}|{p.product_type}"
            if key not in seen:
                seen.add(key)
                unique.append(p)
        
        return unique

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    scraper = ZooplusGRScraper()
    scraper.run()
`;

export const LIBRARIES_USED = [
  {
    name: "requests",
    purpose: "HTTP client for making GET requests to Zooplus pages",
    install: "pip install requests",
  },
  {
    name: "beautifulsoup4",
    purpose: "HTML parsing — extract product data from page structure",
    install: "pip install beautifulsoup4",
  },
  {
    name: "selenium",
    purpose: "Browser automation for JavaScript-rendered pages (fallback)",
    install: "pip install selenium",
  },
  {
    name: "csv (stdlib)",
    purpose: "Export scraped data to CSV format",
    install: "Built-in",
  },
  {
    name: "json (stdlib)",
    purpose: "Parse JSON-LD structured data from product pages",
    install: "Built-in",
  },
  {
    name: "re (stdlib)",
    purpose: "Regex extraction of prices, weights, nutritional values",
    install: "Built-in",
  },
  {
    name: "dataclasses (stdlib)",
    purpose: "Clean data model for ProductRow with type hints",
    install: "Built-in",
  },
  {
    name: "logging (stdlib)",
    purpose: "Structured logging for monitoring scrape progress",
    install: "Built-in",
  },
  {
    name: "time (stdlib)",
    purpose: "Polite delays between requests (rate limiting)",
    install: "Built-in",
  },
];

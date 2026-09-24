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
import random
import logging
import os
import pickle
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, field, asdict, fields
from typing import Optional, List, Dict, Set
from datetime import datetime
from pathlib import Path

# ─── LOGGING ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('zooplus_gr_scraper.log', encoding='utf-8'),
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

# Polite crawling: random delay range (seconds)
DELAY_MIN = 2.0
DELAY_MAX = 5.0

# Retry configuration
MAX_RETRIES = 3
RETRY_BACKOFF = [5, 15, 30]  # seconds between retries

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# Checkpoint file for resume capability
CHECKPOINT_FILE = "scraper_checkpoint.pkl"
OUTPUT_CSV = "zooplus_gr_dogfood.csv"

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
# Order matters: more specific patterns first to avoid false positives
MEAT_PATTERNS = [
    ("venison",     r'\\b(venison|hirsch|deer|cerf|cervo|ελάφι)\\b'),
    ("rabbit",      r'\\b(rabbit|kaninchen|lapin|coniglio|κουνέλι)\\b'),
    ("duck",        r'\\b(duck|ente|canard|anatra|πάπια)\\b'),
    ("lamb",        r'\\b(lamb|lamm|agneau|agnello|αρνί)\\b'),
    ("veal",        r'\\b(veal|kalb|veau|vitello|μοσχάρι)\\b'),
    ("pork",        r'\\b(pork|schwein|porc|maiale|χοιρινό)\\b'),
    ("chicken",     r'\\b(chicken|huhn|poulet|pollo|κοτόπουλο|poultry)\\b'),
    ("vegetarian",  r'\\b(vegetarian|veggie|plant.based|χορτοφαγ)\\b'),
]

def auto_tag_meat_category(product_name: str, ingredients: str) -> str:
    """Auto-tag the main meat category. Order matters — specific before generic."""
    combined = f"{product_name} {ingredients}".lower()
    for category, pattern in MEAT_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            return category
    return "other meats"

# ─── GRAIN DETECTION ─────────────────────────────────────────────────────────
GRAIN_KEYWORDS = [
    "wheat", "rice", "maize", "corn", "barley", "oats", "rye",
    "σιτάρι", "ρύζι", "καλαμπόκι"
]

def detect_grains(ingredients: str) -> tuple:
    """Returns (contains_grains: str, grain_free: str)."""
    if not ingredients:
        return ("", "")
    lower = ingredients.lower()
    has_grains = any(word in lower for word in GRAIN_KEYWORDS)
    return ("Yes" if has_grains else "No", "No" if has_grains else "Yes")

# ─── DATA CLASS ──────────────────────────────────────────────────────────────
@dataclass
class ProductRow:
    """One row = one product flavor. Empty string = missing data."""
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

    def dedup_key(self) -> str:
        """Composite key for deduplication: brand + product_line + flavor + type."""
        return f"{self.brand}|{self.product_line}|{self.flavor_variant}|{self.product_type}"

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)

    def is_valid(self) -> bool:
        """Minimum viable row: must have brand OR product_name AND a URL."""
        return bool((self.brand or self.product_name) and self.product_url)

# ─── HTTP SESSION WITH RETRIES ───────────────────────────────────────────────
class RobustSession:
    """HTTP session with automatic retries, backoff, and jitter."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        # Accept cookies like a real browser
        self.session.cookies.set("language", "el", domain=".zooplus.gr")

    def get(self, url: str, timeout: int = 15) -> Optional[requests.Response]:
        """GET with retries and exponential backoff + jitter."""
        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.get(url, timeout=timeout)

                # Handle rate limiting
                if response.status_code == 429:
                    wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                    jitter = random.uniform(0, wait * 0.5)
                    logger.warning("Rate limited (429). Waiting %.1fs...", wait + jitter)
                    time.sleep(wait + jitter)
                    continue

                # Handle server errors
                if response.status_code >= 500:
                    wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                    logger.warning("Server error %d. Retrying in %ds...", response.status_code, wait)
                    time.sleep(wait)
                    continue

                # Handle not found
                if response.status_code == 404:
                    logger.warning("404 Not Found: %s", url)
                    return None

                response.raise_for_status()
                return response

            except requests.exceptions.Timeout:
                logger.warning("Timeout on attempt %d: %s", attempt + 1, url)
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_BACKOFF[attempt])
            except requests.exceptions.ConnectionError:
                logger.warning("Connection error on attempt %d: %s", attempt + 1, url)
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_BACKOFF[attempt])
            except requests.exceptions.HTTPError as e:
                logger.error("HTTP error: %s", e)
                return None

        logger.error("All %d retries exhausted for: %s", MAX_RETRIES, url)
        return None

    def polite_delay(self):
        """Random delay between requests to avoid detection."""
        delay = random.uniform(DELAY_MIN, DELAY_MAX)
        time.sleep(delay)

# ─── SHIPPING CHECKER ────────────────────────────────────────────────────────
class ShippingChecker:
    """Checks if Zooplus ships to Greece. Result is cached."""

    def __init__(self, http: RobustSession):
        self.http = http
        self._result: Optional[bool] = None

    def check(self) -> bool:
        if self._result is not None:
            return self._result

        response = self.http.get(SHIPPING_URL)
        if not response:
            logger.warning("Could not reach shipping page. Assuming True (Zooplus GR).")
            self._result = True  # zooplus.gr IS the Greek site
            return True

        page_text = response.text.lower()

        greece_indicators = [
            "ελλάδα", "ελλάδος", "greece", "greek",
            "ηπειρωτική ελλάδα", "νησιά", "attica",
        ]

        for indicator in greece_indicators:
            if indicator in page_text:
                self._result = True
                logger.info("✅ Confirmed: Zooplus ships to Greece (found: '%s')", indicator)
                return True

        # zooplus.gr is the Greek domain — it ships to Greece by definition
        if "zooplus.gr" in response.url:
            self._result = True
            logger.info("✅ zooplus.gr is the Greek storefront — ships to Greece")
            return True

        self._result = False
        logger.warning("❌ Could not confirm shipping to Greece")
        return False

# ─── CATEGORY CRAWLER ────────────────────────────────────────────────────────
class CategoryCrawler:
    """Crawls category pages and collects product URLs.
    
    Zooplus uses server-side pagination with ?page=N or offset parameters.
    We also check for 'Load More' AJAX patterns.
    """

    def __init__(self, http: RobustSession):
        self.http = http

    def crawl_category(self, category_path: str, max_pages: int = 100) -> List[str]:
        """Crawl all pages of a category. Returns deduplicated product URLs."""
        all_urls: List[str] = []
        seen_urls: Set[str] = set()
        page = 1
        empty_pages = 0  # Stop after 2 consecutive empty pages

        while page <= max_pages:
            # Zooplus pagination patterns to try
            urls_to_try = [
                f"{BASE_URL}{category_path}?page={page}",
                f"{BASE_URL}{category_path}?offset={page * 24}",
            ]

            page_found = False
            for url in urls_to_try:
                response = self.http.get(url)
                if not response:
                    continue

                soup = BeautifulSoup(response.text, 'html.parser')
                page_urls = self._extract_product_urls(soup)

                new_urls = [u for u in page_urls if u not in seen_urls]
                if new_urls:
                    seen_urls.update(new_urls)
                    all_urls.extend(new_urls)
                    page_found = True
                    empty_pages = 0
                    logger.info(
                        "Page %d: found %d new products (total: %d)",
                        page, len(new_urls), len(all_urls)
                    )
                    break  # This URL pattern works, use it for next page

            if not page_found:
                empty_pages += 1
                if empty_pages >= 2:
                    logger.info("No new products for 2 pages. Category complete.")
                    break
            else:
                empty_pages = 0

            page += 1
            self.http.polite_delay()

        logger.info("Category '%s': %d total product URLs", category_path, len(all_urls))
        return all_urls

    def _extract_product_urls(self, soup: BeautifulSoup) -> List[str]:
        """Extract product URLs from a category listing page."""
        urls = []

        # Strategy 1: Look for product card links with known patterns
        # Zooplus product URLs: /shop/dogs/dry_food/brand_product_name/ARTICLE_ID
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Product pages have article IDs (numeric) or deep path structure
            if re.search(r'/shop/dogs/.+/.+\\d{4,}', href):
                full_url = urljoin(BASE_URL, href)
                # Strip query params for dedup
                clean_url = full_url.split('?')[0]
                if clean_url not in urls:
                    urls.append(clean_url)

        # Strategy 2: Look for data attributes (common in modern e-commerce)
        for el in soup.find_all(attrs={'data-product-url': True}):
            href = el['data-product-url']
            full_url = urljoin(BASE_URL, href)
            clean_url = full_url.split('?')[0]
            if clean_url not in urls:
                urls.append(clean_url)

        # Strategy 3: JSON-LD ItemList
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'ItemList':
                    for item in data.get('itemListElement', []):
                        url = item.get('url', '')
                        if url:
                            full_url = urljoin(BASE_URL, url)
                            clean_url = full_url.split('?')[0]
                            if clean_url not in urls:
                                urls.append(clean_url)
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

        return urls

# ─── PRODUCT EXTRACTOR ───────────────────────────────────────────────────────
class ProductExtractor:
    """Extracts product data from a product page.
    
    Priority order for data extraction:
    1. JSON-LD structured data (most reliable)
    2. Meta tags (og:title, og:image, etc.)
    3. HTML scraping (fallback)
    """

    def __init__(self, http: RobustSession, ships_to_greece: bool):
        self.http = http
        self.ships_to_greece = ships_to_greece

    def extract(self, product_url: str) -> Optional[ProductRow]:
        """Extract all data from a single product page."""
        response = self.http.get(product_url)
        if not response:
            return None

        soup = BeautifulSoup(response.text, 'html.parser')
        row = ProductRow()
        row.product_url = product_url
        row.date_scraped = datetime.now().strftime("%Y-%m-%d")
        row.ships_to_greece = str(self.ships_to_greece).lower()

        # ── Layer 1: JSON-LD (most reliable) ──
        self._extract_json_ld(soup, row)

        # ── Layer 2: Meta tags ──
        self._extract_meta_tags(soup, row)

        # ── Layer 3: HTML scraping (fallback) ──
        self._extract_html(soup, row)

        # ── Layer 4: Product detail sections ──
        self._extract_detail_sections(soup, row)

        # ── Post-processing ──
        self._post_process(row)

        # Validate
        if not row.is_valid():
            logger.warning("Invalid row from %s — skipping", product_url)
            return None

        return row

    def _extract_json_ld(self, soup: BeautifulSoup, row: ProductRow):
        """Extract from JSON-LD structured data (Product schema)."""
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                items = data if isinstance(data, list) else [data]

                for item in items:
                    if not isinstance(item, dict):
                        continue
                    if item.get('@type') != 'Product':
                        continue

                    # Name
                    if not row.product_name:
                        row.product_name = item.get('name', '')

                    # Image
                    if not row.image_url:
                        img = item.get('image', '')
                        if isinstance(img, list):
                            img = img[0] if img else ''
                        row.image_url = img

                    # SKU
                    if not row.sku:
                        row.sku = item.get('sku', '') or item.get('productID', '')

                    # Brand
                    if not row.brand:
                        brand = item.get('brand', {})
                        if isinstance(brand, dict):
                            row.brand = brand.get('name', '')
                        elif isinstance(brand, str):
                            row.brand = brand

                    # Offers
                    offers = item.get('offers', {})
                    if isinstance(offers, dict):
                        self._parse_offer(offers, row)
                    elif isinstance(offers, list) and offers:
                        # Take the first (default) offer
                        self._parse_offer(offers[0], row)

            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

    def _parse_offer(self, offer: dict, row: ProductRow):
        """Parse a single Offer object from JSON-LD."""
        if not row.price and 'price' in offer:
            row.price = str(offer['price'])
        if not row.currency:
            row.currency = offer.get('priceCurrency', 'EUR')

    def _extract_meta_tags(self, soup: BeautifulSoup, row: ProductRow):
        """Extract from OpenGraph and standard meta tags."""
        meta_map = {
            'og:title': 'product_name',
            'og:image': 'image_url',
            'og:description': 'product_name',  # fallback
            'product:brand': 'brand',
        }

        for meta in soup.find_all('meta', attrs={'property': True}):
            prop = meta.get('property', '')
            content = meta.get('content', '').strip()
            if prop in meta_map and content:
                attr = meta_map[prop]
                if not getattr(row, attr):
                    setattr(row, attr, content)

    def _extract_html(self, soup: BeautifulSoup, row: ProductRow):
        """Fallback: extract from HTML structure."""
        # Title from H1
        if not row.product_name:
            h1 = soup.find('h1')
            if h1:
                row.product_name = h1.get_text(strip=True)

        # Image from main product image
        if not row.image_url:
            # Look for common product image patterns
            img = (
                soup.find('img', class_=re.compile(r'product.*image|gallery.*main', re.I))
                or soup.find('img', attrs={'data-zoom-image': True})
                or soup.find('div', class_=re.compile(r'product.*image', re.I))
            )
            if img:
                if img.name == 'img':
                    row.image_url = img.get('data-zoom-image') or img.get('src', '')
                else:
                    inner_img = img.find('img')
                    if inner_img:
                        row.image_url = inner_img.get('src', '')

        # Price from common selectors
        if not row.price:
            price_el = (
                soup.find(class_=re.compile(r'price.*current|current.*price', re.I))
                or soup.find(class_=re.compile(r'product.*price', re.I))
            )
            if price_el:
                price_text = price_el.get_text(strip=True)
                # Handle Greek format: 69,99 € or 69.99€
                price_text = price_text.replace('\\xa0', '').replace(' ', '')
                match = re.search(r'(\\d+[.,]?\\d*)\\s*€', price_text)
                if match:
                    row.price = match.group(1).replace(',', '.')
                    row.currency = "EUR"

    def _extract_detail_sections(self, soup: BeautifulSoup, row: ProductRow):
        """Extract nutritional data and ingredients from detail tabs/sections."""
        page_text = soup.get_text()

        # ── Ingredients ──
        if not row.full_ingredient_list:
            # Look for ingredients section
            ing_header = soup.find(string=re.compile(
                r'(ingredients|συστατικά|zusammensetzung)', re.I
            ))
            if ing_header:
                # Get the next sibling content or parent's next element
                parent = ing_header.find_parent(['h2', 'h3', 'h4', 'dt', 'strong', 'b'])
                if parent:
                    next_el = parent.find_next(['p', 'div', 'dd', 'td'])
                    if next_el:
                        row.full_ingredient_list = next_el.get_text(strip=True)

        # ── Nutritional Analysis ──
        # Look for analytical constituents table/section
        nutr_header = soup.find(string=re.compile(
            r'(analytical|nutritional|crude|ανάλυση|nährwerte)', re.I
        ))
        if nutr_header:
            parent = nutr_header.find_parent(['h2', 'h3', 'h4', 'dt', 'strong', 'b'])
            if parent:
                container = parent.find_next(['table', 'div', 'dl'])
                if container:
                    text = container.get_text()
                    self._parse_nutritional_values(text, row)

    def _parse_nutritional_values(self, text: str, row: ProductRow):
        """Parse nutritional values from text block."""
        patterns = {
            'crude_protein_pct':  r'(?:protein|πρωτεΐν)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'crude_fat_pct':      r'(?:fat|fats|λίπος|fett|fette)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'crude_fiber_pct':    r'(?:fiber|fibre|fibers|ίνες|ballast)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'crude_ash_pct':      r'(?:ash|τέφρα|asche|miner)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'moisture_pct':       r'(?:moisture|water|υγρασία|feuchtigkeit)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'calcium_pct':        r'(?:calcium|ασβέστιο|kalzium)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'phosphorus_pct':     r'(?:phosphorus|φώσφορος|phosphor)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'omega3_pct':         r'(?:omega.?3|ω-?3)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
            'omega6_pct':         r'(?:omega.?6|ω-?6)\\w*\\s*[:\\-]?\\s*(\\d+[.,]?\\d*)\\s*%',
        }

        for attr, pattern in patterns.items():
            if not getattr(row, attr):
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    setattr(row, attr, match.group(1).replace(',', '.'))

    def _post_process(self, row: ProductRow):
        """Post-processing: auto-tags, calculations, grain detection."""
        # Product type from URL
        if not row.product_type:
            url = row.product_url.lower()
            if '/dry_food/' in url or '/trockenfutter/' in url:
                row.product_type = "Dry Food"
            elif '/treats/' in url or '/snacks/' in url:
                row.product_type = "Treat"
            elif '/wet_food/' in url or '/nassfutter/' in url:
                row.product_type = "Wet Food"

        # Auto-tag meat category
        if not row.main_meat_category:
            row.main_meat_category = auto_tag_meat_category(
                row.product_name, row.full_ingredient_list
            )

        # Grain detection
        if not row.contains_grains:
            row.contains_grains, row.grain_free = detect_grains(row.full_ingredient_list)

        # Calculate price per kg
        if row.price and row.package_weight and not row.price_per_kg:
            try:
                price_val = float(row.price.replace(',', '.'))
                weight_match = re.search(r'(\\d+[.,]?\\d*)\\s*(kg|g)', row.package_weight, re.I)
                if weight_match:
                    weight = float(weight_match.group(1).replace(',', '.'))
                    if weight_match.group(2).lower() == 'g':
                        weight = weight / 1000
                    if weight > 0:
                        row.price_per_kg = f"{price_val / weight:.2f}"
            except (ValueError, ZeroDivisionError):
                pass

        # Flavor extraction from product name
        if not row.flavor_variant and row.product_name:
            # Pattern: "Brand Product - Flavor" or "Brand Product with Flavor"
            match = re.search(
                r'[-–—]\\s*(.+?)\\s*$',
                row.product_name
            )
            if match:
                candidate = match.group(1).strip()
                # Only use if it looks like a flavor (not a size or code)
                if not re.match(r'^\\d', candidate) and len(candidate) < 50:
                    row.flavor_variant = candidate

# ─── CHECKPOINT MANAGER ──────────────────────────────────────────────────────
class CheckpointManager:
    """Saves and restores scraper state for resume capability."""

    def __init__(self, filepath: str = CHECKPOINT_FILE):
        self.filepath = filepath

    def save(self, state: dict):
        """Save current state to disk."""
        with open(self.filepath, 'wb') as f:
            pickle.dump(state, f)
        logger.debug("Checkpoint saved: %d products, %d URLs processed",
                     len(state.get('products', [])),
                     len(state.get('processed_urls', set())))

    def load(self) -> Optional[dict]:
        """Load state from disk. Returns None if no checkpoint exists."""
        if not os.path.exists(self.filepath):
            return None
        try:
            with open(self.filepath, 'rb') as f:
                state = pickle.load(f)
            logger.info(
                "Checkpoint loaded: %d products, %d URLs already processed",
                len(state.get('products', [])),
                len(state.get('processed_urls', set()))
            )
            return state
        except Exception as e:
            logger.warning("Could not load checkpoint: %s", e)
            return None

    def clear(self):
        """Remove checkpoint file after successful completion."""
        if os.path.exists(self.filepath):
            os.remove(self.filepath)
            logger.info("Checkpoint cleared.")

# ─── CSV EXPORTER ────────────────────────────────────────────────────────────
class CSVExporter:
    """Exports product data to CSV following the COLUMNS schema.
    Uses UTF-8 BOM for Google Sheets compatibility.
    """

    def __init__(self, filename: str = OUTPUT_CSV):
        self.filename = filename

    def export(self, products: List[ProductRow]):
        """Export products to CSV."""
        headers = [col['header'] for col in COLUMNS]
        keys = [col['key'] for col in COLUMNS]

        with open(self.filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow(headers)

            for product in products:
                product_dict = product.to_dict()
                row = [str(product_dict.get(key, '')) for key in keys]
                writer.writerow(row)

        logger.info("📁 Exported %d products to %s", len(products), self.filename)

# ─── MAIN SCRAPER ORCHESTRATOR ───────────────────────────────────────────────
class ZooplusGRScraper:
    """Main orchestrator for the Zooplus.gr scraping pipeline.
    
    Features:
    - Resume capability via checkpointing
    - Polite rate limiting with jitter
    - Automatic retries with backoff
    - Data validation before export
    - Deduplication by flavor
    """

    def __init__(self, resume: bool = True):
        self.http = RobustSession()
        self.shipping_checker = ShippingChecker(self.http)
        self.crawler = CategoryCrawler(self.http)
        self.checkpoint = CheckpointManager()
        self.exporter = CSVExporter()
        self.resume = resume

        # State
        self.products: List[ProductRow] = []
        self.processed_urls: Set[str] = set()

    def run(self):
        """Execute the full scraping pipeline."""
        logger.info("=" * 60)
        logger.info("🐕 Zooplus.gr Dog Food Scraper — Starting")
        logger.info("=" * 60)

        # ── Resume from checkpoint ──
        if self.resume:
            state = self.checkpoint.load()
            if state:
                self.products = state.get('products', [])
                self.processed_urls = state.get('processed_urls', set())
                logger.info("Resuming from checkpoint: %d products so far", len(self.products))

        # ── Step 1: Check shipping ──
        logger.info("\\n📦 Step 1: Checking shipping to Greece...")
        ships_to_greece = self.shipping_checker.check()

        # ── Step 2: Collect all product URLs ──
        logger.info("\\n📂 Step 2: Crawling categories...")
        all_product_urls = []
        for category_name, category_path in CATEGORIES.items():
            logger.info("  Crawling: %s", category_name)
            urls = self.crawler.crawl_category(category_path)
            all_product_urls.extend(urls)

        # Deduplicate URLs
        all_product_urls = list(set(all_product_urls))
        logger.info("📋 Total unique product URLs: %d", len(all_product_urls))

        # Filter out already-processed URLs (resume support)
        remaining_urls = [u for u in all_product_urls if u not in self.processed_urls]
        logger.info("🔄 URLs remaining to process: %d", len(remaining_urls))

        # ── Step 3: Extract data ──
        logger.info("\\n🔍 Step 3: Extracting product data...")
        extractor = ProductExtractor(self.http, ships_to_greece)
        checkpoint_counter = 0

        for i, url in enumerate(remaining_urls, 1):
            logger.info("[%d/%d] %s", i, len(remaining_urls), url)

            product = extractor.extract(url)
            self.processed_urls.add(url)

            if product and product.is_valid():
                self.products.append(product)
                logger.info("  ✅ %s — %s", product.brand, product.product_name)
            else:
                logger.warning("  ❌ No valid data extracted")

            # Save checkpoint every 25 products
            checkpoint_counter += 1
            if checkpoint_counter >= 25:
                self._save_checkpoint()
                checkpoint_counter = 0

            self.http.polite_delay()

        # ── Step 4: Deduplicate ──
        logger.info("\\n🔄 Step 4: Deduplicating by flavor...")
        before = len(self.products)
        self.products = self._deduplicate_by_flavor(self.products)
        logger.info("  %d → %d unique flavors", before, len(self.products))

        # ── Step 5: Validate ──
        logger.info("\\n✅ Step 5: Validating data...")
        valid = [p for p in self.products if p.is_valid()]
        invalid_count = len(self.products) - len(valid)
        if invalid_count:
            logger.warning("  Removed %d invalid rows", invalid_count)
        self.products = valid

        # ── Step 6: Export ──
        logger.info("\\n📁 Step 6: Exporting to CSV...")
        self.exporter.export(self.products)

        # Clear checkpoint on success
        self.checkpoint.clear()

        # ── Summary ──
        logger.info("\\n" + "=" * 60)
        logger.info("✅ SCRAPING COMPLETE")
        logger.info("   Total unique flavors: %d", len(self.products))
        logger.info("   Output: %s", OUTPUT_CSV)
        logger.info("   Brands: %s", ', '.join(sorted(set(p.brand for p in self.products if p.brand))))
        logger.info("=" * 60)

    def _save_checkpoint(self):
        """Save current state for resume."""
        self.checkpoint.save({
            'products': self.products,
            'processed_urls': self.processed_urls,
            'timestamp': datetime.now().isoformat(),
        })

    def _deduplicate_by_flavor(self, products: List[ProductRow]) -> List[ProductRow]:
        """Keep one row per unique flavor. Prefer the row with more data filled."""
        best: Dict[str, ProductRow] = {}

        for p in products:
            key = p.dedup_key()
            if key not in best:
                best[key] = p
            else:
                # Keep the row with more non-empty fields
                existing_filled = sum(1 for v in asdict(best[key]).values() if v)
                new_filled = sum(1 for v in asdict(p).values() if v)
                if new_filled > existing_filled:
                    best[key] = p

        return list(best.values())

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Zooplus.gr Dog Food Scraper")
    parser.add_argument('--no-resume', action='store_true',
                        help='Start fresh, ignore checkpoint')
    parser.add_argument('--output', default=OUTPUT_CSV,
                        help=f'Output CSV filename (default: {OUTPUT_CSV})')
    args = parser.parse_args()

    scraper = ZooplusGRScraper(resume=not args.no_resume)
    if args.output != OUTPUT_CSV:
        scraper.exporter = CSVExporter(args.output)
    scraper.run()
`;

export const LIBRARIES_USED = [
  {
    name: "requests",
    purpose: "HTTP client with session/cookie support for crawling",
    install: "pip install requests",
  },
  {
    name: "beautifulsoup4",
    purpose: "HTML parsing — extract product data from page structure",
    install: "pip install beautifulsoup4",
  },
  {
    name: "csv (stdlib)",
    purpose: "Export scraped data to CSV (UTF-8 BOM for Sheets)",
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
    name: "pickle (stdlib)",
    purpose: "Checkpoint serialization for resume capability",
    install: "Built-in",
  },
  {
    name: "argparse (stdlib)",
    purpose: "CLI arguments: --no-resume, --output",
    install: "Built-in",
  },
];

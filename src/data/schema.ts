export interface ColumnDef {
  group: string;
  header: string;
  key: string;
}

export const COLUMNS: ColumnDef[] = [
  { group: "Identity", header: "Brand", key: "brand" },
  { group: "Identity", header: "Product Name", key: "product_name" },
  { group: "Identity", header: "Product Line/Range", key: "product_line" },
  { group: "Identity", header: "Product Type", key: "product_type" },
  { group: "Identity", header: "Flavor Variant", key: "flavor_variant" },
  { group: "Identity", header: "SKU/Product Code", key: "sku" },
  { group: "Identity", header: "Product URL", key: "product_url" },
  { group: "Identity", header: "Image URL", key: "image_url" },
  { group: "Identity", header: "Back Label Image URL", key: "back_label_image_url" },
  { group: "Target", header: "Life Stage", key: "life_stage" },
  { group: "Target", header: "Breed Size", key: "breed_size" },
  { group: "Target", header: "Special Condition", key: "special_condition" },
  { group: "Protein", header: "Main Meat Category", key: "main_meat_category" },
  { group: "Protein", header: "Named Protein Sources", key: "named_protein_sources" },
  { group: "Protein", header: "Fresh Meat Inclusion %", key: "fresh_meat_inclusion_pct" },
  { group: "Ingredients", header: "Full Ingredient List", key: "full_ingredient_list" },
  { group: "Ingredients", header: "Contains Grains", key: "contains_grains" },
  { group: "Ingredients", header: "Grain-Free", key: "grain_free" },
  { group: "Ingredients", header: "Additives/Preservatives", key: "additives_preservatives" },
  { group: "Ingredients", header: "Artificial Colors/Flavors", key: "artificial_colors_flavors" },
  { group: "Analytical", header: "Crude Protein %", key: "crude_protein_pct" },
  { group: "Analytical", header: "Crude Fat %", key: "crude_fat_pct" },
  { group: "Analytical", header: "Crude Fiber %", key: "crude_fiber_pct" },
  { group: "Analytical", header: "Crude Ash %", key: "crude_ash_pct" },
  { group: "Analytical", header: "Moisture/Water %", key: "moisture_pct" },
  { group: "Analytical", header: "Calcium %", key: "calcium_pct" },
  { group: "Analytical", header: "Phosphorus %", key: "phosphorus_pct" },
  { group: "Analytical", header: "Omega-3 %", key: "omega3_pct" },
  { group: "Analytical", header: "Omega-6 %", key: "omega6_pct" },
  { group: "Analytical", header: "Carbohydrates %", key: "carbohydrates_pct" },
  { group: "Additives", header: "Vitamin A", key: "vitamin_a" },
  { group: "Additives", header: "Vitamin D3", key: "vitamin_d3" },
  { group: "Additives", header: "Vitamin E", key: "vitamin_e" },
  { group: "Additives", header: "Other Vitamins & Minerals", key: "other_vitamins_minerals" },
  { group: "Energy", header: "Metabolizable Energy kcal/kg", key: "metabolizable_energy_kcal" },
  { group: "Commercial", header: "Price", key: "price" },
  { group: "Commercial", header: "Currency", key: "currency" },
  { group: "Commercial", header: "Package Weight(s)", key: "package_weight" },
  { group: "Commercial", header: "Price per kg", key: "price_per_kg" },
  { group: "Commercial", header: "Country of Origin", key: "country_of_origin" },
  { group: "Commercial", header: "Source Retailer", key: "source_retailer" },
  { group: "Commercial", header: "Date Scraped", key: "date_scraped" },
  { group: "Shipping", header: "Ships To Greece", key: "ships_to_greece" },
  { group: "Shipping", header: "Retailer Name", key: "retailer_name" },
  { group: "Shipping", header: "Retailer URL", key: "retailer_url" },
  { group: "Shipping", header: "Brand Site URL", key: "brand_site_url" },
  { group: "Monetization", header: "Affiliate URL", key: "affiliate_url" },
];

export const GROUPS = [...new Set(COLUMNS.map(c => c.group))];

export const MEAT_CATEGORIES = [
  "chicken", "duck", "rabbit", "lamb", "pork", "veal", "venison", "other meats", "vegetarian"
];

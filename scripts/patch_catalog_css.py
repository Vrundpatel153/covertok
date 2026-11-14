with open('catalog.css', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = '/* ==========================================================================\n   PRODUCT CARDS MASTER LAYOUT (Price Left, Swatches Right, 100% Add To Cart)'
end_str = '/* ==========================================================================\n   PRODUCT GALLERY BATCH PAGINATION & INFINITE LOADING'

p1 = text.find(start_str)
p2 = text.find(end_str)

if p1 == -1 or p2 == -1:
    print('Failed to find markers')
    exit(1)

replacement = """/* ==========================================================================
   PRODUCT CARDS MASTER LAYOUT (Price Left, Swatches Right, 100% Add To Cart)
   ========================================================================== */

.catalog-products-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 24px 20px !important;
  align-items: start !important;
  justify-items: stretch !important;
  width: 100% !important;
  margin-bottom: 24px !important;
}

.catalog-card {
  height: auto !important;
  min-height: 0 !important;
  max-width: 100% !important;
  align-self: start !important;
  display: flex !important;
  flex-direction: column !important;
  background: #FFFFFF !important;
  border: 1px solid #141416 !important;
  border-radius: 18px !important;
  overflow: hidden !important;
}

@media (max-width: 991px) {
  .catalog-products-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 14px 10px !important;
    align-items: start !important;
  }
}

/* 1. Strictly 1:1 Square Product Image Window */
.card-media-stage {
  aspect-ratio: 1 / 1 !important;
  width: 100% !important;
  min-height: auto !important;
  max-height: none !important;
  background: #FFFFFF !important;
  border-radius: 17px 17px 0 0 !important;
  overflow: hidden !important;
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  padding: 0 !important;
}

.card-img-wrap {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  background: #FFFFFF !important;
  box-sizing: border-box !important;
}

.card-main-img {
  width: 100% !important;
  height: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  display: block !important;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease !important;
}

.catalog-card:hover .card-main-img {
  transform: scale(1.06) !important;
}

/* 2. Card Body Structure - Strictly natural compact height */
.card-body-wrap {
  padding: 12px 14px 14px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  flex: 0 0 auto !important;
  height: auto !important;
  box-sizing: border-box !important;
  gap: 4px !important;
}

.card-product-title {
  font-family: var(--font-heading, 'Manrope', sans-serif) !important;
  font-size: 0.90rem !important;
  font-weight: 700 !important;
  line-height: 1.32 !important;
  color: #0A0A0C !important;
  text-decoration: none !important;
  min-height: 2.65em !important;
  max-height: 2.65em !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  margin: 0 0 6px 0 !important;
}

.card-product-title:hover {
  color: #FF5500 !important;
}

/* 3. Price on Left, Color Swatches on Right Row */
.card-price-swatch-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  width: 100% !important;
  margin: 4px 0 6px 0 !important;
  padding-top: 0 !important;
  overflow: visible !important;
  min-height: 22px !important;
}

.card-price-swatch-row .card-price-row,
.card-price-row {
  display: flex !important;
  align-items: baseline !important;
  gap: 6px !important;
  width: auto !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
  margin-top: 0 !important;
}

.card-price-now {
  font-family: var(--font-heading, 'Manrope', sans-serif) !important;
  font-size: 1.05rem !important;
  font-weight: 900 !important;
  color: #0A0A0C !important;
  letter-spacing: -0.02em !important;
}

.card-price-was {
  font-family: var(--font-body, 'Inter', sans-serif) !important;
  font-size: 0.78rem !important;
  font-weight: 500 !important;
  color: #52525B !important;
  text-decoration: line-through !important;
}

.card-price-swatch-row .product-color-palette,
.product-color-palette {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 6px !important;
  margin: 0 !important;
  flex-wrap: nowrap !important;
  flex-shrink: 0 !important;
  overflow: visible !important;
  padding: 3px 2px !important;
  min-height: 20px !important;
}

.product-color-palette .color-dot {
  width: 13px !important;
  height: 13px !important;
  min-width: 13px !important;
  min-height: 13px !important;
  border-radius: 50% !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  box-shadow: none !important;
  cursor: pointer !important;
  transition: transform 0.16s ease, box-shadow 0.16s ease !important;
  transform: none !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
  padding: 0 !important;
}

.product-color-palette .color-dot:hover {
  transform: none !important;
  border: 1.5px solid #FFFFFF !important;
  box-shadow: 0 0 0 1.5px #0A0A0C !important;
}

.product-color-palette .color-dot.active {
  transform: none !important;
  border: 1.5px solid #FFFFFF !important;
  box-shadow: 0 0 0 1.5px #0A0A0C !important;
}

.product-color-palette .color-more-pill {
  font-family: var(--font-heading, 'Manrope', sans-serif) !important;
  font-size: 0.65rem !important;
  font-weight: 800 !important;
  color: #64748B !important;
  background: #F1F5F9 !important;
  padding: 1px 6px !important;
  border-radius: 999px !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
}

.color-more-pill .more-pc {
  display: inline !important;
}

.color-more-pill .more-mob {
  display: none !important;
}

@media (max-width: 768px) {
  .color-more-pill .more-pc {
    display: none !important;
  }
  .color-more-pill .more-mob {
    display: inline !important;
  }
}

/* 4. Last Whole Line Dedicated to 100% Width ADD TO CART - Strictly 40px Height */
.card-add-btn {
  width: 100% !important;
  height: 40px !important;
  min-height: 40px !important;
  max-height: 40px !important;
  flex: 0 0 auto !important;
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  background: #0A0A0C !important;
  color: #FFFFFF !important;
  border: 1px solid #0A0A0C !important;
  border-radius: 999px !important;
  padding: 0 16px !important;
  font-family: var(--font-heading, 'Manrope', sans-serif) !important;
  font-size: 0.74rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  cursor: pointer !important;
  transition: all 0.22s ease !important;
  white-space: nowrap !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  margin-top: 8px !important;
  box-sizing: border-box !important;
}

.card-add-btn:hover {
  background: #FF5500 !important;
  border-color: #FF5500 !important;
  color: #FFFFFF !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 6px 18px rgba(255, 85, 0, 0.35) !important;
}

.card-add-btn:active {
  transform: scale(0.98) !important;
}

/* 5. Mobile Responsiveness (<= 640px) */
@media (max-width: 640px) {
  .catalog-products-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px 10px !important;
    align-items: start !important;
  }
  .catalog-card {
    border-radius: 16px !important;
    height: auto !important;
    align-self: start !important;
  }
  .card-media-stage {
    aspect-ratio: 1 / 1 !important;
    min-height: auto !important;
    max-height: none !important;
    border-radius: 15px 15px 0 0 !important;
    background: #FFFFFF !important;
  }
  .card-img-wrap {
    padding: 0 !important;
    background: #FFFFFF !important;
  }
  .card-body-wrap {
    padding: 8px 10px 10px !important;
    justify-content: flex-start !important;
    flex: 0 0 auto !important;
    height: auto !important;
    gap: 4px !important;
  }
  .card-product-title {
    font-size: 0.76rem !important;
    line-height: 1.25 !important;
    min-height: 2.5em !important;
    max-height: 2.5em !important;
    margin-bottom: 3px !important;
  }
  .card-price-swatch-row {
    margin: 3px 0 6px 0 !important;
    margin-top: 0 !important;
    gap: 4px !important;
    overflow: visible !important;
    min-height: 18px !important;
  }
  .card-price-swatch-row .card-price-row {
    display: flex !important;
    align-items: baseline !important;
    gap: 3px !important;
    width: auto !important;
    margin-top: 0 !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
  }
  .card-price-now {
    font-size: 0.86rem !important;
    font-weight: 800 !important;
  }
  .card-price-was {
    font-size: 0.66rem !important;
    margin-left: 2px !important;
  }
  .product-color-palette {
    gap: 4px !important;
    overflow: visible !important;
    padding: 2px 1px !important;
    min-height: 18px !important;
  }
  .product-color-palette .color-dot {
    width: 12px !important;
    height: 12px !important;
    min-width: 12px !important;
    min-height: 12px !important;
  }
  .product-color-palette .color-dot.active {
    transform: none !important;
    border: 1.5px solid #FFFFFF !important;
    box-shadow: 0 0 0 1.5px #0A0A0C !important;
  }
  .product-color-palette:has(.color-more-pill) .color-dot:nth-of-type(n+3) {
    display: none !important;
  }
  .product-color-palette .color-more-pill {
    font-size: 0.60rem !important;
    padding: 1px 4px !important;
  }
  .card-add-btn {
    height: 36px !important;
    min-height: 36px !important;
    max-height: 36px !important;
    flex: 0 0 auto !important;
    flex-grow: 0 !important;
    flex-shrink: 0 !important;
    font-size: 0.68rem !important;
    letter-spacing: 0.04em !important;
    padding: 0 8px !important;
    margin-top: 6px !important;
  }
}
\n\n"""

new_text = text[:p1] + replacement + text[p2:]
with open('catalog.css', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Successfully patched catalog.css')


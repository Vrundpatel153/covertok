# Covertok 75-Product Master Catalog Directory & Variant Audit

**Audit Date**: 2026-11-17
**Total Products in Catalog**: 75
**Cross-Color Leaks Identified and Purged**: 109 files permanently removed
**Cross-Color Leaks Remaining**: 0 (Zero cross-color contamination)
**Missing Files in Catalog**: 0 (All referenced images exist on disk)

---

## Executive Summary

1. **Standardized Directory Architecture**: Every single product resides in its dedicated handle folder `assets/products/<handle>/`. Every color variant resides in its dedicated subfolder `assets/products/<handle>/<color-slug>/`.
2. **Zero Cross-Color Contamination**: All cross-copied packshots (where color B's packshot was renamed to 02_lifestyle in color A's folder) have been completely purged from disk and dataset.
3. **Clean PDP Gallery Isolation**: In `assets/pdp_controller.js`, when a color variant is selected, the gallery renders strictly only that color's authentic images. Variants with a single authentic packshot render that packshot cleanly with no cross-color leaking.
4. **User Readiness**: The entire directory structure is now 100% prepared and structured so you can generate or drop additional real lifestyle photos directly into each color's subfolder at any time.

---

## Complete 75-Product Directory & Color Variant Table

| # | Product Title | Handle | Category | Color Variants & Image Counts | Status |
|---|---|---|---|---|---|
| 1 | Magnetic Phone Holder with 360° Rotation Strong Adhesive Mount | `premium-magnetic-phone-holder-with-360-rotation-strong-adhesive-mount` | Tech Essentials | Space Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 2 | Ribbed Knit Phone Sling Pouch | `ribbed-knit-phone-sling-pouch` | Tech Essentials | Blue (2 imgs), Orange (1 img), Pink (1 img), Black (1 img), Brown (1 img) | Authentic Packshots + Lifestyles |
| 3 | Transparent Magnetic Wireless Charging Phone Case | `transparent-magnetic-wireless-charging-phone-case` | Phone Cases | Cosmic orange (3 imgs), Dark Blue (3 imgs) | Authentic Packshots + Lifestyles |
| 4 | Soft Silicone Cover With-Lip Balm | `phone-cover-with-built-in-lip-balm-holder-copy-copy-6` | Phone Cases | Raspberry (3 imgs), Salty Tan (1 img), Unscented (2 imgs), Shortcake (1 img), Peach Pit (1 img) | Authentic Packshots + Lifestyles |
| 5 | Crystal Studded Luxe Case – Orange | `crystal-studded-luxe-case-orange` | Phone Cases | Cosmic Orange (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 6 | Ultra Clear Sideless Anti-Yellow Back Case | `ultra-clear-sideless-anti-yellow-back-case` | Phone Cases | Crystal Clear (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 7 | Premium Leather-Finish Slim Case with Metal Camera Ring | `premium-leather-finish-slim-case-with-metal-camera-ring` | Phone Cases | Black (2 imgs), Brown (1 img), Grey (2 imgs), White (1 img) | Authentic Packshots + Lifestyles |
| 8 | Aluminium Frame Transparent Case | `aluminium-frame-transparent-case` | Phone Cases | Cosmic Orange (3 imgs), Deep Blue (2 imgs), Silver (2 imgs) | Authentic Packshots + Lifestyles |
| 9 | Premium Stainless Steel Milanese Loop Strap for Smartwatch | `premium-stainless-steel-milanese-loop-strap-for-smartwatch` | Watch Bands | Silver (1 img), Black (2 imgs), Rose gold (2 imgs), Blue (1 img), Titanium (1 img), Natural (2 imgs), Stone (2 imgs), Black/Red Stripe (1 img), Gold (2 imgs) | Authentic Packshots + Lifestyles |
| 10 | Pearl Phone Charm with Airplane & Bow Design | `pearl-phone-charm-with-airplane-bow-design` | Tech Essentials | Pearlescent White (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 11 | Wavy Edge Transparent Shockproof Pastel Cover | `wavy-edge-transparent-shockproof-pastel-cover` | Phone Cases | Pink (2 imgs), White (1 img), lavender (1 img), Black (1 img), Light blue (1 img) | Authentic Packshots + Lifestyles |
| 12 | Multi-Color Silicone Suction Grips Phone Holder With Kickstand | `multi-color-silicone-suction-grips-phone-holder-with-kickstand` | Tech Essentials | Black (1 img), Beige (1 img), Pink (1 img), Mint Green (1 img), Blue (1 img), Peach (1 img), Brown (2 imgs), Lavender (1 img) | Authentic Packshots + Lifestyles |
| 13 | Magnetic Wireless Power Bank – Ultra Sleek 5000mAh/ 10000 mAh | `magnetic-wireless-power-bank-ultra-sleek-5000mah-10000-mah` | Tech Essentials | Black (1 img), Rose Gold (2 imgs), Grey (2 imgs) | Authentic Packshots + Lifestyles |
| 14 | Premium Silicone Watch Bands – Available in 18 Colors | `premium-silicone-watch-bands-available-in-18-colors-copy-1` | Watch Bands | Orange (1 img), Light blue (1 img), Stone Blue (2 imgs), Purple lilac (2 imgs), fruit purple (1 img), Midnight blue (1 img), Pine Needle Green (1 img), Alfalfa (1 img), Wine red (1 img), starlight (1 img), Black (1 img), Red (1 img), Natural Titanium (2 imgs) | Authentic Packshots + Lifestyles |
| 15 | Luxury Steel Blue Heart Sparkle Phone Case with Pearl Chain | `luxury-steel-blue-heart-sparkle-phone-case-with-pearl-chain` | Phone Cases | Steel Blue (2 imgs) | Authentic Packshots + Lifestyles |
| 16 | Premium Bowknot Phone Case with Detachable Pearl Bracelet | `premium-bowknot-phone-case-with-detachable-pearl-bracelet` | Phone Cases | Black (1 img), Pink (1 img), Off White (1 img), Natural Titanium (2 imgs) | Authentic Packshots + Lifestyles |
| 17 | Premium Tempered Glass Screen Protector with Easy Installation Kit | `premium-tempered-glass-screen-protector-with-easy-installation-kit` | Tech Essentials | Ultra Clear (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 18 | Premium Frosted Privacy Tempered Glass Screen Protector With Easy Installation Kit | `premium-matte-frosted-privacy-tempered-glass-screen-protector` | Tech Essentials | Matte Privacy (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 19 | Black Transparent Rugged Apple Watch Case with Bold Orange Strap | `transparent-rugged-apple-watch-case-with-orange-sports-strap-copy` | Watch Bands | Bold Orange (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 20 | Transparent Rugged Apple Watch Case with Orange Sports Strap | `transparent-rugged-protective-apple-watch-case-with-strap-copy` | Watch Bands | Bright Orange (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 21 | Transparent Rugged Protective Apple Watch Case with Strap | `rugged-armor-protective-watch-case-with-sport-band-copy` | Watch Bands | Clear Titanium (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 22 | Rugged Armor Protective Watch Case with Sport Band | `premium-silicone-watch-bands-available-in-18-colors-copy` | Watch Bands | Tactical Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 23 | Pastel Heart Print Soft Silicone Phone Case | `pastel-heart-print-soft-silicone-phone-case` | Phone Cases | Ivory hearts (1 img), Blush pink (1 img), Mint breeze (2 imgs) | Authentic Packshots + Lifestyles |
| 24 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch-copy-copy-3` | Watch Bands | Yellow (2 imgs) | Authentic Packshots + Lifestyles |
| 25 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch-copy-copy-2` | Watch Bands | Grey+Black (2 imgs) | Authentic Packshots + Lifestyles |
| 26 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch-copy-copy-1` | Watch Bands | Orange+Grey (2 imgs) | Authentic Packshots + Lifestyles |
| 27 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch-copy-copy` | Watch Bands | Light Blue (2 imgs) | Authentic Packshots + Lifestyles |
| 28 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch-copy` | Watch Bands | Black (2 imgs) | Authentic Packshots + Lifestyles |
| 29 | Premium Magnetic Leather Loop Straps for Apple Watch | `premium-magnetic-leather-loop-straps-for-apple-watch` | Watch Bands | Yellow (1 img), Grey+Black (2 imgs), Black (1 img), Starlight+Grey (2 imgs), Orange+Grey (1 img), Light Blue (1 img) | Authentic Packshots + Lifestyles |
| 30 | Cute Plush Bear leather Phone Case | `luxury-quilted-crossbody-wallet-phone-case-copy-1` | Phone Cases | Black (1 img), White (2 imgs), Brown (2 imgs) | Authentic Packshots + Lifestyles |
| 31 | Magnetic Loop Smartwatch Bands – Dual Color Edition(Starlight+Pink) | `magnetic-loop-smartwatch-bands-dual-color-edition-copy-2` | Watch Bands | Starlight+Pink (1 img), Cloud Grey+Blue (1 img), Blue+Midnight Black (1 img), Black+Grey (1 img), Orange+Midnight Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 32 | Magnetic Loop Smartwatch Bands – Dual Color Edition(Black+Grey) | `magnetic-loop-smartwatch-bands-dual-color-edition-copy-1` | Watch Bands | Black+Grey (1 img), Cloud Grey+Blue (1 img), Blue+Midnight Black (1 img), Starlight+Pink (1 img), Orange+Midnight Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 33 | Magnetic Loop Smartwatch Bands – Dual Color Edition(Orange+Midnight Black) | `magnetic-loop-smartwatch-bands-dual-color-edition-copy-copy` | Watch Bands | Orange+Midnight Black (1 img), Cloud Grey+Blue (1 img), Blue+Midnight Black (1 img), Black+Grey (1 img), Starlight+Pink (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 34 | Magnetic Loop Smartwatch Bands – Dual Color Edition(Cloud grey+Blue) | `magnetic-loop-smartwatch-bands-dual-color-edition-copy` | Watch Bands | Cloud Grey+Blue (1 img), Blue+Midnight Black (1 img), Black+Grey (1 img), Starlight+Pink (1 img), Orange+Midnight Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 35 | Magnetic Loop Smartwatch Bands – Dual Color Edition | `magnetic-loop-smartwatch-bands-dual-color-edition` | Watch Bands | Orange+Midnight Black (2 imgs), Blue+Midnight Black (2 imgs), Cloud Grey+Blue (1 img), Black+Grey (1 img), Starlight+Pink (2 imgs) | Authentic Packshots + Lifestyles |
| 36 | Glow In The Dark Sand AirPods Cases – Playful & Luminous | `glow-sand-airpods-cases-playful-luminous` | AirPods Covers | Neon Orange (2 imgs), Hot Pink (1 img), Lime Green (2 imgs), Aqua Blue (2 imgs), Classic White (2 imgs), Neon Pink (3 imgs) | Authentic Packshots + Lifestyles |
| 37 | Crystal Butterfly Beaded Phone Charm | `crystal-butterfly-beaded-phone-charm` | Cover Charms | Ocean Butterfly (2 imgs), Blush Butterfly (1 img) | Authentic Packshots + Lifestyles |
| 38 | Pastel Beaded Phone Charm | `pastel-beaded-phone-charm` | Cover Charms | Pastel Rainbow (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 39 | Crystal Phone Charm | `crystal-beaded-phone-charm` | Cover Charms | Crystal Glass (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 40 | Pink Beaded Heart Phone Charm | `pink-beaded-heart-phone-charm` | Cover Charms | Blush Pink (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 41 | Ice Cream Sprinkle iPhone Charger Case Set | `ice-cream-sprinkle-iphone-charger-case-set` | Charger Cases | Strawberry Pink (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 42 | Bow Pearl iPhone Charger Case Set | `bow-pearl-iphone-charger-case-set` | Charger Cases | Pearl White (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 43 | Heart iPhone Charger Case Set with Matching Cable | `heart-iphone-charger-case-set-with-matching-cable` | Charger Cases | Yellow (1 img), Violet (1 img), Black (1 img), Green (1 img), Blue (1 img), Pink (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 44 | Glitter Bow iPhone Charger Case | `glitter-bow-iphone-charger-case` | Charger Cases | Rose Gold (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 45 | Metallic Coil iPhone Charger Case | `metallic-coil-iphone-charger-case` | Charger Cases | Bloom Edition (2 imgs) | Authentic Packshots + Lifestyles |
| 46 | Blue Gingham iPhone Charger Case | `blue-gingham-iphone-charger-case` | Charger Cases | Sky Blue (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 47 | Labubu AirPods Case – | `silicone-airpods-cases-with-rope-strap-copy` | AirPods Covers | Red (1 img), Brown (2 imgs) | Authentic Packshots + Lifestyles |
| 48 | Silicone AirPods Cases with Rope Strap – | `title-butterfly-charm-airpods-case--copy` | AirPods Covers | Mocha Brown (1 img), Caramel Tan (2 imgs), Blush Pink (1 img), Sunshine Yellow (2 imgs), Aqua Teal (1 img), Candy Pink (1 img) | Authentic Packshots + Lifestyles |
| 49 | Butterfly Charm AirPods Case | `pearl-charm-bow-airpods-cases--copy` | AirPods Covers | Pink (2 imgs), Blue (2 imgs) | Authentic Packshots + Lifestyles |
| 50 | Pearl Charm Bow AirPods Cases | `pearl-charm-bow-airpods-cases` | AirPods Covers | Sweet Pink (2 imgs), Classic White (1 img) | Authentic Packshots + Lifestyles |
| 51 | Holographic Bow Glitter Case With Charm | `silicone-world-map-travel-phone-case-copy` | Phone Cases | Holographic (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 52 | Silicone World Map Travel Phone Case | `ultra-thin-frosted-phone-cases-copy` | Phone Cases | Wine Red (1 img), Ivory White (1 img), Earth Brown (2 imgs), Midnight Black (2 imgs) | Authentic Packshots + Lifestyles |
| 53 | Ultra-Thin Frosted Phone Cases | `trendy-graphic-phone-cases-copy` | Phone Cases | Frost Black (2 imgs), Rose Frost (1 img), Ice White (1 img), Pastel Purple (1 img), Ice Blue (1 img), Cosmic orange (2 imgs), Deep Blue (1 img) | Authentic Packshots + Lifestyles |
| 54 | Trendy Graphic Phone Cases | `vibrant-frame-style-iphone-cases-copy` | Phone Cases | Caffeine Mood (1 img), Chill Mood (2 imgs) | Authentic Packshots + Lifestyles |
| 55 | Vibrant Frame-Style iPhone Cases | `cute-bear-phone-case-with-plush-keychain-copy-1` | Phone Cases | Sunshine Yellow (2 imgs), Bubblegum Pink (1 img), Cool Teal (1 img), Creamy White (1 img), Jet Black (1 img), Coral Crush (1 img) | Authentic Packshots + Lifestyles |
| 56 | Cute Bear Phone Case with Plush Keychain | `luxury-quilted-crossbody-wallet-phone-case-copy` | Phone Cases | Warm Caramel (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 57 | Luxury Crossbody Wallet Phone Case | `silver-3d-love-heart-phone-case-copy` | Phone Cases | Espresso Brown (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 58 | Silver 3D Love Heart Phone Case | `silver-3d-love-heart-phone-case` | Phone Cases | Pink (2 imgs), Off White (1 img), Black (2 imgs) | Authentic Packshots + Lifestyles |
| 59 | Luxury Crossbody Wallet Phone Case | `luxury-crossbody-wallet-phone-case` | Phone Cases | Black (2 imgs), Beige (1 img), Espresso Brown (1 img) | Authentic Packshots + Lifestyles |
| 60 | Leopard Print Chic Transparent Phone Case | `leopard-print-chic-transparent-phone-case` | Phone Cases | Amber Leopard (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 61 | Luxury Bow Pearl Chain Phone Case | `luxury-bow-pearl-chain-phone-case` | Phone Cases | Black (2 imgs), Beige (2 imgs) | Authentic Packshots + Lifestyles |
| 62 | Silicone Suction Phone Grip Pad | `silicone-suction-phone-grip-pad` | Tech Essentials | Orange (2 imgs), Violet (2 imgs), Black (2 imgs) | Authentic Packshots + Lifestyles |
| 63 | MagSafe Clear Case- Transparent Shockproof Cover | `magsafe-clear-case-for-iphone-13-to-16-series-supports-all-plus-pro-amp-pro-max-models-transparent-shockproof-cover` | Phone Cases | Clear Armor (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 64 | MagSafe Leather Wallet Card Holder With Kickstand | `magsafe-wallet-with-kickstand` | Tech Essentials | Black (1 img), Dark Blue (1 img), Violet (2 imgs) | Authentic Packshots + Lifestyles |
| 65 | MagSafe Leather Card Holder – Snap-On Wallet | `magsafe-leather-card-holder-snap-on-wallet` | Tech Essentials | Orange (2 imgs), Dark Blue (2 imgs), Black (1 img) | Authentic Packshots + Lifestyles |
| 66 | MagSafe Wireless Charger (Usb-C) | `magsafe-wireless-charger-usb-c` | Tech Essentials | Pure White (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 67 | Glow In Dark Transparent – Shockproof Clear Cover | `glow-edge-glow-in-dark-transparent-shockproof-clear-cover-with-bumper-camera-protection-for-iphone` | Phone Cases | Neon blue (1 img), Neon Green (1 img), Neon Pink (1 img), Neon Orange (1 img), Neon Lime (2 imgs) | Authentic Packshots + Lifestyles |
| 68 | Premium MagSafe Case Cover with Metal Camera Ring | `premium-magsafe-case-cover-with-metal-camera-ring-shockproof-stylish-with-magnetic-charging-support` | Phone Cases | Black (2 imgs), Natural Titanium (2 imgs), Blue (1 img), Desert titanium (1 img) | Authentic Packshots + Lifestyles |
| 69 | Anti-Yellow MagSafe Transparent iPhone Case(Lifetime Clarity Assurance) | `magsafe-compatible-transparent-iphone-case-ultra-clear-shockproof-back-cover-with-magnetic-ring` | Phone Cases | Black (2 imgs), White (1 img), Neon Pink (1 img), Neon Orange (1 img), Brown (1 img) | Authentic Packshots + Lifestyles |
| 70 | 39W+ 7.1A Fast Car Charger | `39w-7-1a-fast-car-charger-dual-usb-smart-charging-adapter-for-cigarette-lighter-compact-design-high-speed-charging-universal-compatibility` | Tech Essentials | Space Grey (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 71 | 100W Fast Charging Mini Alloy Car Charger | `100w-fast-charging-mini-alloy-car-charger-hidden-dual-port-car-adapter-with-pull-ring-design-for-cigarette-lighter-compact-portable-easy-to-carry-charge` | Tech Essentials | Titanium Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 72 | Foldable Magnetic Phone Holder –Vacuum Adsorption Stand | `foldable-magnetic-phone-holder-strong-magnet-suction-mount-for-desk-wall-car-dashboard-windshield-360-adjustable-rotation-vacuum-adsorption-stand` | Tech Essentials | Metallic Silver (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 73 | 3-in-1 Wireless Charger MagSafe Compatible – Fast Charging Station | `3-in-1-wireless-charger-magsafe-compatible-fast-charging-station-for-iphone-16-16-plus-16-pro-16-pro-max-15-15-plus-15-pro-15-pro-max-14-13-12-series-airpods-3rd-2nd-gen-apple-watch-series-9-8-7-6-5-4-se-black` | Tech Essentials | Matte Black (1 img) | Pure Packshot Clean (Ready for Lifestyles) |
| 74 | Premium Luxury Leather iPhone Case with Card Slot | `untitled-27jul_18-46` | Phone Cases | Sky blue (2 imgs), Brown (2 imgs), White (2 imgs), Rusty orange (2 imgs), Pink (1 img) | Authentic Packshots + Lifestyles |
| 75 | Ultra-Thin Frameless Case for iPhone | `bumper-case` | Phone Cases | Black (1 img), Dark Blue (2 imgs), Natural Titanium (1 img), Desert titanium (1 img), Dark red (1 img), Sierra blue (1 img), Cosmic orange (2 imgs) | Authentic Packshots + Lifestyles |

---

## Category Breakdown

- **Phone Cases**: 28 products
- **Watch Bands**: 17 products
- **Tech Essentials**: 15 products
- **Charger Cases**: 6 products
- **AirPods Covers**: 5 products
- **Cover Charms**: 4 products

---

## Directory Guidelines for Adding New Images

When you generate or take new photos, simply place them in the corresponding folder following this naming convention:
- Primary packshot: `assets/products/<handle>/<color-slug>/01_packshot.webp` (or `.png` / `.jpg`)
- Additional lifestyle / angle: `assets/products/<handle>/<color-slug>/02_lifestyle.webp`, `03_lifestyle.webp`
- General multi-color or product-wide shots: `assets/products/<handle>/extra/01_extra.webp`

# 0018. The real business details, and add-ons as groups that items point to

Status: Accepted. Supersedes the parking of the salads and sides in [0017](0017-the-owners-product-shots.md).

## Context

The owner asked for the shop's real details and for each product's details and add-ons, taken from Wolt and Glovo. Those two listings are
the shop's own: Wolt has the venue record and an option list per product, Glovo adds an ingredient line per product. The shop's Instagram
bio and Google's listing give the hours. The listings agree on the address and the phone number. They disagree in four places, which the
owner settled:

- **Prices.** The platforms charge about 20 to 35% more than the printed menu (drinks up to double). The owner chose the in-store prices,
  so the add-ons use the printed menu's: extras 150, salads 80 (tuna 100), sweet fillings 100.
- **Hours.** Wolt says 08:00 to 24:00, the Instagram bio and Google say 24 hours. The owner confirmed 24 hours.
- **The tuna sandwich.** Wolt lets it be toasted or not, Glovo gives it every add-on. The owner: it has both.
- **Sauces.** Both platforms list ketchup, mayonnaise, mustard and chili with no price. The owner says only some sauces are free, without
  saying which.

No email, WhatsApp or TikTok exists for the shop, only Instagram and Facebook.

## Decision

1. **The business details are real** in `site.json`: phone, address, time zone `Europe/Belgrade`, hours as open around the clock (the
   existing `open == close` encoding, so no hours code changed), Instagram and Facebook. The email is optional now (schema, entity, footer,
   structured data), the WhatsApp and TikTok placeholders are gone, and Facebook takes WhatsApp's place in the Follow card. The dock already
   left WhatsApp out when there was none. The page copy stays placeholder, by the owner's choice.
2. **Add-ons are groups the items point to.** `menu/addons.json` holds the groups (`id`, `title`, an optional `note` such as "60 g each",
   and `options`), and an item lists the group ids it takes, in the order they show. The adapter resolves the ids: an unknown id fails the
   build, as an unknown category does. `MenuItem.addons` becomes the card model's `addons`, and the quick view lists each group as a title
   over a row of chips. They inform; the site takes no orders.
3. **An option has a price only where the shop states one.** `price` is optional and `0` is rejected by the schema: the sauces and
   "toasted or not" show no price, and nothing is called free. A chip with a price reads "+150 RSD".
4. **Who gets what** (the platforms' rules, and the owner's for the tuna sandwich): the pizza slice and the three whole pizzas take
   sauces, extras and salads; the calzone, extras; the small hot dog, sauces; the five sandwiches, sauces, extras, salads and toasted or
   not; the two sweet sandwiches, sweet fillings and toasted or not. Pies, soups and drinks take none.
5. **Descriptions are the shop's Glovo ingredient lines, in English.** An item the platforms do not describe (the small hot dog, the
   drinks) has none, and no allergen is inferred from an ingredient.
6. **Add-ons show in the quick view only**, not on the card.
7. **`parked.json` is gone.** Its salads and sides are the add-on groups now. The printed menu's salads by the kilo (1,600 and 2,000 RSD)
   are not on the site. Next Limunana is renamed Next Lemon & Mint after the bottle's label (its id stays). Kashkaval is called Cheese and
   kulen is called Pepperoni, in the descriptions, the extras and the Kulen Sandwich, now the Pepperoni Sandwich ([0014](0014-the-real-menu-and-its-pages.md)
   kept both by their local names; the id `kulen-sandwich` stays, as it names the picture).

## Consequences

- Measured on the build: the HTML is 26.49 kB gzipped (24.69 before; the limit is 30). Each card carries its groups in the island's props
  and gzip folds the repeats. If the budget runs short, send each group once and let a card name it.
- A sandwich's quick view has 15 chips. The panel already scrolls.
- The groups come from two listings that change, so `addons.json` is a snapshot. Editing one file updates every item that names the group.
- Not checked: the shop's Facebook page (it blocks bots) and the map pin (the directions link is a search for the name and address).

## Alternatives considered

- **The platforms' prices**: the owner prefers the in-store ones.
- **Add-ons written inside each item**: a price change would be edited in thirteen places.
- **Add-ons as menu items**: they have no pictures, and the menu is the products that have one (0017).
- **"Free" on the sauces**: the owner says some are not, and the data does not say which.
- **A hint on the card**: the owner chose the quick view only.

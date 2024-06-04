export default function getOfferId(shop: any, offerId: string) {
  for (const section in shop.catalogItems) {
    for (const offer of shop.catalogItems[section]) {
      if (offer.offerId === offerId.replace("item://", "")) return offer;
    }
  }
}

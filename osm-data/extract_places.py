import osmium
import json
import random

PBF_FILE = "india-260823.osm.pbf"

MIN_LAT = 11.0
MAX_LAT = 12.5
MIN_LON = 76.2
MAX_LON = 77.2

TOURIST_CATEGORIES = {
    "attraction": "Attraction",
    "museum": "Museum",
    "viewpoint": "Viewpoint",
    "artwork": "Artwork",
    "gallery": "Gallery",
    "zoo": "Zoo",
    "theme_park": "Theme Park",
}

STAY_CATEGORIES = {
    "hotel": "Hotel",
    "guest_house": "Guest House",
    "hostel": "Hostel",
    "resort": "Resort",
    "motel": "Motel",
}

class PlaceHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.tourist_places = []
        self.stays = []

    def node(self, n):
        if not n.location.valid():
            return

        lat = n.location.lat
        lon = n.location.lon

        if lat < MIN_LAT or lat > MAX_LAT or lon < MIN_LON or lon > MAX_LON:
            return

        name = n.tags.get('name')
        if not name:
            return

        tourism_tag = n.tags.get('tourism')
        historic_tag = n.tags.get('historic')
        is_verified = bool(n.tags.get('wikipedia')) or bool(n.tags.get('wikidata'))
        tag_richness = sum([
            1 if n.tags.get('opening_hours') else 0,
            1 if n.tags.get('website') else 0,
            1 if n.tags.get('phone') else 0,
            1 if n.tags.get('description') else 0,
        ])

        if tourism_tag in TOURIST_CATEGORIES:
            self.tourist_places.append({
                "placeId": f"osm-{n.id}",
                "name": name,
                "category": TOURIST_CATEGORIES[tourism_tag],
                "longitude": lon,
                "latitude": lat,
                "verified": is_verified,
                "tagRichness": tag_richness,
            })
        elif historic_tag:
            self.tourist_places.append({
                "placeId": f"osm-{n.id}",
                "name": name,
                "category": "Historic Site",
                "longitude": lon,
                "latitude": lat,
                "verified": is_verified,
                "tagRichness": tag_richness,
            })
        elif tourism_tag in STAY_CATEGORIES:
            self.stays.append({
                "stayId": f"osm-{n.id}",
                "name": name,
                "type": STAY_CATEGORIES[tourism_tag],
                "longitude": lon,
                "latitude": lat,
                "pricePerNight": random.randint(1200, 6000),
            })

handler = PlaceHandler()
handler.apply_file(PBF_FILE)

with open("tourist_places.json", "w", encoding="utf-8") as f:
    json.dump(handler.tourist_places, f, indent=2, ensure_ascii=False)

with open("stays.json", "w", encoding="utf-8") as f:
    json.dump(handler.stays, f, indent=2, ensure_ascii=False)

print("Tourist places found:", len(handler.tourist_places))
print("Stays found:", len(handler.stays))
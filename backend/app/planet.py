import os
import requests
from dotenv import load_dotenv

load_dotenv()

PLANET_API_KEY = os.getenv("PLANET_API_KEY")


def search_satellite_data(latitude, longitude):

    url = "https://api.planet.com/data/v1/searches"

    geometry = {
        "type": "Point",
        "coordinates": [longitude, latitude]
    }

    search_request = {
        "item_types": ["PSScene"],
        "filter": {
            "type": "AndFilter",
            "config": [
                {
                    "type": "GeometryFilter",
                    "field_name": "geometry",
                    "config": geometry
                }
            ]
        }
    }

    response = requests.post(
        url,
        auth=(PLANET_API_KEY, ""),
        json=search_request
    )

    return response
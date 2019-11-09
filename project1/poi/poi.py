import time
import json 
import requests

from math import sin, cos, sqrt, atan2, radians
from h3 import h3 

def distance_coordinates(location1, location2):
	R	= 6373
	dlat	= loc1[0] - loc2[0]
	dlon	= loc1[1] - loc2[1]
	a = sin(dlat / 2)**2 + cos(loc1[0]) * cos(loc2[0]) * sin(dlon / 2)**2
	c = 2 * atan2(sqrt(a), sqrt(1 - a))
	return R * c

def get_poi(center, radius, type_loc, key):
	url = get_url(center, radius, type_loc, key)
	r	= requests.get(url=url).json()
	tokenpage = r["next_page_token"]
	results = r["results"]
	while True:
		time.sleep(2) 	#If it does not waits for 2 seconds, it will get INVALID_REQUEST.
						#For more information:
						#	https://github.com/slimkrazy/python-google-places/issues/112

		p_url = url + "&pagetoken=" + tokenpage
		r = requests.get(url = p_url).json()
		results += r["results"]
		if "next_page_token" not in r.keys():
			break
		tokenpage = r["next_page_token"]
	return results


def get_url(location, radius, type_loc, key, next_page_token = None):
	url = "https://maps.googleapis.com/maps/api/place/textsearch/json?location="+str(location[0])\
			+","+str(location[1])+"&radius="+str(radius)+"&type="+type_loc+"&key="+key+\
			("&pagetoken="+next_page_token if next_page_token is not None else "")
	return url

def parse_locations(api_result, type_loc):
	locations = dict()
	csv_locations = list()
	for e in api_result:
		coords = (e["geometry"]["location"]["lat"],e["geometry"]["location"]["lng"])
		areaId = h3.geo_to_h3(coords[0], coords[1], 8)
		name = e["name"]
		addr = e["formatted_address"]
		locations[str(coords)] = {
			"name": name,
			"addr": addr,
			"areaId": areaId,
			"type": type_loc
		}
		csv_locations.append(str(coords[0])+","+str(coords[1])+","+"\""+areaId+"\""+","+"\""+name+"\""+","+"\""+addr+"\""+","+"\""+type_loc+"\"")
	return csv_locations

def write_list_to_file(lst, path):
	tmpfile = open(path, "w")
	for e in lst:
		tmpfile.write(e+"\n")
	tmpfile.close()


def get_all_poi(location, key, radius):
	poi_types = ["airport", "amusement_park", "art_gallery", "casino", "cemetery",
			 "church", "city_hall", "hindu_temple", "university", "stadium", 
			  "rv_park", "park", "museum"]
	#poi_types = ["university"]
	result = list()
	for t in poi_types:
		tmpresult = get_poi(location, radius,t, key)
		tmpresult = parse_locations(tmpresult, t)
		result += tmpresult
	print(result)
	return result
		

if __name__ == "__main__":
	location = (39.913818, 116.363625)
	key = "AIzaSyDDuuTiQwp9tXWUTWE1tRs3oYCr90Lz6YE"
	radius = 30
	result = get_all_poi(location, key, radius) 
	write_list_to_file(result, "output.csv")
	

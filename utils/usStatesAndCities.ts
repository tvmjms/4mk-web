// utils/usStatesAndCities.ts

export interface StateData {
  name: string;
  cities: string[];
}

export const usStatesAndCities: Record<string, StateData> = {
  "AL": {
    name: "Alabama",
    cities: ["Birmingham", "Huntsville", "Mobile", "Montgomery", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison"]
  },
  "AK": {
    name: "Alaska", 
    cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Wasilla", "Kenai", "Kodiak", "Bethel", "Palmer"]
  },
  "AZ": {
    name: "Arizona",
    cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise"]
  },
  "AR": {
    name: "Arkansas",
    cities: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville"]
  },
  "CA": {
    name: "California",
    cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista"]
  },
  "CO": {
    name: "Colorado",
    cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial"]
  },
  "CT": {
    name: "Connecticut",
    cities: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk", "Danbury", "New Britain", "West Hartford", "Greenwich"]
  },
  "DE": {
    name: "Delaware",
    cities: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle"]
  },
  "DC": {
    name: "District of Columbia",
    cities: [
      "Washington", "Adams Morgan", "Anacostia", "Brookland", "Capitol Hill", "Chevy Chase", "Columbia Heights", "Dupont Circle",
      "Foggy Bottom", "Georgetown", "Logan Circle", "Navy Yard", "NoMa", "Penn Quarter", "Shaw", "Southwest Waterfront", "U Street"
    ]
  },
  "FL": {
    name: "Florida",
    cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral", "Pembroke Pines", "Hollywood", "Gainesville", "Miramar", "Coral Springs"]
  },
  "GA": {
    name: "Georgia",
    cities: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Albany", "Johns Creek"]
  },
  "HI": {
    name: "Hawaii",
    cities: ["Honolulu", "East Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu", "Kaneohe", "Kailua-Kona", "Kahului", "Mililani Town"]
  },
  "ID": {
    name: "Idaho",
    cities: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene", "Twin Falls", "Lewiston", "Post Falls"]
  },
  "IL": {
    name: "Illinois",
    cities: ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Cicero"]
  },
  "IN": {
    name: "Indiana",
    cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Muncie"]
  },
  "IA": {
    name: "Iowa",
    cities: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Council Bluffs", "Ames", "Dubuque", "West Des Moines"]
  },
  "KS": {
    name: "Kansas",
    cities: ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina"]
  },
  "KY": {
    name: "Kentucky",
    cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown", "Florence", "Hopkinsville", "Nicholasville"]
  },
  "LA": {
    name: "Louisiana",
    cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma"]
  },
  "ME": {
    name: "Maine",
    cities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Saco", "Westbrook", "Augusta"]
  },
  "MD": {
    name: "Maryland",
    cities: [
      "Aberdeen", "Annapolis", "Arnold", "Baltimore", "Bel Air", "Bethesda", "Bowie", "Brooklyn Park", "Cambridge", "Catonsville",
      "Chesapeake Beach", "Chevy Chase", "Clinton", "College Park", "Columbia", "Crofton", "Cumberland", "Damascus", "Dundalk", "Easton",
      "Edgewood", "Eldersburg", "Elkridge", "Elkton", "Ellicott City", "Essex", "Fort Washington", "Frederick", "Gaithersburg", "Germantown",
      "Glen Burnie", "Greenbelt", "Hagerstown", "Havre de Grace", "Hyattsville", "Kensington", "Landover", "Laurel", "Lexington Park", "Middle River",
      "Millersville", "Montgomery Village", "North Bethesda", "Odenton", "Olney", "Owings Mills", "Oxon Hill", "Parkville", "Pasadena", "Perry Hall",
      "Pikesville", "Potomac", "Randallstown", "Reisterstown", "Rockville", "Rosedale", "Salisbury", "Severn", "Severna Park", "Silver Spring",
      "South Gate", "Towson", "Waldorf", "Westminster", "Wheaton", "White Oak"
    ]
  },
  "MA": {
    name: "Massachusetts",
    cities: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"]
  },
  "MI": {
    name: "Michigan",
    cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Westland"]
  },
  "MN": {
    name: "Minnesota",
    cities: ["Minneapolis", "St. Paul", "Rochester", "Bloomington", "Duluth", "Brooklyn Park", "Plymouth", "St. Cloud", "Eagan", "Woodbury"]
  },
  "MS": {
    name: "Mississippi",
    cities: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Greenville", "Olive Branch", "Horn Lake"]
  },
  "MO": {
    name: "Missouri",
    cities: ["Kansas City", "St. Louis", "Springfield", "Independence", "Columbia", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters"]
  },
  "MT": {
    name: "Montana",
    cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City"]
  },
  "NE": {
    name: "Nebraska",
    cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "North Platte", "Norfolk", "Columbus"]
  },
  "NV": {
    name: "Nevada",
    cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City"]
  },
  "NH": {
    name: "New Hampshire",
    cities: ["Manchester", "Nashua", "Concord", "Derry", "Rochester", "Salem", "Dover", "Merrimack", "Londonderry", "Hudson"]
  },
  "NJ": {
    name: "New Jersey",
    cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton"]
  },
  "NM": {
    name: "New Mexico",
    cities: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Alamogordo", "Carlsbad"]
  },
  "NY": {
    name: "New York",
    cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"]
  },
  "NC": {
    name: "North Carolina",
    cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"]
  },
  "ND": {
    name: "North Dakota",
    cities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton"]
  },
  "OH": {
    name: "Ohio",
    cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"]
  },
  "OK": {
    name: "Oklahoma",
    cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton", "Edmond", "Moore", "Midwest City", "Enid", "Stillwater"]
  },
  "OR": {
    name: "Oregon",
    cities: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Bend", "Beaverton", "Medford", "Springfield", "Corvallis"]
  },
  "PA": {
    name: "Pennsylvania",
    cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Levittown", "Harrisburg"]
  },
  "RI": {
    name: "Rhode Island",
    cities: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Newport", "Central Falls", "Westerly", "North Providence"]
  },
  "SC": {
    name: "South Carolina",
    cities: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Sumter", "Goose Creek", "Hilton Head Island"]
  },
  "SD": {
    name: "South Dakota",
    cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion"]
  },
  "TN": {
    name: "Tennessee",
    cities: ["Memphis", "Nashville", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Johnson City", "Jackson", "Bartlett"]
  },
  "TX": {
    name: "Texas",
    cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "Grand Prairie"]
  },
  "UT": {
    name: "Utah",
    cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "Taylorsville"]
  },
  "VT": {
    name: "Vermont",
    cities: ["Burlington", "Essex", "South Burlington", "Colchester", "Rutland", "Bennington", "Brattleboro", "Milton", "Hartford", "Barre"]
  },
  "VA": {
    name: "Virginia",
    cities: [
      "Abingdon", "Accomac", "Alberta", "Alexandria", "Altavista", "Amherst", "Annandale", "Appalachia", "Appomattox", "Arlington", 
      "Ashland", "Basye", "Bedford", "Berryville", "Big Stone Gap", "Blacksburg", "Blackstone", "Bland", "Bluefield", "Boones Mill",
      "Bowling Green", "Boyce", "Boykins", "Bracey", "Bridgewater", "Bristol", "Broadway", "Brookneal", "Buchanan", "Burkeville",
      "Cape Charles", "Capron", "Carson", "Castlewood", "Cedar Bluff", "Centreville", "Chantilly", "Charles City", "Charlotte Court House", "Charlottesville",
      "Chase City", "Chatham", "Chesapeake", "Chester", "Chilhowie", "Chincoteague", "Christiansburg", "Claremont", "Clarksville", "Clifton",
      "Clifton Forge", "Clinchco", "Clinchport", "Coeburn", "Colonial Beach", "Colonial Heights", "Covington", "Craigsville", "Crewe", "Culpeper",
      "Cumberland", "Dale City", "Damascus", "Danville", "Dayton", "Dublin", "Dumfries", "Dungannon", "Earlysville", "Eastville",
      "Edinburg", "Elkton", "Emporia", "Esmont", "Ewing", "Exmore", "Fairfax", "Falls Church", "Farmville", "Fincastle",
      "Floyd", "Forest", "Fork Union", "Franklin", "Fredericksburg", "Front Royal", "Galax", "Gate City", "Glade Spring", "Glen Allen",
      "Gloucester", "Gordonsville", "Grantsville", "Gretna", "Grottoes", "Grundy", "Halifax", "Hamilton", "Hampton", "Hanover",
      "Harrisonburg", "Haymarket", "Haysi", "Heathsville", "Herndon", "Hillsville", "Hinton", "Holland", "Honaker", "Hot Springs",
      "Hopewell", "Hurt", "Independence", "Irvington", "Jarratt", "Jonesville", "Keene", "Kenbridge", "Keysville", "Kilmarnock",
      "King George", "La Crosse", "Lakeside", "Lancaster", "Lawrenceville", "Lebanon", "Leesburg", "Lexington", "Louisa", "Lovettsville",
      "Luray", "Lynchburg", "Madison", "Madison Heights", "Manassas", "Marion", "Martinsville", "Massanutten", "Mathews", "McLean",
      "Mechanicsville", "Midlothian", "Mineral", "Montpelier", "Montross", "Mount Jackson", "Mount Vernon", "Narrows", "New Market", "Newport News",
      "Nickelsville", "Norfolk", "Norton", "Nottoway", "Occoquan", "Onancock", "Orange", "Paintbank", "Pamplin", "Parksley",
      "Patrick Springs", "Pearisburg", "Pembroke", "Pennington Gap", "Petersburg", "Phenix", "Pocahontas", "Poquoson", "Portsmouth", "Powhatan",
      "Prince George", "Pulaski", "Purcellville", "Quantico", "Radford", "Rappahannock", "Red Hill", "Remington", "Reston", "Rich Creek",
      "Richmond", "Ridgeway", "Roanoke", "Rocky Mount", "Round Hill", "Rural Retreat", "Rustburg", "Salem", "Saluda", "Sandston",
      "Saxis", "Scottsville", "Shenandoah", "Smithfield", "South Boston", "South Hill", "Spotsylvania", "Springfield", "St. Paul", "Stafford",
      "Stanley", "Staunton", "Stephens City", "Sterling", "Strasburg", "Stuart", "Suffolk", "Surry", "Sussex", "Tappahannock",
      "Tazewell", "The Plains", "Timberville", "Tinsley", "Toms Brook", "Troutville", "Tysons", "Unionville", "Urbanna", "Vienna",
      "Virginia Beach", "Wakefield", "Warrenton", "Warsaw", "Washington", "Waterford", "Waverly", "Waynesboro", "West Point", "White Stone",
      "Williamsburg", "Winchester", "Windsor", "Wise", "Woodbridge", "Woodstock", "Wytheville", "Yorktown"
    ]
  },
  "WA": {
    name: "Washington",
    cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Federal Way", "Spokane Valley"]
  },
  "WV": {
    name: "West Virginia",
    cities: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Martinsburg", "Fairmont", "Beckley", "Clarksburg", "Lewisburg"]
  },
  "WI": {
    name: "Wisconsin",
    cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire", "Oshkosh", "Janesville"]
  },
  "WY": {
    name: "Wyoming",
    cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson"]
  }
};

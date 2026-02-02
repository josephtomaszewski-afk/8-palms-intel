require('dotenv').config();
const sequelize = require('../config/database');
const HomeListing = require('../models/HomeListing');
const { scoreListing, calculateMarketStats } = require('../services/homeDataService');

const listings = [
  // === TAMPA METRO - 3BR ===
  { address: '4812 W Euclid Ave', city: 'Tampa', zipCode: '33629', latitude: 27.9285, longitude: -82.5115, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1680, lotSize: 6200, yearBuilt: 1955, price: 385000, originalPrice: 399000, daysOnMarket: 45, priceReductions: 1, metro: 'Tampa', neighborhood: 'South Tampa', photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' },
  { address: '7203 N Habana Ave', city: 'Tampa', zipCode: '33614', latitude: 28.0051, longitude: -82.4915, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1450, lotSize: 5800, yearBuilt: 1972, price: 295000, originalPrice: 295000, daysOnMarket: 12, priceReductions: 0, metro: 'Tampa', neighborhood: 'Town N Country', photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400' },
  { address: '1504 E Powhatan Ave', city: 'Tampa', zipCode: '33610', latitude: 27.9805, longitude: -82.4219, propertyType: 'single_family', beds: 3, baths: 1, sqft: 1120, lotSize: 5000, yearBuilt: 1948, price: 215000, originalPrice: 239000, daysOnMarket: 78, priceReductions: 2, metro: 'Tampa', neighborhood: 'East Tampa', photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400' },
  { address: '3318 W San Juan St', city: 'Tampa', zipCode: '33629', latitude: 27.9190, longitude: -82.5050, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1890, lotSize: 7200, yearBuilt: 2001, price: 485000, originalPrice: 510000, daysOnMarket: 62, priceReductions: 1, metro: 'Tampa', neighborhood: 'Palma Ceia', photoUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400' },
  { address: '9012 Jasmine Blvd', city: 'Riverview', zipCode: '33578', latitude: 27.8561, longitude: -82.3265, propertyType: 'single_family', beds: 3, baths: 2.5, sqft: 1920, lotSize: 6800, yearBuilt: 2016, price: 345000, originalPrice: 345000, daysOnMarket: 8, priceReductions: 0, metro: 'Tampa', neighborhood: 'Riverview', photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' },
  { address: '2215 W Bay Ave', city: 'Tampa', zipCode: '33607', latitude: 27.9510, longitude: -82.4820, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1550, lotSize: 5500, yearBuilt: 1963, price: 325000, originalPrice: 349000, daysOnMarket: 55, priceReductions: 1, metro: 'Tampa', neighborhood: 'West Tampa', photoUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400' },
  { address: '14205 Arbor Hills Rd', city: 'Tampa', zipCode: '33624', latitude: 28.0715, longitude: -82.5230, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1650, lotSize: 5900, yearBuilt: 1992, price: 310000, originalPrice: 310000, daysOnMarket: 21, priceReductions: 0, metro: 'Tampa', neighborhood: 'Carrollwood', photoUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400' },
  // === TAMPA METRO - 4BR ===
  { address: '6320 S MacDill Ave', city: 'Tampa', zipCode: '33611', latitude: 27.8990, longitude: -82.4930, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2450, lotSize: 8500, yearBuilt: 1978, price: 525000, originalPrice: 549000, daysOnMarket: 38, priceReductions: 1, metro: 'Tampa', neighborhood: 'Ballast Point', photoUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400' },
  { address: '10521 Plantation Bay Dr', city: 'Tampa', zipCode: '33647', latitude: 28.1025, longitude: -82.3590, propertyType: 'single_family', beds: 4, baths: 2.5, sqft: 2680, lotSize: 7500, yearBuilt: 2005, price: 465000, originalPrice: 465000, daysOnMarket: 15, priceReductions: 0, metro: 'Tampa', neighborhood: 'New Tampa', photoUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400' },
  { address: '5604 Interbay Blvd', city: 'Tampa', zipCode: '33611', latitude: 27.9120, longitude: -82.4870, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2180, lotSize: 6800, yearBuilt: 2019, price: 615000, originalPrice: 649000, daysOnMarket: 72, priceReductions: 2, metro: 'Tampa', neighborhood: 'Interbay', photoUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400' },
  { address: '3402 W Swann Ave', city: 'Tampa', zipCode: '33609', latitude: 27.9340, longitude: -82.5010, propertyType: 'single_family', beds: 4, baths: 3.5, sqft: 3200, lotSize: 9500, yearBuilt: 2021, price: 875000, originalPrice: 925000, daysOnMarket: 95, priceReductions: 2, metro: 'Tampa', neighborhood: 'Beach Park', photoUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' },
  // === TAMPA METRO - MULTI ===
  { address: '2810 N 15th St', city: 'Tampa', zipCode: '33605', latitude: 27.9680, longitude: -82.4370, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 2400, lotSize: 6000, yearBuilt: 1960, price: 320000, originalPrice: 350000, daysOnMarket: 88, priceReductions: 2, metro: 'Tampa', neighborhood: 'Ybor City', photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400' },
  { address: '4107 N Armenia Ave', city: 'Tampa', zipCode: '33607', latitude: 27.9720, longitude: -82.4890, propertyType: 'multi_family', beds: 6, baths: 4, sqft: 3200, lotSize: 7500, yearBuilt: 1965, price: 425000, originalPrice: 425000, daysOnMarket: 32, priceReductions: 0, metro: 'Tampa', neighborhood: 'Seminole Heights', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
  // === ORLANDO METRO - 3BR ===
  { address: '1428 Michigan Ave', city: 'Orlando', zipCode: '32806', latitude: 28.5180, longitude: -81.3730, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1520, lotSize: 5600, yearBuilt: 1951, price: 340000, originalPrice: 359000, daysOnMarket: 42, priceReductions: 1, metro: 'Orlando', neighborhood: 'Delaney Park', photoUrl: 'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=400' },
  { address: '5705 Metrowest Blvd', city: 'Orlando', zipCode: '32811', latitude: 28.5080, longitude: -81.4350, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1780, lotSize: 6000, yearBuilt: 1998, price: 355000, originalPrice: 355000, daysOnMarket: 18, priceReductions: 0, metro: 'Orlando', neighborhood: 'MetroWest', photoUrl: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400' },
  { address: '3012 Conway Gardens Rd', city: 'Orlando', zipCode: '32812', latitude: 28.4910, longitude: -81.3490, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1380, lotSize: 7200, yearBuilt: 1962, price: 285000, originalPrice: 315000, daysOnMarket: 65, priceReductions: 2, metro: 'Orlando', neighborhood: 'Conway', photoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400' },
  { address: '824 Lake Dot Cir', city: 'Orlando', zipCode: '32801', latitude: 28.5405, longitude: -81.3810, propertyType: 'single_family', beds: 3, baths: 2.5, sqft: 2100, lotSize: 5800, yearBuilt: 2015, price: 475000, originalPrice: 499000, daysOnMarket: 50, priceReductions: 1, metro: 'Orlando', neighborhood: 'Downtown Orlando', photoUrl: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=400' },
  { address: '2307 Curry Ford Rd', city: 'Orlando', zipCode: '32806', latitude: 28.5130, longitude: -81.3510, propertyType: 'single_family', beds: 3, baths: 1.5, sqft: 1250, lotSize: 5200, yearBuilt: 1956, price: 255000, originalPrice: 275000, daysOnMarket: 58, priceReductions: 1, metro: 'Orlando', neighborhood: 'Curry Ford', photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400' },
  { address: '1610 Ferris Ave', city: 'Orlando', zipCode: '32803', latitude: 28.5550, longitude: -81.3620, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1640, lotSize: 6100, yearBuilt: 1985, price: 365000, originalPrice: 365000, daysOnMarket: 9, priceReductions: 0, metro: 'Orlando', neighborhood: 'Audubon Park', photoUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400' },
  { address: '4408 S Semoran Blvd', city: 'Orlando', zipCode: '32822', latitude: 28.4850, longitude: -81.3090, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1350, lotSize: 5500, yearBuilt: 1978, price: 265000, originalPrice: 265000, daysOnMarket: 25, priceReductions: 0, metro: 'Orlando', neighborhood: 'Azalea Park', photoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400' },
  // === ORLANDO METRO - 4BR ===
  { address: '6901 Pomelo Dr', city: 'Winter Garden', zipCode: '34787', latitude: 28.5490, longitude: -81.5850, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2550, lotSize: 7800, yearBuilt: 2012, price: 495000, originalPrice: 495000, daysOnMarket: 14, priceReductions: 0, metro: 'Orlando', neighborhood: 'Winter Garden', photoUrl: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400' },
  { address: '3205 Corrine Dr', city: 'Orlando', zipCode: '32803', latitude: 28.5610, longitude: -81.3490, propertyType: 'single_family', beds: 4, baths: 2.5, sqft: 2350, lotSize: 8200, yearBuilt: 1967, price: 520000, originalPrice: 559000, daysOnMarket: 70, priceReductions: 2, metro: 'Orlando', neighborhood: 'Baldwin Park', photoUrl: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400' },
  { address: '9123 Bay Meadows Dr', city: 'Kissimmee', zipCode: '34747', latitude: 28.3380, longitude: -81.5870, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2800, lotSize: 6500, yearBuilt: 2018, price: 415000, originalPrice: 429000, daysOnMarket: 35, priceReductions: 1, metro: 'Orlando', neighborhood: 'Kissimmee', photoUrl: 'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=400' },
  { address: '1032 Lake Highland Dr', city: 'Orlando', zipCode: '32803', latitude: 28.5510, longitude: -81.3780, propertyType: 'single_family', beds: 4, baths: 3.5, sqft: 3100, lotSize: 9000, yearBuilt: 2020, price: 725000, originalPrice: 749000, daysOnMarket: 40, priceReductions: 1, metro: 'Orlando', neighborhood: 'Lake Highland', photoUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400' },
  { address: '7504 Westpointe Blvd', city: 'Kissimmee', zipCode: '34747', latitude: 28.3120, longitude: -81.5490, propertyType: 'single_family', beds: 4, baths: 2, sqft: 2050, lotSize: 5800, yearBuilt: 2008, price: 345000, originalPrice: 365000, daysOnMarket: 52, priceReductions: 1, metro: 'Orlando', neighborhood: 'West Kissimmee', photoUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
  // === ORLANDO METRO - MULTI ===
  { address: '435 S Parramore Ave', city: 'Orlando', zipCode: '32801', latitude: 28.5370, longitude: -81.3900, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 2200, lotSize: 5500, yearBuilt: 1958, price: 345000, originalPrice: 375000, daysOnMarket: 82, priceReductions: 2, metro: 'Orlando', neighborhood: 'Parramore', photoUrl: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=400' },
  { address: '2901 E Colonial Dr', city: 'Orlando', zipCode: '32803', latitude: 28.5510, longitude: -81.3400, propertyType: 'multi_family', beds: 6, baths: 4, sqft: 3500, lotSize: 8000, yearBuilt: 1970, price: 485000, originalPrice: 510000, daysOnMarket: 45, priceReductions: 1, metro: 'Orlando', neighborhood: 'Colonial Town', photoUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400' },
  { address: '710 W Central Blvd', city: 'Orlando', zipCode: '32805', latitude: 28.5390, longitude: -81.3950, propertyType: 'multi_family', beds: 8, baths: 4, sqft: 4200, lotSize: 9500, yearBuilt: 1955, price: 550000, originalPrice: 599000, daysOnMarket: 110, priceReductions: 3, metro: 'Orlando', neighborhood: 'West Orlando', photoUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=400' },
  // === JACKSONVILLE METRO - 3BR ===
  { address: '1205 Murray Dr', city: 'Jacksonville', zipCode: '32205', latitude: 30.3095, longitude: -81.7120, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1480, lotSize: 6500, yearBuilt: 1945, price: 265000, originalPrice: 289000, daysOnMarket: 55, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Murray Hill', photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400' },
  { address: '3821 Oak St', city: 'Jacksonville', zipCode: '32205', latitude: 30.3040, longitude: -81.7010, propertyType: 'single_family', beds: 3, baths: 1.5, sqft: 1320, lotSize: 5800, yearBuilt: 1940, price: 235000, originalPrice: 250000, daysOnMarket: 48, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Avondale', photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' },
  { address: '5502 Lenox Ave', city: 'Jacksonville', zipCode: '32205', latitude: 30.2970, longitude: -81.7190, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1680, lotSize: 7200, yearBuilt: 1952, price: 295000, originalPrice: 295000, daysOnMarket: 22, priceReductions: 0, metro: 'Jacksonville', neighborhood: 'Ortega', photoUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400' },
  { address: '8215 Heckscher Dr', city: 'Jacksonville', zipCode: '32226', latitude: 30.4250, longitude: -81.4850, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1550, lotSize: 8000, yearBuilt: 1988, price: 275000, originalPrice: 299000, daysOnMarket: 67, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Fort George Island', photoUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=400' },
  { address: '1103 Peninsular Pl', city: 'Jacksonville', zipCode: '32204', latitude: 30.3190, longitude: -81.6750, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1800, lotSize: 6200, yearBuilt: 1925, price: 375000, originalPrice: 399000, daysOnMarket: 58, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Riverside', photoUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400' },
  { address: '4612 Spring Park Rd', city: 'Jacksonville', zipCode: '32207', latitude: 30.2850, longitude: -81.6520, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1420, lotSize: 5500, yearBuilt: 1960, price: 245000, originalPrice: 245000, daysOnMarket: 14, priceReductions: 0, metro: 'Jacksonville', neighborhood: 'Spring Park', photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' },
  { address: '7901 Merrill Rd', city: 'Jacksonville', zipCode: '32277', latitude: 30.3610, longitude: -81.5820, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1350, lotSize: 6800, yearBuilt: 1975, price: 225000, originalPrice: 239000, daysOnMarket: 40, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Arlington', photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400' },
  // === JACKSONVILLE METRO - 4BR ===
  { address: '2405 River Bluff Ln', city: 'Jacksonville', zipCode: '32226', latitude: 30.4050, longitude: -81.5480, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2600, lotSize: 9000, yearBuilt: 2015, price: 445000, originalPrice: 469000, daysOnMarket: 35, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'River City', photoUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400' },
  { address: '905 Stockton St', city: 'Jacksonville', zipCode: '32204', latitude: 30.3150, longitude: -81.6790, propertyType: 'single_family', beds: 4, baths: 2.5, sqft: 2850, lotSize: 8500, yearBuilt: 1928, price: 525000, originalPrice: 565000, daysOnMarket: 80, priceReductions: 2, metro: 'Jacksonville', neighborhood: 'Riverside', photoUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400' },
  { address: '11540 Summer Haven Blvd', city: 'Jacksonville', zipCode: '32258', latitude: 30.1720, longitude: -81.5690, propertyType: 'single_family', beds: 4, baths: 3, sqft: 2350, lotSize: 7200, yearBuilt: 2010, price: 395000, originalPrice: 395000, daysOnMarket: 11, priceReductions: 0, metro: 'Jacksonville', neighborhood: 'Southside', photoUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400' },
  { address: '3801 St Johns Ave', city: 'Jacksonville', zipCode: '32205', latitude: 30.3020, longitude: -81.7080, propertyType: 'single_family', beds: 4, baths: 3, sqft: 3100, lotSize: 10000, yearBuilt: 1935, price: 595000, originalPrice: 625000, daysOnMarket: 62, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Avondale', photoUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' },
  { address: '9320 Garden Lake Ct', city: 'Jacksonville', zipCode: '32258', latitude: 30.1650, longitude: -81.5580, propertyType: 'single_family', beds: 4, baths: 2, sqft: 2100, lotSize: 6500, yearBuilt: 2003, price: 355000, originalPrice: 369000, daysOnMarket: 28, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Mandarin', photoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400' },
  // === JACKSONVILLE METRO - MULTI ===
  { address: '1715 N Main St', city: 'Jacksonville', zipCode: '32206', latitude: 30.3350, longitude: -81.6530, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 2100, lotSize: 5800, yearBuilt: 1952, price: 275000, originalPrice: 310000, daysOnMarket: 95, priceReductions: 2, metro: 'Jacksonville', neighborhood: 'Springfield', photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400' },
  { address: '2630 Rosselle St', city: 'Jacksonville', zipCode: '32204', latitude: 30.3110, longitude: -81.6850, propertyType: 'multi_family', beds: 6, baths: 4, sqft: 3400, lotSize: 7200, yearBuilt: 1945, price: 395000, originalPrice: 420000, daysOnMarket: 72, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Riverside', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400' },
  { address: '4520 Moncrief Rd', city: 'Jacksonville', zipCode: '32209', latitude: 30.3580, longitude: -81.7050, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 1800, lotSize: 5200, yearBuilt: 1958, price: 195000, originalPrice: 225000, daysOnMarket: 120, priceReductions: 3, metro: 'Jacksonville', neighborhood: 'Moncrief', photoUrl: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=400' },
  // === MORE TAMPA ===
  { address: '1809 E Sligh Ave', city: 'Tampa', zipCode: '33610', latitude: 28.0020, longitude: -82.4280, propertyType: 'single_family', beds: 3, baths: 1, sqft: 1100, lotSize: 4800, yearBuilt: 1950, price: 195000, originalPrice: 215000, daysOnMarket: 85, priceReductions: 2, metro: 'Tampa', neighborhood: 'Sulphur Springs', photoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400' },
  { address: '11204 Clayridge Dr', city: 'Riverview', zipCode: '33569', latitude: 27.8410, longitude: -82.3120, propertyType: 'single_family', beds: 4, baths: 2.5, sqft: 2250, lotSize: 7000, yearBuilt: 2014, price: 389000, originalPrice: 389000, daysOnMarket: 10, priceReductions: 0, metro: 'Tampa', neighborhood: 'Riverview', photoUrl: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400' },
  { address: '6015 N 9th St', city: 'Tampa', zipCode: '33604', latitude: 27.9880, longitude: -82.4420, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 2000, lotSize: 5400, yearBuilt: 1955, price: 285000, originalPrice: 299000, daysOnMarket: 65, priceReductions: 1, metro: 'Tampa', neighborhood: 'Seminole Heights', photoUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400' },
  // === MORE ORLANDO ===
  { address: '830 N Thornton Ave', city: 'Orlando', zipCode: '32803', latitude: 28.5560, longitude: -81.3650, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1580, lotSize: 6800, yearBuilt: 1948, price: 395000, originalPrice: 420000, daysOnMarket: 60, priceReductions: 1, metro: 'Orlando', neighborhood: 'Thornton Park', photoUrl: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400' },
  { address: '5320 Cinderlane Pkwy', city: 'Orlando', zipCode: '32808', latitude: 28.5750, longitude: -81.4220, propertyType: 'single_family', beds: 4, baths: 2, sqft: 1850, lotSize: 6200, yearBuilt: 1975, price: 295000, originalPrice: 310000, daysOnMarket: 45, priceReductions: 1, metro: 'Orlando', neighborhood: 'Pine Hills', photoUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
  { address: '2750 S Orange Blossom Trl', city: 'Orlando', zipCode: '32839', latitude: 28.5020, longitude: -81.3990, propertyType: 'multi_family', beds: 6, baths: 3, sqft: 2800, lotSize: 7000, yearBuilt: 1968, price: 375000, originalPrice: 399000, daysOnMarket: 75, priceReductions: 1, metro: 'Orlando', neighborhood: 'South Orange', photoUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=400' },
  // === MORE JACKSONVILLE ===
  { address: '1420 King St', city: 'Jacksonville', zipCode: '32204', latitude: 30.3210, longitude: -81.6810, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1750, lotSize: 6500, yearBuilt: 1920, price: 345000, originalPrice: 369000, daysOnMarket: 50, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'Riverside', photoUrl: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=400' },
  { address: '6804 Crane Ave', city: 'Jacksonville', zipCode: '32216', latitude: 30.2920, longitude: -81.5720, propertyType: 'single_family', beds: 4, baths: 2, sqft: 1900, lotSize: 7500, yearBuilt: 1985, price: 285000, originalPrice: 285000, daysOnMarket: 18, priceReductions: 0, metro: 'Jacksonville', neighborhood: 'Lakewood', photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400' },
  { address: '1608 Ionia St', city: 'Jacksonville', zipCode: '32206', latitude: 30.3380, longitude: -81.6490, propertyType: 'multi_family', beds: 4, baths: 2, sqft: 2200, lotSize: 5600, yearBuilt: 1948, price: 215000, originalPrice: 245000, daysOnMarket: 105, priceReductions: 2, metro: 'Jacksonville', neighborhood: 'Springfield', photoUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400' },
  // === EXTRA LISTINGS ===
  { address: '3105 W Gandy Blvd', city: 'Tampa', zipCode: '33611', latitude: 27.8920, longitude: -82.5100, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1600, lotSize: 6000, yearBuilt: 1970, price: 359000, originalPrice: 379000, daysOnMarket: 42, priceReductions: 1, metro: 'Tampa', neighborhood: 'Gandy', photoUrl: 'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=400' },
  { address: '8712 Sheldon Rd', city: 'Tampa', zipCode: '33615', latitude: 28.0180, longitude: -82.5720, propertyType: 'single_family', beds: 4, baths: 2, sqft: 1950, lotSize: 6800, yearBuilt: 1988, price: 335000, originalPrice: 349000, daysOnMarket: 38, priceReductions: 1, metro: 'Tampa', neighborhood: 'Town N Country', photoUrl: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=400' },
  { address: '2109 E Livingston St', city: 'Orlando', zipCode: '32803', latitude: 28.5440, longitude: -81.3560, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1420, lotSize: 5900, yearBuilt: 1955, price: 315000, originalPrice: 335000, daysOnMarket: 52, priceReductions: 1, metro: 'Orlando', neighborhood: 'Colonial Town', photoUrl: 'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=400' },
  { address: '4210 Beach Blvd', city: 'Jacksonville', zipCode: '32207', latitude: 30.2880, longitude: -81.6250, propertyType: 'single_family', beds: 3, baths: 2, sqft: 1550, lotSize: 7000, yearBuilt: 1962, price: 255000, originalPrice: 269000, daysOnMarket: 35, priceReductions: 1, metro: 'Jacksonville', neighborhood: 'San Marco', photoUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    await sequelize.sync({ alter: true });
    console.log('Tables synced.');

    // Clear existing data
    await HomeListing.destroy({ where: {} });
    console.log('Cleared existing listings.');

    // Insert all listings with sourceId
    const toInsert = listings.map((l, i) => ({
      ...l,
      state: 'FL',
      source: 'seed',
      sourceId: `seed-${i + 1}`,
      listingStatus: 'for_sale',
      isActive: true,
      pricePerSqft: l.sqft > 0 ? (l.price / l.sqft) : null,
      priceReductionAmount: l.originalPrice > l.price ? (l.originalPrice - l.price) : null,
      lastUpdated: new Date()
    }));

    // Add rent estimates and yield
    const rentEstimates = {
      Tampa: { 3: 2100, 4: 2500, multi: 3200 },
      Orlando: { 3: 2200, 4: 2600, multi: 3400 },
      Jacksonville: { 3: 1900, 4: 2300, multi: 2900 }
    };

    for (const l of toInsert) {
      const rentKey = l.propertyType === 'multi_family' ? 'multi' : l.beds;
      l.estimatedRent = rentEstimates[l.metro]?.[rentKey] || 2200;
      l.rentalYield = l.price > 0 ? ((l.estimatedRent * 12) / l.price) * 100 : null;
    }

    await HomeListing.bulkCreate(toInsert);
    console.log(`Inserted ${toInsert.length} listings.`);

    // Score all listings
    const allListings = await HomeListing.findAll({ raw: true });
    const marketStats = calculateMarketStats(allListings);
    console.log('Market stats:', JSON.stringify(marketStats, null, 2));

    let scored = 0;
    for (const listing of allListings) {
      const { dealScore, scoreBreakdown } = scoreListing(listing, marketStats);
      await HomeListing.update(
        { dealScore, scoreBreakdown },
        { where: { id: listing.id } }
      );
      scored++;
    }
    console.log(`Scored ${scored} listings.`);

    console.log('\nSeed complete! Summary:');
    const tampaCt = toInsert.filter(l => l.metro === 'Tampa').length;
    const orlCt = toInsert.filter(l => l.metro === 'Orlando').length;
    const jaxCt = toInsert.filter(l => l.metro === 'Jacksonville').length;
    console.log(`  Tampa: ${tampaCt} listings`);
    console.log(`  Orlando: ${orlCt} listings`);
    console.log(`  Jacksonville: ${jaxCt} listings`);
    console.log(`  Total: ${toInsert.length} listings`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

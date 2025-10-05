"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeSoccerDrills = scrapeSoccerDrills;
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const saveDataAsJson_1 = require("./scraper-save/saveDataAsJson");
const transformSoccerDrills_1 = require("./transformSoccerDrills");
const jsonPath = path_1.default.resolve(__dirname, "./scraped-json/soccerDrills.json");
async function scrapeSoccerDrills() {
    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading soccer drills from JSON...");
        const raw = fs.readFileSync(jsonPath, "utf-8");
        let drills = JSON.parse(raw);
        return drills;
    }
    const baseUrl = 'https://www.soccerxpert.com/drills/all-soccer-drills';
    const totalPages = 21;
    const allDrills = [];
    for (let page = 1; page <= totalPages; page++) {
        console.log(`Scraping page ${page} of ${totalPages}...`);
        const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            // Find all drill cards
            $('.col.sx-card').each((_, element) => {
                const $card = $(element);
                const $cardBody = $card.find('.card-body');
                // Extract title and URL
                const titleLink = $card.find('a.btn-outline-success');
                const title = $cardBody.find('.sx-card-title').text().trim();
                const url = titleLink.attr('href') || '';
                const fullUrl = url.startsWith('http') ? url : `https://www.soccerxpert.com${url}`;
                // Extract image
                const image = $card.find('img.card-img-top').attr('src') || '';
                const fullImageUrl = image.startsWith('http') ? image : `https://www.soccerxpert.com${image}`;
                // Extract description
                const description = $cardBody.find('.card-text.sx-card-text').text().trim();
                // Extract metadata from table
                const metaTable = $cardBody.find('.sx-card-meta table tbody tr');
                let age = '';
                let fieldSize = '';
                let players = '';
                let focus = '';
                let difficulty = '';
                let duration = '';
                let goalkeeper = '';
                let type = '';
                metaTable.each((_, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    cells.each((_, cell) => {
                        const $cell = $(cell);
                        const text = $cell.text().trim();
                        if (text.includes('Age:')) {
                            age = text.replace('Age:', '').trim();
                        }
                        else if (text.includes('Field:')) {
                            fieldSize = text.replace('Field:', '').trim();
                        }
                        else if (text.includes('Players:')) {
                            players = text.replace('Players:', '').trim();
                        }
                        else if (text.includes('Focus:')) {
                            focus = text.replace('Focus:', '').trim();
                        }
                        else if (text.includes('Difficulty:')) {
                            difficulty = text.replace('Difficulty:', '').trim();
                        }
                        else if (text.includes('Time:')) {
                            duration = text.replace('Time:', '').trim();
                        }
                        else if (text.includes('Goalkeeper:')) {
                            goalkeeper = text.replace('Goalkeeper:', '').trim();
                        }
                        else if (text.includes('INDIVIDUAL') || text.includes('Team')) {
                            type = text.trim();
                        }
                    });
                });
                const drill = {
                    title,
                    url: fullUrl,
                    description,
                    image: fullImageUrl,
                    age,
                    fieldSize,
                    players,
                    focus,
                    difficulty,
                    duration,
                    goalkeeper,
                    type
                };
                allDrills.push(drill);
            });
            // Add a one second delay to be respectful to server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        catch (error) {
            console.error(`Error scraping page ${page}:`, error);
        }
    }
    // Transform to new structure
    const transformedDrills = (0, transformSoccerDrills_1.transformSoccerDrills)(allDrills);
    // Save transformed drills
    await (0, saveDataAsJson_1.saveSoccerDrills)(transformedDrills);
    return transformedDrills;
}

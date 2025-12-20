import * as cheerio from 'cheerio';
import * as fs from 'fs';
import path from "path";
import { saveSoccerDrills } from './scraper-save/saveDataAsJson';

const jsonPath = path.resolve(__dirname, "./scraped-json/soccerDrills.json");

export interface SoccerDrill {
    name: string;
    category: string;
    sport: string;
    focus: string;
    difficulty: string;
    description: string;
    details: {
        age: string;
        fieldSize: string;
        players: string;
        goalkeeper: string;
        type: string;
        duration: string;
    };
    durationMinutes: number;
}

function parseDurationMinutes(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

async function scrapeSoccerDrills(): Promise<SoccerDrill[]> {

    if (fs.existsSync(jsonPath)) {
        console.log("✅ Reading soccer drills from JSON...");
        const raw = fs.readFileSync(jsonPath, "utf-8");
        let drills = JSON.parse(raw) as SoccerDrill[];
        return drills;
    }

    const baseUrl = 'https://www.soccerxpert.com/drills/all-soccer-drills';
    const totalPages = 21;
    const allDrills: SoccerDrill[] = [];

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

                // Extract title
                const title = $cardBody.find('.sx-card-title').text().trim();

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
                        } else if (text.includes('Field:')) {
                            fieldSize = text.replace('Field:', '').trim();
                        } else if (text.includes('Players:')) {
                            players = text.replace('Players:', '').trim();
                        } else if (text.includes('Focus:')) {
                            focus = text.replace('Focus:', '').trim();
                        } else if (text.includes('Difficulty:')) {
                            difficulty = text.replace('Difficulty:', '').trim();
                        } else if (text.includes('Time:')) {
                            duration = text.replace('Time:', '').trim();
                        } else if (text.includes('Goalkeeper:')) {
                            goalkeeper = text.replace('Goalkeeper:', '').trim();
                        } else if (text.includes('INDIVIDUAL') || text.includes('Team')) {
                            type = text.trim();
                        }
                    });
                });

                const drill: SoccerDrill = {
                    name: title,
                    category: 'drill',
                    sport: 'soccer',
                    focus: focus.toLowerCase(),
                    difficulty: difficulty.toLowerCase(),
                    description,
                    details: {
                        age,
                        fieldSize,
                        players,
                        goalkeeper: goalkeeper.toLowerCase(),
                        type: type.toLowerCase(),
                        duration
                    },
                    durationMinutes: parseDurationMinutes(duration)
                };

                allDrills.push(drill);
            });

            // Add a one second delay to be respectful to server
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error scraping page ${page}:`, error);
        }
    }

    // Save drills
    await saveSoccerDrills(allDrills);

    return allDrills;
}

export { scrapeSoccerDrills };
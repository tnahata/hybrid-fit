import * as cheerio from 'cheerio';
import * as fs from 'fs';
import path from "path";
import { saveSoccerDrills } from './scraper-save/saveExrxDirectory';

const jsonPath = path.resolve(__dirname, "./scraped-json/soccerDrills.json");

interface SoccerDrill {
    title: string;
    url: string;
    description: string;
    image: string;
    age: string;
    fieldSize: string;
    players: string;
    focus: string;
    difficulty: string;
    duration: string;
    goalkeeper: string;
    type: string;
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

        } catch (error) {
            console.error(`Error scraping page ${page}:`, error);
        }
    }

    await saveSoccerDrills(allDrills);

    return allDrills;
}

export { scrapeSoccerDrills, SoccerDrill };
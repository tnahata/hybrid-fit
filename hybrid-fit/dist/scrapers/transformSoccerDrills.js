"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDrill = transformDrill;
exports.transformSoccerDrills = transformSoccerDrills;
function parseDurationMinutes(duration) {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}
function transformDrill(oldDrill) {
    return {
        name: oldDrill.title,
        category: 'drill',
        sport: 'soccer',
        focus: oldDrill.focus.toLowerCase(),
        difficulty: oldDrill.difficulty.toLowerCase(),
        description: oldDrill.description,
        details: {
            age: oldDrill.age,
            fieldSize: oldDrill.fieldSize,
            players: oldDrill.players,
            goalkeeper: oldDrill.goalkeeper.toLowerCase(),
            type: oldDrill.type.toLowerCase(),
            duration: oldDrill.duration,
        },
        durationMinutes: parseDurationMinutes(oldDrill.duration),
    };
}
function transformSoccerDrills(drills) {
    return drills.map(transformDrill);
}

// ============================================
// RETRO ARCADE TRIBUTE CATALOG
// ============================================

const ArcadeCatalog = {
    games: [
        {
            id: 'galaga',
            title: 'GALAGA',
            year: '1981',
            status: 'PLAY',
            color: '#00ffff',
            accent: '#ffff00',
            blurb: 'fixed shooter / formation dives'
        },
        {
            id: 'pacman',
            title: 'PAC-MAN',
            year: '1980',
            status: 'PLAY',
            color: '#ffd21f',
            accent: '#ff4ca3',
            blurb: 'maze chase / pellets / ghosts'
        },
        {
            id: 'mspacman',
            title: 'MS. PAC-MAN',
            year: '1982',
            status: 'PLAY',
            color: '#ff9ad5',
            accent: '#ffd21f',
            blurb: 'maze chase / bow / bonus fruit'
        },
        {
            id: 'digdug',
            title: 'DIG DUG',
            year: '1982',
            status: 'PLAY',
            color: '#ff74c8',
            accent: '#4ad7ff',
            blurb: 'dig tunnels / pump enemies'
        },
        {
            id: 'centipede',
            title: 'CENTIPEDE',
            year: '1981',
            status: 'PLAY',
            color: '#68ff4d',
            accent: '#ff4fd8',
            blurb: 'mushroom field / crawler swarm'
        }
    ],

    getSelected() {
        return this.games[GameState.selectedGameIndex] || this.games[0];
    },

    getById(gameId) {
        return this.games.find(game => game.id === gameId) || this.games[0];
    },

    selectNext() {
        GameState.selectedGameIndex = (GameState.selectedGameIndex + 1) % this.games.length;
    },

    selectPrevious() {
        GameState.selectedGameIndex = (GameState.selectedGameIndex - 1 + this.games.length) % this.games.length;
    },

    isPlayable(game) {
        return game && game.status === 'PLAY';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArcadeCatalog;
}

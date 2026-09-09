/* Norrortsligan – all innehållsdata på ett ställe.
 *
 * Lägg till en ny deltävling: skjut in ett objekt i season.rounds.
 * Lägg till ett tidigare år: skjut in ett objekt i pastSeasons (se formatet längst ned).
 * Totalställning, snitt, vinnare, marginaler och titelräkning beräknas automatiskt.
 */
window.NORRORTSLIGAN = {

  clubs: [
    { id: "waxholm",    name: "Waxholm GK",    location: "Vaxholm"    },
    { id: "osteraker",  name: "Österåkers GK", location: "Österåker"  },
    { id: "arninge",    name: "Arninge GK",    location: "Täby"       },
    { id: "akersberga", name: "Åkersberga GK", location: "Åkersberga" },
    { id: "taby",       name: "Täby GK",       location: "Täby"       }
  ],

  season: {
    year: "2026",
    rounds: [
      {
        no: 1,
        date: "12 juni",
        hostClubId: "waxholm",
        detail: "Slaggolf med HCP · tre klasser",
        status: "Spelad",
        played: true,
        teamPoints: [
          { clubId: "waxholm",    points: 27 },
          { clubId: "osteraker",  points: 12 },
          { clubId: "akersberga", points: 11 },
          { clubId: "taby",       points: 11 },
          { clubId: "arninge",    points: 10 }
        ]
      },
      {
        no: 2,
        date: "23 juni",
        hostClubId: "taby",
        detail: "Slaggolf med HCP · tre klasser",
        status: "Spelad",
        played: true,
        teamPoints: [
          { clubId: "osteraker",  points: 19 },
          { clubId: "akersberga", points: 15 },
          { clubId: "arninge",    points: 14 },
          { clubId: "waxholm",    points: 13 },
          { clubId: "taby",       points: 12 }
        ]
      },
      {
        no: 3,
        date: "1 juli",
        hostClubId: "akersberga",
        detail: "Slaggolf med HCP · tre klasser",
        status: "Spelad",
        played: true,
        teamPoints: [
          { clubId: "akersberga", points: 17 },
          { clubId: "arninge",    points: 15 },
          { clubId: "osteraker",  points: 14 },
          { clubId: "waxholm",    points: 10 },
          { clubId: "taby",       points: 7  }
        ]
      },
      {
        no: 4,
        date: "6 augusti",
        hostClubId: "arninge",
        detail: "Slaggolf med HCP · tre klasser",
        status: "Spelad",
        played: true,
        teamPoints: [
          { clubId: "taby",       points: 16 },
          { clubId: "arninge",    points: 15 },
          { clubId: "osteraker",  points: 14 },
          { clubId: "waxholm",    points: 11 },
          { clubId: "akersberga", points: 10 }
        ]
      },
      {
        no: 5,
        date: "14 augusti",
        hostClubId: "osteraker",
        detail: "Finalomgång · vinnaren korades",
        status: "Final",
        played: true,
        isFinal: true,
        teamPoints: [
          { clubId: "taby",       points: 17 },
          { clubId: "waxholm",    points: 16 },
          { clubId: "osteraker",  points: 15 },
          { clubId: "arninge",    points: 13 },
          { clubId: "akersberga", points: 12 }
        ]
      }
    ]
  },

  /* Tidigare säsonger – nyast först. Två format går bra:
   *
   * 1. Bara vinnaren (när slutställningen inte finns bevarad):
   *
   *      { year: "2025", winnerClubId: "osteraker" }
   *
   *    Året syns i historiken och räknas i titelstatistiken, men raden går
   *    inte att fälla ut – den märks "Slutställning saknas".
   *
   * 2. Hela slutställningen:
   *
   *      {
   *        year: "2025",
   *        finalHostClubId: "taby",
   *        table: [
   *          { clubId: "osteraker", points: 71 },
   *          { clubId: "taby",      points: 68 }
   *          // ... resten av klubbarna
   *        ]
   *      }
   *
   *    Då blir raden utfällbar med tabell, tvåa och marginal. Kompletteras
   *    ett år från format 1 till format 2 behöver inget annat ändras.
   */
  pastSeasons: [
    { year: "2025", winnerClubId: "osteraker" },
    { year: "2024", winnerClubId: "arninge"   },
    { year: "2023", winnerClubId: "taby"      },
    { year: "2022", winnerClubId: "arninge"   },
    { year: "2021", winnerClubId: "taby"      }
  ]
};

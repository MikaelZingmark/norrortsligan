/* Norrortsligan – render + dragspelslogik. All data ligger i data.js. */
(function () {
  "use strict";

  var DATA = window.NORRORTSLIGAN;
  var CLUBS = {};
  DATA.clubs.forEach(function (c) { CLUBS[c.id] = c; });

  function clubName(id) { return (CLUBS[id] && CLUBS[id].name) || id; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Svenskt decimalkomma, en decimal. */
  function avg(points, played) {
    if (!played) return "–";
    return (points / played).toFixed(1).replace(".", ",");
  }

  /* Placeringar med delade placeringar vid lika poäng (1, 2, 3, 3, 5). */
  function withPositions(rows) {
    var sorted = rows.slice().sort(function (a, b) { return b.points - a.points; });
    var pos = 0, prev = null;
    return sorted.map(function (r, i) {
      if (prev === null || r.points !== prev) { pos = i + 1; prev = r.points; }
      return { clubId: r.clubId, points: r.points, pos: pos };
    });
  }

  function playedRounds(season) {
    return season.rounds.filter(function (r) { return r.played; });
  }

  /* Totalställning summerad ur deltävlingarnas lagpoäng. */
  function standings(season) {
    var done = playedRounds(season);
    var totals = {};
    DATA.clubs.forEach(function (c) { totals[c.id] = 0; });
    done.forEach(function (r) {
      r.teamPoints.forEach(function (p) {
        totals[p.clubId] = (totals[p.clubId] || 0) + p.points;
      });
    });
    var rows = Object.keys(totals).map(function (id) {
      return { clubId: id, points: totals[id] };
    });
    return withPositions(rows).map(function (r) {
      return {
        pos: r.pos,
        clubId: r.clubId,
        name: clubName(r.clubId),
        points: r.points,
        played: done.length,
        avg: avg(r.points, done.length)
      };
    });
  }

  function seasonComplete(season) {
    return season.rounds.length > 0 && playedRounds(season).length === season.rounds.length;
  }

  /* Avgjorda säsonger, nyast först: innevarande år räknas med när alla
   * omgångar är spelade, så mästarkortet stämmer redan säsongen den avgörs. */
  function completedSeasons() {
    /* En säsong kan vara känd i två grader: hela slutställningen, eller
     * bara vinnaren (äldre år där tabellen inte finns bevarad). */
    var list = (DATA.pastSeasons || []).map(function (s) {
      var table = s.table ? withPositions(s.table) : [];
      return {
        year: String(s.year),
        finalHostClubId: s.finalHostClubId || null,
        winnerClubId: s.winnerClubId || (table[0] && table[0].clubId) || null,
        table: table
      };
    });
    if (seasonComplete(DATA.season)) {
      var last = DATA.season.rounds[DATA.season.rounds.length - 1];
      var table = withPositions(standings(DATA.season).map(function (r) {
        return { clubId: r.clubId, points: r.points };
      }));
      list.push({
        year: String(DATA.season.year),
        finalHostClubId: last ? last.hostClubId : null,
        winnerClubId: table[0] ? table[0].clubId : null,
        table: table
      });
    }
    return list.sort(function (a, b) { return Number(b.year) - Number(a.year); });
  }

  /* -- Rader som återanvänds i både omgångs- och historikpanelerna ----- */
  function rankRows(rows) {
    return rows.map(function (r) {
      return '<li class="rank-row">' +
        '<span class="rank-pos">' + esc(r.pos) + "</span>" +
        '<span class="rank-club">' + esc(clubName(r.clubId)) + "</span>" +
        '<span class="rank-points">' + esc(r.points) + " p</span>" +
        "</li>";
    }).join("");
  }

  function scheduleRows(rows) {
    return rows.map(function (r) {
      return '<li class="rank-row">' +
        '<span class="rank-pos" aria-hidden="true">·</span>' +
        '<span class="rank-club">' + esc(r.label) + "</span>" +
        '<span class="rank-points">' + esc(r.value) + "</span>" +
        "</li>";
    }).join("");
  }

  function noteRows(rows) {
    return rows.map(function (n) {
      return '<li class="note-row">' +
        '<div class="note-head"><span class="note-title">' + esc(n.title) + "</span>" +
        '<span class="note-value">' + esc(n.value) + "</span></div>" +
        (n.sub ? '<div class="note-sub">' + esc(n.sub) + "</div>" : "") +
        "</li>";
    }).join("");
  }

  /* -- Hero ------------------------------------------------------------ */
  function renderHero() {
    var season = DATA.season;
    var done = playedRounds(season);
    var next = season.rounds.filter(function (r) { return !r.played; })[0];

    Array.prototype.forEach.call(document.querySelectorAll("[data-season]"), function (el) {
      el.textContent = season.year;
    });

    var stats = [
      { value: String(DATA.clubs.length), label: "Klubbar" },
      { value: "10", label: "Spelare per lag" },
      { value: "3", label: "HCP-klasser" }
    ];
    if (next) {
      stats.push({ value: next.date, label: "Nästa omgång", gold: true });
    } else {
      var top = standings(season)[0];
      stats.push({
        value: top ? top.name : "–",
        label: "Vinnare " + season.year,
        gold: true,
        isName: true
      });
    }

    document.getElementById("hero-stats").innerHTML = stats.map(function (s) {
      return '<div class="stat">' +
        '<div class="stat-value' + (s.gold ? " is-gold" : "") + (s.isName ? " is-name" : "") + '">' +
          esc(s.value) + "</div>" +
        '<div class="stat-label">' + esc(s.label) + "</div>" +
        "</div>";
    }).join("");

    document.getElementById("standings-meta").textContent =
      "Efter " + done.length + " av " + season.rounds.length + " deltävlingar";
  }

  /* -- Totalställning -------------------------------------------------- */
  function renderStandings() {
    var rows = standings(DATA.season);
    var max = rows.reduce(function (m, r) { return Math.max(m, r.points); }, 0) || 1;

    document.getElementById("standings-body").innerHTML = rows.map(function (r) {
      return "<tr>" +
        '<td class="cell-pos">' + esc(r.pos) + "</td>" +
        '<td class="cell-club">' +
          '<div class="club-line"><span class="club-name">' + esc(r.name) + "</span></div>" +
          '<div class="bar"><div class="bar-fill" style="width:' +
            Math.round((r.points / max) * 100) + '%"></div></div>' +
        "</td>" +
        '<td class="cell-num col-played">' + esc(r.played) + "</td>" +
        '<td class="cell-num col-avg">' + esc(r.avg) + "</td>" +
        '<td class="cell-points">' + esc(r.points) + "</td>" +
        "</tr>";
    }).join("");
  }

  /* -- Deltävlingar ---------------------------------------------------- */
  function statusClass(round) {
    if (round.status === "Final") return "is-final";
    if (round.played) return "is-played";
    return "is-upcoming";
  }

  function renderRounds() {
    var html = DATA.season.rounds.map(function (r, i) {
      var id = "round-panel-" + i;
      var results = r.played
        ? rankRows(withPositions(r.teamPoints))
        : scheduleRows(r.schedule || []);
      var leftLabel = r.played ? "Lagpoäng i omgången" : "Tidsplan";
      var rightLabel = r.played ? "Klassvinnare" : "Om omgången";
      var notes = r.notes && r.notes.length ? r.notes : null;

      return '<div class="acc-item">' +
        '<h3 class="acc-heading">' +
          '<button type="button" class="acc-head round-head" aria-expanded="false" aria-controls="' + id + '">' +
            '<span class="round-no" aria-hidden="true">' + esc(r.no) + "</span>" +
            '<span class="round-date">' + esc(r.date) + "</span>" +
            '<span class="round-club">' +
              '<span class="round-club-name">' + esc(clubName(r.hostClubId)) + "</span>" +
              '<span class="round-detail">' + esc(r.detail || "") + "</span>" +
            "</span>" +
            '<span class="round-status"><span class="pill ' + statusClass(r) + '">' +
              esc(r.status) + "</span></span>" +
            '<span class="caret" aria-hidden="true">+</span>' +
          "</button>" +
        "</h3>" +
        '<div class="acc-panel" id="' + id + '" hidden>' +
          '<div class="panel-grid">' +
            "<div>" +
              '<p class="col-label">' + esc(leftLabel) + "</p>" +
              '<ul class="rank-list">' + results + "</ul>" +
            "</div>" +
            (notes
              ? "<div>" +
                  '<p class="col-label">' + esc(rightLabel) + "</p>" +
                  '<ul class="note-list">' + noteRows(notes) + "</ul>" +
                "</div>"
              : "") +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");

    document.getElementById("rounds").innerHTML = html;
  }

  /* -- Historik -------------------------------------------------------- */
  function renderHistory() {
    var seasons = completedSeasons();

    if (!seasons.length) {
      document.getElementById("history-cards").innerHTML = "";
      document.getElementById("history-years").innerHTML =
        '<p class="empty-note">Historiken publiceras när resultaten från tidigare säsonger är inlagda.</p>';
      return;
    }

    /* Mästarkort: senast avgjorda säsongen. Poäng, tvåa och marginal visas
     * bara för år där slutställningen finns. */
    var champ = seasons[0];
    var winner = champ.table[0];
    var runnerUp = champ.table[1];
    var margin = winner && runnerUp ? winner.points - runnerUp.points : null;
    var host = champ.finalHostClubId ? clubName(champ.finalHostClubId) : null;

    var note = "";
    if (host && runnerUp) {
      note = "Avgjordes i finalomgången på " + host + " – " + margin + " poäng före " +
        (champ.finalHostClubId === runnerUp.clubId ? "hemmaklubben" : clubName(runnerUp.clubId)) + ".";
    } else if (host) {
      note = "Avgjordes i finalomgången på " + host + ".";
    } else if (runnerUp) {
      note = margin + " poäng före " + clubName(runnerUp.clubId) + ".";
    }

    /* Titlar, flest först. */
    var counts = {};
    seasons.forEach(function (s) {
      if (s.winnerClubId) counts[s.winnerClubId] = (counts[s.winnerClubId] || 0) + 1;
    });
    var titles = Object.keys(counts)
      .map(function (id) { return { clubId: id, n: counts[id] }; })
      .sort(function (a, b) {
        return b.n - a.n || clubName(a.clubId).localeCompare(clubName(b.clubId), "sv");
      });

    document.getElementById("history-cards").innerHTML =
      '<div class="champion-card">' +
        '<span class="eyebrow eyebrow-gold">Regerande mästare</span>' +
        '<span class="champion-club">' + esc(clubName(champ.winnerClubId)) + "</span>" +
        '<span class="champion-line">Vann säsongen ' + esc(champ.year) +
          (winner ? " med " + esc(winner.points) + " poäng" : "") + "</span>" +
        (note ? '<span class="champion-note">' + esc(note) + "</span>" : "") +
      "</div>" +
      '<div class="titles-card">' +
        '<span class="eyebrow eyebrow-dark">Flest titlar</span>' +
        '<ul class="titles-list">' +
          titles.map(function (t) {
            return '<li class="titles-row"><span class="titles-club">' + esc(clubName(t.clubId)) +
              '</span><span class="titles-count">' + (t.n === 1 ? "1 titel" : t.n + " titlar") +
              "</span></li>";
          }).join("") +
        "</ul>" +
      "</div>";

    document.getElementById("history-years").innerHTML = seasons.map(function (s, i) {
      var id = "history-panel-" + i;
      var w = s.table[0];
      var up = s.table[1];

      /* År utan bevarad slutställning: raden visas men går inte att fälla ut. */
      if (!w) {
        return '<div class="acc-item">' +
          '<div class="acc-head year-head is-static">' +
            '<span class="year-no">' + esc(s.year) + "</span>" +
            '<span class="year-winner">' +
              '<span class="year-winner-name">' + esc(clubName(s.winnerClubId)) + "</span>" +
            "</span>" +
            '<span class="year-margin">Slutställning saknas</span>' +
            '<span class="caret" aria-hidden="true"></span>' +
          "</div>" +
        "</div>";
      }

      var diff = up ? w.points - up.points : null;
      var detail = up
        ? "Tvåa: " + clubName(up.clubId) + " · " + w.points + " poäng totalt"
        : w.points + " poäng totalt";
      return '<div class="acc-item">' +
        '<h3 class="acc-heading">' +
          '<button type="button" class="acc-head year-head" aria-expanded="false" aria-controls="' + id + '">' +
            '<span class="year-no">' + esc(s.year) + "</span>" +
            '<span class="year-winner">' +
              '<span class="year-winner-name">' + esc(clubName(w.clubId)) + "</span>" +
              '<span class="year-detail">' + esc(detail) + "</span>" +
            "</span>" +
            '<span class="year-margin">' + (diff === null ? "" : esc(diff) + " p marginal") + "</span>" +
            '<span class="caret" aria-hidden="true">+</span>' +
          "</button>" +
        "</h3>" +
        '<div class="acc-panel" id="' + id + '" hidden>' +
          '<div class="panel-narrow">' +
            '<p class="col-label">Slutställning ' + esc(s.year) + "</p>" +
            '<ul class="rank-list">' + rankRows(s.table) + "</ul>" +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");
  }

  /* -- Klubbar --------------------------------------------------------- */
  function renderClubs() {
    var rounds = DATA.season.rounds;

    function roleFor(clubId) {
      var hosted = rounds.filter(function (r) { return r.hostClubId === clubId; });
      if (!hosted.length) return "Deltagande klubb";
      var r = hosted[0];
      return r.isFinal ? "Värd finalen" : "Värd omg. " + r.no;
    }

    /* Kortordning följer omgångsordningen, resterande klubbar sist. */
    var ordered = [];
    rounds.forEach(function (r) {
      if (CLUBS[r.hostClubId] && ordered.indexOf(r.hostClubId) < 0) ordered.push(r.hostClubId);
    });
    DATA.clubs.forEach(function (c) { if (ordered.indexOf(c.id) < 0) ordered.push(c.id); });

    document.getElementById("clubs").innerHTML = ordered.map(function (id) {
      var c = CLUBS[id];
      return '<div class="club-card">' +
        '<span class="club-tag">' + esc(roleFor(id)) + "</span>" +
        '<span class="club-card-name">' + esc(c.name) + "</span>" +
        '<span class="club-loc">' + esc(c.location || "") + "</span>" +
      "</div>";
    }).join("");
  }

  /* -- Dragspel: ett öppet i taget, per container ----------------------- */
  function wireAccordion(container) {
    container.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".acc-head") : null;
      if (!btn || !container.contains(btn)) return;
      var open = btn.getAttribute("aria-expanded") === "true";

      Array.prototype.forEach.call(
        container.querySelectorAll('.acc-head[aria-expanded="true"]'),
        function (b) {
          b.setAttribute("aria-expanded", "false");
          b.querySelector(".caret").textContent = "+";
          document.getElementById(b.getAttribute("aria-controls")).hidden = true;
        }
      );

      if (!open) {
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".caret").textContent = "–";
        document.getElementById(btn.getAttribute("aria-controls")).hidden = false;
      }
    });
  }

  function init() {
    renderHero();
    renderStandings();
    renderRounds();
    renderHistory();
    renderClubs();
    wireAccordion(document.getElementById("rounds"));
    wireAccordion(document.getElementById("history-years"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Dated practice quizzes. Grading and answers stay entirely in this browser. */
(function (root) {
  "use strict";
  var domains = {reading: "Danmark", current_affairs: "Aktuelle begivenheder", values: "Værdier / samfund"};
  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function validate(quiz) {
    if (!quiz || quiz.schema_version !== 1 || !validDate(quiz.date) ||
        quiz.timezone !== "Europe/Copenhagen" || quiz.official !== false ||
        !/^[a-f0-9]{64}$/.test(quiz.bank_sha256) || !/^[a-f0-9]{64}$/.test(quiz.snapshot_sha256) ||
        !Array.isArray(quiz.questions) || ![10, 20].includes(quiz.questions.length)) throw Error("Ugyldig quiz.");
    var ids = new Set();
    quiz.questions.forEach(function (q) {
      var keys = q.options && Object.keys(q.options).join("");
      if (typeof q.id !== "string" || ids.has(q.id) || !["AB", "ABC"].includes(keys) ||
          !Object.hasOwn(q.options, q.answer) || !Object.hasOwn(domains, q.exam_domain) ||
          !q.question || !q.explanation || !Array.isArray(q.source_pages)) throw Error("Ugyldigt spørgsmål.");
      var url = new URL(q.source_url);
      if (url.protocol !== "https:" || url.username || url.password) throw Error("Ugyldig kilde.");
      ids.add(q.id);
    });
    return quiz;
  }
  function grade(quiz, answers) {
    validate(quiz);
    var total = quiz.questions.length;
    if (!answers || Object.keys(answers).length !== total) throw Error("Besvar alle " + total + " spørgsmål først.");
    var result = {score: 0, total: total, domains: {}, items: []};
    quiz.questions.forEach(function (q) {
      if (!Object.hasOwn(answers, q.id) || !Object.hasOwn(q.options, answers[q.id])) {
        throw Error("Vælg en gyldig svarmulighed til hvert spørgsmål.");
      }
      var correct = answers[q.id] === q.answer;
      result.score += Number(correct);
      var subtotal = result.domains[q.exam_domain] || {correct: 0, total: 0};
      subtotal.correct += Number(correct); subtotal.total++;
      result.domains[q.exam_domain] = subtotal;
      result.items.push({id: q.id, given: answers[q.id], correct: correct});
    });
    return result;
  }
  function sourceLink(q) {
    var url = new URL(q.source_url);
    if (q.source_pages.length) url.hash = "page=" + q.source_pages[0];
    return url.href;
  }
  function answerText(quiz, answers) {
    grade(quiz, answers);
    return quiz.date + "\n" + quiz.questions.map(function (q, i) {
      return (i + 1) + answers[q.id];
    }).join(", ");
  }
  function restore(quiz, saved) {
    var state = {answers: {}, submitted: false};
    if (!saved || saved.snapshot_sha256 !== quiz.snapshot_sha256 || !saved.answers) return state;
    quiz.questions.forEach(function (q) {
      if (Object.hasOwn(saved.answers, q.id) && Object.hasOwn(q.options, saved.answers[q.id])) {
        state.answers[q.id] = saved.answers[q.id];
      }
    });
    state.submitted = saved.submitted === true && Object.keys(state.answers).length === quiz.questions.length;
    return state;
  }
  var api = {validDate: validDate, validate: validate, grade: grade, sourceLink: sourceLink,
    answerText: answerText, restore: restore};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DailyQuiz = api;
  if (typeof document === "undefined") return;

  var quiz, state, storageKey, cards = [];
  var form = document.getElementById("daily-form");
  var errorBox = document.getElementById("daily-error");
  var resultBox = document.getElementById("daily-result");
  var select = document.getElementById("daily-select");
  function node(tag, text, className) {
    var element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat("da-DK", {day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Copenhagen"})
      .format(new Date(value + "T12:00:00Z"));
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        snapshot_sha256: quiz.snapshot_sha256, answers: state.answers, submitted: state.submitted
      }));
    } catch (_) { document.getElementById("daily-storage").hidden = false; }
  }
  function progress() {
    var count = Object.keys(state.answers).length;
    document.getElementById("daily-progress-text").textContent = count + " af " + quiz.questions.length + " besvaret";
    document.getElementById("daily-progress-bar").max = quiz.questions.length;
    document.getElementById("daily-progress-bar").value = count;
  }
  function renderQuestions() {
    var list = document.getElementById("daily-questions");
    list.replaceChildren(); cards = [];
    quiz.questions.forEach(function (q, i) {
      var card = node("fieldset", undefined, "daily-question");
      card.id = "daily-question-" + (i + 1);
      var legend = node("legend");
      legend.append(node("span", "Spørgsmål " + (i + 1) + " af " + quiz.questions.length), document.createTextNode(q.question));
      card.append(legend);
      var options = node("div", undefined, "daily-options");
      Object.entries(q.options).forEach(function (entry) {
        var letter = entry[0], text = entry[1];
        var label = node("label", undefined, "daily-option");
        var input = document.createElement("input");
        input.type = "radio"; input.name = "question-" + i; input.value = letter;
        input.checked = state.answers[q.id] === letter;
        input.addEventListener("change", function () {
          if (state.submitted) return;
          state.answers[q.id] = letter;
          card.classList.remove("needs-answer");
          errorBox.hidden = true;
          save(); progress();
        });
        var optionText = node("span");
        optionText.append(node("b", letter + ". "), document.createTextNode(text));
        label.append(input, optionText); options.append(label);
      });
      card.append(options); list.append(card); cards.push(card);
    });
    progress();
  }
  function renderResult() {
    var result = grade(quiz, state.answers);
    resultBox.replaceChildren(node("h2", "Dit resultat"), node("p", result.score + " af " + result.total + " rigtige", "daily-score"));
    var sub = node("div", undefined, "daily-subscores");
    Object.entries(domains).forEach(function (entry) {
      var counts = result.domains[entry[0]];
      if (counts) {
        var item = node("span", entry[1]);
        item.append(node("strong", counts.correct + " / " + counts.total)); sub.append(item);
      }
    });
    resultBox.append(sub, node("p", "Gennemgå forklaringerne nedenfor. Dette er daglig træning, ikke et officielt bestået/ikke-bestået-resultat.", "small"));
    resultBox.append(node("p", "Nyhedsspørgsmålene bygger på bankens dækning til " + formatDate(quiz.news_verified_at) + ".", "small muted"));
    var retry = node("button", "Prøv quizzen igen", "button secondary");
    retry.type = "button";
    var confirm = node("div");
    confirm.hidden = true;
    confirm.append(node("p", "Start forfra med de samme spørgsmål? Gem eventuelt dine svar først.", "small"));
    var yes = node("button", "Start forfra", "button secondary");
    var no = node("button", "Behold resultat", "button secondary");
    yes.type = no.type = "button";
    confirm.append(yes, document.createTextNode(" "), no);
    retry.addEventListener("click", function () { confirm.hidden = false; retry.hidden = true; yes.focus(); });
    no.addEventListener("click", function () { confirm.hidden = true; retry.hidden = false; retry.focus(); });
    yes.addEventListener("click", function () {
      state = {answers: {}, submitted: false}; save();
      resultBox.hidden = true; errorBox.hidden = true;
      document.getElementById("daily-submit").hidden = false;
      document.getElementById("daily-submit-bottom").hidden = false;
      document.getElementById("daily-result-link").hidden = true;
      renderQuestions(); cards[0].querySelector("input").focus();
    });
    resultBox.append(retry, confirm);
    var details = node("details");
    details.append(node("summary", "Gem eller del dine svar"));
    details.append(node("p", "Vil du også have resultatet registreret i studiechatten? Kopiér datoen og svarene nedenfor og send dem i chatten. Der deles intet automatisk."));
    var text = node("textarea"); text.readOnly = true;
    text.setAttribute("aria-label", "Dato og svar til chatten");
    text.value = answerText(quiz, state.answers); details.append(text);
    var download = node("button", "Gem svar som fil", "button secondary");
    download.type = "button";
    download.addEventListener("click", function () {
      var data = {date: quiz.date, bank_sha256: quiz.bank_sha256, snapshot_sha256: quiz.snapshot_sha256,
        answers: state.answers, score: result.score, total: result.total};
      var url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}));
      var link = node("a");
      link.href = url; link.download = "mine-svar-" + quiz.date + ".json";
      document.body.append(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    details.append(download); resultBox.append(details);
    quiz.questions.forEach(function (q, i) {
      var card = cards[i], correct = result.items[i].correct;
      card.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
      var feedback = node("div", undefined, "daily-feedback" + (correct ? "" : " incorrect"));
      feedback.append(node("p", correct ? "✓ Rigtigt" : "✕ Dit svar: " + state.answers[q.id] + ". " + q.options[state.answers[q.id]], "feedback-status"));
      feedback.append(node("p", "Rigtigt svar: " + q.answer + ". " + q.options[q.answer]));
      feedback.append(node("p", q.explanation));
      var source = node("p", undefined, "daily-source"), link = node("a");
      link.href = sourceLink(q); link.target = "_blank"; link.rel = "noopener";
      link.textContent = q.source_pages.length ? "Læremateriale · side " + q.source_pages.join(", ") : (q.source_title || "Læs kilden");
      source.append(link);
      if (q.event_date) source.append(document.createTextNode(" · " + q.event_date));
      feedback.append(source); card.append(feedback);
    });
    document.getElementById("daily-submit").hidden = true;
    document.getElementById("daily-submit-bottom").hidden = true;
    document.getElementById("daily-result-link").hidden = false;
    resultBox.hidden = false;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!quiz || state.submitted) return;
    var missing = quiz.questions.map(function (q, i) { return state.answers[q.id] ? -1 : i; }).filter(function (i) { return i >= 0; });
    if (missing.length) {
      errorBox.textContent = "Du mangler at besvare " + missing.length + " spørgsmål. Vælg et svar til alle " + quiz.questions.length + ", før du afleverer.";
      errorBox.hidden = false;
      missing.forEach(function (i) { cards[i].classList.add("needs-answer"); });
      cards[missing[0]].querySelector("input").focus();
      return;
    }
    state.submitted = true; save(); errorBox.hidden = true; renderResult(); resultBox.focus();
  });
  select.addEventListener("change", function () { location.href = "daily-quiz.html?date=" + encodeURIComponent(select.value); });
  async function read(url, cache) {
    var response = await fetch(url, {cache: cache || "default"});
    if (!response.ok) throw Error("Quizzen kunne ikke hentes. Prøv igen om lidt.");
    return response.json();
  }
  async function start() {
    try {
      var index = await read("daily-quizzes/index.json", "no-cache");
      var requested = new URLSearchParams(location.search).get("date") || index.latest;
      if (!validDate(requested) || !index.quizzes.some(function (q) { return q.date === requested; })) {
        throw Error("Der er endnu ikke udgivet en quiz til denne dato. Åbn Daglig quiz uden en dato for at se den seneste.");
      }
      select.replaceChildren();
      index.quizzes.forEach(function (entry) {
        var option = node("option", formatDate(entry.date)); option.value = entry.date;
        option.selected = entry.date === requested; select.append(option);
      });
      select.disabled = false;
      var entry = index.quizzes.find(function (q) { return q.date === requested; });
      quiz = validate(await read("daily-quizzes/" + requested + ".json?v=" + entry.snapshot_sha256.slice(0, 12)));
      if (quiz.date !== requested || quiz.snapshot_sha256 !== entry.snapshot_sha256) throw Error("Quizversionerne stemmer ikke overens. Genindlæs siden.");
      storageKey = "proveklar-daily-v1-" + quiz.date + "-" + quiz.snapshot_sha256;
      var stored;
      try { stored = JSON.parse(localStorage.getItem(storageKey)); }
      catch (_) { document.getElementById("daily-storage").hidden = false; }
      state = restore(quiz, stored);
      document.getElementById("daily-count").textContent = quiz.questions.length + " spørgsmål.";
      document.getElementById("daily-date").textContent = formatDate(quiz.date) + " · " + quiz.questions.length + " spørgsmål";
      document.title = "Daglig quiz · " + formatDate(quiz.date) + " – Prøveklar";
      renderQuestions(); form.hidden = false;
      if (state.submitted) renderResult();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      document.getElementById("daily-date").textContent = "Quizzen kunne ikke åbnes";
    }
  }
  start();
})(globalThis);
